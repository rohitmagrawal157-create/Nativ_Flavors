'use client'

/**
 * ProductDetails.tsx
 * ══════════════════════════════════════════════════════════════════════
 *  FIX: [object Object] shown in:
 *    - Breadcrumb: "Home / Shop / [object Object] / Product Name"
 *    - ProductInfo: "Category: [object Object]"
 *    - RelatedProducts subtitle: "More from [object Object]"
 *
 *  ROOT CAUSE:
 *  The API returns category as { id: number, name: string }.
 *  The extraction code had multiple bugs that caused the raw object
 *  to leak into the UI instead of extracting the .name string.
 *
 *  FIX: extractCategory() — single robust helper that handles all shapes:
 *    product.category = "Portrait Frames"       (plain string)
 *    product.category = { id: N, name: "..." }  (object from API)
 *    product.category = { id: N, name: null }   (broken → uses tag)
 *    product.category = undefined               (missing → uses tag)
 *
 *  ALSO FIXED:
 *  - normalised object from getProductById() now sets category as plain
 *    string, not as { id: 0, name: string }
 *  - All String() coercions now safely checked before rendering
 * ══════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams }           from '@/lib/router';
import AOS                                  from 'aos';
import { FourSquare }                       from 'react-loading-indicators';
import {
  LuPencilLine, LuStar, LuPackage, LuTruck, LuShieldCheck,
} from 'react-icons/lu';
import { FaWhatsapp } from 'react-icons/fa';

import NavbarOne   from '../../components/navbar/navbar-one';
import FooterOne   from '../../components/footer/footer-one';
import ScrollToTop from '../../components/scroll-to-top';
import { ProductHeader }  from '../../components/product-details/ProductHeader';
import { ProductGallery } from '../../components/product-details/ProductGallery';
import { ProductActions } from '../../components/product-details/ProductActions';
import { ProductInfo }    from '../../components/product-details/ProductInfo';
import { StarRating }     from '../../components/product-details/StarRating';
import { Toast }          from '../../components/common/Toast';

import { productList }                           from '../../data/data';
import {
  getProductById,
  getProductDetailsById,
  getProducts,
}                                                from '../../api/products';
import type { Product }                          from '../../api/products';
import { getReviewsByProduct, addReview as addReviewApi, deleteReview as deleteReviewApi } from '../../api/reviews';
import { addToCart }                             from '../../api/cart.api';
import { isWishlisted as checkWishlisted, toggleWishlist } from '../../api/wishlist.api';

import type { ProductDetails as ProductDetailsType, MediaItem, Review } from '../../types/product';
import {
  extractImages,
  extractVariants,
  useToast,
} from '../../utils/product.utils';
import LayoutOne from '../../components/product/layout-one';

// ── Constants ─────────────────────────────────────────────────────────────────
const BRAND_GRADIENT = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
const BRAND_SOLID    = '#2F4A3A';
const WHATSAPP_NUMBER = '919766978839';
const STOCK_QTY_FALLBACK = 7;
const RATING_SUMMARY     = { average: 4.8, total: 128 };
const AVATAR_COLORS      = ['#2F4A3A', '#E8314A', '#0891b2'];

const DEFAULT_REVIEWS: Review[] = [
  { id: 1, name: 'Priya M.', rating: 5, date: 'March 12, 2026', title: 'Absolutely love it!', body: 'The quality is exceptional. The finish is gorgeous and it fits perfectly in my living room. Very sturdy and worth every rupee.', verified: true },
  { id: 2, name: 'Rohan S.', rating: 5, date: 'February 28, 2026', title: 'Great product, fast delivery', body: 'Ordered this for our new home. Packaging was excellent — no damage at all. Assembly was straightforward. Highly recommend!', verified: true },
  { id: 3, name: 'Ananya K.', rating: 4, date: 'February 15, 2026', title: 'Beautiful design', body: 'Looks even better in person than in photos. Minor feedback — delivery took a day longer than expected, but totally worth the wait.', verified: true },
];

const RATING_BREAKDOWN = [
  { s: 5, p: 76 }, { s: 4, p: 16 }, { s: 3, p: 5 }, { s: 2, p: 2 }, { s: 1, p: 1 },
];

const productImages = {
  p1: 'https://placehold.co/600x400?text=Product+1',
  p2: 'https://placehold.co/600x400?text=Product+2',
  p3: 'https://placehold.co/600x400?text=Product+3',
  p4: 'https://placehold.co/600x400?text=Product+4',
};

// ── ✅ FIX: Robust category extractor ─────────────────────────────────────────
//
// Handles ALL shapes the API + normalisers produce — never returns [object Object]:
//   product.category = "Portrait Frames"          (plain string)
//   product.category = { id: 11, name: "..." }    (object from getProductDetailsById)
//   product.category = { id: 0,  name: null }     (broken → uses tag fallback)
//   product.category = undefined                  (missing → uses tag)

function extractCategory(product: any): { categoryId?: number; categoryName?: string } {
  if (!product) return {}

  const raw = product.category
  let name: string | undefined
  let id:   number | undefined

  if (raw !== null && raw !== undefined) {
    if (typeof raw === 'object') {
      // Object shape: { id, name } — extract .name as plain string
      const objName =
        raw.name           ??
        raw.category_name  ??
        raw.title          ??
        null
      name = objName ? String(objName).trim() : undefined

      // Only use id as a real category id if it's not the product's own id
      const objId = Number(raw.id ?? 0)
      if (objId > 0 && objId !== product.id) {
        id = objId
      }
    } else if (typeof raw === 'string' && raw.trim() && raw !== '[object Object]') {
      name = raw.trim()
    }
  }

  // Fallback: use product.tag as category name
  if (!name) {
    const tag = product.tag
    if (tag && typeof tag === 'string' && tag.trim() && tag !== '[object Object]') {
      name = tag.trim()
    }
  }

  // Final guard — never leak "[object Object]" into UI
  if (name === '[object Object]') name = undefined

  return { categoryId: id ?? undefined, categoryName: name ?? undefined }
}

// ── LayoutOne item shape ───────────────────────────────────────────────────────
interface LayoutOneItem {
  id: number; image: string; tag: string; price: string; name: string
  rating?: number; originalPrice?: string; discount?: number
}

function toLayoutOneItem(p: Product): LayoutOneItem {
  return {
    id:            p.id,
    name:          p.name          ?? '',
    image:         p.image         ?? '',
    tag:           p.tag           ?? '',
    price:         p.price         ?? '₹0',
    rating:        p.rating,
    originalPrice: p.originalPrice,
    discount:      p.discount,
  }
}

// ── ReviewForm ────────────────────────────────────────────────────────────────
interface ReviewFormProps { onSubmit: (data: any) => Promise<void>; isSubmitting: boolean }

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit, isSubmitting }) => {
  const [form, setForm] = useState({ name: '', rating: 5, title: '', body: '' })
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.body || !form.rating) return
    await onSubmit(form)
    setForm({ name: '', rating: 5, title: '', body: '' })
  }
  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded-xl border border-gray-200">
      <div className="flex gap-3 mb-3">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" className="border border-gray-200 px-3 py-2 rounded w-1/3" />
        <select value={String(form.rating)} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} className="border border-gray-200 px-3 py-2 rounded w-1/6">
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} star</option>)}
        </select>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" className="border border-gray-200 px-3 py-2 rounded flex-1" />
      </div>
      <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your review" className="w-full border border-gray-200 px-3 py-2 rounded mb-3" rows={4} />
      <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded text-white disabled:opacity-50" style={{ background: BRAND_GRADIENT }}>
        {isSubmitting ? 'Posting...' : 'Post Review'}
      </button>
    </form>
  )
}

// ── ReviewCard ────────────────────────────────────────────────────────────────
interface ReviewCardProps { review: Review; index: number; isAuthenticated: boolean; onDelete?: (id: number) => void }

const ReviewCard: React.FC<ReviewCardProps> = ({ review, index, isAuthenticated, onDelete }) => (
  <div className="bg-white rounded-xl p-5 flex flex-col gap-3 border border-gray-200 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}>
        {String(review.name ?? '?').trim().slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="text-base font-bold">{review.name ?? 'Customer'}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <StarRating rating={Number(review.rating) || 0} size={14} />
          {review.verified && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200 bg-green-50 text-green-700">✓ Verified</span>}
        </div>
      </div>
    </div>
    <div>
      <div className="text-base font-bold mb-1">{review.title}</div>
      <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
    </div>
    <div className="border-t border-gray-100 pt-2.5 flex items-center gap-1.5">
      <span className="text-xs text-gray-400">Helpful?</span>
      <button className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">👍 Yes</button>
      <button className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">👎 No</button>
      {isAuthenticated && onDelete && (
        <button onClick={() => onDelete(review.id)} className="ml-auto text-xs text-red-600 border border-red-100 rounded px-2 py-0.5 hover:bg-red-50">Delete</button>
      )}
    </div>
  </div>
)

// ── CustomerReviews ───────────────────────────────────────────────────────────
interface CustomerReviewsProps { productId: number; reviews: Review[]; onReviewAdded: (r: Review) => void; onReviewDeleted: (id: number) => void }

const CustomerReviews: React.FC<CustomerReviewsProps> = ({ productId, reviews, onReviewAdded, onReviewDeleted }) => {
  const [showForm, setShowForm]     = useState(false)
  const [isSubmitting, setSubmit]   = useState(false)
  const isAuthenticated = Boolean(typeof window !== 'undefined' && window.localStorage.getItem('access_token'))

  const handleAddReview = async (formData: any) => {
    setSubmit(true)
    try {
      const created = await addReviewApi({ product_id: productId, rating: Number(formData.rating) || 5, title: formData.title, body: formData.body, name: formData.name })
      if (created) { onReviewAdded(created as any); setShowForm(false) }
    } catch (err) { console.warn('Failed to add review', err) }
    finally { setSubmit(false) }
  }

  const handleDeleteReview = async (id: number) => {
    try { const ok = await deleteReviewApi(id); if (ok) onReviewDeleted(id) }
    catch (err) { console.warn('Failed to delete review', err) }
  }

  return (
    <div id="customer-reviews" className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="max-w-[1720px] mx-auto px-5">
        <div className="flex items-start justify-between flex-wrap gap-6 mb-9">
          <div>
            <h3 className="text-2xl font-bold mb-2.5">Customer Reviews</h3>
            <div className="flex items-center gap-3">
              <StarRating rating={RATING_SUMMARY.average} size={24} />
              <span className="text-3xl font-extrabold">{RATING_SUMMARY.average}</span>
              <span className="text-sm text-gray-500">out of 5 · {reviews.length || RATING_SUMMARY.total} reviews</span>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              {RATING_BREAKDOWN.map(({ s, p }) => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 text-right font-semibold text-gray-700">{s}</span>
                  <LuStar size={12} color="#f5a623" />
                  <div className="w-40 h-2 rounded-full overflow-hidden bg-gray-200">
                    <div className="h-full rounded-full" style={{ width: `${p}%`, background: '#f5a623' }} />
                  </div>
                  <span className="text-gray-400 w-7">{p}%</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setShowForm(s => !s)} className="inline-flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded" style={{ background: BRAND_GRADIENT }}>
            <LuPencilLine size={16} />
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>
        {showForm && <ReviewForm onSubmit={handleAddReview} isSubmitting={isSubmitting} />}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, idx) => (
            <ReviewCard key={review.id} review={review} index={idx} isAuthenticated={isAuthenticated} onDelete={handleDeleteReview} />
          ))}
        </div>
        <div className="text-center mt-8">
          <button className="bg-transparent font-bold text-sm px-7 py-2.5 rounded border border-[#2F4A3A] text-[#2F4A3A] hover:bg-[#2F4A3A] hover:text-white transition">
            View All {RATING_SUMMARY.total} Reviews
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ShippingBox ───────────────────────────────────────────────────────────────
interface ShippingBoxProps { stockQty: number }
const ShippingBox: React.FC<ShippingBoxProps> = ({ stockQty }) => {
  const today = new Date()
  const d15 = new Date(today); d15.setDate(today.getDate() + 15)
  const d16 = new Date(today); d16.setDate(today.getDate() + 16)
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mt-5">
      <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 bg-green-50">
        <LuTruck size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-gray-800">Estimated Delivery: <span className="text-green-700">{fmt(d15)} – {fmt(d16)}</span></p>
          <p className="text-xs text-gray-500 mt-0.5">15–16 business days from order placement</p>
        </div>
      </div>
      <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100">
        <LuPackage size={18} className="text-[#2F4A3A] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-gray-800">Safe Packaging</p>
          <p className="text-xs text-gray-500 mt-0.5">Every order is carefully packed to prevent damage in transit</p>
        </div>
      </div>
      <div className="flex items-start gap-3 px-4 py-3">
        <LuShieldCheck size={18} className="text-[#E8314A] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-gray-800">Secure Order</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {stockQty > 0 ? 'In stock and ready to ship' : 'Currently out of stock'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── RelatedProducts ───────────────────────────────────────────────────────────
interface RelatedProductsProps {
  currentProductId: number
  categoryId?:      number
  categoryName?:    string   // ← now always a plain string (never an object)
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ currentProductId, categoryId, categoryName }) => {
  const [related,        setRelated]        = useState<LayoutOneItem[]>([])
  const [relatedLoading, setRelatedLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setRelatedLoading(true)
    const load = async () => {
      try {
        const all = await getProducts()
        let apiProducts: Product[] = []
        if (categoryName && categoryName.trim()) {
          const needle  = categoryName.toLowerCase().trim()
          const exact   = all.filter(p => (p.tag ?? '').toLowerCase().trim() === needle)
          const partial = all.filter(p => (p.tag ?? '').toLowerCase().includes(needle))
          apiProducts   = exact.length > 0 ? exact : partial.length > 0 ? partial : all
        } else {
          apiProducts = all
        }
        if (alive) {
          setRelated(apiProducts.filter(p => p.id !== currentProductId).slice(0, 4).map(toLayoutOneItem))
        }
      } catch (err) {
        console.warn('[RelatedProducts] API failed — using static fallback', err)
        if (alive) {
          const fallback = (productList as any[])
            .filter((p: any) => {
              if (p.id === currentProductId) return false
              if (categoryName && p.tag) return String(p.tag).toLowerCase().includes(categoryName.toLowerCase())
              return true
            })
            .slice(0, 4)
            .map((p: any): LayoutOneItem => ({ id: p.id, name: p.name ?? '', image: p.image ?? '', tag: p.tag ?? '', price: p.price ?? '₹0', rating: p.rating, originalPrice: p.originalPrice, discount: p.discount }))
          setRelated(fallback)
        }
      } finally {
        if (alive) setRelatedLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [currentProductId, categoryId, categoryName])

  if (relatedLoading) {
    return (
      <div className="s-py-50-100">
        <div className="container-fluid">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold">Related Products</h3>
            <p className="text-base text-gray-500 mt-2 animate-pulse">Finding similar products…</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1720px] mx-auto">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-gray-100 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (related.length === 0) return null

  return (
    <div className="s-py-50-100">
      <div className="container-fluid">
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold">Related Products</h3>
          {/* ✅ FIX: categoryName is always a plain string now — no [object Object] */}
          <p className="text-base text-gray-500 mt-2">
            {categoryName ? `More from ${categoryName}` : 'Explore complementary options curated just for you.'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1720px] mx-auto">
          {related.map(item => <LayoutOne key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProductDetails() {
  const { id }   = useParams<{ id: string }>()
  const parsedId = parseInt(id ?? '0', 10)

  const [product,          setProduct]          = useState<ProductDetailsType | null>(null)
  const [loading,          setLoading]          = useState(true)
  const [quantity,         setQuantity]         = useState(1)
  const [isAdding,         setIsAdding]         = useState(false)
  const [isBuyingNow]                           = useState(false)
  const [wishlistLoading,  setWishlistLoading]  = useState(false)
  const [isWishlisted,     setIsWishlisted]     = useState(false)
  const [reviews,          setReviews]          = useState<Review[]>(DEFAULT_REVIEWS)
  const [reviewsLoading,   setReviewsLoading]   = useState(true)

  const { toast, show: showToast, dismiss: dismissToast } = useToast()
  const fallbackProduct = productList.find((item: any) => item.id === parsedId)

  const stockQty           = Number(product?.variants?.[0]?.stock ?? STOCK_QTY_FALLBACK) || 0
  const outOfStock         = stockQty === 0
  const maxQty             = outOfStock ? 0 : stockQty
  const productName        = product?.name ?? 'Product'
  const price              = product?.price ?? 0
  const originalPrice      = product?.originalPrice
  const discountPercentage = product?.discountPercentage ?? 0
  const images             = extractImages(product)
  const variants           = extractVariants(product)

  // ✅ FIX: Use extractCategory() — always returns plain strings, never objects
  const { categoryId, categoryName } = extractCategory(product)

  const mediaItems: MediaItem[] =
    images.length > 0
      ? images.map((url, idx) => ({ type: 'image' as const, url, thumbnail: url, alt: `${productName} view ${idx + 1}` }))
      : [
          { type: 'image' as const, url: productImages.p1, thumbnail: productImages.p1, alt: 'Product 1' },
          { type: 'image' as const, url: productImages.p2, thumbnail: productImages.p2, alt: 'Product 2' },
          { type: 'image' as const, url: productImages.p3, thumbnail: productImages.p3, alt: 'Product 3' },
          { type: 'image' as const, url: productImages.p4, thumbnail: productImages.p4, alt: 'Product 4' },
        ]

  // Load product
  useEffect(() => {
    AOS.init({ once: true, duration: 600 })
    let alive = true
    if (!Number.isFinite(parsedId) || parsedId <= 0) return
    setLoading(true)

    ;(async () => {
      try {
        // Attempt 1: detailed endpoint
        const details = await getProductDetailsById(parsedId)
        if (alive && details && (details.name || details.price)) {
          setProduct(details as any)
          return
        }

        // Attempt 2: list endpoint + normalise
        const basicProduct = await getProductById(parsedId)
        if (alive && basicProduct) {
          const priceNum = parseFloat(String((basicProduct as any).price ?? '0').replace(/[^0-9.]/g, ''))
          const origNum  = (basicProduct as any).originalPrice ? parseFloat(String((basicProduct as any).originalPrice).replace(/[^0-9.]/g, '')) : undefined
          const tag      = (basicProduct as any).tag

          // ✅ FIX: category is now a PLAIN STRING, not { id: 0, name: string }
          //   This prevents the category object from leaking into the UI
          const normalised: any = {
            id:                 basicProduct.id,
            name:               basicProduct.name,
            description:        (basicProduct as any).description ?? undefined,
            details:            (basicProduct as any).details    ?? undefined,
            features:           (basicProduct as any).features   ?? undefined,
            price:              priceNum,
            originalPrice:      origNum,
            discountPercentage: (basicProduct as any).discount   ?? undefined,
            // ✅ Store category as plain string — extractCategory() handles it
            category:           tag ? String(tag) : undefined,
            images:             basicProduct.image ? [basicProduct.image] : [],
            variants:           (basicProduct as any).variants ?? [],
            tag:                tag,
          }
          setProduct(normalised)
          return
        }

        // Attempt 3: static fallback
        if (alive && fallbackProduct) {
          const fb      = fallbackProduct as any
          const fbPrice = parseFloat(String(fb.price ?? '0').replace(/[^0-9.]/g, ''))
          setProduct({
            id: fb.id, name: fb.name ?? 'Product',
            price: fbPrice, images: fb.image ? [fb.image] : [],
            variants: [],
            // ✅ Plain string — not an object
            category: fb.tag ? String(fb.tag) : undefined,
            tag: fb.tag,
          } as any)
        }
      } catch (err) {
        console.error('[ProductDetails] All fetch attempts failed:', err)
        if (alive && fallbackProduct) setProduct(fallbackProduct as any)
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => { alive = false }
  }, [parsedId])

  // Load wishlist
  useEffect(() => {
    if (!Number.isFinite(parsedId) || parsedId <= 0) return
    let alive = true
    ;(async () => {
      try { const w = await checkWishlisted(parsedId); if (alive) setIsWishlisted(w) } catch {}
    })()
    return () => { alive = false }
  }, [parsedId])

  // Load reviews
  useEffect(() => {
    if (!Number.isFinite(parsedId) || parsedId <= 0) return
    let alive = true
    ;(async () => {
      setReviewsLoading(true)
      try { const rv = await getReviewsByProduct(parsedId); if (alive && Array.isArray(rv) && rv.length > 0) setReviews(rv as any) }
      catch {} finally { if (alive) setReviewsLoading(false) }
    })()
    return () => { alive = false }
  }, [parsedId])

  useEffect(() => {
    document.body.style.overflowX = 'hidden'
    return () => { document.body.style.overflowX = '' }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleWishlistToggle = useCallback(async () => {
    if (wishlistLoading) return
    setWishlistLoading(true)
    try {
      const result    = await toggleWishlist(parsedId)
      const nextState = result.productIds.includes(parsedId)
      setIsWishlisted(nextState)
      showToast({ type: 'success', message: nextState ? 'Added to wishlist' : 'Removed from wishlist', duration: 2000 })
    } catch (err: any) {
      showToast({ type: 'error', message: err?.message ?? 'Failed to update wishlist', duration: 2000 })
    } finally {
      setWishlistLoading(false)
    }
  }, [parsedId, wishlistLoading, showToast])

  const handleAddToCart = useCallback(async () => {
    if (outOfStock || isAdding || !Number.isFinite(parsedId)) return
    const token = window.localStorage.getItem('access_token')
    if (!token) {
      showToast({ type: 'warning', message: 'Please sign in to add items to cart', duration: 3000 })
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.href)}`
      return
    }
    const variantId = Number(product?.variants?.[0]?.variantId ?? 0) || 0
    setIsAdding(true)
    try {
      await addToCart(parsedId, quantity, variantId || undefined)
      showToast({ type: 'success', message: `Added ${quantity} item(s) to cart`, duration: 2000 })
      window.dispatchEvent(new Event('cart:changed'))
    } catch (err: any) {
      showToast({ type: 'error', message: err?.message ?? 'Failed to add to cart', duration: 3000 })
    } finally {
      setIsAdding(false)
    }
  }, [parsedId, product, quantity, outOfStock, isAdding, showToast])

  const handleReviewScroll = useCallback(() => {
    document.getElementById('customer-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // ── Loading ───────────────────────────────────────────────────────────────
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
    )
  }

  return (
    <>
      <NavbarOne />

      {toast && <Toast type={toast.type} message={toast.message} onClose={dismissToast} duration={toast.duration} />}

      {/* Breadcrumb — ✅ FIX: categoryName is now always a plain string */}
      <div className="bg-gray-50 py-5 md:py-[30px]">
        <div className="container-fluid">
          <ul className="flex items-center gap-2.5 text-sm md:text-base leading-none text-gray-500 max-w-[1720px] mx-auto flex-wrap">
            <li><a href="/" className="hover:text-[#2F4A3A]">Home</a></li>
            <li>/</li>
            <li><a href="/shop-v1" className="hover:text-[#2F4A3A]">Shop</a></li>
            {/* ✅ Only render category crumb if categoryName is a valid non-empty string */}
            {categoryName && typeof categoryName === 'string' && categoryName.trim() && (
              <>
                <li>/</li>
                <li className="hover:text-[#2F4A3A] cursor-pointer">{categoryName}</li>
              </>
            )}
            <li>/</li>
            <li className="font-semibold text-gray-800 truncate max-w-[200px]">{productName}</li>
          </ul>
        </div>
      </div>

      {/* Main product section */}
      <div className="s-py-50">
        <div className="container-fluid">
          <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row gap-10">

            {/* Gallery */}
            <div className="w-full lg:w-[58%]">
              <ProductGallery
                media={mediaItems}
                productName={productName}
                discountPct={discountPercentage > 0 ? `-${discountPercentage}%` : undefined}
              />
            </div>

            {/* Product info */}
            <div className="lg:max-w-[635px] w-full min-h-[700px] flex flex-col gap-4">

              <ProductHeader
                name={productName}
                rating={RATING_SUMMARY.average}
                totalReviews={RATING_SUMMARY.total}
                price={price}
                originalPrice={originalPrice}
                discountPercentage={discountPercentage}
                stockQty={stockQty}
                isWishlisted={isWishlisted}
                onWishlistToggle={handleWishlistToggle}
                onReviewScroll={handleReviewScroll}
                isLoadingWishlist={wishlistLoading}
              />

              <div className="mt-4">
                <ProductInfo
                  description={product?.description ?? undefined}
                  details={product?.details ?? undefined}
                  features={product?.features ?? undefined}
                  sizes={variants.sizes}
                  colors={variants.colors}
                  // {/* ✅ FIX: pass categoryName (plain string) not categoryId/rawCategory */}
                  category={categoryName}
                  sku={String(product?.id ?? parsedId ?? '—')}
                />
              </div>

              <ProductActions
                quantity={quantity}
                onQuantityChange={setQuantity}
                maxQty={maxQty}
                outOfStock={outOfStock}
                isAdding={isAdding}
                isBuyingNow={isBuyingNow}
                onAddToCart={handleAddToCart}
              />

              <ShippingBox stockQty={stockQty} />

              <p className="text-sm font-medium flex items-center gap-1.5 mt-4 mb-3">
                <FaWhatsapp size={16} color="#25d366" />
                Want to buy in bulk?{' '}
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`I want to buy ${productName} in bulk.`)}`}
                  target="_blank" rel="noreferrer" className="font-bold underline text-[#2F4A3A]">
                  Chat with us
                </a>
              </p>

              <p className="text-base mt-5 leading-relaxed" style={{ whiteSpace: 'pre-line', color: '#4A4F4B' }}>
                {product?.description ?? `Experience the epitome of relaxation with our ${productName}. Crafted with plush cushioning and ergonomic design, it offers unparalleled comfort for lounging or reading.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {!reviewsLoading && (
        <CustomerReviews
          productId={parsedId}
          reviews={reviews}
          onReviewAdded={review => setReviews(prev => [review, ...prev])}
          onReviewDeleted={id   => setReviews(prev => prev.filter(r => r.id !== id))}
        />
      )}

      {/* Related products — categoryName is now always a plain string */}
      <RelatedProducts
        currentProductId={parsedId}
        categoryId={categoryId}
        categoryName={categoryName}
      />

      <FooterOne />
      <ScrollToTop />
    </>
  )
}