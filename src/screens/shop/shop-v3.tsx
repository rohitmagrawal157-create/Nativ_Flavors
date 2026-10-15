// @ts-nocheck
'use client'

// src/screens/shop/ShopV3.tsx
// =============================================================================
//  ShopV3 — PrintZone Printing & Signage Shop
//  Matches full site theme: #2F4A3A accent, DM Sans + Syne fonts,
//  printing/signage category data, same layout patterns as CategoryShopPage.
// =============================================================================

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from '@/lib/router'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import MultiRangeSlider from 'multi-range-slider-react'
import Aos from 'aos'
import 'aos/dist/aos.css'

import NavbarOne from '../../components/navbar/navbar-one'
import FooterOne from '../../components/footer/footer-one'
import ScrollToTop from '../../components/scroll-to-top'
import { addToCart } from '../../api/cart.api'
import { isWishlistedAsync, toggleWishlist } from '../../api/wishlist.api'

import bg from '../../assets/img/shortcode/breadcumb.jpg'

// ─── Theme constants (matches NavbarOne & CategoryShopPage) ───────────────────
const ACCENT  = '#2F4A3A'
const FONT    = "'DM Sans', sans-serif"
const FONT_H  = "'DM Sans', sans-serif"

// ─── Printing & Signage Category Slider Data ──────────────────────────────────
const CATEGORY_SLIDES = [
  {
    slug:  'uv-flatbed-printing',
    name:  'UV Flatbed Printing',
    label: '5 Services',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80',
    color: '#2F4A3A',
  },
  {
    slug:  'led-products',
    name:  'LED Products',
    label: '12 Products',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&q=80',
    color: '#f59e0b',
  },
  {
    slug:  'offset-products',
    name:  'Offset Products',
    label: '14 Products',
    image: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=700&q=80',
    color: '#10b981',
  },
  {
    slug:  'eco-solvent',
    name:  'Eco Solvent',
    label: '5 Services',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=700&q=80',
    color: '#8b5cf6',
  },
  {
    slug:  'cnc-cutting-carving',
    name:  'CNC Cutting & Carving',
    label: '4 Materials',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=700&q=80',
    color: '#ef4444',
  },
  {
    slug:  'signages-products',
    name:  'Signages Products',
    label: '4 Types',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=700&q=80',
    color: '#0891b2',
  },
]

// ─── Brand options ─────────────────────────────────────────────────────────────
const BRANDS = [
  'All Brands',
  'HP Latex',
  'Roland',
  'Epson EcoTank',
  'Mimaki',
  'Mutoh',
  'Canon',
]

// ─── Sort options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'default',    label: 'Default Sorting' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',     label: 'Newest First' },
]

// ─── Product data (PrintZone printing/signage products) ───────────────────────
const PRODUCTS = [
  {
    id: 101, badge: 'New',
    tag: 'UV Flatbed Printing',
    name: 'UV Print on Glass Panel (A2)',
    price: '₹ 499', originalPrice: '₹ 699',
    rating: 5, category: 'uv-flatbed-printing',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
  },
  {
    id: 102, badge: 'Sale',
    tag: 'UV Flatbed Printing',
    name: 'Acrylic UV Printed Board (3mm)',
    price: '₹ 349', originalPrice: '₹ 499',
    rating: 4, category: 'uv-flatbed-printing',
    image: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=500&q=80',
  },
  {
    id: 103, badge: 'New',
    tag: 'LED Products',
    name: 'LED Scroll Display (2×1 ft)',
    price: '₹ 1,299', originalPrice: '₹ 1,699',
    rating: 5, category: 'led-products',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80',
  },
  {
    id: 104, badge: null,
    tag: 'LED Products',
    name: 'Glow Sign Board — Single Face',
    price: '₹ 899', originalPrice: '₹ 1,099',
    rating: 4, category: 'led-products',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&q=80',
  },
  {
    id: 105, badge: 'Sale',
    tag: 'Offset Products',
    name: 'Business Cards (250 pcs, Premium)',
    price: '₹ 299', originalPrice: '₹ 449',
    rating: 5, category: 'offset-products',
    image: 'https://images.unsplash.com/photo-1620912189869-80c97da1e82c?w=500&q=80',
  },
  {
    id: 106, badge: null,
    tag: 'Offset Products',
    name: 'A4 Brochure Printing (100 pcs)',
    price: '₹ 599', originalPrice: '₹ 799',
    rating: 4, category: 'offset-products',
    image: 'https://images.unsplash.com/photo-1536104968055-4d61aa56f46a?w=500&q=80',
  },
  {
    id: 107, badge: 'New',
    tag: 'Eco Solvent',
    name: 'Canvas Print 24×36 inch',
    price: '₹ 799', originalPrice: '₹ 999',
    rating: 5, category: 'eco-solvent',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&q=80',
  },
  {
    id: 108, badge: null,
    tag: 'Eco Solvent',
    name: 'Flex Banner Printing (per sq.ft)',
    price: '₹ 149', originalPrice: '₹ 199',
    rating: 4, category: 'eco-solvent',
    image: 'https://images.unsplash.com/photo-1558618048-fbd3e67fc3af?w=500&q=80',
  },
  {
    id: 109, badge: 'Sale',
    tag: 'CNC Cutting',
    name: 'MDF CNC Cut Letters (per letter)',
    price: '₹ 85', originalPrice: '₹ 120',
    rating: 5, category: 'cnc-cutting-carving',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&q=80',
  },
  {
    id: 110, badge: null,
    tag: 'Signages Products',
    name: 'Acrylic Laser Cut Name Plate',
    price: '₹ 249', originalPrice: '₹ 349',
    rating: 4, category: 'signages-products',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toSlug = (s: string) => s.toLowerCase().replace(/[\s&\/]+/g, '-')

const parsePrice = (price: string) =>
  parseFloat(price.replace(/[₹$,\s]/g, '')) || 0

// ─── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="12" height="12"
          viewBox="0 0 20 20"
          fill={star <= rating ? '#f59e0b' : '#e5e7eb'}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ─── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ item }: { item: typeof PRODUCTS[0] }) {
  const [wishlisted, setWishlisted] = useState(() => {
    try {
      const raw = window.localStorage.getItem('wishlist_items_v1')
      if (!raw) return false
      const ids = JSON.parse(raw) as number[]
      return Array.isArray(ids) && ids.includes(item.id)
    } catch { return false }
  })
  const [addedToCart, setAddedToCart] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const sync = () => {
      isWishlistedAsync(item.id).then(setWishlisted).catch(() => {})
    }
    window.addEventListener('wishlist:changed', sync)
    return () => window.removeEventListener('wishlist:changed', sync)
  }, [item.id])

  const handleCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    if (cartLoading) return
    setCartLoading(true)
    try {
      await addToCart(item.id, 1)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    } catch { /* localStorage fallback handles it */ }
    finally { setCartLoading(false) }
  }, [item.id, cartLoading])

  const handleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    setWishlisted(prev => !prev)
    try { await toggleWishlist(item.id) }
    catch { setWishlisted(prev => !prev) }
  }, [item.id])

  return (
    <div
      className="group"
      style={{ fontFamily: FONT }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image wrapper */}
      <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
        {/* Badge */}
        {item.badge && (
          <span style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            background: item.badge === 'Sale' ? '#ef4444' : item.badge === 'New' ? '#22c55e' : ACCENT,
            color: 'white', fontSize: 10, fontWeight: 700,
            padding: '3px 8px', letterSpacing: '0.06em',
          }}>
            {item.badge}
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            width: 34, height: 34, borderRadius: '50%',
            background: 'white', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 0.25s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24"
            fill={wishlisted ? ACCENT : 'none'}
            stroke={ACCENT} strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          style={{
            width: '100%', aspectRatio: '4/3',
            objectFit: 'cover', display: 'block',
            transition: 'transform 0.6s ease',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}
        />

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          background: 'rgba(15,23,42,0.52)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 16, gap: 8,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}>
          <Link
            to={`/product/${item.id}`}
            style={{
              background: 'white', color: '#0f172a',
              fontSize: 11, fontWeight: 700,
              padding: '8px 16px', textDecoration: 'none',
              letterSpacing: '0.04em',
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'transform 0.3s ease 0.05s',
            }}
          >
            Quick View
          </Link>
          <button
            onClick={handleCart}
            disabled={cartLoading}
            style={{
              background: ACCENT, color: 'white', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, padding: '8px 16px',
              letterSpacing: '0.04em', fontFamily: FONT,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'transform 0.3s ease 0.1s',
              background: addedToCart ? '#22c55e' : ACCENT,
            }}
          >
            {cartLoading ? '…' : addedToCart ? '✓ Added' : '+ Cart'}
          </button>
        </div>
      </div>

      {/* Card body */}
      <div style={{ paddingTop: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {item.tag}
        </span>
        <h3 style={{ margin: '6px 0 6px', fontSize: 15, fontWeight: 500, lineHeight: 1.4, color: '#0f172a' }}>
          <Link
            to={`/product/${item.id}`}
            style={{
              textDecoration: 'none',
              color: hovered ? ACCENT : '#0f172a',
              transition: 'color 0.2s',
            }}
          >
            {item.name}
          </Link>
        </h3>
        <StarRating rating={item.rating} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: ACCENT, fontFamily: FONT_H }}>{item.price}</span>
          {item.originalPrice && (
            <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>{item.originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Custom Select ─────────────────────────────────────────────────────────────
function CustomSelect({
  options, value, onChange, placeholder,
}: {
  options: string[] | { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)

  const isObj = options.length > 0 && typeof options[0] === 'object'
  const getLabel = (o: any) => (typeof o === 'object' ? o.label : o)
  const getValue = (o: any) => (typeof o === 'object' ? o.value : o)

  const selectedLabel = isObj
    ? (options as { value: string; label: string }[]).find(o => o.value === value)?.label ?? placeholder
    : value || placeholder

  return (
    <div style={{ position: 'relative', userSelect: 'none', fontFamily: FONT }} onClick={() => setOpen(o => !o)}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 16px', border: `1.5px solid ${open ? ACCENT : '#e2e8f0'}`,
        background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500,
        color: value ? '#0f172a' : '#94a3b8',
        transition: 'border-color 0.2s',
        boxShadow: open ? `0 0 0 3px ${ACCENT}18` : 'none',
      }}>
        {selectedLabel}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: `1.5px solid ${ACCENT}44`,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 200,
          maxHeight: 220, overflowY: 'auto',
        }}>
          {options.map((o: any, i) => {
            const val = getValue(o)
            const lbl = getLabel(o)
            const isActive = val === value
            return (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); onChange(val); setOpen(false) }}
                style={{
                  padding: '10px 16px', fontSize: 13, cursor: 'pointer',
                  background: isActive ? `${ACCENT}12` : 'transparent',
                  color: isActive ? ACCENT : '#374151',
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? `3px solid ${ACCENT}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {lbl}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Scoped CSS ───────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Syne:wght@700;800&display=swap');

  .sv3-swiper .swiper-button-prev,
  .sv3-swiper .swiper-button-next {
    width: 42px; height: 42px;
    background: rgba(15,23,42,0.88);
    border-radius: 0;
    transition: background 0.2s;
  }
  .sv3-swiper .swiper-button-prev:hover,
  .sv3-swiper .swiper-button-next:hover { background: ${ACCENT}; }
  .sv3-swiper .swiper-button-prev::after,
  .sv3-swiper .swiper-button-next::after { font-size: 14px; font-weight: 900; color: white; }

  .sv3-cat-slide { position: relative; display: block; overflow: hidden; cursor: pointer; }
  .sv3-cat-slide img { width: 100%; height: 280px; object-fit: cover; display: block; transition: transform 0.6s ease; }
  .sv3-cat-slide:hover img { transform: scale(1.1); }
  .sv3-cat-slide .overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0) 55%);
    transition: opacity 0.3s;
  }
  .sv3-cat-slide:hover .overlay { opacity: 1; }
  .sv3-cat-slide .info {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;
    padding: 20px 18px; transform: translateY(4px); transition: transform 0.3s;
  }
  .sv3-cat-slide:hover .info { transform: translateY(0); }

  .sv3-filter-bar {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 20px 0;
    position: sticky; top: 130px; z-index: 50;
  }

  .sv3-product-grid {
    display: grid;
    gap: 28px 24px;
  }

  @keyframes sv3-fadein {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sv3-product-grid > * { animation: sv3-fadein 0.4s ease both; }

  .sv3-pagination-btn {
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; cursor: pointer;
    border: 1px solid #e2e8f0; background: transparent;
    transition: all 0.2s; font-family: ${FONT};
  }
  .sv3-pagination-btn:hover:not(:disabled) { border-color: ${ACCENT}; color: ${ACCENT}; }
  .sv3-pagination-btn.active { background: ${ACCENT}; color: white; border-color: ${ACCENT}; }
  .sv3-pagination-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Price input */
  .sv3-price-input {
    padding: 10px 14px; border: 1.5px solid #e2e8f0;
    width: 100%; font-family: ${FONT}; font-size: 13px;
    color: #0f172a; background: white; outline: none;
    transition: border-color 0.2s;
  }
  .sv3-price-input:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 3px ${ACCENT}18; }

  /* Divider */
  .sv3-divider {
    width: 1px; height: 36px;
    background: linear-gradient(to bottom, transparent, #cbd5e1, transparent);
  }
`

// ─── PRODUCTS PER PAGE ────────────────────────────────────────────────────────
const PER_PAGE = 10

// =============================================================================
//  MAIN COMPONENT
// =============================================================================
export default function ShopV3() {
  const [brand,       setBrand]       = useState('All Brands')
  const [sortBy,      setSortBy]      = useState('default')
  const [minPrice,    setMinPrice]    = useState(0)
  const [maxPrice,    setMaxPrice]    = useState(5000)
  const [minInput,    setMinInput]    = useState(0)
  const [maxInput,    setMaxInput]    = useState(5000)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [viewMode,    setViewMode]    = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    Aos.init({ duration: 600, once: true })
    window.scrollTo(0, 0)
  }, [])

  // Sync input fields → slider
  useEffect(() => { setMinInput(minPrice) }, [minPrice])
  useEffect(() => { setMaxInput(maxPrice) }, [maxPrice])

  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS]

    if (activeCategory) {
      list = list.filter(p => p.category === activeCategory)
    }

    list = list.filter(p => {
      const price = parsePrice(p.price)
      return price >= minPrice && price <= maxPrice
    })

    switch (sortBy) {
      case 'price-asc':  list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price)); break
      case 'price-desc': list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price)); break
      case 'rating':     list.sort((a, b) => b.rating - a.rating); break
      case 'newest':     list.sort((a, b) => b.id - a.id); break
    }

    return list
  }, [brand, sortBy, minPrice, maxPrice, activeCategory])

  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE)
  const paginated  = filteredProducts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const resetFilters = () => {
    setBrand('All Brands')
    setSortBy('default')
    setMinPrice(0)
    setMaxPrice(5000)
    setActiveCategory(null)
    setCurrentPage(1)
  }

  const hasFilters = brand !== 'All Brands' || sortBy !== 'default' || minPrice > 0 || maxPrice < 5000 || activeCategory !== null

  return (
    <>
      <style>{STYLES}</style>

      <NavbarOne />

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 relative overflow-hidden"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(8,16,30,0.72)' }} />
        {/* Dot grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(24,127,193,0.25) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }} />
        <div className="text-center w-full relative z-10" data-aos="fade-up">
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: ACCENT, background: `${ACCENT}22`,
            border: `1px solid ${ACCENT}44`, padding: '6px 16px', marginBottom: 12,
          }}>
            Printing & Signage
          </span>
          <h2
            className="text-white font-normal leading-none text-center"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontFamily: FONT_H, letterSpacing: '-0.02em' }}
          >
            All Products
          </h2>
          <p className="text-white/60 mt-3" style={{ fontSize: 15 }}>
            Premium printing and signage solutions for every need
          </p>
          <ul
            className="flex items-center justify-center gap-[10px] text-sm font-normal text-white/60 mt-4"
            style={{ fontFamily: FONT }}
          >
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li>/</li>
            <li style={{ color: ACCENT }}>Shop</li>
          </ul>
        </div>
      </div>

      {/* ── Category Slider ──────────────────────────────────────────────── */}
      <div className="s-py-100-50 overflow-hidden" data-aos="fade-up" data-aos-delay="100">
        <div style={{ maxWidth: 1720, margin: '0 auto', padding: '0 24px' }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Browse by</p>
              <h3 style={{ fontFamily: FONT_H, fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Product Categories
              </h3>
            </div>
            {activeCategory && (
              <button
                onClick={() => { setActiveCategory(null); setCurrentPage(1) }}
                style={{
                  background: 'none', border: `1.5px solid ${ACCENT}`, color: ACCENT,
                  padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: FONT, letterSpacing: '0.04em',
                }}
              >
                ✕ Clear Filter
              </button>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <Swiper
              className="sv3-swiper"
              modules={[Autoplay, Navigation]}
              navigation
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              speed={600}
              loop
              spaceBetween={16}
              breakpoints={{
                320:  { slidesPerView: 1 },
                640:  { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 },
              }}
            >
              {CATEGORY_SLIDES.map((cat) => {
                const isActive = activeCategory === cat.slug
                return (
                  <SwiperSlide key={cat.slug}>
                    <div
                      className="sv3-cat-slide"
                      onClick={() => {
                        setActiveCategory(isActive ? null : cat.slug)
                        setCurrentPage(1)
                      }}
                      style={{
                        outline: isActive ? `3px solid ${cat.color}` : '3px solid transparent',
                        transition: 'outline 0.2s',
                      }}
                    >
                      <img src={cat.image} alt={cat.name} />
                      <div className="overlay" />
                      {isActive && (
                        <div style={{
                          position: 'absolute', top: 10, right: 10, zIndex: 20,
                          background: cat.color, color: 'white',
                          fontSize: 10, fontWeight: 700, padding: '4px 10px',
                          letterSpacing: '0.06em',
                        }}>
                          ACTIVE
                        </div>
                      )}
                      <div className="info">
                        <div style={{
                          display: 'inline-block', fontSize: 10, fontWeight: 700,
                          color: cat.color, background: `${cat.color}22`,
                          padding: '3px 10px', letterSpacing: '0.08em',
                          textTransform: 'uppercase', marginBottom: 6,
                        }}>
                          {cat.label}
                        </div>
                        <h3 style={{
                          fontFamily: FONT_H, fontSize: 17, fontWeight: 700,
                          color: 'white', margin: 0, lineHeight: 1.2,
                        }}>
                          {cat.name}
                        </h3>
                        <div style={{
                          marginTop: 8, fontSize: 11, fontWeight: 700, color: 'white',
                          letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          Browse
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div className="sv3-filter-bar" data-aos="fade-up" data-aos-delay="100">
        <div style={{ maxWidth: 1720, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            flexWrap: 'wrap', fontFamily: FONT,
          }}>

            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 auto' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>Brand</span>
              <div style={{ width: 200 }}>
                <CustomSelect
                  options={BRANDS}
                  value={brand}
                  onChange={(v) => { setBrand(v); setCurrentPage(1) }}
                  placeholder="All Brands"
                />
              </div>
            </div>

            <div className="sv3-divider" style={{ display: 'none' }} className="hidden 2xl:block sv3-divider" />

            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 auto' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>Sort By</span>
              <div style={{ width: 200 }}>
                <CustomSelect
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(v) => { setSortBy(v); setCurrentPage(1) }}
                  placeholder="Default Sorting"
                />
              </div>
            </div>

            <div className="hidden 2xl:block sv3-divider" />

            {/* Price Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 260px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>Price Range</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 110 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#64748b', fontWeight: 600 }}>₹</span>
                  <input
                    type="number"
                    className="sv3-price-input"
                    style={{ paddingLeft: 28 }}
                    value={minInput}
                    min={0} max={maxPrice}
                    placeholder="Min"
                    onChange={e => setMinInput(Number(e.target.value))}
                    onBlur={() => { setMinPrice(Math.min(minInput, maxPrice - 1)); setCurrentPage(1) }}
                  />
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>to</span>
                <div style={{ position: 'relative', width: 110 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#64748b', fontWeight: 600 }}>₹</span>
                  <input
                    type="number"
                    className="sv3-price-input"
                    style={{ paddingLeft: 28 }}
                    value={maxInput}
                    min={minPrice + 1} max={10000}
                    placeholder="Max"
                    onChange={e => setMaxInput(Number(e.target.value))}
                    onBlur={() => { setMaxPrice(Math.max(maxInput, minPrice + 1)); setCurrentPage(1) }}
                  />
                </div>
              </div>
            </div>

            {/* View toggle + Clear */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* View mode */}
              <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                {(['grid', 'list'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      width: 38, height: 38, border: 'none', cursor: 'pointer',
                      background: viewMode === mode ? ACCENT : 'white',
                      color: viewMode === mode ? 'white' : '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    aria-label={`${mode} view`}
                  >
                    {mode === 'grid' ? (
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {hasFilters && (
                <button
                  onClick={resetFilters}
                  style={{
                    padding: '9px 16px', border: `1.5px solid #e2e8f0`,
                    background: 'white', fontSize: 12, fontWeight: 700,
                    color: '#64748b', cursor: 'pointer', fontFamily: FONT,
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Product Grid ──────────────────────────────────────────────────── */}
      <div className="s-py-50-100">
        <div style={{ maxWidth: 1720, margin: '0 auto', padding: '0 24px' }}>

          {/* Results count + active category tag */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 28, paddingBottom: 20,
              borderBottom: '1px solid #f1f5f9',
              fontFamily: FONT, flexWrap: 'wrap', gap: 12,
            }}
            data-aos="fade-up"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Showing{' '}
                <strong style={{ color: '#0f172a' }}>{paginated.length}</strong>
                {' '}of{' '}
                <strong style={{ color: '#0f172a' }}>{filteredProducts.length}</strong>
                {' '}products
              </p>
              {activeCategory && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: ACCENT,
                  background: `${ACCENT}12`, padding: '3px 10px',
                  border: `1px solid ${ACCENT}30`, letterSpacing: '0.06em',
                }}>
                  {CATEGORY_SLIDES.find(c => c.slug === activeCategory)?.name}
                </span>
              )}
            </div>
            {/* Breadcrumb context */}
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Page {currentPage} of {totalPages || 1}
            </div>
          </div>

          {/* Empty state */}
          {paginated.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: FONT }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🖨️</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', fontFamily: FONT_H }}>
                No products found
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
                Try adjusting your filters or price range.
              </p>
              <button
                onClick={resetFilters}
                style={{
                  padding: '12px 28px', background: ACCENT, color: 'white',
                  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  fontFamily: FONT, letterSpacing: '0.04em',
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Grid view */}
          {paginated.length > 0 && viewMode === 'grid' && (
            <div
              className="sv3-product-grid"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
              data-aos="fade-up"
              data-aos-delay="100"
            >
              {paginated.map((item, i) => (
                <div key={item.id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <ProductCard item={item} />
                </div>
              ))}
            </div>
          )}

          {/* List view */}
          {paginated.length > 0 && viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-aos="fade-up">
              {paginated.map((item) => (
                <div
                  key={item.id}
                  className="group"
                  style={{
                    display: 'flex', gap: 20,
                    background: 'white', padding: 16,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    transition: 'box-shadow 0.3s',
                    fontFamily: FONT,
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'}
                >
                  <div style={{ width: 130, height: 110, flexShrink: 0, overflow: 'hidden', background: '#f1f5f9' }}>
                    <img
                      src={item.image} alt={item.name} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {item.tag}
                      </span>
                      <h3 style={{ fontSize: 15, fontWeight: 500, color: '#0f172a', margin: '5px 0 6px', lineHeight: 1.4 }}>
                        <Link to={`/product/${item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {item.name}
                        </Link>
                      </h3>
                      <StarRating rating={item.rating} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: ACCENT, fontFamily: FONT_H }}>{item.price}</span>
                        {item.originalPrice && (
                          <span style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>{item.originalPrice}</span>
                        )}
                      </div>
                      <Link
                        to={`/product/${item.id}`}
                        style={{
                          fontSize: 12, fontWeight: 700, padding: '8px 18px',
                          border: `1.5px solid ${ACCENT}`, color: ACCENT,
                          textDecoration: 'none', letterSpacing: '0.04em',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = 'white' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ACCENT }}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 48, flexWrap: 'wrap' }}
              data-aos="fade-up"
            >
              <button
                className="sv3-pagination-btn"
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <svg width="14" height="14" viewBox="0 0 24 14" fill="currentColor">
                  <path d="M0.180223 7.38726L5.62434 12.8314C5.8199 13.0598 6.16359 13.0864 6.39195 12.8908C6.62031 12.6952 6.64693 12.3515 6.45132 12.1232C6.43307 12.1019 6.41324 12.082 6.39195 12.0638L1.87877 7.54516L23.4322 7.54516C23.7328 7.54516 23.9766 7.30141 23.9766 7.00072C23.9766 6.70003 23.7328 6.45632 23.4322 6.45632L1.87877 6.45632L6.39195 1.94314C6.62031 1.74758 6.64693 1.40389 6.45132 1.17553C6.25571 0.947171 5.91207 0.920551 5.68371 1.11616C5.66242 1.13441 5.64254 1.15424 5.62434 1.17553L0.180175 6.6197C-0.0308748 6.83196 -0.0308748 7.1749 0.180223 7.38726Z"/>
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`sv3-pagination-btn${currentPage === page ? ' active' : ''}`}
                  onClick={() => goToPage(page)}
                >
                  {String(page).padStart(2, '0')}
                </button>
              ))}

              <button
                className="sv3-pagination-btn"
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <svg width="14" height="14" viewBox="0 0 24 14" fill="currentColor">
                  <path d="M23.8198 6.61958L18.3757 1.17541C18.1801 0.947054 17.8364 0.920433 17.608 1.11604C17.3797 1.31161 17.3531 1.65529 17.5487 1.88366C17.5669 1.90494 17.5868 1.92483 17.608 1.94303L22.1212 6.46168L0.567835 6.46168C0.267191 6.46168 0.0234375 6.70543 0.0234375 7.00612C0.0234375 7.30681 0.267191 7.55052 0.567835 7.55052L22.1212 7.55052L17.608 12.0637C17.3797 12.2593 17.3531 12.6029 17.5487 12.8313C17.7443 13.0597 18.0879 13.0863 18.3163 12.8907C18.3376 12.8724 18.3575 12.8526 18.3757 12.8313L23.8198 7.38714C24.0309 7.17488 24.0309 6.83194 23.8198 6.61958Z"/>
                </svg>
              </button>
            </div>
          )}

          {/* Load More CTA */}
          <div className="text-center mt-7 md:mt-12" data-aos="fade-up">
            <Link
              to="/shop-v1"
              className="btn btn-outline"
              data-text="View All Products"
              style={{ fontFamily: FONT }}
            >
              <span>View All Products</span>
            </Link>
          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  )
}