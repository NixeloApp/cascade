# List View - Deep UX Comparison

## Overview
The list view displays issues in a tabular format for dense information scanning. Plane offers List (grouped rows) and Spreadsheet (database table). Cascade currently uses card grids.

---

## Entry Points Comparison

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Tab selection** | "List" or "Spreadsheet" tab | N/A | Plane |
| **URL direct** | `/project/list` | N/A | Plane |
| **View toggle** | In display options | N/A | Plane |
| **All issues page** | Uses list layout | Uses card grid | Different |

---

## Layout Comparison

### Plane List View (Grouped Rows)
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Board] [List] [Calendar] [Spreadsheet] [Gantt]                     │
├─────────────────────────────────────────────────────────────────────┤
│ [Filters ▼] [Display ▼] [Group by: Status ▼]                       │
├─────────────────────────────────────────────────────────────────────┤
│ ▼ Backlog (5 issues)                                        [+]    │
├─────────────────────────────────────────────────────────────────────┤
│ ├─ PROJ-123  Fix auth bug        ● High   @user  [bug]     [⋮]    │
│ │  └─ PROJ-124  Sub-task 1       ● Med    @user            [⋮]    │ ← nested
│ ├─ PROJ-125  Add feature         ● Low    @user  [feat]    [⋮]    │
│ └─ PROJ-126  Refactor code       ● Med    @user            [⋮]    │
├─────────────────────────────────────────────────────────────────────┤
│ ▼ In Progress (3 issues)                                    [+]    │
├─────────────────────────────────────────────────────────────────────┤
│ ├─ PROJ-456  Update API          ● High   @user  [api]     [⋮]    │
│ └─ PROJ-457  Review PR           ● Med    @user            [⋮]    │
└─────────────────────────────────────────────────────────────────────┘
```

### Plane Spreadsheet View (Table)
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Board] [List] [Calendar] [Spreadsheet] [Gantt]                     │
├─────────────────────────────────────────────────────────────────────┤
│ [Filters ▼] [Columns ▼]                              [+ Add Issue]  │
├─────────────────────────────────────────────────────────────────────┤
│ ☐ │ Key      │ Title           │ Status    │ Priority │ Assignee  │
├───┼──────────┼─────────────────┼───────────┼──────────┼───────────┤
│ ☐ │ PROJ-123 │ Fix auth bug    │ [To Do ▼] │ [High ▼] │ [@usr ▼]  │
│ ☐ │ PROJ-124 │ Add feature     │ [To Do ▼] │ [Med ▼]  │ [@usr ▼]  │
│ ☐ │ PROJ-125 │ Update docs     │ [Done ▼]  │ [Low ▼]  │ [@usr ▼]  │
│ ☐ │ PROJ-126 │ Refactor        │ [In Prog] │ [Med ▼]  │ [@usr ▼]  │
│   │          │                 │    ↑ inline editing   │           │
├───┴──────────┴─────────────────┴───────────┴──────────┴───────────┤
│ [+ Add Issue]                                      Showing 1-20/45 │
└─────────────────────────────────────────────────────────────────────┘
```

### Cascade All Issues (Card Grid)
```
┌─────────────────────────────────────────────────────────────────────┐
│ All Issues                                        [Create Issue]    │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Search...] [Status: All ▼]                                      │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────┐│
│ │ 🐛 PROJ-123   │ │ 🔧 PROJ-456   │ │ 📖 PROJ-789   │ │ PROJ-012  ││
│ │ Fix auth bug  │ │ Add feature   │ │ Update docs   │ │ Refactor  ││
│ │ ● High        │ │ ● Medium      │ │ ● Low         │ │ ● Medium  ││
│ │ [bug] @user   │ │ [feat] @user  │ │ [docs] @user  │ │ @user     ││
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────┘│
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐              │
│ │ ...more cards │ │               │ │               │              │
│ └───────────────┘ └───────────────┘ └───────────────┘              │
│                                                                      │
│                        [Load More]                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Feature Comparison

### View Modes Available

| Mode | Plane | Cascade |
|------|-------|---------|
| **List (grouped rows)** | Yes | No |
| **Spreadsheet (table)** | Yes | No |
| **Card grid** | No | Yes |

### Row/Cell Features

| Feature | Plane List | Plane Spreadsheet | Cascade |
|---------|------------|-------------------|---------|
| **Grouping** | By any field | None (flat) | None |
| **Sub-issues** | Nested expand | None | None |
| **Inline editing** | Click property | Click any cell | None |
| **Bulk select** | No | Checkbox column | No |
| **Column selection** | Display props | Full column picker | N/A |
| **Drag-drop rows** | Yes | No | No |
| **Sorting** | By group | Click headers | None |
| **Pagination** | 50-100/page | 100/page | 20/page |

---

## Click Analysis

| Action | Plane List | Plane Spreadsheet | Cascade |
|--------|------------|-------------------|---------|
| **Change status** | 2 clicks (inline) | 2 clicks (cell) | 3+ clicks (open + change) |
| **Change priority** | 2 clicks (inline) | 2 clicks (cell) | 3+ clicks |
| **Assign user** | 2 clicks (inline) | 2 clicks (cell) | 3+ clicks |
| **Select multiple** | N/A | N clicks (checkboxes) | N/A |
| **Expand sub-issues** | 1 click | N/A | N/A |
| **Collapse group** | 1 click | N/A | N/A |
| **Create issue** | 2 clicks (+) | 2 clicks | 2 clicks |
| **Open issue** | 1 click | 1 click | 1 click |

---

## Information Density

| Metric | Plane List | Plane Spreadsheet | Cascade Cards |
|--------|------------|-------------------|---------------|
| **Issues visible** | ~15-20 | ~20-25 | ~8-12 |
| **Properties per row** | 5-8 | 10+ | 4-5 |
| **Vertical space** | Low (rows) | Lowest (table) | High (cards) |
| **Horizontal scroll** | No | Yes (columns) | No |

---

## Column Configuration

### Plane Spreadsheet Columns
```
Available columns:
☑ Key (always visible)
☑ Title (always visible)
☑ Status
☑ Priority
☑ Assignee
☐ Start Date
☑ Due Date
☐ Estimate
☑ Labels
☐ Cycle
☐ Module
☐ Created On
☐ Updated On
☐ Attachments
☐ Links
```

### Cascade (Fixed Properties)
```
Fixed on cards:
- Issue key
- Title
- Priority
- Type icon
- Labels
- Assignee
```

---

## Summary Scorecard

| Category | Plane List | Plane Spreadsheet | Cascade | Notes |
|----------|------------|-------------------|---------|-------|
| Information density | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | Table is densest |
| Grouping | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ | List has groups |
| Sub-issues | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ | List has nesting |
| Inline editing | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | Both Plane modes |
| Column config | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | Spreadsheet flexible |
| Bulk operations | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | Spreadsheet checkboxes |
| Responsive | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | Cards best |
| Visual appeal | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Cards more visual |
| Search | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | All have search |
| Load more | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane paginated |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Add table/list view** - Dense row-based display for power users
   ```tsx
   <IssuesTable columns={selectedColumns}>
     <TableRow issue={issue} onEdit={handleInlineEdit} />
   </IssuesTable>
   ```

### P1 - High
2. **Inline cell editing** - Click any cell to edit value
3. **Column selection** - Show/hide columns dynamically
4. **Header sorting** - Click column header to sort

### P2 - Medium
5. **Grouped list view** - Group by status, priority, assignee
6. **Sub-issue nesting** - Expand to show child issues
7. **Bulk selection** - Checkbox column with select all

### P3 - Nice to Have
8. **Column reordering** - Drag columns to rearrange
9. **Column resizing** - Drag to adjust width
10. **Fixed columns** - Keep key/title visible on scroll

---

## Code References

### Plane
- List layout: `apps/web/core/components/issues/issue-layouts/list/`
- Spreadsheet: `apps/web/core/components/issues/issue-layouts/spreadsheet/`
- Column components: `apps/web/core/components/issues/issue-layouts/spreadsheet/columns/`
- Row component: `apps/web/core/components/issues/issue-layouts/spreadsheet/issue-row.tsx`

### Cascade
- Issues page: `src/routes/_auth/_app/$orgSlug/issues/index.tsx`
- IssueCard: `src/components/IssueCard.tsx`
- Query: `convex/issues.ts` → `listOrganizationIssues`
