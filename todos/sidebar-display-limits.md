# Sidebar Display Limits

**Status**: Active
**Priority**: Medium (bandwidth optimization)

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
