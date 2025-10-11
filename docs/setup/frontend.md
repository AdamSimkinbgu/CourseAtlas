# Frontend Setup

Instructions for running the Course Atlas React client locally.

## Prerequisites

- Node.js 20 (recommend installing via [nvm](https://github.com/nvm-sh/nvm))
- npm 10+ (bundled with Node 20)
- Backend API running locally or accessible via Supabase deployment

## 1. Clone and install dependencies

```bash
git clone https://github.com/AdamSimkinbgu/CourseAtlas.git
cd CourseAtlas/frontend
npm install
```

## 2. Environment variables

```bash
cp .env.example .env
```

Populate the following values:

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL for the FastAPI backend (`http://127.0.0.1:8000` in local dev). |
| `VITE_SUPABASE_PROJECT_URL` | Supabase project URL copied from the Supabase dashboard (Project Settings → API). |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (same page as above). |

### Enable Google sign-in in Supabase

1. Open your project in the Supabase dashboard.
2. Go to **Authentication → Providers**.
3. Enable **Google** and provide the required OAuth credentials (Client ID/Secret). Supabase’s doc shows how to obtain them from Google Cloud.
4. Set the authorized redirect URI to `https://<your-project>.supabase.co/auth/v1/callback` (supplied by Supabase on that page).
5. Save changes.

Once enabled, the frontend’s “Continue with Google” button will redirect users to Google and back to your app.

> Tip: Grab the exact URLs/keys from Supabase to avoid copy mistakes (`https://<project>.supabase.co`).

## 3. Run the dev server

```bash
npm run dev
```

Open `http://localhost:5173`. The dashboard will ping the FastAPI `/healthz` endpoint and display the status card when it’s reachable.

## 4. Quality gates

```bash
npm run format   # Prettier check
npm run lint     # ESLint (strict, no warnings)
npm run typecheck
npm run test     # Vitest (jsdom environment)
```

CI runs the same commands on every push/PR.

## 5. Styling & architecture quick tour

- Tailwind is configured out of the box (`frontend/tailwind.config.js`, `src/styles/index.css`).
- App-level providers live under `src/app/` (Query Client, Supabase auth).
- HTTP helpers live in `src/lib/`, and feature slices live in `src/features/`.
- Route-level components are under `src/pages/`; shared UI is in `src/components/` and `src/sections/`.

## 6. Troubleshooting

- **Failed to fetch API:** Ensure `VITE_API_BASE_URL` points to a running backend and that CORS allows `http://localhost:5173`.
- **Port already in use (5173):** Stop other Vite instances (`Ctrl+C`) or run `npm run dev -- --port 5174`.
- **SSL warnings:** When pointing to Supabase staging, ensure the URL is `https://` and accessible from your network.
