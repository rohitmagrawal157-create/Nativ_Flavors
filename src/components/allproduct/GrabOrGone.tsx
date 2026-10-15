// @ts-nocheck
'use client'

import { API_BASE_URL } from '@/lib/env'

// src/components/home/GrabOrGone.tsx
// ══════════════════════════════════════════════════════════════════════
//  GRAB OR GONE — Mint box, 4 product tiles (matches screenshot row 1)
//
//  ✦ Light mint #f0faf4 background card (same as WidestCollection)
//  ✦ 4 tiles: large product image (no text overlay) + sublabel + bold label
//  ✦ Labels: "Top Deals / From ₹X", "Widest Range / Top Rated",
//             "New Range / Special offer", "Don't Miss / Top Rated"
//  ✦ Random products from API on every mount
//  ✦ Clicking tile → /product-details/:id
//  ✦ DM Sans + Syne fonts, brand tokens
//  ✦ Skeleton loaders
//  ✦ 4 cols desktop → 2 cols mobile
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react'
import { useNavigate }                       from '@/lib/router'

const API_URL   = `${API_BASE_URL}/api/products`
const FONT_HEAD = "'DM Sans', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

interface ApiProduct {
  product_id: number; name: string; category: string
  price: string; original_price: string; images: string[]
  average_rating: number; total_reviews: number
}

function parseNum(p: string | number): number {
  const n = parseFloat(String(p).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}
function fmtINR(n: number): string {
  return n === 0 ? '₹0' : '₹' + n.toLocaleString('en-IN')
}

// Pick 4 random, non-repeating products
function pickRandom(arr: ApiProduct[], count: number): ApiProduct[] {
  if (!arr.length) return []
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

const TILE_DEFS = [
  { sublabel: 'Top Deals',    getLabel: (p: ApiProduct) => `From ${fmtINR(parseNum(p.price))}` },
  { sublabel: 'Widest Range', getLabel: () => 'Top Rated' },
  { sublabel: 'New Range',    getLabel: () => 'Special offer' },
  { sublabel: "Don't Miss",   getLabel: () => 'Top Rated' },
]

// ─── CSS ──────────────────────────────────────────────────────────────────────
const GOG_STYLE_ID = 'gog-v1-styles'
const GOG_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap');

  @keyframes gogShim    { 0%{background-position:200% 0}100%{background-position:-200% 0} }
  @keyframes gogFadeUp  { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }

  .gog-section  { padding: 80px 0; animation: gogFadeUp .4s ease both; }

  .gog-wrapper  {
    background: #f0faf4; border: 1.5px solid #c8e8d4;
    border-radius: 16px; padding: 20px 20px 22px;
  }

  .gog-title {
    font-family: ${FONT_HEAD}; font-size: clamp(17px,2.5vw,22px);
    font-weight: 800; color: #0d1f14; margin: 0 0 16px;
    letter-spacing: -.01em;
  }

  .gog-grid {
    display: grid; grid-template-columns: repeat(4,1fr); gap: 12px;
  }
  @media (max-width: 899px) { .gog-grid { grid-template-columns: repeat(2,1fr); gap: 10px; } }

  .gog-tile {
    background: #fff; border: 1px solid #e0ece5; border-radius: 10px;
    overflow: hidden; cursor: pointer; display: flex; flex-direction: column;
    transition: box-shadow .22s ease, transform .22s ease, border-color .18s;
  }
  .gog-tile:hover {
    box-shadow: 0 6px 24px rgba(16,120,60,.13);
    transform: translateY(-2px); border-color: rgba(16,120,60,.28);
  }

  .gog-img-wrap {
    aspect-ratio: 1.1/1; overflow: hidden; background: #f5f5f7; flex-shrink: 0;
  }
  .gog-img {
    width:100%; height:100%; object-fit:cover; display:block;
    transition: transform .55s cubic-bezier(.25,.46,.45,.94);
  }
  .gog-tile:hover .gog-img { transform: scale(1.06); }

  .gog-info { padding: 10px 12px 13px; display:flex; flex-direction:column; gap:2px; }
  .gog-sublabel {
    font-family:${FONT_BODY}; font-size:12px; font-weight:400; color:#4d7a62;
  }
  .gog-label {
    font-family:${FONT_BODY}; font-size:14px; font-weight:700; color:#0d1f14;
  }
  @media (max-width:767px) {
    .gog-info { padding: 8px 10px 10px; }
    .gog-sublabel { font-size: 11px; }
    .gog-label    { font-size: 13px; }
  }

  /* Skeleton */
  .gog-skel {
    background: linear-gradient(90deg,#e5f2ea 25%,#d3e8db 50%,#e5f2ea 75%);
    background-size: 300% 100%; animation: gogShim 1.5s infinite linear; border-radius:4px;
  }
  .gog-skel-tile {
    background:#fff; border:1px solid #e0ece5; border-radius:10px; overflow:hidden;
  }
  .gog-err {
    text-align:center; padding:20px; color:#dc2626; font-family:${FONT_BODY};
    font-size:13px; background:#fff5f5; border-radius:10px; border:1px solid #fecaca;
  }
  .gog-retry {
    margin-top:10px; padding:6px 18px; background:#dc2626; color:#fff;
    border:none; border-radius:6px; font-family:${FONT_BODY}; font-size:12px; font-weight:700; cursor:pointer;
  }
`

function ensureGOGStyles() {
  if (!document.getElementById(GOG_STYLE_ID)) {
    const t = document.createElement('style')
    t.id = GOG_STYLE_ID; t.textContent = GOG_STYLES
    document.head.appendChild(t)
  }
}

function SkeletonTile() {
  return (
    <div className="gog-skel-tile">
      <div className="gog-skel" style={{ aspectRatio: '1.1/1' }} />
      <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:5 }}>
        <div className="gog-skel" style={{ height:11, width:'50%' }} />
        <div className="gog-skel" style={{ height:14, width:'70%' }} />
      </div>
    </div>
  )
}

export default function GrabOrGone() {
  const navigate = useNavigate()
  const [picks,   setPicks]   = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => { ensureGOGStyles() }, [])

  const fetch4 = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(API_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const list: ApiProduct[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
      setPicks(pickRandom(list, 4))
    } catch (e: any) { setError(e?.message ?? 'Failed to load.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch4() }, [fetch4])

  return (
    <section className="gog-section">
      <div className="container-fluid">
        <div style={{ maxWidth: 1720, margin: '0 auto' }}>
          <div className="gog-wrapper">
            <h2 className="gog-title">A quiet selection</h2>

            {error && (
              <div className="gog-err">⚠ {error}<br />
                <button className="gog-retry" onClick={fetch4}>Retry</button>
              </div>
            )}

            {!error && (
              <div className="gog-grid">
                {loading
                  ? TILE_DEFS.map((_, i) => <SkeletonTile key={i} />)
                  : TILE_DEFS.map((def, i) => {
                      const p   = picks[i]
                      const img = p?.images?.[0] ?? ''
                      return (
                        <div
                          key={i} className="gog-tile"
                          onClick={() => p && navigate(`/product-details/${p.product_id}`)}
                          role="button" tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && p && navigate(`/product-details/${p.product_id}`)}
                          aria-label={`${def.sublabel}`}
                        >
                          <div className="gog-img-wrap">
                            <img src={img} alt={p?.name ?? def.sublabel} className="gog-img" loading="lazy"
                              onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/300x270/f5f5f7/c4c4d4?text=No+Image' }} />
                          </div>
                          <div className="gog-info">
                            <span className="gog-sublabel">{def.sublabel}</span>
                            <span className="gog-label">{p ? def.getLabel(p) : '—'}</span>
                          </div>
                        </div>
                      )
                    })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}