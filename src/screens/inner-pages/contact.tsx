'use client'

// src/screens/inner-pages/contact.tsx

import { useEffect, useState } from "react";
import { Link }                from '@/lib/router';

import NavbarOne   from "../../components/navbar/navbar-one";
import FooterOne   from "../../components/footer/footer-one";
import ScrollToTop from "../../components/scroll-to-top";

import bg          from '../../assets/img/shortcode/breadcumb.jpg';
import about       from '../../assets/img/svg/about.svg';
import Aos         from "aos";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BRAND     = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
// const BRAND_S   = '#2F4A3A';
const FONT      = "'DM Sans', sans-serif";

function GradText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={className} style={{
      background: BRAND, WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block',
    }}>{children}</span>
  );
}

const inputCls = `w-full h-12 md:h-14 border border-[#E3E5E6] rounded-xl px-4 py-3 text-[14px] text-gray-900 bg-white outline-none transition focus:border-[#2F4A3A] focus:shadow-[0_0_0_3px_rgba(91,79,190,0.10)] placeholder-gray-300 dark:bg-dark-secondary dark:text-white`;

// Info cards along the bottom of the form column
const INFO_CARDS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    label: 'Visit Us',
    value: 'Aurangabad, Maharashtra, India',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.38 2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    label: 'Call Us',
    value: '+91 97669 78839',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    label: 'Email Us',
    value: 'customers@nativeflavoursindia.com',
  },
];

const SUBJECTS = [
  'General Inquiry',
  'Product Question',
  'Bulk Order',
  'Payment Problem',
  'Delivery Issue',
  'Partnership',
];

export default function Contact() {

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', subject: SUBJECTS[0], message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Aos.init({ once: true, duration: 600 });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) return;
    setSubmitting(true);
    // Simulate a short delay (replace with real API call)
    await new Promise(r => setTimeout(r, 1000));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <>
      <NavbarOne />

      {/* Breadcrumb */}
      <div
        className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage: `url(${bg})`, fontFamily: FONT }}
      >
        <div className="text-center w-full">
          <h2 className="text-white md:text-[40px] font-normal leading-none text-center">Contact Us</h2>
          <ul className="flex items-center justify-center gap-[10px] text-base md:text-lg leading-none font-normal text-white mt-3 md:mt-4">
            <li><Link to="/">Home</Link></li>
            <li>/</li>
            <li><GradText>Contact</GradText></li>
          </ul>
        </div>
      </div>

      {/* ── Main section ─────────────────────────────────────────────────────── */}
      <div className="s-pb-100 s-pt-100" style={{ fontFamily: FONT }}>
        <div className="container-fluid">
          <div className="max-w-[1720px] mx-auto flex justify-between gap-12 flex-col lg:flex-row">

            {/* Left — contact image + info cards */}
            <div className="max-w-[860px] w-full hidden lg:flex flex-col gap-6" data-aos="zoom-in">

              {/* Image */}
              <div className="rounded-2xl overflow-hidden flex-1 min-h-[420px] relative">
                <img
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=860&h=580&fit=crop&auto=format"
                  alt="Native Flavours"
                />
                {/* Gradient overlay text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="text-white font-bold text-xl leading-snug">
                    Native Flavours
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    Ghee, grains, honey, pickles, and other foods from the shop.
                  </p>
                </div>
              </div>

              {/* Info cards row */}
              <div className="grid grid-cols-3 gap-4">
                {INFO_CARDS.map((card, i) => (
                  <div key={i} className="bg-white dark:bg-dark-secondary border border-[#ececec] dark:border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2F4A3A]/40 hover:shadow-sm transition-all duration-200">
                    {/* Icon with gradient background */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: BRAND }}>
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">{card.label}</p>
                      <p className="text-[14px] font-semibold text-purple-700">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — form */}
            <div className="max-w-[640px] w-full mx-auto lg:mx-0">
              <div data-aos="fade-up">
                <img src={about} className="size-16" alt="" />
                <h3 className="leading-none font-medium mt-3 md:mt-6 text-2xl md:text-3xl">
                  Get in <GradText>Touch</GradText>
                </h3>
                {/* Brand underline */}
                <div style={{ width: 40, height: 3, borderRadius: 2, marginTop: 10, background: BRAND }} />
                <p className="max-w-[474px] mt-4 text-[15px] leading-relaxed">
                  We're here to address your inquiries, feedback, and partnership opportunities
                  promptly and effectively.
                </p>
              </div>

              {submitted ? (
                /* Success state */
                <div
                  className="mt-8 p-8 rounded-2xl text-center"
                  data-aos="fade-up"
                  style={{ background: 'linear-gradient(135deg,#f0f0fc,#fff5f0)' }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4"
                    style={{ background: BRAND }}>
                    ✓
                  </div>
                  <h4 className="font-bold text-xl text-gray-900 mb-2">Message Sent!</h4>
                  <p className="text-gray-500 text-[14px]">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ fullName: '', email: '', phone: '', subject: SUBJECTS[0], message: '' }); }}
                    className="mt-5 px-6 py-2.5 rounded-xl text-white text-[14px] font-bold hover:opacity-90 transition"
                    style={{ background: BRAND }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8" data-aos="fade-up" data-aos-delay="100" noValidate>
                  <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 dark:text-white mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="fullName"
                        type="text"
                        required
                        value={form.fullName}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder="Rajesh Kumar"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 dark:text-white mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder="you@example.com"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 dark:text-white mb-1.5">
                        Phone No.
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder="+91 97669 78839"
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 dark:text-white mb-1.5">
                        Subject
                      </label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className={inputCls}
                      >
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mt-5">
                    <label className="block text-[13px] font-semibold text-gray-700 dark:text-white mb-1.5">
                      Your Message
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      className={`${inputCls} h-auto py-3 resize-y`}
                      placeholder="Describe your project or inquiry in detail…"
                    />
                  </div>

                  {/* Submit button */}
                  <div className="mt-6 flex items-center gap-4 flex-wrap">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-white text-[14px] font-bold tracking-wide transition hover:opacity-90 disabled:opacity-60"
                      style={{ background: BRAND }}
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                          Send Message
                        </>
                      )}
                    </button>

                    {/* Mobile info cards */}
                    <p className="text-[12px] text-gray-400 lg:hidden">
                      Or call us: <span style={{ background: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700 }}>+91 97669 78839</span>
                    </p>
                  </div>
                </form>
              )}

              {/* Mobile info cards */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                {INFO_CARDS.map((card, i) => (
                  <div key={i} className="bg-white dark:bg-dark-secondary border border-[#ececec] dark:border-[#2a2a2a] rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: BRAND }}>
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
                      <p className="text-[13px] font-semibold text-gray-800 dark:text-white">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────────────────────────────── */}
      <div className="s-pb-100" data-aos="fade-up">
        <div className="container-fluid">
          <div className="max-w-[1720px] mx-auto rounded-2xl overflow-hidden shadow-sm border border-[#ececec]">
            <iframe
              className="w-full h-[400px] md:h-[500px]"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d59738.73438406882!2d75.2664641!3d19.8761851!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdba2fb9ec7f6b3%3A0x2d25b6c7f7d25cd1!2sAurangabad%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Native Flavours location"
            />
          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  );
}