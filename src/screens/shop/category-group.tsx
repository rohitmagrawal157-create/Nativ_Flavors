'use client'

import { useEffect, useState } from 'react'
import NavbarOne from '@/components/navbar/navbar-one'
import FooterOne from '@/components/footer/footer-one'
import ScrollToTop from '@/components/scroll-to-top'
import { Link, useParams } from '@/lib/router'
import {
  loadCategoryDetail,
  loadGroupProducts,
  type ShopCategory,
  type ShopGroup,
  type ShopSku,
} from '@/components/allproduct/TrendsYouMayLike'

export default function CategoryGroupPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<ShopCategory | null>(null)
  const [groups, setGroups] = useState<ShopGroup[]>([])
  const [products, setProducts] = useState<ShopSku[]>([])
  const [active, setActive] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    setActive('all')
    loadCategoryDetail(slug)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setError(true)
          return
        }
        setCategory(result.category)
        setGroups(result.groups)
        setProducts(result.products)
      })
      .catch((err: unknown) => {
        console.error('[CategoryGroup] Failed to load category:', err)
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const chooseGroup = (group: ShopGroup | null) => {
    if (!category) return
    if (!group) {
      setActive('all')
      setLoading(true)
      loadCategoryDetail(category.slug)
        .then((result) => {
          if (result) setProducts(result.products)
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false))
      return
    }
    setActive(group.id)
    setLoading(true)
    loadGroupProducts(group.id)
      .then(setProducts)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const visible = active === 'all'
    ? products
    : products.filter((item) => !item.group || item.group === groups.find((group) => group.id === active)?.name)

  return (
    <>
      <NavbarOne />
      <section className="nf-group" style={{ ['--accent' as string]: category?.accent ?? '#2F4A3A' }}>
        <div className="nf-group-wrap">
          <p className="nf-group-back"><Link to="/">Home</Link></p>
          {loading && !category ? <p className="nf-group-note">Loading categories…</p> : null}
          {!loading && error ? (
            <div className="nf-group-note" role="alert">
              <p>Categories could not be loaded</p>
              <button type="button" onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : null}
          {category ? (
            <>
              <span className="nf-group-line" />
              <h1>{category.name}</h1>
              <div className="nf-group-chips" role="tablist" aria-label="Sub-groups">
                <button type="button" role="tab" aria-selected={active === 'all'} className={active === 'all' ? 'is-on' : ''} onClick={() => chooseGroup(null)}>All</button>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    role="tab"
                    aria-selected={active === group.id}
                    className={active === group.id ? 'is-on' : ''}
                    onClick={() => chooseGroup(group)}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
              {visible.length === 0 ? (
                <p className="nf-group-note">Coming soon</p>
              ) : (
                <ul className="nf-group-grid">
                  {visible.map((sku) => (
                    <li key={sku.id || sku.name}>
                      <p className="nf-sku-name">{sku.name}</p>
                      {sku.size ? <p className="nf-sku-size">{sku.size}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </div>
        <style>{`
          .nf-group { background: #F6F3EE; padding: 48px 0 80px; font-family: 'Poppins', system-ui, sans-serif; }
          .nf-group-wrap { width: min(1100px, calc(100% - 32px)); margin: 0 auto; }
          .nf-group-back { margin: 0 0 18px; }
          .nf-group-back a { color: #2F4A3A; text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; }
          .nf-group-line { display: block; height: 4px; width: 72px; background: var(--accent); border-radius: 4px; }
          .nf-group h1 {
            margin: 14px 0 0;
            color: #2F4A3A;
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(32px, 4vw, 40px);
            font-weight: 600;
            line-height: 1.25;
          }
          .nf-group-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
          .nf-group-chips button {
            min-height: 44px;
            padding: 0 16px;
            border: 1px solid #2F4A3A;
            border-radius: 99px;
            background: #FFFFFF;
            color: #2F4A3A;
            font: 500 16px 'Poppins', system-ui, sans-serif;
            cursor: pointer;
          }
          .nf-group-chips button.is-on { background: #2F4A3A; color: #F6F3EE; }
          .nf-group-chips button:focus-visible, .nf-group-note button:focus-visible, .nf-group-back a:focus-visible {
            outline: 3px solid #C7922E;
            outline-offset: 3px;
          }
          .nf-group-grid {
            list-style: none;
            margin: 28px 0 0;
            padding: 0;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 16px;
          }
          .nf-group-grid li {
            background: #FFFFFF;
            border-radius: 16px;
            padding: 20px;
            border-top: 4px solid var(--accent);
          }
          .nf-sku-name {
            margin: 0;
            color: #2F4A3A;
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 22px;
            font-weight: 600;
            line-height: 1.3;
          }
          .nf-sku-size { margin: 8px 0 0; color: #4A4F4B; font-size: 16px; line-height: 1.7; }
          .nf-group-note { margin-top: 28px; color: #4A4F4B; font-size: 16px; }
          .nf-group-note button {
            margin-top: 16px;
            min-height: 44px;
            padding: 0 22px;
            border: 0;
            border-radius: 12px;
            background: #2F4A3A;
            color: #F6F3EE;
            font: 500 16px 'Poppins', system-ui, sans-serif;
            cursor: pointer;
          }
        `}</style>
      </section>
      <FooterOne />
      <ScrollToTop />
    </>
  )
}
