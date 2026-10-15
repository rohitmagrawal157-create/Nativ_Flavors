'use client'

// // src/screens/category/CategoryShopPage.tsx
// // =============================================================================
// //  Reusable Category Shop Page — powers all category routes
// //  FIXES:
// //    1. Removed useState() calls inside .map() (illegal hook usage)
// //    2. Fixed fetchCategoryProducts return shape consumption
// //    3. Stable radio-button Item Type filter using component state
// //    4. isWishlisted now uses fast localStorage path (no async race)
// // =============================================================================

// import { useEffect, useState, useMemo } from 'react'
// import { Link } from '@/lib/router'
// import MultiRangeSlider from 'multi-range-slider-react'
// import Aos from 'aos'
// import 'aos/dist/aos.css'
// import { FourSquare } from 'react-loading-indicators'

// import NavbarOne from '../../components/navbar/navbar-one'
// import FooterOne from '../../components/footer/footer-one'
// import ScrollToTop from '../../components/scroll-to-top'
// import LayoutOne from '../../components/product/layout-one'
// import type { CategoryConfig, CategoryProduct } from '../../data/categoryData'
// import { fetchCategoryProducts } from '../../api/categories.api'
// // cart/wishlist APIs are used by `LayoutOne` and pages; Category grid reuses LayoutOne

// // ─── Item Types (moved out of render so they're stable) ───────────────────────
// const ITEM_TYPES = ['Regular', 'Premium', 'Limited Edition'] as const
// type ItemType = (typeof ITEM_TYPES)[number]

// // ─── Star Rating ───────────────────────────────────────────────────────────────
// const StarRating = ({ rating }: { rating: number }) => (
//   <div className="flex items-center gap-[2px]">
//     {[1, 2, 3, 4, 5].map((star) => (
//       <svg
//         key={star}
//         className={`w-3 h-3 ${star <= rating ? 'text-[#BB976D]' : 'text-gray-300'}`}
//         fill="currentColor"
//         viewBox="0 0 20 20"
//       >
//         <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//       </svg>
//     ))}
//   </div>
// )

 

// // ─── Checkbox filter item ──────────────────────────────────────────────────────
// const FilterCheckbox = ({
//   label,
//   count,
//   accent,
//   checked,
//   onChange,
// }: {
//   label: string
//   count?: number
//   accent: string
//   checked?: boolean
//   onChange?: (checked: boolean) => void
// }) => {
//   const [internal, setInternal] = useState<boolean>(checked ?? false)

//   useEffect(() => {
//     if (typeof checked === 'boolean') setInternal(checked)
//   }, [checked])

//   const handle = () => {
//     const next = !internal
//     if (onChange) {
//       onChange(next)
//     } else {
//       setInternal(next)
//     }
//   }

//   return (
//     <label className="flex items-center gap-[10px] cursor-pointer group" onClick={handle}>
//       <span
//         className="w-4 h-4 rounded-[5px] border flex items-center justify-center duration-300 flex-shrink-0"
//         style={{
//           borderColor: internal ? accent : undefined,
//           backgroundColor: internal ? accent : 'transparent',
//         }}
//       >
//         {internal && (
//           <svg width="9" height="8" viewBox="0 0 9 8" fill="none">
//             <path
//               d="M3.05203 7.04122C2.87283 7.04122 2.69433 6.97322 2.5562 6.83864L0.532492 4.8553C0.253409 4.58189 0.249159 4.13351 0.522576 3.85372C0.796701 3.57393 1.24578 3.57039 1.52416 3.84309L3.05203 5.34122L7.61512 0.868804C7.89491 0.595387 8.34328 0.59822 8.6167 0.87872C8.89082 1.1578 8.88657 1.60689 8.60749 1.8803L3.54787 6.83864C3.40974 6.97322 3.23124 7.04122 3.05203 7.04122Z"
//               fill="white"
//             />
//           </svg>
//         )}
//       </span>
//       <span className="text-title dark:text-white text-sm leading-none select-none group-hover:opacity-70 transition-opacity">
//         {label}{' '}
//         {count !== undefined && <span className="text-gray-400">({count})</span>}
//       </span>
//     </label>
//   )
// }

// // ─── FIX: Item Type radio — extracted as a proper component (not inline in .map) ──
// // Previously: useState() was called inside .map() which violates Rules of Hooks.
// // Fix: lift the selected state into the parent and track it as a single value.
// const ItemTypeFilter = ({
//   accent,
//   selected,
//   onSelect,
// }: {
//   accent: string
//   selected: ItemType | null
//   onSelect: (type: ItemType | null) => void
// }) => (
//   <div className="grid gap-4">
//     {ITEM_TYPES.map((type) => {
//       const isSelected = selected === type
//       return (
//         <label
//           key={type}
//           className="flex items-center gap-[10px] cursor-pointer"
//           onClick={() => onSelect(isSelected ? null : type)}
//         >
//           <span
//             className="w-[18px] h-[18px] rounded-full border flex items-center justify-center duration-300 flex-shrink-0"
//             style={{ borderColor: isSelected ? accent : '#d1d5db' }}
//           >
//             {isSelected && (
//               <span
//                 className="w-[10px] h-[10px] rounded-full"
//                 style={{ backgroundColor: accent }}
//               />
//             )}
//           </span>
//           <span className="sm:text-base text-title dark:text-white block leading-none select-none">
//             {type}
//           </span>
//         </label>
//       )
//     })}
//   </div>
// )

// // ─── PRODUCTS PER PAGE ─────────────────────────────────────────────────────────
// const PRODUCTS_PER_PAGE = 9

// // =============================================================================
// //  MAIN COMPONENT
// // =============================================================================
// interface CategoryShopPageProps {
//   config: CategoryConfig
// }

// export default function CategoryShopPage({ config }: CategoryShopPageProps) {
//   const [minValue, setMinValue] = useState(0)
//   const [maxValue, setMaxValue] = useState(5000)
//   const [currentPage, setCurrentPage] = useState(1)
//   const [sortBy, setSortBy] = useState('default')
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
//   const [products, setProducts] = useState<CategoryProduct[]>(config.products ?? [])
//   const [activeFilters, setActiveFilters] = useState<string[]>([])
//   // FIX: Item type is now a single piece of state in the parent, not per-loop useState
//   const [selectedItemType, setSelectedItemType] = useState<ItemType | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [fetchError, setFetchError] = useState<string | null>(null)

//   useEffect(() => {
//     Aos.init({ duration: 600, once: true })
//     window.scrollTo(0, 0)

//     let alive = true
//     setLoading(true)
//     setFetchError(null)

//     // FIX: fetchCategoryProducts now returns { data, error } — not { data: { data: [] } }
//     fetchCategoryProducts(config.slug)
//       .then((result) => {
//         if (!alive) return
//         setProducts(result.data ?? [])
//         if (result.error) setFetchError(result.error)
//       })
//       .catch(() => {
//         if (alive) setFetchError('Failed to load products.')
//       })
//       .finally(() => {
//         if (alive) setLoading(false)
//       })

//     return () => {
//       alive = false
//     }
//   }, [config.slug])

//   // Filter + sort products
//   const filteredProducts = useMemo(() => {
//     let list = [...products]

//     // Style/tag filters
//     if (activeFilters.length > 0) {
//       list = list.filter((p) =>
//         activeFilters.some(
//           (f) =>
//             (p.tag ?? '').toString().toLowerCase().includes(f.toLowerCase()) ||
//             p.name.toLowerCase().includes(f.toLowerCase()),
//         ),
//       )
//     }

//     // Item type filter
//     if (selectedItemType) {
//       list = list.filter((p) =>
//         p.name.toLowerCase().includes(selectedItemType.toLowerCase()) ||
//         (p.tag ?? '').toLowerCase().includes(selectedItemType.toLowerCase()),
//       )
//     }

//     // Price filter — strip currency symbols, support $ and $
//     list = list.filter((p) => {
//       const raw = typeof p.price === 'string' ? p.price : String(p.price ?? '')
//       const price = parseFloat(raw.replace(/[$$,]/g, '')) || 0
//       return price >= minValue && (maxValue === 0 || price <= maxValue)
//     })

//     // Sort
//     if (sortBy === 'price-asc') {
//       list.sort((a, b) => {
//         const pa = parseFloat(String(a.price).replace(/[$$,]/g, '')) || 0
//         const pb = parseFloat(String(b.price).replace(/[$$,]/g, '')) || 0
//         return pa - pb
//       })
//     } else if (sortBy === 'price-desc') {
//       list.sort((a, b) => {
//         const pa = parseFloat(String(a.price).replace(/[$$,]/g, '')) || 0
//         const pb = parseFloat(String(b.price).replace(/[$$,]/g, '')) || 0
//         return pb - pa
//       })
//     } else if (sortBy === 'rating') {
//       list.sort((a, b) => b.rating - a.rating)
//     }

//     return list
//   }, [products, minValue, maxValue, sortBy, activeFilters, selectedItemType])

//   const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
//   const paginatedProducts = filteredProducts.slice(
//     (currentPage - 1) * PRODUCTS_PER_PAGE,
//     currentPage * PRODUCTS_PER_PAGE,
//   )

//   const goToPage = (page: number) => {
//     setCurrentPage(page)
//     window.scrollTo({ top: 0, behavior: 'smooth' })
//   }

//   return (
//     <>
//       <NavbarOne />

//       {/* ── Breadcrumb Hero ─────────────────────────────────────────────── */}
//       <div
//         className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-20 relative overflow-hidden"
//         style={{ backgroundImage: `url(${config.heroImage})` }}
//       >
//         <div className="absolute inset-0" style={{ backgroundColor: 'rgba(8,16,30,0.72)' }} />
//         <div className="text-center w-full relative z-10" data-aos="fade-up">
//           <span
//             className="inline-block text-xs font-bold tracking-[4px] uppercase mb-3 px-3 py-1"
//             style={{
//               color: config.accent,
//               backgroundColor: `${config.accent}22`,
//               border: `1px solid ${config.accent}44`,
//             }}
//           >
//             {config.icon} Collection
//           </span>
//           <h1 className="text-white text-4xl sm:text-5xl md:text-[52px] font-normal leading-none text-center mt-2">
//             {config.name}
//           </h1>
//           <p className="text-white/70 text-base sm:text-lg mt-4 max-w-xl mx-auto">
//             {config.tagline}
//           </p>
//           <ul className="flex items-center justify-center gap-[10px] text-sm leading-none font-normal text-white/60 mt-5">
//             <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
//             <li>/</li>
//             <li><Link to="/shop-v2" className="hover:text-white transition-colors">Shop</Link></li>
//             <li>/</li>
//             <li style={{ color: config.accent }}>{config.name}</li>
//           </ul>
//         </div>
//       </div>

//       {/* ── Category Description Strip ───────────────────────────────────── */}
//       <div style={{ backgroundColor: config.accentLight }} className="py-6 border-b border-gray-100">
//         <div className="container">
//           <p className="text-title/70 dark:text-white/60 text-sm sm:text-base text-center max-w-3xl mx-auto leading-relaxed">
//             {config.description}
//           </p>
//         </div>
//       </div>

//       {/* ── Main Content ─────────────────────────────────────────────────── */}
//       <div className="s-py-100">
//         <div className="container">
//           <div className="max-w-[1477px] mx-auto flex items-start justify-between gap-8 md:gap-10 flex-col lg:flex-row">

//             {/* ── Sidebar ─────────────────────────────────────────────────── */}
//             <div
//               className="grid gap-[15px] lg:max-w-[300px] w-full sm:grid-cols-2 lg:grid-cols-1"
//               data-aos="fade-up"
//               data-aos-delay="100"
//             >
//               {/* Filter Tags */}
//               <div className="bg-[#F8F8F9] dark:bg-dark-secondary p-5 sm:p-[30px]">
//                 <h4 className="font-medium leading-none text-xl sm:text-2xl mb-5 sm:mb-6 text-title dark:text-white">
//                   Filter by Style
//                 </h4>
//                 <div className="grid gap-4">
//                   {config.filterTags.map((tag) => (
//                     <FilterCheckbox
//                       key={tag}
//                       label={tag}
//                       accent={config.accent}
//                       checked={activeFilters.includes(tag)}
//                       onChange={(checked) => {
//                         setActiveFilters((prev) =>
//                           checked
//                             ? Array.from(new Set([...prev, tag]))
//                             : prev.filter((t) => t !== tag),
//                         )
//                         setCurrentPage(1)
//                       }}
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Item Type — FIX: uses proper component, not hook-in-loop */}
//               <div className="bg-[#F8F8F9] dark:bg-dark-secondary p-5 sm:p-[30px]">
//                 <h4 className="font-medium leading-none text-xl sm:text-2xl mb-5 sm:mb-6 text-title dark:text-white">
//                   Item Type
//                 </h4>
//                 <ItemTypeFilter
//                   accent={config.accent}
//                   selected={selectedItemType}
//                   onSelect={(type) => {
//                     setSelectedItemType(type)
//                     setCurrentPage(1)
//                   }}
//                 />
//               </div>

//               {/* Price Range */}
//               <div className="bg-[#F8F8F9] dark:bg-dark-secondary p-5 sm:p-[30px]">
//                 <h4 className="font-medium leading-none text-xl sm:text-2xl mb-5 sm:mb-6 text-title dark:text-white">
//                   Price Range
//                 </h4>
//                 <div className="price-filter">
//                   <MultiRangeSlider
//                     min={0}
//                     max={5000}
//                     ruler={false}
//                     label={false}
//                     barInnerColor={config.accent}
//                     thumbLeftColor={config.accent}
//                     thumbRightColor={config.accent}
//                     onInput={(e) => {
//                       setMinValue(e.minValue)
//                       setMaxValue(e.maxValue)
//                       setCurrentPage(1)
//                     }}
//                   />
//                   <div className="flex items-center justify-between mt-3">
//                     <span className="text-sm font-semibold" style={{ color: config.accent }}>
//                       ${minValue}
//                     </span>
//                     <span className="text-gray-400 text-xs">to</span>
//                     <span className="text-sm font-semibold" style={{ color: config.accent }}>
//                       ${maxValue}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Availability */}
//               <div className="bg-[#F8F8F9] dark:bg-dark-secondary p-5 sm:p-[30px]">
//                 <h4 className="font-medium leading-none text-xl sm:text-2xl mb-5 sm:mb-6 text-title dark:text-white">
//                   Availability
//                 </h4>
//                 <div className="grid gap-4">
//                   <FilterCheckbox
//                     label="In Stock"
//                     accent={config.accent}
//                     onChange={() => setCurrentPage(1)}
//                   />
//                   <FilterCheckbox
//                     label="On Sale"
//                     accent={config.accent}
//                     onChange={() => setCurrentPage(1)}
//                   />
//                   <FilterCheckbox
//                     label="New Arrivals"
//                     accent={config.accent}
//                     onChange={() => setCurrentPage(1)}
//                   />
//                 </div>
//               </div>

//               {/* Category Promo Card */}
//               <div
//                 className="hidden lg:flex flex-col justify-end p-6 min-h-[200px] relative overflow-hidden"
//                 style={{ backgroundColor: config.accent }}
//               >
//                 <div
//                   className="absolute inset-0 opacity-20"
//                   style={{
//                     backgroundImage: `url(${config.heroImage})`,
//                     backgroundSize: 'cover',
//                     backgroundPosition: 'center',
//                   }}
//                 />
//                 <div className="relative z-10">
//                   <span className="text-white/80 text-xs font-bold tracking-widest uppercase">
//                     Exclusive
//                   </span>
//                   <h5 className="text-white text-xl font-bold mt-1 leading-snug">
//                     Up to 30% off<br />selected {config.name}
//                   </h5>
//                   <Link
//                     to="#"
//                     className="mt-4 inline-block bg-white text-xs font-bold px-4 py-2 transition-all hover:bg-opacity-90"
//                     style={{ color: config.accent }}
//                   >
//                     Shop Sale →
//                   </Link>
//                 </div>
//               </div>
//             </div>

//             {/* ── Product Grid ─────────────────────────────────────────────── */}
//             <div className="lg:max-w-[1100px] w-full" data-aos="fade-up" data-aos-delay="200">

//               {/* Toolbar */}
//               <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   {loading ? (
//                     <span>Loading products…</span>
//                   ) : (
//                     <>
//                       Showing{' '}
//                       <span className="font-semibold text-title dark:text-white">
//                         {paginatedProducts.length}
//                       </span>{' '}
//                       of{' '}
//                       <span className="font-semibold text-title dark:text-white">
//                         {filteredProducts.length}
//                       </span>{' '}
//                       products
//                       {fetchError && (
//                         <span className="ml-2 text-xs text-amber-500">(showing local data)</span>
//                       )}
//                     </>
//                   )}
//                 </p>
//                 <div className="flex items-center gap-3">
//                   <select
//                     value={sortBy}
//                     onChange={(e) => {
//                       setSortBy(e.target.value)
//                       setCurrentPage(1)
//                     }}
//                     className="text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-secondary text-title dark:text-white px-3 py-2 focus:outline-none"
//                     style={{ outline: `1px solid ${config.accent}44` }}
//                   >
//                     <option value="default">Default Sorting</option>
//                     <option value="price-asc">Price: Low → High</option>
//                     <option value="price-desc">Price: High → Low</option>
//                     <option value="rating">Top Rated</option>
//                   </select>
//                   <div className="flex border border-gray-200 dark:border-gray-600 overflow-hidden">
//                     {(['grid', 'list'] as const).map((mode) => (
//                       <button
//                         key={mode}
//                         onClick={() => setViewMode(mode)}
//                         className="w-9 h-9 flex items-center justify-center transition-all duration-200"
//                         style={{
//                           backgroundColor: viewMode === mode ? config.accent : 'transparent',
//                           color: viewMode === mode ? 'white' : '#888',
//                         }}
//                         aria-label={`${mode} view`}
//                       >
//                         {mode === 'grid' ? (
//                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
//                             <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
//                           </svg>
//                         ) : (
//                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
//                             <path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
//                           </svg>
//                         )}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               {/* Loading skeleton */}
//               {loading && (
//                 <div className="flex items-center justify-center py-20">
//                   <FourSquare color={config.accent} size="large" />
//                 </div>
//               )}

//               {/* Product Grid / List */}
//               {!loading && paginatedProducts.length === 0 && (
//                 <div className="text-center py-20">
//                   <div className="text-6xl mb-4">{config.icon}</div>
//                   <h3 className="text-xl font-semibold text-title dark:text-white mb-2">
//                     No products found
//                   </h3>
//                   <p className="text-gray-500 text-sm">
//                     Try adjusting your price range or filters.
//                   </p>
//                   {(activeFilters.length > 0 || selectedItemType) && (
//                     <button
//                       onClick={() => {
//                         setActiveFilters([])
//                         setSelectedItemType(null)
//                         setCurrentPage(1)
//                       }}
//                       className="mt-4 text-sm font-semibold px-4 py-2 border"
//                       style={{ borderColor: config.accent, color: config.accent }}
//                     >
//                       Clear Filters
//                     </button>
//                   )}
//                 </div>
//               )}

//               {!loading && viewMode === 'grid' && paginatedProducts.length > 0 && (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
//                   {paginatedProducts.map((item) => (
//                     <LayoutOne key={item.id} item={item} />
//                   ))}
//                 </div>
//               )}

//               {!loading && viewMode === 'list' && paginatedProducts.length > 0 && (
//                 <div className="grid gap-4">
//                   {paginatedProducts.map((item) => (
//                     <div
//                       key={item.id}
//                       className="group flex gap-5 bg-white dark:bg-dark-secondary shadow-sm hover:shadow-md transition-all duration-300 p-4"
//                     >
//                       <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 overflow-hidden bg-gray-100">
//                         <img
//                           src={item.image}
//                           alt={item.name}
//                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//                           loading="lazy"
//                         />
//                       </div>
//                       <div className="flex flex-col justify-between flex-1 py-1">
//                         <div>
//                           <span
//                             className="text-[11px] font-bold tracking-widest uppercase"
//                             style={{ color: config.accent }}
//                           >
//                             {item.tag}
//                           </span>
//                           <h3 className="text-title dark:text-white font-medium text-base mt-1 leading-snug">
//                             <Link
//                               to={`/product/${item.id}`}
//                               className="hover:opacity-70 transition-opacity"
//                             >
//                               {item.name}
//                             </Link>
//                           </h3>
//                           <StarRating rating={item.rating} />
//                         </div>
//                         <div className="flex items-center justify-between mt-3">
//                           <span
//                             className="font-bold text-lg"
//                             style={{ color: config.accent }}
//                           >
//                             {item.price}
//                           </span>
//                           <Link
//                             to={`/product/${item.id}`}
//                             className="text-xs font-semibold px-4 py-2 border transition-all duration-200"
//                             style={{ borderColor: config.accent, color: config.accent }}
//                             onMouseEnter={(e) => {
//                               e.currentTarget.style.backgroundColor = config.accent
//                               e.currentTarget.style.color = 'white'
//                             }}
//                             onMouseLeave={(e) => {
//                               e.currentTarget.style.backgroundColor = 'transparent'
//                               e.currentTarget.style.color = config.accent
//                             }}
//                           >
//                             View Details
//                           </Link>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* Pagination */}
//               {!loading && totalPages > 1 && (
//                 <div className="mt-10 md:mt-12 flex items-center justify-center gap-[8px] flex-wrap">
//                   <button
//                     onClick={() => goToPage(Math.max(1, currentPage - 1))}
//                     disabled={currentPage === 1}
//                     className="text-title dark:text-white text-xl disabled:opacity-30 hover:opacity-70 transition-opacity px-2"
//                     aria-label="Previous page"
//                   >
//                     <span className="lnr lnr-arrow-left" />
//                   </button>

//                   {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//                     <button
//                       key={page}
//                       onClick={() => goToPage(page)}
//                       className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center leading-none text-sm sm:text-base font-medium transition-all duration-300"
//                       style={{
//                         backgroundColor: currentPage === page ? config.accent : 'transparent',
//                         color: currentPage === page ? 'white' : undefined,
//                         border: `1px solid ${currentPage === page ? config.accent : '#e5e7eb'}`,
//                       }}
//                     >
//                       {String(page).padStart(2, '0')}
//                     </button>
//                   ))}

//                   <button
//                     onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
//                     disabled={currentPage === totalPages}
//                     className="text-title dark:text-white text-xl disabled:opacity-30 hover:opacity-70 transition-opacity px-2"
//                     aria-label="Next page"
//                   >
//                     <span className="lnr lnr-arrow-right" />
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <FooterOne />
//       <ScrollToTop />
//     </>
//   )
// }