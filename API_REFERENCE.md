# Glitteron API Reference — cURL Examples

> **Base URL:** `http://localhost:3000`
> **Auth header:** `Authorization: Bearer <JWT_TOKEN>`
> **API Key header:** `x-api-key: <API_KEY>`

---

## Table of Contents

1. [Auth](#1-auth)
2. [Products](#2-products)
3. [Product Variations](#3-product-variations)
4. [Categories](#4-categories)
5. [Sales Orders](#5-sales-orders)
6. [Customers](#6-customers)
7. [Dashboard](#7-dashboard)
8. [Notifications](#8-notifications)
9. [Pincode Rates](#9-pincode-rates)
10. [User Access & Users](#10-user-access--users)
11. [API Keys](#11-api-keys)
12. [Tally](#12-tally)
13. [Tally Integration (Bridge)](#13-tally-integration-bridge)
14. [AR (Augmented Reality)](#14-ar-augmented-reality)
15. [Logs](#15-logs)
16. [Health](#16-health)

---

## 1. Auth

### Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "password=secret123" \
  -F "role=vendor" \
  -F "logo=@/path/to/logo.png"
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123"}'
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Profile
```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Verify Token
```bash
curl http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Forgot Password
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com"}'
```

### Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<RESET_TOKEN>","password":"newpassword123"}'
```

### Change Password
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"secret123","newPassword":"newsecret456"}'
```

---

## 2. Products

> Public routes (no auth required): `GET /` and `GET /:id`

### List All Products
```bash
curl "http://localhost:3000/api/products"
```

With filters:
```bash
curl "http://localhost:3000/api/products?category=1&search=glitter&page=1&limit=20"
```

### Get Single Product
```bash
curl "http://localhost:3000/api/products/42"
```

### Create Product (admin)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Glitter Gold",
    "description": "Fine gold glitter",
    "price": 299,
    "categoryId": 2,
    "stock": 100,
    "hasVariations": false
  }'
```

### Update Product (admin)
```bash
curl -X PUT http://localhost:3000/api/products/42 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"price": 349, "stock": 80}'
```

### Delete Product (admin)
```bash
curl -X DELETE http://localhost:3000/api/products/42 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Upload Product Image (multipart)
```bash
curl -X POST http://localhost:3000/api/products/upload \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "image=@/path/to/product.jpg"
```

### Upload Image and Save to Product
```bash
curl -X POST http://localhost:3000/api/products/upload-and-save \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "productId=42" \
  -F "image=@/path/to/product.jpg"
```

### Generate S3 Upload URL
```bash
curl -X POST http://localhost:3000/api/products/upload-url \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 42, "fileName": "product.jpg", "fileType": "image/jpeg"}'
```

### Confirm S3 Upload
```bash
curl -X POST http://localhost:3000/api/products/confirm-upload \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 42, "key": "products/42/product.jpg"}'
```

### Verify S3 Upload
```bash
curl -X POST http://localhost:3000/api/products/verify-upload \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 42, "key": "products/42/product.jpg"}'
```

### Save Image URLs to Product
```bash
curl -X POST http://localhost:3000/api/products/save-image-urls \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 42, "imageUrls": ["https://s3.amazonaws.com/bucket/img1.jpg"]}'
```

### Add Single Image to Product
```bash
curl -X POST http://localhost:3000/api/products/add-image \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 42, "imageUrl": "https://s3.amazonaws.com/bucket/img1.jpg"}'
```

---

## 3. Product Variations

### List Variations for a Product
```bash
curl http://localhost:3000/api/products/42/variations \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Single Variation
```bash
curl http://localhost:3000/api/variations/7 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Create Variation (admin/vendor)
```bash
curl -X POST http://localhost:3000/api/products/42/variations \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "500g Pack",
    "sku": "GLTGLD-500",
    "price": 499,
    "stock": 50,
    "weight": 500
  }'
```

### Bulk Create Variations (admin/vendor)
```bash
curl -X POST http://localhost:3000/api/products/42/variations/bulk \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "variations": [
      {"name": "250g Pack", "sku": "GLTGLD-250", "price": 299, "stock": 100},
      {"name": "500g Pack", "sku": "GLTGLD-500", "price": 499, "stock": 50}
    ]
  }'
```

### Update Variation (admin/vendor)
```bash
curl -X PUT http://localhost:3000/api/variations/7 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"price": 549, "stock": 40}'
```

### Delete Variation (admin)
```bash
curl -X DELETE http://localhost:3000/api/variations/7 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 4. Categories

### List All Categories (public)
```bash
curl http://localhost:3000/api/categories
```

### Get Categories with Product Counts
```bash
curl http://localhost:3000/api/categories/with-counts \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Single Category
```bash
curl http://localhost:3000/api/categories/3 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Create Category
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Fine Glitters", "description": "Ultra-fine glitter products"}'
```

### Update Category
```bash
curl -X PUT http://localhost:3000/api/categories/3 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Ultra-Fine Glitters"}'
```

### Delete Category
```bash
curl -X DELETE http://localhost:3000/api/categories/3 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 5. Sales Orders

### Health Check (public)
```bash
curl http://localhost:3000/api/sales-orders/health
```

### List All Sales Orders (admin/vendor)
```bash
curl http://localhost:3000/api/sales-orders \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

With filters:
```bash
curl "http://localhost:3000/api/sales-orders?status=pending&page=1&limit=20&startDate=2026-01-01&endDate=2026-03-31" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Search Sales Orders (admin/vendor)
```bash
curl "http://localhost:3000/api/sales-orders/search?q=john&status=confirmed" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Complete Orders with All Data (admin/vendor)
```bash
curl http://localhost:3000/api/sales-orders/complete \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get My Orders (customer)
```bash
curl http://localhost:3000/api/sales-orders/my-orders \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Debug Order PDF (admin)
```bash
curl http://localhost:3000/api/sales-orders/debug/15 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Single Order
```bash
curl http://localhost:3000/api/sales-orders/15 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Create Sales Order
```bash
curl -X POST http://localhost:3000/api/sales-orders \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 5,
    "items": [
      {"productId": 42, "variationId": 7, "quantity": 2, "price": 499},
      {"productId": 43, "variationId": null, "quantity": 1, "price": 299}
    ],
    "discountPercentage": 10,
    "extraDiscountPercentage": 5,
    "gstRate": 18,
    "courierCharge": 50,
    "packagingCharge": 20,
    "shippingAddress": "123 Main St, Mumbai 400001",
    "notes": "Handle with care"
  }'
```

### Update Sales Order (admin/vendor)
```bash
curl -X PUT http://localhost:3000/api/sales-orders/15 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "discountPercentage": 15,
    "courierCharge": 75,
    "notes": "Updated notes"
  }'
```

### Update Order Status (admin/vendor)
```bash
curl -X PATCH http://localhost:3000/api/sales-orders/15/status \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

Available statuses: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`

### Delete Sales Order (admin/vendor)
```bash
curl -X DELETE http://localhost:3000/api/sales-orders/15 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Calculate Courier Charges
```bash
curl -X POST http://localhost:3000/api/sales-orders/calculate-courier \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"pincode": "400001", "weight": 1.5}'
```

---

## 6. Customers

### Get My Customer Profile (customer)
```bash
curl http://localhost:3000/api/customers/profile \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Update My Customer Profile (customer)
```bash
curl -X PUT http://localhost:3000/api/customers/profile \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "My Shop",
    "phone": "9876543210",
    "address": "456 Market Rd, Delhi"
  }'
```

### Update Customer Logo (customer)
```bash
curl -X PUT http://localhost:3000/api/customers/profile/logo \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "logo=@/path/to/logo.png"
```

### Link Customer with User (customer)
```bash
curl -X POST http://localhost:3000/api/customers/link/10 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### List All Customers (admin)
```bash
curl http://localhost:3000/api/customers \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

With pagination:
```bash
curl "http://localhost:3000/api/customers?page=1&limit=20" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Search Customers (admin)
```bash
curl "http://localhost:3000/api/customers/search?q=acme" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Single Customer (admin)
```bash
curl http://localhost:3000/api/customers/10 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Create Customer (admin)
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=Acme Corp" \
  -F "email=acme@example.com" \
  -F "phone=9876543210" \
  -F "address=789 Business Park, Bangalore" \
  -F "logo=@/path/to/logo.png"
```

### Update Customer (admin)
```bash
curl -X PUT http://localhost:3000/api/customers/10 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "phone=9876543211" \
  -F "address=New Address, Mumbai"
```

### Delete Customer (admin)
```bash
curl -X DELETE http://localhost:3000/api/customers/10 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Import Customers from CSV/Excel (admin)
```bash
curl -X POST http://localhost:3000/api/customers/import \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "file=@/path/to/customers.csv"
```

### Download Import Template (admin)
```bash
curl http://localhost:3000/api/customers/import/template \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -o customers_template.xlsx
```

---

## 7. Dashboard

### Get Dashboard Stats (admin)
```bash
curl http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 8. Notifications

### List Notifications
```bash
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

With filters:
```bash
curl "http://localhost:3000/api/notifications?page=1&limit=20&type=order&isRead=false" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Unread Count
```bash
curl http://localhost:3000/api/notifications/unread-count \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Mark Notification as Read
```bash
curl -X PUT http://localhost:3000/api/notifications/55/read \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Mark All as Read
```bash
curl -X PUT http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Delete Notification
```bash
curl -X DELETE http://localhost:3000/api/notifications/55 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Delete All Read Notifications
```bash
curl -X DELETE http://localhost:3000/api/notifications/read \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Subscribe to Push Notifications
```bash
curl -X POST http://localhost:3000/api/notifications/push/subscribe \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {"p256dh": "...", "auth": "..."}
    }
  }'
```

### Unsubscribe from Push Notifications
```bash
curl -X POST http://localhost:3000/api/notifications/push/unsubscribe \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "https://fcm.googleapis.com/fcm/send/..."}'
```

### Get Notification Preferences
```bash
curl http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Update Notification Preferences
```bash
curl -X PUT http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "emailNotifications": true,
    "pushNotifications": false,
    "orderUpdates": true
  }'
```

### Send Test Notification (admin)
```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 9. Pincode Rates

### Lookup Rate by Pincode (no module required)
```bash
curl http://localhost:3000/api/pincode-rates/lookup/400001 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### List All Pincode Rates
```bash
curl http://localhost:3000/api/pincode-rates \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

With pagination:
```bash
curl "http://localhost:3000/api/pincode-rates?page=1&limit=50" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Single Pincode Rate
```bash
curl http://localhost:3000/api/pincode-rates/8 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Create Pincode Rate
```bash
curl -X POST http://localhost:3000/api/pincode-rates \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"pincode": "400001", "zone": "Zone A", "rate": 50, "weight": 1}'
```

### Bulk Create/Update Pincode Rates
```bash
curl -X POST http://localhost:3000/api/pincode-rates/bulk \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "rates": [
      {"pincode": "400001", "zone": "Zone A", "rate": 50},
      {"pincode": "400002", "zone": "Zone A", "rate": 55}
    ]
  }'
```

### Update Pincode Rate
```bash
curl -X PUT http://localhost:3000/api/pincode-rates/8 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"rate": 60}'
```

### Delete Pincode Rate
```bash
curl -X DELETE http://localhost:3000/api/pincode-rates/8 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 10. User Access & Users

> All routes require: JWT + admin role + `user_access` module

### List All Users with Module Access
```bash
curl http://localhost:3000/api/user-access/users \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get All Available Modules
```bash
curl http://localhost:3000/api/user-access/modules \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get User's Module Access
```bash
curl http://localhost:3000/api/user-access/users/3 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Update User Module Permissions
```bash
curl -X PUT http://localhost:3000/api/user-access/users/3 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "modules": ["products", "categories", "sales_orders"]
  }'
```

### Toggle Module Access
```bash
curl -X POST http://localhost:3000/api/user-access/toggle \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"userId": 3, "moduleCode": "sales_orders"}'
```

### Create User (admin)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Vendor",
    "email": "jane@example.com",
    "password": "secure123",
    "role": "vendor"
  }'
```

### Update User (admin)
```bash
curl -X PUT http://localhost:3000/api/users/3 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith", "email": "jane.smith@example.com"}'
```

### Delete User (admin)
```bash
curl -X DELETE http://localhost:3000/api/users/3 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 11. API Keys

> All routes require: JWT + admin role + `api_keys` module

### List All API Keys
```bash
curl http://localhost:3000/api/api-keys \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get API Key Stats Summary
```bash
curl http://localhost:3000/api/api-keys/stats \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Create API Key
```bash
curl -X POST http://localhost:3000/api/api-keys \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tally Bridge Key",
    "description": "Used by Tally Bridge integration",
    "permissions": ["tally.sync", "tally.read"]
  }'
```

### Create Default Tally Bridge Key
```bash
curl -X POST http://localhost:3000/api/api-keys/tally-bridge \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Single API Key
```bash
curl http://localhost:3000/api/api-keys/2 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Update API Key
```bash
curl -X PUT http://localhost:3000/api/api-keys/2 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Key Name", "isActive": true}'
```

### Delete API Key
```bash
curl -X DELETE http://localhost:3000/api/api-keys/2 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Regenerate API Key
```bash
curl -X POST http://localhost:3000/api/api-keys/2/regenerate \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get API Key Usage Stats
```bash
curl http://localhost:3000/api/api-keys/2/stats \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 12. Tally

> All routes require: JWT + admin role + `tally` module (except `/sync` which uses API key)

### Test TallyPrime Connection
```bash
curl -X POST http://localhost:3000/api/tally/test-connection \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Connection Status
```bash
curl http://localhost:3000/api/tally/connection-status \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Sync All Ledgers from TallyPrime
```bash
curl -X POST http://localhost:3000/api/tally/sync-ledgers \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get All Ledgers
```bash
curl http://localhost:3000/api/tally/ledgers \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

With filters:
```bash
curl "http://localhost:3000/api/tally/ledgers?page=1&limit=50&group=Sundry+Debtors" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Single Ledger
```bash
curl http://localhost:3000/api/tally/ledgers/20 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Sync Specific Ledger
```bash
curl -X POST http://localhost:3000/api/tally/sync-ledger/Acme%20Corp \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Sync Stats
```bash
curl http://localhost:3000/api/tally/sync-stats \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Sync Logs
```bash
curl "http://localhost:3000/api/tally/sync-logs?page=1&limit=20" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Tally Reports
```bash
curl "http://localhost:3000/api/tally/reports?type=balance-sheet&fromDate=2026-01-01&toDate=2026-03-31" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Single Report
```bash
curl http://localhost:3000/api/tally/reports/5 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Daybook (Voucher Entries)
```bash
curl "http://localhost:3000/api/tally/daybook?fromDate=2026-03-01&toDate=2026-03-31" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Voucher by ID
```bash
curl http://localhost:3000/api/tally/vouchers/100 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Stock Items
```bash
curl "http://localhost:3000/api/tally/stock-items?group=Glitters" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Single Stock Item
```bash
curl http://localhost:3000/api/tally/stock-items/30 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Stock Groups
```bash
curl http://localhost:3000/api/tally/stock-groups \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Outstanding Reports
```bash
curl http://localhost:3000/api/tally/outstanding \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Profit & Loss Reports
```bash
curl http://localhost:3000/api/tally/profit-loss \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get Ledger Transactions
```bash
curl http://localhost:3000/api/tally/ledgers/20/transactions \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Push Sales Order to Tally
```bash
curl -X POST http://localhost:3000/api/tally/push-sales-order/15 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 13. Tally Integration (Bridge)

> These routes authenticate via API key (`x-api-key` header), called by Tally Bridge software.

### Sync Data from Tally Bridge
```bash
curl -X POST http://localhost:3000/api/tally/sync \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"type": "daybook", "data": {...}}'
```

### Process Daybook / Vouchers
```bash
curl -X POST http://localhost:3000/api/tally/integration/daybook \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "DATA": {
      "COLLECTION": {
        "VOUCHER": [
          {"DATE": "20260301", "VOUCHERTYPENAME": "Sales", "AMOUNT": 1000}
        ]
      }
    }
  }'
```

### Process Ledger Master Data
```bash
curl -X POST http://localhost:3000/api/tally/integration/ledgers \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "DATA": {
      "COLLECTION": {
        "LEDGER": [
          {"NAME": "Acme Corp", "PARENT": "Sundry Debtors", "OPENINGBALANCE": 0}
        ]
      }
    }
  }'
```

### Process Stock Summary
```bash
curl -X POST http://localhost:3000/api/tally/integration/stock-summary \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "DATA": {
      "COLLECTION": {
        "STOCKITEM": [
          {"NAME": "Gold Glitter 500g", "CLOSINGBALANCE": 200, "RATE": 499}
        ]
      }
    }
  }'
```

### Process Sales Register
```bash
curl -X POST http://localhost:3000/api/tally/integration/sales-register \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "DATA": {
      "COLLECTION": {
        "VOUCHER": [...]
      }
    }
  }'
```

### Process Financial Reports
```bash
curl -X POST http://localhost:3000/api/tally/integration/reports \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"reportType": "balance-sheet", "data": {...}}'
```

### Process All Reports (Consolidated)
```bash
curl -X POST http://localhost:3000/api/tally/integration/all-reports \
  -H "x-api-key: <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"metadata": {"syncDate": "2026-03-24", "companyName": "Glitteron"}}'
```

### Get Sync Status (Bridge)
```bash
curl http://localhost:3000/api/tally/integration/sync-status \
  -H "x-api-key: <API_KEY>"
```

---

## 14. AR (Augmented Reality)

### Get All AR-Enabled Products (public)
```bash
curl http://localhost:3000/api/ar/products
```

### Get AR Data for Product (public)
```bash
curl http://localhost:3000/api/ar/products/42
```

### Get AR Marker for Product (public)
```bash
curl http://localhost:3000/api/ar/products/42/marker
```

### Create AR Session
```bash
curl -X POST http://localhost:3000/api/ar/sessions \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productId": 42, "deviceInfo": "iPhone 14 Pro"}'
```

### Get AR Sessions (customer/admin)
```bash
curl http://localhost:3000/api/ar/sessions \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

With filters:
```bash
curl "http://localhost:3000/api/ar/sessions?productId=42&page=1&limit=10" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Get AR Analytics (admin)
```bash
curl "http://localhost:3000/api/ar/analytics?fromDate=2026-01-01&toDate=2026-03-31" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 15. Logs

### Post Client Logs (public)
```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [
      {"level": "error", "message": "Something broke", "timestamp": "2026-03-24T10:00:00Z", "context": {"page": "/cart"}},
      {"level": "info", "message": "Page loaded", "timestamp": "2026-03-24T10:00:01Z"}
    ]
  }'
```

---

## 16. Health

### Application Health Check (public)
```bash
curl http://localhost:3000/health
```

### API Info (public)
```bash
curl http://localhost:3000/
```

---

## Common Headers Reference

| Header | Value | When |
|--------|-------|------|
| `Authorization` | `Bearer eyJhbGci...` | All JWT-protected routes |
| `Content-Type` | `application/json` | JSON request bodies |
| `Content-Type` | `multipart/form-data` | File uploads (set automatically by curl `-F`) |
| `x-api-key` | `gltr_xxxx...` | Tally Bridge integration routes |

## Module Codes Reference

| Module Code | Description |
|-------------|-------------|
| `products` | Product management |
| `categories` | Category management |
| `sales_orders` | Sales order management |
| `customers` | Customer management |
| `dashboard` | Dashboard stats |
| `tally` | Tally integration |
| `api_keys` | API key management |
| `user_access` | User & permission management |
| `pincode_rates` | Courier pincode rates |

## Role Reference

| Role | Access Level |
|------|-------------|
| `admin` | Full system access |
| `vendor` | Products, variations, sales orders |
| `customer` | Own profile and orders only |

##test
## Pricing Formula

```
subtotal = sum(item.price × item.quantity)
afterDiscount1 = subtotal × (1 - discountPercentage/100) - discountAmount
afterDiscount2 = afterDiscount1 × (1 - extraDiscountPercentage/100) - extraDiscountAmount
gstAmount = afterDiscount2 × (gstRate/100)
totalAmount = afterDiscount2 + gstAmount + courierCharge + packagingCharge
```
