# OMAHRING — Scaling Strategy

> **Who should read this:** Tech lead, architects, senior engineers.  
> **Why it matters:** Scalability must be designed intentionally — retrofitting a poorly-designed system to handle 100x load is exponentially harder than building it right from the beginning.

---

## 1. Current Scalability Bottlenecks

| Bottleneck | Root Cause | Risk |
|---|---|---|
| **N+1 cart queries** | Product population via loop: 1 cart fetch + N product fetches | Slow cart at scale |
| **Midtrans key fetch per request** | `getStoreSettings()` called on every order create + every webhook | DB hit on every payment |
| **Synchronous order fulfillment** | Inventory deduction inside webhook handler | Slow webhook, potential timeout, race conditions |
| **No caching** | Every product list request hits DB | DB overload at peak traffic |
| **No connection pooling optimization** | Supabase JS client manages this internally but no tuning | Latency at scale |
| **Single Node.js process** | All traffic handled by single container | No horizontal scale |
| **No CDN for static assets** | JS/CSS served via Nginx | Higher latency for distant users |

---

## 2. Horizontal Scaling

### API Layer

The Express API is **stateless** (JWT in cookies, no server-side session) — this is the correct foundation for horizontal scaling.

```
Load Balancer (Nginx / Cloudflare)
    │
    ├── server-1 (Express container)
    ├── server-2 (Express container)
    └── server-3 (Express container)
                │
         Supabase PostgreSQL (shared)
                │
            Redis (shared cache + queue)
```

### Enabling Horizontal Scaling

1. **Remove any in-memory state** — currently none, good ✅
2. **Ensure session affinity is NOT required** — JWT cookies are stateless ✅
3. **Externalize all shared state** → Redis (cache, queues, rate limiting counters)
4. **Configure Nginx upstream** with load balancing strategy

```nginx
upstream api_servers {
    least_conn;
    server server-1:5005;
    server server-2:5005;
    server server-3:5005;
}

server {
    location /api/ {
        proxy_pass http://api_servers/api/;
    }
}
```

---

## 3. Caching Layers

### Layer 1: Supabase Response Cache (Redis)

```
Client Request → API → Check Redis Cache → HIT? Return cached data
                                         → MISS? Query Supabase → Cache result → Return
```

### Cache Strategy by Resource

| Resource | TTL | Invalidation |
|---|---|---|
| `GET /api/shop/products` (list) | 5 minutes | On product create/update/delete |
| `GET /api/shop/products/:id` | 10 minutes | On product update/delete |
| Store settings (Midtrans keys, fees) | 1 hour | On settings save |
| Analytics dashboard summary | 1 hour | On scheduled refresh |
| Shipping city list | 24 hours | Manual invalidation |
| Feature banners (homepage) | 30 minutes | On feature update |

### Implementation

```js
// shared/cache.service.js
const redis = require('ioredis');
const client = new redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
});

const withCache = async (key, ttl, fetchFn) => {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  
  const result = await fetchFn();
  await client.setex(key, ttl, JSON.stringify(result));
  return result;
};

// Usage in products service:
const getProducts = (filters) =>
  withCache(`products:list:${JSON.stringify(filters)}`, 300, () =>
    productsRepository.findAll(filters)
  );
```

### Cache Invalidation Pattern

```js
// When product is updated:
await productsRepository.update(id, data);
await cache.del(`product:${id}`);
await cache.del('products:list:*'); // Pattern delete
```

---

## 4. Async Processing (Queue System)

### Why Async is Critical for Orders

Current synchronous webhook handler:
```
Midtrans calls /notification → we process payment → deduct stock → respond
```
If inventory deduction takes too long (>10s), Midtrans may retry the webhook, causing double-fulfillment.

### Ideal: BullMQ Queue

```
Midtrans webhook → verify signature → update payment status → enqueue job → return 200 immediately
                                                                    │
                                                        (background worker)
                                                                    │
                                                        deduct inventory
                                                        send email confirmation
                                                        update user stats
                                                        trigger analytics update
```

```js
// shared/queues/order.queue.js
const { Queue, Worker } = require('bullmq');

const orderFulfillmentQueue = new Queue('order:fulfillment', {
  connection: { host: process.env.REDIS_HOST, port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

// In webhook handler (controller):
await orderFulfillmentQueue.add('fulfill', { orderId: order.id }, {
  priority: 1,
  delay: 0,
});

// Worker (separate process or same process):
const fulfillmentWorker = new Worker('order:fulfillment', async (job) => {
  const { orderId } = job.data;
  await ordersService.fulfillOrder(orderId);
}, { connection: { host: process.env.REDIS_HOST, port: 6379 }, concurrency: 5 });
```

---

## 5. Database Scaling

### Current: Supabase Free/Pro
- Managed PostgreSQL
- Connection pooling via PgBouncer (built-in on Supabase Pro)
- Automatic daily backups

### Immediate Optimizations

1. **Add missing indexes** (see `database_schema.md`)
2. **Fix N+1 queries** — replace cart population loop with JOIN:

```sql
-- ❌ Current: N+1 — 1 cart query + 1 query per item
SELECT * FROM carts WHERE user_id = $1;
-- Then for each item:
SELECT * FROM products WHERE id = $item.productId;

-- ✅ Ideal: Single JOIN query
SELECT 
    ci.*,
    p.title, p.media, p.category, p.shipping,
    pv.name as variant_name, pv.price, pv.sale_price
FROM cart_items ci
JOIN product_variants pv ON ci.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE ci.cart_id = (SELECT id FROM carts WHERE user_id = $1);
```

3. **Use `select('specific, columns')` instead of `select('*')`** everywhere — reduces data transfer

### Long-term DB Scaling

| Scale Level | Strategy |
|---|---|
| Up to 10K DAU | Supabase Pro with connection pooling |
| 10K–100K DAU | Read replicas for analytics/reporting queries |
| 100K+ DAU | Dedicated PostgreSQL cluster (RDS or self-hosted), PgBouncer |

---

## 6. CDN Strategy

### Frontend Static Assets

```
User → Cloudflare Edge → Cached JS/CSS/Images
              └── Cache MISS → Nginx → Built React app
```

**Cloudflare Page Rules:**
- Cache all `/assets/*` files: 1 year
- Cache all `*.js`, `*.css`, `*.png`, `*.webp`: 30 days
- No-cache for `/api/*` routes

### Cloudinary for Media

- Product images: Already served via Cloudinary CDN ✅
- Enable Cloudinary auto-format (`f_auto`) + auto-quality (`q_auto`) transformations:

```
https://res.cloudinary.com/{cloud}/image/upload/f_auto,q_auto,w_800/{public_id}
```

---

## 7. Performance Bottleneck Prevention

### Query Performance Rules

1. **Never use `SELECT *`** in production queries — always specify columns
2. **Always add indexes** on columns used in `WHERE`, `ORDER BY`, `GROUP BY`
3. **Paginate all list queries** — `LIMIT` + `OFFSET` minimum; cursor-based for large datasets
4. **Cache expensive aggregations** — analytics dashboard queries should never run in real-time

### Response Time Targets

| Endpoint | Target P95 Response Time |
|---|---|
| Product list | < 200ms (with cache) |
| Product detail | < 150ms (with cache) |
| Cart fetch | < 300ms |
| Order create | < 3s (includes Midtrans API call) |
| Admin analytics | < 500ms (with cache) |

---

## 8. Realtime Processing Assessment

### Current Realtime Features
- **Chat:** Polling-based (GET messages endpoint) — not truly realtime

### Unnecessary Realtime (Avoid)
- Analytics dashboard: refresh-on-demand or 1-minute polling is sufficient
- Order status: webhook-driven, no realtime needed on admin panel

### Realtime When Needed (Future)
- **Chat:** Replace polling with Supabase Realtime subscriptions or WebSocket
- **Order tracking:** Push notification when status changes (email/push preferred over WebSocket)

---

## 9. Traffic Pattern Analysis

| Time | Expected Load | Strategy |
|---|---|---|
| Regular hours (8am–9pm) | Normal | Standard containers |
| Promo campaigns | 5–10x spike | Pre-scale containers, CDN absorbs static |
| Off-hours | Very low | Scale down (if on K8s) |

### Promo Campaign Preparation Checklist
- [ ] Ensure Redis is running and cache is warm
- [ ] Verify Midtrans rate limits are not hit
- [ ] Scale API container replicas before campaign starts
- [ ] Enable Cloudflare "I'm Under Attack" mode if needed

---

## 10. Long-Term Recommendations

| Priority | Action | Impact |
|---|---|---|
| 🔴 Critical | Fix N+1 cart queries | Immediate performance |
| 🔴 Critical | Cache store settings (Midtrans keys) | Reduce DB hits on every order |
| 🟡 High | Add Redis caching for product catalog | Scale product browsing |
| 🟡 High | Implement BullMQ for async order fulfillment | Webhook reliability + throughput |
| 🟡 High | Add all missing DB indexes | Query performance |
| 🟢 Medium | Migrate to cursor-based pagination | Large dataset performance |
| 🟢 Medium | Add CDN caching rules in Cloudflare | Global latency reduction |
| 🟢 Low | Evaluate moving to Kubernetes | Only when 50K+ DAU |

---

*Last updated: 2026-05-11 | Generated by architecture audit*
