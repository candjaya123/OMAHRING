# OMAHRING — Security Rules

> **Who should read this:** All engineers, AI assistants, and anyone adding new endpoints.  
> **Why it matters:** Security must be systemic and designed in, not bolted on as an afterthought. Every unprotected endpoint or missing validation is a potential breach.

---

## 1. Current Security Problems

| Vulnerability | Location | Risk Level |
|---|---|---|
| **Upgrade-to-member endpoint is unauthenticated** | `POST /api/auth/upgrade-to-member` — no JWT check | 🔴 CRITICAL — anyone can upgrade any account |
| **Hardcoded fallback JWT secret** | `jwt.sign(..., process.env.JWT_SECRET \|\| 'CLIENT_SECRET_KEY')` | 🔴 CRITICAL — if JWT_SECRET env var is missing, insecure default used |
| **No rate limiting on auth endpoints** | `/api/auth/login`, `/api/auth/register` | 🔴 HIGH — brute force attacks possible |
| **Admin endpoints use duplicate middleware** | Some routes use `authMiddleware` from controller, others from middleware file | 🟡 MEDIUM — inconsistent security enforcement |
| **No input validation library** | All controllers do manual `if (!field)` checks | 🟡 MEDIUM — incomplete validation, injection risk |
| **Midtrans keys stored in plaintext in DB** | `store_settings.midtransServerKey` | 🟡 MEDIUM — key exposure if DB is compromised |
| **No CSRF protection** | Cookie-based auth without CSRF token | 🟡 MEDIUM — CSRF attacks possible on state-changing endpoints |
| **`editProduct` accepts entire `req.body` unfiltered** | `products-controller.js:editProduct` calls `.update(req.body)` | 🟡 MEDIUM — mass assignment vulnerability |
| **No password reset flow** | Auth system has no way to reset forgotten passwords | 🟡 MEDIUM — operational gap |
| **No audit log** | Role changes, order changes not logged | 🟡 MEDIUM — no forensic trail |
| **CORS hardcoded origins include localhost** | Production build allows localhost in CORS | 🟢 LOW — minor exposure |

---

## 2. Authentication

### Standard: JWT in httpOnly Cookie

```
Authentication Flow:
  POST /api/auth/login
    → Verify credentials
    → Sign JWT (payload: { id, email, role, userName })
    → Set-Cookie: token=<JWT>; HttpOnly; Secure; SameSite=None (prod)
    → Set-Cookie: token=<JWT>; HttpOnly; SameSite=Lax (dev)
```

### JWT Rules

| Rule | Requirement |
|---|---|
| **Secret key** | MUST come from environment variable `JWT_SECRET` — NO hardcoded fallback |
| **Algorithm** | HS256 (default) — consider RS256 for multi-service environments |
| **Expiry** | 60 minutes (access token) |
| **Refresh** | Planned: 7-day refresh token stored in httpOnly cookie |
| **Payload** | Minimum required fields only: `id`, `email`, `role` |
| **Sensitive data** | NEVER include passwords, NIK, or payment data in JWT payload |

### Cookie Security Config (Required)

```js
res.cookie('token', token, {
  httpOnly: true,                                    // XSS protection — JS cannot read cookie
  secure: process.env.NODE_ENV === 'production',     // HTTPS only in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 60 * 60 * 1000,                           // 60 minutes in ms
});
```

### Mandatory Fixes

```js
// ❌ CURRENT — CRITICAL vulnerability
const token = jwt.sign(payload, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY');

// ✅ REQUIRED FIX
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}
const token = jwt.sign(payload, jwtSecret, { expiresIn: '60m', algorithm: 'HS256' });
```

---

## 3. Authorization (RBAC)

### Role Model

| Role | Permissions |
|---|---|
| `guest` | Browse products, manage own cart (by sessionId) |
| `user` | All guest permissions + checkout, view own orders, manage account |
| `member` | All user permissions + member content, bird profiles |
| `admin` | All member permissions + admin panel (products, orders, articles, promos, chat) |
| `manager` | All admin permissions + staff management, settings, full reports |

### Authorization Middleware Usage

```js
// routes/admin/products.routes.js
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

router.post('/add', authenticate, authorizeRoles('admin', 'manager'), productsController.addProduct);
router.delete('/delete/:id', authenticate, authorizeRoles('manager'), productsController.deleteProduct);
```

### Rules

1. **Every admin route MUST have `authenticate` + `authorizeRoles`**
2. **Every member-only route MUST have `authenticate` + `authorizeRoles('member', 'admin', 'manager')`**
3. **No route should rely on frontend-only access control** — backend MUST enforce roles
4. **The `/api/auth/upgrade-to-member` endpoint MUST require authentication** — fix immediately

```js
// ❌ CURRENT — no auth on upgrade endpoint
router.post('/upgrade-to-member', upgradeToMember);

// ✅ REQUIRED FIX — must be authenticated AND verify payment
router.post('/upgrade-to-member', authenticate, authorizeRoles('user'), upgradeToMember);
```

---

## 4. Input Validation

### Required: Use Zod for All Endpoints

```js
// modules/orders/orders.schema.js
const { z } = require('zod');

const createOrderSchema = z.object({
  userId: z.string().min(1),
  customerName: z.string().min(2).max(100),
  email: z.string().email(),
  cartId: z.string().uuid(),
  cartItems: z.array(z.object({
    productId: z.string().uuid(),
    variantName: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
  addressInfo: z.object({
    address: z.string().min(5),
    city: z.string().min(2),
    phone: z.string().regex(/^(\+62|08)[0-9]{8,12}$/),
    pincode: z.string().optional(),
    notes: z.string().optional(),
  }),
  totalAmount: z.number().int().positive(),
  shippingCost: z.number().int().min(0),
  paymentCategory: z.enum(['bank_transfer', 'qris', 'ewallet', 'minimarket', 'credit_card']),
});
```

### Mass Assignment Prevention

```js
// ❌ CURRENT — mass assignment vulnerability
const { data: updatedProduct } = await supabase
  .from('products')
  .update(req.body)   // Entire request body applied to DB — dangerous
  .eq('id', id);

// ✅ REQUIRED — whitelist allowed fields explicitly
const { title, description, category, media, variants, shipping } = req.body;
const { data: updatedProduct } = await supabase
  .from('products')
  .update({ title, description, category, media, variants, shipping })
  .eq('id', id);
```

---

## 5. Encryption Standards

| Data | Encryption | Standard |
|---|---|---|
| **Passwords** | bcrypt (cost factor 12) ✅ | Correct — do not change |
| **JWT secrets** | Environment variable only | Never in source code |
| **Payment keys** | Environment variable (preferred) or encrypted DB column | Current DB storage is insecure |
| **NIK (ID numbers)** | Currently plaintext in DB | Consider encryption at rest |
| **Sensitive PII** | Currently unencrypted | Encrypt before Indonesian PDPA compliance |

---

## 6. Secret Management

### Rules

1. **NEVER commit `.env` files** — `.gitignore` must include all `.env` variants
2. **NEVER hardcode secrets** in source code or comments
3. **All secrets must be in environment variables** — accessed via `process.env.`
4. **Validate all required secrets on startup** — fail fast if missing

```js
// config/env.js — Startup validation
const requiredEnvVars = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_KEY', 'MIDTRANS_SERVER_KEY', 'CLOUDINARY_CLOUD_NAME'];
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('[FATAL] Missing required environment variables:', missing.join(', '));
  process.exit(1);
}
```

### Required `.env.example` File

```env
# Server
PORT=5005
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here_min_32_chars

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx

# Shipping
RAJAONGKIR_API_KEY=your_rajaongkir_key

# Frontend
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

---

## 7. Audit Logging

### Required Actions to Log

| Action | Data to Log |
|---|---|
| User login | userId, email, timestamp, IP |
| User registration | userId, email, timestamp |
| Role change | targetUserId, oldRole, newRole, changedBy, timestamp |
| Order created | orderId, userId, totalAmount, timestamp |
| Order status change | orderId, oldStatus, newStatus, changedBy, timestamp |
| Product created/edited/deleted | productId, changedBy, timestamp |
| Promo created/deleted | promoId, changedBy, timestamp |
| Admin/manager account created | userId, createdBy, timestamp |

### Audit Log Table (Future)

```sql
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id    UUID REFERENCES users(id),
    action      TEXT NOT NULL,       -- 'user.role_change', 'order.status_change'
    target_type TEXT,                -- 'order', 'user', 'product'
    target_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 8. Rate Limiting

### Required Rate Limits

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/auth/login` | 5 requests | per minute per IP |
| `POST /api/auth/register` | 3 requests | per minute per IP |
| `GET /api/auth/check-email/:email` | 10 requests | per minute per IP |
| All other endpoints | 100 requests | per minute per IP |

```js
// middleware/rateLimiter.middleware.js
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 5,
  message: { success: false, message: 'Too many login attempts. Please try again in a minute.' },
  standardHeaders: true,
});

// Apply in routes
router.post('/login', authLimiter, loginUser);
```

---

## 9. Data Exposure Prevention

### API Response Filtering

Controllers MUST never return:
- `password` field in any user response
- Raw Midtrans `serverKey` or `clientKey` in any response
- Full Supabase error objects (may contain connection strings)
- Internal stack traces in production responses

```js
// ❌ Exposing sensitive fields
res.json({ success: true, data: user }); // If user has password field

// ✅ Explicitly select safe fields
const { id, email, role, user_name } = user;
res.json({ success: true, data: { id, email, role, userName: user_name } });
```

---

## 10. CORS Configuration

```js
// ✅ Production-safe CORS
const allowedOrigins = [
  'https://omahring.com',
  'https://www.omahring.com',
  process.env.CLIENT_URL,
].filter(Boolean);

// ⚠️ Development only — never in production:
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
}
```

---

## 11. Long-Term Security Recommendations

1. **Indonesian PDPA compliance** — NIK and personal data require explicit consent and encryption
2. **Implement refresh token** — reduces attack window from 60 minutes to seconds
3. **Add CSRF protection** — `csurf` middleware for state-changing endpoints
4. **Penetration testing** — before public launch, conduct security audit
5. **Vulnerability scanning** — run `npm audit` in CI/CD and fail builds on high-severity issues
6. **Encrypted DB columns** — for Midtrans keys and NIK data
7. **IP allowlist for admin panel** — restrict admin access by IP in production
8. **Security headers** — add `helmet` middleware for security headers (X-Frame-Options, CSP, etc.)

```js
const helmet = require('helmet');
app.use(helmet());
```

---

*Last updated: 2026-05-11 | Generated by architecture audit*
