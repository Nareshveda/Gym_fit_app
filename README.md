# HSP — Gym Management SaaS

HSP lets gym owners and staff enroll members, track attendance and
membership status, manage recurring fees, monitor member vitals, and run
multi-location/inventory operations — replacing spreadsheets and paper logs
with a single system for day-to-day gym operations.

## Tech Stack

- **Backend:** FastAPI + Python 3.11+, SQLAlchemy, Alembic, Pydantic v2
- **Frontend:** React + Vite + TypeScript, Tailwind CSS
- **Database:** PostgreSQL (SQLite in-memory for tests)
- **Auth:** JWT access + refresh tokens (email/password only — no OAuth)

## Roles

- `owner`, `admin` — full access, including `/admin/*` (staff management, locations, inventory)
- `staff`, `trainer` — day-to-day operations (enroll members, attendance, payments)
- `member` — self-service portal only (own profile, attendance history, vitals)

Role checks are enforced server-side via dependency injection, never
frontend-only gating.

## Features

### Authentication (`/api/v1/auth`)
- Register (first account bootstraps as `owner`; every account after that is
  created via the admin-gated staff endpoints, not this public route)
- Login, refresh (rotating refresh tokens), logout (revokes refresh token)
- Get/update own profile, upload own avatar
- Shared login for both staff `User` accounts and self-service `Member` accounts

### Member Enrollment (`/api/v1/members`)
- List (search by name/phone, filter by status), enroll, view, update
- Deactivate (soft delete — status only, attendance/payment history preserved)
- Set/reset a member's own portal login credentials
- Member `status` (active/inactive/expired) is derived from their active
  `MemberSubscription`, never set arbitrarily

### Fee Management (`/api/v1/plans`, `/api/v1/payments`, `/api/v1/members/{id}/subscriptions`)
- Membership plans (monthly/quarterly/yearly), create/update/deactivate
- Assign/renew a member's subscription — `due_date` computed from the plan's
  duration type
- Record payments (cash/card/bank transfer), always manual (`recorded_by`
  required) — no online payment gateway in MVP
- Overdue/expiring subscriptions list
- Payment `amount` is never negative; refunds/adjustments get their own
  record rather than mutating the original

### Attendance (`/api/v1/attendance`)
- Check-in / check-out (a member cannot check in twice without checking out
  first)
- Attendance history, filterable by date/member — records are never deleted

### Member Vitals (`/api/v1/members/{id}/vitals`)
- Log and view a member's vitals history and vitals dashboard trend

### Staff Attendance (`/api/v1/staff-attendance`)
- Check-in / check-out for staff/trainers, same duplicate-open-check-in rule
  as member attendance

### Locations (`/api/v1/locations`) — owner/admin only
- Manage gym branches/locations; members and equipment can be assigned to one

### Equipment / Inventory (`/api/v1/equipment`) — owner/admin only
- Track equipment (brand, purchase date, amount, warranty, service schedule)
- Assign equipment to one or more locations
- Upload supporting documents (warranty/service PDFs)

### Member Self-Service Portal (`/api/v1/me`)
- A logged-in member can view their own attendance history and vitals
  without staff involvement

### Dashboard (`/api/v1/dashboard/stats`)
- Total/active member counts, today's attendance, revenue this month
- Plan split, members-by-location breakdown
- Most-active member and at-risk (no recent check-in) member insights

### Admin Panel (`/api/v1/admin`)
- List/manage staff accounts and roles, platform stats
- Restricted to `owner`/`admin` roles on both API and frontend routes

## Frontend Routes

| Path | Access | Page |
|---|---|---|
| `/`, `/contact` | public | Home, Contact |
| `/login`, `/register` | public | Auth |
| `/portal`, `/portal/profile` | member | Member self-service portal |
| `/dashboard` | staff+ | Dashboard |
| `/members`, `/members/new`, `/members/:id`, `/members/:id/edit`, `/members/:id/vitals` | staff+ | Member management |
| `/plans` | staff+ | Membership plans |
| `/payments`, `/payments/overdue` | staff+ | Fee management |
| `/attendance` | staff+ | Check-in/out |
| `/inventory` | staff+ | Equipment/inventory |
| `/profile` | staff+ | Own profile |
| `/admin`, `/admin/users`, `/admin/staff/new`, `/admin/locations` | owner/admin | Admin panel |

## Not Yet Implemented

Workout routines and an exercise library (`Exercise`, `WorkoutRoutine`,
`RoutineExercise` models exist but have no registered router/API yet) and
transactional email notifications (welcome, password reset, payment
reminders) remain post-MVP scope.

## Project Structure

```
hsp/
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   └── auth/         # JWT auth, password hashing
│   ├── alembic/          # DB migrations
│   └── tests/            # pytest + FastAPI TestClient
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── services/      # API clients
        └── types/
```

## Run Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Docker
docker-compose up -d
```

## Tests

```bash
pytest backend/tests -v
cd frontend && npm test
```

## Environment Variables

See `.env.example` for the full list — database URL, JWT secret/algorithm/
expiry, and SMTP settings for future email notifications.

---

See `CLAUDE.md` for full project rules and conventions, `INITIAL.md` for the
original product spec, and `PRPs/hsp-prp.md` for the implementation blueprint.
