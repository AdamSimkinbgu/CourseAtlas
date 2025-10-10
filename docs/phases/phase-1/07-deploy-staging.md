# Phase 1.7 – Deploy Backend to Staging

## Objective
Deploy the FastAPI backend to a managed hosting platform (Render or Fly.io) so the API is accessible to the frontend and testers.

## Step-by-Step (Render Example)

1. **Prepare application for deployment.**
   - Ensure `app/main.py` exposes `app` variable (already done).  
   - Add `requirements.txt` and, if necessary, `requirements.deploy.txt` with production dependencies.  
   - Create `Procfile` in backend:
     ```
     web: uvicorn app.main:app --host 0.0.0.0 --port 8000
     ```

2. **Create Render service.**
   - Log in to Render.com, click “New +” → “Web Service”.  
   - Connect to GitHub repository.  
   - Choose region closest to target users.  
   - Build command: `pip install -r backend/requirements.txt`.  
   - Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`.  
   - Set environment to Python 3.12.

3. **Environment variables.**
   - Add `DATABASE_URL`, `AUTH_DOMAIN`, `AUTH_AUDIENCE`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`.  
   - Add `ALLOWED_ORIGINS` for staging frontend.  
   - If using Supabase, include `SUPABASE_URL`, `SUPABASE_ANON_KEY` for storage if needed.

4. **Database connection.**
   - Ensure managed Postgres allows Render connections (Supabase: set allowed CIDR, Fly: use Wireguard).  
   - Run migrations after deployment: `render-cli` shell or GitHub Action running `alembic upgrade head`.

5. **HTTPS and domain.**
   - Render auto provisions `https://<service>.onrender.com`; configure custom domain later.  
   - Update CORS settings in app to allow staging domain.

6. **CI/CD automation.**
   - Enable auto deploy on “main” branch or set up GitHub Action to deploy on tag (Render has Deploy Hook).  
   - Save deploy hooks for future use.

7. **Verification checklist.**
   - Hit `/healthz` on staging URL.  
   - Test authenticated endpoint using staging client ID/secret.  
   - Check logs for connection errors.  
   - Confirm migrations ran successfully.

8. **Documentation.**
   - Record staging URL and deployment procedure in `docs/infrastructure/environments.md`.  
   - Note required secrets and their storage locations.

## Alternate: Fly.io
- `fly launch` from backend directory.  
- Configure `fly.toml` with build and env secrets.  
- Use Fly Postgres add-on or connect to Supabase.  
- Deploy with `fly deploy` and run `fly ssh console -C "alembic upgrade head"`.

## Deliverables
- Running staging backend accessible via HTTPS.  
- Deployment documented with credentials/URLs.  
- CI configured to trigger deployments when desired.
