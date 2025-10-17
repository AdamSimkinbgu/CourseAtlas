# Step 4 – Push & Resize Resolution

## Objective
Apply deterministic pushes and container growth once a drag completes, ensuring spacing rules are satisfied without introducing oscillations.

## Tasks
- **Resolution scheduler**
  - On `onNodeDragStop`, invoke `resolveCollisions(draggedId, nodesSnapshot)`.
  - Batch all position/size updates into a single transaction; defer container persistence until the end.
- **Iterative push algorithm**
  - For each collision contact (sorted by severity):
    1. Compute minimal translation vector that restores target gap.
    2. If contact involves container vs external entity, split movement (e.g., 60/40) to avoid runaway container motion.
    3. When internal nodes push container walls, grow container until either:
       - New size clears internal node, or
       - Next external collision would occur; in that case, clamp and mark for external push.
  - Loop until no collisions remain or capped iterations (<=10) reached.
- **Sequential collision handling**
  - After each push, recompute collisions to capture ripple effects (requirement #5).  
  - Ensure algorithm handles multiple simultaneous overlaps gracefully (collective vector average).
- **History integration**
  - Capture pre-drag snapshot before drag begins (on `onNodeDragStart`).  
  - After resolution, push a single history entry (reuse existing `pushHistory()` infrastructure).
  - Persist container size changes via `scheduleContainerPersistence()` once final state is set.

## Outputs
- `resolveCollisions.ts` exporting the deterministic push algorithm with tests covering:
  - Node vs node push maintains target spacing.
  - Node inside container triggers growth until external obstruction.
  - Container vs container collisions resolve symmetrically.
- Updated drag handlers in `GraphEditorPage.tsx` that call the resolver and issue one history entry.

