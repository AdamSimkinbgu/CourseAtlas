# Phase 2.4 – Graph Editor Core

## Objective
Build the foundational graph editor using React Flow (or equivalent) with support for node/edge display, basic editing, and layout persistence.

## Features

1. **Canvas setup**  
   - Render courses as nodes with status/grade badges.  
   - Render prerequisite arrows derived from course data.  
   - Pan, zoom, fit-to-view.

2. **Node interactions**  
   - Drag-and-drop repositioning; persist coordinates via API (`PATCH /courses`).  
   - Selection (single/multi) with keyboard shortcuts (Delete).  
   - Open side panel on node click.

3. **Edge interactions**  
   - Drag from node handle to another to add prerequisite (calls `PUT /courses/{id}/prerequisites`).  
   - Delete edge via context menu with confirmation.  
   - Highlight icons when eligibility unmet.

4. **Containers**  
   - Allow creation of visual groups (rectangles) to cluster courses.  
   - Store container metadata in graph (extend backend if needed).  
   - Drag containers to reposition nodes within them.

5. **Undo/redo**  
   - Maintain stack for add/delete/move operations (limit 20).  
   - Reset stack on reload.

6. **Theme support**  
   - Integrate dark/light theme tokens; allow toggle in toolbar.

## Implementation Steps

1. **Integrate React Flow.**
   - Install `reactflow`, import CSS.  
   - Map backend course data to nodes (id, data, position).  
   - Use `useReactFlow` hook for fitViewport.

2. **Side panel.**
   - Component showing course details (code, title, credits, grade).  
   - Editable fields trigger `PATCH` to backend.  
   - Display GPA summary, eligibility message.

3. **State synchronization.**
   - React Query fetches graph/courses; editor subscribes to data.  
   - Optimistic updates for node moves (update local state, send API call).  
   - Handle stale data by invalidating query on success.

4. **Containers implementation.**
   - Represent as special nodes (`type: 'container'`) using React Flow group nodes.  
   - Persist container size/position in backend (extend Graph model).  
   - Provide UI to create/rename/color containers.

5. **Keyboard shortcuts.**
   - Integrate `useHotkeys` (e.g., `react-hotkeys-hook`).  
   - `Ctrl+S` save, `Delete` remove course, `Ctrl+Z/Y` undo/redo.

6. **Testing.**
   - Component tests checking node/edge rendering.  
   - E2E test covering drag-to-create prerequisite and move node.  
   - Snapshot tests for theme variations.

## Deliverables
- Interactive graph editor page (`/graphs/:id`).  
- Side panel editing with API calls.  
- Containers, undo/redo, theme toggle functioning.
