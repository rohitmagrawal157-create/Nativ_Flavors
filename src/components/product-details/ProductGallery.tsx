'use client'

/**
 * ProductGallery — Professional e-commerce gallery
 *
 * ✦ NO arrows on the main image
 * ✦ SCROLL on the image → slides to next/prev (wheel + trackpad)
 * ✦ SWIPE on mobile → slides to next/prev
 * ✦ Smooth CSS sliding transition (like a real carousel)
 * ✦ External zoom panel beside image on hover (desktop)
 * ✦ Click → full-screen lightbox with pinch/wheel zoom + drag-to-pan
 * ✦ Thumbnail strip with active highlight + auto-scroll
 * ✦ Scroll indicator dots on left edge (subtle, professional)
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import type { MediaItem } from '../../types/product';

interface ProductGalleryProps {
  media: MediaItem[];
  productName: string;
  discountPct?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ZOOM_FACTOR  = 3;
const LENS_SIZE    = 140;
const PANEL_SIZE   = 420;
const MAX_LB_ZOOM  = 5;
const MIN_LB_ZOOM  = 1;
const ZOOM_STEP_IN = 1.12;
const ZOOM_STEP_OUT= 0.88;
const SCROLL_COOLDOWN_MS = 600; // prevent rapid-fire scrolling

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

// ── External zoom panel ───────────────────────────────────────────────────────
interface ZoomPanelProps {
  src: string;
  lensX: number;
  lensY: number;
  visible: boolean;
  containerRect: DOMRect | null;
}

const ZoomPanel: React.FC<ZoomPanelProps> = ({ src, lensX, lensY, visible, containerRect }) => {
  if (!visible || !containerRect) return null;
  const bgX = clamp(lensX, 0, 100);
  const bgY = clamp(lensY, 0, 100);
  return (
    <div
      style={{
        position:           'fixed',
        top:                containerRect.top,
        left:               containerRect.right + 14,
        width:              PANEL_SIZE,
        height:             PANEL_SIZE,
        borderRadius:       14,
        overflow:           'hidden',
        border:             '1.5px solid #e2e2e2',
        boxShadow:          '0 12px 40px rgba(0,0,0,0.16)',
        zIndex:             999,
        pointerEvents:      'none',
        backgroundImage:    `url(${src})`,
        backgroundSize:     `${ZOOM_FACTOR * 100}% ${ZOOM_FACTOR * 100}%`,
        backgroundPosition: `${bgX}% ${bgY}%`,
        backgroundRepeat:   'no-repeat',
        backgroundColor:    '#f8f8f8',
        opacity:            visible ? 1 : 0,
        transition:         'opacity 0.12s ease',
      }}
    >
      {/* Corner label */}
      <div style={{
        position: 'absolute', bottom: 10, right: 10,
        background: 'rgba(0,0,0,0.45)', color: '#fff',
        fontSize: 10, fontWeight: 600, padding: '3px 8px',
        borderRadius: 20, letterSpacing: '0.06em',
        backdropFilter: 'blur(4px)',
      }}>
        {ZOOM_FACTOR}× zoom
      </div>
    </div>
  );
};

// ── Main gallery ──────────────────────────────────────────────────────────────
export const ProductGallery: React.FC<ProductGalleryProps> = ({
  media,
  productName,
  discountPct,
}) => {
  // ── State ───────────────────────────────────────────────────────────────────
  const [activeIdx,     setActiveIdx]     = useState(0);
  const [slideDir,      setSlideDir]      = useState<'left'|'right'|null>(null);
  const [animating,     setAnimating]     = useState(false);
  const [lightboxOpen,  setLightboxOpen]  = useState(false);
  const [lensVisible,   setLensVisible]   = useState(false);
  const [lensPos,       setLensPos]       = useState({ x: 50, y: 50 });
  const [lbZoom,        setLbZoom]        = useState(1);
  const [lbPan,         setLbPan]         = useState({ x: 0, y: 0 });
  const [dragging,      setDragging]      = useState(false);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const activeIdxRef     = useRef(activeIdx);
  const animatingRef     = useRef(false);
  const lastScrollTime   = useRef(0);
  const dragStartRef     = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const lbZoomRef        = useRef(lbZoom);
  const imgContRef       = useRef<HTMLDivElement>(null);
  const stripRef         = useRef<HTMLDivElement>(null);
  const touchStartRef    = useRef<{ x: number; y: number } | null>(null);
  const touchMovedRef    = useRef(false);
  const touchDirRef      = useRef<'h'|'v'|null>(null);
  const lbTouchRef       = useRef({ t1x:0,t1y:0,px:0,py:0,initDist:0,initZoom:1 });

  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);
  useEffect(() => { lbZoomRef.current    = lbZoom;    }, [lbZoom]);

  const activeItem = useMemo(() => media[activeIdx] ?? media[0], [media, activeIdx]);
  const isImage    = activeItem?.type === 'image';
  const isEmbed    = activeItem?.type === 'video' && !!activeItem?.embedUrl;

  // ── Slide navigation with animation ────────────────────────────────────────
  const goTo = useCallback((idx: number, dir?: 'left'|'right') => {
    if (animatingRef.current) return;
    const len  = media.length;
    const next = ((idx % len) + len) % len;
    if (next === activeIdxRef.current) return;

    // Determine slide direction
    const resolvedDir = dir ?? (next > activeIdxRef.current ? 'left' : 'right');

    animatingRef.current = true;
    setAnimating(true);
    setSlideDir(resolvedDir);

    // Short delay to let CSS class apply, then update index
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setActiveIdx(next);
        // Clear animation after transition completes
        setTimeout(() => {
          setAnimating(false);
          setSlideDir(null);
          animatingRef.current = false;
        }, 380);
      });
    });

    setLbZoom(1);
    setLbPan({ x: 0, y: 0 });
  }, [media.length]);

  const prev = useCallback(() => {
    goTo(activeIdxRef.current - 1, 'right');
  }, [goTo]);

  const next = useCallback(() => {
    goTo(activeIdxRef.current + 1, 'left');
  }, [goTo]);

  // ── Scroll-to-navigate (the main feature) ──────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Only intercept when NOT in lightbox; lightbox has its own wheel handler
    if (lightboxOpen) return;
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - lastScrollTime.current < SCROLL_COOLDOWN_MS) return;
    lastScrollTime.current = now;

    if (e.deltaY > 0 || e.deltaX > 0) {
      next();
    } else {
      prev();
    }
  }, [lightboxOpen, next, prev]);

  // ── Touch swipe (mobile) ───────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    touchMovedRef.current = false;
    touchDirRef.current   = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t || !touchStartRef.current) return;
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    if (!touchDirRef.current && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      touchDirRef.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }
    if (touchDirRef.current === 'h') {
      e.preventDefault();
      touchMovedRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t  = e.changedTouches[0];
    const dx = t ? t.clientX - start.x : 0;

    if (touchDirRef.current === 'h' && Math.abs(dx) > 35) {
      dx < 0 ? next() : prev();
    } else if (!touchMovedRef.current) {
      setLightboxOpen(true);
    }

    touchStartRef.current = null;
    touchMovedRef.current = false;
    touchDirRef.current   = null;
  }, [next, prev]);

  // ── Keyboard nav (lightbox) ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape')     { setLightboxOpen(false); return; }
      if (e.key === 'ArrowLeft')  { prev(); return; }
      if (e.key === 'ArrowRight') { next(); return; }
      if (e.key === '+' || e.key === '=')
        setLbZoom(z => clamp(z * ZOOM_STEP_IN,  MIN_LB_ZOOM, MAX_LB_ZOOM));
      if (e.key === '-')
        setLbZoom(z => clamp(z * ZOOM_STEP_OUT, MIN_LB_ZOOM, MAX_LB_ZOOM));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, prev, next]);

  // ── Thumbnail auto-scroll ──────────────────────────────────────────────────
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const thumb = strip.children[activeIdx] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIdx]);

  // ── Container rect (zoom panel placement) ─────────────────────────────────
  const measureContainer = useCallback(() => {
    if (imgContRef.current)
      setContainerRect(imgContRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    measureContainer();
    window.addEventListener('resize', measureContainer);
    window.addEventListener('scroll', measureContainer, true);
    return () => {
      window.removeEventListener('resize', measureContainer);
      window.removeEventListener('scroll', measureContainer, true);
    };
  }, [measureContainer]);

  // ── Hover lens ─────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imgContRef.current?.getBoundingClientRect();
    if (!rect) return;
    setLensPos({
      x: clamp(((e.clientX - rect.left)  / rect.width)  * 100, 0, 100),
      y: clamp(((e.clientY - rect.top)   / rect.height) * 100, 0, 100),
    });
  }, []);

  // ── Lightbox wheel zoom ────────────────────────────────────────────────────
  const handleLbWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const step = e.deltaY < 0 ? ZOOM_STEP_IN : ZOOM_STEP_OUT;
    setLbZoom(z => clamp(z * step, MIN_LB_ZOOM, MAX_LB_ZOOM));
  }, []);

  // ── Lightbox drag-to-pan ───────────────────────────────────────────────────
  const onLbMouseDown = useCallback((e: React.MouseEvent) => {
    if (lbZoomRef.current <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = { mx: e.clientX, my: e.clientY, px: lbPan.x, py: lbPan.y };
  }, [lbPan]);

  const onLbMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const { mx, my, px, py } = dragStartRef.current;
    setLbPan({ x: px + (e.clientX - mx), y: py + (e.clientY - my) });
  }, [dragging]);

  const onLbMouseUp = useCallback(() => setDragging(false), []);

  // ── Lightbox touch pinch/pan ───────────────────────────────────────────────
  const onLbTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lbTouchRef.current = { ...lbTouchRef.current, initDist: Math.hypot(dx, dy), initZoom: lbZoomRef.current };
    } else {
      lbTouchRef.current = { t1x: e.touches[0].clientX, t1y: e.touches[0].clientY, px: lbPan.x, py: lbPan.y, initDist: 0, initZoom: lbZoomRef.current };
    }
  }, [lbPan]);

  const onLbTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const { initDist, initZoom } = lbTouchRef.current;
      if (initDist > 0) setLbZoom(clamp((dist / initDist) * initZoom, MIN_LB_ZOOM, MAX_LB_ZOOM));
    } else if (lbZoomRef.current > 1) {
      const { t1x, t1y, px, py } = lbTouchRef.current;
      setLbPan({ x: px + (e.touches[0].clientX - t1x), y: py + (e.touches[0].clientY - t1y) });
    }
  }, []);

  useEffect(() => { if (lbZoom <= 1) setLbPan({ x: 0, y: 0 }); }, [lbZoom]);

  // ── CSS slide animation keyframes ─────────────────────────────────────────
  // We inject a <style> once — CSS class names are deterministic
  const slideClass = animating && slideDir
    ? `pg-slide-${slideDir}`
    : '';

  // ── Lens styles ───────────────────────────────────────────────────────────
  const lensStyle: React.CSSProperties = {
    position: 'absolute',
    width:    LENS_SIZE, height: LENS_SIZE,
    borderRadius: '50%',
    border:   '2px solid rgba(91,79,190,0.65)',
    boxShadow:'0 4px 20px rgba(0,0,0,0.22)',
    pointerEvents: 'none', zIndex: 30,
    top:  `calc(${lensPos.y}% - ${LENS_SIZE / 2}px)`,
    left: `calc(${lensPos.x}% - ${LENS_SIZE / 2}px)`,
    overflow: 'hidden', background: '#fff',
    outline: '1.5px solid rgba(255,255,255,0.55)',
  };

  const lensImgStyle: React.CSSProperties = {
    position: 'absolute',
    width:    `${ZOOM_FACTOR * 100}%`, height: `${ZOOM_FACTOR * 100}%`,
    maxWidth: 'none',
    top:  `${-(lensPos.y * ZOOM_FACTOR) + 50}%`,
    left: `${-(lensPos.x * ZOOM_FACTOR) + 50}%`,
    objectFit: 'cover',
  };

  const lbImgStyle: React.CSSProperties = {
    transform:  `scale(${lbZoom}) translate(${lbPan.x / lbZoom}px, ${lbPan.y / lbZoom}px)`,
    transition: dragging ? 'none' : 'transform 0.12s ease-out',
    willChange: 'transform',
    maxHeight:  '88vh', maxWidth: '88vw',
    objectFit:  'contain', display: 'block',
    userSelect: 'none', WebkitUserSelect: 'none',
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── CSS animation keyframes (injected once) ── */}
      <style>{`
        @keyframes pg-enter-from-left {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes pg-enter-from-right {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes pg-exit-to-left {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(-100%);opacity: 0; }
        }
        @keyframes pg-exit-to-right {
          from { transform: translateX(0);   opacity: 1; }
          to   { transform: translateX(100%);opacity: 0; }
        }
        .pg-slide-left  .pg-img-new { animation: pg-enter-from-right 0.36s cubic-bezier(0.4,0,0.2,1) forwards; }
        .pg-slide-right .pg-img-new { animation: pg-enter-from-left  0.36s cubic-bezier(0.4,0,0.2,1) forwards; }

        /* Scroll hint pulse */
        @keyframes pg-scroll-hint {
          0%,100% { opacity: 0.35; transform: translateY(0); }
          50%      { opacity: 0.75; transform: translateY(3px); }
        }

        /* Thumbnail strip hide scrollbar */
        .pg-thumb-strip::-webkit-scrollbar { display: none; }
        .pg-thumb-strip { scrollbar-width: none; }

        /* Image container — no text select, cursor */
        .pg-main-cont {
          -webkit-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      {/* ── LIGHTBOX ──────────────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          style={{
            position:'fixed', inset:0, zIndex:99999,
            background:'rgba(8,8,12,0.97)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
          onClick={() => { setLightboxOpen(false); setLbZoom(1); setLbPan({x:0,y:0}); }}
        >
          {/* Close */}
          <button
            onClick={e => { e.stopPropagation(); setLightboxOpen(false); }}
            style={{ position:'absolute', top:18, right:18, width:42, height:42, borderRadius:'50%',
              background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)',
              color:'#fff', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', zIndex:10, backdropFilter:'blur(4px)' }}
            aria-label="Close"
          >✕</button>

          {/* Counter */}
          <div style={{ position:'absolute', top:20, left:'50%', transform:'translateX(-50%)',
            color:'rgba(255,255,255,0.45)', fontSize:12, letterSpacing:'0.08em', zIndex:10 }}>
            {activeIdx + 1} / {media.length}
          </div>

          {/* Zoom controls */}
          <div style={{ position:'absolute', bottom:22, left:'50%', transform:'translateX(-50%)',
            display:'flex', alignItems:'center', gap:8, zIndex:10 }}
            onClick={e => e.stopPropagation()}
          >
            {[
              { label:'－', action: () => setLbZoom(z => clamp(z * ZOOM_STEP_OUT, MIN_LB_ZOOM, MAX_LB_ZOOM)) },
              { label:'＋', action: () => setLbZoom(z => clamp(z * ZOOM_STEP_IN,  MIN_LB_ZOOM, MAX_LB_ZOOM)) },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} style={{
                width:34, height:34, borderRadius:'50%',
                background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)',
                color:'#fff', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', backdropFilter:'blur(4px)',
              }}>{btn.label}</button>
            ))}
            <span style={{ color:'rgba(255,255,255,0.5)', fontSize:12, minWidth:42, textAlign:'center' }}>
              {Math.round(lbZoom * 100)}%
            </span>
            <button onClick={() => { setLbZoom(1); setLbPan({x:0,y:0}); }} style={{
              padding:'0 12px', height:34, borderRadius:17,
              background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)',
              color:'#fff', fontSize:11, cursor:'pointer', backdropFilter:'blur(4px)',
            }}>Reset</button>
          </div>

          {/* Prev / Next */}
          {media.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }}
                style={{ position:'absolute', top:'50%', left:16, transform:'translateY(-50%)',
                  width:48, height:48, borderRadius:'50%', zIndex:10,
                  background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.18)',
                  color:'#fff', fontSize:26, display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', backdropFilter:'blur(4px)' }}
                aria-label="Previous">‹</button>
              <button onClick={e => { e.stopPropagation(); next(); }}
                style={{ position:'absolute', top:'50%', right:16, transform:'translateY(-50%)',
                  width:48, height:48, borderRadius:'50%', zIndex:10,
                  background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.18)',
                  color:'#fff', fontSize:26, display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', backdropFilter:'blur(4px)' }}
                aria-label="Next">›</button>
            </>
          )}

          {/* Image / Video */}
          <div style={{ overflow:'hidden', maxWidth:'90vw', maxHeight:'90vh',
            cursor: lbZoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
            onClick={e => e.stopPropagation()}
            onWheel={handleLbWheel}
            onMouseDown={onLbMouseDown}
            onMouseMove={onLbMouseMove}
            onMouseUp={onLbMouseUp}
            onMouseLeave={onLbMouseUp}
            onTouchStart={onLbTouchStart}
            onTouchMove={onLbTouchMove}
            onTouchEnd={onLbMouseUp}
          >
            {isImage ? (
              <img src={activeItem.url} alt={productName} style={lbImgStyle} draggable={false} />
            ) : isEmbed ? (
              <div style={{ width:'min(88vw,1100px)', aspectRatio:'16/9' }}>
                <iframe src={activeItem.embedUrl} title={productName}
                  style={{ width:'100%', height:'100%' }} allowFullScreen />
              </div>
            ) : (
              <video src={activeItem.url} poster={activeItem.poster}
                controls autoPlay style={{ maxHeight:'88vh', maxWidth:'88vw' }} />
            )}
          </div>

          {/* Lightbox thumbnail strip */}
          {media.length > 1 && (
            <div style={{ position:'absolute', bottom:68, left:'50%', transform:'translateX(-50%)',
              display:'flex', gap:8, zIndex:10 }}
              onClick={e => e.stopPropagation()}
            >
              {media.map((item, idx) => (
                <button key={idx} onClick={() => goTo(idx)} aria-label={`Image ${idx + 1}`} style={{
                  width:52, height:52, borderRadius:8, overflow:'hidden', padding:0,
                  border: activeIdx === idx ? '2px solid #7C6FF7' : '2px solid rgba(255,255,255,0.14)',
                  opacity: activeIdx === idx ? 1 : 0.5,
                  cursor:'pointer', transition:'all 0.15s', background:'#111', flexShrink:0,
                }}>
                  <img src={item.thumbnail} alt={`Thumb ${idx+1}`}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MAIN GALLERY ──────────────────────────────────────────────────── */}
      <div style={{ width:'100%', userSelect:'none' }}>

        {/* ── Main image container ── */}
        <div
          ref={imgContRef}
          className={`pg-main-cont ${slideClass}`}
          style={{
            position:   'relative',
            borderRadius: 16,
            overflow:   'hidden',
            background: '#f3f3f5',
            border:     '1px solid #eaeaea',
            aspectRatio:'1 / 1',   /* square on desktop, cleaner */
            cursor:     isImage ? 'crosshair' : 'default',
          }}
          onMouseEnter={() => { if (isImage) { setLensVisible(true); measureContainer(); } }}
          onMouseLeave={() => setLensVisible(false)}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (touchMovedRef.current) { touchMovedRef.current = false; return; }
            setLightboxOpen(true);
          }}
        >
          {/* Discount badge */}
          {discountPct && (
            <div style={{
              position:'absolute', top:14, left:14, zIndex:20,
              background:'linear-gradient(135deg,#E8314A,#F97316)',
              color:'#fff', fontWeight:700, fontSize:12,
              padding:'4px 11px', borderRadius:7, letterSpacing:'0.04em',
              boxShadow:'0 2px 8px rgba(232,49,74,0.3)',
            }}>{discountPct}</div>
          )}

          {/* Counter */}
          <div style={{
            position:'absolute', top:14, right:14, zIndex:20,
            background:'rgba(0,0,0,0.48)', color:'#fff',
            fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20,
            backdropFilter:'blur(4px)', letterSpacing:'0.06em',
          }}>
            {activeIdx + 1} / {media.length}
          </div>

          {/* ── Image (with slide animation wrapper) ── */}
          {isImage ? (
            <img
              key={activeItem.url}
              src={activeItem.url}
              alt={activeItem.alt ?? `${productName} ${activeIdx + 1}`}
              className="pg-img-new"
              style={{
                width:'100%', height:'100%',
                objectFit:'cover', display:'block',
              }}
              draggable={false}
              loading="lazy"
            />
          ) : isEmbed ? (
            <div style={{ width:'100%', height:'100%', background:'#000' }}>
              <iframe src={activeItem.embedUrl} title={productName}
                style={{ width:'100%', height:'100%' }} allowFullScreen />
            </div>
          ) : (
            <video src={activeItem.url} poster={activeItem.poster}
              controls playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          )}

          {/* ── Magnifying lens ── */}
          {lensVisible && isImage && (
            <div style={lensStyle}>
              <img src={activeItem.url} alt="zoom" style={lensImgStyle} draggable={false} />
            </div>
          )}

          {/* ── Scroll hint (bottom centre) ── */}
          {isImage && media.length > 1 && (
            <div style={{
              position:'absolute', bottom:12, left:'50%',
              transform:'translateX(-50%)',
              background:'rgba(0,0,0,0.48)', color:'#fff',
              fontSize:11, fontWeight:500,
              padding:'5px 14px', borderRadius:20,
              pointerEvents:'none', whiteSpace:'nowrap',
              backdropFilter:'blur(3px)',
              opacity: lensVisible ? 0 : 0.82,
              transition:'opacity 0.25s',
              letterSpacing:'0.04em',
              display:'flex', alignItems:'center', gap:6,
            }}>
              {/* Scroll icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="7"/>
                <line x1="12" y1="6" x2="12" y2="10"/>
              </svg>
              Scroll to browse · Click to zoom
            </div>
          )}

          {/* ── Dot progress bar (right edge) ── */}
          {media.length > 1 && (
            <div style={{
              position:'absolute', right:10, top:'50%',
              transform:'translateY(-50%)',
              display:'flex', flexDirection:'column', gap:6,
              zIndex:15, pointerEvents:'none',
            }}>
              {media.map((_, idx) => (
                <div key={idx} style={{
                  width:  activeIdx === idx ? 4 : 3,
                  height: activeIdx === idx ? 22 : 8,
                  borderRadius: 10,
                  background: activeIdx === idx
                    ? 'linear-gradient(180deg,#2F4A3A,#E8314A)'
                    : 'rgba(255,255,255,0.55)',
                  transition:'all 0.3s ease',
                  boxShadow: activeIdx === idx ? '0 0 6px rgba(91,79,190,0.6)' : 'none',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* External zoom panel */}
        {lensVisible && isImage && (
          <ZoomPanel
            src={activeItem.url}
            lensX={lensPos.x}
            lensY={lensPos.y}
            visible={lensVisible}
            containerRect={containerRect}
          />
        )}

        {/* ── Thumbnail strip ── */}
        {media.length > 1 && (
          <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:8 }}>

            {/* Prev thumb btn */}
            <button
              onClick={prev}
              aria-label="Previous"
              style={{
                flexShrink:0, width:32, height:32, borderRadius:'50%',
                background:'#fff', border:'1.5px solid #e0e0e0',
                boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
                fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', color:'#444',
                transition:'background 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2F4A3A'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#444'; }}
            >‹</button>

            {/* Scrollable strip */}
            <div
              ref={stripRef}
              className="pg-thumb-strip"
              style={{
                flex:1, display:'flex', gap:8,
                overflowX:'auto', WebkitOverflowScrolling:'touch' as any,
                paddingBottom:2,
              }}
            >
              {media.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx, idx > activeIdx ? 'left' : 'right')}
                  aria-label={`Image ${idx + 1}`}
                  aria-current={activeIdx === idx ? 'true' : 'false'}
                  style={{
                    flexShrink:0, width:76, height:76, borderRadius:10,
                    overflow:'hidden', padding:0, cursor:'pointer',
                    background:'#f4f4f4', position:'relative',
                    border: activeIdx === idx
                      ? '2.5px solid #2F4A3A'
                      : '2px solid #e8e8e8',
                    boxShadow: activeIdx === idx
                      ? '0 0 0 3px rgba(91,79,190,0.18)'
                      : 'none',
                    transition:'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                    transform: activeIdx === idx ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <img
                    src={item.thumbnail}
                    alt={`Thumbnail ${idx + 1}`}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                    loading="lazy"
                  />
                  {item.type === 'video' && (
                    <div style={{
                      position:'absolute', inset:0,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background:'rgba(0,0,0,0.28)',
                    }}>
                      <div style={{ width:22, height:22, background:'#fff', borderRadius:'50%',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:9 }}>▶</div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Next thumb btn */}
            <button
              onClick={next}
              aria-label="Next"
              style={{
                flexShrink:0, width:32, height:32, borderRadius:'50%',
                background:'#fff', border:'1.5px solid #e0e0e0',
                boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
                fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', color:'#444',
                transition:'background 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2F4A3A'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#444'; }}
            >›</button>
          </div>
        )}
      </div>
    </>
  );
};