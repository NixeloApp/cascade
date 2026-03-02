# Sidebar Display Limits

**Status**: Active
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

- [ ] `S1` Add sidebar list search trigger when result set exceeds display cap
- [ ] `S1` Add explicit "Show all" affordance that routes to full list page

### Dependencies

- Final UX decision for where expanded list experience lives (sidebar modal vs dedicated route)

### Definition of Done

- Sidebar remains low-bandwidth by default while users can still access complete lists.
