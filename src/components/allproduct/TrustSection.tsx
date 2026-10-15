'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@/lib/router'
import { API_BASE_URL } from '@/lib/env'
import { loadTrustSettings, lookupBatch, type TrustSettings } from '@/lib/trust'

// ─── Outline icons (single-line style) ──────────────────────────────────────
function GlyphosateSeal() {
  return (
    <svg className="nf-trust-seal" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="54" fill="none" stroke="#2F4A3A" strokeWidth="3" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="#2F4A3A" strokeWidth="1.5" />
      <path d="M60 28c6 8 6 14 0 22-6-8-6-14 0-22z" fill="none" stroke="#2F4A3A" strokeWidth="1.75" />
      <path d="M60 50v18M52 68h16" fill="none" stroke="#2F4A3A" strokeWidth="1.75" strokeLinecap="round" />
      <text x="60" y="86" textAnchor="middle" fill="#2F4A3A" fontFamily="Poppins, sans-serif" fontSize="8" fontWeight="700" letterSpacing="0.5">GLYPHOSATE</text>
      <text x="60" y="98" textAnchor="middle" fill="#2F4A3A" fontFamily="Poppins, sans-serif" fontSize="8" fontWeight="700" letterSpacing="0.4">RESIDUE FREE</text>
    </svg>
  )
}

function GmpSeal() {
  return (
    <svg className="nf-trust-seal" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="54" fill="none" stroke="#2F4A3A" strokeWidth="3" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="#2F4A3A" strokeWidth="1.5" />
      <text x="60" y="38" textAnchor="middle" fill="#2F4A3A" fontFamily="Poppins, sans-serif" fontSize="7" fontWeight="600" letterSpacing="1.5">CERTIFIED</text>
      <text x="60" y="68" textAnchor="middle" fill="#2F4A3A" fontFamily="Poppins, sans-serif" fontSize="22" fontWeight="700">GMP</text>
      <text x="60" y="88" textAnchor="middle" fill="#2F4A3A" fontFamily="Poppins, sans-serif" fontSize="7" fontWeight="600" letterSpacing="1.5">CERTIFIED</text>
    </svg>
  )
}

function FsscSeal() {
  return (
    <svg className="nf-trust-seal nf-trust-seal--wide" viewBox="0 0 160 88" aria-hidden="true">
      <path d="M28 58a22 22 0 1 1 16-38" fill="none" stroke="#2F4A3A" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 20a22 22 0 1 1-16 38" fill="none" stroke="#5A4634" strokeWidth="3" strokeLinecap="round" />
      <text x="78" y="52" fill="#2F4A3A" fontFamily="Poppins, sans-serif" fontSize="18" fontWeight="700">FSSC 22000</text>
    </svg>
  )
}

function Icon({ name }: { name: 'flask' | 'qr' | 'shield' | 'doc' }) {
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
  if (name === 'flask') {
    return (
      <svg {...props}>
        <path d="M10 2v7.3L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.3V2" />
        <path d="M8.5 2h7" />
        <path d="M7 15h10" />
      </svg>
    )
  }
  if (name === 'qr') {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3M20 14v3M14 20h3" />
      </svg>
    )
  }
  if (name === 'shield') {
    return (
      <svg {...props}>
        <path d="M12 3l7 3v6c0 4.2-2.8 7.4-7 8.5C7.8 19.4 5 16.2 5 12V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    )
  }
  return (
    <svg {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h6" />
    </svg>
  )
}

// ─── Batch verify states ────────────────────────────────────────────────────
type VerifyState = 'idle' | 'loading' | 'empty' | 'missing' | 'error'

const VERIFY_MESSAGE: Record<Exclude<VerifyState, 'idle' | 'loading'>, string> = {
  empty: 'Please enter a batch number.',
  missing: 'Batch not found. Please check the number on your pack.',
  error: 'Could not verify right now. Please try again.',
}

const EMPTY_SETTINGS: TrustSettings = { fssaiNumber: '', sampleReportUrl: '' }

// ─── Component ──────────────────────────────────────────────────────────────
export default function TrustSection() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<TrustSettings>(EMPTY_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [batch, setBatch] = useState('')
  const [verify, setVerify] = useState<VerifyState>('idle')
  const [photo, setPhoto] = useState('')
  const lookupId = useRef(0)

  // Settings load (FSSAI number + sample report). Fail ho to page na toote.
  useEffect(() => {
    let cancelled = false
    loadTrustSettings()
      .then((next) => {
        if (cancelled) return
        setSettings(next)
        if (!next.fssaiNumber) console.warn('[TrustSection] FSSAI number is missing in settings.')
        if (!next.sampleReportUrl) console.warn('[TrustSection] Sample lab report link is missing in settings.')
      })
      .catch((err: unknown) => {
        console.error('[TrustSection] Failed to load settings:', err)
      })
      .finally(() => {
        if (!cancelled) setSettingsLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Unmount ke baad purana lookup result ignore ho
  useEffect(() => {
    return () => {
      lookupId.current += 1
    }
  }, [])

  const onVerify = async (event: FormEvent) => {
    event.preventDefault()
    if (verify === 'loading') return

    const code = batch.trim()
    if (!code) {
      setVerify('empty')
      return
    }

    const id = ++lookupId.current
    setVerify('loading')
    try {
      const found = await lookupBatch(code)
      if (id !== lookupId.current) return
      if (!found) {
        setVerify('missing')
        return
      }
      navigate(`/trace/${encodeURIComponent(code)}`)
    } catch (err) {
      console.error('[TrustSection] Batch lookup failed:', err)
      if (id === lookupId.current) setVerify('error')
    }
  }

  const showMessage = verify === 'empty' || verify === 'missing' || verify === 'error'

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE_URL}/api/products`, { headers: { Accept: 'application/json' } })
      .then((res) => res.json())
      .then((json) => {
        const rows = Array.isArray(json?.data) ? json.data : []
        const first = rows.find((row: { images?: string[] }) => row.images?.[0]) as { images?: string[] } | undefined
        if (!cancelled) setPhoto(first?.images?.[0] || '')
      })
      .catch((err: unknown) => {
        console.warn('[TrustSection] Side image could not be loaded:', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="trust" className="nf-trust" aria-labelledby="nf-trust-title">
      <div className="nf-trust-wrap">
        <h2 id="nf-trust-title" className="nf-trust-proof-title">Good Food Backed by Proof</h2>
        <div className="nf-trust-split">
          <figure className="nf-trust-photo">
            {photo ? <img src={photo} alt="" /> : null}
          </figure>
          <div className="nf-trust-copy">
        <p className="nf-trust-lead">Why you can trust what&apos;s on your plate</p>

        <div className="nf-trust-grid">
          {/* 1. Lab tested */}
          <article>
            <Icon name="flask" />
            <h3>Lab tested</h3>
            <p>Each batch is tested before it is packed.</p>
            {!settingsLoaded ? (
              <span className="nf-trust-skel" aria-hidden="true" />
            ) : settings.sampleReportUrl ? (
              <a href={settings.sampleReportUrl} target="_blank" rel="noopener noreferrer">
                View sample report
                <span className="nf-trust-sr"> (opens in a new tab)</span>
              </a>
            ) : null}
          </article>

          {/* 2. Batch traceability */}
          <article>
            <Icon name="qr" />
            <h3>Batch traceability</h3>
            <p>Scan the QR on your pack, or enter the batch number below.</p>
            <form onSubmit={onVerify} aria-label="Verify batch number">
              <input
                id="nf-trust-batch"
                value={batch}
                onChange={(event) => {
                  setBatch(event.target.value)
                  if (verify !== 'idle' && verify !== 'loading') setVerify('idle')
                }}
                placeholder="Enter batch number"
                aria-label="Enter batch number"
                aria-invalid={showMessage}
                aria-describedby={showMessage ? 'nf-trust-msg' : undefined}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={verify === 'loading'}
              />
              <button className="nf-trust-verify" type="submit" disabled={verify === 'loading'}>
                {verify === 'loading' ? 'Verifying…' : 'Verify'}
              </button>
            </form>
            {showMessage ? (
              <p id="nf-trust-msg" className="nf-trust-msg" role="alert">
                {VERIFY_MESSAGE[verify as keyof typeof VERIFY_MESSAGE]}
              </p>
            ) : null}
          </article>

          {/* 3. FSSAI licensed */}
          <article>
            <Icon name="shield" />
            <h3>FSSAI licensed</h3>
            {!settingsLoaded ? (
              <span className="nf-trust-skel" aria-hidden="true" />
            ) : settings.fssaiNumber ? (
              <p>License No. {settings.fssaiNumber}</p>
            ) : (
              <p>The license number is printed on every pack.</p>
            )}
          </article>

          {/* 4. Clear labelling */}
          <article>
            <Icon name="doc" />
            <h3>Clear labelling</h3>
            <p>Ingredients, dates and MRP are always visible on every pack.</p>
          </article>
        </div>
          </div>
        </div>

        <div className="nf-trust-proof">
          <div className="nf-trust-proof-grid">
            <article>
              <GlyphosateSeal />
              <p>Independently tested and certified to be completely free from glyphosate, a harmful weedicide linked to serious health risks and banned in 20+ countries.</p>
            </article>
            <article>
              <GmpSeal />
              <p>Our facility follows internationally recognized standards for cleanliness, safety, and quality at every step of the manufacturing process.</p>
            </article>
            <article>
              <FsscSeal />
              <p>A globally respected food safety certification that guarantees our processes, ingredients, and packaging meet the highest international standards for safe, quality food production.</p>
            </article>
          </div>
        </div>
      </div>

      <style>{`
        .nf-trust {
          background: #F6F3EE;
          color: #4A4F4B;
          padding: 80px 0;
          font-family: 'Poppins', system-ui, sans-serif;
          scroll-margin-top: 80px;
        }
        .nf-trust-wrap { width: min(1100px, calc(100% - 32px)); margin: 0 auto; }
        .nf-trust-split {
          display: grid;
          grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
          gap: 40px;
          align-items: center;
        }
        .nf-trust-photo {
          margin: 0;
          min-height: 420px;
          border-radius: 16px;
          overflow: hidden;
          background: #E7EDE8;
        }
        .nf-trust-photo img {
          display: block; width: 100%; height: 100%; min-height: 420px; object-fit: cover;
        }
        .nf-trust-sr {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }

        .nf-trust-lead {
          margin: 0 0 22px;
          color: #2F4A3A;
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600;
          font-size: clamp(26px, 3vw, 32px);
          line-height: 1.25;
        }
        .nf-trust h2 {
          margin: 0 0 28px;
          max-width: none;
          text-align: left;
          color: #2F4A3A;
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.25;
        }

        .nf-trust-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px 24px;
          text-align: left;
        }
        .nf-trust article { min-width: 0; }
        .nf-trust article > svg { display: block; color: #2F4A3A; }

        .nf-trust h3 {
          margin: 14px 0 0;
          color: #2F4A3A;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          line-height: 1.3;
        }
        .nf-trust p {
          margin: 10px 0 0;
          color: #4A4F4B;
          font-size: 16px;
          line-height: 1.7;
        }

        /* Link (underline, taaki sirf rang se pehchaan na ho) */
        .nf-trust a {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          margin-top: 6px;
          color: #2F4A3A;
          font-size: 16px;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .nf-trust a:hover { text-decoration-thickness: 2px; }

        /* Form */
        .nf-trust form { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .nf-trust input {
          flex: 1 1 140px;
          min-height: 44px;
          min-width: 0;
          padding: 0 12px;
          border: 2px solid transparent;
          border-radius: 12px;
          background: #FFFFFF;
          color: #2F4A3A;
          font: 400 16px 'Poppins', system-ui, sans-serif;
        }
        .nf-trust input::placeholder { color: #5B605C; opacity: 1; }
        .nf-trust input[aria-invalid="true"] { border-color: #C7922E; }
        .nf-trust input:disabled { opacity: 0.75; }

        button.nf-trust-verify {
          min-height: 44px;
          padding: 0 20px;
          border: 0;
          border-radius: 12px;
          background: #2F4A3A;
          color: #F6F3EE;
          font: 500 16px 'Poppins', system-ui, sans-serif;
          cursor: pointer;
          transition: opacity 0.25s ease;
        }
        button.nf-trust-verify:hover:not(:disabled) { opacity: 0.92; }
        button.nf-trust-verify:disabled { cursor: wait; opacity: 0.75; }

        .nf-trust a:focus-visible,
        .nf-trust input:focus-visible,
        button.nf-trust-verify:focus-visible {
          outline: 3px solid #C7922E;
          outline-offset: 3px;
        }

        /* Message (rang ke saath border, taaki sirf rang par nirbhar na ho) */
        .nf-trust .nf-trust-msg {
          margin-top: 12px;
          padding: 8px 12px;
          border-left: 4px solid #C7922E;
          border-radius: 4px;
          background: #FFFFFF;
          color: #4A4F4B;
          font-size: 15px;
          line-height: 1.5;
        }

        /* Settings load hote waqt */
        .nf-trust-skel {
          display: block;
          width: 70%;
          height: 18px;
          margin-top: 14px;
          border-radius: 6px;
          background: #E6E3DE;
          animation: nfTrustPulse 1.4s ease-in-out infinite;
        }
        @keyframes nfTrustPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        /* Responsive */
        @media (max-width: 1023px) {
          .nf-trust-split { grid-template-columns: 1fr; }
          .nf-trust-photo, .nf-trust-photo img { min-height: 240px; }
        }
        .nf-trust-proof { margin-top: 72px; }
        h2.nf-trust-proof-title {
          margin: 0 0 40px;
          text-align: center;
          color: #2F4A3A;
          font-family: 'Poppins', system-ui, sans-serif;
          font-weight: 700;
          font-size: clamp(26px, 3vw, 34px);
          line-height: 1.25;
          letter-spacing: -0.02em;
        }
        .nf-trust-proof-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }
        .nf-trust-proof article {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-height: 100%;
          padding: 32px 22px 28px;
          border-radius: 18px;
          background: #FFFFFF;
          box-shadow: 0 10px 28px rgba(47, 74, 58, 0.06);
        }
        .nf-trust-seal { width: 108px; height: 108px; display: block; }
        .nf-trust-seal--wide { width: 168px; height: 92px; }
        .nf-trust-proof p {
          margin: 18px 0 0;
          color: #2F4A3A;
          font-size: 15px;
          line-height: 1.65;
        }
        @media (max-width: 767px) {
          .nf-trust { padding: 48px 0; }
          .nf-trust h2 { margin-bottom: 28px; }
          .nf-trust-grid { grid-template-columns: 1fr; gap: 32px; }
          .nf-trust-proof { margin-top: 48px; }
          .nf-trust-proof-grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          button.nf-trust-verify { transition: none; }
          .nf-trust-skel { animation: none; }
        }
      `}</style>
    </section>
  )
}