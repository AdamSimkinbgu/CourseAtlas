# Phase 1.2 – Domain Modeling & Migrations

## Objective
Define the initial domain models (User, Graph, Course, Template) and generate the first database migration.

## Models to Implement

1. **User**
   - `id`: UUID primary key  
   - `email`: unique  
   - `display_name`  
   - `avatar_url` (nullable)  
   - `created_at`, `updated_at`

2. **Graph**
   - `id`: UUID  
   - `owner_id`: foreign key to `User`  
   - `title`, `description`  
   - `is_template`: bool  
   - `visibility`: enum (`private`, `public`)  
   - `created_at`, `updated_at`

3. **Course**
   - `id`: UUID  
   - `graph_id`: FK to `Graph`  
   - `code`, `title`  
   - `credits`: int  
   - `term`: string (free-form for now)  
   - `status`: enum (`planned`, `in_progress`, `completed`)  
   - `prerequisites`: JSON/ARRAY column storing course IDs with optional condition metadata  
   - `grade`: nullable decimal  
   - `is_pass_fail`: bool (default false)  
   - `position_x`, `position_y`: float  
   - `notes`: text  
   - `created_at`, `updated_at`

4. **TemplateMetadata** (optional separate table; otherwise use fields on Graph)
   - `id`: UUID  
   - `graph_id`  
   - `tags`: array  
   - `summary`: text  
   - `preview_image_url`: text  
   - `published_at`: datetime

## Implementation Steps

1. **Define SQLModel classes.**
   - Create `backend/app/domain/models.py` containing SQLModel models with `table=True`.  
   - Use `Field(default_factory=uuid4, primary_key=True)` for IDs.  
   - Example snippet:
     ```python
     class Course(SQLModel, table=True):
         __tablename__ = 'courses'
         id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
         graph_id: UUID = Field(foreign_key='graphs.id', nullable=False)
         code: str
         title: str
         credits: int
         term: str | None = None
         status: CourseStatus = Field(default=CourseStatus.PLANNED)
         prerequisites: list[PrerequisiteRequirement] = Field(sa_column=Column(JSON))
         grade: Decimal | None = None
         is_pass_fail: bool = False
         position_x: float = 0.0
         position_y: float = 0.0
         notes: str | None = None
         created_at: datetime = Field(default_factory=datetime.utcnow)
         updated_at: datetime = Field(default_factory=datetime.utcnow)
     ```
   - Define enums using `enum.Enum` for status/visibility.

2. **Shared base metadata.**
   - In `backend/app/db/base.py`, import all models so Alembic discovers metadata.
     ```python
     from sqlmodel import SQLModel
     from app.domain.models import User, Graph, Course, TemplateMetadata

     __all__ = ['User', 'Graph', 'Course', 'TemplateMetadata']
     ```

3. **Generate migration.**
   - `alembic revision --autogenerate -m "create core tables"`
   - Inspect the generated migration for accuracy (check column types, indexes).  
   - Run migration: `alembic upgrade head`.

4. **Seed script (optional).**
   - Create `backend/app/db/seed.py` to insert a demo user & graph for dev testing.

5. **Update tests.**
   - Add fixtures that create an in-memory SQLite or ephemeral Postgres database for unit tests.  
   - Write initial tests verifying model defaults (e.g., GPA calculation function once implemented).

6. **Document any assumptions.**
   - If prerequisites stored in JSON, document expected schema (e.g., `[{'course_id': uuid, 'condition': 'C_OR_BETTER'}]`).  
   - Add note in `docs/domain/prerequisites.md` for future contributors.

## Deliverables
- `models.py` with SQLModel classes.  
- Alembic migration committed.  
- Passing tests ensuring models instantiate and persist.
