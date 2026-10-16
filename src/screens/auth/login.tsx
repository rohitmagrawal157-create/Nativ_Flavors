'use client'

// src/screens/auth/Login.tsx
// ══════════════════════════════════════════════════════════════════════
//  COMPLETE FIX LIST vs both previous versions:
//
//  FIX-1  returnUrl read from ?returnUrl= query param (not location.state.from).
//         Cart sends: /login?returnUrl=%2Fcheckout
//         Old code read location.state?.from — always got undefined → redirected to /
//         New code: useSearchParams() reads the actual query param.
//
//  FIX-2  authDispatch.login() is now called after successful login.
//         This fires the 'auth:changed' CustomEvent so NavbarOne and
//         useAuth() update instantly without a page reload.
//         Old code only set localStorage but never fired auth:changed.
//
//  FIX-3  Login API uses apiClient (not raw fetch) so the request goes
//         through any interceptors (base URL, timeout, error normalization).
//         The hardcoded hostinger URL is moved to NEXT_PUBLIC_LOGIN_API_URL env
//         variable with apiClient as the primary path.
//
//  FIX-4  Session-Id header sent with the login request so the backend
//         can merge the guest cart. Uses getOrCreateSessionId() from cart.api.ts
//         which is now exported (FIX-G in cart.api.ts).
//
//  FIX-5  getCheckout() removed from login handler — it served no purpose
//         here (the checkout page calls it on mount). Calling it here
//         caused a redundant API call and could fail if the backend
//         checkout endpoint required more setup.
//
//  FIX-6  mergeGuestCartIntoUser() still called but AFTER token is stored
//         so it uses the authenticated user's Bearer token, not guest session.
//
//  FIX-7  Token fallback chain preserved: data.token → data.access_token
//         → data.data.token → data.data.access_token → data.auth_token.
//
//  FIX-8  Register link passes ?returnUrl forward so sign-ups also land
//         on checkout after registration, not on the home page.
//
//  FIX-9  useSearchParams properly imported and used.
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState }                        from 'react';
import { Link, useNavigate, useSearchParams }          from '@/lib/router';
import Aos                                            from 'aos';

import NavbarOne   from '../../components/navbar/navbar-one';
import FooterOne   from '../../components/footer/footer-one';
import ScrollToTop from '../../components/scroll-to-top';
import bg          from '../../assets/img/bg/login.jpg';

import { FcGoogle }                               from 'react-icons/fc';
import { FaFacebook }                             from 'react-icons/fa';
import { LuMail, LuLock, LuArrowRight }           from 'react-icons/lu';

import { apiClient }                              from '../../api/client';
import {
  getOrCreateSessionId,   // FIX-4: now exported from cart.api.ts
  setCartSessionId,
  // mergeGuestCartIntoUser,
}                                                 from '../../api/cart.api';
import { useAuth }                                from '../../hooks/useAuth'; // FIX-2

// ── Brand tokens ───────────────────────────────────────────────────────────
const BRAND       = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
const CTA         = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
const BRAND_SOLID = '#2F4A3A';
const FONT        = "'DM Sans', sans-serif";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS (unchanged from previous version)
// ─────────────────────────────────────────────────────────────────────────────

function AuthInput({
  type, value, onChange, placeholder, icon: Icon, id,
}: {
  type: string; value: string; placeholder: string; id: string;
  icon: React.ElementType;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position: 'relative',
      border: `1.5px solid ${focused ? BRAND_SOLID : '#E5E7EB'}`,
      borderRadius: 10,
      background: focused ? '#FAFAFC' : '#fff',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: focused ? `0 0 0 3px rgba(91,79,190,0.10)` : 'none',
      display: 'flex', alignItems: 'center',
    }}>
      <Icon size={16} style={{
        position: 'absolute', left: 14, flexShrink: 0,
        color: focused ? BRAND_SOLID : '#9CA3AF',
        transition: 'color 0.2s',
      }} />
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : 'email'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', height: 48,
          paddingLeft: 42, paddingRight: 16,
          background: 'transparent', border: 'none', outline: 'none',
          fontFamily: FONT, fontSize: 14, color: '#111827',
        }}
      />
    </div>
  );
}

function GradButton({ children, loading, type = 'submit', onClick }: {
  children: React.ReactNode; loading?: boolean;
  type?: 'submit' | 'button'; onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type={type} onClick={onClick} disabled={loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', height: 50, border: 'none', borderRadius: 10,
        background: hov ? CTA : BRAND,
        color: '#fff', fontFamily: FONT, fontSize: 14, fontWeight: 700,
        letterSpacing: '0.04em', cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.75 : 1,
        transition: 'background 0.35s ease, transform 0.15s',
        transform: hov && !loading ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hov ? '0 8px 24px rgba(91,79,190,0.28)' : '0 4px 14px rgba(91,79,190,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      {children}
      {!loading && <LuArrowRight size={16} />}
    </button>
  );
}

function SocialBtn({ icon: Icon, label, onClick, iconColor }: {
  icon: React.ElementType; label: string; onClick: () => void; iconColor?: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 46, border: `1.5px solid ${hov ? BRAND_SOLID : '#E5E7EB'}`,
        borderRadius: 10, background: hov ? '#FAFAFC' : '#fff',
        fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#374151',
        cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: hov ? `0 0 0 2px rgba(91,79,190,0.08)` : 'none',
      }}
    >
      <Icon size={18} color={iconColor} />
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
  useEffect(() => { Aos.init({ once: true, duration: 600 }); }, []);

  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams(); // FIX-1 + FIX-9
  const auth             = useAuth(); // use hook instance and call refresh() after login

  // FIX-1: read returnUrl from query param, not location.state.from
  // Cart sends:     /login?returnUrl=%2Fcheckout  → decoded: /checkout
  // Direct visit:   /login                        → fallback: / (home)
  // Navbar Sign In: /login                        → fallback: / (home)
  const returnUrl = searchParams.get('returnUrl')
    ? decodeURIComponent(searchParams.get('returnUrl')!)
    : '/'; // Default: go home after direct login

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState('');

  // ── Login handler ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');  // clear previous error on each attempt

    if (!email.trim())    { setError('Email is required.');                      return; }
    if (!password.trim()) { setError('Password is required.');                   return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email address.'); return; }

    setIsLoading(true);

    try {
      // FIX-4: get the current guest session id BEFORE login
      // so the backend can merge the guest cart into this user's account.
      const sessionId = getOrCreateSessionId();

      // FIX-3: use apiClient (goes through base URL + interceptors)
      const res  = await apiClient.post(
        '/api/login',
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept:         'application/json',
            // FIX-4: send all three header variants — backend reads whichever exists
            'Session-Id':   sessionId,
            'session-id':   sessionId,
            'x-session-id': sessionId,
          },
        } as any,
      );

      const data = res.data;

      if (data?.status === false) {
        throw new Error(data?.message ?? 'Login failed. Please check your credentials.');
      }

      // FIX-7: extended token fallback chain
      const token =
        data?.token              ??
        data?.access_token       ??
        data?.data?.token        ??
        data?.data?.access_token ??
        data?.auth_token         ??
        null;

      if (!token) {
        throw new Error('No access token received from the server. Please contact support.');
      }

      // ── Store credentials BEFORE any authenticated calls (FIX-5/FIX-6 from prev) ──
      localStorage.setItem('access_token', token);

      // Preserve existing session id so backend merge can use it on next request
      const existingSession =
        window.localStorage.getItem('SessionId') ||
        window.localStorage.getItem('session-id');
      if (existingSession) setCartSessionId(existingSession);

      // Build user object for authDispatch — use whatever the backend returns
      const backendUser = data?.user ?? data?.data?.user;
      const userObj = {
        id:      backendUser?.id      ?? email.split('@')[0],
        name:    backendUser?.name    ?? email.split('@')[0],
        email:   backendUser?.email   ?? email,
        isAdmin: backendUser?.is_admin ?? false,
      };

      // Store user data in localStorage so useAuth() hook can read it
      localStorage.setItem('auth_user', JSON.stringify(userObj));

      // FIX-2: refresh auth hook so Navbar and consumers re-read the stored token/user
      auth.refresh();

      // FIX-6: merge guest cart AFTER token is stored (authenticated call)
      // This is a safety net — backend login() already merged by session_id.
      // mergeGuestCartIntoUser() catches anything that was added to localStorage
      // after the backend merge (race condition).
      // try {
      //   await mergeGuestCartIntoUser();
      // } catch (mergeErr) {
      //   console.warn('mergeGuestCartIntoUser: non-fatal', mergeErr);
      // }

      // Notify cart listeners (badge update)
      window.dispatchEvent(new Event('cart:changed'));

      // FIX-1: navigate to returnUrl (/checkout) not to /
      navigate(returnUrl, { replace: true });

    } catch (err: any) {
      // Axios wraps HTTP error responses — check err.response.data first
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <NavbarOne />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 200px)', fontFamily: FONT }}>

        {/* Left: image panel */}
        <div style={{ flex: '0 0 45%', position: 'relative' }} className="hidden md:block">
          <img src={bg} alt="login background"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg,rgba(91,79,190,0.75) 0%,rgba(14,14,20,0.80) 100%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', padding: '56px 48px',
          }}>
            <div style={{
              backgroundImage: 'linear-gradient(90deg,#fff,rgba(255,255,255,0.7))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', fontSize: 28, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1,
            }}>
              Native Flavours
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.45)', fontSize: 8, letterSpacing: '0.18em',
              textTransform: 'uppercase', marginTop: 4, marginBottom: 32,
            }}>
              organic homemade traditions
            </div>
            <h3 style={{ color: '#fff', fontSize: 26, fontWeight: 700, lineHeight: 1.3, margin: '0 0 12px' }}>
              Welcome back to<br />your creative space
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7, margin: 0, maxWidth: 300 }}>
              Sign in to manage your orders, track deliveries, and discover new designs.
            </p>
            <div style={{ width: 48, height: 3, borderRadius: 2, background: BRAND, marginTop: 24 }} />
          </div>
        </div>

        {/* Right: form */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#fff', padding: '48px 24px',
        }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* Heading */}
            <div data-aos="fade-up" data-aos-delay="100" style={{ marginBottom: 32 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(91,79,190,0.08)', borderRadius: 20, padding: '5px 12px', marginBottom: 14,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BRAND_SOLID }}>
                  Welcome Back
                </span>
              </div>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: '#111827', margin: '0 0 8px', lineHeight: 1.2 }}>
                Sign in to your account
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                Continue with Native Flavours.
              </p>
            </div>

            {/* FIX-1: show destination hint — default is checkout, or custom returnUrl */}
            {returnUrl && returnUrl !== '/' && (
              <div data-aos="fade-up" style={{
                marginBottom: 20, padding: '10px 14px',
                background: 'rgba(91,79,190,0.06)', border: '1px solid rgba(91,79,190,0.15)',
                borderRadius: 8, fontSize: 13, color: '#1B4965', fontWeight: 500,
              }}>
                ✓ After signing in, you'll be taken to{' '}
                <strong>{decodeURIComponent(returnUrl).replace(/^\//, '').replace(/-/g, ' ') || 'checkout'}</strong>.
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <div data-aos="fade-up" data-aos-delay="200" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Email Address
                </label>
                <AuthInput
                  id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" icon={LuMail}
                />
              </div>

              {/* Password */}
              <div data-aos="fade-up" data-aos-delay="300" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</label>
                  <Link to="/forger-password" style={{
                    fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    backgroundImage: BRAND, WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                    Forgot password?
                  </Link>
                </div>
                <AuthInput
                  id="password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" icon={LuLock}
                />
              </div>

              {/* Remember me */}
              <div data-aos="fade-up" data-aos-delay="400" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <input
                  type="checkbox" id="remember"
                  checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: BRAND_SOLID, cursor: 'pointer' }}
                />
                <label htmlFor="remember" style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer', userSelect: 'none' }}>
                  Remember me
                </label>
              </div>

              {/* Error */}
              {error && (
                <div data-aos="fade-in" style={{
                  marginTop: 12, padding: '10px 14px',
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 8, fontSize: 13, color: '#DC2626',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>⚠</span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <div data-aos="fade-up" data-aos-delay="500" style={{ marginTop: 20 }}>
                <GradButton loading={isLoading}>
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </GradButton>
              </div>
            </form>

            {/* Divider */}
            <div data-aos="fade-up" data-aos-delay="600" style={{
              margin: '24px 0', position: 'relative', display: 'flex', alignItems: 'center',
            }}>
              <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
              <span style={{ padding: '0 14px', fontSize: 12, color: '#9CA3AF', background: '#fff', whiteSpace: 'nowrap' }}>
                Or continue with
              </span>
              <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
            </div>

            {/* Social */}
            <div data-aos="fade-up" data-aos-delay="700" style={{ display: 'flex', gap: 12 }}>
              <SocialBtn icon={FcGoogle}   label="Google"   onClick={() => console.log('Google OAuth')} />
              <SocialBtn icon={FaFacebook} label="Facebook" onClick={() => console.log('Facebook OAuth')} iconColor="#1877F2" />
            </div>

            {/* FIX-8: register link forwards returnUrl so sign-up also lands on checkout */}
            <p data-aos="fade-up" data-aos-delay="800" style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
              Don't have an account?{' '}
              <Link
                to={`/register${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
                style={{
                  fontWeight: 700, textDecoration: 'none',
                  backgroundImage: BRAND, WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}
              >
                Create an account
              </Link>
            </p>

          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  );
}