# Sample Reset & Layout Rebuild Plan

## End Goal
A single reset flow that:
- Lets the graph owner pick a sample/template, previews it, and confirms a destructive reset.
- Clears the existing graph and rebuilds it server-side using deterministic layout instructions (supporting arbitrary container groupings, not just terms).
- Returns the new graph snapshot so the client can hydrate immediately, with undo history wiped.
- Validates templates/samples against collision + containment rules and reports issues.

Success is measured by:
- Backend reset endpoint delivering consistent layouts from fixtures.
- Frontend modal preview + reset interaction.
- Tests/QA proving no overlaps, containers wrap members, and templates validate/fallback correctly.

---

## 1. Backend Reset API
**Objective:** Implement `POST /graphs/{id}/reset` that wipes and rebuilds the graph in one transaction.

**Tasks**
- Store sample fixtures under `backend/app/data/samples/*.json` (each includes metadata + layoutConfig).
- Add `GET /graphs/samples` to list available samples (name, description, preview metadata, slug).
- Implement `POST /graphs/{id}/reset` that:
  - Checks ownership (templates read-only).
  - Loads the selected sample/template definition.
  - Deletes existing courses/containers/assignments/edges for the graph.
  - Generates container + course records from the fixture layoutConfig.
  - Validates final positions (collision rules) and logs/surfaces errors.
  - Falls back to sample reconstruction when a template fails validation.
  - Returns `GraphWithCourses` plus metadata (sample slug, validation warnings).
- Write service-layer tests covering successful resets, permission denial, validation fallback, and template pass/fail scenarios.

**Output**
- New API endpoints documented.
- Sample fixtures checked into repo.
- Passing backend tests confirming reset behavior.

---

## 2. Shared Layout Engine
**Objective:** Define a reusable recipe for placing containers/courses from fixtures.

**Tasks**
- Draft `layoutConfig` schema within each sample (e.g., sections, columns, spacing, ordering).
- Implement layout builder module (shared TypeScript + Python) that:
  - Computes container dimensions (padding, min sizes) based on group counts.
  - Places courses with consistent spacing (supporting non-term groupings).
  - Produces minimap preview data consumed by the client.
- Expose validation helpers measuring overlap, containment, spacing rules.
- Add unit tests comparing generated layout against fixture expectations (light/dark contexts are not layout dependent but spacing is).

**Output**
- Shared builder library used by backend reset endpoint and frontend preview.
- Tests guaranteeing layout consistency and container containment.

---

## 3. Frontend Integration & UI
**Objective:** Swap current “Reset sample” buttons for a single destructive reset flow backed by the new API.

**Tasks**
- Replace the existing reset buttons with one red “Reset graph” button.
- Build modal:
  - Fetch sample catalog (`GET /graphs/samples`).
  - Present sample list (name + description).
  - Render minimap preview using client layout builder.
  - Require confirmation before calling the reset API.
- Call `POST /graphs/{id}/reset` on confirmation.
- On success:
  - Replace local nodes/edges with returned data.
  - Clear undo/redo history arrays.
  - Display any validation warnings from backend.
- Update React Query caching to refetch graph if necessary.
- Provide dev fallback if reset endpoint is unavailable (use client builder + existing import, gated by feature flag).

**Output**
- New modal interaction with preview.
- Client code relying on reset API (with fallback).
- Smoke tests/assertions ensuring history arrays cleared and graph hydration succeeds.

---

## 4. Validation, QA & Monitoring
**Objective:** Guarantee the new flow stays collision-free and user-friendly.

**Tasks**
- Add Vitest unit covering `useGraphSelection` history wipe and layout builder.
- Add Playwright/Cypress scenarios:
  - Trigger reset for each sample, confirm containers wrap courses, no overlaps.
  - Check warning message on template fallback.
  - Verify undo/redo disabled until new edits.
- Update QA checklist (light/dark theme, zoom levels, reload after reset).
- Log backend validation failures with stack/context for observability.
- Add documentation to `docs/setup/frontend.md` describing the reset workflow and backend requirements.

**Output**
- Automated and manual verification artifacts.
- Updated documentation and screenshots for QA runbook.
- Monitoring hooks for backend validation.

