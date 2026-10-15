import { API_BASE_URL } from '@/lib/env'
// src/api/product.api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Confirmed from live API endpoints:
//
// GET /api/products  →  { status, message, data: [{
//   product_id, name,
//   category,           ← exact string: "Portrait Frames", "Canvas Paintings", etc.
//   price,              ← selling price e.g. "90.00"
//   original_price,     ← MRP e.g. "100.00"
//   discount_percentage,
//   images[],           ← array of full absolute URLs
//   average_rating,     ← 0–5 number
//   total_reviews,
//   variants[{ variant_id, size, color, stock }],
//   ...
// }] }
//
// GET /api/categories/:id/products  →  same shape
// GET /api/products/search?q=xxx    →  { status, data: [{ product_id, name,
//                                         original_price, image, ... }] }
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from './client';

export interface Product {
  id:            number;
  name:          string;
  price:         string;    // formatted "₹90"
  image:         string;    // first image URL
  tag:           string;    // maps to category field from API
  rating?:       number;
  totalReviews?: number;
  originalPrice?: string;
  discount?:     number;
  color?:        string;
}

export interface ProductVariant {
  variantId: number;
  sizes:     string[];
  colors:    string[];
  stock:     number;
}

export interface ProductDetails {
  id:                  number;
  name:                string;
  tag?:                string;
  description?:        string;
  details?:            string;
  features?:           string;
  price:               number;
  originalPrice?:      number;
  discountPercentage?: number;
  date?:               string;
  category?:           { id: number; name: string };
  images:              string[];
  variants:            ProductVariant[];
}

interface SearchResultItem {
  product_id:           number;
  name:                 string;
  original_price?:      string | number | null;
  price?:               string | number | null;
  discount_percentage?: number | string | null;
  image?:               string | null;
  image_url?:           string | null;
  product_image?:       string | null;
  tag_name?:            string | null;
  tag?:                 string | null;
  rating?:              number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatINR(value: unknown): string {
  if (value === null || value === undefined || value === '') return '₹0';
  const num = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num) || num <= 0) return '₹0';
  return '₹' + num.toLocaleString('en-IN');
}

export function toNumber(value: unknown): number {
  const num = typeof value === 'number'
    ? value
    : parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function normalizeImageUrl(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).replace(/\\/g, '').trim().replace(/^"|"$/g, '');
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s))         return window.location.protocol + s;
  const base = (API_BASE_URL as string ?? '').trim();
  if (base) return base.replace(/\/$/, '') + '/' + s.replace(/^\//, '');
  return window.location.origin.replace(/\/$/, '') + '/' + s.replace(/^\//, '');
}

// ─── Core mapper: works for /api/products and /api/categories/:id/products ────
export function mapApiProduct(p: any): Product {
  const id = Number(p.product_id ?? p.id ?? 0);

  // Price: API confirmed → price field = selling price
  const priceRaw    = p.price ?? p.product_price ?? p.original_price ?? 0;
  const discPct     = p.discount_percentage != null ? toNumber(p.discount_percentage) : undefined;
  const originalRaw = (discPct && discPct > 0) ? (p.compare_price ?? p.mrp ?? null) : null;

  // Image: API confirmed → images[] array, first item is the display image
  let rawImg: unknown = null;
  if (Array.isArray(p.images) && p.images.length > 0) {
    rawImg = p.images[0];
  } else {
    rawImg = p.image ?? p.image_url ?? p.product_image ?? p.imageUrl ?? p.thumbnail ?? '';
  }
  if (!rawImg && Array.isArray(p.media) && p.media.length > 0) {
    rawImg = p.media[0]?.url ?? p.media[0];
  }

  // Category: API confirmed → exact string "Portrait Frames", "Canvas Paintings", etc.
  const tag = String(p.category ?? p.tag_name ?? p.tag ?? p.category_name ?? '');

  // Rating: API confirmed → average_rating + total_reviews
  const rating       = toNumber(p.average_rating ?? p.rating ?? 0);
  const totalReviews = Number(p.total_reviews ?? 0);

  return {
    id,
    name:          String(p.name ?? p.title ?? p.product_name ?? ''),
    price:         formatINR(priceRaw),
    image:         normalizeImageUrl(rawImg ?? ''),
    tag,
    rating:        rating > 0 ? rating : 4,   // default 4★ when no reviews
    totalReviews,
    originalPrice: originalRaw !== null ? formatINR(originalRaw) : undefined,
    discount:      discPct ?? undefined,
    color:         p.color ?? undefined,
  };
}

// ─── GET /api/products ────────────────────────────────────────────────────────
async function fetchApiProducts(): Promise<Product[]> {
  const res     = await apiClient.get<any>('/api/products');
  const payload = res.data;

  let items: any[] = [];
  if (Array.isArray(payload))             items = payload;
  else if (Array.isArray(payload?.data))  items = payload.data;
  else if (Array.isArray(payload?.data?.data)) items = payload.data.data;

  return items.map(mapApiProduct);
}

// ─── GET /api/categories/:id/all-products ─────────────────────────────────────
// Called when user clicks a specific category pill in ShopV1
// Note: Uses /all-products endpoint to fetch ALL products for the category
export async function fetchProductsByCategory(categoryId: number): Promise<Product[]> {
  if (!categoryId || categoryId <= 0) return fetchApiProducts();

  const res     = await apiClient.get<any>(`/api/categories/${categoryId}/all-products`);
  const payload = res.data;

  let items: any[] = [];
  if (Array.isArray(payload))             items = payload;
  else if (Array.isArray(payload?.data))  items = payload.data;
  else if (Array.isArray(payload?.data?.data)) items = payload.data.data;

  return items.map(mapApiProduct);
}

// ─── GET /api/products/:id/details ────────────────────────────────────────────
type ApiDetailsResp = {
  status?: boolean;
  data?: {
    product_id:           number;
    name:                 string;
    category?:            string | null;
    tag_name?:            string | null;
    description?:         string | null;
    details?:             string | null;
    features?:            string | null;
    price?:               string | number | null;
    original_price?:      string | number | null;
    discount_percentage?: number | string | null;
    date?:                string | null;
    images?:              Array<string | null> | null;
    variants?:            Array<{
      variant_id: number;
      size?:  string | null;
      color?: string | null;
      stock?: string | number | null;
    }> | null;
    average_rating?:  number | null;
    total_reviews?:   number | null;
  };
};

export async function getProductDetailsById(id: number): Promise<ProductDetails | null> {
  if (!Number.isFinite(id) || id <= 0) return null;
  try {
    const res = await apiClient.get<ApiDetailsResp>(`/api/products/${id}/details`);
    const d   = res.data?.data;
    if (!d) return null;

    const images   = (d.images ?? []).filter(Boolean).map((i: any) => normalizeImageUrl(i));
    const variants = (d.variants ?? []).map((v) => ({
      variantId: Number(v.variant_id),
      sizes:     String(v.size  ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      colors:    String(v.color ?? '').split(',').map((c) => c.trim()).filter(Boolean),
      stock:     Math.max(0, Math.trunc(toNumber(v.stock))),
    }));

    return {
      id:                 Number(d.product_id),
      name:               String(d.name ?? ''),
      tag:                d.tag_name ?? d.category ?? undefined,
      description:        d.description   ?? undefined,
      details:            d.details       ?? undefined,
      features:           d.features      ?? undefined,
      price:              toNumber(d.price),
      originalPrice:      d.original_price != null ? toNumber(d.original_price) : undefined,
      discountPercentage: d.discount_percentage != null && d.discount_percentage !== ''
                            ? toNumber(d.discount_percentage) : undefined,
      date:               d.date ?? undefined,
      category:           d.category ? { id, name: String(d.category) } : undefined,
      images,
      variants,
    };
  } catch (err) {
    console.error(`[product.api] getProductDetailsById(${id}) failed`, err);
    return null;
  }
}

export async function getProducts(): Promise<Product[]> {
  try   { return await fetchApiProducts(); }
  catch (err) {
    console.error('[product.api] getProducts failed', err);
    return [];
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  if (!Number.isFinite(id) || id <= 0) return null;
  try {
    const all = await fetchApiProducts();
    return all.find((p) => p.id === id) ?? null;
  } catch (err) {
    console.error(`[product.api] getProductById(${id}) failed`, err);
    return null;
  }
}

// ─── searchProducts ───────────────────────────────────────────────────────────
export async function searchProducts(query: string): Promise<Product[]> {
  const q = String(query ?? '').trim();
  if (!q) return await getProducts();

  try {
    const res     = await apiClient.get<{ status: boolean; data: SearchResultItem[] }>(
      '/api/products/search', { params: { q } } as any,
    );
    const payload = res.data;
    if (!payload?.status) throw new Error('status:false');

    const items = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray((payload as any).data?.data)
        ? (payload as any).data.data
        : [];

    return items.map((p: any) => mapApiProduct(p));
  } catch (err) {
    console.warn('[product.api] search API failed, client fallback:', err);
    try {
      const all = await getProducts();
      const qq  = q.toLowerCase();
      return all.filter(
        (p) => (p.name ?? '').toLowerCase().includes(qq) || (p.tag ?? '').toLowerCase().includes(qq),
      );
    } catch {
      return [];
    }
  }
}