'use client'

import { API_BASE_URL } from '@/lib/env'

// src/components/ProductCategorySlider.tsx
import { Link } from '@/lib/router';
import { useRef, useEffect, useState, useCallback } from 'react';

const API_URL    = `${API_BASE_URL}/api/category-products`;
const PLACEHOLDER = 'https://placehold.co/480x600/f3f1ff/5B4FBE?text=No+Image';

const BRAND = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
// const CTA   = 'linear-gradient(90deg,#2563EB,#06B6D4,#22C55E)';

const TAGS = [
  { label: 'NEW',  grad: 'linear-gradient(90deg,#2F4A3A,#EC4899)' },
  { label: 'HOT',  grad: 'linear-gradient(90deg,#4E6B58,#6E736F)' },
  { label: 'SALE', grad: 'linear-gradient(90deg,#2563EB,#06B6D4)' },
];

interface SlideItem {
  categoryId:    number;
  categoryName:  string;
  productName:   string;
  price:         string;
  originalPrice: string;
  image:         string;
  productId:     number;
  discountPct:   number | null;
}

function formatINR(val: string | number | null | undefined): string {
  const n = parseFloat(String(val ?? '0').replace(/[^0-9.]/g, ''));
  if (!n || isNaN(n)) return '₹0';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

async function fetchSlides(): Promise<SlideItem[]> {
  const res  = await fetch(API_URL, { headers: { Accept: 'application/json' } });
  const json = await res.json();
  const result: SlideItem[] = [];

  for (const cat of json.data ?? []) {
    const products = (cat.product ?? []).filter((p: any) => p.image);
    if (!products.length) continue;
    const first = products[0];
    const price  = parseFloat(String(first.price ?? '0'));
    const orig   = parseFloat(String(first.original_price ?? '0'));
    const disc   = orig > price && orig > 0 ? Math.round(((orig - price) / orig) * 100) : null;
    result.push({
      categoryId:   cat.category_id,
      categoryName: cat.category_name,
      productName:  first.name,
      price:        formatINR(first.price),
      originalPrice:formatINR(first.original_price),
      image:        first.image,
      productId:    first.product_id,
      discountPct:  disc,
    });
  }
  return result;
}

export default function ProductCategorySlider() {
  const [slides, setSlides]   = useState<SlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [perView, setPerView] = useState(5); // default for desktop
  const trackRef  = useRef<HTMLDivElement>(null);
  const autoRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    fetchSlides()
      .then(setSlides)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Responsive perView
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w >= 1280) setPerView(5);
      else if (w >= 768) setPerView(3);
      else setPerView(1);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const maxIndex = Math.max(0, slides.length - perView);

  const scrollTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, maxIndex));
    setCurrent(clamped);
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[0] as HTMLElement | null;
    if (!card) return;
    const gap = 24;
    const cardW = card.getBoundingClientRect().width + gap;
    track.style.transform = `translateX(-${clamped * cardW}px)`;
  }, [maxIndex]);

  // Auto-play
  useEffect(() => {
    if (!slides.length) return;
    const tick = () => {
      if (pausedRef.current) return;
      setCurrent(prev => {
        const next = prev >= maxIndex ? 0 : prev + 1;
        const track = trackRef.current;
        if (track) {
          const card = track.children[0] as HTMLElement | null;
          if (card) {
            const cardW = card.getBoundingClientRect().width + 24;
            track.style.transform = `translateX(-${next * cardW}px)`;
          }
        }
        return next;
      });
    };
    autoRef.current = setInterval(tick, 4000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [slides.length, maxIndex]);

  return (
    <section className="pcs-section">
      <div className="pcs-container">

        {/* Header */}
        <div className="pcs-header">
          <h3 className="pcs-title">In the shop</h3>
          <div className="pcs-bar" />
          <p className="pcs-subtitle">
            A few foods from the current list.
          </p>
        </div>

        {/* Slider */}
        {loading ? (
          <div className="pcs-skeletons">
            {[1,2,3,4,5].map(i => <div key={i} className="pcs-skeleton" />)}
          </div>
        ) : (
          <>
            <div
              className="pcs-slider-wrap"
              onMouseEnter={() => { pausedRef.current = true; }}
              onMouseLeave={() => { pausedRef.current = false; }}
            >
              {/* Prev */}
              <button className="pcs-nav pcs-nav--prev" onClick={() => scrollTo(current - 1)} aria-label="Previous">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>

              {/* Viewport */}
              <div className="pcs-viewport">
                <div className="pcs-track" ref={trackRef}>
                  {slides.map((slide, idx) => {
                    const tag = TAGS[idx % TAGS.length];
                    return (
                      <Link
                        key={slide.categoryId}
                        to={`/product-category/${slide.categoryId}`}
                        className="pcs-card"
                      >
                        {/* Image */}
                        <div className="pcs-img-wrap">
                          <img
                            src={slide.image}
                            alt={slide.categoryName}
                            className="pcs-img"
                            loading="lazy"
                            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                          />
                          <div className="pcs-gradient-overlay" />
                        </div>

                        {/* Top badges */}
                        <span className="pcs-tag" style={{ background: tag.grad }}>{tag.label}</span>
                        {slide.discountPct && (
                          <span className="pcs-off">-{slide.discountPct}%</span>
                        )}

                        {/* Bottom info */}
                        <div className="pcs-info">
                          <span className="pcs-cat">{slide.categoryName}</span>
                          <h4 className="pcs-name">{slide.productName}</h4>
                          <div className="pcs-prices">
                            <span className="pcs-price">{slide.price}</span>
                            <span className="pcs-orig">{slide.originalPrice}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Next */}
              <button className="pcs-nav pcs-nav--next" onClick={() => scrollTo(current + 1)} aria-label="Next">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            {/* Dots */}
            {/* {slides.length > perView && (
              <div className="pcs-dots">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollTo(i)}
                    className={`pcs-dot${i === current ? ' active' : ''}`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )} */}
          </>
        )}
      </div>

      <style>{`
        /* Section */
        .pcs-section {
          padding: 72px 0 80px;
          overflow: hidden;
          background: #ffffff;
        }
        .pcs-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Header */
        .pcs-header { text-align: center; margin-bottom: 48px; }
        .pcs-title {
          display: inline-block;
          font-size: clamp(26px, 5vw, 36px);
          font-weight: 800;
          background: ${BRAND};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 12px;
          line-height: 1.2;
        }
        .pcs-bar {
          width: 56px; height: 3px; border-radius: 2px;
          background: ${BRAND};
          margin: 0 auto 16px;
        }
        .pcs-subtitle {
          font-size: 16px; color: #6b7280; max-width: 560px;
          margin: 0 auto; line-height: 1.6;
        }

        /* Skeletons */
        .pcs-skeletons {
          display: flex; gap: 24px; padding: 0 64px;
        }
        .pcs-skeleton {
          flex: 1; border-radius: 20px;
          aspect-ratio: 3/4;
          background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
          background-size: 200% 100%;
          animation: pcs-shimmer 1.5s infinite;
        }
        @keyframes pcs-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Slider wrap — relative for nav buttons */
        .pcs-slider-wrap { position: relative; }

        /* Viewport — clips overflow, gives horizontal space for nav */
        .pcs-viewport {
          overflow: hidden;
          margin: 0 64px;
        }
        @media (max-width: 1023px) {
          .pcs-viewport { margin: 0 56px; }
        }
        @media (max-width: 639px) {
          .pcs-viewport { margin: 0 48px; }
        }

        /* Track */
        .pcs-track {
          display: flex;
          gap: 24px;
          transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }

        /* Card — responsive perView via flex basis */
        .pcs-card {
          flex: 0 0 calc((100% - 96px) / 5);   /* 5 items on large */
          min-width: 0;
          position: relative;
          display: block;
          border-radius: 20px;
          overflow: hidden;
          text-decoration: none;
          background: #faf9ff;
          box-shadow: 0 4px 20px rgba(91,79,190,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        @media (max-width: 1279px) {
          .pcs-card { flex: 0 0 calc((100% - 48px) / 3); } /* 3 items */
        }
        @media (max-width: 767px) {
          .pcs-card { flex: 0 0 100%; }               /* 1 item */
        }
        .pcs-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(91,79,190,0.15);
        }

        /* Image wrapper — keeps card height consistent */
        .pcs-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: #ede9fe;
        }
        .pcs-img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          transition: transform 0.7s ease;
        }
        .pcs-card:hover .pcs-img { transform: scale(1.05); }

        /* Gradient overlay for better text visibility */
        .pcs-gradient-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 35%,
            rgba(0,0,0,0.6) 100%
          );
          pointer-events: none;
        }

        /* Tag badge */
        .pcs-tag {
          position: absolute;
          top: 14px; right: 14px;
          padding: 4px 12px;
          border-radius: 40px;
          color: #fff;
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.12em;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          z-index: 5;
          text-transform: uppercase;
        }

        /* Discount pill */
        .pcs-off {
          position: absolute;
          top: 14px; left: 14px;
          padding: 4px 10px;
          border-radius: 40px;
          background: #fff;
          color: #E8314A;
          font-size: 11px; font-weight: 800;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10);
          z-index: 5;
        }

        /* Bottom info panel */
        .pcs-info {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 16px 14px 18px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(91,79,190,0.1);
          z-index: 5;
        }
        .pcs-cat {
          display: block;
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase;
          background: ${BRAND};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pcs-name {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pcs-prices {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pcs-price {
          font-size: 16px;
          font-weight: 800;
          background: ${BRAND};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .pcs-orig {
          font-size: 12px;
          color: #9ca3af;
          text-decoration: line-through;
        }

        /* Nav buttons */
        .pcs-nav {
          position: absolute;
          top: 50%; transform: translateY(-50%);
          z-index: 20;
          width: 46px; height: 46px;
          border-radius: 50%; border: none;
          background: #fff; color: #374151;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(0,0,0,0.12);
          transition: all 0.25s;
          padding: 0;
        }
        .pcs-nav:hover {
          background: ${BRAND};
          color: #fff;
          transform: translateY(-50%) scale(1.05);
          box-shadow: 0 8px 28px rgba(91,79,190,0.3);
        }
        .pcs-nav--prev { left: 6px; }
        .pcs-nav--next { right: 6px; }
        @media (min-width: 768px) {
          .pcs-nav { width: 52px; height: 52px; }
        }

        /* Dots */
        .pcs-dots {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 32px;
        }
        .pcs-dot {
          width: 8px; height: 8px;
          border-radius: 20px;
          border: none;
          background: #cbd5e1;
          cursor: pointer;
          padding: 0;
          transition: width 0.3s, background 0.3s;
        }
        .pcs-dot.active {
          width: 28px;
          background: ${BRAND};
        }
        button[data-action="stop"] { display: none !important; }
      `}</style>
    </section>
  );
}