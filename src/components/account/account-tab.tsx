'use client'

// src/components/account/account-tab.tsx
// ══════════════════════════════════════════════════════════════════
//  FIX: Logout now properly:
//   1. Removes access_token from localStorage
//   2. Removes any refresh_token / cart / wishlist keys
//   3. Dispatches 'storage' event so NavbarOne re-reads auth state
//   4. Dispatches 'cart:changed' + 'wishlist:changed' so badge
//      counts reset to 0 in NavbarOne immediately
//   5. Navigates to /login (no full page reload — SPA nav)
//
//  Everything else (styles, active state, icon layout) unchanged.
// ══════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from '@/lib/router'
import {
  LuUser, LuClipboardList, LuHeart,
  LuLogOut,
} from 'react-icons/lu'
import { apiClient } from '../../api/client'

// ── Brand token ───────────────────────────────────────────────────
const BRAND_GRADIENT = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
const BRAND_SOLID    = '#2F4A3A'
const FONT           = "'DM Sans', sans-serif"

export default function AccountTab() {
  const location = useLocation()
  const navigate  = useNavigate()
  const [current, setCurrent] = useState(location.pathname)

  useEffect(() => {
    setCurrent(location.pathname)
  }, [location.pathname])

  // ── Logout handler ────────────────────────────────────────────
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()

    // Attempt server-side logout first (keep token in localStorage so interceptor can attach it)
    try {
      await apiClient.post('/api/logout', {}, { headers: { Accept: 'application/json' } } as any)
    } catch (err) {
      // Ignore network/server errors — proceed with local logout so UX is consistent
      // eslint-disable-next-line no-console
      console.warn('[account-tab] server logout failed, proceeding with local logout', err)
    }

    // 1. Clear all auth + session keys from localStorage
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      // Remove token keys, cart keys, wishlist keys
      if (
        key === 'access_token'   ||
        key === 'refresh_token'  ||
        key === 'user'           ||
        key === 'user_id'        ||
        key.startsWith('cart')   ||
        key.startsWith('wishlist')
      ) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))

    // 2. Dispatch storage event so NavbarOne immediately re-reads
    //    isAuth state and resets to false (no page reload needed)
    window.dispatchEvent(new StorageEvent('storage', {
      key:      'access_token',
      newValue: null,
      oldValue: 'demo_token',
    }))

    // 3. Dispatch cart + wishlist changed events so badge counts
    //    reset to 0 in NavbarOne immediately
    window.dispatchEvent(new Event('cart:changed'))
    window.dispatchEvent(new Event('wishlist:changed'))

    // 4. Navigate to login — SPA nav, no full page reload
    navigate('/login')
  }

  // ── Nav items ─────────────────────────────────────────────────
  const navItems = [
    { path: '/my-profile',    label: 'My Profile',    icon: <LuUser size={18} /> },
    // { path: '/my-account',    label: 'My Account',    icon: <LuLayoutDashboard size={18} /> },
    // { path: '/edit-account',  label: 'Edit Account',  icon: <LuSettings size={18} /> },
    { path: '/order-history', label: 'Order History', icon: <LuClipboardList size={18} /> },
    { path: '/wishlist',      label: 'Wishlist',      icon: <LuHeart size={18} /> },
  ]

  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}>

      {/* ── Regular nav items ── */}
      {navItems.map(({ path, label, icon }) => {
        const isActive = current === path
        return (
          <li key={path}>
            <Link
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 16px',
                borderRadius: 12,
                textDecoration: 'none',
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s ease',
                background: isActive
                  ? 'linear-gradient(135deg,rgba(91,79,190,0.08),rgba(232,49,74,0.06))'
                  : 'transparent',
                color: isActive ? BRAND_SOLID : '#4B5563',
                boxShadow: isActive ? '0 1px 6px rgba(91,79,190,0.10)' : 'none',
                border: isActive
                  ? '1px solid rgba(91,79,190,0.15)'
                  : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(91,79,190,0.05)'
                  ;(e.currentTarget as HTMLAnchorElement).style.color = BRAND_SOLID
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#4B5563'
                }
              }}
            >
              {/* Icon */}
              <span style={{
                color: isActive ? BRAND_SOLID : '#9CA3AF',
                display: 'flex', flexShrink: 0,
                transition: 'color 0.2s',
              }}>
                {icon}
              </span>

              {/* Label */}
              <span style={{ flex: 1 }}>{label}</span>

              {/* Active indicator — gradient pill on right */}
              {isActive && (
                <span style={{
                  width: 4, height: 22, borderRadius: 3,
                  background: BRAND_GRADIENT, flexShrink: 0,
                }} />
              )}
            </Link>
          </li>
        )
      })}

      {/* ── Divider ── */}
      <li style={{
        height: 1,
        background: 'linear-gradient(90deg,transparent,#E5E7EB,transparent)',
        margin: '6px 0',
      }} />

      {/* ── Logout — button (not Link), calls handleLogout ── */}
      <li>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '11px 16px',
            borderRadius: 12,
            textDecoration: 'none',
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s ease',
            background: 'transparent',
            color: '#6B7280',
            border: '1px solid transparent',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,49,74,0.06)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#E8314A'
            ;(e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(232,49,74,0.15)'
            const icon = e.currentTarget.querySelector('.logout-icon') as HTMLElement | null
            if (icon) icon.style.color = '#E8314A'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#6B7280'
            ;(e.currentTarget as HTMLButtonElement).style.border = '1px solid transparent'
            const icon = e.currentTarget.querySelector('.logout-icon') as HTMLElement | null
            if (icon) icon.style.color = '#9CA3AF'
          }}
        >
          {/* Icon */}
          <span className="logout-icon" style={{ color: '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.2s' }}>
            <LuLogOut size={18} />
          </span>
          {/* Label */}
          <span style={{ flex: 1 }}>Logout</span>
        </button>
      </li>

    </ul>
  )
}