# Provider Decisions

Course Atlas relies on managed services that minimise operational overhead while supporting the long-term roadmap. These selections are final for the MVP and will only be revisited if capacity or feature constraints surface.

## Authentication & Database

- **Provider:** Supabase (Auth + Postgres)
- **Rationale:** Shared tenant for auth and Postgres reduces integration work, offers generous free tier (500 MB database, 50k monthly active users), and provides first-class TypeScript/Python SDKs. Built-in Row Level Security and managed backups align with security and maintenance goals.
- **Account Notes:** Project: `course-atlas-prod` (Supabase). Enable MFA, configure email templates, and schedule weekly backup checks. Billing alerts at 70% of free-tier limits.

## Backend Hosting

- **Provider:** Render
- **Rationale:** Simplicity for deploying FastAPI services with zero-downtime deploys, background worker support, managed TLS, and predictable pricing. Native Postgres add-on not used because Supabase is the database authority.
- **Account Notes:** Service: `course-atlas-api`. Configure auto-deploy from `main`, set environment variables via Supabase secrets, and enable health check at `/healthz`.

## Frontend Hosting

- **Provider:** Vercel
- **Rationale:** First-class support for React/Vite, edge caching, preview deployments per branch, and environment variable management. Aligns with need for rapid iteration and future SSR options.
- **Account Notes:** Project: `course-atlas-web`. Connect to Github repo, protect `main`, and configure environment aliases (`production`, `preview`, `development`).

## Storage & CDN

- **Provider:** Supabase Storage
- **Rationale:** Co-located with Supabase Postgres reducing latency for exports/previews, public/private buckets, and simple ACLs. Satisfies MVP needs for JSON exports and template thumbnails.
- **Fallback:** Evaluate Cloudflare R2 only if storage egress or capacity limits exceed Supabase allowances.

## Security & Secret Management

- Enable MFA on Supabase, Render, and Vercel accounts immediately.
- Store API keys and service credentials in the team password manager.
- Mirror secrets into the CI/CD environment using GitHub Actions repository secrets.
- Document environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `RENDER_SERVICE_ID`, `VERCEL_PROJECT_ID`, `VITE_API_BASE_URL`) in `docs/infrastructure/env-variables.md` (to be created during environment setup).
