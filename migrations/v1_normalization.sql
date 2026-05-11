-- OMAHRING Migration v1: Schema Normalization & Snake_Case Conversion
-- This script transforms the legacy MongoDB-style schema into a clean, relational PostgreSQL schema.

BEGIN;

-- 1. Create New Normalized Tables
-- ---------------------------------------------------------

-- Table: product_categories
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id UUID REFERENCES product_categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: product_images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    public_id TEXT,               -- Cloudinary public_id
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,          -- e.g., "Anakan Jantan"
    price INTEGER NOT NULL,       -- In IDR
    sale_price INTEGER DEFAULT 0,
    total_stock INTEGER NOT NULL DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: addresses
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT,                   -- e.g., "Rumah"
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT,
    postal_code TEXT,
    phone TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: cart_items
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL,   -- Snapshot price
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, variant_id)
);

-- Table: order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_title TEXT NOT NULL,       -- Snapshot
    variant_name TEXT NOT NULL,       -- Snapshot
    image_url TEXT,
    unit_price INTEGER NOT NULL,    -- Snapshot
    quantity INTEGER NOT NULL,
    subtotal INTEGER NOT NULL
);

-- 2. Rename Columns to snake_case
-- ---------------------------------------------------------

-- Users
ALTER TABLE users RENAME COLUMN "userName" TO user_name;

-- Products
ALTER TABLE products RENAME COLUMN "orderTemplate" TO order_template;
ALTER TABLE products RENAME COLUMN "averageReview" TO average_review;

-- Orders
ALTER TABLE orders RENAME COLUMN "customerName" TO customer_name;
ALTER TABLE orders RENAME COLUMN "cartId" TO cart_id;
ALTER TABLE orders RENAME COLUMN "totalAmount" TO total_amount;
ALTER TABLE orders RENAME COLUMN "orderStatus" TO order_status;
ALTER TABLE orders RENAME COLUMN "paymentStatus" TO payment_status;
ALTER TABLE orders RENAME COLUMN "paymentMethod" TO payment_method;
ALTER TABLE orders RENAME COLUMN "orderDate" TO order_date;
ALTER TABLE orders RENAME COLUMN midtrans TO midtrans_data;

-- Carts
ALTER TABLE carts RENAME COLUMN "sessionId" TO session_id;
ALTER TABLE carts RENAME COLUMN "cartTotal" TO cart_total;

-- Promos
ALTER TABLE promos RENAME COLUMN "promoCode" TO promo_code;
ALTER TABLE promos RENAME COLUMN "discountType" TO discount_type;
ALTER TABLE promos RENAME COLUMN "discountValue" TO discount_value;
ALTER TABLE promos RENAME COLUMN "isActive" TO is_active;
ALTER TABLE promos RENAME COLUMN "startDate" TO start_date;
ALTER TABLE promos RENAME COLUMN "endDate" TO end_date;

-- Reviews
ALTER TABLE reviews RENAME COLUMN "userName" TO user_name;
ALTER TABLE reviews RENAME COLUMN "reviewMessage" TO review_message;
ALTER TABLE reviews RENAME COLUMN "reviewValue" TO review_value;

-- 3. Data Migration (Optional/Simulated)
-- ---------------------------------------------------------
-- Note: In a real environment, you would run scripts to extract JSONB 
-- and insert into the new tables here.

-- 4. Clean up JSONB columns (After data is migrated)
-- ---------------------------------------------------------
-- ALTER TABLE users DROP COLUMN IF EXISTS addresses;
-- ALTER TABLE products DROP COLUMN IF EXISTS media;
-- ALTER TABLE products DROP COLUMN IF EXISTS variants;
-- ALTER TABLE products DROP COLUMN IF EXISTS category;
-- ALTER TABLE carts DROP COLUMN IF EXISTS items;
-- ALTER TABLE orders DROP COLUMN IF EXISTS "cartItems";

COMMIT;
