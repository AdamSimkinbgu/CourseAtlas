# Phase 1.4 – Authentication & Authorization Integration

## Objective
Integrate the chosen auth provider (Auth0 or Supabase Auth) with the backend, allowing secure login and per-user data access.

## Steps

1. **Provider setup.**
   - Create tenant/application in auth provider dashboard.  
   - Configure callback URLs for local dev (`http://localhost:5173/callback`) and staging.  
   - Retrieve domain, client ID, audience, and create a machine-to-machine client if required for token verification.

2. **Backend configuration.**
   - Update `Settings` in `core/config.py` with auth provider variables.  
   - Store secrets in `.env` and configure CI secrets for deployment.

3. **JWT validation dependency.**
   - Implement `backend/app/core/security.py`:
     ```python
     from fastapi import Depends, HTTPException, status
     from fastapi.security import HTTPBearer
     import jwt

     from app.core.config import settings
     from app.services.users import user_service
     from app.utils.auth_provider import get_public_key

     http_bearer = HTTPBearer()

     async def get_current_user(token: HTTPAuthorizationCredentials = Depends(http_bearer)):
         try:
             payload = jwt.decode(
                 token.credentials,
                 key=get_public_key(),
                 audience=settings.auth_audience,
                 algorithms=['RS256'],
             )
         except jwt.PyJWTError as exc:
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from exc

         user = user_service.ensure_user_exists(payload)
         return user
     ```
   - Fetch JWKS keys from provider (cache them). Auth0/Supabase supply endpoints.

4. **Route protection.**
   - Apply `Depends(get_current_user)` to authenticated routes.  
   - Example: Graph creation requires logged-in user.

5. **User creation logic.**
   - `UserService.ensure_user_exists` extracts email, name, avatar from token claims.  
   - If user exists, update display name/avatar; otherwise create new record.  
   - Maintain mapping between provider `sub` claim and user ID.

6. **Frontend integration (preview).**
   - Ensure backend exposes `/.well-known/openapi.json` for Swagger auth tests.  
   - Document auth flow for frontend team (e.g., using Auth0’s SPA SDK).  
   - Provide login redirect flow and token storage strategy (short-lived access token stored in memory/local storage with refresh strategy).

7. **Testing.**
   - Write integration tests using provider-issued test tokens (Auth0 provides test JWTs).  
   - Verify unauthorized requests return 401.  
   - Ensure new user creation occurs on first token seen.  
   - Use dependency overrides in FastAPI tests for deterministic tokens.

8. **Documentation.**
   - Update `docs/setup/backend.md` with auth configuration steps.  
   - Document roles/permissions if any (e.g., admin flag for future moderation).

## Deliverables
- Security module performing JWT validation.  
- User auto-provisioning tied to provider tokens.  
- Integration tests confirming auth enforcement.
