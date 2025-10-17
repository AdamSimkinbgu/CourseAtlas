## Container Styling Refresh

### What We Ported

- Swapped the full-bleed panels for the legacy dashed header treatment with tone palettes in `frontend/src/pages/GraphEditorPage.tsx:330`.
- Introduced reusable CSS helpers (`container-node*` selectors) that mirror the slim header, tone gradient, and count pill from the Course Mermaid build (`frontend/src/styles/index.css:132`).
- Reused the palette from `CONTAINER_PALETTE` but tuned fill/border alpha values to match the scrapped gradients (`frontend/src/styles/tokens.ts:63`).

### Implementation Notes

- Container components now set CSS variables for header/outline colours so the dashed border, header gradient, and count badge stay in sync across light/dark themes.
- Resizer handles picked up the rectangular chrome from the legacy editor via `container-node__resizer-*` overrides.
- Node data still tracks width/height; we simply render an airy body area so courses float on the subtle backdrop rather than a solid panel.

### Follow-ups

- Revisit the inspector preview (`ContainerSidePanel`) to reuse the new header markup so designers see the exact treatment when editing.
- Consider exposing the tone palette in the API so backend fixtures can differentiate between blue/teal/amber/etc. combinations directly.
