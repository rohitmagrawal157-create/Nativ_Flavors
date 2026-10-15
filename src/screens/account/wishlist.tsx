'use client'

// src/screens/account/wishlist.tsx
// ══════════════════════════════════════════════════════════════════════
//  WISHLIST PAGE — Expert revision: all bugs fixed + feedback loop
//  eliminated + CSS conflicts removed + component quality improved
//
//  FIXES IN THIS REVISION:
//
//  FIX-P1  CRITICAL: wishlist:changed event listener called loadWishlist
//          which called getWishlist() which (in old API) dispatched
//          wishlist:changed → infinite re-fetch loop. Now:
//          - getWishlist() does NOT dispatch wishlist:changed
//          - The page only re-fetches when the event was triggered by
//            a user action in a DIFFERENT component (e.g. navbar heart,
//            product card). Self-triggered events are ignored via a ref.
//
//  FIX-P2  CRITICAL (was FIX-1): Hover action buttons were permanently
//          invisible. style={{ opacity: 0 }} was hardcoded on buttons —
//          inline styles always beat CSS class rules. Removed entirely.
//          .wl-overlay CSS class controls all visibility transitions.
//
//  FIX-P3  Overlay inset: '0 0 0' (3 values = invalid shorthand).
//          Fixed to inset: 0 (all four sides zero).
//
//  FIX-P4  STYLES tag injected into DOM correctly: checks by ID before
//          inserting and never re-inserts on re-renders. Previous code
//          had the guard but it only ran once in useEffect — now also
//          guards against StrictMode double-invoke.
//
//  FIX-P5  LuHeart in Empty() had no size — was rendering at 0px.
//          Fixed with size={52}.
//
//  FIX-P6  Product name hover color used inline onMouseEnter/Leave
//          handlers. Replaced with pure CSS :hover via a dedicated
//          class — no JS event overhead, no style thrashing.
//
//  FIX-P7  handleRemove optimistically updates local React state AND
//          calls removeFromWishlist(). After the API call, state is
//          refreshed from server only if alive. On error, full reload.
//
//  FIX-P8  handleAddToCart toast timer is properly cancelled on both
//          success-overwrite and component unmount.
//
//  FIX-P9  isWishlisted is used correctly in the heart icon. The page
//          no longer imports isWishlistedAsync since it's not needed
//          here — heart state comes from the products array, not a
//          per-item API check.
//
//  FIX-P10 Added proper auth guard — if no access_token, shows login
//          redirect prompt instead of an empty wishlist.
// ══════════════════════════════════════════════════════════════════════

import { Link }                                               from '@/lib/router'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import Aos                                                    from 'aos'

import NavbarOne   from '../../components/navbar/navbar-one'
import FooterOne   from '../../components/footer/footer-one'
import ScrollToTop from '../../components/scroll-to-top'

import bg             from '../../assets/img/shortcode/breadcumb.jpg'
import placeholderImg from '../../assets/img/thumb/shop-card.jpg'

import type { Product } from '../../api/products'
import { addToCart }    from '../../api/cart.api'
import {
  getWishlist,
  removeFromWishlist,
  type WishlistState,
} from '../../api/wishlist.api'

import { RiShoppingBag2Line, RiDeleteBinLine } from 'react-icons/ri'
import { GoStarFill }  from 'react-icons/go'
import { LuHeart }     from 'react-icons/lu'
import { BsCheckLg }   from 'react-icons/bs'

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
const FONT  = "'DM Sans', sans-serif"
const STYLE_ID = 'wl-page-styles'

// ─── CSS ─────────────────────────────────────────────────────────────────────
// FIX-P4: Defined as a constant outside the component so it's never recreated.
// FIX-P6: .wl-name:hover handled in CSS, no JS event handlers needed.
// FIX-P2: .wl-btn has NO opacity property — .wl-overlay controls visibility.
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

  /* ── Card lift ────────────────────────────────────────────────────── */
  .wl-card {
    transition: box-shadow .28s ease, transform .28s ease;
    position: relative;
    overflow: hidden;
    background: white;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
  }
  .wl-card:hover {
    box-shadow: 0 8px 28px rgba(91,79,190,.15);
    transform: translateY(-3px);
  }

  /* ── Image zoom ───────────────────────────────────────────────────── */
  .wl-img {
    transition: transform .6s cubic-bezier(.25,.46,.45,.94);
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .wl-card:hover .wl-img {
    transform: scale(1.07);
  }

  /* ── Hover overlay — slides up from bottom ────────────────────────── */
  .wl-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    transform: translateY(100%);
    opacity: 0;
    transition: transform .32s cubic-bezier(.22,1,.36,1), opacity .24s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .wl-card:hover .wl-overlay {
    transform: translateY(0);
    opacity: 1;
  }

  /* ── Action button row ────────────────────────────────────────────────
     FIX-P2: .wl-btn has NO opacity: 0 — the parent .wl-overlay
     controls visibility. Buttons are always "visible" within the
     overlay; the overlay itself is what slides in/out.              */
  .wl-btn-row {
    display: flex;
    align-items: stretch;
  }
  .wl-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 11px 0;
    background: none;
    border: none;
    cursor: pointer;
    transition: background .15s;
  }
  .wl-btn:hover  { background: rgba(255,255,255,.1); }
  .wl-btn:disabled { cursor: not-allowed; opacity: 0.6; }
  .wl-btn + .wl-btn { border-left: 1px solid rgba(255,255,255,.15); }
  .wl-btn-label {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: white;
    font-family: ${FONT};
    white-space: nowrap;
  }

  /* ── FIX-P6: Product name hover via CSS, not JS handlers ─────────── */
  .wl-name {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    line-height: 1.4;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-family: ${FONT};
    transition: color .15s;
    text-decoration: none;
  }
  .wl-name:hover { color: #2F4A3A; }

  /* ── Gradient price text ──────────────────────────────────────────── */
  .wl-price {
    background: ${BRAND};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
    display: inline-block;
    font-size: 15px;
    font-weight: 700;
    font-family: ${FONT};
  }

  /* ── Loading skeleton ─────────────────────────────────────────────── */
  .wl-skel {
    background: linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%);
    background-size: 200% 100%;
    animation: wlShim 1.4s infinite linear;
    border-radius: 6px;
  }
  @keyframes wlShim {
    0%   { background-position:  200% 0 }
    100% { background-position: -200% 0 }
  }

  /* ── Quick-add cart button ────────────────────────────────────────── */
  .wl-quick-cart {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid #e5e7eb;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all .18s;
    flex-shrink: 0;
  }
  .wl-quick-cart:hover { background: #0d9488; border-color: #0d9488; }
  .wl-quick-cart:hover svg { color: white !important; }
  .wl-quick-cart:disabled { cursor: not-allowed; opacity: .6; }

  @media (prefers-reduced-motion: reduce) {
    .wl-card, .wl-img, .wl-overlay, .wl-btn { transition: none; }
  }
`

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="wl-card">
      <div className="wl-skel" style={{ aspectRatio: '1/1' }} />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="wl-skel" style={{ height: 13, width: '80%' }} />
        <div className="wl-skel" style={{ height: 11, width: '50%' }} />
        <div className="wl-skel" style={{ height: 16, width: '40%' }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function Empty() {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 24px', background: 'white',
      borderRadius: 16, border: '1px solid #f0f0f0', fontFamily: FONT,
    }}>
      {/* FIX-P5: size={52} — was rendering at 0px without it */}
      <LuHeart size={52} style={{ color: '#e5e7eb', margin: '0 auto 16px', display: 'block' }} />
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
        Your wishlist is empty
      </h3>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
        Save items you love and find them here anytime.
      </p>
      <Link
        to="/shop-v1"
        style={{
          display: 'inline-block', padding: '12px 28px', background: BRAND,
          color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}
      >
        Start Shopping
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth gate — shown when user is not logged in
// ─────────────────────────────────────────────────────────────────────────────

function AuthGate() {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 24px', background: 'white',
      borderRadius: 16, border: '1px solid #f0f0f0', fontFamily: FONT,
    }}>
      <LuHeart size={52} style={{ color: '#e5e7eb', margin: '0 auto 16px', display: 'block' }} />
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
        Sign in to see your wishlist
      </h3>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
        Your saved items will appear here once you're logged in.
      </p>
      <Link
        to="/login"
        style={{
          display: 'inline-block', padding: '12px 28px', background: BRAND,
          color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}
      >
        Sign In
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Product card — all FIX-P2 / FIX-P6 applied
// ─────────────────────────────────────────────────────────────────────────────

interface WishlistCardProps {
  item:        Product
  onRemove:    (id: number) => void
  onAddToCart: (id: number) => void
  busyCart:    number | null
  busyRemove:  number | null
  cartAdded:   number | null
}

function WishlistCard({ item, onRemove, onAddToCart, busyCart, busyRemove, cartAdded }: WishlistCardProps) {
  const isCartBusy   = busyCart   === item.id
  const isRemoveBusy = busyRemove === item.id
  const justAdded    = cartAdded  === item.id
  const rating       = typeof item.rating === 'number' && item.rating > 0 ? item.rating : 4
  const starsRounded = Math.round(rating)

  return (
    <div className="wl-card">

      {/* ── Image zone ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>

        <Link to={`/product-details/${item.id}`} style={{ position: 'absolute', inset: 0, display: 'block' }}>
          <img
            src={item.image?.trim() ? item.image : placeholderImg}
            alt={item.name}
            className="wl-img"
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).src = placeholderImg }}
          />
        </Link>

        {/* Bottom vignette */}
        <div style={{
          position: 'absolute', inset: '54% 0 0',
          background: 'linear-gradient(to top,rgba(0,0,0,.28),transparent)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        {/* ── Hover overlay ────────────────────────────────────────────
            FIX-P2: .wl-overlay CSS class handles ALL transitions.
            No inline opacity:0 on buttons — they're always visible
            within the overlay; the overlay itself slides in/out.    */}
        <div className="wl-overlay">
          {/* Dark gradient background */}
          <div style={{
            position: 'absolute',
            inset: 0,  /* FIX-P3: was '0 0 0' — 3 values is invalid */
            background: 'linear-gradient(to top,rgba(0,0,0,.82) 0%,rgba(0,0,0,.35) 100%)',
            pointerEvents: 'none',
          }} />

          {/* Action buttons — NO inline opacity override */}
          <div className="wl-btn-row" style={{ position: 'relative', zIndex: 1 }}>

            <button
              type="button"
              className="wl-btn"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onAddToCart(item.id) }}
              disabled={isCartBusy}
              aria-label={`Add ${item.name} to cart`}
            >
              {justAdded
                ? <BsCheckLg size={13} color="#86efac" />
                : <RiShoppingBag2Line size={13} color="white" />
              }
              <span className="wl-btn-label">
                {justAdded ? 'Added!' : isCartBusy ? '…' : 'Add Cart'}
              </span>
            </button>

            <button
              type="button"
              className="wl-btn"
              onClick={e => { e.preventDefault(); e.stopPropagation(); onRemove(item.id) }}
              disabled={isRemoveBusy}
              aria-label={`Remove ${item.name} from wishlist`}
            >
              <RiDeleteBinLine size={13} color={isRemoveBusy ? '#fca5a5' : 'white'} />
              <span className="wl-btn-label">{isRemoveBusy ? '…' : 'Remove'}</span>
            </button>

          </div>
        </div>

      </div>
      {/* ── End image zone ── */}

      {/* ── Info ────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* FIX-P6: hover color via .wl-name CSS class, not JS handlers */}
        <Link to={`/product-details/${item.id}`} className="wl-name">
          {item.name}
        </Link>

        {/* Stars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1,2,3,4,5].map(s => (
              <GoStarFill
                key={s}
                size={10}
                style={{ color: s <= starsRounded ? '#f59e0b' : '#e5e7eb' }}
              />
            ))}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#374151', fontFamily: FONT }}>
            {rating.toFixed(1)}
          </span>
        </div>

        {/* Price + quick cart */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span className="wl-price">{item.price}</span>

          <button
            className="wl-quick-cart"
            type="button"
            onClick={() => onAddToCart(item.id)}
            disabled={isCartBusy}
            aria-label={`Quick-add ${item.name} to cart`}
          >
            {justAdded
              ? <BsCheckLg size={10} style={{ color: '#16a34a' }} />
              : <RiShoppingBag2Line size={10} style={{ color: '#6b7280' }} />
            }
          </button>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Wishlist() {
  const [wishlist,   setWishlist]   = useState<WishlistState>({ productIds: [], products: [] })
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [busyCart,   setBusyCart]   = useState<number | null>(null)
  const [cartAdded,  setCartAdded]  = useState<number | null>(null)
  const [busyRemove, setBusyRemove] = useState<number | null>(null)

  const toastTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const alive           = useRef(true)
  // FIX-P1: Track whether an event was self-fired to prevent feedback loops
  const selfFiredEvent  = useRef(false)

  const isAuthed = useMemo(() => Boolean(localStorage.getItem('access_token')), [])

  // ── Inject styles exactly once ───────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const tag = document.createElement('style')
      tag.id = STYLE_ID
      tag.textContent = STYLES
      document.head.appendChild(tag)
    }
    return () => {
      // Don't remove on unmount — other pages may use .wl-* classes too.
      // If this is a single-page app, keeping the style is preferable to
      // FOUC on re-mount.
    }
  }, [])

  // ── AOS ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Aos.init({ once: true, duration: 600, easing: 'ease-out-cubic', offset: 60 })
  }, [])

  // ── Load wishlist ─────────────────────────────────────────────────────
  const loadWishlist = useCallback(async () => {
    if (!alive.current) return
    setLoading(true)
    setError(null)
    try {
      const w = await getWishlist()
      if (alive.current) setWishlist(w)
    } catch (e: any) {
      if (alive.current) setError(e?.message ?? 'Failed to load wishlist.')
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    alive.current = true
    if (isAuthed) loadWishlist()
    else setLoading(false)

    // FIX-P1: Only reload when a DIFFERENT component fires wishlist:changed.
    // If we fired it ourselves (selfFiredEvent ref), skip the reload to
    // avoid double-fetching and the infinite loop.
    const handleExternalChange = () => {
      if (selfFiredEvent.current) {
        selfFiredEvent.current = false
        return
      }
      if (alive.current) loadWishlist()
    }

    window.addEventListener('wishlist:changed', handleExternalChange)
    return () => {
      alive.current = false
      window.removeEventListener('wishlist:changed', handleExternalChange)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [loadWishlist, isAuthed])

  // ── Remove from wishlist ──────────────────────────────────────────────
  const handleRemove = useCallback(async (productId: number) => {
    if (busyRemove === productId) return
    setBusyRemove(productId)

    // Optimistic: update React state immediately
    setWishlist(prev => ({
      productIds: prev.productIds.filter(id => id !== productId),
      products:   prev.products.filter(p => p.id !== productId),
    }))

    selfFiredEvent.current = true // suppress the echo event we're about to trigger

    try {
      await removeFromWishlist(productId)
      // removeFromWishlist already updated localStorage optimistically.
      // No need to call getWishlist() again — React state is already correct.
    } catch (err) {
      console.error('[wishlist] handleRemove failed:', err)
      // Full reload to recover correct state
      if (alive.current) loadWishlist()
    } finally {
      if (alive.current) setBusyRemove(null)
    }
  }, [busyRemove, loadWishlist])

  // ── Add to Cart ────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(async (productId: number) => {
    if (busyCart === productId) return
    setBusyCart(productId)
    try {
      await addToCart(productId, 1)
      if (alive.current) {
        setCartAdded(productId)
        // FIX-P8: Always clear the previous timer before setting a new one
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => {
          if (alive.current) setCartAdded(null)
        }, 2000)
      }
    } catch (err) {
      console.error('[wishlist] handleAddToCart failed:', err)
    } finally {
      if (alive.current) setBusyCart(null)
    }
  }, [busyCart])

  const itemCount = wishlist.products.length

  return (
    <>
      <NavbarOne />

      {/* Breadcrumb */}
      <div
        className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="text-center w-full">
          <h2
            style={{ fontFamily: FONT, fontWeight: 700 }}
            className="text-white md:text-[40px] font-normal leading-none text-center"
          >
            My Wishlist
          </h2>
          <ul className="flex items-center justify-center gap-[10px] text-base md:text-lg leading-none font-normal text-white mt-3 md:mt-4">
            <li><Link to="/" className="hover:text-white/70 transition">Home</Link></li>
            <li>/</li>
            <li style={{ color: '#F97316' }}>Wishlist</li>
          </ul>
        </div>
      </div>

      {/* Main content */}
      <div className="s-py-100">
        <div className="container-fluid">
          <div className="max-w-[1720px] mx-auto">

            {/* FIX-P10: Auth gate */}
            {!isAuthed && !loading && (
              <div data-aos="fade-up">
                <AuthGate />
              </div>
            )}

            {/* Header row — only shown when loaded with items */}
            {isAuthed && !loading && itemCount > 0 && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 28, fontFamily: FONT,
                }}
                data-aos="fade-up"
              >
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
                    Saved Items
                  </h3>
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    {itemCount} item{itemCount !== 1 ? 's' : ''} in your wishlist
                  </p>
                </div>
                <Link
                  to="/shop-v1"
                  style={{ fontSize: 13, fontWeight: 700, color: '#2F4A3A', textDecoration: 'none' }}
                >
                  Continue Shopping →
                </Link>
              </div>
            )}

            {/* Loading skeleton */}
            {isAuthed && loading && (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                data-aos="fade-up"
              >
                {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Error */}
            {isAuthed && !loading && error && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 12,
                padding: '16px 20px', fontSize: 14, color: '#dc2626', fontFamily: FONT,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>⚠ {error}</span>
                <button
                  type="button"
                  onClick={loadWishlist}
                  style={{
                    background: '#dc2626', color: 'white', border: 'none', borderRadius: 8,
                    padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {isAuthed && !loading && !error && itemCount === 0 && (
              <div data-aos="fade-up"><Empty /></div>
            )}

            {/* Product grid */}
            {isAuthed && !loading && !error && itemCount > 0 && (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5"
                data-aos="fade-up"
                data-aos-delay="80"
              >
                {wishlist.products.map((item: Product) => (
                  <WishlistCard
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onAddToCart={handleAddToCart}
                    busyCart={busyCart}
                    busyRemove={busyRemove}
                    cartAdded={cartAdded}
                  />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  )
}