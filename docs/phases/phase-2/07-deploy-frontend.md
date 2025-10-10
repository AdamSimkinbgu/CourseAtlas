# Phase 2.7 – Deploy Frontend to Staging

## Objective
Deploy the React web app to a managed hosting provider (Vercel, Netlify, or similar) so it points to the staging backend.

## Step-by-Step (Vercel Example)

1. **Project setup.**
   - Install Vercel CLI (`npm install -g vercel`).  
   - Run `vercel login` and `vercel link` inside `frontend/` to connect to project.

2. **Build configuration.**
   - Ensure `package.json` has `build` script (`vite build`).  
   - Add `vercel.json` if needed to set output directory (`dist`) and rewrites (for SPA fallback).

3. **Environment variables.**
   - Set `VITE_API_URL` to backend staging URL.  
   - Add auth provider variables (client ID, domain).  
   - Configure on Vercel dashboard under Project → Settings → Environment Variables.

4. **Deploy.**
   - `npm run build` locally to ensure production build passes.  
   - `vercel --prod` (or rely on GitHub integration for automatic deploys).  
   - Confirm deployment URL (`https://course-atlas-staging.vercel.app`).

5. **CORS / callback URLs.**
   - Update backend CORS allowed origins to include Vercel domain.  
   - Update auth provider allowed callback/logout URLs to include Vercel domain.

6. **Testing.**
   - Open staging URL, perform login, create graph, ensure API calls succeed.  
   - Verify dark/light theme works.

7. **CI/CD integration.**
   - Connect GitHub repo to Vercel for auto-deploys on main branch.  
   - Configure preview deployments for PRs.

8. **Documentation.**
   - Record deployment instructions and URLs in `docs/infrastructure/environments.md`.  
   - Note environment variable names/values (without secrets).

## Alternate: Netlify
- `npm install -g netlify-cli`  
- `netlify init`  
- Configure build command `npm run build` and publish directory `dist`.  
- Setup env vars and form handling as needed.

## Deliverables
- Live staging frontend reaching staging backend.  
- Documented deployment process and env vars.  
- CI/CD pipeline for automatic redeployments.
