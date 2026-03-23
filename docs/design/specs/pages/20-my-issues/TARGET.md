# My Issues Page - Target

> **Last Updated**: 2026-03-23

---

## Priority Improvements

### ~~1. Server-side grouping~~ *(shipped)*

~~Grouping happens client-side on 100 items.~~ Server-side `getMyIssueGroupCounts` query returns complete counts across the full dataset. Column headers show "loaded / total" when not all issues are loaded.

### 2. Priority and date filters (LOW)

No filters beyond group-by. Adding priority and due date filters would help triage.

---

## Not Planned

- Board/Kanban view (this is a personal list, not a project board)
- Drag-and-drop between groups
- Cross-user views (always scoped to current user)

## Acceptance Criteria

- [x] Group counts reflect the full dataset, not just loaded page
- [ ] Priority filter narrows the visible set
