# Validator Strengthening

> **Priority:** P2
> **Status:** New
> **Last Updated:** 2026-03-19

## Goal

Make the 47 validators stricter and more comprehensive. Currently 9 are failing and 3 advisory-only validators report real issues but don't block.

## Current Validator Failures (9)

All caused by `MeetingsWorkspace.tsx` (55 of 75 violations) plus a handful elsewhere:

| Validator | Violations | Source |
|-----------|-----------|--------|
| Standards (AST) | 7 | MeetingsWorkspace.tsx (raw button, grid divs, className concat) |
| Raw Tailwind | 30 | MeetingsWorkspace.tsx |
| Surface shells | 2 | MeetingsWorkspace.tsx |
| Layout prop usage | 16 | MeetingsWorkspace.tsx |
| JSDoc coverage | 4 | Mixed files |
| Time constants | 11 | Magic time numbers |
| Weak assertions | 1 | Test file |
| Nested Cards | 2 | Mixed files |
| Border Radius | 2 | Mixed files |

## Advisory Validators That Should Block

These 3 validators reported real issues and have now been promoted after cleanup:

- [x] **Typography drift** (0 drift points) -- promoted from advisory to blocking
- [x] **Control chrome drift** (0 drift points) -- promoted from advisory to blocking
- [x] **Shared shape drift** (0 repeated shape groups) -- promoted from advisory to blocking

## Query/Filter Validator Gaps

The current `check-queries.js` catches 6 patterns (unbounded collect, N+1, take-before-filter, missing index, large take, sequential await) but misses **14 instances** of preventable anti-patterns:

### Backend: `.take()`/`.collect()` then JS `.filter()` (11 instances)

Filter logic that could be a Convex query filter or index but is applied in JS after fetching:

| File | Pattern | Fix |
|------|---------|-----|
| `convex/hourCompliance.ts:502-522` | `.take(1000)` then `.filter()` 5 times for counting | Use status index or pre-aggregate |
| `convex/hourCompliance.ts:462-466` | `.take(50)` then date range filter | Use `by_user_period` index |
| `convex/calendarEvents.ts:359` | `.take()` then filter by `projectId` | Extend index |
| `convex/calendarEvents.ts:518,652` | `.take()` then filter `status !== 'cancelled'` | Add query-level status filter |
| `convex/export.ts:312-322` | `.collect()` then filter by `sprintId` and `status` | Add to index |

### Client-side: React components filtering query results (3 instances)

Fetches all data then filters in the component when the filter could be a backend query arg:

| File | Pattern | Fix |
|------|---------|-----|
| `src/components/MentionInput.tsx:61-62` | `members?.filter(m => name.includes(search))` | Add `searchQuery` arg to backend |
| `src/components/Settings/OutOfOfficeSettings.tsx:70` | `users?.filter(u => u._id !== currentUser)` | Add `excludeUserId` arg |
| `src/components/Documents/DocumentTemplatesManager.tsx:208-209` | `templates?.filter(t => t.isBuiltIn)` split into two groups | Add `isBuiltIn` filter arg |

### New validator rules to add:

- [ ] **Post-fetch JS filter** -- detect `.take(N)` or `.collect()` result followed by `.filter((item) => item.field === value)` within 10 lines. Skip Convex filters `(q) => q.eq(...)`, `notDeleted`, and `.includes()` (can't express in Convex). Report as warning with "consider moving to query filter or index."
- [ ] **Client-side query filter** -- detect `useQuery(...)` result followed by `.filter()` in React components. Flag simple property checks that could be query args. Advisory level.
- [ ] **Multi-filter on same result** -- detect same variable filtered 2+ times in sequence. Suggest single pass or pre-aggregation.

## New Validators to Add (Non-Query)

- [ ] **Screenshot manifest integrity** -- fail if any hash appears more than 2 times (legitimate dual-write is max 2; 3+ means spinner capture)
- [ ] **`.catch(() => {})` audit** -- flag silent catch swallows in E2E and screenshot tooling (198 currently)
- [ ] **Hardcoded timeout audit** -- extend `check-e2e-hard-rules.js` to also scan `screenshot-pages.ts` for `waitForTimeout` and `setTimeout`
- [ ] **Meeting page coverage** -- verify meetings spec folder exists with screenshots (part of screenshot coverage validator)

## Existing Validator Improvements

- [ ] **Raw Tailwind validator** -- currently allows raw TW in route files; tighten to flag repeated patterns (same class cluster used 3+ times should become a component/variant)
- [ ] **E2E quality validator** -- remove the `screenshot-pages.ts` skip (tracked in screenshot-tooling-cleanup.md, but validator should enforce once cleanup is done)
- [ ] **Screenshot coverage validator** -- add meetings page to required spec list
- [ ] **Standards validator** -- ensure new pages like MeetingsWorkspace are caught immediately (currently it does, but violations persist -- need to fix the source)

## Ratchet Strategy

For advisory validators, implement a ratchet:
- [ ] Store current baseline counts in a config file
- [ ] Fail if count increases (new violations)
- [ ] Pass if count stays same or decreases (cleanup in progress)
- [ ] Remove ratchet once count hits zero

## Done When

- [ ] All 47+ validators pass with zero violations
- [ ] Advisory validators either block or use ratchet
- [ ] New validators for manifest integrity, catch swallows, timeout audit, and query/filter gaps
- [ ] Query filter validator catches backend post-fetch filtering and client-side filtering
- [ ] No validator skips without explicit TODO references
