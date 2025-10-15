# Step 1 – Backend Reset API

## Goal
Provide a deterministic API that can wipe a graph and rebuild it using layout instructions, so the client is no longer responsible for deletion/creation sequencing or enforcing specific container semantics.

## Tasks
- Add an endpoint (e.g., `POST /graphs/{id}/reset`) accepting a payload: `{ template: 'small' | 'large', layout: LayoutInstruction[] }`.
- Expose commands to clear existing courses, containers, edges, and assignments in a single transaction.
- Persist new containers/courses using the coordinates provided by the layout builder.
- Return the regenerated `GraphWithCourses` response so the client can refresh immediately.
- Add integration tests verifying the reset produces consistent container/course counts and positions.

## Output
- Backend endpoint documented and covered by tests.
- Database state after reset matches the layout instructions.
