# Visual Editor Layout References

Design guardrails for positioning and responsive behaviour inside the Course Atlas graph editor.

## Breakpoints & Canvas Width

- **Desktop (≥1280px)**: Layout stretches to `max-w-7xl` with 24px page padding. Graph canvas and inspector sit in a 1fr / 320px split with a 24px gutter.
- **Laptop (1024–1279px)**: Canvas gets full available width with inspector fixed at 320px; min zoom 0.55 keeps all controls visible.
- **Tablet (768–1023px)**: Inspector collapses into a drawer; canvas gains a 16px padding bubble and auto-fit padding increases to 0.4 for breathing room.
- **Mobile (<768px)**: Same tablet behaviour with tighter 12px outer padding; toolbar remains floating and drawer consumes full width when opened.

Canvas background uses a subtle vertical gradient (`from-slate-950 via-slate-900 to-slate-950`) overlaid with a neutral square grid so nodes always read against the page chrome.

## Floating Toolbar Placement

- Primary trigger is the `Graph actions` bubble anchored top-right of the canvas; activating it expands a vertical stack of action bubbles (add node/container, import/export, resets, layout, fit view, undo/redo, toggle theme).
- Actions close the stack on selection to keep the workspace clear; busy items show their loading state (e.g., `Importing…`).
- Placement keeps controls close to the graph without occupying header space, matching the full-bleed canvas treatment.

## Selection & Inspector Overlays

- Top-left hosts a stacked bubble cluster: the info bubble (graph guidance or contextual summary) and the action bubble (quick actions: open details, delete, deselect). When nothing is selected, the menu bubble remains disabled.
- Double-clicking a node/container opens its detail surface. On desktop the detail surface is a floating bubble on the right edge; on mobile the existing bottom-sheet inspector opens.
- Escape closes any open menus/bubbles; Delete removes selected items.

## Course Node Appearance

- Cards are rounded (24px radius) with a light gradient overlay and status-driven background tint from `THEME_TOKENS`.
- Header shows course code, optional grade badge, and a status pill. Selection adds a halo shadow; prerequisites highlight via secondary halos.
- Body lists meta chips (credits, term, grading mode, prerequisite count) in a two-column grid. Chips reuse the translucent `bg-white/60` + subtle border treatment for light/dark themes.
- Connection ports use React Flow handles positioned mid-left/right with filled circular markers.
- Base shadow: light theme `0 20px 45px -30px rgba(15,23,42,0.28)`; dark theme `0 24px 55px -32px rgba(2,6,23,0.85)` layered under the halo.

## Container Appearance

- Containers render as rounded 24px rectangles with dashed borders using palette colours; backgrounds remain translucent so child nodes stay legible.
- Header row includes the container title and a course-count badge, separated by a dashed border.
- Node resizer handles and dashed guides mirror the card styling (lighter greys in light theme, muted slates in dark).
- Additional inner padding (Node extent set to `"parent"`) creates a gutter so nodes never hug the container edge.

## Collapsed Sidebar & Drawer Behaviour

- On desktop/laptop the inspector remains persistently visible.
- Tablet/mobile viewports initialise with inspector closed; selecting a course/container reveals the “Open details” CTA in the canvas corner.
- Drawer slides in from the right covering up to 100% width on mobile and 400px max on tablets; overlay tap or close button dismisses it.
- Drawer header repeats section title and exposes a dedicated close control to meet accessibility expectations.

## React Flow Viewport Defaults

- Fit View padding adjusts based on breakpoint (`0.2` desktop, `0.4` tablet/mobile).
- Minimum zoom drops to `0.35` on small viewports to reduce horizontal scrolling.
- Controls, MiniMap, and Background remain enabled in all modes to preserve editing parity.

These references provide the artefact requested in Visual Editor Refresh task 1.2 (Layout references). Future visual updates should sync here for quick developer handoff.
