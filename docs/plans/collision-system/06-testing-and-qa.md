# Step 6 – Testing & QA

## Objective
Validate correctness, visual fidelity, and performance of the collision system before release.

## Tasks
- **Unit & integration tests**
  - Add Jest/Vitest suites for:
    - Collision math edge cases (diagonal overlaps, multiple contacts).
    - Container resize clamping when external limits reached.
    - Proximity band calculations for different viewport sizes.
  - Mock drag events to ensure visual state toggles (yellow → red → pulsing) at expected thresholds.
- **Playwright/Cypress scenarios**
  - Script drag sequences:
    - Node approaching container wall (observe warning + push).  
    - Two containers colliding and separating.  
    - Overlap held intentionally (validate pulsing hotspot).
  - Capture screenshots in light/dark themes for regression tracking.
- **Performance profiling**
  - Use React Profiler or Chrome Performance to confirm drag loop stays under 16 ms for typical graphs (<100 nodes).
  - If needed, adjust throttling or simplify hotspot rendering.
- **Manual QA checklist**
  - Undo/redo after collision.  
  - Container persistence updates server state correctly.  
  - No visual artifacts when toggling theme mid-drag.
- **Documentation updates**
  - Record new collision behaviours in `docs/conventions/visual-editor-layout.md` and team onboarding notes.

## Outputs
- Test suites passing in CI (`npm run test`, `npm run typecheck`).  
- Automated visual regression baselines.  
- Updated documentation and QA checklist stored alongside the plan.

