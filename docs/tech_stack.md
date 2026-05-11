# OMAHRING — Technology Stack

> **Who should read this:** All engineers, DevOps, AI assistants.  
> **Why it matters:** Defines the official technology choices so that no random technology is adopted without architectural justification. Deviating from this stack requires an ADR.

---

## 1. Frontend Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| **Framework** | React | 18.x | Industry standard SPA framework, large ecosystem |
| **Build Tool** | Vite | 5.x | Fast HMR, ESM-native, ideal for React SPA |
| **Language** | JavaScript (JSX) | ES2022+ | Current codebase; TypeScript migration is recommended |
| **State Management** | Redux Toolkit | 2.x | Predictable global state, devtools, normalized store |
| **Routing** | React Router DOM | v6 | Declarative routing, nested routes, loader support |
| **UI Components** | Radix UI | 1.x | Accessible, unstyled primitives |
| **Styling** | TailwindCSS | 3.x | Utility-first, design token system, JIT |
| **HTTP Client** | Axios | 1.x | Interceptors, global error handling |
| **Internationalization** | i18next + react-i18next | 26.x / 17.x | Multi-language support (ID, EN, MS) |
| **Animation** | Framer Motion | 12.x | Smooth UI transitions |
| **Charts** | Recharts | 3.x | Dashboard analytics visualization |
| **Rich Text Editor** | React Quill | 2.x | Article/content editor |
| **Notifications** | React Toastify | 11.x | Toast notifications |
| **QR Code** | qrcode.react | 4.x | Bird profile QR generation |
| **Icons** | Lucide React | 0.429.x | Consistent icon library |

### Recommended Future Additions

| Category | Technology | Reason |
|---|---|---|
| **Type Safety** | TypeScript | Catch runtime errors early, better IDE support |
| **API State** | RTK Query (already in RTK) | Replace manual axios calls + slice boilerplate |
| **Form Management** | React Hook Form + Zod | Replace ad-hoc form state with type-safe validation |
| **Testing** | Vitest + React Testing Library | Unit + component testing |
| **E2E Testing** | Playwright | Automated browser testing |

---

## 2. Backend Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| **Runtime** | Node.js | 20.x LTS | Event-driven, non-blocking I/O |
| **Framework** | Express.js | 4.x | Minimal, flexible, well-understood |
| **Auth** | jsonwebtoken (JWT) | 9.x | Stateless auth via httpOnly cookie |
| **Password Hashing** | bcryptjs | 2.x | Industry-standard bcrypt hashing |
| **Cookie Parsing** | cookie-parser | 1.x | Parse httpOnly JWT cookies |
| **CORS** | cors | 2.x | Cross-origin control |
| **Environment** | dotenv | 16.x | `.env` file loading |
| **File Upload** | multer | 1.x | Multipart form data for image uploads |
| **Development** | nodemon | 3.x | Auto-reload during development |

### Payment Integration

| Provider | Library | Status |
|---|---|---|
| **Midtrans Snap** | `midtrans-client` | ✅ Active — primary payment gateway |
| **PayPal** | `paypal-rest-sdk` | ⚠️ Legacy — code exists but not in use, should be removed |

### Media Integration

| Provider | Library | Status |
|---|---|---|
| **Cloudinary** | `cloudinary` v2 | ✅ Active — product image upload |

### Recommended Future Additions

| Category | Technology | Reason |
|---|---|---|
| **Input Validation** | Zod | Type-safe schema validation for all request bodies |
| **Job Queue** | BullMQ + Redis | Async processing for order fulfillment, notifications |
| **Caching** | `ioredis` | Redis-based caching for product catalog, settings |
| **Logger** | Pino or Winston | Structured logging for production observability |
| **Rate Limiting** | `express-rate-limit` | Protect auth endpoints from brute-force |
| **API Versioning** | Express Router prefix `/api/v1/` | Backward-compatible API evolution |

---

## 3. Database

| Category | Technology | Details |
|---|---|---|
| **Database** | PostgreSQL | Hosted via Supabase |
| **Client** | `@supabase/supabase-js` | v2.x — Supabase JS SDK for DB queries |
| **Hosting** | Supabase BaaS | Managed PostgreSQL, REST API, Realtime |
| **Migrations** | Manual SQL files | `schema.sql`, `fix_*.sql`, `migration_*.sql` |
| **UUIDs** | `uuid-ossp` extension | All primary keys use UUID v4 |

### Important Rule

> **ONLY the backend Express API should connect to Supabase.** The frontend MUST NOT use the Supabase client directly. All data access must go through the Express API for consistent auth, validation, and business logic enforcement.

### Recommended Database Tooling

| Tool | Purpose |
|---|---|
| **Flyway or Liquibase** | Proper migration versioning (replace ad-hoc SQL files) |
| **pgAnalyze** | Query performance analysis |
| **Supabase CLI** | Migration management in CI/CD |

---

## 4. Infrastructure & Deployment

| Category | Technology | Details |
|---|---|---|
| **Containerization** | Docker | Separate `dockerfile` per service (client, server) |
| **Orchestration** | Docker Compose | `docker-compose.yml` at root |
| **Reverse Proxy** | Nginx | Routes `/api/*` → server, `/` → client |
| **Tunnel** | Cloudflare Tunnel | Expose local Docker to public domain |
| **Domain** | omahring.com | Cloudflare DNS managed |
| **Registry** | Docker Hub | `candrakusumawijaya` namespace |

### Environment Config

| File | Purpose |
|---|---|
| `server/.env` | Backend secrets (Supabase, Midtrans, Cloudinary, JWT) |
| `client/.env` | Frontend API URL |
| `client/.env.production` | Production frontend config |
| `.env` (root) | Cloudflare tunnel token, Docker Hub username |

---

## 5. Auth Strategy

| Mechanism | Details |
|---|---|
| **Token Type** | JWT (JSON Web Token) |
| **Storage** | httpOnly Cookie (prevents XSS access) |
| **Expiry** | 60 minutes |
| **Cookie Settings** | `secure: true` in production, `sameSite: none` in production, `sameSite: lax` in dev |
| **Role Claim** | JWT payload includes `role` field |
| **Role Values** | `guest`, `user`, `member`, `admin`, `manager` |

### Recommended Auth Improvements

| Improvement | Why |
|---|---|
| **Refresh Token** | 60-minute JWT forces frequent re-login; add refresh token (7-day) |
| **Token Rotation** | Invalidate old refresh tokens on use |
| **Rate Limiting on /auth** | Prevent brute-force attacks |
| **Password Reset Flow** | Currently missing — needed for production readiness |

---

## 6. Messaging / Queue Systems

| Current | Ideal |
|---|---|
| None — all processing is synchronous | **BullMQ** with Redis for async jobs |

### Planned Queues

| Queue Name | Jobs |
|---|---|
| `order.fulfillment` | Deduct inventory, update order status on payment success |
| `notification.email` | Send order confirmation emails |
| `notification.push` | Push notifications (future) |
| `analytics.aggregation` | Nightly aggregation jobs |

---

## 7. Caching Tools

| Current | Ideal |
|---|---|
| None | **Redis** via `ioredis` |

### Planned Cache Keys

| Cache Key Pattern | TTL | Data |
|---|---|---|
| `products:all` | 5 minutes | Full product list |
| `product:{id}` | 10 minutes | Single product detail |
| `settings:store` | 1 hour | Store settings (Midtrans keys, fees) |
| `analytics:daily` | 1 hour | Dashboard analytics summary |

---

## 8. CDN Strategy

| Asset Type | Current | Ideal |
|---|---|---|
| **Product Images** | Cloudinary (with CDN) ✅ | Keep, add Cloudinary transformations |
| **Static JS/CSS** | Served via Nginx | Cloudflare CDN edge caching |
| **i18n JSON files** | Bundled in app | Consider lazy-loading from CDN |

---

## 9. Monitoring & Logging

| Category | Current | Ideal |
|---|---|---|
| **Application Logs** | `console.log/error` | Pino structured JSON logs |
| **Error Tracking** | None | Sentry |
| **Uptime Monitoring** | None | UptimeRobot or Cloudflare Health Checks |
| **Performance** | None | Prometheus + Grafana (container metrics) |

---

*Last updated: 2026-05-11 | Generated by architecture audit*
