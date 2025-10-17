# P0 Critical Issues - Testing Checklist

**Date**: October 17, 2025  
**Branch**: `phase-2`  
**Status**: All 4 P0 issues resolved, ready for testing

---

## 📋 Overview

All P0 critical issues have been fixed and committed:

1. ✅ **Issue #3**: nodesMapRef synchronization (Commit: `88b0e6a`)
2. ✅ **Issue #5**: Toast notifications (Commit: `e59d6d6`)
3. ✅ **Issue #18**: Unmount cleanup (Commit: `a3f8b4c`)
4. ✅ **Issue #6**: Race conditions (Commit: `d4326a9`)

This document provides a comprehensive testing checklist to verify all fixes work correctly.

---

## 🧪 Test Environment Setup

### Prerequisites
- [ ] Frontend dev server running: `cd frontend && npm run dev`
- [ ] Backend dev server running: `cd backend && uvicorn app.main:app --reload`
- [ ] Browser: Chrome/Firefox (with DevTools open)
- [ ] Network tab open (to monitor API calls)
- [ ] Console tab open (to check for errors)

### Test Graph Setup
1. Navigate to graph editor: `http://localhost:5173/graphs/{graphId}`
2. Create test data:
   - [ ] 2-3 containers with different colors
   - [ ] 5-6 courses spread across containers
   - [ ] 2-3 unassigned courses
   - [ ] Some prerequisite relationships

---

## 🎯 Issue #3: nodesMapRef Synchronization

### Test Case 3.1: Container Creation
**What was fixed**: `nodesMapRef` now updates when creating containers

**Steps**:
1. Click "Create Container" button
2. Verify toast notification appears: "Container created successfully"
3. Drag the new container
4. Verify container moves smoothly without errors

**Expected**:
- ✅ Container appears immediately
- ✅ No console errors about undefined parent
- ✅ nodesMapRef contains new container

**To verify in console**:
```javascript
// This should not throw an error
window.nodesMapRef // Should show Map with all nodes
```

### Test Case 3.2: Container Assignment
**What was fixed**: `nodesMapRef` updates when assigning courses to containers

**Steps**:
1. Select a course node (click it)
2. In inspector, use "Move to Container" dropdown
3. Select a different container
4. Verify course moves to new container
5. Try dragging the course within new container

**Expected**:
- ✅ Course moves to new container immediately
- ✅ No console errors about parent lookup
- ✅ Course can be dragged within new container

### Test Case 3.3: Container Updates
**What was fixed**: `nodesMapRef` updates when modifying containers

**Steps**:
1. Select a container
2. Change title in inspector
3. Change color palette
4. Resize container by dragging corner
5. Drag a child course within the container

**Expected**:
- ✅ All updates persist correctly
- ✅ No console errors during updates
- ✅ Parent lookups work for child nodes

### Test Case 3.4: Undo/Redo Operations
**What was fixed**: `nodesMapRef` updates during undo/redo

**Steps**:
1. Create a new container
2. Press Ctrl/Cmd+Z to undo
3. Verify toast: "Undone"
4. Press Ctrl/Cmd+Shift+Z to redo
5. Verify toast: "Redone"
6. Try dragging nodes after undo/redo

**Expected**:
- ✅ Undo/redo work correctly
- ✅ Toast notifications appear
- ✅ No console errors after undo/redo
- ✅ All nodes draggable after state restoration

---

## 🔔 Issue #5: Toast Notifications

### Test Case 5.1: Success Notifications
**What was fixed**: User now sees feedback for successful operations

**Test all success scenarios**:
- [ ] **Container Creation**: Click "Create Container" → See green toast
- [ ] **Course Creation**: Click "Create Course" → See green toast
- [ ] **Course Update**: Edit course title → Save → See green toast
- [ ] **Deletion**: Select nodes → Delete → See toast with count
- [ ] **Export**: Click "Export" → See success toast
- [ ] **Import**: Import data → See success toast
- [ ] **Prerequisites**: Add/remove prerequisites → See success toast
- [ ] **Undo**: Press Ctrl/Cmd+Z → See subtle toast "Undone"
- [ ] **Redo**: Press Ctrl/Cmd+Shift+Z → See subtle toast "Redone"

**Expected**:
- ✅ Green/success colored toasts for positive actions
- ✅ Toasts appear in top-center position
- ✅ Toasts auto-dismiss after 3-4 seconds
- ✅ Undo/redo toasts are subtle (2s duration)

### Test Case 5.2: Error Notifications
**What was fixed**: Errors now shown to user instead of silent console.error

**Test error scenarios**:

**Simulate backend failure**:
1. Stop backend server
2. Try to:
   - [ ] Create a course → See red error toast
   - [ ] Update course position → See red error toast
   - [ ] Delete nodes → See red error toast
   - [ ] Add prerequisites → See red error toast

**Expected**:
- ✅ Red/error colored toasts for failures
- ✅ Clear error messages (not technical jargon)
- ✅ Longer duration (5s) for errors
- ✅ No alert() popups (replaced with toasts)

### Test Case 5.3: Validation Notifications
**What was fixed**: Form validation uses toasts instead of alert()

**Test validation**:
1. Open course inspector
2. Try to save with empty title → See error toast
3. Try to save with invalid data → See error toast
4. Create course with valid data → See success toast

**Expected**:
- ✅ Validation errors shown as red toasts
- ✅ No browser alert() popups
- ✅ Consistent styling with other toasts

### Test Case 5.4: Undo/Redo Boundaries
**What was fixed**: Clear feedback when no more actions available

**Test boundaries**:
1. Perform 2-3 actions
2. Press Ctrl/Cmd+Z multiple times until history empty
3. Verify toast: "No more actions to undo"
4. Press Ctrl/Cmd+Shift+Z until future empty
5. Verify toast: "No more actions to redo"

**Expected**:
- ✅ Boundary toasts appear
- ✅ No console errors when at boundaries
- ✅ Toasts are subtle (2s duration)

---

## 🧹 Issue #18: Unmount Cleanup

### Test Case 18.1: Pending Course Position Updates
**What was fixed**: Pending position updates now flushed on unmount

**Steps**:
1. Drag multiple courses to new positions
2. **Immediately** navigate away (within 500ms)
   - Click browser back button, OR
   - Navigate to different page
3. Wait 2 seconds
4. Navigate back to graph editor
5. Check if course positions were saved

**Expected**:
- ✅ All course positions saved correctly
- ✅ No data loss from pending updates
- ✅ Positions match where you dragged them

**To verify**:
- Check Network tab: Should see PATCH requests for course positions
- Check database: Positions should be updated

### Test Case 18.2: Pending Container Updates
**What was fixed**: Pending container updates flushed on unmount

**Steps**:
1. Drag a container with children to new position
2. **Immediately** close the tab (within 500ms)
3. Reopen the graph
4. Verify container and children positions saved

**Expected**:
- ✅ Container position saved
- ✅ Child course positions saved (relative to container)
- ✅ No visual glitches

### Test Case 18.3: Multiple Rapid Updates
**What was fixed**: All pending updates flushed, even with rapid changes

**Steps**:
1. Rapidly drag 5+ courses to different positions
2. Immediately navigate away (within 500ms)
3. Come back to graph
4. Verify ALL positions saved correctly

**Expected**:
- ✅ All 5+ positions saved
- ✅ No partial updates
- ✅ No lost changes

### Test Case 18.4: Timer Cleanup
**What was fixed**: Timers properly cleared on unmount

**Steps**:
1. Open DevTools → Memory tab
2. Open graph editor
3. Drag some nodes
4. Navigate away (before debounce fires)
5. Check for timer leaks

**Expected**:
- ✅ No memory leaks from timers
- ✅ coursePositionUpdateTimeoutRef cleared
- ✅ containerPersistTimeoutRef cleared

---

## 🏁 Issue #6: Race Conditions

### Test Case 6.1: Container Drag with Children
**What was fixed**: Container and children now update atomically

**Steps**:
1. Create a container with 3-4 child courses
2. Drag the container to a new position
3. Watch the children during and after drag
4. Release container
5. Wait for debounce (500ms)
6. Observe final positions

**Expected**:
- ✅ No visual glitches during drag
- ✅ Children move smoothly with container
- ✅ After debounce, children stay in correct relative positions
- ✅ No "jumping" of child nodes

**What was broken before**:
- Children would "jump" 200ms after container stopped
- Cache had new container position but stale child positions

### Test Case 6.2: Rapid Container Movements
**What was fixed**: Unified debounce prevents multiple competing timers

**Steps**:
1. Create container with children
2. Drag container rapidly in multiple directions
3. Move it 5-6 times quickly (within 2 seconds)
4. Release and wait 1 second
5. Verify final positions

**Expected**:
- ✅ Only ONE debounced update fires
- ✅ Children positions correct relative to final container position
- ✅ No stale updates from old timer callbacks
- ✅ Network tab shows single atomic update

### Test Case 6.3: Mixed Updates
**What was fixed**: Container and course updates no longer conflict

**Steps**:
1. Create container with children
2. Drag container to position A
3. Immediately drag a child course within container
4. Immediately drag container to position B
5. Wait 1 second for debounce
6. Verify positions

**Expected**:
- ✅ Both updates applied correctly
- ✅ Child position is relative to final container position
- ✅ No cache inconsistency
- ✅ Single atomic update in network tab

### Test Case 6.4: Cache Consistency
**What was fixed**: Cache always has consistent container + child positions

**Steps**:
1. Open React DevTools → Components
2. Find GraphEditorPage component
3. Monitor `detailQuery.data` in state
4. Drag container with children
5. Observe cache during and after drag

**Expected**:
- ✅ Cache updates atomically (both container + children together)
- ✅ No intermediate state with mismatched positions
- ✅ Container and children positions always in sync

**To verify manually**:
```javascript
// In console during testing
// Check cache state
queryClient.getQueryData(['graph', graphId])
// container.position and courses[].position should be consistent
```

---

## 🔍 Integration Testing

### Test Case INT-1: Full Workflow
**Test all fixes together in realistic scenario**

**Steps**:
1. **Setup**: Create 2 containers, 6 courses, 2 prerequisites
2. **Action 1**: Drag container with children (Issue #6)
   - Verify no visual glitches
3. **Action 2**: Create new course (Issue #5)
   - Verify success toast appears
4. **Action 3**: Undo course creation (Issue #3, #5)
   - Verify "Undone" toast
   - Verify nodesMapRef updated
5. **Action 4**: Redo course creation (Issue #3, #5)
   - Verify "Redone" toast
6. **Action 5**: Drag multiple courses (Issue #6, #18)
7. **Action 6**: **Immediately** navigate away (Issue #18)
   - Within 500ms debounce window
8. **Verify**: Come back, check all changes saved

**Expected**:
- ✅ All operations work smoothly
- ✅ Toast notifications appear for all actions
- ✅ No console errors throughout workflow
- ✅ All changes persisted correctly
- ✅ No data loss from unmount

### Test Case INT-2: Stress Test
**Test system under heavy load**

**Steps**:
1. Create large graph: 5 containers, 20 courses
2. Perform rapid operations:
   - Drag 5 nodes quickly
   - Create 3 courses
   - Delete 2 nodes
   - Undo 2 times
   - Redo 2 times
   - All within 5 seconds
3. Navigate away immediately
4. Come back and verify

**Expected**:
- ✅ No crashes or freezes
- ✅ All toasts appear (might queue)
- ✅ All changes saved correctly
- ✅ Performance remains acceptable

### Test Case INT-3: Error Recovery
**Test system handles errors gracefully**

**Steps**:
1. Start with backend running
2. Create container with courses
3. **Stop backend server**
4. Try to:
   - Update course title → See error toast
   - Drag nodes → See error toast
   - Delete nodes → See error toast
5. **Restart backend server**
6. Verify graph reloads correctly

**Expected**:
- ✅ Clear error messages via toasts
- ✅ No silent failures
- ✅ System recovers after backend restarts
- ✅ Pending changes can be retried

---

## ✅ Final Checklist

### Functionality
- [ ] All 4 P0 issues tested individually
- [ ] Integration tests pass
- [ ] Stress test passes
- [ ] Error recovery works

### User Experience
- [ ] Toast notifications appear for all operations
- [ ] No silent errors or data loss
- [ ] Undo/redo provides feedback
- [ ] Validation uses toasts not alerts

### Code Quality
- [ ] No console errors during normal operation
- [ ] No console warnings
- [ ] No memory leaks (check DevTools)
- [ ] Network requests look correct

### Performance
- [ ] Drag operations smooth (60fps)
- [ ] Toast notifications don't block UI
- [ ] Debounce timing feels responsive (500ms)
- [ ] No unnecessary re-renders

### Edge Cases
- [ ] Empty graph works
- [ ] Large graph (20+ nodes) works
- [ ] Rapid operations don't break
- [ ] Backend failures handled gracefully
- [ ] Unmount during debounce saves data

---

## 🐛 Known Limitations

After P0 fixes, these are **expected behaviors** (not bugs):

1. **Component Size**: GraphEditorPage is still 3,800+ lines (will fix in P1 #1)
2. **Full Rebuilds**: Graph rebuilds entirely on data change (will fix in P1 #13)
3. **No Loading States**: Mutations don't show loading indicators (will fix in P1 #11)
4. **Position System**: Still mixing absolute/relative coordinates (will fix in P1 #4)

---

## 📝 Bug Report Template

If you find issues during testing, use this template:

```markdown
## Bug: [Short Description]

**Related P0 Issue**: #[3, 5, 6, or 18]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:
- 

**Actual Behavior**:
- 

**Console Errors**:
```
[paste errors]
```

**Screenshots/Recording**:
[attach if possible]

**Environment**:
- Browser: 
- Frontend commit: 
- Backend status: 
```

---

## 🎉 Success Criteria

**P0 fixes are validated when**:

1. ✅ No data loss in any scenario
2. ✅ User sees feedback for every action
3. ✅ No visual glitches with container drag
4. ✅ No console errors during normal operation
5. ✅ All integration tests pass
6. ✅ Stress test doesn't crash

---

## 📊 Testing Results

**Date Tested**: _______________  
**Tested By**: _______________  
**Branch**: phase-2  
**Commit**: d4326a9

| Test Case | Status | Notes |
|-----------|--------|-------|
| 3.1: Container Creation | ⬜ | |
| 3.2: Container Assignment | ⬜ | |
| 3.3: Container Updates | ⬜ | |
| 3.4: Undo/Redo | ⬜ | |
| 5.1: Success Notifications | ⬜ | |
| 5.2: Error Notifications | ⬜ | |
| 5.3: Validation Notifications | ⬜ | |
| 5.4: Undo/Redo Boundaries | ⬜ | |
| 18.1: Pending Course Updates | ⬜ | |
| 18.2: Pending Container Updates | ⬜ | |
| 18.3: Multiple Rapid Updates | ⬜ | |
| 18.4: Timer Cleanup | ⬜ | |
| 6.1: Container Drag | ⬜ | |
| 6.2: Rapid Movements | ⬜ | |
| 6.3: Mixed Updates | ⬜ | |
| 6.4: Cache Consistency | ⬜ | |
| INT-1: Full Workflow | ⬜ | |
| INT-2: Stress Test | ⬜ | |
| INT-3: Error Recovery | ⬜ | |

**Overall Status**: ⬜ NOT STARTED / 🟡 IN PROGRESS / ✅ PASSED / ❌ FAILED

---

**Next Steps After Testing**:
- If all tests pass → Move to P1 issues
- If bugs found → Fix and retest
- Document any edge cases discovered
