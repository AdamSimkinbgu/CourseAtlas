# Phase 3.6 – Security Review & Hardening

## Objective
Audit and harden the application before beta users arrive, focusing on rate limiting, input validation, and overall security posture.

## Tasks

1. **Threat modeling workshop**
   - Identify potential abuse cases (credential stuffing, malicious imports, XSS in notes).  
   - Document mitigation strategies.

2. **Rate limiting**
   - Implement per-IP and per-user rate limits on critical endpoints (login, graph mutations).  
   - Use FastAPI middleware or API gateway (e.g., `slowapi`).  
   - Configure WAF or hosting provider rate limiting if available.

3. **Input validation & sanitization**
   - Ensure Pydantic schemas enforce length/type constraints.  
   - Sanitize user-entered HTML/markdown in notes (use `bleach`).  
   - Validate import JSON schema strictly; reject unexpected fields.

4. **Authentication & session checks**
   - Verify token expiration logic.  
   - Ensure logout revokes refresh tokens if applicable.  
   - Confirm role/permission checks for template publishing.

5. **Dependency audit**
   - Run `pip audit` and `npm audit`, patch vulnerabilities.  
   - Document exceptions if upgrades not possible.

6. **Security headers**
   - Configure CORS, HSTS, Content Security Policy, Referrer Policy.  
   - Set secure cookies/ SameSite attributes.

7. **Logging & alerts**
   - Ensure sensitive data not logged.  
   - Add alerting for repeated failed logins or suspicious API usage.

8. **Penetration testing (lightweight)**
   - Use OWASP ZAP or similar to scan staging environment.  
   - Review findings and address critical issues.

9. **Documentation**
   - Record security posture in `docs/security/phase-3-review.md`.  
   - Update incident response plan and contacts.

## Deliverables
- Rate limiting and validation measures implemented.
- Security review document with findings and remediation status.
- Updated configuration ensuring secure headers and logging.
