# Step 1 – Rehydrate Layout Utilities

## Objective
Re-establish a local layout toolkit that understands the current React Flow node shape so later collision passes can operate without reaching into the removed “Course Mermaid” codebase.

## Tasks
- **Audit existing helpers**  
  - Review `frontend/src/pages/GraphEditorPage.tsx` to confirm which node properties (width, height, parentNode, style) we can rely on during drag.  
  - Inspect `frontend/src/sections/graph-editor/sampleGraphImport.ts` and `useGraphDetailQuery.ts` for canonical container/node attributes (e.g., `kind`, `container.palette_id`, `courseAssignments`).
- **Port spacing utilities**  
  - Copy the essential logic from `Course mermaid sequence maker/packages/layout/src/legacyDagre.ts` (`cloneNodes`, `getNodeDims`, `SimpleSpacingEngine`).  
  - Convert to TypeScript modules under `frontend/src/sections/graph-editor/layout/` with proper typing against `Node<EditorNodeData>`.  
  - Replace magic numbers (220/120/48) with values derived from our design tokens (`DEFAULT_CARD_WIDTH`, etc.) living in `frontend/src/styles/tokens.ts`.
- **Port container reconciliation**  
  - Bring over `ContainerBoundsReconciler`, adapting it to new type names (`ContainerNodeData`, `CourseNodeData`).  
  - Ensure container min width/height defaults align with current UI breakpoints (check `GraphEditorPage.tsx` preview logic and Tailwind styles).
- **Add outward collision scaffolding**  
  - Define placeholder interfaces for “collision contact” events we will populate in later steps (e.g., `type CollisionContact = { targetId; overlapRect; severity; }`).  
  - Prepare extension points in spacing/reconciler functions to emit these contact records.

## Outputs
- New layout utilities under `frontend/src/sections/graph-editor/layout/` exporting:
  - `measureNodeDims(node): Dimensions`
  - `cloneEditorNodes(nodes): Node[]`
  - `SimpleSpacingEngine.apply(nodes, changedIds, config)`
  - `ContainerBoundsReconciler.reconcile(nodes)`
- Unit test file (`layout.test.ts`) verifying:
  - Measurements respect style overrides.  
  - Container bounds expand when children spread.  
  - Spacing engine leaves adequately separated nodes per design gap.

