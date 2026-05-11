# OMAHRING — System Architecture

> **Who should read this:** All engineers, architects, and AI assistants contributing to the project.  
> **Why it matters:** Prevents architectural chaos, ensures all layers communicate through clean, explicit interfaces, and supports long-term maintainability.

---

## 1. Architecture Style

OMAHRING follows a **Layered Monolith** architecture per service side and a **SPA + API** pattern for frontend/backend communication:

```
┌─────────────────────────────────────────────────┐
│                   CLIENT (SPA)                  │
│   React + Redux Toolkit + React Router v6       │
│   Feature-based folder structure                │
└─────────────────────┬───────────────────────────┘
                      │ HTTP REST (JSON)
                      │ JWT via httpOnly Cookie
┌─────────────────────▼───────────────────────────┐
│                 API LAYER                        │
│   Express.js — Routes → Controllers             │
│   (IDEAL: Routes → Controllers → Services)      │
└─────────────────────┬───────────────────────────┘
                      │ Supabase JS Client
┌─────────────────────▼───────────────────────────┐
│              DATABASE LAYER                     │
│   PostgreSQL via Supabase                       │
└─────────────────────────────────────────────────┘
                      │
         ┌────────────┼───────────┐
         ▼            ▼           ▼
     Cloudinary   Midtrans    RajaOngkir
     (Media)      (Payment)   (Shipping)
```

---

## 2. Current Architecture (As-Is)

### Backend Structure (Current — Problematic)

```
server/
├── server.js           ← All routes registered here (monolithic entry)
├── config/
│   └── supabase.js     ← DB client singleton
├── middleware/
│   └── authMiddleware.js  ← Auth + Role middleware
├── helpers/
│   ├── cloudinary.js
│   ├── midtrans.js
│   ├── paypal.js       ← Legacy, unused
│   └── store-settings-helper.js
├── routes/
│   ├── admin/          ← Route definitions per domain
│   ├── shop/
│   ├── auth/
│   └── common/
└── controllers/
    ├── admin/          ← Contains BOTH business logic + DB queries
    ├── shop/
    ├── auth/
    └── common/
```

**Critical Problems:**
- No service layer — all business logic lives in controllers
- Fat controllers: `order-controller.js` is 370 lines with payment processing, inventory deduction, user creation, and Midtrans integration all mixed together
- Duplicate auth middleware (`auth-controller.js` exports `authMiddleware` AND `middleware/authMiddleware.js` exports `authenticate`) — two different implementations
- No repository abstraction — Supabase calls scattered directly in every controller
- Helper functions (like `processVariants` in products-controller.js) are defined but not actually used in the same file

---

## 3. Ideal Architecture (To-Be)

### Backend — Clean Layered Architecture

```
server/
├── server.js               ← App bootstrap only (express init, middleware, route registration)
├── config/
│   ├── supabase.js         ← DB client (singleton)
│   └── env.js              ← Environment config validation (using Zod)
├── middleware/
│   ├── auth.middleware.js  ← Single unified auth: authenticate + authorizeRoles
│   ├── validate.middleware.js ← Request validation wrapper (Zod schemas)
│   └── error.middleware.js ← Global error handler
├── modules/                ← Feature-based module organization
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js   ← HTTP only: parse request, call service, return response
│   │   ├── auth.service.js      ← Business logic: register, login, upgrade
│   │   ├── auth.repository.js   ← DB queries: findByEmail, updateRole
│   │   └── auth.schema.js       ← Zod validation schemas
│   ├── products/
│   │   ├── products.routes.js
│   │   ├── products.controller.js
│   │   ├── products.service.js
│   │   ├── products.repository.js
│   │   └── products.schema.js
│   ├── orders/
│   │   ├── orders.routes.js
│   │   ├── orders.controller.js
│   │   ├── orders.service.js        ← createOrder, fulfillOrder, handleNotification
│   │   ├── orders.repository.js
│   │   └── orders.schema.js
│   ├── cart/
│   ├── chat/
│   ├── members/
│   ├── birds/
│   ├── articles/
│   ├── analytics/
│   ├── promos/
│   └── settings/
└── shared/
    ├── supabase.client.js   ← Shared DB client
    ├── cloudinary.service.js
    ├── midtrans.service.js
    └── shipping.service.js
```

### Module Dependency Rules

```
Routes → Controller → Service → Repository → Database
                   ↘ (may use) Shared Services (Cloudinary, Midtrans)

FORBIDDEN:
  - Controller → Database (direct)
  - Routes → Service (skip controller)
  - Modules importing from other modules' repositories
```

---

## 4. Frontend Architecture (Ideal)

```
client/src/
├── app/
│   ├── store.js            ← Redux store config
│   ├── router.jsx          ← Centralized route definitions
│   └── providers.jsx       ← App-level providers (Redux, i18n, Router)
├── features/               ← Feature-sliced architecture
│   ├── auth/
│   │   ├── components/     ← AuthForm, LoginCard
│   │   ├── pages/          ← LoginPage, RegisterPage
│   │   ├── store/          ← authSlice, authActions, authSelectors
│   │   └── hooks/          ← useAuth
│   ├── shop/
│   │   ├── catalog/        ← Product listing, search
│   │   ├── cart/           ← Cart state, CartDrawer, CartItem
│   │   ├── checkout/       ← CheckoutForm, PaymentStep, ShippingStep
│   │   ├── orders/         ← OrderHistory, OrderDetail
│   │   └── birds/          ← BirdProfile, QRCard
│   ├── member/
│   │   ├── dashboard/
│   │   └── articles/
│   └── admin/
│       ├── products/
│       ├── orders/
│       ├── analytics/
│       ├── customers/
│       ├── chat/
│       └── settings/
├── shared/
│   ├── components/         ← Reusable UI components (Button, Modal, Table)
│   ├── hooks/              ← useDebounce, usePagination, useLocalStorage
│   ├── utils/              ← formatCurrency, formatDate, validators
│   ├── api/                ← Axios instance, API client base
│   └── constants/          ← APP_ROLES, ROUTES, API_BASE
└── locales/                ← i18n translation files
    ├── id.json
    ├── en.json
    └── ms.json
```

---

## 5. Domain Boundaries

| Domain | Owns | Must NOT touch |
|---|---|---|
| **Auth** | users table, JWT, session | Orders, Products |
| **Products** | products table, media (Cloudinary) | Cart, Orders |
| **Cart** | carts table, guest sessions | Orders directly |
| **Orders** | orders table, Midtrans, inventory deduction | Cart creation |
| **Members** | member role upgrade, bird profiles | Products |
| **Articles** | content table | Orders, Cart |
| **Chat** | chat_sessions, chat_messages | Products, Orders |
| **Analytics** | read-only across orders, products | Write to any table |
| **Settings** | store settings (DB) | Business logic |

---

## 6. Communication Flow

### Request Lifecycle

```
Browser → Nginx → Express Router → Middleware (Auth + Validation) → Controller → Service → Repository → Supabase
```

### Payment Webhook Flow (Ideal)

```
Midtrans Webhook → /api/shop/order/notification
  → Verify Signature (middleware)
  → OrderController.handleNotification
  → OrderService.processPaymentNotification
    → Queue Job: fulfillOrder (async)
      → DeductInventory
      → UpdateOrderStatus
      → SendNotification (email/push)
```

---

## 7. Scalability Strategy Overview

| Concern | Current | Ideal |
|---|---|---|
| **Sessions** | JWT cookie (stateless) ✅ | Keep — add refresh token |
| **Caching** | None | Redis for product catalog, settings |
| **Queue** | None (sync webhook) | BullMQ for order fulfillment |
| **Media** | Cloudinary ✅ | Keep + add CDN headers |
| **DB connections** | Supabase pooling ✅ | Keep + connection pool tuning |
| **Scale** | Single Docker container | Stateless API → horizontal scale |

---

## 8. Current Architecture Violations

| Violation | Location | Impact |
|---|---|---|
| Business logic in controller | `shop/order-controller.js` | Untestable, unmaintainable |
| Direct DB calls in every controller | All controllers | No abstraction, hard to swap DB |
| Duplicate auth middleware | `auth-controller.js` + `authMiddleware.js` | Unpredictable security behavior |
| N+1 queries | `cart-controller.js` (populate loop) | Performance degradation at scale |
| MongoDB `_id` legacy | All controllers add `_id: row.id` | Dead code, misleading |
| PayPal helper never used | `helpers/paypal.js` | Dead code |
| `processVariants` defined but unused | `products-controller.js` | Dead code |

---

## 9. Refactor Direction

### Priority 1 — Immediate Wins (Low Risk)
1. Remove duplicate auth middleware — standardize on `authMiddleware.js`
2. Remove `_id` shim mapping from all controllers (use `id` consistently)
3. Remove dead code: `helpers/paypal.js`, unused `processVariants`
4. Fix N+1 cart population — use single JOIN query or batch fetch

### Priority 2 — Mid-term (Service Layer Introduction)
5. Extract business logic from controllers into service files (start with `orders`, then `auth`, then `products`)
6. Introduce Zod for request validation across all endpoints
7. Add global error handler middleware

### Priority 3 — Long-term (Architecture)
8. Introduce repository pattern for all Supabase interactions
9. Implement BullMQ queue for order fulfillment
10. Normalize JSONB columns (cart items, product variants) into relational tables

---

*Last updated: 2026-05-11 | Generated by architecture audit*
