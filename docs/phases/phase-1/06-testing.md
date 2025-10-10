# Phase 1.6 – Backend Testing Strategy

## Objective
Establish a reliable testing framework for the backend covering unit tests, integration tests, and smoke tests for critical endpoints.

## Test Levels

1. **Unit Tests**  
   - Target: service functions, utility methods (e.g., GPA calculation, prerequisite validation).  
   - Use in-memory SQLite DB or fixtures with SQLAlchemy `sessionmaker(bind=engine, expire_on_commit=False)`.

2. **Integration Tests**  
   - Target: API routes with real database interactions (using temporary Postgres schema or Dockerized DB).  
   - Use FastAPI TestClient + overrides for dependencies.  
   - Fixtures create test user/token via auth mock.

3. **Smoke Tests**  
   - Minimal tests hitting `/healthz`, `/api/v1/graphs` to ensure application starts.  
   - Used in CI to fail fast.

## Setup Steps

1. **Pytest config.**
   - Create `pytest.ini` with settings (`addopts = --strict-markers`).  
   - Ensure coverage plugin installed if desired (`pip install pytest-cov`).

2. **Test factories.**
   - Use FactoryBoy or simple helper functions to create sample data.  
   - Keep fixtures modular (e.g., `user_factory`, `graph_factory`).

3. **Database fixtures.**
   - For unit tests: fixture creating new SQLite DB per test (`sqlite:///:memory:`).  
   - For integration: use `TestingSessionLocal` pointing to `postgresql://user:pass@localhost:5433/testdb`.  
   - Run `alembic upgrade head` in setup to seed schema.

4. **Auth fixture.**
   - Provide `auth_headers` fixture returning Authorization header with test JWT or bypass dependency using `app.dependency_overrides[get_current_user]`.

5. **Continuous Integration.**
   - Update CI workflow to run `pytest --maxfail=1 --disable-warnings`.  
   - Optionally add coverage report (`--cov=app --cov-report=xml`).

6. **Test cases to include.**
   - Graph creation/listing respects ownership.  
   - Course creation rejects cross-graph prerequisites.  
   - GPA calculation yields expected values with pass/fail mix.  
   - Template cloning strips grade/status.  
   - Import endpoint fails gracefully on invalid schema.

## Deliverables
- `pytest.ini`, factories, and fixture modules in `backend/tests`.  
- Test suites covering services and API routes.  
- CI pipeline updated to execute tests and report status.
