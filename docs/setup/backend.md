# Backend Setup

Step-by-step instructions for running the Course Atlas FastAPI service locally.

## Prerequisites

- Python 3.12 (install via [pyenv](https://github.com/pyenv/pyenv) or system package manager)
- Node.js 20+ (for running shared tooling like Ruff if needed by scripts)
- Docker Desktop (optional, for running the local Postgres service defined in `docker-compose.yml`)

## 1. Clone and bootstrap

```bash
git clone https://github.com/AdamSimkinbgu/CourseAtlas.git
cd CourseAtlas
```

## 2. Create virtual environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
```

> Windows PowerShell: `.\.venv\Scripts\Activate.ps1`

## 3. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## 4. Configure environment variables

Copy the example file and fill in values.

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `API_HOST` | Hostname for the FastAPI server (default `127.0.0.1`). |
| `API_PORT` | Port for local server (default `8000`). |
| `DATABASE_URL` | Postgres connection string (use local Docker Postgres or Supabase connection). |
| `SUPABASE_PROJECT_URL` | Base URL for Supabase project. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used for privileged backend calls. |
| `SUPABASE_ANON_KEY` | Public anon key for verifying JWTs if needed. |

Secrets live in 1Password/Bitwarden or the Supabase dashboard. Never commit populated `.env`.

## 5. Start local database (optional)

If you want a local database instead of the managed Supabase instance, run:

```bash
docker compose up db -d
```

This spins up Postgres 15 with credentials noted inside `docker-compose.yml`. Update `DATABASE_URL` accordingly (e.g., `postgresql+psycopg://postgres:postgres@localhost:5432/course_atlas`).

## 6. Run the API

```bash
uvicorn app.main:app --reload --host "${API_HOST:-127.0.0.1}" --port "${API_PORT:-8000}"
```

Visit `http://127.0.0.1:8000/healthz` to confirm the server responds with `{"status": "ok"}`.

## 7. Handy commands

```bash
# Run Ruff lint + Black format check
make lint-backend

# Run backend unit tests (once they exist)
make test-backend
```

## 8. Troubleshooting

- **Address already in use:** Ensure no other service is listening on port 8000 or change `API_PORT`.
- **Database connection refused:** Verify Docker container is running (`docker compose ps`) or that Supabase credentials are correct.
- **SSL certificate issues:** Supabase local dev requires TLS; use the `?sslmode=require` connection option.

Reach out via Supabase or FastAPI docs for deeper issues.
