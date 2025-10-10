# Course Atlas

![Backend CI](https://github.com/AdamSimkinbgu/CourseAtlas/actions/workflows/ci-backend.yml/badge.svg)
![Frontend CI](https://github.com/AdamSimkinbgu/CourseAtlas/actions/workflows/ci-frontend.yml/badge.svg)

Course Atlas is a course planning platform that helps students visualise prerequisites and track progress. This repository contains the monorepo skeleton for backend and frontend services.

## Repository Layout

- `backend/` – FastAPI service (Supabase Postgres + Supabase Auth).
- `frontend/` – React + Vite client deployed on Vercel.
- `docs/` – Project documentation and planning artefacts (see `docs/setup/` for environment notes).

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+ and npm 10+
- Docker Desktop (optional – used for local Postgres via `docker-compose`)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API exposes a health endpoint at `GET /healthz`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` (see `.env.example`) to point at the backend service.

### One-command helpers

```bash
make bootstrap        # install backend + frontend dependencies
make backend-dev      # activate venv and run uvicorn
make frontend-dev     # start Vite dev server
make lint             # run backend + frontend linters
make test             # run frontend vitest placeholder (backend tests TBD)
```

See `docs/setup/backend.md` and `docs/setup/frontend.md` for detailed environment setup and troubleshooting tips.

### Code Quality Tooling

- **Format (frontend):** `npm run format`
- **Lint (frontend):** `npm run lint`
- **Test (frontend):** `npm run test`
- **Type-check (frontend):** `npm run typecheck`
- **Format (backend):** `black backend`
- **Lint (backend):** `ruff check backend`
- **Tests (backend):** `pytest`

See `docs/conventions/coding-standards.md` for detailed standards and folder layout.

### Smoke Test Checklist

1. `make bootstrap`
2. `make backend-dev` (ensure `/healthz` returns `{"status":"ok"}`)
3. `make frontend-dev` (homepage shows “Backend responded with: ok”)

## Provider Choices

- Authentication & Database: Supabase Auth + Supabase Postgres
- Backend Hosting: Render
- Frontend Hosting: Vercel
- Storage/CDN: Supabase Storage (Cloudflare R2 evaluated if limits exceeded)
