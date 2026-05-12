-- ==========================================
-- OMAHRING — SQL Super Query (Clean Slate)
-- Version: 2026.05.12
-- Description: Wipes all data and creates a normalized relational schema.
-- ==========================================

-- 0. Preparation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Wipe Everything (CAUTION: Destructive)
DROP TABLE IF EXISTS features CASCADE;
DROP TABLE IF EXISTS page_contents CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS bird_competitions CASCADE;
DROP TABLE IF EXISTS birds CASCADE;
DROP TABLE IF EXISTS promos CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_category_assignments CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Create Tables

-- --- Users ---
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name       TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    password        TEXT,                    -- NULL for guest users
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

-- --- Products & Categories ---
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

CREATE TABLE product_images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    public_id   TEXT,               -- Cloudinary public_id
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE product_variants (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,          -- e.g., "Merah L", "Anakan Jantan"
    price        INTEGER NOT NULL,       -- In IDR
    sale_price   INTEGER DEFAULT 0,
    total_stock  INTEGER NOT NULL DEFAULT 0,
    sku          TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

-- --- Carts ---
CREATE TABLE carts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id  TEXT,                   -- For guest carts
    cart_total  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT  cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE cart_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id         UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    variant_id      UUID NOT NULL REFERENCES product_variants(id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      INTEGER NOT NULL,   -- Snapshot price
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, variant_id)
);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- --- Orders & Payments ---
CREATE TABLE addresses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       TEXT,                   -- e.g., "Rumah"
    address     TEXT NOT NULL,
    city        TEXT NOT NULL,
    province    TEXT,
    postal_code TEXT,
    phone       TEXT,
    is_default  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id),
    address_id          UUID REFERENCES addresses(id),
    -- Snapshots
    customer_name       TEXT NOT NULL,
    customer_email      TEXT NOT NULL,
    address_snapshot    JSONB,           -- Frozen address details
    cart_id             UUID,
    shipping_cost       INTEGER NOT NULL DEFAULT 0,
    product_total       INTEGER NOT NULL DEFAULT 0,
    store_service_fee   INTEGER NOT NULL DEFAULT 0,
    payment_service_fee INTEGER NOT NULL DEFAULT 0,
    total_amount        INTEGER NOT NULL,
    order_status        TEXT NOT NULL DEFAULT 'pending'
                        CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'expired', 'challenge')),
    payment_status      TEXT NOT NULL DEFAULT 'unpaid'
                        CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
    payment_mode        TEXT NOT NULL DEFAULT 'midtrans'
                        CHECK (payment_mode IN ('midtrans', 'manual')),
    payment_reference   TEXT,            -- Human readable reference
    payment_method_used TEXT,            -- e.g., "BCA Transfer"
    tracking_number     TEXT,
    order_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_date        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE payment_records (
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

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_payment_records_order_id ON payment_records(order_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- --- Birds & Competitions ---
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

CREATE INDEX idx_birds_member_id ON birds(member_id);

-- --- Articles ---
CREATE TABLE articles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    type            TEXT NOT NULL CHECK (type IN ('education', 'champion_bird', 'news', 'promo')),
    subcategory     TEXT,
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

-- --- Chat ---
CREATE TABLE chat_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token   TEXT,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'closed', 'archived')),
    assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
    context_type    TEXT NOT NULL DEFAULT 'general'
                    CHECK (context_type IN ('product', 'article', 'general')),
    context_id      UUID,               -- Soft reference
    context_title   TEXT,
    context_url     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- --- System ---
CREATE TABLE store_settings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name              TEXT,
    store_logo_url          TEXT,
    payment_mode            TEXT NOT NULL DEFAULT 'midtrans'
                            CHECK (payment_mode IN ('midtrans', 'manual')),
    midtrans_is_production  BOOLEAN NOT NULL DEFAULT FALSE,
    midtrans_server_key     TEXT,
    midtrans_client_key     TEXT,
    qris_image_url          TEXT,
    bank_accounts           JSONB DEFAULT '[]'::JSONB,
    store_service_fee       INTEGER NOT NULL DEFAULT 0,
    payment_expiry_hours    INTEGER NOT NULL DEFAULT 24,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE features (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url   TEXT NOT NULL,
    title       TEXT,
    link_url    TEXT,
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE page_contents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_slug       TEXT NOT NULL,
    section_key     TEXT NOT NULL,
    content_type    TEXT NOT NULL DEFAULT 'text'
                    CHECK (content_type IN ('text', 'image', 'html', 'json')),
    content_value   TEXT,
    metadata        JSONB DEFAULT '{}',
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (page_slug, section_key)
);

CREATE INDEX idx_page_contents_page_slug ON page_contents(page_slug);
CREATE INDEX idx_page_contents_is_active ON page_contents(is_active);

CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name       TEXT NOT NULL,      -- Snapshot
    review_message  TEXT,
    review_value    INTEGER NOT NULL CHECK (review_value BETWEEN 1 AND 5),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, user_id)
);

-- 3. Seed Data

-- Admin User (password: admin123 - hashed)
INSERT INTO users (user_name, email, password, role) 
VALUES ('Super Admin', 'admin@omahring.com', '$2a$12$R.S4oO4qN6/v6Yk.fD3O.O5t8uUuVvL0G7tUeG.k8P2v1R3Xz7mK2', 'admin');

-- Default Settings
INSERT INTO store_settings (store_name, store_service_fee) 
VALUES ('OMAHRING Mojokerto', 1000);

-- Default Category
INSERT INTO product_categories (name, slug) 
VALUES ('Ring Burung', 'ring-burung');

-- CMS Seed Data
INSERT INTO page_contents (page_slug, section_key, content_type, content_value)
VALUES 
('homepage', 'hero_title', 'text', 'Ring Berkualitas untuk Sang Juara'),
('homepage', 'hero_subtitle', 'text', 'Temukan ring burung premium, pakan bernutrisi, dan aksesoris terbaik yang dirancang untuk menunjang performa dan keindahan burung kesayangan Anda.'),
('homepage', 'membership_title', 'text', 'Manfaat Menjadi Member Omahring'),
('homepage', 'education_title', 'text', 'Edukasi & Informasi Terkini');
