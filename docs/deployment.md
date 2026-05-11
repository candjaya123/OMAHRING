# OMAHRING — Deployment

> **Who should read this:** DevOps, engineers responsible for infrastructure, and AI assistants helping with deployment tasks.  
> **Why it matters:** Reliable deployment operations are the foundation of a stable production system. Deployment failures, rollback confusion, or environment misconfiguration directly impact customers.

---

## 1. Environments

| Environment | Purpose | URL |
|---|---|---|
| **Local Development** | Developer workstation | `http://localhost:5173` (frontend), `http://localhost:5005` (backend) |
| **Docker Dev** | Docker Compose local stack | `http://localhost` (via Nginx port 80) |
| **Production** | Live user traffic | `https://omahring.com` |

### Planned (Recommended)

| Environment | Purpose |
|---|---|
| **Staging** | Pre-production validation — mirrors production but uses sandbox data |
| **CI Preview** | Per-PR preview environments (e.g., via Render, Railway, or Fly.io) |

---

## 2. Container Architecture

```
┌─────────────────────────────────────────────┐
│               Docker Compose                │
│                                             │
│  ┌──────────┐   ┌──────────┐   ┌─────────┐  │
│  │  client  │   │  server  │   │  nginx  │  │
│  │ React SPA│   │ Express  │   │ Reverse │  │
│  │ :3000    │   │ :5005    │   │ Proxy   │  │
│  └──────────┘   └──────────┘   └────┬────┘  │
│                                     │ :80   │
└─────────────────────────────────────┼───────┘
                                      │
                             Cloudflare Tunnel
                                      │
                               omahring.com
```

### Service: `client`

```dockerfile
# client/dockerfile (Development)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
```

### Service: `server`

```dockerfile
# server/dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5005
CMD ["node", "server.js"]
```

### Service: `nginx`

```nginx
# nginx/default.conf (Development)
server {
    listen 80;
    
    location /api/ {
        proxy_pass http://server:5005/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://client:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## 3. Docker Compose

```yaml
# docker-compose.yml (Recommended ideal structure)
version: '3.8'

services:
  client:
    build: ./client
    volumes:
      - ./client:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=/api
    depends_on:
      - server

  server:
    build: ./server
    env_file:
      - ./server/.env
    volumes:
      - ./server:/app
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5005/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - client
      - server

  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    depends_on:
      - nginx
```

---

## 4. Production Deployment (Nginx Config)

```nginx
# nginx/default.prod.conf
server {
    listen 80;
    server_name omahring.com www.omahring.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # API proxy
    location /api/ {
        proxy_pass http://server:5005/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static frontend build
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|svg|ico|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## 5. CI/CD Pipeline (Recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install & Test Backend
        run: |
          cd server && npm ci && npm test
      - name: Install & Test Frontend
        run: |
          cd client && npm ci && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and Push Docker Images
        run: |
          docker build -t ${{ secrets.DOCKER_USERNAME }}/omahring-server:${{ github.sha }} ./server
          docker build -t ${{ secrets.DOCKER_USERNAME }}/omahring-client:${{ github.sha }} ./client
          docker push ${{ secrets.DOCKER_USERNAME }}/omahring-server:${{ github.sha }}
          docker push ${{ secrets.DOCKER_USERNAME }}/omahring-client:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        run: |
          ssh ${{ secrets.DEPLOY_HOST }} "cd /app/omahring && docker compose pull && docker compose up -d"
```

---

## 6. Monitoring

### Application Health Check (Required)

```js
// Add to server.js
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

### Monitoring Stack (Recommended)

| Tool | Purpose |
|---|---|
| **UptimeRobot** | Free uptime monitoring, alerts on downtime |
| **Cloudflare Analytics** | Traffic, error rates at edge |
| **Sentry** | Error tracking with stack traces (add to both frontend and backend) |
| **Docker stats** | Container resource usage |

### Sentry Setup (Backend)

```js
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
});
app.use(Sentry.Handlers.requestHandler());
// ... routes ...
app.use(Sentry.Handlers.errorHandler());
```

---

## 7. Logging

### Current State
- `console.log/error` only — no structured logging
- Logs lost when container restarts

### Ideal: Structured JSON Logging with Pino

```js
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Replace console.error with:
logger.error({ err: error, orderId, userId }, '[OrderService] Failed to create order');
```

### Log Aggregation (Recommended)

| Tool | Use |
|---|---|
| **Docker logging driver** | Capture all container stdout/stderr |
| **Grafana Loki** | Log aggregation and search |
| **Papertrail** | Simple hosted log management |

---

## 8. Backup Strategy

### Database (Supabase)

Supabase handles PostgreSQL backups automatically:

| Plan | Backup Frequency | Retention |
|---|---|---|
| Free | Daily | 7 days |
| Pro | Daily (PITR available) | 30 days |

**Additional manual backup:**
```bash
# Weekly manual backup script
pg_dump $SUPABASE_DB_URL > backup_$(date +%Y%m%d).sql
# Upload to Cloudflare R2 or S3
```

### Media (Cloudinary)

Cloudinary stores originals — no additional backup required. However:
- Maintain a list of `public_id` values in the database
- Cloudinary's backup/versioning is available on paid plans

---

## 9. Rollback Strategy

### Docker-Based Rollback

```bash
# Rollback to previous image version
docker compose down
docker tag omahring-server:previous omahring-server:latest
docker compose up -d
```

### Database Rollback

Since no migration framework is used currently, rollback is manual:
1. Restore from Supabase backup (PITR on Pro plan)
2. Apply compensating SQL migration manually

**Recommended: Implement Flyway or Supabase CLI migrations with proper down migrations**

---

## 10. Long-Term Recommendations

1. **Implement staging environment** — no production deployments without staging validation
2. **Add health check endpoint** — required for Docker Compose + load balancer
3. **Set up CI/CD pipeline** — GitHub Actions for automated test + deploy
4. **Use semantic versioning** — tag releases in git, reference in Docker image tags
5. **Structured logging** — Pino + Grafana Loki for production observability
6. **Database migration framework** — Supabase CLI or Flyway for reproducible schema changes
7. **Blue/Green deployment** — zero-downtime releases when traffic grows
8. **Auto-scaling** — when on Kubernetes/Fly.io, configure horizontal pod autoscaling

---

*Last updated: 2026-05-11 | Generated by architecture audit*
