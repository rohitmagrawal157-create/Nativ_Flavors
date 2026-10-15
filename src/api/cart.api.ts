import { API_BASE_URL } from '@/lib/env'
// src/api/cart.api.ts
// ══════════════════════════════════════════════════════════════════════
//  COMPLETE REWRITE — mapped to EXACT API shapes confirmed from Postman
//
//  ── CONFIRMED API SHAPES ──────────────────────────────────────────
//
//  POST /api/cart   { product_id, variant_id?, quantity }
//  GET  /api/cart
//  Both return:
//    { status, message?, data: [{
//        cart_id, product_name, variant_id,
//        product_image, product_details, product_features,
//        price, quantity, subtotal
//    }] }
//    → FLAT structure. No nested product object.
//    → cart_id is the cart row id AND the identifier for update/delete.
//    → product_id is NOT returned here — addToCart must store it.
//
//  PUT  /api/cart/:cart_id   { quantity }
//  DELETE /api/cart/:cart_id
//  Both return same data[] shape as GET.
//
//  GET /api/checkout  (Bearer + Session-Id)
//  Returns: { status, data: [{
//      cart_id, quantity, price,
//      product: { product_id, name, image }
//  }] }
//    → data is TOP-LEVEL key (not cart_items).
//    → product is NESTED with product_id, name, image.
//
//  ── SESSION-ID HEADER ─────────────────────────────────────────────
//  The API accepts the session-id header in multiple casings:
//    Session-Id, session-id, SessionId, x-session-id
//  We send all variants so it works regardless of Laravel middleware.
// ══════════════════════════════════════════════════════════════════════

import { apiClient } from './client'
import type { Product } from './products'

// ─────────────────────────────────────────────────────────────────────────────
// Public Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CartLine {
  id:            number    // cart_id from API — used for update/delete
  productId:     number    // actual product id (from addToCart cache or checkout)
  product:       Product
  quantity:      number
  subtotal:      number    // price × quantity from API
  variantId?:    number
  variantMeta?:  { size?: string; color?: string }
}

export interface CartState {
  lines: CartLine[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY       = 'cart_items_v3'          // qty map  { productId: qty }
const CART_LINE_KEY     = 'cart_lines_v3'           // full lines cache
const PRODUCT_CACHE_KEY = 'cart_product_cache_v3'  // product details by id
const SID_KEY           = 'SessionId'              // primary session key
const SID_LEGACY        = 'session-id'             // legacy session key

// ─────────────────────────────────────────────────────────────────────────────
// Session ID helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateSid(): string {
  try {
    if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID()
    const b = new Uint8Array(16)
    crypto.getRandomValues(b)
    return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')
  } catch {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`
  }
}

export function getOrCreateSessionId(): string {
  const stored = localStorage.getItem(SID_KEY) || localStorage.getItem(SID_LEGACY)
  if (stored?.trim()) return stored.trim()
  const env = process.env.NEXT_PUBLIC_CART_SESSION_ID as string | undefined
  if (env?.trim()) return env.trim()
  const sid = generateSid()
  localStorage.setItem(SID_KEY, sid)
  localStorage.setItem(SID_LEGACY, sid)
  return sid
}

export function setCartSessionId(sid: string): void {
  const s = String(sid ?? '').trim()
  if (!s) return
  localStorage.setItem(SID_KEY, s)
  localStorage.setItem(SID_LEGACY, s)
}

export function rotateCartSession(): string {
  const sid = generateSid()
  setCartSessionId(sid)
  storageWrite({})
  linesWrite([])
  notifyCartChanged()
  return sid
}

export function clearGuestSession(): void {
  localStorage.removeItem(SID_KEY)
  localStorage.removeItem(SID_LEGACY)
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(CART_LINE_KEY)
}

// function isAuthenticated(): boolean {
//   return Boolean(localStorage.getItem('access_token')?.trim())
// }

// ─────────────────────────────────────────────────────────────────────────────
// Headers — sent with every cart request
// All session-id casing variants so Laravel middleware always finds it.
// ─────────────────────────────────────────────────────────────────────────────

function cartHeaders(): Record<string, string> {
  const sid   = getOrCreateSessionId()
  const token = localStorage.getItem('access_token')?.trim()
  return {
    'Accept':         'application/json',
    'Content-Type':   'application/json',
    'Session-Id':     sid,   // Laravel CamelCase variant
    'session-id':     sid,   // lowercase
    'x-session-id':   sid,   // x- prefix variant
    'SessionId':      sid,   // no-hyphen variant
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Money helpers
// ─────────────────────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  const n = typeof v === 'number'
    ? v
    : parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function fmtINR(v: unknown): string {
  const n = toNum(v)
  return n <= 0 ? '₹0' : '₹' + n.toLocaleString('en-IN')
}

function normalizeImage(raw: unknown): string {
  if (!raw) return ''
  let s = String(raw).replace(/\\/g, '').trim().replace(/^"|"$/g, '')
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  if (/^\/\//.test(s)) return window.location.protocol + s
  const base = (API_BASE_URL as string ?? '')
    .trim().replace(/\/$/, '') || window.location.origin.replace(/\/$/, '')
  return `${base}/${s.replace(/^\//, '')}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Product cache — stores product details indexed by product_id
// Used to enrich cart lines returned by GET /api/cart (which don't include product_id)
// ─────────────────────────────────────────────────────────────────────────────

type CachedProduct = Pick<Product, 'id' | 'name' | 'image' | 'price' | 'tag' | 'rating'>

function pcRead(): Record<string, CachedProduct> {
  try { return JSON.parse(localStorage.getItem(PRODUCT_CACHE_KEY) ?? '{}') ?? {} }
  catch { return {} }
}

function pcWrite(id: number, p: Partial<CachedProduct>): void {
  try {
    const cache = pcRead()
    const prev  = cache[id] ?? {}
    cache[id]   = {
      id,
      name:   p.name   ?? prev.name   ?? `Product #${id}`,
      image:  p.image  ?? prev.image  ?? '',
      price:  p.price  ?? prev.price  ?? '₹0',
      tag:    p.tag    ?? prev.tag    ?? '',
      rating: p.rating ?? prev.rating ?? 4,
    }
    localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(cache))
  } catch { /* quota — non-fatal */ }
}

function pcGet(id: number): CachedProduct | null {
  return pcRead()[id] ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart-to-product mapping — stores { cart_id → product_id }
// Because GET /api/cart returns cart_id but NOT product_id,
// we store the mapping when addToCart is called.
// ─────────────────────────────────────────────────────────────────────────────

const CART_MAP_KEY = 'cart_id_map_v3'  // { cart_id: product_id }

function mapRead(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(CART_MAP_KEY) ?? '{}') ?? {} }
  catch { return {} }
}

function mapWrite(cartId: number, productId: number): void {
  try {
    const m = mapRead()
    m[cartId] = productId
    localStorage.setItem(CART_MAP_KEY, JSON.stringify(m))
  } catch {}
}

function mapGet(cartId: number): number | null {
  return mapRead()[cartId] ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage cart lines cache
// ─────────────────────────────────────────────────────────────────────────────

function storageWrite(qtyMap: Record<string, number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(qtyMap))
}

function linesRead(): CartLine[] {
  try { return JSON.parse(localStorage.getItem(CART_LINE_KEY) ?? '[]') ?? [] }
  catch { return [] }
}

function linesWrite(lines: CartLine[]): void {
  try { localStorage.setItem(CART_LINE_KEY, JSON.stringify(lines)) }
  catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// notifyCartChanged — dispatches event so navbar badge updates instantly
// ─────────────────────────────────────────────────────────────────────────────

export function notifyCartChanged(): void {
  window.dispatchEvent(new CustomEvent('cart:changed'))
}

// ─────────────────────────────────────────────────────────────────────────────
// getCartCountSync — reads localStorage for instant badge (no async)
// ─────────────────────────────────────────────────────────────────────────────

export function getCartCountSync(): number {
  try {
    const lines = linesRead()
    return lines.reduce((s, l) => s + (l.quantity || 0), 0)
  } catch { return 0 }
}

// ─────────────────────────────────────────────────────────────────────────────
//  normaliseFlatItem — for GET /api/cart and POST /api/cart
// ─────────────────────────────────────────────────────────────────────────────

interface FlatCartItem {
  cart_id:           number
  product_name?:     string | null
  variant_id?:       number | null
  product_image?:    string | null
  product_details?:  string | null
  product_features?: string | null
  price?:            string | number | null
  quantity?:         number | string | null
  subtotal?:         number | string | null
}

function normaliseFlatItem(item: FlatCartItem): CartLine | null {
  const cartId = Number(item?.cart_id)
  if (!cartId || cartId <= 0) {
    console.log('[cart.api] normaliseFlatItem - Invalid cart_id:', cartId);
    return null;
  }

  console.log('[cart.api] normaliseFlatItem - Processing item:', item);

  const productId = mapGet(cartId) ?? cartId  // fall back to cartId if not mapped

  const qty      = Math.max(1, Math.floor(toNum(item.quantity ?? 1)))
  const price    = toNum(item.price)
  const subtotal = toNum(item.subtotal) || price * qty
  const image    = normalizeImage(item.product_image)
  const name     = String(item.product_name ?? `Product #${productId}`)
  const varId    = item.variant_id ? Number(item.variant_id) : undefined

  console.log('[cart.api] normaliseFlatItem - Parsed:', {
    cartId,
    productId,
    qty,
    price,
    subtotal,
    image,
    name,
  });

  const cached = pcGet(productId)
  const product: Product = {
    id:     productId,
    name:   name || cached?.name || `Product #${productId}`,
    price:  price > 0 ? fmtINR(price) : (cached?.price ?? '₹0'),
    image:  image || cached?.image || '',
    tag:    cached?.tag || '',
    rating: cached?.rating ?? 4,
  }

  if (name && !name.startsWith('Product #')) {
    pcWrite(productId, { id: productId, name, image, price: fmtINR(price) })
  }

  console.log('[cart.api] normaliseFlatItem - Normalised:', { cartId, productId, qty, subtotal, name });

  return {
    id:        cartId,
    productId,
    product,
    quantity:  qty,
    subtotal,
    variantId: varId,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  normaliseCheckoutItem — for GET /api/checkout
//  Expected shape: { cart_id, quantity, price, product: { product_id, name, image } }
// ─────────────────────────────────────────────────────────────────────────────

interface CheckoutItem {
  cart_id:   number
  quantity?: number | string
  price?:    string | number | null
  product?: {
    product_id?: number
    name?:       string | null
    image?:      string | null
  } | null
}

function normaliseCheckoutItem(item: CheckoutItem): CartLine | null {
  const cartId = Number(item?.cart_id)
  if (!cartId || cartId <= 0) {
    console.log('[cart.api] normaliseCheckoutItem - Invalid cart_id:', cartId);
    return null;
  }

  const prodObj   = item?.product ?? null
  const productId = Number(prodObj?.product_id ?? mapGet(cartId) ?? cartId)
  const qty       = Math.max(1, Math.floor(toNum(item.quantity ?? 1)))
  const price     = toNum(item.price)
  const image     = normalizeImage(prodObj?.image)
  const name      = String(prodObj?.name ?? pcGet(productId)?.name ?? `Product #${productId}`)

  console.log('[cart.api] normaliseCheckoutItem - Processing:', { 
    cartId, 
    productId, 
    name,
    qty,
    price,
    image: !!image,
  });

  if (productId && productId !== cartId) mapWrite(cartId, productId)

  const cached  = pcGet(productId)
  const product: Product = {
    id:     productId,
    name:   name || cached?.name || `Product #${productId}`,
    price:  price > 0 ? fmtINR(price) : (cached?.price ?? '₹0'),
    image:  image || cached?.image || '',
    tag:    cached?.tag  || '',
    rating: cached?.rating ?? 4,
  }

  if (name && !name.startsWith('Product #')) {
    pcWrite(productId, { id: productId, name, image: image || undefined, price: fmtINR(price) })
  }

  console.log('[cart.api] normaliseCheckoutItem - Normalised:', { 
    id: cartId,
    productId,
    quantity: qty,
    subtotal: price * qty,
  });

  return {
    id:        cartId,
    productId,
    product,
    quantity:  qty,
    subtotal:  price * qty,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  extractCartLines — handles both flat (cart) and nested (checkout) responses
//  Actual checkout response: { status: true, data: [ { cart_id, quantity, price, product: {...} } ] }
//  So we prioritise the `data` array.
// ─────────────────────────────────────────────────────────────────────────────

function extractCartLines(responseData: unknown): CartLine[] {
  const p = responseData as any;
  
  console.log('━━━ [extractCartLines] START ━━━');
  console.log('[extractCartLines] Input type:', typeof p);
  console.log('[extractCartLines] Input is null/undefined:', p === null || p === undefined);
  
  if (!p) {
    console.log('[extractCartLines] ✗ Empty response - returning []');
    return [];
  }

  console.log('[extractCartLines] Response keys:', Object.keys(p));

  // Priority 1: direct `data` array (most common for checkout)
  if (Array.isArray(p.data) && p.data.length > 0) {
    console.log('[extractCartLines] ✓ Found p.data array with', p.data.length, 'items');
    const lines = p.data
      .map((item: any, idx: number) => {
        console.log(`[extractCartLines]   Item ${idx}:`, {
          cart_id: item?.cart_id,
          has_product: !!item?.product,
          product_type: typeof item?.product,
          product_keys: item?.product ? Object.keys(item.product) : [],
        });
        // Check for nested product object → checkout shape
        if (item?.product && typeof item.product === 'object') {
          console.log(`[extractCartLines]   Item ${idx} → checkout format`);
          return normaliseCheckoutItem(item);
        }
        // Otherwise treat as flat item (cart shape)
        console.log(`[extractCartLines]   Item ${idx} → flat format`);
        return normaliseFlatItem(item);
      })
      .filter((l: CartLine | null): l is CartLine => l !== null);
    
    if (lines.length) {
      console.log('[extractCartLines] ✓ Extracted', lines.length, 'valid lines from p.data');
      console.log('[extractCartLines] Lines details:', lines.map((l: CartLine, i: number) => ({
        index: i,
        id: l.id,
        productId: l.productId,
        name: l.product.name,
        qty: l.quantity,
        subtotal: l.subtotal,
      })));
      console.log('━━━ [extractCartLines] END (p.data) ━━━');
      return lines;
    }
    console.log('[extractCartLines] ✗ p.data items failed normalization');
  } else {
    console.log('[extractCartLines] ✗ p.data not found or empty. Array?', Array.isArray(p.data), 'Length:', p.data?.length);
  }

  // Priority 2: top-level cart_items (legacy, just in case)
  if (Array.isArray(p.cart_items) && p.cart_items.length > 0) {
    console.log('[extractCartLines] ✓ Found p.cart_items array with', p.cart_items.length, 'items');
    const lines = p.cart_items
      .map((item: any) => normaliseCheckoutItem(item))
      .filter((l: CartLine | null): l is CartLine => l !== null);
    if (lines.length) {
      console.log('[extractCartLines] ✓ Extracted', lines.length, 'from p.cart_items');
      console.log('━━━ [extractCartLines] END (cart_items) ━━━');
      return lines;
    }
  }

  // Priority 3: other possible wrappers (items, products, etc.)
  const candidates = [
    { path: 'p.items', value: p?.items },
    { path: 'p.products', value: p?.products },
    { path: 'p.data.items', value: p?.data?.items },
    { path: 'p.data.cart_items', value: p?.data?.cart_items },
  ];
  
  for (const { path, value } of candidates) {
    if (Array.isArray(value) && value.length > 0) {
      console.log(`[extractCartLines] ✓ Found ${path} with ${value.length} items`);
      const lines = value
        .map((item: any) => {
          if (item?.product && typeof item.product === 'object')
            return normaliseCheckoutItem(item);
          return normaliseFlatItem(item);
        })
        .filter((l: CartLine | null): l is CartLine => l !== null);
      if (lines.length) {
        console.log(`[extractCartLines] ✓ Extracted ${lines.length} from ${path}`);
        console.log('━━━ [extractCartLines] END (' + path + ') ━━━');
        return lines;
      }
    }
  }

  console.log('[extractCartLines] ✗✗✗ NO VALID CART DATA FOUND IN RESPONSE');
  console.log('[extractCartLines] Response structure:', p);
  console.log('━━━ [extractCartLines] END (FAILED) ━━━');
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
//  buildCartFromStorage — instant cart for navbar badge, no network
// ─────────────────────────────────────────────────────────────────────────────

export function buildCartFromStorage(): CartState {
  const cached = linesRead()
  if (cached.length > 0) return { lines: cached }
  return { lines: [] }
}

// ─────────────────────────────────────────────────────────────────────────────
//  getCart — GET /api/cart
// ─────────────────────────────────────────────────────────────────────────────

export async function getCart(): Promise<CartState> {
  const sid   = localStorage.getItem(SID_KEY) || localStorage.getItem(SID_LEGACY)
  const token = localStorage.getItem('access_token')
  if (!sid && !token) return { lines: [] }

  try {
    const res   = await apiClient.get('/api/cart', { headers: cartHeaders() } as any)
    const lines = extractCartLines(res.data)

    linesWrite(lines)
    const qtyMap: Record<string, number> = {}
    lines.forEach(l => { qtyMap[l.productId] = (qtyMap[l.productId] ?? 0) + l.quantity })
    storageWrite(qtyMap)

    return { lines }
  } catch {
    return buildCartFromStorage()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  addToCart — POST /api/cart
// ─────────────────────────────────────────────────────────────────────────────

export async function addToCart(
  productOrId: number | { id: number } | Product,
  quantity    = 1,
  variantId?: number,
): Promise<CartState> {
  const isProduct = typeof productOrId === 'object' && 'name' in productOrId
  const productId = isProduct
    ? (productOrId as Product).id
    : typeof productOrId === 'number'
      ? productOrId
      : (productOrId as { id: number }).id
  const qty = Math.max(1, Math.floor(quantity))

  if (isProduct) {
    const p = productOrId as Product
    pcWrite(productId, {
      id:     productId,
      name:   p.name,
      image:  p.image,
      price:  typeof p.price === 'string' ? p.price : fmtINR(p.price),
      tag:    (p as any).tag    ?? '',
      rating: (p as any).rating ?? 4,
    })
  }

  try {
    const payload: Record<string, unknown> = { product_id: productId, quantity: qty }
    const vId = Number.isFinite(Number(variantId)) && Number(variantId) > 0 ? Number(variantId) : null
    if (vId) payload.variant_id = vId

    const res   = await apiClient.post('/api/cart', payload, { headers: cartHeaders() } as any)
    const lines = extractCartLines(res.data)

    if (lines.length > 0) {
      const newest = lines.reduce((max, l) => l.id > max.id ? l : max, lines[0])
      mapWrite(newest.id, productId)
      newest.productId = productId
      newest.product.id = productId
      if (isProduct) {
        const p = productOrId as Product
        newest.product.name  = p.name  || newest.product.name
        newest.product.image = p.image || newest.product.image
        newest.product.price = typeof p.price === 'string' ? p.price : fmtINR(p.price)
      }
    }

    linesWrite(lines)
    const qtyMap: Record<string, number> = {}
    lines.forEach(l => { qtyMap[l.productId] = (qtyMap[l.productId] ?? 0) + l.quantity })
    storageWrite(qtyMap)
    notifyCartChanged()
    return { lines }
  } catch (e) {
    console.error('[cart.api] addToCart failed:', e)
    throw e
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  updateCartItem — PUT /api/cart/:cart_id
// ─────────────────────────────────────────────────────────────────────────────

export async function updateCartItem(cartLineId: number, quantity: number): Promise<CartState> {
  const qty = Math.max(1, Math.floor(quantity))
  try {
    const res   = await apiClient.put(
      `/api/cart/${cartLineId}`,
      { quantity: qty },
      { headers: cartHeaders() } as any,
    )
    const lines = extractCartLines(res.data)

    if (lines.length > 0) {
      linesWrite(lines)
      const qtyMap: Record<string, number> = {}
      lines.forEach(l => { qtyMap[l.productId] = (qtyMap[l.productId] ?? 0) + l.quantity })
      storageWrite(qtyMap)
      notifyCartChanged()
      return { lines }
    }

    const fresh = await getCart()
    notifyCartChanged()
    return fresh
  } catch (e) {
    console.error('[cart.api] updateCartItem failed:', e)
    return getCart()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  removeFromCartItem — DELETE /api/cart/:cart_id
// ─────────────────────────────────────────────────────────────────────────────

export async function removeFromCartItem(cartLineId: number): Promise<CartState> {
  try {
    const res   = await apiClient.delete(
      `/api/cart/${cartLineId}`,
      { headers: cartHeaders() } as any,
    )
    const lines = extractCartLines(res.data)

    try {
      const m = mapRead()
      delete m[cartLineId]
      localStorage.setItem(CART_MAP_KEY, JSON.stringify(m))
    } catch {}

    if (lines.length > 0) {
      linesWrite(lines)
      const qtyMap: Record<string, number> = {}
      lines.forEach(l => { qtyMap[l.productId] = (qtyMap[l.productId] ?? 0) + l.quantity })
      storageWrite(qtyMap)
      notifyCartChanged()
      return { lines }
    }

    const fresh = await getCart()
    notifyCartChanged()
    return fresh
  } catch (e) {
    console.error('[cart.api] removeFromCartItem failed:', e)
    return getCart()
  }
}

export { removeFromCartItem as removeFromCart }

// ─────────────────────────────────────────────────────────────────────────────
//  clearCart — removes every item one by one
// ─────────────────────────────────────────────────────────────────────────────

export async function clearCart(): Promise<CartState> {
  const current = await getCart()
  await Promise.allSettled(
    current.lines.map(l =>
      apiClient.delete(`/api/cart/${l.id}`, { headers: cartHeaders() } as any)
    )
  )
  linesWrite([])
  storageWrite({})
  notifyCartChanged()
  return { lines: [] }
}

// ─────────────────────────────────────────────────────────────────────────────
//  getCheckout — GET /api/checkout
//  Actual response: { status: true, data: [...] } with nested product objects.
// ─────────────────────────────────────────────────────────────────────────────

export async function getCheckout(): Promise<{ lines: CartLine[]; cart_total: number }> {
  try {
    const headers = cartHeaders();
    console.log('[cart.api] getCheckout START');
    console.log('[cart.api] getCheckout - Headers:', {
      'Authorization': headers.Authorization ? '✓ Bearer token present' : '✗ No token',
      'Session-Id': headers['Session-Id'],
      'session-id': headers['session-id'],
      'x-session-id': headers['x-session-id'],
    });
    
    console.log('[cart.api] getCheckout - Making request to /api/checkout');
    const res = await apiClient.get('/api/checkout', { headers } as any);
    
    console.log('[cart.api] getCheckout - Response status:', res.status);
    console.log('[cart.api] getCheckout - Response data type:', typeof res.data);
    console.log('[cart.api] getCheckout - Full response object:', JSON.stringify(res.data, null, 2));
    
    // Debug: check all possible keys in response
    if (res.data && typeof res.data === 'object') {
      console.log('[cart.api] getCheckout - Response keys:', Object.keys(res.data));
      console.log('[cart.api] getCheckout - Response.data type:', typeof res.data.data, 'length:', Array.isArray(res.data.data) ? res.data.data.length : 'N/A');
    }
    
    const lines = extractCartLines(res.data);
    console.log('[cart.api] getCheckout - Extraction complete!');
    console.log('[cart.api] getCheckout - Extracted lines count:', lines.length);
    
    if (lines.length === 0) {
      console.warn('[cart.api] getCheckout WARNING: No lines extracted from response');
      console.warn('[cart.api] getCheckout - Raw response to debug:', res.data);
    } else {
      console.log('[cart.api] getCheckout - Extracted lines details:', lines.map((l, i) => ({
        index: i,
        cartId: l.id,
        productId: l.productId,
        name: l.product.name,
        qty: l.quantity,
        subtotal: l.subtotal,
      })));
    }

    // Calculate total from lines (fallback if API doesn't provide cart_total)
    const cart_total = lines.reduce((sum, l) => sum + l.subtotal, 0);
    console.log('[cart.api] getCheckout - Calculated total:', cart_total, 'from', lines.length, 'items');

    // Persist for offline / badge
    if (lines.length > 0) {
      linesWrite(lines);
      const qtyMap: Record<string, number> = {};
      lines.forEach(l => { qtyMap[l.productId] = (qtyMap[l.productId] ?? 0) + l.quantity });
      storageWrite(qtyMap);
      console.log('[cart.api] getCheckout - Persisted to localStorage');
    }

    console.log('[cart.api] getCheckout COMPLETE - returning:', { lines: lines.length, cart_total });
    return { lines, cart_total };
  } catch (e: any) {
    console.error('[cart.api] getCheckout FAILED');
    console.error('[cart.api] getCheckout error object:', e);
    console.error('[cart.api] getCheckout error details:', {
      message: e?.message,
      status: e?.response?.status,
      statusText: e?.response?.statusText,
      data: e?.response?.data,
      headers: e?.response?.headers,
    });
    return { lines: [], cart_total: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  registerProductGallery — called by shop pages to prime the product cache
// ─────────────────────────────────────────────────────────────────────────────

export function registerProductGallery(gallery: Product[]): void {
  ;(window as any).__PRODUCT_GALLERY__ = gallery
  for (const p of gallery) {
    pcWrite(p.id, {
      id:     p.id,
      name:   p.name,
      image:  p.image,
      price:  typeof p.price === 'string' ? p.price : fmtINR(p.price),
      tag:    (p as any).tag    ?? '',
      rating: (p as any).rating ?? 4,
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  mergeGuestCartIntoUser — called after login
// ─────────────────────────────────────────────────────────────────────────────

export async function mergeGuestCartIntoUser(): Promise<void> {
  const stored = buildCartFromStorage()
  if (stored.lines.length === 0) return
  for (const l of stored.lines) {
    try {
      await apiClient.post(
        '/api/cart',
        { product_id: l.productId, quantity: l.quantity },
        { headers: cartHeaders() } as any,
      )
    } catch (e) {
      console.error('[cart.api] mergeGuestCart: failed product', l.productId, e)
    }
  }
  linesWrite([])
  storageWrite({})
  notifyCartChanged()
}