# ADR 002 — Midtrans Snap as Primary Payment Gateway

**Status:** Accepted  
**Date:** 2026  
**Author:** Engineering Team  
**Deciders:** Project Owner, Tech Lead

---

## Context

OMAHRING is an Indonesian e-commerce platform targeting customers in Mojokerto, East Java. The platform needs a payment gateway that:
- Supports Indonesian payment methods (bank transfer, QRIS, GoPay, ShopeePay, Indomaret, Alfamart)
- Is widely recognized and trusted by Indonesian consumers
- Supports Snap (embedded payment popup) for smooth UX
- Has a proper webhook system for async payment confirmation

The codebase shows evidence of **PayPal** being considered initially (`helpers/paypal.js` exists, `paypal-rest-sdk` in dependencies) but never fully integrated.

---

## Decision

**Use Midtrans Snap as the primary and only active payment gateway.**

**Remove PayPal integration** — it is dead code that adds dependency weight and confusion.

---

## Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Midtrans Snap** ✅ | Indonesian market leader, all local payment methods, proper Snap popup, good webhook docs | Requires Indonesian business entity |
| **PayPal** ❌ | International coverage | Not widely used in Indonesia, no local payment methods, US-centric |
| **Xendit** | Good Indonesian coverage | Higher fees, less established than Midtrans |
| **DOKU** | Indonesian, reliable | Smaller ecosystem, less developer-friendly |
| **Stripe** | Best developer experience | No Indonesian local payment methods |

---

## Rationale

1. **Target market is Indonesian** — local payment methods (QRIS, GoPay, bank transfer) are essential
2. **Midtrans Snap UX** — embedded popup with all payment options in one flow reduces checkout abandonment
3. **Webhook reliability** — Midtrans has a robust notification system with signature verification
4. **Sandbox environment** — easy to test in development without real transactions

---

## Implementation Details

### Dynamic Key Configuration

Midtrans keys are stored **dynamically** — fetched from `store_settings` table per request. This allows the admin to change Midtrans environment (sandbox → production) without redeployment.

**Current Problem:** This means a DB call on every payment request. This should be cached in Redis (TTL: 1 hour) to avoid DB overhead.

### Payment Category Fees

| Category | Fee |
|---|---|
| Bank Transfer | Rp 4,000 flat |
| Minimarket | Rp 5,000 flat |
| QRIS | 0.7% |
| E-Wallet | 2.0% |
| Credit Card | 2.9% + Rp 2,000 |

These fees are calculated server-side and verified against the client-submitted total (fraud prevention).

### Signature Verification

The webhook at `POST /api/shop/order/notification` verifies the Midtrans SHA-512 signature before processing. This is correctly implemented and should be maintained.

---

## Tradeoffs

| Pro | Con |
|---|---|
| All Indonesian payment methods covered | Requires merchant account verification |
| Snap popup UX | External popup may fail if Midtrans CDN is slow |
| Proper webhook with signature | Webhook failures require retry handling (not yet implemented) |
| Sandbox mode for testing | Sandbox tokens are different from production |

---

## Long-Term Implications

1. **Remove PayPal dead code** — `helpers/paypal.js` and `paypal-rest-sdk` dependency should be removed
2. **Cache Midtrans keys** — store settings should be Redis-cached, not fetched per request
3. **Idempotent webhook handling** — implement idempotency to prevent double-fulfillment on webhook retries
4. **Async fulfillment** — move inventory deduction out of webhook handler into a BullMQ job

---
