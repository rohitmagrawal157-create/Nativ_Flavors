'use client'

import { useEffect, useState } from 'react'
import NavbarOne from '@/components/navbar/navbar-one'
import FooterOne from '@/components/footer/footer-one'
import ScrollToTop from '@/components/scroll-to-top'
import { Link, useParams } from '@/lib/router'
import { lookupBatch, type BatchRecord } from '@/lib/trust'

type Status = 'loading' | 'found' | 'missing' | 'error'

export default function BatchTracePage() {
  const { batchNumber = '' } = useParams<{ batchNumber: string }>()
  const code = decodeURIComponent(batchNumber)
  const [status, setStatus] = useState<Status>('loading')
  const [batch, setBatch] = useState<BatchRecord | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    lookupBatch(code)
      .then((found) => {
        if (cancelled) return
        setBatch(found)
        setStatus(found ? 'found' : 'missing')
      })
      .catch((err: unknown) => {
        console.error('[BatchTrace] Lookup failed:', err)
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [code])

  return (
    <>
      <NavbarOne />
      <section className="nf-trace">
        <div className="nf-trace-wrap">
          <p><Link to="/">Home</Link></p>
          <h1>Batch {code}</h1>
          {status === 'loading' ? <p role="status">Verifying…</p> : null}
          {status === 'missing' ? <p role="status">Batch not found. Please check the number on your pack.</p> : null}
          {status === 'error' ? <p role="status">Could not verify right now. Please try again.</p> : null}
          {status === 'found' && batch ? (
            <dl>
              <div><dt>Batch number</dt><dd>{batch.batchNumber}</dd></div>
              <div><dt>Product</dt><dd>{batch.product || '—'}</dd></div>
              <div><dt>Packing date</dt><dd>{batch.packingDate || '—'}</dd></div>
              <div><dt>Best before</dt><dd>{batch.bestBefore || '—'}</dd></div>
            </dl>
          ) : null}
        </div>
        <style>{`
          .nf-trace { background: #F6F3EE; padding: 48px 0 80px; font-family: 'Poppins', system-ui, sans-serif; color: #4A4F4B; }
          .nf-trace-wrap { width: min(1100px, calc(100% - 32px)); margin: 0 auto; }
          .nf-trace a { color: #2F4A3A; min-height: 44px; display: inline-flex; align-items: center; text-decoration: none; }
          .nf-trace h1 { margin: 12px 0 24px; color: #2F4A3A; font-family: 'Playfair Display', Georgia, serif; font-size: clamp(32px, 4vw, 40px); font-weight: 600; }
          .nf-trace dl { display: grid; gap: 16px; margin: 0; }
          .nf-trace dl div { background: #FFFFFF; border-radius: 16px; padding: 20px; border-top: 4px solid #2F4A3A; }
          .nf-trace dt { color: #6E736F; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; }
          .nf-trace dd { margin: 6px 0 0; color: #2F4A3A; font-family: 'Playfair Display', Georgia, serif; font-size: 22px; }
          .nf-trace a:focus-visible { outline: 3px solid #C7922E; outline-offset: 3px; }
        `}</style>
      </section>
      <FooterOne />
      <ScrollToTop />
    </>
  )
}
