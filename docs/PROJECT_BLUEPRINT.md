# Project Blueprint: Course Atlas

**Date:** 2025-10-10  
**Author:** Solo Developer Design  
**Revision:** 1.0 (greenfield proposal)

---

## 0. Purpose

This document defines a brand-new product initiative called **Course Atlas**. It is a comprehensive plan for building a course prerequisite planner from scratch. The goal is to provide enough clarity that a solo developer can execute confidently without referring to any prior experiments or codebases.

The system should align with these core values:

1. **Clarity** – Every decision in this plan is explained; questions should be answered by the document itself.  
2. **Scalability by Design** – Start lean, but architectural choices should enable future features (imports, social templates, mobile app) without rewrites.  
3. **Low Maintenance** – Prefer managed services and automation so ongoing upkeep is ~1–2 hours/month.  
4. **User Delight** – The end experience must be intuitive, responsive, and visually appealing.

---

## 1. Product Vision

> **Course Atlas** helps students (and planners) design and track their academic journey through intuitive course graphs. Users can lay out courses, define prerequisites, mark progress, and start from shared templates. Future iterations will enrich the experience with automated imports and a community layer.

### 1.1 Target Users

1. Undergraduate and graduate students planning course schedules.  
2. Academic advisors creating templates for majors/minors.  
3. Lifelong learners structuring self-paced curricula.

### 1.2 Value Proposition

- Visual clarity of prerequisites and term planning.  
- Progress tracking with statuses (planned, in progress, completed).  
- Reusable templates to accelerate planning.  
- Low-friction onboarding (Google login) with optional email/password.  
- Seamless evolution to mobile and community features.

### 1.3 Guiding Principles

- **Start with a rock-solid backend:** Domain modeling and data integrity come first.  
- **UI must feel effortless:** A non-technical user should understand the editor without instruction.  
- **Automate everything possible:** CI/CD, backups, dependency updates.  
- **Plan for integrations:** Generic import pipeline design baked in from day one.  
- **Privacy & compliance mindset:** Respect academic data; avoid unnecessary PII storage.

---

## 2. Functional Requirements (MVP)

### 2.1 Authentication & Accounts

1. Email/password registration and login (secure password hashing).  
2. Google OAuth sign-in.  
3. Basic profile management (display name, avatar placeholder).  
4. Password reset via email.  
5. Session management (JWT or provider-managed).

### 2.2 Course Graph Management

1. Create, rename, archive graphs.  
2. Each graph has a descriptive summary (e.g., “CS Major Plan”).  
3. Auto-save changes and manual “save now” action.  
4. Duplicate graph to begin a variant plan.

### 2.3 Course Nodes

1. Fields: code, title, credits, term/semester, status (planned/in progress/completed), optional notes.  
2. Each course stores its prerequisite requirements as a list of other course IDs (and optional conditions).  
3. Grade tracking: numeric grade (0–100 or GPA scale) and binary pass/fail toggle.  
4. Degree-wide GPA calculator that weights numeric grades by credits while counting pass/fail courses toward earned credits without affecting GPA.  
5. Color/status indicator on node (includes grade badge when available).  
6. Drag-and-drop repositioning with snapping grid.  
7. Inline editing (double-click node).  
8. Bulk selection (shift+drag) for repositioning.

### 2.4 Prerequisites (Edges)

1. Visual edges are generated from the prerequisites defined on each course; users edit prerequisites from the course panel, and the canvas updates automatically.  
2. Drag-and-drop shortcut: drag from a course handle and drop on the target to add that course to the source’s prerequisite list.  
3. Removal prompts a confirmation dialog before deleting the relationship from the course record.  
4. Optional arrow labels describing requirement nuances (e.g., “C or better”, “co-requisite allowed”).  
5. Eligibility check: highlight when a learner meets or violates labeled prerequisite conditions based on recorded grades/statuses.  
6. Highlight chains (e.g., all prerequisites of a selected node).  
7. Prevent cycles with clear error messaging.

### 2.5 Graph Editor Features

1. Pan/zoom controls.  
2. Undo/redo stack (last 20 actions).  
3. Term grouping (optional lanes for Fall/Spring).  
4. Fit-to-screen.  
5. Keyboard shortcuts (create node, connect, delete).  
6. Containers: user-defined visual groupings (with name/color) that can be collapsed/expanded and repositioned.  
7. Contextual side panel with course details, grade entry, and mass actions (e.g., mark multiple courses as completed).  
8. Theme toggle (light/dark) persisted per user.  
9. Read-only mode for templates.

### 2.6 Data Import/Export

1. JSON export of entire graph.  
2. JSON import (with validation and preview).  
3. Export should include metadata (created date, version).

### 2.7 Template Gallery

1. Curated templates available to all (no editing, but duplicable).  
2. Each template has a description, creator, tags, and preview image.  
3. Templates contain structure only (courses, prerequisites, layout, containers) and intentionally exclude grades or progress states.  
4. “Use this template” clones into user account.

---

## 3. Post-MVP Roadmap (Future Enhancements)

1. **Course Import Pipeline**  
   - JSON/CSV ingestion.  
   - Normalization layer to map external fields to internal schema.  
   - Manual mapping UI to confirm data.

2. **Social Features**  
   - Template publishing with ratings, comments.  
   - User profiles showcasing shared plans.  
   - Template version history and forking.

3. **Progress Analytics**  
   - Visualize completed credits per term.  
   - Identify bottleneck prerequisites.  
   - Degree completion tracking.

4. **Mobile Clients**  
   - Responsive web baseline.  
   - React Native app reusing TypeScript models and REST APIs.  

5. **Collaboration**  
   - Real-time editing with presence indicators.  
   - Comments per node.  
   - Advisor feedback workflows.

6. **AI Document Pipeline**  
   - Extract course/prerequisite data from PDFs or HTML catalogs using OCR/NLP.  
   - Map discovered entities into the normalization layer.  
   - Present suggested graphs for user review before import.

---

## 4. Non-Functional Requirements

1. **Performance:** Graphs up to 300 courses should remain responsive (<200ms interactions).  
2. **Security:** OAuth standards, salted hashed passwords, HTTPS everywhere.  
3. **Scalability:** Designed for thousands of users with managed infrastructure.  
4. **Maintainability:** Clean architecture, modular service layer, thorough tests.  
5. **Reliability:** Automated daily backups, error monitoring.  
6. **Accessibility:** WCAG AA compliance, keyboard navigation, screen-reader friendly.  
7. **Theming:** Consistent light/dark palettes with high-contrast variants.

---

## 5. System Architecture

### 5.1 High-Level Diagram

```
Frontend (React + TypeScript)
    ↓ REST API
Service Layer (FastAPI/Python)
    ↓ Repository Layer (SQLAlchemy/SQLModel)
Managed Postgres (Supabase/Neon)
    ↑
Auth Provider (Auth0 or Supabase Auth)
Storage (S3-compatible for exports/previews)
CI/CD (GitHub Actions) → Hosting (Render/Fly/Vercel)
Monitoring (Sentry/Healthchecks)
```

### 5.2 Backend Components

| Component | Responsibilities |
|-----------|------------------|
| **Domain Models** | Encapsulate business logic: `User`, `Graph`, `Course`, `Template`, plus embedded prerequisite requirements stored on courses. |
| **Service Layer** | Use cases: create graph, add course, enforce prerequisites, import/export. |
| **Repository Layer** | Database access via SQLAlchemy/SQLModel, separated per aggregate. |
| **API Layer** | FastAPI routers returning Pydantic schemas, pagination, error handling. |
| **Auth Integration** | OAuth flows, JWT validation, session tokens. |
| **Import/Export Module** | JSON serialization, data validation. |
| **Background Tasks** | (Future) Template publishing moderation, import processing. |

### 5.3 Frontend Components

| Component | Description |
|-----------|-------------|
| **App Shell** | Authentication state, routing, layout. |
| **Graph Dashboard** | List graphs, filter, sort, access templates. |
| **Graph Editor** | Course canvas (React Flow), side panel, toolbar. |
| **Course Panel** | Edit metadata, statuses, notes. |
| **Template Gallery** | Browse templates, preview, duplicate. |
| **Settings/Profile** | Manage account, theme, data exports. |

### 5.4 Data Model Overview

```
User
 ├─ id (uuid)
 ├─ email
 ├─ display_name
 ├─ avatar_url
 ├─ created_at, updated_at

Graph
 ├─ id (uuid)
 ├─ owner_id → User
 ├─ title
 ├─ description
 ├─ is_template (bool)
 ├─ visibility (private/public)
 ├─ created_at, updated_at

Course
 ├─ id (uuid)
 ├─ graph_id → Graph
 ├─ code
 ├─ title
 ├─ credits (int)
 ├─ term
 ├─ status (enum)
 ├─ prerequisites (array of course ids with optional conditions)
 ├─ position_x, position_y (float)
 ├─ notes (text)
 ├─ created_at, updated_at

TemplateMetadata (for gallery)
 ├─ id (uuid)
 ├─ graph_id → Graph
 ├─ creator_id → User
 ├─ tags (string array)
 ├─ summary
 ├─ preview_image_url
 ├─ published_at

*Note:* The database may still implement a join table (e.g., `course_prerequisite`) to store prerequisite relationships efficiently, but those rows are considered part of the `Course` aggregate rather than a standalone domain entity.
```

---

## 6. Technology Choices

| Layer | Option | Rationale |
|-------|--------|-----------|
| Backend Framework | **FastAPI** | Async, modern, Pydantic integration, great docs. |
| Language | **Python 3.12+** | Developer comfort, ecosystem support. |
| ORM | **SQLModel or SQLAlchemy 2.0** | Type hints + Pydantic synergy. |
| Auth | **Auth0** or **Supabase Auth** | Manages email/password + Google OAuth. |
| Database | **Managed Postgres (Supabase/Neon)** | Reliable, minimal ops. |
| Storage | **Supabase Storage / S3** | For exports, preview images. |
| Frontend | **React + TypeScript + Vite** | Fast builds, strong typing. |
| Graph UI | **React Flow** | Mature DAG editor library. |
| State/Data | **React Query** | Declarative data fetching, cache. |
| Styling | **Tailwind CSS** (with design tokens) | Rapid UI dev, configurable. |
| Testing (Backend) | **Pytest** | Unit + integration. |
| Testing (Frontend) | **Vitest + React Testing Library**, **Playwright** for E2E. |
| CI/CD | **GitHub Actions** | Automated lint/test/deploy. |
| Monitoring | **Sentry**, **Healthchecks.io** | Error tracking, uptime pings. |

---

## 7. Development Roadmap (Solo Execution)

### Phase 0 – Planning & Setup (1 week)

1. Finalize provider choices (Auth0 vs Supabase, hosting platforms).  
2. Create repositories (backend, frontend, or monorepo with Nx/Turborepo).  
3. Configure CI skeleton (lint/test placeholders).  
4. Establish coding standards (Black, Ruff, Prettier, ESLint).  
5. Document environment setup (makefile or scripts).

### Phase 1 – Backend Foundations (2–3 weeks)

1. Initialize FastAPI project with SQLModel and Postgres connection.  
2. Implement domain models and migrations via Alembic.  
3. Integrate auth provider; secure endpoints.  
4. Develop service layer for graphs/courses/prereqs.  
5. Expose REST endpoints with OpenAPI docs.  
6. Write unit and integration tests for services and routers.  
7. Deploy to staging backend (Render/Fly).  
8. Set up scheduled backups on DB provider.

### Phase 2 – Frontend MVP (3–4 weeks)

1. Bootstrap React app with routing and auth context.  
2. Implement dashboard (list graphs, templates).  
3. Build graph editor: canvas, toolbar, side panel, modals.  
4. Wire CRUD operations via React Query.  
5. Implement JSON import/export UI.  
6. Add template gallery (read-only, duplicate).  
7. Ensure responsive layout and keyboard accessibility.  
8. E2E tests covering major flows (login → create graph → add course → save).

### Phase 3 – Polish & Launch Prep (2 weeks)

1. Optimize performance (rendering, query batching).  
2. Add analytics hooks (privacy-respecting).  
3. Refine onboarding (empty states, tooltips).  
4. Load curated templates and capture preview thumbnails.  
5. Security review (rate limits, input validation).  
6. Finalize documentation (user guide, API docs).  
7. Launch marketing site + invite beta testers.

### Phase 4 – Post-MVP (ongoing)

1. Feedback triage and bug fixes.  
2. Design import pipeline architecture.  
3. Plan social features roadmap.  
4. Research best approach for mobile (React Native vs separate client).  
5. Consider multi-tenant support for institutions.

---

## 8. Maintenance Strategy

1. **Monitoring & Alerts:** Sentry for errors, Healthchecks for cron/ping.  
2. **Updates:** Dependabot/GitHub Actions to auto-update dependencies (weekly).  
3. **Backups:** Rely on provider’s automated daily snapshots; verify monthly.  
4. **Logs:** Centralized logging (provider or Logtail).  
5. **Security:** Quarterly check of auth provider settings, rotate secrets annually.  
6. **Docs:** Keep CHANGELOG.md and architecture notes up to date; schedule documentation day per quarter.

---

## 9. Risk Assessment & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Auth complexity | Medium | Use Auth0/Supabase templates; start with one provider, add others later. |
| Graph editor usability | High | Prototype early, gather feedback, iterate on UX with user testing. |
| Performance (large graphs) | Medium | Virtualize heavy lists, leverage React Flow performance hooks. |
| Import pipeline scope | High (future) | Clearly bound MVP to manual JSON import. |
| Solo developer burnout | Medium | Maintain realistic milestones, automate repetitive tasks. |

---

## 10. Glossary & References

- **Course Graph:** Directed acyclic graph representing courses and prerequisites.  
- **Template:** Predefined course graph for a specific major/track.  
- **Term Grouping:** Visual grouping of nodes by academic term (Fall, Spring).  
- **JSON Export:** Machine-readable representation of a graph, including metadata.  
- **React Flow:** Open-source library for building node-based editors.  
- **FastAPI:** Python web framework for high-performance APIs.  
- **SQLModel:** ORM/library combining SQLAlchemy and Pydantic paradigms.

Useful resources:

1. React Flow documentation (https://reactflow.dev).  
2. FastAPI official docs (https://fastapi.tiangolo.com).  
3. Supabase Auth & Postgres (https://supabase.io).  
4. Auth0 Quickstarts for Python (https://auth0.com/docs/quickstart/backend/python).  
5. Tailwind CSS docs (https://tailwindcss.com).

---

## 11. Immediate Next Steps

1. Create blank GitHub organization/repo for Course Atlas.  
2. Provision managed Postgres (Supabase) and auth provider (Auth0).  
3. Bootstrap backend (FastAPI) with placeholder route and CI.  
4. Draft detailed ERD and migration scripts.  
5. Begin Phase 1 implementation per roadmap.

---

With this blueprint, the Course Atlas initiative begins from a clean slate. Follow the phases sequentially, refer back to this document for scope decisions, and update the plan as milestones are achieved.

---

## Clarifying Questions (Codex)

1. Which auth provider (Auth0 or Supabase Auth) should we commit to for the initial MVP so we can finalize SDK choices and environment setup during Phase 0? **Answer:** Commit to Supabase Auth for the MVP so auth and Postgres live inside the same Supabase project and Phase 0 setup stays lean.
2. The grade tracking requirement mentions numeric scores (0–100) or a GPA scale—should we support both input types and normalize internally, or enforce a single canonical scale for GPA calculations? **Answer:** Support both numeric and GPA inputs, translating between scales internally so the GPA calculator can work off a unified representation.
3. For the `term` field on courses, do we expect a fixed enumeration (e.g., `Fall 2025`, `Spring 2026`) or flexible free-text values to accommodate custom academic calendars? **Answer:** Provide a fixed set of terms per academic year (default Spring/Fall) that users can rename, add additional terms like Summer, or remove optional ones; the first two default terms remain mandatory.
4. How should template preview images be sourced—automatically from a canvas snapshot in the editor or via manual uploads from template creators? **Answer:** Generate preview images automatically from an editor canvas snapshot when the template is saved.
