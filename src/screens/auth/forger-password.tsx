'use client'

// src/screens/auth/ForgotPassword.tsx
// ══════════════════════════════════════════════════════════════════════
//  ALL LOGIC UNCHANGED:
//  · handleSubmit validation (email required, email format)
//  · setTimeout 1500ms simulate API, setSuccess(true)
//  · Auto redirect to /login after 3000ms
//  · email / isLoading / error / success state
//
//  CHANGED: Visual design updated to brand gradient system
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@/lib/router';
import Aos from 'aos';

import NavbarOne from '../../components/navbar/navbar-one';
import FooterOne from '../../components/footer/footer-one';
import ScrollToTop from '../../components/scroll-to-top';
import bg from '../../assets/img/bg/forget-pass.jpg';

import { LuMail, LuArrowLeft, LuArrowRight, LuSend } from 'react-icons/lu';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BRAND       = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
const CTA         = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
const BRAND_SOLID = '#2F4A3A'
const FONT        = "'DM Sans', sans-serif"

// ── Styled input ──────────────────────────────────────────────────────────────
function AuthInput({
  type, value, onChange, placeholder, icon: Icon, id, disabled,
}: {
  type: string; value: string; placeholder: string; id: string; disabled?: boolean;
  icon: React.ElementType;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      position: 'relative',
      border: `1.5px solid ${focused ? BRAND_SOLID : '#E5E7EB'}`,
      borderRadius: 10,
      background: disabled ? '#F9FAFB' : focused ? '#FAFAFC' : '#fff',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: focused ? `0 0 0 3px rgba(91,79,190,0.10)` : 'none',
      display: 'flex', alignItems: 'center',
      opacity: disabled ? 0.6 : 1,
    }}>
      <Icon size={16} style={{
        position: 'absolute', left: 14,
        color: focused ? BRAND_SOLID : '#9CA3AF',
        transition: 'color 0.2s', flexShrink: 0,
      }} />
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', height: 48, paddingLeft: 42, paddingRight: 16,
          background: 'transparent', border: 'none', outline: 'none',
          fontFamily: FONT, fontSize: 14, color: '#111827',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  )
}

// ── Gradient button ───────────────────────────────────────────────────────────
function GradButton({ children, loading, grad = BRAND }: {
  children: React.ReactNode; loading?: boolean; grad?: string;
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="submit" disabled={loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', height: 50, border: 'none', borderRadius: 10,
        background: hov ? (grad === BRAND ? CTA : BRAND) : grad,
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
    </button>
  )
}

export default function ForgotPassword() {
  useEffect(() => {
    Aos.init({ once: true, duration: 600 });
  }, []);

  // ── STATE (unchanged) ──────────────────────────────────────────────────────
  const navigate = useNavigate()
  const [email,     setEmail]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [countdown, setCountdown] = useState(3)

  // ── HANDLER (unchanged) ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (!email.trim())                         { setError('Email is required'); return }
    if (!/^\S+@\S+\.\S+$/.test(email))        { setError('Please enter a valid email address'); return }
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSuccess(true)
      // countdown + redirect (unchanged logic)
      let count = 3
      const interval = setInterval(() => {
        count -= 1
        setCountdown(count)
        if (count <= 0) { clearInterval(interval); navigate('/login') }
      }, 1000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <NavbarOne />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 200px)', fontFamily: FONT }}>

        {/* ── Left: Image ── */}
        <div style={{ flex: '0 0 45%', position: 'relative' }} className="hidden md:block md:w-[45%]">
          <img
            src={bg} alt="forgot password"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Warm gradient — matches "reset/recovery" urgency */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg,rgba(232,49,74,0.68) 0%,rgba(14,14,20,0.82) 100%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', padding: '56px 48px',
          }}>
            <div style={{
              backgroundImage: 'linear-gradient(90deg,#fff,rgba(255,255,255,0.7))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', fontSize: 28, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1,
            }}>Native Flavours</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4, marginBottom: 32 }}>
              organic homemade traditions
            </div>
            <h3 style={{ color: '#fff', fontSize: 26, fontWeight: 700, lineHeight: 1.3, margin: '0 0 12px' }}>
              We've got your<br />back
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7, margin: 0, maxWidth: 300 }}>
              Don't worry — it happens to everyone. Enter your email and we'll send you a secure reset link within seconds.
            </p>
            <div style={{ width: 48, height: 3, borderRadius: 2, background: 'linear-gradient(90deg,#E8314A,#F97316)', marginTop: 24 }} />
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#fff', padding: '48px 24px',
        }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* Back to login link */}
            <div data-aos="fade-up" style={{ marginBottom: 24 }}>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#6B7280',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = BRAND_SOLID)}
                onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
              >
                <LuArrowLeft size={14} />
                Back to Login
              </Link>
            </div>

            {/* Heading */}
            <div data-aos="fade-up" data-aos-delay="100" style={{ marginBottom: 28 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(232,49,74,0.08)', borderRadius: 20,
                padding: '5px 12px', marginBottom: 14,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(90deg,#E8314A,#F97316)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E8314A' }}>
                  Password Reset
                </span>
              </div>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: '#111827', margin: '0 0 8px', lineHeight: 1.2 }}>
                Forgot your password?
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* ── Success state ── */}
            {success ? (
              <div data-aos="fade-up" style={{
                padding: 24, borderRadius: 12,
                background: 'linear-gradient(135deg,rgba(34,197,94,0.06),rgba(6,182,212,0.06))',
                border: '1.5px solid rgba(34,197,94,0.2)',
              }}>
                {/* Animated check */}
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: CTA, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, boxShadow: '0 6px 18px rgba(34,197,94,0.25)',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h4 style={{ color: '#111827', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>
                  Reset link sent!
                </h4>
                <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 6px', lineHeight: 1.6 }}>
                  We've sent a password reset link to{' '}
                  <strong style={{ color: '#111827' }}>{email}</strong>.
                  Please check your inbox and spam folder.
                </p>
                <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 16px' }}>
                  Redirecting to login in <strong style={{ color: '#22C55E' }}>{countdown}s</strong>…
                </p>
                <Link to="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  backgroundImage: CTA, WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  Go to login now <LuArrowRight size={13} style={{ color: '#22C55E' }} />
                </Link>
              </div>
            ) : (
              /* ── Form state ── */
              <form onSubmit={handleSubmit}>

                <div data-aos="fade-up" data-aos-delay="200" style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <AuthInput
                    id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" icon={LuMail}
                    disabled={isLoading}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div data-aos="fade-up" style={{
                    marginBottom: 14, padding: '10px 14px',
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: 8, fontSize: 13, color: '#DC2626',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ fontSize: 15 }}>⚠</span> {error}
                  </div>
                )}

                {/* Submit */}
                <div data-aos="fade-up" data-aos-delay="300" style={{ marginTop: 6 }}>
                  <GradButton loading={isLoading}>
                    {isLoading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                          </path>
                        </svg>
                        Sending link…
                      </>
                    ) : (
                      <><LuSend size={15} /> Send Reset Link</>
                    )}
                  </GradButton>
                </div>

                {/* Info tip */}
                <div data-aos="fade-up" data-aos-delay="400" style={{
                  marginTop: 16, padding: '10px 14px',
                  background: 'rgba(91,79,190,0.05)', border: '1px solid rgba(91,79,190,0.12)',
                  borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <LuMail size={14} style={{ color: BRAND_SOLID, marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.55 }}>
                    The reset link will expire in <strong style={{ color: '#374151' }}>15 minutes</strong>.
                    If you don't receive an email, check your spam folder.
                  </p>
                </div>

                {/* Register link */}
                <p data-aos="fade-up" data-aos-delay="500" style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
                  Remember your password?{' '}
                  <Link to="/login" style={{
                    fontWeight: 700, textDecoration: 'none',
                    backgroundImage: BRAND, WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                    Back to Login
                  </Link>
                </p>

              </form>
            )}
          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  )
}