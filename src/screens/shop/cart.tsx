'use client'

// src/screens/cart/Cart.tsx
// ══════════════════════════════════════════════════════════════════════
//  CART PAGE — Updated
//  ✦ Free shipping above ₹3,000 (synced with Checkout)
//  ✦ Edit/Delete icon buttons (pencil + trash)
//  ✦ Consistent price calculation matching Checkout page
//  ✦ Platform fee ₹10
//  ✦ Real subtotal from API line.product.price × quantity
// ══════════════════════════════════════════════════════════════════════

import { Link, useNavigate }                        from '@/lib/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Aos                                          from 'aos'
import NavbarOne   from '../../components/navbar/navbar-one'
import FooterOne   from '../../components/footer/footer-one'
import ScrollToTop from '../../components/scroll-to-top'
import bg          from '../../assets/img/shortcode/breadcumb.jpg'
import placeholderImg from '../../assets/img/thumb/shop-card.jpg'
import type { CartState, CartLine } from '../../api/cart.api'
import { getCart, removeFromCartItem, updateCartItem } from '../../api/cart.api'
import { toggleWishlist } from '../../api/wishlist.api'

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND       = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
const BRAND_SOLID = '#2F4A3A'
const FONT        = "'DM Sans', sans-serif"

// ─── Shipping threshold (MUST match Checkout.tsx) ─────────────────────────────
const FREE_SHIPPING_THRESHOLD = 3000
const SHIPPING_FEE            = 99
const PLATFORM_FEE            = 0

// ─── Coupons ──────────────────────────────────────────────────────────────────
const COUPONS: Record<string, { label: string; type: 'percent' | 'fixed'; value: number; minOrder?: number }> = {
  PREPAID10:       { label: '10% off on prepaid',         type: 'percent', value: 0.10 },
  MAKEHOMESPECIAL: { label: '5% off sitewide',            type: 'percent', value: 0.05 },
  NESTTRY:         { label: '₹150 off (min ₹1,500)',       type: 'fixed',   value: 150, minOrder: 1500 },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseMoney(price: unknown): number {
  const n = parseFloat(String(price ?? '').replace(/,/g, '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}
function fmtINR(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}
function lineTotal(line: CartLine): number {
  return parseMoney(line.product.price) * line.quantity
}

const dispatchCartChange = () => window.dispatchEvent(new Event('cart:changed'))

// ─── GradText ─────────────────────────────────────────────────────────────────
function GradText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent', display: 'inline-block' }}>
      {children}
    </span>
  )
}

// ─── Icons (inline SVG — no extra dep) ────────────────────────────────────────
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const IconHeart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const IconTruck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: FONT }}>
      <div style={{ width: 36, height: 36, border: `4px solid ${BRAND_SOLID}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'cartSpin .7s linear infinite', margin: '0 auto 16px' }} />
      <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading your basket…</p>
      <style>{`@keyframes cartSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Empty ────────────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 20, border: '1px solid #f0f0f0', fontFamily: FONT }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
      <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Your basket is empty</p>
      <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>Looks like you haven't added anything yet.</p>
      <Link to="/shop-v1" style={{ display: 'inline-block', padding: '12px 28px', background: BRAND, color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
        Continue Shopping
      </Link>
    </div>
  )
}

// ─── Cart Line Row ────────────────────────────────────────────────────────────
function CartLineRow({ line, onQtyChange, onRemove, onFavourite, isLoading }: {
  line: CartLine
  onQtyChange: (cartId: number, qty: number) => void
  onRemove:    (cartId: number) => void
  onFavourite: (productId: number, cartId: number) => void
  isLoading:   boolean
}) {
  const total     = lineTotal(line)
  const unitPrice = parseMoney(line.product.price)

  return (
    <div style={{
      padding: '20px 24px',
      display: 'flex',
      gap: 16,
      opacity: isLoading ? 0.5 : 1,
      pointerEvents: isLoading ? 'none' : 'auto',
      transition: 'opacity .2s',
      borderBottom: '1px solid #f3f4f6',
      fontFamily: FONT,
    }}>
      {/* Image */}
      <Link to={`/product-details/${line.product.id}`} style={{ flexShrink: 0, display: 'block', borderRadius: 12, overflow: 'hidden', background: '#f9fafb', border: '1px solid #f0f0f0', width: 100, height: 100 }}>
        <img
          src={line.product.image || placeholderImg}
          alt={line.product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s', display: 'block' }}
          onError={e => { (e.currentTarget as HTMLImageElement).src = placeholderImg }}
        />
      </Link>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to={`/product-details/${line.product.id}`} style={{ textDecoration: 'none' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.4, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {line.product.name}
              </h4>
            </Link>
            {line.variantMeta?.color && (
              <p style={{ fontSize: 12, color: '#6b7280' }}>Colour: <strong style={{ color: '#374151' }}>{line.variantMeta.color}</strong></p>
            )}
            {line.variantMeta?.size && (
              <p style={{ fontSize: 12, color: '#6b7280' }}>Size: <strong style={{ color: '#374151' }}>{line.variantMeta.size}</strong></p>
            )}
            {unitPrice > 0 && (
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{fmtINR(unitPrice)} × {line.quantity}</p>
            )}
          </div>

          {/* Price */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, background: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {fmtINR(total)}
            </div>
          </div>
        </div>

        {/* Qty controls + actions */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          {/* Qty stepper */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => onQtyChange(line.id, line.quantity - 1)} disabled={line.quantity <= 1}
              style={{ width: 34, height: 34, background: 'none', border: 'none', cursor: line.quantity <= 1 ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700, color: '#374151', opacity: line.quantity <= 1 ? 0.4 : 1 }}>
              −
            </button>
            <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111827', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', padding: '0 2px', lineHeight: '34px' }}>
              {line.quantity}
            </span>
            <button onClick={() => onQtyChange(line.id, line.quantity + 1)}
              style={{ width: 34, height: 34, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700, color: '#374151' }}>
              +
            </button>
          </div>

          {/* Divider */}
          <span style={{ color: '#e5e7eb' }}>|</span>

          {/* Remove with trash icon */}
          <button onClick={() => onRemove(line.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 6, transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
          >
            <IconTrash /> Remove
          </button>

          <span style={{ color: '#e5e7eb' }}>|</span>

          {/* Move to Wishlist with heart icon */}
          <button onClick={() => onFavourite(line.product.id, line.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 6, transition: 'background .15s', background: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent' }}
          >
            <span style={{ color: BRAND_SOLID }}><IconHeart /></span>
            Move to Wishlist
          </button>

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, border: `2px solid ${BRAND_SOLID}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'cartSpin .7s linear infinite' }} />
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Updating…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Coupon Box ───────────────────────────────────────────────────────────────
function CouponBox({ subtotal, applied, onApply, onRemove }: {
  subtotal: number
  applied:  { code: string; discount: number } | null
  onApply:  (code: string, discount: number) => void
  onRemove: () => void
}) {
  const [input,   setInput]   = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleApply = () => {
    const code = input.trim().toUpperCase()
    if (!code) { setError('Enter a coupon code.'); return }
    const c = COUPONS[code]
    if (!c) { setError('Invalid coupon code.'); setSuccess(null); return }
    if (c.minOrder && subtotal < c.minOrder) { setError(`Minimum order ₹${c.minOrder.toLocaleString('en-IN')} required.`); return }
    const discount = c.type === 'percent' ? subtotal * c.value : c.value
    onApply(code, discount)
    setSuccess(`"${code}" applied — ${fmtINR(Math.round(discount))} off!`)
    setError(null); setInput('')
  }

  if (applied) {
    return (
      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: FONT }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>✓ "{applied.code}" — {fmtINR(Math.round(applied.discount))} saved!</p>
        <button onClick={onRemove} style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 12, fontFamily: FONT }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" placeholder="Enter coupon code" value={input}
          onChange={e => { setInput(e.target.value.toUpperCase()); setError(null); setSuccess(null) }}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          style={{ flex: 1, height: 40, padding: '0 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: FONT, textTransform: 'uppercase' }} />
        <button onClick={handleApply}
          style={{ padding: '0 16px', height: 40, borderRadius: 8, background: BRAND, color: 'white', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: FONT }}>
          Apply
        </button>
      </div>
      {error   && <p style={{ fontSize: 11, marginTop: 6, color: '#ef4444', fontWeight: 500 }}>{error}</p>}
      {success && <p style={{ fontSize: 11, marginTop: 6, color: '#16a34a', fontWeight: 500 }}>{success}</p>}
      {/* Hint chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {Object.entries(COUPONS).map(([code, c]) => (
          <button key={code} onClick={() => { setInput(code); setError(null) }}
            style={{ fontSize: 11, padding: '3px 10px', border: '1px dashed #2F4A3A', borderRadius: 6, background: '#f3f1ff', color: '#2F4A3A', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            {code} <span style={{ fontWeight: 400, opacity: .7 }}>({c.label})</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Order Summary Sidebar ────────────────────────────────────────────────────
function OrderSummary({ lines, subtotal, appliedOffer, onApplyOffer, onRemoveOffer, pincode, setPincode, deliveryMsg, onPincodeCheck, onProceed }: {
  lines:          CartLine[]
  subtotal:       number
  appliedOffer:   { code: string; discount: number } | null
  onApplyOffer:   (code: string, discount: number) => void
  onRemoveOffer:  () => void
  pincode:        string
  setPincode:     (v: string) => void
  deliveryMsg:    string | null
  onPincodeCheck: () => void
  onProceed:      () => void
}) {
  // Shipping: FREE above threshold, else ₹99
  const shipping       = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const couponDiscount = appliedOffer?.discount ?? 0
  const total          = Math.max(0, subtotal + shipping + PLATFORM_FEE - couponDiscount)
  const toFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  return (
    <div style={{ width: 340, flexShrink: 0 }}>
      <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Free shipping progress */}
        {toFreeShipping > 0 && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', padding: '14px 16px', fontFamily: FONT }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <IconTruck />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                Add <strong style={{ color: '#2F4A3A' }}>{fmtINR(toFreeShipping)}</strong> more for FREE shipping!
              </span>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: 6, height: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: BRAND, borderRadius: 6, width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`, transition: 'width .4s ease' }} />
            </div>
          </div>
        )}
        {toFreeShipping === 0 && (
          <div style={{ background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', padding: '12px 16px', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconTruck />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>🎉 You've unlocked FREE shipping!</span>
          </div>
        )}

        {/* Pincode check */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', padding: '16px', fontFamily: FONT }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>📍 Check Delivery</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="6-digit pincode" value={pincode}
              onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && onPincodeCheck()}
              style={{ flex: 1, height: 40, padding: '0 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: FONT }} />
            <button onClick={onPincodeCheck}
              style={{ padding: '0 14px', height: 40, background: BRAND, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
              Check
            </button>
          </div>
          {deliveryMsg && (
            <p style={{ fontSize: 12, marginTop: 6, fontWeight: 500, color: deliveryMsg.includes('✓') ? '#16a34a' : '#ef4444' }}>{deliveryMsg}</p>
          )}
        </div>

        {/* Price breakdown */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', padding: '16px', fontFamily: FONT }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Price Details</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Row label={`MRP (${lines.length} item${lines.length !== 1 ? 's' : ''})`} value={fmtINR(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? 'FREE' : fmtINR(shipping)} valueColor={shipping === 0 ? '#16a34a' : undefined} />
            <Row label="Platform Fee" value={fmtINR(PLATFORM_FEE)} />
            {couponDiscount > 0 && <Row label={`Coupon (${appliedOffer?.code})`} value={`−${fmtINR(couponDiscount)}`} valueColor="#16a34a" />}

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Total Amount</span>
              <span style={{ fontSize: 18, fontWeight: 800, background: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fmtINR(total)}</span>
            </div>
            {couponDiscount > 0 && (
              <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, textAlign: 'right' }}>🎉 You save {fmtINR(couponDiscount)} on this order</p>
            )}
          </div>

          <CouponBox subtotal={subtotal} applied={appliedOffer} onApply={onApplyOffer} onRemove={onRemoveOffer} />

          <button onClick={onProceed}
            style={{ width: '100%', marginTop: 16, height: 48, borderRadius: 24, background: BRAND, color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: FONT, letterSpacing: '0.02em', transition: 'opacity .18s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '.88'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
          >
            Proceed to Checkout →
          </button>
          <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>🔒 Secure &amp; Encrypted Payment</p>
        </div>

        {/* Available Offers */}
        {/* <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', padding: '16px', fontFamily: FONT }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>🏷️ Available Offers</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}> */}
            {/* Free shipping offer row */}
            {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f9fafb', borderRadius: 10 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 2 }}>Free Shipping above {fmtINR(FREE_SHIPPING_THRESHOLD)}</p>
                <p style={{ fontSize: 11, color: '#9ca3af' }}>Auto-applied at checkout</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: subtotal >= FREE_SHIPPING_THRESHOLD ? '#f0fdf4' : '#f3f4f6', color: subtotal >= FREE_SHIPPING_THRESHOLD ? '#16a34a' : '#9ca3af', border: `1px solid ${subtotal >= FREE_SHIPPING_THRESHOLD ? '#bbf7d0' : '#e5e7eb'}` }}>
                {subtotal >= FREE_SHIPPING_THRESHOLD ? '✓ Active' : 'Inactive'}
              </span>
            </div>
            {Object.entries(COUPONS).map(([code, c]) => (
              <div key={code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f9fafb', borderRadius: 10 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{c.label}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', border: '1px dashed #2F4A3A', borderRadius: 4, background: '#f3f1ff', color: '#2F4A3A' }}>{code}</span>
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  )
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: valueColor ?? '#374151' }}>{value}</span>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Cart() {
  const [cart,         setCart]         = useState<CartState>({ lines: [] })
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [actionLoadId, setActionLoadId] = useState<number | null>(null)
  const [pincode,      setPincode]      = useState('')
  const [deliveryMsg,  setDeliveryMsg]  = useState<string | null>(null)
  const [appliedOffer, setAppliedOffer] = useState<{ code: string; discount: number } | null>(null)
  const navigate = useNavigate()

  const refreshCart = useCallback(() => {
    setLoading(true)
    getCart()
      .then(c  => { setCart(c); setError(null) })
      .catch((e: any) => setError(e?.message ?? 'Failed to load cart.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    Aos.init({ once: true, duration: 600 })
    refreshCart()
    window.addEventListener('cart:changed', refreshCart as EventListener)
    return () => window.removeEventListener('cart:changed', refreshCart as EventListener)
  }, [refreshCart])

  const subtotal = useMemo(
    () => cart.lines.reduce((acc, l) => acc + lineTotal(l), 0),
    [cart.lines],
  )

  const handleProceed = useCallback(() => {
    const token = localStorage.getItem('access_token')
    navigate(token ? '/checkout' : '/login?returnUrl=%2Fcheckout')
  }, [navigate])

  const handleQtyChange = useCallback(async (cartId: number, newQty: number) => {
    const qty = Math.max(1, Math.floor(newQty))
    setActionLoadId(cartId)
    try { const next = await updateCartItem(cartId, qty); setCart(next); dispatchCartChange() }
    catch (e) { console.error('qty update failed', e) }
    finally { setActionLoadId(null) }
  }, [])

  const handleRemove = useCallback(async (cartId: number) => {
    setActionLoadId(cartId)
    try { const next = await removeFromCartItem(cartId); setCart(next); dispatchCartChange() }
    catch (e) { console.error('remove failed', e) }
    finally { setActionLoadId(null) }
  }, [])

  const handleFavourite = useCallback(async (productId: number, cartId: number) => {
    setActionLoadId(cartId)
    try {
      await toggleWishlist(productId)
      const next = await removeFromCartItem(cartId)
      setCart(next); dispatchCartChange()
      window.dispatchEvent(new Event('wishlist:changed'))
    } catch (e) { console.error('move to wishlist failed', e) }
    finally { setActionLoadId(null) }
  }, [])

  const handlePincodeCheck = useCallback(() => {
    if (!pincode || pincode.length !== 6) { setDeliveryMsg('Please enter a valid 6-digit pincode.'); return }
    setDeliveryMsg(null)
    setTimeout(() => {
      setDeliveryMsg(parseInt(pincode[0], 10) > 2
        ? '✓ Delivery available. Standard 5–7 business days.'
        : '✗ Delivery not available at this pincode.')
    }, 600)
  }, [pincode])

  return (
    <>
      <NavbarOne />

      <div className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage: `url(${bg})` }}>
        <div className="text-center w-full">
          <h2 className="text-white md:text-[40px] font-normal leading-none" style={{ fontFamily: FONT }}>Your Shopping Basket</h2>
          <ul className="flex items-center justify-center gap-[10px] text-base leading-none font-normal text-white mt-3">
            <li><Link to="/">Home</Link></li>
            <li>/</li>
            <li><GradText>Cart</GradText></li>
          </ul>
        </div>
      </div>

      <div className="s-py-100">
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 16px' }}>

          {loading && <Spinner />}

          {!loading && error && (
            <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', fontSize: 14, color: '#dc2626', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>⚠ {error}</span>
              <button onClick={refreshCart} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Retry</button>
            </div>
          )}

          {!loading && !error && cart.lines.length === 0 && <EmptyCart />}

          {!loading && !error && cart.lines.length > 0 && (
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Left: Cart items */}
              <div style={{ flex: 1, minWidth: 280, background: 'white', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }} data-aos="fade-up">
                {/* Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                    {cart.lines.length} Item{cart.lines.length !== 1 ? 's' : ''} in your basket
                  </h3>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>
                    Subtotal: <strong style={{ color: '#111827' }}>{fmtINR(subtotal)}</strong>
                  </span>
                </div>

                {/* Lines */}
                {cart.lines.map(line => (
                  <CartLineRow
                    key={line.id}
                    line={line}
                    onQtyChange={handleQtyChange}
                    onRemove={handleRemove}
                    onFavourite={handleFavourite}
                    isLoading={actionLoadId === line.id}
                  />
                ))}

                {/* Footer */}
                <div style={{ padding: '12px 24px', borderTop: '1px solid #f3f4f6', fontFamily: FONT }}>
                  <Link to="/shop-v1" style={{ fontSize: 13, fontWeight: 600, color: '#2F4A3A', textDecoration: 'none' }}>
                    ← Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Right: Order Summary */}
              <OrderSummary
                lines={cart.lines}
                subtotal={subtotal}
                appliedOffer={appliedOffer}
                onApplyOffer={(code, discount) => setAppliedOffer({ code, discount })}
                onRemoveOffer={() => setAppliedOffer(null)}
                pincode={pincode}
                setPincode={setPincode}
                deliveryMsg={deliveryMsg}
                onPincodeCheck={handlePincodeCheck}
                onProceed={handleProceed}
              />
            </div>
          )}
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  )
}