'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ProductDetails.tsx — Only currency symbol changed ($ → ₹), no conversion.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useParams } from '@/lib/router';
import AOS from 'aos';
import { FourSquare } from 'react-loading-indicators';
import {
  FaFacebookF, FaTwitter, FaPinterestP, FaWhatsapp,
} from 'react-icons/fa';
import {
  LuTruck, LuShieldCheck, LuRefreshCcw, LuPackage, LuStar,
  LuPencilLine, LuHeart, LuMapPin, LuClock, LuInfo, 
} from 'react-icons/lu';

import NavbarOne from '../../components/navbar/navbar-one';
import FooterOne from '../../components/footer/footer-one';
import LayoutOne from '../../components/product/layout-one';
import ScrollToTop from '../../components/scroll-to-top';
import { productList, productTag } from '../../data/data';
import { getProductById, getProductDetailsById } from '../../api/products';
import { getReviewsByProduct, addReview as addReviewApi, deleteReview as deleteReviewApi } from '../../api/reviews';
import { addToCart } from '../../api/cart.api';
import { isWishlistedAsync, toggleWishlist } from '../../api/wishlist.api';

function formatINR(value: unknown): string {
  if (value === null || value === undefined || value === '') return '₹0';
  const num = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num) || num <= 0) return '₹0';
  return '₹' + num.toLocaleString('en-IN');
}

// ----- Brand Tokens -----
const BRAND_GRADIENT = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
const BRAND_SOLID = '#2F4A3A';
const WHATSAPP_NUMBER = '919766978839';

// ----- Static Data (only symbol changed) -----
const OFFERS: { info: string; code: string }[] = [
  { info: 'Get 5% off sitewide — No minimum spend', code: 'MAKEHOMESPECIAL' },
  { info: 'Get Rs.150 off on your first order — Min. purchase of Rs.1500', code: 'NESTTRY' }, // already in Rs.
];
const STOCK_QTY_FALLBACK: number = 7;
const REVIEWS = [
  { id: 1, name: 'Priya M.', avatar: 'PM', rating: 5, date: 'March 12, 2026', title: 'Absolutely love it!', body: 'The quality is exceptional. The finish is gorgeous and it fits perfectly in my living room. Very sturdy and worth every rupee.', verified: true },
  { id: 2, name: 'Rohan S.', avatar: 'RS', rating: 5, date: 'February 28, 2026', title: 'Great product, fast delivery', body: 'Ordered this for our new home. Packaging was excellent — no damage at all. Assembly was straightforward. Highly recommend!', verified: true },
  { id: 3, name: 'Ananya K.', avatar: 'AK', rating: 4, date: 'February 15, 2026', title: 'Beautiful design', body: 'Looks even better in person than in photos. Minor feedback — delivery took a day longer than expected, but totally worth the wait.', verified: true },
];
const RATING_SUMMARY = { average: 4.8, total: 128 };
const AVATAR_COLORS = ['#2F4A3A', '#E8314A', '#0891b2'];

// Delivery features – only symbol changed in subtext
const DELIVERY_FEATURES = [
  { icon: <LuTruck size={18} />, label: 'Free Shipping', sub: 'On orders above ₹999' },
  { icon: <LuRefreshCcw size={18} />, label: '7-Day Returns', sub: 'Hassle-free returns' },
  { icon: <LuShieldCheck size={18} />, label: 'Secure Payments', sub: '100% safe & encrypted' },
  { icon: <LuPackage size={18} />, label: 'Cash on Delivery', sub: 'Available on all orders' },
];

const RATING_BREAKDOWN = [
  { s: 5, p: 76 }, { s: 4, p: 16 }, { s: 3, p: 5 }, { s: 2, p: 2 }, { s: 1, p: 1 },
];
const SIZE_GUIDE_DATA = [
  { size: 'S', width: '45cm', depth: '50cm', height: '80cm' },
  { size: 'M', width: '50cm', depth: '55cm', height: '85cm' },
  { size: 'L', width: '55cm', depth: '60cm', height: '90cm' },
  { size: 'XL', width: '60cm', depth: '65cm', height: '95cm' },
];
const SALE_TARGET = new Date(2026, 3, 30, 23, 59, 59);
const productImages = {
  p1: 'https://placehold.co/600x400?text=Product+1',
  p2: 'https://placehold.co/600x400?text=Product+2',
  p3: 'https://placehold.co/600x400?text=Product+3',
  p4: 'https://placehold.co/600x400?text=Product+4',
};

// ----- Helper Functions -----
function getDeliveryDateRange(): string {
  const now = new Date();
  const add = (d: Date, days: number) => { const r = new Date(d); r.setDate(r.getDate() + days); return r; };
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(add(now, 3))} – ${fmt(add(now, 7))}`;
}

function stockState(qty: number): 'out' | 'critical' | 'low' | 'in' {
  if (qty === 0) return 'out';
  if (qty <= 5) return 'critical';
  if (qty <= 20) return 'low';
  return 'in';
}

function useCountdown(target: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: pad(Math.floor(diff / 86400000)),
      hours: pad(Math.floor((diff % 86400000) / 3600000)),
      minutes: pad(Math.floor((diff % 3600000) / 60000)),
      seconds: pad(Math.floor((diff % 60000) / 1000)),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function StarRating({ rating, size = 16, color = '#f5a623' }: { rating: number; size?: number; color?: string }) {
  return (
    <div className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = rating >= star;
        const partial = !filled && rating > star - 1;
        const pct = partial ? Math.round((rating - (star - 1)) * 100) : 0;
        const gradId = `sg-${star}-${Math.round(rating * 10)}`;
        return (
          <svg key={star} width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            {partial && (
              <defs>
                <linearGradient id={gradId}>
                  <stop offset={`${pct}%`} stopColor={color} />
                  <stop offset={`${pct}%`} stopColor="#d1d5db" />
                </linearGradient>
              </defs>
            )}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={filled ? color : partial ? `url(#${gradId})` : '#e5e7eb'}
            />
          </svg>
        );
      })}
    </div>
  );
}

// ----- Gallery Component (unchanged) -----
interface MediaItem { type: 'image' | 'video'; url: string; thumbnail: string; alt?: string; poster?: string; embedUrl?: string; }
function ProductGallery({ media, productName, discountPct }: { media: MediaItem[]; productName: string; discountPct?: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMovedRef = useRef(false);
  const activeItem = media[activeIdx];
  const isEmbedVideo = activeItem.type === 'video' && !!activeItem.embedUrl;

  const prev = useCallback(() => setActiveIdx(i => (i - 1 + media.length) % media.length), [media.length]);
  const next = useCallback(() => setActiveIdx(i => (i + 1) % media.length), [media.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, lightboxOpen]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const thumbEl = strip.children[activeIdx] as HTMLElement;
    if (thumbEl) thumbEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIdx]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imgContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches && e.touches[0]
    if (!t) return
    touchStartRef.current = { x: t.clientX, y: t.clientY }
    touchMovedRef.current = false
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches && e.touches[0]
    if (!t || !touchStartRef.current) return
    const dx = Math.abs(t.clientX - touchStartRef.current.x)
    const dy = Math.abs(t.clientY - touchStartRef.current.y)
    if (dx > 8 || dy > 8) touchMovedRef.current = true
  }

  const handleTouchEnd = () => {
    // open lightbox only if it was a tap (no significant move)
    if (!touchMovedRef.current) setLightboxOpen(true)
    touchStartRef.current = null
    touchMovedRef.current = false
  }

  return (
    <>
      {lightboxOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/25 rounded-full w-10 h-10 flex items-center justify-center text-xl">✕</button>
          {media.length > 1 && (
            <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/25 rounded-full w-12 h-12 flex items-center justify-center text-2xl">‹</button>
          )}
          <div onClick={e => e.stopPropagation()} className="max-w-[90vw] max-h-[90vh]">
            {activeItem.type === 'image' ? (
              <img src={activeItem.url} alt={activeItem.alt ?? productName} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            ) : isEmbedVideo ? (
              <div className="w-[90vw] max-w-[1100px] aspect-video">
                <iframe src={activeItem.embedUrl} title={`${productName} video`} className="w-full h-full" allowFullScreen />
              </div>
            ) : (
              <video src={activeItem.url} poster={activeItem.poster} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg" />
            )}
          </div>
          {media.length > 1 && (
            <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/25 rounded-full w-12 h-12 flex items-center justify-center text-2xl">›</button>
          )}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-base font-semibold">{activeIdx + 1} / {media.length}</div>
        </div>
      )}

      <div className="w-full">
        <div className="relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-200">
          {discountPct && <div className="absolute top-3 left-3 z-20 bg-red-600 text-white text-base font-bold px-3 py-1.5 rounded shadow">{discountPct}</div>}
          <div className="absolute top-3 right-3 z-20 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full">{activeIdx + 1} / {media.length}</div>
          <div
            ref={imgContainerRef}
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: '4/3' }}
            onMouseEnter={() => activeItem.type === 'image' && setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              // prevent opening after a touch-drag caused a click
              if (touchMovedRef.current) { touchMovedRef.current = false; return }
              setLightboxOpen(true)
            }}
          >
            {activeItem.type === 'image' ? (
              <>
                <img src={activeItem.url} alt={activeItem.alt ?? `${productName} view ${activeIdx + 1}`} className="w-full h-full object-cover" draggable={false} />
                {zoom && (
                  <div
                    className="pointer-events-none absolute rounded-full overflow-hidden shadow-2xl"
                    style={{
                      width: 180, height: 180, top: `calc(${zoomPos.y}% - 90px)`, left: `calc(${zoomPos.x}% - 90px)`,
                      border: '2px solid rgba(255,255,255,0.8)', zIndex: 30,
                    }}
                  >
                    <img
                      src={activeItem.url}
                      alt="zoom"
                      style={{
                        width: '250%', height: '250%', maxWidth: 'none',
                        position: 'absolute',
                        top: `${-zoomPos.y * 2.5 + 50}%`,
                        left: `${-zoomPos.x * 2.5 + 50}%`,
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full pointer-events-none transition-opacity duration-200" style={{ opacity: zoom ? 0 : 0.75 }}>
                  🔍 Click to zoom
                </div>
              </>
            ) : (
              isEmbedVideo ? (
                <div className="w-full h-full bg-black">
                  <iframe src={activeItem.embedUrl} title={`${productName} video`} className="w-full h-full" allowFullScreen />
                </div>
              ) : (
                <video src={activeItem.url} poster={activeItem.poster} controls playsInline className="w-full h-full object-cover" />
              )
            )}
          </div>
          {media.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center border border-gray-200 text-xl">‹</button>
              <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center border border-gray-200 text-xl">›</button>
            </>
          )}
        </div>
        {media.length > 1 && (
          <div className="mt-3 flex items-center gap-2">
            <button onClick={prev} className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50">‹</button>
            <div ref={stripRef} className="flex-1 flex gap-2 overflow-x-auto scrollbar-none">
              {media.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`flex-shrink-0 relative rounded-xl overflow-hidden border-2 transition-all ${activeIdx === idx ? 'border-[#2F4A3A] shadow-md' : 'border-transparent'}`}
                  style={{ width: 80, height: 80 }}
                >
                  <img src={item.thumbnail} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow">▶</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button onClick={next} className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50">›</button>
          </div>
        )}
      </div>
    </>
  );
}

// ----- Other Sub‑components (only symbol changes) -----
function RatingSummary({ rating, total }: { rating: number; total: number }) {
  const scroll = () => document.getElementById('customer-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <button onClick={scroll} className="flex items-center gap-2 mt-2">
      <StarRating rating={rating} size={18} />
      <span className="text-base font-bold text-gray-800">{rating}</span>
      <span className="text-sm text-gray-500 underline">({total} reviews)</span>
    </button>
  );
}

function StockIndicator({ qty }: { qty: number }) {
  const state = stockState(qty);
  const barColor = state === 'in' ? '#22c55e' : state === 'low' ? '#f97316' : '#ef4444';
  const barWidth = state === 'out' ? 0 : Math.min(100, Math.round((qty / 50) * 100));
  const label = state === 'out' ? 'Out of Stock' : state === 'critical' ? `Only ${qty} left!` : state === 'low' ? `${qty} items available` : 'In Stock';
  const labelColor = state === 'in' ? '#16a34a' : state === 'low' ? '#ea580c' : '#ef4444';
  return (
    <div className="mt-3 mb-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold" style={{ color: labelColor }}>{label}</span>
        {state === 'critical' && <span className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse bg-red-100 text-red-600 border border-red-200">Selling fast!</span>}
        {state === 'in' && <span className="text-sm font-semibold text-green-600">✓ Ready to ship</span>}
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden bg-gray-200">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}

function DeliveryInfo() {
  const [pincode, setPincode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const check = () => {
    if (pincode.length !== 6) { setMsg('Enter a valid 6-digit pincode.'); return; }
    setChecking(true);
    setTimeout(() => {
      const ok = parseInt(pincode[0], 10) > 2;
      setMsg(ok ? `✓ Delivery available by ${getDeliveryDateRange()}` : '✗ Delivery not available at this pincode.');
      setChecking(false);
    }, 800);
  };
  return (
    <div className="rounded-xl border border-gray-200 p-4 mb-4 bg-gray-50">
      <div className="flex items-start gap-3 mb-3">
        <LuClock size={18} className="mt-0.5 text-[#2F4A3A]" />
        <div>
          <span className="text-sm font-bold text-gray-700">Estimated Delivery: </span>
          <span className="text-sm font-semibold text-[#2F4A3A]">{getDeliveryDateRange()}</span>
          <p className="text-xs text-gray-400 mt-0.5">For orders placed before 2 PM today</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <LuMapPin size={16} className="text-gray-400" />
        <input
          type="text" maxLength={6} placeholder="Enter pincode" value={pincode}
          onChange={e => { setPincode(e.target.value.replace(/\D/g, '')); setMsg(null); }}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2F4A3A]"
        />
        <button
          onClick={check} disabled={checking}
          className="text-sm font-bold px-4 py-2 rounded-lg transition-all"
          style={{ background: BRAND_GRADIENT, color: '#fff', cursor: checking ? 'not-allowed' : 'pointer', opacity: checking ? 0.7 : 1 }}
        >
          {checking ? '...' : 'Check'}
        </button>
      </div>
      {msg && <p className={`text-sm mt-2 font-medium ${msg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
    </div>
  );
}

function WishlistButton({ productId }: { productId: number }) {
  const [wished, setWished] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!Number.isFinite(productId) || productId <= 0) return;
    isWishlistedAsync(productId).then(v => { if (alive) setWished(v); }).catch(() => {});
    return () => { alive = false; };
  }, [productId]);
  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await toggleWishlist(productId);
      setWished(next.productIds.includes(productId));
    } catch { } finally { setBusy(false); }
  };
  return (
    <button
      onClick={toggle} disabled={busy}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border font-semibold text-base transition-all"
      style={{
        borderColor: wished ? '#E8314A' : '#d1d5db',
        color: wished ? '#E8314A' : '#374151',
        background: wished ? '#fef2f2' : '#fff',
        cursor: busy ? 'not-allowed' : 'pointer',
        opacity: busy ? 0.85 : 1,
      }}
    >
      <LuHeart size={18} style={{ fill: wished ? '#E8314A' : 'none', stroke: '#E8314A' }} />
      {wished ? 'Wishlisted' : 'Wishlist'}
    </button>
  );
}

function CustomizationBadge() {
  const [tip, setTip] = useState(false);
  return (
    <div className="flex items-center gap-2 mt-3 relative">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-green-200 bg-green-50">
        <LuPencilLine size={14} color="#16a34a" />
        <span className="text-sm font-bold text-green-700">Customization Available</span>
      </div>
      <button onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)} className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs font-bold">?</button>
      {tip && (
        <div className="absolute bottom-full left-0 mb-2 p-3 rounded-lg bg-gray-900 text-white text-sm w-64 shadow-lg z-20">
          Add a personal touch! Contact us via WhatsApp for custom engravings, monograms, or colour variations.
          <div className="absolute top-full left-5 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl">Size Guide</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-100">{['Size', 'Width', 'Depth', 'Height'].map(h => <th key={h} className="px-3 py-2 text-left text-sm border">{h}</th>)}</tr></thead>
          <tbody>
            {SIZE_GUIDE_DATA.map((r, i) => (
              <tr key={r.size} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 border font-bold text-[#2F4A3A]">{r.size}</td>
                <td className="px-3 py-2 border">{r.width}</td>
                <td className="px-3 py-2 border">{r.depth}</td>
                <td className="px-3 py-2 border">{r.height}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-3">All measurements are approximate. ±2cm tolerance.</p>
      </div>
    </div>
  );
}

function DeliveryStrip() {
  return (
    <div className="grid grid-cols-2 gap-px rounded-xl overflow-hidden mb-4 border border-gray-200">
      {DELIVERY_FEATURES.map(({ icon, label, sub }) => (
        <div key={label} className="flex items-center gap-3 bg-white px-4 py-3">
          <span className="text-[#2F4A3A] flex-shrink-0">{icon}</span>
          <div><div className="text-sm font-bold text-gray-800">{label}</div><div className="text-xs text-gray-400">{sub}</div></div>
        </div>
      ))}
    </div>
  );
}

function OfferCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-sm text-gray-500">Use Code:</span>
      <div className="relative">
        {copied && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 rounded bg-green-600 text-white text-xs whitespace-nowrap">✓ Copied!</div>}
        <button onClick={copy} className="text-sm font-bold px-4 py-1.5 rounded border-dashed border text-[#2F4A3A] bg-gray-50 border-[#2F4A3A]">{code}</button>
      </div>
    </div>
  );
}

function BestOffersBox({ offers }: { offers: typeof OFFERS }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 mb-4 bg-yellow-50/30">
      <div className="flex items-center gap-2 mb-3"><span className="text-lg">🏷️</span><h4 className="text-sm font-bold text-red-600 uppercase">Best Offers for You!</h4></div>
      {offers.map((offer, i) => (
        <div key={offer.code} className={i > 0 ? 'border-t border-gray-200 pt-3 mt-3' : ''}>
          <p className="text-sm leading-relaxed text-gray-800"><strong>{offer.info.split('—')[0].trim()}</strong> — {offer.info.split('—')[1]?.trim()}</p>
          <OfferCode code={offer.code} />
        </div>
      ))}
    </div>
  );
}

function QuantitySelector({ quantity, onDecrement, onIncrement, onChange, maxQty, disabled }: any) {
  const [err, setErr] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) { onChange(1); return; }
    if (val > maxQty) { setErr(true); onChange(maxQty); return; }
    setErr(false);
    onChange(val);
  };
  return (
    <div className="relative inline-flex mb-4">
      {err && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 rounded text-xs font-bold text-white bg-red-600">Only {maxQty} left!</div>}
      <button onClick={onDecrement} disabled={disabled || quantity <= 1} className="w-10 h-10 border border-gray-300 bg-white hover:bg-[#2F4A3A] hover:text-white transition text-xl">−</button>
      <input type="number" min={1} max={maxQty} value={quantity} onChange={handleChange} disabled={disabled} className="w-14 h-10 border-t border-b border-gray-300 text-center font-bold text-base outline-none" />
      <button onClick={onIncrement} disabled={disabled || quantity >= maxQty} className="w-10 h-10 border border-gray-300 bg-white hover:bg-[#2F4A3A] hover:text-white transition text-xl">+</button>
    </div>
  );
}

function OutOfStockPanel() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmit] = useState(false);
  const [error, setError] = useState('');
  const submit = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    setError('');
    setSubmit(true);
  };
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4">
      <div className="flex items-center gap-2.5 mb-3"><span className="text-xl">😔</span><div><div className="text-base font-bold text-red-700">Currently Out of Stock</div><div className="text-sm text-gray-500">We're restocking soon — get notified!</div></div></div>
      {submitted ? <div className="text-sm font-bold text-green-600">✓ You're on the list! We'll email you when it's back.</div> : (
        <div>
          <div className="flex gap-2">
            <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#2F4A3A]" />
            <button onClick={submit} className="text-white text-sm font-bold px-4 py-2 rounded-lg" style={{ background: BRAND_GRADIENT }}>Notify Me</button>
          </div>
          {error && <p className="text-sm text-red-500 mt-1.5">{error}</p>}
        </div>
      )}
    </div>
  );
}

function AddToCartButtons({ onAddToCart, isAdding, outOfStock }: any) {
  return (
    <div className="flex gap-3 mb-4">
      <button
        onClick={!outOfStock && !isAdding ? onAddToCart : undefined}
        disabled={isAdding || outOfStock}
        className="flex-1 h-12 text-base font-semibold rounded-xl transition-all"
        style={{ background: outOfStock ? '#d1d5db' : isAdding ? '#786b4a' : BRAND_GRADIENT, color: '#fff', cursor: outOfStock || isAdding ? 'not-allowed' : 'pointer' }}
      >
        {outOfStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
      </button>
      <button
        disabled={outOfStock}
        className="flex-1 h-12 text-base font-semibold rounded-xl transition-all border-2"
        style={{ background: '#fff', color: outOfStock ? '#9ca3af' : '#2F4A3A', borderColor: outOfStock ? '#d1d5db' : '#2F4A3A', cursor: outOfStock ? 'not-allowed' : 'pointer' }}
        onMouseEnter={e => { if (!outOfStock) { e.currentTarget.style.background = BRAND_GRADIENT; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; } }}
        onMouseLeave={e => { if (!outOfStock) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#2F4A3A'; e.currentTarget.style.borderColor = '#2F4A3A'; } }}
      >
        Buy Now
      </button>
    </div>
  );
}

function BulkOrderLink({ productName, sku }: { productName: string; sku: string }) {
  const msg = encodeURIComponent(`I want to buy ${productName} - ${sku} in bulk. Can you please help me for the same?`);
  return (
    <p className="text-sm font-medium flex items-center gap-1.5 mb-3">
      <FaWhatsapp size={16} color="#25d366" />Want to buy in bulk?{' '}
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`} target="_blank" rel="noreferrer" className="font-bold underline text-[#2F4A3A]">Chat with us</a>
    </p>
  );
}

function SocialShare({ productName }: { productName: string }) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(productName);
  const socials = [
    { icon: <FaFacebookF size={16} />, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${url}`, bg: '#1877f2' },
    { icon: <FaTwitter size={16} />, label: 'Twitter', href: `https://twitter.com/intent/tweet?text=${title}&url=${url}`, bg: '#1da1f2' },
    { icon: <FaPinterestP size={16} />, label: 'Pinterest', href: `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`, bg: '#e60023' },
    { icon: <FaWhatsapp size={16} />, label: 'WhatsApp', href: `https://wa.me/?text=${title}%20${url}`, bg: '#25d366' },
  ];
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-semibold text-gray-600">Share:</span>
      {socials.map(({ icon, label, href, bg }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: bg, color: '#fff' }}>{icon}</a>
      ))}
    </div>
  );
}

function AccordionItem({ title, content, defaultOpen = false }: { title: string; content: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <button onClick={() => setOpen(!open)} className="flex justify-between items-center w-full text-left">
        <span className="text-base font-bold text-gray-800">{title}</span>
        <span className={`transform transition-transform duration-200 text-xl ${open ? 'rotate-45' : 'rotate-0'}`}>+</span>
      </button>
      {open && <div className="mt-3 text-sm text-gray-600 leading-relaxed">{content}</div>}
    </div>
  );
}

function DescriptionAccordion({ text }: { text?: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full text-left">
        <span className="text-base font-bold text-gray-800">Description</span>
        <span className={`transform transition-transform duration-200 text-xl ${isOpen ? 'rotate-45' : 'rotate-0'}`}>+</span>
      </button>
      {isOpen && (
        <div className="mt-3">
          <div
            className="overflow-hidden text-sm text-gray-600 leading-relaxed transition-all"
            style={{ maxHeight: expanded ? 'none' : 120, whiteSpace: 'pre-line' }}
          >
            {text ||
              'From morning eggs to gourmet stir-fries, this tri-ply hammered stainless steel frying pan is your go-to for effortless cooking.'}
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-sm font-semibold underline mt-2 text-[#2F4A3A]">{expanded ? 'Read Less' : 'Read More'}</button>
        </div>
      )}
    </div>
  );
}

function ProductAccordions({ descriptionText, detailsText, featuresText }: { descriptionText?: string; detailsText?: string; featuresText?: string }) {
  const bullets = (items: string[]) => (
    <ul className="list-disc pl-5 space-y-1 text-sm">
      {items.map(f => <li key={f}>{f}</li>)}
    </ul>
  );

  const parseDetailPairs = (blob?: string): [string, string][] => {
    const text = String(blob ?? '').trim();
    if (!text) return [];
    const matches = [...text.matchAll(/([A-Za-z ]+):/g)];
    if (matches.length === 0) return [];
    const pairs: [string, string][] = [];
    for (let i = 0; i < matches.length; i++) {
      const key = (matches[i][1] ?? '').trim();
      const start = (matches[i].index ?? 0) + matches[i][0].length;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
      const value = text.slice(start, end).trim();
      if (key) pairs.push([key, value]);
    }
    return pairs;
  };

  const detailPairs = parseDetailPairs(detailsText);
  const featureLines = typeof featuresText === 'string'
    ? featuresText.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    : [];
  // Shipping table – only symbol changed (numbers unchanged)
  const SHIP_ROWS: [string, string, string][] = [
    ['Prepaid', 'Rs. 50', 'Free'],
    ['Cash on Delivery', 'Rs. 90', 'Rs. 40']
  ];
  const INFO_ROWS: [string, string][] = detailPairs.length
    ? detailPairs
    : [
        ['Size', '20cm D × 40cm L × 8cm H | 1000ml'],
        ['Colour', 'Silver'],
        ['Material', 'Stainless steel, aluminium core'],
      ];

  return (
    <div className="mt-2">
      <DescriptionAccordion text={descriptionText} />
      <AccordionItem
        title="Features"
        content={
          featuresText
            ? (featureLines.length > 1
                ? bullets(featureLines)
                : <p className="text-sm" style={{ whiteSpace: 'pre-line' }}>{String(featuresText)}</p>)
            : bullets([
                'Extra-thick 2.5mm tri-ply construction',
                '100% food-safe and non-reactive',
                'Stovetop and induction-safe',
                'Scratch and rust-resistant',
                'Dishwasher-safe',
                'Sturdy riveted stainless steel handle',
                'Inner 304-grade stainless steel',
              ])
        }
      />
      <AccordionItem title="Size & Detail" content={<div className="flex flex-col gap-1.5 text-sm">{INFO_ROWS.map(([k, v]) => <div key={k} className="flex gap-2"><span className="font-bold w-16">{k}:</span><span>{v}</span></div>)}</div>} />
      <AccordionItem title="Returns" content={<p className="text-sm">Free 7-day returns. Visit our <a href="/return-policy" className="underline text-[#2F4A3A]">Return Policy</a> page.</p>} />
      <AccordionItem title="Care Instructions" content={bullets(['Wash with mild dish soap and a soft sponge.', 'Do not use steel wool.', 'Wipe dry after washing.'])} />
      <AccordionItem title="Shipping" content={
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2.5 py-2 text-left border">Mode</th>
              <th className="px-2.5 py-2 text-left border">{`< ₹500`}</th>
              <th className="px-2.5 py-2 text-left border">{`> ₹500`}</th>
            </tr>
          </thead>
          <tbody>
            {SHIP_ROWS.map(([m, lt, gt], i) => (
              <tr key={m} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2.5 py-2 border">{m}</td>
                <td className="px-2.5 py-2 border text-center">{lt}</td>
                <td className="px-2.5 py-2 border text-center font-bold" style={{ color: gt === 'Free' ? '#16a34a' : undefined }}>{gt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      } />
    </div>
  );
}

function CustomerReviews({ rating, total, reviews, onAdd, onDelete }: { rating: number; total: number; reviews: any[]; onAdd?: (r: any) => void; onDelete?: (id: number) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ name: '', rating: 5, title: '', body: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    if (!form.body || !form.rating) return
    setSending(true)
    try {
      if (onAdd) await onAdd({ ...form })
      setForm({ name: '', rating: 5, title: '', body: '' })
      setShowForm(false)
    } catch (err) {
      console.warn('add review failed', err)
    } finally {
      setSending(false)
    }
  }

  const tokenPresent = Boolean(window.localStorage.getItem('access_token'))

  return (
    <div id="customer-reviews" className="py-12">
      <div className="max-w-[1720px] mx-auto px-5">
        <div className="flex items-start justify-between flex-wrap gap-6 mb-9">
          <div>
            <h3 className="text-2xl font-bold mb-2.5">Customer Reviews</h3>
            <div className="flex items-center gap-3"><StarRating rating={rating} size={24} /><span className="text-3xl font-extrabold">{rating}</span><span className="text-sm text-gray-500">out of 5 · {total} reviews</span></div>
            <div className="mt-4 flex flex-col gap-1.5">
              {RATING_BREAKDOWN.map(({ s, p }) => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 text-right font-semibold text-gray-700">{s}</span>
                  <LuStar size={12} color="#f5a623" />
                  <div className="w-40 h-2 rounded-full overflow-hidden bg-gray-200"><div className="h-full rounded-full" style={{ width: `${p}%`, background: '#f5a623' }} /></div>
                  <span className="text-gray-400 w-7">{p}%</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setShowForm(s => !s)} className="inline-flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded" style={{ background: BRAND_GRADIENT }}><LuPencilLine size={16} />{showForm ? 'Cancel' : 'Write a Review'}</button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="mb-6 bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex gap-3 mb-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" className="border border-gray-200 px-3 py-2 rounded w-1/3" />
              <select value={String(form.rating)} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} className="border border-gray-200 px-3 py-2 rounded w-1/6">
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} star</option>)}
              </select>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" className="border border-gray-200 px-3 py-2 rounded flex-1" />
            </div>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your review" className="w-full border border-gray-200 px-3 py-2 rounded mb-3" rows={4} />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={sending} className="px-4 py-2 rounded text-white" style={{ background: BRAND_GRADIENT }}>{sending ? 'Posting...' : 'Post Review'}</button>
              {!tokenPresent && <span className="text-sm text-gray-500">Sign in to post a review (optional but recommended)</span>}
            </div>
          </form>
        )}

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <div key={r.id} className="bg-white rounded-xl p-5 flex flex-col gap-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{String(r.name ?? r.user?.name ?? '?').trim().slice(0,2).toUpperCase()}</div>
                <div className="flex-1">
                  <div className="text-base font-bold">{r.name ?? r.user?.name ?? 'Customer'}</div>
                  <div className="flex items-center gap-1.5 mt-0.5"><StarRating rating={Number(r.rating) || 0} size={14} />{r.verified && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200 bg-green-50 text-green-700">✓ Verified</span>}</div>
                </div>
                <span className="text-xs text-gray-400">{new Date(r.date ?? Date.now()).toLocaleDateString()}</span>
              </div>
              <div><div className="text-base font-bold mb-1">{r.title}</div><p className="text-sm text-gray-600 leading-relaxed">{r.body}</p></div>
              <div className="border-t border-gray-100 pt-2.5 flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Helpful?</span>
                <button className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5">👍 Yes</button>
                <button className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5">👎 No</button>
                {tokenPresent && onDelete && (
                  <button onClick={() => onDelete(r.id)} className="ml-auto text-xs text-red-600 border border-red-100 rounded px-2 py-0.5">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8"><button className="bg-transparent font-bold text-sm px-7 py-2.5 rounded border border-[#2F4A3A] text-[#2F4A3A]">View All {total} Reviews</button></div>
      </div>
    </div>
  )
}

// ----- MAIN COMPONENT -----
export default function ProductDetails() {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const parsedId = parseInt(id ?? '0', 10);
  const fallbackProduct = productList.find((item: any) => item.id === parsedId);
  const [product, setProduct] = useState<any>(fallbackProduct);
  const [reviews, setReviews] = useState<any[]>(REVIEWS)
  const [, setReviewsLoading] = useState(true)

  const stockQty: number =
    Number(product?.variants?.[0]?.stock ?? product?.stock ?? STOCK_QTY_FALLBACK) || 0;
  const OUT_OF_STOCK = stockQty === 0;
  const MAX_QTY = OUT_OF_STOCK ? 0 : stockQty;
  const countdown = useCountdown(SALE_TARGET);

  useEffect(() => {
    AOS.init({ once: true, duration: 600 });
    let alive = true;
    if (!Number.isFinite(parsedId)) return;
    setLoading(true);
    getProductDetailsById(parsedId)
      .then(async (details) => {
        if (!alive) return;
        if (details) {
          setProduct(details);
          return;
        }
        const p = await getProductById(parsedId);
        if (alive) setProduct(p ?? fallbackProduct);
      })
      .catch(async () => {
        if (!alive) return;
        try {
          const p = await getProductById(parsedId);
          if (alive) setProduct(p ?? fallbackProduct);
        } catch {
          if (alive) setProduct(fallbackProduct);
        }
      })
      .finally(() => { if (alive) setLoading(false); });
    // fetch reviews for this product
    (async () => {
      setReviewsLoading(true)
      try {
        const rv = await getReviewsByProduct(parsedId)
        if (alive && Array.isArray(rv) && rv.length > 0) setReviews(rv)
      } catch (e) {
        // ignore
      } finally {
        if (alive) setReviewsLoading(false)
      }
    })()
    return () => { alive = false; };
  }, [parsedId]);

  const productName = product?.name ?? 'Classic Relaxable Chair';

  const apiPrice = product?.price ?? product?.product_price ?? product?.productPrice ?? '$85.00';
  const apiOriginal = product?.originalPrice ?? product?.original_price ?? product?.compare_price;

  const productPriceINR = formatINR(apiPrice);
  const comparePriceINR = apiOriginal ? formatINR(apiOriginal) : '';

  const priceNum = typeof apiPrice === 'number'
    ? apiPrice
    : parseFloat(String(apiPrice ?? '').replace(/[^0-9.]/g, ''));
  const compareNum = apiOriginal === undefined || apiOriginal === null
    ? 0
    : (typeof apiOriginal === 'number' ? apiOriginal : parseFloat(String(apiOriginal).replace(/[^0-9.]/g, '')));

  const discountPercent =
    Number(product?.discountPercentage ?? product?.discount_percentage ?? product?.discount) ||
    (compareNum > 0 && priceNum > 0 ? Math.round(((compareNum - priceNum) / compareNum) * 100) : 0);

  const imagesFromApi: string[] = Array.isArray(product?.images)
    ? product.images.filter(Boolean)
    : [];
  const productImage = imagesFromApi[0] ?? product?.image ?? productImages.p1;

  const mediaItems: MediaItem[] = imagesFromApi.length
    ? imagesFromApi.map((url, idx) => ({
        type: 'image',
        url,
        thumbnail: url,
        alt: `${productName} view ${idx + 1}`,
      }))
    : [
        { type: 'image', url: productImage, thumbnail: productImage, alt: `${productName} main` },
        { type: 'image', url: productImages.p2, thumbnail: productImages.p2, alt: `${productName} view 2` },
        { type: 'image', url: productImages.p3, thumbnail: productImages.p3, alt: `${productName} view 3` },
        { type: 'image', url: productImages.p4, thumbnail: productImages.p4, alt: `${productName} view 4` },
      ];

  const handleDecrement = () => setQuantity(q => Math.max(1, q - 1));
  const handleIncrement = () => setQuantity(q => Math.min(MAX_QTY, q + 1));
  const handleQtyChange = (val: number) => setQuantity(val);
  const handleAddToCart = async () => {
    if (OUT_OF_STOCK) return;
    if (!Number.isFinite(parsedId) || parsedId <= 0) return;
    const variantId = Number(product?.variants?.[0]?.variantId ?? product?.variants?.[0]?.variant_id) || 0;
    setCartError(null);
    setIsAdding(true);
    try {
      await addToCart(parsedId, quantity, variantId || undefined);
    } catch (e: any) {
      setCartError(e?.message ?? 'Failed to add to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const sizes: string[] =
    Array.isArray(product?.variants?.[0]?.sizes) && product.variants[0].sizes.length
      ? product.variants[0].sizes
      : (typeof product?.variants?.[0]?.size === 'string'
          ? product.variants[0].size.split(',').map((s: string) => s.trim()).filter(Boolean)
          : ['S', 'M', 'L', 'XL']);

  const apiColors: string[] =
    Array.isArray(product?.variants?.[0]?.colors) && product.variants[0].colors.length
      ? product.variants[0].colors
      : (typeof product?.variants?.[0]?.color === 'string'
          ? product.variants[0].color.split(',').map((c: string) => c.trim()).filter(Boolean)
          : []);

  const colors = (apiColors.length ? apiColors : ['BLACK', 'YELLOW', 'GREEN', 'ORANGE']).map((label, idx) => ({
    label,
    defaultChecked: idx === 0,
  }));
  const CLOCK_UNITS: [string, keyof ReturnType<typeof useCountdown>][] = [['D', 'days'], ['H', 'hours'], ['M', 'minutes'], ['S', 'seconds']];

  if (loading) {
    return (
      <>
        <NavbarOne />
        <div className="s-py-50">
          <div className="container-fluid">
            <div className="max-w-[1720px] mx-auto flex items-center justify-center min-h-[400px]">
              <FourSquare color={BRAND_SOLID} size="large" />
            </div>
          </div>
        </div>
        <FooterOne />
        <ScrollToTop />
      </>
    );
  }

  return (
    <>
      <NavbarOne />
      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />

      {/* Breadcrumb */}
      <div className="bg-gray-50 py-5 md:py-[30px]">
        <div className="container-fluid">
          <ul className="flex items-center gap-2.5 text-sm md:text-base leading-none text-gray-500 max-w-[1720px] mx-auto flex-wrap">
            <li><Link to="/" className="hover:text-[#2F4A3A]">Home</Link></li>
            <li>/</li>
            <li><Link to="/shop-v1" className="hover:text-[#2F4A3A]">Shop</Link></li>
            <li>/</li>
            <li className="font-semibold text-gray-800">{productName}</li>
          </ul>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="s-py-50">
        <div className="container-fluid">
          <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row gap-10">
            {/* Gallery */}
            <div className="w-full lg:w-[58%]">
              <ProductGallery media={mediaItems} productName={productName} discountPct={`-${discountPercent}%`} />
            </div>

            {/* Info */}
            <div className="lg:max-w-[635px] w-full">
              <div className="pb-5 border-b border-gray-200">
                {OUT_OF_STOCK && <div className="inline-block text-sm font-bold px-3 py-1 rounded border mb-2 bg-red-50 border-red-200 text-red-600">Out of Stock</div>}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{productName}</h2>
                <RatingSummary rating={RATING_SUMMARY.average} total={RATING_SUMMARY.total} />
                <StockIndicator qty={stockQty} />
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {comparePriceINR && <span className="text-lg line-through text-gray-400">{comparePriceINR}</span>}
                  <span className="text-3xl md:text-4xl font-extrabold" style={{ background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{productPriceINR}</span>
                  <span className="text-sm font-bold px-2 py-1 rounded bg-red-100 text-red-600 border border-red-200">Save {discountPercent}%</span>
                </div>
                <CustomizationBadge />

                <div className="mt-5 flex items-center gap-4 flex-wrap">
                  <h4 className="text-xl font-bold">Hurry Up!</h4>
                  <div className="bg-red-50 rounded-full px-4 py-2 flex items-center gap-2">
                    {CLOCK_UNITS.map(([lbl, key], i, arr) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-red-600">{countdown[key]}</span>
                        <span className="text-sm font-semibold text-red-600">{lbl}</span>
                        {i < arr.length - 1 && <span className="text-red-600 text-lg">:</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-base text-gray-600 mt-5 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                  {product?.description ?? `Experience the epitome of relaxation with our ${productName}. Crafted with plush cushioning and ergonomic design, it offers unparalleled comfort for lounging or reading.`}
                </p>
              </div>

              <div className="py-4"><DeliveryStrip /></div>
              <DeliveryInfo />

              <div className="pb-5 border-b border-gray-200">
                {OUT_OF_STOCK ? (
                  <OutOfStockPanel />
                ) : (
                  <div className="flex items-center gap-4 flex-wrap mb-2">
                    <QuantitySelector quantity={quantity} onDecrement={handleDecrement} onIncrement={handleIncrement} onChange={handleQtyChange} maxQty={MAX_QTY} disabled={false} />
                    <WishlistButton productId={parsedId} />
                  </div>
                )}
                <BulkOrderLink productName={productName} sku="CH_0015" />
                <BestOffersBox offers={OFFERS} />
                <AddToCartButtons onAddToCart={handleAddToCart} isAdding={isAdding} outOfStock={OUT_OF_STOCK} />
                {cartError && <p className="text-sm text-red-600 mt-2">{cartError}</p>}
              </div>

              <div className="py-5 border-b border-gray-200">
                <div className="flex gap-x-8 gap-y-2 flex-wrap mb-2">
                  <h6 className="text-sm font-medium text-gray-500">SKU: {String(product?.id ?? parsedId ?? '—')}</h6>
                  <h6 className="text-sm font-medium text-gray-500">Category: {String(product?.category?.name ?? '—')}</h6>
                </div>
                <div className="flex flex-wrap gap-6 mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">Size:</span>
                    <div className="flex gap-2">
                      {sizes.map(s => (
                        <label key={s} className="cursor-pointer">
                          <input type="radio" name="size" defaultChecked={s === 'S'} className="hidden peer" />
                          <span className="w-8 h-8 flex items-center justify-center text-sm border border-gray-300 rounded-md peer-checked:bg-[#2F4A3A] peer-checked:text-white peer-checked:border-transparent transition">{s}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={() => setSizeGuideOpen(true)} className="text-sm text-[#2F4A3A] underline flex items-center gap-1"><LuInfo size={14} /> Size Guide</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">Color:</span>
                    <div className="flex gap-2">
                      {colors.map(({ label, defaultChecked }) => (
                        <label key={label} className="cursor-pointer">
                          <input type="radio" name="color" defaultChecked={defaultChecked} className="hidden peer" />
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200 peer-checked:bg-[#2F4A3A] peer-checked:text-white peer-checked:border-transparent transition">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-5 border-b border-gray-200">
                <h4 className="text-base font-semibold mb-3">Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {product?.tag && (
                    <Link key={String(product.tag)} to="#" className="text-sm bg-gray-100 hover:bg-[#2F4A3A] hover:text-white px-3 py-1 rounded-full transition">{String(product.tag)}</Link>
                  )}
                  {productTag.map(tag => (
                    <Link key={tag} to="#" className="text-sm bg-gray-100 hover:bg-[#2F4A3A] hover:text-white px-3 py-1 rounded-full transition">{tag}</Link>
                  ))}
                </div>
              </div>

              <div className="pt-5"><SocialShare productName={productName} /></div>
              <div className="mt-6"><ProductAccordions descriptionText={product?.description} detailsText={product?.details} featuresText={product?.features} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="border-t border-gray-200 bg-gray-50">
        <CustomerReviews
          rating={RATING_SUMMARY.average}
          total={Math.max(RATING_SUMMARY.total, reviews.length)}
          reviews={reviews}
          onAdd={async (payload: any) => {
            // payload expected { name, rating, title, body }
            try {
              const created = await addReviewApi({ product_id: parsedId, rating: Number(payload.rating) || 5, title: payload.title, body: payload.body, name: payload.name })
              if (created) setReviews(prev => [created, ...prev])
            } catch (err) {
              console.warn('add review failed', err)
              throw err
            }
          }}
          onDelete={async (id: number) => {
            const ok = await deleteReviewApi(id)
            if (ok) setReviews(prev => prev.filter(r => r.id !== id))
          }}
        />
      </div>

      {/* Detail Tab */}
      {/* <div className="s-py-50"><DetailTab /></div> */}

      {/* Related Products */}
      <div className="s-py-50-100">
        <div className="container-fluid">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold">Related Products</h3>
            <p className="text-base text-gray-500 mt-2">Explore complementary options curated just for you.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1720px] mx-auto">
            {productList.slice(0, 4).map((item: any) => (
              <LayoutOne key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  );
}