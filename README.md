# HSP — Gym Management SaaS

Lets gym owners and staff enroll members, track attendance and membership
status, manage recurring fees, and assign workout routines.

## Tech Stack

- **Backend:** FastAPI + Python 3.11+, SQLAlchemy, Alembic
- **Frontend:** React + Vite + TypeScript, Tailwind CSS
- **Database:** PostgreSQL
- **Auth:** JWT (email/password)

## Project Structure

```
hsp/
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   └── auth/         # JWT auth
│   ├── alembic/          # DB migrations
│   └── tests/
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── services/
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
```

## Tests

```bash
pytest backend/tests -v
cd frontend && npm test
```

See `CLAUDE.md` for full project rules, module conventions, and API standards.
