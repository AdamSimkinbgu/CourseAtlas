# Phase 4.4 – Cross-Platform & Mobile Strategy

## Objective
Define how the service layer and frontend will evolve to support mobile clients (web responsive, React Native, or other technologies).

## Tasks

1. **Current responsive audit**
   - Evaluate existing web app usability on tablets and phones.  
   - Identify areas needing touch optimization (dragging nodes, side panel).  
   - Document limitations in `docs/mobile/responsive-audit.md`.

2. **API readiness**
   - Ensure REST endpoints are stateless and efficient for mobile usage.  
   - Plan versioning strategy to avoid breaking changes.  
   - Consider GraphQL layer for mobile if needed later.

3. **Mobile technology choice**
   - Evaluate React Native vs Flutter vs Kotlin Multiplatform.  
   - Given shared TypeScript models, React Native is a natural fit.  
   - Note pros/cons and decide on target for future MVP.

4. **Shared code strategy**
   - Abstract business logic into service hooks usable by both web and mobile.  
   - Reuse domain types (`types/`) across platforms via monorepo packages.  
   - Plan for design system with consistent components.

5. **Offline considerations**
   - Determine if mobile should support offline editing (requires local storage + sync).  
   - Outline sync conflict resolution approach for future.

6. **Roadmap**
   - Phase 1: Improve responsive web experience.  
   - Phase 2: Build React Native prototype (read-only).  
   - Phase 3: Full mobile editing with offline capabilities.  
   - Document timeline and dependencies.

7. **Documentation**
   - Record findings in `docs/mobile/strategy.md`.  
   - Include integration points (shared auth, API client).

## Deliverables
- Responsive audit report.  
- Mobile strategy document with technology decision and roadmap.  
- Identified technical tasks to prepare backend for mobile.
