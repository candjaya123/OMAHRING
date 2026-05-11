# OMAHRING — Product & Engineering Vision

> **Who should read this:** CTO, tech lead, senior engineers, product managers.  
> **Why it matters:** Prevents short-term engineering decisions from permanently limiting growth potential. Acts as the engineering north star.

---

## 1. Product Vision

OMAHRING aims to become the **#1 digital platform for the Indonesian ornamental bird (kicau) community** — starting from Mojokerto, expanding across East Java, and ultimately serving the national market.

The platform will not merely be a store. It will be a **community ecosystem** that integrates:
- Commerce (buy/sell birds, accessories, feed)
- Identity (digital bird registry with QR profile)
- Knowledge (educational content, champion bird archives)
- Community (membership, exclusive access, events)
- Trust (verified member badges, competition records)

---

## 2. Scalability Goals (3–5 Year Horizon)

### User Growth Targets

| Horizon | Registered Users | Active Members | Daily Orders |
|---|---|---|---|
| Year 1 (Now) | < 5,000 | < 500 | < 50 |
| Year 2 | 25,000 | 3,000 | 200 |
| Year 3 | 100,000 | 15,000 | 1,000 |
| Year 5 | 500,000+ | 75,000+ | 5,000+ |

### Infrastructure Scalability

- Move from single-server Docker Compose to **container orchestration** (Kubernetes or Fly.io managed containers)
- Introduce **horizontal scaling** for the API layer
- Implement **caching layer** (Redis) for product catalog and analytics
- Use **CDN** (Cloudflare) for static assets and media delivery
- Introduce **async job queue** (BullMQ / Redis) for payment webhooks and notifications

---

## 3. Business Growth Direction

### Phase 1 — Foundation (Current)
- Stable e-commerce + member system
- Reliable payment via Midtrans
- Basic admin panel + analytics
- Bird profile QR system (MVP)

### Phase 2 — Community Expansion
- **Bird marketplace**: members can list their own birds for sale
- **Competition calendar**: event listings with registration
- **Notification system**: push/email notifications for orders, events, promos
- **Rating & review** improvement: verified purchase reviews
- **Referral system**: member-to-member referral rewards

### Phase 3 — Platform Maturity
- **API marketplace**: third-party integrations (bird food suppliers, vets, breeders)
- **Analytics for members**: bird performance dashboard (competition stats, growth tracker)
- **Multi-vendor support**: other Mojokerto/East Java bird shops onboard
- **Mobile app**: React Native or Flutter app using the same API

### Phase 4 — Ecosystem Leadership
- **National reach**: onboard bird communities across Indonesia
- **B2B portal**: wholesale orders for large buyers
- **AI features**: bird species identification, product recommendations, smart pricing

---

## 4. Technical Evolution Goals

### Backend

| Now (Current) | Future (Ideal) |
|---|---|
| Fat controllers with direct DB calls | Clean architecture: Controller → Service → Repository |
| Manual input validation | Unified validation library (Zod / Joi) |
| Two auth middleware implementations | Single unified auth middleware |
| Synchronous order processing | Event-driven: webhook → queue → async processor |
| No caching | Redis caching for hot data (products, settings) |
| Single process Node.js | Horizontally scalable stateless services |
| No background jobs | BullMQ job queues for email, notifications, reports |

### Frontend

| Now (Current) | Future (Ideal) |
|---|---|
| Flat Redux state | Normalized state with RTK Query |
| Pages with mixed business logic | Feature-sliced architecture (feature modules) |
| TailwindCSS utility classes inline | Design system with component library |
| No type safety | TypeScript throughout |
| No lazy loading (routes) | Code-splitting + lazy-loaded route chunks |

### Database

| Now (Current) | Future (Ideal) |
|---|---|
| JSONB overuse (cart items, product variants) | Normalized relational tables |
| Missing indexes on foreign keys | Comprehensive indexing strategy |
| Mixed camelCase/snake_case naming | Consistent snake_case convention |
| No audit log | Event log / audit trail table |
| No soft deletes | Soft delete pattern (`deleted_at`) |

---

## 5. Platform Strategy

### API-First
The backend must always be designed API-first — clean contracts, versioned endpoints — so that:
- The web frontend can be replaced or supplemented
- A mobile app can be added without backend changes
- Third-party integrations are always possible

### Monorepo Discipline
The monorepo structure (`client/`, `server/`) should be maintained but with clear contracts between layers. Over time:
- Introduce `packages/` for shared utilities (types, validation schemas)
- Enforce no direct cross-boundary imports

### BaaS Balance
Supabase is used as the PostgreSQL host. Keep the balance:
- Use Supabase **for database hosting only** — never use Supabase client-side auth or direct DB from the frontend
- All business logic must route through the Express API
- This ensures Supabase can be swapped for any PostgreSQL host without breaking the app

### Security-by-Design
Every new feature must answer:
- Who is allowed to access this? (RBAC)
- What data is exposed? (minimum required fields)
- How is input validated? (server-side, always)
- Is this auditable? (logging)

---

## 6. AI-Assisted Development Vision

OMAHRING will be maintained with AI coding assistants (like Antigravity/Gemini). To make AI-assisted development sustainable:
- Every domain, module, and architectural pattern must be documented
- The `docs/ai_rules.md` file defines strict rules AI must follow
- Naming conventions must be enforced so AI-generated code is consistent
- No feature should require AI to "guess" how the system works — documentation must cover it

---

*Last updated: 2026-05-11 | Generated by architecture audit*
