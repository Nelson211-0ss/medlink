# MediLink — Connecting Healthcare Talent with Opportunity

MediLink is a full-stack, enterprise-grade **healthcare workforce marketplace**. It connects
healthcare professionals (nurses, doctors, pharmacists, lab technicians, radiographers, midwives,
physiotherapists, caregivers, …) with healthcare organizations (hospitals, clinics, NGOs, nursing
homes, telemedicine providers, research institutions).

It combines the best of **LinkedIn + Indeed + Upwork + Tinder-style matching**, purpose-built for
healthcare recruitment.

---

## ✨ Features

- **Authentication & Security** — JWT access + rotating refresh tokens, RBAC, bcrypt, Helmet,
  rate limiting (Redis), CORS, input validation (Zod), SQL-injection-safe parameterized queries.
- **Smart Matching Engine** — healthcare-specific weighted scoring across profession, specialty,
  experience, skills, location, availability, salary and licensing → `{ matchScore, reasons[] }`.
- **Elasticsearch Search** — full-text + filtered/sorted/paginated search for professionals & jobs.
- **Real-time Messaging** — Socket.io chat with typing indicators, read receipts and presence.
- **File Management** — MinIO (S3-ready) uploads for avatars, CVs, certificates and licenses.
- **Payments** — Stripe subscriptions (Free / Premium Professional / Premium Organization).
- **Dashboards** — professional, organization (recruitment pipeline) and admin analytics.
- **Notifications** — in-app (real-time) + email (MailHog in dev).
- **API Docs** — Swagger UI at `/docs`.
- **Modern UI** — React 19 + Tailwind + ShadCN-style components, dark mode, mobile-first.

## 🧱 Tech Stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | React 19, TypeScript, Vite, React Router, Tailwind CSS, ShadCN-style UI, TanStack Query, Zustand, React Hook Form, Zod, Axios |
| Backend      | Node.js, Express, TypeScript, Repository pattern, Service layer, DI container |
| Database     | PostgreSQL 15 |
| Search       | Elasticsearch 8 |
| Cache/Queue  | Redis (rate limiting, presence, BullMQ-ready) |
| Storage      | MinIO (S3-compatible) |
| Realtime     | Socket.io |
| Payments     | Stripe |
| Mail (dev)   | MailHog |
| Infra        | Docker, docker-compose, Nginx |
| CI/CD        | GitHub Actions |

## 📁 Monorepo structure

```
MediLink/
├── backend/                  # Express + TypeScript API
│   └── src/
│       ├── modules/          # Feature route registry
│       ├── middleware/       # auth, rbac, validation, rate limit, errors, upload
│       ├── services/         # business logic (auth, matching, search, stripe, …)
│       ├── repositories/     # data access (repository pattern)
│       ├── routes/           # express routers
│       ├── controllers/      # request/response handlers
│       ├── validators/       # zod schemas
│       ├── sockets/          # Socket.io gateway
│       ├── jobs/             # scheduled/background jobs
│       ├── config/           # env, logger, db clients, swagger
│       ├── database/         # pool, migrations, seed, reindex
│       └── utils/            # errors, jwt, password, helpers
├── frontend/                 # React 19 + Vite SPA
├── docker/                   # nginx configs
├── docs/                     # architecture, API, deployment
├── docker-compose.yml        # dev stack
└── docker-compose.prod.yml   # production stack
```

## 🚀 Quick start (Docker — recommended)

```bash
# 1. Configure environment
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Launch the full stack
docker compose up --build

# 3. Open the app
#   Web app   -> http://localhost:5173       (Vite dev server)
#   Web app   -> http://localhost:8080       (via nginx; set NGINX_HTTP_PORT in .env)
#   API       -> http://localhost:4000/api/v1
#   API docs  -> http://localhost:4000/docs
#   MailHog   -> http://localhost:8025
#   MinIO     -> http://localhost:9001       (minioadmin / minioadmin123)
```

> If host port 80 is already in use, nginx won't start. Set `NGINX_HTTP_PORT=8080`
> (or any free port) in your root `.env`, then `docker compose up -d nginx`.
> The app also works directly via the Vite dev server at `http://localhost:5173`.

The backend runs migrations automatically on boot. To load demo data and index it:

```bash
docker compose exec backend npm run seed
docker compose exec backend npm run search:reindex
```

## 🛠 Local development (without Docker)

You need PostgreSQL, Redis, and optionally Elasticsearch + MinIO running locally.

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev          # http://localhost:4000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

### Demo accounts (after `npm run seed`)

| Role         | Email                       | Password     |
|--------------|-----------------------------|--------------|
| Admin        | admin@medilink.health      | Password123  |
| Organization | org@medilink.health        | Password123  |
| Professional | ashley@medilink.health      | Password123  |

## 🧪 Testing

```bash
cd backend
npm test            # Jest unit tests (matching engine, auth utils)
npm run typecheck
npm run lint
```

## 🎨 Design system

| Token       | Value     |
|-------------|-----------|
| Primary     | `#2563EB` |
| Secondary   | `#10B981` |
| Background  | `#F8FAFC` |
| Text        | `#1E293B` |

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API reference](docs/API.md)
- [Deployment guide](docs/DEPLOYMENT.md)

## 📦 Deliverables checklist

See [docs/CHECKLIST.md](docs/CHECKLIST.md) for the full requirement-by-requirement status.

## 📄 License

MIT — see headers. Built for demonstration of enterprise architecture and best practices.
