# Phase 2.8 – Polish & Beta Launch Prep

## Objective
Refine the frontend experience, add analytics/monitoring, and prepare for inviting early users to test the course planner.

## Tasks

1. **UI/UX Polish**
   - Add tooltips, onboarding modals, and empty-state illustrations.  
   - Ensure consistent spacing/typography across light/dark themes.  
   - Improve side panel ergonomics (tabs for metadata vs notes).  
   - Add “undo” toast with “restore” button for destructive actions.

2. **Performance optimization**
   - Profile React Flow rendering with large graphs (200+ nodes).  
   - Implement virtualization/lazy rendering if needed.  
   - Bundle analysis (Vite plugin) to identify heavy dependencies.  
   - Preload critical assets.

3. **Analytics**
   - Integrate privacy-friendly analytics (e.g., PostHog, Plausible).  
   - Track key events: graph created, course added, template cloned.  
   - Respect user privacy/configure cookies consent if required.

4. **Error monitoring**
   - Install Sentry SDK for frontend.  
   - Capture API errors and surface friendly messages.  
   - Correlate with backend Sentry via release tags.

5. **Content seeding**
   - Curate initial templates (e.g., CS major, Business major).  
   - Generate preview thumbnails (screenshots) and upload to storage.  
   - Verify template metadata includes tags/summary.

6. **Beta onboarding**
   - Create landing page (marketing) with beta sign-up.  
   - Invite initial testers (friends, advisors).  
   - Provide feedback form or in-app feedback widget.  
   - Document support contact (email or chat).

7. **Release checklist**
   - Ensure all tests pass.  
   - Run manual smoke tests (login, graph creation, prerequisites, export/import).  
   - Confirm backups and monitoring configured.  
   - Prepare release notes in `CHANGELOG.md`.

## Deliverables
- Polished UI with onboarding enhancements.  
- Analytics and error monitoring active in staging.  
- Seeded template gallery.  
- Beta launch plan and supporting documentation.
