// @ts-nocheck
'use client'

import { API_BASE_URL } from '@/lib/env'
import { CLAY_FOREST, namedCategoryTone } from '@/lib/brand'

// src/components/navbar/navbar-one.tsx
// ══════════════════════════════════════════════════════════════════════════════
//  NavbarOne (Natural Flavor)
//  • Category bar: sirf links (koi dropdown/mega menu nahi), text ke right mein icon
//  • Live search: debounce, keyboard navigation, recent searches, ARIA combobox
//  • Mobile: drawer + chips, dono mein seedhe category links
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { Link, useLocation, useNavigate } from '@/lib/router'
import {
  LuHeart, LuShoppingBasket, LuSearch, LuMapPin, LuTruck, LuSmartphone,
  LuX, LuMenu, LuUser, LuClipboardCheck, LuGift, LuLogOut, LuClock, LuTrendingUp,
  LuBean, LuWheat, LuCookie, LuCoffee, LuSun, LuHeartPulse, LuBoxes, LuLeaf,
} from 'react-icons/lu'
import { RiEBike2Line } from 'react-icons/ri'

import SiteLogo from '@/components/brand/site-logo'
import { getCartCountSync, rotateCartSession } from '../../api/cart.api'
import { apiClient } from '../../api/client'

// ── Settings (yahin se badlein) ───────────────────────────────────────────────
const SEARCH_PAGE = '/shop-v1'                       // search results ka page (apna route rakhein)
const productHref = (id: number) => `/product-details/${id}`
const categoryHref = (id: number, name: string) =>
  id ? `/category?id=${id}` : `/category?sub=${encodeURIComponent(name)}`

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  green: CLAY_FOREST || '#2F4A3A',
  greenDark: '#1E3328',
  greenHover: '#3C5D49',
  cream: '#F6F3EE',
  text: '#4A4F4B',
  muted: '#6E736F',
  border: '#E4E0D8',
  gold: '#C7922E',
}
const FONT = '"Poppins", system-ui, sans-serif'
const FONT_SERIF = '"Playfair Display", Georgia, serif'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Dept { id: number; name: string }
interface SearchSuggestion { id: number; name: string; price: string; image: string }

// ── Category icons (naam ke hisaab se; na mile to leaf) ───────────────────────
function StrokeIcon({ size = 18, className, children }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function GheeIcon(props) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 9.5h14" />
      <path d="M6.2 9.5c.7 6 2.4 9 5.8 9s5.1-3 5.8-9" />
      <path d="M9 9.5V6.8a3 3 0 0 1 6 0v2.7" />
      <path d="M10 4.5h4" />
    </StrokeIcon>
  )
}

function SweetIcon(props) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="5.2" r="3" />
      <path d="M12 8.2V20" />
      <path d="M8 12.4h8" />
      <path d="M8.7 15.6h6.6" />
      <path d="M9.3 18.6h5.4" />
    </StrokeIcon>
  )
}

function JarIcon(props) {
  return (
    <StrokeIcon {...props}>
      <path d="M7 8h10" />
      <path d="M9 8V5h6v3" />
      <path d="M8 8v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8" />
      <path d="M8 13h8" />
    </StrokeIcon>
  )
}

const ICON_RULES: Array<[RegExp, React.ElementType]> = [
  [/combo|offer|bundle/i, LuBoxes],
  [/ghee|dairy|butter/i, GheeIcon],
  [/sweet|jaggery|gud|sugar|honey/i, SweetIcon],
  [/pickle|achar|chutney/i, JarIcon],
  [/pulse|dal|lentil|bean/i, LuBean],
  [/atta|flour|wheat|grain|rice/i, LuWheat],
  [/tea|coffee/i, LuCoffee],
  [/breakfast|morning|snack|biscuit|namkeen|cookie/i, LuCookie],
  [/heat|summer|cool|sharbat/i, LuSun],
  [/immun|health|wellness|care/i, LuHeartPulse],
]
function getCategoryIcon(name: string): React.ElementType {
  for (const [re, Icon] of ICON_RULES) if (re.test(name)) return Icon
  return LuLeaf
}

// ── Local storage helpers ─────────────────────────────────────────────────────
function getWishlistCountSync(): number {
  try {
    const raw = window.localStorage.getItem('wishlist_items_v1')
    if (!raw) return 0
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr) ? arr.length : 0
  } catch { return 0 }
}

const RECENT_KEY = 'search_recent_v1'
const MAX_RECENT = 6
function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENT) : []
  } catch { return [] }
}
function saveRecentSearch(q: string) {
  if (!q.trim()) return
  try {
    const prev = getRecentSearches().filter((r) => r.toLowerCase() !== q.toLowerCase())
    localStorage.setItem(RECENT_KEY, JSON.stringify([q.trim(), ...prev].slice(0, MAX_RECENT)))
  } catch {}
}
function removeRecentSearch(q: string) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(getRecentSearches().filter((r) => r !== q)))
  } catch {}
}

// ── Search API item → suggestion ──────────────────────────────────────────────
function absUrl(raw: unknown) {
  let img = String(raw ?? '').replace(/\\/g, '').trim()
  if (img && !/^(https?:|data:|blob:)/i.test(img)) {
    const base = (API_BASE_URL || window.location.origin).replace(/\/$/, '')
    img = `${base}/${img.replace(/^\//, '')}`
  }
  return img
}

function mapSearchItem(p: any): SearchSuggestion | null {
  const id = Number(p.product_id ?? p.id ?? 0)
  if (!id) return null
  const rawPrice = p.price ?? p.product_price ?? p.original_price ?? 0
  const num = parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''))
  const price = Number.isFinite(num) && num > 0 ? `₹${num.toLocaleString('en-IN')}` : ''
  let rawImg: unknown = p.image ?? p.image_url ?? p.product_image ?? ''
  if (!rawImg && Array.isArray(p.images) && p.images.length > 0) rawImg = p.images[0]
  return { id, name: String(p.name ?? ''), price, image: absUrl(rawImg) }
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const STYLES = `
  .hcn, .hcn *, .hcn *::before, .hcn *::after { box-sizing: border-box; }
  .hcn a { text-decoration: none; }
  .hcn button { font-family: ${FONT}; }
  @media (max-width: 1023px) { .hcn .dsk { display: none !important; } }
  @media (min-width: 1024px) { .hcn .mob { display: none !important; } }

  .hcn a:focus-visible, .hcn button:focus-visible, .hcn input:focus-visible {
    outline: 3px solid ${C.gold}; outline-offset: 2px;
  }

  @keyframes hcnShim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .hcn-skel {
    background: linear-gradient(90deg, #E9E5DD 25%, #F6F3EE 50%, #E9E5DD 75%);
    background-size: 200% 100%; animation: hcnShim 1.4s infinite linear; border-radius: 6px;
  }

  /* ── Category bar: every name fits, no sideways scroll ─────────────── */
  .hcn-catbar-wrap { position: relative; overflow: hidden; background: ${C.cream}; border-bottom: 1px solid ${C.border}; }

  .hcn-catbar {
    display: flex; align-items: stretch; list-style: none; margin: 0 auto; padding: 0 8px;
    max-width: 1720px; min-height: 64px; overflow: hidden;
  }
  .hcn-catbar li { display: flex; flex: 1 1 0; min-width: 0; }

  .hcn-dept-link {
    position: relative; display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 8px 6px; min-height: 64px; text-align: center;
    font: 600 13px/1.25 ${FONT}; letter-spacing: 0; color: ${C.green};
    transition: background-color .2s ease, color .2s ease;
  }
  .hcn-dept-link > span { min-width: 0; overflow-wrap: break-word; }
  .hcn-dept-ico { flex-shrink: 0; color: ${C.green}; opacity: .9; transition: color .2s ease, opacity .2s ease; }
  .hcn-dept-link::after {
    content: ''; position: absolute; left: 10px; right: 10px; bottom: 0; height: 3px; border-radius: 3px 3px 0 0;
    background: ${C.gold}; transform: scaleX(0); transform-origin: center;
    transition: transform .25s ease;
  }
  .hcn-dept-link:hover, .hcn-dept-link.is-active {
    background: ${C.green}; color: ${C.cream};
  }
  .hcn-dept-link:hover::after, .hcn-dept-link.is-active::after { transform: scaleX(1); }
  .hcn-dept-link:hover .hcn-dept-ico, .hcn-dept-link.is-active .hcn-dept-ico { color: ${C.cream}; opacity: 1; }
  .hcn-dept-link:focus-visible { outline-offset: -4px; border-radius: 8px; }

  /* ── Header icon buttons ────────────────────────────────────────────── */
  .hcn-icon-btn {
    background: none; border: none; cursor: pointer; padding: 6px 10px; border-radius: 10px;
    display: flex; flex-direction: column; align-items: center; gap: 3px; transition: background .15s;
  }
  .hcn-icon-btn:hover { background: rgba(246, 243, 238, .12); }
  .hcn-lbl { font-size: 11px; color: ${C.cream}; font-family: ${FONT}; font-weight: 500; }

  /* ── Search ─────────────────────────────────────────────────────────── */
  .hcn-search-wrap {
    display: flex; align-items: center; height: 48px; border-radius: 12px; overflow: hidden;
    background: #FFFFFF; border: 2px solid ${C.cream}; transition: border-color .25s ease, box-shadow .25s ease;
  }
  .hcn-search-wrap.focused { border-color: ${C.gold}; box-shadow: 0 0 0 3px rgba(199, 146, 46, .28); }
  .hcn-search-input {
    flex: 1; min-width: 0; background: transparent; border: none; outline: none;
    padding: 0 10px; font: 400 15px ${FONT}; color: ${C.text};
  }
  .hcn-search-input:focus-visible { outline: none; }
  .hcn-search-input::placeholder { color: #6B706C; opacity: 1; }
  .hcn-search-btn {
    height: 100%; min-height: 44px; border: none; background: ${C.green}; color: ${C.cream};
    cursor: pointer; flex-shrink: 0; transition: background-color .2s ease;
  }
  .hcn-search-btn:hover { background: ${C.greenHover}; }
  .hcn-search-btn:focus-visible { outline-offset: -3px; }

  .hcn-suggest-drop {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 9100;
    background: #fff; border-radius: 14px; border: 1px solid ${C.border}; overflow: hidden;
    box-shadow: 0 16px 40px rgba(30, 51, 40, .18); animation: hcnDropIn .18s ease both;
  }
  @keyframes hcnDropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  .hcn-suggest-section {
    display: flex; align-items: center; gap: 6px; padding: 8px 14px 6px; font: 700 10px ${FONT};
    letter-spacing: .1em; text-transform: uppercase; color: ${C.muted}; background: #FAF8F4; border-bottom: 1px solid #F0ECE4;
  }
  .hcn-suggest-item, .hcn-suggest-recent {
    display: flex; align-items: center; gap: 10px; padding: 9px 14px; cursor: pointer;
    border-bottom: 1px solid #F5F2EC; transition: background .12s;
  }
  .hcn-suggest-item:last-child, .hcn-suggest-recent:last-child { border-bottom: none; }
  .hcn-suggest-item:hover, .hcn-suggest-item.is-active,
  .hcn-suggest-recent:hover, .hcn-suggest-recent.is-active { background: ${C.cream}; }
  .hcn-suggest-img {
    width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0;
    background: #EFEBE3; border: 1px solid #ECE7DE;
  }
  .hcn-suggest-name { flex: 1; min-width: 0; font: 500 14px ${FONT}; color: ${C.text}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hcn-suggest-name em { font-style: normal; font-weight: 700; color: ${C.green}; }
  .hcn-suggest-price { flex-shrink: 0; font: 700 13px ${FONT}; color: ${C.green}; }
  .hcn-suggest-recent-text { flex: 1; font: 400 14px ${FONT}; color: ${C.text}; }
  .hcn-suggest-recent-del {
    background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; color: #8A8F8B;
    display: flex; transition: color .12s, background .12s;
  }
  .hcn-suggest-recent-del:hover { color: #B42318; background: #FDECEA; }
  .hcn-suggest-footer {
    display: flex; align-items: center; justify-content: space-between; padding: 10px 14px;
    background: #FAF8F4; border-top: 1px solid #F0ECE4; font: 400 12px ${FONT}; color: ${C.muted};
  }
  .hcn-suggest-see-all { font: 700 12px ${FONT}; color: ${C.green}; cursor: pointer; background: none; border: none; padding: 4px; }
  .hcn-suggest-see-all:hover { text-decoration: underline; text-underline-offset: 3px; }
  .hcn-suggest-spinner {
    width: 14px; height: 14px; border: 2px solid #E4E0D8; border-top-color: ${C.green};
    border-radius: 50%; animation: hcnSpin .6s linear infinite; flex-shrink: 0;
  }
  @keyframes hcnSpin { to { transform: rotate(360deg); } }

  /* ── Mobile ─────────────────────────────────────────────────────────── */
  .hcn-mob-header { transform: translateY(0); transition: transform .3s cubic-bezier(.4, 0, .2, 1); will-change: transform; }
  .hcn-mob-header.is-hidden { transform: translateY(-100%); }
  .hcn-mob-icon {
    display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer;
    padding: 10px; min-width: 44px; min-height: 44px; border-radius: 10px; color: inherit; -webkit-tap-highlight-color: transparent;
  }
  .hcn-mob-icon:active { background: rgba(246, 243, 238, .14); }

  .hcn-chips { display: flex; flex-wrap: wrap; gap: 8px; overflow: hidden; padding: 2px 0; }
  .hcn-chip {
    display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 6px 12px;
    border-radius: 22px; border: 1.5px solid #D9D4CB; background: #fff; color: ${C.green};
    font: 600 13px/1.3 ${FONT}; text-align: center; transition: background-color .15s, color .15s, border-color .15s;
  }
  .hcn-chip:hover, .hcn-chip.is-active { background: ${C.green}; color: ${C.cream}; border-color: ${C.green}; }

  .hcn-drawer-link {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 16px; min-height: 54px;
    font: 600 15px ${FONT}; color: ${C.green}; border-bottom: 1px solid #F0ECE4; transition: background .14s;
  }
  .hcn-drawer-link:hover, .hcn-drawer-link.is-active { background: rgba(47, 74, 58, .07); }
  .hcn-drawer-link.is-active { box-shadow: inset 4px 0 0 var(--accent, ${C.green}); }

  /* ── Profile dropdown ───────────────────────────────────────────────── */
  .hcn-profile-drop {
    position: absolute; top: calc(100% + 10px); right: 0; min-width: 250px; background: #fff; border-radius: 14px;
    border: 1px solid ${C.border}; box-shadow: 0 20px 40px rgba(30, 51, 40, .18); z-index: 9010; overflow: hidden;
    transform-origin: top right; transition: opacity .18s ease, transform .18s ease;
  }
  .hcn-profile-drop.is-open { opacity: 1; transform: scale(1); pointer-events: auto; }
  .hcn-profile-drop.is-shut { opacity: 0; transform: scale(.95); pointer-events: none; visibility: hidden; }
  .hcn-pdrop-item {
    display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 0 16px; border: none; background: none;
    font: 500 14px ${FONT}; color: ${C.text}; text-align: left; cursor: pointer; transition: background .14s, color .14s;
  }
  .hcn-pdrop-item:hover { background: ${C.cream}; color: ${C.green}; }
  .hcn-pdrop-item.danger { color: #B42318; }
  .hcn-pdrop-item.danger:hover { background: #FDECEA; color: #B42318; }

  @keyframes hcnBadgePop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
  .hcn-badge-pop { animation: hcnBadgePop .3s ease; }

  @media (prefers-reduced-motion: reduce) {
    .hcn *, .hcn *::before, .hcn *::after { transition: none !important; animation: none !important; }
  }
`

// ── Small components ──────────────────────────────────────────────────────────
function CountBadge({ count }: { count: number }) {
  const [prev, setPrev] = useState(count)
  const [pop, setPop] = useState(false)
  useEffect(() => {
    if (count !== prev && count > 0) {
      setPop(true); setPrev(count)
      const t = setTimeout(() => setPop(false), 300)
      return () => clearTimeout(t)
    }
  }, [count, prev])
  if (count <= 0) return null
  return (
    <span
      className={pop ? 'hcn-badge-pop' : ''}
      aria-hidden="true"
      style={{
        position: 'absolute', top: -7, right: -9, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
        background: C.gold, color: C.greenDark, fontSize: 10, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function CatBarSkeleton() {
  return (
    <div className="dsk" style={{ display: 'flex', alignItems: 'center', height: 54, padding: '0 24px', gap: 18, background: C.cream, borderBottom: `1px solid ${C.border}` }}>
      {[130, 150, 80, 80, 200, 60, 170, 130, 150].map((w, i) => (
        <div key={i} className="hcn-skel" style={{ width: w, height: 16, flexShrink: 0 }} />
      ))}
    </div>
  )
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.trim().toLowerCase())
  if (idx === -1) return <>{text}</>
  const len = query.trim().length
  return (
    <>
      {text.slice(0, idx)}<em>{text.slice(idx, idx + len)}</em>{text.slice(idx + len)}
    </>
  )
}

// ── Search logic (desktop + mobile ek hi hook) ────────────────────────────────
function useSearchLogic(navigate) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentItems, setRecentItems] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const listId = useId()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (focused && !query.trim()) { setRecentItems(getRecentSearches()); setActiveIdx(-1) }
  }, [focused, query])

  useEffect(() => {
    if (!query.trim()) {
      abortRef.current?.abort()
      setSuggestions([]); setLoading(false); setActiveIdx(-1)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const res = await apiClient.get('/api/products/search', { params: { q: query.trim() }, signal: ctrl.signal } as any)
        const data = res.data
        const items: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
        setSuggestions(items.map(mapSearchItem).filter((s): s is SearchSuggestion => s !== null).slice(0, 8))
        setActiveIdx(-1)
        setLoading(false)
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        console.warn('[Search] API error:', err?.message)
        setSuggestions([]); setLoading(false)
      }
    }, 280)
    return () => clearTimeout(timer)
  }, [query])

  const close = useCallback(() => { setFocused(false); setSuggestions([]) }, [])

  const handleSelect = useCallback((s: SearchSuggestion) => {
    saveRecentSearch(s.name); setQuery(''); close()
    navigate(productHref(s.id))
  }, [navigate, close])

  const handleSubmit = useCallback(() => {
    const q = query.trim(); if (!q) return
    saveRecentSearch(q); close()
    navigate(`${SEARCH_PAGE}?q=${encodeURIComponent(q)}`)
  }, [query, navigate, close])

  const handleRecent = useCallback((q: string) => setQuery(q), [])
  const handleDeleteRecent = useCallback((q: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    removeRecentSearch(q); setRecentItems(getRecentSearches())
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = query.trim() ? suggestions.length : recentItems.length
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, total - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && query.trim() && suggestions[activeIdx]) handleSelect(suggestions[activeIdx])
      else if (activeIdx >= 0 && !query.trim() && recentItems[activeIdx]) handleRecent(recentItems[activeIdx])
      else handleSubmit()
    } else if (e.key === 'Escape') close()
  }, [activeIdx, suggestions, recentItems, query, handleSelect, handleRecent, handleSubmit, close])

  const showDrop = focused && (!!query.trim() || recentItems.length > 0)

  return {
    query, setQuery, focused, setFocused, suggestions, recentItems, loading, activeIdx,
    showDrop, listId, handleSelect, handleRecent, handleDeleteRecent, handleSubmit, handleKeyDown,
  }
}

// ── Search box (desktop + mobile) ─────────────────────────────────────────────
function SearchBox({ variant }: { variant: 'desk' | 'mob' }) {
  const navigate = useNavigate()
  const s = useSearchLogic(navigate)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { setFocused } = s
  const isMob = variant === 'mob'

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [setFocused])

  const showRecents = !s.query.trim() && s.recentItems.length > 0
  const showSuggestions = s.query.trim().length > 0
  const isEmpty = showSuggestions && !s.loading && s.suggestions.length === 0
  const optId = (i: number) => `${s.listId}-opt-${i}`

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); s.handleSubmit() }}
        className={`hcn-search-wrap${s.focused ? ' focused' : ''}`}
      >
        <LuSearch size={16} color="#6B706C" style={{ marginLeft: 14, flexShrink: 0 }} aria-hidden="true" />
        <input
          type="text"
          className="hcn-search-input"
          placeholder="Search ghee, atta, honey…"
          aria-label="Search products"
          role="combobox"
          aria-expanded={s.showDrop}
          aria-controls={s.listId}
          aria-autocomplete="list"
          aria-activedescendant={s.activeIdx >= 0 ? optId(s.activeIdx) : undefined}
          value={s.query}
          onChange={(e) => s.setQuery(e.target.value)}
          onFocus={() => s.setFocused(true)}
          onKeyDown={s.handleKeyDown}
          autoComplete="off"
          enterKeyHint="search"
        />
        {s.loading && <div className="hcn-suggest-spinner" style={{ marginRight: 8 }} aria-hidden="true" />}
        {s.query && !s.loading && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); s.setQuery('') }}
            aria-label="Clear search"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', color: '#6B706C', display: 'flex', alignItems: 'center', minHeight: 44 }}
          >
            <LuX size={15} aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          className="hcn-search-btn"
          aria-label="Search"
          style={isMob
            ? { width: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }
            : { padding: '0 24px', fontSize: 14, fontWeight: 600 }}
        >
          {isMob ? <LuSearch size={17} aria-hidden="true" /> : 'Search'}
        </button>
      </form>

      {s.showDrop && (
        <div className="hcn-suggest-drop" id={s.listId} role="listbox" aria-label="Search suggestions">
          {s.loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }} role="status">
              <div className="hcn-suggest-spinner" aria-hidden="true" />
              <span style={{ fontSize: 13, color: C.muted, fontFamily: FONT }}>Searching…</span>
            </div>
          )}

          {showRecents && !s.loading && (
            <>
              <div className="hcn-suggest-section"><LuClock size={11} aria-hidden="true" />Recent searches</div>
              {s.recentItems.map((r, i) => (
                <div
                  key={r}
                  id={optId(i)}
                  role="option"
                  aria-selected={s.activeIdx === i}
                  className={`hcn-suggest-recent${s.activeIdx === i ? ' is-active' : ''}`}
                  onMouseDown={() => s.handleRecent(r)}
                >
                  <LuClock size={14} color="#8A8F8B" style={{ flexShrink: 0 }} aria-hidden="true" />
                  <span className="hcn-suggest-recent-text">{r}</span>
                  <button
                    type="button"
                    className="hcn-suggest-recent-del"
                    onMouseDown={(e) => s.handleDeleteRecent(r, e)}
                    aria-label={`Remove ${r} from recent searches`}
                  >
                    <LuX size={13} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </>
          )}

          {showSuggestions && !s.loading && s.suggestions.length > 0 && (
            <>
              <div className="hcn-suggest-section"><LuTrendingUp size={11} aria-hidden="true" />Products</div>
              {s.suggestions.map((p, i) => (
                <div
                  key={p.id}
                  id={optId(i)}
                  role="option"
                  aria-selected={s.activeIdx === i}
                  className={`hcn-suggest-item${s.activeIdx === i ? ' is-active' : ''}`}
                  onMouseDown={() => s.handleSelect(p)}
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt=""
                      className="hcn-suggest-img"
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
                    />
                  ) : (
                    <div className="hcn-suggest-img" aria-hidden="true" />
                  )}
                  <span className="hcn-suggest-name"><HighlightMatch text={p.name} query={s.query} /></span>
                  {p.price && <span className="hcn-suggest-price">{p.price}</span>}
                </div>
              ))}
              <div className="hcn-suggest-footer">
                <span>{s.suggestions.length} result{s.suggestions.length !== 1 ? 's' : ''} found</span>
                <button type="button" className="hcn-suggest-see-all" onMouseDown={(e) => { e.preventDefault(); s.handleSubmit() }}>
                  See all results →
                </button>
              </div>
            </>
          )}

          {isEmpty && (
            <div style={{ padding: '18px 14px', textAlign: 'center', color: C.muted, fontSize: 14, fontFamily: FONT }}>
              No products found for &ldquo;<strong>{s.query}</strong>&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Category link (desktop bar) ───────────────────────────────────────────────
function CategoryLink({ dept, active }: { dept: Dept; active: boolean }) {
  const Icon = getCategoryIcon(dept.name)
  const accent = namedCategoryTone(dept.name)?.solid ?? C.green
  return (
    <Link
      to={categoryHref(dept.id, dept.name)}
      className={`hcn-dept-link${active ? ' is-active' : ''}`}
      style={{ ['--accent' as string]: accent }}
      aria-current={active ? 'page' : undefined}
    >
      <span>{dept.name}</span>
      <Icon className="hcn-dept-ico" size={18} strokeWidth={1.75} aria-hidden="true" />
    </Link>
  )
}

// ── Profile dropdown ──────────────────────────────────────────────────────────
function ProfileDropdown({ user, isOpen, onToggle, onLogout, containerRef }) {
  const ITEMS = [
    { icon: LuUser, label: 'My Profile', path: '/my-profile' },
    { icon: LuClipboardCheck, label: 'Order History', path: '/order-history' },
    { icon: LuHeart, label: 'My Wishlist', path: '/wishlist' },
    { icon: LuGift, label: 'My Cart', path: '/cart' },
  ]
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '?'
  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={onToggle}
        className="hcn-icon-btn"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Account menu"
      >
        <LuUser size={21} color={C.cream} strokeWidth={1.75} aria-hidden="true" />
        <span className="hcn-lbl">Account</span>
      </button>

      <div className={`hcn-profile-drop ${isOpen ? 'is-open' : 'is-shut'}`}>
        <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.border}`, background: C.cream, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: C.cream, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.green, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? 'User'}</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email ?? ''}</div>
          </div>
        </div>
        <div style={{ padding: '6px 0' }}>
          {ITEMS.map(({ icon: Icon, label, path }) => (
            <Link key={label} to={path} onClick={onToggle} className="hcn-pdrop-item">
              <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} aria-hidden="true" />{label}
            </Link>
          ))}
        </div>
        <div style={{ height: 1, background: C.border }} />
        <div style={{ padding: '6px 0 8px' }}>
          <button type="button" onClick={() => { onToggle(); onLogout() }} className="hcn-pdrop-item danger">
            <LuLogOut size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} aria-hidden="true" />Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, departments, isCurrent, isAuth, onLogout }) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1100, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .27s ease' }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        aria-hidden={!open}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 'min(86vw, 360px)', background: C.cream, zIndex: 1200,
          display: 'flex', flexDirection: 'column', transform: open ? 'translateX(0)' : 'translateX(-100%)',
          visibility: open ? 'visible' : 'hidden',
          transition: `transform .3s cubic-bezier(.4,0,.2,1), visibility 0s linear ${open ? '0s' : '.3s'}`,
          boxShadow: '5px 0 30px rgba(0,0,0,.18)',
        }}
      >
        <div style={{ padding: '10px 16px', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Link to="/" onClick={onClose} aria-label="Native Flavours home"><SiteLogo size={64} /></Link>
          <button type="button" onClick={onClose} aria-label="Close menu" className="hcn-mob-icon" style={{ color: C.cream }}>
            <LuX size={20} aria-hidden="true" />
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {isAuth ? (
            <button
              type="button"
              onClick={() => { onClose(); onLogout() }}
              style={{ width: '100%', minHeight: 46, borderRadius: 12, border: `1.5px solid ${C.green}`, background: 'transparent', color: C.green, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}
            >
              Sign Out
            </button>
          ) : (
            <Link to="/login" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, borderRadius: 12, background: C.green, color: C.cream, fontWeight: 600, fontSize: 14, letterSpacing: '0.04em', fontFamily: FONT }}>
              SIGN UP / SIGN IN
            </Link>
          )}
        </div>

        <nav aria-label="Product categories" style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {departments.map((dept) => {
            const Icon = getCategoryIcon(dept.name)
            const accent = namedCategoryTone(dept.name)?.solid ?? C.green
            const active = isCurrent(dept)
            return (
              <Link
                key={dept.id || dept.name}
                to={categoryHref(dept.id, dept.name)}
                onClick={onClose}
                className={`hcn-drawer-link${active ? ' is-active' : ''}`}
                style={{ ['--accent' as string]: accent }}
                aria-current={active ? 'page' : undefined}
              >
                <span>{dept.name}</span>
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            )
          })}
        </nav>

        <div style={{ borderTop: `1px solid ${C.border}`, background: '#FAF8F4', padding: '10px 16px', flexShrink: 0 }}>
          {[
            { icon: <RiEBike2Line size={15} />, label: 'Fast Delivery Available' },
            { icon: <LuMapPin size={14} />, label: 'Delivering To Your City' },
            { icon: <LuTruck size={14} />, label: 'Track Your Order' },
            { icon: <LuSmartphone size={14} />, label: 'Download Our App' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 13, color: C.text, fontFamily: FONT }}>
              <span style={{ color: C.green, display: 'flex' }} aria-hidden="true">{icon}</span>{label}
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function NavbarOne() {
  const location = useLocation()
  const navigate = useNavigate()
  const curr = location.pathname + location.search

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cartCount, setCartCount] = useState<number>(() => getCartCountSync())
  const [wishlistCount, setWishlistCount] = useState<number>(() => getWishlistCountSync())
  const [isAuth, setIsAuth] = useState(false)
  const [authUser, setAuthUser] = useState<{ name: string; email: string } | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobHidden, setMobHidden] = useState(false)
  const [catBarScroll, setCatBarScroll] = useState({ left: false, right: false })
  const [apiLoading, setApiLoading] = useState(true)
  const [departments, setDepartments] = useState<Dept[]>([])

  const catBarRef = useRef<HTMLUListElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastY = useRef(0)
  const delta = useRef(0)
  const scrolledRef = useRef(false)
  const mobHidRef = useRef(false)

  // Kya ye category abhi khuli hui hai
  const isCurrent = useCallback((d: Dept) => {
    if (!d.id) return false
    return curr === `/category?id=${d.id}` || curr.startsWith(`/category?id=${d.id}&`) || curr.includes(`parentId=${d.id}`)
  }, [curr])

  // ── Categories (sirf naam + id chahiye) ───────────────────────────────────
  useEffect(() => {
    let alive = true
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const res = await apiClient.get('/api/navbar-categories', { signal: ctrl.signal } as any)
        const rows: any[] = Array.isArray(res.data?.data) ? res.data.data : []
        if (!alive) return
        setDepartments(
          rows
            .filter((c) => c?.status !== 0 && c?.status !== false && c?.is_active !== 0 && c?.is_active !== false)
            .map((c) => ({ id: Number(c.id) || 0, name: String(c.name ?? '').trim() }))
            .filter((c) => c.name)
        )
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        console.warn('[Navbar] Categories could not be loaded:', err?.message)
        if (alive) setDepartments([])
      } finally {
        if (alive) setApiLoading(false)
      }
    })()
    return () => { alive = false; ctrl.abort() }
  }, [])

  // ── Category bar fade masks ───────────────────────────────────────────────
  const checkCatBar = useCallback(() => {
    const el = catBarRef.current
    if (!el) return
    setCatBarScroll({ left: el.scrollLeft > 8, right: el.scrollLeft < el.scrollWidth - el.clientWidth - 8 })
  }, [])
  useEffect(() => {
    const el = catBarRef.current
    if (!el) return
    checkCatBar()
    el.addEventListener('scroll', checkCatBar, { passive: true })
    window.addEventListener('resize', checkCatBar)
    return () => { el.removeEventListener('scroll', checkCatBar); window.removeEventListener('resize', checkCatBar) }
  }, [checkCatBar, departments])

  // ── Auth ──────────────────────────────────────────────────────────────────
  const syncAuth = useCallback(() => {
    const token = window.localStorage.getItem('access_token')
    const raw = window.localStorage.getItem('auth_user')
    setIsAuth(Boolean(token))
    if (token && raw) { try { setAuthUser(JSON.parse(raw)) } catch { setAuthUser(null) } }
    else setAuthUser(null)
  }, [])

  // ── Cart / wishlist counts ────────────────────────────────────────────────
  const refreshCounts = useCallback(() => {
    setCartCount(getCartCountSync())
    setWishlistCount(getWishlistCountSync())
    import('../../api/cart.api').then(({ getCart }) => getCart()).then((cart) => {
      const q = cart.lines.reduce((s, l) => s + (l.quantity ?? 0), 0)
      if (q > 0) setCartCount(q)
    }).catch(() => {})
    import('../../api/wishlist.api').then(({ getWishlist }) => getWishlist()).then((wl) => {
      if (wl.productIds.length > 0) setWishlistCount(wl.productIds.length)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    syncAuth(); refreshCounts()
    const onChange = () => refreshCounts()
    const onAuth = () => { syncAuth(); refreshCounts() }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'auth_user') syncAuth()
      if (e.key?.startsWith('cart') || e.key?.startsWith('wishlist')) refreshCounts()
    }
    window.addEventListener('cart:changed', onChange)
    window.addEventListener('wishlist:changed', onChange)
    window.addEventListener('auth:changed', onAuth)
    window.addEventListener('storage', onStorage as EventListener)
    return () => {
      window.removeEventListener('cart:changed', onChange)
      window.removeEventListener('wishlist:changed', onChange)
      window.removeEventListener('auth:changed', onAuth)
      window.removeEventListener('storage', onStorage as EventListener)
    }
  }, [refreshCounts, syncAuth])

  // ── Outside click + Escape ────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setProfileOpen(false); setDrawerOpen(false) }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])

  // Page badalne par drawer band
  useEffect(() => { setDrawerOpen(false); setProfileOpen(false) }, [curr])

  // ── Scroll (shadow + mobile header hide/show) ─────────────────────────────
  const onScroll = useCallback(() => {
    const y = window.scrollY
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const isMobile = window.innerWidth < 1024
      if ((y > 2) !== scrolledRef.current) { scrolledRef.current = y > 2; setScrolled(y > 2) }
      if (!isMobile || y <= 10) {
        if (mobHidRef.current) { mobHidRef.current = false; setMobHidden(false) }
        lastY.current = y; delta.current = 0
        return
      }
      const diff = y - lastY.current
      if (diff > 0) {
        if (delta.current < 0) delta.current = 0
        delta.current += diff
        if (delta.current > 60) { mobHidRef.current = true; setMobHidden(true) }
      } else if (diff < 0) {
        if (delta.current > 0) delta.current = 0
        delta.current += diff
        if (delta.current < -30) { mobHidRef.current = false; setMobHidden(false) }
      }
      lastY.current = y
    })
  }, [])
  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [onScroll])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token'); localStorage.removeItem('auth_user')
    setIsAuth(false); setAuthUser(null); setProfileOpen(false)
    window.dispatchEvent(new Event('auth:changed'))
    try { rotateCartSession() } catch (e) { console.warn('rotateCartSession failed', e) }
    navigate('/')
  }, [navigate])

  const wishlistLabel = `Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}`
  const cartLabel = `Cart${cartCount ? `, ${cartCount} items` : ''}`

  return (
    <>
      <style>{STYLES}</style>
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        departments={departments}
        isCurrent={isCurrent}
        isAuth={isAuth}
        onLogout={handleLogout}
      />

      <header
        className="hcn"
        style={{
          width: '100%', position: 'sticky', top: 0, zIndex: 1000, fontFamily: FONT,
          boxShadow: scrolled ? '0 2px 20px rgba(30,51,40,.18)' : '0 1px 0 rgba(30,51,40,.12)',
          transition: 'box-shadow .3s',
        }}
      >
        {/* ── Desktop: logo + search + actions ── */}
        <div className="dsk" style={{ background: C.green, borderBottom: `1px solid ${C.greenDark}` }}>
          <div style={{ maxWidth: 1720, margin: '0 auto', padding: '0 20px', height: 112, display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link to="/" aria-label="Native Flavours home" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <SiteLogo size={100} />
            </Link>

            <div style={{ flex: '1 1 480px', minWidth: 220, maxWidth: 720 }}>
              <SearchBox variant="desk" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flexShrink: 0 }}>
              {isAuth ? (
                <ProfileDropdown
                  user={authUser}
                  isOpen={profileOpen}
                  onToggle={() => setProfileOpen((p) => !p)}
                  onLogout={handleLogout}
                  containerRef={profileRef}
                />
              ) : (
                <Link
                  to="/login"
                  style={{ padding: '0 18px', minHeight: 44, borderRadius: 12, border: `1px solid ${C.cream}`, color: C.cream, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap', marginRight: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <LuUser size={15} strokeWidth={1.75} aria-hidden="true" />SIGN IN
                </Link>
              )}
              <Link to="/wishlist" className="hcn-icon-btn" aria-label={wishlistLabel}>
                <div style={{ position: 'relative' }}>
                  <LuHeart size={21} color={C.cream} strokeWidth={1.75} aria-hidden="true" />
                  <CountBadge count={wishlistCount} />
                </div>
                <span className="hcn-lbl">Wishlist</span>
              </Link>
              <Link to="/cart" className="hcn-icon-btn" aria-label={cartLabel}>
                <div style={{ position: 'relative' }}>
                  <LuShoppingBasket size={21} color={C.cream} strokeWidth={1.75} aria-hidden="true" />
                  <CountBadge count={cartCount} />
                </div>
                <span className="hcn-lbl">Cart</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Desktop: category bar (sirf links, koi dropdown nahi) ── */}
        {apiLoading ? (
          <CatBarSkeleton />
        ) : departments.length > 0 ? (
          <nav
            aria-label="Product categories"
            className={`dsk hcn-catbar-wrap${catBarScroll.left ? ' can-scroll-left' : ''}${catBarScroll.right ? ' can-scroll-right' : ''}`}
          >
            <ul className="hcn-catbar" ref={catBarRef}>
              {departments.map((dept) => (
                <li key={dept.id || dept.name}>
                  <CategoryLink dept={dept} active={isCurrent(dept)} />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {/* ── Mobile header ── */}
        <div className={`mob hcn-mob-header${mobHidden ? ' is-hidden' : ''}`} style={{ background: C.green, boxShadow: scrolled ? '0 3px 14px rgba(0,0,0,.12)' : 'none' }}>
          <div style={{ height: 76, display: 'flex', alignItems: 'center', padding: '0 6px', gap: 4 }}>
            <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu" aria-expanded={drawerOpen} className="hcn-mob-icon" style={{ color: C.cream }}>
              <LuMenu size={23} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <Link to="/" aria-label="Native Flavours home" style={{ display: 'flex', alignItems: 'center' }}>
              <SiteLogo size={60} />
            </Link>
            <div style={{ flex: 1 }} />
            <Link to="/wishlist" className="hcn-mob-icon" aria-label={wishlistLabel} style={{ color: C.cream }}>
              <div style={{ position: 'relative' }}><LuHeart size={22} strokeWidth={1.75} aria-hidden="true" /><CountBadge count={wishlistCount} /></div>
            </Link>
            <Link to="/cart" className="hcn-mob-icon" aria-label={cartLabel} style={{ color: C.cream }}>
              <div style={{ position: 'relative' }}><LuShoppingBasket size={22} strokeWidth={1.75} aria-hidden="true" /><CountBadge count={cartCount} /></div>
            </Link>
            {isAuth ? (
              <Link to="/my-profile" className="hcn-mob-icon" aria-label="My profile">
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.cream, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                  {authUser?.name?.trim()?.[0]?.toUpperCase() ?? '?'}
                </div>
              </Link>
            ) : (
              <Link to="/login" className="hcn-mob-icon" aria-label="Sign in" style={{ color: C.cream }}>
                <LuUser size={22} strokeWidth={1.75} aria-hidden="true" />
              </Link>
            )}
          </div>

          <div style={{ padding: '4px 12px 10px' }}>
            <SearchBox variant="mob" />
          </div>

          {departments.length > 0 && (
            <nav aria-label="Product categories" style={{ padding: '8px 12px 10px', background: C.cream, borderBottom: `1px solid ${C.border}` }}>
              <div className="hcn-chips">
                {departments.map((dept) => {
                  const Icon = getCategoryIcon(dept.name)
                  const active = isCurrent(dept)
                  return (
                    <Link
                      key={dept.id || dept.name}
                      to={categoryHref(dept.id, dept.name)}
                      className={`hcn-chip${active ? ' is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {dept.name}
                      <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
                    </Link>
                  )
                })}
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  )
}