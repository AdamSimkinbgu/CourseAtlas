## Course Node Refresh

### What We Ported

- Re-created the legacy header layout (code pill, accent dot, two-line title) inside `frontend/src/pages/GraphEditorPage.tsx:212`.
- Adopted the scrapped build’s translucent metadata chips and status badge framing using dedicated CSS helpers in `frontend/src/styles/index.css:32`.
- Mapped CourseAtlas statuses to the legacy palette via `THEME_TOKENS` (`frontend/src/styles/tokens.ts:15`) so `planned`, `completed`, `failed`, and `blocked` inherit blue/green/red/slate treatments.

### Implementation Notes

- Handles now render as 8px accent circles with a 2px contrasting border (see `GraphEditorPage.tsx:245`).
- Box shadows and halos match the legacy spec by combining `THEME_TOKENS[theme].halo` values with a deeper base shadow (`GraphEditorPage.tsx:214`).
- Metadata chips derive from `course-node__pill` styling in `frontend/src/styles/index.css:96`, giving consistent translucency across both themes.

### Follow-ups

- Extend the new CSS utilities to any future quick actions/popovers rendered over courses.
- If we introduce additional statuses, wire them through `StatusKey` tokens before adding new CSS modifiers.
