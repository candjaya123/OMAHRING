# OMAHRING — API Contract

> **Who should read this:** Backend engineers, frontend engineers, AI assistants, QA engineers.  
> **Why it matters:** A clear API contract prevents frontend/backend integration failures and ensures predictable, consistent behavior across all endpoints.

---

## 1. Base URL

| Environment | Base URL |
|---|---|
| Development | `http://localhost:5005/api` |
| Production | `https://api.omahring.com/api` |

---

## 2. Authentication

All protected endpoints require a valid JWT token stored in an **httpOnly cookie** named `token`.

```
Cookie: token=<JWT>
```

The `Authorization: Bearer <token>` header is also accepted (for mobile/API clients).

**Role hierarchy:**
```
guest < user < member < admin < manager
```

---

## 3. Standard Response Format

All API responses MUST follow this envelope structure:

### Success Response

```json
{
  "success": true,
  "message": "Human-readable message (optional)",
  "data": { ... }  // or array
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Human-readable error description",
  "code": "ERROR_CODE",          // Machine-readable error code (optional but ideal)
  "errors": [                    // Validation errors (optional)
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## 4. HTTP Status Codes

| Status | Usage |
|---|---|
| `200 OK` | Successful GET, PUT, PATCH |
| `201 Created` | Successful POST that creates a resource |
| `400 Bad Request` | Invalid input / validation failure |
| `401 Unauthorized` | No or invalid JWT token |
| `403 Forbidden` | Valid token but insufficient role |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate resource (e.g., email exists, duplicate checkout) |
| `422 Unprocessable Entity` | Business rule violation (e.g., stock insufficient) |
| `500 Internal Server Error` | Unexpected server error |

> **Current Problem:** The codebase inconsistently uses `200` for errors (e.g., `res.json({ success: false, message: '...' })`). All error responses MUST use appropriate HTTP status codes.

---

## 5. Pagination

All list endpoints that can return multiple records MUST support pagination:

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max: 100) |
| `sort` | string | `created_at` | Sort field |
| `order` | `asc` / `desc` | `desc` | Sort direction |

---

## 6. Filtering

List endpoints support filtering via query parameters:

```
GET /api/shop/products?category=murai&price_min=50000&price_max=500000
GET /api/admin/orders?status=pending&date_from=2026-01-01&date_to=2026-12-31
```

---

## 7. API Versioning

> **Ideal (Not yet implemented):** All endpoints should be prefixed with `/api/v1/` to allow non-breaking evolution.

Current: `/api/auth`, `/api/admin/...`, `/api/shop/...`  
Target: `/api/v1/auth`, `/api/v1/admin/...`, `/api/v1/shop/...`

---

## 8. Endpoint Reference

### 8.1 Auth (`/api/auth`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | — | Register new user |
| `POST` | `/api/auth/login` | ❌ | — | Login, set JWT cookie |
| `POST` | `/api/auth/logout` | ✅ | any | Clear JWT cookie |
| `GET` | `/api/auth/check-auth` | ✅ | any | Validate session, return user |
| `GET` | `/api/auth/check-email/:email` | ❌ | — | Check if email already exists |
| `POST` | `/api/auth/upgrade-to-member` | ❌ | — | Upgrade user role to member |

**POST /api/auth/register**
```json
// Request
{
  "userName": "Budi Santoso",
  "email": "budi@example.com",
  "password": "min8chars",
  "nik": "3500XXXXXXXX0001",       // optional
  "phone_number": "08123456789"    // optional
}

// Response 200
{
  "success": true,
  "message": "Registration successful",
  "user": { "id": "uuid", "userName": "...", "email": "...", "role": "user" }
}
```

**POST /api/auth/login**
```json
// Request
{ "email": "budi@example.com", "password": "min8chars" }

// Response 200 + Set-Cookie: token=<JWT>; HttpOnly
{
  "success": true,
  "message": "Logged in successfully",
  "user": { "id": "uuid", "email": "...", "role": "user", "userName": "..." }
}
```

---

### 8.2 Products — Admin (`/api/admin/products`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/admin/products` | ✅ | admin, manager | Fetch all products |
| `GET` | `/api/admin/products/:id` | ✅ | admin, manager | Get product by ID |
| `POST` | `/api/admin/products/upload-image` | ✅ | admin, manager | Upload product image to Cloudinary |
| `POST` | `/api/admin/products/add` | ✅ | admin, manager | Create new product |
| `PUT` | `/api/admin/products/edit/:id` | ✅ | admin, manager | Update product |
| `DELETE` | `/api/admin/products/delete/:id` | ✅ | admin, manager | Delete product |

**POST /api/admin/products/add**
```json
// Request
{
  "title": "Murai Batu Kalimantan",
  "description": "...",
  "category": ["murai", "kalimantan"],
  "media": {
    "images": ["https://cloudinary.com/..."],
    "video": null
  },
  "variants": [
    { "name": "Anakan Jantan", "price": 1500000, "salePrice": 0, "totalStock": 5 }
  ],
  "shipping": { "weight": 500, "originCityId": "399" }
}
```

---

### 8.3 Products — Shop (`/api/shop/products`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/shop/products` | ❌ | — | Fetch published products (with filters) |
| `GET` | `/api/shop/products/:id` | ❌ | — | Get product detail |

**Query Parameters for GET /api/shop/products:**
```
?category=murai&search=kalimantan&sort=price&order=asc&page=1&limit=20
```

---

### 8.4 Cart (`/api/shop/cart`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/shop/cart/add` | ❌ | — | Add item to cart (guest or user) |
| `GET` | `/api/shop/cart/:id` | ❌ | — | Fetch cart by userId or sessionId |
| `PUT` | `/api/shop/cart/update-cart` | ❌ | — | Update item quantity |
| `DELETE` | `/api/shop/cart/:id/:productId/:variantName` | ❌ | — | Remove item from cart |
| `POST` | `/api/shop/cart/merge` | ✅ | user+ | Merge guest cart into user cart |

**POST /api/shop/cart/add**
```json
{
  "userId": "uuid",        // OR
  "sessionId": "guest-xxx",
  "productId": "uuid",
  "quantity": 2,
  "variant": { "name": "Anakan Jantan" }
}
```

---

### 8.5 Orders — Shop (`/api/shop/order`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/shop/order/create` | ❌ | — | Create order + Midtrans Snap token |
| `POST` | `/api/shop/order/notification` | ❌ | — | Midtrans webhook handler |
| `GET` | `/api/shop/order/:userId` | ✅ | user+ | Get all orders for a user |
| `GET` | `/api/shop/order/details/:id` | ✅ | user+ | Get order detail |
| `POST` | `/api/shop/order/regenerate-token/:orderId` | ❌ | — | Regenerate expired Snap token |

**POST /api/shop/order/create**
```json
{
  "userId": "uuid | guest-xxx",
  "customerName": "Budi Santoso",
  "email": "budi@example.com",
  "cartId": "uuid",
  "cartItems": [...],
  "addressInfo": {
    "address": "Jl. Mojopahit No. 10",
    "city": "Mojokerto",
    "pincode": "61321",
    "phone": "08123456789"
  },
  "totalAmount": 1650000,
  "shippingCost": 50000,
  "paymentCategory": "bank_transfer"
}

// Response 201
{
  "success": true,
  "token": "<midtrans-snap-token>",
  "redirectUrl": "https://app.midtrans.com/...",
  "orderId": "uuid",
  "userId": "uuid",
  "tokenExpiry": "2026-05-11T16:00:00.000Z"
}
```

---

### 8.6 Orders — Admin (`/api/admin/orders`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/admin/orders` | ✅ | admin, manager | Get all orders |
| `GET` | `/api/admin/orders/:id` | ✅ | admin, manager | Get order detail |
| `PUT` | `/api/admin/orders/:id` | ✅ | admin, manager | Update order status |

---

### 8.7 Shipping (`/api/shop/shipping`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/shop/shipping/cities` | ❌ | — | Get city list |
| `POST` | `/api/shop/shipping/cost` | ❌ | — | Calculate shipping cost |

---

### 8.8 Chat (`/api/chat`)

> **Updated:** Context tag support added (ADR-007)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/chat/start` | ❌ | — | Start or get existing session (with optional context tag) |
| `POST` | `/api/chat/message` | ❌ | — | Customer sends a message |
| `GET` | `/api/chat/messages/:sessionId` | ❌ | — | Get all messages for a session |
| `GET` | `/api/chat/sessions` | ✅ | admin, manager | List all sessions (includes context tags) |
| `POST` | `/api/chat/reply` | ✅ | admin, manager | Admin replies to a session |
| `PUT` | `/api/chat/session/:id/close` | ✅ | admin, manager | Close a session |
| `GET` | `/api/chat/unread-count` | ✅ | admin, manager | Total unread message count |

**POST /api/chat/start**

```json
// Request — customer on a product page
{
  "customer_id": "uuid",          // optional (null for guests)
  "session_token": "guest-xxx",   // optional (guest identifier)
  "context": {                    // optional — omit for general chat
    "type": "product",            // "product" | "article"
    "id": "product-uuid",
    "title": "Murai Batu Kalimantan",
    "url": "/shop/products/product-uuid"
  }
}

// Request — customer on an article page
{
  "customer_id": "uuid",
  "context": {
    "type": "article",
    "id": "article-uuid",
    "title": "Tips Merawat Murai di Musim Hujan",
    "url": "/shop/articles/article-uuid"
  }
}

// Request — general chat (no context)
{
  "customer_id": "uuid"
}

// Response 200 (session created or resumed)
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "isNew": true,
    "context": {
      "type": "product",
      "id": "product-uuid",
      "title": "Murai Batu Kalimantan",
      "url": "/shop/products/product-uuid"
    }
  }
}
```

> **Context behavior:** If a session already exists for the customer, it is resumed and the existing context is preserved — the new `context` in the request is ignored. This prevents overwriting the original inquiry context.

**GET /api/chat/sessions** — Admin session list with context tags:

```json
{
  "success": true,
  "data": [
    {
      "sessionId": "session-uuid",
      "customerId": "user-uuid",
      "customerName": "Budi Santoso",
      "status": "active",
      "unreadCount": 2,
      "lastMessage": "Apakah stok masih ada?",
      "lastMessageAt": "2026-05-11T10:30:00Z",
      "context": {
        "type": "product",
        "id": "product-uuid",
        "title": "Murai Batu Kalimantan",
        "url": "/shop/products/product-uuid"
      }
    },
    {
      "sessionId": "session-uuid-2",
      "customerId": null,
      "customerName": "Guest",
      "status": "active",
      "unreadCount": 0,
      "lastMessage": "Halo, ada pertanyaan",
      "lastMessageAt": "2026-05-11T10:00:00Z",
      "context": {
        "type": "general",
        "id": null,
        "title": null,
        "url": null
      }
    }
  ]
}
```

---

### 8.9 Birds (`/api/shop/birds`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/shop/birds` | ✅ | member+ | Create bird profile |
| `GET` | `/api/shop/birds/:id` | ❌ | — | Get public bird profile |
| `GET` | `/api/shop/birds/member/:userId` | ✅ | member+ | Get all birds by member |
| `PUT` | `/api/shop/birds/:id` | ✅ | member+ | Update bird profile |

---

### 8.10 Articles (`/api/admin/articles` + `/api/shop/articles`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/shop/articles` | ❌ | — | Public articles |
| `GET` | `/api/shop/articles/member` | ✅ | member+ | Member-only articles |
| `GET` | `/api/shop/articles/:id` | ❌ | — | Article detail |
| `POST` | `/api/admin/articles` | ✅ | admin, manager | Create article |
| `PUT` | `/api/admin/articles/:id` | ✅ | admin, manager | Update article |
| `DELETE` | `/api/admin/articles/:id` | ✅ | admin, manager | Delete article |

---

## 9. Current API Problems

| Problem | Example | Fix |
|---|---|---|
| **Errors returned with 200 status** | `res.json({ success: false })` | Use proper HTTP status codes |
| **Inconsistent response field names** | `_id` vs `id`, `cartTotal` vs `cart_total` | Standardize on `id` and `snake_case` |
| **No pagination on list endpoints** | `/api/admin/products` returns all products | Add pagination |
| **No input validation** | Any JSON can be sent to `/api/shop/order/create` | Add Zod schema validation |
| **No API versioning** | `/api/auth` | Move to `/api/v1/auth` |
| **Error messages in Bahasa Indonesia** | `'Produk tidak ditemukan.'` | Use English for system messages, separate i18n |
| **Inconsistent error shapes** | Some return plain strings, some return JSON | Enforce standard error envelope |

---

## 10. Long-Term Recommendations

1. **Implement API versioning** (`/api/v1/`) before public launch
2. **Add OpenAPI/Swagger documentation** — auto-generate from Zod schemas
3. **Add request ID tracing** (`X-Request-ID` header) for observability
4. **Rate limiting** on auth endpoints (max 5 requests per minute per IP)
5. **Webhook signature validation** — already implemented for Midtrans; apply pattern to all webhooks
6. **Idempotency keys** for POST endpoints that create orders

---

*Last updated: 2026-05-11 | Generated by architecture audit*

---

## 11. Dual Payment Mode — API Endpoints

> **Reference:** ADR-006 | All new endpoints are additive. Existing order creation endpoint is backward-compatible.

### 11.1 Order Creation (Updated)

`POST /api/orders/create` — **Updated response** based on active `payment_mode`:

```json
// payment_mode = "midtrans" → unchanged behavior
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "paymentMode": "midtrans",
    "instructions": {
      "snapToken": "<midtrans-snap-token>",
      "redirectUrl": "https://app.midtrans.com/..."
    }
  }
}

// payment_mode = "manual" → new response shape
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "paymentMode": "manual",
    "instructions": {
      "qrisUrl": "https://res.cloudinary.com/.../qris.png",
      "bankAccounts": [
        {
          "bankName": "BCA",
          "accountNumber": "1234567890",
          "accountName": "PT OMAHRING INDONESIA"
        }
      ],
      "totalAmount": 1650000,
      "uniqueCode": 123,
      "totalWithUniqueCode": 1650123,
      "expiresAt": "2026-05-12T16:00:00.000Z"
    }
  }
}
```

---

### 11.2 Manual Payment — Customer Endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/orders/:id/payment-proof` | ✅ | user+ | Upload transfer proof image |
| `GET` | `/api/orders/:id/payment-status` | ✅ | user+ | Poll payment status (30s interval) |

**POST /api/orders/:id/payment-proof**
```
// Request: multipart/form-data
Content-Type: multipart/form-data
Field: proof_image (file, JPEG/PNG, max 5MB)

// Response 200
{
  "success": true,
  "message": "Bukti pembayaran berhasil diupload. Menunggu konfirmasi admin.",
  "data": {
    "proofUrl": "https://res.cloudinary.com/.../proof.jpg",
    "status": "proof_submitted"
  }
}

// Error: already expired
// 410 Gone
{
  "success": false,
  "message": "Payment expired. Please contact support."
}

// Error: too many attempts
// 429 Too Many Requests
{
  "success": false,
  "message": "Maximum upload attempts reached for this order."
}
```

**GET /api/orders/:id/payment-status**
```json
// Response 200
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "paymentMode": "manual",
    "paymentStatus": "proof_submitted",   // orders.payment_status
    "recordStatus": "proof_submitted",    // payment_records.status
    "expiresAt": "2026-05-12T16:00:00Z",
    "rejectionReason": null               // populated if rejected
  }
}
```

---

### 11.3 Manual Payment — Admin Endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/admin/orders/pending-proofs` | ✅ | admin, manager | List orders awaiting proof review |
| `PUT` | `/api/admin/orders/:id/confirm-payment` | ✅ | admin, manager | Approve payment proof |
| `PUT` | `/api/admin/orders/:id/reject-payment` | ✅ | admin, manager | Reject payment proof |

**GET /api/admin/orders/pending-proofs**
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "orderId": "uuid",
      "customerName": "Budi Santoso",
      "totalWithCode": 1650123,
      "proofImageUrl": "https://res.cloudinary.com/.../proof.jpg",
      "submittedAt": "2026-05-11T10:00:00Z",
      "expiresAt": "2026-05-12T16:00:00Z"
    }
  ]
}
```

**PUT /api/admin/orders/:id/confirm-payment**
```json
// Request (no body required)

// Response 200
{
  "success": true,
  "message": "Payment confirmed. Order fulfilled.",
  "data": {
    "orderId": "uuid",
    "orderStatus": "confirmed",
    "paymentStatus": "paid",
    "confirmedBy": "admin-uuid",
    "confirmedAt": "2026-05-11T11:00:00Z"
  }
}

// Idempotent: already confirmed
// 200 (no re-processing)
{
  "success": true,
  "message": "Payment was already confirmed.",
  "data": { "alreadyConfirmed": true }
}
```

**PUT /api/admin/orders/:id/reject-payment**
```json
// Request
{ "reason": "Jumlah transfer tidak sesuai. Mohon transfer Rp 1.650.123." }

// Response 200
{
  "success": true,
  "message": "Payment rejected. Customer has been notified.",
  "data": {
    "orderId": "uuid",
    "status": "rejected",
    "rejectionReason": "Jumlah transfer tidak sesuai. Mohon transfer Rp 1.650.123."
  }
}
```

---

### 11.4 Payment Settings (Manager Only)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/settings` | ❌ | — | Get store settings including payment_mode |
| `PUT` | `/api/settings/payment` | ✅ | manager | Update payment mode and manual config |
| `POST` | `/api/settings/payment/upload-qris` | ✅ | manager | Upload new QRIS image |

**PUT /api/settings/payment**
```json
// Request
{
  "payment_mode": "manual",
  "payment_expiry_hours": 24,
  "manual_verification": "manual",
  "bank_accounts": [
    {
      "bank_name": "BCA",
      "account_number": "1234567890",
      "account_name": "PT OMAHRING INDONESIA",
      "is_active": true
    }
  ]
}

// Response 200
{
  "success": true,
  "message": "Payment settings updated. Store now operating in manual payment mode.",
  "data": { "payment_mode": "manual", ... }
}

// Validation error — pending orders exist
// 422 Unprocessable Entity
{
  "success": false,
  "message": "Cannot switch mode — 3 manual payment(s) still pending confirmation"
}

// Validation error — QRIS not uploaded yet
// 422 Unprocessable Entity
{
  "success": false,
  "message": "QRIS image is required before switching to manual mode"
}
```

**POST /api/settings/payment/upload-qris**
```
// Request: multipart/form-data
// Field: qris_image (file, JPEG/PNG, max 2MB)

// Response 200
{
  "success": true,
  "data": {
    "qris_image_url": "https://res.cloudinary.com/.../qris.png"
  }
}
```

---

### 11.5 Payment Mode Indicator (Public)

`GET /api/settings` response now includes the active payment mode for frontend conditional rendering:

```json
{
  "success": true,
  "data": {
    "store_name": "OMAHRING",
    "store_service_fee": 5000,
    "payment_mode": "manual",         ← Key field for frontend branching
    "midtrans_is_production": false
    // Note: midtrans_server_key and client_key NEVER returned to frontend
  }
}
```

---
