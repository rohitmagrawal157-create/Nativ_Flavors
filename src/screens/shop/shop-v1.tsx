'use client'

// src/screens/shop/ShopV1.tsx
// ══════════════════════════════════════════════════════════════════════
//  Shop Layout 01 — Infinity Printing & Signage
//
//  CATEGORY FILTER FIX (this revision):
//
//  FIX-CAT-1  "All" → GET /api/products (fetches every product)
//
//  FIX-CAT-2  Any specific category → GET /api/categories/:id/products
//             using the REAL parent category IDs confirmed from the live
//             /api/navbar-categories endpoint:
//               Portrait Frames   → id 21
//               Canvas Paintings  → id 28
//               Temple Art Prints → id 35
//               Wall Murals       → id 43
//
//  FIX-CAT-3  Category matching was removed. No client-side string matching
//             is needed — the API returns only the relevant products.
//
//  FIX-CAT-4  Products correctly read images[] array (not a single image),
//             category string, average_rating, total_reviews from API.
//
//  All original UI logic (pills, price filter, sort, load more) preserved.
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from '@/lib/router';

import NavbarOne   from "../../components/navbar/navbar-one";
import LayoutOne   from "../../components/product/layout-one";
import FooterOne   from "../../components/footer/footer-one";
import ScrollToTop from "../../components/scroll-to-top";

import bg from '../../assets/img/shortcode/breadcumb.jpg';

import {
  getProducts,
  fetchProductsByCategory,
  type Product as ApiProduct,
} from "../../api/products";

import Aos from "aos";
import { BRAND_GRADIENT, CLAY_FOREST, categoryTone } from '@/lib/brand'

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BRAND       = BRAND_GRADIENT
const CTA         = 'linear-gradient(135deg,#2F4A3A 0%,#4E6B58 100%)'
const BRAND_SOLID = CLAY_FOREST
const FONT        = "'DM Sans', sans-serif"

// ── Category definitions: label + real API parent category ID ─────────────────
// IDs confirmed from GET /api/navbar-categories on 21-Apr-2026
const CATEGORIES: { label: string; id: number | null }[] = [
  { label: 'All',                 id: null },
  { label: 'Ghee & Dairy',        id: 21   },
  { label: 'Atta & Grains',       id: 28   },
  { label: 'Natural Sweeteners',  id: 35   },
  { label: 'Snacks',              id: 43   },
]

function toNumber(value: unknown): number {
  const num = typeof value === 'number'
    ? value
    : parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function priceToNumber(price: unknown): number {
  return toNumber(String(price ?? '').replace(/,/g, ''));
}

// ── Category pill ─────────────────────────────────────────────────────────────
function CategoryPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const tone = label === 'All' ? null : categoryTone(label)
  const grad = tone?.grad ?? BRAND
  const isOn = active || hov

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding:       '7px 16px',
        borderRadius:  12,
        minHeight:     44,
        border:        `1.5px solid ${isOn ? 'transparent' : '#E5E7EB'}`,
        background:    isOn ? grad : '#fff',
        color:         isOn ? '#fff' : '#374151',
        fontFamily:    FONT,
        fontSize:      12,
        fontWeight:    600,
        letterSpacing: '0.04em',
        cursor:        'pointer',
        transition:    'all 0.2s ease',
        display:       'inline-flex',
        alignItems:    'center',
        gap:           8,
        boxShadow:     active ? '0 4px 14px rgba(91,79,190,0.22)' : hov ? '0 2px 8px rgba(91,79,190,0.14)' : 'none',
        transform:     active ? 'translateY(-1px)' : 'none',
        whiteSpace:    'nowrap',
      }}
    >
      {tone && (
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flexShrink: 0,
            background: isOn ? '#fff' : tone.solid,
          }}
        />
      )}
      {label}
    </button>
  )
}

// ── Price input ───────────────────────────────────────────────────────────────
function RupeeInput({
  label, value, placeholder, onChange,
}: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      border:     `1.5px solid ${focused ? BRAND_SOLID : '#E5E7EB'}`,
      borderRadius: 8,
      padding:    '9px 14px',
      background: focused ? '#FAFAFC' : '#fff',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow:  focused ? `0 0 0 3px rgba(91,79,190,0.10)` : 'none',
      display:    'flex',
      alignItems: 'center',
      gap:        6,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: BRAND_SOLID, fontFamily: FONT, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0 }}>₹</span>
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, minWidth: 0, background: 'transparent', border: 'none',
          outline: 'none', fontFamily: FONT, fontSize: 13, fontWeight: 500,
          color: '#111827', appearance: 'none',
        }}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ShopV1() {

  const location = useLocation()
  const navigate  = useNavigate()

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState('All')
  const [minPrice,       setMinPrice]       = useState('0')
  const [maxPrice,       setMaxPrice]       = useState('50000')
  const [sortBy,         setSortBy]         = useState('default')
  const [hovLoad,        setHovLoad]        = useState(false)

  // allProducts holds whatever the current API call returned
  // (either all products or category-filtered products)
  const [allProducts,     setAllProducts]     = useState<ApiProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productsError,   setProductsError]   = useState<string | null>(null)

  useEffect(() => { Aos.init() })

  // ── Restore filters from URL on mount ─────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const cat = params.get('category') || params.get('cat') || ''
    if (cat) setActiveCategory(decodeURIComponent(cat))
    const min = params.get('min'); if (min) setMinPrice(min)
    const max = params.get('max'); if (max) setMaxPrice(max)
    const s   = params.get('sort'); if (s)  setSortBy(s)
  }, []) // run once on mount only

  // ── Fetch products when category changes ───────────────────────────────────
  // FIX-CAT-1 / FIX-CAT-2:
  //   "All"  → GET /api/products
  //   other  → GET /api/categories/:id/products
  const fetchForCategory = useCallback(async (catLabel: string) => {
    let cancelled = false
    setLoadingProducts(true)
    setProductsError(null)

    try {
      const catDef = CATEGORIES.find((c) => c.label === catLabel)
      let items: ApiProduct[]

      if (!catDef || catDef.id === null) {
        // "All" — fetch everything
        items = await getProducts()
      } else {
        // Specific category — use dedicated endpoint
        items = await fetchProductsByCategory(catDef.id)
      }

      if (!cancelled) setAllProducts(Array.isArray(items) ? items : [])
    } catch (err) {
      console.error('[shop-v1] Failed to load products', err)
      if (!cancelled) {
        setProductsError('Failed to load products. Please try again.')
        setAllProducts([])
      }
    } finally {
      if (!cancelled) setLoadingProducts(false)
    }

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    fetchForCategory(activeCategory)
  }, [activeCategory, fetchForCategory])

  // ── Category select handler ────────────────────────────────────────────────
  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat)
    try {
      const params = new URLSearchParams(location.search)
      if (cat === 'All') params.delete('category')
      else               params.set('category', cat)
      const dest = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
      navigate(dest)
    } catch { /* ignore */ }
  }

  // ── Client-side price filter + sort (applied on top of API results) ────────
  const filteredProducts = useMemo(() => {
    const min = Math.max(0, toNumber(minPrice))
    const max = Math.max(0, toNumber(maxPrice))

    let list = allProducts.filter((p) => {
      const price = priceToNumber(p.price)
      if (min > 0 && price < min) return false
      if (max > 0 && price > max) return false
      return true
    })

    const sorted = [...list]
    switch (sortBy) {
      case 'price-asc':  sorted.sort((a, b) => priceToNumber(a.price) - priceToNumber(b.price)); break
      case 'price-desc': sorted.sort((a, b) => priceToNumber(b.price) - priceToNumber(a.price)); break
      case 'newest':     sorted.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)); break
      case 'popular':    sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break
      default: break
    }

    return sorted
  }, [allProducts, maxPrice, minPrice, sortBy])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <NavbarOne />

      {/* ── Hero Breadcrumb ── */}
      <div
        className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="text-center w-full">
          <h2
            className="md:text-[40px] font-normal leading-none text-center"
            style={{
              fontSize: 32,
              backgroundImage: BRAND,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Shop
          </h2>
          <ul className="flex items-center justify-center gap-[10px] text-base md:text-lg leading-none font-normal text-white mt-3 md:mt-4">
            <li><Link to="/" style={{ color: 'rgba(255,255,255,0.75)' }}>Home</Link></li>
            <li style={{ color: 'rgba(255,255,255,0.4)' }}>/</li>
            <li style={{
              backgroundImage: BRAND,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 600,
            }}>
              Shop
            </li>
          </ul>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="s-py-100">
        <div className="container-fluid">

          {/* ══ FILTER BAR ══════════════════════════════════════════════════ */}
          <div
            className="max-w-[1720px] mx-auto"
            data-aos="fade-up" data-aos-delay="100"
            style={{ borderBottom: '1px solid #F0F0F4', paddingBottom: 36, marginBottom: 36 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ height: 18, width: 3, borderRadius: 2, background: BRAND, flexShrink: 0 }} />
              <span style={{
                fontFamily: FONT, fontSize: 10, fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                backgroundImage: BRAND, WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Filter &amp; Browse
              </span>
            </div>

            <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12">

              {/* Category pills */}
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontFamily: FONT, fontWeight: 700, fontSize: 13,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#374151', marginBottom: 12,
                }}>
                  Category
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map(({ label }) => (
                    <CategoryPill
                      key={label}
                      label={label}
                      active={activeCategory === label}
                      onClick={() => handleCategorySelect(label)}
                    />
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
                width: '100%', maxWidth: 520, flexShrink: 0,
              }}>
                <div>
                  <h4 style={{
                    fontFamily: FONT, fontWeight: 700, fontSize: 13,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: '#374151', marginBottom: 12,
                  }}>
                    Price Range
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <RupeeInput label="Min" value={minPrice} placeholder="0"      onChange={setMinPrice} />
                    <RupeeInput label="Max" value={maxPrice} placeholder="50,000" onChange={setMaxPrice} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══ SORT / RESULT BAR ═══════════════════════════════════════════ */}
          <div
            className="max-w-[1720px] mx-auto"
            data-aos="fade-up" data-aos-delay="200"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12, marginBottom: 24,
              paddingBottom: 16, borderBottom: '1px solid #F0F0F4',
            }}
          >
            <p style={{ fontFamily: FONT, fontSize: 12, color: '#6B7280', margin: 0 }}>
              {loadingProducts ? (
                'Loading…'
              ) : (
                <>
                  Showing{' '}
                  <strong style={{
                    backgroundImage: BRAND, WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700,
                  }}>
                    {filteredProducts.length}
                  </strong>
                  {' '}products
                  {activeCategory !== 'All' && (
                    <> in <strong style={{ color: '#374151' }}>{activeCategory}</strong></>
                  )}
                </>
              )}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT, fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                Sort By :
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  fontFamily: FONT, fontSize: 12, color: '#374151',
                  border: '1px solid #E5E7EB', borderRadius: 6,
                  padding: '7px 12px', background: '#fff',
                  outline: 'none', cursor: 'pointer', minWidth: 155,
                }}
              >
                <option value="default">Relevance</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* ══ PRODUCT GRID ════════════════════════════════════════════════ */}
          <div
            className="max-w-[1720px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
            data-aos="fade-up" data-aos-delay="300"
          >
            {loadingProducts ? (
              // Skeleton cards while loading
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  borderRadius: 12, overflow: 'hidden', border: '1px solid #F0F0F4',
                  background: '#fff',
                }}>
                  <div style={{
                    height: 240, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s infinite linear',
                  }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ height: 14, borderRadius: 4, background: '#f0f0f0', marginBottom: 8 }} />
                    <div style={{ height: 14, borderRadius: 4, background: '#f0f0f0', width: '60%' }} />
                  </div>
                </div>
              ))
            ) : productsError ? (
              <div className="col-span-full text-center py-12">
                <p style={{ fontFamily: FONT, color: '#B91C1C', marginBottom: 12 }}>{productsError}</p>
                <button
                  onClick={() => fetchForCategory(activeCategory)}
                  style={{
                    padding: '8px 20px', borderRadius: 6, background: BRAND,
                    color: '#fff', fontFamily: FONT, fontSize: 12, fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ fontFamily: FONT, color: '#6B7280', fontSize: 15 }}>
                  No products found
                  {activeCategory !== 'All' && ` in "${activeCategory}"`}
                  {(toNumber(minPrice) > 0 || toNumber(maxPrice) < 50000) && ' for the selected price range'}.
                </p>
                <button
                  onClick={() => { setActiveCategory('All'); setMinPrice('0'); setMaxPrice('50000') }}
                  style={{
                    marginTop: 16, padding: '8px 20px', borderRadius: 6,
                    background: BRAND, color: '#fff', fontFamily: FONT,
                    fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredProducts.map((item: ApiProduct, index: number) => (
                <LayoutOne item={item} key={item.id ?? index} />
              ))
            )}
          </div>

          {/* ══ LOAD MORE ═══════════════════════════════════════════════════ */}
          {!loadingProducts && filteredProducts.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 48 }} data-aos="fade-up" data-aos-delay="100">
              <Link
                to="/shop-v1"
                onMouseEnter={() => setHovLoad(true)}
                onMouseLeave={() => setHovLoad(false)}
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            8,
                  padding:        '13px 40px',
                  background:     hovLoad ? CTA : BRAND,
                  color:          '#fff',
                  fontFamily:     FONT,
                  fontSize:       13,
                  fontWeight:     700,
                  letterSpacing:  '0.08em',
                  textTransform:  'uppercase',
                  textDecoration: 'none',
                  borderRadius:   6,
                  transition:     'background 0.35s ease, transform 0.15s, box-shadow 0.2s',
                  transform:      hovLoad ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow:      hovLoad
                    ? '0 8px 24px rgba(37,99,235,0.28)'
                    : '0 4px 14px rgba(91,79,190,0.22)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.86" />
                </svg>
                Load More
              </Link>
              <p style={{ fontFamily: FONT, fontSize: 11, color: '#9CA3AF', marginTop: 10 }}>
                Showing {filteredProducts.length} of {allProducts.length} products
              </p>
            </div>
          )}

          {/* Shimmer keyframe */}
          <style>{`
            @keyframes shimmer {
              0%   { background-position:  200% 0 }
              100% { background-position: -200% 0 }
            }
          `}</style>

        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  )
}