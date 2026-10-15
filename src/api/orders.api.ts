// src/api/orders.api.ts
// ══════════════════════════════════════════════════════════════════════
//  FIXED: Correct response shape mapping from backend
//
//  GET /api/my-orders returns:
//    { status: true, data: [{
//        order_id, total_amount, payment_status, date,
//        products: [{ product_id, name, price, quantity, image }]
//    }] }
//
//  GET /api/order-details/:id returns:
//    { status: true, data: [{
//        order_id, product_id, quantity, price,
//        product: { product_name, product_details, images: [{ image }] },
//        variant: { ... }
//    }] }
// ══════════════════════════════════════════════════════════════════════

import { apiClient } from './client';

// ── Normalised types used by the UI ───────────────────────────────────

export interface OrderProduct {
  productId: number;
  productName: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string | number;
  total: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  products: OrderProduct[];
}

export interface OrderDetailItem {
  orderId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  price: number;
  productName: string;
  productDetails: string;
  image: string;
}

// ── Auth headers (mirrors Checkout.tsx) ──────────────────────────────

function authHeaders(): Record<string, string> {
  const token = window.localStorage.getItem('access_token');
  const sid =
    window.localStorage.getItem('SessionId') ||
    window.localStorage.getItem('session-id') || '';
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Session-Id': sid,
    'session-id': sid,
    SessionId: sid,
    'x-session-id': sid,
  };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ── fetchMyOrders ─────────────────────────────────────────────────────
// GET /api/my-orders
// Backend shape: { status: true, data: [ { order_id, total_amount,
//   payment_status, date, products: [...] } ] }

export async function fetchMyOrders(): Promise<Order[]> {
  const response = await apiClient.get('/api/my-orders', {
    headers: authHeaders(),
  } as any);

  // Backend wraps the array in { status, data: [...] }
  const raw: any[] = Array.isArray(response.data?.data)
    ? response.data.data
    : Array.isArray(response.data)
    ? response.data
    : [];

  return raw.map((o: any): Order => ({
    id:            o.order_id  ?? o.id          ?? 0,
    total:         parseFloat(o.total_amount   ?? o.total ?? 0),
    paymentStatus: o.payment_status ?? 'pending',
    // Map order_status → UI status key
    status:        normaliseStatus(o.order_status ?? o.status ?? 'Pending'),
    createdAt:     o.date ?? o.created_at ?? '',
    products: Array.isArray(o.products)
      ? o.products.map((p: any): OrderProduct => ({
          productId:   p.product_id ?? 0,
          productName: p.name       ?? p.product_name ?? 'Product',
          image:       p.image      ?? '',
          price:       parseFloat(p.price    ?? 0),
          quantity:    parseInt(p.quantity   ?? 1, 10),
        }))
      : [],
  }));
}

// ── fetchOrderDetails ─────────────────────────────────────────────────
// GET /api/order-details/:id
// Backend shape: { status: true, data: [ {
//   order_id, product_id, variant_id, quantity, price,
//   product: { product_name, product_details, images: [{ image }] },
//   variant: { ... }
// } ] }

export async function fetchOrderDetails(
  orderId: string | number
): Promise<OrderDetailItem[]> {
  const response = await apiClient.get(`/api/order-details/${orderId}`, {
    headers: authHeaders(),
  } as any);

  const raw: any[] = Array.isArray(response.data?.data)
    ? response.data.data
    : Array.isArray(response.data)
    ? response.data
    : [];

  return raw.map((item: any): OrderDetailItem => {
    const firstImage = item.product?.images?.[0]?.image ?? '';
    return {
      orderId:        item.order_id   ?? 0,
      productId:      item.product_id ?? 0,
      variantId:      item.variant_id ?? null,
      quantity:       parseInt(item.quantity ?? 1, 10),
      price:          parseFloat(item.price   ?? 0),
      productName:    item.product?.product_name  ?? 'Product',
      productDetails: item.product?.product_details ?? '',
      image:          firstImage,
    };
  });
}

// ── Helpers ───────────────────────────────────────────────────────────

function normaliseStatus(raw: string): string {
  const map: Record<string, string> = {
    pending:   'Pending',
    confirmed: 'Confirmed',
    shipped:   'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled',
    cancel:    'Cancelled',
  };
  return map[raw.toLowerCase()] ?? raw;
}