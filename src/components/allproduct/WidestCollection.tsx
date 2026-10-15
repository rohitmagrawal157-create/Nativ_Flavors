// @ts-nocheck
'use client'

import { API_BASE_URL } from '@/lib/env'

// src/components/home/WidestCollection.tsx
// ══════════════════════════════════════════════════════════════════════
//  WIDEST COLLECTION — 4 category tiles (matches screenshot row 1)
//
//  Design:
//  ✦ Light mint/green tinted card background (matches screenshot)
//  ✦ 4 tiles: each shows a product image + subtitle + bold label
//  ✦ Labels pulled from real API: "Don't Miss", "Bestsellers",
//    "Best Picks", "In Focus Now" with sub-labels from price ranges
//  ✦ Clicking any tile → /products?category=...
//  ✦ DM Sans + Syne fonts (matches site)
//  ✦ Real API: GET /api/products
//  ✦ Skeleton loaders while fetching
//  ✦ Fully responsive: 4 cols desktop → 2 cols mobile
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react'
import { useNavigate }                       from '@/lib/router'

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL  = `${API_BASE_URL}/api/products`
const FONT_HEAD = "'DM Sans', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiProduct {
  product_id:          number
  name:                string
  category:            string
  price:               string
  original_price:      string
  discount_percentage: number | null
  description:         string
  images:              string[]
  variants:            { variant_id: number; size: string; color: string; stock: string }[]
  average_rating:      number
  total_reviews:       number
}

// ─── Tile config (label/sublabel, picks a product from API by index bucket) ──
const TILE_CONFIG = [
  { label: 'Top Rated',     sublabel: "Don't Miss",    emoji: '⭐', pickIdx: 0 },
  { label: 'Top Rated',     sublabel: 'Bestsellers',   emoji: '🔥', pickIdx: 1 },
  { label: 'Under ₹199',   sublabel: 'Best Picks',    emoji: '💰', pickIdx: 2 },
  { label: 'Up to 90% Off', sublabel: 'In Focus Now',  emoji: '🎯', pickIdx: 3 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseNum(p: string | number): number {
  const n = parseFloat(String(p).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

// ─── CSS Injection ────────────────────────────────────────────────────────────
const WC_STYLE_ID = 'wc-v1-styles'

const WC_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@600;700;800&display=swap');

  @keyframes wcShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes wcFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  /* ── Outer section ── */
  .wc-section {
    padding: 28px 0 0;
    font-family: ${FONT_BODY};
  }

  /* ── Wrapper card (the mint box) ── */
  .wc-wrapper {
    background: #f0faf4;
    border: 1.5px solid #d1ede0;
    border-radius: 16px;
    padding: 20px 20px 22px;
    animation: wcFadeUp .5s ease both;
  }

  /* ── Section title ── */
  .wc-title {
    font-family: ${FONT_HEAD};
    font-size: clamp(16px, 2.5vw, 22px);
    font-weight: 800;
    color: #0f2318;
    margin: 0 0 16px;
    letter-spacing: -.01em;
  }

  /* ── 4-col grid ── */
  .wc-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  @media (max-width: 899px) { .wc-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }
  @media (max-width: 399px) { .wc-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }

  /* ── Tile ── */
  .wc-tile {
    background: #fff;
    border: 1px solid #e4ede9;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow .22s ease, transform .22s ease, border-color .18s;
    display: flex;
    flex-direction: column;
  }
  .wc-tile:hover {
    box-shadow: 0 6px 24px rgba(16,120,60,.12);
    transform: translateY(-2px);
    border-color: rgba(16,120,60,.25);
  }

  /* ── Tile image ── */
  .wc-tile-img-wrap {
    width: 100%;
    aspect-ratio: 1.1 / 1;
    overflow: hidden;
    background: #f5f5f7;
    flex-shrink: 0;
  }
  .wc-tile-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .55s cubic-bezier(.25,.46,.45,.94);
  }
  .wc-tile:hover .wc-tile-img { transform: scale(1.06); }

  /* ── Tile info ── */
  .wc-tile-info {
    padding: 10px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .wc-tile-sublabel {
    font-family: ${FONT_BODY};
    font-size: 11px;
    font-weight: 400;
    color: #5a7a6a;
    line-height: 1.3;
  }
  .wc-tile-label {
    font-family: ${FONT_BODY};
    font-size: 13px;
    font-weight: 700;
    color: #0f2318;
    line-height: 1.3;
  }
  @media (max-width: 767px) {
    .wc-tile-info    { padding: 8px 10px 10px; }
    .wc-tile-sublabel { font-size: 10px; }
    .wc-tile-label    { font-size: 12px; }
  }

  /* ── Skeleton ── */
  .wc-skel {
    background: linear-gradient(90deg, #e8f5ee 25%, #d8ece1 50%, #e8f5ee 75%);
    background-size: 300% 100%;
    animation: wcShim 1.5s infinite linear;
  }
  .wc-skel-tile {
    background: #fff;
    border: 1px solid #e4ede9;
    border-radius: 10px;
    overflow: hidden;
  }

  /* ── Error ── */
  .wc-err {
    text-align: center;
    padding: 24px;
    font-family: ${FONT_BODY};
    font-size: 13px;
    color: #dc2626;
    background: #fff5f5;
    border-radius: 10px;
    border: 1px solid #fecaca;
  }
  .wc-retry {
    margin-top: 10px;
    padding: 6px 18px;
    background: #dc2626;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-family: ${FONT_BODY};
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
`

function ensureWCStyles() {
  if (!document.getElementById(WC_STYLE_ID)) {
    const tag = document.createElement('style')
    tag.id = WC_STYLE_ID
    tag.textContent = WC_STYLES
    document.head.appendChild(tag)
  }
}

// ─── Skeleton Tile ────────────────────────────────────────────────────────────
function SkeletonTile() {
  return (
    <div className="wc-skel-tile">
      <div className="wc-skel" style={{ aspectRatio: '1.1/1' }} />
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div className="wc-skel" style={{ height: 11, width: '55%', borderRadius: 4 }} />
        <div className="wc-skel" style={{ height: 13, width: '70%', borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function WidestCollection() {
  const navigate = useNavigate()

  const [products, setProducts] = useState<ApiProduct[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => { ensureWCStyles() }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const list: ApiProduct[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
      setProducts(list)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Pick 4 representative products spread across the list
  const picks = TILE_CONFIG.map((cfg, i) => {
    if (!products.length) return null
    // spread evenly: pick from quarters of the list
    const quarter = Math.floor(products.length / 4)
    const idx = Math.min(i * quarter, products.length - 1)
    return products[idx] ?? products[i] ?? null
  })

  return (
    <section className="wc-section">
      <div className="container-fluid">
        <div style={{ maxWidth: 1720, margin: '0 auto' }}>
          <div className="wc-wrapper">

            <h2 className="wc-title">Widest collection</h2>

            {error && (
              <div className="wc-err">
                ⚠ {error}
                <br />
                <button className="wc-retry" onClick={fetchProducts} type="button">Retry</button>
              </div>
            )}

            {!error && (
              <div className="wc-grid">
                {loading
                  ? TILE_CONFIG.map((_, i) => <SkeletonTile key={i} />)
                  : TILE_CONFIG.map((cfg, i) => {
                      const product = picks[i]
                      const img = product?.images?.[0] ?? ''
                      const price = parseNum(product?.price ?? '0')

                      // Dynamic sublabel: use price info if available
                      const dynamicSublabel = cfg.pickIdx === 2 && price > 0 && price < 500
                        ? `Under ₹${Math.ceil(price / 100) * 100}`
                        : cfg.sublabel

                      return (
                        <div
                          key={i}
                          className="wc-tile"
                          onClick={() => product && navigate(`/product-details/${product.product_id}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && product && navigate(`/product-details/${product.product_id}`)}
                          aria-label={`${cfg.sublabel} — ${cfg.label}`}
                        >
                          <div className="wc-tile-img-wrap">
                            <img
                              src={img}
                              alt={product?.name ?? cfg.label}
                              className="wc-tile-img"
                              loading="lazy"
                              onError={e => {
                                ;(e.currentTarget as HTMLImageElement).src =
                                  'https://placehold.co/300x280/f0faf4/5a7a6a?text=No+Image'
                              }}
                            />
                          </div>
                          <div className="wc-tile-info">
                            <span className="wc-tile-sublabel">{dynamicSublabel}</span>
                            <span className="wc-tile-label">{cfg.label}</span>
                          </div>
                        </div>
                      )
                    })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}