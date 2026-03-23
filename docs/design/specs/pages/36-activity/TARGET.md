# Activity Page - Target State

> **Route**: `/:slug/projects/:key/activity`
> **Goal**: Rich, filterable activity feed with pagination and linked issue references

---

## Planned Improvements

| # | Improvement | Notes |
|---|-------------|-------|
| 1 | Pagination / infinite scroll | "Load more" button or scroll-triggered pagination beyond the initial 50 entries |
| 2 | Clickable issue keys | Issue key text should link to `/:slug/issues/:issueKey` detail page |
| 3 | Filter by action type | Dropdown or toggle chips to filter by created, updated, commented, assigned, etc. |
| 4 | Filter by user | Select dropdown to scope the feed to a specific team member |
| 5 | Date range picker | Filter activity to a specific time window |
| 6 | User avatars | Show small avatar next to user name for quicker scanning |
| 7 | Group by date | Visual date separators ("Today", "Yesterday", "March 20") between entry clusters |

---

## Not Planned

- Real-time streaming of new entries via WebSocket push -- Convex's reactive queries
  already update the feed automatically when new activity occurs.
- Cross-project activity (org-wide) -- this is scoped to a single project by design;
  org-wide activity would be a separate page.

---

## Acceptance Criteria

- [ ] Feed supports "load more" or infinite scroll for projects with > 50 entries.
- [ ] Issue keys are clickable links that navigate to the issue detail page.
- [ ] At least one filter dimension (action type or user) is available.
- [ ] Date separators visually group entries by day.
- [ ] User avatars appear next to user names.
- [ ] Empty state still shows when filters produce no results.
- [ ] Loading state uses skeleton placeholders, not a spinner.
