# Phase 2.5 – Import & Export UI

## Objective
Enable users to export graphs as JSON and import existing plans via file upload.

## Features

1. **Export**
   - Button in editor toolbar or dashboard.  
   - Calls `POST /api/v1/graphs/{id}/export`.  
   - Downloads JSON file named `graph-<title>-<timestamp>.json`.  
   - Show toast on success/failure.

2. **Import**
   - Modal or dedicated page with file upload.  
   - Parse JSON client-side for basic validation before sending to backend.  
   - POST to `/api/v1/graphs/{id}/import` or create new graph depending on flow.  
   - Display preview of courses/prereqs; require confirmation to commit.

3. **Template cloning**
   - Reuse export/import pipeline (template is structural JSON).  
   - Ensure grades/status not included.

## Implementation Steps

1. **Design JSON schema**
   - Align with backend serializer fields.  
   - Document schema in `docs/api/graph-export-schema.json`.

2. **Export flow**
   - Use `fetch`/axios to request export endpoint.  
   - Convert response to Blob and trigger download.  
   - Handle errors (e.g., unauthorized, 404).

3. **Import flow**
   - Use file input + FileReader to parse JSON.  
   - Validate structure (courses array, prerequisites).  
   - Show diff/preview (list courses to be created).  
   - Submit to backend; if backend supports dry-run, display validation response.  
   - Provide success message and redirect to new graph.

4. **Template workflow**
   - On dashboard, “Use template” already hits clone endpoint.  
   - For user-provided imports, allow creating from scratch (`/import` page) or merging into existing graph.

5. **Testing**
   - Unit tests for JSON parsing utility.  
   - E2E test: export then re-import to ensure round-trip works.  
   - Check error handling for malformed file.

6. **Docs**
   - Update user guide with import/export instructions.  
   - Provide sample JSON in repository for testing.

## Deliverables
- Export button downloading JSON file.  
- Import modal/workflow with preview and validation.  
- Tests confirming round-trip functionality.
