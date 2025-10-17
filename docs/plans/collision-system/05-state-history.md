# Step 5 – State Persistence & History

## Objective
Ensure the new collision system integrates with caching, persistence, and undo/redo without regressing existing behaviours.

## Tasks
- **Undo stack alignment**
  - Wrap drag sequence with:
    - `pushHistorySnapshot()` when drag starts (reuse `historyRef` pattern).  
    - `replaceHistoryTop(finalState)` once resolution completes to keep a single entry.
  - Verify undo/redo shortcuts still work after auto-push actions.
- **Cache updates**
  - Update `updateGraphCache` mutations to accept container dimension patches and node position adjustments in bulk.
  - Guarantee the optimistic cache matches what `resolveCollisions` applied before network synchronization triggers (`enqueueGraphMutation`).
- **Persistence triggers**
  - Invoke `scheduleContainerPersistence()` only when container size changed, avoiding redundant API calls on mere position shifts.
  - Extend `persistAssignmentsSafe` usage if nodes switch parent containers due to collision resolution (edge case).
- **Autosave & toast behaviour**
  - Confirm autosave state and toast notifications are unaffected; collisions shouldn’t emit new toasts.

## Outputs
- Updated history management logic inside `GraphEditorPage.tsx`.
- Extended unit tests for history stack confirming one entry per drag regardless of collision complexity.
- QA checklist ensuring container persistence fires exactly once post-drag when dimensions change.

