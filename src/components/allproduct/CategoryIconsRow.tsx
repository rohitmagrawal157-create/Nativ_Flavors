// @ts-nocheck
'use client'

import { API_BASE_URL } from '@/lib/env'
import { namedCategoryTone } from '@/lib/brand'

// src/components/home/CategoryIconsRow.tsx
// ══════════════════════════════════════════════════════════════════════
//  CATEGORY ICONS ROW — horizontal scroll row with circular icons
//
//  ✦ Extracts unique categories from API products
//  ✦ Each category: rounded square icon (product image inside) + label
//  ✦ Horizontal scrollable, no scrollbar visible
//  ✦ Clicking navigates to /products?category=X
//  ✦ Larger icons (70px), better text visibility
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate }                               from '@/lib/router'

const API_URL   = `${API_BASE_URL}/api/products`
const FONT_BODY = "'DM Sans', sans-serif"

interface ApiProduct {
  product_id: number; name: string; category: string; images: string[]
}
interface CategoryItem { name: string; image: string }

// Truncate label to fit nicely (slightly longer)
function truncLabel(s: string): string {
  return s
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CAT_STYLE_ID = 'cat-icons-v4-styles'
const CAT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  @keyframes catShim   { 0%{background-position:200% 0}100%{background-position:-200% 0} }
  @keyframes catFadeIn { from{opacity:0}to{opacity:1} }

  .cat-section { padding: 28px 0 8px; animation: catFadeIn .4s ease both; }

  /* Scroll track */
  .cat-track {
    display: flex; gap: 12px; overflow-x: auto;
    scroll-behavior: smooth; padding-bottom: 8px;
    scrollbar-width: none; -ms-overflow-style: none;
  }
  .cat-track::-webkit-scrollbar { display: none; }

  /* Each category tile */
  .cat-item {
    display: flex; flex-direction: column; align-items: center;
    gap: 10px; cursor: pointer; flex-shrink: 0;
    width: 128px; padding: 8px 4px 4px;
    border-radius: 12px;
    transition: background .2s ease, transform .2s ease;
    user-select: none; -webkit-tap-highlight-color: transparent;
  }
  .cat-item:hover { background: #f3f4f6; transform: translateY(-2px); }
  @media (max-width: 767px) { 
    .cat-item { width: 108px; gap: 8px; padding: 6px 2px 2px; }
  }

  /* Icon circle (enlarged) */
  .cat-icon {
    width: 100px; height: 100px; border-radius: 50%;
    overflow: hidden; background: #f0f0f5;
    border: 2px solid #e5e7eb; flex-shrink: 0;
    transition: border-color .2s, box-shadow .2s;
  }
  .cat-item:hover .cat-icon {
    border-color: var(--cat-accent, #2F4A3A);
    box-shadow: 0 4px 16px rgba(47,74,58,0.18);
  }
  @media (max-width: 767px) { 
    .cat-icon { width: 60px; height: 60px; border-width: 1.8px; }
  }

  .cat-icon img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform .5s cubic-bezier(.25,.46,.45,.94);
  }
  .cat-item:hover .cat-icon img { transform: scale(1.08); }

  /* Label */
  .cat-label {
    font-family: ${FONT_BODY}; font-size: 13px; font-weight: 600;
    color: #2F4A3A; text-align: center; line-height: 1.35;
    white-space: normal; overflow: visible;
    width: 100%;
  }
  @media (max-width: 767px) { .cat-label { font-size: 11px; font-weight: 500; } }

  /* Skeleton */
  .cat-skel-bg {
    background: linear-gradient(90deg,#ececf0 25%,#e2e2ea 50%,#ececf0 75%);
    background-size: 300% 100%; animation: catShim 1.5s infinite linear;
  }
  .cat-skel-circle { border-radius: 50%; }
`

function ensureCATStyles() {
  if (!document.getElementById(CAT_STYLE_ID)) {
    const t = document.createElement('style')
    t.id = CAT_STYLE_ID; t.textContent = CAT_STYLES
    document.head.appendChild(t)
  }
}

function SkeletonIcon() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, flexShrink:0, width:90, padding:'8px 4px 4px' }}>
      <div className="cat-skel-bg cat-skel-circle" style={{ width:70, height:70 }} />
      <div className="cat-skel-bg" style={{ height:13, width:60, borderRadius:4 }} />
    </div>
  )
}

export default function CategoryIconsRow() {
  const navigate  = useNavigate()
  const [cats,    setCats]    = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => { ensureCATStyles() }, [])

  const fetchCats = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(API_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const list: ApiProduct[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []

      // Build unique category map: use first product image for that category
      const seen = new Map<string, string>()
      list.forEach(p => {
        if (!seen.has(p.category) && p.images?.[0]) {
          seen.set(p.category, p.images[0])
        }
      })
      setCats(Array.from(seen.entries()).map(([name, image]) => ({ name, image })))
    } catch (e: any) { setError(e?.message ?? 'Failed to load.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCats() }, [fetchCats])

  if (error) return null // silent fail — row simply doesn't show

  return (
    <section className="cat-section">
      <div className="container-fluid">
        <div style={{ maxWidth: 1720, margin: '0 auto' }}>
          <div className="cat-track">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => <SkeletonIcon key={i} />)
              : cats.map((cat, i) => {
                  const accent = namedCategoryTone(cat.name)
                  return (
                  <div
                    key={i} className="cat-item"
                    style={accent ? { ['--cat-accent' as string]: accent.solid } : undefined}
                    onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                    aria-label={cat.name}
                  >
                    <div className="cat-icon" style={accent ? { borderColor: accent.solid } : undefined}>
                      <img 
                        src={cat.image} 
                        alt={cat.name} 
                        loading="lazy"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src =
                            `https://placehold.co/70x70/f0f0f5/9ca3af?text=${encodeURIComponent(cat.name[0] ?? '?')}`
                        }}
                      />
                    </div>
                    <span className="cat-label" style={accent ? { color: accent.solid } : undefined}>{truncLabel(cat.name)}</span>
                  </div>
                  )
                })}
          </div>
        </div>
      </div>
    </section>
  )
}