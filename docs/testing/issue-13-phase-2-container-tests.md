# Issue #13 Phase 2: Container Incremental Updates - Test Plan

**Date**: October 17, 2025  
**Commit**: 3682dd5  
**Status**: Ready to Test

---

## 🎯 What We're Testing

Incremental node updates for container data changes (title, color/palette).

**Expected Behavior**:
- Container node updates **immediately** when you edit container data
- No visible delay or flicker
- No full graph rebuild for single container changes
- Console shows `[#13] Incremental update for container:` logs

---

## 📋 Test Scenarios

### Test 1: Container Title Update ⭐ PRIMARY TEST

**Setup**:
1. Open browser to http://localhost:5173
2. Navigate to any graph with containers
3. Open browser DevTools → Console tab
4. Select a container node

**Steps**:
1. In the container inspector panel, change the container **title**
2. Press Enter or click outside (form submit)
3. Watch the canvas

**Expected Results**:
- ✅ Container node updates **immediately** with new title
- ✅ No visible "rebuild" of other nodes
- ✅ Console log: `[#13] Incremental update for container: <id> { title: "..." }`
- ✅ No console errors
- ✅ Inspector closes after successful update

**What to Look For**:
- The container label should update **instantly** (no delay)
- Other nodes should NOT move or flicker
- The title should change smoothly

---

### Test 2: Container Color/Palette Update

**Steps**:
1. Select a container
2. Click on a different **color palette** option
3. Watch the container node

**Expected Results**:
- ✅ Container background color updates **immediately**
- ✅ Container border color updates immediately
- ✅ Console log: `[#13] Incremental update for container: <id> { palette_id: ..., color: "..." }`
- ✅ No full graph rebuild
- ✅ Visual preview in inspector updates

---

### Test 3: Multiple Rapid Changes

**Steps**:
1. Select a container
2. Change the title quickly
3. Immediately change the color
4. Repeat 2-3 times

**Expected Results**:
- ✅ All updates should work
- ✅ No race conditions
- ✅ No visual glitches
- ✅ Final state matches last changes

---

### Test 4: Container with Courses Inside

**Steps**:
1. Create or select a container with multiple courses inside
2. Change the container title
3. Watch both the container AND the courses inside

**Expected Results**:
- ✅ Container title updates
- ✅ Courses inside do NOT move or flicker
- ✅ Container size stays the same
- ✅ Only the container label changes

---

### Test 5: Resize Still Works

**Note**: Resize uses a different mechanism (not incremental updates)

**Steps**:
1. Select a container
2. Grab a resize handle (corner or edge)
3. Drag to resize
4. Release

**Expected Results**:
- ✅ Container resizes smoothly
- ✅ Size persists after release
- ✅ Backend saves new size (happens on debounce)
- ⚠️ This may trigger a rebuild (expected - different system)

---

## 🔍 Performance Check

**With Chrome DevTools**:
1. Open DevTools → Console
2. Edit a container title
3. Look for the incremental update log

**Expected Console Output**:
```
[#13] Incremental update for container: container-abc-123 { title: "New Title" }
```

**Should NOT see**:
- Full graph rebuild logs
- Multiple unnecessary re-renders
- Errors about undefined properties

---

## ✅ Success Criteria

**All tests pass if**:
- Container node updates are **instant** (< 50ms perceived delay)
- No visual glitches or flickering
- No console errors
- Courses inside containers don't move during container updates
- Performance matches course updates from Phase 1

---

## 📊 Test Results

**Tester**: [Your Name]  
**Date**: [Test Date]  
**Browser**: Chrome/Safari (macOS)  

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| 1. Title Update | ☐ | ☐ |  |
| 2. Color/Palette | ☐ | ☐ |  |
| 3. Rapid Changes | ☐ | ☐ |  |
| 4. With Courses Inside | ☐ | ☐ |  |
| 5. Resize Still Works | ☐ | ☐ |  |

**Overall Result**: ☐ PASS | ☐ FAIL | ☐ NEEDS FIXES

**Issues Found**:
```
[List any issues discovered during testing]
```

---

## 🐛 Known Limitations

1. **Resize Not Incremental**:
   - Container resize uses React Flow's built-in resize handlers
   - Updates the node's `style` property directly
   - Persisted via debounced `scheduleContainerPersistence()`
   - This is fine - resize works well and is not a performance issue

2. **Not Yet Implemented**:
   - Edge updates (still cause full rebuild if needed)
   - Prerequisite edge changes

---

## 📝 Next Steps After Testing

If tests pass:
1. ✅ Mark Phase 2 as complete
2. ✅ Update Issue #13 completion summary
3. ✅ Mark Issue #13 as fully complete
4. 🎉 Celebrate - then move to Issue #1 (Component Splitting)

If tests fail:
1. ❌ Document the issues
2. 🐛 Debug and fix
3. 🔄 Re-test
4. ✅ Once passing, mark complete

---

## 🔧 Debugging Tips

If updates don't work:

1. **Check Console**: Look for incremental update logs
2. **Verify Function**: Ensure `updateSingleContainer` is being called
3. **Check Props**: Verify prop is passed to ContainerSidePanel
4. **Add Logging**: 
   ```typescript
   console.log('Before update:', container.title);
   console.log('After update:', title);
   ```
5. **Check nodesMapRef**: 
   ```typescript
   console.log('Container node:', nodesMapRef.current.get(container.id));
   ```
