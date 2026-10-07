import type { ApiError, WebsiteUser } from './types';

const AUTH = '/api/auth';

// ─── Clerk session token ──────────────────────────────────────────────────────

// SessionRestorer registers Clerk's getToken here. Clerk session tokens live ~60s
// and Clerk refreshes them itself, so fetch one per request — never cache it.
let tokenGetter: (() => Promise<string | null>) | null = null;

export const setTokenGetter = (getter: () => Promise<string | null>) => {
  tokenGetter = getter;
};

export const getAuthToken = async (): Promise<string | null> => (tokenGetter ? tokenGetter() : null);

// ─── Authenticated fetch ──────────────────────────────────────────────────────

async function authedFetch<T>(fullPath: string, opts: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(fullPath, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...opts.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 204) return { success: true } as T;
  const data = await res.json().catch(() => ({ message: 'Unexpected server error' }));
  // No redirect on 401: a signed-in Clerk user the backend rejects would bounce
  // between /login and here forever. Clerk sign-out flows through SessionRestorer.
  if (!res.ok) {
    const err: ApiError = { status: res.status, message: data.message ?? 'Something went wrong' };
    throw err;
  }
  return data as T;
}

const authedReq = <T>(path: string, opts: RequestInit = {}) => authedFetch<T>(`${AUTH}${path}`, opts);

// ─── Profile ──────────────────────────────────────────────────────────────────
// Sign-in, sign-up, sign-out and password reset are Clerk's (see app/login, app/signup).

/** Backend profile for the signed-in Clerk user (created/linked on first call). */
export const getMe = () => authedReq<{ success: true; user: WebsiteUser }>('/me');

export const updateMe = (
  data: Partial<Pick<WebsiteUser, 'firstName' | 'lastName' | 'address' | 'city' | 'state' | 'zipCode'>>,
) =>
  authedReq<{ success: true; user: WebsiteUser }>('/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

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

// ─── Product reviews ──────────────────────────────────────────────────────────

/**
 * Reviews are gated on a paid order containing the product, so every review the
 * storefront displays is a real purchase — `verified` is always true.
 *
 * The published list arrives with the product itself (fetchProductById maps
 * productData.reviews); these calls only cover the caller's own review, which is
 * per-user and therefore uncacheable.
 */
export interface MyReviewState {
  hasPurchased: boolean
  canReview: boolean
  review: {
    id: string
    rating: number
    title: string | null
    text: string
    date: string
    isPublished: boolean
  } | null
}

export const getMyProductReview = (productId: number) =>
  authedFetch<{ success: true } & MyReviewState>(`/api/reviews/${productId}/mine`);

export const submitProductReview = (payload: {
  productId: number
  rating: number
  text: string
  title?: string
}) =>
  authedFetch<{ success: true; updated: boolean; aggregates: { rating: number | null; reviewCount: number } }>(
    '/api/reviews',
    { method: 'POST', body: JSON.stringify(payload) },
  );

export const deleteProductReview = (reviewId: string) =>
  authedFetch<{ success: true }>(`/api/reviews/${reviewId}`, { method: 'DELETE' });
