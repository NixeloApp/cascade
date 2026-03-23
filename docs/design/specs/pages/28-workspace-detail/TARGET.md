# Workspace Detail Page - Target State

> **Route**: `/:orgSlug/workspaces/:workspaceSlug`

---

## Priority Improvements

| # | Improvement | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | Fix teams list to use a workspace-scoped query instead of org-wide `api.teams.getTeams` | CRITICAL | Current behavior shows teams from all workspaces, making the workspace boundary meaningless |
| 2 | Eliminate duplicate `getBySlug` queries -- pass workspace data from layout shell to child routes via context or route loader | HIGH | Every child route independently re-fetches the same workspace, wasting query bandwidth |
| 3 | Add sorting and filtering to backlog tab (by priority, status, project, assignee) | MEDIUM | Flat unsorted list is not actionable for triage |
| 4 | Add sprint progress indicators (issue completion percentage, days remaining) to sprints tab | MEDIUM | Current sprint cards show only issue count and end date with no progress context |
| 5 | Add a visual dependency graph (DAG) to the dependencies tab alongside the list view | MEDIUM | A flat list of "blocks" relationships does not convey dependency chains or critical paths |
| 6 | Replace `useEffect`-based redirect in `index.tsx` with TanStack Router `redirect` in route config | LOW | Framework-idiomatic approach is cleaner and avoids flash of empty content |
| 7 | Refactor settings form to use `useEffect` for initialization instead of conditional state setting inside render | LOW | Current `if (workspace && !initialized)` pattern is fragile and not idiomatic React |
| 8 | Add "Archive workspace" action to settings page | LOW | Currently there is no way to archive a workspace without backend intervention |
| 9 | Replace raw `div.card-subtle` in wiki tab with `Card` component for consistency | LOW | Wiki doc cards use custom CSS class instead of the standard Card primitive |

---

## Not Planned

- **Workspace-level issue creation**: Issues are created within projects, not directly at the workspace level. The backlog is a read-only aggregation view.
- **Workspace member management**: Membership is managed at the team level, not the workspace level.
- **Workspace-level notifications**: Notifications are scoped to projects and issues, not workspaces.
- **Cross-workspace views**: Viewing multiple workspaces simultaneously is the org-level pages' responsibility.

---

## Acceptance Criteria

- [ ] Teams tab shows only teams belonging to the current workspace (workspace-scoped query)
- [ ] Workspace data is fetched once in the layout shell and shared with child routes (no duplicate `getBySlug` calls)
- [ ] Backlog tab has at least priority and status filter dropdowns
- [ ] Sprint cards show a progress bar (completed / total issues) and days-remaining indicator
- [ ] Wiki tab uses `Card` component instead of raw `div.card-subtle`
- [ ] Settings page includes an "Archive workspace" action with confirmation dialog
- [ ] Index redirect uses TanStack Router `redirect` instead of `useEffect`
- [ ] Screenshots pass visual diff after changes (`pnpm screenshots -- --spec workspace-detail`)
