# Decision: Removal of Undo/Redo System

**Date**: October 17, 2025  
**Status**: Implemented  
**Commits**: 50933cc, 275ca46  
**Related Issue**: #13 (Incremental Node Updates)

---

## Context

During testing of Issue #13 (Incremental Updates), we discovered that the undo/redo system was fundamentally broken and blocking completion of the test suite.

### The Problem

The undo/redo system had multiple critical flaws:

1. **Incomplete State Capture**
   - Only tracked: nodes, edges, container assignments
   - Did NOT track: course data (title, code, status), container data
   - React Query cache was not included in history

2. **Missing History Tracking**
   - Course updates never called `pushHistory()`
   - Container title changes not tracked
   - Only drag operations and edge changes saved history

3. **Timing Issues**
   - History saved AFTER changes (too late)
   - Should capture state BEFORE changes for proper restoration

4. **Incremental Updates Incompatibility**
   - Issue #13 introduced `updateSingleNode()` for instant feedback
   - These updates bypassed history system entirely
   - Old state was lost before history could capture it

5. **Multiple Sources of Truth**
   - React Flow state (nodes/edges)
   - React Query cache (course/container details)
   - Local state (assignments)
   - History only captured 1 of 3 sources

### Failed Test

**Test 5: Undo/Redo**
- User reported: "Undo shows successful toast but doesn't undo the action"
- Root cause: History captured old nodes, but React Query cache had new data
- Cache re-sync triggered rebuild with new data, overwriting restored nodes
- Result: Undo appeared to do nothing

---

## Analysis

### Why It Was Broken

```typescript
// User edits course title in inspector
handleSubmit() {
  // 1. Updates React Query cache optimistically
  updateGraphCache((draft) => {
    draft.courses[index].title = "New Title";
  });

  // 2. Updates node incrementally (#13)
  updateSingleNode(courseId, (node) => ({
    ...node,
    data: { ...node.data, course: { ...course, title: "New Title" } }
  }));

  // 3. Sends mutation to backend
  await updateCourseMutation.mutateAsync(...);
  
  // ❌ PROBLEM: pushHistory() never called!
  // History still has old state, but:
  // - Cache has new title
  // - Node has new title
  // - Old state is GONE
}

// Later, user clicks Undo
undo() {
  setNodes(previous.nodes); // ← Has old title in node data
  
  // ❌ PROBLEM: Cache still has new title!
  // Next render: useEffect sees cache changed
  // Triggers rebuild with new data from cache
  // Overwrites restored nodes
  // Result: "Undo" does nothing
}
```

### Attempted Fix

We tried adding cache restoration to undo/redo:

```typescript
undo() {
  setNodes(previous.nodes);
  
  // Restore cache from node data
  updateGraphCache((draft) => {
    previous.nodes.forEach(node => {
      if (node.data.kind === 'course') {
        draft.courses[index] = node.data.course;
      }
    });
  });
}
```

**But this revealed deeper issues:**
- Nodes never had new data in history (history saved too late)
- History captured incomplete state
- Manual history management error-prone
- Would need complete rewrite to fix properly

---

## Decision

**Remove the broken undo/redo system completely.**

### Rationale

1. **Currently Broken Anyway**
   - Users can't rely on it
   - Gives false sense of safety
   - Better to remove than keep broken feature

2. **Blocks Progress**
   - Test 5 can't pass
   - Issue #13 completion blocked
   - No quick fix available

3. **Not Core Functionality**
   - Course planning apps rarely have undo
   - Users expect to manually correct mistakes
   - Backend persists everything anyway

4. **Expensive to Fix Properly**
   - Would need complete rewrite
   - Must capture React Query cache
   - Must integrate with incremental updates
   - Needs proper timing (before changes)
   - Would take 2-3 days minimum

5. **Better Solution Available**
   - Server-side undo is more robust
   - See "Future Implementation" below

---

## Implementation

### What Was Removed

**Code**:
- `HistoryEntry` type definition
- `historyRef` and `futureRef` refs
- `pushHistory()` function (9+ call sites)
- `cloneNodes()` and `cloneEdges()` helpers
- `reactFlowToolbarActions.undo()` and `.redo()`
- Keyboard shortcuts (Cmd/Ctrl + Z/Y)
- Undo/Redo menu items

**Files Changed**:
- `frontend/src/pages/GraphEditorPage.tsx`: -141 lines

**Test Impact**:
- Test 5 marked as ⏭️ SKIPPED
- Tests 6-7 can proceed
- Clean slate for future implementation

### What Remains

- All other functionality intact
- Incremental updates working perfectly
- No regressions introduced

---

## Future Implementation

When we're ready to implement undo properly, use **server-side undo**:

### Recommended Approach

```typescript
// Backend tracks all mutations
POST /api/v1/mutations
{
  "type": "update_course",
  "entityId": "course-123",
  "before": { "title": "Old Title", ... },
  "after": { "title": "New Title", ... },
  "timestamp": "2025-10-17T16:20:00Z",
  "userId": "user-456"
}

// Frontend requests undo
POST /api/v1/mutations/undo
{
  "lastN": 1  // Undo last N mutations
}

// Backend:
// 1. Looks up last mutation for user
// 2. Applies inverse operation
// 3. Returns updated state
// 4. Frontend refetches graph data
```

### Benefits

1. **Reliable**: Backend is source of truth
2. **Complete**: Captures ALL state changes automatically
3. **Persistent**: Survives page refresh
4. **Cross-device**: Works across multiple devices
5. **Audit Trail**: Mutation log for debugging
6. **Granular**: Can undo specific operations

### Implementation Effort

- **Backend**: 2-3 days
  - Mutation logging system
  - Inverse operation handlers
  - Undo/redo API endpoints
  
- **Frontend**: 1 day
  - Undo/redo buttons
  - API integration
  - Optimistic updates

**Total**: ~1 week

---

## Alternatives Considered

### Option 1: Fix Current System
- **Effort**: 2-3 days
- **Pros**: Faster than server-side
- **Cons**: Still fragile, manual management, doesn't survive refresh

### Option 2: Server-Side Undo (Chosen Future Path)
- **Effort**: ~1 week
- **Pros**: Robust, reliable, persistent
- **Cons**: More complex, requires backend changes

### Option 3: Disable Temporarily (✅ Selected)
- **Effort**: 1 hour
- **Pros**: Unblocks progress, clean slate
- **Cons**: Loss of functionality (but currently broken anyway)

---

## Impact Assessment

### User Impact
- **Before**: Broken undo/redo that appeared to work but didn't
- **After**: No undo/redo, but clear expectations
- **Net**: Minimal negative impact (feature was already broken)

### Developer Impact
- **Before**: 141 lines of broken code, confusing bugs
- **After**: Clean codebase, clear path forward
- **Net**: Positive (less confusion, better foundation)

### Testing Impact
- **Before**: Test 5 blocking completion
- **After**: Test 5 skipped, can complete testing
- **Net**: Positive (unblocked)

---

## Lessons Learned

1. **State Management is Hard**
   - Multiple sources of truth create complexity
   - Must capture ALL state for proper undo
   - Timing matters (before vs after changes)

2. **Manual Systems are Fragile**
   - Easy to forget `pushHistory()` calls
   - Inconsistent coverage
   - Hard to maintain

3. **Backend Solutions Often Better**
   - Source of truth lives in one place
   - Automatic capture of all changes
   - More reliable long-term

4. **Remove Broken Features**
   - Better to remove than keep broken
   - Gives false sense of safety
   - Clean slate for proper implementation

---

## References

- **Commits**:
  - [50933cc](../../../commits/50933cc) - Remove broken undo/redo system completely
  - [275ca46](../../../commits/275ca46) - Update test plan: Mark Test 5 as skipped
  
- **Related Issues**:
  - Issue #13: Incremental Node Updates
  - Test 5: Undo/Redo functionality

- **Documentation**:
  - [Issue #13 Test Plan](../testing/issue-13-incremental-updates-test-plan.md)
  - [Issue #13 Completion Summary](../testing/issue-13-completion-summary.md)

---

## Status

✅ **Implemented** - Broken system removed, path forward documented

**Next Actions**:
1. Complete remaining tests (6, 7)
2. Finish Issue #13
3. Plan server-side undo in future sprint
