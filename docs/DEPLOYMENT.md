# MediLink — Production Deployment Guide

## 1. Prerequisites

- A Linux host (or container platform) with Docker + Docker Compose v2.
- A domain name pointing to the host.
- TLS certificates (Let's Encrypt recommended).
- Managed or self-hosted PostgreSQL, Redis, Elasticsearch and object storage (or use the
  containers in `docker-compose.prod.yml`).
- A Stripe account (live keys) and an SMTP provider.

## 2. Environment configuration

Create production env files (never commit them):

```bash
cp .env.example .env                       # compose-level vars
cp backend/.env.example backend/.env.production
```

Set strong, unique values in `backend/.env.production`:

```env
NODE_ENV=production
PORT=4000
API_PREFIX=/api/v1
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com

DATABASE_URL=postgresql://USER:STRONG_PASSWORD@postgres:5432/medilink
REDIS_URL=redis://:STRONG_REDIS_PASSWORD@redis:6379

JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>

ELASTICSEARCH_NODE=http://elasticsearch:9200

STORAGE_DRIVER=s3            # use AWS S3 in production
AWS_REGION=us-east-1
AWS_S3_BUCKET=medilink-prod

SMTP_HOST=smtp.youremail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_SECURE=true
MAIL_FROM="MediLink <no-reply@yourdomain.com>"

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PREMIUM_PRO=price_...
STRIPE_PRICE_PREMIUM_ORG=price_...
```

> Generate secrets with `openssl rand -hex 32`. Never reuse dev secrets.

## 3. TLS certificates

Place certificates where Nginx expects them:

```
docker/nginx/certs/fullchain.pem
docker/nginx/certs/privkey.pem
```

For Let's Encrypt, use certbot on the host and mount the live directory, or add a companion
container. `docker/nginx/prod.conf` already redirects HTTP→HTTPS and sets security headers.

## 4. Build & launch

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

This builds the **production** targets (compiled backend, static frontend served by Nginx).

## 5. Database migration & indexing

Migrations run automatically on backend boot. To seed reference data or rebuild search:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run migrate:prod
docker compose -f docker-compose.prod.yml exec backend node dist/database/reindex.js
```

## 6. Stripe webhook

Point a Stripe webhook to `https://api.yourdomain.com/api/v1/subscriptions/webhook` for the events
`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## 7. Health & monitoring

- Health endpoint: `GET /api/v1/health` (used by the container `HEALTHCHECK`).
- Logs: structured JSON via pino (`docker compose logs -f backend`). Ship to your log platform.
- Add Prometheus/Grafana or a hosted APM as needed.

## 8. Hardening checklist

- [ ] Rotate all secrets; store them in a secrets manager.
- [ ] Restrict Postgres/Redis/Elasticsearch to the internal Docker network (no published ports).
- [ ] Enable Elasticsearch security (`xpack.security.enabled=true`, already set in prod compose).
- [ ] Set Redis `requirepass` (already wired via `REDIS_PASSWORD`).
- [ ] Configure automated database backups.
- [ ] Set up the Socket.io Redis adapter when running >1 backend replica.
- [ ] Configure WAF/CDN (e.g. Cloudflare) in front of Nginx.

## 9. Scaling

- Run multiple `backend` replicas behind Nginx; the API is stateless.
- Move email/indexing/matching sweeps to BullMQ workers (Redis-backed) for throughput.
- Use a managed PostgreSQL with read replicas and managed Elasticsearch for large datasets.
```
