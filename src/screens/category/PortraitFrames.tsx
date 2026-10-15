'use client'

// src/screens/category/PortraitFrames.tsx
import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from '@/lib/router'
import cardImg from '../../assets/img/thumb/shop-card.jpg'
import SelectOne from '../../components/product/select-one'
import NavbarOne from '../../components/navbar/navbar-one'
import LayoutOne from '../../components/product/layout-one'
import FooterOne from '../../components/footer/footer-one'
import ScrollToTop from '../../components/scroll-to-top'
import MultiRangeSlider from 'multi-range-slider-react'
import Aos from 'aos'
import { FourSquare } from 'react-loading-indicators'
import { CATEGORIES } from '../../data/categoryData'
import { useCategoryProductsByCategoryId } from '../../hooks/useCategoryProductsByCategoryId'

const PER_PAGE = 12
const cfg      = CATEGORIES['portrait-frames']
const ACCENT   = cfg.accent

const Chevron = () => (
  <svg className="w-[13px] h-[13px] text-gray-400 group-open:rotate-180 transition-transform duration-200 flex-shrink-0"
    fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7"/>
  </svg>
)

export default function PortraitFrames() {
  const [searchParams] = useSearchParams()
  const categoryIdRaw = searchParams.get('categoryId')
  const categoryId = categoryIdRaw ? Number(categoryIdRaw) : 0

  const [minValue, setMinValue] = useState(0)
  const [maxValue, setMaxValue] = useState(500)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [sort,     setSort]     = useState('default')
  const [gridCols, setGridCols] = useState<2|3>(3)

  const { products, loading: apiLoading, error } = useCategoryProductsByCategoryId(
    categoryId,
    cfg.products,
    {
      fallbackImage: cardImg,
      fallbackTag: cfg.name,
      fallbackCategorySlug: cfg.slug,
    },
  )

  useEffect(() => {
    Aos.init()
    const t = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(t)
  }, [categoryId])

  const parsePrice = (v: string | number) => {
    if (typeof v === 'number') return v
    const n = Number(String(v).replace(/[^0-9.-]+/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  const priceBounds = useMemo(() => {
    const prices = (products ?? []).map(p => parsePrice(p.price))
    if (!prices.length) return { min: 0, max: 500 }
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) }
  }, [products])

  useEffect(() => {
    setMinValue(priceBounds.min)
    setMaxValue(priceBounds.max)
  }, [priceBounds.min, priceBounds.max])

  const filtered = useMemo(() => {
    let list = (products ?? []).filter(p => {
      const price = parsePrice(p.price)
      return price >= minValue && (maxValue === 0 || price <= maxValue)
    })
    if (sort === 'price-asc')  list = [...list].sort((a,b) => parsePrice(a.price) - parsePrice(b.price))
    if (sort === 'price-desc') list = [...list].sort((a,b) => parsePrice(b.price) - parsePrice(a.price))
    return list
  }, [products, minValue, maxValue, sort])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const paginationLabel = `${Math.min(page * PER_PAGE, filtered.length)}/${filtered.length}`

  return (
    <>
      <NavbarOne />

      {/* Hero */}
      <div
        className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage: `url(${cfg.heroImage})` }}
      >
        <div className="text-center w-full">
          <p className="text-white/70 text-sm tracking-[0.2em] uppercase mb-3">{cfg.icon} {cfg.tagline}</p>
          <h2 className="text-white md:text-[40px] font-normal leading-none text-center">{cfg.name}</h2>
          <p className="text-white/60 text-sm md:text-base mt-3 max-w-xl mx-auto font-normal leading-relaxed">{cfg.description}</p>
          <ul className="flex items-center justify-center gap-[10px] text-base md:text-lg leading-none font-normal text-white mt-4 md:mt-5">
            <li><Link to="/">Home</Link></li>
            <li>/</li>
            <li><Link to="/shop-v2">Shop</Link></li>
            <li>/</li>
            <li style={{ color: cfg.accent }}>{cfg.name}</li>
          </ul>
        </div>
      </div>

      <div className="s-py-100">
        <div className="w-full pl-6 sm:pl-8 lg:pl-10 pr-4 sm:pr-6 lg:pr-8">

          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              <strong className="text-gray-700 dark:text-white font-semibold">{filtered.length}</strong> Results found
            </p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 hidden sm:block">{paginationLabel} ↑</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button onClick={() => setGridCols(3)}
                  className={`p-1.5 rounded transition-colors ${gridCols===3?'bg-gray-800 text-white dark:bg-white dark:text-gray-900':'text-gray-400 hover:text-gray-600'}`}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/>
                    <rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/>
                  </svg>
                </button>
                <button onClick={() => setGridCols(2)}
                  className={`p-1.5 rounded transition-colors ${gridCols===2?'bg-gray-800 text-white dark:bg-white dark:text-gray-900':'text-gray-400 hover:text-gray-600'}`}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="0" y="0" width="7" height="16" rx="1"/><rect x="9" y="0" width="7" height="16" rx="1"/>
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-500 whitespace-nowrap hidden md:block">Sort By :</span>
                <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-secondary text-gray-700 dark:text-white px-3 py-[7px] text-[13px] focus:outline-none min-w-[160px]">
                  <option value="default">Relevance</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-10 xl:gap-14">

            {/* Sidebar */}
            <aside className="hidden lg:block flex-shrink-0" style={{ width: '220px' }}
              data-aos="fade-up" data-aos-delay="100">
              <h3 className="text-[12px] font-semibold  uppercase text-gray-500 dark:text-gray-400 mb-5">Filters</h3>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">

                <details className="group">
                  <summary className="flex items-center justify-between py-[15px] cursor-pointer select-none list-none">
                    <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gray-500 dark:text-gray-400">Type</span>
                    <Chevron />
                  </summary>
                  <div className="pb-4 grid gap-3">
                    {['Regular', 'Premium', 'Vintage'].map(label => (
                      <label key={label} className="categoryies-iteem flex items-center gap-[9px] cursor-pointer">
                        <input className="appearance-none hidden" type="radio" name="item-type" />
                        <span className="w-[14px] h-[14px] rounded-full border border-gray-400 flex items-center justify-center flex-shrink-0">
                          <svg className="opacity-0" width="6" height="6" viewBox="0 0 10 10" fill="none">
                            <rect width="10" height="10" rx="5" fill={ACCENT}/>
                          </svg>
                        </span>
                        <span className="text-gray-600 dark:text-gray-300 text-[12.5px] leading-none select-none">{label}</span>
                      </label>
                    ))}
                  </div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between py-[15px] cursor-pointer select-none list-none">
                    <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gray-500 dark:text-gray-400">Style</span>
                    <Chevron />
                  </summary>
                  <div className="pb-4 grid gap-3">
                    {cfg.filterTags.map(label => (
                      <label key={label} className="categoryies-iteem flex items-center gap-[9px] cursor-pointer">
                        <input className="appearance-none hidden" type="checkbox" name="style" />
                        <span className="w-[14px] h-[14px] rounded-[3px] border border-gray-400 flex items-center justify-center flex-shrink-0">
                          <svg className="opacity-0" width="8" height="7" viewBox="0 0 9 8" fill="none">
                            <path d="M3.05203 7.04122C2.87283 7.04122 2.69433 6.97322 2.5562 6.83864L0.532492 4.8553C0.253409 4.58189 0.249159 4.13351 0.522576 3.85372C0.796701 3.57393 1.24578 3.57039 1.52416 3.84309L3.05203 5.34122L7.61512 0.868804C7.89491 0.595387 8.34328 0.59822 8.6167 0.87872C8.89082 1.1578 8.88657 1.60689 8.60749 1.8803L3.54787 6.83864C3.40974 6.97322 3.23124 7.04122 3.05203 7.04122Z" fill={ACCENT}/>
                          </svg>
                        </span>
                        <span className="text-gray-600 dark:text-gray-300 text-[12.5px] leading-none select-none">{label}</span>
                      </label>
                    ))}
                  </div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between py-[15px] cursor-pointer select-none list-none">
                    <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gray-500 dark:text-gray-400">Colour</span>
                    <Chevron />
                  </summary>
                  <div className="pb-3"><p className="text-[12px] text-gray-400">Select a colour to filter</p></div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between py-[15px] cursor-pointer select-none list-none">
                    <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gray-500 dark:text-gray-400">Materials</span>
                    <Chevron />
                  </summary>
                  <div className="pb-3"><p className="text-[12px] text-gray-400">Select a material to filter</p></div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between py-[15px] cursor-pointer select-none list-none">
                    <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gray-500 dark:text-gray-400">Price</span>
                    <Chevron />
                  </summary>
                  <div className="pb-5">
                    <MultiRangeSlider ruler={false} label={false}
                      min={priceBounds.min} max={priceBounds.max}
                      minValue={minValue} maxValue={maxValue}
                      onInput={e => { setMinValue(e.minValue); setMaxValue(e.maxValue); setPage(1) }}
                    />
                    <p className="text-[11.5px] text-gray-400 mt-3">
                      Price: <span className="text-gray-700 dark:text-gray-200 font-semibold">${minValue} – ${maxValue}</span>
                    </p>
                  </div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between py-[15px] cursor-pointer select-none list-none">
                    <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gray-500 dark:text-gray-400">Shape</span>
                    <Chevron />
                  </summary>
                  <div className="pb-3"><p className="text-[12px] text-gray-400">Select a shape to filter</p></div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between py-[15px] cursor-pointer select-none list-none">
                    <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gray-500 dark:text-gray-400">Pattern</span>
                    <Chevron />
                  </summary>
                  <div className="pb-3"><p className="text-[12px] text-gray-400">Select a pattern to filter</p></div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between py-[15px] cursor-pointer select-none list-none">
                    <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gray-500 dark:text-gray-400">Occasions</span>
                    <Chevron />
                  </summary>
                  <div className="pb-3"><p className="text-[12px] text-gray-400">Select an occasion</p></div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between py-[15px] cursor-pointer select-none list-none">
                    <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gray-500 dark:text-gray-400">Feature</span>
                    <Chevron />
                  </summary>
                  <div className="pb-3"><p className="text-[12px] text-gray-400">Select a feature</p></div>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between py-[15px] cursor-pointer select-none list-none">
                    <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase text-gray-500 dark:text-gray-400">Brand</span>
                    <Chevron />
                  </summary>
                  <div className="pb-3"><SelectOne /></div>
                </details>

              </div>
              <Link to="/shop-v1" className="block mt-8">
                <img className="w-full" src={cardImg} alt="shop-card" />
              </Link>
            </aside>

            {/* Product Grid */}
            <div className="flex-1 min-w-0" data-aos="fade-up" data-aos-delay="200">
              {loading || apiLoading ? (
                <div className="flex items-center justify-center py-24"><FourSquare color={ACCENT} size="medium" /></div>
              ) : error ? (
                <div className="text-center py-24">
                  <p className="text-title dark:text-white text-lg font-medium mb-2">Failed to load products</p>
                  <p className="text-gray-400 text-sm">Showing fallback data.</p>
                </div>
              ) : paginated.length === 0 ? (
                <div className="text-center py-24">
                  <p className="text-title dark:text-white text-lg font-medium mb-2">No products found</p>
                  <p className="text-gray-400 text-sm">Try adjusting the price range or filters.</p>
                </div>
              ) : (
                <div className={`grid gap-[6px] ${gridCols===2?'grid-cols-2':'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}`}>
                  {paginated.map(item => <LayoutOne item={item} key={item.id} />)}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-10 md:mt-12 flex items-center justify-center gap-[8px] flex-wrap">
                  <button onClick={() => { setPage(p => Math.max(1,p-1)); window.scrollTo({top:0,behavior:'smooth'}) }}
                    disabled={page===1} className="text-title dark:text-white text-xl disabled:opacity-30 hover:opacity-70 transition-opacity px-1">
                    <span className="lnr lnr-arrow-left" />
                  </button>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
                    <button key={p} onClick={() => { setPage(p); window.scrollTo({top:0,behavior:'smooth'}) }}
                      className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center leading-none text-sm sm:text-base font-medium transition-all duration-300"
                      style={{ backgroundColor: page===p?ACCENT:'transparent', color: page===p?'#fff':undefined, border: `1px solid ${page===p?ACCENT:'#e5e7eb'}` }}>
                      {String(p).padStart(2,'0')}
                    </button>
                  ))}
                  <button onClick={() => { setPage(p => Math.min(totalPages,p+1)); window.scrollTo({top:0,behavior:'smooth'}) }}
                    disabled={page===totalPages} className="text-title dark:text-white text-xl disabled:opacity-30 hover:opacity-70 transition-opacity px-1">
                    <span className="lnr lnr-arrow-right" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FooterOne /><ScrollToTop />
    </>
  )
}