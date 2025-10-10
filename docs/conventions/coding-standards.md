# Coding Standards

> Phase 0.4 deliverable outlining formatting, linting, testing, and structural conventions across the Course Atlas codebase.

## Backend (Python)

- **Formatter:** Black with 88-character lines and Python 3.12 target (configured in `backend/pyproject.toml`).
- **Linter:** Ruff enforcing error (`E`), formatting (`F`), import (`I`), and bugbear (`B`) rules.
- **Type Checking:** Mypy adoption planned post-service layer scaffolding; run with `mypy --strict` over targeted modules as they appear.
- **Tests:** Pytest suites under `backend/tests/`, following `test_<module>.py` naming.
- **Architecture:** FastAPI routers → service layer → repository layer; domain models in `backend/app/domain`, schemas in `backend/app/schemas`.
- **Docstrings:** Google-style docstrings for services and complex domain logic.

## Frontend (TypeScript)

- **Formatter:** Prettier (two spaces, double quotes, trailing commas) via `.prettierrc`.
- **Linter:** ESLint with TypeScript plugin and `@typescript-eslint/recommended`.
- **Tests:** Vitest + React Testing Library located in `frontend/src/__tests__/`.
- **Directory Layout:** `components/`, `features/`, `pages/`, `lib/`, `types/`.
- **State Management:** React Query for remote data, React hooks for local state.
- **Styling:** Tailwind CSS with design tokens and `@tailwindcss/forms`.
- **Accessibility:** Enforce accessible roles, labels, and focus management on interactive elements.

## Shared Practices

- **Commit Messages:** Conventional Commits (`feat:`, `chore:`, etc.).
- **Branch Naming:** `feature/<summary>` or `chore/<summary>`.
- **Pull Requests:** Open PRs even for solo work; self-review after a cool-off period.
- **ADR Process:** Document notable architectural decisions under `docs/adr/`.
- **Secrets:** Maintain `.env.example` per project; real secrets managed via provider dashboards and CI secrets.
- **EditorConfig:** Use `.editorconfig` to apply whitespace and newline conventions across editors.
