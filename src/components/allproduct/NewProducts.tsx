// @ts-nocheck
'use client'

import { API_BASE_URL } from '@/lib/env'

// src/components/home/NewProducts.tsx
// ══════════════════════════════════════════════════════════════════════
//  NEW PRODUCTS SECTION — matches screenshot exactly
//
//  ✦ Fetches from real API: GET /api/products
//  ✦ Shows 4 random products (reshuffled on mount)
//  ✦ Uses LayoutOne card component (existing, unchanged)
//  ✦ Gradient "New Products" heading (pink→orange)
//  ✦ Subtitle text below heading
//  ✦ 4-col desktop grid → 2-col tablet → 1-col mobile
//  ✦ "All Products" gradient CTA button → /shop-v1
//  ✦ AOS fade-up animations
//  ✦ Skeleton loaders while fetching
//  ✦ Maps API shape → LayoutOne Item interface correctly
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react'
import { Link }                             from '@/lib/router'
import LayoutOne                            from '../product/layout-one'

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = `${API_BASE_URL}/api/products`

// Brand gradient (matches rest of site)
const BRAND_GRAD = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'

// Gradient text style (for heading)
const GRAD_TXT: React.CSSProperties = {
  background: BRAND_GRAD,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
}

// ─── API shape ───────────────────────────────────────────────────────────────
interface ApiProduct {
  product_id:          number
  name:                string
  category:            string
  price:               string
  original_price:      string
  discount_percentage: number | null
  images:              string[]
  variants:            { variant_id: number; size: string; color: string; stock: string }[]
  average_rating:      number
  total_reviews:       number
}

// ─── Map API product → LayoutOne Item ────────────────────────────────────────
// LayoutOne expects: { id, image, tag, price, name, rating?, originalPrice?, discount? }
function toItem(p: ApiProduct) {
  const price    = parseFloat(p.price)      || 0
  const origP    = parseFloat(p.original_price) || 0
  const disc     = origP > price && price > 0
    ? Math.round(((origP - price) / origP) * 100)
    : (p.discount_percentage ?? 0)

  // Tag: derive from discount or use a sensible default
  let tag = 'New'
  if (disc >= 30)      tag = 'Hot Sale'
  else if (disc >= 10) tag = 'Sale'
  else if (disc > 0)   tag = '10% OFF'

  return {
    id:            p.product_id,
    image:         p.images?.[0] ?? '',
    tag,
    price:         p.price,
    name:          p.name,
    rating:        p.average_rating || 4,
    originalPrice: origP > price ? p.original_price : undefined,
    discount:      disc > 0 ? disc : undefined,
  }
}

// ─── Pick N random items ──────────────────────────────────────────────────────
function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

// ─── Skeleton card (matches LayoutOne dimensions) ─────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: '#fff', border: '1px solid #EBEBF0', borderRadius: 8,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Image placeholder */}
      <div style={{
        aspectRatio: '1/1',
        background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)',
        backgroundSize: '300% 100%',
        animation: 'npShim 1.5s infinite linear',
      }} />
      {/* Info placeholder */}
      <div style={{ padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, width: '85%', borderRadius: 4, background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)', backgroundSize:'300% 100%', animation:'npShim 1.5s infinite linear' }} />
        <div style={{ height: 12, width: '60%', borderRadius: 4, background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)', backgroundSize:'300% 100%', animation:'npShim 1.5s infinite linear' }} />
        <div style={{ height: 17, width: '45%', borderRadius: 4, background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)', backgroundSize:'300% 100%', animation:'npShim 1.5s infinite linear' }} />
      </div>
    </div>
  )
}

// Inject shimmer keyframe once
let _npCssInjected = false
function ensureNPStyles() {
  if (_npCssInjected || typeof document === 'undefined') return
  const s = document.createElement('style')
  s.id = 'np-section-styles'
  s.textContent = `
    @keyframes npShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  `
  document.head.appendChild(s)
  _npCssInjected = true
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function NewProducts() {
  const [items,   setItems]   = useState<ReturnType<typeof toItem>[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => { ensureNPStyles() }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(API_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const list: ApiProduct[] = Array.isArray(json?.data) ? json.data
        : Array.isArray(json) ? json : []
      // Pick 4 random products, mapped to LayoutOne shape
      setItems(pickRandom(list, 4).map(toItem))
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  return (
    <div className="s-py-25-100">
      <div className="container-fluid">

        {/* ── Heading ── */}
        <div className="nf-block-copy max-w-xl mx-auto mb-8 mt-10 md:mb-12 text-center">
          <h3
            className="leading-none text-2xl md:text-3xl font-bold"
            style={GRAD_TXT}
          >
            New Products
          </h3>
          <p className="mt-3" style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7 }}>
            The latest foods added to the shop.
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            textAlign: 'center', padding: '20px', marginBottom: 24,
            background: '#fff5f5', border: '1px solid #fecaca',
            borderRadius: 10, color: '#dc2626', fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            ⚠ {error}
            <br />
            <button
              onClick={fetchProducts}
              style={{
                marginTop: 10, padding: '6px 20px', background: '#dc2626',
                color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer',
                fontWeight: 700, fontSize: 13,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Products Grid ── */}
        {!error && (
          <div
            className="nf-block-photo max-w-[1720px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : items.map((item, i) => (
                  <LayoutOne key={item.id ?? i} item={item} />
                ))}
          </div>
        )}

        {/* ── CTA Button ── */}
        {!error && (
          <div className="text-center mt-10 md:mt-14">
            <Link
              to="/shop-v1"
              style={{
                display: 'inline-block',
                padding: '14px 40px',
                background: BRAND_GRAD,
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textDecoration: 'none',
                borderRadius: 10,
                transition: 'opacity 0.2s, transform 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88'
                ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = '1'
                ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
              }}
            >
              All Products
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}