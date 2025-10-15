# Step 3 – Client Integration

## Goal
Switch the frontend reset flow to call the new backend reset API and hydrate the returned graph without manual post-processing.

## Tasks
- Replace `prepareSampleGraphImport` usage in `applySampleGraph` with a `POST /graphs/{id}/reset` call.
- Show loading and error states while the backend rebuilds the graph; clear undo history appropriately.
- Hydrate the returned graph via existing hooks; ensure collision state and history remain consistent.
- Provide local fallback for dev mode (if backend endpoint absent) using the shared layout builder.

## Output
- Frontend reset button triggers backend reset and renders refreshed layout instantly.
- Undo stack contains a single “Reset sample” snapshot.
