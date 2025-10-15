# Step 4 – Validation & QA

## Goal
Verify end-to-end that resets produce clean, collision-free graphs and stay in sync between client and server.

## Tasks
- Add Cypress/Playwright scenario: trigger each reset option, confirm containers wrap courses and edges render without overlaps.
- Ensure React Flow nodes remain inside container bounds (same assertions as Vitest but in-browser).
- Manual QA checklist: light/dark themes, zoom levels, undo/redo, reload after reset.
- Monitor API response times and log layout generation duration for diagnostics.

## Output
- Automated tests guarding regressions.
- QA checklist stored with screenshots demonstrating expected layout.
