# Frontend Setup

Instructions for running the Course Atlas React client locally.

## Prerequisites

- Node.js 20 (recommend installing via [nvm](https://github.com/nvm-sh/nvm))
- npm 10+ (bundled with Node 20)
- Backend API running locally or accessible via Supabase deployment

## 1. Clone and install

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
| `VITE_SUPABASE_ANON_KEY` | Public anon key for Supabase Auth (required once auth is wired). |
| `VITE_SUPABASE_PROJECT_URL` | Supabase project URL for client SDK. |

More variables will be added as features land (e.g., OAuth client IDs). Keep `.env.example` updated alongside new config.

## 3. Run the dev server

```bash
npm run dev
```

Open `http://localhost:5173`. You should see “Backend responded with: ok” when the backend is reachable.

## 4. Quality gates

```bash
npm run format   # Prettier check
npm run lint     # ESLint (strict, no warnings)
npm run typecheck
npm run test     # Vitest (jsdom environment)
```

CI runs the same commands on every push/PR.

## 5. Tailwind CSS (upcoming)

Tailwind will be configured during Phase 2; once available, install the VSCode Tailwind extension and run `npm run dev` to pick up class suggestions on the fly.

## 6. Troubleshooting

- **Failed to fetch API:** Ensure `VITE_API_BASE_URL` points to a running backend and that CORS allows `http://localhost:5173`.
- **Port already in use (5173):** Stop other Vite instances (`Ctrl+C`) or run `npm run dev -- --port 5174`.
- **SSL warnings:** When pointing to Supabase staging, ensure the URL is `https://` and accessible from your network.
