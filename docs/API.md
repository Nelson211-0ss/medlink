# MediLink — API Reference

Base URL: `http://localhost:4000/api/v1`
Interactive docs (Swagger UI): `http://localhost:4000/docs`

All responses use a consistent envelope:

```json
{ "success": true, "message": "OK", "data": { }, "meta": { } }
```

Errors:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }
```

Authenticate with `Authorization: Bearer <accessToken>`. The refresh token is set as an httpOnly
cookie and used by `POST /auth/refresh`.

## Auth

| Method | Endpoint                  | Auth | Description |
|--------|---------------------------|------|-------------|
| POST   | `/auth/register`          | —    | Register professional/organization |
| POST   | `/auth/login`             | —    | Login |
| POST   | `/auth/refresh`           | cookie | Rotate tokens |
| POST   | `/auth/logout`            | —    | Revoke refresh token |
| GET    | `/auth/me`                | ✓    | Current user |
| POST   | `/auth/verify-email`      | —    | Verify email with token |
| POST   | `/auth/forgot-password`   | —    | Request reset link |
| POST   | `/auth/reset-password`    | —    | Reset password with token |

## Professionals

| Method | Endpoint                         | Role | Description |
|--------|----------------------------------|------|-------------|
| GET    | `/professionals/me`              | professional | My profile |
| PATCH  | `/professionals/me`              | professional | Update profile |
| PATCH  | `/professionals/me/availability` | professional | Set availability |
| GET    | `/professionals/me/matches`      | professional | Recommended jobs |
| POST   | `/professionals/me/education`    | professional | Add education |
| POST   | `/professionals/me/certifications` | professional | Add certification |
| POST   | `/professionals/me/licenses`     | professional | Add license |
| POST   | `/professionals/me/experience`   | professional | Add work experience |
| GET    | `/professionals/:id`             | ✓    | Public profile |

## Organizations

| Method | Endpoint              | Role | Description |
|--------|-----------------------|------|-------------|
| GET    | `/organizations/me`   | organization | My org profile |
| PATCH  | `/organizations/me`   | organization | Update org profile |
| GET    | `/organizations/:id`  | ✓    | Public org profile |

## Jobs & Applications

| Method | Endpoint                        | Role | Description |
|--------|---------------------------------|------|-------------|
| GET    | `/jobs`                         | —    | List/filter open jobs (paginated) |
| POST   | `/jobs`                         | organization | Create job |
| GET    | `/jobs/:id`                     | —    | Job detail |
| PATCH  | `/jobs/:id`                     | organization | Update job |
| DELETE | `/jobs/:id`                     | organization | Delete job |
| GET    | `/jobs/:id/candidates`          | organization | Matched candidates |
| POST   | `/jobs/:jobId/apply`            | professional | Apply |
| GET    | `/jobs/:jobId/applications`     | organization | Applicants |
| GET    | `/applications/me`              | professional | My applications |
| GET    | `/applications/pipeline`        | organization | Pipeline counts |
| PATCH  | `/applications/:id/stage`       | organization | Move applicant stage |

## Matching

| Method | Endpoint                       | Role | Description |
|--------|--------------------------------|------|-------------|
| GET    | `/matches/recommended-jobs`    | professional | Recommended jobs |
| GET    | `/matches/score?jobId&professionalId` | ✓ | Score a pair |
| POST   | `/matches/:matchId/swipe`      | ✓    | Like/pass (Tinder-style) |

Example match response:

```json
{ "matchScore": 92, "reasons": ["ICU specialization", "5 years experience", "Located in Kampala"] }
```

## Search (Elasticsearch)

| Method | Endpoint                  | Description |
|--------|---------------------------|-------------|
| GET    | `/search/professionals`   | `q, profession, specialization, country, city, availability, page, limit, sort` |
| GET    | `/search/jobs`            | `q, profession, specialization, country, city, employmentType, page, limit, sort` |

## Messaging

| Method | Endpoint                                   | Description |
|--------|--------------------------------------------|-------------|
| GET    | `/messages/conversations`                  | List conversations |
| POST   | `/messages/conversations`                  | Start conversation `{ userId }` |
| GET    | `/messages/conversations/:id/messages`     | History |
| POST   | `/messages/conversations/:id/messages`     | Send (REST fallback) |
| POST   | `/messages/conversations/:id/read`         | Mark read |

Socket.io events: `conversation:join/leave`, `message:send` → `message:new`, `typing:start/stop`
→ `typing`, `message:read`, `presence:update`, `notification:new`.

## Files

| Method | Endpoint                    | Field | Description |
|--------|-----------------------------|-------|-------------|
| POST   | `/files/avatar`             | file  | Upload avatar |
| POST   | `/files/cv`                 | file  | Upload CV |
| POST   | `/files/certificate`        | file  | Upload certificate |
| POST   | `/files/license`            | file  | Upload license |
| POST   | `/files/message-attachment` | file  | Upload chat attachment |

Allowed types: `pdf, jpg, jpeg, png` (max 10MB).

## Subscriptions (Stripe)

| Method | Endpoint                   | Description |
|--------|----------------------------|-------------|
| GET    | `/subscriptions/plans`     | Plan catalog |
| GET    | `/subscriptions/me`        | Current subscription |
| POST   | `/subscriptions/checkout`  | Create checkout session `{ plan }` |
| POST   | `/subscriptions/webhook`   | Stripe webhook (raw body) |

## Dashboard

| Method | Endpoint                    | Role |
|--------|-----------------------------|------|
| GET    | `/dashboard/professional`   | professional |
| GET    | `/dashboard/organization`   | organization |

## Admin

| Method | Endpoint                              | Description |
|--------|---------------------------------------|-------------|
| GET    | `/admin/stats`                        | Platform statistics |
| GET    | `/admin/verifications`                | Pending verifications |
| POST   | `/admin/professionals/:id/verify`     | Verify professional `{ approve }` |
| POST   | `/admin/organizations/:id/verify`     | Verify organization `{ approve }` |
| POST   | `/admin/licenses/:id/verify`          | Verify license `{ approve }` |
| POST   | `/admin/users/:id/status`             | Set user status `{ status }` |
| GET    | `/admin/audit-logs`                   | Recent audit logs |

## Health

| Method | Endpoint   | Description |
|--------|------------|-------------|
| GET    | `/health`  | Service health (db/redis/elasticsearch) |
