# Filters and Search - Deep UX Comparison

## Overview
Filtering and search capabilities help users find specific issues quickly. This analysis compares Plane vs Cascade across filter types, UI location, click efficiency, and advanced features.

---

## Filter Entry Points Comparison

### How Users Access Filters

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Filter toggle button** | Header icon with badge | Always visible filter bar | Cascade (no click needed) |
| **Display options** | Separate "Display" button | Integrated in filter bar | Plane (clearer separation) |
| **Global search** | Header search + `Cmd+K` | Search input in filter bar | Plane (has shortcut) |
| **URL parameters** | Full filter state in URL | Not implemented | Plane |
| **Saved filters** | Views system (separate) | Dropdown in filter bar | Cascade (easier access) |

---

## Filter Bar Layout

### Plane Filter UI
```
┌─────────────────────────────────────────────────────────────────────┐
│ Project Header                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ View Tabs: [List] [Kanban] [Calendar] [Spreadsheet] [Gantt]        │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Search...] [Filters (3)] [Display ▼] [+ Add Issue]             │
│                     ↓                                                │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Filters Panel (dropdown when clicked)                           │ │
│ │ ┌───────────┬───────────┬───────────┬───────────┬─────────────┐│ │
│ │ │ State     │ Priority  │ Assignees │ Labels    │ Due Date    ││ │
│ │ │ ☑ To Do   │ ☑ High    │ ☑ @user1  │ ☑ bug     │ From: [📅] ││ │
│ │ │ ☐ In Prog │ ☐ Medium  │ ☐ @user2  │ ☐ feature │ To: [📅]   ││ │
│ │ │ ☐ Done    │ ☐ Low     │ ...       │ ...       │             ││ │
│ │ └───────────┴───────────┴───────────┴───────────┴─────────────┘│ │
│ │                                                                  │ │
│ │ + More filters: Cycle, Module, Created By, Mentions, Start Date │ │
│ └──────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Cascade Filter Bar
```
┌─────────────────────────────────────────────────────────────────────┐
│ Project Header                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Always-visible filter bar:                                           │
│ ┌───────────────────────────────────────────────────────────────────┐
│ │ [🔍 Search...] │ [Type ▼] [Priority ▼] [Assignee ▼] [Labels ▼]  │
│ │                │                                                   │
│ │                │ [Due Date ▼] [Start Date ▼] [Created ▼]         │
│ │                │                                                   │
│ │                │ [Clear (5)] [Save Filter] [Saved Filters (3) ▼] │
│ └───────────────────────────────────────────────────────────────────┘
│                                                                      │
│ Issue List/Board                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Filter Types Comparison

### Property Filters

| Filter Type | Plane | Cascade | Notes |
|-------------|-------|---------|-------|
| **Status/State** | Multi-select | Multi-select | Both |
| **Type** | Via issue type filter | Multi-select dropdown | Both |
| **Priority** | Multi-select | Multi-select | Both |
| **Assignees** | Multi-select | Multi-select | Both |
| **Labels** | Multi-select | Multi-select | Both |
| **Created by** | Multi-select | Not in quick filters | Plane |
| **Mentions** | Multi-select | N/A | Plane |

### Date Filters

| Filter | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Due date range** | From/To picker | From/To picker | Both |
| **Start date range** | From/To picker | From/To picker | Both |
| **Created date range** | Unknown | From/To picker | Cascade |
| **Updated date** | Unknown | N/A | Unknown |

### Organization Filters

| Filter | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Cycle** | Multi-select | N/A | Plane |
| **Module** | Multi-select | N/A | Plane |
| **Sprint** | Via Cycle | Via board context | Different |

---

## Click Analysis

### Minimum Clicks to Apply Filters

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Open filter panel** | 1 click | 0 clicks (always visible) | **Cascade wins** |
| **Select status filter** | 2 clicks (open + select) | 2 clicks (dropdown + select) | Tie |
| **Select multiple statuses** | N clicks | N clicks | Tie |
| **Apply date range** | 3 clicks (open + from + to) | 3 clicks | Tie |
| **Clear single filter** | 1 click (X on tag) | 2 clicks (dropdown + uncheck) | Plane |
| **Clear all filters** | 1 click | 1 click | Tie |
| **Search text** | 1 click + type | 1 click + type | Tie |
| **Save filter** | 3+ clicks (view system) | 2 clicks (Save + name) | **Cascade wins** |
| **Load saved filter** | 2 clicks | 2 clicks | Tie |

### Filter Discovery Time

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Are filters visible?** | No, need to click toggle | Yes, always visible |
| **Filter count visible?** | Badge on toggle button | On each dropdown |
| **Active filters shown?** | Tags below filter bar | Highlighted buttons |

---

## Search Capabilities

### Search Features

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Inline search** | Header search box | Filter bar search |
| **Full-text search** | Title + description | Title + description |
| **Command palette** | `Cmd+K` global | Not implemented |
| **Search in modal** | N/A | AdvancedSearchModal |
| **Live results** | Debounced | Debounced |
| **Min characters** | Unknown | 2 characters |
| **Search history** | Unknown | N/A |

### Cascade AdvancedSearchModal
```
┌─────────────────────────────────────────────────────────────────────┐
│ Advanced Search                                                 [×] │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Search issues... (min 2 characters)]                           │
│                                                                      │
│ ┌─ Filters ────────────────────────────────────────────────────────┐│
│ │ Type:     ☑ Task  ☑ Bug  ☐ Story  ☐ Epic                       ││
│ │ Priority: ☐ Highest  ☐ High  ☑ Medium  ☐ Low  ☐ Lowest        ││
│ │ Status:   ☑ To Do  ☑ In Progress  ☐ Done                       ││
│ └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│ ┌─ Results (15 issues) ────────────────────────────────────────────┐│
│ │ PROJ-123  Fix login bug                          High   To Do   ││
│ │ PROJ-456  Update dashboard                       Medium In Prog ││
│ │ PROJ-789  Add dark mode                          Low    Done    ││
│ │ ...                                                              ││
│ │                                                                  ││
│ │ [Load More]                                                      ││
│ └──────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Saved Filters Comparison

### Save/Load Workflow

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Save location** | As "View" (separate feature) | In filter bar dropdown |
| **Naming** | View name | Filter name |
| **Sharing** | View sharing permissions | Public checkbox |
| **Delete** | View management | Inline delete button |
| **Count display** | In views sidebar | In dropdown header |

### Cascade Saved Filters
```
┌─────────────────────────────────────────────────────────────────────┐
│ Save Filter Dialog                                              [×] │
├─────────────────────────────────────────────────────────────────────┤
│ Filter Name:                                                         │
│ [High Priority Bugs                                      ]           │
│                                                                      │
│ ☑ Share with team (make public)                                     │
│                                                                      │
│                                    [Cancel] [Save]                   │
└─────────────────────────────────────────────────────────────────────┘

Saved Filters Dropdown:
┌─────────────────────────────────────┐
│ Saved Filters (3) ▼                 │
├─────────────────────────────────────┤
│ High Priority Bugs          [×]     │
│ My Assigned (public)        [×]     │
│ This Sprint                 [×]     │
└─────────────────────────────────────┘
```

---

## Display Options Comparison

### Layout & Grouping

| Option | Plane | Cascade |
|--------|-------|---------|
| **Layouts** | List, Kanban, Calendar, Spreadsheet, Gantt | Board, List (context) |
| **Group by** | State, Priority, Assignee, Labels, etc. | Not configurable |
| **Order by** | Manual, Created, Updated, Priority, etc. | Not configurable |
| **Properties** | Toggle which show on cards | Not configurable |

---

## Keyboard Support

| Shortcut | Plane | Cascade |
|----------|-------|---------|
| **Open search** | `Cmd+K` | N/A |
| **Focus search** | `/` | N/A |
| **Clear filters** | `Escape` (in filter) | N/A |
| **Navigate results** | Arrow keys | N/A |
| **Select result** | `Enter` | Click only |

---

## URL Persistence

### Plane URL Example
```
/project/issues?state=backlog,todo&priority=high,medium&assignee=user1
```

### Cascade
- No URL filter persistence currently
- Filters reset on navigation

---

## Accessibility

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Filter labels** | Via aria-labels | Label for search, htmlFor on dropdowns |
| **Keyboard navigation** | Full | Limited (tab through dropdowns) |
| **Screen reader** | Filter count announced | Active count in button text |
| **Focus management** | Returns to trigger | Standard |

---

## Mobile/Responsive

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Filter panel** | Full-width dropdown | Wraps to multiple rows |
| **Search** | Expands on focus | Fixed width (w-48) |
| **Saved filters** | In panel | Scrollable dropdown |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Filter visibility | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade always visible |
| Filter variety | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Plane has more types |
| Date filters | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both have ranges |
| Saved filters | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade easier UX |
| Keyboard support | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane has `Cmd+K` |
| URL persistence | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Display options | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane has more |
| Search features | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Both good |
| Click efficiency | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade no toggle needed |
| Advanced search | ⭐⭐⭐ | ⭐⭐⭐⭐ | Cascade has modal |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **URL filter persistence** - Enable sharing filtered views via URL
   ```typescript
   // Encode filters to URL params
   const params = new URLSearchParams();
   if (filters.type?.length) params.set('type', filters.type.join(','));
   if (filters.priority?.length) params.set('priority', filters.priority.join(','));
   // etc.
   ```

2. **Command palette search** - Add `Cmd+K` global shortcut

### P1 - High
3. **Created by filter** - Filter by issue creator
4. **Display options panel** - Group by, Order by configuration
5. **Filter tags** - Show active filters as removable tags

### P2 - Medium
6. **Mentions filter** - Filter issues where user is @mentioned
7. **Search keyboard navigation** - Arrow keys in results
8. **Filter presets** - Quick filters like "My Issues", "Unassigned"

### P3 - Nice to Have
9. **Search history** - Recent searches dropdown
10. **Filter analytics** - Track most-used filters

---

## Code References

### Plane
- Filters Row: `apps/web/core/components/work-item-filters/filters-row.tsx`
- Filters Toggle: `apps/web/core/components/work-item-filters/filters-toggle.tsx`
- Filter HOC: `apps/web/core/components/work-item-filters/filters-hoc/base.tsx`
- Filter Selection: `apps/web/core/components/views/filters/filter-selection.tsx`
- Applied Filters: `apps/web/core/components/views/applied-filters/root.tsx`

### Cascade
- Filter Bar: `src/components/FilterBar.tsx` (560 lines)
  - FilterDropdown component (reusable)
  - DateRangeDropdown component
  - SavedFiltersDropdown component
  - SaveFilterDialog component
- Advanced Search: `src/components/AdvancedSearchModal.tsx`
- Saved Filters API: `convex/savedFilters.ts`
- Issues Search: `convex/issues.ts` → `search` function

### Key Cascade Data Structures
```typescript
interface BoardFilters {
  query?: string;
  type?: Exclude<IssueType, "subtask">[];
  priority?: IssuePriority[];
  assigneeId?: Id<"users">[];
  labels?: string[];
  dueDate?: DateRangeFilter;
  startDate?: DateRangeFilter;
  createdAt?: DateRangeFilter;
}

interface DateRangeFilter {
  from?: string; // ISO date string
  to?: string;
}
```
