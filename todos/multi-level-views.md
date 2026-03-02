# Multi-Level Views

> **Priority:** P1 (Core MVP)
> **Effort:** Large
> **Status:** In Progress (foundation routes partial)
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

- [ ] Create `convex/workspaces.ts` → `getActiveSprints` query
- [ ] Create sprint overview component
- [ ] Create route file and sidebar link

### 3. Cross-Team Dependencies

Route: `/:orgSlug/workspaces/:workspaceSlug/dependencies`

- [ ] Query issues with cross-team blockedBy/blocks
- [ ] Create dependency visualization (react-flow)
- [ ] Add filtering by team/status/priority

### 4. Personal Board (@me)

Route: `/:orgSlug/my-issues`

- [ ] Extend dashboard with board view toggle
- [ ] Group by project or status

---

## Wiki Views

### 5. Workspace Wiki

Route: `/:orgSlug/workspaces/:workspaceSlug/wiki`

- [ ] Create route file (constant already defined)
- [ ] Filter documents by workspaceId
- [ ] Add sidebar link

### 6. Team Wiki

Route: `/:orgSlug/workspaces/:workspaceSlug/teams/:teamSlug/wiki`

- [ ] Add `teamId` to documents schema (blocker)
- [ ] Create route file
- [ ] Create team documents view

---

## Calendar Views

### 7. Organization Calendar

Route: `/:orgSlug/calendar`

- [ ] Add `organizationId` to calendarEvents (blocker)
- [ ] Aggregate events from all workspaces
- [ ] Color-code by workspace/team
- [ ] Add filtering controls

### 8. Workspace Calendar

Route: `/:orgSlug/workspaces/:workspaceSlug/calendar`

- [ ] Add `workspaceId` to calendarEvents (blocker)
- [ ] Filter events by workspaceId
- [ ] Add to workspace sidebar

### 9. Team Calendar

Route: `/:orgSlug/workspaces/:workspaceSlug/teams/:teamSlug/calendar`

- [ ] Add `teamId` to calendarEvents (blocker)
- [ ] Implement actual calendar (currently stub route exists: `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar.tsx`)
- [ ] Include project-level events

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
- [ ] `S2` Ship workspace backlog + workspace sprints routes with real queries
- [ ] `S3` Ship workspace wiki + team wiki data model/route support
- [ ] `S4` Replace team calendar stub with real data
- [ ] `S5` Add org/workspace/team calendar aggregation + filters

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
