# Bulk Actions

## Overview
Bulk actions allow users to select multiple issues and perform batch operations like updating status, priority, assignee, or deleting/archiving in one action.

---

## cal.com
> **N/A** - cal.com is a scheduling platform and doesn't have issue tracking features.

---

## plane

### Trigger
- **Checkbox**: Click checkbox on individual issue rows
- **Shift+Click**: Range selection (select all between two clicks)
- **Select All**: Header checkbox selects all visible issues

**Note**: In Plane's Community Edition (CE), bulk operations show an "Upgrade" banner - this is a paid feature in Plane.

### UI Elements

**Selection UI**
- Checkbox appears on hover for each issue row
- Header checkbox for "select all"
- Selected count badge

**Bulk Actions Bar**
- Appears at bottom when items selected (in paid version)
- Shows: "[N] selected" count
- Properties dropdowns inline
- Action buttons

**Available Actions (Paid)**
| Action | Component | Behavior |
|--------|-----------|----------|
| Update State | Dropdown | Changes state for all |
| Update Priority | Dropdown | Changes priority for all |
| Update Assignees | Multi-select | Changes assignees for all |
| Update Labels | Multi-select | Adds labels to all |
| Update Dates | Date picker | Sets dates for all |
| Move to Cycle | Dropdown | Assigns to cycle |
| Move to Module | Dropdown | Assigns to module |
| Archive | Button | Archives all |
| Delete | Button | Deletes all with confirm |

### Flow (Paid Version)
1. User hovers over issue row, checkbox appears
2. User clicks checkbox to select
3. Uses Shift+Click for range selection
4. Bulk action bar appears at bottom
5. User selects property to change or action
6. Changes apply immediately (or with confirmation for destructive)
7. Toast shows "Updated X issues"
8. Selection clears on completion

### Feedback
- **Selection**: Checkboxes show selected state
- **Loading**: Spinner on action buttons
- **Success**: Toast with count
- **Error**: Toast with error message

### Notable Features
- **Shift+Click range**: Select multiple in one click
- **Header select all**: Quick select all visible
- **Inline property changes**: Dropdowns right in the bar
- **Upgrade banner**: CE shows upgrade prompt

---

## Cascade

### Trigger
- **Checkbox**: Select individual issues (assumed, based on component)
- **Selection**: Uses `Set<Id<"issues">>` for selected IDs

### UI Elements

**Selection Bar (BulkOperationsBar)**
- Fixed at bottom of screen
- Shows: "[N] issue(s) selected"
- "Clear" link to deselect
- "Actions" toggle to expand

**Collapsed View**
- Selection count
- Archive button (with icon)
- Delete button

**Expanded View (Actions toggled)**
6-column grid of property selectors:

| Property | Type | Behavior |
|----------|------|----------|
| Status | Select dropdown | Updates status |
| Priority | Select dropdown | Updates priority |
| Assignee | Select dropdown | Updates assignee |
| Sprint | Select dropdown | Moves to sprint |
| Start Date | Date input + Clear | Sets/clears start date |
| Due Date | Date input + Clear | Sets/clears due date |

### Flow
1. User selects issues via checkboxes
2. Bulk operations bar slides up from bottom (animate-slide-up)
3. Shows count and basic actions
4. Click "Actions" to expand property selectors
5. Select a value from any dropdown
6. Operation executes immediately
7. Success/error toast shown
8. Selection cleared

### Feedback
- **Animation**: Slide-up animation when bar appears
- **Success**: Toast "Updated/Moved/Archived X issue(s)"
- **Error**: Toast with error context
- **Validation**: Shows error if operation fails (e.g., "Only completed issues can be archived")
- **Confirmation**: Dialogs for archive/delete

### Code Structure
```typescript
// Mutations available
bulkUpdateStatus({ issueIds, newStatus })
bulkUpdatePriority({ issueIds, priority })
bulkAssign({ issueIds, assigneeId })
bulkMoveToSprint({ issueIds, sprintId })
bulkArchive({ issueIds })
bulkDelete({ issueIds })
bulkUpdateStartDate({ issueIds, startDate })
bulkUpdateDueDate({ issueIds, dueDate })
```

### Notable Features
- **Comprehensive**: Covers all major properties
- **Dates**: Both start and due date bulk update
- **Clear options**: Can clear dates (set to null)
- **Archive validation**: Only archives completed issues
- **Confirmation dialogs**: For destructive actions

---

## Comparison Table

| Aspect | cal.com | plane | Cascade | Best |
|--------|---------|-------|---------|------|
| Checkbox selection | N/A | ✅ Yes | ✅ Yes | tie |
| Shift+Click range | N/A | ✅ Yes | ❌ Unknown | plane |
| Select all | N/A | ✅ Header checkbox | ❌ Unknown | plane |
| Action bar | N/A | ✅ Floating | ✅ Fixed bottom | tie |
| Update state/status | N/A | ✅ (Paid) | ✅ Yes | Cascade (free) |
| Update priority | N/A | ✅ (Paid) | ✅ Yes | Cascade (free) |
| Update assignee | N/A | ✅ (Paid) | ✅ Yes | Cascade (free) |
| Update labels | N/A | ✅ (Paid) | ❌ No | plane |
| Update dates | N/A | ✅ (Paid) | ✅ Yes | tie |
| Move to cycle/sprint | N/A | ✅ (Paid) | ✅ Sprint only | tie |
| Move to module | N/A | ✅ (Paid) | ❌ N/A | plane |
| Archive | N/A | ✅ (Paid) | ✅ Yes | Cascade (free) |
| Delete | N/A | ✅ (Paid) | ✅ Yes | Cascade (free) |
| Free tier | N/A | ❌ Paid only | ✅ Free | **Cascade** |
| Animation | N/A | ⚠️ Basic | ✅ Slide-up | Cascade |
| Confirmation dialogs | N/A | ✅ Yes | ✅ Yes | tie |
| Clear dates | N/A | ❌ Unknown | ✅ Yes | Cascade |

---

## Recommendations

### Priority 1: Add Shift+Click Range Selection
Enable selecting a range of issues by shift-clicking.

**Implementation:**
```tsx
const handleCheckboxClick = (issueId: Id<"issues">, event: React.MouseEvent) => {
  if (event.shiftKey && lastSelectedId) {
    // Select all issues between lastSelectedId and issueId
    const range = getIssueRange(lastSelectedId, issueId);
    setSelectedIssueIds(prev => new Set([...prev, ...range]));
  } else {
    toggleSelection(issueId);
  }
  setLastSelectedId(issueId);
};
```

### Priority 2: Add Select All Header Checkbox
Add a checkbox in the table/list header to select/deselect all visible issues.

### Priority 3: Add Bulk Label Update
Allow adding/removing labels from multiple issues at once.

**Mutations needed:**
```typescript
bulkAddLabels({ issueIds, labelIds })
bulkRemoveLabels({ issueIds, labelIds })
```

### Priority 4: Keyboard Shortcuts for Bulk Actions
- `Ctrl/Cmd + A` - Select all
- `Escape` - Clear selection
- `Delete` - Open delete confirmation
- `Shift + Arrow` - Extend selection

### Priority 5: Selection Persistence
Remember selection when:
- Switching between views (list/kanban)
- Paginating through issues
- After operations (for undo capability)

---

## Screenshots/References

### Plane Code Paths
- Bulk Root (CE): `~/Desktop/plane/apps/web/ce/components/issues/bulk-operations/root.tsx`
- Upgrade Banner: `~/Desktop/plane/apps/web/core/components/issues/bulk-operations/upgrade-banner.tsx`
- Selection Store: `~/Desktop/plane/apps/web/core/hooks/store/use-multiple-select-store.ts`

### Cascade Code Paths
- Bulk Bar: `~/Desktop/cascade/src/components/BulkOperationsBar.tsx`
- Mutations: `~/Desktop/cascade/convex/issues.ts` (bulkUpdateStatus, etc.)
- Tests: `~/Desktop/cascade/src/components/BulkOperationsBar.test.tsx`
