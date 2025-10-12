# Visual Editor Layout References

Design guardrails for positioning and responsive behaviour inside the Course Atlas graph editor.

## Breakpoints & Canvas Width

- **Desktop (≥1280px)**: Layout stretches to `max-w-7xl` with 24px page padding. Graph canvas and inspector sit in a 1fr / 320px split with a 24px gutter.
- **Laptop (1024–1279px)**: Canvas gets full available width with inspector fixed at 320px; min zoom 0.55 keeps all controls visible.
- **Tablet (768–1023px)**: Inspector collapses into a drawer; canvas gains a 16px padding bubble and auto-fit padding increases to 0.4 for breathing room.
- **Mobile (<768px)**: Same tablet behaviour with tighter 12px outer padding; toolbar remains floating and drawer consumes full width when opened.

## Floating Toolbar Placement

- Primary trigger is the `Graph actions` bubble anchored bottom-left; tapping it reveals a vertical stack of action bubbles (add node/container, import/export, resets, layout, fit view, undo/redo, toggle theme).
- Actions close the stack on selection to keep the workspace clear; busy items show their loading state (e.g., `Importing…`).
- Placement keeps controls close to the graph without occupying header space, matching the full-bleed canvas treatment.

## Selection & Inspector Overlays

- Top-left host two bubbles: the info bubble and the action bubble. The info bubble shows graph guidance by default and swaps to contextual details when a node/container is selected.
- The adjacent action bubble exposes quick actions (open details, delete, deselect). When nothing is selected, it remains disabled with a greyed arrow.
- On desktop an expandable inspector bubble lives at the right edge; it stays collapsed until expanded, then loads the full course/container form. Mobile devices use the existing bottom-sheet overlay instead.

## Container Appearance

- Containers render as rounded 16px panels with semi-transparent fills from `CONTAINER_PALETTE`. Light theme uses 18% opacity; dark theme uses 12%.
- Selected container ring uses theme halo token; NodeResizer handles styled with subtle outlines for better hit area.
- Container titles sit top-left with subtle typography and adapt to theme (`text-slate-800` / `text-slate-100`).

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
