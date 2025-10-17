# Visual Editor Refresh Plan

## Overview

This plan outlines the visual and UX enhancements required to bring the Course Atlas graph editor in line with the legacy prototype’s strengths, while respecting current product requirements. The work is grouped into themed workstreams with clear tasks, acceptance criteria, and dependencies.

## Objectives

- Modernise the graph editor’s look and feel with status-driven node styling and translucent containers.
- Improve usability through floating utilities, sample graph loaders, and responsive layout tweaks.
- Lay foundations for future auto-layout improvements and comprehensive theming.

## Success Criteria

1. Containers load with default “Group _n_” names, random palette colours, and move their child nodes when repositioned.
2. Nodes reflect course status (eligible, completed, failed, blocked) via colour, chips, and prerequisite-aware halo highlights.
3. Floating toolbar exposes add/import/export/auto-layout controls, and demo graph loaders populate the canvas.
4. Light/dark theme toggle applies across the entire application shell.
5. TypeScript tests and Vitest suites cover new UI behaviours.

---

## Workstreams & Tasks

### 1. Design Foundations

| Task | Details | Owner | Status |
|------|---------|-------|--------|
| 1.1 Define colour palette | Establish status colours for light/dark themes, container palette, halo styling; document in Figma + `docs/conventions` | Design | ✅ Complete (tokens captured in `frontend/src/styles/tokens.ts`) |
| 1.2 Layout references | Produce mockups for floating toolbar placement, container appearance, full-width canvas, collapsed sidebar state | Design | ✅ Done (documented in `docs/conventions/visual-editor-layout.md`) |
| 1.3 Developer hand-off | Export tokens (spacing, colours, typography) for implementation | Design → Frontend | ✅ Complete (colour tokens ingested into code) |

**Dependencies:** Must complete before frontend implementation begins.

### 2. Node Enhancements

| Task | Details | Acceptance Criteria | Status |
|------|---------|--------------------|--------|
| 2.1 Status model update | Remove “in_progress”; add `failed` state inferred from grade < 56 | Backend & Frontend aligned on enum | ✅ Done (enum migration + service logic + tests) |
| 2.2 Node component styling | Apply status background colours, badges, and typography updates | Visual parity with design reference | ✅ Done (status badges, theme tokens) |
| 2.3 Grade/status sync | Update side panel logic: entering grade ≥ 56 ⇒ completed (green), < 56 ⇒ failed (red) | Unit tests verifying transitions | ✅ Done (`CourseService` + tests) |
| 2.4 Prerequisite halo | Selected node receives dominant halo; prerequisites inherit status colour with weaker halo | Interaction test verifies highlighting | ✅ Done (halo shadows driven by tokens) |
| 2.5 Blocked nodes | Courses with unmet prerequisites render in faded palette and display a note in side panel | Note visible; editing still permitted | ✅ Done |

### 3. Container Experience

| Task | Details | Acceptance Criteria | Status |
|------|---------|--------------------|--------|
| 3.1 Default creation | Autoname containers “Group 1…n”; assign random palette colour | New containers show unique names & colours | ✅ Done |
| 3.2 Translucent backdrop | Render containers as semi-transparent panels behind nodes | Nodes remain draggable within container | ✅ Done |
| 3.3 Movement syncing | Moving container drags child nodes; persisted via backend API | Cypress/Vitest scenario passes | ✅ Done |
| 3.4 Inspector polish | Side panel includes colour swatches, member list, rename field | UX parity with spec | ✅ Done |

### 4. Canvas & Utilities

| Task | Details | Acceptance Criteria | Status |
|------|---------|--------------------|--------|
| 4.1 Layout adjustments | Expand canvas to full width, reduce gutters, collapse sidebar on smaller breakpoints | No horizontal scroll on standard laptop viewport | ✅ Done (canvas flex layout + responsive gutter tweaks) |
| 4.2 Floating toolbar | Add in-canvas toolbar with Add Course, Import JSON, Export JSON, Auto Layout, Theme toggle | Buttons accessible via keyboard | ✅ Done (floating toolbar wired to new handlers) |
| 4.3 Auto-layout integration | Implement stub that triggers existing layout algorithm; log TODO for smarter layout per selection | Button runs without errors | ✅ Stub in place (fitView + TODO logged) |
| 4.4 Theme toggle | Global light/dark toggle affecting entire UI; remember preference | Snapshot tests for both themes | ✅ Done (theme persisted in localStorage) |

### 5. Sample Graphs & Demo Data

| Task | Details | Acceptance Criteria | Status |
|------|---------|--------------------|--------|
| 5.1 Sample definitions | Craft “Small sample” and “Large sample” JSON datasets (courses + containers) | Stored under `frontend/src/fixtures` | ✅ Done |
| 5.2 Reset buttons | Wire “Reset Sample” / “Reset Big Sample” to populate current graph | Buttons visible in floating toolbar | ✅ Done |
| 5.3 Import/export parity | Ensure sample data leverages new schema (status, containers, assignments) | Exported graph round-trips correctly | ✅ Done (backend & tests updated) |

### 6. Responsive & Mobile Prep

| Task | Details | Acceptance Criteria | Status |
|------|---------|--------------------|--------|
| 6.1 Sidebar collapse | Auto-collapse inspector on narrow viewports; add toggle to reopen | Manual QA on tablet-size viewport | ✅ Done (mobile drawer with open/close affordances) |
| 6.2 Canvas scaling | Adjust minimum zoom & padding for smaller screens | No overlapping toolbar/canvas | ✅ Done (dynamic min zoom + fitView padding) |
| 6.3 Future mobile notes | Document considerations for dedicated mobile editor in `docs/plans/mobile-editor.md` | Document checked into repo | ⏳ Not started |

### 7. Quality Assurance

| Task | Details | Status |
|------|---------|--------|
| 7.1 Unit tests | Update Vitest suites for new hooks/components (AddCourseDialog, container persistence, status transitions) | ✅ Updated (AddCourseDialog + status logic) |
| 7.2 Integration tests | Add Cypress (or Playwright) flow: load sample, change node status, export/import | ⏳ Pending |
| 7.3 Accessibility audit | Run axe-core checks on light/dark themes; ensure colour contrast ≥ WCAG AA | ⏳ Pending |
| 7.4 Documentation | Update `docs/setup/frontend.md` with new commands, theme toggle instructions | ✅ Done (graph editor tips documented) |

---

## Timeline & Sequencing

1. **Sprint 1 (Done)** – Design tokens, status enum update, node styling groundwork, container defaults.
2. **Sprint 2 (Done)** – Node halos/blocking, container inspector polish, floating toolbar baseline, theme toggle.
3. **Sprint 3 (In progress)** – Responsive layout adjustments, sidebar collapse, sample loaders (layout + mobile drawer delivered; integration tests outstanding).
4. **Sprint 4 (Upcoming)** – Enhanced auto-layout, integration tests, accessibility audit, documentation refresh.

Timelines can compress/extend based on team capacity; dependencies outlined above should be respected to avoid rework.

---

## Risks & Mitigations

- **Design-implementation drift**: Mitigate with early design reviews and shared Figma tokens.
- **Auto-layout complexity**: Deliver minimal viable stub first; ticket follow-up for advanced layout algorithms.
- **Palette accessibility**: Validate colour choices with contrast tools; provide alternative text indicators.
- **Sample data drift**: Store fixtures centrally and reuse in tests to keep demos and QA aligned.

---

## Deliverables Recap

- Updated frontend components (nodes, containers, toolbar) and supporting hooks.
- Backing documentation in `docs/conventions` and this plan.
- Test coverage for new behaviours and sample datasets ready for production toggles.

Once the above tasks are complete, the graph editor should visually align with the desired direction, provide clearer status feedback, and set the stage for future auto-layout and mobile work.
