# Environment Variables

Central reference for environment configuration across Course Atlas services. Use example files (`backend/.env.example`, `frontend/.env.example`) as templates.

| Variable | Scope | Description | Source |
|----------|-------|-------------|--------|
| `API_HOST` | Backend | Bind address for FastAPI dev server (default `127.0.0.1`). | Local config |
| `API_PORT` | Backend | Port for FastAPI dev server (default `8000`). | Local config |
| `DATABASE_URL` | Backend | SQLAlchemy connection string for Postgres (must be set; no SQLite fallback). | Supabase (preferred) or local Docker Postgres |
| `SUPABASE_PROJECT_URL` | Backend/Frontend | Base URL of Supabase project. | Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Secret service role key for privileged operations. Store only server-side. | Supabase dashboard |
| `SUPABASE_ANON_KEY` | Backend/Frontend | Public anon key for client auth. | Supabase dashboard |
| `VITE_API_BASE_URL` | Frontend | URL pointing to backend API (local or deployed). | Local config |
| `VITE_SUPABASE_PROJECT_URL` | Frontend | Same as `SUPABASE_PROJECT_URL`, for client SDK usage. | Supabase dashboard |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public anon key for client SDK. | Supabase dashboard |
| `AUTH_DOMAIN` | Backend | JWT issuer domain from Supabase/Auth0. | Auth provider |
| `AUTH_AUDIENCE` | Backend | Expected audience claim for access tokens. | Auth provider |
| `AUTH_JWKS_URL` | Backend | JWKS endpoint for validating tokens. | Auth provider |

Secrets are managed in the team password manager and mirrored into GitHub Actions as encrypted repository secrets. Never commit populated `.env` files.
