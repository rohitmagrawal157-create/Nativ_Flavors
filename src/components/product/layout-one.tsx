'use client'

// src/components/product/layout-one.tsx  — Native Flavours
// =============================================================================
//  FIXES IN v5.2 (vs v5.1):
//
//  FIX-QV1  inf-ov had no pointer-events restoration on hover.
//           Added pointer-events:none at rest, pointer-events:auto on hover
//           so buttons inside the overlay are actually clickable.
//
//  FIX-QV2  The Quick View button's onClick={()=>setQv(true)} was correct
//           but the overlay z-index was competing with the card's
//           overflow:hidden. Fixed by ensuring z-index hierarchy:
//           overlay(z-20) < heart(z-30) < QV modal via createPortal(z-99999)
//
//  FIX-QV3  QV modal now renders at z-index:99999 (was z-[9999]) to ensure
//           it sits above all other fixed elements including NavbarOne(z-1000)
//
//  ALL v5.1 FIXES RETAINED:
//  FIX-A  Info zone 12px horizontal padding
//  FIX-B  ₹ rupee throughout
//  FIX-C  Price row: sale price + MRP strikethrough + discount pill + savings
//  FIX-D  Card border-radius 8px
//
//  ALL ORIGINAL API LOGIC PRESERVED (unchanged):
//  · isWishlisted() + toggleWishlist() + addToCart(item.id, 1)
//  · busy / wished / notice state + disabled checks
// =============================================================================

import { useEffect, useRef, useState }  from 'react'
import { createPortal }                  from 'react-dom'
import { GoStarFill }                    from 'react-icons/go'
import { LuEye, LuHeart, LuX }          from 'react-icons/lu'
import { RiShoppingBag2Line }            from 'react-icons/ri'
import { BsCheckLg }                     from 'react-icons/bs'
import { Link }                          from '@/lib/router'
import ProductHoverPhotos                from '@/components/product/hover-photos'
import { addToCart }                     from '../../api/cart.api'
import { isWishlisted, isWishlistedAsync, toggleWishlist }  from '../../api/wishlist.api'
import placeholderImg from '../../assets/img/thumb/shop-card.jpg'

// ── Item interface ────────────────────────────────────────────────────────────
interface Item {
  id:             number
  image:          string
  images?:        string[]
  tag:            string
  price:          string
  name:           string
  rating?:        number
  originalPrice?: string
  discount?:      number
}

// ── Brand tokens ──────────────────────────────────────────────────────────────
const B = {
  brandGrad: 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)',
  ctaGrad:   'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)',
  discGrad:  'linear-gradient(135deg,#4E6B58,#6E736F)',
  purple:    '#2F4A3A',
  red:       '#4E6B58',
  orange:    '#6E736F',
  teal:      '#5E7266',
  green:     '#3D5C4A',
  bg:        '#F6F3EE',
  bgSoft:    '#F6F3EE',
  border:    '#E4E0D8',
  text:      '#2F4A3A',
  body:      '#6E736F',
  muted:     '#6E736F',
  faint:     '#8A948C',
  yellow:    '#8A948C',
}

// ── Tag colour map ────────────────────────────────────────────────────────────
const TAG_MAP: Record<string, string> = {
  'Sale':'#4E6B58','Hot Sale':'#4E6B58','Hot':'#3D5C4A','10% OFF':'#5E7266',
  'New Arrival':'#2F4A3A','NEW':'#2F4A3A','New':'#2F4A3A',
  'Bestseller':'#6E736F','Premium':'#2F4A3A','Luxury':'#1E3328',
  'Handcrafted':'#3D5C4A','Handpainted':'#5C7A66',
  'Modern':'#4E6B58','Vintage':'#6E736F','Eco-Friendly':'#5E7266',
  'Original':'#2F4A3A','Print':'#5E7266','Set of 3':'#6E736F',
  'Original Oil':'#1E3328','Contemporary':'#6E736F','Spiritual':'#4E6B58',
  'Folk Art':'#5C7A66','Tanjore':'#3A5646','Zen':'#5E7266',
  'Kalamkari':'#24382C','Dreamy':'#2F4A3A','Urban':'#6E736F',
  'Nature':'#3D5C4A','Trendy':'#4E6B58','Kids':'#7D8F82',
  'Custom':'#6E736F','Smart':'#5E7266','Furniture':'#1E3328',
  'Ambience':'#2F4A3A','Educational':'#3D5C4A','Wellness':'#5E7266',
  'RGB':'#2F4A3A','Office':'#6E736F','Commercial':'#4E6B58','Décor':'#3A5646',
}
const tagColor = (t: string) => TAG_MAP[t] ?? B.muted

const SALE_TAGS = new Set(['Sale','Hot Sale','10% OFF','Hot','Bestseller'])

// ── Price helpers ─────────────────────────────────────────────────────────────
function parseNum(p: string): number {
  const n = parseFloat(String(p).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}
function fmtRupee(p: string | number): string {
  const num = typeof p === 'number' ? p : parseNum(String(p))
  if (num === 0) return typeof p === 'string' ? p : '₹0'
  return '₹' + num.toLocaleString('en-IN')
}
function computeMrp(price: string, discountPct = 20): string {
  const num = parseNum(price)
  if (num === 0) return ''
  return fmtRupee(Math.round(num / (1 - discountPct / 100)))
}

// ── CSS injection (once) ──────────────────────────────────────────────────────
let _css = false
function injectCSS() {
  if (_css || typeof document === 'undefined') return
  const s = document.createElement('style')
  s.id = 'inf-v52-styles'
  s.textContent = `
@keyframes infPop{0%{transform:scale(1)}38%{transform:scale(1.52)}65%{transform:scale(0.86)}100%{transform:scale(1)}}
.inf-pop{animation:infPop .36s cubic-bezier(.36,.07,.19,.97) both}

/* ── FIX-QV1: pointer-events:none at rest, restored on hover ── */
.inf-cw .inf-ov{
  transform:translateY(100%);
  opacity:0;
  pointer-events:none;          /* FIX-QV1: not clickable when hidden */
  transition:transform .34s cubic-bezier(0.22,1,0.36,1),opacity .26s ease;
}
.inf-cw:hover .inf-ov{
  transform:translateY(0%);
  opacity:1;
  pointer-events:auto;          /* FIX-QV1: restored when visible */
}

/* Staggered button entrance */
.inf-cw .inf-ob{opacity:0;transform:translateY(5px);transition:opacity .22s ease,transform .22s ease}
.inf-cw:hover .inf-ob{opacity:1;transform:translateY(0)}
.inf-cw:hover .inf-ob:nth-child(1){transition-delay:0ms}
.inf-cw:hover .inf-ob:nth-child(2){transition-delay:58ms}
.inf-cw:hover .inf-ob:nth-child(3){transition-delay:116ms}

/* Button gradient fill on hover */
.inf-ob{position:relative;overflow:hidden;cursor:pointer}
.inf-ob::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%);opacity:0;transition:opacity .22s ease;z-index:0}
.inf-ob:hover::before{opacity:1}
.inf-ob>*{position:relative;z-index:1}

/* Image zoom */
.inf-cw .inf-pi{transition:transform .65s cubic-bezier(0.25,0.46,0.45,0.94)}
.inf-cw:hover .inf-pi{transform:scale(1.07)}

/* Card lift */
.inf-cw{transition:box-shadow .28s ease,transform .28s ease,border-color .2s ease}
.inf-cw:hover{box-shadow:0 8px 32px rgba(91,79,190,0.16);transform:translateY(-2px);border-color:rgba(91,79,190,0.18)!important}

/* Bottom accent bar */
.inf-bar{transform:scaleX(0);transform-origin:left;transition:transform .35s cubic-bezier(0.22,1,0.36,1)}
.inf-cw:hover .inf-bar{transform:scaleX(1)}

/* Toast */
@keyframes infTin{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
@keyframes infTout{from{opacity:1}to{opacity:0}}
.inf-tin{animation:infTin .2s ease forwards}
.inf-tout{animation:infTout .45s ease 1.9s forwards}

/* Gradient price */
.inf-price{
  background:linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;color:transparent;
}
/* MRP strikethrough */
.inf-mrp{text-decoration:line-through;color:#9CA3AF;font-size:12px;font-weight:400;line-height:1}
/* Discount pill */
.inf-disc{
  display:inline-flex;align-items:center;justify-content:center;
  padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;
  letter-spacing:0.08em;text-transform:uppercase;color:#fff;line-height:1;
  background:linear-gradient(135deg,#E8314A,#F97316);flex-shrink:0;
}
  `
  document.head.appendChild(s)
  _css = true
}

// ── Quick View Modal ──────────────────────────────────────────────────────────
// FIX-QV3: z-index raised to 99999 — above NavbarOne(1000), MegaMenu(8999)
function QV({ item, wished, busy, cartAdded, onClose, onCart, onWish }: {
  item: Item; wished: boolean; busy: null | 'cart' | 'wishlist'
  cartAdded: boolean; onClose(): void; onCart(): void; onWish(): void
}) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const tc       = tagColor(item.tag)
  const isSale   = SALE_TAGS.has(item.tag)
  const discPct  = item.discount ?? (isSale ? 20 : 0)
  const mrpRaw   = item.originalPrice ?? (discPct > 0 ? computeMrp(item.price, discPct) : '')
  const saleFmt  = fmtRupee(item.price)
  const mrpFmt   = mrpRaw ? fmtRupee(mrpRaw) : ''
  const saving   = mrpRaw ? fmtRupee(Math.round(parseNum(mrpRaw) - parseNum(item.price))) : ''
  const rating   = item.rating ?? 4

  const handleQtyChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta))
  }

  const handleAddToCart = async () => {
    if (isAdding) return
    setIsAdding(true)
    try {
      // Add the selected quantity
      await addToCart(item.id, quantity)
      // Optionally show a success message or close modal
      onCart() // triggers the parent's toast and cart count update
      setTimeout(() => onClose(), 800) // auto close after adding
    } catch (err) {
      console.error('Add to cart failed', err)
    } finally {
      setIsAdding(false)
    }
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16,
          width: '100%', maxWidth: 920,
          maxHeight: '92vh', overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.96)', border: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
          aria-label="Close"
        >
          <LuX size={15} color="#374151" />
        </button>

        {/* Left – Image */}
        <div style={{
          width: '45%', minWidth: '45%', flexShrink: 0,
          background: '#F9FAFB', overflow: 'hidden',
          borderRadius: '16px 0 0 16px', position: 'relative',
        }}>
          <img
            src={item.image || placeholderImg}
            alt={item.name}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholderImg }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '1/1', display: 'block' }}
          />
          <span style={{
            position: 'absolute', top: 14, left: 14,
            background: tc, color: '#fff',
            fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
            textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}>
            {item.tag}
          </span>
          {discPct > 0 && (
            <span style={{
              position: 'absolute', top: 42, left: 14,
              background: B.discGrad, color: '#fff',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20,
            }}>
              -{discPct}% OFF
            </span>
          )}
        </div>

        {/* Right – Details */}
        <div style={{ flex: 1, padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>
            INFINITY PRINT &amp; SIGNAGE
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 400, color: '#111827', margin: '0 0 14px', lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>
            {item.name}
          </h3>

          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 18 }}>
            {[1,2,3,4,5].map(s => (
              <GoStarFill key={s} size={14} color={s <= rating ? B.yellow : '#E5E7EB'} />
            ))}
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginLeft: 5 }}>{rating.toFixed(1)}</span>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>(1,230 reviews)</span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span className="inf-price" style={{ fontSize: 30, fontWeight: 800 }}>{saleFmt}</span>
            {mrpFmt && <span className="inf-mrp" style={{ fontSize: 16 }}>{mrpFmt}</span>}
            {discPct > 0 && <span className="inf-disc">-{discPct}%</span>}
          </div>
          {saving && (
            <p style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginBottom: 20 }}>
              🎉 You save {saving} on this order
            </p>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #F3F4F6', margin: '4px 0 20px' }} />

          {/* Meta */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4 }}>Category</div>
              <span style={{ background: tc, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{item.tag}</span>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4 }}>SKU</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>INF-{String(item.id).padStart(5, '0')}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4 }}>Stock</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#22C55E', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                In Stock
              </div>
            </div>
          </div>

          {/* Quantity Selector (now functional) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF' }}>Qty</span>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: 24 }}>
              <button
                onClick={() => handleQtyChange(-1)}
                style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#374151' }}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{quantity}</span>
              <button
                onClick={() => handleQtyChange(1)}
                style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#374151' }}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button
              onClick={handleAddToCart}
              disabled={isAdding || busy === 'cart'}
              style={{
                flex: 1, height: 48,
                background: cartAdded ? '#22C55E' : B.brandGrad,
                border: 'none', borderRadius: 24, color: '#fff',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
                textTransform: 'uppercase', cursor: (isAdding || busy === 'cart') ? 'not-allowed' : 'pointer',
                opacity: (isAdding || busy === 'cart') ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s ease', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {cartAdded ? <><BsCheckLg size={14} /> Added to Cart</> : <><RiShoppingBag2Line size={16} /> Add to Cart</>}
            </button>
            <button
              onClick={onWish}
              disabled={busy === 'wishlist'}
              style={{
                width: 48, height: 48, flexShrink: 0,
                border: `1.5px solid ${wished ? B.red : '#E5E7EB'}`,
                borderRadius: '50%', background: wished ? '#FFF0F0' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: busy === 'wishlist' ? 'not-allowed' : 'pointer',
                opacity: busy === 'wishlist' ? 0.6 : 1, transition: 'all 0.2s',
              }}
            >
              <LuHeart size={18} color={wished ? B.red : '#9CA3AF'} fill={wished ? B.red : 'none'} />
            </button>
          </div>

          <Link
            to={`/product-details/${item.id}`} onClick={onClose}
            style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', textDecoration: 'underline', textUnderlineOffset: 3 }}
            onMouseEnter={e => (e.currentTarget.style.color = B.purple)}
            onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
          >
            View full product details →
          </Link>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main Card ─────────────────────────────────────────────────────────────────
export default function LayoutOne({ item }: { item: Item }) {
  injectCSS()

  const [wished,    setWished]    = useState(false)
  const [busy,      setBusy]      = useState<null | 'cart' | 'wishlist'>(null)
  const [notice,    setNotice]    = useState<string | null>(null)
  const [cartAdded, setCartAdded] = useState(false)
  const [heartKey,  setHeartKey]  = useState(0)
  const [qv,        setQv]        = useState(false)
  const [noticeOut, setNoticeOut] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Wishlist init — unchanged
  useEffect(() => {
    let alive = true
    // Prefer server-verified async check; fall back to sync if unavailable
    try {
      isWishlistedAsync(item.id).then(v => { if (alive) setWished(v) }).catch(() => {})
    } catch {
      try { const v = isWishlisted(item.id); if (alive) setWished(v) } catch {}
    }
    return () => { alive = false }
  }, [item.id])

  const toast = (msg: string) => {
    setNotice(msg); setNoticeOut(false)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { setNoticeOut(true); setTimeout(() => setNotice(null), 480) }, 2000)
  }

  // Wishlist toggle — unchanged
  const handleWish = async () => {
    if (busy) return
    setBusy('wishlist'); setHeartKey(k => k + 1)
    try {
      const r = await toggleWishlist(item.id)
      const w = r.productIds.includes(item.id)
      setWished(w); toast(w ? '♥ Saved to wishlist' : 'Removed from wishlist')
    } catch { toast('Could not update wishlist') }
    finally { setBusy(null) }
  }

  // Add to cart — unchanged
  const handleCart = async () => {
    if (busy) return
    setBusy('cart')
    try {
      await addToCart(item.id, 1)
      setCartAdded(true); toast('✓ Added to cart')
      setTimeout(() => setCartAdded(false), 1600)
    } catch { toast('Could not add to cart') }
    finally { setBusy(null) }
  }

  const isSaleTag  = SALE_TAGS.has(item.tag)
  const discPct    = item.discount ?? (isSaleTag ? 20 : 0)
  const mrpRaw     = item.originalPrice ?? (discPct > 0 ? computeMrp(item.price, discPct) : '')
  const salePrice  = fmtRupee(item.price)
  const mrpPrice   = mrpRaw ? fmtRupee(mrpRaw) : ''
  const showPricing = discPct > 0 && mrpPrice !== ''
  const ratingNum   = item.rating ?? 4
  const tc          = tagColor(item.tag)

  return (
    <>
      {/* FIX-QV2/QV3: QV modal always in body via createPortal at z-99999 */}
      {qv && (
        <QV
          item={item} wished={wished} busy={busy} cartAdded={cartAdded}
          onClose={() => setQv(false)} onCart={handleCart} onWish={handleWish}
        />
      )}

      {/* ══ CARD ══ */}
      <div
        className="inf-cw relative flex flex-col overflow-hidden"
        style={{ background: B.bg, border: `1px solid ${B.border}`, borderRadius: 8 }}
      >
        {/* Toast */}
        {notice && (
          <div
            className={`absolute top-0 inset-x-0 z-50 text-white text-[9px] font-bold tracking-[0.12em] uppercase text-center py-[6px] leading-none pointer-events-none select-none ${noticeOut ? 'inf-tout' : 'inf-tin'}`}
            style={{ background: notice.includes('ould') ? B.red : B.green }}
          >
            {notice}
          </div>
        )}

        {/* ── IMAGE ZONE ── */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '1/1', borderRadius: '8px 8px 0 0' }}>

          <Link to={`/product-details/${item.id}`} className="absolute inset-0 block" style={{ background: B.bgSoft }}>
            <ProductHoverPhotos images={item.images?.length ? item.images : [item.image || placeholderImg]} alt={item.name} />
          </Link>

          {/* Vignette */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{ height: '46%', background: 'linear-gradient(to top,rgba(0,0,0,0.34),transparent)' }} />

          {/* Tag badge */}
          <span className="absolute top-0 left-0 z-20 text-white text-[9px] font-bold tracking-[0.14em] uppercase px-[10px] py-[5px] leading-none select-none"
            style={{ background: tc, borderRadius: '8px 0 4px 0' }}>
            {item.tag}
          </span>

          {/* Discount badge */}
          {showPricing && (
            <span className="absolute z-20 text-white text-[8px] font-bold tracking-[0.1em] uppercase px-[10px] py-[4px] leading-none select-none"
              style={{ background: B.discGrad, top: 26, left: 0, borderRadius: '0 4px 4px 0' }}>
              -{discPct}% OFF
            </span>
          )}

          {/* Heart — always visible */}
          <button
            key={heartKey} type="button" onClick={handleWish}
            disabled={busy === 'wishlist'}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`absolute top-[10px] right-[10px] z-30 w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 ${heartKey > 0 ? 'inf-pop' : ''} ${busy === 'wishlist' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
            style={{
              background: wished ? B.brandGrad : B.bg,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              border: `1px solid ${wished ? 'transparent' : B.border}`,
            }}
          >
            <LuHeart style={{ width: 12, height: 12 }} color={wished ? '#fff' : B.muted} fill={wished ? '#fff' : 'none'} />
          </button>

          {/* ── HOVER OVERLAY — FIX-QV1: pointer-events managed by CSS ── */}
          <div className="inf-ov absolute inset-x-0 bottom-0 z-20">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.42) 100%)' }} />
            <div className="relative flex items-stretch">

              {/* Wishlist */}
              <button type="button" onClick={handleWish} disabled={busy === 'wishlist'} aria-label="Wishlist"
                className={`inf-ob flex-1 flex flex-col items-center justify-center gap-[4px] py-[11px] border-r ${busy === 'wishlist' ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                <LuHeart style={{ width: 14, height: 14, flexShrink: 0 }} color={wished ? '#FCA5A5' : '#fff'} fill={wished ? '#FCA5A5' : 'none'} />
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap' }}>
                  {wished ? 'Saved' : 'Wishlist'}
                </span>
              </button>

              {/* Add Cart */}
              <button type="button" onClick={handleCart} disabled={busy === 'cart'} aria-label="Add to cart"
                className={`inf-ob flex-1 flex flex-col items-center justify-center gap-[4px] py-[11px] border-r ${busy === 'cart' ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                {cartAdded
                  ? <BsCheckLg style={{ width: 14, height: 14, flexShrink: 0, color: '#86EFAC' }} />
                  : <RiShoppingBag2Line style={{ width: 14, height: 14, flexShrink: 0, color: '#fff' }} />}
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap' }}>
                  {cartAdded ? 'Added!' : 'Add Cart'}
                </span>
              </button>

              {/* Quick View — FIX-QV1: clickable because pointer-events:auto on hover */}
              <button
                type="button"
                onClick={() => setQv(true)}
                aria-label="Quick view"
                className="inf-ob quick-view flex-1 flex flex-col items-center justify-center gap-[4px] py-[11px]"
              >
                <LuEye style={{ width: 14, height: 14, flexShrink: 0, color: '#fff' }} />
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap' }}>
                  Quick View
                </span>
              </button>

            </div>
          </div>

        </div>
        {/* ── END IMAGE ZONE ── */}

        {/* ── INFO ZONE ── */}
        <div style={{ padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Product name */}
          <Link to={`/product-details/${item.id}`} className="block" style={{ marginBottom: 8 }}>
            <h5
              style={{
                fontSize: 14, fontWeight: 500, lineHeight: 1.45, color: B.body,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden', transition: 'color .18s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = B.purple)}
              onMouseLeave={e => (e.currentTarget.style.color = B.body)}
            >
              {item.name}
            </h5>
          </Link>

          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 10 }}>
            {[1,2,3,4,5].map(s => (
              <GoStarFill key={s} style={{ width: 11, height: 11, color: s <= ratingNum ? B.yellow : '#D1D5DB' }} />
            ))}
            <span style={{ fontSize: 12, fontWeight: 700, color: B.body, marginLeft: 3, lineHeight: 1 }}>{ratingNum.toFixed(1)}</span>
            <span style={{ fontSize: 11, color: B.faint, lineHeight: 1 }}>( 1,230 )</span>
          </div>

          {/* Price row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, flex: 1, minWidth: 0 }}>
              <span className="inf-price" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1 }}>{salePrice}</span>
              {showPricing && <span className="inf-mrp" style={{ fontSize: 12 }}>{mrpPrice}</span>}
              {showPricing && <span className="inf-disc">-{discPct}%</span>}
            </div>
            {/* Cart icon */}
            <button
              type="button" onClick={handleCart} disabled={busy === 'cart'}
              aria-label="Add to cart"
              style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${B.border}`,
                background: cartAdded ? B.green : 'transparent',
                cursor: busy === 'cart' ? 'not-allowed' : 'pointer',
                opacity: busy === 'cart' ? 0.5 : 1, transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (!cartAdded) {
                  (e.currentTarget as HTMLButtonElement).style.background = B.brandGrad
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
                }
              }}
              onMouseLeave={e => {
                if (!cartAdded) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = B.border
                }
              }}
            >
              {cartAdded
                ? <BsCheckLg style={{ width: 11, height: 11, color: '#fff' }} />
                : <RiShoppingBag2Line style={{ width: 13, height: 13, color: B.muted }} />}
            </button>
          </div>

          {/* Savings */}
          {showPricing && (
            <p style={{ marginTop: 5, fontSize: 10, fontWeight: 600, color: '#16A34A', lineHeight: 1 }}>
              You save {fmtRupee(Math.round(parseNum(mrpRaw || computeMrp(item.price, discPct)) - parseNum(item.price)))}
            </p>
          )}

        </div>
        {/* ── END INFO ZONE ── */}

        {/* Bottom accent bar */}
        <div className="inf-bar absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: 2, background: B.brandGrad, borderRadius: '0 0 8px 8px' }} />

      </div>
    </>
  )
}