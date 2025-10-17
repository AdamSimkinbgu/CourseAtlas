# P1 High Priority Issues - Execution Plan

**Date**: October 17, 2025  
**Branch**: `phase-2`  
**Status**: P0 Complete ✅ → Starting P1

---

## 📋 P1 Issues Overview

### High Priority Issues (5 total)
1. **#1** Break 3,800-line component into smaller components (~5-7 days) 🔥
2. **#11** Add loading states and optimistic updates (~2 days) ⚡
3. **#4** Standardize position system (absolute vs relative) (~1 day) 🎯
4. **#13** Implement incremental node updates (~2 days) 🚀
5. **#12** Decouple business logic from React Query (~3 days) 🏗️

**Total Estimated Time**: 13-15 days (2.5-3 weeks)

---

## 🎯 Recommended Execution Order

### Strategy: Quick Wins First → Big Refactors

**Phase 1: Quick Wins (3 days)**
- Issue #11: Loading states (2 days) - Immediate UX improvement
- Issue #4: Position system (1 day) - Prevents future bugs

**Phase 2: Performance (2 days)**
- Issue #13: Incremental updates (2 days) - Better performance

**Phase 3: Architecture (8-10 days)**
- Issue #12: Decouple from React Query (3 days) - Better testability
- Issue #1: Component splitting (5-7 days) - Big refactor

---

## 🚀 Issue #11: Loading States & Optimistic Updates

### Priority: **START HERE** ⭐
**Effort**: 2 days  
**Risk**: Low  
**Impact**: High (immediate UX improvement)

### Current State
- Mutations have no visual feedback
- Users don't know if actions are processing
- No optimistic updates
- Feels laggy/unresponsive

### Goal
Add loading indicators and optimistic updates for all mutations:
- ✅ Course creation
- ✅ Course updates
- ✅ Course deletion
- ✅ Container creation
- ✅ Container updates
- ✅ Container deletion
- ✅ Prerequisites
- ✅ Import/Export

### Implementation Plan

#### Step 1: Add Loading State Management (2 hours)
```typescript
// Create centralized loading state
const [loadingOperations, setLoadingOperations] = useState<Set<string>>(new Set());

const startLoading = (operation: string) => {
  setLoadingOperations(prev => new Set(prev).add(operation));
};

const stopLoading = (operation: string) => {
  setLoadingOperations(prev => {
    const next = new Set(prev);
    next.delete(operation);
    return next;
  });
};

const isLoading = (operation: string) => loadingOperations.has(operation);
```

#### Step 2: Add Optimistic Updates (4 hours)
```typescript
// Example: Course creation with optimistic update
const handleCreateCourse = async (data: CourseInput) => {
  const tempId = `temp-${Date.now()}`;
  
  // Optimistic update
  const optimisticCourse = {
    id: tempId,
    ...data,
    status: 'not-started',
    position_x: 100,
    position_y: 100,
  };
  
  updateGraphCache(draft => {
    draft.courses.push(optimisticCourse);
  });
  
  startLoading('create-course');
  
  try {
    const realCourse = await createCourseMutation.mutateAsync(data);
    
    // Replace temp with real
    updateGraphCache(draft => {
      const index = draft.courses.findIndex(c => c.id === tempId);
      if (index !== -1) {
        draft.courses[index] = realCourse;
      }
    });
    
    toast.success('Course created');
  } catch (error) {
    // Rollback optimistic update
    updateGraphCache(draft => {
      draft.courses = draft.courses.filter(c => c.id !== tempId);
    });
    
    toast.error('Failed to create course');
  } finally {
    stopLoading('create-course');
  }
};
```

#### Step 3: Add Loading Indicators (3 hours)
```typescript
// In UI components
{isLoading('create-course') && (
  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
    <Spinner />
  </div>
)}

// Disable buttons during operations
<button
  disabled={isLoading('delete-nodes')}
  onClick={handleDelete}
>
  {isLoading('delete-nodes') ? 'Deleting...' : 'Delete'}
</button>
```

#### Step 4: Add Skeleton Loaders (3 hours)
```typescript
// For initial data load
{detailQuery.isLoading && <GraphSkeleton />}

// For inspector panels
{isLoading('course-update') && <InspectorSkeleton />}
```

### Success Criteria
- ✅ All mutations show loading state
- ✅ Optimistic updates feel instant
- ✅ Rollback on errors works correctly
- ✅ Loading indicators don't block UI unnecessarily
- ✅ Buttons disabled during operations
- ✅ Skeleton loaders for initial loads

### Files to Change
- `frontend/src/pages/GraphEditorPage.tsx` (main logic)
- `frontend/src/components/Spinner.tsx` (new - loading spinner)
- `frontend/src/components/GraphSkeleton.tsx` (new - skeleton loader)

### Testing Checklist
- [ ] Create course with slow network → See spinner
- [ ] Update course → See optimistic update immediately
- [ ] Delete with error → See rollback
- [ ] Import large file → See progress indicator
- [ ] Multiple operations → Each has loading state

---

## 🎯 Issue #4: Standardize Position System

### Priority: Second
**Effort**: 1 day  
**Risk**: Medium  
**Impact**: High (prevents bugs, improves clarity)

### Current State
Position data in two coordinate systems:
- **Database/Backend**: Absolute coordinates
- **React Flow**: Relative for children, absolute for containers

Conversion happens in 4+ places, easy to mix up.

### Goal
Create clear type-safe boundaries between absolute and relative positions.

### Implementation Plan

#### Step 1: Create Type-Safe Position Types (1 hour)
```typescript
// utils/coordinates.ts
export type AbsolutePosition = {
  x: number;
  y: number;
  _brand: 'absolute';
};

export type RelativePosition = {
  x: number;
  y: number;
  _brand: 'relative';
};

export function createAbsolute(x: number, y: number): AbsolutePosition {
  return { x, y, _brand: 'absolute' };
}

export function createRelative(x: number, y: number): RelativePosition {
  return { x, y, _brand: 'relative' };
}

export function toAbsolute(
  relative: RelativePosition,
  containerPos: AbsolutePosition
): AbsolutePosition {
  return createAbsolute(
    relative.x + containerPos.x,
    relative.y + containerPos.y
  );
}

export function toRelative(
  absolute: AbsolutePosition,
  containerPos: AbsolutePosition
): RelativePosition {
  return createRelative(
    absolute.x - containerPos.x,
    absolute.y - containerPos.y
  );
}
```

#### Step 2: Update Type Definitions (2 hours)
```typescript
// Update Course type
type Course = {
  id: string;
  title: string;
  position_x: number; // Always absolute
  position_y: number; // Always absolute
  // ...
};

// Update node building
const buildCourseNode = (
  course: Course,
  containerPos?: AbsolutePosition
): Node<CourseNodeData> => {
  const absolute = createAbsolute(course.position_x, course.position_y);
  const position = containerPos
    ? toRelative(absolute, containerPos)
    : { x: absolute.x, y: absolute.y };
  
  return {
    id: course.id,
    type: 'course',
    position,
    positionAbsolute: absolute,
    // ...
  };
};
```

#### Step 3: Centralize Conversion Logic (3 hours)
```typescript
// utils/graphTransforms.ts
export function serializeCoursePosition(
  node: Node,
  parentNode?: Node
): { position_x: number; position_y: number } {
  if (parentNode) {
    // Child course - convert relative to absolute
    const absolute = toAbsolute(
      createRelative(node.position.x, node.position.y),
      createAbsolute(parentNode.position.x, parentNode.position.y)
    );
    return {
      position_x: absolute.x,
      position_y: absolute.y,
    };
  }
  
  // Unassigned course - already absolute
  return {
    position_x: node.position.x,
    position_y: node.position.y,
  };
}
```

#### Step 4: Update All Usage Sites (2 hours)
- Data load effect
- Drag handlers
- Assignment reflow
- Cache updates

### Success Criteria
- ✅ Type safety prevents mixing coordinate systems
- ✅ All conversions go through centralized functions
- ✅ Clear documentation of which type is used where
- ✅ No more position-related bugs

### Files to Change
- `frontend/src/utils/coordinates.ts` (new)
- `frontend/src/utils/graphTransforms.ts` (new)
- `frontend/src/pages/GraphEditorPage.tsx`

---

## 🚀 Issue #13: Incremental Node Updates

### Priority: Third
**Effort**: 2 days  
**Risk**: Medium  
**Impact**: High (performance improvement)

### Current State
Full graph rebuild on ANY data change:
- Change one course title → Rebuild 100+ nodes
- 500 nodes = 250ms rebuild time (noticeable lag)

### Goal
Update only changed nodes, not entire graph.

### Implementation Plan

#### Step 1: Use React Flow's updateNode (2 hours)
```typescript
import { useReactFlow } from 'reactflow';

const { updateNode, updateNodeData } = useReactFlow();

// Instead of rebuilding all nodes
const handleTitleUpdate = (nodeId: string, newTitle: string) => {
  updateNodeData(nodeId, (data) => ({
    ...data,
    course: {
      ...data.course,
      title: newTitle,
    },
  }));
};
```

#### Step 2: Smart Data Synchronization (4 hours)
```typescript
// Only rebuild when structural changes happen
useEffect(() => {
  const lastData = lastDetailRef.current;
  const currentData = detailQuery.data;
  
  if (!lastData || !currentData) {
    // Full rebuild on initial load
    rebuildGraph();
    return;
  }
  
  // Detect structural changes
  const structuralChange = 
    lastData.courses.length !== currentData.courses.length ||
    lastData.graph.containers.length !== currentData.graph.containers.length;
  
  if (structuralChange) {
    rebuildGraph();
  } else {
    // Incremental update
    updateChangedNodes(lastData, currentData);
  }
  
  lastDetailRef.current = currentData;
}, [detailQuery.dataUpdatedAt]);
```

#### Step 3: Implement updateChangedNodes (4 hours)
```typescript
const updateChangedNodes = (
  prevData: GraphDetail,
  nextData: GraphDetail
) => {
  const { getNode } = useReactFlow();
  
  // Find changed courses
  nextData.courses.forEach(course => {
    const prevCourse = prevData.courses.find(c => c.id === course.id);
    
    if (!prevCourse || !isEqual(prevCourse, course)) {
      const node = getNode(course.id);
      if (node) {
        updateNodeData(course.id, (data) => ({
          ...data,
          course,
        }));
      }
    }
  });
  
  // Find changed containers
  nextData.graph.containers.forEach(container => {
    const prevContainer = prevData.graph.containers.find(c => c.id === container.id);
    
    if (!prevContainer || !isEqual(prevContainer, container)) {
      const node = getNode(container.id);
      if (node) {
        updateNodeData(container.id, (data) => ({
          ...data,
          container,
        }));
      }
    }
  });
};
```

### Success Criteria
- ✅ Only changed nodes update
- ✅ Full rebuild only for structural changes
- ✅ Performance: <10ms for single node update
- ✅ No visual glitches

### Files to Change
- `frontend/src/pages/GraphEditorPage.tsx`
- Add `lodash.isequal` dependency

---

## 🏗️ Issue #12: Decouple from React Query

### Priority: Fourth
**Effort**: 3 days  
**Risk**: Medium  
**Impact**: High (testability, reusability)

### Current State
All business logic directly depends on React Query:
- Can't test without mocking React Query
- Can't reuse logic in different contexts
- Tight coupling to data layer

### Goal
Separate pure business logic from data fetching layer.

### Implementation Plan

#### Step 1: Create Service Layer (4 hours)
```typescript
// services/graphService.ts
export class GraphService {
  async getGraph(graphId: string): Promise<GraphDetail> {
    const response = await fetch(`/api/v1/graphs/${graphId}`);
    return response.json();
  }
  
  async updateContainers(
    graphId: string,
    containers: ContainerShape[]
  ): Promise<void> {
    await fetch(`/api/v1/graphs/${graphId}`, {
      method: 'PATCH',
      body: JSON.stringify({ containers }),
    });
  }
  
  // Pure business logic - no React Query
  calculateRelativePosition(
    absolute: Position,
    container: Position
  ): Position {
    return {
      x: absolute.x - container.x,
      y: absolute.y - container.y,
    };
  }
  
  validateAssignment(
    courseId: string,
    containerId: string,
    validContainers: Set<string>
  ): boolean {
    return validContainers.has(containerId);
  }
}
```

#### Step 2: Create Custom Hooks (4 hours)
```typescript
// hooks/useGraphData.ts
export function useGraphData(graphId: string) {
  const service = useMemo(() => new GraphService(), []);
  
  return useQuery({
    queryKey: ['graph', graphId],
    queryFn: () => service.getGraph(graphId),
  });
}

// hooks/useGraphMutations.ts
export function useGraphMutations(graphId: string) {
  const service = useMemo(() => new GraphService(), []);
  const queryClient = useQueryClient();
  
  const updateContainers = useMutation({
    mutationFn: (containers: ContainerShape[]) =>
      service.updateContainers(graphId, containers),
    onSuccess: () => {
      queryClient.invalidateQueries(['graph', graphId]);
    },
  });
  
  return { updateContainers };
}
```

#### Step 3: Extract Pure Functions (8 hours)
```typescript
// utils/graphLogic.ts
export const GraphLogic = {
  calculateRelativePosition(
    absolute: Position,
    container: Position
  ): Position {
    return {
      x: absolute.x - container.x,
      y: absolute.y - container.y,
    };
  },
  
  findAffectedCourses(
    containerId: string,
    assignments: Record<string, string>
  ): string[] {
    return Object.entries(assignments)
      .filter(([_, cId]) => cId === containerId)
      .map(([courseId]) => courseId);
  },
  
  validatePrerequisite(
    courseId: string,
    prereqId: string,
    courses: Course[]
  ): boolean {
    // Check for cycles
    const visited = new Set<string>();
    const hasCycle = (id: string): boolean => {
      if (visited.has(id)) return true;
      visited.add(id);
      
      const course = courses.find(c => c.id === id);
      if (!course) return false;
      
      return course.prerequisites.some(p => hasCycle(p.course_id));
    };
    
    return !hasCycle(prereqId);
  },
};
```

#### Step 4: Write Tests (8 hours)
```typescript
// services/graphService.test.ts
describe('GraphService', () => {
  it('calculates relative position', () => {
    const service = new GraphService();
    const result = service.calculateRelativePosition(
      { x: 250, y: 250 },
      { x: 100, y: 100 }
    );
    expect(result).toEqual({ x: 150, y: 150 });
  });
});

// utils/graphLogic.test.ts
describe('GraphLogic', () => {
  it('finds affected courses', () => {
    const assignments = {
      'course-1': 'container-1',
      'course-2': 'container-2',
      'course-3': 'container-1',
    };
    
    const result = GraphLogic.findAffectedCourses(
      'container-1',
      assignments
    );
    
    expect(result).toEqual(['course-1', 'course-3']);
  });
  
  it('detects prerequisite cycles', () => {
    const courses = [
      { id: 'a', prerequisites: [{ course_id: 'b' }] },
      { id: 'b', prerequisites: [{ course_id: 'c' }] },
      { id: 'c', prerequisites: [{ course_id: 'a' }] }, // Cycle!
    ];
    
    const valid = GraphLogic.validatePrerequisite('a', 'c', courses);
    expect(valid).toBe(false);
  });
});
```

### Success Criteria
- ✅ Business logic testable without React
- ✅ 80%+ test coverage on pure functions
- ✅ Service layer handles all API calls
- ✅ Hooks are thin wrappers around services

### Files to Create
- `frontend/src/services/graphService.ts`
- `frontend/src/utils/graphLogic.ts`
- `frontend/src/hooks/useGraphData.ts`
- `frontend/src/hooks/useGraphMutations.ts`
- `frontend/src/services/graphService.test.ts`
- `frontend/src/utils/graphLogic.test.ts`

---

## 🔨 Issue #1: Component Splitting

### Priority: Fifth (Save for last)
**Effort**: 5-7 days  
**Risk**: High  
**Impact**: Very High (maintainability, testability)

### Current State
Single 3,800-line component with everything.

### Goal
Break into 5-8 focused components.

### Proposed Architecture
```
GraphEditorPage.tsx (200 lines)
├── components/
│   ├── GraphCanvas.tsx              // React Flow rendering
│   ├── GraphToolbar.tsx             // Actions & controls
│   ├── GraphInspector.tsx           // Side panel router
│   ├── inspectors/
│   │   ├── CourseInspector.tsx      // Course details
│   │   ├── ContainerInspector.tsx   // Container details
│   │   └── MultiSelectInspector.tsx // Multi-selection
│   └── GraphSettings.tsx            // Settings panel
├── hooks/
│   ├── useGraphData.ts              // Data fetching
│   ├── useGraphMutations.ts         // CRUD operations
│   ├── useGraphHistory.ts           // Undo/redo
│   ├── useGraphDragDrop.ts          // Drag handlers
│   ├── useGraphSelection.ts         // Selection state
│   └── useGraphPersistence.ts       // Debounced saves
└── utils/
    ├── graphTransforms.ts           // Position calculations
    ├── graphValidation.ts           // Data validation
    └── graphConstants.ts            // Magic numbers
```

### Implementation Plan (Day by Day)

**Day 1**: Setup & Planning
- Create component structure
- Move constants to separate file
- Set up testing infrastructure

**Day 2**: Extract Hooks
- useGraphHistory (undo/redo)
- useGraphSelection (selection state)
- useGraphPersistence (debouncing)

**Day 3**: Extract Inspector Components
- CourseInspector
- ContainerInspector
- MultiSelectInspector

**Day 4**: Extract Canvas & Toolbar
- GraphCanvas (React Flow)
- GraphToolbar (actions)

**Day 5**: Extract Settings
- GraphSettings
- Integration testing

**Day 6**: Cleanup & Testing
- Remove old code
- Write tests
- Fix any issues

**Day 7**: Buffer for issues

### Success Criteria
- ✅ GraphEditorPage under 300 lines
- ✅ Each component under 300 lines
- ✅ All components tested independently
- ✅ No functionality lost
- ✅ No performance regression

---

## 📊 Summary Timeline

### Week 1: Quick Wins
- **Day 1-2**: Issue #11 (Loading states)
- **Day 3**: Issue #4 (Position system)
- **Day 4-5**: Issue #13 (Incremental updates)

### Week 2: Architecture
- **Day 6-8**: Issue #12 (Decouple React Query)

### Week 3: Big Refactor
- **Day 9-15**: Issue #1 (Component splitting)

**Total**: 15 days (3 weeks)

---

## 🎯 Success Metrics

After completing P1, we should see:

1. **Performance**
   - Node updates: <10ms (was 50-250ms)
   - Loading states: Users know what's happening
   - Optimistic updates: Instant feedback

2. **Code Quality**
   - GraphEditorPage: <300 lines (was 3,800)
   - Test coverage: 80%+ on business logic
   - Type safety: Position system prevents bugs

3. **Developer Experience**
   - Easy to find code
   - Easy to test features
   - Easy to add new features
   - Clear separation of concerns

4. **User Experience**
   - Feels fast and responsive
   - Clear feedback for all operations
   - No mysterious loading states

---

## 🚀 Let's Start!

**Recommended first step**: Issue #11 (Loading States)

This gives immediate UX improvement and is low risk. Ready to proceed?
