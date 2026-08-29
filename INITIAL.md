# INITIAL.md - HSP Product Definition

> A gym management SaaS for owners and staff to enroll members, track attendance and membership status, manage recurring fees, and assign workout routines.

---

## PRODUCT

### Name
HSP

### Description
HSP is a gym management platform that lets gym owners and staff enroll new members, track attendance and membership status, manage recurring membership fees (monthly/quarterly/yearly), and assign workout routines to members. It replaces spreadsheets and paper logs with a single system for day-to-day gym operations.

### Target User
Gym owners and managers running a small-to-medium gym or fitness studio who need to manage members, collect/track fees, and coordinate trainers and workout plans.

### Type
- [x] SaaS (Software as a Service)

---

## TECH STACK

### Backend
- [x] FastAPI + Python

### Frontend
- [x] React + Vite + TypeScript

### Database
- [x] PostgreSQL

### Authentication
- [x] Email/Password only (JWT access + refresh tokens, no OAuth)

### UI Framework
- [x] Tailwind CSS + shadcn/ui

### Payments
- [ ] None — no online payment gateway for MVP. Fees are recorded manually (cash/card/bank transfer) by staff.

---

## MODULES

### Module 1: Authentication (Required)

**Description:** Staff/admin authentication and authorization (gym members are managed as records, not app accounts, in MVP).

**Models:**
- User: id, email, hashed_password, full_name, role (owner/admin/staff/trainer), is_active, created_at, updated_at
- RefreshToken: id, user_id, token, expires_at, revoked

**API Endpoints:**
- POST /api/v1/auth/register - Create new staff/admin account
- POST /api/v1/auth/login - Login with email/password
- POST /api/v1/auth/refresh - Refresh access token
- POST /api/v1/auth/logout - Revoke refresh token
- GET /api/v1/auth/me - Get current user profile
- PUT /api/v1/auth/me - Update profile
- POST /api/v1/auth/forgot-password - Request password reset (email)
- POST /api/v1/auth/reset-password - Reset password with token

**Frontend Pages:**
- /login - Login page
- /register - Registration page (invite-only in production, open in MVP)
- /forgot-password, /reset-password - Password reset flow
- /profile - User profile page (protected)

---

### Module 2: Member Enrollment

**Description:** Manage the member roster — sign up new members and maintain their profile.

**Models:**
```
Member:
  - id
  - full_name: str
  - email: str (unique, optional)
  - phone: str
  - date_of_birth: date
  - gender: str
  - address: str (optional)
  - emergency_contact_name: str (optional)
  - emergency_contact_phone: str (optional)
  - photo_url: str (optional)
  - join_date: date
  - status: enum (active, inactive, expired)
  - enrolled_by: user_id (FK)
  - created_at, updated_at
```

**API Endpoints:**
```
GET    /api/v1/members       - List all members (filter by status, search by name/phone)
POST   /api/v1/members       - Enroll new member
GET    /api/v1/members/{id}  - Get member detail (profile + plan + attendance summary)
PUT    /api/v1/members/{id}  - Update member profile
DELETE /api/v1/members/{id}  - Deactivate member (soft delete)
```

**Frontend Pages:**
- /members - Member list (search, filter by status)
- /members/new - Enrollment form
- /members/{id} - Member detail (profile, plan, attendance, payments)
- /members/{id}/edit - Edit member profile

---

### Module 3: Fee Management

**Description:** Define recurring membership plans and record/track member payments and dues.

**Models:**
```
MembershipPlan:
  - id
  - name: str
  - duration_type: enum (monthly, quarterly, yearly)
  - price: decimal
  - description: str (optional)
  - is_active: bool
  - created_at, updated_at

MemberSubscription:
  - id
  - member_id: FK
  - plan_id: FK
  - start_date: date
  - due_date: date
  - status: enum (active, expiring_soon, overdue, cancelled)
  - created_at, updated_at

Payment:
  - id
  - member_id: FK
  - subscription_id: FK
  - amount: decimal
  - payment_date: date
  - payment_method: enum (cash, card, bank_transfer, other)
  - recorded_by: user_id (FK)
  - notes: str (optional)
  - created_at
```

**API Endpoints:**
```
GET    /api/v1/plans                     - List membership plans
POST   /api/v1/plans                     - Create plan
PUT    /api/v1/plans/{id}                - Update plan
DELETE /api/v1/plans/{id}                - Deactivate plan

POST   /api/v1/members/{id}/subscriptions - Assign/renew plan for member
GET    /api/v1/members/{id}/subscriptions - Subscription history

GET    /api/v1/payments                  - List payments (filter by member, date range, status)
POST   /api/v1/payments                  - Record a payment
GET    /api/v1/members/{id}/payments     - Member payment history
GET    /api/v1/payments/overdue          - List overdue/expiring subscriptions
```

**Frontend Pages:**
- /plans - Plan list & management
- /plans/new, /plans/{id}/edit - Create/edit plan
- /payments - Payment list, record-payment form
- /payments/overdue - Overdue/expiring dues view
- /members/{id}/payments - Member's payment history (embedded in member detail)

---

### Module 4: Attendance & Membership Tracking

**Description:** Track member check-ins/check-outs and surface live membership status.

**Models:**
```
Attendance:
  - id
  - member_id: FK
  - check_in_time: datetime
  - check_out_time: datetime (optional)
  - date: date
  - created_at
```

**API Endpoints:**
```
POST   /api/v1/attendance/check-in       - Check in a member (by member_id or search)
PUT    /api/v1/attendance/{id}/check-out - Check out a member
GET    /api/v1/attendance                - List attendance (filter by date, member)
GET    /api/v1/members/{id}/attendance   - Member attendance history
```

**Frontend Pages:**
- /attendance - Front-desk check-in/check-out view (search member, one-click check-in)
- /members/{id}/attendance - Attendance history (embedded in member detail)

---

### Module 5: Workout Routines

**Description:** Staff/trainers assign structured workout routines to members from an exercise library.

**Models:**
```
Exercise:
  - id
  - name: str
  - category: enum (cardio, strength, flexibility)
  - muscle_group: str
  - description: str (optional)
  - video_url: str (optional)
  - created_at

WorkoutRoutine:
  - id
  - member_id: FK
  - name: str
  - assigned_by: user_id (FK)
  - start_date: date
  - end_date: date (optional)
  - notes: str (optional)
  - created_at, updated_at

RoutineExercise:
  - id
  - routine_id: FK
  - exercise_id: FK
  - day_of_week: int (0-6)
  - sets: int
  - reps: int
  - weight: decimal (optional)
  - rest_seconds: int (optional)
  - order: int
```

**API Endpoints:**
```
GET    /api/v1/exercises                  - List exercise library
POST   /api/v1/exercises                  - Add exercise
PUT    /api/v1/exercises/{id}             - Update exercise
DELETE /api/v1/exercises/{id}             - Remove exercise

GET    /api/v1/members/{id}/routines      - List member's routines
POST   /api/v1/members/{id}/routines      - Assign new routine
PUT    /api/v1/routines/{id}              - Update routine
DELETE /api/v1/routines/{id}              - Remove routine
```

**Frontend Pages:**
- /exercises - Exercise library list & management
- /exercises/new, /exercises/{id}/edit - Create/edit exercise
- /members/{id}/routines - Member's routines (embedded in member detail)
- /members/{id}/routines/new - Build/assign a routine
- /routines/{id}/edit - Edit routine

---

### Module 6: Dashboard

**Description:** Operational overview for gym owners/staff.

**Frontend Pages:**
- /dashboard - Total members, active/expiring/overdue counts, today's attendance, revenue this month
- /settings - Gym profile, staff preferences

---

### Module 7: Admin Panel

**Description:** Manage staff accounts and view platform-level stats.

**API Endpoints:**
- GET /api/v1/admin/users - List all staff/admin users
- PUT /api/v1/admin/users/{id} - Update user role/status
- GET /api/v1/admin/stats - Platform statistics

**Frontend Pages:**
- /admin - Admin dashboard (protected, owner/admin role only)
- /admin/users - Staff user management

---

### Module 8: Email Notifications

**Description:** Transactional emails for account and billing events.

**Triggers:**
- Welcome email on staff account creation
- Password reset email
- Payment reminder (X days before due_date)
- Overdue payment alert

---

## MVP SCOPE

### Must Have (MVP)
- [x] Staff registration and login (email/password)
- [x] Member enrollment (create/view/edit/deactivate)
- [x] Membership plans (monthly/quarterly/yearly) + assign to member
- [x] Payment recording + overdue/expiring status tracking
- [x] Attendance check-in/check-out
- [x] Dashboard overview
- [x] Admin panel (staff user management)

### Nice to Have (Post-MVP)
- [ ] Workout routines & exercise library
- [ ] Email notifications (reminders, alerts)
- [ ] Analytics/reporting beyond the basic dashboard
- [ ] File uploads (member photos, progress images)

---

## ACCEPTANCE CRITERIA

### Authentication
- [ ] Staff can register and login with email/password
- [ ] JWT access + refresh tokens work correctly
- [ ] Protected routes redirect to /login when unauthenticated
- [ ] Password reset flow works end-to-end

### Member Enrollment
- [ ] Staff can enroll a new member with required profile fields
- [ ] Staff can search/filter members by name, phone, status
- [ ] Deactivating a member sets status without deleting history

### Fee Management
- [ ] Staff can create membership plans and assign them to members
- [ ] Recording a payment updates the member's subscription status
- [ ] Overdue/expiring subscriptions are correctly listed and flagged

### Attendance
- [ ] Staff can check a member in and out
- [ ] Attendance history is visible per member and per day

### Quality
- [ ] All API endpoints documented in OpenAPI
- [ ] Backend test coverage 80%+
- [ ] Frontend TypeScript strict mode passes, no `any`
- [ ] Docker builds and runs successfully

---

## SPECIAL REQUIREMENTS

### Security
- [x] Rate limiting on auth endpoints
- [x] Input validation on all endpoints
- [x] SQL injection prevention (SQLAlchemy ORM, no raw string interpolation)
- [x] XSS prevention on frontend

### Integrations
- [x] Email service for notifications (welcome, password reset, payment reminders)
- [ ] Payment gateway (not needed for MVP — manual fee recording)
- [ ] File upload service (post-MVP, for member photos)

---

## AGENTS

> These agents build HSP in parallel:

| Agent | Role | Works On |
|-------|------|----------|
| DATABASE-AGENT | Creates all models and migrations | User, Member, MembershipPlan, MemberSubscription, Payment, Attendance, Exercise, WorkoutRoutine |
| BACKEND-AGENT | Builds API endpoints and services | Auth, Members, Plans, Payments, Attendance, Exercises, Routines, Admin |
| FRONTEND-AGENT | Creates UI pages and components | All modules' frontends |
| DEVOPS-AGENT | Sets up Docker, CI/CD, environments | Infrastructure |
| TEST-AGENT | Writes unit and integration tests | All code |
| REVIEW-AGENT | Security and code quality audit | All code |

---

# READY?

```bash
/generate-prp INITIAL.md
```

Then:

```bash
/execute-prp PRPs/hsp-prp.md
```
