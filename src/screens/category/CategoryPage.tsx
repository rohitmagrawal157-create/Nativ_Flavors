'use client'

// src/screens/category/CategoryPage.tsx
// ══════════════════════════════════════════════════════════════════════════════
//  Universal Category Page – replicates PortraitFrames layout & behaviour
//
//  URL CONTRACT (set by NavbarOne):
//    Parent dept click  →  /category?id=28
//    Child link click   →  /category?subId=23&parentId=28
//
//  Features:
//  · Hero image & config from CATEGORIES (based on parent id)
//  · Full sidebar (Type, Style, Colour, Materials, Price slider, etc.)
//  · Product grid using LayoutOne (wishlist, add to cart, quick view)
//  · Sorting, pagination, grid column toggle
//  · AOS animations
//  · Loading spinner (FourSquare), error & empty states
//  · Responsive design
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from '@/lib/router';
import Aos from 'aos';
import { FourSquare } from 'react-loading-indicators';
import NavbarOne from '../../components/navbar/navbar-one';
import FooterOne from '../../components/footer/footer-one';
import ScrollToTop from '../../components/scroll-to-top';
import LayoutOne from '../../components/product/layout-one';
import SliderOne from '../../components/banner-slider/slider-one';
import cardImg from '../../assets/img/thumb/shop-card.jpg';
import { CATEGORIES } from '../../data/categoryData';
import { loadShopCategories, type ShopCategory } from '../../components/allproduct/TrendsYouMayLike';
import {
  getParentProducts,
  getChildProducts,
  type FetchResult,
} from '../../api/categoryProducts.api';

const PER_PAGE = 12;

// Map parent category ID → slug key in CATEGORIES
const ID_TO_SLUG: Record<number, string> = {
  21: 'portrait-frames',
  28: 'canvas-paintings',
  35: 'temple-art-prints',
  43: 'wall-murals',
  // add more as needed
};

function getCategoryConfigByParentId(parentId: number) {
  const slug = ID_TO_SLUG[parentId];
  return slug ? CATEGORIES[slug] : null;
}

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'name-asc', label: 'Alphabetically, A-Z' },
  { id: 'name-desc', label: 'Alphabetically, Z-A' },
  { id: 'price-asc', label: 'Price, low to high' },
  { id: 'price-desc', label: 'Price, high to low' },
  { id: 'date-asc', label: 'Date, old to new' },
  { id: 'date-desc', label: 'Date, new to old' },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]['id'];

function addedTime(value?: string) {
  const match = String(value ?? '').match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (!match) return 0;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])).getTime();
}

function packGrams(label: string) {
  const match = label.match(/(\d+(?:\.\d+)?)(kg|g|ml|l)/i);
  if (!match) return 0;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return unit === 'kg' || unit === 'l' ? amount * 1000 : amount;
}

function SortMenu({ value, onChange }: { value: SortId; onChange: (id: SortId) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="nf-sort" ref={root}>
      <button
        type="button"
        className="nf-sort-btn"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h11M4 12h8M4 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 6v12M14 15l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sort by
      </button>
      {open && (
        <ul className="nf-sort-menu" role="listbox" aria-label="Sort products">
          {SORT_OPTIONS.map((option) => {
            const selected = option.id === value;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onChange(option.id); setOpen(false); }}
                >
                  <span>{option.label}</span>
                  {selected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PriceSlider({
  min, max, low, high, onChange,
}: {
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
}) {
  const span = Math.max(max - min, 1);
  const start = ((Math.min(low, high) - min) / span) * 100;
  const end = ((Math.max(low, high) - min) / span) * 100;
  return (
    <div className="nf-range">
      <div className="nf-range-rail" aria-hidden="true">
        <span style={{ left: `${start}%`, width: `${Math.max(end - start, 0)}%` }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={low}
        aria-label="Minimum price"
        onChange={(event) => onChange(Math.min(Number(event.target.value), high), high)}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={high}
        aria-label="Maximum price"
        onChange={(event) => onChange(low, Math.max(Number(event.target.value), low))}
      />
      <div className="nf-range-labels">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON / EMPTY / ERROR states (same as PortraitFrames)
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-24">
      <p className="text-title dark:text-white text-lg font-medium mb-2">No products found</p>
      <p className="text-gray-400 text-sm">Try adjusting the price range or filters.</p>
      <button onClick={onReset} className="mt-4 px-5 py-2 rounded-lg text-white text-sm font-semibold"
        style={{ background: 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)' }}>
        Clear Filters
      </button>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-24">
      <p className="text-title dark:text-white text-lg font-medium mb-2">Failed to load products</p>
      <p className="text-gray-400 text-sm">{message}</p>
      <button onClick={onRetry} className="mt-4 px-5 py-2 rounded-lg text-white text-sm font-semibold"
        style={{ background: 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)' }}>
        Try Again
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function CategoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Read URL params ────────────────────────────────────────────────────────
  const parentId = Number(searchParams.get('id') ?? 0);
  const subId    = Number(searchParams.get('subId') ?? 0);
  const parentIdFromSub = Number(searchParams.get('parentId') ?? 0);

  // Redirect if no valid id
  useEffect(() => {
    if (!parentId && !subId) navigate('/', { replace: true });
  }, [parentId, subId, navigate]);

  const isChild = subId > 0;
  const effectiveParentId = isChild ? parentIdFromSub : parentId;
  const categoryConfig = getCategoryConfigByParentId(effectiveParentId);

  // Fallback config if not found
  const cfg = categoryConfig ?? {
    name: 'Category',
    heroImage: cardImg,
    icon: '🖼️',
    tagline: 'Explore',
    description: 'Discover our curated collection.',
    accent: '#2F4A3A',
    filterTags: ['Modern', 'Traditional', 'Minimalist'],
  };
  const ACCENT = cfg.accent;

  // ── State ──────────────────────────────────────────────────────────────────
  const [result,     setResult]     = useState<FetchResult | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [retryKey,   setRetryKey]   = useState(0);
  const [page,       setPage]       = useState(1);
  const [sort,       setSort]       = useState<SortId>('featured');
  const [gridCols,   setGridCols]   = useState<2|4>(4);
  const [minValue,   setMinValue]   = useState(0);
  const [maxValue,   setMaxValue]   = useState(500);
  const [draftMin,   setDraftMin]   = useState(0);
  const [draftMax,   setDraftMax]   = useState(500);
  const [draftIn,    setDraftIn]    = useState(false);
  const [draftOut,   setDraftOut]   = useState(false);
  const [stockIn,    setStockIn]    = useState(false);
  const [stockOut,   setStockOut]   = useState(false);
  const [draftSizes, setDraftSizes] = useState<string[]>([]);
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);

  // ── Fetch products ─────────────────────────────────────────────────────────
  useEffect(() => {
    const effectiveId = isChild ? subId : parentId;
    if (!effectiveId) return;
    let alive = true;
    setLoading(true);
    setResult(null);
    setDraftIn(false);
    setDraftOut(false);
    setStockIn(false);
    setStockOut(false);
    setDraftSizes([]);
    setSizeFilter([]);

    const fetcher = isChild
      ? getChildProducts(subId)
      : getParentProducts(parentId);

    fetcher.then(res => {
      if (!alive) return;
      setResult(res);
      setLoading(false);
      setPage(1);
    });

    return () => { alive = false; };
  }, [isChild, subId, parentId, retryKey]);

  const allProducts = result?.products ?? [];

  // ── Price bounds ───────────────────────────────────────────────────────────
  const parsePrice = (v: string | number) => {
    if (typeof v === 'number') return v;
    const n = Number(String(v).replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const priceBounds = useMemo(() => {
    const prices = allProducts.map(p => parsePrice(p.price));
    if (!prices.length) return { min: 0, max: 500 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [allProducts]);

  // Sync slider when data loads. The grid uses the applied range; Apply commits the draft.
  useEffect(() => {
    setMinValue(priceBounds.min);
    setMaxValue(priceBounds.max);
    setDraftMin(priceBounds.min);
    setDraftMax(priceBounds.max);
  }, [priceBounds.min, priceBounds.max]);

  useEffect(() => {
    let alive = true;
    loadShopCategories()
      .then((rows) => { if (alive) setShopCategories(rows); })
      .catch(() => { if (alive) setShopCategories([]); });
    return () => { alive = false; };
  }, []);

  const inStockCount = allProducts.filter(product => product.inStock !== false).length;
  const outStockCount = allProducts.length - inStockCount;
  const variantOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of allProducts) {
      for (const size of product.sizes ?? []) counts.set(size, (counts.get(size) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => packGrams(a[0]) - packGrams(b[0]));
  }, [allProducts]);

  // Filter & sort
  const filtered = useMemo(() => {
    let list = [...allProducts];
    list = list.filter(p => {
      const price = parsePrice(p.price);
      return price >= minValue && (maxValue === 0 || price <= maxValue);
    });
    if (stockIn !== stockOut) {
      list = list.filter(product => stockIn ? product.inStock !== false : product.inStock === false);
    }
    if (sizeFilter.length) {
      list = list.filter(product => (product.sizes ?? []).some(size => sizeFilter.includes(size)));
    }
    if (sort === 'price-asc')  list.sort((a,b) => parsePrice(a.price) - parsePrice(b.price));
    if (sort === 'price-desc') list.sort((a,b) => parsePrice(b.price) - parsePrice(a.price));
    if (sort === 'name-asc')   list.sort((a,b) => a.name.localeCompare(b.name));
    if (sort === 'name-desc')  list.sort((a,b) => b.name.localeCompare(a.name));
    if (sort === 'date-asc')   list.sort((a,b) => addedTime(a.date) - addedTime(b.date));
    if (sort === 'date-desc')  list.sort((a,b) => addedTime(b.date) - addedTime(a.date));
    return list;
  }, [allProducts, minValue, maxValue, sort, stockIn, stockOut, sizeFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleReset = useCallback(() => {
    setSort('featured');
    setMinValue(priceBounds.min);
    setMaxValue(priceBounds.max);
    setDraftMin(priceBounds.min);
    setDraftMax(priceBounds.max);
    setDraftIn(false);
    setDraftOut(false);
    setStockIn(false);
    setStockOut(false);
    setDraftSizes([]);
    setSizeFilter([]);
    setPage(1);
  }, [priceBounds]);

  const applyFilters = () => {
    setMinValue(draftMin);
    setMaxValue(draftMax);
    setStockIn(draftIn);
    setStockOut(draftOut);
    setSizeFilter(draftSizes);
    setPage(1);
  };

  const toggleSize = (size: string) => {
    setDraftSizes(current => current.includes(size) ? current.filter(item => item !== size) : [...current, size]);
  };

  const activeCategoryId = String(isChild ? subId : parentId);

  // AOS init
  useEffect(() => {
    Aos.init({ once: true, duration: 600 });
  }, []);

  // Loading indicator
  if (loading) {
    return (
      <>
        <NavbarOne />
        <SliderOne />
        <div className="flex items-center justify-center py-24">
          <FourSquare color={ACCENT} size="medium" />
        </div>
        <FooterOne />
        <ScrollToTop />
      </>
    );
  }

  // Error state
  if (result && !result.ok && paginated.length === 0) {
    return (
      <>
        <NavbarOne />
        <SliderOne />
        <ErrorState message={(result as any).error ?? 'Failed to load products'} onRetry={() => setRetryKey(k => k + 1)} />
        <FooterOne />
        <ScrollToTop />
      </>
    );
  }

  return (
    <>
      <NavbarOne />
      <SliderOne />

      <div className="s-py-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">

          <div className="nf-catalog">
            <aside className="nf-filters" data-aos="fade-up" data-aos-delay="100">
              <h2>Filters</h2>

              <details className="nf-filter-block" open>
                <summary>
                  <span>Availability</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="nf-checks">
                  <label>
                    <input type="checkbox" checked={draftIn} onChange={(event) => setDraftIn(event.target.checked)} />
                    <span>In stock ({inStockCount})</span>
                  </label>
                  <label>
                    <input type="checkbox" checked={draftOut} onChange={(event) => setDraftOut(event.target.checked)} />
                    <span>Out of stock ({outStockCount})</span>
                  </label>
                </div>
              </details>

              <details className="nf-filter-block" open>
                <summary>
                  <span>Price</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <PriceSlider
                  min={priceBounds.min}
                  max={priceBounds.max}
                  low={draftMin}
                  high={draftMax}
                  onChange={(low, high) => { setDraftMin(low); setDraftMax(high); }}
                />
              </details>

              {shopCategories.length > 0 && (
                <details className="nf-filter-block" open>
                  <summary>
                    <span>Category</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <ul className="nf-cat-list">
                    {shopCategories.map((category) => {
                      const active = category.id === activeCategoryId;
                      return (
                        <li key={category.id}>
                          <Link
                            to={`/category?id=${category.id}`}
                            className={active ? 'is-active' : ''}
                            aria-current={active ? 'page' : undefined}
                          >
                            {category.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              )}

              <details className="nf-filter-block" open>
                <summary>
                  <span>Variants</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                {variantOptions.length > 0 ? (
                  <div className="nf-variants">
                    {variantOptions.map(([size, count]) => {
                      const selected = draftSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          className={selected ? 'is-on' : ''}
                          aria-pressed={selected}
                          onClick={() => toggleSize(size)}
                        >
                          {size} ({count})
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="nf-filter-note">Pack size is not listed for these products.</p>
                )}
              </details>

              <button type="button" className="nf-apply" onClick={applyFilters}>Apply</button>
            </aside>

            <div className="nf-catalog-main" data-aos="fade-up" data-aos-delay="200">
              <div className="nf-catalog-bar">
                <div className="nf-catalog-tools">
                  <SortMenu value={sort} onChange={(next) => { setSort(next); setPage(1); }} />
                  <p className="nf-result-count">
                    <strong>{filtered.length}</strong> {filtered.length === 1 ? 'product' : 'products'}
                  </p>
                </div>
                <div className="nf-grid-toggle" role="group" aria-label="Product layout">
                  <button type="button" aria-label="Four products in a row" aria-pressed={gridCols === 4} onClick={() => setGridCols(4)}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                      <rect x="1" y="1" width="7" height="7" rx="1.2" />
                      <rect x="10" y="1" width="7" height="7" rx="1.2" />
                      <rect x="1" y="10" width="7" height="7" rx="1.2" />
                      <rect x="10" y="10" width="7" height="7" rx="1.2" />
                    </svg>
                  </button>
                  <button type="button" aria-label="Two products in a row" aria-pressed={gridCols === 2} onClick={() => setGridCols(2)}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                      <rect x="1" y="1" width="7" height="16" rx="1.2" />
                      <rect x="10" y="1" width="7" height="16" rx="1.2" />
                    </svg>
                  </button>
                </div>
              </div>

            {/* Product Grid */}
            <div className="flex-1 min-w-0" data-aos="fade-up" data-aos-delay="200">
              {paginated.length === 0 ? (
                <EmptyState onReset={handleReset} />
              ) : (
                <>
                  <div className={gridCols === 4 ? 'nf-grid nf-grid-4' : 'nf-grid nf-grid-2'}>
                    {paginated.map(item => <LayoutOne item={item} key={item.id} />)}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-10 md:mt-12 flex items-center justify-center gap-[8px] flex-wrap">
                      <button onClick={() => { setPage(p => Math.max(1, p-1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={page===1} className="text-title dark:text-white text-xl disabled:opacity-30 hover:opacity-70 transition-opacity px-1">
                        ‹
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                        <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center leading-none text-sm sm:text-base font-medium transition-all duration-300"
                          style={{ backgroundColor: page===p ? ACCENT : 'transparent', color: page===p ? '#fff' : undefined, border: `1px solid ${page===p ? ACCENT : '#e5e7eb'}` }}>
                          {String(p).padStart(2, '0')}
                        </button>
                      ))}
                      <button onClick={() => { setPage(p => Math.min(totalPages, p+1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={page===totalPages} className="text-title dark:text-white text-xl disabled:opacity-30 hover:opacity-70 transition-opacity px-1">
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .nf-catalog {
          display: grid;
          grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
          gap: 40px;
          align-items: start;
        }
        .nf-filters {
          background: #fff;
          border: 1px solid #E7E2DA;
          border-radius: 16px;
          padding: 22px 22px 18px;
          box-shadow: 0 8px 28px rgba(47, 74, 58, 0.04);
        }
        .nf-filters h2 {
          margin: 0 0 8px;
          color: #2F4A3A;
          font-family: Poppins, sans-serif;
          font-size: 22px;
          font-weight: 650;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .nf-filter-block { border-top: 1px solid #E7E2DA; padding: 4px 0 8px; }
        .nf-filter-block summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 44px;
          cursor: pointer;
          list-style: none;
          color: #2F4A3A;
          font-family: Poppins, sans-serif;
          font-size: 16px;
          font-weight: 600;
        }
        .nf-filter-block summary::-webkit-details-marker { display: none; }
        .nf-filter-block summary svg { width: 16px; height: 16px; flex: 0 0 auto; transition: transform 0.2s ease; }
        .nf-filter-block:not([open]) summary svg { transform: rotate(180deg); }
        .nf-checks { display: grid; gap: 12px; padding: 2px 0 14px; }
        .nf-checks label {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 28px;
          color: #1C1C1C;
          font-family: Poppins, sans-serif;
          font-size: 15px;
          cursor: pointer;
        }
        .nf-checks input {
          width: 16px;
          height: 16px;
          margin: 0;
          accent-color: #2F4A3A;
          cursor: pointer;
        }
        .nf-variants {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 4px 0 14px;
        }
        .nf-variants button {
          min-height: 46px;
          border: 1px solid #D9D3C8;
          border-radius: 8px;
          background: #fff;
          color: #2F4A3A;
          font-family: Poppins, sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .nf-variants button.is-on { background: #2F4A3A; color: #F6F3EE; border-color: #2F4A3A; }
        .nf-variants button:focus-visible, .nf-checks input:focus-visible { outline: 3px solid #C7922E; outline-offset: 2px; }
        .nf-filter-note {
          margin: 0 0 12px;
          color: #6E736F;
          font-family: Poppins, sans-serif;
          font-size: 13px;
          line-height: 1.45;
        }
        .nf-cat-list { list-style: none; margin: 0 0 12px; padding: 0 4px 0 0; display: grid; gap: 10px; max-height: 220px; overflow: auto; }
        .nf-cat-list a {
          display: block;
          color: #4A4F4B;
          font-family: Poppins, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          text-decoration: none;
        }
        .nf-cat-list a.is-active { color: #2F4A3A; font-weight: 650; }
        .nf-cat-list a:hover { color: #2F4A3A; }
        .nf-apply {
          width: 100%;
          min-height: 48px;
          margin-top: 16px;
          border: 0;
          border-radius: 12px;
          background: #2F4A3A;
          color: #F6F3EE;
          font-family: Poppins, sans-serif;
          font-size: 14px;
          font-weight: 650;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .nf-apply:hover { background: #24392D; }
        .nf-apply:focus-visible { outline: 3px solid #C7922E; outline-offset: 2px; }
        .nf-range { position: relative; padding: 18px 8px 0; }
        .nf-range-rail {
          position: absolute;
          left: 8px;
          right: 8px;
          top: 26px;
          height: 4px;
          border-radius: 4px;
          background: #E4E0D8;
        }
        .nf-range-rail span {
          position: absolute;
          top: 0;
          bottom: 0;
          border-radius: 4px;
          background: #2F4A3A;
        }
        .nf-range input[type="range"] {
          position: absolute;
          left: 8px;
          right: 8px;
          top: 14px;
          width: calc(100% - 16px);
          height: 28px;
          margin: 0;
          background: none;
          pointer-events: none;
          appearance: none;
        }
        .nf-range input[type="range"]::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #2F4A3A;
          background: #fff;
          cursor: pointer;
        }
        .nf-range input[type="range"]::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #2F4A3A;
          background: #fff;
          cursor: pointer;
        }
        .nf-range input[type="range"]:focus-visible::-webkit-slider-thumb { outline: 3px solid #C7922E; }
        .nf-range-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 28px;
          color: #4A4F4B;
          font-family: Poppins, sans-serif;
          font-size: 14px;
        }
        .nf-catalog-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }
        .nf-catalog-tools { display: flex; align-items: center; gap: 16px; min-width: 0; }
        .nf-result-count {
          margin: 0;
          color: #6E736F;
          font-family: Poppins, sans-serif;
          font-size: 14px;
          letter-spacing: 0.01em;
        }
        .nf-result-count strong { color: #2F4A3A; font-weight: 650; }
        .nf-grid { display: grid; }
        .nf-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .nf-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .nf-grid-toggle { display: flex; justify-content: flex-end; gap: 8px; flex: 0 0 auto; }
        .nf-grid-toggle button {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #D9D3C8;
          border-radius: 10px;
          background: #fff;
          color: #2F4A3A;
          cursor: pointer;
        }
        .nf-grid-toggle button[aria-pressed="true"] { background: #2F4A3A; color: #F6F3EE; border-color: #2F4A3A; }
        .nf-grid-toggle button:focus-visible { outline: 3px solid #C7922E; outline-offset: 2px; }
        .nf-sort { position: relative; }
        .nf-sort-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 132px;
          min-height: 44px;
          padding: 0 16px;
          border: 1px solid #C7922E;
          border-radius: 8px;
          background: #fff;
          color: #8A6A24;
          font-family: Poppins, sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
        }
        .nf-sort-btn:focus-visible, .nf-sort-menu button:focus-visible { outline: 3px solid #C7922E; outline-offset: 2px; }
        .nf-sort-menu {
          position: absolute;
          z-index: 30;
          top: calc(100% + 10px);
          left: 0;
          width: min(280px, 78vw);
          margin: 0;
          padding: 10px 6px;
          list-style: none;
          border: 1px solid #E7E2DA;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 16px 40px rgba(47, 74, 58, 0.12);
        }
        .nf-sort-menu::before {
          content: "";
          position: absolute;
          top: -6px;
          left: 28px;
          width: 12px;
          height: 12px;
          background: #fff;
          border-left: 1px solid #E7E2DA;
          border-top: 1px solid #E7E2DA;
          transform: rotate(45deg);
        }
        .nf-sort-menu button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          min-height: 40px;
          padding: 8px 14px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #243028;
          font-family: Poppins, sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.01em;
          line-height: 1.35;
          text-align: left;
          cursor: pointer;
        }
        .nf-sort-menu button:hover { background: #F6F3EE; }
        .nf-sort-menu button[aria-selected="true"] { color: #2F4A3A; font-weight: 650; }
        @media (max-width: 1100px) {
          .nf-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .nf-catalog { grid-template-columns: 1fr; gap: 22px; }
          .nf-filters { padding: 18px 16px 14px; }
          .nf-catalog-bar { flex-wrap: wrap; gap: 12px; }
          .nf-catalog-tools { flex-wrap: wrap; gap: 10px; }
          .nf-grid { gap: 12px; }
        }
      `}</style>
      <FooterOne />
      <ScrollToTop />
    </>
  );
}