'use client'

// src/screens/auth/Register.tsx
// ══════════════════════════════════════════════════════════════════════
//  ALL LOGIC UNCHANGED EXCEPT:
//  · Added mobile number field (state, validation, API call)
//  · Mobile validation: 10 digits, numeric only
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { Link, useNavigate } from '@/lib/router';
import Aos from "aos";

import NavbarOne from "../../components/navbar/navbar-one";
import FooterOne from "../../components/footer/footer-one";
import ScrollToTop from "../../components/scroll-to-top";
import bg from '../../assets/img/bg/register.jpg';

import { register as apiRegister } from '../../api/auth.api';

import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { LuUser, LuMail, LuLock, LuArrowRight, LuShieldCheck, LuSmartphone } from "react-icons/lu";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BRAND       = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
const CTA         = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
const BRAND_SOLID = '#2F4A3A'
const FONT        = "'DM Sans', sans-serif"

// ── Styled input (same as Login) ──────────────────────────────────────────────
function AuthInput({
  type, value, onChange, placeholder, icon: Icon, id,
}: {
  type: string; value: string; placeholder: string; id: string;
  icon: React.ElementType;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [focused, setFocused] = useState(false)
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
        position: 'absolute', left: 14,
        color: focused ? BRAND_SOLID : '#9CA3AF',
        transition: 'color 0.2s', flexShrink: 0,
      }} />
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', height: 48, paddingLeft: 42, paddingRight: 16,
          background: 'transparent', border: 'none', outline: 'none',
          fontFamily: FONT, fontSize: 14, color: '#111827',
        }}
      />
    </div>
  )
}

// ── Gradient submit button ────────────────────────────────────────────────────
function GradButton({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="submit"
      disabled={loading}
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
  )
}

// ── Social button ─────────────────────────────────────────────────────────────
function SocialBtn({ icon: Icon, label, onClick, iconColor }: {
  icon: React.ElementType; label: string; onClick: () => void; iconColor?: string;
}) {
  const [hov, setHov] = useState(false)
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
  )
}

export default function Register() {
  useEffect(() => {
    Aos.init({ once: true, duration: 600 });
  }, []);

  // ── STATE (added mobile) ───────────────────────────────────────────────────
  const navigate = useNavigate()
  const [fullName,    setFullName]    = useState("")
  const [email,       setEmail]       = useState("")
  const [mobile,      setMobile]      = useState("")   // <-- new
  const [password,    setPassword]    = useState("")
  const [agreeTerms,  setAgreeTerms]  = useState(false)
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState("")

  // ── HANDLER (added mobile validation) ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!fullName.trim())  { setError("Full name is required"); return }
    if (!email.trim())     { setError("Email is required"); return }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Please enter a valid email address"); return }
    if (!mobile.trim())    { setError("Mobile number is required"); return }
    if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) { setError("Please enter a valid 10-digit mobile number"); return }
    if (!password.trim())  { setError("Password is required"); return }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return }
    if (!agreeTerms)       { setError("You must agree to the Terms & Conditions"); return }
    setIsLoading(true)
    try {
      await apiRegister({ 
        name: fullName, 
        email, 
        password, 
        mobile: mobile.replace(/\D/g, '')  // send only digits
      })
      navigate('/login')
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <NavbarOne />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 200px)', fontFamily: FONT }}>

        {/* ── Left: Image with overlay (unchanged) ── */}
        <div style={{ flex: '0 0 45%', position: 'relative' }} className="hidden md:block md:w-[45%]">
          <img src={bg} alt="register" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(37,99,235,0.72) 0%,rgba(14,14,20,0.82) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '56px 48px' }}>
            <div style={{ backgroundImage: 'linear-gradient(90deg,#fff,rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: 28, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>Infinity</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4, marginBottom: 32 }}>printing &amp; signage</div>
            <h3 style={{ color: '#fff', fontSize: 26, fontWeight: 700, lineHeight: 1.3, margin: '0 0 12px' }}>Join thousands of<br />happy customers</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7, margin: 0, maxWidth: 300 }}>Create your account to access exclusive deals, track orders, and personalise your design experience.</p>
            <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
              {['Free delivery on first order', 'Exclusive member discounts', 'Real-time order tracking'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: CTA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LuShieldCheck size={11} color="#fff" />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ width: 48, height: 3, borderRadius: 2, background: CTA, marginTop: 20 }} />
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '48px 24px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* Heading (unchanged) */}
            <div data-aos="fade-up" data-aos-delay="100" style={{ marginBottom: 28 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.08)', borderRadius: 20, padding: '5px 12px', marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: CTA }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563EB' }}>New Account</span>
              </div>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: '#111827', margin: '0 0 8px', lineHeight: 1.2 }}>Create your account</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Join us to start shopping and get exclusive offers.</p>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Full Name */}
              <div data-aos="fade-up" data-aos-delay="200" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Full Name</label>
                <AuthInput id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" icon={LuUser} />
              </div>

              {/* Email */}
              <div data-aos="fade-up" data-aos-delay="300" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email Address</label>
                <AuthInput id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={LuMail} />
              </div>

              {/* ── NEW: Mobile Number ── */}
              <div data-aos="fade-up" data-aos-delay="350" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Mobile Number</label>
                <AuthInput id="mobile" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="9876543210" icon={LuSmartphone} />
              </div>

              {/* Password */}
              <div data-aos="fade-up" data-aos-delay="400" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
                <AuthInput id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" icon={LuLock} />
                {password.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: password.length >= i * 3 ? (i <= 1 ? '#E8314A' : i <= 2 ? '#F97316' : i <= 3 ? '#EAB308' : '#22C55E') : '#E5E7EB', transition: 'background 0.3s' }} />
                    ))}
                    <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 4, flexShrink: 0, alignSelf: 'center' }}>
                      {password.length < 3 ? 'Weak' : password.length < 6 ? 'Fair' : password.length < 9 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              {/* Terms checkbox (unchanged) */}
              <div data-aos="fade-up" data-aos-delay="500" style={{ marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} style={{ width: 15, height: 15, marginTop: 2, accentColor: BRAND_SOLID, cursor: 'pointer', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                    I agree to the{' '}
                    <Link to="/terms-and-conditions" style={{ fontWeight: 600, textDecoration: 'none', backgroundImage: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Terms & Conditions</Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" style={{ fontWeight: 600, textDecoration: 'none', backgroundImage: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Privacy Policy</Link>
                  </span>
                </label>
              </div>

              {/* Error (unchanged) */}
              {error && (
                <div data-aos="fade-up" style={{ marginTop: 10, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15 }}>⚠</span> {error}
                </div>
              )}

              {/* Submit (unchanged) */}
              <div data-aos="fade-up" data-aos-delay="600" style={{ marginTop: 20 }}>
                <GradButton loading={isLoading}>{isLoading ? 'Creating account…' : 'Create Account'}</GradButton>
              </div>
            </form>

            {/* Divider & Social (unchanged) */}
            <div data-aos="fade-up" data-aos-delay="700" style={{ margin: '22px 0', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
              <span style={{ padding: '0 14px', fontSize: 12, color: '#9CA3AF', background: '#fff', whiteSpace: 'nowrap' }}>Or sign up with</span>
              <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
            </div>

            <div data-aos="fade-up" data-aos-delay="700" style={{ display: 'flex', gap: 12 }}>
              <SocialBtn icon={FcGoogle} label="Google" onClick={() => console.log("Google signup")} />
              <SocialBtn icon={FaFacebook} label="Facebook" onClick={() => console.log("Facebook signup")} iconColor="#1877F2" />
            </div>

            {/* Login link (unchanged) */}
            <p data-aos="fade-up" data-aos-delay="800" style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ fontWeight: 700, textDecoration: 'none', backgroundImage: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  )
}