# Issues Page - Target

> **Last Updated**: 2026-03-23

---

## Priority Improvements

### 1. Server-side search (MEDIUM)

Current search is client-side — only filters the loaded page (20 items at a time).
A user searching for issue #50 won't find it until they click "Load More" twice.

**Target**: Add a `searchQuery` arg to `api.issues.listOrganizationIssues` that uses
the `search_title` search index. Client sends debounced query, server returns matching
results across the full dataset.

### 2. Advanced filter bar (MEDIUM)

Only status filtering exists today. Users need:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Search...  │ Status ▾ │ Priority ▾ │ Assignee ▾ │ Type ▾ │ Labels ▾│
└──────────────────────────────────────────────────────────────────────┘
```

**Target**: Use the `FilterBar` component pattern (already exists for other surfaces).
Each filter maps to a query arg. Saved filter presets are a follow-up.

### 3. Screenshot matrix expansion (LOW)

Add missing captures:
- Search active with results
- Search active with no results
- Status filter applied
- Create issue modal open
- Loading skeleton state

---

## Not Planned

- Drag-and-drop in the grid (this is a browser, not a board)
- Inline editing in the grid (editing happens in the detail panel)
- Board/Kanban view toggle (the board is at `/:slug/projects/:key/board`)
- Replacing the detail panel with full-page navigation

---

## Acceptance Criteria for Target State

- [ ] Searching "PROJ-50" finds the issue without needing to load more
- [ ] Filter bar shows status + priority + assignee + type + labels
- [ ] Filters are applied server-side (query args, not client-side JS)
- [ ] Screenshot matrix includes all listed missing captures
- [ ] No regressions in responsive grid behavior
