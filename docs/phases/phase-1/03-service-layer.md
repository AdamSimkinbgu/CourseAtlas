# Phase 1.3 – Implement Service Layer & Business Rules

## Objective
Build use-case functions that enforce business logic between API and database layers. This module becomes the core of backend behavior.

## Key Services

1. **UserService**
   - `ensure_user_exists(auth_payload)` – create user on first login.  
   - `get_user(user_id)` – fetch user profile.

2. **GraphService**
   - `create_graph(owner_id, title, description, template=False)`  
   - `list_graphs(owner_id)`  
   - `get_graph(graph_id)` (with permission checks)  
   - `update_graph(graph_id, data)`  
   - `duplicate_graph(graph_id, new_owner_id)` (copies courses & prerequisites)

3. **CourseService**
   - `add_course(graph_id, payload)`  
   - `update_course(course_id, payload)` (grades, status, metadata)  
   - `delete_course(course_id)`  
   - `set_prerequisites(course_id, prerequisites)` – ensures referenced courses exist within same graph and no cyclic dependency is introduced.  
   - `calculate_graph_gpa(graph_id)` – sums weighted grade points, handles pass/fail logic.

4. **TemplateService**
   - `list_public_templates()`  
   - `publish_template(graph_id, metadata)`  
   - `clone_template(template_graph_id, user_id)` – ensures grade/status fields are reset.

5. **EligibilityService (helper)**
   - `check_course_eligibility(course_id, user_progress)` – returns boolean & reason list based on prerequisites and grades. Useful for future UI hints.

## Implementation Steps

1. **Define service interfaces.**
   - Create `backend/app/services/__init__.py` and modules per service (`graphs.py`, `courses.py`).  
   - Services receive repositories via dependency injection (functions or classes).  
   - Example structure:
     ```python
     class GraphService:
         def __init__(self, graph_repo: GraphRepository, course_repo: CourseRepository):
             self.graph_repo = graph_repo
             self.course_repo = course_repo

         def create_graph(self, owner_id: UUID, data: GraphCreate) -> Graph:
             graph = Graph(...)
             return self.graph_repo.create(graph)
     ```

2. **Enforce invariants.**
   - When setting prerequisites:
     - verify all IDs belong to same graph.  
     - detect cycles using DFS or topological sort.  
     - store prerequisites as normalized list (`{'course_id': X, 'condition': 'grade>=C'}`).
   - GPA calculation: skip `is_pass_fail` courses from GPA but accumulate credits.

3. **Error handling.**
   - Create custom exceptions (`ValidationError`, `NotFoundError`, `PermissionError`).  
   - Services raise these; API layer maps them to HTTP responses.

4. **Repository updates.**
   - Implement `GraphRepository`, `CourseRepository`, etc., under `backend/app/repositories/`.  
   - Methods include `create`, `update`, `delete`, `list_by_owner`.  
   - Use SQLModel sessions injected via FastAPI dependency.

5. **Unit tests.**
   - For each service, write tests covering happy path and error scenarios.  
   - Use in-memory SQLite or fixture copying Postgres schema for deterministic tests.  
   - Test `set_prerequisites` for cycle detection and cross-graph errors.  
   - Test `calculate_graph_gpa` with combinations of graded + pass/fail courses.

## Deliverables
- Service modules with complete business logic.  
- Repository classes to support services.  
- Unit tests for each service function (run via pytest).
