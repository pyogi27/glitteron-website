# Glitteron Website API — Integration Guide

> Base URL: `https://<your-domain>/api/v1`
> All authenticated requests require: `Authorization: Bearer <accessToken>`
> Content-Type: `application/json`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Cart](#2-cart)
3. [Payments & Checkout](#3-payments--checkout)
4. [Orders](#4-orders)
5. [Frontend Pages — Implementation Guide](#5-frontend-pages--implementation-guide)
6. [Razorpay Integration Guide](#6-razorpay-integration-guide)
7. [Error Handling](#7-error-handling)

---

## 1. Authentication

All auth routes are under `/api/v1/auth`.

### 1.1 Send OTP (Signup / First Step)

```
POST /auth/send-otp
```

**Body:**
```json
{ "phone": "9876543210", "email": "john@example.com" }
```

**Response `200`:**
```json
{ "success": true, "message": "OTP sent successfully" }
```

**Notes:**
- The OTP is delivered on **WhatsApp** to `phone`
- `email` is optional and used only as the `OTP_CHANNEL=email` fallback destination
- 10-digit phone only
- Rate limited: 1 OTP per 60 seconds per phone
- After 3 failed verifications → 15-minute lockout

---

### 1.2 Verify OTP (Complete Signup)

```
POST /auth/verify-otp
```

**Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "mypassword"
}
```

- `firstName`, `lastName`, `email`, `password` are all required on first signup
  (email is unique on `website_users`, is the password-reset channel, and is the
  `OTP_CHANNEL=email` fallback address)
- Ignored for an existing phone — that is just a login

**Response `200`:**
```json
{
  "success": true,
  "accessToken": "<jwt>",
  "user": {
    "id": 1,
    "phone": "9876543210",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

- Refresh token is set as `HttpOnly` cookie `website_refresh_token`
- Store `accessToken` in memory or localStorage as `websiteToken`

---

### 1.3 Login (Step 1 — Password)

```
POST /auth/login
```

**Body:**
```json
{ "phone": "9876543210", "password": "mypassword" }
```

**Response `200`:**
```json
{ "success": true, "message": "OTP sent to your WhatsApp number" }
```

---

### 1.4 Login (Step 2 — Verify OTP)

```
POST /auth/login/verify-otp
```

**Body:**
```json
{ "phone": "9876543210", "otp": "123456" }
```

**Response `200`:**
```json
{
  "success": true,
  "accessToken": "<jwt>",
  "user": {
    "id": 1,
    "phone": "9876543210",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

---

### 1.5 Refresh Access Token

```
POST /auth/refresh
```

- Reads the `website_refresh_token` HttpOnly cookie automatically
- No body required

**Response `200`:**
```json
{ "success": true, "accessToken": "<new-jwt>" }
```

---

### 1.6 Logout

```
POST /auth/logout
```

- Clears the refresh token cookie and invalidates it in DB

**Response `200`:**
```json
{ "success": true, "message": "Logged out" }
```

---

### 1.7 Get My Profile _(requires auth)_

```
GET /auth/me
```

**Response `200`:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "phone": "9876543210",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001"
  }
}
```

---

### 1.8 Update My Profile _(requires auth)_

```
PATCH /auth/me
```

**Body (all fields optional):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "zipCode": "400001"
}
```

**Response `200`:**
```json
{ "success": true, "user": { ...updatedFields } }
```

---

### 1.9 Forgot Password

```
POST /auth/forgot-password
```

**Body:**
```json
{ "email": "john@example.com" }
```

**Response `200`:**
```json
{ "success": true, "message": "If an account exists, an OTP has been sent." }
```

- Always returns success (email enumeration protection)
- OTP sent to registered email

---

### 1.10 Reset Password

```
POST /auth/reset-password
```

**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "password": "newpassword"
}
```

**Response `200`:**
```json
{ "success": true, "message": "Password reset successful" }
```

---

## 2. Cart

All cart routes require auth.

### 2.1 Get Cart

```
GET /cart
```

**Response `200`:**
```json
{
  "success": true,
  "items": [
    {
      "id": 10,
      "websiteUserId": 1,
      "productId": 42,
      "productVariationId": null,
      "quantity": 2,
      "snapshotPrice": "299.00",
      "product": {
        "id": 42,
        "name": "Glitter Lamp",
        "mainImage": "https://s3.amazonaws.com/...",
        "status": "active"
      }
    }
  ]
}
```

---

### 2.2 Add to Cart

```
POST /cart/items
```

**Body:**
```json
{
  "productId": 42,
  "productVariationId": null,
  "quantity": 2
}
```

- `productVariationId` is optional (null for base product)

**Response `201`:**
```json
{ "success": true, "item": { ...cartItem } }
```

---

### 2.3 Update Cart Item Quantity

```
PATCH /cart/items/:cartItemId
```

**Body:**
```json
{ "quantity": 3 }
```

**Response `200`:**
```json
{ "success": true, "item": { ...updatedCartItem } }
```

---

### 2.4 Remove Cart Item

```
DELETE /cart/items/:cartItemId
```

**Response `204` (no body)**

---

## 3. Payments & Checkout

### 3.1 Create Checkout _(requires auth)_

Validates cart prices live, creates a Razorpay order, and locks in the cart snapshot.

```
POST /payments/checkout
```

**Body:**
```json
{
  "shippingAddress": {
    "addressLine1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001"
  }
}
```

- `shippingAddress` is optional but recommended — used as delivery address on the order

**Response `200`:**
```json
{
  "success": true,
  "razorpayOrderId": "order_XXXXXXXXXXXXXXXXXX",
  "amount": 598.00,
  "currency": "INR"
}
```

- `amount` is in rupees (NOT paise) — multiply by 100 when opening Razorpay modal
- Prices are verified live against DB; cart `snapshotPrice` is updated if price changed

**Errors:**
| Status | Message |
|--------|---------|
| 400 | Cart is empty |
| 400 | Product X is no longer available |

---

### 3.2 Verify Payment _(requires auth)_

Called immediately after Razorpay's `handler` callback fires. Verifies the signature, creates the SalesOrder, and clears the cart.

```
POST /payments/verify
```

**Body:**
```json
{
  "razorpayOrderId": "order_XXXXXXXXXXXXXXXXXX",
  "razorpayPaymentId": "pay_XXXXXXXXXXXXXXXXXX",
  "razorpaySignature": "abc123..."
}
```

**Response `200`:**
```json
{
  "success": true,
  "salesOrderId": 101
}
```

**What happens internally:**
- Signature verified with HMAC-SHA256
- SalesOrder created with `source: 'website'`, `status: 'approved'`
- Cart cleared
- Payment marked `PAID`

**Errors:**
| Status | Message |
|--------|---------|
| 400 | Payment signature verification failed |
| 404 | Payment record not found |
| 502 | Order creation failed — payment captured, contact support with payment ID |

---

### 3.3 Get Payment Status _(requires auth)_

```
GET /payments/:paymentId
```

**Response `200`:**
```json
{
  "success": true,
  "payment": {
    "id": 5,
    "status": "PAID",
    "amount": "598.00",
    "razorpayOrderId": "order_XXXXXXXXXXXXXXXXXX",
    "salesOrderId": 101,
    "webhookVerified": true
  }
}
```

**Payment statuses:** `PENDING` | `PAID` | `FAILED` | `REFUNDED`

---

### 3.4 Webhook (Public — no auth)

Handled internally by the server. No frontend action needed.

```
POST /payments/webhook
```

---

## 4. Orders

### 4.1 Get My Orders _(requires auth)_

```
GET /auth/orders?page=1&limit=10
```

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |

**Response `200`:**
```json
{
  "success": true,
  "orders": [
    {
      "id": 101,
      "source": "website",
      "status": "approved",
      "subtotal": "598.00",
      "finalTotal": "598.00",
      "gstRate": "0.00",
      "gstAmount": "0.00",
      "customerAddress": "123 Main Street, Mumbai, Maharashtra, 400001",
      "createdAt": "2026-03-25T10:00:00.000Z",
      "OrderItems": [
        {
          "id": 201,
          "quantity": 2,
          "price": "299.00",
          "total": "598.00",
          "product": {
            "id": 42,
            "name": "Glitter Lamp",
            "thumbnailImage": "https://s3.amazonaws.com/..."
          },
          "productVariation": null
        }
      ],
      "payment": {
        "status": "PAID",
        "razorpayPaymentId": "pay_XXXXXXXXXXXXXXXXXX",
        "amount": "598.00"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

**Order statuses:** `pending` | `approved` | `declined`
**Payment statuses:** `PENDING` | `PAID` | `FAILED` | `REFUNDED`

---

### 4.2 Get Order Detail _(requires auth)_

Returns full order detail. Only the owning website user can access their own orders.

```
GET /auth/orders/:id
```

**Response `200`:**
```json
{
  "success": true,
  "order": {
    "id": 101,
    "source": "website",
    "status": "approved",
    "subtotal": "598.00",
    "discount": "0.00",
    "discountAmount": "0.00",
    "extraDiscount": "0.00",
    "extraDiscountAmount": "0.00",
    "gstRate": "0.00",
    "gstAmount": "0.00",
    "packagingCharges": "0.00",
    "courierCharges": "0",
    "finalTotal": "598.00",
    "customerAddress": "123 Main Street, Mumbai, Maharashtra, 400001",
    "createdAt": "2026-03-25T10:00:00.000Z",
    "OrderItems": [
      {
        "id": 201,
        "quantity": 2,
        "price": "299.00",
        "total": "598.00",
        "units": "Nos",
        "product": {
          "id": 42,
          "name": "Glitter Lamp",
          "thumbnailImage": "https://s3.amazonaws.com/...",
          "mainImage": "https://s3.amazonaws.com/..."
        },
        "productVariation": {
          "id": 7,
          "name": "Gold - Large",
          "color": "Gold",
          "size": "Large",
          "material": null,
          "wattage": null
        }
      }
    ],
    "payment": {
      "status": "PAID",
      "razorpayPaymentId": "pay_XXXXXXXXXXXXXXXXXX",
      "amount": "598.00"
    }
  }
}
```

**Error `404`:**
```json
{ "success": false, "message": "Order not found" }
```

---

## 5. Frontend Pages — Implementation Guide

### Page 1: Checkout (`/checkout`)

**Requires:** `websiteToken`

#### Load sequence
```
1. Parallel fetch:
   - GET /cart          → cart items + prices
   - GET /auth/me       → user profile for address pre-fill

2. Show:
   - Order summary (items, qty, price, subtotal)
   - Address form (pre-filled from profile if address exists)

3. On "Pay" click:
   - Validate address fields
   - POST /payments/checkout { shippingAddress }  →  { razorpayOrderId, amount }
   - Open Razorpay modal (see Section 6)

4. Razorpay handler callback:
   - POST /payments/verify { razorpayOrderId, razorpayPaymentId, razorpaySignature }
   - On success → navigate to /orders/:salesOrderId?success=true
   - On failure → show error toast, allow retry
```

#### Address form fields
| Field | Required | Pre-fill source |
|-------|----------|-----------------|
| Full Name | Yes | `user.firstName + ' ' + user.lastName` |
| Phone | Yes | `user.phone` |
| Address Line | Yes | `user.address` |
| City | Yes | `user.city` |
| State | Yes | `user.state` |
| Pincode | Yes | `user.zipCode` |

---

### Page 2: My Orders (`/orders`)

**Requires:** `websiteToken`

```
GET /auth/orders?page=1&limit=10
```

#### Display
- List of orders, newest first
- Per row: Order #id, date, item count, total amount, order status badge, payment status badge
- Click row → `/orders/:id`
- Pagination controls
- Empty state if no orders

#### Status badge colours
| Value | Colour |
|-------|--------|
| `approved` | Green |
| `pending` | Yellow |
| `declined` | Red |
| `PAID` | Green |
| `PENDING` | Yellow |
| `FAILED` | Red |

---

### Page 3: Order Detail (`/orders/:id`)

**Requires:** `websiteToken`

```
GET /auth/orders/:id
```

#### Display
- If URL has `?success=true` → show success banner: _"Payment successful! Your order has been placed."_
- Order header: `#id`, date, order status badge, payment status badge
- Shipping address (from `customerAddress`)
- Items table: product image (`thumbnailImage`), name, variation name, qty, unit price, line total
- Totals section: subtotal = finalTotal (no GST, no charges for now)
- Back button → `/orders`

---

## 6. Razorpay Integration Guide

### Step 1 — Load the Razorpay Script

Load dynamically before opening the modal:

```js
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}
```

### Step 2 — Open the Modal

```js
async function handlePayment({ razorpayOrderId, amount, user }) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    alert('Failed to load payment gateway. Please try again.');
    return;
  }

  const options = {
    key: process.env.RAZORPAY_KEY_ID,   // public key — safe in frontend
    amount: Math.round(amount * 100),   // paise
    currency: 'INR',
    name: 'Glitteron',
    description: 'Order Payment',
    order_id: razorpayOrderId,
    prefill: {
      name: `${user.firstName} ${user.lastName}`,
      contact: user.phone,
      email: user.email || '',
    },
    theme: { color: '#7c3aed' },
    handler: async function (response) {
      // This fires on successful payment
      try {
        const res = await fetch('/api/v1/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('websiteToken')}`,
          },
          body: JSON.stringify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = `/orders/${data.salesOrderId}?success=true`;
        } else {
          alert(data.message || 'Payment verification failed');
        }
      } catch (err) {
        alert('Payment verification failed. If money was deducted, contact support.');
      }
    },
    modal: {
      ondismiss: () => {
        // User closed the modal without paying — reset loading state
        console.log('Payment modal dismissed');
      },
    },
  };

  const rzp = new window.Razorpay(options);

  rzp.on('payment.failed', function (response) {
    alert(`Payment failed: ${response.error.description}`);
  });

  rzp.open();
}
```

### Step 3 — Full Checkout Flow

```
User clicks "Pay" button
  ↓
POST /api/v1/payments/checkout { shippingAddress }
  ↓  returns { razorpayOrderId, amount, currency }
  ↓
Open Razorpay modal with order_id + amount
  ↓
[User pays on Razorpay]
  ↓
handler() fires with { razorpay_payment_id, razorpay_order_id, razorpay_signature }
  ↓
POST /api/v1/payments/verify { razorpayOrderId, razorpayPaymentId, razorpaySignature }
  ↓  returns { salesOrderId }
  ↓
Redirect to /orders/:salesOrderId?success=true
```

---

## 7. Error Handling

All error responses follow this shape:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Missing or invalid access token |
| 403 | Forbidden (accessing another user's resource) |
| 404 | Resource not found |
| 429 | Rate limited (OTP requests) |
| 500 | Internal server error |
| 502 | Payment captured but order creation failed — tell user to contact support with their Razorpay payment ID |

### Token Expiry

When you receive a `401`, use `POST /auth/refresh` to get a new access token (the refresh token is sent automatically via cookie). If refresh also fails (cookie expired), redirect the user to the login screen.

```js
// Pseudo-code for axios interceptor
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post('/api/v1/auth/refresh');
        localStorage.setItem('websiteToken', data.accessToken);
        error.config.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return axios(error.config); // retry original request
      } catch {
        localStorage.removeItem('websiteToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## Quick Reference

```
AUTH
POST   /auth/send-otp             Public
POST   /auth/verify-otp           Public  →  returns accessToken
POST   /auth/login                Public
POST   /auth/login/verify-otp     Public  →  returns accessToken
POST   /auth/refresh              Public (uses cookie)
POST   /auth/logout               Public
GET    /auth/me                   Auth
PATCH  /auth/me                   Auth
POST   /auth/forgot-password      Public
POST   /auth/reset-password       Public

CART                              (all require Auth)
GET    /cart
POST   /cart/items
PATCH  /cart/items/:id
DELETE /cart/items/:id

PAYMENTS                          (all require Auth except webhook)
POST   /payments/checkout         Auth
POST   /payments/verify           Auth
GET    /payments/:id              Auth
POST   /payments/:id/refund       Auth
POST   /payments/webhook          Public

ORDERS                            (all require Auth)
GET    /auth/orders
GET    /auth/orders/:id
```
