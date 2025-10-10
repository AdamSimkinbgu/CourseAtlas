# Phase 4.5 – Maintenance Automation & Ops Scaling

## Objective
Reduce ongoing manual effort by automating repetitive maintenance tasks, ensuring the system remains stable with minimal hands-on time.

## Tasks

1. **Automated updates**
   - Configure Dependabot for npm/pip updates (already set; verify schedule).  
   - Add Renovate if more control needed (group updates, weekly).  
   - Set up GitHub Action to run tests on dependency PRs automatically.

2. **Automated backups and verification**
   - Expand backup checks from Phase 1: create script to restore backup weekly to temporary database and run smoke tests.  
   - Schedule via GitHub Actions or cron job on hosting provider.

3. **Log rotation & retention**
   - Ensure backend logs are rotated (hosting provider or Logtail).  
   - Define retention policy (30 days for staging, 90 for prod).  
   - Automate cleanup of old exports/x snapshots.

4. **Monitoring alerts**
   - Refine Sentry alerts to avoid noise (set thresholds).  
   - Create on-call rotation (even if solo: define notification escalation).  
   - Integrate uptime alerts with Slack/email.

5. **Infrastructure as Code (optional)**
   - Capture infrastructure configuration using Terraform/Pulumi for reproducibility.  
   - At minimum, script environment provisioning (supabase CLI, Render CLI).

6. **Operations documentation**
   - Update `docs/ops/runbook.md` with standard operating procedures (deploy, rollback, incident response).  
   - Include checklists for monthly maintenance (~1–2 hours).

7. **Cost monitoring**
   - Track monthly costs; set up billing alerts for Supabase, Render, Vercel.  
   - Document cost-saving strategies (scale down non-peak, use serverless for imports).

## Deliverables
- Automated dependency updates and backup verification scripts.  
- Operations runbook with maintenance checklist.  
- Cost monitoring and alerting configuration.
