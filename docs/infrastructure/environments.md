# Environments

Course Atlas currently targets two runtime environments managed via Render (backend) and Supabase (database/auth). This document captures the canonical configuration so deployments stay reproducible.

## Local Development
- **Backend URL:** `http://127.0.0.1:8000`
- **Frontend URL:** `http://localhost:5173`
- **Database:** Supabase development project (`DATABASE_URL` stored in `.env`) or local Postgres via `docker compose up db`.
- **Provisioning steps:**
  1. Configure `.env` from `.env.example` and set `DATABASE_URL`, `SUPABASE_PROJECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `AUTH_DOMAIN`, `AUTH_AUDIENCE`, `AUTH_JWKS_URL`.
  2. Run `alembic upgrade head` to apply migrations.
  3. Start the API with `uvicorn app.main:app --reload`.

## Staging (Render)
- **Service name:** `course-atlas-api-staging`
- **Hosting provider:** Render Web Service (Python 3.12 runtime).
- **Repository path:** `backend/` (monorepo root is linked to Render; build command should run from backend).
- **Build command:** `pip install -r backend/requirements.txt`
- **Start command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment variables (set in Render dashboard):**
  - `DATABASE_URL` – Supabase staging Postgres connection string (`postgresql+psycopg://...`)
  - `SUPABASE_PROJECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
  - `AUTH_DOMAIN`, `AUTH_AUDIENCE`, `AUTH_JWKS_URL`
  - `API_HOST=0.0.0.0`, `API_PORT=8000`
- **Deployment flow:**
  1. Configure GitHub secret `RENDER_BACKEND_STAGING_DEPLOY_HOOK` with the Render deploy hook URL.
  2. Push changes to `main` (or trigger the workflow manually) to run `.github/workflows/deploy-backend-staging.yml`. The workflow runs backend tests and POSTs to the deploy hook on success.
  3. After Render finishes the build, open a shell in the service and run `cd backend && alembic upgrade head` to apply migrations.
  4. Smoke-test `GET https://<service>.onrender.com/healthz` and `GET .../api/v1/graphs` (with auth).

## Database (Supabase)
- **Project:** `course-atlas-staging`
- **Connection pooling:** use the `DATABASE_URL` connection string with SSL required.
- **Auth:** Supabase Auth handles JWT issuance; ensure the staging frontend origin is allowed under Authentication → Settings.
- **Secrets storage:** All Supabase keys are stored in Render environment variables and GitHub Actions repository secrets.

## Staging Verification Checklist
After every deployment, walk through:
1. Render dashboard shows the latest deploy with status **Live**.
2. Run `alembic upgrade head` in the Render shell and confirm no pending migrations.
3. `curl https://<service>.onrender.com/healthz` returns `{"status":"ok"}`.
4. `curl https://<service>.onrender.com/api/v1/graphs` with a valid Supabase JWT returns data for the authenticated user.
5. Render logs are clean (no connection/auth errors) for the past 10 minutes.
6. Supabase dashboard shows recent connections from the Render service (Database → Activity).

## Future Production Notes
- Mirror staging configuration with production-specific Supabase/Render projects.
- Consider using Render deploy hooks for manual promotion and enabling autoscaling once load patterns justify it.
