# Minimap & Grid Background Integration Plan

This document captures the work required to port the minimap and canvas background experience from the `Course mermaid sequence maker` repo into the current Course Atlas frontend.

---

## 1. Source Components & Styles

Reference implementation lives under:

- `Course mermaid sequence maker/apps/web/src/components/GraphCanvas.tsx`
- Related CSS variables defined in that project (e.g., background tokens).

✅ Review how MiniMap and `Background` components are configured (pannable, zoomable, styling) and note design tokens that aren’t yet in Course Atlas. ✅ Implemented in `GraphEditorPage.tsx`.

```tsx
// Course mermaid sequence maker/apps/web/src/components/GraphCanvas.tsx
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  MarkerType,
  ConnectionLineType,
} from "reactflow";

const rfProps = {
  nodeTypes,
  defaultEdgeOptions: {
    type: "smoothstep" as const,
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  },
  connectionLineType: ConnectionLineType.SmoothStep,
  snapToGrid: true,
  snapGrid: [20, 20] as [number, number],
};

<ReactFlow {...rfProps}>
  <Background
    variant={BackgroundVariant.Dots}
    color={"var(--bg-grid-dot)"}
    gap={20}
    size={1}
  />
  <MiniMap
    pannable
    zoomable
    style={{ background: "var(--bg-surface)", borderRadius: 6 }}
  />
  <Controls />
</ReactFlow>;
```


## 2. Bring Over Design Tokens / CSS Variables

- ✅ Identify CSS custom properties used for the minimap (`--bg-surface`, `--bg-grid-dot`, `--shadow-*`) and add equivalents to Course Atlas theme files (`frontend/src/styles/index.css`).
- ✅ Ensure dark/light variants line up with new palette; documented in `frontend/src/styles/tokens.ts`.

Example from the source project:

```css
:root {
  --bg-surface: #f8fafc;
  --bg-grid-dot: rgba(148, 163, 184, 0.35);
  --shadow-sm: 0 8px 20px -12px rgba(15, 23, 42, 0.25);
  --shadow-md: 0 18px 40px -24px rgba(15, 23, 42, 0.35);
}
[data-theme="dark"] {
  --bg-surface: rgba(15, 23, 42, 0.85);
  --bg-grid-dot: rgba(71, 85, 105, 0.45);
  --shadow-sm: 0 12px 35px -24px rgba(0, 0, 0, 0.7);
  --shadow-md: 0 32px 60px -32px rgba(0, 0, 0, 0.75);
}
```


## 3. React Flow Setup Adjustments

- ✅ Import `MiniMap`, `Background`, `BackgroundVariant`, and `Controls` in `GraphEditorPage.tsx`.
- ✅ Configure `Background` to use the dotted variant with grid spacing aligned to our 24px snap unit.
- ✅ Render `<MiniMap pannable zoomable />` with rounded background, matching theme colors.
- ✅ Optionally expose MiniMap visibility via a debug toggle (like the existing grid overlay) — added `showMiniMap` toggle in toolbar.

Course Atlas sketch (target):

```tsx
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from "reactflow";

const GRID_UNIT = 24;

<ReactFlow
  /* ...existing props... */
  snapToGrid
  snapGrid={[GRID_UNIT, GRID_UNIT]}
>
  <Background
    variant={BackgroundVariant.Dots}
    color={theme === "dark" ? "rgba(71,85,105,0.45)" : "rgba(148,163,184,0.35)"}
    gap={GRID_UNIT}
    size={1}
  />
  <MiniMap
    pannable
    zoomable
    nodeColor={(node) => (node.type === "container" ? "#6366f1" : "#0f172a")}
    nodeStrokeColor={(node) =>
      node.type === "container" ? "#312e81" : "#1e293b"
    }
    style={{
      background: "var(--bg-surface)",
      borderRadius: 8,
      boxShadow: "var(--shadow-sm)",
    }}
  />
  <Controls />
</ReactFlow>;
```


## 4. Minimap Node Styling

- ✅ Ensure course/container node shapes/colors render legibly in the minimap via `nodeColor`/`nodeStrokeColor` callbacks.
- ✅ Containers use translucent fills; courses use solid tokens; configuration lives in `GraphEditorCanvas`.


## 5. Layout & Controls Integration

- ✅ Reintroduce `Controls` for zoom/pan as needed, styled with new surface/shadow tokens.
- ✅ Positioned minimap bottom-left and controls bottom-right to avoid toolbar overlap.

```tsx
<div className="relative h-full w-full">
  <ReactFlow>…</ReactFlow>
  <div className="absolute bottom-6 right-6 z-10">
    <Controls
      showInteractive={false}
      position="bottom-right"
      style={{
        background: "var(--bg-surface)",
        borderRadius: 12,
        boxShadow: "var(--shadow-sm)",
      }}
    />
  </div>
  <div className="absolute bottom-6 left-6 z-10">
    <MiniMap … />
  </div>
</div>
```


## 6. QA & Responsiveness

- Verify minimap visibility on different breakpoints; hide or reposition on small screens if it clashes with the inspector.
- Confirm background grid and minimap remain in sync with snapping (move nodes around and watch both views).


## 7. Documentation

- 🔄 Update developer docs (this file) — in progress.
- ☐ Add a changelog entry summarizing the introduction of the minimap & grid background.


## Open Questions / Follow-ups

- Resolved: minimap renders both containers & courses, with optional user toggle.
- Follow-up: consider hiding minimap automatically on narrow viewports.
- Performance: monitor large graphs; consider feature flag if minimap becomes heavy.

---

Once the above steps are planned/approved, we can proceed with implementation in `GraphEditorPage.tsx` and supporting styles.
