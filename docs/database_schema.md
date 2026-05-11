# OMAHRING — Database Schema

> **Who should read this:** Backend engineers, database administrators, AI assistants.  
> **Why it matters:** Database quality directly determines system performance, data integrity, and scalability. A poor schema creates technical debt that compounds over time.

---

## 1. Current Problems

| Problem | Details |
|---|---|
| **Mixed naming convention** | Some columns use `camelCase` (e.g., `userName`, `cartId`, `orderStatus`) while others use `snake_case` (e.g., `user_id`, `created_at`) |
| **JSONB overuse** | `cartItems`, `addressInfo`, `midtrans`, `performance`, `media`, `attributes`, `variants` are all JSONB — hiding relational data that should be normalized |
| **Cart items not normalized** | Cart items are stored as JSONB array inside `carts` table — cannot query by product efficiently |
| **Product variants not normalized** | Variants stored as JSONB array — no relational integrity, stock deduction is done by looping JSON |
| **Orders store embedded data** | `customerName`, `email` duplicated in orders instead of referencing users properly |
| **reviews.product_id is TEXT** | Should be UUID FK referencing products |
| **reviews.user_id is TEXT** | Should be UUID FK referencing users |
| **No soft deletes** | No `deleted_at` columns — deleting records is permanent |
| **No audit trail** | No event log table for tracking changes |
| **Missing indexes** | No explicit indexes on frequently queried FK columns |
| **No `articles` table** | Article/blog content is managed but no dedicated schema (uses a generic `content` table) |
| **Legacy `_id` shim** | Controllers add `_id: row.id` to every response — no schema basis for this |

---

## 2. Ideal Schema

### Naming Convention Rules

- All table names: `snake_case`, plural (e.g., `users`, `orders`, `cart_items`)
- All column names: `snake_case` exclusively (e.g., `user_name`, `order_status`, `cart_id`)
- All primary keys: `id UUID`
- All foreign keys: `{table_singular}_id UUID REFERENCES {table}(id)`
- All timestamps: `created_at`, `updated_at`, `deleted_at`

---

### Table: `users`

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name       TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    password        TEXT,                    -- NULL for guest/OAuth users
    role            TEXT NOT NULL DEFAULT 'user'
                    CHECK (role IN ('guest', 'user', 'member', 'admin', 'manager')),
    nik             TEXT,
    phone_number    TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ             -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

---

### Table: `products`

```sql
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    description     TEXT,
    order_template  TEXT,
    average_review  NUMERIC(3,2) DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_products_is_active ON products(is_active);
```

---

### Table: `product_images`

```sql
CREATE TABLE product_images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    public_id   TEXT,               -- Cloudinary public_id
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
```

---

### Table: `product_categories`

```sql
CREATE TABLE product_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT UNIQUE NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    parent_id   UUID REFERENCES product_categories(id),
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_category_assignments (
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);
```

---

### Table: `product_variants`

```sql
CREATE TABLE product_variants (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,          -- e.g., "Merah L", "Anakan Jantan"
    price        INTEGER NOT NULL,       -- In IDR (smallest unit)
    sale_price   INTEGER DEFAULT 0,
    total_stock  INTEGER NOT NULL DEFAULT 0,
    sku          TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
```

---

### Table: `carts`

```sql
CREATE TABLE carts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id  TEXT,                   -- For guest carts
    cart_total  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT  cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
```

---

### Table: `cart_items`

```sql
CREATE TABLE cart_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id         UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    variant_id      UUID NOT NULL REFERENCES product_variants(id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      INTEGER NOT NULL,   -- Snapshot price at add-to-cart time
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, variant_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
```

---

### Table: `addresses`

```sql
CREATE TABLE addresses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       TEXT,                   -- e.g., "Rumah", "Kantor"
    address     TEXT NOT NULL,
    city        TEXT NOT NULL,
    province    TEXT,
    postal_code TEXT,
    phone       TEXT,
    is_default  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
```

---

### Table: `orders`

```sql
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    address_id          UUID REFERENCES addresses(id),   -- FK to snapshot or stored address
    -- Snapshot fields (denormalized for historical integrity)
    customer_name       TEXT NOT NULL,
    customer_email      TEXT NOT NULL,
    address_snapshot    JSONB,           -- Frozen address at order time
    cart_id             UUID,            -- Reference to cart that was checked out
    shipping_cost       INTEGER NOT NULL DEFAULT 0,
    product_total       INTEGER NOT NULL DEFAULT 0,
    store_service_fee   INTEGER NOT NULL DEFAULT 0,
    payment_service_fee INTEGER NOT NULL DEFAULT 0,
    total_amount        INTEGER NOT NULL,
    order_status        TEXT NOT NULL DEFAULT 'pending'
                        CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'expired', 'challenge')),
    payment_status      TEXT NOT NULL DEFAULT 'unpaid'
                        CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
    payment_method      TEXT NOT NULL DEFAULT 'midtrans',
    payment_category    TEXT,
    tracking_number     TEXT,
    midtrans_data       JSONB,           -- Midtrans Snap token + notification data
    order_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_date        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
```

---

### Table: `order_items`

```sql
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id      UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_title   TEXT NOT NULL,       -- Snapshot
    variant_name    TEXT NOT NULL,       -- Snapshot
    image_url       TEXT,
    unit_price      INTEGER NOT NULL,    -- Snapshot
    quantity        INTEGER NOT NULL,
    subtotal        INTEGER NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

---

### Table: `promos`

```sql
CREATE TABLE promos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    promo_code      TEXT UNIQUE NOT NULL,
    discount_type   TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value  NUMERIC NOT NULL,
    min_order       INTEGER DEFAULT 0,
    max_discount    INTEGER,             -- Cap for percentage discounts
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    start_date      TIMESTAMPTZ,
    end_date        TIMESTAMPTZ,
    usage_limit     INTEGER,            -- Max total uses
    usage_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promos_promo_code ON promos(promo_code);
CREATE INDEX idx_promos_is_active ON promos(is_active);
```

---

### Table: `birds`

```sql
CREATE TABLE birds (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id           UUID NOT NULL REFERENCES users(id),
    name                TEXT NOT NULL,
    species             TEXT NOT NULL,
    birth_year          INTEGER,
    whatsapp_contact    TEXT,
    qr_code_url         TEXT,
    is_public           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_birds_member_id ON birds(member_id);
```

---

### Table: `bird_competitions`

```sql
CREATE TABLE bird_competitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bird_id         UUID NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
    event_name      TEXT NOT NULL,
    event_date      DATE,
    location        TEXT,
    rank            INTEGER,
    category        TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bird_competitions_bird_id ON bird_competitions(bird_id);
```

---

### Table: `articles`

```sql
CREATE TABLE articles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    type            TEXT NOT NULL CHECK (type IN ('education', 'champion_bird', 'news', 'promo')),
    subcategory     TEXT,               -- e.g., 'Murai', 'Kenari'
    title           TEXT NOT NULL,
    slug            TEXT UNIQUE,
    content_body    TEXT,
    cover_image_url TEXT,
    is_member_only  BOOLEAN NOT NULL DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived')),
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_type ON articles(type);
CREATE INDEX idx_articles_is_member_only ON articles(is_member_only);
```

---

### Table: `reviews`

```sql
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name       TEXT NOT NULL,      -- Snapshot
    review_message  TEXT,
    review_value    INTEGER NOT NULL CHECK (review_value BETWEEN 1 AND 5),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, user_id)        -- One review per user per product
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
```

---

### Table: `chat_sessions`

> **Updated:** Context tag columns added (ADR-007)

```sql
CREATE TABLE chat_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token   TEXT,               -- For guest identification
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'closed', 'archived')),
    assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin handling

    -- Context tag (set at session creation, immutable)
    context_type    TEXT NOT NULL DEFAULT 'general'
                    CHECK (context_type IN ('product', 'article', 'general')),
    context_id      UUID,               -- FK to products.id or articles.id (soft reference)
    context_title   TEXT,               -- Denormalized title snapshot for quick display
    context_url     TEXT,               -- Page path customer was on (e.g. /shop/products/uuid)

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_customer_id ON chat_sessions(customer_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_context_type ON chat_sessions(context_type);
CREATE INDEX idx_chat_sessions_context_id ON chat_sessions(context_id);
```

> **Design note:** `context_id` is a soft reference (no FK constraint) because it may point to either `products` or `articles` depending on `context_type`. A polymorphic FK is not supported natively in PostgreSQL without additional complexity. The `context_title` snapshot avoids the need for a JOIN.

**Migration for existing databases:**

```sql
-- Migration: 20260512_chat_context_tags.sql
ALTER TABLE chat_sessions
    ADD COLUMN IF NOT EXISTS context_type  TEXT NOT NULL DEFAULT 'general'
                                           CHECK (context_type IN ('product', 'article', 'general')),
    ADD COLUMN IF NOT EXISTS context_id    UUID,
    ADD COLUMN IF NOT EXISTS context_title TEXT,
    ADD COLUMN IF NOT EXISTS context_url   TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_context_type ON chat_sessions(context_type);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_context_id ON chat_sessions(context_id);
```

---

### Table: `chat_messages`

```sql
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_role     TEXT NOT NULL CHECK (sender_role IN ('customer', 'guest', 'admin', 'manager')),
    message_text    TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
```

---

### Table: `store_settings`

```sql
CREATE TABLE store_settings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name              TEXT,
    store_logo_url          TEXT,
    midtrans_is_production  BOOLEAN NOT NULL DEFAULT FALSE,
    midtrans_server_key     TEXT,
    midtrans_client_key     TEXT,
    store_service_fee       INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Single-row pattern: always maintain exactly 1 row
```

---

### Table: `features` (Homepage Banners)

```sql
CREATE TABLE features (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url   TEXT NOT NULL,
    title       TEXT,
    link_url    TEXT,
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Normalization Strategy

| Current JSONB | Ideal Normalized Table |
|---|---|
| `carts.items` (JSONB array) | `cart_items` table |
| `products.variants` (JSONB array) | `product_variants` table |
| `products.media` (JSONB) | `product_images` table |
| `products.category` (JSONB array) | `product_category_assignments` join table |
| `users.addresses` (JSONB array) | `addresses` table |
| `orders.cartItems` (JSONB) | `order_items` table |
| `birds.competition_history` (JSONB array) | `bird_competitions` table |

---

## 4. Indexing Strategy

All indexes are defined in schema above. Summary of required indexes:

| Table | Indexed Columns | Reason |
|---|---|---|
| `users` | `email`, `role` | Login lookup, role filter |
| `products` | `is_active` | Catalog filter |
| `product_variants` | `product_id` | Variant lookup per product |
| `cart_items` | `cart_id` | Fetch cart items |
| `carts` | `user_id`, `session_id` | Cart lookup |
| `orders` | `user_id`, `order_status`, `payment_status`, `order_date` | Admin panel, webhook |
| `order_items` | `order_id` | Order detail |
| `reviews` | `product_id` | Product review list |
| `chat_messages` | `session_id`, `created_at` | Chat history |

---

## 5. Refactor Direction

1. **Phase 1:** Rename all `camelCase` columns to `snake_case` in one migration
2. **Phase 2:** Normalize `product_variants` from `products.variants` JSONB
3. **Phase 3:** Normalize `cart_items` from `carts.items` JSONB
4. **Phase 4:** Normalize `order_items` from `orders.cartItems` JSONB
5. **Phase 5:** Normalize `addresses` from `users.addresses` JSONB
6. **Phase 6:** Add `deleted_at` soft delete columns to all major tables
7. **Phase 7:** Fix `reviews.product_id` and `reviews.user_id` to proper UUID FK

---

## 6. Long-Term Recommendations

- **Use integer cents for all monetary values** (e.g., `50000` for Rp 50.000) — avoids floating-point rounding issues
- **Never store Midtrans keys in plaintext** — consider encrypted storage or move back to env-only
- **Add audit log table** for tracking all significant state changes (order status changes, user role changes)
- **Implement database migrations** properly with Flyway or Supabase CLI — no more ad-hoc `.sql` files
- **Add `deleted_at` soft delete** to all primary entity tables

---

*Last updated: 2026-05-11 | Generated by architecture audit*

---

## 7. Dual Payment Mode — Schema Additions

> **Reference:** ADR-006 | All changes are **additive** — no existing columns dropped.

### 7.1 Table: `payment_records`

Central audit log for all payment attempts. Decouples payment data from the `orders` table.

```sql
CREATE TABLE payment_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_mode        TEXT NOT NULL CHECK (payment_mode IN ('midtrans', 'manual')),
    
    -- Status lifecycle
    status              TEXT NOT NULL DEFAULT 'awaiting_proof'
                        CHECK (status IN (
                            'awaiting_proof',  -- Manual: waiting for customer upload
                            'proof_submitted',  -- Manual: proof uploaded, pending admin review
                            'confirmed',        -- Payment verified (manual admin or Midtrans auto)
                            'rejected',         -- Admin rejected proof
                            'expired',          -- Timed out before payment
                            'refunded'          -- Future use
                        )),
    
    -- Manual payment fields
    unique_code         INTEGER,                -- Rp 100–999 suffix added to transfer total
    total_with_code     INTEGER,                -- total_amount + unique_code (IDR integer)
    proof_image_url     TEXT,                   -- Cloudinary URL of uploaded transfer proof
    rejection_reason    TEXT,                   -- Set by admin on reject
    expires_at          TIMESTAMPTZ,            -- Payment deadline

    -- Midtrans fields (populated for midtrans mode)
    midtrans_order_id   TEXT,                   -- Midtrans transaction reference
    midtrans_snap_token TEXT,
    midtrans_token_expiry TIMESTAMPTZ,
    midtrans_payload    JSONB,                  -- Full webhook notification payload

    -- Admin action tracking
    confirmed_by        UUID REFERENCES users(id),
    confirmed_at        TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_records_order_id ON payment_records(order_id);
CREATE INDEX idx_payment_records_status ON payment_records(status);
CREATE UNIQUE INDEX idx_payment_records_order_unique ON payment_records(order_id)
    WHERE status NOT IN ('rejected', 'expired'); -- One active record per order
```

---

### 7.2 Modifications to `orders` table

Add payment-mode tracking columns (additive — no existing columns removed):

```sql
-- Add to orders table
ALTER TABLE orders
    ADD COLUMN payment_mode      TEXT NOT NULL DEFAULT 'midtrans'
                                 CHECK (payment_mode IN ('midtrans', 'manual')),
    ADD COLUMN payment_reference TEXT,   -- Human-readable reference (e.g., "TRF-20260511-0042")
    ADD COLUMN payment_method_used TEXT; -- Filled after payment confirmed (e.g., "BCA Transfer")
```

> The `midtrans` JSONB column on `orders` is deprecated — all Midtrans data moves to `payment_records.midtrans_payload`. Kept for backward compatibility until migration complete.

---

### 7.3 Modifications to `store_settings` table

Add manual payment configuration columns:

```sql
ALTER TABLE store_settings
    ADD COLUMN payment_mode          TEXT NOT NULL DEFAULT 'midtrans'
                                     CHECK (payment_mode IN ('midtrans', 'manual')),
    ADD COLUMN qris_image_url        TEXT,           -- Cloudinary URL of static QRIS image
    ADD COLUMN bank_accounts         JSONB DEFAULT '[]'::JSONB,
                                     -- Array of { bank_name, account_number, account_name, is_active }
    ADD COLUMN manual_verification   TEXT NOT NULL DEFAULT 'manual'
                                     CHECK (manual_verification IN ('manual', 'auto')),
    ADD COLUMN payment_expiry_hours  INTEGER NOT NULL DEFAULT 24;
```

**`bank_accounts` example value:**
```json
[
  {
    "bank_name": "BCA",
    "account_number": "1234567890",
    "account_name": "PT OMAHRING INDONESIA",
    "is_active": true
  },
  {
    "bank_name": "Mandiri",
    "account_number": "0987654321",
    "account_name": "PT OMAHRING INDONESIA",
    "is_active": true
  }
]
```

---

### 7.4 Order + Payment Relationship Diagram

```
orders
  │  id
  │  payment_mode         ← "midtrans" or "manual"
  │  payment_status       ← "unpaid" | "pending" | "paid" | "failed" | "expired"
  │  payment_reference    ← human-readable ref
  └──────────────────────────────────────────────────────┐
                                                         │
payment_records                                          │
  │  id                                                  │
  │  order_id ──────────────────────────────────────────-┘
  │  payment_mode
  │  status               ← fine-grained payment lifecycle
  │  unique_code          ← for manual transfer matching
  │  proof_image_url      ← customer's transfer proof
  │  confirmed_by ────────→ users.id (admin who confirmed)
  │  midtrans_payload     ← raw Midtrans webhook data
  └─ expires_at
```

---

### 7.5 Payment Status State Machine

```
[orders.payment_status]           [payment_records.status]

    unpaid ─────────────────────→ awaiting_proof (manual)
                                       │
                                  proof_submitted
                                       │
                               ┌───────┴───────┐
                            confirmed         rejected
                               │                 │
                    orders: paid         orders: failed
                               │
                          [fulfilled]

    unpaid ─────────────────────→ (midtrans snap created)
                                       │
                                   pending ← Midtrans webhook
                                       │
                               ┌───────┴───────┐
                           paid (settlement)  failed (expire/cancel)
```

---

### 7.6 Migration Script

```sql
-- Migration: 20260512_dual_payment_mode.sql
-- Safe to run on live database — additive only

BEGIN;

-- 1. payment_records table
CREATE TABLE IF NOT EXISTS payment_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_mode        TEXT NOT NULL CHECK (payment_mode IN ('midtrans', 'manual')),
    status              TEXT NOT NULL DEFAULT 'awaiting_proof'
                        CHECK (status IN ('awaiting_proof','proof_submitted','confirmed','rejected','expired','refunded')),
    unique_code         INTEGER,
    total_with_code     INTEGER,
    proof_image_url     TEXT,
    rejection_reason    TEXT,
    expires_at          TIMESTAMPTZ,
    midtrans_order_id   TEXT,
    midtrans_snap_token TEXT,
    midtrans_token_expiry TIMESTAMPTZ,
    midtrans_payload    JSONB,
    confirmed_by        UUID REFERENCES users(id),
    confirmed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_order_id ON payment_records(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);

-- 2. Orders table additions
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_mode       TEXT NOT NULL DEFAULT 'midtrans',
    ADD COLUMN IF NOT EXISTS payment_reference  TEXT,
    ADD COLUMN IF NOT EXISTS payment_method_used TEXT;

-- 3. Store settings additions
ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS payment_mode         TEXT NOT NULL DEFAULT 'midtrans',
    ADD COLUMN IF NOT EXISTS qris_image_url       TEXT,
    ADD COLUMN IF NOT EXISTS bank_accounts        JSONB DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS manual_verification  TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS payment_expiry_hours INTEGER NOT NULL DEFAULT 24;

COMMIT;
```

---
