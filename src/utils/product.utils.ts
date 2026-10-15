import { API_BASE_URL } from '@/lib/env'
/**
 * Product utility functions and hooks
 */

import { useState, useEffect, useCallback } from 'react';
import type { CountdownUnits, StockState } from '../types/product';

export function formatINR(value: unknown): string {
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

export function normalizeImageUrl(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let s = String(raw);
  s = s.replace(/\\/g, '');
  s = s.trim().replace(/^"|"$/g, '');
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return window.location.protocol + s;
  const apiBase = API_BASE_URL as string | undefined;
  if (apiBase && apiBase.trim()) return apiBase.replace(/\/$/, '') + '/' + s.replace(/^\//, '');
  return window.location.origin.replace(/\/$/, '') + '/' + s.replace(/^\//, '');
}

export function getDeliveryDateRange(): string {
  const now = new Date();
  const add = (d: Date, days: number) => { const r = new Date(d); r.setDate(r.getDate() + days); return r; };
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(add(now, 3))} – ${fmt(add(now, 7))}`;
}

export function stockState(qty: number): StockState {
  if (qty === 0) return 'out';
  if (qty <= 5) return 'critical';
  if (qty <= 20) return 'low';
  return 'in';
}

export function calculateDiscount(original: number, current: number): number {
  if (original <= 0 || current <= 0) return 0;
  return Math.round(((original - current) / original) * 100);
}

/**
 * Countdown hook for sale timer
 */
export function useCountdown(target: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const calc = (): CountdownUnits => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: pad(Math.floor(diff / 86400000)),
      hours: pad(Math.floor((diff % 86400000) / 3600000)),
      minutes: pad(Math.floor((diff % 3600000) / 60000)),
      seconds: pad(Math.floor((diff % 60000) / 1000)),
    };
  };
  const [time, setTime] = useState<CountdownUnits>(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/**
 * Session management hook - ensures auth token before cart operations
 */
export function useSessionCheck() {
  const [hasSession, setHasSession] = useState(() => {
    return Boolean(typeof window !== 'undefined' && window.localStorage.getItem('access_token'));
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setHasSession(Boolean(window.localStorage.getItem('access_token')));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return hasSession;
}

/**
 * Toast notification state management
 */
export interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export function useToast() {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const show = useCallback((options: ToastOptions) => {
    setToast(options);
    if (options.duration !== 0) {
      const timeout = setTimeout(() => setToast(null), options.duration ?? 3000);
      return () => clearTimeout(timeout);
    }
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, show, dismiss };
}

/**
 * Extract image URLs from various API response formats
 */
export function extractImages(product: any): string[] {
  let images: string[] = [];

  if (Array.isArray(product?.images) && product.images.length > 0) {
    images = product.images.filter(Boolean).map((url: any) => normalizeImageUrl(url));
  }

  if (images.length === 0 && product?.image) {
    images.push(normalizeImageUrl(product.image));
  }

  if (images.length === 0 && Array.isArray(product?.media) && product.media.length > 0) {
    const mediaImages = product.media
      .map((m: any) => m?.url ?? m)
      .filter(Boolean)
      .map((url: any) => normalizeImageUrl(url));
    images.push(...mediaImages);
  }

  return images;
}

/**
 * Extract variants from product data
 */
export function extractVariants(product: any) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  
  return {
    sizes: variants[0]?.sizes?.length
      ? variants[0].sizes
      : (typeof variants[0]?.size === 'string'
          ? variants[0].size.split(',').map((s: string) => s.trim()).filter(Boolean)
          : ['S', 'M', 'L', 'XL']),
    colors: variants[0]?.colors?.length
      ? variants[0].colors
      : (typeof variants[0]?.color === 'string'
          ? variants[0].color.split(',').map((c: string) => c.trim()).filter(Boolean)
          : []),
    stock: Math.max(0, toNumber(variants[0]?.stock ?? 0)),
  };
}
