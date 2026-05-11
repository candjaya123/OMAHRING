# ADR 001 — PostgreSQL / Supabase Instead of MongoDB

**Status:** Accepted  
**Date:** 2026 (Migration completed)  
**Author:** Engineering Team  
**Deciders:** Tech Lead, Project Owner

---

## Context

The original OMAHRING codebase was built on **MongoDB** (likely via Mongoose). Evidence of this migration is visible throughout the current codebase:
- `_id` field shims in all controllers: `{ ...row, _id: row.id }`
- `schema.sql` comment: "MongoDB to PostgreSQL/Supabase"
- Product variant lookup: `eq('_id', item.productId)` still present in some places
- `reviews.product_id` and `reviews.user_id` stored as `TEXT` (instead of UUID FK) — likely because MongoDB ObjectIds are strings

The team decided to migrate to PostgreSQL hosted on Supabase.

---

## Decision

**Migrate from MongoDB to PostgreSQL via Supabase.**

---

## Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **PostgreSQL via Supabase** ✅ | Relational integrity, SQL power, Supabase BaaS features, managed hosting | Schema migration effort |
| **Stay on MongoDB** | No migration cost | Poor relational integrity, no joins, complex queries |
| **MySQL / PlanetScale** | Relational + serverless | Less feature-rich BaaS, no realtime |
| **Self-hosted PostgreSQL** | Full control | Ops overhead, no managed backups |

---

## Rationale

1. **Relational data model is appropriate for e-commerce** — orders, products, users, carts have well-defined relationships that benefit from foreign keys and JOIN queries
2. **Supabase provides managed hosting** — no infrastructure management for the database
3. **Supabase Realtime** — future chat or notification feature can use Supabase Realtime subscriptions
4. **Cost-effective** — Supabase free tier is sufficient for current scale

---

## Tradeoffs

| Pro | Con |
|---|---|
| Enforced relational integrity | Requires disciplined schema design |
| SQL join power (eliminates N+1) | More complex queries than MongoDB `$lookup` |
| Supabase BaaS features (auth, realtime, storage) | Vendor lock-in to Supabase API |
| Managed backups | Free tier has limits |

---

## Long-Term Implications

1. **JSONB columns must be minimized** — the migration was done hastily and over-used JSONB to preserve MongoDB document structure. These should be normalized over time (see `docs/database_schema.md` and ADR 003).
2. **The `_id` shim must be removed** — this is dead legacy code. All API responses should use `id` (see `docs/coding_standards.md`).
3. **Supabase as DB host only** — the frontend must NEVER connect directly to Supabase. All data access through the Express API.

---

## Implementation Notes

- Supabase client is initialized in `server/config/supabase.js`
- All database queries use `@supabase/supabase-js` v2 SDK
- UUID extension enabled via `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`

---
