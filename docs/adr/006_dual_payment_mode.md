# ADR-006: Dual Payment Mode — Midtrans & Manual Payment

**Date:** 2026-05-11  
**Status:** Proposed  
**Deciders:** Engineering Lead, Product Owner

---

## Context

OMAHRING currently processes all payments through **Midtrans Snap** (API-based, automated). This works well but creates a hard dependency on third-party availability and incurs per-transaction fees.

Several operational scenarios demand a **Manual Payment** fallback:

1. Midtrans experiences downtime or API changes
2. Customers prefer direct QRIS static / bank transfer without app intermediaries
3. Manager wants to reduce MDR (Merchant Discount Rate) during low-traffic periods
4. Compliance or accounting needs full internal control of payment confirmation

---

## Decision

Implement a **switchable dual payment mode** at the store settings level:

- **`midtrans`** — Existing automated flow via Midtrans Snap
- **`manual`** — Static QRIS / bank transfer with admin confirmation

The active mode is controlled by a `payment_mode` field in `store_settings`.  
The payment logic is abstracted behind a **Payment Strategy Pattern** in `shared/payment/` so the `orders.service.js` remains agnostic to the underlying mechanism.

---

## Alternatives Considered

| Option | Reason Rejected |
|---|---|
| Always use Midtrans | Creates hard dependency; no fallback on outage |
| Hard-coded dual paths in order controller | Violates SRP, difficult to test, fragile |
| External payment orchestration service | Overengineered for current scale |
| Per-order payment method selection | Acceptable future enhancement, but too complex for v1 |

---

## Consequences

### Positive
- Zero downtime risk from Midtrans outages
- Lower transaction cost when using direct transfer
- Audit trail for manual payments
- Clean extension point for future providers (OVO direct, Xendit, etc.)

### Negative
- Manual payments require admin intervention for confirmation — not fully automated
- Risk of fake payment proofs — requires careful validation
- Admin UX complexity increases (QRIS upload, bank account management)

### Neutral
- Existing Midtrans flow is unchanged — zero regression risk
- Database schema requires additive changes only (no destructive migration)

---

## Implementation References

- Payment Strategy: `server/shared/payment/`
- Settings Schema: `store_settings.payment_mode`
- New DB Table: `payment_records`
- New ADR dependencies: ADR-001 (PostgreSQL), ADR-002 (Midtrans)

---

*Last updated: 2026-05-11 | Author: Architecture Review*
