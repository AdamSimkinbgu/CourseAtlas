# Issue #11 Testing Plan: Loading States & Optimistic Updates

## Test Date: October 17, 2025
## Tester: AI Assistant
## Branch: phase-2

---

## 🎯 Test Objectives

Verify that all CRUD operations have:
1. Loading states with visual feedback (spinners)
2. Optimistic UI updates (immediate feedback)
3. Proper error handling with rollback
4. Toast notifications for success/error
5. Skeleton loaders during initial data load

---

## 📋 Test Cases

### 1. Initial Load - Skeleton Loader
**Status:** ⏳ Pending

**Steps:**
1. Open app in browser
2. Navigate to a graph
3. Observe loading behavior

**Expected:**
- [ ] GraphEditorSkeleton appears immediately
- [ ] Shows animated spinner with "Loading graph..." text
- [ ] Displays 3 preview course node skeletons
- [ ] Smooth transition from skeleton to real content
- [ ] No flash of empty content

**Actual:**
<!-- Fill in during testing -->

---

### 2. Course Creation - Optimistic Update
**Status:** ⏳ Pending

**Steps:**
1. Open "Graph actions" menu
2. Click "Add course"
3. Fill in form:
   - Code: TEST101
   - Title: Test Course
   - Credits: 3
4. Click "Create" button
5. Observe behavior

**Expected:**
- [ ] Button shows InlineSpinner while loading
- [ ] Button text changes to "Creating..."
- [ ] Button is disabled during operation
- [ ] Course appears in graph immediately (optimistic)
- [ ] Course has temp ID initially
- [ ] On success: temp course replaced with real course
- [ ] Success toast: "Course created successfully"
- [ ] Form closes automatically

**Error Case:**
- Disconnect network before clicking Create
- [ ] Course appears optimistically
- [ ] On error: course removed from graph (rollback)
- [ ] Error toast: "Failed to create course. Please try again."
- [ ] Form stays open for retry

**Actual:**
<!-- Fill in during testing -->

---

### 3. Course Update - Optimistic Update
**Status:** ⏳ Pending

**Steps:**
1. Select an existing course
2. Open course details panel
3. Modify course title to "Updated Title"
4. Click "Save changes" button
5. Observe behavior

**Expected:**
- [ ] Button shows InlineSpinner (16px) while loading
- [ ] Button text changes to "Saving..."
- [ ] Button is disabled during operation
- [ ] Course title updates in graph immediately (optimistic)
- [ ] On success: title persists
- [ ] Success toast appears
- [ ] Panel stays open

**Error Case:**
- Disconnect network before clicking Save
- [ ] Title updates optimistically in UI
- [ ] On error: title reverts to original (rollback)
- [ ] Error toast: "Failed to update course. Please try again."
- [ ] All form values restored to previous state

**Actual:**
<!-- Fill in during testing -->

---

### 4. Course Deletion - Optimistic Update
**Status:** ⏳ Pending

**Steps:**
1. Select a course
2. Open menu (→ button top-left)
3. Click "Delete course"
4. Observe behavior

**Expected:**
- [ ] Menu item text changes to "Deleting..." during operation
- [ ] Menu item disabled during deletion
- [ ] Course removed from graph immediately (optimistic)
- [ ] Edges connected to course also removed
- [ ] On success: deletion persists
- [ ] Success toast: "Deleted 1 item successfully"
- [ ] Menu closes automatically
- [ ] Inspector panel closes

**Error Case:**
- Disconnect network before deleting
- [ ] Course disappears optimistically
- [ ] On error: course reappears in exact position (rollback)
- [ ] All edges restored
- [ ] Error toast: "Failed to delete 1 item. Rolling back changes."

**Actual:**
<!-- Fill in during testing -->

---

### 5. Multi-Selection Deletion
**Status:** ⏳ Pending

**Steps:**
1. Select multiple courses (Shift + click)
2. Open menu
3. Click "Delete selection"
4. Observe behavior

**Expected:**
- [ ] Menu shows "Deleting..." during operation
- [ ] All selected courses removed immediately (optimistic)
- [ ] All edges between selected courses removed
- [ ] On success: "Deleted X items successfully"
- [ ] On partial failure: specific error message with count
- [ ] On complete failure: all courses restored (rollback)

**Actual:**
<!-- Fill in during testing -->

---

### 6. Container Deletion
**Status:** ⏳ Pending

**Steps:**
1. Create a container
2. Assign some courses to it
3. Select the container
4. Open menu → "Delete container"
5. Observe behavior

**Expected:**
- [ ] Menu shows "Deleting..." during operation
- [ ] Container removed immediately (optimistic)
- [ ] Course assignments cleared
- [ ] Courses remain in graph (just unassigned)
- [ ] Success toast appears
- [ ] On error: container restored with all assignments (rollback)

**Actual:**
<!-- Fill in during testing -->

---

### 7. Import/Export (Existing Loading States)
**Status:** ⏳ Pending

**Steps:**
1. Open "Graph actions"
2. Click "Export JSON"
3. Observe "Exporting..." state
4. Click "Import JSON"
5. Upload a file
6. Observe "Importing..." state

**Expected:**
- [ ] Buttons show appropriate loading text
- [ ] Buttons disabled during operations
- [ ] No double-click issues

**Actual:**
<!-- Fill in during testing -->

---

### 8. Network Simulation Tests
**Status:** ⏳ Pending

**Setup:**
- Open Chrome DevTools
- Network tab → Throttling → Slow 3G

**Tests:**
1. **Slow Initial Load**
   - Refresh page
   - [ ] Skeleton visible for extended time
   - [ ] No flash of unstyled content
   
2. **Slow Course Creation**
   - Create course on slow network
   - [ ] Spinner visible for several seconds
   - [ ] Optimistic update immediate
   - [ ] Real update completes eventually
   
3. **Slow Course Update**
   - Update course on slow network
   - [ ] Changes visible immediately
   - [ ] Spinner shows loading state
   
4. **Offline Error Handling**
   - Disconnect network (Offline mode)
   - Try to create course
   - [ ] Optimistic update shows
   - [ ] Error toast after timeout
   - [ ] Rollback works correctly

**Actual:**
<!-- Fill in during testing -->

---

### 9. Rapid Clicking Prevention
**Status:** ⏳ Pending

**Steps:**
1. Create a course
2. Rapidly click "Create" button multiple times before first completes
3. Observe behavior

**Expected:**
- [ ] Only one course created
- [ ] Button disabled prevents subsequent clicks
- [ ] Loading state clear throughout

**Repeat for:**
- [ ] Update operations
- [ ] Delete operations

**Actual:**
<!-- Fill in during testing -->

---

### 10. Loading State Consistency
**Status:** ⏳ Pending

**Verify loading states match across operations:**

| Operation | Loading Text | Spinner | Disabled Button | Success Toast | Error Toast |
|-----------|-------------|---------|----------------|---------------|-------------|
| Create Course | "Creating..." | ✓ | ✓ | ✓ | ✓ |
| Update Course | "Saving..." | ✓ | ✓ | ✓ | ✓ |
| Delete Course | "Deleting..." | N/A (menu) | ✓ | ✓ | ✓ |
| Delete Selection | "Deleting..." | N/A (menu) | ✓ | ✓ | ✓ |
| Delete Container | "Deleting..." | N/A (menu) | ✓ | ✓ | ✓ |
| Import | "Importing..." | N/A | ✓ | ✓ | ✓ |
| Export | "Exporting..." | N/A | ✓ | ✓ | ✓ |

**Actual:**
<!-- Fill in during testing -->

---

## 🐛 Bugs Found

### Bug #1
**Severity:** 
**Description:** 
**Steps to Reproduce:** 
**Expected:** 
**Actual:** 
**Status:** 

---

## ✅ Test Summary

**Total Test Cases:** 10  
**Passed:** 0  
**Failed:** 0  
**Blocked:** 0  
**Pending:** 10

**Pass Rate:** 0%

---

## 📝 Notes

<!-- Add any additional observations, edge cases discovered, or recommendations -->

---

## ✨ Recommendations

1. Consider adding progress indicators for multi-step operations
2. Add confirmation dialogs for destructive actions (deletion)
3. Consider adding undo functionality
4. Add keyboard shortcuts for common operations
5. Consider optimistic updates for prerequisite edges

---

## 🎯 Sign-off

**Issue #11 Status:** Pending Testing  
**Ready for Production:** ❌  
**Tester Signature:** _________________  
**Date:** _________________
