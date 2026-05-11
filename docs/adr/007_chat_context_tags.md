# ADR-007: Chat Context Tags — Product & Article Awareness

**Date:** 2026-05-11  
**Status:** Proposed  
**Deciders:** Engineering Lead, Product Owner

---

## Context

Currently, when a customer opens a chat session, the admin has **zero context** about what the customer was looking at. This forces the admin to ask clarifying questions ("Which product are you asking about?") and degrades support quality.

OMAHRING has two page types that commonly trigger chat inquiries:

1. **Product detail pages** — Customer wants to ask about price, stock, shipping, or variants
2. **Article pages** — Customer wants to discuss bird care content or community topics

When a customer opens the chat widget while browsing either of these pages, the system should automatically **attach the current page as a context tag** to the session, giving the admin immediate awareness without any manual input.

---

## Decision

Attach **context metadata** to `chat_sessions` at the moment of session creation:

- `context_type` — `'product'` | `'article'` | `'general'`
- `context_id` — UUID of the referenced product or article
- `context_title` — Denormalized title for instant display (avoids JOIN on every session list load)
- `context_url` — The full path the customer was on (e.g., `/shop/products/uuid`)

**Context is set at session START, not at message send.** Once a session is open, the context is fixed — it describes *what the customer was viewing when they initiated the conversation*, not every page they visit afterwards.

---

## Alternatives Considered

| Option | Reason Rejected |
|---|---|
| Include context as a special message type | Pollutes message history; confusing UX for admin |
| Let customer manually select topic | Adds friction to chat initiation |
| Per-message context tagging | Overly complex; context changes too frequently to be useful |
| Store context in `chat_messages.metadata` JSONB | Harder to query and filter at session list level |

---

## Consequences

### Positive
- Admin immediately sees "Customer is asking about: **Murai Batu Kalimantan**" in session list
- Zero extra clicks for the customer — context is invisible, automatic
- Enables future analytics: "Which products generate the most support inquiries?"
- Admin can deep-link directly to the product/article from the session

### Negative
- Context is only captured at session creation — if customer navigates away, context stays unchanged
- Slight increase in session creation payload
- Denormalized `context_title` may drift if product title is updated (acceptable — it's display-only)

### Neutral
- Existing sessions without context are `context_type = 'general'` — fully backward-compatible
- No changes to `chat_messages` table

---

## Implementation References

- DB Schema: `chat_sessions.context_type`, `context_id`, `context_title`, `context_url`
- Migration: `20260512_chat_context_tags.sql`
- Frontend: `useChatContext()` hook on `ProductDetailPage` and `ArticlePage`
- Backend: `POST /api/chat/start` accepts optional `context` object

---

*Last updated: 2026-05-11 | Author: Architecture Review*
