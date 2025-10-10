# Phase 0.3 – Configure CI Skeleton

## Objective
Establish automated workflows that run linting and tests on every commit and pull request, ensuring quality from day zero.

## Tooling
- **GitHub Actions** as CI engine.
- Separate workflows for backend and frontend (or a combined matrix in monorepo).

## Step-by-Step

1. **Create workflow directory.**
   - `mkdir -p .github/workflows`

2. **Backend CI workflow (`ci-backend.yml`).**
   ```yaml
   name: Backend CI

   on:
     pull_request:
     push:
       branches: [main]

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-python@v4
           with:
             python-version: '3.12'
         - name: Install dependencies
           working-directory: backend
           run: |
             python -m pip install --upgrade pip
             pip install -r requirements.txt
         - name: Lint
           run: pip install black ruff && ruff check backend && black --check backend
         - name: Test
           working-directory: backend
           run: pytest
   ```

3. **Frontend CI workflow (`ci-frontend.yml`).**
   ```yaml
   name: Frontend CI

   on:
     pull_request:
     push:
       branches: [main]

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
         - name: Install dependencies
           working-directory: frontend
           run: npm install
         - name: Lint
           working-directory: frontend
           run: npm run lint --if-present
         - name: Test
           working-directory: frontend
           run: npm run test -- --watch=false --runInBand
   ```

4. **Add status badges to README.**
   - Example: `![Backend CI](https://github.com/<org>/CourseAtlas/actions/workflows/ci-backend.yml/badge.svg)`

5. **Configure required checks.**
   - In GitHub settings, require both workflows to pass before merging into `main`.

6. **Optional enhancements.**
   - Add caching (`actions/cache`) for pip/npm.  
   - Add CodeQL or Snyk scanning for security as project matures.  
   - Configure Slack/Email notifications for failed builds.

## Deliverables
- `.github/workflows/ci-backend.yml`
- `.github/workflows/ci-frontend.yml`
- README badges and branch protection rules enabling required checks.
