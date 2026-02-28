# Filters and Search

## Overview
Filtering and search capabilities help users find specific issues quickly. This includes quick filters (dropdowns), saved filter presets, full-text search, and advanced search with multiple criteria.

---

## cal.com
> **N/A** - cal.com is a scheduling platform and doesn't have issue tracking features.

---

## plane

### Trigger
- **Filter icon**: Click filter icon in header to open dropdown
- **Display button**: Opens display options panel
- **Search**: Global search via header or keyboard shortcut
- **URL**: Filter state persisted in URL parameters

### UI Elements

**Filter Toggle (WorkItemFiltersToggle)**
- Shows active filter count badge
- Opens filter panel

**Filter Panel (FiltersDropdown)**
- Display filters (layout, grouping, ordering, etc.)
- Property filters (state, priority, assignee, labels, dates)

**Display Filters**
| Filter | Options | Purpose |
|--------|---------|---------|
| Layout | List, Kanban, Calendar, Spreadsheet, Gantt | View mode |
| Group by | State, Priority, Labels, Assignee, etc. | Grouping |
| Order by | Manual, Created, Updated, Priority, etc. | Sorting |
| Issue type | Show subtasks toggle | Display control |
| Properties | Toggleable columns/cards | What to show |

**Property Filters**
| Filter | Type | Behavior |
|--------|------|----------|
| State | Multi-select | Filter by workflow state |
| Priority | Multi-select | Filter by priority level |
| Assignees | Multi-select | Filter by assigned users |
| Mentions | Multi-select | Filter by @mentions |
| Created by | Multi-select | Filter by creator |
| Labels | Multi-select | Filter by labels |
| Start date | Date range | Filter by start date |
| Target date | Date range | Filter by due date |
| Cycles | Multi-select | Filter by cycle |
| Modules | Multi-select | Filter by module |

### Flow
1. User clicks filter icon or Display button
2. Filter panel opens as dropdown
3. User selects filter values
4. Issues list updates immediately
5. URL updates with filter params
6. Active filters show in header
7. Click X to clear individual or all filters

### Feedback
- **Active count**: Badge shows number of active filters
- **Real-time**: Results update as filters change
- **URL sync**: Filters persist in URL for sharing

### Notable Features
- **URL persistence**: Share filtered views via URL
- **Layout-aware**: Different display options per layout
- **Property toggles**: Show/hide columns in spreadsheet
- **Quick actions**: Clear all or individual filters

---

## Cascade

### Trigger
- **FilterBar**: Always visible below header
- **Advanced Search**: Modal for complex searches
- **Command Palette**: Quick search access

### UI Elements

**FilterBar Component**

**Filter Dropdowns**
| Filter | Type | Behavior |
|--------|------|----------|
| Type | Multi-select checkbox | task, bug, story, epic |
| Priority | Multi-select checkbox | highest to lowest |
| Assignee | Multi-select checkbox | Project members |
| Labels | Multi-select checkbox | Project labels |

**Additional Features**
- Clear filters button (with count)
- Save Filter button
- Saved Filters dropdown

**Saved Filters System**
- Save current filter combination
- Name the filter
- Option to make public (shared with team)
- Load saved filters
- Delete owned filters

**AdvancedSearchModal**
| Section | Component | Notes |
|---------|-----------|-------|
| Search input | Text input | Min 2 chars to search |
| Type filter | Checkbox group | Multi-select |
| Priority filter | Checkbox group | Multi-select |
| Status filter | Checkbox group | Multi-select |
| Results list | Scrollable list | Paginated with "Load more" |

### Flow

**Filter Bar**
1. User clicks filter dropdown (Type, Priority, etc.)
2. Checkboxes show with current selections
3. User toggles options
4. Issues update immediately
5. Active count shows in button
6. User can save filter combination

**Advanced Search**
1. User opens advanced search modal
2. Types search query (min 2 chars)
3. Optionally selects filters
4. Results appear below
5. Click issue to navigate to it
6. Modal closes

### Feedback
- **Active styling**: Filter buttons highlight when active
- **Count badge**: Shows number of active per filter
- **Clear button**: Shows total active count
- **Success toast**: When saving/loading filters

### Code Structure
```typescript
// Filter interface
interface BoardFilters {
  type?: IssueType[];
  priority?: IssuePriority[];
  assigneeId?: Id<"users">[];
  labels?: string[];
}

// Search API
api.issues.search({
  query: string,
  limit: number,
  offset: number,
  type?: string[],
  priority?: string[],
  status?: string[]
})
```

### Notable Features
- **Saved filters**: Persist and share filter combinations
- **Public filters**: Team-shared filter presets
- **Server-side search**: Full-text search with Convex
- **Advanced search modal**: Dedicated complex search UI

---

## Comparison Table

| Aspect | cal.com | plane | Cascade | Best |
|--------|---------|-------|---------|------|
| Quick filters | N/A | ✅ Dropdown panel | ✅ Filter bar | tie |
| Multi-select filters | N/A | ✅ Yes | ✅ Yes | tie |
| State/Status filter | N/A | ✅ Yes | ✅ Yes | tie |
| Priority filter | N/A | ✅ Yes | ✅ Yes | tie |
| Assignee filter | N/A | ✅ Yes | ✅ Yes | tie |
| Labels filter | N/A | ✅ Yes | ✅ Yes | tie |
| Date range filter | N/A | ✅ Yes | ❌ No | plane |
| Cycle/Module filter | N/A | ✅ Yes | ⚠️ Sprint only | plane |
| Created by filter | N/A | ✅ Yes | ❌ No | plane |
| Mentions filter | N/A | ✅ Yes | ❌ No | plane |
| URL persistence | N/A | ✅ Yes | ❌ Unknown | plane |
| Saved filters | N/A | ⚠️ Unknown | ✅ Yes | Cascade |
| Public shared filters | N/A | ⚠️ Unknown | ✅ Yes | Cascade |
| Display options | N/A | ✅ Full panel | ⚠️ Limited | plane |
| Layout selection | N/A | ✅ 5 layouts | ⚠️ Unknown | plane |
| Group by | N/A | ✅ Yes | ⚠️ Limited | plane |
| Order by | N/A | ✅ Yes | ⚠️ Limited | plane |
| Property toggles | N/A | ✅ Yes | ❌ Unknown | plane |
| Full-text search | N/A | ✅ Yes | ✅ Yes | tie |
| Advanced search modal | N/A | ⚠️ Unknown | ✅ Yes | Cascade |
| Active filter count | N/A | ✅ Yes | ✅ Yes | tie |
| Clear all filters | N/A | ✅ Yes | ✅ Yes | tie |

---

## Recommendations

### Priority 1: Add Date Range Filters
Allow filtering issues by start date and due date ranges.

**Implementation:**
```typescript
interface BoardFilters {
  // ... existing
  startDateFrom?: number;
  startDateTo?: number;
  dueDateFrom?: number;
  dueDateTo?: number;
}
```

### Priority 2: URL Filter Persistence
Encode filter state in URL for shareable filtered views.

**Implementation:**
```typescript
// Encode filters to URL
const params = new URLSearchParams();
if (filters.type?.length) params.set('type', filters.type.join(','));
// etc.
history.replaceState(null, '', `?${params.toString()}`);

// Decode on mount
const urlParams = new URLSearchParams(window.location.search);
const initialFilters = {
  type: urlParams.get('type')?.split(','),
  // etc.
};
```

### Priority 3: Add Display/View Options
Allow users to:
- Toggle which properties show on cards/rows
- Choose grouping (by status, priority, assignee)
- Choose sorting (created, updated, priority)

### Priority 4: Add Created By Filter
Filter issues by who created them.

### Priority 5: Global Search Shortcut
Add `Cmd/Ctrl + K` to open search modal from anywhere.

### Priority 6: Add "Mentions" Filter
Filter to show issues where current user is @mentioned.

---

## Screenshots/References

### Plane Code Paths
- Filters Component: `~/Desktop/plane/apps/web/core/components/issues/filters.tsx`
- Display Filters: `~/Desktop/plane/apps/web/core/components/issues/issue-layouts/filters/`
- Filter Store: `~/Desktop/plane/apps/web/core/store/`

### Cascade Code Paths
- Filter Bar: `~/Desktop/cascade/src/components/FilterBar.tsx`
- Advanced Search: `~/Desktop/cascade/src/components/AdvancedSearchModal.tsx`
- Filter Checkboxes: `~/Desktop/cascade/src/components/AdvancedSearchModal/FilterCheckboxGroup.tsx`
- Search Results: `~/Desktop/cascade/src/components/AdvancedSearchModal/SearchResultsList.tsx`
- Saved Filters API: `~/Desktop/cascade/convex/savedFilters.ts`
- Search API: `~/Desktop/cascade/convex/issues.ts` (search function)
