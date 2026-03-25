'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { getMyOrders, updateMe } from '@/lib/auth/api';
import type { ApiError } from '@/lib/auth/types';

// ─── Local types ──────────────────────────────────────────────────────────────

interface OrderItem {
  id: number;
  productId: number;
  variationId: number | null;
  quantity: number;
  price: number;
  productName?: string;
  variationName?: string;
}

interface Order {
  id: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  subtotal?: number;
  courierCharge?: number;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
}

type Tab = 'overview' | 'orders' | 'edit';

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<Order['status'], { bg: string; text: string; label: string }> = {
  pending:    { bg: 'rgba(234,179,8,0.12)',   text: '#92660A', label: 'Pending'    },
  confirmed:  { bg: 'rgba(59,130,246,0.12)',  text: '#1D4ED8', label: 'Confirmed'  },
  processing: { bg: 'rgba(168,85,247,0.12)',  text: '#7E22CE', label: 'Processing' },
  shipped:    { bg: 'rgba(20,184,166,0.12)',  text: '#0F766E', label: 'Shipped'    },
  delivered:  { bg: 'rgba(34,197,94,0.12)',   text: '#15803D', label: 'Delivered'  },
  cancelled:  { bg: 'rgba(239,68,68,0.12)',   text: '#B91C1C', label: 'Cancelled'  },
};

function StatusBadge({ status }: { status: Order['status'] }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full font-sans text-[11px] font-medium tracking-[0.06em] uppercase"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return s;
  }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-[#EDE8E0] min-h-[calc(100vh-72px)] px-4 md:px-12 py-8 md:py-12">
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 md:gap-8">
        <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-6 md:p-8 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-[#E2DAD0] mx-auto mb-4" />
          <div className="h-5 bg-[#E2DAD0] rounded-full w-3/4 mx-auto mb-2" />
          <div className="h-3 bg-[#E2DAD0] rounded-full w-1/2 mx-auto mb-8" />
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-[#E2DAD0] rounded-xl" />)}
          </div>
        </div>
        <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-6 md:p-8 animate-pulse">
          <div className="h-8 bg-[#E2DAD0] rounded-full w-1/3 mb-6" />
          <div className="space-y-4">
            {[1,2].map(i => (
              <div key={i} className="rounded-[18px] border border-[#D8D0C4] p-5">
                <div className="h-4 bg-[#E2DAD0] rounded-full w-1/4 mb-3" />
                <div className="h-3 bg-[#E2DAD0] rounded-full w-2/3 mb-2" />
                <div className="h-3 bg-[#E2DAD0] rounded-full w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────

function Field({
  label, id, value, onChange, readOnly = false, placeholder = '',
}: {
  label: string; id: string; value: string;
  onChange?: (v: string) => void; readOnly?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
        style={{ color: '#2C2825' }}
      >
        {label}
        {readOnly && (
          <span className="ml-2 normal-case tracking-normal font-normal" style={{ color: '#A09488' }}>
            (cannot be changed)
          </span>
        )}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-4 py-3 font-sans text-[13px] font-light outline-none transition-all duration-200"
        style={{
          background: readOnly ? 'rgba(44,40,37,0.04)' : 'rgba(44,40,37,0.06)',
          border: '1px solid rgba(44,40,37,0.15)',
          color: readOnly ? '#A09488' : '#2C2825',
        }}
        onFocus={e => {
          if (!readOnly) e.currentTarget.style.borderColor = 'rgba(196,113,74,0.65)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'rgba(44,40,37,0.15)';
        }}
      />
    </div>
  );
}

// ─── Order row ────────────────────────────────────────────────────────────────

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  return (
    <article className="rounded-[18px] border border-[#D8D0C4] bg-[#FAF7F2] p-4 md:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-sans text-[13px] font-medium" style={{ color: '#2C2825' }}>
              Order #{order.id}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-1.5 font-sans text-[12px]" style={{ color: '#A09488' }}>
            {formatDate(order.createdAt)}
            {itemCount > 0 && (
              <>
                <span className="mx-2 opacity-40">•</span>
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </>
            )}
            {order.shippingAddress && (
              <>
                <span className="mx-2 opacity-40">•</span>
                <span className="truncate max-w-[200px] inline-block align-bottom">
                  {order.shippingAddress}
                </span>
              </>
            )}
          </div>
          {order.items && order.items.length > 0 && (
            <div className="mt-2 font-sans text-[11.5px]" style={{ color: '#A09488' }}>
              {order.items.slice(0, 2).map(item => (
                <span key={item.id} className="mr-3">
                  {item.productName ?? `Product #${item.productId}`}
                  {item.variationName ? ` (${item.variationName})` : ''}
                  {' '}×{item.quantity}
                </span>
              ))}
              {order.items.length > 2 && (
                <span>+{order.items.length - 2} more</span>
              )}
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-sans text-[11px] uppercase tracking-[0.08em]" style={{ color: '#A09488' }}>Total</div>
          <div className="font-sans text-[18px] font-medium" style={{ color: '#2C2825' }}>
            {formatPrice(order.totalAmount)}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePageClient() {
  const user = useAuthStore(s => s.user);
  const setAuth = useAuthStore(s => s.setAuth);

  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'overview';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Hydration guard + auto-load orders if tab=orders
  useEffect(() => {
    setMounted(true);
    if (initialTab === 'orders') loadOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate form from user data
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setAddress(user.address ?? '');
    setCity(user.city ?? '');
    setState(user.state ?? '');
    setZipCode(user.zipCode ?? '');
  }, [user]);

  // Load orders on first visit to orders tab
  const loadOrders = useCallback(async () => {
    if (ordersLoaded) return;
    setOrdersLoading(true);
    try {
      const res = await getMyOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
      setOrdersLoaded(true);
    }
  }, [ordersLoaded]);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'orders') loadOrders();
  }, [loadOrders]);

  // Save profile
  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      const res = await updateMe({ firstName, lastName, address, city, state, zipCode });
      setAuth(useAuthStore.getState().accessToken!, res.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setSaveError(apiErr.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, address, city, state, zipCode, setAuth]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (!mounted) return <Skeleton />;

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <div className="pt-[72px] bg-white border-b border-[#D8D0C4]">
          <div className="px-4 md:px-12 py-3.5 flex items-center gap-2 text-[11.5px]" style={{ color: '#A09488' }}>
            <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
            <span className="opacity-45">›</span>
            <span style={{ color: '#2C2825' }}>Profile</span>
          </div>
        </div>
        <section className="bg-[#EDE8E0] min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-[400px]">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(196,113,74,0.12)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C4714A" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1 className="font-serif font-light mb-3" style={{ fontSize: '38px', color: '#1A1210', lineHeight: 1.1 }}>
              Sign in to continue
            </h1>
            <p className="font-sans text-[13px] font-light leading-[1.7] mb-8" style={{ color: '#A09488' }}>
              Access your order history, wishlist, and account details.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-3xl py-3 px-8 font-sans text-[12px] font-medium uppercase tracking-[0.12em] transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
              style={{ background: '#C4714A', color: '#EDE8E0' }}
            >
              Sign In
            </Link>
            <p className="mt-5 font-sans text-[12.5px] font-light" style={{ color: '#A09488' }}>
              New here?{' '}
              <Link href="/signup" className="font-medium" style={{ color: '#C4714A' }}>Create an account</Link>
            </p>
          </div>
        </section>
      </>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = getInitials(user.firstName ?? '?', user.lastName ?? '?');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      id: 'orders',
      label: 'My Orders',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      ),
    },
    {
      id: 'edit',
      label: 'Edit Profile',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      ),
    },
  ];

  const hasAddress = user.address || user.city || user.state || user.zipCode;
  const recentOrders = orders.slice(0, 3);

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-[72px] bg-white border-b border-[#D8D0C4]">
        <div className="px-4 md:px-12 py-3.5 flex items-center gap-2 text-[11.5px]" style={{ color: '#A09488' }}>
          <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
          <span className="opacity-45">›</span>
          <span style={{ color: '#2C2825' }}>My Profile</span>
        </div>
      </div>

      <section className="bg-[#EDE8E0] min-h-[calc(100vh-72px)] px-4 md:px-12 py-8 md:py-12">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 md:gap-8 items-start">

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <aside className="bg-white rounded-[24px] border border-[#D8D0C4] p-6 md:p-8 lg:sticky lg:top-[88px]">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-[#D8D0C4]">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 font-serif text-xl font-light"
                style={{ background: '#C4714A', color: '#EDE8E0' }}
              >
                {initials}
              </div>
              <h2 className="font-serif font-light" style={{ fontSize: '24px', color: '#1A1210', lineHeight: 1.1 }}>
                {fullName}
              </h2>
              <p className="mt-1 font-sans text-[12.5px] font-light" style={{ color: '#A09488' }}>
                +91 {user.phone}
              </p>
              <p className="mt-1.5 font-sans text-[10px] tracking-[0.1em] uppercase" style={{ color: '#A09488' }}>
                GlitterOn Member
              </p>
            </div>

            {/* Tab nav — horizontal scroll on mobile, vertical on desktop */}
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 -mx-1 px-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-sans text-[12.5px] font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:w-full text-left"
                  style={
                    activeTab === tab.id
                      ? { background: '#2C2825', color: '#EDE8E0' }
                      : { color: '#2C2825' }
                  }
                  onMouseEnter={e => {
                    if (activeTab !== tab.id) {
                      (e.currentTarget as HTMLButtonElement).style.background = '#F4EFE8';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== tab.id) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Main content ─────────────────────────────────────────────────── */}
          <div>

            {/* ── Overview tab ─────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Greeting */}
                <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-6 md:p-8">
                  <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-2" style={{ color: '#A09488' }}>
                    Your Account
                  </p>
                  <h1 className="font-serif font-light" style={{ fontSize: 'clamp(32px,3.5vw,48px)', color: '#1A1210', lineHeight: 1.05 }}>
                    Welcome, {user.firstName}
                  </h1>
                  <p className="mt-2 font-sans text-[13px] font-light leading-[1.7]" style={{ color: '#A09488' }}>
                    Manage your details, track your orders, and update your preferences below.
                  </p>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Contact details */}
                  <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase" style={{ color: '#A09488' }}>
                        Contact Details
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        className="font-sans text-[11px] font-medium transition-colors"
                        style={{ color: '#C4714A' }}
                      >
                        Edit
                      </button>
                    </div>
                    <dl className="space-y-3">
                      <div>
                        <dt className="font-sans text-[10.5px] font-light" style={{ color: '#A09488' }}>Full Name</dt>
                        <dd className="font-sans text-[13.5px] font-medium mt-0.5" style={{ color: '#2C2825' }}>{fullName}</dd>
                      </div>
                      <div>
                        <dt className="font-sans text-[10.5px] font-light" style={{ color: '#A09488' }}>Phone</dt>
                        <dd className="font-sans text-[13.5px] font-medium mt-0.5" style={{ color: '#2C2825' }}>+91 {user.phone}</dd>
                      </div>
                      {user.email && (
                        <div>
                          <dt className="font-sans text-[10.5px] font-light" style={{ color: '#A09488' }}>Email</dt>
                          <dd className="font-sans text-[13.5px] font-medium mt-0.5" style={{ color: '#2C2825' }}>{user.email}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Delivery address */}
                  <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase" style={{ color: '#A09488' }}>
                        Delivery Address
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        className="font-sans text-[11px] font-medium transition-colors"
                        style={{ color: '#C4714A' }}
                      >
                        Edit
                      </button>
                    </div>
                    {hasAddress ? (
                      <address className="not-italic font-sans text-[13.5px] font-light leading-[1.75]" style={{ color: '#2C2825' }}>
                        {user.address && <span className="block">{user.address}</span>}
                        {(user.city || user.state) && (
                          <span className="block">
                            {[user.city, user.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {user.zipCode && <span className="block">{user.zipCode}</span>}
                      </address>
                    ) : (
                      <div className="flex flex-col items-start gap-3">
                        <p className="font-sans text-[13px] font-light" style={{ color: '#A09488' }}>
                          No address saved yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('edit')}
                          className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] rounded-2xl px-4 py-2 transition-all duration-200"
                          style={{ background: 'rgba(196,113,74,0.1)', color: '#C4714A' }}
                        >
                          Add Address
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent orders preview */}
                <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-6 md:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-serif font-light" style={{ fontSize: '26px', color: '#1A1210', lineHeight: 1.1 }}>
                      Recent Orders
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleTabChange('orders')}
                      className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] transition-colors"
                      style={{ color: '#C4714A' }}
                    >
                      View all
                    </button>
                  </div>

                  {!ordersLoaded && (
                    <div className="text-center py-8">
                      <button
                        type="button"
                        onClick={loadOrders}
                        className="font-sans text-[12px] font-medium uppercase tracking-[0.08em] rounded-3xl py-2.5 px-5 transition-all duration-200 hover:brightness-110"
                        style={{ background: '#2C2825', color: '#EDE8E0' }}
                      >
                        Load Orders
                      </button>
                    </div>
                  )}

                  {ordersLoaded && recentOrders.length === 0 && (
                    <div className="rounded-[18px] border border-dashed border-[#D8D0C4] bg-[#F4EFE8] p-7 text-center">
                      <p className="font-serif text-[22px] leading-[1.1] mb-2" style={{ color: '#2C2825' }}>
                        No orders yet
                      </p>
                      <p className="font-sans text-[13px] font-light mb-5" style={{ color: '#A09488' }}>
                        Your orders will appear here once you make a purchase.
                      </p>
                      <Link
                        href="/collections"
                        className="inline-flex items-center justify-center no-underline rounded-3xl py-2.5 px-6 font-sans text-[12px] font-medium uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#8B5E3C] hover:-translate-y-0.5"
                        style={{ background: '#2C2825', color: '#EDE8E0' }}
                      >
                        Shop Now
                      </Link>
                    </div>
                  )}

                  {recentOrders.length > 0 && (
                    <div className="space-y-3">
                      {recentOrders.map(order => <OrderRow key={order.id} order={order} />)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Orders tab ───────────────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-6 md:p-8">
                <div className="mb-6">
                  <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-2" style={{ color: '#A09488' }}>
                    Purchase History
                  </p>
                  <h1 className="font-serif font-light" style={{ fontSize: 'clamp(30px,3.2vw,44px)', color: '#1A1210', lineHeight: 1.05 }}>
                    My Orders
                  </h1>
                </div>

                {ordersLoading && (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="rounded-[18px] border border-[#D8D0C4] bg-[#FAF7F2] p-5 animate-pulse">
                        <div className="flex justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-3">
                              <div className="h-4 bg-[#E2DAD0] rounded-full w-20" />
                              <div className="h-4 bg-[#E2DAD0] rounded-full w-16" />
                            </div>
                            <div className="h-3 bg-[#E2DAD0] rounded-full w-32" />
                          </div>
                          <div className="h-6 bg-[#E2DAD0] rounded-full w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!ordersLoading && orders.length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-[#D8D0C4] bg-[#F4EFE8] p-8 text-center">
                    <p className="font-serif text-[28px] leading-[1.1] mb-3" style={{ color: '#2C2825' }}>
                      No orders yet
                    </p>
                    <p className="font-sans text-[13px] font-light mb-6" style={{ color: '#A09488' }}>
                      Browse our handcrafted lighting and place your first order.
                    </p>
                    <Link
                      href="/collections"
                      className="inline-flex items-center justify-center no-underline rounded-3xl py-3 px-6 font-sans text-[12px] font-medium uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#8B5E3C] hover:-translate-y-0.5"
                      style={{ background: '#2C2825', color: '#EDE8E0' }}
                    >
                      Explore Collections
                    </Link>
                  </div>
                )}

                {!ordersLoading && orders.length > 0 && (
                  <>
                    <p className="font-sans text-[12.5px] font-light mb-5" style={{ color: '#A09488' }}>
                      {orders.length} order{orders.length !== 1 ? 's' : ''} total
                    </p>
                    <div className="space-y-3">
                      {orders.map(order => <OrderRow key={order.id} order={order} />)}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Edit Profile tab ─────────────────────────────────────────── */}
            {activeTab === 'edit' && (
              <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-6 md:p-8">
                <div className="mb-7">
                  <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-2" style={{ color: '#A09488' }}>
                    Account Settings
                  </p>
                  <h1 className="font-serif font-light" style={{ fontSize: 'clamp(30px,3.2vw,44px)', color: '#1A1210', lineHeight: 1.05 }}>
                    Edit Profile
                  </h1>
                </div>

                <form onSubmit={handleSave} noValidate>
                  {/* Personal info */}
                  <div className="mb-7">
                    <h3 className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase mb-4 pb-3 border-b border-[#D8D0C4]"
                      style={{ color: '#A09488' }}>
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="First Name" id="firstName" value={firstName} onChange={setFirstName} placeholder="First name" />
                      <Field label="Last Name" id="lastName" value={lastName} onChange={setLastName} placeholder="Last name" />
                      <Field label="Phone" id="phone" value={user.phone} readOnly />
                      <Field label="Email" id="email" value={user.email ?? ''} readOnly />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-8">
                    <h3 className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase mb-4 pb-3 border-b border-[#D8D0C4]"
                      style={{ color: '#A09488' }}>
                      Delivery Address
                    </h3>
                    <div className="space-y-4">
                      <Field label="Street Address" id="address" value={address} onChange={setAddress} placeholder="Building, street, area" />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="City" id="city" value={city} onChange={setCity} placeholder="City" />
                        <Field label="State" id="state" value={state} onChange={setState} placeholder="State" />
                        <Field label="PIN Code" id="zipCode" value={zipCode} onChange={setZipCode} placeholder="400001" />
                      </div>
                    </div>
                  </div>

                  {/* Feedback messages */}
                  {saveSuccess && (
                    <div
                      className="mb-5 rounded-xl px-4 py-3 font-sans text-[12.5px] font-light"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#15803D' }}
                    >
                      Profile updated successfully.
                    </div>
                  )}
                  {saveError && (
                    <div
                      className="mb-5 rounded-xl px-4 py-3 font-sans text-[12.5px] font-light"
                      style={{ background: 'rgba(196,113,74,0.08)', color: '#C4714A' }}
                    >
                      {saveError}
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-3xl py-3 px-8 font-sans text-[12px] font-medium uppercase tracking-[0.12em] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                      style={{ background: '#C4714A', color: '#EDE8E0' }}
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) return;
                        setFirstName(user.firstName ?? '');
                        setLastName(user.lastName ?? '');
                        setAddress(user.address ?? '');
                        setCity(user.city ?? '');
                        setState(user.state ?? '');
                        setZipCode(user.zipCode ?? '');
                        setSaveSuccess(false);
                        setSaveError('');
                      }}
                      className="rounded-3xl py-3 px-6 font-sans text-[12px] font-medium uppercase tracking-[0.12em] transition-all duration-200 hover:bg-[#F4EFE8]"
                      style={{ border: '1px solid #D8D0C4', color: '#2C2825' }}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
}
