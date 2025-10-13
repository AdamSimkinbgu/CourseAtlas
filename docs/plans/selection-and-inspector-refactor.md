# Selection & Inspector Refactor Plan

## Overview

The current `GraphEditorPage` interlaces React Flow selection events, inspector toggling, and optimistic data updates, which causes flicker and unpredictable behaviour (selection clears mid-click, details open on mouse-up, etc.). We will replace the ad-hoc state with a dedicated selection store, simplify the event wiring, and rework the inspector/info bubble to support multi-select and predictable toggling.

## Goals

- Single click selects and keeps the info bubble populated; a second click toggles the detail bubble/drawer.
- Multi-select displays aggregate counts (e.g., `2 containers – 10 nodes`) and shows a tree view of selected items in the detail panel.
- Clicking empty canvas clears selection and closes the detail bubble automatically.
- Floating detail bubble behaviour is preserved on large viewports; drawer remains for small viewports.
- Undo/redo history tracks graph structure changes only, not selection state.

## Work Breakdown

### 1. Document Interaction Rules
- ❗️ TODO: Add a short spec summarising click, double-click (second click), keyboard interactions, and selection clearing.
- This doc will provide acceptance criteria for ongoing test work.

### 2. Implement Selection Store (`useGraphSelection`) ✅
- `frontend/src/sections/graph-editor/useGraphSelection.ts` now exports the provider + hook with:
  - `selectedCourses`, `selectedContainers`, `selectedEdges`, derived totals, and detail toggles.
  - “Last clicked” tracking to drive second-click behaviour.
- Provider wraps `GraphEditorPage`; dedicated tests live in `frontend/src/sections/graph-editor/__tests__/useGraphSelection.test.tsx`.

### 3. Refactor `GraphEditorPage` ✅
- Replaced legacy selection state with the store; React Flow handlers now call `select`, `clear`, `toggleDetail`.
- Detail bubble/drawer toggling came out of the store (single vs. second click) and respects viewport breakpoints.
- History stack excludes selection; added `UndoRedoHistory.test.tsx` to guard that behaviour.

### 4. Optimistic Updates & Data Fetch ✅
- Extracted helpers into `frontend/src/sections/graph-editor/sampleGraphImport.ts` and `graphPersistence.ts`.
- Import/export flows and assignment persistence now share reusable utilities; GraphEditorPage consumes them.

### 5. UI Updates ✅
- **Info bubble:** single selection shows course/container metadata; multi-select shows aggregate counts.
- **Detail surface:** multi-select view renders a container → courses tree with counts, badges, and ungrouped section (`MultiSelectionInspector`).
- Desktop still uses the floating bubble; tablet/mobile rely on the drawer.

### 6. Tests ✅ (initial wave)
1. `useGraphSelection` hook reducer/unit tests (selection + detail toggles).
2. Multi-select inspector rendering test covering ordering, badges, and counts.
3. Undo/redo stack unit test ensuring selection isn’t persisted in history.
- Remaining interaction coverage (info bubble assertions, canvas clear) tracked for follow-up when UI automation is added.

### 7. Implementation Steps (status)
1. Scaffold `useGraphSelection` + tests. ✅
2. Wrap `GraphEditorPage` with provider; refactor state. ✅
3. Implement info/detail surfaces with multi-select tree. ✅
4. Extract helper modules (sample import + optimistic persistence). ✅
5. Update handlers for the new store. ✅
6. Adjust QA/regression tests (Vitest). ✅ initial unit coverage; integration tests pending.
7. Manual QA checklist to repeat before release: single/multi selection, detail toggle, clear on canvas, undo/redo, sample reset. 🚧 Ongoing.

## Risks & Mitigations
- **Regression in edge cases:** mitigate with new tests + manual QA on multi-select and sample import flows.
- **Large diff churn:** tackle in scoped commits (store introduction, UI update, optimistics extraction) to keep review manageable.
- **Performance:** ensure selection store updates are memoised and only re-render dependent components (use React context selector pattern if necessary).

## Deliverables
- `useGraphSelection` hook + provider.
- Updated `GraphEditorPage` with simplified selection logic.
- Refreshed info/detail bubbles supporting multi-select tree view.
- Robust interaction tests verifying the new behaviour.
