# OMAHRING — Project Overview

> **Who should read this:** Developers, architects, product managers, AI coding assistants, and any new team member onboarding to the project.

---

## Purpose of This Document

This document is the single source of truth for understanding what OMAHRING is, who it serves, what it does, and where it is heading. Every major engineering decision should align with the product goals described here.

---

## 1. Product Goals

OMAHRING is a **specialized e-commerce and community platform** focused on the Indonesian **ornamental bird (burung kicau)** hobbyist market — specifically centered in the Mojokerto, East Java region.

The platform combines:
- A **full-featured e-commerce storefront** (products, cart, checkout, payments)
- A **member management and loyalty system** (membership tiers, exclusive content)
- A **bird profile registry** (bird identity, competition history, QR-based public profile)
- An **editorial/blog system** (education articles, champion bird content)
- A **real-time customer support chat** (guest + registered user chat with admin)
- A **back-office admin panel** (inventory, orders, analytics, staff, promos)

---

## 2. Target Users

| Actor | Role | Key Needs |
|---|---|---|
| **Guest** | Anonymous visitor | Browse products, add to cart, initiate checkout |
| **User (Buyer)** | Registered customer | Full checkout, order tracking, account management |
| **Member** | Premium subscriber | Exclusive articles, member dashboard, bird profile |
| **Admin** | Store staff / operator | Manage products, orders, customers, promos, content |
| **Manager** | Store owner / head | Full admin access + staff management, analytics, financial reports |

---

## 3. Core Modules

| Module | Description |
|---|---|
| **Auth** | Registration, login, session via JWT cookie, role-based access |
| **Product Catalog** | CRUD products with variants, media (image/video), categories |
| **Shopping Cart** | Guest cart (sessionId), user cart (userId), merge on login |
| **Checkout & Orders** | Multi-step checkout, Midtrans Snap payment gateway, real-time webhook |
| **Shipping** | Third-party shipping cost calculation (rajaongkir integration) |
| **Promos / Vouchers** | Promo code CRUD, discount types (fixed / percentage), date ranges |
| **Bird Profile** | Unique bird registry per member, competition history, QR code generation |
| **Content / Articles** | Admin-managed educational articles, member-exclusive content |
| **Member System** | Membership purchase page, role upgrade (user → member) |
| **Chat** | Real-time-like customer ↔ admin messaging with session management |
| **Admin Dashboard** | Analytics, sales charts, inventory overview |
| **Reports** | Sales, revenue, order summary reports |
| **Staff Management** | Admin CRUD for operator accounts with role control |
| **Settings** | Store-level config (Midtrans keys, service fees, store identity) |
| **i18n** | Multilingual support: Indonesian (id), English (en), Malay (ms) |

---

## 4. Platform Scope

### Current Platform

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), Redux Toolkit, TailwindCSS, Radix UI, React Router v6 |
| **Backend** | Node.js / Express.js (REST API) |
| **Database** | PostgreSQL via Supabase (hosted BaaS) |
| **Auth** | Custom JWT (httpOnly cookie) |
| **Payment** | Midtrans Snap (primary), PayPal (legacy/inactive) |
| **Media Storage** | Cloudinary |
| **Deployment** | Docker Compose + Nginx reverse proxy + Cloudflare Tunnel |
| **i18n** | i18next (ID, EN, MS) |

### Domain
- Production: `omahring.com`, `www.omahring.com`

---

## 5. Business Objectives

1. **Monetize the ornamental bird community** through product sales and membership subscriptions
2. **Build community loyalty** via exclusive member content, bird profiles, and QR identity
3. **Streamline store operations** with a unified admin panel
4. **Scale regionally** across East Java and nationally in the future
5. **Enable AI-assisted operations** through well-structured, documented systems

---

## 6. System Boundaries

```
┌────────────────────────────────────────────────────────────┐
│                        OMAHRING PLATFORM                   │
│                                                            │
│  ┌──────────────┐    ┌──────────────┐   ┌──────────────┐  │
│  │  React SPA   │───▶│  Express API │──▶│   Supabase   │  │
│  │  (client/)   │    │  (server/)   │   │  PostgreSQL  │  │
│  └──────────────┘    └──────┬───────┘   └──────────────┘  │
│                             │                              │
│                    ┌────────▼────────┐                     │
│                    │  External APIs  │                     │
│                    │  - Midtrans     │                     │
│                    │  - Cloudinary   │                     │
│                    │  - RajaOngkir   │                     │
│                    └─────────────────┘                     │
└────────────────────────────────────────────────────────────┘
                             │
                        Nginx Proxy
                             │
                     Cloudflare Tunnel
                             │
                        omahring.com
```

---

## 7. Current Problems Summary

| Area | Problem |
|---|---|
| **Backend structure** | Business logic mixed directly into controllers (fat controllers); no service layer |
| **Database schema** | Inconsistent naming (camelCase vs snake_case); JSONB overuse hides relational data |
| **Auth** | Two separate auth middleware implementations exist (`auth-controller.js` + `authMiddleware.js`) |
| **Frontend state** | Redux slices per feature but no domain boundaries — flat global state without normalization |
| **Cart population** | N+1 query pattern: cart items are populated via individual `select` calls per item in a loop |
| **No input validation library** | Backend validation is manual, inconsistent, and duplicated |
| **No tests** | Zero automated tests across frontend and backend |
| **Error handling** | Inconsistent error response shapes; some endpoints return plain strings |
| **Environment management** | Midtrans keys stored in DB (settings table) AND `.env` — dual source of truth |
| **Legacy references** | MongoDB-era `_id` field mappings still present throughout the codebase |

---

## 8. Ideal Long-Term Vision Summary

- **Clean architecture** backend with Service Layer + Repository Pattern
- **Normalized relational schema** replacing JSONB overuse
- **Unified middleware** and single auth flow
- **Automated test coverage** (unit + integration + E2E)
- **Event-driven** order lifecycle (webhooks → async processing)
- **Multi-tenant ready** architecture for potential expansion to other stores
- **AI-context-ready** documentation and structured codebase

---

*Last updated: 2026-05-11 | Generated by architecture audit*
