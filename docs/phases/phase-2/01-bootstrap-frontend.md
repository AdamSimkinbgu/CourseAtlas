# Phase 2.1 – Bootstrap React Frontend

## Objective
Initialize the React + TypeScript project, configure tooling, and confirm the app talks to the backend health endpoint.

## Step-by-Step

1. **Create Vite project (if not already).**
   - `npm create vite@latest frontend -- --template react-ts`
   - Move into `frontend/`, run `npm install`.

2. **Directory structure.**
   - Organize into:
     ```
     src/
       app/ (App shell, routing)
       components/ (reusable UI primitives)
       features/ (graph editor, templates, auth)
       lib/ (HTTP client, utils)
       pages/ (route-level components)
       types/
       styles/
     ```

3. **Install dependencies.**
   - React Query (`@tanstack/react-query`).  
   - React Router (`react-router-dom`).  
   - Axios or Fetch wrapper (`ky`/custom).  
   - Tailwind CSS (`npm install -D tailwindcss postcss autoprefixer`).  
   - `class-variance-authority` or similar for styling (optional).  
   - Testing: `vitest`, `@testing-library/react`.

4. **Configure Tailwind.**
   - `npx tailwindcss init -p`.  
   - Tailwind config: include `./index.html`, `./src/**/*.{ts,tsx}`.  
   - Define theme tokens (colors for light/dark).  
   - Add `@tailwind base; @tailwind components; @tailwind utilities;` to `src/styles/index.css`.

5. **Auth scaffolding.**
   - Install provider SDK (e.g., `@auth0/auth0-react` or Supabase client).  
   - Set up `AuthProvider` component using environment variables from `.env`.  
   - Provide hooks `useAuth`, `useAccessToken` for consistent access.

6. **API client.**
   - Create `src/lib/api.ts` wrapping fetch/axios with base URL from `VITE_API_URL`.  
   - Integrate React Query; set up QueryClient in App root.  
   - Add interceptor/middleware to attach auth header when token available.

7. **Routing.**
   - Use React Router v6: define routes for `/login`, `/graphs`, `/graphs/:id`, `/templates`.  
   - Implement protected route wrapper that redirects unauthenticated users.

8. **Health check integration.**
   - On startup, call backend `/healthz` and show error banner if unreachable.  
   - Useful for quick verification of env config.

9. **Environment variables.**
   - Create `frontend/.env.example` with `VITE_API_URL` and auth keys.  
   - Document setup in `docs/setup/frontend.md`.

10. **Initial commit.**
    - `git add frontend/`  
    - `git commit -m "feat(frontend): bootstrap React app"`

## Deliverables
- Functional React project with Tailwind, React Query, routing, and auth provider scaffolding.  
- `.env.example` and updated setup docs.  
- Health check call verifying backend connection.
