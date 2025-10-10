# Phase 0.1 – Finalize Provider Choices

## Objective
Select the managed services and hosting providers that will power Course Atlas. The outcome is a written decision matrix and confirmed accounts for each provider.

## Why It Matters
Locking in infrastructure early prevents rework during implementation, keeps costs predictable, and ensures auth/database APIs are consistent throughout development.

## Step-by-Step

1. **Define evaluation criteria.**
   - uptime guarantees and SLA
   - pricing/free-tier limits
   - region availability (match your target users)
   - SDK/language support (Python + JavaScript)
   - ease of local development and staging environments
   - compliance/security posture (SOC2, GDPR readiness)

2. **Shortlist providers.**
   - Auth: Auth0 vs Supabase Auth vs Firebase Auth
   - Database: Supabase Postgres vs Neon Postgres vs Railway Postgres
   - Hosting: Render vs Fly.io vs Railway vs Vercel (frontend)
   - Storage/CDN for assets: Supabase Storage vs AWS S3 (via Cloudflare R2)

3. **Create comparison table (Google Sheet or markdown).**
   - Include columns for cost, auth feature depth, rate limits, CLI tooling, integration examples, and maintenance effort.

4. **Prototype sign-up.**
   - Create test tenants/accounts for top two candidates in each category.
   - Walk through quickstart guides (Auth0 FastAPI quickstart, Supabase auth docs, etc.).
   - Validate SDK usability in a scratch repo.

5. **Assess infrastructure integrations.**
   - Confirm CORS, JWT validation, and webhook support for auth providers.
   - Check managed Postgres backup/restore tooling and connection limits.
   - Ensure hosting platform supports persistent background tasks (for future AI/queues) or plan to offload to serverless workers.

6. **Decide and document.**
   - Capture the final decision in `docs/infrastructure/providers.md` (create if missing).
   - Note account URLs, billing settings, and contact emails for each service.
   - Record any constraints (e.g., Supabase free tier: 8GB storage, 500MB bandwidth) so future phases respect limits.

7. **Security setup.**
   - Enable MFA on all provider accounts.
   - Store API keys/secrets in a password manager (1Password, Bitwarden) and note that environment variables will be injected via CI secrets.

## Deliverables
- Decision matrix file (spreadsheet or markdown) committed under `docs`.
- `docs/infrastructure/providers.md` outlining chosen services and rationale.
- Active accounts with MFA enabled and billing alerts configured.

---

## Codex Recommendations

1. **Evaluation criteria priority.** Commit to these weights: cost/free-tier ceilings (30%), developer velocity via SDKs + tooling (25%), managed maintenance (15%), uptime/SLA history (10%), region fit (10%), roadmap alignment for webhooks/background jobs (5%), compliance posture (5%).
2. **Shortlists.** Final comparison set: Auth → Supabase Auth vs Auth0; Database → Supabase Postgres vs Neon Postgres; Backend hosting → Render vs Fly.io; Frontend hosting → Vercel vs Netlify; Storage/CDN → Supabase Storage vs Cloudflare R2 (AWS S3 only considered if R2 flags arise).
3. **Decision matrix format.** Mandate a Markdown table stored at `docs/infrastructure/provider-matrix.md` with columns exactly: `Provider | Category | Free Tier | Paid Pricing | SDK Quality | Managed Ops | Compliance | Lock-in Notes | Known Limits`.
4. **Prototype depth.** Require creation of sandbox projects, completion of each official quickstart (auth login, Postgres connection, FastAPI deploy, React deploy), and documentation of setup time plus any blockers. No deviation—every shortlisted provider must be smoke-tested.
5. **Integration checks.** Always validate Supabase JWT claims in FastAPI dependencies, measure connection pooling limits (Supabase default 10, Neon 20) against expected concurrency, confirm hosting support for WebSockets and background jobs, and document CORS/custom domain steps. Flag Supabase storage egress caps and Render cold start latency in the decision log.
6. **Decision documentation & security.** Insist on `docs/infrastructure/providers.md` capturing final choices, account URLs, billing alerts, MFA status, and environment variable names. All API keys must go into the shared password manager the same day accounts are created.

---

## Final Provider Choices

- **Authentication:** Supabase Auth for MVP implementation.
- **Database:** Supabase Postgres as primary transactional store.
- **Backend Hosting:** Render (autoscaling web services plus background worker support).
- **Frontend Hosting:** Vercel for React/Vite deployment and edge caching.
- **Storage/CDN:** Supabase Storage for exports and previews; evaluate Cloudflare R2 only if Supabase limits are exceeded.
