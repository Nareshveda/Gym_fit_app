# CLAUDE.md - HSP Project Rules

> Project-specific rules for Claude Code. This file is read automatically.

---

## Project Overview

**Project Name:** HSP (gym management SaaS)
**Description:** Lets gym owners/staff enroll members, track attendance and membership status, manage recurring fees, and assign workout routines.
**Tech Stack:**
- Backend: FastAPI + Python 3.11+
- Frontend: React + Vite + TypeScript
- Database: PostgreSQL + SQLAlchemy
- Auth: JWT (email/password only — no OAuth in MVP)
- UI: Tailwind CSS + shadcn/ui

---

## Project Structure

```
hsp/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── member.py
│   │   │   ├── membership_plan.py
│   │   │   ├── member_subscription.py
│   │   │   ├── payment.py
│   │   │   ├── attendance.py
│   │   │   ├── exercise.py
│   │   │   └── workout_routine.py
│   │   ├── schemas/
│   │   ├── routers/
│   │   │   ├── auth.py, members.py, plans.py, payments.py
│   │   │   ├── attendance.py, exercises.py, routines.py, admin.py
│   │   ├── services/
│   │   └── auth/
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   └── types/
│   └── package.json
├── .claude/
│   └── commands/
├── skills/
├── agents/
└── PRPs/
```

---

## Code Standards

### Python (Backend)
```python
# ALWAYS use type hints
def get_member(db: Session, member_id: int) -> Member:
    pass

# ALWAYS add docstrings for public functions
def create_member(db: Session, data: MemberCreate) -> Member:
    """
    Enroll a new member.

    Args:
        db: Database session
        data: Member enrollment data

    Returns:
        Created Member object
    """
    pass

# Async endpoints
@router.get("/members/{id}")
async def get_member_endpoint(id: int, db: Session = Depends(get_db)):
    pass
```

### TypeScript (Frontend)
```typescript
// ALWAYS define interfaces for props and data
interface Member {
  id: number;
  full_name: string;
  status: 'active' | 'inactive' | 'expired';
  // ...
}

// NO any types allowed
const fetchMember = async (id: number): Promise<Member> => {
  // ...
};
```

---

## Forbidden Patterns

### Backend
- ❌ Never use `print()` - use `logging` module
- ❌ Never store passwords in plain text - use bcrypt
- ❌ Never hardcode secrets - use environment variables
- ❌ Never use `SELECT *` - specify columns
- ❌ Never skip input validation

### Frontend
- ❌ Never use `any` type
- ❌ Never leave `console.log` in production
- ❌ Never skip error handling in async operations
- ❌ Never use inline styles - use Tailwind/shadcn

---

## Module-Specific Rules

### Member Module
- Every `Member` must have `enrolled_by` set to the creating staff user.
- Member `status` is derived from the active `MemberSubscription` (active / expiring_soon / overdue / cancelled → member status active/expired), not set arbitrarily.
- Deactivating a member is a soft delete (`status = inactive`), never a hard delete — attendance and payment history must be preserved.

### Fee Management Module
- `Payment.amount` must never be negative; refunds/adjustments get their own record, not a mutated original.
- A `MemberSubscription.due_date` is computed from `MembershipPlan.duration_type` at assignment/renewal time.
- No online payment gateway in MVP — payments are recorded manually by staff (`recorded_by` required).

### Attendance Module
- A member cannot check in twice without checking out first (reject duplicate open check-ins).
- Attendance records are never deleted, only viewed/filtered.

### Workout Routines Module
- A `WorkoutRoutine` must belong to exactly one member and reference an active `Exercise`.
- `assigned_by` must be a staff/trainer user, never the member.

### Admin Module
- Only users with role `owner` or `admin` may access `/admin/*` endpoints and pages.

---

## API Conventions

- All endpoints prefixed with `/api/v1/`
- Use plural nouns for resources: `/members`, `/payments`, `/plans`
- Return appropriate HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 403: Forbidden (role-restricted, e.g. `/admin/*`)
  - 404: Not Found
  - 409: Conflict

---

## Authentication

Email/password only for MVP — no OAuth.

### JWT Configuration
- Access token expires: 30 minutes
- Refresh token expires: 7 days
- Algorithm: HS256

### Roles
- `owner`, `admin`, `staff`, `trainer` — enforced via dependency-injected role checks, not frontend-only gating.

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hsp

# Auth
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (for notifications)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=

# Frontend
VITE_API_URL=http://localhost:8000
```

---

## Development Commands

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

# Tests
pytest backend/tests -v
cd frontend && npm test

# Linting
ruff check backend/
cd frontend && npm run lint
```

---

## Commit Message Format

```
feat([module]): add [feature]
fix([module]): fix [bug]
refactor([module]): refactor [component]
test([module]): add tests for [feature]
docs: update [documentation]
```

---

## Skills Reference

| Task | Skill to Read |
|------|---------------|
| Database models | skills/DATABASE.md |
| API + Auth | skills/BACKEND.md |
| React + UI | skills/FRONTEND.md |
| Testing | skills/TESTING.md |
| Deployment | skills/DEPLOYMENT.md |

---

## Agent Coordination

For complex tasks, the ORCHESTRATOR coordinates:
- DATABASE-AGENT → Backend models
- BACKEND-AGENT → API development
- FRONTEND-AGENT → UI components
- TEST-AGENT → Testing
- REVIEW-AGENT → Code review
- DEVOPS-AGENT → Deployment

Read agent definitions in `/agents/` folder.
