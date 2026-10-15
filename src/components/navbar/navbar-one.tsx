// @ts-nocheck
'use client'

import { API_BASE_URL } from '@/lib/env'
import { BRAND_GRADIENT, CLAY_FOREST, categoryTone } from '@/lib/brand'

// src/components/navbar/navbar-one.tsx
// ══════════════════════════════════════════════════════════════════════════════
//  NavbarOne — Expert Live Search + All previous fixes preserved
//
//  SEARCH UPGRADES (this revision):
//
//  SEARCH-1  Live suggestions dropdown — calls GET /api/products/search?q=xxx
//            with 280ms debounce. Shows product image + name + price inline.
//
//  SEARCH-2  Keyboard navigation — ArrowUp / ArrowDown / Enter / Escape fully
//            supported within the suggestion list.
//
//  SEARCH-3  Recent searches — last 6 queries stored in localStorage and shown
//            when the input is focused but empty.
//
//  SEARCH-4  Correct field mapping — API returns product_id / original_price /
//            image (not id / price / product_image). mapSearchItem() handles this.
//
//  SEARCH-5  Clicking a suggestion navigates to /product-details/:id directly.
//
//  SEARCH-6  Mobile search bar shares the same suggestion engine.
//
//  All previous badge / category / navigation fixes are preserved unchanged.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link, useLocation, useNavigate } from '@/lib/router'
import {
  LuHeart, LuShoppingBasket, LuSearch, LuMapPin,
  LuTruck, LuSmartphone, LuCircle, LuX,
  LuChevronDown, LuChevronRight, LuMenu, LuUser,
  LuClipboardCheck, LuGift, LuLogOut, LuClock, LuTrendingUp,
} from 'react-icons/lu'
import { RiEBike2Line } from 'react-icons/ri'

import SiteLogo from '@/components/brand/site-logo'
import { getCartCountSync, rotateCartSession } from '../../api/cart.api'
import { apiClient } from '../../api/client'

// ── Sync wishlist count ────────────────────────────────────────────────────────
function getWishlistCountSync(): number {
  try {
    const raw = window.localStorage.getItem('wishlist_items_v1')
    if (!raw) return 0
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr) ? arr.length : 0
  } catch {
    return 0
  }
}

// ── Brand tokens ───────────────────────────────────────────────────────────────
const BRAND_GRAD  = BRAND_GRADIENT
const CTA_GRAD    = 'linear-gradient(135deg,#2F4A3A 0%,#4E6B58 100%)'
const BRAND_SOLID = CLAY_FOREST

function resolveDeptGrad(name: string) {
  return categoryTone(name)
}

const C = {
  brand: BRAND_SOLID, brandHover: '#4E6B58', brandBg: '#F6F3EE',
  dark: '#2F4A3A', text: '#4A4F4B', muted: '#6E736F', light: '#8A948C',
  border: '#E4E0D8', borderMd: '#D9D4CB', white: '#F6F3EE',
  newBadge: '#8B6A3E',
}
const FONT = '"Poppins", sans-serif'
const FONT_SERIF = '"Playfair Display", Georgia, serif'

// ── API types ──────────────────────────────────────────────────────────────────
interface ApiChild { id: number; name: string; image_url: string | null }
interface ApiCat   { id: number; name: string; image_url: string | null; children: ApiChild[] }
interface ApiResp  { status: boolean; data: ApiCat[] }

type MenuLink = string | { name: string; badge?: string; path?: string; id?: number; parentId?: number }
interface MenuGroup { heading: string; links: MenuLink[] }
interface DeptMenu  { id?: number; image: string; imageAlt: string; flatLinks?: MenuLink[]; groups: MenuGroup[] }

// ── Search suggestion type (matches actual API) ────────────────────────────────
interface SearchSuggestion {
  id:    number      // product_id from API
  name:  string
  price: string      // formatted ₹ price
  image: string      // full absolute URL
}

// ─── Recent searches helpers ──────────────────────────────────────────────────
const RECENT_KEY = 'search_recent_v1'
const MAX_RECENT = 6

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENT) : []
  } catch { return [] }
}

function saveRecentSearch(q: string): void {
  if (!q.trim()) return
  try {
    const prev = getRecentSearches().filter((r) => r.toLowerCase() !== q.toLowerCase())
    localStorage.setItem(RECENT_KEY, JSON.stringify([q.trim(), ...prev].slice(0, MAX_RECENT)))
  } catch {}
}

function removeRecentSearch(q: string): void {
  try {
    const prev = getRecentSearches().filter((r) => r !== q)
    localStorage.setItem(RECENT_KEY, JSON.stringify(prev))
  } catch {}
}

// ── Map raw search API item → SearchSuggestion ────────────────────────────────
// Actual API: { product_id, name, original_price, discount_percentage, image }
function mapSearchItem(p: any): SearchSuggestion | null {
  const id = Number(p.product_id ?? p.id ?? 0)
  if (!id) return null

  const rawPrice = p.price ?? p.product_price ?? p.original_price ?? 0
  const num      = parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''))
  const price    = Number.isFinite(num) && num > 0 ? `₹${num.toLocaleString('en-IN')}` : ''

  let rawImg: unknown = p.image ?? p.image_url ?? p.product_image ?? ''
  if (!rawImg && Array.isArray(p.images) && p.images.length > 0) rawImg = p.images[0]
  let img = String(rawImg ?? '').replace(/\\/g, '').trim()
  if (img && !/^https?:\/\//i.test(img)) {
    const base = API_BASE_URL ?? window.location.origin
    img = base.replace(/\/$/, '') + '/' + img.replace(/^\//, '')
  }

  return { id, name: String(p.name ?? ''), price, image: img }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const toSlug       = (s: string) => s.toLowerCase().replace(/[\s&\/]+/g, '-')
const getLinkName  = (l: MenuLink): string            => typeof l === 'string' ? l : l.name
const getLinkBadge = (l: MenuLink): string | undefined => typeof l === 'string' ? undefined : l.badge

function getLinkPath(l: MenuLink, deptId?: number): string {
  if (typeof l !== 'string' && l.path) return l.path
  const name    = getLinkName(l)
  const isAllLink = name.toLowerCase().startsWith('all ')
  if (isAllLink) {
    const pid = (typeof l !== 'string' ? l.parentId : undefined) ?? deptId
    if (pid && pid > 0) return `/category?id=${pid}`
  }
  if (typeof l !== 'string' && l.id && l.id > 0) {
    const pid        = l.parentId ?? deptId
    const parentPart = pid && pid > 0 ? `&parentId=${pid}` : ''
    return `/category?subId=${l.id}${parentPart}`
  }
  if (deptId) return `/category?id=${deptId}`
  return `/category?sub=${encodeURIComponent(name)}`
}

const gradText = (grad: string): React.CSSProperties => ({
  backgroundImage: grad, WebkitBackgroundClip: 'text',
  backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent',
})

function mergeApiCategories(apiData: ApiCat[]): Record<string, DeptMenu> {
  const merged: Record<string, DeptMenu> = {}
  for (const cat of apiData) {
    const flatLinks: MenuLink[] = cat.children.map((child) => ({
      name:     child.name,
      id:       child.id,
      parentId: cat.id,
    }))
    merged[cat.name] = {
      id:       cat.id,
      image:    cat.image_url ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=320&h=400&fit=crop',
      imageAlt: cat.name,
      flatLinks,
      groups: [],
    }
  }
  return merged
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .hcn*,.hcn *::before,.hcn *::after{box-sizing:border-box}
  .hcn a{text-decoration:none}
  .hcn button{font-family:${FONT}}
  .hcn input:focus{outline:none}
  @media(max-width:1023px){.hcn .dsk{display:none!important}}
  @media(min-width:1024px){.hcn .mob{display:none!important}}

  @keyframes hcnShim{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .hcn-skel{background:linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%);background-size:200% 100%;animation:hcnShim 1.4s infinite linear;border-radius:4px}

  .hcn-util-bar{background:${C.dark};max-height:36px;overflow:hidden;transition:max-height .3s ease,opacity .22s ease;opacity:1}
  .hcn-util-bar.is-hidden{max-height:0;opacity:0}
  .hcn-util-link{color:#aaa;transition:color .15s;display:flex;align-items:center;gap:5px;padding:0 10px;height:36px;font-family:${FONT};font-size:11.5px}
  .hcn-util-link:hover{color:#fff}

  .hcn-catbar-wrap{position:relative;overflow:hidden;background:${C.white};border-bottom:1px solid #e8e8e8}
  .hcn-catbar-wrap::before{content:'';position:absolute;left:0;top:0;bottom:0;width:36px;background:linear-gradient(to right,${C.white},transparent);z-index:2;pointer-events:none;opacity:0;transition:opacity .2s}
  .hcn-catbar-wrap::after{content:'';position:absolute;right:0;top:0;bottom:0;width:36px;background:linear-gradient(to left,${C.white},transparent);z-index:2;pointer-events:none;transition:opacity .2s}
  .hcn-catbar-wrap.can-scroll-right::after{opacity:1}
  .hcn-catbar-wrap.can-scroll-left::before{opacity:1}
  .hcn-catbar{display:flex;align-items:stretch;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;max-width:1720px;margin:0 auto;padding:0 24px;height:48px}
  .hcn-catbar::-webkit-scrollbar{display:none}
  .hcn-catbar-divider{width:1px;background:${C.border};margin:12px 8px;flex-shrink:0}

  .hcn-dept-link{position:relative;display:inline-flex;align-items:center;gap:4px;padding:0 18px;height:100%;font-size:13px;font-weight:600;font-family:${FONT};white-space:nowrap;color:${C.text};flex-shrink:0;border-bottom:2.5px solid transparent;transition:color .18s;cursor:pointer;text-decoration:none}

  .hcn-mega-fw{position:fixed;left:0;right:0;background:${C.white};border-top:1px solid ${C.border};box-shadow:0 12px 40px rgba(0,0,0,.10),0 2px 6px rgba(0,0,0,.05);z-index:8999;transition:opacity .18s ease,transform .18s ease;transform-origin:top center;overflow:visible}
  .hcn-mega-fw.is-open{opacity:1;transform:translateY(0) scaleY(1);pointer-events:auto}
  .hcn-mega-fw.is-shut{opacity:0;transform:translateY(-8px) scaleY(.97);pointer-events:none}

  .hcn-fl-link{display:flex;align-items:center;gap:6px;font-size:14px;font-family:${FONT};color:${C.text};padding:5px 0;transition:color .15s;font-weight:400;white-space:nowrap;text-decoration:none}
  .hcn-fl-link:hover{color:${BRAND_SOLID}}
  .hcn-fl-link.is-all{font-weight:600}

  .hcn-badge-new{display:inline-flex;align-items:center;background:${C.newBadge};color:#fff;font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 6px;border-radius:10px;line-height:1;flex-shrink:0;text-transform:uppercase}

  .hcn-icon-btn{background:none;border:none;cursor:pointer;padding:5px 9px;display:flex;flex-direction:column;align-items:center;gap:2px;border-radius:8px;transition:background .14s;text-decoration:none}
  .hcn-icon-btn:hover{background:${C.brandBg}}
  .hcn-icon-btn:hover .hcn-ico{color:${BRAND_SOLID}!important}
  .hcn-icon-btn:hover .hcn-lbl{color:${BRAND_SOLID}!important}

  /* ── Search bar & dropdown ────────────────────────────────────── */
  .hcn-search-wrap{display:flex;align-items:center;height:48px;border-radius:12px;overflow:hidden;background:#FFFFFF;border:2px solid #F6F3EE;box-shadow:0 1px 0 rgba(0,0,0,.15);transition:border-color .4s ease,box-shadow .4s ease;position:relative}
  .hcn-search-wrap.focused{border-color:${BRAND_SOLID};box-shadow:0 0 0 3px rgba(91,79,190,.12)}
  .hcn-search-input{flex:1;min-width:0;background:transparent;border:none;outline:none;padding:0 10px;font-size:14px;color:${C.text};font-family:${FONT}}
  .hcn-search-input::placeholder{color:${C.light}}

  /* suggestions dropdown */
  .hcn-suggest-drop{
    position:absolute;top:calc(100% + 6px);left:0;right:0;
    background:#fff;border-radius:14px;
    border:1px solid #e8e8e8;
    box-shadow:0 16px 48px rgba(0,0,0,.13),0 4px 12px rgba(0,0,0,.06);
    z-index:9100;overflow:hidden;
    animation:hcnDropIn .18s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes hcnDropIn{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}

  .hcn-suggest-item{
    display:flex;align-items:center;gap:10px;
    padding:9px 14px;cursor:pointer;
    transition:background .12s;
    border-bottom:1px solid #f5f5f5;
  }
  .hcn-suggest-item:last-child{border-bottom:none}
  .hcn-suggest-item:hover,.hcn-suggest-item.is-active{background:#f5f3ff}
  .hcn-suggest-img{
    width:38px;height:38px;border-radius:8px;object-fit:cover;
    flex-shrink:0;background:#f0f0f0;border:1px solid #eee;
  }
  .hcn-suggest-name{
    font-size:13px;font-weight:500;color:${C.text};font-family:${FONT};
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;
  }
  .hcn-suggest-name em{
    font-style:normal;
    background:linear-gradient(135deg,${BRAND_SOLID},#E8314A);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    font-weight:700;
  }
  .hcn-suggest-price{
    font-size:12px;font-weight:700;font-family:${FONT};
    background:linear-gradient(135deg,${BRAND_SOLID},#E8314A);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    flex-shrink:0;
  }
  .hcn-suggest-section{
    padding:7px 14px 4px;font-size:10px;font-weight:700;
    letter-spacing:.1em;text-transform:uppercase;color:#bbb;font-family:${FONT};
    background:#fafafa;border-bottom:1px solid #f0f0f0;
  }
  .hcn-suggest-recent{
    display:flex;align-items:center;gap:8px;padding:8px 14px;
    cursor:pointer;transition:background .12s;
  }
  .hcn-suggest-recent:hover,.hcn-suggest-recent.is-active{background:#f5f3ff}
  .hcn-suggest-recent-text{font-size:13px;font-family:${FONT};color:#444;flex:1}
  .hcn-suggest-recent-del{
    background:none;border:none;cursor:pointer;padding:2px 4px;
    color:#ccc;font-size:11px;line-height:1;border-radius:4px;
    transition:color .12s,background .12s;
  }
  .hcn-suggest-recent-del:hover{color:#e11d48;background:#fff0f0}
  .hcn-suggest-footer{
    padding:9px 14px;background:#fafafa;border-top:1px solid #f0f0f0;
    font-size:12px;font-family:${FONT};color:${C.muted};
    display:flex;align-items:center;justify-content:space-between;
  }
  .hcn-suggest-see-all{
    font-size:12px;font-weight:700;font-family:${FONT};
    background:${BRAND_GRAD};-webkit-background-clip:text;
    -webkit-text-fill-color:transparent;background-clip:text;
    cursor:pointer;
  }
  .hcn-suggest-spinner{
    width:14px;height:14px;border:2px solid #e8e8e8;
    border-top-color:${BRAND_SOLID};border-radius:50%;
    animation:hcnSpin .6s linear infinite;flex-shrink:0;
  }
  @keyframes hcnSpin{to{transform:rotate(360deg)}}

  /* ── Rest of existing styles ──────────────────────────────────── */
  .hcn-mob-header{transform:translateY(0);transition:transform .3s cubic-bezier(.4,0,.2,1);will-change:transform}
  .hcn-mob-header.is-hidden{transform:translateY(-100%)}
  .hcn-mob-icon{display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;padding:9px;border-radius:10px;-webkit-tap-highlight-color:transparent;text-decoration:none;color:inherit}
  .hcn-mob-icon:active{background:${C.brandBg}}
  .hcn-chips{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .hcn-chips::-webkit-scrollbar{display:none}
  .hcn-chip{flex-shrink:0;padding:6px 14px;border-radius:22px;font-size:12.5px;font-weight:600;font-family:${FONT};white-space:nowrap;border:1.5px solid ${C.borderMd};background:${C.white};color:${C.text};cursor:pointer;transition:all .15s;text-decoration:none}
  .hcn-chip:hover,.hcn-chip.is-active{background:${BRAND_GRAD};color:#fff;border-color:transparent}
  .hcn-drawer-btn{width:100%;display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:none;border:none;cursor:pointer;font-weight:600;font-size:14px;color:${C.text};font-family:${FONT};text-align:left;transition:background .14s}
  .hcn-drawer-btn:hover{background:#f5f5f5}
  .hcn-sub-link{font-size:13px;color:${C.muted};font-family:${FONT};transition:color .14s;text-decoration:none;display:block}
  .hcn-sub-link:hover{color:${BRAND_SOLID}}

  .hcn-profile-drop{position:absolute;top:calc(100% + 10px);right:0;min-width:240px;background:${C.white};border-radius:14px;border:1px solid ${C.borderMd};box-shadow:0 20px 40px rgba(0,0,0,0.12);z-index:9010;overflow:hidden;transform-origin:top right;transition:opacity .18s ease,transform .18s ease}
  .hcn-profile-drop.is-open{opacity:1;transform:scale(1);pointer-events:auto}
  .hcn-profile-drop.is-shut{opacity:0;transform:scale(.95);pointer-events:none}
  .hcn-pdrop-item{display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:13px;font-weight:500;font-family:${FONT};color:${C.text};text-decoration:none;transition:background .14s,color .14s;cursor:pointer;border:none;background:none;width:100%;text-align:left}
  .hcn-pdrop-item:hover{background:${C.brandBg};color:${BRAND_SOLID}}
  .hcn-pdrop-item.danger:hover{background:#fff5f5;color:#e11d48}

  @keyframes hcn-badge-pop { 0%{transform:scale(1)} 50%{transform:scale(1.4)} 100%{transform:scale(1)} }
  .hcn-badge-pop { animation: hcn-badge-pop 0.3s ease; }
`

// ── Small components ───────────────────────────────────────────────────────────

function Tooltip({ text, visible }: { text: string; visible: boolean }) {
  return (
    <div style={{ position:'absolute',top:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',background:'#1a1a1a',color:'#fff',fontSize:11,fontFamily:FONT,fontWeight:500,padding:'5px 11px',borderRadius:5,whiteSpace:'nowrap',zIndex:9999,boxShadow:'0 4px 14px rgba(0,0,0,.2)',opacity:visible?1:0,pointerEvents:'none',transition:'opacity .18s' }}>
      <div style={{ position:'absolute',top:-4,left:'50%',transform:'translateX(-50%) rotate(45deg)',width:8,height:8,background:'#1a1a1a' }}/>
      {text}
    </div>
  )
}

function CountBadge({ count }: { count: number }) {
  const [prevCount, setPrevCount] = useState(count)
  const [popping,   setPopping]   = useState(false)
  useEffect(() => {
    if (count !== prevCount && count > 0) {
      setPopping(true); setPrevCount(count)
      const t = setTimeout(() => setPopping(false), 300)
      return () => clearTimeout(t)
    }
  }, [count, prevCount])
  if (count <= 0) return null
  return (
    <span className={popping ? 'hcn-badge-pop' : ''} style={{ position:'absolute',top:-7,right:-7,minWidth:16,height:16,padding:'0 4px',borderRadius:8,background:BRAND_GRAD,color:'#fff',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center' }}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function CatBarSkeleton() {
  return (
    <div className="dsk" style={{ display:'flex',alignItems:'center',height:48,padding:'0 24px',gap:8,borderBottom:'1px solid #e8e8e8' }}>
      {[100,90,120,80,130,95,85,110].map((w,i)=>(<div key={i} className="hcn-skel" style={{ width:w,height:14,flexShrink:0 }}/>))}
    </div>
  )
}

// ── Highlight matching text ────────────────────────────────────────────────────
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <em>{text.slice(idx, idx + query.length)}</em>
      {text.slice(idx + query.length)}
    </>
  )
}

// ── Search Suggestions Dropdown ────────────────────────────────────────────────
interface SearchDropProps {
  query:        string
  suggestions:  SearchSuggestion[]
  recentItems:  string[]
  loading:      boolean
  activeIdx:    number
  onSelect:     (s: SearchSuggestion) => void
  onRecent:     (q: string) => void
  onDeleteRecent: (q: string, e: React.MouseEvent) => void
  onSeeAll:     () => void
  visible:      boolean
}

function SearchDrop({
  query, suggestions, recentItems, loading,
  activeIdx, onSelect, onRecent, onDeleteRecent, onSeeAll, visible,
}: SearchDropProps) {
  if (!visible) return null

  const showRecents    = !query.trim() && recentItems.length > 0
  const showSuggestions = query.trim().length > 0
  const isEmpty        = showSuggestions && !loading && suggestions.length === 0

  return (
    <div className="hcn-suggest-drop">

      {/* Loading spinner row */}
      {loading && (
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 14px' }}>
          <div className="hcn-suggest-spinner"/>
          <span style={{ fontSize:13,color:C.muted,fontFamily:FONT }}>Searching…</span>
        </div>
      )}

      {/* Recent searches */}
      {showRecents && !loading && (
        <>
          <div className="hcn-suggest-section">
            <span style={{ display:'flex',alignItems:'center',gap:5 }}>
              <LuClock size={10}/>Recent Searches
            </span>
          </div>
          {recentItems.map((r, i) => (
            <div
              key={r}
              className={`hcn-suggest-recent${activeIdx === i ? ' is-active' : ''}`}
              onMouseDown={() => onRecent(r)}
            >
              <LuClock size={13} color="#bbb" style={{ flexShrink:0 }}/>
              <span className="hcn-suggest-recent-text">{r}</span>
              <button
                className="hcn-suggest-recent-del"
                onMouseDown={(e) => onDeleteRecent(r, e)}
                title="Remove"
              >✕</button>
            </div>
          ))}
        </>
      )}

      {/* Suggestions */}
      {showSuggestions && !loading && suggestions.length > 0 && (
        <>
          <div className="hcn-suggest-section">
            <span style={{ display:'flex',alignItems:'center',gap:5 }}>
              <LuTrendingUp size={10}/>Products
            </span>
          </div>
          {suggestions.map((s, i) => (
            <div
              key={s.id}
              className={`hcn-suggest-item${activeIdx === i ? ' is-active' : ''}`}
              onMouseDown={() => onSelect(s)}
            >
              {s.image ? (
                <img
                  src={s.image}
                  alt={s.name}
                  className="hcn-suggest-img"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div className="hcn-suggest-img" style={{ background:'#f0f0f0' }}/>
              )}
              <span className="hcn-suggest-name">
                <HighlightMatch text={s.name} query={query}/>
              </span>
              {s.price && <span className="hcn-suggest-price">{s.price}</span>}
            </div>
          ))}
        </>
      )}

      {/* No results */}
      {isEmpty && (
        <div style={{ padding:'18px 14px',textAlign:'center',color:C.muted,fontSize:13,fontFamily:FONT }}>
          No products found for "<strong>{query}</strong>"
        </div>
      )}

      {/* Footer — see all results */}
      {showSuggestions && !loading && suggestions.length > 0 && (
        <div className="hcn-suggest-footer">
          <span style={{ fontSize:12,color:C.muted }}>{suggestions.length} result{suggestions.length!==1?'s':''} found</span>
          <span className="hcn-suggest-see-all" onMouseDown={onSeeAll}>
            See all results →
          </span>
        </div>
      )}
    </div>
  )
}

// ── useSearchLogic: shared hook for desktop + mobile search ───────────────────
function useSearchLogic(navigate: ReturnType<typeof useNavigate>) {
  const [query,        setQuery]        = useState('')
  const [focused,      setFocused]      = useState(false)
  const [suggestions,  setSuggestions]  = useState<SearchSuggestion[]>([])
  const [recentItems,  setRecentItems]  = useState<string[]>([])
  const [loading,      setLoading]      = useState(false)
  const [activeIdx,    setActiveIdx]    = useState(-1)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef     = useRef<AbortController | null>(null)

  // Load recents when focused with empty query
  useEffect(() => {
    if (focused && !query.trim()) {
      setRecentItems(getRecentSearches())
      setActiveIdx(-1)
    }
  }, [focused, query])

  // Debounced API search
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]); setLoading(false); setActiveIdx(-1); return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()
      try {
        const res = await apiClient.get('/api/products/search', {
          params: { q: query.trim() },
          signal: abortRef.current.signal,
        } as any)
        const data = res.data
        let items: any[] = []
        if (Array.isArray(data?.data))           items = data.data
        else if (Array.isArray(data))             items = data

        const mapped = items
          .map(mapSearchItem)
          .filter((s): s is SearchSuggestion => s !== null)
          .slice(0, 8) // max 8 suggestions

        setSuggestions(mapped)
        setActiveIdx(-1)
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn('[Search] API error:', err?.message)
          setSuggestions([])
        }
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const showDrop = focused && (!!query.trim() || recentItems.length > 0)

  const handleSelect = useCallback((s: SearchSuggestion) => {
    saveRecentSearch(s.name)
    setQuery(''); setFocused(false); setSuggestions([])
    navigate(`/product-details/${s.id}`)
  }, [navigate])

  const handleRecent = useCallback((q: string) => {
    setQuery(q)
  }, [])

  const handleDeleteRecent = useCallback((q: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeRecentSearch(q)
    setRecentItems(getRecentSearches())
  }, [])

  const handleSubmit = useCallback(() => {
    const q = query.trim(); if (!q) return
    saveRecentSearch(q)
    setFocused(false); setSuggestions([])
    navigate(`/shop-v1?q=${encodeURIComponent(q)}`)
  }, [query, navigate])

  const handleSeeAll = useCallback(() => {
    const q = query.trim(); if (!q) return
    saveRecentSearch(q)
    setFocused(false); setSuggestions([])
    navigate(`/shop-v1?q=${encodeURIComponent(q)}`)
  }, [query, navigate])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = query.trim()
      ? suggestions.length
      : recentItems.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, total - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && query.trim() && suggestions[activeIdx]) {
        handleSelect(suggestions[activeIdx])
      } else if (activeIdx >= 0 && !query.trim() && recentItems[activeIdx]) {
        handleRecent(recentItems[activeIdx])
      } else {
        handleSubmit()
      }
    } else if (e.key === 'Escape') {
      setFocused(false); setSuggestions([])
    }
  }, [activeIdx, suggestions, recentItems, query, handleSelect, handleRecent, handleSubmit])

  return {
    query, setQuery,
    focused, setFocused,
    suggestions,
    recentItems,
    loading,
    activeIdx,
    showDrop,
    handleSelect,
    handleRecent,
    handleDeleteRecent,
    handleSubmit,
    handleSeeAll,
    handleKeyDown,
  }
}

// ── Mega Menu Panel ────────────────────────────────────────────────────────────
function MegaMenuPanel({ dept, data, isOpen, navbarBottom, onEnter, onLeave }: {
  dept: string; data: DeptMenu; isOpen: boolean
  navbarBottom: number; onEnter: ()=>void; onLeave: ()=>void
}) {
  const navigate = useNavigate()
  const dg       = resolveDeptGrad(dept)
  const deptId   = data.id

  return (
    <>
      {isOpen && (
        <div style={{ position:'fixed',top:navbarBottom-28,left:'50%',transform:'translateX(-50%)',background:'rgba(26,26,26,.9)',color:'#fff',fontSize:12,fontWeight:600,fontFamily:FONT,padding:'5px 14px',borderRadius:'6px 6px 0 0',whiteSpace:'nowrap',zIndex:9000,pointerEvents:'none' }}>
          {dept}
        </div>
      )}
      <div className={`hcn-mega-fw ${isOpen?'is-open':'is-shut'}`} style={{ top:navbarBottom }} onMouseEnter={onEnter} onMouseLeave={onLeave}>
        <div style={{ height:3,background:dg.grad }}/>
        <div style={{ maxWidth:1400,margin:'0 auto',padding:'28px 40px',display:'flex',alignItems:'flex-start',gap:32 }}>
          <div style={{ width:220,minWidth:220,overflow:'hidden',borderRadius:8,boxShadow:`0 0 0 2px ${dg.from}22,0 6px 18px rgba(0,0,0,.06)`,flexShrink:0 }}>
            <img src={data.image} alt={data.imageAlt} style={{ width:'100%',height:280,objectFit:'cover',display:'block' }}/>
          </div>
          {data.flatLinks && data.flatLinks.length > 0 && (
            <div style={{ minWidth:200,flexShrink:0 }}>
              <div style={{ fontSize:10,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:14,...gradText(dg.grad) }}>
                Sub-Categories
              </div>
              {data.flatLinks.map((item, i) => {
                const name  = getLinkName(item)
                const badge = getLinkBadge(item)
                const isAll = name.toLowerCase().startsWith('all ')
                const href  = getLinkPath(item, deptId)
                return (
                  <a key={i} href={href} onClick={(e) => { e.preventDefault(); onLeave(); navigate(href) }}
                    className={`hcn-fl-link ${isAll ? 'is-all' : ''}`}
                    style={isAll ? gradText(dg.grad) : {}}
                  >
                    {isAll ? `→ ${name}` : name}
                    {badge === 'NEW'        && <span className="hcn-badge-new">NEW</span>}
                    {badge === 'POPULAR'    && <span className="hcn-badge-new" style={{background:'#22C55E'}}>HOT</span>}
                    {badge === 'BESTSELLER' && <span className="hcn-badge-new" style={{background:'#F97316'}}>BEST</span>}
                  </a>
                )
              })}
              {deptId && (
                <a href={`/category?id=${deptId}`}
                  onClick={(e) => { e.preventDefault(); onLeave(); navigate(`/category?id=${deptId}`) }}
                  style={{ display:'inline-flex',alignItems:'center',gap:4,marginTop:14,fontSize:12,fontWeight:700,fontFamily:FONT,...gradText(dg.grad) }}>
                  View All {dept} →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Profile Dropdown ───────────────────────────────────────────────────────────
function ProfileDropdown({ user, isOpen, onToggle, onLogout, containerRef }: {
  user: { name: string; email: string } | null
  isOpen: boolean; onToggle: ()=>void; onLogout: ()=>void
  containerRef: React.RefObject<HTMLDivElement>
}) {
  const ITEMS = [
    { icon: LuUser,           label: 'My Profile',    path: '/my-profile'    },
    { icon: LuClipboardCheck, label: 'Order History', path: '/order-history' },
    { icon: LuHeart,          label: 'My Wishlist',   path: '/wishlist'      },
    { icon: LuGift,           label: 'My Cart',       path: '/cart'          },
  ]
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '?'
  return (
    <div ref={containerRef} style={{ position:'relative',display:'flex',alignItems:'center' }}>
      <button onClick={onToggle} className="hcn-icon-btn" aria-expanded={isOpen} style={{ flexDirection:'column',alignItems:'center',gap:'2px',background:'none',border:'none',padding:'5px 9px',borderRadius:'8px',cursor:'pointer' }}>
        <div style={{ position:'relative' }}>
          <LuUser size={21} color="#444"/>
          {isOpen && <span style={{ position:'absolute',bottom:-2,right:-4,width:8,height:8,background:BRAND_SOLID,borderRadius:'50%',border:'1px solid #fff' }}/>}
        </div>
        <span className="hcn-lbl" style={{ fontSize:'10.5px',color:'#555',fontFamily:FONT,fontWeight:500 }}>Account</span>
      </button>
      <div className={`hcn-profile-drop ${isOpen?'is-open':'is-shut'}`}>
        <div style={{ padding:'16px 16px 12px',borderBottom:`1px solid ${C.border}`,background:'#FAFAFC',display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ width:44,height:44,borderRadius:'50%',background:BRAND_GRAD,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:18,color:'#fff',flexShrink:0 }}>{initial}</div>
          <div style={{ minWidth:0,flex:1 }}>
            <div style={{ fontWeight:700,fontSize:14,color:C.text,fontFamily:FONT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.name??'User'}</div>
            <div style={{ fontSize:11,color:C.light,fontFamily:FONT,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.email??''}</div>
          </div>
        </div>
        <div style={{ padding:'8px 0' }}>
          {ITEMS.map(({icon:Icon,label,path})=>(
            <Link key={label} to={path} onClick={onToggle} className="hcn-pdrop-item">
              <Icon size={16} strokeWidth={1.8} style={{ flexShrink:0 }}/>{label}
            </Link>
          ))}
        </div>
        <div style={{ height:1,background:C.border,margin:'4px 0' }}/>
        <div style={{ padding:'8px 0 12px' }}>
          <button onClick={()=>{onToggle();onLogout();}} className="hcn-pdrop-item danger" style={{ color:'#E11D48',fontFamily:FONT }}>
            <LuLogOut size={16} strokeWidth={1.8} style={{ flexShrink:0 }}/>Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Mobile Drawer ──────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, departments, megaMenu }: {
  open: boolean; onClose: ()=>void
  departments: string[]; megaMenu: Record<string, DeptMenu>
}) {
  const [expanded, setExpanded] = useState<string|null>(null)
  const toggle   = (s: string) => setExpanded(p => p===s ? null : s)
  const navigate = useNavigate()

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1100,opacity:open?1:0,pointerEvents:open?'auto':'none',transition:'opacity .27s ease' }}/>
      <div style={{ position:'fixed',top:0,left:0,bottom:0,width:'min(84vw,350px)',background:C.white,zIndex:1200,display:'flex',flexDirection:'column',transform:open?'translateX(0)':'translateX(-100%)',transition:'transform .3s cubic-bezier(.4,0,.2,1)',boxShadow:'5px 0 30px rgba(0,0,0,.16)' }}>
        <div style={{ height:3,background:BRAND_GRAD,flexShrink:0 }}/>
        <div style={{ padding:'15px 16px',borderBottom:`1px solid ${C.border}`,background:C.brandBg,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <Link to="/" onClick={onClose} aria-label="Native Flavours home"><SiteLogo size={56} /></Link>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:'50%',border:`1px solid ${C.borderMd}`,background:C.white,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
            <LuX size={15} color="#555"/>
          </button>
        </div>
        <div style={{ padding:'12px 16px',borderBottom:`1px solid ${C.border}`,flexShrink:0 }}>
          <Link to="/login" onClick={onClose} style={{ display:'block',textAlign:'center',padding:'11px 0',borderRadius:10,background:CTA_GRAD,color:'#fff',fontWeight:700,fontSize:13,letterSpacing:'0.06em',fontFamily:FONT }}>SIGN UP / SIGN IN</Link>
        </div>
        <div style={{ flex:1,overflowY:'auto',overscrollBehavior:'contain' }}>
          {/* Home / Shop / Contact removed per request; departments follow below */}
          {departments.map(dept => {
            const data  = megaMenu[dept]; if(!data) return null
            const dg    = resolveDeptGrad(dept)
            const deptId = data.id
            return (
              <div key={dept} style={{ borderBottom:`1px solid #f5f5f5` }}>
                <button onClick={()=>toggle(dept)} className="hcn-drawer-btn">
                  <span style={expanded===dept?gradText(dg.grad):{}}>{dept}</span>
                  <LuChevronDown size={14} color="#999" style={{ transition:'transform .2s',transform:expanded===dept?'rotate(180deg)':'rotate(0)' }}/>
                </button>
                <div style={{ maxHeight:expanded===dept?700:0,overflow:'hidden',transition:'max-height .32s ease' }}>
                  <div style={{ background:'#fafaf9',padding:'10px 16px 14px' }}>
                    <div style={{ height:2,background:dg.grad,borderRadius:1,marginBottom:10 }}/>
                    <div style={{ borderRadius:8,overflow:'hidden',marginBottom:12,height:90 }}>
                      <img src={data.image} alt={dept} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                    </div>
                    {deptId && (
                      <Link to={`/category?id=${deptId}`} onClick={onClose}
                        style={{ display:'inline-block',marginBottom:10,fontSize:12,fontWeight:700,fontFamily:FONT,...gradText(dg.grad) }}>
                        All {dept} →
                      </Link>
                    )}
                    {(data.flatLinks||[]).filter(item => !getLinkName(item).toLowerCase().startsWith('all ')).map((item,i)=>{
                      const name  = getLinkName(item)
                      const badge = getLinkBadge(item)
                      const href  = getLinkPath(item, deptId)
                      return (
                        <div key={i} style={{ display:'flex',alignItems:'center',gap:6,padding:'4px 0' }}>
                          <a href={href} onClick={(e)=>{ e.preventDefault(); onClose(); navigate(href) }} className="hcn-sub-link">{name}</a>
                          {badge==='NEW'&&<span className="hcn-badge-new">NEW</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ borderTop:`1px solid ${C.border}`,background:'#fafaf9',padding:'11px 16px',flexShrink:0 }}>
          {[{icon:<RiEBike2Line size={14}/>,label:'Fast Delivery Available'},{icon:<LuMapPin size={13}/>,label:'Delivering To Your City'},{icon:<LuTruck size={13}/>,label:'Track Your Order'},{icon:<LuSmartphone size={13}/>,label:'Download Our App'}].map(({icon,label})=>(
            <div key={label} style={{ display:'flex',alignItems:'center',gap:10,padding:'5px 0',fontSize:12.5,color:'#555',fontFamily:FONT }}>
              <span style={{ color:BRAND_SOLID,display:'flex' }}>{icon}</span>{label}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function NavbarOne() {
  const location = useLocation()
  const navigate  = useNavigate()
  const curr      = location.pathname + location.search

  const [activeMenu,    setActiveMenu]    = useState<string|null>(null)
  const [showFreeShip,  setShowFreeShip]  = useState(false)
  const [showEmi,       setShowEmi]       = useState(false)
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [cartCount,     setCartCount]     = useState<number>(() => getCartCountSync())
  const [wishlistCount, setWishlistCount] = useState<number>(() => getWishlistCountSync())
  const [isAuth,        setIsAuth]        = useState(false)
  const [authUser,      setAuthUser]      = useState<{name:string;email:string}|null>(null)
  const [profileOpen,   setProfileOpen]   = useState(false)
  const [scrolled,      setScrolled]      = useState(false)
  const [mobHidden,     setMobHidden]     = useState(false)
  const [navbarBottom,  setNavbarBottom]  = useState(0)
  const [activeChip,    setActiveChip]    = useState<string|null>(null)
  const [catBarScroll,  setCatBarScroll]  = useState({ left:false, right:false })
  const [apiLoading,    setApiLoading]    = useState(true)
  const [apiMenu,       setApiMenu]       = useState<Record<string,DeptMenu>|null>(null)
  const [apiDepts,      setApiDepts]      = useState<string[]|null>(null)

  const navRef       = useRef<HTMLElement>(null)
  const megaWrapRef  = useRef<HTMLDivElement>(null)
  const catBarRef    = useRef<HTMLDivElement>(null)
  const profileRef   = useRef<HTMLDivElement>(null)
  const timerRef     = useRef<ReturnType<typeof setTimeout>|null>(null)
  const rafRef       = useRef<number|null>(null)
  const nbRafRef     = useRef<number|null>(null)
  const lastY        = useRef(0); const delta_ = useRef(0)
  const scrolled_    = useRef(false); const mobHid_ = useRef(false)

  const megaMenu    = useMemo(() => apiMenu ?? {}, [apiMenu])
  const departments = useMemo(() => apiDepts ?? [], [apiDepts])

  // ── Search logic (desktop) ────────────────────────────────────────────────
  const deskSearch = useSearchLogic(navigate)
  // Search wrap ref for click-outside close
  const deskSearchRef = useRef<HTMLDivElement>(null)

  // ── Search logic (mobile) ─────────────────────────────────────────────────
  const mobSearch = useSearchLogic(navigate)
  const mobSearchRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (deskSearchRef.current && !deskSearchRef.current.contains(e.target as Node)) {
        deskSearch.setFocused(false)
      }
      if (mobSearchRef.current && !mobSearchRef.current.contains(e.target as Node)) {
        mobSearch.setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [deskSearch, mobSearch])

  // ── API categories ────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const res     = await apiClient.get('/api/navbar-categories', { signal: ctrl.signal } as any)
        const payload: ApiResp = res.data
        if (!alive) return
        if (payload?.status && Array.isArray(payload.data) && payload.data.length > 0) {
          setApiMenu(mergeApiCategories(payload.data))
          setApiDepts(payload.data.map(c => c.name))
        } else {
          setApiMenu({}); setApiDepts([])
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') { setApiMenu({}); setApiDepts([]) }
      } finally {
        if (alive) setApiLoading(false)
      }
    })()
    return () => { alive = false; ctrl.abort() }
  }, [])

  // ── Navbar measurement ────────────────────────────────────────────────────
  const measureNavbar = useCallback(() => {
    if (navRef.current) setNavbarBottom(navRef.current.getBoundingClientRect().bottom)
  }, [])
  useEffect(() => {
    if (!activeMenu) return
    let alive = true
    function tick() { if (!alive) return; measureNavbar(); nbRafRef.current = requestAnimationFrame(tick) }
    nbRafRef.current = requestAnimationFrame(tick)
    return () => { alive = false; if (nbRafRef.current) cancelAnimationFrame(nbRafRef.current) }
  }, [activeMenu, measureNavbar])
  useEffect(() => {
    measureNavbar()
    window.addEventListener('resize', measureNavbar)
    return () => window.removeEventListener('resize', measureNavbar)
  }, [measureNavbar])

  // ── Catbar scroll masks ───────────────────────────────────────────────────
  const checkCatBar = useCallback(() => {
    const el = catBarRef.current; if (!el) return
    setCatBarScroll({ left: el.scrollLeft > 8, right: el.scrollLeft < el.scrollWidth - el.clientWidth - 8 })
  }, [])
  useEffect(() => {
    const el = catBarRef.current; if (!el) return
    checkCatBar()
    el.addEventListener('scroll', checkCatBar, { passive: true })
    window.addEventListener('resize', checkCatBar)
    return () => { el.removeEventListener('scroll', checkCatBar); window.removeEventListener('resize', checkCatBar) }
  }, [checkCatBar, departments])

  // ── Auth ──────────────────────────────────────────────────────────────────
  const syncAuth = useCallback(() => {
    const token = window.localStorage.getItem('access_token')
    const raw   = window.localStorage.getItem('auth_user')
    setIsAuth(Boolean(token))
    if (token && raw) { try { setAuthUser(JSON.parse(raw)) } catch { setAuthUser(null) } }
    else setAuthUser(null)
  }, [])

  // ── Badge refresh ─────────────────────────────────────────────────────────
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
    const onCart = () => refreshCounts()
    const onWl   = () => refreshCounts()
    const onAuth = () => { syncAuth(); refreshCounts() }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'auth_user') syncAuth()
      if (e.key?.startsWith('cart') || e.key?.startsWith('wishlist')) refreshCounts()
    }
    window.addEventListener('cart:changed',    onCart)
    window.addEventListener('wishlist:changed', onWl)
    window.addEventListener('auth:changed',     onAuth)
    window.addEventListener('storage',          onStorage as EventListener)
    return () => {
      window.removeEventListener('cart:changed',    onCart)
      window.removeEventListener('wishlist:changed', onWl)
      window.removeEventListener('auth:changed',     onAuth)
      window.removeEventListener('storage',          onStorage as EventListener)
    }
  }, [refreshCounts, syncAuth])

  // Close profile on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Scroll ────────────────────────────────────────────────────────────────
  const onScroll = useCallback(() => {
    const y = window.scrollY
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const isMobile = window.innerWidth < 1024
      if (y > 2 !== scrolled_.current) { scrolled_.current = y > 2; setScrolled(y > 2) }
      if (!isMobile) { if (mobHid_.current) { mobHid_.current = false; setMobHidden(false) } lastY.current = y; delta_.current = 0; return }
      if (y <= 10) { if (mobHid_.current) { mobHid_.current = false; setMobHidden(false) } lastY.current = y; delta_.current = 0; return }
      const diff = y - lastY.current
      if (diff > 0) { if (delta_.current < 0) delta_.current = 0; delta_.current += diff; if (delta_.current > 60) { mobHid_.current = true; setMobHidden(true) } }
      else if (diff < 0) { if (delta_.current > 0) delta_.current = 0; delta_.current += diff; if (delta_.current < -30) { mobHid_.current = false; setMobHidden(false) } }
      lastY.current = y
    })
  }, [])
  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [onScroll])

  useEffect(() => { document.body.style.overflow = drawerOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [drawerOpen])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node) && !megaWrapRef.current?.contains(e.target as Node))
        setActiveMenu(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const enter = (key: string) => { if (timerRef.current) clearTimeout(timerRef.current); setActiveMenu(key) }
  const leave = () => { timerRef.current = setTimeout(() => setActiveMenu(null), 120) }
  const keep  = () => { if (timerRef.current) clearTimeout(timerRef.current) }

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token'); localStorage.removeItem('auth_user')
    setIsAuth(false); setAuthUser(null); setProfileOpen(false)
    window.dispatchEvent(new Event('auth:changed'))
    try { rotateCartSession() } catch (e) { console.warn('rotateCartSession failed', e) }
    navigate('/')
  }, [navigate])

  return (
    <>
      <style>{STYLES}</style>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} departments={departments} megaMenu={megaMenu}/>

      <header ref={navRef} className="hcn" style={{ width:'100%',position:'sticky',top:0,zIndex:1000,fontFamily:FONT,boxShadow:scrolled?'0 2px 20px rgba(0,0,0,.09)':'0 1px 0 #ebebeb',transition:'box-shadow .3s' }}>

        {/* Utility bar */}
        <div className={`dsk hcn-util-bar${scrolled ? ' is-hidden' : ''}`}>
  <div
    style={{
      background: '#2F4A3A',
      maxWidth: 1720,
      margin: '0 auto',
      padding: '0 24px',
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(239, 238, 244, 0.4)',
    }}
  >
    {/* Left: Delivery & EMI */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative' }}>
        <button
          onMouseEnter={() => setShowFreeShip(true)}
          onMouseLeave={() => setShowFreeShip(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            height: 36,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: FONT,
            transition: 'all 0.2s ease',
            letterSpacing: '0.3px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #09f5fd, #04eef6fa, #fffb07)';
            e.currentTarget.style.webkitBackgroundClip = 'text';
            // e.currentTarget.style.webkitTextFillColor = 'transparent';
            e.currentTarget.style.color = 'transparent';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#ffffff';
          }}
        >
          <RiEBike2Line size={14} style={{ color: '#f4f2f7' }} />
          Fast Delivery
        </button>
        <Tooltip text="Fast delivery on all print orders" visible={showFreeShip} />
      </div>

      <span style={{ color: '#4a4a6a', fontSize: 10 }}>|</span>

      <div style={{ position: 'relative' }}>
        <button
          onMouseEnter={() => setShowEmi(true)}
          onMouseLeave={() => setShowEmi(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            height: 36,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: FONT,
            transition: 'all 0.2s ease',
            letterSpacing: '0.3px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #09f5fd, #04eef6fa, #fffb07)';
            e.currentTarget.style.webkitBackgroundClip = 'text';
            // e.currentTarget.style.webkitTextFillColor = 'transparent';
            e.currentTarget.style.color = 'transparent';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#ffffff';
          }}
        >
          <svg width="13" height="13" fill="none" stroke="#ffffff" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <rect x="5" y="14" width="4" height="2" rx=".5" fill="#ffffff" stroke="none" />
            <rect x="10" y="14" width="4" height="2" rx=".5" fill="#ffffff" stroke="none" />
          </svg>
          EMI Options
        </button>
        <Tooltip text="Easy EMI on bulk orders" visible={showEmi} />
      </div>
    </div>

    {/* Right: Links */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {[
        { icon: <LuMapPin size={13} />, label: 'Delivering To', href: '#' },
        { icon: <LuSmartphone size={13} />, label: 'Download Apps', href: '/apps' },
        { icon: <LuTruck size={13} />, label: 'Track Order', href: '/track' },
        { icon: <LuCircle size={13} />, label: 'Help', href: '/help' },
      ].map(({ icon, label, href }, i, arr) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link
            to={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: FONT,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              letterSpacing: '0.3px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #09f5fd, #04eef6fa, #fffb07)';
              e.currentTarget.style.webkitBackgroundClip = 'text';
              // e.currentTarget.style.webkitTextFillColor = 'transparent';
              e.currentTarget.style.color = 'transparent';
              const svg = e.currentTarget.querySelector('svg');
              if (svg) svg.style.color = '#c084fc';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#ffffff';
              const svg = e.currentTarget.querySelector('svg');
              if (svg) svg.style.color = '#c084fc';
            }}
          >
            <span style={{ color: '#ffffff', transition: 'color 0.2s' }}>{icon}</span>
            {label}
          </Link>
          {i < arr.length - 1 && <span style={{ color: '#4a4a6a', fontSize: 10 }}>|</span>}
        </span>
      ))}
    </div>
  </div>
</div>

        {/* Logo + Search + Actions */}
        <div className="dsk" style={{ background:'#2F4A3A',borderBottom:'1px solid #1E3328' }}>
          <div style={{ maxWidth:1720,margin:'0 auto',padding:'0 20px',height:80,display:'flex',alignItems:'center',gap:12 }}>
            <Link to="/" aria-label="Native Flavours home" style={{ flexShrink:0,display:'flex',alignItems:'center' }}>
              <SiteLogo size={64} />
            </Link>

            {/* ── Desktop Search ── */}
            <div ref={deskSearchRef} style={{ flex:'1 1 480px',minWidth:220,maxWidth:720,position:'relative' }}>
              <form role="search" onSubmit={(e) => { e.preventDefault(); deskSearch.handleSubmit() }}
                className={`hcn-search-wrap${deskSearch.focused?' focused':''}`}>
                <LuSearch size={15} color="#aaa" style={{ marginLeft:14,flexShrink:0 }}/>
                <input
                  aria-label="Search products"
                  type="text"
                  className="hcn-search-input"
                  placeholder="Search ghee, atta, honey…"
                  value={deskSearch.query}
                  onChange={(e) => deskSearch.setQuery(e.target.value)}
                  onFocus={() => deskSearch.setFocused(true)}
                  onKeyDown={deskSearch.handleKeyDown}
                  autoComplete="off"
                />
                {deskSearch.loading && <div className="hcn-suggest-spinner" style={{ marginRight:8 }}/>}
                {deskSearch.query && !deskSearch.loading && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); deskSearch.setQuery('') }}
                    style={{ background:'none',border:'none',cursor:'pointer',padding:'0 6px',color:C.light,display:'flex',alignItems:'center' }}
                    aria-label="Clear search"
                  ><LuX size={13}/></button>
                )}
                <button type="submit" aria-label="Search"
                  style={{ height:'100%',minHeight:44,padding:'0 22px',border:'none',borderRadius:'0 12px 12px 0',background:'#2F4A3A',color:'#F6F3EE',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:FONT,flexShrink:0 }}>
                  Search
                </button>
              </form>
              <SearchDrop
                query={deskSearch.query}
                suggestions={deskSearch.suggestions}
                recentItems={deskSearch.recentItems}
                loading={deskSearch.loading}
                activeIdx={deskSearch.activeIdx}
                onSelect={deskSearch.handleSelect}
                onRecent={deskSearch.handleRecent}
                onDeleteRecent={deskSearch.handleDeleteRecent}
                onSeeAll={deskSearch.handleSeeAll}
                visible={deskSearch.showDrop}
              />
            </div>

            <div style={{ display:'flex',alignItems:'center',gap:4,marginLeft:'auto',flexShrink:0 }}>
              {isAuth ? (
                <ProfileDropdown user={authUser} isOpen={profileOpen} onToggle={()=>setProfileOpen(p=>!p)} onLogout={handleLogout} containerRef={profileRef}/>
              ) : (
                <Link to="/login" style={{ padding:'0 18px',minHeight:44,borderRadius:12,background:'transparent',border:'1px solid #F6F3EE',color:'#F6F3EE',fontSize:12.5,fontWeight:600,letterSpacing:'0.04em',cursor:'pointer',fontFamily:FONT,whiteSpace:'nowrap',marginRight:4,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6 }}>
                  <LuUser size={14} color="#F6F3EE" strokeWidth={1.75}/>SIGN IN
                </Link>
              )}
              <Link to="/wishlist" className="hcn-icon-btn">
                <div style={{ position:'relative' }}><LuHeart className="hcn-ico" size={21} color="#F6F3EE" strokeWidth={1.75}/><CountBadge count={wishlistCount}/></div>
                <span className="hcn-lbl" style={{ fontSize:10.5,color:'#F6F3EE',fontFamily:FONT,fontWeight:500 }}>Wishlist</span>
              </Link>
              <Link to="/cart" className="hcn-icon-btn">
                <div style={{ position:'relative' }}><LuShoppingBasket className="hcn-ico" size={21} color="#F6F3EE" strokeWidth={1.75}/><CountBadge count={cartCount}/></div>
                <span className="hcn-lbl" style={{ fontSize:10.5,color:'#F6F3EE',fontFamily:FONT,fontWeight:500 }}>Cart</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Category Bar */}
        {apiLoading ? (
          <CatBarSkeleton/>
        ) : departments.length > 0 ? (
          <div className={`dsk hcn-catbar-wrap${catBarScroll.left?' can-scroll-left':''}${catBarScroll.right?' can-scroll-right':''}`}>
            <div className="hcn-catbar" ref={catBarRef}>
              <div className="hcn-catbar-divider"/>
              {departments.map(dept => {
                const data   = megaMenu[dept]
                const dg     = resolveDeptGrad(dept)
                const deptId = data?.id
                const isActive = activeMenu===dept || curr===`/category?id=${deptId}` || curr.startsWith(`/category?id=${deptId}&`) || curr.includes(`parentId=${deptId}`)
                return (
                  <div key={dept} style={{ position:'relative',height:'100%',display:'flex',alignItems:'center',flexShrink:0 }}
                    onMouseEnter={()=>enter(dept)} onMouseLeave={leave}>
                    <Link
                      to={deptId ? `/category?id=${deptId}` : `/category?sub=${encodeURIComponent(dept)}`}
                      className="hcn-dept-link"
                      style={isActive ? gradText(dg.grad) : {}}
                      onMouseEnter={e=>{const a=e.currentTarget as HTMLAnchorElement;a.style.backgroundImage=dg.grad;a.style.webkitTextFillColor='transparent';a.style.color='transparent';}}
                      onMouseLeave={e=>{if(!isActive){const a=e.currentTarget as HTMLAnchorElement;a.style.backgroundImage='none';a.style.webkitTextFillColor='';a.style.color='';} }}
                    >
                      {dept}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ opacity:.5,transition:'transform .2s',flexShrink:0 }}>
                        <path d="M19 9l-7 7-7-7"/>
                      </svg>
                    </Link>
                    {isActive && <div style={{ position:'absolute',bottom:0,left:12,right:12,height:2.5,borderRadius:2,background:dg.grad,pointerEvents:'none' }}/>}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Mobile header */}
        <div className={`mob hcn-mob-header${mobHidden?' is-hidden':''}`} style={{ background:'#2F4A3A',boxShadow:scrolled?'0 3px 14px rgba(0,0,0,.07)':'none' }}>
          <div style={{ height:64,display:'flex',alignItems:'center',padding:'0 8px',borderBottom:`1px solid ${C.border}`,gap:8 }}>
            <button onClick={()=>setDrawerOpen(true)} aria-label="Open menu" className="hcn-mob-icon" style={{ marginRight:0 }}><LuMenu size={22} color="#F6F3EE" strokeWidth={1.75}/></button>
            <Link to="/" aria-label="Native Flavours home" style={{ display:'flex',alignItems:'center' }}><SiteLogo size={48} /></Link>
            <div style={{ flex:1 }}/>
            <Link to="/wishlist" className="hcn-mob-icon"><div style={{ position:'relative' }}><LuHeart size={22} color="#F6F3EE" strokeWidth={1.75}/><CountBadge count={wishlistCount}/></div></Link>
            <Link to="/cart" className="hcn-mob-icon"><div style={{ position:'relative' }}><LuShoppingBasket size={22} color="#F6F3EE" strokeWidth={1.75}/><CountBadge count={cartCount}/></div></Link>
            {isAuth
              ? <Link to="/my-profile" className="hcn-mob-icon" title={authUser?.name??''}><div style={{ width:30,height:30,borderRadius:'50%',background:BRAND_GRAD,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:12,color:'#fff' }}>{authUser?.name?.trim()?.[0]?.toUpperCase()??'?'}</div></Link>
              : <Link to="/login" className="hcn-mob-icon"><LuUser size={22} color="#F6F3EE" strokeWidth={1.75}/></Link>
            }
          </div>

          {/* ── Mobile Search ── */}
          <div style={{ padding:'9px 12px',borderBottom:`1px solid ${C.border}` }}>
            <div ref={mobSearchRef} style={{ position:'relative' }}>
              <form role="search" onSubmit={(e) => { e.preventDefault(); mobSearch.handleSubmit() }}
                className={`hcn-search-wrap${mobSearch.focused?' focused':''}`}>
                <LuSearch size={15} color={C.light} style={{ marginLeft:13,flexShrink:0 }}/>
                <input
                  aria-label="Search products"
                  type="text"
                  className="hcn-search-input"
                  placeholder="Search ghee, atta, honey…"
                  value={mobSearch.query}
                  onChange={(e) => mobSearch.setQuery(e.target.value)}
                  onFocus={() => mobSearch.setFocused(true)}
                  onKeyDown={mobSearch.handleKeyDown}
                  autoComplete="off"
                />
                {mobSearch.loading && <div className="hcn-suggest-spinner" style={{ marginRight:8 }}/>}
                {mobSearch.query && !mobSearch.loading && (
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); mobSearch.setQuery('') }}
                    style={{ background:'none',border:'none',cursor:'pointer',padding:'0 6px',color:C.light,display:'flex' }} aria-label="Clear search">
                    <LuX size={13}/>
                  </button>
                )}
                <button type="submit" aria-label="Search"
                  style={{ height:'100%',minHeight:44,width:48,border:'none',borderRadius:'0 12px 12px 0',background:'#2F4A3A',color:'#F6F3EE',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
                  <LuSearch size={16} color="#F6F3EE" strokeWidth={1.75}/>
                </button>
              </form>
              <SearchDrop
                query={mobSearch.query}
                suggestions={mobSearch.suggestions}
                recentItems={mobSearch.recentItems}
                loading={mobSearch.loading}
                activeIdx={mobSearch.activeIdx}
                onSelect={mobSearch.handleSelect}
                onRecent={mobSearch.handleRecent}
                onDeleteRecent={mobSearch.handleDeleteRecent}
                onSeeAll={mobSearch.handleSeeAll}
                visible={mobSearch.showDrop}
              />
            </div>
          </div>

          <div style={{ padding:'8px 12px',background:C.white }}>
            <div className="hcn-chips">
              {departments.map(label => {
                const data = megaMenu[label]; const dg = resolveDeptGrad(label); const isChipActive = activeChip===label
                return (
                  <Link key={label}
                    to={data?.id ? `/category?id=${data.id}` : `/category?sub=${encodeURIComponent(label)}`}
                    onClick={()=>setActiveChip(label)}
                    className={`hcn-chip ${isChipActive?'is-active':''}`}
                    style={isChipActive?{background:dg.grad,borderColor:'transparent',color:'#fff'}:{}}>
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      <div ref={megaWrapRef}>
        {!apiLoading && departments.map(dept => {
          const data = megaMenu[dept]; if (!data) return null
          return <MegaMenuPanel key={dept} dept={dept} data={data} isOpen={activeMenu===dept} navbarBottom={navbarBottom} onEnter={keep} onLeave={leave}/>
        })}
        <div style={{ position:'fixed',inset:0,top:navbarBottom,background:'rgba(0,0,0,.18)',zIndex:8998,opacity:departments.includes(activeMenu??'')?1:0,pointerEvents:'none',transition:'opacity .18s ease' }}/>
      </div>
    </>
  )
}