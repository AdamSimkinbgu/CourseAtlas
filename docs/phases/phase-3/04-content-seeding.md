# Phase 3.4 – Template & Content Seeding

## Objective
Populate the platform with high-quality templates and sample data to help users get started quickly.

## Tasks

1. **Template design**
   - Identify 3–5 common degree plans (e.g., Computer Science, Business Administration, Engineering).  
   - Create graphs for each, capturing prerequisites, term grouping, and containers.  
   - Ensure no grades/status values (templates are structural only).

2. **Data entry**
   - Use admin tool or API to create templates in staging database.  
   - Attach metadata: description, tags (`cs`, `business`, `stem`), recommended audience.

3. **Preview assets**
   - Generate screenshot/thumbnail for each template (use Playwright screenshot or manual design).  
   - Upload to storage (Supabase Storage/S3) and store URL in template metadata.

4. **Template gallery curation**
   - Determine ordering (featured, newest).  
   - Highlight “Starter templates” on dashboard.  
   - Provide template detail view explaining plan rationale.

5. **Sample graph for onboarding**
   - Include a small demo graph auto-created for new users (optional).  
   - Allows immediate exploration without manual entry.

6. **Documentation**
   - Add template descriptions to docs (`docs/templates/index.md`).  
   - Record process for adding future templates (step-by-step).

7. **Review**
   - Share templates with subject matter experts (if available) for accuracy.  
   - Adjust based on feedback.

## Deliverables
- Seed templates stored in staging database with metadata and preview images.  
- Template gallery populated and documented.  
- Optional demo graph for new users.
