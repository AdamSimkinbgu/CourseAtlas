# Theme & Styling Reference

This summary captures the theme system, node/container visuals, and supporting UI styling used by the Course Mermaid Sequence Maker editor.

---

## Theme System

### CSS Token Sets

The editor relies on CSS custom properties defined in `apps/web/src/styles/app.css`.

```css
:root {
  --bg-app: #11151c;
  --bg-surface: #1b2230;
  --bg-surface-alt: #232c3d;
  --bg-grid-dot: #2a3344;
  --fg-base: #e5ecf5;
  --fg-dim: #94a3b8;
  --accent: #3b82f6;
  --accent-muted: #1d4ed8;
  --danger: #dc2626;
  --warn: #f59e0b;
  --radius-sm: 4px;
  --radius-md: 8px;
  --node-bg: #1e293b;
  --node-border: #334155;
  --container-border: #3f4754;
  --container-bg: linear-gradient(180deg,#1d2633 0%,#1b2230 100%);
  --grid-size: 20px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.02) inset;
  --shadow-md: 0 4px 12px -2px rgba(0,0,0,.5);
}

[data-theme='light'] {
  --bg-app: #f5f7fa;
  --bg-surface: #ffffff;
  --bg-surface-alt: #f2f4f8;
  --fg-base: #1e293b;
  --fg-dim: #5c6777;
  --node-bg: #ffffff;
  --node-border: #d4d9e1;
  --container-border: #c5ccd5;
  --container-bg: linear-gradient(180deg,#f7f9fc 0%,#eef1f5 100%);
  --bg-grid-dot: #dce2ea;
  --accent: #2563eb;
  --accent-muted: #1d4ed8;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.08),0 0 0 1px rgba(0,0,0,.05) inset;
  --shadow-md: 0 4px 10px -2px rgba(0,0,0,.15);
}
```

Key takeaways:

- Dark mode is the default palette, anchored by slate/navy surfaces and ice-blue text.
- Light mode swaps neutrals for near-white surfaces and recalibrates accent/box-shadow strength.
- Shared elevations (`--shadow-sm`, `--shadow-md`) and radii drive consistent rounding (4px pills, 8px cards).

### Theme Control Hooks

- `apps/web/src/state/useThemePreference.ts` stores the current theme, honoring user preference or `prefers-color-scheme`.
- `apps/web/src/components/ThemeProvider.tsx` (and the exported `toggleTheme`) centralize applying `data-theme` attributes at the document root.

```ts
export function useThemePreference() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  return { theme, toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light') };
}
```

---

## Course Node Design

### Component Structure

`apps/web/src/components/nodes/CourseNode.tsx` renders course metadata and React Flow handles.

```tsx
export default function CourseNode({ id, data, selected }: NodeProps) {
  const { projection } = useGraph();
  const meta = useCourseMeta(projection.graphId).get(id) ?? {};
  const status = meta.status || data?.status || 'planned';
  return (
    <div className={`course-node ${selected ? ' is-selected' : ''} status-${status}`}>
      <Handle type="target" position={Position.Left} id="in" />
      <div className="course-node__header">
        <span className="course-node__codepill">{code}</span>
        <span className="course-node__dot" />
        <span className="course-node__title">{title}</span>
      </div>
      <div className="course-node__meta">
        {status && <span className={'status status--' + status}>{status}</span>}
        {/* credits, dept, level, term, subtext */}
      </div>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}
```

### Visual Tokens

From `app.css`:

- Base card: `background: var(--node-bg)`, `border: 1px solid var(--node-border)`, `border-radius: 8px`, `box-shadow: var(--shadow-sm)`, width 200–300px.
- Header: gradient top strip, 8px padding, 8px gap between code pill, halo dot, and title.
- Code pill: uppercase 10px text, semi-transparent background, 999px radius.
- Status chips and metadata pills reuse translucent fills and 1px borders.
- Handles inherit brand color (#3b82f6) and 2px white outline.

Status-specific styling:

```css
.course-node__meta .status--planned   { background: rgba(59,130,246,.18); border-color: rgba(59,130,246,.35); color: #cfe0ff; }
.course-node__meta .status--core      { background: rgba(34,197,94,.18);  border-color: rgba(34,197,94,.35);  color: #d7f9e3; }
.course-node__meta .status--elective  { background: rgba(245,158,11,.18); border-color: rgba(245,158,11,.35); color: #ffe7b8; }
.course-node.status-completed         { border-color: #35c46b; box-shadow: 0 0 0 2px rgba(53,196,107,.25); background: rgba(34,197,94,.15); }
.course-node.status-excluded          { border-color: #e2565a; box-shadow: 0 0 0 2px rgba(226,86,90,.25); background: rgba(239,68,68,.12); }
.course-node.status-planned           { border-color: #94a3b8; background: rgba(148,163,184,.12); }
.course-node.status-in-progress       { border-color: #60a5fa; background: rgba(96,165,250,.12); }
.react-flow__node-course.selected .course-node { outline: 2px solid var(--accent); outline-offset: 2px; }
```

---

## Container Node Design

### Component Structure

`apps/web/src/components/nodes/ContainerNode.tsx` wraps a minimal header around grouped courses.

```tsx
export default function ContainerNode({ data, selected }: Props) {
  const title = data?.label || 'Group';
  const count = data?.count ?? 0;
  const tone = data?.tone;
  return (
    <div className={`container-node${tone ? ` tone-${tone}` : ''}${selected ? ' is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} id="in" style={{ opacity: .6, top: 20 }} />
      <div className="container-node__header">
        <span className="container-node__title">{title}</span>
        <span className="container-node__count">{count}</span>
      </div>
      <Handle type="source" position={Position.Right} id="out" style={{ opacity: .6, top: 20 }} />
    </div>
  );
}
```

### Visual Tokens & Tone Palette

Container visuals are defined as overrides for group nodes:

```css
.react-flow__node-group .container-node {
  background: transparent;
  border-radius: var(--radius-md);
  min-width: 280px;
}
.container-node__header {
  display:flex; justify-content:space-between; gap:8px;
  padding:10px 12px;
  border:1px dashed var(--container-border);
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, rgba(255,255,255,.04), transparent);
}
.container-node__count {
  font-size: 11px;
  color: var(--fg-dim);
  background: rgba(59,130,246,.2);
  border: 1px solid rgba(59,130,246,.35);
  border-radius: 999px;
  padding: 2px 6px;
}
.react-flow__node-group.selected .container-node__header {
  outline: 2px solid var(--accent);
}
```

Tone variants inject themed gradients/borders:

```css
.container-node.tone-blue   { --container-border: rgba(59,130,246,.45); }
.container-node.tone-teal   { --container-border: rgba(20,184,166,.45); }
.container-node.tone-amber  { --container-border: rgba(245,158,11,.45); }
.container-node.tone-violet { --container-border: rgba(139,92,246,.45); }
.container-node.tone-rose   { --container-border: rgba(244,63,94,.45); }
.container-node.tone-slate  { --container-border: rgba(100,116,139,.45); }
/* Each tone also overrides header gradient */
.container-node.tone-blue .container-node__header {
  background: linear-gradient(180deg, rgba(59,130,246,.15), transparent);
}
```

The `NodeDetailsPanel` surface (`apps/web/src/components/NodeDetailsPanel.tsx`) exposes tone selection via a dropdown and reports the child count for the selected container.

---

## React Flow Styling & Canvas Behaviour

- `GraphCanvas.tsx` registers course and container node types, enforces `snapGrid: [20, 20]`, and uses smoothstep edges with arrowheads.
- The background uses dotted gradients bound to `--bg-grid-dot`, aligning with the CSS `--grid-size` token.

```tsx
const defaultEdgeOptions = { type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 } };
<Background variant={BackgroundVariant.Dots} color={'var(--bg-grid-dot)'} gap={20} size={1} />
```

CSS enhancements (from `app.css`):

```css
.react-flow__edge-path { stroke: #6b7280; stroke-width: 2; }
.react-flow__edge.selected .react-flow__edge-path { stroke: var(--accent); }
.react-flow__edge-smoothstep .react-flow__edge-path { stroke: #74809a; opacity: .95; }
.react-flow__edge:hover .react-flow__edge-path { filter: drop-shadow(0 0 4px rgba(59,130,246,.35)); }
.react-flow__handle { width: 8px; height: 8px; background: var(--accent); border: 2px solid #fff; }
```

The canvas also highlights search results by injecting an inline `outline` style; CSS coerces the outline color to `#f59e0b`.

---

## Toolbar & Ancillary Surfaces

The primary toolbar (`Toolbar.tsx` + `Toolbar.css`) inherits theme tokens:

- Buttons default to `var(--bg-surface-alt)` with 1px translucent borders, elevated on hover with `--accent`.
- Ghost buttons reuse the same base but without accent fill.
- Input/select controls share background/border tokens for consistency.

Toast portals and global scrollbars also respect theme variables, ensuring overlays and chrome remain legible in both modes.

---

## Implementation Pointers

- Theme-aware surfaces should consume the existing CSS custom properties instead of hard-coded colors.
- To add new course statuses or container tones, extend the existing `.status--*` and `.tone-*` classes in `app.css` and surface them through the node metadata (`CourseNode.tsx` / `NodeDetailsPanel.tsx`).
- The existing `useThemePreference` hook provides the source of truth for theme toggles and persistence.

This document should offer a quick reference for styling new features or aligning additional components with the established visual language in the Course Mermaid Sequence Maker.
