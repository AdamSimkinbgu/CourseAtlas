# Phase 3.2 – Analytics & Monitoring

## Objective
Implement analytics and error/uptime monitoring tools for both frontend and backend, ensuring visibility into user behavior and system health.

## Steps

1. **Select tools**
   - Analytics: PostHog (self-hosted option) or Plausible (privacy-friendly).  
   - Error monitoring: Sentry for backend + frontend.  
   - Uptime: Healthchecks.io or BetterStack.

2. **Frontend instrumentation**
   - Integrate analytics SDK in React (respecting consent).  
   - Track events: `graph_created`, `course_added`, `template_cloned`, `import_completed`.  
   - Capture user properties (anonymized) like total graphs, locale.  
   - Initialize Sentry SDK for catching JS errors; include release version.

3. **Backend instrumentation**
   - Add Sentry integration in FastAPI using middleware.  
   - Log structured events (JSON) for key actions.  
   - Configure logging levels and log rotation.

4. **Dashboards**
   - Set up analytics dashboards for daily active users, retention, feature usage.  
   - Create monitoring dashboards for request latency, error rates (Supabase metrics + Sentry charts).

5. **Uptime checks**
   - Configure Healthchecks.io to ping `/healthz` every minute; alert via email/slack on failure.  
   - Ensure background tasks (cron jobs, backup verification) also ping healthchecks.

6. **Privacy compliance**
   - Update privacy policy to mention analytics tools.  
   - Provide opt-out toggle in app settings.  
   - Ensure data anonymization (no PII in events).

7. **Testing & verification**
   - Trigger test events/errors to confirm analytics and Sentry capture them (use staging environment).  
   - Confirm alerts reach the designated channels (Slack/email).

8. **Documentation**
   - Document setup and maintenance in `docs/infrastructure/monitoring.md`.  
   - Include instructions for rotating API keys.

## Deliverables
- Analytics SDK integrated with key events.  
- Sentry capturing errors for frontend/backends.  
- Uptime checks configured with alerts.  
- Documentation for monitoring setup.
