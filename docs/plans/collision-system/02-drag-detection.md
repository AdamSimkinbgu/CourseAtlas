# Step 2 – Drag-Time Detection Pipeline

## Objective
Detect proximity, collision, and overlap in real time while a node or container is being dragged, without mutating graph state.

## Tasks
- **Event wiring**
  - Extend `GraphEditorPage.tsx` to pipe `onNodeDrag` events (currently unused) into a new hook `useCollisionDetection`.
  - Ensure throttling (e.g., requestAnimationFrame or 16 ms debounce) so detection does not flood the main thread.
- **Collision query preparation**
  - From the rehydrated layout utilities, expose a pure function `evaluateCollisions(draggedNode, snapshotNodes)` returning:
    - `contacts: CollisionContact[]`
    - `proximityBands: ProximityBand[]` (yellow warning vs red pushing zone)
  - Maintain a read-only copy of all nodes positions (absolute world coordinates) for intersection math.
- **Proximity bands logic**
  - Define falloffs using design spacing:
    - Outer band: `spacing * 1.5` → yellow start opacity ~0.
    - Inner band: `spacing` → yellow 100%.
    - Pushing zone: < `spacing` → convert to red; once < `spacing * 0.6`, mark as “will push”.
  - Return gradient strength (0–1) so renderer can interpolate alpha.
- **State propagation**
  - Add collision context (likely extending `GraphSelectionProvider` state) storing:
    - `activeCollisionsById`
    - `proximityById`
    - `overlapHotspots` (for multi-node overlaps)
  - Reset the state when drag stops or selection changes.

## Outputs
- Hook `useCollisionDetection` with unit tests mocking node positions and verifying:
  - Yellow band triggers at configured distance.
  - Red pushing zone flagged when within threshold.
  - Multiple contacts emit aggregated overlaps.
- Updated selection context typing to include optional collision metadata.

