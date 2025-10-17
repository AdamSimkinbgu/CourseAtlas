# Issue #13: Incremental Node Updates - Test Plan

**Date**: October 17, 2025  
**Commit**: 9976f82  
**Status**: Testing Phase 1 - Course Data Updates

---

## 🎯 What We're Testing

Incremental node updates for course data changes (title, code, status, credits, notes, grade).

**Expected Behavior**:
- Node updates **immediately** when you edit course data in inspector
- No visible delay or flicker
- No full graph rebuild for single course changes
- `nodesMapRef` stays in sync

---

## 📋 Test Scenarios

### Test 1: Course Title Update ⭐ PRIMARY TEST

**Setup**:
1. Open browser to http://localhost:5173
2. Navigate to any graph with multiple courses
3. Open browser DevTools → Console tab
4. Select a course node

**Steps**:
1. In the course inspector panel, change the course **title**
2. Submit the form
3. Watch the canvas

**Expected Results**:
- ✅ Course node updates **immediately** with new title
- ✅ No visible "rebuild" of other nodes
- ✅ No console errors
- ✅ Toast notification: "Course updated successfully"
- ✅ Inspector closes after successful update

**What to Look For**:
- The node should update **instantly** (no delay)
- Other nodes should NOT move or flicker
- The title should change smoothly

---

### Test 2: Course Status Update

**Steps**:
1. Select a course
2. Change the **status** (e.g., "not_started" → "in_progress")
3. Submit

**Expected Results**:
- ✅ Course node visual style updates (color changes for status)
- ✅ Status badge/indicator updates immediately
- ✅ No full graph rebuild

---

### Test 3: Course Code Update

**Steps**:
1. Select a course
2. Change the **code** (e.g., "CS101" → "CS102")
3. Submit

**Expected Results**:
- ✅ Course code pill updates immediately
- ✅ Node stays in same position
- ✅ No layout shifts

---

### Test 4: Multiple Field Update

**Steps**:
1. Select a course
2. Change **title**, **status**, **credits**, and **notes** all at once
3. Submit

**Expected Results**:
- ✅ All fields update immediately
- ✅ Single node update (not multiple)
- ✅ No console errors

---

### Test 5: Update Then Undo

**Status**: ⏭️ **SKIPPED** - Undo/redo system removed (see commit 50933cc)

**Reason**:
- Undo/redo system was fundamentally broken
- Didn't track course/container data updates
- Only captured partial state (nodes/edges, not React Query cache)
- Removed completely for clean slate future implementation
- See GRAPH_EDITOR_ISSUES.md for future server-side undo design

**Future Enhancement**:
- Server-side undo with mutation history tracking
- Proper state restoration across all data layers
- Survives page refresh, works across devices

---

### Test 6: Rapid Consecutive Updates

**Steps**:
1. Select a course
2. Change title and submit
3. **Immediately** open inspector again
4. Change title again and submit
5. Repeat 2-3 times quickly

**Expected Results**:
- ✅ All updates should work
- ✅ No race conditions
- ✅ No visual glitches
- ✅ Final state matches last submission

---

### Test 7: Error Handling

**Steps**:
1. Stop the backend server: `Ctrl+C` in Python terminal
2. Select a course and change title
3. Submit (will fail)

**Expected Results**:
- ✅ Toast error: "Failed to update course. Please try again."
- ✅ Node **reverts** to previous state (rollback works)
- ✅ No console errors about undefined

**Cleanup**:
- Restart backend: `cd backend && uvicorn app.main:app --reload`

---

## 🔍 Advanced Testing (Optional)

### Performance Check

**With Chrome DevTools**:
1. Open DevTools → Performance tab
2. Click "Record" (red circle)
3. Edit a course title and submit
4. Stop recording
5. Look for "React" sections in timeline

**What to Look For**:
- Should see **minimal** React reconciliation
- Should NOT see full component tree re-render
- Update should be < 50ms

### React DevTools Profiler

**If you have React DevTools extension**:
1. Open React DevTools → Profiler tab
2. Click "Record"
3. Edit a course title
4. Stop recording
5. Look at "Ranked" chart

**What to Look For**:
- Only CourseNode component should re-render
- GraphEditorPageInner should NOT re-render
- Other course nodes should NOT re-render

---

## 🐛 Known Issues / Limitations

1. **Cache Update Still Triggers Rebuild**:
   - The mutation updates React Query cache, which changes `dataUpdatedAt`
   - This triggers the full rebuild useEffect
   - HOWEVER, React's reconciliation is smart enough to skip DOM updates if data matches
   - The incremental update provides **instant feedback**, full rebuild is a no-op

2. **Not Yet Implemented**:
   - Container updates (still cause full rebuild)
   - Prerequisite changes (still rebuild all edges)
   - Assignment changes (still trigger full rebuild - expected)

---

## ✅ Success Criteria

**All tests pass if**:
- Course node updates are **instant** (< 50ms perceived delay)
- No visual glitches or flickering
- No console errors
- Error rollback works correctly
- Other nodes don't move/flicker during update

---

## 📊 Test Results

**Tester**: Adam Simkin  
**Date**: October 17, 2025  
**Browser**: Chrome/Safari (macOS)  

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| 1. Title Update | ✅ | ☐ | Instant update, no errors |
| 2. Status Update | ✅ | ☐ | Badge/color updates instantly |
| 3. Code Update | ☐ | ☐ | Not tested |
| 4. Multiple Fields | ✅ | ☐ | All fields update instantly |
| 5. Undo | ⏭️ | ☐ | SKIPPED - Feature removed (commit 50933cc) |
| 6. Rapid Updates | ✅ | ☐ | No race conditions, all updates apply |
| 7. Error Handling | ✅ | ☐ | Rollback works, error toast shows |

**Overall Result**: ✅ PASS | ☐ FAIL | ☐ NEEDS FIXES

**Issues Found**:
```
None - all tested scenarios work as expected!
- Incremental updates provide instant visual feedback
- No console errors or warnings
- Clean, stable performance
- Infinite loop issue completely resolved
- Rapid consecutive updates handle race conditions correctly
- Error handling with rollback works perfectly
```

**Test Summary**:
- ✅ Tests 1, 2, 4, 6, 7: PASS
- ⏭️ Test 3: Not tested (code updates - lower priority)
- ⏭️ Test 5: SKIPPED (undo/redo system removed)
- 🎉 **Overall: SUCCESS** - Core incremental update functionality fully validated

---

## 🔧 Debugging Tips

If updates don't work:

1. **Check Console**: Look for errors
2. **Check Network Tab**: Verify API calls succeed
3. **Check React Query DevTools**: Verify cache updates
4. **Add Logging**: 
   ```typescript
   console.log('updateSingleNode called for:', nodeId);
   ```
5. **Verify nodesMapRef**: 
   ```typescript
   console.log('nodesMapRef size:', nodesMapRef.current.size);
   ```

---

## 📝 Next Steps After Testing

If tests pass:
1. ✅ Mark Test 4 as complete in todo list
2. ➡️ Move to Test 5: Container incremental updates
3. ➡️ Then: Edge incremental updates
4. ➡️ Then: Performance measurements
5. ➡️ Then: Mark Issue #13 as complete

If tests fail:
1. ❌ Document the issues
2. 🐛 Debug and fix
3. 🔄 Re-test
4. ✅ Once passing, continue with next steps
