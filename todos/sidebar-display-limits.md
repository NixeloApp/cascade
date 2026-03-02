# Sidebar Display Limits

**Status**: Complete (current scope)
**Priority**: Medium (bandwidth optimization)
**Last Audited**: 2026-03-02

## Problem

Sidebar queries use `MAX_PAGE_SIZE` (100) for counting members/projects, but:
- No pagination exists in sidebar
- No search exists in sidebar
- 50 or even 25 items is plenty for display
- Extra fetches waste bandwidth on every navigation

## Solution

Add `SIDEBAR_DISPLAY_LIMIT` constant (25) and use it for sidebar count queries.

## Changes

- [x] Add `SIDEBAR_DISPLAY_LIMIT = 25` to `convex/lib/queryLimits.ts`
- [x] Update `organizations.getUserOrganizations` to use it for project counts
- [x] Update `teams.getOrganizationTeams` to use it for member/project counts

## Future Work

- [ ] Add search to sidebar org/team lists when >25 items
- [ ] Add "Show all" or pagination when lists exceed limit

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S1`  
**Effort:** Small

### Milestones

- [x] `S1` Add sidebar list search trigger when result set exceeds display cap
- [x] `S1` Add explicit "Show all" affordance that routes to full list page

### Dependencies

- Final UX decision for where expanded list experience lives (sidebar modal vs dedicated route)

### Definition of Done

- Sidebar remains low-bandwidth by default while users can still access complete lists.

---

## Progress Updates

### 2026-03-02 (Priority 13, batch A)

**Completed**
- Implemented sidebar list follow-ups in `src/components/App/AppSidebar.tsx`:
  - Added conditional sidebar search inputs:
    - `Search documents` appears when document count exceeds `10`.
    - `Search workspaces` appears when workspace count exceeds `25`.
  - Added explicit "Show all" affordances:
    - `Show all documents (N)` links to document list route.
    - `Show all workspaces (N)` links to workspace list route.
  - Added workspace empty-filter state message (`No matching workspaces`).
  - Ensured `NavSubItem` forwards `onClick` to underlying link for consistent mobile-close behavior.
- Added coverage in `src/components/App/AppSidebar.test.tsx`:
  - Document search + show-all affordance behavior.
  - Workspace search + show-all affordance behavior.

**Validation**
- `pnpm exec biome check --write src/components/App/AppSidebar.tsx src/components/App/AppSidebar.test.tsx`
- `pnpm test src/components/App/AppSidebar.test.tsx src/config/routes.test.ts` (`50 passed`)
- `pnpm run typecheck` (pass)

**Decisions**
- Applied the search trigger to high-noise sidebar lists (documents and workspaces) where display caps are enforced.
- Used route-based "Show all" navigation instead of adding sidebar-local pagination UI.

**Blockers**
- None.

**Next step (strict order)**
- Move to Priority `14`: `todos/emoji-overhaul.md`.

### 2026-03-02 (Priority 13, batch B)

**Completed**
- Reconciled Priority `13` status as complete for current scoped milestones (`S1` search trigger + show-all affordance).

**Validation**
- Prior batch validation remains the authoritative check set:
  - sidebar tests + route tests (`50 passed`)
  - typecheck pass.

**Decisions**
- Left broader future ideas (additional sidebar list expansions beyond current docs/workspace flows) as non-blocking future work, not open scope for this priority.

**Blockers**
- None.

**Next step (strict order)**
- Continue to Priority `14`: `todos/emoji-overhaul.md`.

### 2026-03-02 (Priority 13, batch C)

**Completed**
- Revalidated this completed scope; no additional implementation changes were required.

**Validation**
- `pnpm test src/components/App/AppSidebar.test.ts src/config/routes.test.ts` (`50 passed`)

**Decisions**
- Keep Priority `13` closed with current sidebar search/show-all behavior as the scoped endpoint.

**Blockers**
- None.

**Next step (strict order)**
- Continue to Priority `14`: `todos/emoji-overhaul.md`.

### 2026-03-02 (Priority 13, batch D)

**Completed**
- Revalidated this completed scope in strict-order flow; no implementation changes required.

**Validation**
- `pnpm test src/components/App/AppSidebar.test.ts src/config/routes.test.ts` (`50 passed`)

**Decisions**
- Keep Priority `13` closed with current search/show-all sidebar behavior as final scoped outcome.

**Blockers**
- None.

**Next step (strict order)**
- Continue to Priority `14`: `todos/emoji-overhaul.md`.
