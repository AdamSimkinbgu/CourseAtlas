# Phase 1.5 – REST API Implementation

## Objective
Expose HTTP endpoints for core functionality (graphs, courses, templates) following RESTful conventions and proper error handling.

## Endpoints (MVP)

- `GET /api/v1/graphs` – list current user’s graphs.  
- `POST /api/v1/graphs` – create new graph.  
- `GET /api/v1/graphs/{graph_id}` – fetch graph detail with courses.  
- `PATCH /api/v1/graphs/{graph_id}` – update metadata (title, description, visibility).  
- `DELETE /api/v1/graphs/{graph_id}` – archive/delete graph.  
- `POST /api/v1/graphs/{graph_id}/duplicate` – clone graph.  
- `POST /api/v1/graphs/{graph_id}/courses` – add course.  
- `PATCH /api/v1/courses/{course_id}` – update course (grade, status, metadata).  
- `DELETE /api/v1/courses/{course_id}` – remove course.  
- `PUT /api/v1/courses/{course_id}/prerequisites` – update prerequisites list.  
- `GET /api/v1/templates` – list public templates.  
- `POST /api/v1/templates/{graph_id}/publish` – publish user graph as template.  
- `POST /api/v1/templates/{template_id}/clone` – clone template into user account.  
- `POST /api/v1/graphs/{graph_id}/export` – generate JSON export.  
- `POST /api/v1/graphs/{graph_id}/import` – import JSON payload (preview + commit).

## Implementation Steps

1. **Define Pydantic schemas (`schemas.py`).**
   - `GraphCreate`, `GraphRead`, `GraphUpdate`.  
   - `CourseCreate`, `CourseRead`, `CourseUpdate`, `PrerequisiteUpdate`.  
   - `TemplateRead`, `TemplatePublish`.  
   - Flatten nested structures to avoid circular references and ensure simple JSON.

2. **Router modules.**
   - Create routers under `app/api/v1/graphs.py`, `courses.py`, `templates.py`.  
   - Use APIRouter with prefixes (e.g., `/api/v1/graphs`).  
   - Inject services via FastAPI `Depends` (e.g., `graph_service: GraphService = Depends(get_graph_service)`).

3. **Response & error model.**
   - Standardize error response schema (`{"detail": "..."}`).  
   - Map custom service exceptions to HTTP status codes via exception handlers in `app/api/error_handlers.py`.

4. **Import/export.
   - Export: call service to fetch graph, convert to JSON via serializer (ensure templates omit grade/status fields).  
   - Import: validate payload against schema, support dry-run preview, then commit after user confirmation.

5. **Eligibility endpoint (optional MVP).**
   - `GET /api/v1/courses/{course_id}/eligibility` returns whether prerequisites are met based on stored grades/statuses.

6. **Pagination & sorting.**
   - Implement query params for list endpoints (`limit`, `offset`, optional `sort`).  
   - Services should accept pagination parameters to keep logic centralized.

7. **OpenAPI documentation.**
   - Ensure route docstrings and response models generate clear docs.  
   - Tag endpoints (`graphs`, `courses`, `templates`).  
   - Provide examples for import/export payloads.

8. **Tests.**
   - Write API tests using FastAPI TestClient.  
   - Mock auth dependency to simulate authenticated user.  
   - Cover success & failure scenarios (e.g., cross-user access blocked, invalid prerequisites rejected, template cloning resets grades).

## Deliverables
- API routers with all MVP endpoints.  
- Pydantic schemas with validation rules.  
- API tests with coverage for major routes.  
- Updated OpenAPI docs accessible at `/docs` and `/openapi.json`.
