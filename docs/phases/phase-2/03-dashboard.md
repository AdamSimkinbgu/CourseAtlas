# Phase 2.3 – Graph Dashboard & Templates List

## Objective
Create the main landing page for authenticated users showing their graphs, quick actions, and the template gallery.

## Features

1. **Graphs list**
   - Display user graphs with title, last updated, description.  
   - Provide actions: open, duplicate, delete/archive.  
   - Add “New graph” button (modal for title/description).

2. **Template gallery preview**
   - Show featured templates (cards) fetched from `/api/v1/templates`.  
   - Each card displays summary, tags, and “Preview/Use template” CTA.

3. **Search & filters**
   - Filter graphs by status (active, archived).  
   - Search by title.  
   - Optionally sort by updated date.

4. **Empty states**
   - Friendly message when user has no graphs.  
   - Highlight starting templates to encourage creation.

5. **Layout**
   - Use responsive grid/list, supporting desktop and mobile widths.  
   - Dark/light theme variants consistent with Tailwind tokens.

## Implementation Steps

1. **API integration**
   - Use React Query to fetch `/api/v1/graphs` and `/api/v1/templates`.  
   - Implement optimistic updates for duplicate/delete actions.

2. **Components**
   - `GraphCard`, `TemplateCard`, `NewGraphModal`.  
   - Reusable skeleton loaders for loading states.

3. **State management**
   - Keep filter/search state in URL query params for shareability.  
   - Use React Router `loader`/`useSearchParams` or React Query + local state.

4. **Modal flows**
   - Creation modal triggers `POST /api/v1/graphs`.  
   - Duplicate uses `POST /api/v1/graphs/{id}/duplicate`.  
   - Confirm delete with dialog invoking `DELETE` endpoint.

5. **Template duplication**
   - “Use template” triggers backend clone endpoint, then navigates to new graph.  
   - Provide toast notifications for success/failure.

6. **Testing**
   - Component tests (Vitest + RTL) verifying rendering, filtering.  
   - End-to-end test covering “create graph” and “use template” flows.

7. **Accessibility**
   - Ensure cards and buttons have focus states.  
   - Modal trap focus, provide ARIA labels.

## Deliverables
- Dashboard page at `/graphs`.  
- Template gallery section with duplication flow.  
- Tests verifying creation, duplication, deletion flows.
