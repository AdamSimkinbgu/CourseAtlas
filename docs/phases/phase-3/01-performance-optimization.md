# Phase 3.1 – Performance Optimization

## Objective
Ensure the application (frontend + backend) remains responsive with large graphs (200–300 nodes) and real-world usage. Identify and remedy bottlenecks before public beta.

## Tasks

1. **Profiling plan**
   - Generate large seed graph (script) with 250 courses and dense prerequisite network.  
   - Use backend profiling tools (e.g., `uvicorn --reload --reload-dir` logs, `pyinstrument`) to measure API response times.  
   - Use Chrome DevTools Performance tab to profile React components while interacting with graph.

2. **Backend optimizations**
   - Ensure SQL queries use indexes (add indexes on `course.graph_id`, `graph.owner_id`).  
   - Batch API responses—avoid N+1 by joining courses/prereqs in single query.  
   - Implement caching for expensive operations (e.g., template lists) via in-memory cache or Redis (optional).  
   - Confirm GPA calculations efficient (computed on the fly or precomputed with triggers).

3. **Frontend optimizations**
   - Leverage React Flow performance hooks: `nodesDraggable`, `nodesConnectable`, `onlyRenderVisibleElements`.  
   - Memoize heavy components; ensure React Query caching prevents redundant fetches.  
   - Implement virtualization for lists (templates, course lists).  
   - Lazy-load non-critical bundles (template gallery, analytics).  
   - Debounce frequent API calls (drag events).

4. **Network tuning**
   - Enable gzip/brotli compression on hosting platform.  
   - Use HTTP/2 for faster asset delivery.  
   - Set reasonable caching headers for static assets.

5. **Budget monitoring**
   - Define performance budget: e.g., load time < 3s on median network, graph operations < 150ms.  
   - Track metrics using Lighthouse CI or WebPageTest.

6. **Load testing**
   - Use k6 or Locust to simulate API load (e.g., 100 concurrent users adding courses).  
   - Monitor database CPU/IO metrics.

7. **Document findings**
   - Record before/after metrics in `docs/performance/phase-3-report.md`.  
   - List remaining bottlenecks with mitigation plan.

## Deliverables
- Performance report documenting profiling results and optimizations.  
- Updated indexes/migrations if needed.  
- Verified frontend responsiveness under heavy load.
