'use client'

// src/screens/account/OrderHistory.tsx
// ══════════════════════════════════════════════════════════════════════
//  FIXED:
//  1. fetchMyOrders: reads response.data.data (not .orders)
//  2. Field mapping: order_id → id, total_amount → total, date → createdAt
//  3. Order detail modal with full product list from /api/order-details/:id
//  4. Status normalisation: 'cancelled' (backend) → 'Cancelled' (UI)
//  5. Price display: ₹ (INR) instead of $
// ══════════════════════════════════════════════════════════════════════

import { Link } from '@/lib/router';
import { useEffect, useState } from 'react';
import NavbarOne from '../../components/navbar/navbar-one';
import bg from '../../assets/img/shortcode/breadcumb.jpg';
import AccountTab from '../../components/account/account-tab';
import FooterOne from '../../components/footer/footer-one';
import ScrollToTop from '../../components/scroll-to-top';
import { fetchMyOrders, fetchOrderDetails } from '../../api/orders.api';
import type { Order, OrderDetailItem } from '../../api/orders.api';
import Aos from 'aos';
import {
  LuPackage, LuCircle, LuClock,
   LuEye, LuDownload, LuRefreshCw, LuFilter, LuLoader, LuX,
} from 'react-icons/lu';

// ── Brand tokens ───────────────────────────────────────────────────────
const BRAND = 'linear-gradient(135deg,#1E3328 0%,#2F4A3A 55%,#4E6B58 100%)';
const CTA   = 'linear-gradient(90deg,#2563EB,#06B6D4,#22C55E)';
const PRI   = '#2F4A3A';

function fmtINR(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function GradText({ children, grad = BRAND, className = '' }: {
  children: React.ReactNode; grad?: string; className?: string;
}) {
  return (
    <span className={className} style={{
      background: grad,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

// ── Status config ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
  Completed: { icon: <LuCircle size={12}/>, bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  Pending:   { icon: <LuClock  size={12}/>, bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  Confirmed: { icon: <LuClock  size={12}/>, bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  Shipped:   { icon: <LuClock  size={12}/>, bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  Cancelled: { icon: <LuCircle size={12}/>, bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};

const STATS = [
  { label: 'Total Orders', key: 'all',       icon: <LuPackage size={18}/>, grad: BRAND },
  { label: 'Completed',    key: 'Completed',  icon: <LuCircle  size={18}/>, grad: CTA   },
  { label: 'Pending',      key: 'Pending',    icon: <LuClock   size={18}/>, grad: 'linear-gradient(90deg,#F97316,#EC991D)' },
  { label: 'Cancelled',    key: 'Cancelled',  icon: <LuCircle  size={18}/>, grad: 'linear-gradient(90deg,#E8314A,#dc2626)' },
];

// ── Order Detail Modal ─────────────────────────────────────────────────
function OrderDetailModal({
  order,
  items,
  loading,
  onClose,
}: {
  order: Order;
  items: OrderDetailItem[];
  loading: boolean;
  onClose: () => void;
}) {
  const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['Pending'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[580px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-[16px] font-extrabold text-gray-900">
              Order <GradText>#{order.id}</GradText>
            </h3>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {st && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
                style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                {st.icon} {order.status}
              </span>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-gray-50 transition">
              <LuX size={15} />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <LuLoader size={28} className="animate-spin" style={{ color: PRI }} />
              <p className="text-[13px] text-gray-400 font-medium">Loading order details…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">📦</div>
              <p className="text-[14px] font-semibold text-gray-600">No items found for this order.</p>
            </div>
          ) : (
            <>
              {/* Product list */}
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-white">
                      {item.image ? (
                        <img src={item.image} alt={item.productName}
                          className="w-full h-full object-cover"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <LuPackage size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 truncate">{item.productName}</p>
                      {item.productDetails && (
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{item.productDetails}</p>
                      )}
                      <p className="text-[12px] text-gray-500 mt-1">Qty: <span className="font-bold">{item.quantity}</span></p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <GradText className="text-[14px] font-extrabold">{fmtINR(item.price)}</GradText>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-gray-400">{fmtINR(item.price)} × {item.quantity}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order summary */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-[13px] text-gray-500">
                  <span>Payment Status</span>
                  <span className="font-semibold text-gray-700 capitalize">{order.paymentStatus}</span>
                </div>
                <div className="flex justify-between text-[15px] font-extrabold">
                  <span className="text-gray-900">Order Total</span>
                  <GradText>{fmtINR(order.total)}</GradText>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition">
            Close
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
            style={{ background: BRAND }}>
            <LuDownload size={14} /> Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function OrderHistory() {
  useEffect(() => { Aos.init({ once: true, duration: 600 }); }, []);

  const [search,    setSearch]    = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Modal state
  const [modalOrder,   setModalOrder]   = useState<Order | null>(null);
  const [modalItems,   setModalItems]   = useState<OrderDetailItem[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // ── Fetch orders ────────────────────────────────────────────────────
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  // ── Open order detail modal ─────────────────────────────────────────
  const openOrderDetail = async (order: Order) => {
    setModalOrder(order);
    setModalItems([]);
    setModalLoading(true);
    try {
      const items = await fetchOrderDetails(order.id);
      setModalItems(items);
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      setModalItems([]);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOrder(null);
    setModalItems([]);
    setModalLoading(false);
  };

  // ── Filtering ───────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchTab    = activeTab === 'All' || o.status === activeTab;
    const matchSearch =
      String(o.id).toLowerCase().includes(search.toLowerCase()) ||
      o.products.some(p => p.productName.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  const countFor = (key: string) =>
    key === 'all' ? orders.length : orders.filter(o => o.status === key).length;

  // ── Helpers ─────────────────────────────────────────────────────────
  function getFirstImage(order: Order): string {
    return order.products?.[0]?.image ?? '';
  }
  function getFirstProductName(order: Order): string {
    return order.products?.[0]?.productName ?? 'Order';
  }

  return (
    <>
      <NavbarOne />

      {/* Order Detail Modal */}
      {modalOrder && (
        <OrderDetailModal
          order={modalOrder}
          items={modalItems}
          loading={modalLoading}
          onClose={closeModal}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-4 flex-wrap bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70"
        style={{ backgroundImage: `url(${bg})` }}>
        <div className="text-center w-full">
          <h2 className="text-white md:text-[40px] font-normal leading-none">Order History</h2>
          <ul className="flex items-center justify-center gap-[10px] text-base md:text-lg leading-none font-normal text-white mt-3 md:mt-4">
            <li><Link to="/">Home</Link></li>
            <li>/</li>
            <li><Link to="/account">Account</Link></li>
            <li>/</li>
            <li><GradText>Orders</GradText></li>
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

              {/* Stats Cards */}
              <div className="w-full max-w-[951px] grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map(({ label, key, icon, grad }) => (
                  <button key={key}
                    onClick={() => setActiveTab(key === 'all' ? 'All' : key)}
                    className="bg-white rounded-2xl border p-4 shadow-sm flex items-center gap-3 text-left transition hover:shadow-md hover:-translate-y-0.5"
                    style={{
                      borderColor: (activeTab === key || (activeTab === 'All' && key === 'all'))
                        ? '#2F4A3A55' : '#f0f0f4',
                      boxShadow: (activeTab === key || (activeTab === 'All' && key === 'all'))
                        ? '0 0 0 2px #2F4A3A22' : undefined,
                    }}>
                    <div className="w-[44px] h-[44px] rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: grad }}>{icon}</div>
                    <div>
                      <div className="text-[22px] font-extrabold leading-none">
                        <GradText grad={grad}>{countFor(key)}</GradText>
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 mt-0.5 tracking-widest uppercase">{label}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Order Table Card */}
              <div className="w-full max-w-[951px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Header */}
                <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-[16px] font-extrabold text-gray-800 flex items-center gap-2">
                      All Orders
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#f3f1ff', color: PRI }}>
                        {filtered.length}
                      </span>
                    </h4>
                    <p className="text-[12px] text-gray-400 mt-0.5">Track and manage your purchases</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      {/* <LuSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /> */}
                      <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search orders…"
                        className="h-10 pl-9 pr-4 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-[#2F4A3A] transition bg-gray-50 w-full sm:w-[200px]" />
                    </div>
                    <button onClick={loadOrders}
                      title="Refresh"
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#2F4A3A] hover:text-[#2F4A3A] transition">
                      <LuRefreshCw size={14} />
                    </button>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="px-6 py-4 border-b border-gray-100 flex gap-2 flex-wrap">
                  {['All', 'Completed', 'Pending', 'Cancelled'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className="px-4 py-1.5 rounded-full text-[12px] font-bold transition"
                      style={activeTab === tab
                        ? { background: BRAND, color: '#fff' }
                        : { background: '#f3f4f6', color: '#6b7280' }}>
                      {tab}{' '}
                      <span className="opacity-60 ml-0.5">
                        {tab === 'All' ? orders.length : orders.filter(o => o.status === tab).length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Table header (md+) */}
                <div className="hidden md:grid grid-cols-[minmax(200px,1fr)_110px_150px_130px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/80">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Order / Product</span>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Total</span>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Status</span>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">Actions</span>
                </div>

                {/* Rows */}
                {loading ? (
                  <div className="text-center py-16">
                    <LuLoader size={32} className="animate-spin mx-auto mb-3" style={{ color: PRI }} />
                    <p className="text-[15px] font-bold text-gray-700">Loading orders…</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-16 px-6">
                    <div className="text-3xl mb-3">⚠️</div>
                    <p className="text-[15px] font-bold text-gray-700 mb-1">Failed to load orders</p>
                    <p className="text-[13px] text-gray-400 mb-4">{error}</p>
                    <button onClick={loadOrders}
                      className="px-5 py-2 rounded-xl text-white text-[13px] font-bold hover:opacity-90 transition"
                      style={{ background: BRAND }}>
                      Retry
                    </button>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">📦</div>
                    <p className="text-[15px] font-bold text-gray-700 mb-1">No orders found</p>
                    <p className="text-[13px] text-gray-400">
                      {orders.length === 0 ? 'You have not placed any orders yet.' : 'Try adjusting your search or filter.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filtered.map((order) => {
                      const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['Pending'];
                      const img  = getFirstImage(order);
                      const name = getFirstProductName(order);
                      const extraCount = (order.products?.length ?? 1) - 1;

                      return (
                        <div key={order.id} className="px-6 py-4 hover:bg-gray-50/60 transition">

                          {/* Desktop row */}
                          <div className="hidden md:grid grid-cols-[minmax(200px,1fr)_110px_150px_130px] gap-4 items-center">

                            {/* Product */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                                {img ? (
                                  <img src={img} alt={name} className="w-full h-full object-cover"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <LuPackage size={18} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold tracking-wider uppercase text-gray-400">
                                  Order #{order.id}
                                  {extraCount > 0 && <span className="ml-1 text-[#2F4A3A]">+{extraCount} more</span>}
                                </p>
                                <p className="text-[13px] font-semibold text-gray-800 truncate">{name}</p>
                                {order.createdAt && (
                                  <p className="text-[11px] text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Total */}
                            <GradText className="text-[14px] font-extrabold whitespace-nowrap">
                              {fmtINR(order.total)}
                            </GradText>

                            {/* Status */}
                            {st && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap w-fit"
                                style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                                {st.icon} {order.status}
                              </span>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button onClick={() => openOrderDetail(order)}
                                title="View Order Details"
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:border-[#2F4A3A] hover:text-[#2F4A3A] transition">
                                <LuEye size={14} />
                              </button>
                              <button title="Download Invoice"
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition">
                                <LuDownload size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Mobile row */}
                          <div className="flex flex-col gap-3 md:hidden">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                                {img ? (
                                  <img src={img} alt={name} className="w-full h-full object-cover"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <LuPackage size={18} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold tracking-wider uppercase text-gray-400">Order #{order.id}</p>
                                <p className="text-[13px] font-semibold text-gray-800 truncate">{name}</p>
                                {order.createdAt && (
                                  <p className="text-[11px] text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                  </p>
                                )}
                              </div>
                              <GradText className="text-[14px] font-extrabold whitespace-nowrap">
                                {fmtINR(order.total)}
                              </GradText>
                            </div>
                            <div className="flex items-center justify-between">
                              {st && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                                  style={{ background: st.bg, color: st.text }}>
                                  {st.icon} {order.status}
                                </span>
                              )}
                              <div className="flex items-center gap-2">
                                <button onClick={() => openOrderDetail(order)}
                                  className="w-8 h-8 rounded-lg border border-gray-200 text-gray-400 flex items-center justify-center">
                                  <LuEye size={14} />
                                </button>
                                <button className="w-8 h-8 rounded-lg border border-gray-200 text-gray-400 flex items-center justify-center">
                                  <LuDownload size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer */}
                {filtered.length > 0 && (
                  <div className="px-6 sm:px-8 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[12px] text-gray-400">
                      Showing <span className="font-bold text-gray-700">{filtered.length}</span> of{' '}
                      <span className="font-bold text-gray-700">{orders.length}</span> orders
                    </p>
                    <button className="text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-80 transition"
                      style={{ background: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      <LuFilter size={12} style={{ color: PRI }} /> More Filters
                    </button>
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