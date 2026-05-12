# ADR-008: Page Content Management System (CMS)

> **Status:** Implemented  
> **Date:** 2026-05-12  
> **Author:** Architecture Team

---

## Context

The OMAHRING platform currently has hardcoded text content in React components (hero titles, section descriptions, button labels, etc.). When the `manager` role needs to update page copy or swap a banner image, it requires a code change, a build, and a redeployment.

This creates an operational bottleneck — marketing or store managers cannot independently control the storefront messaging without developer involvement.

---

## Decision

Implement a **lightweight, key-value Page Content Management system** that allows `manager` and `admin` roles to edit page text and images from the admin dashboard.

### Architecture Choice: Key-Value Content Store

We chose a flat `page_contents` table with `(page_slug, section_key)` composite uniqueness over a full-blown CMS framework (e.g., Strapi, Sanity) for the following reasons:

| Criteria | Key-Value Store | External CMS |
|---|---|---|
| **Complexity** | Minimal — one table, one module | High — separate service, API gateway |
| **Deployment** | Same Docker container | Additional container or SaaS dependency |
| **Cost** | Zero additional cost | SaaS fees or infra cost |
| **Learning curve** | None — same patterns as existing modules | New system for the team to learn |
| **Flexibility** | Sufficient for text/image per section | Overkill for current requirements |
| **Future migration** | Can migrate to external CMS later | N/A |

### Content Model

```
page_contents
├── page_slug      (e.g., 'homepage', 'about', 'contact')
├── section_key    (e.g., 'hero_title', 'hero_subtitle', 'about_banner')
├── content_type   ('text' | 'image' | 'html' | 'json')
├── content_value  (the actual content)
├── metadata       (JSONB for alt text, link targets, etc.)
└── updated_by     (FK to users — audit trail)
```

### Key Design Decisions

1. **Upsert Pattern:** Content is created or updated via `INSERT ... ON CONFLICT (page_slug, section_key) DO UPDATE`. This prevents duplicate entries and simplifies the API.

2. **Fallback Strategy:** Frontend components always provide a hardcoded fallback string. If CMS content doesn't exist for a key, the original hardcoded text renders. This ensures **zero-breakage deployment** — the feature can be rolled out without seeding all content first.

3. **No Draft/Publish in V1:** Content updates go live immediately upon save. A draft/preview workflow adds significant complexity and is deferred to a future iteration.

4. **Public Read, Authenticated Write:** The public `GET /api/page-contents/:pageSlug` endpoint requires no authentication (pages need this data to render). All write operations require `admin` or `manager` role.

5. **Image Handling:** Reuses the existing Cloudinary upload infrastructure (`shared/cloudinary.service.js`). No new upload system introduced.

---

## Consequences

### Positive
- Managers can update page content without developer involvement
- Zero-risk deployment due to fallback strategy
- Follows existing modular architecture (routes → controller → service → repository)
- Minimal database footprint (single table, well-indexed)
- Supports future multilingual expansion via `metadata` JSONB field

### Negative
- No content versioning or rollback in V1 (mitigated by `updated_by` audit trail)
- No visual WYSIWYG editor in V1 (text fields only)
- Content is not cached in V1 (mitigated by indexed queries on a small table)

### Future Extensions
- **V2:** Add `status` column (`draft` | `published`) for draft/preview workflow
- **V2:** Add `version` column or `page_content_versions` table for rollback
- **V3:** Add Redis caching for public content reads
- **V3:** Add multilingual support via `locale` column
- **V4:** Consider migration to headless CMS if content complexity grows significantly

---

## References

- [Database Schema — page_contents](../database_schema.md)
- [API Contract — Page Contents endpoints](../api_contract.md)
- [Architecture — Domain Boundaries](../architecture.md)
