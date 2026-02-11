# Multi-Level Views

> **Priority:** P1 (Core MVP)
> **Effort:** Large
> **Status:** Not Started

---

## Problem

Views (boards, wikis, calendars) only exist at Project level. Users need org/workspace/team level views for high-level overview.

---

## Schema Blockers

Before implementing calendar views, the schema needs updates:

- [ ] Add `organizationId` to `calendarEvents` table
- [ ] Add `workspaceId` to `calendarEvents` table
- [ ] Add `teamId` to `calendarEvents` table
- [ ] Add `teamId` to `documents` table (for team wiki)
- [ ] Add indexes for new fields

---

## Board Views

### 1. Workspace Backlog

Route: `/:orgSlug/workspaces/:workspaceSlug/backlog`

- [ ] Create `convex/workspaces.ts` → `getBacklogIssues` query
- [ ] Create route file `src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/backlog.tsx`
- [ ] Add sidebar link

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
- [ ] Implement actual calendar (currently stub)
- [ ] Include project-level events

---

## Related Files

- `src/config/routes.ts` - Route constants
- `convex/workspaces.ts` - Workspace queries
- `convex/documents.ts` - Document queries
- `convex/calendarEvents.ts` - Calendar queries
- `convex/schema.ts` - Database schema
