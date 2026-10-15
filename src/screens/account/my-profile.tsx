'use client'

// src/screens/MyProfile.tsx
import { Link }        from '@/lib/router'
import { useEffect, useState, useRef, useCallback } from 'react'
import Aos             from 'aos'

import NavbarOne   from '../../components/navbar/navbar-one'
import AccountTab  from '../../components/account/account-tab'
import FooterOne   from '../../components/footer/footer-one'
import ScrollToTop from '../../components/scroll-to-top'

import bg from '../../assets/img/shortcode/breadcumb.jpg'

import {
  LuMail, LuPhoneCall, LuPencil, LuCheck,
  LuX, LuUpload, LuExternalLink, LuLock, LuEye, LuEyeOff,
  LuUser, LuSave,
} from 'react-icons/lu'

import { apiClient } from '../../api/client'

// ─── Brand tokens ─────────────────────────────────────────────────
const BRAND = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)'
const FONT  = "'DM Sans', sans-serif"

// ─── Auth headers ─────────────────────────────────────────────────
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return {
    Accept:          'application/json',
    'Content-Type':  'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────
const GradText = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span
    className={className}
    style={{
      background: BRAND, WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      display: 'inline-block',
    }}
  >
    {children}
  </span>
)

const getInitials = (name: string) =>
  (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const isValidPhone = (p: string) => !p || /^[\+]?[\d\s\-\(\)]{7,15}$/.test(p)

// ─── Skeleton ─────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div style={{ height: 100, background: '#f3f4f6' }} />
      <div style={{ padding: '0 32px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: -40, marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: 16, background: '#e5e7eb', border: '4px solid white', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 28, width: 180, background: '#e5e7eb', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: 16, width: 120, background: '#f3f4f6', borderRadius: 4 }} />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 68, background: '#f9fafb', borderRadius: 12, marginBottom: 12 }} />
        ))}
      </div>
    </div>
  )
}

// ─── Toast notification ────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'ok' | 'err'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 20px', borderRadius: 12,
      background: type === 'ok' ? '#f0fdf4' : '#fff5f5',
      border: `1px solid ${type === 'ok' ? '#bbf7d0' : '#fecaca'}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      fontFamily: FONT, fontSize: 14, fontWeight: 600,
      color: type === 'ok' ? '#166534' : '#991b1b',
      animation: 'toastIn 0.3s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <span>{type === 'ok' ? '✅' : '⚠'}</span>
      {message}
      <button onClick={onClose} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: 16 }}>×</button>
    </div>
  )
}

// ─── Password field with toggle ────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void
  placeholder?: string; error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', height: 44, padding: '0 40px 0 14px',
            border: `1.5px solid ${error ? '#ef4444' : '#e5e7eb'}`,
            borderRadius: 10, fontSize: 14, fontFamily: FONT,
            outline: 'none', background: 'white', color: '#111827',
            boxSizing: 'border-box',
          }}
          onFocus={e => { if (!error) e.currentTarget.style.borderColor = '#2F4A3A' }}
          onBlur={e  => { if (!error) e.currentTarget.style.borderColor = '#e5e7eb' }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)', background: 'none', border: 'none',
            cursor: 'pointer', color: '#9ca3af', display: 'flex',
          }}
        >
          {show ? <LuEyeOff size={15} /> : <LuEye size={15} />}
        </button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontFamily: FONT }}>{error}</p>}
    </div>
  )
}

// ─── Profile types ─────────────────────────────────────────────────
interface ProfileData {
  user_id?: number
  name:     string
  email:    string
  phone:    string   // maps from API "mobile"
  bio:      string
  address:  string
  role:     string
  avatar:   string | null
}

const DEFAULT_PROFILE: ProfileData = {
  name: '', email: '', phone: '', bio: '', address: '', role: '', avatar: null,
}

export default function MyProfile() {
  const [profile,    setProfile]    = useState<ProfileData>(DEFAULT_PROFILE)
  const [editForm,   setEditForm]   = useState<ProfileData>(DEFAULT_PROFILE)
  const [isEditing,  setIsEditing]  = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [apiError,   setApiError]   = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileData, string>>>({})
  const [toast,      setToast]      = useState<{ message: string; type: 'ok' | 'err' } | null>(null)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showPwdSection, setShowPwdSection] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdErrors, setPwdErrors] = useState<{ current?: string; newPwd?: string; confirm?: string }>({})
  const [pwdSaving, setPwdSaving] = useState(false)

  const alive = useRef(true)

  // ── Load profile from API ──────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoading(true)
    setApiError(null)
    try {
      const res  = await apiClient.get<any>('/api/profile', { headers: authHeaders() } as any)
      const data = res.data?.data ?? res.data

      if (!data) throw new Error('Empty response from server')

      const fetched: ProfileData = {
        user_id: data.user_id,
        name:    String(data.name    ?? '').trim(),
        email:   String(data.email   ?? '').trim(),
        phone:   String(data.mobile  ?? '').trim(), // API field: "mobile"
        bio:     data.bio     ?? '',
        address: data.address ?? '',
        role:    data.role    ?? '',
        avatar:  data.avatar  ?? null,
      }

      if (alive.current) {
        setProfile(fetched)
        setEditForm(fetched)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to load profile.'
      if (alive.current) setApiError(msg)
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    alive.current = true
    Aos.init({ once: true, duration: 600, easing: 'ease-out-cubic', offset: 60 })
    loadProfile()
    return () => { alive.current = false }
  }, [loadProfile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const validateForm = (): boolean => {
    const errs: Partial<Record<keyof ProfileData, string>> = {}
    if (!editForm.name.trim())              errs.name  = 'Name is required'
    if (!isValidEmail(editForm.email))      errs.email = 'Invalid email address'
    if (editForm.phone && !isValidPhone(editForm.phone)) errs.phone = 'Invalid phone number'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save profile → Updates all data ────────────────────────
  const handleSave = async () => {
    if (!validateForm()) return
    setSaving(true)
    setApiError(null)

    try {
      const payload: Record<string, string> = {
        name:   editForm.name.trim(),
        email:  editForm.email.trim(),
        mobile: editForm.phone.trim(), // Map phone -> mobile
      }

      const res = await apiClient.post('/api/profile/update', payload, {
        headers: authHeaders(),
      } as any)

      // Merge response data with current state
      const updated = res.data?.data
      const merged: ProfileData = {
        ...editForm,
        name:  updated?.name   ?? editForm.name,
        email: updated?.email  ?? editForm.email,
        phone: updated?.mobile ?? editForm.phone,
      }

      if (avatarPreview) merged.avatar = avatarPreview

      if (alive.current) {
        setProfile(merged)
        setEditForm(merged)
        setIsEditing(false)
        setAvatarPreview(null)
        setToast({ message: 'Profile updated successfully!', type: 'ok' })
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Update failed. Please try again.'
      if (alive.current) {
        setApiError(msg)
        setToast({ message: msg, type: 'err' })
      }
    } finally {
      if (alive.current) setSaving(false)
    }
  }

  const handleEdit = () => {
    setEditForm({ ...profile })
    setFieldErrors({})
    setApiError(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setAvatarPreview(null)
    setFieldErrors({})
    setApiError(null)
  }

  const validatePassword = (): boolean => {
    const errs: { current?: string; newPwd?: string; confirm?: string } = {}
    if (!pwdForm.current)               errs.current = 'Current password is required'
    if (pwdForm.newPwd.length < 6)      errs.newPwd  = 'Password must be at least 6 characters'
    if (pwdForm.newPwd !== pwdForm.confirm) errs.confirm = 'Passwords do not match'
    setPwdErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChangePassword = async () => {
    if (!validatePassword()) return
    setPwdSaving(true)
    try {
      await apiClient.post(
        '/api/profile/change-password',
        {
          current_password:      pwdForm.current,
          new_password:          pwdForm.newPwd,
          new_password_confirmation: pwdForm.confirm,
        },
        { headers: authHeaders() } as any
      )
      if (alive.current) {
        setPwdForm({ current: '', newPwd: '', confirm: '' })
        setPwdErrors({})
        setShowPwdSection(false)
        setToast({ message: 'Password changed successfully!', type: 'ok' })
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Password change failed.'
      if (alive.current) {
        setPwdErrors({ current: msg })
        setToast({ message: msg, type: 'err' })
      }
    } finally {
      if (alive.current) setPwdSaving(false)
    }
  }

  const displayAvatar = avatarPreview || profile.avatar
  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', height: 44, padding: '0 14px',
    border: `1.5px solid ${hasError ? '#ef4444' : '#e5e7eb'}`,
    borderRadius: 10, fontSize: 14, fontFamily: FONT, outline: 'none',
    background: 'white', color: '#111827', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  })

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .mp-input:focus { border-color: #2F4A3A !important; box-shadow: 0 0 0 3px rgba(91,79,190,0.1); }
        .mp-card { transition: box-shadow 0.2s ease; }
        .mp-card:hover { box-shadow: 0 4px 16px rgba(91,79,190,0.08); }
        .mp-btn-hover:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      <NavbarOne />

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Breadcrumb */}
      <div
        className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="text-center w-full">
          <h2 className="text-white md:text-[40px] font-normal leading-none text-center" style={{ fontFamily: FONT }}>
            My Profile
          </h2>
          <ul className="flex items-center justify-center gap-[10px] text-base md:text-lg leading-none font-normal text-white mt-3 md:mt-4">
            <li><Link to="/">Home</Link></li>
            <li>/</li>
            <li><GradText>Profile</GradText></li>
          </ul>
        </div>
      </div>

      <div className="s-py-100">
        <div className="container-fluid">
          <div className="max-w-[1720px] mx-auto flex items-start gap-8 md:gap-12 2xl:gap-20 flex-col md:flex-row my-profile-navtab">
            <div className="w-full md:w-[200px] lg:w-[260px] flex-none" data-aos="fade-up" data-aos-delay="60">
              <AccountTab />
            </div>

            <div className="w-full md:flex-1" data-aos="fade-up" data-aos-delay="120">
              {loading && <ProfileSkeleton />}

              {!loading && apiError && !isEditing && (
                <div style={{
                  background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px',
                  fontSize: 14, color: '#dc2626', fontFamily: FONT, marginBottom: 16, display: 'flex', justifyContent:'space-between'
                }}>
                  <span>⚠ {apiError}</span>
                  <button onClick={loadProfile} style={{background:'#dc2626', color:'white', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:FONT}}>Retry</button>
                </div>
              )}

              {!loading && (
                <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* ── BANNER / SHADE ─────────────────────────────────── */}
                  <div style={{ height: 100, position: 'relative', background: 'linear-gradient' }}>
                    {/* Pattern */}
                    <div style={{
                      position: 'absolute', inset: 0, opacity: 0.3,
                      backgroundImage: 'radial-gradient(#2F4A3A22 1px, transparent 10px)', backgroundSize: '24px 24px',
                    }} />
                    
                    {/* User ID Badge */}
                    {profile.user_id && (
                      <div style={{
                        position: 'absolute', top: 12, left: 16, background: 'white',
                        borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                        color: '#9ca3af', fontFamily: FONT, letterSpacing: '0.06em', border: '1px solid #f0f0f0',
                      }}>
                        ID #{profile.user_id}
                      </div>
                    )}

                    {/* ── EDIT BUTTON (Above Shade / Top Right) ───────────────── */}
                    {!isEditing && (
                      <button
                        onClick={handleEdit}
                        className="mp-btn-hover"
                        style={{
                          position: 'absolute', top: 12, right: 16,
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          border: '1px solid white', color: '#2F4A3A',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                          zIndex: 10,
                        }}
                      >
                        <LuPencil size={13} /> Edit Profile
                      </button>
                    )}
                  </div>

                  <div className="px-6 sm:px-8 pb-8">

                    {/* ── Avatar + Name Row ─────────────────────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: -40, marginBottom: 20 }}>
                      
                      {/* Avatar */}
                      <div
                        style={{
                          position: 'relative', width: 80, height: 80, borderRadius: 16,
                          overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                          flexShrink: 0, cursor: isEditing ? 'pointer' : 'default',
                        }}
                        onClick={() => isEditing && fileInputRef.current?.click()}
                      >
                        {displayAvatar ? (
                          <img src={displayAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%', background: BRAND,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, fontWeight: 800, color: 'white', fontFamily: FONT,
                          }}>
                            {getInitials(profile.name)}
                          </div>
                        )}
                        {isEditing && (
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <LuUpload color="white" size={18} />
                          </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                      </div>

                      {/* Name + Email (Clearly visible) */}
                      <div style={{ flex: 1, marginTop: 0 }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input
                              className="mp-input"
                              type="text"
                              value={editForm.name}
                              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                              placeholder="Full name"
                              style={{ ...inputStyle(!!fieldErrors.name), fontSize: 20, fontWeight: 800 }}
                            />
                            {fieldErrors.name && <p style={{ fontSize: 11, color: '#ef4444', margin: 0, fontFamily: FONT }}>{fieldErrors.name}</p>}
                          </div>
                        ) : (
                          <>
                            <h3 style={{ 
                              fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#111827', 
                              lineHeight: 1.2, margin: '0 0 6px 0', fontFamily: FONT 
                            }}>
                              {profile.name || 'User'}
                            </h3>
                            <p style={{
                              fontSize: 14, fontWeight: 600, color: '#2F4A3A', margin: 0, fontFamily: FONT,
                            }}>
                              {profile.email}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Save / Cancel Actions (Only in Edit Mode) */}
                    {isEditing && (
                      <div style={{ display: 'flex', gap: 10, marginBottom: 20, justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="mp-btn-hover"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 20px', borderRadius: 10,
                            background: BRAND, color: 'white',
                            fontSize: 13, fontWeight: 700, border: 'none', 
                            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT,
                          }}
                        >
                          {saving
                            ? <><span style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                            : <><LuSave size={14} /> Save Changes</>
                          }
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 16px', borderRadius: 10,
                            border: '1.5px solid #e5e7eb', background: 'white',
                            color: '#6b7280', fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', fontFamily: FONT,
                          }}
                        >
                          <LuX size={14} /> Cancel
                        </button>
                      </div>
                    )}

                    {/* API error inside edit mode */}
                    {isEditing && apiError && (
                      <div style={{
                        background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10,
                        padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 20, fontFamily: FONT,
                      }}>
                        ⚠ {apiError}
                      </div>
                    )}

                    <div style={{ height: 1, background: '#f3f4f6', marginBottom: 20 }} />

                    {/* ── Contact fields ──────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 14, marginBottom: 20 }}>

                      {/* Phone */}
                      <div className="mp-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 12, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f3f1ff,#fff1f3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <LuPhoneCall size={16} style={{ color: '#2F4A3A' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', fontFamily: FONT }}>Phone / Mobile</span>
                          {isEditing ? (
                            <div style={{ marginTop: 6 }}>
                              <input
                                className="mp-input"
                                type="tel"
                                value={editForm.phone}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                placeholder="e.g. +91 98765 43210"
                                style={inputStyle(!!fieldErrors.phone)}
                              />
                              {fieldErrors.phone && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontFamily: FONT }}>{fieldErrors.phone}</p>}
                            </div>
                          ) : (
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '4px 0 0', fontFamily: FONT }}>
                              {profile.phone || <span style={{ color: '#d1d5db', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="mp-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 12, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#fff1f3,#fff7f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <LuMail size={16} style={{ color: '#E8314A' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', fontFamily: FONT }}>Email</span>
                          {isEditing ? (
                            <div style={{ marginTop: 6 }}>
                              <input
                                className="mp-input"
                                type="email"
                                value={editForm.email}
                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                placeholder="you@example.com"
                                style={inputStyle(!!fieldErrors.email)}
                              />
                              {fieldErrors.email && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontFamily: FONT }}>{fieldErrors.email}</p>}
                            </div>
                          ) : (
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '4px 0 0', fontFamily: FONT, wordBreak: 'break-all' }}>
                              {profile.email || <span style={{ color: '#d1d5db', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Member since (read-only) */}
                      <div className="mp-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 12, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f0f9ff,#f0fdf4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <LuUser size={16} style={{ color: '#0891b2' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', fontFamily: FONT }}>Member Since</span>
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '4px 0 0', fontFamily: FONT }}>
                            {profile.user_id
                              ? new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                              : '—'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ height: 1, background: '#f3f4f6', marginBottom: 20 }} />

                    {/* ── Change Password section ──────────────────────── */}
                    <div style={{ marginBottom: 20 }}>
                      <button
                        onClick={() => setShowPwdSection(s => !s)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 18px', borderRadius: 10,
                          border: '1.5px solid #e5e7eb', background: showPwdSection ? '#f3f1ff' : 'white',
                          color: showPwdSection ? '#2F4A3A' : '#374151',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                          transition: 'all 0.2s',
                        }}
                      >
                        <LuLock size={14} />
                        {showPwdSection ? 'Hide Password Change' : 'Change Password'}
                      </button>

                      {showPwdSection && (
                        <div style={{
                          marginTop: 16, padding: 20, borderRadius: 12,
                          border: '1.5px solid #e5e7eb', background: '#fafafa',
                          display: 'flex', flexDirection: 'column', gap: 14,
                        }}>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', fontFamily: FONT, display: 'block', marginBottom: 6 }}>
                              Current Password <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <PasswordInput
                              value={pwdForm.current}
                              onChange={v => setPwdForm(f => ({ ...f, current: v }))}
                              placeholder="Enter current password"
                              error={pwdErrors.current}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', fontFamily: FONT, display: 'block', marginBottom: 6 }}>
                              New Password <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <PasswordInput
                              value={pwdForm.newPwd}
                              onChange={v => setPwdForm(f => ({ ...f, newPwd: v }))}
                              placeholder="Min 6 characters"
                              error={pwdErrors.newPwd}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', fontFamily: FONT, display: 'block', marginBottom: 6 }}>
                              Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <PasswordInput
                              value={pwdForm.confirm}
                              onChange={v => setPwdForm(f => ({ ...f, confirm: v }))}
                              placeholder="Repeat new password"
                              error={pwdErrors.confirm}
                            />
                          </div>
                          <button
                            onClick={handleChangePassword}
                            disabled={pwdSaving}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '11px 22px', borderRadius: 10, alignSelf: 'flex-start',
                              background: BRAND, color: 'white',
                              fontSize: 13, fontWeight: 700, border: 'none',
                              cursor: pwdSaving ? 'not-allowed' : 'pointer', fontFamily: FONT,
                            }}
                          >
                            {pwdSaving
                              ? <><span style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Updating…</>
                              : <><LuCheck size={14} /> Update Password</>
                            }
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ height: 1, background: '#f3f4f6', marginBottom: 20 }} />

                    {/* ── Quick Links ──────────────────────────────────── */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {[
                        { label: 'Order History',     href: '/order-history' },
                        { label: 'My Wishlist',       href: '/wishlist' },
                        { label: 'My Cart',           href: '/cart' },
                        { label: 'Manage Addresses',  href: '/account/addresses' },
                      ].map(({ label, href }) => (
                        <Link
                          key={href}
                          to={href}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 16px', borderRadius: 10,
                            border: '1.5px solid #e5e7eb', background: 'white',
                            color: '#374151', fontSize: 13, fontWeight: 600,
                            textDecoration: 'none', fontFamily: FONT,
                            transition: 'all 0.18s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2F4A3A'; e.currentTarget.style.color = '#2F4A3A' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151' }}
                        >
                          {label}
                          <LuExternalLink size={12} style={{ opacity: 0.5 }} />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}