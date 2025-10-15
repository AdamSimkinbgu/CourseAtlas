# Step 3 – Visual Feedback

## Objective
Render gradient “bumpers”, pulsing halos, and overlap hotspots using existing theme tokens to clearly communicate impending pushes or actual collisions.

## Tasks
- **Token mapping**
  - Use `THEME_TOKENS` to derive colors:
    - Yellow band: `status.planned` (light/dark variants).
    - Red band + halo: `status.failed`.
    - Outline neutrals: blend with `halo.active` for subtle halos.
- **Course/Container node updates**
  - Extend `CourseNode` and `ContainerNode` components to read collision metadata via props (`collisionState`).
  - Render layers:
    - **Yellow bumper**: absolutely positioned pseudo-element with radial gradient; opacity equals proximity strength.
    - **Red bumper**: same geometry, toggled when `willPush` flag set; add CSS animation `pulse-red` (1 s ease-in-out).
    - **Overlap hotspot**: compute polygon (simplify to axis-aligned rect for perf) and render `<div>` overlay with `mix-blend-mode: screen`, plus outer halo sized inversely with intersection area.
- **Global styles**
  - Define reusable animations in `frontend/src/styles/index.css`:
    - `@keyframes bumperPulse` for 1 s in/out.
    - Utility classes `.collision-bumper`, `.collision-hotspot`.
- **Performance safeguards**
  - Memoize computed styles (e.g., via `useMemo`) to avoid rerender storms.
  - Ensure visual layers are non-interactive (`pointer-events: none`).

## Outputs
- Updated node components with new props and styling.
- CSS additions covering bumper gradients and pulse animations.
- Storybook/Chromatic scenario (if available) or manual screenshot checklist verifying:
  - Yellow fades in smoothly as nodes approach.
  - Red pulse starts once pushing threshold crossed.
  - Overlap halo grows as overlapping area shrinks.

