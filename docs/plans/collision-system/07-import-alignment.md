# Step 7 – Import Alignment Fixes

## Objective
Ensure sample resets and graph imports render nodes inside their containers with correct sizing and spacing, eliminating initial overlaps.

## Tasks
- **Restore stored positions and dimensions**
  - When ingesting `graph.containers`, use persisted `width`, `height`, and `position` values without recomputing unless data is missing.
  - For each course, respect its saved `position_x`, `position_y`, and `parentNode` assignment so it spawns in the parent coordinate space.
- **Container sizing pass**
  - After loading nodes, run a single post-load `computeContainerBounds` to reconcile any legacy data lacking width/height.
  - Only expand containers that have `width/height` below minimums or when child positions exceed bounds.
- **Prevent stacking overlaps**
  - Detect when multiple courses share identical coordinates; apply a slight offset grid to spread them until the user runs auto-layout.
- **Regression tests**
  - Add fixtures-driven test asserting imported nodes remain within container bounds and do not overlap.
- Manual QA: run “Reset big sample” and confirm containers and children align in both light/dark themes. Validate both term-based and non-term container groupings.

## Outputs
- Updated projection hydration logic respecting persisted geometry.
- Spacing/offset helper invoked during imports to avoid stacked nodes.
- Tests and QA checklist entries covering sample resets for multiple container group strategies.
