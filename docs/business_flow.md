# OMAHRING — Business Flow

> **Who should read this:** Backend engineers, QA, product managers.  
> **Why it matters:** Incorrect business logic in an e-commerce system causes financial loss, data corruption, and customer dissatisfaction.

---

## 1. User Registration & Role Lifecycle

```
Guest (sessionId) 
    │
    ├─→ Checkout without account → Guest User created in DB (no password)
    │
    ├─→ Register → User role = 'user'
    │       │
    │       └─→ Purchase membership → role upgraded to 'member'
    │                   │
    │                   └─→ Admin promotes → role = 'admin'
    │                               │
    │                               └─→ Manager promotes → role = 'manager'
    │
    └─→ Admin creates staff directly → role = 'admin' or 'manager'
```

### Role Definitions

| Role | Access Level |
|---|---|
| `guest` | No account — cart via sessionId only |
| `user` | Registered customer — can checkout, view orders |
| `member` | Premium subscriber — exclusive articles, bird profiles, member dashboard |
| `admin` | Store operator — manage products, orders, articles, promos, chat |
| `manager` | Store owner — full access + staff management + reports + settings |

### Edge Cases

- **Guest to User upgrade:** When a guest sessionId has a cart and registers, the cart is merged
- **Email already exists (guest):** If a guest email matches an existing guest DB record (no password), registration upgrades that record
- **Double registration:** If email has a password already, registration is rejected with conflict error

---

## 2. Shopping Cart Flow

```
User/Guest arrives
    │
    ▼
Add to Cart
    ├─ Guest? → Use sessionId → Create/find cart by sessionId
    └─ Logged in? → Use userId → Create/find cart by userId
    │
    ▼
Stock Validation (before add)
    ├─ Product exists? ✓
    ├─ Variant exists? ✓
    └─ Stock >= quantity? ✓
    │
    ▼
Cart Update
    ├─ Item already in cart (same productId + variantName)? → Increment quantity
    └─ New item? → Push to items array
    │
    ▼
Calculate cart_total → Save
```

### Cart Merge on Login

```
User logs in with existing guest session
    │
    ▼
POST /api/shop/cart/merge { userId, sessionId, action }
    │
    ├─ Guest cart NOT found → No-op (404 error)
    ├─ User cart NOT found → Transfer guest cart to userId (update cart.user_id)
    └─ Both carts exist:
        ├─ action = 'replace' → Delete guest cart, keep user cart
        └─ action = 'merge' → Merge items (check stock), delete guest cart
```

### Current Problems
- ❌ Cart items stored as JSONB — each cart fetch requires N+1 product lookups
- ❌ `carttotal` column name inconsistency (lowercase vs `cartTotal` in response)
- ❌ No cart expiry — abandoned guest carts accumulate indefinitely

---

## 3. Checkout & Payment Flow

```
Customer at Checkout
    │
    ▼
1. Calculate Shipping Cost (RajaOngkir API)
    │
    ▼
2. Select Payment Category
    (bank_transfer | qris | ewallet | minimarket | credit_card)
    │
    ▼
3. POST /api/shop/order/create
    │
    ├─ Validate: userId, cartItems, addressInfo, customerName, email, cartId
    ├─ Prevent duplicate checkout (same cartId + unpaid status)
    ├─ Guest? → Create/find user by email
    ├─ Loop cartItems: validate product + variant + stock
    ├─ Calculate: productTotal + shippingCost + storeServiceFee + paymentServiceFee
    ├─ Verify totalAmount matches server calculation (fraud prevention)
    ├─ Insert order record (status: pending, paymentStatus: unpaid)
    ├─ Create Midtrans Snap token
    ├─ Update order with Snap token + tokenExpiry
    ├─ Delete cart (cleared after order creation)
    └─ Return { token, redirectUrl, orderId }
    │
    ▼
4. Frontend loads Midtrans Snap popup (using token)
    │
    ▼
5. Customer pays via Midtrans
    │
    ▼
6. Midtrans calls webhook: POST /api/shop/order/notification
    ├─ Verify Midtrans signature (SHA-512)
    ├─ Read transaction_status
    ├─ IF capture/settlement:
    │   ├─ fraud_status = 'challenge' → orderStatus = 'challenge'
    │   └─ fraud_status = 'accept' → fulfillPaidOrder()
    │       ├─ Deduct inventory per variant
    │       ├─ orderStatus = 'confirmed'
    │       └─ paymentStatus = 'paid'
    ├─ IF cancel/deny/expire → paymentStatus = 'failed', orderStatus = 'cancelled/expired'
    └─ IF pending → paymentStatus = 'pending'
    │
    ▼
7. Order lifecycle continues:
    pending → confirmed → processing → shipped → delivered
```

### Payment Service Fee Logic

| Payment Method | Fee |
|---|---|
| Bank Transfer | Rp 4,000 flat |
| Minimarket (Alfamart/Indomaret) | Rp 5,000 flat |
| QRIS | 0.7% of base total |
| E-Wallet (GoPay/ShopeePay) | 2.0% of base total |
| Credit Card | 2.9% of base total + Rp 2,000 |

### Current Problems
- ❌ `fulfillPaidOrder()` is synchronous and called within the webhook handler — if inventory update fails, the webhook still returns 200 but data is inconsistent
- ❌ No inventory reservation on order creation — race condition possible under concurrent load
- ❌ `product_id` used inconsistently (`eq('_id', item.productId)` vs `eq('id', item.productId)`)

### Ideal: Async Fulfillment

```
Webhook received → Verify → Update order status → Queue job → Return 200
                                                        │
                                               (Background Job)
                                                        │
                                               Deduct inventory
                                               Send confirmation email
                                               Update user performance stats
```

---

## 4. Order Lifecycle

```
unpaid
  │
  ├── (payment success) → confirmed
  │       │
  │       └── (admin action) → processing
  │               │
  │               └── (shipped) → shipped [+ trackingNumber]
  │                       │
  │                       └── (delivered) → delivered
  │
  ├── (payment expired) → expired
  └── (payment failed/cancel) → cancelled
```

### Admin Order Actions
- Update `order_status` at any stage
- Add `tracking_number` when marking as `shipped`
- View all order details + customer info

---

## 5. Membership Flow

```
User browses /shop/membership
    │
    ▼
View membership benefits
    │
    ▼
Click "Beli Membership"
    │
    ▼
Complete payment (Midtrans or manual)
    │
    ▼
POST /api/auth/upgrade-to-member { email }
    │
    ▼
User.role updated: 'user' → 'member'
    │
    ▼
User can access:
    - /member/dashboard
    - /member/articles (member-only content)
    - Bird profile creation
```

### Current Problems
- ❌ Upgrade endpoint has NO authentication check — anyone can call it with any email
- ❌ No membership payment order tied to the upgrade — not auditable
- ❌ No membership expiry — once upgraded, member status is permanent

---

## 6. Bird Profile Flow

```
Member logs in
    │
    ▼
Create Bird Profile (name, species, competition history, whatsapp)
    │
    ▼
System generates QR Code URL (using qrcode.react on frontend)
    │
    ▼
Public URL: /birds/:id → ViewBirdProfile (accessible without login)
    │
    ▼
Anyone with QR code → Scan → View bird identity + competition history
```

---

## 7. Article / Content Flow

```
Admin creates article (title, body, type, member_only flag)
    │
    ▼
status: 'draft' → 'published'
    │
    ├─ member_only = false → Public at /shop/blog
    └─ member_only = true → Member-only at /member/articles
```

---

## 8. Chat Flow

> **Updated:** Context Tags added (ADR-007)

### 8.1 Standard Flow

```
Guest/User opens website
    │
    ▼
POST /api/chat/start  { customer_id?, sessionToken?, context? }
    │  Creates or retrieves session by userId or sessionToken
    │  If context provided → stores product/article tag on session
    │
    ▼
POST /api/chat/message  { sessionId, message, senderRole }
    │
    ▼
Admin panel shows all active sessions (with context tags)
    │
    ▼
Admin selects session → sees context tag banner → POST /api/chat/reply { sessionId, message }
    │
    ▼
Customer polls GET /api/chat/messages/:sessionId for new messages
```

### 8.2 Context Tag Flow

When a customer opens the chat widget while viewing a **product** or **article**, the page
automatically attaches context metadata to the session start request:

```
Customer on Product Detail Page (/shop/products/:id)
    │
    └─→ Chat widget opens
            │
            ▼
        POST /api/chat/start {
          customer_id: "uuid | null",
          context: {
            type: "product",
            id: "product-uuid",
            title: "Murai Batu Kalimantan",
            url: "/shop/products/product-uuid"
          }
        }
            │
            ▼
        Session created with context stored:
            chat_sessions.context_type  = "product"
            chat_sessions.context_id    = "product-uuid"
            chat_sessions.context_title = "Murai Batu Kalimantan"
            chat_sessions.context_url   = "/shop/products/product-uuid"
            │
            ▼
        Admin dashboard session list shows:
            ┌────────────────────────────────────────────────┐
            │  👤 Budi Santoso          🕐 2 min ago         │
            │  🏷 [Produk] Murai Batu Kalimantan  →         │
            │  "Apakah stok masih ada?"                      │
            └────────────────────────────────────────────────┘
            │
            ▼
        Admin clicks context tag → navigates to product page
        Admin replies with full context awareness
```

```
Customer on Article Page (/shop/articles/:id)
    │
    └─→ Chat widget opens
            │
            ▼
        POST /api/chat/start {
          context: {
            type: "article",
            id: "article-uuid",
            title: "Tips Merawat Murai di Musim Hujan",
            url: "/shop/articles/article-uuid"
          }
        }
            │
            ▼
        Admin sees:
            🏷 [Artikel] Tips Merawat Murai di Musim Hujan  →
```

```
Customer opens chat from homepage or other page
    │
    └─→ No context attached
            │
            ▼
        POST /api/chat/start { customer_id: "..." }
        (no context field)
            │
            ▼
        chat_sessions.context_type = "general"
        Admin sees no tag — plain session
```

### 8.3 Context Tag Rules

| Rule | Detail |
|---|---|
| **Context is set at session creation** | Cannot be changed after the session opens |
| **Context is optional** | Sessions without context default to `context_type = 'general'` |
| **One context per session** | A session tracks the single page where the customer opened chat |
| **Title is denormalized** | `context_title` is a snapshot — does not update if product title changes |
| **Existing sessions unaffected** | `context_type` defaults to `'general'` for all pre-existing sessions |

### 8.4 Known Problems & Roadmap

| Status | Issue |
|---|---|
| ❌ | **No real-time** — polling only; no WebSocket or Supabase Realtime |
| ❌ | **No per-session unread indicator** — only global unread count |
| ❌ | **Admin session assignment** (`assigned_to`) exists in DB but not yet wired |
| ✅ | **Context tags** — product and article context now attached at session start |

---

## 9. Promo / Voucher Flow

```
Admin creates promo (promoCode, discountType, discountValue, dates)
    │
    ▼
Customer enters promo code at checkout
    │
    ▼
Validate:
    ├─ Code exists? ✓
    ├─ Is active? ✓
    ├─ Within date range? ✓
    ├─ Usage limit not exceeded? ✓
    └─ Min order met? ✓
    │
    ▼
Apply discount to cart total
    │
    ▼
On order creation → Increment promo usage_count
```

### Current Problems
- ❌ Promo validation appears to be on the frontend side — not enforced server-side during order creation
- ❌ `conditions` is an opaque JSONB — no standard structure

---

## 10. Edge-Case Handling Checklist

| Scenario | Handled? | Risk |
|---|---|---|
| Duplicate checkout same cartId | ✅ Yes — 409 conflict check | Medium |
| Stock goes to 0 during concurrent orders | ❌ No reservation | High |
| Payment webhook called twice | ⚠️ Partial — `fulfillPaidOrder` checks status | Medium |
| Guest email matches registered user | ✅ Yes — password check | Low |
| Snap token expired before payment | ✅ Yes — regenerate endpoint | Low |
| Admin deletes product in active cart | ⚠️ Partial — cart populate filters null products | Medium |
| Member upgrade without payment | ❌ Not enforced | High |

---

## 11. Dual Payment Mode — Midtrans & Manual

> **Reference:** ADR-006  
> **Status:** Proposed — not yet implemented

### 11.1 System Architecture Overview

The store operates in one of two payment modes, controlled by the **Manager** via the Admin Dashboard. The active mode is read from `store_settings.payment_mode` on every checkout request.

```
store_settings.payment_mode
         │
         ├─ "midtrans" ──────────────────→ MidtransPaymentStrategy
         │                                       │
         │                                 Snap Token → Frontend Popup
         │                                       │
         │                                 Midtrans Webhook → Auto-confirm
         │
         └─ "manual" ────────────────────→ ManualPaymentStrategy
                                                 │
                                           QRIS/Bank Instructions → Frontend
                                                 │
                                           Admin reviews proof → Manually confirm
```

The payment logic is encapsulated in a **Strategy Pattern** (`server/shared/payment/`) so `orders.service.js` calls a unified interface regardless of mode:

```js
// server/shared/payment/payment.factory.js
const getPaymentStrategy = async () => {
  const settings = await settingsService.getSettings();
  if (settings.payment_mode === 'manual') return manualPaymentStrategy;
  return midtransPaymentStrategy; // default
};

// Unified interface
// strategy.initiate(order) → { instructions, reference }
// strategy.verify(orderId)  → { status }
```

### 11.2 Checkout Flow — Mode Detection

```
POST /api/orders/create
    │
    ├─ Load payment_mode from store_settings
    │
    ├─ payment_mode = "midtrans"
    │       └─→ [Existing Midtrans flow unchanged]
    │               → Return { snapToken, redirectUrl, orderId }
    │
    └─ payment_mode = "manual"
            └─→ [New manual flow]
                    ├─ Generate unique_code (e.g., +Rp 150 to distinguish transfers)
                    ├─ Insert payment_record (status: awaiting_proof)
                    ├─ Return { orderId, paymentInstructions }
                    │       paymentInstructions = {
                    │         qris_url, bank_name, account_number,
                    │         account_name, total_with_unique_code, unique_code,
                    │         expires_at
                    │       }
                    └─→ Frontend renders PaymentInstructionPage
```

### 11.3 Manual Payment — Full Flow

```
1. Customer completes checkout (mode = manual)
        │
        ▼
2. System generates payment record:
   - unique_code: random 3-digit suffix (e.g., Rp 123) added to total
   - expires_at: NOW() + 24 hours
   - status: awaiting_proof
        │
        ▼
3. Frontend displays PaymentInstructionPage:
   - QRIS image (from store_settings.qris_image_url)
   - Bank accounts (from store_settings.bank_accounts JSON)
   - Total amount INCLUDING unique_code
   - Countdown timer (expires_at)
        │
        ▼
4. Customer transfers exact amount
        │
        ▼
5. Customer uploads proof of payment:
   POST /api/orders/:id/payment-proof
   - Uploads image to Cloudinary
   - Sets payment_record.proof_image_url
   - Sets payment_record.status = proof_submitted
        │
        ▼
6. Admin is notified (in-app notification / optional email)
        │
        ▼
7. Admin reviews proof in dashboard:
   - Views order + proof image side-by-side
   - Verifies: amount matches (with unique_code), account name, transfer date
        │
        ├─ APPROVE → PUT /api/admin/orders/:id/confirm-payment
        │               ├─ payment_record.status = confirmed
        │               ├─ order.payment_status = paid
        │               ├─ order.order_status = confirmed
        │               └─ Deduct inventory (same as Midtrans fulfillPaidOrder)
        │
        └─ REJECT → PUT /api/admin/orders/:id/reject-payment
                        ├─ payment_record.status = rejected
                        ├─ payment_record.rejection_reason = "..."
                        ├─ order.payment_status = failed
                        └─ Customer notified to re-submit or contact support
```

### 11.4 Admin Dashboard — Settings

Manager can configure manual payment settings at `/admin/settings/payment`:

| Setting | Type | Description |
|---|---|---|
| `payment_mode` | `midtrans` \| `manual` | Active payment mode for store |
| `qris_image_url` | URL | Static QRIS image (uploaded via Cloudinary) |
| `bank_accounts` | JSON array | List of bank accounts for manual transfer |
| `manual_verification` | `auto` \| `manual` | Whether to auto-match unique_code (future) |
| `payment_expiry_hours` | integer | Hours before unpaid manual orders expire (default: 24) |

**Bank account object structure:**
```json
{
  "bank_name": "BCA",
  "account_number": "1234567890",
  "account_name": "PT OMAHRING INDONESIA",
  "is_active": true
}
```

**Validation rules:**
- Cannot switch `payment_mode` while any order is in `awaiting_proof` or `proof_submitted` state
- `qris_image_url` is required when `payment_mode = manual`
- At least one active bank account required when `payment_mode = manual`

### 11.5 Frontend — Conditional Rendering

```
User proceeds to checkout
        │
        ▼
GET /api/settings → { payment_mode, ... }
        │
        ├─ payment_mode = "midtrans"
        │       └─→ Show Midtrans payment category selector
        │             (bank_transfer | qris | ewallet | minimarket | credit_card)
        │             After order creation → Load Midtrans Snap popup
        │
        └─ payment_mode = "manual"
                └─→ Hide Midtrans category selector
                      Show "Transfer langsung" info banner
                      After order creation → Navigate to PaymentInstructionPage
                            ├─ Display QRIS image
                            ├─ Display bank account list
                            ├─ Display amount + unique code
                            ├─ Countdown timer
                            └─ Upload proof button
```

**Payment status polling (manual mode):**
```
Frontend polls GET /api/orders/:id/status every 30s
    ├─ awaiting_proof → Show upload form
    ├─ proof_submitted → Show "Menunggu konfirmasi admin"
    ├─ confirmed → Show success, redirect to order detail
    ├─ rejected → Show rejection reason, allow re-upload
    └─ expired → Show expiry message, link to contact support
```

### 11.6 Webhook & Async Handling

| Mode | Mechanism | Handler |
|---|---|---|
| Midtrans | Server-to-server webhook | `POST /api/orders/webhook` (existing) |
| Manual | No webhook — admin action | `PUT /api/admin/orders/:id/confirm-payment` |
| Manual (future) | Bank statement auto-match via unique_code | Background job (BullMQ) |

**Idempotency for admin confirmation:**
- Check `payment_record.status` before confirming — if already `confirmed`, return 200 without re-processing
- Inventory deduction uses the same `fulfillOrder()` function as Midtrans webhook

### 11.7 Edge Cases

| Scenario | Handling |
|---|---|
| **Double payment** | `unique_code` per order makes each transfer identifiable; admin sees both proofs |
| **Payment timeout (expired)** | Cron job runs every 15 min — sets expired orders to `cancelled`, releases no reserved stock (soft-delete approach) |
| **Wrong amount transferred** | Admin rejects with reason "Jumlah tidak sesuai" — customer must contact support |
| **Fake proof upload** | File validation (JPEG/PNG only, max 5MB); admin must manually cross-check; no auto-approval |
| **Mode switch during active orders** | Blocked by validation — must have 0 pending manual payments before switching |
| **Customer uploads proof after expiry** | `payment_record.status = expired` — upload endpoint returns 410 Gone |
| **Admin confirms after stock runs out** | Stock check runs at fulfillment time — admin sees error, must handle manually |

### 11.8 Security Considerations

| Risk | Mitigation |
|---|---|
| **Fake proof image** | No auto-approval; human review required; store proof URL in DB for audit trail |
| **Payment spoofing (manipulate totalAmount)** | Server recalculates total independently; `unique_code` is server-generated, not client-supplied |
| **Admin account compromise** | Confirm/reject endpoints require `admin` or `manager` role + JWT auth |
| **Mode switch abuse** | Only `manager` role can change `payment_mode` |
| **Mass proof upload (DoS)** | Rate limit `POST /api/orders/:id/payment-proof` — max 3 attempts per order |
| **QRIS image spoofing** | QRIS URL stored in `store_settings` — only manager can update it |

### 11.9 Migration Plan (Zero Downtime)

1. **Phase 1 — DB Migration:** Add `payment_records` table, add columns to `orders` and `store_settings` (all additive — no breaking changes)
2. **Phase 2 — Backend:** Implement Payment Strategy Pattern; `payment_mode` defaults to `'midtrans'` — existing behavior unchanged
3. **Phase 3 — Admin UI:** Add payment settings page; mode defaults to `'midtrans'`; manager can switch
4. **Phase 4 — Frontend:** Add conditional rendering at checkout; `PaymentInstructionPage` behind feature flag
5. **Phase 5 — Go Live:** Manager switches to `'manual'` mode during agreed maintenance window; monitor for 48h

**No destructive DB changes. No removal of Midtrans code. Full rollback = flip `payment_mode` back to `'midtrans'`.**

### 11.10 Scalability Limitations

Manual payment mode is suitable for:
- Order volume < 200/day (admin can reasonably review all proofs)
- Use case where personal relationship with customers is valued

When to force switch back to Midtrans:
- Order volume exceeds admin review capacity
- Proof-to-order mismatch rate > 5%
- Customer dispute rate increases

Future automation (when volume warrants it):
- Bank statement parsing via open banking API
- `unique_code` auto-matching to bank transfer records
- Automated approval for matched amounts within Rp 0 tolerance

---

*Last updated: 2026-05-11 | Added: Dual Payment Mode (ADR-006)*
