// src/api/categoryProducts.api.ts
// ══════════════════════════════════════════════════════════════════════════════
//  Two endpoints confirmed from live API:
//
//  Parent (all children products):
//    GET /api/categories/{parentId}/all-products
//    e.g. /api/categories/21/all-products  → ALL Portrait Frames products
//
//  Child (specific sub-category):
//    GET /api/categories/{subId}/products
//    e.g. /api/categories/23/products       → Wooden Frames ONLY
//
//  Special case: "All X" links (id=22, 29, 36, 44 etc.) are the first child
//  but they should call the PARENT all-products endpoint, not the child endpoint.
//  This is handled in CategoryPage by detecting the name starts with "All ".
//  The API layer itself doesn't need to know — we just call the right function.
//
//  CRITICAL:
//  · Use `apiClient` from './client' (Axios instance w/ baseURL + interceptors)
//  · apiClient already has baseURL set, so we only pass the path
// ══════════════════════════════════════════════════════════════════════════════

import { apiClient } from "./client";

// ── Public types ──────────────────────────────────────────────────────────────

export interface CategoryProduct {
  id:             number;
  name:           string;
  image:          string;
  price:          string;       // e.g. "₹1,299"
  tag:            string;       // category/badge label for card
  rating:         number;       // 1–5
  badge?:         string;       // "NEW" | "HOT" | "SALE"
  originalPrice?: string;       // MRP for strikethrough
  discount?:      number;       // percent off
}

export type FetchResult =
  | { ok: true;  products: CategoryProduct[] }
  | { ok: false; products: CategoryProduct[]; error: string };

// ── Raw API response shape ────────────────────────────────────────────────────

interface RawProduct {
  id:               number;
  name:             string;
  image_url?:       string | null;
  image?:           string | null;
  // Backend sometimes returns these keys
  product_price?:   string | number | null;
  tag_name?:        string | null;
  price?:           string | number | null;
  compare_price?:   string | number | null;
  original_price?:  string | number | null;
  discount?:        number | null;
  rating?:          number | null;
  badge?:           string | null;
  tag?:             string | null;
  category?:        { id: number; name: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safely extract a flat array from any API response shape */
function parseRows(payload: unknown): RawProduct[] {
  if (Array.isArray(payload))  return payload as RawProduct[];
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (Array.isArray(p.data))     return p.data as RawProduct[];
    if (Array.isArray(p.products)) return p.products as RawProduct[];

    // Common API wrappers: { data: { data: [...] } } or { data: { products: [...] } }
    if (p.data && typeof p.data === 'object') {
      const d = p.data as Record<string, unknown>;
      if (Array.isArray(d.data))     return d.data as RawProduct[];
      if (Array.isArray(d.products)) return d.products as RawProduct[];
    }
  }
  return [];
}

/** Format any numeric value as ₹ with Indian comma notation */
function formatRupee(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) return '';
  return '₹' + num.toLocaleString('en-IN');
}

/** Normalise a raw API product into our CategoryProduct shape */
function normalise(raw: RawProduct, fallbackTag = ''): CategoryProduct {
  const price     = formatRupee(raw.product_price ?? raw.price) || '₹0';
  const mrpRaw    = raw.compare_price ?? raw.original_price;
  const mrp       = mrpRaw ? formatRupee(mrpRaw) : undefined;
  const discount  = raw.discount ? Number(raw.discount) : undefined;

  return {
    id:            Number(raw.id),
    name:          String(raw.name ?? ''),
    image:         raw.image_url || raw.image || '',
    price,
    tag:           raw.tag_name ?? raw.tag ?? raw.category?.name ?? raw.badge ?? fallbackTag,
    rating:        Number(raw.rating ?? 4) || 4,
    badge:         raw.badge ?? undefined,
    originalPrice: mrp,
    discount,
  };
}

// ── Public functions ──────────────────────────────────────────────────────────

/**
 * Fetch ALL products for a parent category (includes all children).
 *
 * Called when user clicks:
 *  - Parent dept name in catbar  → /category?id=21
 *  - "All Portrait Frames" link  → /category?id=21   (redirected in NavbarOne)
 *
 * Endpoint: GET /api/categories/{parentId}/all-products
 */
export async function getParentProducts(parentId: number): Promise<FetchResult> {
  if (!parentId || parentId <= 0) {
    return { ok: false, products: [], error: `Invalid parent category id: ${parentId}` };
  }

  try {
    const { data: payload } = await apiClient.get(
      `/api/categories/${parentId}/all-products`
    );
    const rows     = parseRows(payload);
    const products = rows.map(r => normalise(r));
    console.log(`[CategoryAPI] parent ${parentId} → ${products.length} products`);
    return { ok: true, products };
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    const msg    = err?.response?.data?.message ?? err?.message ?? 'Failed to fetch products';
    console.error(`[CategoryAPI] GET /api/categories/${parentId}/all-products → ${status} ${msg}`);
    return { ok: false, products: [], error: msg };
  }
}

/**
 * Fetch products for a specific child category.
 *
 * Called when user clicks any child link EXCEPT "All X":
 *  - "Wooden Frames"  → /category?subId=23&parentId=21
 *  - "Abstract Canvas" → /category?subId=30&parentId=28
 *
 * Endpoint: GET /api/categories/{subId}/products
 */
export async function getChildProducts(subId: number): Promise<FetchResult> {
  if (!subId || subId <= 0) {
    return { ok: false, products: [], error: `Invalid sub-category id: ${subId}` };
  }

  try {
    const { data: payload } = await apiClient.get(
      `/api/categories/${subId}/products`
    );
    const rows     = parseRows(payload);
    const products = rows.map(r => normalise(r));
    console.log(`[CategoryAPI] child ${subId} → ${products.length} products`);
    return { ok: true, products };
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    const msg    = err?.response?.data?.message ?? err?.message ?? 'Failed to fetch products';
    console.error(`[CategoryAPI] GET /api/categories/${subId}/products → ${status} ${msg}`);
    return { ok: false, products: [], error: msg };
  }
}