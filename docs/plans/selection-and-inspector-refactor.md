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
- Add a short spec summarising click, double-click (second click), keyboard interactions, and selection clearing.
- Use this as acceptance criteria for new tests.

### 2. Implement Selection Store (`useGraphSelection`)
- Create a context/hook that exposes: (✅ initial version scaffolded in `frontend/src/sections/graph-editor/useGraphSelection.ts`)
  - `selectedCourses`, `selectedContainers`, `selectedEdges`.
  - Derived counts (`totalNodes`, `totalContainers`).
  - `isDetailOpen`, `toggleDetail(type, id)`, `openDetail(type, id)`, `closeDetail()`.
  - `select(nodes, edges)` to sync with React Flow events, and `clear()` for canvas deselect.
- Handle “last clicked” logic to detect second-click toggling.
- Provide a provider wrapper (`GraphSelectionProvider`) that wraps `GraphEditorPage`.

### 3. Refactor `GraphEditorPage`
- Remove local selection-related state (`selectedCourseId`, `selectedContainerId`, `isDetailBubbleOpen`, etc.) and replace with selection store.
- Update React Flow handlers:
  - `onSelectionChange` calls `selection.select(selectedNodes, selectedEdges)`.
  - `onNodeClick` calls `selection.toggleDetail(type, id)` (first click selects via `select`, second click toggles detail open).
  - `onPaneClick` (React Flow) triggers `selection.clear()`.
- Keep history/undo logic focused on structural mutations (moves, updates) without touching selection.

### 4. Optimistic Updates & Data Fetch
- Preserve existing optimistic container/course update queues, but move helper logic (sample import normalisers, queue utilities) into `frontend/src/sections/graph-editor/` for readability.
- Ensure cache updates (React Query) are selection-agnostic.

### 5. UI Updates
- **Info bubble:**
  - Show node details for single selection.
  - For multi-select show counts (`${containerCount} containers – ${nodeCount} nodes`).
- **Detail bubble/drawer:**
  - Single selection shows existing inspector.
  - Multi-select shows a tree (containers as folders; nodes as files). Outline:
    ```
    Container A
      • Course 101
      • Course 102
    Container B
      • Course 201
      • Course 202
    Ungrouped Courses
      • Course 301
    ```
- Preserve floating bubble on desktop; keep drawer for narrow viewports.

### 6. Tests
- Add Vitest + React Testing Library tests covering:
  1. Single click selects and updates info bubble.
  2. Second click on same node opens detail bubble.
  3. Multi-select updates counts and renders tree.
  4. Clicking empty canvas clears selection and closes detail bubble.
  5. Undo/redo does not affect selection state.
- Update existing unit tests to use selection store where necessary.

### 7. Implementation Steps
1. Scaffold `useGraphSelection` (context, provider, hook) + tests. ✅ Hook scaffolded; tests pending.
2. Wrap `GraphEditorPage` with provider; refactor selection/inspector state.
3. Implement new info bubble/detail rendering.
4. Extract helper modules (sample import, queued mutation utilities).
5. Update handlers (`onSelectionChange`, `onNodeClick`, `onPaneClick`) to use the store.
6. Adjust QA/regression tests (Vitest).
7. Manual QA: single/multi selection, detail toggling, empty canvas, undo/redo, sample reset.

## Risks & Mitigations
- **Regression in edge cases:** mitigate with new tests + manual QA on multi-select and sample import flows.
- **Large diff churn:** tackle in scoped commits (store introduction, UI update, optimistics extraction) to keep review manageable.
- **Performance:** ensure selection store updates are memoised and only re-render dependent components (use React context selector pattern if necessary).

## Deliverables
- `useGraphSelection` hook + provider.
- Updated `GraphEditorPage` with simplified selection logic.
- Refreshed info/detail bubbles supporting multi-select tree view.
- Robust interaction tests verifying the new behaviour.
