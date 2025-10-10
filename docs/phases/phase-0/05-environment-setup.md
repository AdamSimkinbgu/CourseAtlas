# Phase 0.5 – Document Environment Setup

## Objective
Produce comprehensive setup instructions so any machine (including future CI runners) can recreate the development environment without guesswork.

## Tasks

1. **Create root `README.md` section “Getting Started”.**
   - Steps to clone repo, install prerequisites (Python 3.12, Node.js 20, npm, Docker if needed).
   - Outline environment variables required for backend/frontend.

2. **Backend environment docs (`docs/setup/backend.md`).**
   - Virtual env creation (`python -m venv .venv`).  
   - Installing dependencies (`pip install -r requirements.txt`).  
   - Running FastAPI locally (`uvicorn app.main:app --reload`).  
   - Setting up local Postgres (use `docker-compose` or Supabase local if desired).  
   - Environment variables (`DATABASE_URL`, `AUTH0_DOMAIN`, etc.) with descriptions.  
   - Instructions for seeding data (if seeds exist).

3. **Frontend environment docs (`docs/setup/frontend.md`).**
   - Install Node version manager (nvm) and Node.js 20.  
   - `npm install` and `npm run dev`.  
   - Environment variables (`VITE_API_URL`, `VITE_AUTH_CLIENT_ID`).  
   - Tailwind CLI instructions if custom builds required.

4. **Common scripts.**
   - Add root `Makefile` or `justfile` with commands: `make up`, `make backend`, `make frontend`, `make lint`, `make test`.  
   - Provide Windows-friendly alternatives (PowerShell scripts) if necessary.

5. **Docker (optional but recommended).**
   - Create `docker-compose.yml` with services for Postgres and (optional) local storage.  
   - Document usage: `docker compose up db`.  
   - Provide sample backup/restore commands.

6. **Environment example files.**
   - `backend/.env.example` and `frontend/.env.example` populated with placeholder keys.  
   - Instructions for copying to `.env` and acquiring secrets from provider dashboards.

7. **Troubleshooting section.**
   - Common issues (port conflicts, SSL problems with auth callback) and resolutions.  
   - Link to provider docs for deeper debugging.

8. **Verification checklist.**
   - Steps to confirm setup succeeded: run backend health check, open frontend, log in via dummy auth tenant, create a test graph.  
   - Encourage adding an automated smoke script.

## Deliverables
- Updated root README with setup quickstart.  
- `docs/setup/backend.md` and `docs/setup/frontend.md`.  
- `.env.example` files committed (without secrets).  
- Optional `Makefile`/`justfile` and `docker-compose.yml` committed.
