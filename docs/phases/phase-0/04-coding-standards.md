# Phase 0.4 – Establish Coding Standards

## Objective
Define formatting, linting, and architectural conventions so that every future commit is consistent and easy to review.

## Backend (Python)

1. **Formatting:** Use `black` with default line length (88).  
   - Add `pyproject.toml` with:
     ```toml
     [tool.black]
     line-length = 88
     target-version = ['py312']
     ```

2. **Linting:** Use `ruff` for fast linting & import sorting.  
   - Extend `pyproject.toml`:
     ```toml
     [tool.ruff]
     line-length = 88
     select = ["E", "F", "I", "B"]
     ```

3. **Type Checking:** Adopt `mypy` gradually; start with `mypy --strict` on service layer once stubs exist.

4. **Testing:** Pytest with tests under `backend/tests`. Naming convention: `test_<module>.py`.

5. **Architecture Guidelines:**
   - Controllers (FastAPI routers) call service functions only.  
   - Service layer contains business logic.  
   - Repositories handle DB access and return domain objects.  
   - Domain models in `backend/app/domain`.  
   - Shared responses/DTOs under `backend/app/schemas`.

6. **Docstrings:** Google-style docstrings for service functions and complex domains.

## Frontend (TypeScript)

1. **Formatting:** Use Prettier with `.prettierrc` (2 spaces, single quotes false).  
2. **Linting:** ESLint with TypeScript plugin; extend config from `@typescript-eslint/recommended`.  
3. **Testing:** Vitest/RTL under `frontend/src/__tests__`.  
4. **Directory Structure: **
   - `components/` (dumb components)  
   - `features/` (slices containing hooks, services, components)  
   - `pages/` (route-level views)  
   - `lib/` (utilities, HTTP client)  
   - `types/` (shared TypeScript types).

5. **State Management:** Favor React Query for remote data; use hook-based local state. Avoid Redux unless future complexity demands it.

6. **Styling:** Tailwind CSS with design tokens defined in `tailwind.config.js`; use `@tailwindcss/forms` for inputs.

7. **Accessibility:** All interactive elements require `aria` labels, keyboard handling, and focus styles.

## Shared Practices

1. **Commit Messages:** Conventional Commits (e.g., `feat: add course GPA calculator`).  
2. **Branch Naming:** `feature/<short-description>` or `chore/<task>`.
3. **Code Reviews:** Even as a solo dev, create PRs and use GitHub’s “Require approval” via second account or self-review after cool-off period.
4. **Documentation:** For any architectural decision, add an ADR under `docs/adr`. Template should include context, decision, consequences.
5. **Secrets Management:** `.env.example` per project plus documentation on retrieving secrets from auth/storage providers.

## Deliverables
- `pyproject.toml`, `.prettierrc`, `.eslintrc.cjs`, `.editorconfig` in repo.  
- Documented folder conventions in `docs/conventions/coding-standards.md`.  
- ADR for chosen architecture pattern if deviations occur.
