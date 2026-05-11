# ADR 005 — Docker Compose + Cloudflare Tunnel for Deployment

**Status:** Accepted  
**Date:** 2026  
**Author:** Engineering Team

---

## Context

OMAHRING runs on infrastructure managed by the development team. The platform needs:
- Reliable public access via a custom domain (`omahring.com`)
- Isolated service containers (frontend, backend, reverse proxy)
- Minimal infrastructure management overhead
- Cost-effective for early-stage startup

---

## Decision

**Deploy using Docker Compose with an Nginx reverse proxy, exposed via Cloudflare Tunnel.**

---

## Architecture

```
Internet
    │
Cloudflare Edge (DNS + DDoS protection)
    │
Cloudflare Tunnel (cloudflared daemon)
    │
Local Network / VPS
    │
Docker Compose stack:
    ├── nginx (port 80) ← Reverse proxy
    ├── client (port 3000) ← React app
    └── server (port 5005) ← Express API
```

---

## Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Docker Compose + Cloudflare Tunnel** ✅ | No open ports, DDoS protection, free tunnel, simple setup | Single machine — no HA |
| **VPS + Nginx + Let's Encrypt** | Full control, standard setup | Must manage SSL certs, open ports to internet |
| **Render / Railway** | Zero DevOps | Higher cost at scale, less control |
| **AWS ECS + ALB** | Production-grade | High complexity, high cost for startup |
| **Kubernetes** | Full orchestration | Massive overhead for current scale |

---

## Rationale

1. **Cloudflare Tunnel** — no need to open firewall ports or manage SSL certificates. All traffic goes through Cloudflare's edge.
2. **DDoS protection** — Cloudflare provides free enterprise-grade DDoS mitigation at the edge.
3. **Docker isolation** — services are isolated; restart one without affecting others.
4. **Low operational overhead** — single `docker compose up -d` to run the stack.
5. **Cost effective** — Cloudflare Tunnel is free for personal/small business use.

---

## Tradeoffs

| Pro | Con |
|---|---|
| No open ports on host machine | Single machine — no redundancy |
| Free SSL via Cloudflare | Cloudflare is in the request path (trust relationship) |
| DDoS protection at edge | Depends on Cloudflare availability |
| Simple deployment | Manual deploy (no CI/CD yet) |

---

## Nginx Configuration

```
Location /api/* → proxy_pass http://server:5005/api/
Location /*     → proxy_pass http://client:3000 (dev) or serve static (prod)
```

Two configs maintained:
- `nginx/default.conf` — development (Vite dev server)
- `nginx/default.prod.conf` — production (serve built static files)

---

## Long-Term Implications

1. **Staging environment needed** — currently there is no staging. All changes go directly to production.
2. **CI/CD pipeline needed** — manual `docker compose pull && docker compose up -d` is error-prone.
3. **High availability** — when traffic grows, migrate from single-machine Docker Compose to:
   - Multiple VPS nodes + Nginx upstream load balancing
   - Or Fly.io / Render with auto-scaling
4. **Secrets management** — Cloudflare Tunnel token should be rotated periodically
5. **Health checks** — Docker Compose `healthcheck` should be added to all services

---
