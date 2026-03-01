# Bulk Actions - Deep UX Comparison

## Overview
Bulk actions allow users to select multiple issues and perform batch operations. This analysis compares Plane vs Cascade across selection mechanisms, action UI, and click efficiency.

---

## Selection Mechanism Comparison

### How Users Select Issues

| Selection Method | Plane | Cascade | Winner |
|-----------------|-------|---------|--------|
| **Click checkbox** | On hover + click | Visible checkbox | Tie |
| **Shift+Click range** | Select between two issues | Not implemented | Plane |
| **Ctrl/Cmd+Click** | Toggle individual | Toggle individual | Tie |
| **Header "Select All"** | Checkbox in table header | Not implemented | Plane |
| **Keyboard `Ctrl+A`** | Select all visible | Not implemented | Plane |
| **Escape** | Clear selection | Not implemented | Plane |

**Selection Score:** Plane 4, Cascade 0, Tie 2

---

## Selection UI Layout

### Plane Selection UI
```
┌─────────────────────────────────────────────────────────────────────┐
│ List/Table Header                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ [☑] ← Header checkbox (select all)                                  │
│     [Title]        [Status]    [Priority]   [Assignee]              │
├─────────────────────────────────────────────────────────────────────┤
│ [☐] Issue Title 1  To Do       High         @user                   │
│ [☑] Issue Title 2  In Progress Medium       @user   ← Selected      │
│ [☑] Issue Title 3  Done        Low          @user   ← Selected      │
│ [☐] Issue Title 4  To Do       Medium       @user                   │
│     ↑                                                                │
│     Checkbox appears on hover                                        │
└─────────────────────────────────────────────────────────────────────┘

CE (Community Edition) - Shows upgrade banner:
┌─────────────────────────────────────────────────────────────────────┐
│ ⬆️ Upgrade to Plane Pro to use bulk operations                     │
│ [Learn more →]                                                       │
└─────────────────────────────────────────────────────────────────────┘

Pro/Enterprise - Full bulk actions bar (paid feature)
```

### Cascade Selection UI
```
┌─────────────────────────────────────────────────────────────────────┐
│ List/Table View                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ [☐] Issue Title 1  To Do       High         @user                   │
│ [☑] Issue Title 2  In Progress Medium       @user   ← Selected      │
│ [☑] Issue Title 3  Done        Low          @user   ← Selected      │
│ [☐] Issue Title 4  To Do       Medium       @user                   │
│     ↑                                                                │
│     Checkbox always visible                                          │
└─────────────────────────────────────────────────────────────────────┘

Fixed bottom bar appears when selection > 0:
┌─────────────────────────────────────────────────────────────────────┐
│ 2 issues selected [Clear]              [Actions ▼] [Archive][Delete]│
└─────────────────────────────────────────────────────────────────────┘

Expanded (after clicking "Actions"):
┌─────────────────────────────────────────────────────────────────────┐
│ 2 issues selected [Clear]              [Hide]      [Archive][Delete]│
├─────────────────────────────────────────────────────────────────────┤
│ Status         Priority       Assignee       Sprint                  │
│ [Select ▼]     [Select ▼]     [Select ▼]     [Select ▼]             │
│                                                                      │
│ Start Date                    Due Date                               │
│ [📅 input] [Clear]            [📅 input] [Clear]                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Action Bar Comparison

### Location & Appearance

| Aspect | Plane (Paid) | Cascade |
|--------|--------------|---------|
| **Position** | Bottom floating | Fixed bottom |
| **Animation** | Basic appear | Slide-up animation |
| **Z-index** | Above content | z-30 (above content) |
| **Width** | Full width | max-w-7xl centered |
| **Shadow** | Standard | shadow-elevated |
| **Border** | None | border-t |

### Actions Available

| Action | Plane (CE) | Plane (Pro) | Cascade |
|--------|------------|-------------|---------|
| **Update status** | ❌ Upgrade | Inline dropdown | Expandable dropdown |
| **Update priority** | ❌ Upgrade | Inline dropdown | Expandable dropdown |
| **Update assignee** | ❌ Upgrade | Multi-select | Single-select dropdown |
| **Update labels** | ❌ Upgrade | Multi-select | Not available |
| **Start date** | ❌ Upgrade | Date picker | Date input + Clear |
| **Due date** | ❌ Upgrade | Date picker | Date input + Clear |
| **Move to cycle** | ❌ Upgrade | Dropdown | N/A (sprint only) |
| **Move to sprint** | ❌ Upgrade | Dropdown | Dropdown + "Backlog" |
| **Move to module** | ❌ Upgrade | Dropdown | N/A |
| **Archive** | ❌ Upgrade | Button | Button + confirm |
| **Delete** | ❌ Upgrade | Button + confirm | Button + confirm |
| **Clear dates** | ❌ Upgrade | Unknown | Clear buttons |

---

## Click Analysis

### Minimum Clicks to Complete Bulk Actions

| Action | Plane (Pro) | Cascade | Notes |
|--------|-------------|---------|-------|
| **Select 1 issue** | 1 click | 1 click | Tie |
| **Select range (10 issues)** | 2 clicks (first + Shift+last) | 10 clicks | Plane wins |
| **Select all visible** | 1 click (header checkbox) | N clicks | Plane wins |
| **Clear selection** | 1 click (X) or Escape | 1 click (Clear link) | Tie |
| **Change status for all** | 2 clicks (dropdown → select) | 3 clicks (Actions → dropdown → select) | Plane wins |
| **Change priority for all** | 2 clicks | 3 clicks | Plane wins |
| **Delete all selected** | 3 clicks (button → confirm → yes) | 3 clicks | Tie |
| **Archive all selected** | 2-3 clicks | 3 clicks | Tie |
| **Set due date** | 2 clicks (picker → date) | 3 clicks (Actions → input → date) | Plane wins |
| **Clear due date** | Unknown | 3 clicks (Actions → Clear) | Cascade has clear |

---

## Keyboard Support

| Shortcut | Plane (Pro) | Cascade |
|----------|-------------|---------|
| **Ctrl/Cmd + A** | Select all visible | Not implemented |
| **Escape** | Clear selection | Not implemented |
| **Shift + Click** | Range selection | Not implemented |
| **Arrow keys** | Navigate while selected | Not implemented |
| **Delete key** | Trigger delete | Not implemented |

---

## State Management

### Plane (MobX Store)
```typescript
// MultipleSelectStore tracks:
- selectedEntityDetails: TEntityDetails[]
- lastSelectedEntityDetails: TEntityDetails | null  // For Shift+Click
- previousActiveEntity: TEntityDetails | null       // For keyboard nav
- nextActiveEntity: TEntityDetails | null
- activeEntityDetails: TEntityDetails | null

// Methods:
- getIsEntitySelected(entityID)
- bulkUpdateSelectedEntityDetails(entities, "add" | "remove")
- clearSelection()
```

### Cascade (React State)
```typescript
// Simple Set-based selection:
selectedIssueIds: Set<Id<"issues">>

// Props to BulkOperationsBar:
- projectId
- selectedIssueIds
- onClearSelection
- workflowStates
```

---

## Confirmation Dialogs

### Plane
```
┌─────────────────────────────────────────────────────────────────────┐
│ Delete Issues                                                   [×] │
├─────────────────────────────────────────────────────────────────────┤
│ Are you sure you want to delete 5 issues? This action              │
│ cannot be undone.                                                   │
│                                                                     │
│                                    [Cancel] [Delete]                │
└─────────────────────────────────────────────────────────────────────┘
```

### Cascade
```
┌─────────────────────────────────────────────────────────────────────┐
│ Delete Issues                                                   [×] │
├─────────────────────────────────────────────────────────────────────┤
│ Are you sure you want to delete 2 issues? This action              │
│ cannot be undone.                                                   │
│                                                                     │
│ variant="danger"                   [Cancel] [Delete]                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Archive Issues                                                  [×] │
├─────────────────────────────────────────────────────────────────────┤
│ Archive 2 issues? Only completed issues will be archived.          │
│ Archived issues can be restored later.                              │
│                                                                     │
│ variant="info"                     [Cancel] [Archive]               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Validation & Feedback

| Aspect | Plane (Pro) | Cascade |
|--------|-------------|---------|
| **Selection count** | "[N] selected" | "{N} issue(s) selected" |
| **Success toast** | "Updated X issues" | "Updated X issue(s)" |
| **Error toast** | Toast with error | showError with context |
| **Archive validation** | Unknown | "Only completed issues" |
| **Date validation** | Unknown | "Start date cannot be after due date" |
| **Loading state** | Spinner on buttons | No explicit loading |

---

## Accessibility

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Checkbox labels** | Via table row context | Accessible via ID |
| **Dropdown labels** | Standard select | `htmlFor` + `id` on each |
| **Keyboard navigation** | Full support | Limited |
| **Focus management** | Returns focus | Standard |
| **Screen reader** | Count announced | Count in Typography |

---

## Mobile/Responsive

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Action bar** | Stacks vertically | Responsive Grid (1→6 cols) |
| **Selection** | Touch-friendly | Touch-friendly |
| **Dropdowns** | Mobile-optimized | Standard Select |

---

## Summary Scorecard

| Category | Plane (CE) | Plane (Pro) | Cascade | Notes |
|----------|------------|-------------|---------|-------|
| Free tier | ⭐ | N/A | ⭐⭐⭐⭐⭐ | Cascade free, Plane paid |
| Selection methods | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane has Shift+Click |
| Select all | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | Plane has header checkbox |
| Click efficiency | N/A | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Cascade needs expand |
| Action variety | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Cascade missing labels |
| Date clearing | N/A | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade has clear buttons |
| Keyboard support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | Cascade needs shortcuts |
| Animation | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade slide-up |
| Validation | N/A | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade has better msgs |
| Confirmations | N/A | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both have dialogs |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Shift+Click range selection** - Essential for bulk selection efficiency
   ```tsx
   const handleCheckboxClick = (issueId, event) => {
     if (event.shiftKey && lastSelectedId) {
       const range = getIssueRange(lastSelectedId, issueId);
       setSelectedIssueIds(prev => new Set([...prev, ...range]));
     } else {
       toggleSelection(issueId);
     }
     setLastSelectedId(issueId);
   };
   ```

2. **Header "Select All" checkbox** - Quick select/deselect all visible

### P1 - High
3. **Keyboard shortcuts**
   - `Ctrl/Cmd + A` - Select all visible
   - `Escape` - Clear selection
   - `Delete` - Open delete confirmation

4. **Inline action dropdowns** - Show dropdowns directly without expanding
5. **Bulk label update** - Add/remove labels from multiple issues

### P2 - Medium
6. **Selection persistence** - Remember selection across view switches
7. **Undo bulk actions** - Toast with "Undo" for recoverable operations
8. **Progress indicator** - Show progress for large batch operations

### P3 - Nice to Have
9. **Saved selections** - Name and recall frequently used selections
10. **Bulk comment** - Add same comment to multiple issues

---

## Code References

### Plane
- CE Bulk Root: `apps/web/ce/components/issues/bulk-operations/root.tsx`
- Upgrade Banner: `apps/web/core/components/issues/bulk-operations/upgrade-banner.tsx`
- Selection Store: `apps/web/core/store/multiple_select.store.ts`
- Selection Hook: `apps/web/core/hooks/use-multiple-select.ts`
- Store Hook: `apps/web/core/hooks/store/use-multiple-select-store.ts`

### Cascade
- Bulk Bar: `src/components/BulkOperationsBar.tsx`
- Mutations:
  - `convex/issues.ts` → `bulkUpdateStatus`
  - `convex/issues.ts` → `bulkUpdatePriority`
  - `convex/issues.ts` → `bulkAssign`
  - `convex/issues.ts` → `bulkMoveToSprint`
  - `convex/issues.ts` → `bulkArchive`
  - `convex/issues.ts` → `bulkDelete`
  - `convex/issues.ts` → `bulkUpdateStartDate`
  - `convex/issues.ts` → `bulkUpdateDueDate`
