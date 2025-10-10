# Phase 1.8 – Configure Scheduled Database Backups

## Objective
Ensure the managed Postgres database has automated backups and documented restore procedures to meet reliability goals.

## Options

- **Supabase:** Point-in-time recovery and daily backups included; configure retention in dashboard.  
- **Neon:** Continuous WAL-based backups; configure branching/snapshots.  
- **Render/Railway Postgres:** Snapshot scheduling via provider UI.

## Step-by-Step (Supabase Example)

1. **Access Supabase Project.**
   - Go to Supabase dashboard → Project → Settings → Backups.

2. **Configure retention.**
   - Choose backup retention period (e.g., 7 days for dev, 30 days for staging).  
   - Enable PITR (Point-in-Time Recovery) by ensuring WAL archiving is on.

3. **Schedule verification jobs.**
   - Set calendar reminder to test restore quarterly.  
   - Optionally automate verification via Supabase API + script (restore to temporary branch and run smoke query).

4. **Export backups (optional).**
   - If compliance requires off-platform storage, schedule a GitHub Action or cron job to run `pg_dump` and upload to S3 (encrypted).  
   - Sample GitHub Action step:
     ```yaml
     - name: Dump database
       run: |
         pg_dump $DATABASE_URL --format=custom --file=backup.dump
     - name: Upload to S3
       run: aws s3 cp backup.dump s3://course-atlas-backups/$(date +%F).dump
     ```

5. **Documentation.**
   - Record backup schedule and restore procedure in `docs/infrastructure/backups.md`.  
   - Include contact info for provider support and relevant SLAs.

6. **Monitoring.**
   - Enable notifications for failed backups (Supabase sends emails).  
   - Add Healthchecks.io ping that runs a lightweight backup verification script weekly.

7. **Restore drill (mandatory).**
   - Once backups configured, perform a trial restore:  
     - Create temporary database/branch.  
     - Restore latest backup.  
     - Run smoke tests to ensure data integrity.  
   - Document findings and adjustments.

## Deliverables
- Backups enabled with defined retention schedule.  
- `docs/infrastructure/backups.md` detailing process and restoration steps.  
- Optional automation (GitHub Action) for additional offsite backups.
