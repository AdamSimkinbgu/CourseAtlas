# Course Atlas

![Backend CI](https://github.com/AdamSimkinbgu/CourseAtlas/actions/workflows/ci-backend.yml/badge.svg)
![Frontend CI](https://github.com/AdamSimkinbgu/CourseAtlas/actions/workflows/ci-frontend.yml/badge.svg)

Course Atlas is a course planning platform that helps students visualise prerequisites and track progress. This repository contains the monorepo skeleton for backend and frontend services.

## Repository Layout

- `backend/` – FastAPI service (Supabase Postgres + Supabase Auth).
- `frontend/` – React + Vite client deployed on Vercel.
- `docs/` – Project documentation and planning artefacts.

## Getting Started

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

### Code Quality Tooling

- **Format (frontend):** `npm run format`
- **Lint (frontend):** `npm run lint`
- **Test (frontend):** `npm run test`
- **Type-check (frontend):** `npm run typecheck`
- **Format (backend):** `black backend`
- **Lint (backend):** `ruff check backend`
- **Tests (backend):** `pytest`

See `docs/conventions/coding-standards.md` for detailed standards and folder layout.

## Provider Choices

- Authentication & Database: Supabase Auth + Supabase Postgres
- Backend Hosting: Render
- Frontend Hosting: Vercel
- Storage/CDN: Supabase Storage (Cloudflare R2 evaluated if limits exceeded)
