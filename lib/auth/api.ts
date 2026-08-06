import type { ApiError, AuthSuccessResponse, OtpSentResponse, WebsiteUser } from './types';
import { useAuthStore } from '@/lib/stores/authStore';

const AUTH = '/api/auth';

// ─── Raw request (no auth header) ────────────────────────────────────────────

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${AUTH}${path}`, {
    ...opts,
    credentials: 'include', // sends website_refresh_token cookie automatically
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });

  const data = await res.json().catch(() => ({ message: 'Unexpected server error' }));

  if (!res.ok) {
    const err: ApiError = { status: res.status, message: data.message ?? 'Something went wrong' };
    throw err;
  }

  return data as T;
}

// ─── Authenticated request (auto-refreshes on 401) ───────────────────────────

async function authedReq<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const withBearer = (t: string): RequestInit => ({
    ...opts,
    headers: { ...opts.headers, Authorization: `Bearer ${t}` },
  });

  try {
    return await req<T>(path, withBearer(token ?? ''));
  } catch (err: unknown) {
    const apiErr = err as ApiError;
    if (apiErr.status !== 401) throw err;

    // Try to refresh the token once
    try {
      const { accessToken: fresh } = await req<{ success: true; accessToken: string }>(
        '/refresh',
        { method: 'POST' },
      );
      const { user } = await req<{ success: true; user: WebsiteUser }>('/me', {
        headers: { Authorization: `Bearer ${fresh}` },
      });
      useAuthStore.getState().setAuth(fresh, user);
      return req<T>(path, withBearer(fresh));
    } catch {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw err;
    }
  }
}

// ─── Public endpoints ─────────────────────────────────────────────────────────

/** Signup step 1 — sends OTP to email */
export const sendOtp = (email: string) =>
  req<OtpSentResponse>('/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

/** Signup step 2 — verify OTP + create account */
export const verifyOtp = (payload: {
  email: string;
  phone: string;
  otp: string;
  firstName: string;
  lastName: string;
  password: string;
}) =>
  req<AuthSuccessResponse>('/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

/** Login step 1 — validate phone + password, triggers OTP SMS */
export const login = (phone: string, password: string) =>
  req<OtpSentResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });

/** Login step 2 — verify OTP, issues tokens */
export const loginVerifyOtp = (phone: string, otp: string) =>
  req<AuthSuccessResponse>('/login/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });

/** Restore session — uses httpOnly refresh cookie, returns new accessToken */
export const refreshToken = () =>
  req<{ success: true; accessToken: string }>('/refresh', { method: 'POST' });

/** Get user profile using a specific token (used in SessionRestorer) */
export const getMe = (token: string) =>
  req<{ success: true; user: WebsiteUser }>('/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

/** Update own profile — auto-refreshes token if expired */
export const updateMe = (
  data: Partial<Pick<WebsiteUser, 'firstName' | 'lastName' | 'address' | 'city' | 'state' | 'zipCode'>>,
) =>
  authedReq<{ success: true; user: WebsiteUser }>('/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

/** Logout — clears httpOnly cookie */
export const logoutApi = () =>
  req<{ success: true; message: string }>('/logout', { method: 'POST' });

/** Send password-reset email */
export const forgotPassword = (email: string) =>
  req<{ success: true; message: string }>('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

/** Reset password using OTP sent to email */
export const resetPassword = (email: string, otp: string, password: string) =>
  req<{ success: true; message: string }>('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, password }),
  });

// ─── Authenticated fetch (full path, no /api/auth prefix) ─────────────────────

async function authedFetch<T>(fullPath: string, opts: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const withBearer = (t: string): RequestInit => ({
    ...opts,
    credentials: 'include' as RequestCredentials,
    headers: { 'Content-Type': 'application/json', ...opts.headers, Authorization: `Bearer ${t}` },
  });

  const doFetch = (t: string) =>
    fetch(fullPath, withBearer(t)).then(async (res) => {
      if (res.status === 204) return { success: true } as T;
      const data = await res.json().catch(() => ({ message: 'Unexpected server error' }));
      if (!res.ok) {
        const err: ApiError = { status: res.status, message: data.message ?? 'Something went wrong' };
        throw err;
      }
      return data as T;
    });

  try {
    return await doFetch(token ?? '');
  } catch (err: unknown) {
    const apiErr = err as ApiError;
    if (apiErr.status !== 401) throw err;
    try {
      const { accessToken: fresh } = await req<{ success: true; accessToken: string }>('/refresh', { method: 'POST' });
      const { user } = await req<{ success: true; user: WebsiteUser }>('/me', {
        headers: { Authorization: `Bearer ${fresh}` },
      });
      useAuthStore.getState().setAuth(fresh, user);
      return doFetch(fresh);
    } catch {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw err;
    }
  }
}

// ─── Visualizer usage ──────────────────────────────────────────────────────────

export interface VisualizerUsage {
  success: true;
  limit: number;
  count: number;
  remaining: number;
  resetAt: string | null;
}

/** How many of today's 4 AI generations this user has left. */
export const getVisualizerUsage = () =>
  authedFetch<VisualizerUsage>('/api/visualizer-usage/usage');

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: number;
  productId: number;
  variationId: number | null;
  quantity: number;
  price: number;
  productName?: string;
  variationName?: string;
}

export interface Order {
  id: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  subtotal?: number;
  discountPercentage?: number;
  gstRate?: number;
  courierCharge?: number;
  packagingCharge?: number;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
}

// ─── Customer Profile ─────────────────────────────────────────────────────────

export interface CustomerProfile {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  businessName?: string;
  address?: string;
  logo?: string;
}

/** Get customer's own order history */
export const getMyOrders = () =>
  authedReq<{ success: true; data: Order[] }>('/orders');

/** Get customer's own profile */
export const getCustomerProfile = () =>
  authedFetch<{ success: true; data: CustomerProfile; customer: CustomerProfile }>('/api/customer/profile');

/** Update customer's own profile */
export const updateCustomerProfile = (data: {
  businessName?: string;
  phone?: string;
  address?: string;
}) =>
  authedFetch<{ success: true; data: CustomerProfile; customer: CustomerProfile }>('/api/customer/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// ─── Server Cart ──────────────────────────────────────────────────────────────

export interface ServerCartItem {
  id: number
  productId: number
  productVariationId: number | null
  quantity: number
  snapshotPrice: string
  product: { id: number; name: string; mainImage: string; status: string }
}

export interface WebsiteCartItem {
  id: number
  productId: number
  productVariationId: number | null
  quantity: number
  livePrice: number
  lineTotal: number
  product: { id: number; name: string; mainImage: string }
  variation: { id: number; name: string; color: string; size: string } | null
}

export interface WebsiteCartSummary {
  success: true
  items: WebsiteCartItem[]
  subtotal: number
  gstRate: number
  gstAmount: number
  courierCharges: number
  finalTotal: number
}

export const getServerCart = () =>
  authedFetch<{ success: true; items: ServerCartItem[] }>('/api/cart')

/** Get cart with live prices and pre-computed totals (uses user's saved zipCode for shipping) */
export const getWebsiteCart = () =>
  authedFetch<WebsiteCartSummary>('/api/website/cart')

/**
 * Add a line to the server cart.
 *
 * NOTE: this INCREMENTS when a row already exists for the same
 * (websiteUserId, productId, productVariationId) — see AddToCart.usecase.js. Calling it
 * twice with quantity 2 leaves 4. Use updateServerCartItem() to set an absolute
 * quantity; syncCartToServer() in lib/api/cartSync.ts picks the right one per row.
 */
export const addToServerCart = (productId: number, productVariationId: number | null, quantity: number) =>
  authedFetch<{ success: true; item: ServerCartItem }>('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, productVariationId, quantity }),
  })

/** Set a line's quantity ABSOLUTELY (UpdateCartItem does item.update({ quantity })). */
export const updateServerCartItem = (cartItemId: number, quantity: number) =>
  authedFetch<{ success: true; item: ServerCartItem }>(`/api/cart/items/${cartItemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  })

/** Remove a single line. Ownership is enforced server-side (403 on someone else's row). */
export const removeServerCartItem = (cartItemId: number) =>
  authedFetch<{ success: true }>(`/api/cart/items/${cartItemId}`, { method: 'DELETE' })

/**
 * Empty the whole server cart.
 *
 * Prefer syncCartToServer() for reconciling local state — this used to be called before
 * re-adding every row, which left the cart destroyed if any add then failed.
 */
export const clearServerCart = () =>
  authedFetch<{ success: true }>('/api/cart', { method: 'DELETE' })

// ─── Shipping ─────────────────────────────────────────────────────────────────

export interface ShippingRateResponse {
  success: true
  pincode: string
  courierCharges: number
  ratePerKg: number
  available: boolean
  breakdown: Array<{
    productName: string
    quantity: number
    chargeableWeight: string
    ratePerKg: number
    charges: string
  }>
}

/** Fetch shipping charges for a given pincode (omit pincode to use user's saved zipCode) */
export const getShippingRate = (pincode?: string) =>
  authedFetch<ShippingRateResponse>(
    `/api/website/cart/shipping${pincode ? `?pincode=${pincode}` : ''}`
  )

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface ShippingAddress {
  addressLine1: string
  city: string
  state: string
  zipCode: string
}

export const createCheckout = (shippingAddress: ShippingAddress) =>
  authedFetch<{ success: true; razorpayOrderId: string; amount: number; currency: string }>('/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ shippingAddress }),
  })

export const verifyPayment = (payload: {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}) =>
  authedFetch<{ success: true; salesOrderId: number }>('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

// ─── Website Orders ────────────────────────────────────────────────────────────

export interface WebsiteOrderItem {
  id: number
  quantity: number
  price: string
  total: string
  units?: string
  product: { id: number; name: string; thumbnailImage?: string; mainImage?: string }
  productVariation: { id: number; name: string; color: string; size: string } | null
}

export interface WebsiteOrder {
  id: number
  source: string
  status: 'pending' | 'approved' | 'declined'
  subtotal: string
  finalTotal: string
  gstRate: string
  gstAmount: string
  discount?: string
  discountAmount?: string
  packagingCharges?: string
  courierCharges?: string
  customerAddress: string
  createdAt: string
  OrderItems: WebsiteOrderItem[]
  payment: {
    status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
    razorpayPaymentId: string
    amount: string
  }
}

export interface WebsiteOrderPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const getWebsiteOrders = (page = 1, limit = 10) =>
  authedReq<{ success: true; orders: WebsiteOrder[]; pagination: WebsiteOrderPagination }>(
    `/orders?page=${page}&limit=${limit}`
  )

export const getWebsiteOrder = (id: number) =>
  authedReq<{ success: true; order: WebsiteOrder }>(`/orders/${id}`)
