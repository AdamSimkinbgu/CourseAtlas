# Phase 3.3 – UX Polish & Accessibility

## Objective
Refine the user experience to feel professional and accessible before inviting beta users.

## Tasks

1. **Onboarding experience**
   - Add welcome tour highlighting how to add courses, connect prerequisites, and use templates.  
   - Provide sample data insertion with “Start with demo graph”.

2. **Visual consistency**
   - Audit spacing, typography, color usage across pages.  
   - Ensure dark/light themes have consistent contrast (use Tailwind theme tokens).  
   - Implement design tokens (space, font sizes) in a centralized file.

3. **Accessibility**
   - Run axe-core audits; fix contrast and aria issues.  
   - Ensure keyboard navigation works for graph editor (e.g., tab focusing nodes, pressing Enter to open panel).  
   - Add skip-to-content link.

4. **Feedback and undo**
   - Implement non-blocking toasts for success/errors using a notification component.  
   - Provide “Undo” for destructive actions (course delete, prerequisite removal) with API support.

5. **Responsive design**
   - Validate layout on tablets and smaller laptops.  
   - Provide simplified view for mobile (read-only, basic interactions).  
   - Ensure modals adapt to small screens.

6. **Content**
   - Write friendly microcopy for empty states, error messages.  
   - Add inline help icon linking to docs/FAQ.

7. **Localization readiness**
   - Wrap static strings with i18n helper (future translation).  
   - Use simple translation JSON (English default).

8. **Testing**
   - Manual heuristic evaluation (Nielsen heuristics).  
   - Capture user feedback from initial testers; tweak UI accordingly.

## Deliverables
- Updated UI with consistent styling and onboarding.  
- Accessibility issues resolved to WCAG AA baseline.  
- Responsive behavior verified.
