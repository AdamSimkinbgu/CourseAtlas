# Phase 2.2 – Authentication UI & Session Management

## Objective
Implement login/logout flows in the frontend using the chosen provider, including loading states and error handling.

## Step-by-Step

1. **Auth provider configuration.**
   - Wrap `<App />` with provider component (`Auth0Provider`, `SupabaseProvider`).  
   - Configure redirect URI (`window.location.origin + '/auth/callback'`).

2. **Auth context hooks.**
   - Implement `useAuth()` returning `{ user, isAuthenticated, login, logout, isLoading }`.  
   - Fetch user profile fields from token or provider API.

3. **Protected routes.**
   - Create `RequireAuth` component that renders spinner while checking auth, redirects to `/login` if not authenticated.

4. **Login/Logout UI.**
   - `/login` page with provider button(s).  
   - Provide fallback for email/password if enabled.  
   - Display errors (network, provider issues).  
   - Implement `logout` button in app header.

5. **Token storage & refresh.**
   - For SPA: use provider SDK to manage tokens (Auth0 caches in memory).  
   - Ensure API client requests include `Authorization: Bearer <token>`.

6. **Session persistence.**
   - Handle return from provider (Auth0: `/auth/callback`).  
   - Save desired redirect (e.g., `appState.targetUrl`).  
   - Show skeleton UI while session initializes.

7. **User onboarding call.**
   - After login, call backend endpoint (`POST /users/me`) to ensure user record exists (service handles idempotency).

8. **Testing.**
   - Write Playwright or Cypress test covering login flow using test tenant.  
   - Unit test hooks with mocked provider context.

9. **UX enhancements.**
   - Provide persistent notification if backend unreachable.  
   - Add account dropdown showing user info, link to settings.

## Deliverables
- Functional login/logout flow integrated with provider.  
- Protected routes respecting authentication state.  
- Tests confirming auth flow works end-to-end.
