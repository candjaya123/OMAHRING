# ADR 004 — JWT Cookie Authentication Over Token Storage

**Status:** Accepted  
**Date:** 2026  
**Author:** Engineering Team

---

## Context

OMAHRING is a web application that requires user authentication for protected routes (checkout, admin panel, member content). The auth system needs to:
- Prevent XSS-based token theft
- Work seamlessly with the React SPA
- Support cross-origin requests (React dev on :5173, Express on :5005)
- Be stateless for horizontal scaling

---

## Decision

**Use JWT stored in an `httpOnly` cookie, signed with `HS256` algorithm.**

---

## Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **httpOnly Cookie with JWT** ✅ | XSS-resistant (JS cannot read cookie), stateless, works with CORS | Requires `sameSite` configuration for cross-origin, CSRF risk |
| **localStorage with JWT** | Simple to implement | ❌ Vulnerable to XSS attacks — all JS on page can read token |
| **Supabase Auth (client-side)** | Built-in, easy | ❌ Requires Supabase client on frontend — violates API-first principle |
| **Session-based (server-side)** | No token concerns | ❌ Not stateless — breaks horizontal scaling |
| **Bearer token in Authorization header** | Mobile-friendly | ❌ Frontend must manually attach header, not auto-handled by browser |

---

## Rationale

1. **httpOnly prevents XSS** — the biggest threat in modern web apps. Malicious scripts injected into the page cannot steal a cookie with `httpOnly=true`
2. **Stateless JWT** — no session storage needed, supports horizontal scaling
3. **Browser auto-sends cookie** — no manual token management in frontend code
4. **`Bearer` header also accepted** — the middleware checks both cookie and Authorization header, enabling future mobile app support

---

## Cookie Configuration

```js
res.cookie('token', jwt, {
  httpOnly: true,                                    // JS cannot access
  secure: process.env.NODE_ENV === 'production',     // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 60 * 60 * 1000,                           // 60 minutes
});
```

`sameSite: 'none'` in production is required because Cloudflare Tunnel proxies requests between different domains.

---

## Known Limitations

1. **60-minute expiry** — users are logged out after 60 minutes inactivity. A refresh token mechanism is needed.
2. **No token invalidation** — once issued, a JWT cannot be revoked before expiry. Risk window if a token is somehow compromised.
3. **CSRF risk** — cookies are automatically sent, so CSRF attacks are theoretically possible. Mitigated by `sameSite` setting, but CSRF tokens should be added for production safety.

---

## Long-Term Implications

1. **Add refresh token** — a separate `refreshToken` cookie with 7-day expiry that issues new access tokens
2. **Add CSRF protection** — `csurf` middleware for state-changing endpoints
3. **Token rotation** — invalidate refresh tokens on use to prevent reuse
4. **Implement `POST /api/auth/refresh`** endpoint to handle token renewal without re-login

---
