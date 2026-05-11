# OMAHRING — Backend Architecture

> **Who should read this:** Backend engineers and AI assistants working on the server layer.  
> **Why it matters:** A well-structured backend supports scalability, testability, and team collaboration. Without clean separation of concerns, every bug becomes a mystery and every feature addition risks breaking existing behavior.

---

## 1. Current Problems

| Problem | File | Impact |
|---|---|---|
| **Fat controllers** | `shop/order-controller.js` (370 lines) | Untestable, fragile, violates SRP |
| **Business logic in controllers** | All controllers | Cannot unit test without HTTP layer |
| **No service layer** | Entire server | Logic cannot be reused across endpoints |
| **No repository pattern** | Entire server | DB implementation leaked into every layer |
| **Duplicate auth middleware** | `auth-controller.js` exports `authMiddleware`; `middleware/authMiddleware.js` exports `authenticate` — two different implementations used inconsistently | Security inconsistency |
| **N+1 queries in cart** | `cart-controller.js` — product population via loop | Performance degradation at scale |
| **Synchronous payment fulfillment** | `order-controller.js:fulfillPaidOrder` called inline in webhook handler | Race condition, webhook timeout risk |
| **Dead code** | `helpers/paypal.js` never called; `processVariants` defined but not used in products-controller | Code confusion |
| **MongoDB `_id` shim** | All controllers: `{ ...row, _id: row.id }` | Legacy confusion, double ID fields |
| **No input validation library** | Manual `if (!field)` checks scattered | Inconsistent, incomplete validation |
| **No global error handler** | Each controller has its own try/catch | No centralized error response format |
| **Test files in server root** | `test_chat.js`, `test_db.js`, etc. in root | Not isolated, not automated |
| **Secrets from DB** | Midtrans keys fetched from `store_settings` table on every request | Performance issue + dual source of truth |

---

## 2. Ideal Backend Architecture

### Layered Architecture Pattern

```
HTTP Request
    │
    ▼
Route Definition
    │
    ▼
Middleware (Auth → Validation → Rate Limiting)
    │
    ▼
Controller (HTTP only: parse request → call service → return response)
    │
    ▼
Service (Business logic: orchestration, rules, calculations)
    │
    ▼
Repository (Database queries: read/write, no business logic)
    │
    ▼
Supabase (PostgreSQL)
```

### Responsibility Boundaries

| Layer | Does | Does NOT |
|---|---|---|
| **Route** | Register method + path + middleware + controller | Business logic |
| **Controller** | Parse req body/params, call service, format response | DB queries, business rules |
| **Service** | Orchestrate, validate business rules, call repositories | HTTP concerns (`req`/`res`) |
| **Repository** | Execute DB queries, return typed data | Business logic |
| **Middleware** | Cross-cutting: auth, validation, logging | Business logic |

---

## 3. Ideal Module Structure

```
server/
├── server.js               ← Express setup only (init, middleware, router mount)
├── config/
│   ├── supabase.js         ← Supabase client singleton
│   └── env.js              ← Validated env vars (fail fast on startup)
├── middleware/
│   ├── auth.middleware.js   ← authenticate() + authorizeRoles()
│   ├── validate.middleware.js ← validateBody(schema), validateParams(schema)
│   ├── error.middleware.js  ← Global error handler (last middleware)
│   └── rateLimiter.middleware.js ← Per-route rate limiting
├── modules/
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.repository.js
│   │   └── auth.schema.js       ← Zod schemas
│   ├── products/
│   │   ├── products.routes.js
│   │   ├── products.controller.js
│   │   ├── products.service.js
│   │   ├── products.repository.js
│   │   └── products.schema.js
│   ├── orders/
│   │   ├── orders.routes.js
│   │   ├── orders.controller.js
│   │   ├── orders.service.js
│   │   ├── orders.repository.js
│   │   └── orders.schema.js
│   ├── cart/
│   ├── chat/
│   ├── birds/
│   ├── articles/
│   ├── members/
│   ├── promos/
│   ├── analytics/
│   ├── settings/
│   └── staff/
├── shared/
│   ├── supabase.client.js   ← Exported Supabase singleton
│   ├── cloudinary.service.js ← Cloudinary upload abstraction
│   ├── midtrans.service.js   ← Midtrans Snap factory (dynamic keys)
│   ├── shipping.service.js   ← RajaOngkir integration
│   └── pagination.helper.js  ← Standard pagination utility
└── tests/                   ← All test files live here
    ├── unit/
    │   ├── orders.service.test.js
    │   └── auth.service.test.js
    └── integration/
        ├── orders.routes.test.js
        └── auth.routes.test.js
```

---

## 4. Example: Ideal Service Layer (Orders)

```js
// modules/orders/orders.service.js

const ordersRepository = require('./orders.repository');
const productsRepository = require('../products/products.repository');
const midtransService = require('../../shared/midtrans.service');
const settingsRepository = require('../settings/settings.repository');

const createOrder = async ({ userId, cartItems, addressInfo, totalAmount, cartId, customerName, email, shippingCost, paymentCategory }) => {
  // 1. Business validation
  if (!userId) throw new ValidationError('User ID is required');
  if (!cartItems?.length) throw new ValidationError('Cart items cannot be empty');
  
  // 2. Prevent duplicate checkout
  const existing = await ordersRepository.findPendingByCartId(cartId);
  if (existing) throw new ConflictError('Checkout already in progress for this cart');
  
  // 3. Validate and calculate items
  const { normalizedItems, productTotal } = await validateAndNormalizeItems(cartItems);
  
  // 4. Calculate fees
  const settings = await settingsRepository.getStoreSettings();
  const { expectedTotal, paymentServiceFee } = calculateTotals({
    productTotal, shippingCost, storeServiceFee: settings.store_service_fee, paymentCategory
  });
  
  // 5. Verify total (fraud prevention)
  if (totalAmount !== expectedTotal) throw new ValidationError(`Total mismatch: received ${totalAmount}, expected ${expectedTotal}`);
  
  // 6. Create order record
  const order = await ordersRepository.create({
    userId, customerName, email, cartId,
    cartItems: normalizedItems, addressInfo,
    totalAmount: expectedTotal, shippingCost,
    paymentCategory, paymentServiceFee,
    storeServiceFee: settings.store_service_fee
  });
  
  // 7. Create Midtrans token
  const snap = await midtransService.getSnap();
  const transaction = await snap.createTransaction(buildSnapParams(order, normalizedItems));
  
  // 8. Update order with token
  await ordersRepository.updateMidtransData(order.id, transaction);
  
  // 9. Return result (no HTTP concern)
  return { token: transaction.token, redirectUrl: transaction.redirect_url, orderId: order.id };
};

module.exports = { createOrder };
```

---

## 5. Repository Pattern

```js
// modules/orders/orders.repository.js

const supabase = require('../../shared/supabase.client');

const findById = async (id) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const findPendingByCartId = async (cartId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('cart_id', cartId)
    .in('payment_status', ['unpaid', 'pending'])
    .maybeSingle();
  if (error) throw error;
  return data;
};

const create = async (orderData) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = { findById, findPendingByCartId, create };
```

---

## 6. Middleware Design

### Auth Middleware (Unified)

```js
// middleware/auth.middleware.js

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || extractBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await usersRepository.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    
    req.user = { id: user.id, email: user.email, userName: user.user_name, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
  next();
};
```

### Global Error Handler

```js
// middleware/error.middleware.js

const errorHandler = (err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err.message, err.stack);
  
  if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: err.message });
  if (err.name === 'ConflictError') return res.status(409).json({ success: false, message: err.message });
  if (err.name === 'NotFoundError') return res.status(404).json({ success: false, message: err.message });
  
  res.status(500).json({ success: false, message: 'Internal server error.' });
};

module.exports = errorHandler;
```

### Input Validation Middleware (Zod)

```js
// middleware/validate.middleware.js

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }
  req.validatedBody = result.data;
  next();
};
```

---

## 7. Queue / Background Jobs

### BullMQ Setup (Future)

```js
// shared/queues/order.queue.js
const { Queue, Worker } = require('bullmq');
const redis = { host: process.env.REDIS_HOST, port: 6379 };

const orderQueue = new Queue('order-fulfillment', { connection: redis });

const fulfillmentWorker = new Worker('order-fulfillment', async (job) => {
  const { orderId } = job.data;
  const order = await ordersRepository.findById(orderId);
  
  // Deduct inventory
  for (const item of order.cart_items) {
    await productVariantsRepository.decrementStock(item.variant_id, item.quantity);
  }
  
  // Send confirmation email
  await emailService.sendOrderConfirmation(order);
  
  // Update user performance stats
  await usersRepository.incrementOrderStats(order.user_id, order.total_amount);
}, { connection: redis });

module.exports = { orderQueue };
```

---

## 8. Caching Strategy

```js
// shared/cache.service.js
const redis = require('ioredis');
const client = new redis(process.env.REDIS_URL);

const cache = {
  get: async (key) => {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  },
  set: async (key, value, ttlSeconds) => {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  },
  del: async (key) => client.del(key),
};

// Usage in repository:
const getStoreSettings = async () => {
  const cached = await cache.get('settings:store');
  if (cached) return cached;
  
  const { data } = await supabase.from('store_settings').select('*').single();
  await cache.set('settings:store', data, 3600); // 1 hour TTL
  return data;
};
```

---

## 9. Dependency Injection Pattern

Since OMAHRING uses CommonJS, use simple module exports as singletons:

```js
// All repositories and services are singletons via module caching
const ordersService = require('./orders.service');        // Singleton
const ordersRepository = require('./orders.repository'); // Singleton
```

For testing, dependencies can be mocked via Jest's module mock system.

---

## 10. Refactor Direction

### Phase 1 — Immediate (Zero-risk cleanup)
1. Remove `_id` field mapping from all controller responses
2. Remove `helpers/paypal.js` (dead code)
3. Remove `test_*.js` files from server root (move to `tests/` or delete)
4. Standardize all error responses to include proper HTTP status codes
5. Merge duplicate auth: delete `authMiddleware` export from `auth-controller.js`, use only `middleware/authMiddleware.js`

### Phase 2 — Service Layer Extraction
6. Extract `order-controller.js` business logic → `orders.service.js`
7. Extract `auth-controller.js` business logic → `auth.service.js`
8. Extract `products-controller.js` business logic → `products.service.js`
9. Add Zod schemas for all POST/PUT request bodies
10. Add global error handler middleware

### Phase 3 — Repository Pattern
11. Extract all Supabase calls from controllers/services → repositories
12. Fix N+1 cart population with a JOIN or batch query

### Phase 4 — Infrastructure
13. Add BullMQ for async order fulfillment
14. Add Redis caching for store settings and product catalog
15. Add Pino structured logging

---

*Last updated: 2026-05-11 | Generated by architecture audit*

---

## 11. Payment Strategy Pattern (Dual Payment Mode)

> **Reference:** ADR-006 — Decoupled payment handling for Midtrans and Manual modes.

### 11.1 Architecture

The payment logic is fully abstracted behind a **Strategy Pattern** in `server/shared/payment/`. The `orders.service.js` never directly references Midtrans or bank transfer logic — it only calls the active strategy.

```
server/shared/payment/
├── payment.factory.js          ← Reads payment_mode, returns active strategy
├── payment.interface.js        ← JSDoc interface definition (contract)
├── midtrans.strategy.js        ← Midtrans Snap implementation
└── manual.strategy.js          ← Manual transfer / QRIS implementation
```

### 11.2 Unified Interface

All strategies must implement:

```js
// server/shared/payment/payment.interface.js

/**
 * @interface PaymentStrategy
 * 
 * @method initiate(order, settings) → Promise<PaymentResult>
 *   Called after order is created. Returns payment instructions.
 * 
 * @method handleWebhook(payload) → Promise<{ orderId, status }>
 *   Called when payment notification arrives (Midtrans webhook or admin action).
 * 
 * @method getStatus(orderId) → Promise<{ status, details }>
 *   Called for polling payment status.
 * 
 * @typedef {Object} PaymentResult
 * @property {string} paymentMode       - "midtrans" | "manual"
 * @property {Object} instructions      - Mode-specific payload for frontend
 * @property {string} paymentRecordId   - UUID of created payment_record
 */
```

### 11.3 Factory

```js
// server/shared/payment/payment.factory.js

const settingsService = require('../../modules/settings/settings.service');
const midtransStrategy = require('./midtrans.strategy');
const manualStrategy = require('./manual.strategy');

const getPaymentStrategy = async () => {
  const settings = await settingsService.getSettings();
  if (settings.payment_mode === 'manual') return manualStrategy;
  return midtransStrategy; // Default — safe fallback
};

module.exports = { getPaymentStrategy };
```

### 11.4 Midtrans Strategy

```js
// server/shared/payment/midtrans.strategy.js

const { getMidtransSnap } = require('../midtrans');
const paymentRecordsRepository = require('../../modules/orders/payment-records.repository');

const initiate = async (order, settings) => {
  const snap = await getMidtransSnap();
  const transaction = await snap.createTransaction({
    transaction_details: { order_id: order.id, gross_amount: order.total_amount },
    customer_details: { first_name: order.customer_name, email: order.email },
    expiry: { unit: 'minutes', duration: 120 }
  });

  // Store in payment_records (replaces orders.midtrans JSONB)
  const record = await paymentRecordsRepository.create({
    order_id: order.id,
    payment_mode: 'midtrans',
    status: 'awaiting_proof',
    midtrans_order_id: order.id,
    midtrans_snap_token: transaction.token,
    midtrans_token_expiry: new Date(Date.now() + 120 * 60 * 1000),
    expires_at: new Date(Date.now() + 120 * 60 * 1000)
  });

  return {
    paymentMode: 'midtrans',
    instructions: {
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url
    },
    paymentRecordId: record.id
  };
};

const handleWebhook = async (payload) => {
  const snap = await getMidtransSnap();
  const notification = await snap.transaction.notification(payload);
  const { order_id, transaction_status, fraud_status } = notification;

  let status = 'awaiting_proof';
  if (transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept')) {
    status = 'confirmed';
  } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
    status = 'expired';
  }

  return { orderId: order_id, status, rawPayload: notification };
};

module.exports = { initiate, handleWebhook };
```

### 11.5 Manual Strategy

```js
// server/shared/payment/manual.strategy.js

const paymentRecordsRepository = require('../../modules/orders/payment-records.repository');
const { upload, imageUploadUtil } = require('../cloudinary');

const generateUniqueCode = () => Math.floor(Math.random() * 900) + 100; // 100–999

const initiate = async (order, settings) => {
  const uniqueCode = generateUniqueCode();
  const totalWithCode = order.total_amount + uniqueCode;
  const expiresAt = new Date(Date.now() + (settings.payment_expiry_hours || 24) * 3600 * 1000);

  const record = await paymentRecordsRepository.create({
    order_id: order.id,
    payment_mode: 'manual',
    status: 'awaiting_proof',
    unique_code: uniqueCode,
    total_with_code: totalWithCode,
    expires_at: expiresAt
  });

  return {
    paymentMode: 'manual',
    instructions: {
      qrisUrl: settings.qris_image_url,
      bankAccounts: (settings.bank_accounts || []).filter(b => b.is_active),
      totalAmount: order.total_amount,
      uniqueCode,
      totalWithUniqueCode: totalWithCode,
      expiresAt: expiresAt.toISOString()
    },
    paymentRecordId: record.id
  };
};

const submitProof = async (orderId, imageFile) => {
  const b64 = Buffer.from(imageFile.buffer).toString('base64');
  const dataUrl = `data:${imageFile.mimetype};base64,${b64}`;
  const result = await imageUploadUtil(dataUrl);

  await paymentRecordsRepository.updateByOrderId(orderId, {
    proof_image_url: result.secure_url,
    status: 'proof_submitted',
    updated_at: new Date()
  });

  return { proofUrl: result.secure_url };
};

const confirmPayment = async (orderId, adminUserId) => {
  const record = await paymentRecordsRepository.findByOrderId(orderId);
  if (record.status === 'confirmed') return { alreadyConfirmed: true }; // Idempotent

  await paymentRecordsRepository.updateByOrderId(orderId, {
    status: 'confirmed',
    confirmed_by: adminUserId,
    confirmed_at: new Date()
  });

  return { orderId, status: 'confirmed' };
};

const rejectPayment = async (orderId, adminUserId, reason) => {
  await paymentRecordsRepository.updateByOrderId(orderId, {
    status: 'rejected',
    rejection_reason: reason,
    confirmed_by: adminUserId
  });

  return { orderId, status: 'rejected' };
};

module.exports = { initiate, submitProof, confirmPayment, rejectPayment };
```

### 11.6 Integration in orders.service.js

```js
// modules/orders/orders.service.js (updated createOrder)

const { getPaymentStrategy } = require('../../shared/payment/payment.factory');

const createOrder = async (data) => {
  // ... existing validation and order creation ...
  const order = await ordersRepository.create(orderData);
  await ordersRepository.addItems(order.id, orderItems);

  // ✅ Strategy pattern — no if/else for payment mode here
  const settings = await settingsService.getSettings();
  const paymentStrategy = await getPaymentStrategy();
  const paymentResult = await paymentStrategy.initiate(order, settings);

  // Update order with payment reference
  await ordersRepository.update(order.id, {
    payment_mode: paymentResult.paymentMode,
    payment_reference: `PAY-${order.id.substring(0, 8).toUpperCase()}`
  });

  // Clear cart
  await cartRepository.deleteCart(cartId);

  return {
    orderId: order.id,
    paymentMode: paymentResult.paymentMode,
    instructions: paymentResult.instructions  // Frontend handles based on paymentMode
  };
};
```

### 11.7 Settings Validation (before mode switch)

```js
// modules/settings/settings.service.js (updated updateSettings)

const validatePaymentModeSwitch = async (newMode, currentSettings) => {
  if (newMode === currentSettings.payment_mode) return; // No change

  if (newMode === 'manual') {
    if (!currentSettings.qris_image_url) {
      throw new Error('QRIS image is required before switching to manual mode');
    }
    const activeBanks = (currentSettings.bank_accounts || []).filter(b => b.is_active);
    if (activeBanks.length === 0) {
      throw new Error('At least one active bank account is required');
    }
  }

  // Check for pending manual payments
  const pendingCount = await paymentRecordsRepository.countPendingManual();
  if (pendingCount > 0) {
    throw new Error(`Cannot switch mode — ${pendingCount} manual payment(s) still pending confirmation`);
  }
};
```

---
