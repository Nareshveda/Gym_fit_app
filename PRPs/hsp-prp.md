# PRP: HSP

> Implementation blueprint for parallel agent execution

---

## METADATA

| Field | Value |
|-------|-------|
| **Product** | HSP |
| **Type** | SaaS (gym management) |
| **Version** | 1.0 |
| **Created** | 2026-08-29 |
| **Complexity** | Medium |

---

## PRODUCT OVERVIEW

**Description:** HSP is a gym management platform for owners and staff to enroll members, track attendance and membership status, manage recurring membership fees, and assign workout routines — replacing spreadsheets and paper logs.

**Value Proposition:** A single system for day-to-day gym operations — front-desk check-in, fee/dues tracking, and trainer workflows — without the overhead of a full ERP.

**MVP Scope:**
- [ ] Staff registration and login (email/password)
- [ ] Member enrollment (create/view/edit/deactivate)
- [ ] Membership plans (monthly/quarterly/yearly) + assign to member
- [ ] Payment recording + overdue/expiring status tracking
- [ ] Attendance check-in/check-out
- [ ] Dashboard overview
- [ ] Admin panel (staff user management)

**Post-MVP:** Workout routines & exercise library, email notifications, analytics/reporting, file uploads.

---

## TECH STACK

| Layer | Technology | Skill Reference |
|-------|------------|-----------------|
| Backend | FastAPI + Python 3.11+ | skills/BACKEND.md |
| Frontend | React + TypeScript + Vite | skills/FRONTEND.md |
| Database | PostgreSQL + SQLAlchemy | skills/DATABASE.md |
| Auth | JWT + bcrypt (email/password only, no OAuth) | skills/BACKEND.md |
| UI | Tailwind CSS + shadcn/ui | skills/FRONTEND.md |
| Testing | pytest + RTL | skills/TESTING.md |
| Deployment | Docker + GitHub Actions | skills/DEPLOYMENT.md |

---

## DATABASE MODELS

### User
- id, email, hashed_password, full_name, role (owner/admin/staff/trainer), is_active, created_at, updated_at

### RefreshToken
- id, user_id (FK → User), token, expires_at, revoked

### Member
- id, full_name, email, phone, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, photo_url, join_date, status (active/inactive/expired), enrolled_by (FK → User), created_at, updated_at

### MembershipPlan
- id, name, duration_type (monthly/quarterly/yearly), price, description, is_active, created_at, updated_at

### MemberSubscription
- id, member_id (FK → Member), plan_id (FK → MembershipPlan), start_date, due_date, status (active/expiring_soon/overdue/cancelled), created_at, updated_at

### Payment
- id, member_id (FK → Member), subscription_id (FK → MemberSubscription), amount, payment_date, payment_method (cash/card/bank_transfer/other), recorded_by (FK → User), notes, created_at

### Attendance
- id, member_id (FK → Member), check_in_time, check_out_time, date, created_at

### Exercise
- id, name, category (cardio/strength/flexibility), muscle_group, description, video_url, created_at

### WorkoutRoutine
- id, member_id (FK → Member), name, assigned_by (FK → User), start_date, end_date, notes, created_at, updated_at

### RoutineExercise
- id, routine_id (FK → WorkoutRoutine), exercise_id (FK → Exercise), day_of_week, sets, reps, weight, rest_seconds, order

---

## MODULES

### Module 1: Authentication
**Agents:** DATABASE-AGENT + BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Create staff/admin account |
| POST | /api/v1/auth/login | Login, get tokens |
| POST | /api/v1/auth/refresh | Refresh access token |
| POST | /api/v1/auth/logout | Revoke refresh token |
| GET | /api/v1/auth/me | Current user profile |
| PUT | /api/v1/auth/me | Update profile |
| POST | /api/v1/auth/forgot-password | Request password reset |
| POST | /api/v1/auth/reset-password | Reset password with token |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /login | LoginPage | LoginForm |
| /register | RegisterPage | RegisterForm |
| /forgot-password | ForgotPasswordPage | ForgotPasswordForm |
| /reset-password | ResetPasswordPage | ResetPasswordForm |
| /profile | ProfilePage | ProfileForm |

---

### Module 2: Member Enrollment
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/members | List members (search/filter by status) |
| POST | /api/v1/members | Enroll new member |
| GET | /api/v1/members/{id} | Get member detail |
| PUT | /api/v1/members/{id} | Update member profile |
| DELETE | /api/v1/members/{id} | Deactivate member (soft delete) |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /members | MemberListPage | MemberTable, SearchBar, StatusFilter |
| /members/new | MemberEnrollPage | MemberForm |
| /members/{id} | MemberDetailPage | MemberProfile, PaymentHistory, AttendanceHistory |
| /members/{id}/edit | MemberEditPage | MemberForm |

---

### Module 3: Fee Management
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/plans | List membership plans |
| POST | /api/v1/plans | Create plan |
| PUT | /api/v1/plans/{id} | Update plan |
| DELETE | /api/v1/plans/{id} | Deactivate plan |
| POST | /api/v1/members/{id}/subscriptions | Assign/renew plan for member |
| GET | /api/v1/members/{id}/subscriptions | Subscription history |
| GET | /api/v1/payments | List payments (filter by member, date, status) |
| POST | /api/v1/payments | Record a payment |
| GET | /api/v1/members/{id}/payments | Member payment history |
| GET | /api/v1/payments/overdue | List overdue/expiring subscriptions |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /plans | PlanListPage | PlanTable |
| /plans/new | PlanCreatePage | PlanForm |
| /plans/{id}/edit | PlanEditPage | PlanForm |
| /payments | PaymentListPage | PaymentTable, RecordPaymentForm |
| /payments/overdue | OverduePaymentsPage | OverdueTable |

---

### Module 4: Attendance & Membership Tracking
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/attendance/check-in | Check in a member |
| PUT | /api/v1/attendance/{id}/check-out | Check out a member |
| GET | /api/v1/attendance | List attendance (filter by date, member) |
| GET | /api/v1/members/{id}/attendance | Member attendance history |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /attendance | AttendancePage | MemberSearch, CheckInButton, CheckOutButton, TodayList |

---

### Module 5: Workout Routines *(post-MVP)*
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/exercises | List exercise library |
| POST | /api/v1/exercises | Add exercise |
| PUT | /api/v1/exercises/{id} | Update exercise |
| DELETE | /api/v1/exercises/{id} | Remove exercise |
| GET | /api/v1/members/{id}/routines | List member's routines |
| POST | /api/v1/members/{id}/routines | Assign new routine |
| PUT | /api/v1/routines/{id} | Update routine |
| DELETE | /api/v1/routines/{id} | Remove routine |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /exercises | ExerciseListPage | ExerciseTable |
| /exercises/new | ExerciseCreatePage | ExerciseForm |
| /exercises/{id}/edit | ExerciseEditPage | ExerciseForm |
| /members/{id}/routines | MemberRoutinesPage | RoutineList |
| /members/{id}/routines/new | RoutineAssignPage | RoutineBuilder |
| /routines/{id}/edit | RoutineEditPage | RoutineBuilder |

---

### Module 6: Dashboard
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /dashboard | DashboardPage | StatCards (members, revenue, attendance), ExpiringList |
| /settings | SettingsPage | GymProfileForm, PreferencesForm |

---

### Module 7: Admin Panel
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/admin/users | List staff/admin users |
| PUT | /api/v1/admin/users/{id} | Update user role/status |
| GET | /api/v1/admin/stats | Platform statistics |

**Frontend Pages:**
| Route | Page | Components |
|-------|------|------------|
| /admin | AdminDashboardPage | AdminStats |
| /admin/users | AdminUserListPage | UserTable, RoleSelector |

*Access restricted to `owner`/`admin` roles — enforced server-side via dependency-injected role check, not frontend-only.*

---

### Module 8: Email Notifications *(post-MVP, cross-cutting)*
**Agents:** BACKEND-AGENT

No dedicated endpoints/pages — implemented as a `services/email.py` triggered by other modules:
- Welcome email on staff account creation
- Password reset email
- Payment reminder (N days before `due_date`)
- Overdue payment alert

---

## PHASE EXECUTION PLAN

**Phase 1: Foundation (4 agents in parallel)**
- DATABASE-AGENT: All 10 models, Alembic migrations, database.py
- BACKEND-AGENT: main.py, config.py, project structure, role-based auth dependency
- FRONTEND-AGENT: Vite setup, folder structure, base components, Tailwind/shadcn config
- DEVOPS-AGENT: Docker, CI/CD, env files

**Validation Gate 1:** `pip install`, `alembic upgrade head`, `npm install`, `docker-compose config`

**Phase 2: Modules (backend + frontend parallel per module)**
- Auth Module: JWT endpoints + Login/Register/Profile pages
- Member Enrollment: CRUD endpoints + Member list/detail/enroll pages
- Fee Management: Plans/Subscriptions/Payments endpoints + Plan/Payment pages
- Attendance: Check-in/out endpoints + Attendance page
- Dashboard: Stats aggregation endpoint + Dashboard page
- Admin Panel: Admin endpoints + Admin pages
- *(Post-MVP, if scope expands)* Workout Routines: Exercise/Routine endpoints + pages
- *(Post-MVP)* Email Notifications: email service wired into Auth/Fee modules

**Validation Gate 2:** `ruff check backend/`, `mypy backend/`, `npm run lint`, `npm run type-check`

**Phase 3: Quality (3 agents in parallel)**
- TEST-AGENT: pytest + RTL tests, 80%+ coverage (member enrollment, subscription/payment status transitions, attendance check-in/out edge cases, role-based access on /admin)
- REVIEW-AGENT: Security audit (role enforcement, input validation, no hardcoded secrets), performance review
- RESEARCH-AGENT: Best practices validation

**Final Validation:** Full test suite, docker build, health checks

---

## VALIDATION GATES

| Gate | Commands |
|------|----------|
| 1 | `alembic upgrade head`, `npm install`, `docker-compose config` |
| 2 | `ruff check backend/`, `npm run type-check` |
| 3 | `pytest --cov --cov-fail-under=80`, `npm test` |
| Final | `docker-compose up -d`, `curl localhost:8000/health` |

---

## ENVIRONMENT VARIABLES

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hsp
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (post-MVP notifications)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=

VITE_API_URL=http://localhost:8000
```

---

## NEXT STEP

Execute with parallel agents:
/execute-prp PRPs/hsp-prp.md
