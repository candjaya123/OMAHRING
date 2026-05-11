# ADR 003 — JSONB Overuse and Normalization Plan

**Status:** Decision Pending — Migration Required  
**Date:** 2026-05-11  
**Author:** Architecture Audit  
**Deciders:** Tech Lead

---

## Context

During the MongoDB → PostgreSQL migration, the team preserved the MongoDB document structure by storing complex nested data as JSONB columns rather than normalizing them into relational tables.

### Current JSONB Overuse

| Table | JSONB Column | What It Contains |
|---|---|---|
| `carts` | `items` | Array of cart items with embedded product data |
| `products` | `variants` | Array of product variants with price + stock |
| `products` | `media` | Object with images array and video URL |
| `products` | `category` | Array of category strings |
| `products` | `attributes` | Arbitrary product attributes |
| `products` | `shipping` | Weight, dimensions, origin city |
| `users` | `addresses` | Array of shipping addresses |
| `users` | `performance` | Total orders and spend stats |
| `orders` | `cartItems` | Snapshot of items at order time |
| `orders` | `addressInfo` | Snapshot of shipping address |
| `orders` | `midtrans` | Midtrans payment transaction data |
| `birds` | `competition_history` | Array of competition records |

---

## Problem Statement

JSONB overuse creates the following issues:

1. **N+1 query problem in cart** — To populate cart items with product data, the code loops through each JSONB item and makes a separate Supabase query per item. This is a classic N+1 pattern.

2. **No relational integrity** — Items in `carts.items` reference `productId` as a string but there is no foreign key constraint. If a product is deleted, the cart silently has orphaned data.

3. **Cannot query efficiently** — `SELECT * FROM carts WHERE items @> '[{"productId": "xxx"}]'` uses JSONB containment operators and cannot use a standard index.

4. **Cannot aggregate across carts** — "How many people have product X in their cart?" requires full table scan with JSONB processing.

5. **Inventory deduction is fragile** — Stock deduction on payment loops through `product.variants` JSONB array, applies logic, and updates the full JSONB blob. Race conditions possible under concurrent load.

6. **Address management is impossible** — Users' addresses are in a JSONB array. Adding, editing, or deleting individual addresses requires reading the full array, modifying it, and writing it back.

---

## Decision

**Normalize JSONB columns into proper relational tables according to the ideal schema in `docs/database_schema.md`.**

Migration to happen in phases to minimize risk.

---

## Migration Phases

### Phase 1 — Product Variants (Highest Impact)

**From:** `products.variants` (JSONB array)  
**To:** `product_variants` table

```sql
CREATE TABLE product_variants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    price       INTEGER NOT NULL,
    sale_price  INTEGER DEFAULT 0,
    total_stock INTEGER NOT NULL DEFAULT 0,
    sku         TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration script
INSERT INTO product_variants (product_id, name, price, sale_price, total_stock)
SELECT id, variant->>'name', (variant->>'price')::INTEGER, 
       COALESCE((variant->>'salePrice')::INTEGER, 0),
       COALESCE((variant->>'totalStock')::INTEGER, 0)
FROM products, jsonb_array_elements(variants) AS variant;
```

### Phase 2 — Cart Items (Eliminates N+1)

**From:** `carts.items` (JSONB array)  
**To:** `cart_items` table

This enables a single JOIN query to fetch cart + products instead of N+1 loops.

### Phase 3 — User Addresses

**From:** `users.addresses` (JSONB array)  
**To:** `addresses` table

Enables proper CRUD per address, default address management.

### Phase 4 — Order Items

**From:** `orders.cartItems` (JSONB snapshot)  
**To:** `order_items` table

Note: Order items are intentionally denormalized (snapshot at order time) for historical integrity. The `order_items` table preserves this by including snapshot columns (`product_title`, `variant_name`, `unit_price`).

### Phase 5 — Bird Competition History

**From:** `birds.competition_history` (JSONB array)  
**To:** `bird_competitions` table

---

## What to Keep as JSONB

Not all JSONB is bad. These should remain JSONB:

| Column | Reason |
|---|---|
| `orders.address_snapshot` | Frozen snapshot of address at order time — intentional denormalization |
| `orders.midtrans_data` | Arbitrary Midtrans response structure — schema can change |
| `products.attributes` | Truly arbitrary product metadata (varies by bird species/product type) |

---

## Tradeoffs

| Pro | Con |
|---|---|
| Eliminates N+1 queries | Migration effort + risk |
| Proper relational integrity | Need to update all affected code |
| Efficient queries and aggregations | More complex schema |
| Inventory management becomes safe | Requires careful data migration validation |

---

## Risk Mitigation

1. Run migration on staging first
2. Keep JSONB columns during transition (add new columns, migrate data, then remove old)
3. Validate data integrity after migration
4. Roll back by restoring from Supabase backup if needed
5. Feature flags to switch between old/new code path during transition

---

## Long-Term Implications

Once normalized:
- Cart can be fetched with a single JOIN query
- Inventory deduction can use `UPDATE ... WHERE variant_id = X AND total_stock >= quantity` atomically
- Address CRUD becomes simple REST operations
- Analytics queries across cart data become possible

---
