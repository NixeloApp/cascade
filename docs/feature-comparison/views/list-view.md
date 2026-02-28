# List View

## Overview

The list view displays issues in a tabular or row-based format, offering dense information display and efficient scanning of many issues at once. plane offers two variants: List (grouped rows) and Spreadsheet (database-like table).

---

## plane

### List View

**File Locations**:
- Base: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/list/base-list-root.tsx`
- Rows: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/list/block.tsx`
- Groups: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/list/list-group.tsx`

**Layout Structure**:
```
BaseListRoot
├── IssueLayoutHOC
└── List
    └── ListGroup[] (per group value)
        ├── Group header (collapsible)
        ├── IssueBlock[] (rows)
        │   ├── Issue key + title
        │   ├── Properties (inline)
        │   └── Quick actions menu
        └── QuickAddIssueRoot
```

**Features**:
- Single grouping (by status, priority, assignee, etc.)
- Collapsible groups
- Drag-and-drop rows between groups
- Hierarchical sub-issues (expand/collapse)
- Nesting level indicators
- Inline property editing
- Display properties toggle
- 50-100 items per page (grouped/ungrouped)

### Spreadsheet View

**File Locations**:
- Base: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/spreadsheet/base-spreadsheet-root.tsx`
- Table: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/spreadsheet/spreadsheet-table.tsx`
- Rows: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/spreadsheet/issue-row.tsx`
- Columns: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/spreadsheet/columns/`

**Layout Structure**:
```
SpreadsheetView
├── SpreadsheetTable (HTML table)
│   ├── SpreadsheetHeader (column headers)
│   └── IssueRow[] (table rows)
│       ├── Checkbox (bulk select)
│       ├── Issue key + title
│       └── Column cells (editable)
└── SpreadsheetAddIssueButton
```

**Available Columns**:
- Assignee, Attachment, Created On, Cycle
- Due Date, Estimate, Label, Link
- Module, Priority, Start Date, State
- Sub-issue Count, Updated On

**Features**:
- No grouping (flat list)
- Dynamic column selection
- Inline cell editing per property type
- Bulk operations with checkboxes
- Column-specific components (dropdowns, date pickers, etc.)
- 100 items per page
- Conditional columns based on project settings

---

## Cascade

### Issues List (Card Grid)

**File Location**: `~/Desktop/cascade/src/routes/_auth/_app/$orgSlug/issues/index.tsx`

**Layout Structure**:
```
AllIssuesPage
├── PageHeader (title, Create Issue button)
├── Filter Bar (search + status dropdown)
├── Grid (responsive columns)
│   └── IssueCard[] (same as Kanban cards)
└── Load More button
```

**Features**:
- Responsive grid layout (1-4 columns based on screen width)
- Card-based display (not rows)
- Client-side search (title or key)
- Status filter dropdown
- Pagination with "Load More"
- 20 items initial load

**Data Query**: `api.issues.listOrganizationIssues`

### Missing List/Table View

Cascade does not have a true list or spreadsheet view. The issues page uses the same `IssueCard` component as the Kanban board, displayed in a grid layout rather than rows.

---

## Comparison Table

| Aspect | plane (List) | plane (Spreadsheet) | Cascade | Best |
|--------|--------------|---------------------|---------|------|
| Layout | Rows with grouping | Table columns | Card grid | plane |
| Grouping | Yes (single) | No | No | plane |
| Drag-drop | Yes | No | No | plane |
| Inline editing | Yes | Yes (all columns) | No | plane |
| Column selection | Display props | Yes | N/A | plane |
| Sub-issues | Hierarchical expand | No | No | plane |
| Bulk select | No | Yes (checkboxes) | No | plane |
| Search | Via filters | Via filters | Yes (client-side) | tie |
| Pagination | 50-100/page | 100/page | 20/page | plane |
| Responsive | Yes | Limited | Yes | Cascade |
| Dense display | Medium | High | Low (cards) | plane |

---

## Recommendations

1. **Priority 1**: Add spreadsheet/table view for issues
   - Column headers with sort
   - Inline editing per cell
   - Column visibility toggle
   - Fixed left column for issue key

2. **Priority 2**: Add list view with grouping
   - Group by status, priority, assignee, type
   - Collapsible group headers
   - Row-based display (denser than cards)

3. **Priority 3**: Add sub-issue hierarchy display
   - Expand/collapse sub-issues inline
   - Indentation for nesting levels

4. **Priority 4**: Add bulk selection with checkboxes
   - "Select All" in header
   - Bulk operations bar

5. **Priority 5**: Add column-based sorting
   - Click header to sort
   - Multiple sort criteria

---

## Implementation Suggestion

### Table Component Structure

```tsx
<IssuesTable>
  <TableHeader>
    <SelectAllCheckbox />
    <SortableColumn field="key">Key</SortableColumn>
    <SortableColumn field="title">Title</SortableColumn>
    <SortableColumn field="status">Status</SortableColumn>
    <SortableColumn field="priority">Priority</SortableColumn>
    <SortableColumn field="assignee">Assignee</SortableColumn>
    <SortableColumn field="dueDate">Due Date</SortableColumn>
  </TableHeader>
  <TableBody>
    {issues.map(issue => (
      <TableRow key={issue._id}>
        <Checkbox />
        <IssueKeyCell />
        <TitleCell editable />
        <StatusDropdown inline />
        <PriorityDropdown inline />
        <AssigneeSelect inline />
        <DatePicker inline />
      </TableRow>
    ))}
  </TableBody>
</IssuesTable>
```

### Column Visibility Config

```typescript
const columns = [
  { key: "key", label: "Key", alwaysVisible: true },
  { key: "title", label: "Title", alwaysVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "priority", label: "Priority", defaultVisible: true },
  { key: "assignee", label: "Assignee", defaultVisible: true },
  { key: "type", label: "Type", defaultVisible: false },
  { key: "labels", label: "Labels", defaultVisible: false },
  { key: "dueDate", label: "Due Date", defaultVisible: true },
  { key: "createdAt", label: "Created", defaultVisible: false },
  { key: "updatedAt", label: "Updated", defaultVisible: false },
];
```

---

## Screenshots/References

### plane
- List layout: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/list/`
- Spreadsheet: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/spreadsheet/`
- Column components: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/spreadsheet/columns/`

### Cascade
- Issues page: `~/Desktop/cascade/src/routes/_auth/_app/$orgSlug/issues/index.tsx`
- IssueCard: `~/Desktop/cascade/src/components/IssueCard.tsx`
