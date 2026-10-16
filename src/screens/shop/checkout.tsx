// @ts-nocheck
'use client'

// src/screens/Checkout.tsx
// ══════════════════════════════════════════════════════════════════════
//  CHECKOUT — Smart address flow + Mobile responsive
//
//  ADDRESS FLOW:
//  ① First-time / no saved addresses → form shown immediately
//  ② Has saved addresses → show address CARDS only (form hidden)
//     · Click a card   → card gets selected + form slides open below
//     · Click "Add New" → blank form opens (no card selected)
//     · Click "×" on open form → form collapses back
//  ③ Shipping Method section lives BELOW the billing form (left col)
//
//  MOBILE:
//  · ≤1023px: single column, summary panel on top
//  · ≤639px:  billing form fields go full-width
//  · All touch targets ≥ 44px
// ══════════════════════════════════════════════════════════════════════

import { Link, useNavigate }                        from '@/lib/router'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth }                                  from '../../hooks/useAuth'
import Aos                                          from 'aos'

import NavbarOne   from '../../components/navbar/navbar-one'
import FooterOne   from '../../components/footer/footer-one'
import ScrollToTop from '../../components/scroll-to-top'
import bg          from '../../assets/img/shortcode/breadcumb.jpg'
import placeholder from '../../assets/img/thumb/shop-card.jpg'

import type { CartState } from '../../api/cart.api'
import { getCheckout }    from '../../api/cart.api'
import { apiClient }      from '../../api/client'

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
const PRI   = '#2F4A3A'
const FONT  = "'DM Sans', sans-serif"

const FREE_SHIP_THRESHOLD = 3000
const SHIP_FEE            = 99

// ─── Responsive CSS ───────────────────────────────────────────────────────────
const CSS = `
  @keyframes chkSpin  { to { transform: rotate(360deg); } }
  @keyframes chkSlide { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

  /* Layout */
  .chk-layout { display:grid; grid-template-columns:1fr 380px; gap:24px; align-items:flex-start; }
  .chk-right  { order:2; }
  .chk-left   { order:1; }

  @media (max-width:1023px) {
    .chk-layout { grid-template-columns:1fr; }
    .chk-right  { order:1; }
    .chk-left   { order:2; }
    .chk-sticky { position:static !important; top:auto !important; }
  }

  /* Billing form 2-col → 1-col */
  .chk-2col { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width:639px) { .chk-2col { grid-template-columns:1fr; } }

  /* Step badge label hidden on xs */
  .chk-step-lbl { display:inline; }
  @media (max-width:479px) { .chk-step-lbl { display:none; } }

  /* Card padding */
  .chk-card { padding:24px; }
  @media (max-width:479px) { .chk-card { padding:16px; } }

  /* Address card */
  .chk-addr {
    padding:12px 14px; border-radius:10px; cursor:pointer;
    display:flex; align-items:flex-start; justify-content:space-between; gap:8px;
    transition:all .18s ease; border:1.5px solid #e5e7eb; background:#fafafa;
  }
  .chk-addr:hover { border-color:#c4bcf0; background:#f7f5ff; }
  .chk-addr.selected { border-color:#2F4A3A; background:#f3f1ff; }

  /* Form slide-in */
  .chk-form-open { animation: chkSlide .22s ease both; }

  /* Input */
  .chk-inp { height:46px; }
  @media (max-width:479px) { .chk-inp { height:44px; font-size:13px !important; } }

  /* CTA */
  .chk-cta { height:50px; font-size:15px; }
  @media (max-width:479px) { .chk-cta { height:48px; font-size:14px; } }

  /* Cart item image */
  .chk-img { width:52px; height:52px; }
  @media (max-width:479px) { .chk-img { width:44px; height:44px; } }

  /* Icon buttons */
  .chk-icon-btn {
    width:30px; height:30px; border-radius:6px; border:1px solid #e5e7eb;
    background:white; cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:all .15s; flex-shrink:0;
  }
  .chk-icon-btn:hover { border-color:#2F4A3A; background:#f3f1ff; }
  .chk-icon-btn.danger:hover { border-color:#ef4444; background:#fef2f2; }

  /* Shipping option */
  .chk-ship-opt {
    display:flex; align-items:center; justify-content:space-between;
    padding:13px 14px; border:1.5px solid #e5e7eb; border-radius:10px;
    background:white; cursor:pointer; transition:all .15s; gap:10px;
  }
  .chk-ship-opt.active { border-color:#2F4A3A; background:#f3f1ff; }
  .chk-ship-opt:hover  { border-color:#c4bcf0; }

  /* Payment option */
  .chk-pay-opt {
    display:flex; align-items:center; gap:12px;
    padding:12px 14px; border:1.5px solid #e5e7eb; border-radius:10px;
    background:white; cursor:pointer; transition:all .15s;
  }
  .chk-pay-opt.active { border-color:#2F4A3A; background:#f3f1ff; }
  .chk-pay-opt:hover  { border-color:#c4bcf0; }

  /* Progress bar */
  .chk-prog-bar {
    height:6px; border-radius:6px; background:#f3f4f6; overflow:hidden; margin-top:6px;
  }
  .chk-prog-fill { height:100%; border-radius:6px; background:${BRAND}; transition:width .45s ease; }
`
let _css = false
function injectCSS() {
  if (_css || typeof document === 'undefined') return
  const s = document.createElement('style'); s.id = 'chk-css'; s.textContent = CSS
  document.head.appendChild(s); _css = true
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseMoney = (v: unknown) => { const n = parseFloat(String(v ?? '').replace(/,/g,'').replace(/[^0-9.]/g,'')); return Number.isFinite(n) ? n : 0 }
const fmtINR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  const sid   = localStorage.getItem('SessionId') || localStorage.getItem('session-id') || ''
  const h: Record<string,string> = { Accept:'application/json','Content-Type':'application/json','session-id':sid,SessionId:sid }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface BillingInfo { fullName:string; email:string; phone:string; city:string; pincode:string; addressLine1:string; addressLine2:string; note:string }
interface SavedAddress extends BillingInfo { id:number }

const EMPTY: BillingInfo = { fullName:'', email:'', phone:'', city:'Mumbai', pincode:'', addressLine1:'', addressLine2:'', note:'' }
const CITIES = ['Mumbai','Delhi','Bengaluru','Hyderabad','Ahmedabad','Chennai','Kolkata','Surat','Pune','Jaipur','Lucknow','Kanpur','Nagpur','Indore','Thane','Bhopal','Visakhapatnam','Patna','Vadodara','Aurangabad','Nashik','Meerut','Faridabad','Rajkot','Varanasi','Agra','Amritsar','Coimbatore','Kochi']
const COUPONS: Record<string,{type:'percent'|'fixed';value:number;label:string;minOrder?:number}> = {
  SAVE10:{type:'percent',value:.10,label:'10% off'},
  WELCOME5:{type:'percent',value:.05,label:'5% off'},
  FLAT150:{type:'fixed',value:150,label:'₹150 off (min ₹999)',minOrder:999},
}

function normaliseAddress(a: any, fb = ''): SavedAddress {
  return { id:Number(a.id??a.address_id??0), fullName:a.full_name??a.fullName??a.name??'', email:a.email??fb, phone:a.mobile??a.phone??a.contact??'', city:a.city??a.town??'', pincode:a.pincode??a.postcode??a.zip??'', addressLine1:a.address1??a.line1??'', addressLine2:a.address2??a.line2??'', note:a.notes??a.note??'' }
}
function buildPayload(b: BillingInfo) {
  return { full_name:b.fullName, email:b.email||null, mobile:b.phone, city:b.city, state:b.city, pincode:b.pincode, address1:b.addressLine1, address2:b.addressLine2||null, notes:b.note||null }
}
function validate(b: BillingInfo) {
  const e: Partial<Record<keyof BillingInfo,string>> = {}
  if (!b.fullName.trim())                          e.fullName     = 'Required'
  if (!b.email.trim())                             e.email        = 'Required'
  else if (!/\S+@\S+\.\S+/.test(b.email))         e.email        = 'Invalid email'
  if (!b.phone.trim())                             e.phone        = 'Required'
  else if (b.phone.replace(/\D/g,'').length < 10) e.phone        = 'Min 10 digits'
  if (!/^\d{6}$/.test(b.pincode))                 e.pincode      = '6-digit pincode required'
  if (!b.addressLine1.trim())                      e.addressLine1 = 'Required'
  return e
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcoEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const IcoTruck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
const IcoClose = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>

// ─── Shared components ────────────────────────────────────────────────────────
const GradText = ({ children }: { children: React.ReactNode }) => (
  <span style={{ background:BRAND, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'inline-block' }}>{children}</span>
)
const Spin = () => (
  <span style={{ width:15, height:15, border:'2px solid rgba(255,255,255,.35)', borderTopColor:'white', borderRadius:'50%', animation:'chkSpin .7s linear infinite', display:'inline-block', flexShrink:0 }} />
)
const PageSpinner = ({ label='Loading…' }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 0', gap:14 }}>
    <div style={{ width:36, height:36, border:`3px solid ${PRI}`, borderTopColor:'transparent', borderRadius:'50%', animation:'chkSpin .7s linear infinite' }} />
    <p style={{ fontSize:14, color:'#9ca3af', fontFamily:FONT }}>{label}</p>
  </div>
)

function Field({ label, required, error, children }: { label:string; required?:boolean; error?:string; children:React.ReactNode }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:5, fontFamily:FONT }}>
        {label}{required && <span style={{ color:'#ef4444', marginLeft:2 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize:11, color:'#ef4444', marginTop:3, fontFamily:FONT }}>{error}</p>}
    </div>
  )
}

const baseInp: React.CSSProperties = { width:'100%', height:46, padding:'0 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', fontFamily:FONT, color:'#111827', background:'white', boxSizing:'border-box', transition:'border-color .15s' }
const focusOn  = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = PRI)
const focusOff = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = '#e5e7eb')

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Checkout() {
  const navigate = useNavigate()
  const { isAuth, loading: authLoading } = useAuth()
  injectCSS()

  // Cart
  const [cart,        setCart]        = useState<CartState & { apiCartTotal:number }>({ lines:[], apiCartTotal:0 })
  const [cartLoading, setCartLoading] = useState(true)
  const [cartError,   setCartError]   = useState<string|null>(null)

  // Billing
  const [billing,    setBilling]    = useState<BillingInfo>(EMPTY)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BillingInfo,string>>>({})

  // Addresses
  const [addresses,   setAddresses]   = useState<SavedAddress[]>([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [addrSaving,  setAddrSaving]  = useState(false)
  const [addrMsg,     setAddrMsg]     = useState<{type:'ok'|'err';text:string}|null>(null)
  const [saveMsg,     setSaveMsg]     = useState<{type:'ok'|'err';text:string}|null>(null)

  // ── Address UI state ──────────────────────────────────────────────────────
  // selectedId: which card is highlighted
  // formOpen:   is the form visible?
  // formMode:   'add' (blank form) | 'edit' (form pre-filled from card)
  const [selectedId, setSelectedId] = useState<number|null>(null)
  const [formOpen,   setFormOpen]   = useState(false)   // starts false, opens when needed
  const [formMode,   setFormMode]   = useState<'add'|'edit'>('add')

  // Coupon
  const [couponInput,   setCouponInput]   = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{code:string;discount:number}|null>(null)
  const [couponErr,     setCouponErr]     = useState<string|null>(null)

  // Order
  const [shippingMethod, setShippingMethod] = useState<'Delivery'|'pickup'>('Delivery')
  const [paymentMethod,  setPaymentMethod]  = useState<'cod'|'card'>('cod')
  const [termsAccepted,  setTermsAccepted]  = useState(false)
  const [isPlacing,      setIsPlacing]      = useState(false)
  const [orderError,     setOrderError]     = useState<string|null>(null)
  const [orderSuccess,   setOrderSuccess]   = useState(false)
  const [pincodeMsg,     setPincodeMsg]     = useState<string|null>(null)

  const alive = useRef(true)
  const formRef = useRef<HTMLDivElement>(null)

  const clearErr = (f: keyof BillingInfo) => setFormErrors(p => { const n={...p}; delete n[f]; return n })

  // Auth guard
  useEffect(() => { if (!authLoading && !isAuth) navigate('/login?returnUrl=%2Fcheckout') }, [authLoading, isAuth, navigate])

  useEffect(() => {
    Aos.init({ once:true, duration:500 })
    alive.current = true
    const saved = localStorage.getItem('savedBillingInfo')
    if (saved) { try { setBilling(JSON.parse(saved)) } catch {} }
    return () => { alive.current = false }
  }, [])

  // Load cart
  useEffect(() => {
    if (authLoading || !isAuth) return
    setCartLoading(true); setCartError(null)
    getCheckout()
      .then(res => { if (alive.current) setCart({ lines:res.lines, apiCartTotal:res.cart_total }) })
      .catch(e  => { if (alive.current) setCartError(e?.message ?? 'Failed to load cart.') })
      .finally(() => { if (alive.current) setCartLoading(false) })
  }, [isAuth, authLoading])

  // Load addresses
  const loadAddresses = useCallback(async () => {
    if (!isAuth) return
    setAddrLoading(true)
    try {
      const res = await apiClient.get('/api/addresses', { headers: authHeaders() } as any)
      const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : []
      if (!alive.current) return
      const list = raw.map(a => normaliseAddress(a, billing.email))
      setAddresses(list)
      // ── Smart initial state ─────────────────────────────────────────────
      // No addresses → form open immediately (first-time user)
      // Has addresses → form closed, cards shown
      if (list.length === 0) { setFormOpen(true); setFormMode('add') }
      else                   { setFormOpen(false) }
    } catch { /* silent */ }
    finally { if (alive.current) setAddrLoading(false) }
  }, [isAuth, billing.email])

  useEffect(() => { loadAddresses() }, [loadAddresses])

  // ── Pricing ────────────────────────────────────────────────────────────────
  const subtotal       = cart.apiCartTotal > 0 ? cart.apiCartTotal : cart.lines.reduce((s,l) => s + parseMoney(l.product.price) * l.quantity, 0)
  const shipping       = shippingMethod === 'pickup' ? 50 : subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIP_FEE
  const couponDiscount = appliedCoupon?.discount ?? 0
  const total          = Math.max(0, subtotal + shipping - couponDiscount)
  const toFreeShip     = Math.max(0, FREE_SHIP_THRESHOLD - subtotal)

  // ── Address actions ────────────────────────────────────────────────────────

  // Clicking a saved address card:
  // · If already selected AND form is open → close form (toggle off)
  // · Otherwise → select it, pre-fill form, open form
  function handleCardClick(addr: SavedAddress) {
    if (selectedId === addr.id && formOpen) {
      setFormOpen(false)
      return
    }
    setSelectedId(addr.id)
    setFormMode('edit')
    setBilling({ fullName:addr.fullName||billing.fullName, email:addr.email||billing.email, phone:addr.phone||billing.phone, city:addr.city||billing.city, pincode:addr.pincode||billing.pincode, addressLine1:addr.addressLine1||billing.addressLine1, addressLine2:addr.addressLine2||billing.addressLine2, note:addr.note||billing.note })
    setFormErrors({})
    setFormOpen(true)
    // Scroll to form on mobile
    setTimeout(() => formRef.current?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 80)
  }

  // "Add New Address" button
  function handleAddNew() {
    setSelectedId(null)
    setFormMode('add')
    setBilling(EMPTY)
    setFormErrors({})
    setFormOpen(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 80)
  }

  // Close form
  function handleCloseForm() {
    setFormOpen(false)
    if (formMode === 'add') setSelectedId(null)
  }

  async function handleDeleteAddress(id: number) {
    if (!confirm('Delete this saved address?')) return
    try {
      await apiClient.delete(`/api/addresses/${id}`, { headers:authHeaders() } as any)
      setAddrMsg({ type:'ok', text:'Address deleted.' })
      if (selectedId === id) { setSelectedId(null); setBilling(EMPTY); setFormOpen(false) }
      await loadAddresses()
    } catch (e: any) { setAddrMsg({ type:'err', text:e?.message ?? 'Delete failed.' }) }
    setTimeout(() => { if (alive.current) setAddrMsg(null) }, 3000)
  }

  async function handleSaveBilling() {
    const errors = validate(billing)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); setSaveMsg({ type:'err', text:'Please fill all required fields.' }); return }
    setAddrSaving(true); setSaveMsg(null)
    try {
      if (selectedId && formMode === 'edit') {
        await apiClient.put(`/api/addresses/${selectedId}`, buildPayload(billing), { headers:authHeaders() } as any)
        setSaveMsg({ type:'ok', text:'✅ Address updated.' })
      } else {
        const res = await apiClient.post('/api/addresses', buildPayload(billing), { headers:authHeaders() } as any)
        const newId = res.data?.data?.id ?? res.data?.id
        if (newId) setSelectedId(Number(newId))
        setSaveMsg({ type:'ok', text:'✅ Address saved.' })
      }
      localStorage.setItem('savedBillingInfo', JSON.stringify(billing))
      await loadAddresses()
      // After save: keep form open so user can see the result
    } catch (e: any) {
      setSaveMsg({ type:'err', text:`❌ ${e?.response?.data?.message ?? e?.message ?? 'Save failed.'}` })
    } finally {
      setAddrSaving(false)
      setTimeout(() => { if (alive.current) setSaveMsg(null) }, 4000)
    }
  }

  // ── Coupon ─────────────────────────────────────────────────────────────────
  function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) { setCouponErr('Enter a coupon code.'); return }
    const c = COUPONS[code]
    if (!c) { setCouponErr('Invalid coupon code.'); return }
    if (c.minOrder && subtotal < c.minOrder) { setCouponErr(`Minimum order ${fmtINR(c.minOrder)} required.`); return }
    setAppliedCoupon({ code, discount:c.type==='percent' ? subtotal*c.value : c.value })
    setCouponErr(null); setCouponInput('')
  }

  function checkPincode() {
    if (!/^\d{6}$/.test(billing.pincode)) { setPincodeMsg('❌ Enter a valid 6-digit pincode.'); return }
    setTimeout(() => setPincodeMsg(parseInt(billing.pincode[0]) > 2 ? '✅ Delivery available — 5–7 days.' : '❌ Delivery not available here.'), 400)
  }

  // ── Place Order ────────────────────────────────────────────────────────────
  async function placeOrderOnServer(paymentRef?: string) {
    let addrId = selectedId
    if (!addrId) {
      const r = await apiClient.post('/api/addresses', buildPayload(billing), { headers:authHeaders() } as any)
      const newId = r.data?.data?.id ?? r.data?.id
      if (!newId) throw new Error('Could not save address. Click "Save Address" first.')
      addrId = Number(newId); setSelectedId(addrId)
    }
    return (await apiClient.post('/api/place-order', {
      address_id:addrId, shipping_method:shippingMethod, payment_method:paymentMethod,
      coupon_code:appliedCoupon?.code??null,
      items:cart.lines.map(l => ({ cart_id:l.id, product_id:l.product.id, variant_id:(l as any).variantId??null, quantity:l.quantity, price:parseMoney(l.product.price) })),
      subtotal, shipping_cost:shipping, coupon_discount:couponDiscount, total,
      payment_reference:paymentRef??null,
    }, { headers:authHeaders() } as any)).data
  }

  async function handlePlaceOrder() {
    const errors = validate(billing)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); setOrderError('Please complete all required billing fields.'); return }
    if (!termsAccepted) { setOrderError('Please accept the Terms & Conditions.'); return }
    if (cart.lines.length === 0) { setOrderError('Your cart is empty.'); return }
    setIsPlacing(true); setOrderError(null)
    try {
      if (paymentMethod === 'card') {
        const sdkReady = await new Promise<boolean>(resolve => {
          if ((window as any).Razorpay) return resolve(true)
          const s = document.createElement('script'); s.src='https://checkout.razorpay.com/v1/checkout.js'
          s.onload=()=>resolve(true); s.onerror=()=>resolve(false); document.body.appendChild(s)
        })
        if (!sdkReady) throw new Error('Payment gateway failed. Please try Cash on Delivery.')
        let rzpOrderId: string|undefined
        try { const r=await fetch('/api/razorpay/create-order',{method:'POST',headers:{'Content-Type':'application/json',...authHeaders()},body:JSON.stringify({amount:Math.round(total*100)})}); if(r.ok){const d=await r.json();rzpOrderId=d?.id} } catch {}
        await new Promise<void>((resolve, reject) => {
          const opts: any = { key:process.env.NEXT_PUBLIC_RAZORPAY_KEY||'rzp_test_SBdvJaJvWcsKUc', amount:Math.round(total*100), currency:'INR', name:'Native Flavours', description:'Order Payment', prefill:{name:billing.fullName,email:billing.email,contact:billing.phone}, theme:{color:PRI}, handler:async(resp:any)=>{ try{await fetch('/api/razorpay/verify-payment',{method:'POST',headers:{'Content-Type':'application/json',...authHeaders()},body:JSON.stringify({razorpay_payment_id:resp.razorpay_payment_id,razorpay_order_id:resp.razorpay_order_id??rzpOrderId,razorpay_signature:resp.razorpay_signature})});await placeOrderOnServer(resp.razorpay_payment_id);resolve()}catch(e){reject(e)} } }
          if (rzpOrderId) opts.order_id=rzpOrderId
          const rzp = new (window as any).Razorpay(opts)
          rzp.on('payment.failed', (r:any)=>reject(new Error(r?.error?.description??'Payment failed')))
          rzp.open()
        })
      } else {
        await placeOrderOnServer()
      }
      setOrderSuccess(true)
      setTimeout(() => navigate('/order-history'), 700)
    } catch (err: any) {
      setOrderError(err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? 'Failed to place order.')
    } finally { setIsPlacing(false) }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (orderSuccess) return (
    <>
      <NavbarOne />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'70vh', fontFamily:FONT }}>
        <div style={{ textAlign:'center', padding:'0 24px' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:BRAND, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, color:'white', margin:'0 auto 20px' }}>✓</div>
          <h2 style={{ fontSize:26, fontWeight:800, color:'#111827', marginBottom:8 }}>
            {paymentMethod==='cod' ? 'Order Placed! 🎉' : 'Payment Successful! 🎉'}
          </h2>
          <p style={{ color:'#9ca3af', fontSize:14 }}>Redirecting to your orders…</p>
        </div>
      </div>
      <FooterOne />
    </>
  )

  // ── Shared card wrapper style ──────────────────────────────────────────────
  const card: React.CSSProperties = { background:'white', borderRadius:16, border:'1px solid #f0f0f0', fontFamily:FONT }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <NavbarOne />

      {/* Breadcrumb */}
      <div className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage:`url(${bg})` }}>
        <div className="text-center w-full">
          <h2 className="text-white text-3xl md:text-[40px] font-bold leading-none" style={{ fontFamily:FONT }}>Checkout</h2>
          <ul className="flex items-center justify-center gap-[10px] text-sm text-white mt-3">
            <li><Link to="/" className="hover:text-white/70 transition">Home</Link></li>
            <li>/</li>
            <li><GradText>Checkout</GradText></li>
          </ul>
        </div>
      </div>

      {/* Sticky step bar */}
      <div style={{ borderBottom:'1px solid #f0f0f0', background:'white', position:'sticky', top:0, zIndex:20, boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ maxWidth:1220, margin:'0 auto', padding:'11px 16px', display:'flex', alignItems:'center', gap:10 }}>
          {[{n:1,label:'Billing',on:true},{n:2,label:'Payment',on:true},{n:3,label:'Confirm',on:false}].map((s,i,arr)=>(
            <div key={s.n} style={{ display:'flex', alignItems:'center', flex:i<arr.length-1?'1':'unset' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, opacity:s.on?1:.35 }}>
                <div style={{ width:27, height:27, borderRadius:'50%', background:s.on?BRAND:'#d1d5db', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontWeight:700, flexShrink:0 }}>{s.n}</div>
                <span className="chk-step-lbl" style={{ fontSize:13, fontWeight:600, color:'#374151', fontFamily:FONT, whiteSpace:'nowrap' }}>{s.label}</span>
              </div>
              {i<arr.length-1&&<div style={{ flex:1, height:1, background:'#e5e7eb', margin:'0 8px', minWidth:12 }}/>}
            </div>
          ))}
        </div>
      </div>

      {/* Page */}
      <div style={{ background:'#f7f7fa', minHeight:'100vh', padding:'24px 0 64px', fontFamily:FONT }}>
        <div style={{ maxWidth:1220, margin:'0 auto', padding:'0 16px' }}>

          {(cartLoading||authLoading) && <PageSpinner label="Loading checkout…" />}

          {!cartLoading && cartError && (
            <div style={{ background:'#fff5f5', border:'1px solid #fecaca', borderRadius:12, padding:'16px 20px', color:'#dc2626', fontSize:14 }}>{cartError}</div>
          )}

          {!cartLoading && !cartError && cart.lines.length===0 && !authLoading && (
            <div style={{ textAlign:'center', background:'white', borderRadius:20, padding:'80px 24px' }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🛒</div>
              <p style={{ fontSize:18, fontWeight:700, color:'#111827', marginBottom:12 }}>Your cart is empty</p>
              <Link to="/shop-v1" style={{ color:PRI, fontWeight:600, textDecoration:'none' }}>Continue Shopping →</Link>
            </div>
          )}

          {!cartLoading && !cartError && cart.lines.length>0 && (
            <div className="chk-layout">

              {/* ════════════════════════════════════════
                  RIGHT — summary (appears first on mobile)
                  ════════════════════════════════════════ */}
              <div className="chk-left" style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Free shipping progress */}
                <div style={{ ...card, padding:'14px 16px' }}>
                  {toFreeShip > 0 ? (
                    <>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <IcoTruck />
                        <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>
                          Add <span style={{ color:PRI, fontWeight:700 }}>{fmtINR(toFreeShip)}</span> more for <strong>FREE shipping</strong>
                        </span>
                      </div>
                      <div className="chk-prog-bar">
                        <div className="chk-prog-fill" style={{ width:`${Math.min(100,(subtotal/FREE_SHIP_THRESHOLD)*100)}%` }} />
                      </div>
                    </>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <IcoTruck />
                      <span style={{ fontSize:13, fontWeight:700, color:'#166534' }}>🎉 Free shipping unlocked!</span>
                    </div>
                  )}
                </div>

                {/* Payment method */}
                <div style={{ ...card }} className="chk-card">
                  <h4 style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom:12 }}>Payment Method</h4>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {/* COD */}
                    <label className={`chk-pay-opt${paymentMethod==='cod'?' active':''}`}>
                      <input type="radio" name="payment" value="cod" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} style={{ accentColor:PRI, flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#111827', margin:0 }}>🏠 Cash on Delivery</p>
                        <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0' }}>Pay when your order arrives</p>
                      </div>
                      {paymentMethod==='cod' && <span style={{ fontSize:10, padding:'2px 8px', background:'#dcfce7', color:'#16a34a', borderRadius:20, fontWeight:700, flexShrink:0 }}>Selected</span>}
                    </label>
                    {/* Card */}
                    <label className={`chk-pay-opt${paymentMethod==='card'?' active':''}`}>
                      <input type="radio" name="payment" value="card" checked={paymentMethod==='card'} onChange={()=>setPaymentMethod('card')} style={{ accentColor:PRI, flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#111827', margin:0 }}>💳 Debit / Credit Card</p>
                        <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0' }}>Razorpay — UPI, Cards, Net Banking</p>
                      </div>
                      <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                        {['VISA','MC','UPI'].map(b=><span key={b} style={{ fontSize:9, fontWeight:700, padding:'2px 5px', background:'#f3f4f6', color:'#6b7280', borderRadius:3 }}>{b}</span>)}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Order summary + CTA (sticky on desktop) */}
                <div style={{ ...card }} className="chk-card chk-sticky" style={{ position:'sticky', top:64 }}>
                  <h4 style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom:14 }}>Order Summary</h4>

                  {/* Items */}
                  <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:240, overflowY:'auto', marginBottom:12, paddingRight:2 }}>
                    {cart.lines.map(line => {
                      const lt = parseMoney(line.product.price) * line.quantity
                      return (
                        <div key={line.id} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                          <div className="chk-img" style={{ borderRadius:8, overflow:'hidden', background:'#f3f4f6', flexShrink:0, border:'1px solid #f0f0f0' }}>
                            <img src={line.product.image||placeholder} alt={line.product.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e=>{(e.currentTarget as HTMLImageElement).src=placeholder}} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:12, fontWeight:600, color:'#111827', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', margin:0 }}>{line.product.name}</p>
                            <p style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Qty: {line.quantity}</p>
                          </div>
                          <p style={{ fontSize:12, fontWeight:700, color:'#111827', flexShrink:0 }}>{fmtINR(lt)}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Coupon */}
                  <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:12, marginBottom:4 }}>
                    <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                      <input type="text" placeholder="Coupon code" value={couponInput}
                        onChange={e=>{ setCouponInput(e.target.value.toUpperCase()); setCouponErr(null) }}
                        onKeyDown={e=>e.key==='Enter'&&applyCoupon()}
                        style={{ ...baseInp, height:40, flex:1, textTransform:'uppercase', fontSize:12 }} onFocus={focusOn} onBlur={focusOff} />
                      <button onClick={applyCoupon} style={{ padding:'0 14px', height:40, borderRadius:8, background:BRAND, color:'white', fontSize:12, fontWeight:700, border:'none', cursor:'pointer', fontFamily:FONT, flexShrink:0 }}>Apply</button>
                    </div>
                    {couponErr && <p style={{ fontSize:11, color:'#ef4444', marginBottom:6 }}>{couponErr}</p>}
                    {appliedCoupon && (
                      <div style={{ padding:'8px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                        <p style={{ fontSize:11, fontWeight:600, color:'#166534', margin:0 }}>✓ {appliedCoupon.code} — {fmtINR(appliedCoupon.discount)} off</p>
                        <button onClick={()=>setAppliedCoupon(null)} style={{ fontSize:11, color:'#ef4444', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>✕</button>
                      </div>
                    )}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                      {Object.keys(COUPONS).map(code=>(
                        <button key={code} onClick={()=>{ setCouponInput(code); setCouponErr(null) }}
                          style={{ fontSize:10, padding:'3px 8px', border:'1px dashed #2F4A3A', borderRadius:5, background:'#f3f1ff', color:PRI, fontWeight:700, cursor:'pointer', fontFamily:FONT }}>
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price rows */}
                  <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:12, display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                    {[
                      { label:`Subtotal (${cart.lines.length} item${cart.lines.length!==1?'s':''})`, val:fmtINR(subtotal), color:'#374151' },
                      ...(couponDiscount>0?[{ label:`Coupon (${appliedCoupon?.code})`, val:`−${fmtINR(couponDiscount)}`, color:'#16a34a' }]:[]),
                      { label:'Shipping', val:shipping===0?'FREE':fmtINR(shipping), color:shipping===0?'#16a34a':'#374151' },
                    ].map((row,i)=>(
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:12, color:'#6b7280' }}>{row.label}</span>
                        <span style={{ fontSize:12, fontWeight:600, color:row.color }}>{row.val}</span>
                      </div>
                    ))}
                    {toFreeShip>0 && shippingMethod==='Delivery' && (
                      <p style={{ fontSize:11, color:'#f97316', fontWeight:500, background:'#fff7ed', padding:'5px 8px', borderRadius:6, margin:0 }}>
                        Add {fmtINR(toFreeShip)} more for free shipping!
                      </p>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid #f3f4f6' }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Total</span>
                      <span style={{ fontSize:17, fontWeight:800, background:BRAND, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{fmtINR(total)}</span>
                    </div>
                    {couponDiscount>0 && <p style={{ fontSize:11, color:'#16a34a', fontWeight:600, textAlign:'right', margin:0 }}>🎉 You save {fmtINR(couponDiscount)}</p>}
                  </div>

                  {/* Terms + CTA */}
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f3f4f6' }}>
                    <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', marginBottom:12 }}>
                      <input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} style={{ marginTop:2, accentColor:PRI, width:15, height:15, flexShrink:0 }} />
                      <span style={{ fontSize:12, color:'#6b7280' }}>
                        I agree to the <Link to="/terms-and-conditions" style={{ color:PRI, fontWeight:600, textDecoration:'none' }}>Terms & Conditions</Link>
                      </span>
                    </label>

                    {orderError && (
                      <div style={{ marginBottom:10, padding:'10px 12px', background:'#fff5f5', border:'1px solid #fecaca', borderRadius:8, fontSize:12, color:'#dc2626', fontWeight:500 }}>
                        ⚠ {orderError}
                      </div>
                    )}
                    {paymentMethod==='cod' && (
                      <div style={{ marginBottom:10, padding:'10px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, fontSize:12, color:'#166534', fontWeight:500 }}>
                        🏠 Pay cash on delivery. No online payment needed.
                      </div>
                    )}

                    <button onClick={handlePlaceOrder} disabled={isPlacing||!termsAccepted} className="chk-cta"
                      style={{ width:'100%', borderRadius:25, background:isPlacing||!termsAccepted?'#d1d5db':BRAND, color:'white', fontWeight:700, border:'none', cursor:isPlacing||!termsAccepted?'not-allowed':'pointer', fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'opacity .18s' }}>
                      {isPlacing ? <><Spin /> Processing…</> : paymentMethod==='cod' ? '📦 Place Order (COD)' : '💳 Pay & Place Order'}
                    </button>
                    <p style={{ fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:8 }}>🔒 256-bit SSL Encrypted & Secure</p>
                    <Link to="/cart" style={{ display:'block', textAlign:'center', marginTop:8, padding:'10px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:600, color:'#6b7280', textDecoration:'none' }}>
                      ← Back to Cart
                    </Link>
                  </div>
                </div>
              </div>
              {/* end right */}

              {/* ════════════════════════════════════════
                  LEFT — Billing + Shipping method
                  ════════════════════════════════════════ */}
              <div className="chk-right" style={{ display:'flex', flexDirection:'column', gap:20 }} data-aos="fade-up">

                {/* ── BILLING INFORMATION ─────────────────────────────────── */}
                <div style={{ ...card }} className="chk-card">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
                    <h4 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:0 }}>Billing Information</h4>
                    {addrLoading && <span style={{ fontSize:11, color:'#9ca3af' }}>Loading addresses…</span>}
                  </div>

                  {/* ── SAVED ADDRESS CARDS (only when addresses exist) ───── */}
                  {addresses.length > 0 && (
                    <div style={{ marginBottom:16 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>
                        Saved Addresses — <span style={{ fontWeight:400, textTransform:'none' }}>tap to select &amp; edit</span>
                      </p>

                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {addresses.map(addr => {
                          const isSelected = selectedId === addr.id
                          return (
                            <div key={addr.id}>
                              {/* ── Card row ── */}
                              <div className={`chk-addr${isSelected?' selected':''}`} onClick={()=>handleCardClick(addr)}>
                                <div style={{ display:'flex', alignItems:'flex-start', gap:10, flex:1, minWidth:0 }}>
                                  {/* Radio dot */}
                                  <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${isSelected?PRI:'#d1d5db'}`, background:isSelected?PRI:'transparent', flexShrink:0, marginTop:3, transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    {isSelected && <div style={{ width:5, height:5, borderRadius:'50%', background:'white' }} />}
                                  </div>
                                  <div style={{ minWidth:0, flex:1 }}>
                                    <p style={{ fontSize:13, fontWeight:700, color:'#111827', margin:'0 0 2px', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{addr.fullName}</p>
                                    <p style={{ fontSize:11, color:'#6b7280', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', margin:0 }}>
                                      {addr.addressLine1}{addr.city?`, ${addr.city}`:''}{addr.pincode?` — ${addr.pincode}`:''}
                                    </p>
                                    {addr.phone && <p style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>📞 {addr.phone}</p>}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display:'flex', gap:4, flexShrink:0, alignItems:'center' }}>
                                  {/* Edit icon (just opens the card — clicking card already does this) */}
                                  <button className="chk-icon-btn" onClick={e=>{ e.stopPropagation(); handleCardClick(addr) }} title="Edit">
                                    <IcoEdit />
                                  </button>
                                  <button className="chk-icon-btn danger" onClick={e=>{ e.stopPropagation(); handleDeleteAddress(addr.id) }} title="Delete">
                                    <IcoTrash />
                                  </button>
                                </div>
                              </div>

                              {/* ── Inline form — slides open under selected card ── */}
                              {isSelected && formOpen && (
                                <div ref={formRef} className="chk-form-open" style={{ marginTop:8, padding:'16px', background:'#f9f8ff', border:`1.5px solid ${PRI}`, borderRadius:12 }}>
                                  {/* Form header */}
                                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                                    <p style={{ fontSize:13, fontWeight:700, color:PRI, margin:0 }}>✏️ Edit Address</p>
                                    <button onClick={handleCloseForm} style={{ width:28, height:28, borderRadius:6, border:'none', background:'rgba(91,79,190,.12)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:PRI }}>
                                      <IcoClose />
                                    </button>
                                  </div>
                                  <BillingForm billing={billing} setBilling={setBilling} formErrors={formErrors} clearErr={clearErr} pincodeMsg={pincodeMsg} checkPincode={checkPincode} />
                                  <SaveBar addrSaving={addrSaving} selectedId={selectedId} formMode={formMode} saveMsg={saveMsg} onSave={handleSaveBilling} onCancel={handleCloseForm} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {addrMsg && <p style={{ fontSize:12, marginTop:8, fontWeight:500, color:addrMsg.type==='ok'?'#16a34a':'#ef4444' }}>{addrMsg.text}</p>}

                      {/* Add new address button */}
                      <button onClick={handleAddNew}
                        style={{ marginTop:12, fontSize:13, fontWeight:700, color:PRI, background:'none', border:`1.5px dashed ${PRI}`, borderRadius:8, cursor:'pointer', fontFamily:FONT, padding:'9px 16px', width:'100%', textAlign:'center', transition:'background .15s' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='#f3f1ff')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        + Add New Address
                      </button>

                      {/* Add-new inline form (no card selected) */}
                      {!selectedId && formOpen && (
                        <div ref={formRef} className="chk-form-open" style={{ marginTop:10, padding:'16px', background:'#f9f8ff', border:`1.5px solid ${PRI}`, borderRadius:12 }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                            <p style={{ fontSize:13, fontWeight:700, color:PRI, margin:0 }}>🏠 New Address</p>
                            <button onClick={handleCloseForm} style={{ width:28, height:28, borderRadius:6, border:'none', background:'rgba(91,79,190,.12)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:PRI }}>
                              <IcoClose />
                            </button>
                          </div>
                          <BillingForm billing={billing} setBilling={setBilling} formErrors={formErrors} clearErr={clearErr} pincodeMsg={pincodeMsg} checkPincode={checkPincode} />
                          <SaveBar addrSaving={addrSaving} selectedId={selectedId} formMode={formMode} saveMsg={saveMsg} onSave={handleSaveBilling} onCancel={handleCloseForm} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── NO SAVED ADDRESSES → form shown directly (first-time) ── */}
                  {addresses.length === 0 && !addrLoading && (
                    <div>
                      <p style={{ fontSize:12, color:'#9ca3af', marginBottom:14 }}>Enter your delivery details below.</p>
                      <BillingForm billing={billing} setBilling={setBilling} formErrors={formErrors} clearErr={clearErr} pincodeMsg={pincodeMsg} checkPincode={checkPincode} />
                      <SaveBar addrSaving={addrSaving} selectedId={selectedId} formMode={formMode} saveMsg={saveMsg} onSave={handleSaveBilling} onCancel={null} />
                    </div>
                  )}
                </div>

                {/* ── SHIPPING METHOD (below billing) ──────────────────────── */}
                <div style={{ ...card }} className="chk-card">
                  <h4 style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom:14, margin:'0 0 14px' }}>Shipping Method</h4>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {([
                      { value:'Delivery' as const, label:'Standard Delivery', sub:'5–7 business days', cost:subtotal>=FREE_SHIP_THRESHOLD?0:SHIP_FEE },
                      { value:'pickup'   as const, label:'Local Pickup',       sub:'Pickup from our store', cost:50 },
                    ]).map(opt=>(
                      <label key={opt.value} className={`chk-ship-opt${shippingMethod===opt.value?' active':''}`}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:10, flex:1 }}>
                          <input type="radio" name="shipping" value={opt.value} checked={shippingMethod===opt.value} onChange={()=>setShippingMethod(opt.value)} style={{ accentColor:PRI, marginTop:3, flexShrink:0 }} />
                          <div>
                            <p style={{ fontSize:13, fontWeight:600, color:'#374151', margin:0 }}>{opt.label}</p>
                            <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0' }}>{opt.sub}</p>
                            {opt.value==='Delivery' && subtotal>=FREE_SHIP_THRESHOLD && (
                              <p style={{ fontSize:11, color:'#16a34a', fontWeight:600, margin:'2px 0 0' }}>🎉 Free shipping unlocked!</p>
                            )}
                            {opt.value==='Delivery' && subtotal<FREE_SHIP_THRESHOLD && (
                              <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0' }}>Add {fmtINR(FREE_SHIP_THRESHOLD-subtotal)} more for free</p>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize:14, fontWeight:700, color:opt.cost===0?'#16a34a':'#374151', flexShrink:0 }}>
                          {opt.cost===0?'FREE':fmtINR(opt.cost)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
              {/* end left */}

            </div>
          )}
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  )
}

// ─── Extracted: Billing form fields ──────────────────────────────────────────
function BillingForm({ billing, setBilling, formErrors, clearErr, pincodeMsg, checkPincode }: {
  billing: any; setBilling: any; formErrors: any; clearErr: any; pincodeMsg: string|null; checkPincode: ()=>void
}) {
  const CITIES = ['Mumbai','Delhi','Bengaluru','Hyderabad','Ahmedabad','Chennai','Kolkata','Surat','Pune','Jaipur','Lucknow','Kanpur','Nagpur','Indore','Thane','Bhopal','Visakhapatnam','Patna','Vadodara','Aurangabad','Nashik','Meerut','Faridabad','Rajkot','Varanasi','Agra','Amritsar','Coimbatore','Kochi']
  const baseInp: React.CSSProperties = { width:'100%', height:44, padding:'0 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, outline:'none', fontFamily:FONT, color:'#111827', background:'white', boxSizing:'border-box', transition:'border-color .15s' }
  const fo = (e: any) => (e.currentTarget.style.borderColor = PRI)
  const fb = (e: any) => (e.currentTarget.style.borderColor = '#e5e7eb')
  const upd = (k: string, v: string) => { setBilling((p:any)=>({...p,[k]:v})); clearErr(k) }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
      {/* Row: Name + Email */}
      <div className="chk-2col">
        <Field label="Full Name" required error={formErrors.fullName}>
          <input type="text" value={billing.fullName} onChange={e=>upd('fullName',e.target.value)} style={baseInp} placeholder="Rajesh Kumar" onFocus={fo} onBlur={fb} />
        </Field>
        <Field label="Email" required error={formErrors.email}>
          <input type="email" value={billing.email} onChange={e=>upd('email',e.target.value)} style={baseInp} placeholder="you@email.com" onFocus={fo} onBlur={fb} />
        </Field>
      </div>
      {/* Row: Phone + City */}
      <div className="chk-2col">
        <Field label="Phone" required error={formErrors.phone}>
          <input type="tel" value={billing.phone} onChange={e=>upd('phone',e.target.value)} style={baseInp} placeholder="9876543210" onFocus={fo} onBlur={fb} />
        </Field>
        <Field label="Town / City">
          <select value={billing.city} onChange={e=>upd('city',e.target.value)} style={{ ...baseInp, cursor:'pointer' }}>
            {CITIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      {/* Pincode */}
      <Field label="Pincode" required error={formErrors.pincode}>
        <div style={{ display:'flex', gap:8 }}>
          <input type="text" value={billing.pincode} onChange={e=>upd('pincode',e.target.value.replace(/\D/g,'').slice(0,6))} style={{ ...baseInp, flex:1 }} placeholder="6-digit pincode" onKeyDown={e=>e.key==='Enter'&&checkPincode()} onFocus={fo} onBlur={fb} />
          <button onClick={checkPincode} style={{ padding:'0 13px', height:44, background:'#111827', color:'white', border:'none', borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:FONT, flexShrink:0 }}>Check</button>
        </div>
        {pincodeMsg && <p style={{ fontSize:11, marginTop:4, fontWeight:500, color:pincodeMsg.includes('✅')?'#16a34a':'#ef4444' }}>{pincodeMsg}</p>}
      </Field>
      {/* Address 1 */}
      <Field label="Address Line 1" required error={formErrors.addressLine1}>
        <input type="text" value={billing.addressLine1} onChange={e=>upd('addressLine1',e.target.value)} style={baseInp} placeholder="House No., Street Name" onFocus={fo} onBlur={fb} />
      </Field>
      {/* Address 2 */}
      <Field label="Address Line 2 (Optional)">
        <input type="text" value={billing.addressLine2} onChange={e=>upd('addressLine2',e.target.value)} style={baseInp} placeholder="Apartment, Floor, Landmark" onFocus={fo} onBlur={fb} />
      </Field>
      {/* Notes */}
      <Field label="Delivery Notes (Optional)">
        <textarea value={billing.note} onChange={e=>upd('note',e.target.value)} rows={2} style={{ ...baseInp, height:'auto', padding:'10px 12px', resize:'vertical' }} placeholder="Special delivery instructions…" onFocus={fo} onBlur={fb} />
      </Field>
    </div>
  )
}

// ─── Extracted: Save / Cancel bar ────────────────────────────────────────────
function SaveBar({ addrSaving, selectedId, formMode, saveMsg, onSave, onCancel }: {
  addrSaving:boolean; selectedId:number|null; formMode:'add'|'edit'; saveMsg:any; onSave:()=>void; onCancel:(()=>void)|null
}) {
  const Spin2 = () => <span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,.35)', borderTopColor:'white', borderRadius:'50%', animation:'chkSpin .7s linear infinite', display:'inline-block' }} />
  return (
    <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #e9eaf0', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
      <button type="button" onClick={onSave} disabled={addrSaving}
        style={{ padding:'0 20px', height:42, borderRadius:21, background:BRAND, color:'white', fontSize:13, fontWeight:700, border:'none', cursor:addrSaving?'not-allowed':'pointer', fontFamily:FONT, opacity:addrSaving?.65:1, display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
        {addrSaving ? <><Spin2 /> Saving…</> : `💾 ${selectedId&&formMode==='edit'?'Update Address':'Save Address'}`}
      </button>
      {onCancel && (
        <button onClick={onCancel} style={{ fontSize:13, color:'#6b7280', background:'none', border:'none', cursor:'pointer', fontFamily:FONT }}>Cancel</button>
      )}
      {saveMsg && <p style={{ fontSize:12, fontWeight:600, color:saveMsg.type==='ok'?'#16a34a':'#ef4444', margin:0 }}>{saveMsg.text}</p>}
    </div>
  )
}