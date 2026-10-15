'use client'

import { useCallback, useEffect, useState } from 'react'
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

function countLabel(count: number) {
  return count === 1 ? '1 product' : `${count} products`
}

export default function TrendsYouMayLike() {
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    loadShopCategories()
      .then((data) => {
        if (!cancelled) setCategories(data)
      })
      .catch((err: unknown) => {
        console.error('[TrendsYouMayLike] Failed to load categories:', err)
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
          <h2 id="nf-cats-title">Shop by category</h2>
          <p className="nf-cats-sub">Simple, honest food, grouped so you can find it easily.</p>
        </header>

        {loading ? (
          <div className="nf-cats-grid" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="nf-cats-card nf-cats-skel" key={index} />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="nf-cats-state" role="alert">
            <p>Categories could not be loaded</p>
            <button type="button" className="nf-cats-retry" onClick={load}>Try again</button>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="nf-cats-grid">
              {categories.map((category) => {
                const open = category.count > 0
                const body = (
                  <>
                    <span className="nf-cats-line" />
                    <span className="nf-cats-photo">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt="" />
                      ) : null}
                    </span>
                    <span className="nf-cats-pill" style={{ color: category.accent, background: `${category.accent}22` }}>
                      {open ? countLabel(category.count) : 'Coming soon'}
                    </span>
                    <span className="nf-cats-name">{category.name}</span>
                    {category.description ? (
                      <span className="nf-cats-desc">{category.description}</span>
                    ) : null}
                    {open ? <span className="nf-cats-go">Explore →</span> : null}
                  </>
                )
                if (!open) {
                  return (
                    <article
                      key={category.id || category.slug}
                      className="nf-cats-card is-soon"
                      style={{ ['--accent' as string]: category.accent }}
                      aria-disabled="true"
                    >
                      {body}
                    </article>
                  )
                }
                return (
                  <Link
                    key={category.id || category.slug}
                    to={categoryHref(category.slug)}
                    className="nf-cats-card"
                    style={{ ['--accent' as string]: category.accent }}
                    aria-label={`${category.name}, ${countLabel(category.count)}`}
                  >
                    {body}
                  </Link>
                )
              })}
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
          padding: 20px;
          border: 1px solid transparent;
          border-radius: 16px;
          background: #FFFFFF;
          box-shadow: 0 8px 22px rgba(47, 74, 58, 0.06);
          color: inherit;
          text-decoration: none;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        a.nf-cats-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
          box-shadow: 0 16px 32px rgba(47, 74, 58, 0.12);
        }
        a.nf-cats-card:focus-visible {
          outline: 3px solid #C7922E;
          outline-offset: 3px;
        }
        .nf-cats-line {
          display: block;
          height: 4px;
          margin: -20px -20px 16px;
          background: var(--accent);
        }
        .nf-cats-photo {
          display: block;
          aspect-ratio: 4 / 3;
          border-radius: 10px;
          overflow: hidden;
          background: #F6F3EE;
        }
        .nf-cats-photo img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        a.nf-cats-card:hover .nf-cats-photo img { transform: scale(1.03); }
        .nf-cats-pill {
          align-self: flex-start;
          margin-top: 14px;
          padding: 4px 10px;
          border-radius: 99px;
          background: color-mix(in srgb, var(--accent) 16%, #FFFFFF);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
        }
        .nf-cats-name {
          display: block;
          margin-top: 12px;
          color: #2F4A3A;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          line-height: 1.3;
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
        @media (min-width: 1024px) {
          .nf-cats-name { font-size: 24px; }
        }
        @media (max-width: 1023px) {
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
          a.nf-cats-card:hover { transform: none; }
          a.nf-cats-card:hover .nf-cats-photo img { transform: none; }
        }
      `}</style>
    </section>
  )
}
