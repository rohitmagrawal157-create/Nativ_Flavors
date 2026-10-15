'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { API_BASE_URL } from '@/lib/env';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface JourneyStep {
  id: string | number;
  title: string;
  description: string;
  /** Chhota marker icon (SVG/PNG, ~80x80). Na ho to number dikhega */
  markerSrc?: string;
  /** Step ki apni photo (card ke andar box mein) */
  imageSrc: string;
  imageAlt?: string;
  /** Left side ki badi photo jo is step par dikhegi (step wali photo se alag) */
  sideImageSrc?: string;
  sideImageAlt?: string;
}

export interface ProcessJourneyProps {
  /** Desktop heading, \n se line break hoti hai */
  heading?: string;
  /** Mobile par heading ki jagah image dikhani ho to */
  mobileHeadingImage?: string;
  steps?: JourneyStep[];
  /** Optional: API se steps lene ke liye URL (response: { status, data: [...] }) */
  apiUrl?: string;
  id?: string;
}

// ─── Default content (apne asli process se badlein) ─────────────────────────
const DEFAULT_HEADING = 'The Traditional\nJourney Of Our\nGhee';

const DEFAULT_STEPS: JourneyStep[] = [
  {
    id: 1,
    title: 'Milked with care',
    description: 'Milk is collected fresh, by hand, from cows raised on our partner farms.',
    imageSrc: '',
    imageAlt: 'Fresh milk being collected at the farm',
  },
  {
    id: 2,
    title: 'Set into curd',
    description: 'The milk is gently heated and set into curd overnight in a clay pot, the slow natural way.',
    imageSrc: '',
    imageAlt: 'Curd setting in a clay pot',
  },
  {
    id: 3,
    title: 'Churned with a wooden bilona',
    description: 'The curd is churned by hand with a wooden churner until the butter separates.',
    imageSrc: '',
    imageAlt: 'Wooden bilona churning curd',
  },
  {
    id: 4,
    title: 'Slow cooked into ghee',
    description: 'The butter is simmered slowly on a low flame until it turns into golden, fragrant ghee.',
    imageSrc: '',
    imageAlt: 'Butter slowly cooking into ghee',
  },
  {
    id: 5,
    title: 'Filtered, tested and packed',
    description: 'Once cooled, the ghee is filtered, checked, and sealed in clean jars with a batch label you can trace.',
    imageSrc: '',
    imageAlt: 'Ghee being packed into glass jars',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function mediaUrl(raw: string) {
  if (!raw) return '';
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

// ─── API helper (optional) ──────────────────────────────────────────────────
interface ApiStep {
  id?: string | number;
  title?: string;
  description?: string;
  marker_url?: string;
  image_url?: string;
  alt_text?: string;
  side_image_url?: string;
  side_alt_text?: string;
  sort_order?: number;
}

async function fetchSteps(url: string, signal: AbortSignal): Promise<JourneyStep[]> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: { status?: boolean; data?: ApiStep[] } = await res.json();
  if (!json.status) throw new Error('API returned status: false');

  return (json.data ?? [])
    .map((s, i) => ({
      id: s.id ?? i,
      title: s.title ?? '',
      description: s.description ?? '',
      markerSrc: s.marker_url || undefined,
      imageSrc: mediaUrl(s.image_url ?? ''),
      imageAlt: s.alt_text ?? s.title ?? '',
      sideImageSrc: mediaUrl(s.side_image_url ?? ''),
      sideImageAlt: s.side_alt_text ?? s.title ?? '',
      _order: Number(s.sort_order ?? i),
    }))
    .sort((a, b) => a._order - b._order)
    .map(({ _order, ...rest }) => rest);
}

// ─── One step ───────────────────────────────────────────────────────────────
function Step({
  step,
  index,
  onActive,
}: {
  step: JourneyStep;
  index: number;
  onActive: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [markerBroken, setMarkerBroken] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);

  // Scroll par fade-in
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Jab ye step screen ke beech mein aaye, left image isi ki dikhao
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onActive(index);
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [index, onActive]);

  const showMarkerImg = step.markerSrc && !markerBroken;

  return (
    <div
      ref={ref}
      className={`nf-jr-step ${visible ? 'is-visible' : ''}`}
      style={{ '--nf-step-index': index } as CSSProperties}
    >
      <div className="nf-jr-marker-col">
        <span className={`nf-jr-marker ${showMarkerImg ? 'nf-jr-marker--image' : ''}`}>
          {showMarkerImg ? (
            <img
              src={step.markerSrc}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              onError={() => setMarkerBroken(true)}
            />
          ) : (
            <span aria-hidden="true">{index + 1}</span>
          )}
        </span>
      </div>

      <div className="nf-jr-card">
        <div className="nf-jr-image-box">
          <div className="nf-jr-image">
            {imageBroken || !step.imageSrc ? (
              <span className="nf-jr-image-fallback" role="img" aria-label={step.imageAlt || step.title}>
                <LeafIcon size={42} />
              </span>
            ) : (
              <img
                src={step.imageSrc}
                alt={step.imageAlt || step.title}
                width={240}
                height={240}
                loading="lazy"
                decoding="async"
                onError={() => setImageBroken(true)}
              />
            )}
          </div>
        </div>

        <div className="nf-jr-copy">
          <h3>
            <span className="nf-jr-sr">{`Step ${index + 1}: `}</span>
            {step.title}
          </h3>
          <p>{step.description}</p>
        </div>
      </div>
    </div>
  );
}

function LeafIcon({ size = 42 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 3-7 8-7 0 5-3 8-8 7z" />
      <path d="M12 14c0-3-2.5-5-6.5-5 0 4 2.5 6 6.5 5z" />
    </svg>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function ProcessJourney({
  heading = DEFAULT_HEADING,
  mobileHeadingImage,
  steps: stepsProp,
  apiUrl,
  id = 'process',
}: ProcessJourneyProps) {
  const [steps, setSteps] = useState<JourneyStep[]>(stepsProp ?? DEFAULT_STEPS);
  const [active, setActive] = useState(0);
  const [sideBroken, setSideBroken] = useState<Record<number, boolean>>({});
  const [headingVisible, setHeadingVisible] = useState(false);

  useEffect(() => {
    if (stepsProp) setSteps(stepsProp);
  }, [stepsProp]);

  // Products ki photos se: step ki photo aur left ki photo ALAG-ALAG lagao
  useEffect(() => {
    if (stepsProp || apiUrl) return;
    let cancelled = false;

    fetch(`${API_BASE_URL}/api/products`, { headers: { Accept: 'application/json' } })
      .then((res) => res.json())
      .then((json) => {
        const rows = Array.isArray(json?.data) ? json.data : [];
        const photos: { src: string; name: string }[] = rows
          .map((row: { name?: string; title?: string; images?: string[] }) => ({
            src: mediaUrl(row.images?.[0] || ''),
            name: row.name || row.title || '',
          }))
          .filter((photo: { src: string }) => photo.src)
          // ek hi photo dobara na aaye
          .filter(
            (photo: { src: string }, i: number, all: { src: string }[]) =>
              all.findIndex((p) => p.src === photo.src) === i
          );

        if (!photos.length || cancelled) return;

        const n = photos.length;
        // Left ki photo ka offset: step ki photo se hamesha alag (n >= 2 ho to)
        const shift = n > DEFAULT_STEPS.length ? DEFAULT_STEPS.length : 1;

        setSteps(
          DEFAULT_STEPS.map((step, index) => {
            const own = photos[index % n];
            const side = photos[(index + shift) % n];
            return {
              ...step,
              imageSrc: own.src,
              imageAlt: own.name || step.imageAlt,
              sideImageSrc: side.src,
              sideImageAlt: side.name || step.title,
            };
          })
        );
      })
      .catch((err: unknown) => {
        console.warn('[ProcessJourney] Step images could not be loaded:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [stepsProp, apiUrl]);

  // API se steps (fail ho to default steps hi dikhte rahenge)
  useEffect(() => {
    if (!apiUrl) return;
    const ctrl = new AbortController();
    fetchSteps(apiUrl, ctrl.signal)
      .then((data) => {
        if (data.length > 0) setSteps(data);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.warn('[ProcessJourney] Using default steps:', err?.message);
        }
      });
    return () => ctrl.abort();
  }, [apiUrl]);

  useEffect(() => {
    const t = window.setTimeout(() => setHeadingVisible(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  const headingLines = heading.split('\n');
  const plainHeading = headingLines.join(' ');

  const activeIndex = Math.min(active, Math.max(steps.length - 1, 0));
  const current = steps[activeIndex];
  const sideSrc = current?.imageSrc && !sideBroken[activeIndex] ? current.imageSrc : '';

  return (
    <section id={id} className="nf-jr" aria-labelledby="nf-jr-title">
      {/* ── Mobile heading ── */}
      <div className="nf-jr-mobile-heading">
        {mobileHeadingImage ? (
          <img src={mobileHeadingImage} alt={plainHeading} loading="lazy" />
        ) : (
          <h2 className="nf-jr-mobile-text">{plainHeading}</h2>
        )}
      </div>

      <div className="nf-jr-wrapper">
        {/* ── Left: heading + badi image (desktop, sticky) ── */}
        <div className="nf-jr-left">
          <h2
            id="nf-jr-title"
            className={`nf-jr-desktop-heading ${headingVisible ? 'is-visible' : ''}`}
          >
            {headingLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < headingLines.length - 1 && <br />}
              </span>
            ))}
          </h2>

          <div className="nf-jr-side">
            {sideSrc ? (
              <img
                key={sideSrc}
                className="nf-jr-side-img is-active"
                src={sideSrc}
                alt={current?.imageAlt || current?.title || ''}
                decoding="async"
                onError={() => setSideBroken((prev) => ({ ...prev, [activeIndex]: true }))}
              />
            ) : (
              <span className="nf-jr-side-empty" aria-hidden="true">
                <LeafIcon size={64} />
              </span>
            )}
          </div>

          {current ? (
            <div className="nf-jr-below">
              <p className="nf-jr-kicker">Step {activeIndex + 1} of {steps.length}</p>
              <p className="nf-jr-below-title">{current.title}</p>
              <p className="nf-jr-below-copy">{current.description}</p>
            </div>
          ) : null}
        </div>

        {/* ── Right: steps ── */}
        <div className="nf-jr-right">
          <div className="nf-jr-steps">
            {steps.map((s, i) => (
              <Step key={s.id ?? i} step={s} index={i} onActive={setActive} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .nf-jr, .nf-jr * { box-sizing: border-box; }

        .nf-jr {
          /* ── Colours: yahin se badlein ── */
          --nf-bg: #F6F3EE;
          --nf-heading: #2F4A3A;
          --nf-card-bg: #FFFFFF;
          --nf-card-border: #2F4A3A;
          --nf-title: #2F4A3A;
          --nf-text: #4A4F4B;
          --nf-line: #A9B7AD;
          --nf-number-bg: #2F4A3A;
          --nf-number-color: #F6F3EE;
          --nf-image-bg: #FFFFFF;
          --nf-image-border: #C7922E;
          /* contain = poori image dikhe (kate nahi). cover = box bhar de (kinaare kat sakte hain) */
          --nf-img-fit: contain;

          background: var(--nf-bg);
          overflow: visible;
          padding: 80px 20px;
          font-family: 'Poppins', system-ui, sans-serif;
          scroll-margin-top: 80px;
        }

        .nf-jr-sr {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }

        .nf-jr-mobile-heading { display: none; }

        /* Layout */
        .nf-jr-wrapper {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
          gap: 40px; align-items: start;
        }

        /* Left: heading, vertical photo, then the step text. Stays inside the screen. */
        .nf-jr-left {
          position: sticky; top: 128px; align-self: start;
          display: flex; flex-direction: column; gap: 14px;
          max-height: calc(100vh - 148px);
        }

        .nf-jr-desktop-heading {
          margin: 0; color: var(--nf-heading); font-weight: 600; line-height: 1.12;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.7rem, 2.4vw, 2.45rem);
          opacity: 1; transform: none; flex: 0 0 auto;
        }

        /* Vertical photo: full picture, fitted inside a portrait frame */
        .nf-jr-side {
          position: relative; align-self: flex-start;
          width: min(100%, 260px);
          height: min(340px, calc(100vh - 470px));
          min-height: 200px;
          border-radius: 22px; overflow: hidden;
          background: var(--nf-image-bg);
          border: 2px solid var(--nf-card-border);
          box-shadow: 0 10px 24px rgba(47,74,58,.1);
          flex: 0 1 auto;
        }
        .nf-jr-side-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: var(--nf-img-fit); object-position: center;
          opacity: 1;
        }
        .nf-jr-side-empty {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          color: var(--nf-heading); background: #E7EDE8;
        }

        .nf-jr-below { flex: 0 0 auto; min-height: 0; }
        .nf-jr-kicker {
          margin: 0; color: #6E736F; font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .nf-jr-below-title {
          margin: 6px 0 0; color: var(--nf-heading); font-weight: 600; line-height: 1.25;
          font-family: 'Playfair Display', Georgia, serif; font-size: 1.25rem;
        }
        .nf-jr-below-copy {
          margin: 6px 0 0; color: var(--nf-text); font-size: 0.95rem; line-height: 1.55;
        }

        .nf-jr-steps { display: flex; flex-direction: column; }

        /* Step */
        .nf-jr-step {
          position: relative; display: grid; grid-template-columns: 48px 1fr;
          gap: 14px; padding-bottom: 14px;
          opacity: 1; transform: none;
        }
        .nf-jr-step:last-child { padding-bottom: 0; }

        /* Marker + vertical line */
        .nf-jr-marker-col { position: relative; display: flex; justify-content: center; }
        .nf-jr-step:not(:last-child) .nf-jr-marker-col::after {
          content: ''; position: absolute; top: 48px; bottom: -14px; left: 50%;
          border-left: 2px dashed var(--nf-line); transform: translateX(-1px);
        }
        .nf-jr-marker {
          position: relative; z-index: 1;
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--nf-number-bg); color: var(--nf-number-color);
          font-weight: 600; font-size: 1.1rem;
        }
        .nf-jr-marker--image { background: var(--nf-card-bg); border: 2px solid var(--nf-card-border); }
        .nf-jr-marker--image img { width: 34px; height: 34px; object-fit: contain; }

        /* Card */
        .nf-jr-card {
          display: grid; grid-template-columns: 104px 1fr; gap: 16px; align-items: center;
          background: var(--nf-card-bg); border: 1.5px solid var(--nf-card-border);
          border-radius: 18px; padding: 12px 16px;
          box-shadow: 0 6px 16px rgba(47,74,58,.06);
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .nf-jr-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(47,74,58,.12); }

        /* Step image box: poori image saaf dikhti hai */
        .nf-jr-image-box { display: flex; justify-content: center; }
        .nf-jr-image {
          width: 104px; height: 104px; border-radius: 14px; overflow: hidden;
          background: var(--nf-image-bg); border: 2px solid var(--nf-image-border);
        }
        .nf-jr-image img {
          width: 100%; height: 100%; display: block;
          object-fit: var(--nf-img-fit); object-position: center;
        }
        .nf-jr-image-fallback {
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 100%; background: #E7EDE8; color: #2F4A3A;
        }

        .nf-jr-copy h3 {
          margin: 0; color: var(--nf-title); font-weight: 600; line-height: 1.3;
          font-family: 'Playfair Display', Georgia, serif; font-size: 1.15rem;
        }
        .nf-jr-copy p {
          margin: 6px 0 0; color: var(--nf-text); font-size: 0.92rem; line-height: 1.55;
        }

        /* Tablet */
        @media (max-width: 1023px) {
          .nf-jr { padding: 64px 20px; }
          .nf-jr-wrapper { gap: 28px; grid-template-columns: minmax(220px, 280px) minmax(0, 1fr); }
          .nf-jr-side { width: min(100%, 240px); height: min(340px, calc(100vh - 390px)); }
          .nf-jr-card { grid-template-columns: 88px 1fr; gap: 12px; }
          .nf-jr-image { width: 88px; height: 88px; }
          .nf-jr-copy h3 { font-size: 1.2rem; }
        }

        /* Mobile: left chhupa, heading upar, har card mein apni saaf image */
        @media (max-width: 767px) {
          .nf-jr { padding: 48px 14px; }
          .nf-jr-mobile-heading { display: block; text-align: center; margin: 0 auto 32px; }
          .nf-jr-mobile-heading img { max-width: 100%; height: auto; }
          .nf-jr-mobile-text {
            margin: 0; color: var(--nf-heading); font-weight: 600; line-height: 1.2;
            font-family: 'Playfair Display', Georgia, serif; font-size: 2rem;
          }

          .nf-jr-wrapper { grid-template-columns: 1fr; gap: 0; }
          .nf-jr-left { display: none; }

          .nf-jr-step { grid-template-columns: 44px 1fr; gap: 12px; padding-bottom: 24px; }
          .nf-jr-marker { width: 44px; height: 44px; font-size: .95rem; }
          .nf-jr-marker--image img { width: 26px; height: 26px; }
          .nf-jr-step:not(:last-child) .nf-jr-marker-col::after { top: 50px; bottom: -24px; }

          .nf-jr-card {
            grid-template-columns: 1fr; gap: 14px; padding: 18px 16px;
            text-align: center; border-radius: 20px;
          }
          .nf-jr-image { width: 100%; max-width: 240px; height: 180px; }
          .nf-jr-copy h3 { font-size: 1.15rem; }
          .nf-jr-copy p { font-size: .95rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .nf-jr-desktop-heading, .nf-jr-step { opacity: 1; transform: none; transition: none !important; }
          .nf-jr-card, .nf-jr-side-img { transition: none; }
        }
      `}</style>
    </section>
  );
}