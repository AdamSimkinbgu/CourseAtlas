# GraphEditor Component Architecture - Detailed Breakdown

**Goal**: Break 3,800-line monolith into 15-20 focused, testable components  
**Strategy**: Maximize separation of concerns, minimize component size  
**Target**: Each component < 200 lines

---

## 🏗️ Proposed Architecture (15-20 Components)

```
src/pages/
└── GraphEditorPage.tsx (150-200 lines)
    ├── Orchestrates overall page layout
    ├── Manages high-level state coordination
    └── Delegates to specialized components

src/features/graph-editor/
├── components/
│   ├── canvas/
│   │   ├── GraphCanvas.tsx (150 lines)
│   │   │   └── React Flow wrapper, viewport controls
│   │   ├── nodes/
│   │   │   ├── CourseNode.tsx (100 lines)
│   │   │   │   └── Individual course node rendering
│   │   │   ├── ContainerNode.tsx (120 lines)
│   │   │   │   └── Container node with resize handles
│   │   │   └── NodeFactory.tsx (50 lines)
│   │   │       └── Node type registration
│   │   └── edges/
│   │       ├── PrerequisiteEdge.tsx (80 lines)
│   │       │   └── Custom edge with status styling
│   │       └── EdgeFactory.tsx (40 lines)
│   │           └── Edge type registration
│   │
│   ├── toolbar/
│   │   ├── GraphToolbar.tsx (100 lines)
│   │   │   └── Main toolbar container
│   │   ├── CreateActions.tsx (80 lines)
│   │   │   └── Create course/container buttons
│   │   ├── EditActions.tsx (80 lines)
│   │   │   └── Delete, undo, redo buttons
│   │   ├── ImportExportActions.tsx (100 lines)
│   │   │   └── Import/export/sample buttons
│   │   └── ViewControls.tsx (60 lines)
│   │       └── Zoom, fit view, grid controls
│   │
│   ├── inspector/
│   │   ├── GraphInspector.tsx (100 lines)
│   │   │   └── Inspector panel router/container
│   │   ├── CourseInspector.tsx (200 lines)
│   │   │   └── Course details form
│   │   ├── ContainerInspector.tsx (150 lines)
│   │   │   └── Container details form
│   │   ├── MultiSelectInspector.tsx (120 lines)
│   │   │   └── Bulk actions panel
│   │   ├── EmptyInspector.tsx (50 lines)
│   │   │   └── No selection placeholder
│   │   └── forms/
│   │       ├── CourseForm.tsx (150 lines)
│   │       │   └── Reusable course edit form
│   │       ├── PrerequisiteManager.tsx (120 lines)
│   │       │   └── Add/remove prerequisites
│   │       └── ValidationDisplay.tsx (60 lines)
│   │           └── Form validation errors
│   │
│   ├── settings/
│   │   ├── GraphSettings.tsx (100 lines)
│   │   │   └── Settings panel container
│   │   ├── ThemeSettings.tsx (80 lines)
│   │   │   └── Dark mode, colors
│   │   ├── GridSettings.tsx (100 lines)
│   │   │   └── Grid controls, snap settings
│   │   └── DisplaySettings.tsx (80 lines)
│   │       └── Node blur, minimap, etc.
│   │
│   └── shared/
│       ├── LoadingSpinner.tsx (40 lines)
│       ├── ErrorBoundary.tsx (80 lines)
│       ├── ConfirmDialog.tsx (60 lines)
│       └── StatusBadge.tsx (40 lines)
│
├── hooks/
│   ├── data/
│   │   ├── useGraphData.ts (80 lines)
│   │   │   └── Fetch graph data
│   │   └── useGraphCache.ts (100 lines)
│   │       └── Cache management utilities
│   │
│   ├── mutations/
│   │   ├── useCoursesMutations.ts (150 lines)
│   │   │   └── Create, update, delete courses
│   │   ├── useContainersMutations.ts (150 lines)
│   │   │   └── Create, update, delete containers
│   │   ├── usePrerequisitesMutations.ts (100 lines)
│   │   │   └── Add, remove prerequisites
│   │   └── useImportExportMutations.ts (120 lines)
│   │       └── Import, export, sample graph
│   │
│   ├── state/
│   │   ├── useGraphHistory.ts (150 lines)
│   │   │   └── Undo/redo with history stack
│   │   ├── useGraphSelection.ts (100 lines)
│   │   │   └── Node selection management
│   │   ├── useGraphDragDrop.ts (180 lines)
│   │   │   └── Drag handlers, position updates
│   │   └── useInspectorState.ts (80 lines)
│   │       └── Inspector panel state
│   │
│   ├── persistence/
│   │   ├── useGraphPersistence.ts (150 lines)
│   │   │   └── Debounced saves, flush logic
│   │   ├── usePositionPersistence.ts (100 lines)
│   │   │   └── Position-specific persistence
│   │   └── useAssignmentPersistence.ts (100 lines)
│   │       └── Container assignment persistence
│   │
│   └── ui/
│       ├── useLoadingState.ts (80 lines)
│       │   └── Loading operation tracking
│       ├── useOptimisticUpdates.ts (120 lines)
│       │   └── Optimistic update helpers
│       └── useKeyboardShortcuts.ts (100 lines)
│           └── Keyboard event handlers
│
├── utils/
│   ├── coordinates/
│   │   ├── types.ts (60 lines)
│   │   │   └── Position type definitions
│   │   ├── conversions.ts (80 lines)
│   │   │   └── Absolute ↔ relative conversions
│   │   └── validation.ts (60 lines)
│   │       └── Position boundary checks
│   │
│   ├── transforms/
│   │   ├── nodeBuilder.ts (150 lines)
│   │   │   └── Build React Flow nodes from data
│   │   ├── edgeBuilder.ts (100 lines)
│   │   │   └── Build React Flow edges from data
│   │   ├── nodeSerializer.ts (120 lines)
│   │   │   └── Serialize nodes back to API format
│   │   └── dataMapper.ts (100 lines)
│   │       └── Map between domain and UI models
│   │
│   ├── validation/
│   │   ├── courseValidation.ts (80 lines)
│   │   │   └── Validate course data
│   │   ├── containerValidation.ts (60 lines)
│   │   │   └── Validate container data
│   │   ├── prerequisiteValidation.ts (100 lines)
│   │   │   └── Check cycles, validate prerequisites
│   │   └── assignmentValidation.ts (70 lines)
│   │       └── Validate container assignments
│   │
│   └── helpers/
│       ├── graphConstants.ts (100 lines)
│       │   └── All magic numbers
│       ├── graphHelpers.ts (150 lines)
│       │   └── Utility functions
│       ├── cloneHelpers.ts (80 lines)
│       │   └── Deep clone functions
│       └── layoutHelpers.ts (100 lines)
│           └── Reflow, positioning logic
│
├── services/
│   ├── GraphService.ts (200 lines)
│   │   └── Pure business logic, API calls
│   ├── HistoryService.ts (150 lines)
│   │   └── History management logic
│   └── ValidationService.ts (120 lines)
│       └── Validation business rules
│
└── types/
    ├── graph.types.ts (150 lines)
    ├── node.types.ts (100 lines)
    ├── edge.types.ts (60 lines)
    └── inspector.types.ts (80 lines)
```

---

## 📊 Component Count Summary

### By Category
- **Page**: 1 component (orchestrator)
- **Canvas**: 5 components (canvas, 2 node types, 2 edge types)
- **Toolbar**: 5 components (container + 4 action groups)
- **Inspector**: 8 components (router + 3 inspectors + forms)
- **Settings**: 4 components (container + 3 setting groups)
- **Shared**: 4 components (reusable UI)

**Total React Components**: ~27 components

### By File Type
- **Hooks**: ~15 hooks (data, mutations, state, persistence, UI)
- **Utils**: ~15 utility modules (coordinates, transforms, validation, helpers)
- **Services**: 3 services (business logic)
- **Types**: 4 type definition files

**Total Files**: ~64 files (was 1 file!)

### Size Comparison
- **Before**: 1 file × 3,800 lines = 3,800 lines
- **After**: ~64 files × 100 lines avg = ~6,400 lines
  - (More code due to proper separation, but each piece is tiny and focused)

---

## 🎯 Benefits of This Architecture

### 1. **Tiny, Focused Files**
- Each file < 200 lines (most < 150)
- Single responsibility principle
- Easy to understand at a glance

### 2. **Clear Separation of Concerns**
```
components/     → UI rendering only
hooks/          → State management & side effects
utils/          → Pure functions
services/       → Business logic
types/          → Type definitions
```

### 3. **Easy Testing**
```typescript
// Test pure utils without React
describe('toRelative', () => {
  it('converts absolute to relative position', () => {
    expect(toRelative(absolute, container)).toEqual(expected);
  });
});

// Test hooks with React Testing Library
describe('useGraphSelection', () => {
  it('tracks selected nodes', () => {
    const { result } = renderHook(() => useGraphSelection());
    // ...
  });
});

// Test components in isolation
describe('CourseInspector', () => {
  it('displays course details', () => {
    render(<CourseInspector course={mockCourse} />);
    // ...
  });
});
```

### 4. **Parallel Development**
Multiple developers can work on different parts without conflicts:
- Dev 1: Inspector components
- Dev 2: Toolbar actions
- Dev 3: Persistence hooks
- Dev 4: Validation utils

### 5. **Easy to Find Code**
```
"Where's the undo/redo logic?"
→ hooks/state/useGraphHistory.ts

"Where's position conversion?"
→ utils/coordinates/conversions.ts

"Where's the course form?"
→ components/inspector/forms/CourseForm.tsx

"Where's the drag logic?"
→ hooks/state/useGraphDragDrop.ts
```

### 6. **Reusability**
```typescript
// Use CourseForm in multiple places
<CourseInspector>
  <CourseForm course={course} onSave={handleSave} />
</CourseInspector>

<CreateCourseDialog>
  <CourseForm onSave={handleCreate} />
</CreateCourseDialog>

// Use validation in multiple contexts
import { validateCourse } from '@/utils/validation/courseValidation';
```

---

## 🚀 Migration Strategy

### Phase 1: Setup (Day 1)
**Goal**: Create folder structure and move constants

```bash
# Create folder structure
mkdir -p src/features/graph-editor/{components,hooks,utils,services,types}
mkdir -p src/features/graph-editor/components/{canvas,toolbar,inspector,settings,shared}
mkdir -p src/features/graph-editor/components/canvas/{nodes,edges}
mkdir -p src/features/graph-editor/components/inspector/forms
mkdir -p src/features/graph-editor/hooks/{data,mutations,state,persistence,ui}
mkdir -p src/features/graph-editor/utils/{coordinates,transforms,validation,helpers}

# Move constants first (easy win)
# Extract from GraphEditorPage.tsx → utils/helpers/graphConstants.ts
```

**Files to create**:
- ✅ `utils/helpers/graphConstants.ts` - All magic numbers
- ✅ `types/graph.types.ts` - Type definitions

**Estimated**: 2 hours

---

### Phase 2: Extract Utils (Day 2-3)
**Goal**: Pure functions with no React dependencies

**Priority order** (least risky first):
1. ✅ `utils/helpers/graphConstants.ts` - Constants
2. ✅ `utils/coordinates/types.ts` - Position types
3. ✅ `utils/coordinates/conversions.ts` - Position conversions
4. ✅ `utils/validation/courseValidation.ts` - Course validation
5. ✅ `utils/validation/containerValidation.ts` - Container validation
6. ✅ `utils/validation/prerequisiteValidation.ts` - Prerequisite validation
7. ✅ `utils/helpers/cloneHelpers.ts` - Clone utilities
8. ✅ `utils/transforms/nodeBuilder.ts` - Build nodes from data
9. ✅ `utils/transforms/edgeBuilder.ts` - Build edges from data
10. ✅ `utils/transforms/nodeSerializer.ts` - Serialize nodes

**Testing**: Write tests for each util as you extract it

**Estimated**: 2 days

---

### Phase 3: Extract Services (Day 4)
**Goal**: Business logic layer

**Files to create**:
1. ✅ `services/GraphService.ts` - Graph operations
2. ✅ `services/ValidationService.ts` - Validation logic
3. ✅ `services/HistoryService.ts` - History management

**Pattern**:
```typescript
// Old: Mixed in component
const handleCreateCourse = async () => {
  // Validation logic
  // API call
  // Cache update
  // UI update
};

// New: Separated
// Service: Business logic + API
class GraphService {
  async createCourse(data: CourseInput): Promise<Course> {
    // API call only
  }
}

// Hook: React integration
function useCourseMutations() {
  const service = useGraphService();
  
  return useMutation({
    mutationFn: (data) => service.createCourse(data),
  });
}

// Component: UI only
function CreateCourseButton() {
  const { mutate } = useCourseMutations();
  return <button onClick={() => mutate(data)}>Create</button>;
}
```

**Estimated**: 1 day

---

### Phase 4: Extract Hooks (Day 5-7)
**Goal**: State management and side effects

**Priority order**:
1. ✅ `hooks/data/useGraphData.ts` - Data fetching (least risky)
2. ✅ `hooks/state/useGraphSelection.ts` - Selection state
3. ✅ `hooks/ui/useLoadingState.ts` - Loading tracking
4. ✅ `hooks/persistence/useGraphPersistence.ts` - Debounced saves
5. ✅ `hooks/state/useGraphHistory.ts` - Undo/redo
6. ✅ `hooks/state/useGraphDragDrop.ts` - Drag handlers
7. ✅ `hooks/mutations/useCourseMutations.ts` - Course CRUD
8. ✅ `hooks/mutations/useContainerMutations.ts` - Container CRUD
9. ✅ `hooks/mutations/usePrerequisiteMutations.ts` - Prerequisites
10. ✅ `hooks/ui/useOptimisticUpdates.ts` - Optimistic updates

**Pattern**:
```typescript
// Old: Everything in component
const GraphEditorPage = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const handleSelect = (id: string) => { /* ... */ };
  
  // 50 more state variables...
  // 30 more handlers...
};

// New: Extracted hook
// hooks/state/useGraphSelection.ts
export function useGraphSelection() {
  const [selected, setSelected] = useState<string[]>([]);
  
  const select = useCallback((id: string) => {
    setSelected(prev => [...prev, id]);
  }, []);
  
  const deselect = useCallback((id: string) => {
    setSelected(prev => prev.filter(i => i !== id));
  }, []);
  
  const clear = useCallback(() => {
    setSelected([]);
  }, []);
  
  return { selected, select, deselect, clear };
}

// Component: Use hook
const GraphEditorPage = () => {
  const selection = useGraphSelection();
  // Much cleaner!
};
```

**Testing**: Test each hook with `@testing-library/react-hooks`

**Estimated**: 3 days

---

### Phase 5: Extract Components (Day 8-12)
**Goal**: Break down UI into small components

**Priority order** (bottom-up approach):

**Week 1: Leaf Components** (no dependencies)
1. ✅ `components/shared/LoadingSpinner.tsx`
2. ✅ `components/shared/StatusBadge.tsx`
3. ✅ `components/canvas/nodes/CourseNode.tsx`
4. ✅ `components/canvas/nodes/ContainerNode.tsx`
5. ✅ `components/canvas/edges/PrerequisiteEdge.tsx`

**Week 2: Form Components**
6. ✅ `components/inspector/forms/CourseForm.tsx`
7. ✅ `components/inspector/forms/PrerequisiteManager.tsx`
8. ✅ `components/inspector/forms/ValidationDisplay.tsx`

**Week 2: Inspector Components**
9. ✅ `components/inspector/EmptyInspector.tsx`
10. ✅ `components/inspector/CourseInspector.tsx`
11. ✅ `components/inspector/ContainerInspector.tsx`
12. ✅ `components/inspector/MultiSelectInspector.tsx`
13. ✅ `components/inspector/GraphInspector.tsx` (router)

**Week 2: Toolbar Components**
14. ✅ `components/toolbar/CreateActions.tsx`
15. ✅ `components/toolbar/EditActions.tsx`
16. ✅ `components/toolbar/ImportExportActions.tsx`
17. ✅ `components/toolbar/ViewControls.tsx`
18. ✅ `components/toolbar/GraphToolbar.tsx` (container)

**Week 3: Settings Components**
19. ✅ `components/settings/ThemeSettings.tsx`
20. ✅ `components/settings/GridSettings.tsx`
21. ✅ `components/settings/DisplaySettings.tsx`
22. ✅ `components/settings/GraphSettings.tsx` (container)

**Week 3: Canvas Component**
23. ✅ `components/canvas/GraphCanvas.tsx`

**Pattern**:
```typescript
// Old: Everything in one render
return (
  <div>
    {/* 500 lines of JSX */}
    {/* Inspector panel */}
    {/* Toolbar */}
    {/* Settings */}
    {/* Canvas */}
  </div>
);

// New: Composed from small pieces
return (
  <div>
    <GraphToolbar />
    <div className="flex">
      <GraphCanvas />
      <GraphInspector />
    </div>
    <GraphSettings />
  </div>
);
```

**Estimated**: 5 days

---

### Phase 6: Final Cleanup (Day 13-14)
**Goal**: Delete old code, fix integrations

1. ✅ Update `GraphEditorPage.tsx` to use all new components
2. ✅ Delete old code from `GraphEditorPage.tsx`
3. ✅ Fix any import issues
4. ✅ Update tests
5. ✅ Performance testing
6. ✅ Documentation

**Final `GraphEditorPage.tsx`**:
```typescript
// ~150 lines total!
import { GraphToolbar } from './components/toolbar/GraphToolbar';
import { GraphCanvas } from './components/canvas/GraphCanvas';
import { GraphInspector } from './components/inspector/GraphInspector';
import { GraphSettings } from './components/settings/GraphSettings';
import { useGraphData } from './hooks/data/useGraphData';
import { useGraphSelection } from './hooks/state/useGraphSelection';
import { useGraphHistory } from './hooks/state/useGraphHistory';
import { useGraphPersistence } from './hooks/persistence/useGraphPersistence';

export function GraphEditorPage() {
  const { graphId } = useParams();
  const graphData = useGraphData(graphId);
  const selection = useGraphSelection();
  const history = useGraphHistory();
  const persistence = useGraphPersistence(graphId);
  
  if (graphData.isLoading) return <LoadingSpinner />;
  if (graphData.isError) return <ErrorDisplay error={graphData.error} />;
  
  return (
    <div className="h-screen flex flex-col">
      <GraphToolbar
        selection={selection}
        history={history}
        onAction={handleToolbarAction}
      />
      
      <div className="flex-1 flex">
        <GraphCanvas
          data={graphData.data}
          selection={selection}
          onNodesChange={persistence.scheduleNodeUpdate}
        />
        
        <GraphInspector
          selection={selection}
          data={graphData.data}
        />
      </div>
      
      <GraphSettings />
    </div>
  );
}
```

**Estimated**: 2 days

---

## 📊 Total Timeline

### Detailed Breakdown
- **Phase 1**: Setup - 0.5 days
- **Phase 2**: Utils - 2 days
- **Phase 3**: Services - 1 day
- **Phase 4**: Hooks - 3 days
- **Phase 5**: Components - 5 days
- **Phase 6**: Cleanup - 2 days

**Total**: 13.5 days (~3 weeks)

### Weekly Schedule
**Week 1**: Setup + Utils + Services (Days 1-5)
**Week 2**: Hooks + Start Components (Days 6-10)
**Week 3**: Finish Components + Cleanup (Days 11-14)

---

## ✅ Success Criteria

### Code Metrics
- [ ] GraphEditorPage.tsx < 200 lines (was 3,800)
- [ ] Every component < 200 lines
- [ ] Every hook < 200 lines
- [ ] Every util < 150 lines
- [ ] Total files: ~60-70 (was 1)

### Quality Metrics
- [ ] 80%+ test coverage on utils
- [ ] 70%+ test coverage on hooks
- [ ] 60%+ test coverage on components
- [ ] 0 lint errors
- [ ] 0 TypeScript errors

### Performance Metrics
- [ ] No performance regression
- [ ] Page load time < 1s
- [ ] Render time < 50ms
- [ ] Bundle size increase < 10%

### Developer Experience
- [ ] Easy to find any piece of code
- [ ] New developer can onboard in < 2 hours
- [ ] Can modify features without touching 10 files
- [ ] Clear documentation for each module

---

## 🎯 Next Steps

1. **Review this architecture** - Does it make sense? Any suggestions?
2. **Start Phase 1** - Create folder structure, move constants
3. **Iterative approach** - Extract piece by piece, test after each step
4. **Continuous integration** - Keep main branch working throughout

Ready to start? Should we begin with Phase 1 (Setup + Constants)?
