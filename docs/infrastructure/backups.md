# Database Backups

Supabase provides automated backups for both Postgres data and authentication metadata. This document records the configuration and verification process so Course Atlas can recover quickly from data loss incidents.

## Supabase Configuration
1. Navigate to **Supabase Dashboard → Project → Database → Backups**.
2. Enable **Point-in-Time Recovery (PITR)** and set retention:
   - Development/Staging: 7 days
   - Production (future): 30 days minimum
3. Configure **Automated Snapshots** (daily). Supabase retains 7 snapshots by default; adjust once data volume grows.
4. Ensure email alerts are enabled under **Settings → Billing & Usage → Notifications** at 70% of retention quota.

## Verification Procedure (Monthly)
1. Create a temporary branch database from the latest snapshot in Supabase.
2. Retrieve connection string from the temporary branch.
3. Run migrations `alembic upgrade head` (if needed) against the branch.
4. Execute smoke queries to validate critical tables, e.g.:
   ```bash
   psql "$TEMP_DATABASE_URL" -c "SELECT COUNT(*) FROM graphs;"
   ```
5. Document findings in the engineering log and delete the temporary branch.

## Optional Off-Site Backup
If compliance or additional redundancy is required, schedule a GitHub Action or cron job weekly:
```yaml
- name: Dump Supabase database
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL_READONLY }}
  run: |
    pg_dump "$DATABASE_URL" --format=custom --file=backup.dump
- name: Upload to S3
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  run: aws s3 cp backup.dump s3://course-atlas-backups/$(date +%F).dump
```
Ensure dumps are encrypted (server-side or client-side) before leaving the CI environment.

## Restore Playbook
1. Initiate PITR from Supabase for the affected project, selecting the desired timestamp.
2. Point Render’s `DATABASE_URL` to the restored instance or promote the recovered branch to primary.
3. Run `alembic upgrade head` in case migrations were mid-flight during failure.
4. Verify:
   - API health (`/healthz`)
   - Sample authenticated request (`/api/v1/graphs`)
5. Rotate any credentials exposed during the incident and update secrets stores.
