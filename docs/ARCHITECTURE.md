# MediNexus — System Architecture

## High-level overview

```
                       ┌─────────────────────────────────────────────┐
                       │                   Nginx                      │
                       │   /  → frontend     /api → backend           │
                       │   /socket.io → backend (WebSocket upgrade)   │
                       └───────────────┬──────────────┬──────────────┘
                                       │              │
                ┌──────────────────────▼───┐   ┌──────▼───────────────────┐
                │   Frontend (React 19)     │   │   Backend (Express/TS)    │
                │   Vite SPA, TanStack      │   │   REST + Socket.io        │
                │   Query, Zustand          │   │                           │
                └───────────────────────────┘   └───┬───────┬───────┬──────┘
                                                     │       │       │
                          ┌──────────────────────────┘       │       └───────────────┐
                          │                                   │                       │
                   ┌──────▼──────┐   ┌─────────────┐   ┌──────▼──────┐   ┌────────────▼───┐
                   │ PostgreSQL  │   │   Redis     │   │ Elasticsearch│   │   MinIO (S3)   │
                   │ (source of  │   │ rate limit, │   │  search      │   │  file storage  │
                   │  truth)     │   │ presence    │   │  index       │   │                │
                   └─────────────┘   └─────────────┘   └─────────────┘   └────────────────┘
                                                                          ┌────────────────┐
                                                                          │ Stripe / SMTP  │
                                                                          └────────────────┘
```

## Backend layered architecture

Request flow:

```
HTTP Request
   │
   ▼
Route (routes/*.routes.ts)
   │  → middleware: rate limit → authenticate → authorize(RBAC) → validate(Zod)
   ▼
Controller (controllers/*.controller.ts)   # thin: parse req, shape response
   │
   ▼
Service (services/*.service.ts)            # business logic, orchestration
   │
   ▼
Repository (repositories/*.repository.ts)  # data access, parameterized SQL
   │
   ▼
PostgreSQL / Elasticsearch / Redis / MinIO / Stripe
```

### Patterns used

- **Repository pattern** — `BaseRepository` provides generic CRUD; concrete repositories add
  domain queries. Controllers never touch SQL.
- **Service layer** — all business rules live in services; services are composed of repositories
  and other services.
- **Dependency injection** — a single `container.ts` instantiates repositories and services once
  and wires them together. Controllers and sockets resolve collaborators from the container.
- **Centralized error handling** — typed `AppError` subclasses → consistent JSON error envelope
  via the global `errorHandler` middleware.
- **Validation at the edge** — Zod schemas validate body/query/params before controllers run.

## Authentication & authorization

- **Access token** (JWT, short-lived ~15m) sent as `Authorization: Bearer` or cookie.
- **Refresh token** (JWT, ~7d) stored hashed (sha256) in `refresh_tokens`, delivered as an
  httpOnly cookie scoped to `/api/v1/auth`. Rotated on every refresh (old token revoked).
- **RBAC** — `authorize(...roles)` middleware gates routes by role
  (`professional`, `organization`, `admin`).
- **Email verification & password reset** — one-time tokens stored hashed in `auth_tokens`.

## Smart matching engine

`services/matching.service.ts` implements a pure, unit-tested scoring function with weighted
dimensions (profession 30, specialization 20, experience 15, skills 12, location 10, availability 5,
salary 5, licenses 3). It returns a normalized `matchScore` (0–100) and human-readable `reasons`.
Matches are persisted in `matches` and support Tinder-style `org_action`/`prof_action` with mutual
detection.

## Real-time layer

`sockets/index.ts` authenticates the Socket.io handshake with the access token, joins each user to
a personal room (`user:<id>`) for notifications and to conversation rooms for chat. Events:
`message:send/new`, `typing:start/stop`, `message:read`, `presence:update`. Presence is tracked in
a Redis set.

## Search

PostgreSQL is the source of truth; Elasticsearch is a derived read model. Documents are indexed on
write (profile/job create/update) and can be fully rebuilt with `npm run search:reindex`.

## Scalability notes

- Stateless API → horizontally scalable behind Nginx/load balancer.
- Redis-backed rate limiting and presence work across multiple API instances (add the Socket.io
  Redis adapter for multi-node websockets).
- Heavy/async work (emails, indexing, matching sweeps) can move to BullMQ workers (dependency
  already included) consuming Redis queues.
