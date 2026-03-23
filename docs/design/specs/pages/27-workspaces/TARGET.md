# Workspaces Page - Target State

> **Route**: `/:orgSlug/workspaces`

---

## Priority Improvements

| # | Improvement | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | Extract `WorkspaceCard` to `src/components/Workspaces/WorkspaceCard.tsx` | HIGH | 146-line inline component in a 305-line route file violates codebase organization patterns |
| 2 | Simplify WorkspaceCard to a single layout variant; remove dual compact/standard mode | HIGH | Two completely different page structures for "0-1 vs 2+" workspaces adds complexity without proportional UX benefit |
| 3 | Remove or rewrite OverviewBand coaching copy ("Structure teams before work gets scattered", "Keep ownership obvious before the org gets noisy") | MEDIUM | Copy reads as AI-generated motivational filler, not actionable information |
| 4 | Reduce information redundancy on WorkspaceCard (team count appears as badge AND metric panel AND metadata) | MEDIUM | The same number is displayed 3 times in different visual treatments |
| 5 | After workspace creation, navigate to workspace detail (overview tab) instead of teams list | LOW | The teams list for a brand-new workspace is always empty |
| 6 | Remove `className="h-12 w-12"` on IconCircle; use the size prop exclusively | LOW | Mixed sizing approaches create inconsistency |

---

## Not Planned

- **Workspace deletion from list page**: Deletion is a destructive admin action that belongs in workspace settings, not on the list view.
- **Workspace reordering / drag-and-drop**: Workspace order is not meaningful enough to warrant manual sorting.
- **Workspace-level analytics preview cards**: Analytics data on the list page would require expensive queries per workspace.
- **Search/filter**: With typically <10 workspaces per org, search adds complexity without value.

---

## Acceptance Criteria

- [ ] `WorkspaceCard` is a standalone component in `src/components/Workspaces/WorkspaceCard.tsx`
- [ ] Single card layout works for both 1-workspace and multi-workspace orgs (no dual layout)
- [ ] OverviewBand content is either removed or replaced with meaningful summary statistics
- [ ] Team count is shown in exactly one place on each card (metadata footer)
- [ ] Workspace creation navigates to the workspace overview/detail page
- [ ] No arbitrary `h-12 w-12` classNames on sized components
- [ ] Screenshots pass visual diff after changes (`pnpm screenshots -- --spec workspaces`)
