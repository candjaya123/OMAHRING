-- OMAHRING Migration v2: Complete Schema Normalization
-- This script transforms the legacy MongoDB-style schema into a clean, relational PostgreSQL schema.
-- Includes data migration logic from JSONB to relational tables.

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
    product_id UUID NOT NULL, -- FK added after products table exists or altered
    url TEXT NOT NULL,
    public_id TEXT,               -- Cloudinary public_id
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL, -- FK added after products table exists or altered
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
    product_id UUID NOT NULL,
    variant_id UUID NOT NULL,
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
    product_id UUID,
    variant_id UUID,
    product_title TEXT NOT NULL,       -- Snapshot
    variant_name TEXT NOT NULL,       -- Snapshot
    image_url TEXT,
    unit_price INTEGER NOT NULL,    -- Snapshot
    quantity INTEGER NOT NULL,
    subtotal INTEGER NOT NULL
);

-- Table: bird_competitions
CREATE TABLE IF NOT EXISTS bird_competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bird_id UUID NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_date DATE,
    location TEXT,
    rank INTEGER,
    category TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Rename Existing Columns to snake_case
-- ---------------------------------------------------------

-- Users
DO $$ BEGIN ALTER TABLE users RENAME COLUMN "userName" TO user_name; EXCEPTION WHEN OTHERS THEN END $$;

-- Products
DO $$ BEGIN ALTER TABLE products RENAME COLUMN "orderTemplate" TO order_template; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE products RENAME COLUMN "averageReview" TO average_review; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE products RENAME COLUMN "variationOptions" TO variation_options; EXCEPTION WHEN OTHERS THEN END $$;

-- Orders
DO $$ BEGIN ALTER TABLE orders RENAME COLUMN "customerName" TO customer_name; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE orders RENAME COLUMN "cartId" TO cart_id; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE orders RENAME COLUMN "totalAmount" TO total_amount; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE orders RENAME COLUMN "orderStatus" TO order_status; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE orders RENAME COLUMN "paymentStatus" TO payment_status; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE orders RENAME COLUMN "paymentMethod" TO payment_method; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE orders RENAME COLUMN "orderDate" TO order_date; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE orders RENAME COLUMN "orderUpdateDate" TO order_update_date; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE orders RENAME COLUMN "addressInfo" TO address_snapshot; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE orders RENAME COLUMN midtrans TO midtrans_data; EXCEPTION WHEN OTHERS THEN END $$;

-- Carts
DO $$ BEGIN ALTER TABLE carts RENAME COLUMN "sessionId" TO session_id; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE carts RENAME COLUMN "cartTotal" TO cart_total; EXCEPTION WHEN OTHERS THEN END $$;

-- Promos
DO $$ BEGIN ALTER TABLE promos RENAME COLUMN "promoCode" TO promo_code; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE promos RENAME COLUMN "discountType" TO discount_type; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE promos RENAME COLUMN "discountValue" TO discount_value; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE promos RENAME COLUMN "isActive" TO is_active; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE promos RENAME COLUMN "startDate" TO start_date; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE promos RENAME COLUMN "endDate" TO end_date; EXCEPTION WHEN OTHERS THEN END $$;

-- Reviews
DO $$ BEGIN ALTER TABLE reviews RENAME COLUMN "userName" TO user_name; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE reviews RENAME COLUMN "reviewMessage" TO review_message; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE reviews RENAME COLUMN "reviewValue" TO review_value; EXCEPTION WHEN OTHERS THEN END $$;

-- Articles (from content)
ALTER TABLE IF EXISTS content RENAME TO articles;
DO $$ BEGIN ALTER TABLE articles RENAME COLUMN author_id TO author_id; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE articles RENAME COLUMN content_body TO content_body; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER TABLE articles RENAME COLUMN media_url TO cover_image_url; EXCEPTION WHEN OTHERS THEN END $$;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_member_only BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug TEXT;

-- 3. Add Soft Delete Support
-- ---------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE carts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE promos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE birds ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. Data Migration Logic
-- ---------------------------------------------------------

-- Migrate Addresses
INSERT INTO addresses (user_id, label, address, city, phone, is_default)
SELECT id, (addr->>'label'), (addr->>'address'), (addr->>'city'), (addr->>'phone'), COALESCE((addr->>'isDefault')::boolean, (addr->>'is_default')::boolean, false)
FROM users, jsonb_array_elements(CASE WHEN jsonb_typeof(addresses) = 'array' THEN addresses ELSE '[]'::jsonb END) AS addr
ON CONFLICT DO NOTHING;

-- Migrate Product Images
INSERT INTO product_images (product_id, url, public_id)
SELECT id, (img->>'url'), (img->>'public_id')
FROM products, jsonb_array_elements(CASE WHEN jsonb_typeof(media->'images') = 'array' THEN media->'images' ELSE '[]'::jsonb END) AS img
ON CONFLICT DO NOTHING;

-- Migrate Product Variants
INSERT INTO product_variants (product_id, name, price, sale_price, total_stock, sku)
SELECT id, (var->>'name'), (var->>'price')::integer, (var->>'salePrice')::integer, (var->>'totalStock')::integer, (var->>'sku')
FROM products, jsonb_array_elements(CASE WHEN jsonb_typeof(variants) = 'array' THEN variants ELSE '[]'::jsonb END) AS var
ON CONFLICT DO NOTHING;

-- Add FKs to product_images and product_variants now that variants exist (needed for cart/order items)
ALTER TABLE product_images ADD CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE product_variants ADD CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Migrate Cart Items
-- Note: This is tricky because we need to link to product_variants.id based on name matching if legacy variants didn't have IDs.
INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price)
SELECT 
    c.id, 
    (item->>'productId')::uuid, 
    pv.id, 
    (item->>'quantity')::integer, 
    (item->>'price')::integer
FROM carts c, 
jsonb_array_elements(CASE WHEN jsonb_typeof(items) = 'array' THEN items ELSE '[]'::jsonb END) AS item
JOIN product_variants pv ON pv.product_id = (item->>'productId')::uuid AND pv.name = (item->>'variantName')
ON CONFLICT DO NOTHING;

-- Migrate Order Items
INSERT INTO order_items (order_id, product_id, variant_id, product_title, variant_name, image_url, unit_price, quantity, subtotal)
SELECT 
    o.id, 
    (item->>'productId')::uuid, 
    pv.id,
    (item->>'title'),
    (item->>'variantName'),
    (item->>'image'),
    (item->>'price')::integer,
    (item->>'quantity')::integer,
    (item->>'price')::integer * (item->>'quantity')::integer
FROM orders o, 
jsonb_array_elements(CASE WHEN jsonb_typeof("cartItems") = 'array' THEN "cartItems" ELSE '[]'::jsonb END) AS item
LEFT JOIN product_variants pv ON pv.product_id = (item->>'productId')::uuid AND pv.name = (item->>'variantName')
ON CONFLICT DO NOTHING;

-- Migrate Bird Competitions
INSERT INTO bird_competitions (bird_id, event_name, event_date, location, rank, category, notes)
SELECT 
    b.id, 
    (comp->>'eventName'), 
    (comp->>'eventDate')::date, 
    (comp->>'location'), 
    (comp->>'rank')::integer, 
    (comp->>'category'), 
    (comp->>'notes')
FROM birds b, 
jsonb_array_elements(CASE WHEN jsonb_typeof(competition_history) = 'array' THEN competition_history ELSE '[]'::jsonb END) AS comp
ON CONFLICT DO NOTHING;

-- 5. Fix Reviews Table FKs
-- ---------------------------------------------------------
-- First, ensure reviews.product_id and user_id are UUID type
-- This might fail if data is messy, so we use a safe conversion
ALTER TABLE reviews ALTER COLUMN product_id TYPE UUID USING (product_id::uuid);
ALTER TABLE reviews ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 6. Final Cleanup (Disabled by default, uncomment after verifying data)
-- ---------------------------------------------------------
-- ALTER TABLE users DROP COLUMN IF EXISTS addresses;
-- ALTER TABLE products DROP COLUMN IF EXISTS media;
-- ALTER TABLE products DROP COLUMN IF EXISTS variants;
-- ALTER TABLE products DROP COLUMN IF EXISTS category;
-- ALTER TABLE products DROP COLUMN IF EXISTS variation_options;
-- ALTER TABLE carts DROP COLUMN IF EXISTS items;
-- ALTER TABLE orders DROP COLUMN IF EXISTS "cartItems";
-- ALTER TABLE birds DROP COLUMN IF EXISTS competition_history;

COMMIT;
