# 🧪 Quick Test Guide - Issue #13 Incremental Updates

## What You'll See in Console

When you edit a course title/status, you should see:

```
[#13] Incremental update for node: <course-id>
[#13] Full graph rebuild triggered
```

**This is CORRECT!** ✅

### Why Both Messages?

1. **First message** (`Incremental update`): 
   - Happens **immediately** when you submit the form
   - Updates just that one node
   - Provides instant visual feedback

2. **Second message** (`Full graph rebuild`):
   - Happens ~100ms later when React Query cache updates
   - Rebuilds all nodes from cache
   - But React is smart: if node data matches, it skips DOM update
   - You won't see any visual change

### What You Should SEE:

✅ **Node updates INSTANTLY** (no delay, no flicker)
✅ **Other nodes don't move or re-render**
✅ **Smooth, snappy experience**

### What You Should NOT See:

❌ **Delay before node updates**
❌ **Nodes flickering or jumping**
❌ **Whole graph re-rendering**

---

## Quick Test (30 seconds)

1. **Open**: http://localhost:5173
2. **Navigate**: To any graph with courses
3. **Open Console**: F12 → Console tab
4. **Select a course**: Click any course node
5. **Edit title**: Change "Introduction to CS" → "Intro to CS"
6. **Submit**: Click save/submit
7. **Watch**:
   - Console: Should see both messages ✅
   - Canvas: Node updates instantly ✅
   - Toast: "Course updated successfully" ✅

---

## Performance Comparison

### Before (#13):
```
User submits → Wait ~200ms → All nodes rebuild → See update
```

### After (#13):
```
User submits → Node updates INSTANTLY → (background: cache sync)
```

**Result**: Feels 200ms faster! 🚀

---

## Test Results Template

**Date**: Oct 17, 2025  
**Tester**: [Your name]

- [ ] ✅ Incremental update log appears
- [ ] ✅ Node updates instantly
- [ ] ✅ No visual glitches
- [ ] ✅ Console shows both messages (incremental + rebuild)
- [ ] ✅ Full rebuild happens but is invisible (React reconciliation)

**Notes**:
_______________________________________

---

## Next: Manual Testing Checklist

After confirming basic functionality works, run through:
- ✅ Test 1: Title update
- ✅ Test 2: Status update (watch color change)
- ✅ Test 3: Code update
- ✅ Test 4: Multiple fields at once
- ✅ Test 5: Rapid consecutive updates
- ✅ Test 6: Error handling (stop backend)

See full test plan: `docs/testing/issue-13-incremental-updates-test-plan.md`
