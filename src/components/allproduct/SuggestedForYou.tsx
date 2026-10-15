// @ts-nocheck
'use client'

import { API_BASE_URL } from '@/lib/env'

// src/components/home/SuggestedForYou.tsx
// ══════════════════════════════════════════════════════════════════════
//  SUGGESTED FOR YOU — Horizontal scrollable product row (screenshot row 2)
//
//  Design matches screenshot exactly:
//  ✦ "Suggested For You" title + arrow button (right)
//  ✦ Horizontal scroll row — cards peek at the edge
//  ✦ Card: white bg, product image (square), star rating badge
//    (bottom-left of image), product name (2 lines), strikethrough
//    MRP + sale price + UPI/Bank offer line
//  ✦ Left/Right arrow nav buttons (like screenshot → button)
//  ✦ DM Sans + Syne fonts (matches site)
//  ✦ Brand: #2F4A3A / #E8314A / #F97316
//  ✦ Real API: GET /api/products
//  ✦ Skeleton loaders
//  ✦ addToCart on card click
//  ✦ Mobile: touch-swipe scrollable
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate }                               from '@/lib/router'
import { addToCart }                                 from '../../api/cart.api'
import {
  toggleWishlist,
  isWishlisted,
  notifyWishlistChanged,
} from '../../api/wishlist.api'

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL   = `${API_BASE_URL}/api/products`
const FONT_HEAD = "'DM Sans', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

const BRAND_GRAD  = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
const BRAND_SOLID = '#2F4A3A'
const BRAND_RED   = '#E8314A'
const BRAND_GREEN = '#22C55E'
const BRAND_YELLOW = '#F59E0B'

// Offer label cycling (mimics screenshot "with UPI offer", "with Bank offer")
const OFFER_LABELS = ['with UPI offer', 'with Bank offer', 'with UPI offer + more', 'with Bank offer']

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseNum(p: string | number): number {
  const n = parseFloat(String(p).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}
function fmtINR(n: number): string {
  return n === 0 ? '₹0' : '₹' + n.toLocaleString('en-IN')
}
function discountPct(price: string, orig: string): number {
  const p = parseNum(price), o = parseNum(orig)
  if (!o || !p || o <= p) return 0
  return Math.round(((o - p) / o) * 100)
}
// Extra offer price (simulate UPI/Bank offer — 3–5% additional)
function offerPrice(price: string, pct = 4): number {
  const p = parseNum(price)
  return p === 0 ? 0 : Math.round(p * (1 - pct / 100))
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const SFY_STYLE_ID = 'sfy-v1-styles'

const SFY_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@600;700;800&display=swap');

  @keyframes sfyShim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes sfyFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sfyPop { 0%{transform:scale(1)} 38%{transform:scale(1.45)} 65%{transform:scale(0.9)} 100%{transform:scale(1)} }

  .sfy-pop { animation: sfyPop .3s cubic-bezier(.36,.07,.19,.97) both; }

  /* ── Section ── */
  .sfy-section {
    padding: 32px 0 8px;
    font-family: ${FONT_BODY};
    animation: sfyFadeUp .5s .1s ease both;
  }

  /* ── Header row ── */
  .sfy-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 12px;
  }
  .sfy-title {
    font-family: ${FONT_HEAD};
    font-size: clamp(17px, 2.5vw, 22px);
    font-weight: 800;
    color: #0f0f13;
    margin: 0;
    letter-spacing: -.01em;
  }
  .sfy-arrow-btn {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: #111827;
    border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background .18s, transform .18s;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  }
  .sfy-arrow-btn:hover { background: #2F4A3A; transform: scale(1.08); }
  .sfy-arrow-btn:disabled { opacity: .4; cursor: default; }

  /* ── Scroll row wrapper ── */
  .sfy-scroll-outer {
    position: relative;
  }
  .sfy-scroll-track {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-behavior: smooth;
    padding-bottom: 10px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    /* peek effect: last card half visible */
  }
  .sfy-scroll-track::-webkit-scrollbar { display: none; }

  /* ── Nav arrows (desktop) ── */
  .sfy-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-60%);
    z-index: 10;
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    transition: background .18s, border-color .18s, transform .18s;
  }
  .sfy-nav-btn:hover { background: #2F4A3A; border-color: #2F4A3A; }
  .sfy-nav-btn:hover svg { stroke: #fff !important; }
  .sfy-nav-btn.prev { left: -18px; }
  .sfy-nav-btn.next { right: -18px; }
  .sfy-nav-btn:disabled { opacity: .3; cursor: default; pointer-events: none; }
  @media (max-width: 767px) { .sfy-nav-btn { display: none; } }

  /* ── Card ── */
  .sfy-card {
    background: #fff;
    border: 1px solid #e9e9ee;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    flex-shrink: 0;
    width: 200px;
    transition: box-shadow .22s ease, transform .22s ease, border-color .18s;
    position: relative;
  }
  @media (max-width: 767px) { .sfy-card { width: 160px; } }
  @media (max-width: 399px) { .sfy-card { width: 148px; } }

  .sfy-card:hover {
    box-shadow: 0 6px 24px rgba(91,79,190,.14);
    transform: translateY(-2px);
    border-color: rgba(91,79,190,.2);
  }

  /* ── Image zone ── */
  .sfy-img-wrap {
    position: relative;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: #f5f5f7;
    flex-shrink: 0;
  }
  .sfy-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .55s cubic-bezier(.25,.46,.45,.94);
  }
  .sfy-card:hover .sfy-img { transform: scale(1.06); }

  /* ── Star rating badge (bottom-left of image, like screenshot) ── */
  .sfy-rating-badge {
    position: absolute;
    bottom: 7px; left: 7px;
    background: rgba(255,255,255,0.95);
    border: 1px solid #e5e7eb;
    border-radius: 5px;
    display: flex; align-items: center; gap: 3px;
    padding: 3px 7px;
    font-family: ${FONT_BODY};
    font-size: 11px;
    font-weight: 700;
    color: #111827;
    box-shadow: 0 1px 4px rgba(0,0,0,0.10);
    line-height: 1;
  }
  .sfy-rating-star { color: ${BRAND_YELLOW}; font-size: 11px; }

  /* ── Wishlist heart (top-right) ── */
  .sfy-heart {
    position: absolute; top: 7px; right: 7px;
    z-index: 10;
    width: 26px; height: 26px;
    border-radius: 50%;
    background: rgba(255,255,255,0.92);
    border: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all .18s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .sfy-heart:hover { border-color: ${BRAND_RED}; transform: scale(1.12); }
  .sfy-heart.wl-active { background: #fff0f2; border-color: ${BRAND_RED}; }

  /* ── Info zone ── */
  .sfy-info {
    padding: 10px 10px 12px;
    display: flex; flex-direction: column; gap: 3px;
  }

  /* Product name */
  .sfy-name {
    font-family: ${FONT_BODY};
    font-size: 13px; font-weight: 600;
    color: #111827; line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; margin: 0;
  }
  @media (max-width: 767px) { .sfy-name { font-size: 12px; } }

  /* MRP line */
  .sfy-mrp-row {
    display: flex; align-items: baseline; gap: 5px; margin-top: 2px;
  }
  .sfy-mrp {
    font-family: ${FONT_BODY}; font-size: 12px;
    color: #9ca3af; text-decoration: line-through;
  }
  /* Sale price */
  .sfy-sale {
    font-family: ${FONT_BODY}; font-size: 15px; font-weight: 700;
    color: #111827;
  }
  @media (max-width: 767px) { .sfy-sale { font-size: 14px; } }

  /* Offer line (green, like screenshot) */
  .sfy-offer {
    font-family: ${FONT_BODY}; font-size: 11px; font-weight: 600;
    color: #16a34a; line-height: 1.3;
  }
  .sfy-offer-price { font-weight: 700; }

  /* ── Add to cart (icon, bottom-right of card) ── */
  .sfy-cart-btn {
    position: absolute; bottom: 10px; right: 10px;
    width: 28px; height: 28px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid #e5e7eb;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .18s;
  }
  .sfy-cart-btn:hover:not(:disabled) {
    background: linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%);
    border-color: transparent;
  }
  .sfy-cart-btn.added { background: ${BRAND_GREEN}; border-color: ${BRAND_GREEN}; }
  .sfy-cart-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* ── Skeleton ── */
  .sfy-skel {
    background: linear-gradient(90deg, #ececf0 25%, #e2e2ea 50%, #ececf0 75%);
    background-size: 300% 100%;
    animation: sfyShim 1.5s infinite linear;
    border-radius: 4px;
  }
  .sfy-skel-card {
    background: #fff; border: 1px solid #e9e9ee;
    border-radius: 8px; overflow: hidden; flex-shrink: 0; width: 200px;
  }
  @media (max-width: 767px) { .sfy-skel-card { width: 160px; } }

  /* ── Error ── */
  .sfy-err {
    text-align: center; padding: 20px;
    font-family: ${FONT_BODY}; font-size: 13px;
    color: #dc2626; background: #fff5f5;
    border-radius: 10px; border: 1px solid #fecaca;
  }
  .sfy-retry {
    margin-top: 10px; padding: 6px 18px;
    background: #dc2626; color: #fff; border: none;
    border-radius: 6px; font-family: ${FONT_BODY};
    font-size: 12px; font-weight: 700; cursor: pointer;
  }
`

function ensureSFYStyles() {
  if (!document.getElementById(SFY_STYLE_ID)) {
    const tag = document.createElement('style')
    tag.id = SFY_STYLE_ID
    tag.textContent = SFY_STYLES
    document.head.appendChild(tag)
  }
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="sfy-skel-card">
      <div className="sfy-skel" style={{ aspectRatio: '1/1' }} />
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="sfy-skel" style={{ height: 12, width: '90%' }} />
        <div className="sfy-skel" style={{ height: 12, width: '70%' }} />
        <div className="sfy-skel" style={{ height: 14, width: '55%' }} />
        <div className="sfy-skel" style={{ height: 11, width: '80%' }} />
      </div>
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function SFYCard({ product, offerLabel }: { product: ApiProduct; offerLabel: string }) {
  const navigate = useNavigate()

  const [wished,    setWished]    = useState(() => isWishlisted(product.product_id))
  const [cartBusy,  setCartBusy]  = useState(false)
  const [cartAdded, setCartAdded] = useState(false)
  const [heartKey,  setHeartKey]  = useState(0)
  const cartTimer = useRef<any>(null)

  const price    = parseNum(product.price)
  const orig     = parseNum(product.original_price)
  const disc     = discountPct(product.price, product.original_price)
  const offer    = offerPrice(product.price)
  const image    = product.images?.[0] ?? ''
  const rating   = product.average_rating ?? 0

  useEffect(() => {
    const sync = () => setWished(isWishlisted(product.product_id))
    window.addEventListener('wishlist:changed', sync)
    return () => window.removeEventListener('wishlist:changed', sync)
  }, [product.product_id])

  useEffect(() => () => { if (cartTimer.current) clearTimeout(cartTimer.current) }, [])

  const handleWish = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault()
    setWished(w => !w); setHeartKey(k => k + 1); notifyWishlistChanged()
    try { await toggleWishlist(product.product_id) }
    catch { setWished(w => !w); notifyWishlistChanged() }
  }, [product.product_id])

  const handleCart = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault()
    if (cartBusy) return
    setCartBusy(true)
    try {
      await addToCart(product.product_id, 1)
      setCartAdded(true)
      if (cartTimer.current) clearTimeout(cartTimer.current)
      cartTimer.current = setTimeout(() => setCartAdded(false), 2000)
    } catch (err) { console.error('addToCart failed:', err) }
    finally { setCartBusy(false) }
  }, [cartBusy, product.product_id])

  const goDetail = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('button')) return
    navigate(`/product-details/${product.product_id}`)
  }

  return (
    <div
      className="sfy-card"
      onClick={goDetail}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/product-details/${product.product_id}`)}
      aria-label={product.name}
    >
      {/* Image */}
      <div className="sfy-img-wrap">
        <img
          src={image}
          alt={product.name}
          className="sfy-img"
          loading="lazy"
          onError={e => {
            ;(e.currentTarget as HTMLImageElement).src =
              'https://placehold.co/300x300/f5f5f7/c4c4d4?text=No+Image'
          }}
        />

        {/* Star rating badge — bottom left like screenshot */}
        {rating > 0 && (
          <div className="sfy-rating-badge">
            <span className="sfy-rating-star">★</span>
            <span>{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Wishlist heart */}
        <button
          key={heartKey}
          type="button"
          className={`sfy-heart${wished ? ' wl-active' : ''}${heartKey > 0 ? ' sfy-pop' : ''}`}
          onClick={handleWish}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24"
            fill={wished ? BRAND_RED : 'none'}
            stroke={wished ? BRAND_RED : '#6b6b7e'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="sfy-info">
        {/* Name */}
        <p className="sfy-name">{product.name}</p>

        {/* MRP + Sale price */}
        <div className="sfy-mrp-row">
          {orig > price && (
            <span className="sfy-mrp">{fmtINR(orig)}</span>
          )}
          <span className="sfy-sale">{fmtINR(price)}</span>
        </div>

        {/* Offer line */}
        {offer > 0 && offer < price && (
          <div className="sfy-offer">
            <span className="sfy-offer-price">{fmtINR(offer)}</span>{' '}
            <span>{offerLabel}</span>
          </div>
        )}
      </div>

      {/* Cart icon button */}
      <button
        type="button"
        className={`sfy-cart-btn${cartAdded ? ' added' : ''}`}
        onClick={handleCart}
        disabled={cartBusy}
        aria-label="Add to cart"
        style={{ marginBottom: 2 }}
      >
        {cartAdded ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={cartAdded ? '#fff' : '#374151'} strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        )}
      </button>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function SuggestedForYou() {
  const navigate    = useNavigate()
  const scrollRef   = useRef<HTMLDivElement>(null)

  const [products,  setProducts]  = useState<ApiProduct[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [canLeft,   setCanLeft]   = useState(false)
  const [canRight,  setCanRight]  = useState(true)

  useEffect(() => { ensureSFYStyles() }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError(null)
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

  // Update arrow states on scroll
  const syncArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', syncArrows, { passive: true })
    syncArrows()
    return () => el.removeEventListener('scroll', syncArrows)
  }, [syncArrows, products])

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector('.sfy-card')?.clientWidth ?? 210
    el.scrollBy({ left: dir === 'right' ? cardWidth * 3 : -(cardWidth * 3), behavior: 'smooth' })
  }

  return (
    <section className="sfy-section">
      <div className="container-fluid">
        <div style={{ maxWidth: 1720, margin: '0 auto' }}>

          {/* Header */}
          <div className="sfy-header">
            <h2 className="sfy-title">Suggested For You</h2>
            <button
              className="sfy-arrow-btn"
              onClick={() => scrollBy('right')}
              disabled={!canRight}
              aria-label="Scroll right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="sfy-err">
              ⚠ {error}
              <br />
              <button className="sfy-retry" onClick={fetchProducts} type="button">Retry</button>
            </div>
          )}

          {/* Scroll row */}
          {!error && (
            <div className="sfy-scroll-outer">
              {/* Left nav arrow */}
              <button
                className={`sfy-nav-btn prev`}
                onClick={() => scrollBy('left')}
                disabled={!canLeft}
                aria-label="Previous"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              <div className="sfy-scroll-track" ref={scrollRef}>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                  : products.map((p, i) => (
                      <SFYCard
                        key={p.product_id}
                        product={p}
                        offerLabel={OFFER_LABELS[i % OFFER_LABELS.length]}
                      />
                    ))}
              </div>

              {/* Right nav arrow */}
              <button
                className={`sfy-nav-btn next`}
                onClick={() => scrollBy('right')}
                disabled={!canRight}
                aria-label="Next"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}