## Edge & Handle Polish

### What We Ported

- Defaulted to smoothstep edges with legacy colouring and thickness adjustments (`frontend/src/pages/GraphEditorPage.tsx:708`).
- Added hover glow and stroke transitions to match the Course Mermaid interaction polish via `frontend/src/styles/index.css:190`.
- Updated React Flow handles on course nodes to the 8px accent dots with white/ink borders (`GraphEditorPage.tsx:229`).

### Implementation Notes

- Normal prerequisites use the slate edge colour from the scrapped build, while unmet prerequisites retain the orange warning stroke.
- Animation still runs for satisfied prerequisites; the thicker orange stroke keeps blocked chains legible without the older pulse effect.
- Canvas dots stay aligned with the 20px grid (`GraphEditorPage.tsx:1855`) so the overall composition mirrors the legacy spacing.

### Follow-ups

- If we revisit container-to-container edges, reuse the same stroke styling to keep the graph cohesive.
- Evaluate whether hover glows should convey additional state (e.g. highlight prerequisites on hover) once the UX team defines the behaviour.
