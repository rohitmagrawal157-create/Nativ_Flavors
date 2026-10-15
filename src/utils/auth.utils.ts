// src/utils/auth.utils.ts
// ══════════════════════════════════════════════════════════════════════
//  Central auth helpers — import these wherever you need to log out.
//
//  WHY THIS FILE EXISTS:
//  Logging out used to only remove 'access_token' and 'auth_user', but
//  left 'SessionId' intact.  The next visitor (or the same user after
//  logout) would reuse the old session ID and GET /api/cart would return
//  the previous user's items — the "ghost cart" bug.
//
//  FIX: logout() now also calls clearGuestSession() which wipes the
//  session ID and the local cart storage so the next page load starts
//  with a guaranteed empty cart.
// ══════════════════════════════════════════════════════════════════════

import { clearGuestSession } from '../api/cart.api';

/**
 * Full logout:
 * 1. Remove auth token + user object
 * 2. Wipe session ID so next visitor gets a fresh empty cart (ghost cart fix)
 * 3. Dispatch events so Navbar / Cart UI update immediately
 */
export function logout(): void {
  // Remove auth credentials
  window.localStorage.removeItem('access_token');
  window.localStorage.removeItem('auth_user');

  // FIX: wipe session ID + local cart — prevents ghost items for next user
  clearGuestSession();

  // Notify UI components
  window.dispatchEvent(new Event('cart:changed'));
  window.dispatchEvent(new Event('auth:logout'));
}

/**
 * Returns true when the user has a valid access token stored.
 * Used by guards / useAuth hook.
 */
export function getAuthToken(): string | null {
  return window.localStorage.getItem('access_token') ?? null;
}

export function getAuthUser<T = { email: string; id?: number }>(): T | null {
  try {
    const raw = window.localStorage.getItem('auth_user');
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}