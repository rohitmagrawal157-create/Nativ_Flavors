// @ts-nocheck
'use client'

import { API_BASE_URL } from '@/lib/env'
import { namedCategoryTone } from '@/lib/brand'

// src/components/top-picks.tsx

import { useState, useEffect } from 'react';
import { Link } from '@/lib/router';

interface PickItem {
  href:   string;
  src:    string;
  alt:    string;
  label:  string;
  badge?: string;
}

interface ApiCategory {
  id: number;
  name: string;
  image_url: string | null;
}

const TOP_PICKS: PickItem[] = [
  { href: '/shop-v1?category=Ghee%20%26%20Dairy',   src: 'https://imgs.search.brave.com/pO3_geDNJr-PHRVvzlSlXdVEI8SCMrHvO8C_TPKAtpE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9rb3Rh/cnQuaW4vY2RuL3No/b3AvZmlsZXMvZWZm/ZWN0MDFfNS5qcGc_/dj0xNzIxMjU0NDA2/JndpZHRoPTUzMw',    alt: 'Ghee and Dairy',    label: 'Ghee & Dairy',  badge: 'New'  },
  { href: '/shop-v1?category=Atta%20%26%20Grains',  src: 'https://imgs.search.brave.com/xFTkEltVU-Fcai1S5B6E96-71Q6WDcSLGbEv3mJDxsc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly81Lmlt/aW1nLmNvbS9kYXRh/NS9TRUxMRVIvRGVm/YXVsdC8yMDIzLzEw/LzM1MTU4NDYwMC9R/US9HTS9WWC8xOTc4/OTQwMDkvcHJpbnRl/ZC1jYW52YXMtNTAw/eDUwMC5qcGc',   alt: 'Atta and Grains',   label: 'Atta & Grains',  badge: 'Hot'  },
  { href: '/shop-v1?category=Natural%20Sweeteners', src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3VJh61D0y_4jak9UExYd4_tEKzH12OXR9pQ&s',                                                                                                                                                                                                                                                                                                                                  alt: 'Natural Sweeteners',           label: 'Natural Sweeteners'                },
  { href: '/shop-v1?category=Snacks',       src: 'https://imgs.search.brave.com/WRQWwv92NnMS5xJ59lU6PMBKvVKPoPoAHRkS1FId_ZA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/OTE3LURaOGU3TEwu/anBn',                                                                                                                                                                                                                                              alt: 'Snacks',          label: 'Snacks',      badge: 'Sale' },
  { href: '/category/modern-wallpapers', src: 'https://imgs.search.brave.com/FaPylEVXEQAg2Jj09k4z7mjQwyEC4ANjHucK95wN9Xs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9saWZl/bmNvbG9ycy5pbi9j/ZG4vc2hvcC9maWxl/cy9LdXN1bS1JbmRp/YW4tRmxvcmFsLUpo/YXJva2hhLTExMTEu/d2VicD92PTE3NTM2/MjE3MDAmd2lkdGg9/MzIw',                                                                                                                                                              alt: 'Modern Wallpapers',          label: 'Wallpapers'                },
  { href: '/category/customize-blinds',  src: 'https://imgs.search.brave.com/UMY9_2-06fuMpicI-QsTkC8Ofik_dK-K95NZBmJVsF0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/YmxpbmRzdGVyLmNv/bS9jZG4tY2dpL2lt/YWdlL2Zvcm1hdD1h/dXRvLHdpZHRoPTM4/NDAvc2l0ZS91cGxv/YWRzL2NhdGVnb3Jp/ZXMvd29vZC1ibGlu/ZHMvSE9NRVBBR0Ut/Q0FURU9HUlktV09P/RC1ST0xMT1ZFUi5q/cGc',   alt: 'Customizable Wood Blinds',   label: 'Customize Blind'           },
  { href: '/category/neon-signs',        src: 'https://imgs.search.brave.com/HmDJxfWjB5hRZqdcv4eGpsgJOCgBDwZ33VWtzjD2DAU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMudW5zcGxhc2gu/Y29tL3Bob3RvLTE1/NjUyMDY1OTU2NDAt/NmNmZDkwZTBhZTA5/P2ZtPWpwZyZxPTYw/Jnc9MzAwMCZhdXRv/PWZvcm1hdCZmaXQ9/Y3JvcCZpeGxpYj1y/Yi00LjEuMCZpeGlk/PU0zd3hNakEzZkRC/OE1IeHpaV0Z5WTJo/OE1UaDhmRzVsYjI0/bE1qQnphV2R1ZkdW/dWZEQjhmREI4Zkh3/dw', alt: 'Custom Neon Signs',          label: 'Neon Signage',     badge: 'Hot'  },
  { href: '/category/backlit-led',       src: 'https://imgs.search.brave.com/hFfkLA9JoRsvLL0HcTsKldXpRoKuGwhQsggD2SzBHLo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/Y2FtZWxiYWNrZGlz/cGxheXMuY29tL3dw/LWNvbnRlbnQvdXBs/b2Fkcy8yMDIzLzA3/L1ZlY3Rvci1GcmFt/ZS1Fc3NlbnRpYWwt/MDEtTGVmdC1EYXJr/LWxpZ2h0aW5nLnBu/Zw',   alt: 'Backlit LED Art',            label: 'Back Lit',         badge: 'New'  },
];

// Badge gradient map — uses brand palette
const BADGE_GRADIENTS: Record<string, string> = {
  New:  'linear-gradient(90deg,#2F4A3A,#3D5C4A)',
  Hot:  'linear-gradient(90deg,#4E6B58,#6E736F)',
  Sale: 'linear-gradient(90deg,#1E3328,#5E7266)',
};

const STYLES = `
  .tp-card {
    display: flex; flex-direction: column;
    background: #fff;
    border-radius: 12px;
    border: 1.5px solid #F0F0F4;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    min-width: 0;
  }
  @media (min-width: 768px) {
    .tp-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 16px 40px rgba(91,79,190,0.13);
      border-color: #2F4A3A44;
    }
    .tp-card:hover .tp-img { transform: scale(1.07); }
  }
  @media (max-width: 767px) {
    .tp-card:active { transform: scale(0.97); border-color: #2F4A3A44; }
  }

  .tp-img-wrap {
    position: relative; width: 100%; aspect-ratio: 1/1;
    overflow: hidden; background: #f5f5f5; flex-shrink: 0;
  }
  .tp-img {
    width: 100%; height: 100%; object-fit: cover;
    display: block; transition: transform 0.45s ease;
  }
  .tp-img-fallback {
    width: 100%; height: 100%; display: flex; align-items: center;
    justify-content: center; background: #f0ede8;
    font-size: 10px; color: #999; text-align: center; padding: 4px; line-height: 1.3;
  }

  /* Number badge — brand gradient */
  .tp-num-badge {
    position: absolute; top: 6px; left: 6px;
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800; color: #fff;
    background: linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%);
    box-shadow: 0 2px 8px rgba(91,79,190,0.35);
    line-height: 1; z-index: 2; user-select: none;
  }
  @media (min-width: 768px) {
    .tp-num-badge { width: 28px; height: 28px; font-size: 12px; top: 8px; left: 8px; }
  }

  /* Status badge — gradient pill */
  .tp-status-badge {
    position: absolute; top: 6px; right: 6px;
    font-size: 9px; font-weight: 700; color: #fff;
    padding: 2px 7px; border-radius: 20px;
    letter-spacing: 0.06em; text-transform: uppercase;
    z-index: 2; line-height: 1.4;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  }

  .tp-label-wrap { padding: 6px 6px 8px; flex: 1; display: flex; align-items: flex-start; }
  .tp-label {
    font-size: 11px; font-weight: 600; color: #374151;
    line-height: 1.35;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; width: 100%; margin: 0;
    transition: color 0.2s;
  }
  @media (min-width: 768px) {
    .tp-label-wrap { padding: 10px 12px 12px; }
    .tp-label { font-size: 13px; }
  }

  .tp-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }
  @media (min-width: 768px) { .tp-grid { gap: 16px; } }
  @media (min-width: 1024px) { .tp-grid { gap: 20px; } }

  /* Heading — gradient text */
  .tp-heading {
    font-size: 20px; font-weight: 800; line-height: 1.2; margin: 0 0 4px;
    font-family: 'Playfair Display', Georgia, serif;
    background: linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    display: inline-block;
  }
  @media (min-width: 768px) { .tp-heading { font-size: 32px; } }
  @media (min-width: 1024px) { .tp-heading { font-size: 40px; } }

  /* View all — brand gradient border & hover fill */
  .tp-view-all {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 28px; border-radius: 50px;
    font-size: 13px; font-weight: 700;
    border: 2px solid transparent;
    background: linear-gradient(#fff,#fff) padding-box,
                linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%) border-box;
    color: #2F4A3A;
    text-decoration: none; letter-spacing: 0.04em;
    transition: all 0.25s; cursor: pointer; position: relative; overflow: hidden;
  }
  .tp-view-all:hover {
    background: linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%) padding-box,
                linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%) border-box;
    color: #fff;
  }
  .tp-view-all:active { transform: scale(0.97); }
  @media (min-width: 768px) { .tp-view-all { font-size: 14px; padding: 12px 36px; } }

  .tp-tap-hint { font-size: 11px; color: #9CA3AF; text-align: center; margin-top: 8px; display: block; }
  @media (min-width: 768px) { .tp-tap-hint { display: none; } }

  @media (prefers-reduced-motion: reduce) { .tp-card, .tp-img { transition: none; } }
`;

function ProductCard({ item, index }: { item: PickItem; index: number }) {
  const [imgError, setImgError] = useState(false);
  const accent = namedCategoryTone(item.label);

  return (
    <Link to={item.href} className="tp-card" aria-label={item.label}>
      <div className="tp-img-wrap">
        <span className="tp-num-badge" aria-hidden="true">{index + 1}</span>

        {item.badge && (
          <span className="tp-status-badge"
            style={{ background: BADGE_GRADIENTS[item.badge] || '#555' }}
            aria-label={item.badge}>
            {item.badge}
          </span>
        )}

        {imgError ? (
          <div className="tp-img-fallback"><span>{item.label}</span></div>
        ) : (
          <img src={item.src} alt={item.alt} className="tp-img"
            loading={index < 4 ? 'eager' : 'lazy'}
            onError={() => setImgError(true)} draggable={false} />
        )}
      </div>
      {accent && <span aria-hidden style={{ display: 'block', height: 3, background: accent.solid }} />}
      <div className="tp-label-wrap">
        <p className="tp-label" style={accent ? { color: accent.solid } : undefined}>{item.label}</p>
      </div>
    </Link>
  );
}

export default function TopPicks() {
  const [items, setItems] = useState<PickItem[]>(TOP_PICKS);

  useEffect(() => {
    const ID = 'top-picks-styles';
    if (document.getElementById(ID)) return;
    const tag = document.createElement('style');
    tag.id = ID; tag.textContent = STYLES;
    document.head.appendChild(tag);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const CATEGORIES_API_URL = `${API_BASE_URL}/api/categories`;


    const fetchFeaturedCategories = async () => {
      try {
        const res = await fetch(CATEGORIES_API_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

        const payload = await res.json();
        const rows: ApiCategory[] = Array.isArray(payload?.data) ? payload.data : [];
        if (!rows.length || !active) return;

        const badgeCycle = ['New', 'Hot', 'Sale'];
        const mapped = rows
          .map((cat, index) => {
            const name = String(cat?.name ?? '').trim();
            if (!name || !cat?.image_url) return null;
            return {
              href: `/category/${name.toLowerCase().replace(/[\s&/]+/g, '-')}`,
              src: cat.image_url,
              alt: name,
              label: name,
              badge: badgeCycle[index % badgeCycle.length],
            } as PickItem;
          })
          .filter(Boolean) as PickItem[];

        if (mapped.length > 0) setItems(mapped);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          // eslint-disable-next-line no-console
          console.warn('Featured categories API failed. Using fallback cards.', err?.message ?? err);
        }
      }
    };

    fetchFeaturedCategories();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const row1 = items.slice(0, 4);
  const row2 = items.slice(4, 8);

  return (
    <section style={{ width: '100%', background: '#F6F3EE', padding: '80px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(8px,3vw,24px)' }}>

        {/* Header */}
        <div className="nf-block-copy" style={{ marginBottom: 'clamp(12px,2vw,28px)', textAlign: 'center' }}>
          <h2 className="tp-heading">Shop the range</h2>
          <p style={{ fontSize: 'clamp(12px,1.5vw,16px)', color: '#4A4F4B', margin: '6px 0 0' }}>
            Ghee, grains, sweeteners and the rest of the kitchen.
          </p>
          {/* Gradient accent line */}
          <div style={{
            width: 48, height: 3, borderRadius: 2, margin: '12px auto 0',
            background: 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
          }} />
        </div>

        <div className="tp-grid">
          {row1.map((item, i) => <ProductCard key={item.href} item={item} index={i} />)}
          {row2.map((item, i) => <ProductCard key={item.href} item={item} index={i + 4} />)}
        </div>

        <span className="tp-tap-hint">Tap any product to explore</span>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'clamp(16px,3vw,36px)' }}>
          <Link to="/shop-v1" className="tp-view-all">
            Shop All Products
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}