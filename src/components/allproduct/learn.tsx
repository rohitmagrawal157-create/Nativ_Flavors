'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@/lib/router'
import { API_BASE_URL } from '@/lib/env'
import { formatDate, loadGuide, loadGuides, type GuideCard, type GuideDetail } from '@/lib/learn'

function slugFromUrl() {
  if (typeof window === 'undefined') return ''
  const parts = window.location.pathname.split('/').filter(Boolean)
  return decodeURIComponent(parts[parts.length - 1] || '')
}

function Tick() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export default function LearnArticlePage({ slug: slugProp }: { slug?: string }) {
  const [slug, setSlug] = useState(slugProp ?? '')
  const [guide, setGuide] = useState<GuideDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const requestId = useRef(0)

  // Slug prop na mile to URL ke aakhri hisse se lo
  useEffect(() => {
    if (!slugProp) setSlug(slugFromUrl())
    else setSlug(slugProp)
  }, [slugProp])

  const load = useCallback(async () => {
    if (!slug) return
    const id = ++requestId.current
    setLoading(true)
    setError(false)
    setNotFound(false)
    try {
      const data = await loadGuide(slug)
      if (id !== requestId.current) return
      if (!data) setNotFound(true)
      setGuide(data)
    } catch (err) {
      console.error('[LearnArticlePage] Failed to load guide:', err)
      if (id === requestId.current) setError(true)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    load()
    return () => {
      requestId.current += 1
    }
  }, [load])

  // Browser tab title + description
  useEffect(() => {
    if (!guide) return
    document.title = `${guide.title} | Natural Flavor`
    const desc = guide.summary || guide.intro
    if (desc) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', desc.slice(0, 160))
    }
  }, [guide])

  const date = guide ? formatDate(guide.publishedAt) : ''

  return (
    <main className="nf-art">
      <article className="nf-art-wrap">
        <nav aria-label="Breadcrumb" className="nf-art-crumb">
          <Link to="/">Home</Link> <span aria-hidden="true">/</span>{' '}
          <Link to="/learn">Learn</Link>
        </nav>

        {loading ? (
          <div role="status" aria-busy="true">
            <span className="nf-art-sr">Loading guide</span>
            <div className="nf-art-skel nf-art-skel--title" aria-hidden="true" />
            <div className="nf-art-skel" aria-hidden="true" />
            <div className="nf-art-skel" aria-hidden="true" />
            <div className="nf-art-skel nf-art-skel--short" aria-hidden="true" />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="nf-art-state" role="alert">
            <p>This guide could not be loaded</p>
            <button type="button" className="nf-art-btn" onClick={load}>Try again</button>
          </div>
        ) : null}

        {!loading && !error && notFound ? (
          <div className="nf-art-state">
            <p>We could not find this guide.</p>
            <Link to="/learn" className="nf-art-btn">See all guides</Link>
          </div>
        ) : null}

        {!loading && !error && guide ? (
          <>
            <header className="nf-art-head">
              <p className="nf-art-label">LEARN</p>
              <h1>{guide.title}</h1>
              {date ? <p className="nf-art-date">{date}</p> : null}
              {guide.intro ? <p className="nf-art-intro">{guide.intro}</p> : null}
            </header>

            {guide.paragraphs.length > 0 ? (
              <div className="nf-art-body">
                {guide.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : null}

            {guide.steps.length > 0 ? (
              <section aria-labelledby="nf-art-steps" className="nf-art-block">
                <h2 id="nf-art-steps">Simple tests you can do at home</h2>
                <ol className="nf-art-steps">
                  {guide.steps.map((s, i) => (
                    <li key={i}>
                      <span className="nf-art-num" aria-hidden="true">{i + 1}</span>
                      <div>
                        {s.title ? <h3>{s.title}</h3> : null}
                        {s.text ? <p>{s.text}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {guide.labelChecks.length > 0 ? (
              <section aria-labelledby="nf-art-label" className="nf-art-block nf-art-labelbox">
                <h2 id="nf-art-label">What to check on the label</h2>
                <ul className="nf-art-checks">
                  {guide.labelChecks.map((c, i) => (
                    <li key={i}>
                      <span className="nf-art-tick"><Tick /></span>
                      {c}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="nf-art-back">
              <Link to="/learn">← Back to all guides</Link>
            </p>
          </>
        ) : null}
      </article>

      <style>{`
        .nf-art {
          background: #F6F3EE; padding: 48px 0 80px;
          font-family: 'Poppins', system-ui, sans-serif; min-height: 60vh;
        }
        .nf-art-wrap { width: min(760px, calc(100% - 32px)); margin: 0 auto; }
        .nf-art-sr {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }
        .nf-art-crumb { font-size: 14px; color: #6E736F; margin-bottom: 28px; }
        .nf-art a { color: #2F4A3A; text-underline-offset: 3px; }
        .nf-art a:focus-visible { outline: 3px solid #C7922E; outline-offset: 3px; border-radius: 4px; }

        .nf-art-head { margin-bottom: 36px; }
        .nf-art-label { margin: 0; color: #6E736F; font-size: 13px; font-weight: 500; letter-spacing: 0.18em; }
        .nf-art h1 {
          margin: 12px 0 0; color: #2F4A3A; font-weight: 600; line-height: 1.2;
          font-family: 'Playfair Display', Georgia, serif; font-size: clamp(30px, 5vw, 44px);
        }
        .nf-art-date { margin: 10px 0 0; color: #6E736F; font-size: 14px; }
        .nf-art-intro { margin: 20px 0 0; color: #4A4F4B; font-size: 18px; line-height: 1.8; }

        .nf-art-body p { margin: 0 0 18px; color: #4A4F4B; font-size: 17px; line-height: 1.8; }

        .nf-art-block { margin-top: 44px; }
        .nf-art h2 {
          margin: 0 0 20px; color: #2F4A3A; font-weight: 600; line-height: 1.3;
          font-family: 'Playfair Display', Georgia, serif; font-size: clamp(24px, 3.4vw, 30px);
        }

        /* Steps */
        .nf-art-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 22px; }
        .nf-art-steps li { display: flex; gap: 16px; align-items: flex-start; }
        .nf-art-num {
          flex: 0 0 auto; width: 36px; height: 36px; border-radius: 50%;
          background: #2F4A3A; color: #F6F3EE; font-weight: 600; font-size: 15px;
          display: flex; align-items: center; justify-content: center;
        }
        .nf-art-steps h3 {
          margin: 2px 0 0; color: #2F4A3A; font-weight: 600; font-size: 20px; line-height: 1.3;
          font-family: 'Playfair Display', Georgia, serif;
        }
        .nf-art-steps p { margin: 6px 0 0; color: #4A4F4B; font-size: 16px; line-height: 1.75; }
        .nf-art-steps li > div > p:first-child { margin-top: 6px; }

        /* Label box */
        .nf-art-labelbox {
          background: #FFFFFF; border: 1px solid #ECE7DE; border-top: 4px solid #C7922E;
          border-radius: 16px; padding: 24px 24px 12px; box-shadow: 0 8px 22px rgba(47, 74, 58, 0.06);
        }
        .nf-art-checks { list-style: none; margin: 0; padding: 0; }
        .nf-art-checks li {
          display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px;
          color: #4A4F4B; font-size: 16px; line-height: 1.65;
        }
        .nf-art-tick { flex: 0 0 auto; margin-top: 4px; color: #2F4A3A; display: inline-flex; }

        .nf-art-back { margin: 48px 0 0; }
        .nf-art-back a { display: inline-flex; align-items: center; min-height: 44px; font-weight: 500; font-size: 16px; }

        /* States */
        .nf-art-state {
          min-height: 220px; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 16px; text-align: center; color: #4A4F4B; font-size: 16px;
        }
        .nf-art-state p { margin: 0; }
        .nf-art a.nf-art-btn, .nf-art-btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 44px; padding: 0 22px; border: 0; border-radius: 12px;
          background: #2F4A3A; color: #F6F3EE; font: 500 16px 'Poppins', system-ui, sans-serif;
          text-decoration: none; cursor: pointer; transition: background-color 0.3s ease;
        }
        .nf-art .nf-art-btn:hover { background: #3C5D49; }
        .nf-art-skel {
          height: 18px; margin-top: 16px; border-radius: 6px; background: #E9E5DD;
          animation: nfArtPulse 1.4s ease-in-out infinite;
        }
        .nf-art-skel--title { height: 40px; width: 80%; margin-top: 0; }
        .nf-art-skel--short { width: 55%; }
        @keyframes nfArtPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

        @media (max-width: 767px) {
          .nf-art { padding: 32px 0 56px; }
          .nf-art-intro { font-size: 17px; }
          .nf-art-labelbox { padding: 20px 18px 8px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nf-art-btn { transition: none; }
          .nf-art-skel { animation: none; }
        }
      `}</style>
    </main>
  )
}

function LearnMark({ name }: { name: 'list' | 'date' | 'badge' }) {
  const props = {
    width: 30,
    height: 30,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (name === 'list') {
    return (
      <svg {...props}>
        <path d="M8 7h11M8 12h11M8 17h11" />
        <path d="M4 7h.01M4 12h.01M4 17h.01" />
      </svg>
    )
  }
  if (name === 'date') {
    return (
      <svg {...props}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    )
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

const LEARN_POINTS = [
  {
    icon: 'list' as const,
    title: 'Ingredients first',
    text: 'The list starts with what the food contains most of. Names further down are smaller parts.',
  },
  {
    icon: 'date' as const,
    title: 'Dates on the pack',
    text: 'The packing date and the best-before date tell you how long the maker expects the food to keep its quality.',
  },
  {
    icon: 'badge' as const,
    title: 'License number',
    text: 'Packaged food in India shows an FSSAI license number. It identifies the business that packed it.',
  },
]

const LEARN_CARDS = [
  {
    icon: 'list' as const,
    title: 'Read the ingredients',
    text: 'Ingredients are written in descending order by weight. The first name is the largest part of that pack.',
  },
  {
    icon: 'date' as const,
    title: 'Check the dates',
    text: 'Best before is the date up to which the maker expects the food to stay at its usual quality. Use the packing date to see when it was sealed.',
  },
  {
    icon: 'badge' as const,
    title: 'Price and license',
    text: 'MRP is the highest price that can be charged for that pack. The license number sits with the other label details, not in the fine print alone.',
  },
]

function GuideIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 8H20" />
    </svg>
  )
}

function sideImage(raw: unknown) {
  const value = String(raw ?? '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

export function LearnSection({ scope = 'home' }: { scope?: 'home' | 'all' }) {
  const [guides, setGuides] = useState<GuideCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [photo, setPhoto] = useState('')

  const load = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    loadGuides()
      .then((data) => {
        if (!cancelled) setGuides(scope === 'home' ? data.slice(0, 3) : data)
      })
      .catch((err: unknown) => {
        console.error('[LearnSection] Failed to load guides:', err)
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [scope])

  useEffect(() => {
    return load()
  }, [load])

  useEffect(() => {
    if (scope !== 'home') return
    let cancelled = false
    fetch(`${API_BASE_URL}/api/products`, { headers: { Accept: 'application/json' } })
      .then((res) => res.json())
      .then((json) => {
        const rows = Array.isArray(json?.data) ? json.data : []
        const urls = rows
          .map((row: { images?: string[] }) => sideImage(row.images?.[0]))
          .filter(Boolean)
        if (!cancelled) setPhoto(urls[1] || urls[0] || '')
      })
      .catch((err: unknown) => {
        console.warn('[LearnSection] Side image could not be loaded:', err)
      })
    return () => {
      cancelled = true
    }
  }, [scope])

  const home = scope === 'home'

  return (
    <section className="nf-learn" aria-labelledby="nf-learn-title">
      <div className="nf-learn-wrap">
        {home ? (
          <header className="nf-learn-top">
            <p className="nf-learn-label">LEARN</p>
            <h2 id="nf-learn-title" className="nf-learn-top-title">Know what you eat</h2>
          </header>
        ) : null}
        <div className={home ? 'nf-learn-split' : undefined}>
        <div className="nf-learn-copy">
        <header className="nf-learn-head">
          {home ? null : <p className="nf-learn-label">LEARN</p>}
          {home ? null : <h2 id="nf-learn-title">Know what you eat</h2>}
          <p className="nf-learn-sub">
            A label is the simplest way to understand a pack. Read the ingredients, the dates and the price before you decide. The words on the pack are there so you do not have to guess.
          </p>
        </header>

        {home ? (
          <ul className="nf-learn-points">
            {LEARN_POINTS.map((point) => (
              <li key={point.title}>
                <LearnMark name={point.icon} />
                <div>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {loading ? (
          <div className="nf-learn-grid" aria-hidden="true">
            <span className="nf-learn-sr">Loading guides</span>
            {Array.from({ length: 3 }, (_, index) => (
              <div className="nf-learn-card nf-learn-skel" key={index} />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="nf-learn-state" role="alert">
            <p>Guides could not be loaded</p>
            <button type="button" className="nf-learn-retry" onClick={load}>Try again</button>
          </div>
        ) : null}

        {!loading && !error && guides.length === 0 && !home ? (
          <p className="nf-learn-state">New guides will be added here soon.</p>
        ) : null}

        {!loading && !error && guides.length > 0 ? (
          <>
            <div className="nf-learn-grid">
              {guides.map((guide) => (
                <Link key={guide.id} to={`/learn/${guide.slug}`} className="nf-learn-card">
                  <span className="nf-learn-media">
                    {guide.imageUrl ? <img src={guide.imageUrl} alt="" /> : <GuideIcon />}
                  </span>
                  <span className="nf-learn-title">{guide.title}</span>
                  {guide.summary ? <span className="nf-learn-summary">{guide.summary}</span> : null}
                  <span className="nf-learn-more">Read more →</span>
                </Link>
              ))}
            </div>
            {scope === 'home' ? (
              <p className="nf-learn-all-wrap">
                <Link to="/learn" className="nf-learn-all">View all guides →</Link>
              </p>
            ) : null}
          </>
        ) : null}
        </div>
        {home ? (
          <figure className="nf-learn-photo">
            {photo ? <img src={photo} alt="" /> : null}
          </figure>
        ) : null}
        </div>

        {home ? (
          <div className="nf-learn-bottom">
            <h2 className="nf-learn-bottom-title">What to look for on the label</h2>
            <div className="nf-learn-bottom-grid">
              {LEARN_CARDS.map((card) => (
                <article key={card.title}>
                  <LearnMark name={card.icon} />
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        .nf-learn {
          background: #F6F3EE;
          padding: 80px 0;
          font-family: 'Poppins', system-ui, sans-serif;
        }
        .nf-learn-wrap { width: min(1100px, calc(100% - 32px)); margin: 0 auto; }
        .nf-learn-sr {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }
        .nf-learn-split {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: 40px;
          align-items: center;
        }
        .nf-learn-photo {
          margin: 0;
          min-height: 360px;
          border-radius: 16px;
          overflow: hidden;
          background: #E7EDE8;
        }
        .nf-learn-photo img {
          display: block; width: 100%; height: 100%; min-height: 360px; object-fit: cover;
        }
        .nf-learn-top { text-align: center; margin: 0 auto 40px; }
        .nf-learn h2.nf-learn-top-title {
          margin: 12px 0 0; text-align: center; color: #2F4A3A;
          font-family: 'Poppins', system-ui, sans-serif; font-weight: 700;
          font-size: clamp(26px, 3vw, 34px); line-height: 1.25; letter-spacing: -0.02em;
        }
        .nf-learn-head { text-align: center; max-width: 720px; margin: 0 auto 48px; }
        .nf-learn-split .nf-learn-head { text-align: left; max-width: none; margin: 0 0 8px; }
        .nf-learn-split .nf-learn-grid { grid-template-columns: 1fr; }
        .nf-learn-split .nf-learn-state { align-items: flex-start; text-align: left; min-height: 0; }
        .nf-learn-label {
          margin: 0; color: #6E736F; font-size: 13px; font-weight: 500; letter-spacing: 0.18em;
        }
        .nf-learn h2 {
          margin: 12px 0 0; color: #2F4A3A; font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600; font-size: clamp(32px, 4vw, 40px); line-height: 1.25;
        }
        .nf-learn-sub { margin: 12px 0 0; color: #4A4F4B; font-size: 16px; line-height: 1.7; }
        .nf-learn-points { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 18px; }
        .nf-learn-points li { display: flex; gap: 14px; align-items: flex-start; color: #2F4A3A; }
        .nf-learn-points h3 {
          margin: 0; color: #2F4A3A; font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px; font-weight: 600; line-height: 1.3;
        }
        .nf-learn-points p { margin: 6px 0 0; color: #4A4F4B; font-size: 15px; line-height: 1.65; }
        .nf-learn-bottom { margin-top: 72px; }
        h2.nf-learn-bottom-title {
          margin: 0 0 36px; text-align: center; color: #2F4A3A;
          font-family: 'Poppins', system-ui, sans-serif; font-weight: 700;
          font-size: clamp(26px, 3vw, 34px); line-height: 1.25; letter-spacing: -0.02em;
        }
        .nf-learn-bottom-grid {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px;
        }
        .nf-learn-bottom article {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          min-height: 100%; padding: 32px 22px 28px; border-radius: 18px;
          background: #FFFFFF; box-shadow: 0 10px 28px rgba(47, 74, 58, 0.06); color: #2F4A3A;
        }
        .nf-learn-bottom h3 {
          margin: 16px 0 0; color: #2F4A3A; font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px; font-weight: 600; line-height: 1.3;
        }
        .nf-learn-bottom p { margin: 12px 0 0; color: #2F4A3A; font-size: 15px; line-height: 1.65; }
        .nf-learn-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          align-items: stretch;
        }
        .nf-learn-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 20px;
          border-radius: 16px;
          background: #FFFFFF;
          box-shadow: 0 8px 22px rgba(47, 74, 58, 0.06);
          color: inherit;
          text-decoration: none;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .nf-learn-card:focus-visible {
          outline: 3px solid #C7922E;
          outline-offset: 3px;
        }
        .nf-learn-media {
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 4 / 3;
          border-radius: 10px;
          overflow: hidden;
          background: #F6F3EE;
          color: #2F4A3A;
        }
        .nf-learn-media img {
          display: block; width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.3s ease;
        }
        .nf-learn-title {
          display: block; margin-top: 16px; color: #2F4A3A;
          font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 600; line-height: 1.3;
        }
        .nf-learn-summary {
          display: -webkit-box; margin-top: 8px; overflow: hidden; color: #4A4F4B;
          font-size: 15px; line-height: 1.6; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
        }
        .nf-learn-more {
          display: inline-block; margin-top: auto; padding-top: 14px; color: #2F4A3A; font-size: 16px; font-weight: 500;
        }
        .nf-learn-all-wrap { margin: 28px 0 0; text-align: center; }
        .nf-learn-all {
          display: inline-flex; align-items: center; min-height: 44px; color: #2F4A3A;
          font-size: 16px; font-weight: 500; text-decoration: none;
        }
        .nf-learn-all:hover { text-decoration: underline; text-underline-offset: 4px; }
        .nf-learn-all:focus-visible {
          outline: 3px solid #C7922E; outline-offset: 3px; border-radius: 8px;
        }
        .nf-learn-state {
          min-height: 180px; margin: 0; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 16px; text-align: center; color: #4A4F4B; font-size: 16px;
        }
        .nf-learn-retry {
          min-height: 44px; padding: 0 22px; border: 0; border-radius: 12px;
          background: #2F4A3A; color: #F6F3EE; font: 500 16px 'Poppins', system-ui, sans-serif; cursor: pointer;
        }
        .nf-learn-retry:focus-visible { outline: 3px solid #C7922E; outline-offset: 3px; }
        .nf-learn-skel {
          min-height: 320px; background: #E6E3DE; box-shadow: none; pointer-events: none;
        }
        @media (hover: hover) and (pointer: fine) {
          a.nf-learn-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 32px rgba(47, 74, 58, 0.12);
          }
          a.nf-learn-card:hover .nf-learn-media img { transform: scale(1.03); }
        }
        @media (max-width: 1023px) {
          .nf-learn-split { grid-template-columns: 1fr; }
          .nf-learn-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .nf-learn-split .nf-learn-grid { grid-template-columns: 1fr; }
          .nf-learn-photo { min-height: 240px; }
          .nf-learn-photo img { min-height: 240px; }
        }
        @media (max-width: 767px) {
          .nf-learn { padding: 48px 0; }
          .nf-learn-grid { grid-template-columns: 1fr; }
          .nf-learn-bottom { margin-top: 48px; }
          .nf-learn-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nf-learn-card, .nf-learn-media img { transition: none; }
        }
      `}</style>
    </section>
  )
}