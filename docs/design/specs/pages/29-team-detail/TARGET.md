# Team Detail Page - Target State

> **Route**: `/:orgSlug/workspaces/:workspaceSlug/teams/:teamSlug`

---

## Priority Improvements

| # | Improvement | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | Implement team settings: team name, description, icon, member management (add/remove/role), and archive/delete | HIGH | Settings tab is a non-functional placeholder; team configuration is a core need |
| 2 | Add a team members section (either as a tab or a visible sidebar/header element) | HIGH | There is no way to see who is on the team from the team detail page |
| 3 | Rename "Projects" tab to "Board" to match the actual content | MEDIUM | "Projects" implies a project list, but the tab shows the Kanban board |
| 4 | Eliminate duplicate workspace/team queries by passing resolved data from layout shell via context | MEDIUM | Each child route independently re-fetches workspace + team |
| 5 | Extract shared wiki card component used by both workspace wiki and team wiki | MEDIUM | Identical markup is duplicated across two files |
| 6 | Replace `useEffect` redirect in `index.tsx` with TanStack Router `redirect` | LOW | Framework-idiomatic routing avoids flash of empty content |
| 7 | Replace inline SVG in settings placeholder with an icon from `@/lib/icons` | LOW | Consistency with the rest of the codebase |
| 8 | Add document creation action to wiki tab (e.g., "New Doc" button) | LOW | Currently users must navigate elsewhere to create team-scoped documents |

---

## Not Planned

- **Team-level analytics**: Analytics live on the org analytics page. Per-team metrics would require a new backend query and are not part of the current roadmap.
- **Team chat / messaging**: Real-time messaging is a separate feature. Team communication is out of scope for this page.
- **Team-level sprints view**: Sprints are managed at the project level. The workspace-level sprint aggregation covers cross-team sprint visibility.
- **Backlog view for team**: The backlog is a workspace-level concept. Teams work through project boards, not team-level backlogs.

---

## Acceptance Criteria

### Settings Implementation

- [ ] Team settings form includes: name, description, icon picker
- [ ] Member management: list current members with roles, add member by email, remove member, change role
- [ ] "Archive team" action with confirmation dialog
- [ ] Settings mutations require team lead or admin role; non-leads see read-only view

### Navigation Fixes

- [ ] "Projects" tab is renamed to "Board"
- [ ] Index redirect uses TanStack Router `redirect` instead of `useEffect`

### Code Quality

- [ ] Shared `WikiDocCard` component extracted and used by both workspace wiki and team wiki
- [ ] Workspace + team data shared from layout shell (no duplicate queries in child routes)
- [ ] Settings placeholder SVG replaced with icon from `@/lib/icons`

### Visual

- [ ] Team member avatars visible in the page header or as a dedicated section
- [ ] Wiki tab has a "New Doc" action button
- [ ] Screenshots pass visual diff after changes (`pnpm screenshots -- --spec team-detail`)
