'use client'

import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { isWishlisted, toggleWishlist } from '@/api/wishlist.api'
import ProductHoverPhotos from '@/components/product/hover-photos'
import { API_BASE_URL } from '@/lib/env'
import { CLAY_FOREST, namedCategoryTone } from '@/lib/brand'
import { Link } from '@/lib/router'

type Row = Record<string, unknown>

export type ShopCategory = {
  id: string
  name: string
  slug: string
  description: string
  imageUrl: string
  accent: string
  count: number
}

export type ShopSku = {
  id: string
  name: string
  size: string
  group: string
}

export type ShopGroup = {
  id: string
  name: string
  slug: string
}

function textFrom(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value != null && String(value).trim() !== '') return String(value).trim()
  }
  return ''
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mediaUrl(raw: string) {
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`
}

function accentFor(name: string, fromApi: string) {
  if (/^#[0-9a-f]{6}$/i.test(fromApi)) return fromApi
  return namedCategoryTone(name)?.solid ?? CLAY_FOREST
}

function isActive(row: Row) {
  const status = row.status ?? row.is_active ?? row.active
  return status !== 0 && status !== false && status !== '0' && status !== 'inactive'
}

function asRows(json: unknown): Row[] {
  if (!json || typeof json !== 'object') return []
  const record = json as Row
  if (Array.isArray(record.data)) return record.data as Row[]
  if (Array.isArray(json)) return json as Row[]
  return []
}

function countFrom(row: Row) {
  const raw = row.products_count ?? row.product_count ?? row.active_products_count ?? row.products
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(Number(raw))) return Number(raw)
  if (Array.isArray(raw)) return raw.filter((item) => isActive((item ?? {}) as Row)).length
  return null
}

export function categoryHref(slug: string) {
  return `/shop/${slug}`
}

export async function loadShopCategories(): Promise<ShopCategory[]> {
  const [categoryRes, groupedRes] = await Promise.all([
    fetch(`${API_BASE_URL}/api/categories`, { headers: { Accept: 'application/json' } }),
    fetch(`${API_BASE_URL}/api/category-products`, { headers: { Accept: 'application/json' } }),
  ])
  if (!categoryRes.ok) throw new Error(`HTTP ${categoryRes.status}`)
  const categoryJson = await categoryRes.json()
  if (categoryJson?.status === false) throw new Error('API returned status: false')

  const counts = new Map<string, number>()
  if (groupedRes.ok) {
    const groupedJson = await groupedRes.json()
    for (const row of asRows(groupedJson)) {
      const id = String(row.category_id ?? row.id ?? '')
      const products = Array.isArray(row.product) ? row.product : Array.isArray(row.products) ? row.products : []
      const active = products.filter((item) => isActive((item ?? {}) as Row)).length
      if (id) counts.set(id, active)
    }
  }

  return asRows(categoryJson)
    .filter(isActive)
    .map((row) => {
      const name = textFrom(row, ['name', 'title'])
      const id = String(row.id ?? '')
      const listed = countFrom(row)
      return {
        id,
        name,
        slug: textFrom(row, ['slug', 'category_slug']) || slugify(name),
        description: textFrom(row, ['description', 'short_description', 'tagline']),
        imageUrl: mediaUrl(textFrom(row, ['image_url', 'image', 'banner', 'photo'])),
        accent: accentFor(name, textFrom(row, ['accent_color', 'accent'])),
        count: listed ?? counts.get(id) ?? 0,
      }
    })
    .filter((category) => category.name && category.slug)
}

function skuFrom(row: Row): ShopSku {
  const variants = Array.isArray(row.variants) ? row.variants as Row[] : []
  const variantSize = variants
    .map((variant) => textFrom(variant, ['size', 'weight', 'name', 'label']))
    .filter(Boolean)
    .join(', ')
  return {
    id: String(row.product_id ?? row.id ?? ''),
    name: textFrom(row, ['name', 'title']) || 'Product',
    size: textFrom(row, ['size', 'weight', 'net_weight', 'unit', 'sku_size']) || variantSize,
    group: textFrom(row, ['sub_category', 'subcategory', 'subgroup', 'group', 'child_category']),
  }
}

export async function loadCategoryDetail(slug: string): Promise<{
  category: ShopCategory
  groups: ShopGroup[]
  products: ShopSku[]
} | null> {
  const [categories, navRes] = await Promise.all([
    loadShopCategories(),
    fetch(`${API_BASE_URL}/api/navbar-categories`, { headers: { Accept: 'application/json' } }),
  ])
  const category = categories.find((item) => item.slug === slug)
  if (!category) return null

  let groups: ShopGroup[] = []
  if (navRes.ok) {
    const navJson = await navRes.json()
    const match = asRows(navJson).find((row) => String(row.id ?? '') === category.id)
    const children = Array.isArray(match?.children) ? match.children as Row[] : []
    groups = children.filter(isActive).map((child) => {
      const name = textFrom(child, ['name', 'title'])
      return {
        id: String(child.id ?? ''),
        name,
        slug: textFrom(child, ['slug']) || slugify(name),
      }
    }).filter((group) => group.name)
  }

  const productRes = await fetch(`${API_BASE_URL}/api/categories/${category.id}/products`, {
    headers: { Accept: 'application/json' },
  })
  if (!productRes.ok) throw new Error(`HTTP ${productRes.status}`)
  const productJson = await productRes.json()
  const products = asRows(productJson).filter(isActive).map(skuFrom).filter((sku) => sku.name)

  return { category, groups, products }
}

export async function loadGroupProducts(groupId: string): Promise<ShopSku[]> {
  const res = await fetch(`${API_BASE_URL}/api/categories/${groupId}/products`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return asRows(json).filter(isActive).map(skuFrom).filter((sku) => sku.name)
}

const TREND_LIMIT = 8

type TrendProduct = {
  id: string
  name: string
  category: string
  imageUrl: string
  images: string[]
  price: string
  compareAt: string
  off: string
  sale: string
}

function rupee(value: string) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return ''
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function categoryName(row: Row) {
  const category = row.category
  if (category && typeof category === 'object') return textFrom(category as Row, ['name', 'title'])
  return textFrom(row, ['category', 'category_name'])
}

function galleryFrom(row: Row) {
  const list: string[] = []
  const push = (raw: unknown) => {
    const url = mediaUrl(typeof raw === 'string' ? raw : String(raw ?? ''))
    if (url && !list.includes(url)) list.push(url)
  }
  if (Array.isArray(row.images)) row.images.forEach(push)
  push(textFrom(row, ['image', 'image_url', 'product_image']))
  return list
}

function trendFrom(row: Row): TrendProduct | null {
  const id = String(row.product_id ?? row.id ?? '')
  const name = textFrom(row, ['name', 'title'])
  if (!id || !name) return null
  const priceRaw = Number(textFrom(row, ['price', 'sale_price', 'product_price']))
  const compareRaw = Number(textFrom(row, ['original_price', 'mrp']))
  const price = rupee(String(priceRaw))
  const compare = rupee(String(compareRaw))
  const images = galleryFrom(row)
  const imageUrl = images[0] ?? ''
  const percent = compareRaw > priceRaw && priceRaw > 0
    ? Math.round(((compareRaw - priceRaw) / compareRaw) * 100)
    : 0
  return {
    id,
    name,
    category: categoryName(row),
    imageUrl,
    images,
    price,
    compareAt: compare && compare !== price ? compare : '',
    off: percent > 0 ? `${percent}% off` : '',
    sale: percent > 0 ? `${percent}%` : '',
  }
}

function prefer(current: string, next: string) {
  return current || next
}

async function loadTrendProducts(): Promise<TrendProduct[]> {
  const headers = { Accept: 'application/json' }
  const [productRes, categoryRes] = await Promise.all([
    fetch(`${API_BASE_URL}/api/products`, { headers }),
    fetch(`${API_BASE_URL}/api/categories`, { headers }),
  ])
  const productJson = productRes.ok ? await productRes.json() : { data: [] }
  if (!productRes.ok && !categoryRes.ok) throw new Error(`HTTP ${productRes.status}`)

  const categoryJson = categoryRes.ok ? await categoryRes.json() : { data: [] }
  const categoryIds = asRows(categoryJson).map((row) => String(row.id ?? '')).filter(Boolean)
  const grouped = await Promise.all(categoryIds.map(async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}/products`, { headers })
    if (!res.ok) return []
    const json = await res.json()
    return asRows(json)
  }))

  const merged = new Map<string, TrendProduct>()
  const add = (row: Row) => {
    if (!isActive(row)) return
    const item = trendFrom(row)
    if (!item) return
    const prev = merged.get(item.id)
    if (!prev) {
      merged.set(item.id, item)
      return
    }
    merged.set(item.id, {
      id: item.id,
      name: prefer(prev.name, item.name),
      category: prefer(prev.category, item.category),
      imageUrl: prefer(prev.imageUrl, item.imageUrl),
      images: [...new Set([...prev.images, ...item.images])],
      price: prefer(prev.price, item.price),
      compareAt: prefer(prev.compareAt, item.compareAt),
      off: prefer(prev.off, item.off),
      sale: prefer(prev.sale, item.sale),
    })
  }

  for (const row of asRows(productJson)) add(row)
  for (const row of grouped.flat()) add(row)
  return [...merged.values()].slice(0, TREND_LIMIT)
}

function TrendCard({ product }: { product: TrendProduct }) {
  const productId = Number(product.id)
  const [wished, setWished] = useState(false)
  const accent = namedCategoryTone(product.category)?.solid ?? CLAY_FOREST

  useEffect(() => {
    const sync = () => setWished(Number.isFinite(productId) && isWishlisted(productId))
    sync()
    window.addEventListener('wishlist:changed', sync)
    return () => window.removeEventListener('wishlist:changed', sync)
  }, [productId])

  const onWish = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!Number.isFinite(productId)) return
    try {
      await toggleWishlist(productId)
      setWished(isWishlisted(productId))
    } catch {
      setWished(isWishlisted(productId))
    }
  }

  return (
    <article className="nf-cats-card" style={{ ['--accent' as string]: accent }}>
      <div className="nf-cats-photo">
        {product.sale ? <span className="nf-cats-sale">Sale {product.sale}</span> : null}
        <button
          type="button"
          className={`nf-cats-wish${wished ? ' is-on' : ''}`}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
          onClick={onWish}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 20.5s-6.7-4.2-9.2-8.2C1.2 9.8 2.2 6.4 5.4 5.4c1.8-.6 3.6.1 4.7 1.5L12 8.6l1.9-1.7c1.1-1.4 2.9-2.1 4.7-1.5 3.2 1 4.2 4.4 2.6 6.9-2.5 4-9.2 8.2-9.2 8.2z"
              fill={wished ? '#C7922E' : 'none'}
              stroke={wished ? '#C7922E' : '#2F4A3A'}
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <Link to={`/product-details/${product.id}`} className="nf-cats-photo-link" tabIndex={-1} aria-hidden="true">
          <ProductHoverPhotos images={product.images} alt="" />
        </Link>
      </div>
      <Link to={`/product-details/${product.id}`} className="nf-cats-body" aria-label={product.name}>
        {product.category ? (
          <span className="nf-cats-pill" style={{ color: accent }}>
            {product.category}
          </span>
        ) : null}
        <span className="nf-cats-name">{product.name}</span>
        {product.price ? (
          <span className="nf-cats-price">
            {product.price}
            {product.compareAt ? <span className="nf-cats-mrp">{product.compareAt}</span> : null}
            {product.off ? <span className="nf-cats-off">{product.off}</span> : null}
          </span>
        ) : null}
        <span className="nf-cats-btn">View product</span>
      </Link>
    </article>
  )
}

export default function TrendsYouMayLike() {
  const [products, setProducts] = useState<TrendProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    loadTrendProducts()
      .then((data) => {
        if (!cancelled) setProducts(data)
      })
      .catch((err: unknown) => {
        console.warn('[TrendsYouMayLike] Products could not be loaded:', err)
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return load()
  }, [load])

  return (
    <section className="nf-cats" aria-labelledby="nf-cats-title">
      <div className="nf-cats-wrap">
        <header className="nf-cats-head">
          <p className="nf-cats-label">OUR PRODUCTS</p>
          <h2 id="nf-cats-title">Trends you may like</h2>
          <p className="nf-cats-sub">Eight foods from the shop, four in each row.</p>
        </header>

        {loading ? (
          <div className="nf-cats-grid" aria-hidden="true">
            {Array.from({ length: TREND_LIMIT }, (_, index) => (
              <div className="nf-cats-card nf-cats-skel" key={index} />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="nf-cats-state" role="alert">
            <p>Products could not be loaded</p>
            <button type="button" className="nf-cats-retry" onClick={load}>Try again</button>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="nf-cats-grid">
              {products.map((product) => (
                <TrendCard key={product.id} product={product} />
              ))}
            </div>
            <p className="nf-cats-all-wrap">
              <Link to="/products" className="nf-cats-all">View all products →</Link>
            </p>
          </>
        ) : null}
      </div>

      <style>{`
        .nf-cats {
          background: #F6F3EE;
          padding: 80px 0;
          font-family: 'Poppins', system-ui, sans-serif;
        }
        .nf-cats-wrap {
          width: min(1100px, calc(100% - 32px));
          margin: 0 auto;
        }
        .nf-cats-head {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 52px;
        }
        .nf-cats-label {
          margin: 0;
          color: #6E736F;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.18em;
        }
        .nf-cats h2 {
          margin: 12px 0 0;
          color: #2F4A3A;
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600;
          font-size: clamp(32px, 4vw, 40px);
          line-height: 1.25;
        }
        .nf-cats-sub {
          margin: 12px 0 0;
          color: #4A4F4B;
          font-size: 16px;
          line-height: 1.7;
        }
        .nf-cats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px;
          align-items: stretch;
        }
        .nf-cats-card {
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0;
          border: 1px solid rgba(47, 74, 58, 0.14);
          border-radius: 12px;
          background: #FFFFFF;
          box-shadow: 0 8px 22px rgba(47, 74, 58, 0.06);
          color: inherit;
          text-decoration: none;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .nf-cats-card:hover {
          transform: translateY(-4px);
          border-color: #2F4A3A;
          box-shadow: 0 16px 32px rgba(47, 74, 58, 0.12);
        }
        .nf-cats-photo {
          position: relative;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #F6F3EE;
        }
        .nf-cats-photo-link {
          position: absolute;
          inset: 0;
          display: block;
          color: inherit;
          text-decoration: none;
        }
        .nf-cats-sale {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          padding: 5px 9px;
          border-radius: 999px;
          background: #2F4A3A;
          color: #F6F3EE;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          line-height: 1.2;
          text-transform: uppercase;
        }
        .nf-cats-wish {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: #FFFFFF;
          box-shadow: 0 2px 8px rgba(47, 74, 58, 0.16);
          cursor: pointer;
        }
        .nf-cats-wish:focus-visible,
        .nf-cats-body:focus-visible {
          outline: 3px solid #C7922E;
          outline-offset: 3px;
        }
        .nf-cats-photo img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .nf-cats-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 8px;
          padding: 14px 14px 16px;
          color: inherit;
          text-decoration: none;
        }
        .nf-cats-pill {
          align-self: flex-start;
          color: #6E736F;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          line-height: 1.4;
          text-transform: uppercase;
        }
        .nf-cats-name {
          display: block;
          min-height: 2.6em;
          color: #2F4A3A;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.3;
        }
        .nf-cats-price {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 8px;
          margin-top: auto;
          color: #2F4A3A;
          font-size: 16px;
          font-weight: 700;
        }
        .nf-cats-mrp {
          color: #6E736F;
          font-size: 13px;
          font-weight: 500;
          text-decoration: line-through;
        }
        .nf-cats-off {
          color: #5A4634;
          font-size: 12px;
          font-weight: 600;
        }
        .nf-cats-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          margin-top: 4px;
          border-radius: 12px;
          background: #2F4A3A;
          color: #F6F3EE;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .nf-cats-desc {
          display: -webkit-box;
          margin-top: 8px;
          overflow: hidden;
          color: #4A4F4B;
          font-size: 15px;
          line-height: 1.6;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .nf-cats-go {
          display: inline-block;
          margin-top: auto;
          padding-top: 14px;
          color: #2F4A3A;
          font-size: 16px;
          font-weight: 500;
        }
        .nf-cats-all-wrap { margin: 28px 0 0; text-align: center; }
        .nf-cats-all {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          color: #2F4A3A;
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
        }
        .nf-cats-all:hover { text-decoration: underline; text-underline-offset: 4px; }
        .nf-cats-all:focus-visible {
          outline: 3px solid #C7922E;
          outline-offset: 3px;
          border-radius: 8px;
        }
        .nf-cats-state {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          text-align: center;
          color: #4A4F4B;
          font-size: 16px;
        }
        .nf-cats-retry {
          min-height: 44px;
          padding: 0 22px;
          border: 0;
          border-radius: 12px;
          background: #2F4A3A;
          color: #F6F3EE;
          font: 500 16px 'Poppins', system-ui, sans-serif;
          cursor: pointer;
        }
        .nf-cats-retry:focus-visible {
          outline: 3px solid #C7922E;
          outline-offset: 3px;
        }
        .nf-cats-skel {
          min-height: 320px;
          background: #E6E3DE;
          box-shadow: none;
        }
        @media (max-width: 700px) {
          .nf-cats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 767px) {
          .nf-cats { padding: 48px 0; }
          .nf-cats-head { margin-bottom: 36px; }
          .nf-cats-desc, .nf-cats-go { display: none; }
        }
        @media (max-width: 359px) {
          .nf-cats-grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nf-cats-card, .nf-cats-photo img { transition: none; }
          .nf-cats-card:hover { transform: none; }
        }
      `}</style>
    </section>
  )
}
