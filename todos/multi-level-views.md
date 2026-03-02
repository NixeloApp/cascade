# Multi-Level Views

> **Priority:** P1 (Core MVP)
> **Effort:** Large
> **Status:** Blocked (external package install required for final dependency graph)
> **Last Audited:** 2026-03-02

---

## Problem

Views (boards, wikis, calendars) only exist at Project level. Users need org/workspace/team level views for high-level overview.

---

## Schema Blockers

Before implementing calendar views, the schema needs updates:

- [x] Add `organizationId` to `calendarEvents` table
- [x] Add `workspaceId` to `calendarEvents` table
- [x] Add `teamId` to `calendarEvents` table
- [x] Add `teamId` to `documents` table (for team wiki)
- [x] Add indexes for new fields

---

## Board Views

### 1. Workspace Backlog

Route: `/:orgSlug/workspaces/:workspaceSlug/backlog`

- [x] Create `convex/workspaces.ts` → `getBacklogIssues` query
- [x] Create route file `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/backlog.tsx`
- [x] Add sidebar link

### 2. Workspace Sprints

Route: `/:orgSlug/workspaces/:workspaceSlug/sprints`

- [x] Create `convex/workspaces.ts` → `getActiveSprints` query
- [x] Create sprint overview component
- [x] Create route file and sidebar link

### 3. Cross-Team Dependencies

Route: `/:orgSlug/workspaces/:workspaceSlug/dependencies`

- [x] Query issues with cross-team blockedBy/blocks
- [ ] Create dependency visualization (react-flow)
- [x] Add filtering by team/status/priority

### 4. Personal Board (@me)

Route: `/:orgSlug/my-issues`

- [x] Extend dashboard with board view toggle
- [x] Group by project or status

---

## Wiki Views

### 5. Workspace Wiki

Route: `/:orgSlug/workspaces/:workspaceSlug/wiki`

- [x] Create route file (constant already defined)
- [x] Filter documents by workspaceId
- [x] Add sidebar link

### 6. Team Wiki

Route: `/:orgSlug/workspaces/:workspaceSlug/teams/:teamSlug/wiki`

- [x] Add `teamId` to documents schema (blocker)
- [x] Create route file
- [x] Create team documents view

---

## Calendar Views

### 7. Organization Calendar

Route: `/:orgSlug/calendar`

- [x] Add `organizationId` to calendarEvents (blocker)
- [x] Aggregate events from all workspaces
- [x] Color-code by workspace/team
- [x] Add filtering controls

### 8. Workspace Calendar

Route: `/:orgSlug/workspaces/:workspaceSlug/calendar`

- [x] Add `workspaceId` to calendarEvents (blocker)
- [x] Filter events by workspaceId
- [x] Add to workspace sidebar

### 9. Team Calendar

Route: `/:orgSlug/workspaces/:workspaceSlug/teams/:teamSlug/calendar`

- [x] Add `teamId` to calendarEvents (blocker)
- [x] Implement actual calendar (currently stub route exists: `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar.tsx`)
- [x] Include project-level events

---

## Related Files

- `src/config/routes.ts` - Route constants
- `convex/workspaces.ts` - Workspace queries
- `convex/documents.ts` - Document queries
- `convex/calendarEvents.ts` - Calendar queries
- `convex/schema.ts` - Database schema

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S1-S5`  
**Effort:** Large

### Milestones

- [x] `S1` Resolve schema blockers (`organizationId/workspaceId/teamId` + indexes)
- [x] `S2` Ship workspace backlog + workspace sprints routes with real queries
- [x] `S3` Ship workspace wiki + team wiki data model/route support
- [x] `S4` Replace team calendar stub with real data
- [x] `S5` Add org/workspace/team calendar aggregation + filters

### Dependencies

- Non-breaking data migration for existing `documents`/`calendarEvents`
- Sidebar/nav information architecture for new scope levels

### Definition of Done

- Users can manage backlog/wiki/calendar at workspace/team/org scope with production data.

---

## Progress Log

### 2026-03-02 - Batch A (completed S1 schema blockers)

- Decision:
  - complete the first unblocked milestone by adding scope fields + indexes before any route/UI work.
- Change:
  - updated `convex/schema.ts`:
    - `documents` now includes optional `teamId` and new `by_team` index.
    - `documents.search_title` now includes `teamId` in filter fields.
    - `calendarEvents` now includes optional `organizationId`, `workspaceId`, `teamId`.
    - added calendar indexes: `by_organization`, `by_workspace`, `by_team`.
    - `calendarEvents.search_title` now includes `organizationId/workspaceId/teamId` filter fields.
  - updated `convex/documents.ts`:
    - `create` mutation now accepts/persists optional `teamId`.
    - added team integrity validation (`organization/workspace consistency + membership/admin check`).
    - document access checks now enforce team membership for team-scoped docs (unless org admin).
  - updated `convex/calendarEvents.ts`:
    - create/update now derive and persist `organizationId/workspaceId/teamId` scope fields from project/issue context.
    - issue/project mismatch now fails validation for event create/update.
- Validation:
  - `pnpm test convex/calendarEvents.test.ts convex/documents.test.ts` => pass (`51 passed`)
  - `pnpm exec biome check convex/schema.ts convex/documents.ts convex/calendarEvents.ts` => pass (non-blocking complexity warning only in `canAccessDocument`)
- Blockers:
  - no hard blocker for `S2`; one non-blocking lint warning remains (`canAccessDocument` complexity 16 > 15).
- Next Step:
  - start `S2`: implement workspace backlog route/query (`workspaces.getBacklogIssues`) and wire the workspace navigation entry.

### 2026-03-02 - Batch B (completed workspace backlog slice of S2)

- Decision:
  - ship the first `S2` deliverable end-to-end (query + route + nav) before workspace sprints/dependencies.
- Change:
  - updated `convex/workspaces.ts`:
    - added `getBacklogIssues` (workspace-scoped query) returning unsprinted, non-deleted, non-`done` issues for the workspace.
  - updated shared routing:
    - added `ROUTES.workspaces.backlog` in `convex/shared/routes.ts`.
  - added route:
    - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/backlog.tsx`
    - renders workspace backlog cards with key/title/status/priority and empty-state handling.
  - updated workspace nav:
    - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/route.tsx` now includes a Backlog tab link.
- Validation:
  - `pnpm exec biome check convex/shared/routes.ts convex/workspaces.ts src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/route.tsx src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/backlog.tsx` => pass
  - `pnpm run typecheck` => pass
  - `pnpm test convex/workspaces.test.ts` => pass (`34 passed`)
- Blockers:
  - none for continuing `S2`.
- Next Step:
  - implement workspace sprints query/route and then evaluate whether `S2` milestone can be marked complete.

### 2026-03-02 - Batch C (completed workspace sprints slice and closed S2)

- Decision:
  - complete `S2` before moving to wiki/calendar scope by shipping workspace sprints in the same pattern as workspace backlog.
- Change:
  - updated `convex/workspaces.ts`:
    - added `getActiveSprints` workspace-scoped query aggregating active sprints across workspace projects with per-sprint issue counts.
  - updated shared routing:
    - added `ROUTES.workspaces.sprints` in `convex/shared/routes.ts`.
  - added route:
    - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/sprints.tsx`
    - renders active sprint overview cards (project context, sprint name, issue count, end date).
  - updated workspace nav:
    - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/route.tsx` now includes a Sprints tab link.
- Validation:
  - `pnpm exec biome check convex/shared/routes.ts convex/workspaces.ts src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/route.tsx src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/sprints.tsx` => pass
  - `pnpm run typecheck` => pass
  - `pnpm test convex/workspaces.test.ts` => pass (`34 passed`)
- Blockers:
  - none for `S3`.
- Next Step:
  - start `S3`: implement workspace wiki route/data filter, then team wiki route backed by `documents.teamId`.

### 2026-03-02 - Batch D (completed workspace/team wiki slice and closed S3)

- Decision:
  - close `S3` by shipping both workspace and team wiki routes on top of server-side scoped document queries.
- Change:
  - updated `convex/documents.ts`:
    - added `listByWorkspace` (workspace-scoped documents query).
    - added `listByTeam` (team-scoped documents query).
  - updated shared routes:
    - added `ROUTES.workspaces.teams.wiki` in `convex/shared/routes.ts`.
  - added routes:
    - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/wiki.tsx`
    - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/wiki.tsx`
  - updated navigation tabs:
    - workspace tabs now include `Wiki`.
    - team tabs now include `Wiki`.
- Validation:
  - `pnpm run typecheck` => pass
  - `pnpm test convex/documents.test.ts convex/workspaces.test.ts` => pass (`62 passed`)
  - `pnpm exec biome check convex/shared/routes.ts convex/documents.ts src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/route.tsx src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/wiki.tsx src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/route.tsx src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/wiki.tsx` => pass (non-blocking complexity warning in existing `canAccessDocument`)
- Blockers:
  - none for `S4`.
- Next Step:
  - implement real team calendar route data (replace stub) and then progress org/workspace/team calendar aggregation.

### 2026-03-02 - Batch E (completed S4 team calendar route with real scoped data)

- Decision:
  - implement team calendar with a dedicated backend query (team-member/org-admin authorized), rather than a client-only filter over personal events.
- Change:
  - updated `convex/calendarEvents.ts`:
    - added `listByTeamDateRange` query (team-scoped date-range events for team members and org admins).
    - deduplicated organizer enrichment via shared `enrichEventsWithOrganizers` helper.
  - updated `convex/calendarEvents.test.ts`:
    - added regression coverage for `listByTeamDateRange`:
      - team members can see team project calendar events.
      - non-team-members receive no events.
  - updated calendar UI wiring:
    - `src/components/Calendar/CalendarView.tsx` now supports `projectId` and `teamId` scope props and calls `listByTeamDateRange` for team scope.
    - `src/components/Calendar/ProjectCalendar.tsx` now passes `projectId` through to `CalendarView`.
  - replaced team calendar stub route:
    - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar.tsx` now resolves workspace/team and renders the real `CalendarView` with `teamId`.
- Validation:
  - `pnpm exec biome check convex/calendarEvents.ts convex/calendarEvents.test.ts src/components/Calendar/CalendarView.tsx src/components/Calendar/ProjectCalendar.tsx src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar.tsx` => pass
  - `pnpm run typecheck` => pass
  - `pnpm test convex/calendarEvents.test.ts` => pass
- Blockers:
  - none for starting `S5`.
- Next Step:
  - start `S5` by adding org/workspace-scoped calendar queries + routes with filter controls.

### 2026-03-02 - Batch F (partial S5: org/workspace calendar scope + filters)

- Decision:
  - implement scoped calendar aggregation with explicit backend queries first, then wire route-level filters for organization/workspace views.
- Change:
  - updated `convex/calendarEvents.ts`:
    - added `listByWorkspaceDateRange` (workspace scope, workspace-member/org-admin access, optional team filter).
    - added `listByOrganizationDateRange` (organization scope, organization-member access, optional workspace/team filters).
  - updated `src/components/Calendar/CalendarView.tsx`:
    - added scope props (`organizationId`, `workspaceId`, `teamId`, `projectId`) and query-source switching so calendar data is scope-driven.
  - added routes:
    - `src/routes/_auth/_app/$orgSlug/calendar.tsx` (organization calendar with workspace/team filters).
    - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/calendar.tsx` (workspace calendar with team filter).
  - updated navigation:
    - added `ROUTES.calendar` and `ROUTES.workspaces.calendar` in `convex/shared/routes.ts`.
    - switched sidebar “General” nav to organization calendar.
    - added workspace `Calendar` tab in workspace layout.
  - updated tests:
    - `convex/calendarEvents.test.ts` now covers workspace-scope visibility and organization workspace/team filters.
    - `src/config/routes.test.ts` now covers org/workspace calendar route constants.
- Validation:
  - `pnpm run generate:routes` => pass
  - `pnpm exec biome check convex/calendarEvents.ts convex/calendarEvents.test.ts convex/shared/routes.ts src/config/routes.test.ts src/components/App/AppSidebar.tsx src/components/Calendar/CalendarView.tsx src/routes/_auth/_app/$orgSlug/calendar.tsx src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/calendar.tsx src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/route.tsx src/routeTree.gen.ts` => pass
  - `pnpm run typecheck` => pass
  - `pnpm test convex/calendarEvents.test.ts src/config/routes.test.ts` => pass (`63 passed`)
- Blockers:
  - `S5` is not fully complete yet: workspace/team color-coding in organization calendar is still pending.
- Next Step:
  - finish `S5` by implementing deterministic workspace/team color-coding in org/workspace calendar rendering.

### 2026-03-02 - Batch G (completed S5 with deterministic scope color-coding)

- Decision:
  - complete `S5` by applying deterministic colors by scope ID (workspace/team) at render time in `CalendarView`, so grouped calendars remain visually distinct.
- Change:
  - updated `src/components/Calendar/CalendarView.tsx`:
    - added `colorByScope` prop (`workspace` or `team`).
    - added deterministic scope-color mapping (`scopeId` hash -> `PALETTE_COLORS`) and applies it to rendered events.
  - updated scope routes:
    - `src/routes/_auth/_app/$orgSlug/calendar.tsx` now selects color mode by active filter scope:
      - org-wide: color by workspace
      - workspace filtered: color by team
      - team filtered: no additional recolor
    - `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/calendar.tsx` colors by team when showing all teams.
- Validation:
  - `pnpm exec biome check --write src/components/Calendar/CalendarView.tsx src/routes/_auth/_app/$orgSlug/calendar.tsx src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/calendar.tsx` => pass
  - `pnpm run typecheck` => pass
  - `pnpm test convex/calendarEvents.test.ts src/config/routes.test.ts` => pass (`63 passed`)
- Blockers:
  - none for calendar milestones; `S5` is complete.
- Next Step:
  - continue remaining `multi-level-views` scope: cross-team dependencies route (`/:orgSlug/workspaces/:workspaceSlug/dependencies`) and personal board (`/:orgSlug/my-issues`).

### 2026-03-02 - Batch H (cross-team dependencies route + filters)

- Decision:
  - ship the dependencies route with real workspace data and filters first, using a list-based visualization as an intermediate step before a full `react-flow` graph.
- Change:
  - updated backend:
    - `convex/workspaces.ts` added `getCrossTeamDependencies` (workspace-scoped `blocks` links where source/target issues are in different teams), with optional filters: `teamId`, `status`, `priority`.
  - updated routing/navigation:
    - added `ROUTES.workspaces.dependencies` in `convex/shared/routes.ts`.
    - added route `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/dependencies.tsx`.
    - added `Dependencies` tab in workspace layout (`src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/route.tsx`).
  - updated tests:
    - `convex/workspaces.test.ts` now covers:
      - cross-team-only dependency extraction (same-team links excluded),
      - team/status/priority filtering behavior.
    - `src/config/routes.test.ts` now covers workspace dependencies route constant/build.
  - regenerated route tree:
    - `pnpm run generate:routes` updated `src/routeTree.gen.ts`.
- Validation:
  - `pnpm run generate:routes` => pass
  - `pnpm run typecheck` => pass
  - `pnpm test convex/workspaces.test.ts src/config/routes.test.ts` => pass (`73 passed`)
- Blockers:
  - `react-flow` graph visualization for dependencies is still pending (current UI is a filtered dependency list).
- Next Step:
  - complete the dependencies visualization requirement with a graph-based view, then implement Personal Board (`/:orgSlug/my-issues`).

### 2026-03-02 - Batch I (personal board route with grouping toggle)

- Decision:
  - implement Personal Board as a dedicated route (`/:orgSlug/my-issues`) with explicit grouping toggles, instead of overloading the existing dashboard page.
- Change:
  - updated routing/navigation:
    - added `ROUTES.myIssues` in `convex/shared/routes.ts`.
    - added route `src/routes/_auth/_app/$orgSlug/my-issues.tsx`.
    - added sidebar nav item `My Board` linking to `ROUTES.myIssues`.
  - added Personal Board behavior:
    - board columns group user-assigned issues by `status` or `project` via toggle.
    - uses paginated source `api.dashboard.getMyIssues` and supports `Load more`.
  - regenerated route tree:
    - `pnpm run generate:routes` updated `src/routeTree.gen.ts`.
  - updated tests:
    - `src/config/routes.test.ts` covers `ROUTES.myIssues`.
    - `src/components/App/AppSidebar.test.tsx` revalidated sidebar navigation behavior with new item.
- Validation:
  - `pnpm run generate:routes` => pass
  - `pnpm run typecheck` => pass
  - `pnpm test src/config/routes.test.ts src/components/App/AppSidebar.test.ts` => pass (`46 passed`)
- Blockers:
  - none for Personal Board scope.
- Next Step:
  - remaining `multi-level-views` blocker is the dependencies graph visualization requirement (`react-flow`) for cross-team dependencies.

### 2026-03-02 - Batch J (react-flow dependency visualization blocked)

- Decision:
  - attempt to unblock the remaining dependencies visualization task by installing `@xyflow/react` and replacing list-only view with graph rendering.
- Change:
  - attempted install command:
    - `pnpm add @xyflow/react`
  - no source-code visualization changes landed yet due package-install failure.
  - kept `my-issues` layout standards-compliant (`Flex`/`FlexItem`) after pre-commit restore.
- Validation / Blocker:
  - install failed with:
    - `ERR_PNPM_UNEXPECTED_STORE` (current repo links to `/home/mikhail/.local/share/pnpm/store/v10`, pnpm attempted `/home/mikhail/Desktop/cascade/.pnpm-store/v10`)
    - `ERR_PNPM_META_FETCH_FAIL` with DNS error `getaddrinfo EAI_AGAIN registry.npmjs.org`
  - blocker is environment/network-level; `react-flow` cannot be added until registry access is restored and/or store config is aligned.
- Next Step:
  - retry `@xyflow/react` install with aligned store dir once DNS/registry connectivity is restored, then implement graph visualization.

### 2026-03-02 - Batch K (retry with aligned store; still blocked)

- Decision:
  - keep this todo blocked; do not replace the `react-flow` requirement with a different visualization library.
- Change:
  - retried install with explicit store alignment:
    - `pnpm --store-dir /home/mikhail/.local/share/pnpm/store/v10 add @xyflow/react`
  - no source-code changes landed because dependency installation did not complete.
- Validation / Blocker:
  - install attempt still failed with npm registry DNS errors:
    - `ERR_PNPM_META_FETCH_FAIL`
    - `getaddrinfo EAI_AGAIN registry.npmjs.org`
  - repository state unchanged (`git status` clean).
- Next Step:
  - once DNS connectivity is restored, install `@xyflow/react`, implement the dependencies graph view, run typecheck + affected tests, and then close this todo.

### 2026-03-02 - Batch L (strict-order retry; blocker unchanged)

- Decision:
  - keep Priority `06` blocked; do not move off the `react-flow` dependency-graph requirement.
- Validation:
  - `pnpm test convex/workspaces.test.ts convex/calendarEvents.test.ts convex/documents.test.ts` => pass (`91 passed`)
  - retry install with aligned store still failed:
    - `pnpm --store-dir /home/mikhail/.local/share/pnpm/store/v10 add @xyflow/react`
    - `ERR_PNPM_META_FETCH_FAIL` / `getaddrinfo EAI_AGAIN registry.npmjs.org`
  - repository state remained unchanged after the failed install attempt.
- Blockers:
  - external npm registry DNS connectivity remains unavailable.
- Next Step:
  - once DNS connectivity is restored, install `@xyflow/react`, implement graph visualization for cross-team dependencies, run typecheck + affected tests, and close Priority `06`.
