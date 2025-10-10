# Phase 0.2 – Create Repositories

## Objective
Establish source control structure for the backend and frontend (or monorepo) with baseline configuration.

## Recommended Structure

```
CourseAtlas/
├── backend/
├── frontend/
└── docs/
```

A monorepo (e.g., with Turborepo or Nx) is acceptable if you prefer shared tooling; adjust steps accordingly.

## Step-by-Step

1. **Initialize main repository.**
   - `git init CourseAtlas && cd CourseAtlas`
   - Create remote on GitHub/GitLab with protected `main` branch and required PR reviews (even for solo dev; this enforces discipline).

2. **Set up backend directory.**
   - `mkdir backend && cd backend`
   - `python -m venv .venv && source .venv/bin/activate`
   - `pip install fastapi uvicorn sqlmodel psycopg[binary] pytest`
   - `pip freeze > requirements.txt`
   - `touch app/__init__.py app/main.py`
   - Add starter FastAPI app:
     ```python
     from fastapi import FastAPI

     app = FastAPI()

     @app.get('/healthz')
     def health_check():
         return {'status': 'ok'}
     ```
   - `deactivate`

3. **Set up frontend directory.**
   - `mkdir ../frontend && cd ../frontend`
   - `npm create vite@latest course-atlas-frontend -- --template react-ts`
   - Move generated contents up one level and delete the extra folder.
   - `npm install`
   - Add placeholder route for `/healthz` hitting backend once it exists.

4. **Shared documentation.**
   - `mkdir -p ../docs` (if not already) and include blueprint, architectural decisions (ADR directory).

5. **Add `.gitignore` files.**
   - Backend: ignore `.venv`, `__pycache__`, `.env`.
   - Frontend: ignore `node_modules`, `dist`, `.env.local`.
   - Root: ignore `.DS_Store`, `.idea`, etc.

6. **Commit initial skeleton.**
   - `git add .`
   - `git commit -m "chore: initialize repository skeleton"`
   - Push to remote.

7. **Repository housekeeping.**
   - Configure branch protection rules (require PR, status checks).  
   - Enable Dependabot for npm and pip updates (`.github/dependabot.yml`).  
   - Add repository description, README summary, links to docs.

## Deliverables
- Repository structure in source control.
- Working health-check endpoint for backend.
- Vite React starter for frontend.
- `.gitignore`, README, and docs folder committed.
