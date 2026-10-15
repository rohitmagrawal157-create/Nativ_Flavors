'use client'

import SiteLogo from '@/components/brand/site-logo'
import farmBg from '@/assets/img/KrishiX_App-01.jpg'

// src/components/footer/footer-one.tsx
// =============================================================================
//  FooterOne — Infinity Print & Signage Industries (PROFESSIONAL EDITION)
//  Complete brand redesign using the Infinity logo colour system
//
//  BRAND COLOURS:
//  Clay Forest #2F4A3A, Turmeric #C7922E, River Stone #6E736F, Milk #F6F3EE, Seed Husk #5A4634
//
//  ENHANCEMENTS:
//  · Trust badges (ISO, quality, made in India)
//  · Subtle entrance animations (fade-up, slide)
//  · Better responsive breakpoints
//  · Interactive hover states with scale/shadows
//  · Industry awards / certifications strip
//  · No internal back-to-top button (handled by global ScrollToTop)
// =============================================================================

import { useState, useEffect } from 'react'
import { Link }                from '@/lib/router'
import {
  FaFacebookF, FaInstagram,
  FaLinkedin,  FaYoutube,  FaPinterest,
} from 'react-icons/fa'
import { LuMail, LuPhone, LuSend, LuMapPin } from 'react-icons/lu'

const CATEGORIES = [
  { name: 'Ghee & Dairy',       href: '/shop-v1?category=Ghee%20%26%20Dairy' },
  { name: 'Atta & Grains',      href: '/shop-v1?category=Atta%20%26%20Grains' },
  { name: 'Natural Sweeteners', href: '/shop-v1?category=Natural%20Sweeteners' },
  { name: 'Snacks',             href: '/shop-v1?category=Snacks' },
  { name: 'Shop All',           href: '/shop' },
]

const SOCIAL = [
  { Icon: FaFacebookF, href: 'https://facebook.com',  label: 'Facebook',  color: '#1877F2' },
  { Icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram', color: '#E1306C' },
  { Icon: FaPinterest, href: 'https://pinterest.com', label: 'Pinterest', color: '#E60023' },
  { Icon: FaYoutube,   href: 'https://youtube.com',   label: 'YouTube',   color: '#FF0000' },
  { Icon: FaLinkedin,  href: 'https://linkedin.com',  label: 'LinkedIn',  color: '#0A66C2' },
]

const PAYMENT = ['Visa', 'Mastercard', 'RuPay', 'UPI', 'Net Banking']

// ─────────────────────────────────────────────────────────────────────────────
//  INJECTED CSS (enhanced with animations, no back-to-top)
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
.fo-farm {
  position: relative;
  color: #2F4A3A;
  background-color: #F6F3EE;
  background-image:
    linear-gradient(180deg, rgba(246,243,238,0.94) 0%, rgba(246,243,238,0.78) 36%, rgba(246,243,238,0.22) 58%, rgba(246,243,238,0) 78%),
    url("__FARM__");
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: cover;
  font-family: 'Poppins', system-ui, sans-serif;
  min-height: 620px;
}
.fo-farm-inner {
  width: min(1100px, calc(100% - 32px));
  margin: 0 auto;
  padding: 48px 0 150px;
  position: relative;
  z-index: 1;
}
.fo-farm-top {
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr) 260px;
  gap: 32px;
  align-items: start;
}
.fo-farm-logo { display: flex; align-items: flex-start; }
.fo-farm-news { text-align: center; }
.fo-farm-news h2 {
  margin: 0;
  color: #2F4A3A;
  font-family: 'Poppins', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(22px, 2.4vw, 28px);
  letter-spacing: 0.04em;
  line-height: 1.3;
  text-transform: uppercase;
}
.fo-farm-news p { margin: 10px auto 18px; max-width: 420px; color: #4A4F4B; font-size: 15px; line-height: 1.6; }
.fo-farm .fo-nl-wrap {
  max-width: 420px; margin: 0 auto; background: #FFFFFF;
  border: 1px solid #2F4A3A; border-radius: 10px;
}
.fo-farm .fo-nl-input { color: #2F4A3A; height: 48px; }
.fo-farm .fo-nl-input::placeholder { color: #6E736F; }
.fo-farm button.fo-nl-btn { background: #2F4A3A; color: #F6F3EE; height: 48px; border-radius: 0; }
.fo-farm-contact { font-size: 14px; line-height: 1.55; color: #2F4A3A; }
.fo-farm-contact strong { display: block; margin-bottom: 8px; letter-spacing: 0.04em; font-size: 13px; }
.fo-farm-contact a { color: #2F4A3A; text-decoration: none; }
.fo-farm-contact p { margin: 0 0 8px; display: flex; gap: 8px; align-items: flex-start; }
.fo-farm-links {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 18px;
  margin: 28px 0 18px; padding-top: 8px;
}
.fo-farm-links a {
  color: #2F4A3A; text-decoration: none; font-size: 15px; font-weight: 500; min-height: 44px;
  display: inline-flex; align-items: center;
}
.fo-farm-links a:hover { text-decoration: underline; text-underline-offset: 4px; }
.fo-farm-links a:focus-visible, .fo-farm a:focus-visible, .fo-farm button:focus-visible {
  outline: 3px solid #C7922E; outline-offset: 3px;
}
.fo-farm-social { display: flex; justify-content: center; gap: 10px; margin-bottom: 16px; }
.fo-farm .fo-soc { color: #2F4A3A; border-color: rgba(47,74,58,0.25); background: rgba(255,255,255,0.7); }
.fo-farm-pay {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 4px 0 18px;
}
.fo-farm-pay span {
  border: 1px solid rgba(47,74,58,0.22);
  background: rgba(255,255,255,0.72);
  color: #2F4A3A;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}
.fo-farm-copy {
  margin: 0; text-align: center; color: #2F4A3A; font-size: 13px;
  border-top: 1px solid rgba(47,74,58,0.2); padding-top: 14px;
}
@media (max-width: 1100px) {
  .fo-farm-inner { width: min(1100px, calc(100% - 96px)); }
}
@media (max-width: 800px) {
  .fo-farm-top { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .fo-farm-contact { text-align: left; }
  .fo-farm-contact p { justify-content: flex-start; }
  .fo-farm-inner { width: min(1100px, calc(100% - 32px)); padding-bottom: 120px; }
}

/* Column headings */
.fo-head {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.16em;
  color: #fff; display: block;
  padding-bottom: 12px; margin-bottom: 18px;
  position: relative;
}
.fo-head::after {
  content: '';
  position: absolute; bottom: 0; left: 0;
  width: 32px; height: 2px;
  background: #C7922E;
  border-radius: 1px;
  transition: width 0.25s ease;
}
.fo-head:hover::after { width: 48px; }

/* Nav links */
.fo-link {
  color: rgba(255,255,255,0.52);
  font-size: 13.5px; line-height: 1.5;
  text-decoration: none; display: flex; align-items: center; gap: 8px;
  transition: color 0.18s ease, padding-left 0.18s ease;
}
.fo-link:hover {
  color: #fff;
  padding-left: 4px;
}
.fo-link .fo-dot {
  width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
  transition: transform 0.18s ease;
}
.fo-link:hover .fo-dot { transform: scale(1.5); }

/* Social buttons */
.fo-soc {
  width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.14);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.52); text-decoration: none;
  transition: all 0.22s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  flex-shrink: 0;
}
.fo-soc:hover {
  border-color: transparent;
  color: #fff;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 14px rgba(0,0,0,0.2);
}

/* Newsletter input */
.fo-nl-wrap {
  display: flex; align-items: stretch;
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 4px; overflow: hidden;
  background: rgba(255,255,255,0.06);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.fo-nl-wrap:focus-within {
  border-color: #C7922E;
  box-shadow: 0 0 0 2px rgba(199,146,46,0.35);
}
.fo-nl-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #fff; font-size: 13px; padding: 0 14px; height: 46px;
  min-width: 0; font-family: inherit;
}
.fo-nl-input::placeholder { color: rgba(255,255,255,0.32); }
button.fo-nl-btn {
  height: 46px; padding: 0 20px;
  background: #5A4634;
  border: none; color: #F6F3EE; font-size: 13px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; gap: 7px;
  white-space: nowrap; letter-spacing: 0.06em;
  font-family: inherit; flex-shrink: 0;
  transition: opacity 0.18s, transform 0.1s;
}
button.fo-nl-btn:hover     { opacity: 0.88; transform: scale(0.98); }
button.fo-nl-btn:disabled  { opacity: 0.55; cursor: not-allowed; transform: none; }

/* Payment pills */
.fo-pay {
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 4px; padding: 5px 13px;
  font-size: 11px; font-weight: 600;
  color: rgba(255,255,255,0.52);
  background: rgba(255,255,255,0.05);
  transition: all 0.18s;
  white-space: nowrap;
}
.fo-pay:hover {
  background: #5A4634;
  color: #F6F3EE; border-color: transparent;
  transform: translateY(-1px);
}

/* USP items */
.fo-usp {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 24px;
  border-right: 1px solid rgba(255,255,255,0.08);
  flex: 1; min-width: 180px;
  transition: background 0.25s ease;
}
.fo-usp:last-child { border-right: none; }
.fo-usp:hover { background: rgba(199,146,46,0.12); }

/* Legal links */
.fo-legal {
  font-size: 12px; color: rgba(255,255,255,0.38);
  text-decoration: none; transition: color 0.18s;
}
.fo-legal:hover { color: #fff; }

/* Gradient text */
.fo-brand-text {
  color: #C7922E;
}

/* Animations */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.fo-animate {
  animation: fadeUp 0.6s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .fo-link, .fo-soc, .fo-nl-btn, .fo-pay, .fo-usp,
  .fo-head::after { transition: none; }
  .fo-animate { animation: none; opacity: 1; transform: none; }
}
`

// ─────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Newsletter() {
  const [email,   setEmail]   = useState('')
  const [status,  setStatus]  = useState<'idle'|'sending'|'done'>('idle')
  const [touched, setTouched] = useState(false)
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!isValid) return
    setStatus('sending')
    setTimeout(() => { setStatus('done'); setEmail('') }, 1000)
  }

  if (status === 'done') {
    return (
      <div className="fo-animate" style={{
        background: 'rgba(199,146,46,0.16)',
        border: '1px solid rgba(199,146,46,0.45)',
        borderRadius: 6, padding: '12px 16px',
        color: '#2F4A3A', fontSize: 13.5, fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: '#2F4A3A', color: '#F6F3EE',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 12,
        }}>✓</span>
        You're on the list. We'll write when a new batch is packed.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="fo-nl-wrap">
        <input
          type="email"
          className="fo-nl-input"
          placeholder="Your email"
          value={email}
          onChange={e => { setEmail(e.target.value); setTouched(false) }}
          aria-label="Email for newsletter"
        />
        <button type="submit" className="fo-nl-btn" disabled={status==='sending'} aria-label={status==='sending' ? 'Sending' : 'Subscribe'}>
          <LuSend size={16}/>
        </button>
      </div>
      {touched && !isValid && (
        <p style={{fontSize:13,color:'#5A4634',marginTop:8}}>
          Please enter a valid email address.
        </p>
      )}
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN FOOTER
// ─────────────────────────────────────────────────────────────────────────────
export default function FooterOne() {
  useEffect(() => {
    const ID = 'fo-v6-styles'
    if (!document.getElementById(ID)) {
      const s = document.createElement('style')
      s.id          = ID
      s.textContent = CSS.replace('__FARM__', String(farmBg).replace(/"/g, ''))
      document.head.appendChild(s)
    }
  }, [])

  return (
    <footer
      className="fo-farm"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(246,243,238,0.94) 0%, rgba(246,243,238,0.78) 36%, rgba(246,243,238,0.22) 58%, rgba(246,243,238,0) 78%), url("${String(farmBg).replace(/"/g, '')}")`,
      }}
    >
      <div className="fo-farm-inner">
        <div className="fo-farm-top">
          <Link to="/" aria-label="Native Flavours home" className="fo-farm-logo">
            <SiteLogo size={140} />
          </Link>

          <div className="fo-farm-news">
            <h2>Stay in touch</h2>
            <p>A short note when a new batch is packed. No daily offers.</p>
            <Newsletter />
          </div>

          <div className="fo-farm-contact">
            <strong>NATIVE FLAVOURS</strong>
            <p><LuMail size={16} aria-hidden /> <a href="mailto:info@infinity.in">info@infinity.in</a></p>
            <p><LuPhone size={16} aria-hidden /> <a href="tel:+919903504754">+91 99035 04754</a></p>
            <p><LuMapPin size={16} aria-hidden /> Mumbai, Maharashtra, India</p>
          </div>
        </div>

        <nav className="fo-farm-links" aria-label="Footer">
          {CATEGORIES.map((item) => (
            <Link key={item.name} to={item.href}>{item.name}</Link>
          ))}
          <Link to="/about">Our Story</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/faq">FAQs</Link>
        </nav>

        <div className="fo-farm-pay" aria-label="Payment methods">
          {PAYMENT.map((name) => <span key={name}>{name}</span>)}
        </div>

        <div className="fo-farm-social">
          {SOCIAL.map(({ Icon, href, label }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="fo-soc">
              <Icon size={14} />
            </a>
          ))}
        </div>

        <nav className="fo-farm-links" aria-label="Policies">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-and-conditions">Terms</Link>
          <Link to="/shipping-policy">Shipping</Link>
          <Link to="/return-policy">Returns</Link>
        </nav>

        <p className="fo-farm-copy">© {new Date().getFullYear()} Native Flavours. All rights reserved.</p>
      </div>
    </footer>
  )
}
