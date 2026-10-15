'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { API_BASE_URL } from '@/lib/env'
import { Link } from '@/lib/router'

/**
 * Image-only banner.
 * Desktop art: 2400×818. The frame uses that ratio so the whole picture shows.
 * Slides move on every 4 seconds. Mobile art: 1200×1200.
 * Keep the heading, logo, and Shop Now in the middle of the file.
 * Tablet crops the sides, so type at the edges will be cut.
 */

type SliderRow = Record<string, unknown>

type Slide = {
  id: string
  title: string
  imageUrl: string
  mobileUrl: string
  href: string
}

function textFrom(row: SliderRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value != null && String(value).trim() !== '') return String(value).trim()
  }
  return ''
}

function mediaUrl(raw: string) {
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`
}

function slideHref(raw: string) {
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return raw.startsWith('/') ? raw : `/${raw}`
}

function isPublished(row: SliderRow) {
  const status = row.status ?? row.is_active ?? row.active
  return status !== 0 && status !== false && status !== '0' && status !== 'inactive'
}

function toSlide(row: SliderRow): Slide | null {
  const imageUrl = mediaUrl(textFrom(row, ['image_url', 'image', 'banner', 'banner_image', 'desktop_image']))
  const mobileUrl = mediaUrl(textFrom(row, ['mobile_image_url', 'mobile_image', 'image_mobile', 'square_image']))
  const slide: Slide = {
    id: String(row.id ?? ''),
    title: textFrom(row, ['title', 'name', 'heading']),
    imageUrl,
    mobileUrl: mobileUrl || imageUrl,
    href: slideHref(textFrom(row, ['button_url', 'button_link', 'link', 'url', 'href'])),
  }
  if (!slide.imageUrl && !slide.mobileUrl) return null
  return slide
}

async function loadSlides(): Promise<Slide[]> {
  const res = await fetch(`${API_BASE_URL}/api/sliders`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json?.status) throw new Error('API returned status: false')

  const rows: SliderRow[] = Array.isArray(json.data)
    ? json.data
    : Array.isArray(json.sliders)
      ? json.sliders
      : []

  return rows.filter(isPublished).map(toSlide).filter((slide): slide is Slide => slide !== null)
}

const focusRing =
  'focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-3 focus-visible:outline-turmeric'

const frameWidth = 'mx-auto w-[min(1560px,calc(100%-1rem))]'

function BannerArt({ slide }: { slide: Slide }) {
  return (
    <picture className="block h-full w-full">
      <source media="(max-width: 767px)" srcSet={slide.mobileUrl} />
      <img
        className="block h-full w-full max-w-none object-contain object-center"
        src={slide.imageUrl || slide.mobileUrl}
        alt=""
        decoding="async"
      />
    </picture>
  )
}

function BannerLink({ slide, children }: { slide: Slide; children: ReactNode }) {
  if (!slide.href) return <>{children}</>
  const className = 'block h-full w-full'
  if (slide.href.startsWith('http')) {
    return <a className={className} href={slide.href}>{children}</a>
  }
  return <Link className={className} to={slide.href}>{children}</Link>
}

export default function SliderOne() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const startX = useRef(0)

  useEffect(() => {
    let cancelled = false
    loadSlides()
      .then((data) => {
        if (!cancelled) {
          setSlides(data)
          setIndex(0)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        console.error('[SliderOne] Failed to load sliders:', err)
        if (!cancelled) setError('We could not load the banner. Please refresh the page.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const count = slides.length

  useEffect(() => {
    slides.forEach((slide) => {
      const desktop = new Image()
      desktop.src = slide.imageUrl
      if (slide.mobileUrl && slide.mobileUrl !== slide.imageUrl) {
        const mobile = new Image()
        mobile.src = slide.mobileUrl
      }
    })
  }, [slides])

  useEffect(() => {
    if (count < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [count, paused])

  const go = (step: number) => {
    if (count < 2) return
    setIndex((current) => (current + step + count) % count)
  }

  const noteClass = `${frameWidth} flex min-h-[180px] flex-col items-center justify-center gap-4 rounded-[22px] px-5 py-8 text-center text-ink`
  const frameShape = `${frameWidth} relative aspect-[2400/818] overflow-hidden rounded-[22px] bg-milk touch-pan-y md:rounded-[28px]`

  return (
    <section
      className="nf-hero w-full bg-milk pt-4! pb-2! font-sans md:pt-6! md:pb-3!"
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {loading ? <div className={`${frameShape} bg-stone/20`} aria-hidden /> : null}

      {!loading && error ? (
        <div className={noteClass} role="alert">
          <p>{error}</p>
          <button
            type="button"
            className={`min-h-11 cursor-pointer rounded-button border-0 bg-forest px-[22px] font-sans text-base font-medium text-milk ${focusRing}`}
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && count === 0 ? (
        <div className={noteClass}>
          <p>Banner images will appear here once they are added.</p>
        </div>
      ) : null}

      {!loading && !error && count > 0 ? (
        <div
          className={`${frameShape} bg-husk/10`}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onPointerDown={(event) => { startX.current = event.clientX }}
          onPointerUp={(event) => {
            const delta = event.clientX - startX.current
            if (delta > 48) go(-1)
            if (delta < -48) go(1)
          }}
        >
          {slides.map((slide, slideIndex) => {
            const active = slideIndex === index
            const Label = slideIndex === 0 ? 'h1' : 'p'
            return (
              <div
                key={slide.id || slide.imageUrl || slideIndex}
                className={
                  active
                    ? 'pointer-events-auto visible absolute inset-0 z-[1] opacity-100 transition-[opacity,visibility] duration-[0.4s] ease-[ease] motion-reduce:transition-none'
                    : 'pointer-events-none invisible absolute inset-0 z-0 opacity-0 transition-[opacity,visibility] duration-[0.4s] ease-[ease] motion-reduce:transition-none'
                }
                aria-hidden={!active}
              >
                <Label className="sr-only">{slide.title || 'Featured'}</Label>
                <BannerLink slide={slide}>
                  <BannerArt slide={slide} />
                </BannerLink>
              </div>
            )
          })}

          {count > 1 ? (
            <>
              <button
                type="button"
                className={`absolute top-1/2 left-3 z-[2] grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-button border-0 bg-milk/92 p-0 text-forest ${focusRing}`}
                aria-label="Previous banner"
                onClick={() => go(-1)}
              >
                <svg className="size-[22px] fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 5 8 12l7 7" />
                </svg>
              </button>
              <button
                type="button"
                className={`absolute top-1/2 right-3 z-[2] grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-button border-0 bg-milk/92 p-0 text-forest ${focusRing}`}
                aria-label="Next banner"
                onClick={() => go(1)}
              >
                <svg className="size-[22px] fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              </button>
              <div className="absolute inset-x-0 bottom-2.5 z-[2] flex justify-center gap-2" role="tablist" aria-label="Banner slides">
                {slides.map((slide, slideIndex) => (
                  <button
                    key={slide.id || slide.imageUrl || slideIndex}
                    type="button"
                    className={
                      slideIndex === index
                        ? `h-2.5 w-7 cursor-pointer rounded-full border-2 border-forest bg-forest p-0 ${focusRing}`
                        : `size-2.5 cursor-pointer rounded-full border-2 border-forest bg-milk p-0 ${focusRing}`
                    }
                    aria-label={`Go to slide ${slideIndex + 1}`}
                    aria-current={slideIndex === index ? 'true' : undefined}
                    onClick={() => setIndex(slideIndex)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
