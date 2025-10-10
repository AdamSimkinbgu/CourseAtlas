# Phase 2.6 – Frontend Testing & QA

## Objective
Implement automated tests covering critical frontend components and flows, ensuring regressions are caught early.

## Testing Strategy

1. **Unit & Component Tests (Vitest + RTL)**  
   - Test form components, hooks, and utility functions.  
   - Mock API responses using MSW (Mock Service Worker).  
   - Example: test `useEligibility` hook with mocked course data.

2. **Integration / E2E Tests (Playwright or Cypress)**  
   - Scenarios: login, create graph, add course, add prerequisite, export, import, clone template.  
   - Use staging backend or mock server in CI.

3. **Visual Regression (optional)**  
   - Snapshot components with Storybook + Chromatic for critical UI (graph node card, template card).

4. **Accessibility Checks**  
   - Integrate Axe accessibility testing in E2E or component tests.  
   - Ensure modals, keyboard navigation, and color contrast pass.

## Implementation Steps

1. **Testing configuration.**
   - Set up `vitest.config.ts` with jsdom environment.  
   - Add MSW handlers for API routes (graphs, courses, templates).  
   - Include `setupTests.ts` to initialize MSW and custom matchers.

2. **Write baseline tests.**
   - Graph dashboard: renders list, filters, handles empty state.  
   - Graph editor: renders nodes/edges, responds to drag events (component-level test with React Flow).  
   - Import/export: parser handles valid/invalid JSON.

3. **E2E setup.**
   - Choose Playwright; add `playwright.config.ts`.  
   - Use environment variables for staging URLs.  
   - Seed test data before running tests (via API or fixtures).  
   - Record videos/screenshots for failures.

4. **CI integration.**
   - Update frontend CI workflow to run `npm run test` and `npm run lint`.  
   - Add separate job for Playwright (with `npx playwright install --with-deps`).

5. **Manual QA checklist.**
   - On each release, run manual smoke: login, create graph, add prerequisite, export/import.  
   - Document checklist in `docs/qa/manual-smoke-checklist.md`.

## Deliverables
- Vitest component tests with MSW mocks.  
- Playwright E2E tests for core flows.  
- Updated CI running tests and reporting results.  
- QA checklist document.
