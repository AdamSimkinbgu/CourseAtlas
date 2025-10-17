# Step 2 – Layout Engine Spec

## Goal
Define a configuration-driven layout recipe that can organize containers and courses for any grouping strategy (terms, tracks, thematic clusters) without hand-authored coordinates.

## Tasks
- Capture design-driven rules: container columns/rows, optional term/year ordering, alternative grouping strategies, prerequisites offsets, orphan handling.
- Encode these rules as a reusable builder configuration (`layoutConfig.ts`) consumed by both client and backend.
- Validate against the small/large sample fixtures so generated output matches the design reference.
- Document extension points for future layouts (e.g., majors, minors, templates).

## Output
- Shared layout config and builder logic (TypeScript/Type annotations) ready for both client and server.
- Snapshot tests confirming generated positions obey spacing and container padding rules regardless of naming scheme.
