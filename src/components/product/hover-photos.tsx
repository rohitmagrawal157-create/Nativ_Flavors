'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const photosOf = (images: string[]) => {
  const list: string[] = []
  for (const raw of images) {
    const src = String(raw ?? '').trim()
    if (src && !list.includes(src)) list.push(src)
  }
  return list
}

export default function ProductHoverPhotos({
  images,
  alt = '',
}: {
  images: string[]
  alt?: string
}) {
  const photos = useMemo(() => photosOf(images), [images])
  const [index, setIndex] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const safeIndex = Math.min(index, Math.max(photos.length - 1, 0))

  useEffect(() => {
    setIndex(0)
  }, [photos])

  useEffect(() => {
    const zone = ref.current?.parentElement?.parentElement
    if (!zone || photos.length < 2) return

    const pick = (event: Event) => {
      const mouse = event as globalThis.MouseEvent
      const rect = zone.getBoundingClientRect()
      if (rect.width <= 0) return
      const ratio = (mouse.clientX - rect.left) / rect.width
      if (ratio < 0.5) {
        setIndex(0)
        return
      }
      const step = (ratio - 0.5) / 0.5
      const next = 1 + Math.min(photos.length - 2, Math.floor(step * Math.max(photos.length - 1, 1)))
      setIndex(Math.min(photos.length - 1, Math.max(1, next)))
    }

    const reset = () => setIndex(0)
    zone.addEventListener('mousemove', pick)
    zone.addEventListener('mouseleave', reset)
    return () => {
      zone.removeEventListener('mousemove', pick)
      zone.removeEventListener('mouseleave', reset)
    }
  }, [photos])

  if (!photos.length) return null

  return (
    <span ref={ref} className="nf-hover-photos">
      {photos.map((src, photoIndex) => (
        <img
          key={`${src}-${photoIndex}`}
          src={src}
          alt={photoIndex === 0 ? alt : ''}
          className={photoIndex === safeIndex ? 'is-on' : ''}
          draggable={false}
        />
      ))}
      <style>{`
        .nf-hover-photos {
          position: absolute;
          inset: 0;
          display: block;
          z-index: 1;
        }
        .nf-hover-photos img {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0;
          transition: opacity 0.28s ease;
        }
        .nf-hover-photos img.is-on { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .nf-hover-photos img { transition: none; }
        }
      `}</style>
    </span>
  )
}
