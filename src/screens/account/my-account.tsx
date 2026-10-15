'use client'

import { Link } from '@/lib/router';
import AccountTab from '../../components/account/account-tab';
import NavbarOne from '../../components/navbar/navbar-one';
import FooterOne from '../../components/footer/footer-one';
import ScrollToTop from '../../components/scroll-to-top';
import bg from '../../assets/img/shortcode/breadcumb.jpg';
import {
  LuMail, LuMapPin, LuPhoneCall, LuPackage,
  LuClock, LuCircle, LuExternalLink, LuEye, LuDownload, LuRefreshCw
} from 'react-icons/lu';
import { cartData } from '../../data/data';
import { useEffect, useState } from 'react';
import Aos from 'aos';

const BRAND = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
const CTA   = 'linear-gradient(90deg,#2563EB,#06B6D4,#22C55E)';

function GradText({ children, grad = BRAND, className = '' }: {
  children: React.ReactNode; grad?: string; className?: string
}) {
  return (
    <span className={className} style={{
      background: grad,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'inline-block'
    }}>
      {children}
    </span>
  );
}

interface CartData { 
  image: string; 
  tag: string; 
  name: string; 
  price: string; 
  status: string 
}

const STATUS_CONFIG = {
  Completed: { 
    grad: 'linear-gradient(90deg,#22C55E,#16a34a)', 
    icon: <LuCircle size={12}/>, 
    bg: '#f0fdf4', 
    text: '#16a34a' 
  },
  Pending:   { 
    grad: 'linear-gradient(90deg,#F97316,#EC991D)', 
    icon: <LuClock size={12}/>, 
    bg: '#fff7ed', 
    text: '#ea580c' 
  },
  Cancel:    { 
    grad: 'linear-gradient(90deg,#E8314A,#dc2626)', 
    icon: <LuCircle size={12}/>, 
    bg: '#fef2f2', 
    text: '#dc2626' 
  },
};

const STATS = [
  { label: 'Total Orders', value: '24', key: 'all',       icon: <LuPackage size={20}/>, grad: BRAND },
  { label: 'Completed',    value: '18', key: 'Completed', icon: <LuCircle size={20}/>, grad: CTA   },
  { label: 'Pending',      value: '4',  key: 'Pending',   icon: <LuClock size={20}/>, grad: 'linear-gradient(90deg,#F97316,#EC991D)' },
  { label: 'Cancelled',    value: '2',  key: 'Cancel',    icon: <LuCircle size={20}/>, grad: 'linear-gradient(90deg,#E8314A,#dc2626)' },
];

const CONTACT_ITEMS = [
  { icon: <LuPhoneCall size={16}/>, value: '+111 - (1234 5678 99)' },
  { icon: <LuMail size={16}/>,      value: 'furnixar123@gmail.com' },
  { icon: <LuMapPin size={16}/>,    value: '23/A Lake Side, New Arizona, USA' },
];

export default function MyAccount() {
  useEffect(() => { 
    Aos.init({ once: true, duration: 600 }) 
  }, []);

  const [activeTab, setActiveTab] = useState('All');
  const orders = cartData as CartData[];

  const filtered = orders.filter(o =>
    activeTab === 'All' || o.status === activeTab
  );

  return (
    <>
      <NavbarOne />

      {/* Breadcrumb */}
      <div className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage: `url(${bg})` }}>
        <div className="text-center w-full">
          <h2 className="text-white md:text-[40px] font-normal leading-none">My Account</h2>
          <ul className="flex items-center justify-center gap-[10px] text-base md:text-lg leading-none font-normal text-white mt-3 md:mt-4">
            <li><Link to="/">Home</Link></li>
            <li>/</li>
            <li><GradText>Account</GradText></li>
          </ul>
        </div>
      </div>

      <div className="s-py-100">
        <div className="container-fluid">
          <div className="max-w-[1720px] mx-auto flex items-start gap-8 md:gap-12 2xl:gap-20 flex-col md:flex-row my-profile-navtab">

            {/* Sidebar */}
            <div className="w-full md:w-[200px] lg:w-[240px] flex-none" data-aos="fade-up" data-aos-delay="100">
              <AccountTab />
            </div>

            {/* Main Content */}
            <div className="w-full md:flex-1 space-y-5" data-aos="fade-up" data-aos-delay="200">

              {/* Profile Summary Card */}
              <div className="w-full max-w-[951px] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Gradient Banner */}
                <div className="h-[100px] w-full relative"
                  style={{ }}>
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{ backgroundImage: 'radial-gradient(#2F4A3A22 1px, transparent 10px)', backgroundSize: '24px 24px' }}
                  />
                </div>

                <div className="px-6 sm:px-8 pb-7 -mt-9">
                  {/* Avatar + Name */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div className="flex items-end gap-4">
                      <div className="w-[72px] h-[72px] rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-[22px] font-extrabold text-white flex-shrink-0"
                        style={{ background: BRAND }}>
                        KR
                      </div>
                      <div className="pb-1">
                        <h3 className="text-[20px] font-extrabold text-gray-200 leading-tight">
                          Kathlene Roser
                        </h3>
                        <GradText className="text-[13px] font-bold">Product Designer</GradText>
                      </div>
                    </div>

                    <Link to="/account/edit"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-bold self-start sm:self-auto hover:opacity-90 transition"
                      style={{ background: BRAND }}>
                      Edit Profile <LuExternalLink size={13}/>
                    </Link>
                  </div>

                  {/* Gradient Divider */}
                  <div className="h-px w-full mb-5"
                    style={{ background: 'linear-gradient(90deg,#2F4A3A33,#E8314A22,transparent)' }} />

                  {/* Bio */}
                  <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
                    Passionate about creating beautiful, functional spaces. Lover of canvas paintings, ambient lighting, and everything that makes a space feel alive.
                  </p>

                  {/* Contact Info */}
                  <div className="grid sm:grid-cols-3 gap-3">
                    {CONTACT_ITEMS.map(({ icon, value }, index) => (
                      <div key={index} 
                        className="flex  items-center gap-3 px-4 py-3.5 rounded-xl bg-green-600">
                        <span className="flex-shrink-0 opacity-70 text-white">{icon}</span>
                        <span className="text-[13px] font-medium text-white leading-snug truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="w-full max-w-[951px] grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map(({ label, value, key, icon, grad }) => (
                  <button 
                    key={key}
                    onClick={() => setActiveTab(key === 'all' ? 'All' : key)}
                    className="bg-white rounded-2xl border p-4 shadow-sm flex items-center gap-3 text-left transition hover:shadow-md hover:-translate-y-0.5"
                    style={{ borderColor: '#f0f0f4' }}
                  >
                    <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: grad }}>
                      {icon}
                    </div>
                    <div>
                      <div className="text-[24px] font-extrabold leading-none">
                        <GradText grad={grad}>{value}</GradText>
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 mt-0.5 tracking-widest uppercase">{label}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Update Profile Form */}
              <div className="w-full max-w-[951px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-[17px] font-extrabold text-gray-800">Update Profile</h4>
                    <p className="text-[12px] text-gray-400 mt-0.5">Keep your information up to date</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                    style={{ background: BRAND }}>
                    <LuPhoneCall size={15}/>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column */}
                    <div className="grid gap-5 w-full lg:w-1/2">
                      {[
                        { label: 'Full Name',    type: 'text',  ph: 'Enter your full name'   },
                        { label: 'Designation',  type: 'text',  ph: 'e.g. Product Designer'  },
                        { label: 'Phone No.',    type: 'tel',   ph: 'Your phone number'       },
                        { label: 'Email',        type: 'email', ph: 'Your email address'      },
                      ].map(({ label, type, ph }) => (
                        <div key={label}>
                          <label className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2 block">{label}</label>
                          <input 
                            type={type} 
                            placeholder={ph}
                            className="w-full h-12 rounded-xl px-4 text-[14px] outline-none transition border border-gray-300 focus:border-[#2F4A3A]" 
                          />
                        </div>
                      ))}
                    </div>

                    {/* Right Column */}
                    <div className="grid gap-5 w-full lg:w-1/2">
                      <div>
                        <label className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2 block">Location</label>
                        <input 
                          type="text" 
                          placeholder="City, Country"
                          className="w-full h-12 rounded-xl px-4 text-[14px] outline-none transition border border-gray-300 focus:border-[#2F4A3A]" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2 block">Bio</label>
                        <textarea 
                          placeholder="Write your bio..." 
                          rows={4}
                          className="w-full rounded-xl px-4 py-3 text-[14px] outline-none transition border border-gray-300 focus:border-[#2F4A3A] resize-none" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-2 block">Web / Social</label>
                        <input 
                          type="text" 
                          placeholder="https://yourwebsite.com"
                          className="w-full h-12 rounded-xl px-4 text-[14px] outline-none transition border border-gray-300 focus:border-[#2F4A3A]" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button 
                      className="px-8 py-3 rounded-xl text-white text-[14px] font-bold hover:opacity-90 transition"
                      style={{ background: BRAND }}
                    >
                      Save Changes
                    </button>
                    <button className="px-6 py-3 rounded-xl border border-gray-200 text-[14px] font-semibold text-gray-500 hover:bg-gray-50 transition">
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Order History Table */}
             {/* Order History Table - Fixed */}
<div className="w-full max-w-[951px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
  <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
    <div>
      <h4 className="text-[16px] font-extrabold text-gray-800">
        Order History
        <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: '#f3f1ff', color: '#2F4A3A' }}>
          {orders.length}
        </span>
      </h4>
      <p className="text-[12px] text-gray-400 mt-0.5">Your recent purchases</p>
    </div>

    {/* Filter Tabs */}
    <div className="flex gap-2">
      {['All','Completed','Pending','Cancel'].map(tab => (
        <button 
          key={tab} 
          onClick={() => setActiveTab(tab)}
          className="px-3 py-1.5 rounded-full text-[11px] font-bold transition"
          style={activeTab === tab 
            ? { background: BRAND, color: '#fff' } 
            : { background: '#f3f4f6', color: '#6b7280' }}
        >
          {tab}
        </button>
      ))}
    </div>
  </div>

  {/* Table Header - Hidden on mobile, visible from md up */}
  <div className="hidden md:grid grid-cols-[minmax(200px,1fr)_100px_140px_120px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/80">
    <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Product</span>
    <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Price</span>
    <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Status</span>
    <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Actions</span>
  </div>

  {/* Order Rows */}
  <div className="divide-y divide-gray-100">
    {filtered.map((item, idx) => {
      const st = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
      return (
        <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition">
          {/* Desktop/Tablet Layout - one line */}
          <div className="hidden md:grid grid-cols-[minmax(200px,1fr)_100px_140px_120px] gap-4 items-center">
            {/* Product */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 block mb-0.5">{item.tag}</span>
                <h5 className="text-sm font-semibold text-gray-800 truncate">{item.name}</h5>
              </div>
            </div>

            {/* Price */}
            <div>
              <GradText className="text-base font-extrabold">{item.price}</GradText>
            </div>

            {/* Status */}
            {st && (
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap"
                  style={{ background: st.bg, color: st.text, border: `1px solid ${st.text}22` }}>
                  {st.icon} {item.status}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button title="View" className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600 transition">
                <LuEye size={13} />
              </button>
              <button title="Download" className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition">
                <LuDownload size={13} />
              </button>
              {item.status === 'Pending' && (
                <button title="Track" className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600 transition">
                  <LuRefreshCw size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Layout (below md) - inline row with all info */}
          <div className="flex flex-col gap-3 md:hidden">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">{item.tag}</span>
                <h5 className="text-sm font-semibold text-gray-800">{item.name}</h5>
              </div>
              <GradText className="text-base font-extrabold">{item.price}</GradText>
            </div>
            <div className="flex items-center justify-between">
              {st && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: st.bg, color: st.text }}>
                  {st.icon} {item.status}
                </span>
              )}
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500">
                  <LuEye size={13} />
                </button>
                <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500">
                  <LuDownload size={13} />
                </button>
                {item.status === 'Pending' && (
                  <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500">
                    <LuRefreshCw size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>

  {/* Empty state */}
  {filtered.length === 0 && (
    <div className="text-center py-12 text-gray-400 text-sm">
      No orders found for <strong className="text-gray-500">{activeTab}</strong> status.
    </div>
  )}
</div>

            </div>
          </div>
        </div>
      </div>

      <FooterOne />
      <ScrollToTop />
    </>
  );
}