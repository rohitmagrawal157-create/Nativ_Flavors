'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'

const HOSTS = 'section, footer, .s-py-25-100'

const COPY = [
  '.nf-block-copy',
  '.tp-label-wrap',
  '.nf-jr-desktop-heading',
  '.nf-jr-mobile-text',
  '.nf-jr-below',
  '.nf-jr-copy',
  '.nf-cats-head',
  '.nf-cats-name',
  '.nf-cats-desc',
  '.nf-trust-proof-title',
  '.nf-trust-copy',
  '.nf-trust-proof',
  '.nf-learn-top',
  '.nf-learn-copy',
  '.nf-learn-bottom',
  '.fo-farm-news',
  '.fo-farm-contact',
  '.fo-farm-links',
  '.fo-farm-copy',
].join(', ')

const PHOTO = [
  '.nf-block-photo',
  '.tp-img-wrap',
  '.nf-jr-side',
  '.nf-jr-image',
  '.nf-cats-photo',
  '.nf-trust-photo',
  '.nf-learn-photo',
  '.fo-farm-logo',
].join(', ')

function tag(host: HTMLElement) {
  host.querySelectorAll<HTMLElement>(COPY).forEach((el) => {
    if (host.contains(el)) el.classList.add('nf-enter-copy')
  })
  host.querySelectorAll<HTMLElement>(PHOTO).forEach((el) => {
    if (host.contains(el)) el.classList.add('nf-enter-photo')
  })
}

export default function HomeMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const hosts = () =>
      [...root.querySelectorAll<HTMLElement>(HOSTS)].filter((el) => !el.classList.contains('nf-hero'))

    const arm = (host: HTMLElement) => {
      if (host.dataset.nfArmed === '1' || host.dataset.nfPlayed === '1') return
      host.dataset.nfArmed = '1'
      tag(host)
      host.classList.add('nf-arm')
    }

    const play = (host: HTMLElement) => {
      if (host.dataset.nfPlayed === '1') return
      host.dataset.nfPlayed = '1'
      tag(host)
      host.classList.add('nf-arm', 'nf-play')
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          play(entry.target as HTMLElement)
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.01, rootMargin: '0px 0px 12% 0px' },
    )

    const prepare = () => {
      hosts().forEach((host) => {
        if (host.dataset.nfPlayed === '1') return
        const top = host.getBoundingClientRect().top
        if (top < window.innerHeight * 0.92) play(host)
        else {
          arm(host)
          observer.observe(host)
        }
      })
    }

    prepare()

    const changes = new MutationObserver(() => {
      hosts().forEach((host) => {
        if (host.dataset.nfPlayed === '1' || host.dataset.nfArmed === '1') tag(host)
      })
      prepare()
    })
    changes.observe(root, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      changes.disconnect()
    }
  }, [])

  return <div ref={rootRef}>{children}</div>
}
