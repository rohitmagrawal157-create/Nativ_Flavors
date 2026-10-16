'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { API_BASE_URL } from '@/lib/env'
import { CLAY_FOREST, namedCategoryTone } from '@/lib/brand'
import { Link } from '@/lib/router'

// ─── Settings (yahin se badlein) ────────────────────────────────────────────
const ALL_PRODUCTS_HREF = '/products' // pehle /shop-v1 tha; apna asli route yahan rakhein

type Shape = 'rounded' | 'arch' | 'circle'
type Fit = 'contain' | 'cover'

interface Props {
  /** Image box ka shape: rounded (default), arch (upar se gol, native look), circle */
  shape?: Shape
  /** cover = photo fills the frame (default). contain = the whole picture sits inside the frame */
  fit?: Fit
  /** Kitni categories dikhani hain */
  limit?: number
  background?: string
}

type Row = Record<string, unknown>

interface PickItem {
  id: string
  name: string
  slug: string
  src: string
  accent: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────
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
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw
  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`
}

function isActive(row: Row) {
  const status = row.status ?? row.is_active ?? row.active
  return status !== 0 && status !== false && status !== '0' && status !== 'inactive'
}

function accentFor(name: string, fromApi: string) {
  if (/^#[0-9a-f]{6}$/i.test(fromApi)) return fromApi
  return namedCategoryTone(name)?.solid ?? CLAY_FOREST
}

async function loadPicks(): Promise<PickItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/categories`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json?.status === false) throw new Error('API returned status: false')

  const rows: Row[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
  return rows
    .filter(isActive)
    .map((row) => {
      const name = textFrom(row, ['name', 'title'])
      return {
        id: String(row.id ?? ''),
        name,
        slug: textFrom(row, ['slug', 'category_slug']) || slugify(name),
        src: mediaUrl(textFrom(row, ['image_url', 'image', 'banner', 'photo'])),
        accent: accentFor(name, textFrom(row, ['accent_color', 'accent'])),
      }
    })
    .filter((item) => item.name && item.slug)
}

function LeafIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 3-7 8-7 0 5-3 8-8 7z" />
      <path d="M12 14c0-3-2.5-5-6.5-5 0 4 2.5 6 6.5 5z" />
    </svg>
  )
}

// ─── One card ───────────────────────────────────────────────────────────────
function CategoryCard({ item, index }: { item: PickItem; index: number }) {
  const [broken, setBroken] = useState(false)
  const showImg = item.src && !broken

  return (
    <Link
      to={`/shop/${item.slug}`}
      className="tp-card"
      style={{ '--accent': item.accent } as CSSProperties}
      aria-label={item.name}
    >
      <span className="tp-line" />
      <span className="tp-frame">
        {showImg ? (
          <img
            src={item.src}
            alt=""
            width={480}
            height={360}
            className="tp-img"
            loading={index < 4 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="tp-fallback"><LeafIcon /></span>
        )}
      </span>
      <span className="tp-name">{item.name}</span>
      <span className="tp-go">Explore →</span>
    </Link>
  )
}

// ─── Section ────────────────────────────────────────────────────────────────
export default function TopPicks({
  shape = 'rounded',
  fit = 'cover',
  limit = 8,
  background = '#F6F3EE',
}: Props) {
  const [items, setItems] = useState<PickItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(false)
    try {
      const data = await loadPicks()
      if (id === requestId.current) setItems(data)
    } catch (err) {
      console.error('[TopPicks] Failed to load categories:', err)
      if (id === requestId.current) setError(true)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return () => {
      requestId.current += 1
    }
  }, [load])

  const visible = items.slice(0, limit)

  return (
    <section
      className={`tp tp--${shape} tp--${fit}`}
      aria-labelledby="tp-title"
      style={{ '--tp-bg': background } as CSSProperties}
    >
      <div className="tp-wrap">
        <header className="tp-head">
          <p className="tp-label">OUR PRODUCTS</p>
          <h2 id="tp-title">Shop by category</h2>
          <p className="tp-sub">Ghee, grains, sweeteners and the rest of the kitchen.</p>
        </header>

        {loading ? (
          <div role="status" aria-busy="true">
            <span className="tp-sr">Loading categories</span>
            <div className="tp-grid" aria-hidden="true">
              {Array.from({ length: Math.min(limit, 8) }, (_, i) => (
                <div className="tp-card tp-skel" key={i} />
              ))}
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="tp-state" role="alert">
            <p>Categories could not be loaded</p>
            <button type="button" className="tp-btn" onClick={load}>Try again</button>
          </div>
        ) : null}

        {!loading && !error && visible.length === 0 ? (
          <div className="tp-state">
            <p>Our product categories will appear here soon.</p>
          </div>
        ) : null}

        {!loading && !error && visible.length > 0 ? (
          <>
            <div className="tp-grid">
              {visible.map((item, i) => (
                <CategoryCard key={item.id || item.slug} item={item} index={i} />
              ))}
            </div>
            <p className="tp-all-wrap">
              <Link to={ALL_PRODUCTS_HREF} className="tp-btn tp-btn--outline">
                Shop all products
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
            </p>
          </>
        ) : null}
      </div>

      <style>{`
        .tp, .tp * { box-sizing: border-box; }
        .tp {
          --tp-bg: #F6F3EE;
          background: var(--tp-bg);
          padding: 80px 0;
          font-family: 'Poppins', system-ui, sans-serif;
          border-top: 1px solid rgba(47, 74, 58, 0.08);
        }
        .tp-wrap { width: min(1100px, calc(100% - 32px)); margin: 0 auto; }
        .tp-sr {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }

        /* Heading */
        .tp-head { text-align: center; max-width: 640px; margin: 0 auto 48px; }
        .tp-label { margin: 0; color: #6E736F; font-size: 13px; font-weight: 500; letter-spacing: 0.18em; }
        .tp h2 {
          margin: 12px 0 0; color: #2F4A3A; font-weight: 600; line-height: 1.25;
          font-family: 'Playfair Display', Georgia, serif; font-size: clamp(32px, 4vw, 40px);
        }
        .tp-sub { margin: 12px 0 0; color: #4A4F4B; font-size: 16px; line-height: 1.7; }

        /* Grid: 4 / 2 / 2 (mobile par kabhi 4 nahi) */
        .tp-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px; align-items: stretch;
        }

        /* Card */
        .tp-card {
          position: relative; display: flex; flex-direction: column; height: 100%;
          padding: 16px; border: 1px solid #ECE7DE; border-radius: 16px;
          background: #FFFFFF; box-shadow: 0 8px 22px rgba(47, 74, 58, 0.06);
          color: inherit; text-decoration: none; overflow: hidden; min-width: 0;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        a.tp-card:hover {
          transform: translateY(-4px); border-color: var(--accent);
          box-shadow: 0 16px 32px rgba(47, 74, 58, 0.12);
        }
        a.tp-card:active { transform: scale(0.98); }
        a.tp-card:focus-visible { outline: 3px solid #C7922E; outline-offset: 3px; }

        .tp-line { display: block; height: 4px; margin: -16px -16px 14px; background: var(--accent); }

        .tp-frame {
          display: block;
          width: 100%; aspect-ratio: 4 / 5; overflow: hidden;
          background: #F6F3EE;
          border-radius: 12px;
        }
        .tp-img {
          display: block; width: 100%; height: 100%;
          object-position: center; transition: transform 0.3s ease;
        }
        .tp--contain .tp-img { object-fit: contain; }
        .tp--cover .tp-img { object-fit: cover; }

        .tp-fallback {
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 100%; color: #2F4A3A;
          background: #E7EDE8;
          background: color-mix(in srgb, var(--accent) 14%, #FFFFFF);
        }

        /* Shapes */
        .tp--arch .tp-frame { border-radius: 999px 999px 12px 12px; }
        .tp--circle .tp-frame {
          aspect-ratio: 1 / 1; border-radius: 50%;
          width: 82%; margin-inline: auto;
        }

        .tp-name {
          display: block; margin-top: 14px; color: #2F4A3A;
          font-family: 'Playfair Display', Georgia, serif; font-weight: 600;
          font-size: 20px; line-height: 1.35; text-align: center;
          overflow-wrap: break-word;
        }
        .tp-go {
          margin-top: auto; padding-top: 10px; text-align: center;
          color: #2F4A3A; font-size: 15px; font-weight: 500;
        }

        /* Buttons */
        .tp-all-wrap { margin: 36px 0 0; text-align: center; }
        .tp-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          min-height: 48px; padding: 0 26px; border: 2px solid #2F4A3A; border-radius: 12px;
          background: #2F4A3A; color: #F6F3EE; font: 500 16px 'Poppins', system-ui, sans-serif;
          text-decoration: none; cursor: pointer; transition: background-color 0.3s ease, color 0.3s ease;
        }
        .tp-btn:hover { background: #3C5D49; border-color: #3C5D49; }
        .tp-btn--outline { background: transparent; color: #2F4A3A; }
        .tp-btn--outline:hover { background: #2F4A3A; color: #F6F3EE; border-color: #2F4A3A; }
        .tp-btn:focus-visible { outline: 3px solid #C7922E; outline-offset: 3px; }

        /* States */
        .tp-state {
          min-height: 180px; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 16px; text-align: center; color: #4A4F4B; font-size: 16px;
        }
        .tp-state p { margin: 0; }
        .tp-skel {
          min-height: 260px; background: #E9E5DD; box-shadow: none; border-color: transparent;
          animation: tpPulse 1.4s ease-in-out infinite;
        }
        @keyframes tpPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

        /* Responsive */
        @media (max-width: 700px) {
          .tp { padding: 48px 0; }
          .tp-head { margin-bottom: 32px; }
          .tp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          .tp-card { padding: 12px; }
          .tp-line { margin: -12px -12px 12px; }
          .tp-name { font-size: 17px; margin-top: 12px; }
          .tp-go { font-size: 14px; }
        }
        @media (max-width: 359px) {
          .tp-grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tp-card, .tp-img, .tp-btn { transition: none; }
          a.tp-card:hover, a.tp-card:active { transform: none; }
          .tp-skel { animation: none; }
        }
      `}</style>
    </section>
  )
}