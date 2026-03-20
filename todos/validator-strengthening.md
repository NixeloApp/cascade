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

- [x] **Post-fetch JS filter** -- ratcheted in `check-queries.js` for backend `.take()` / `.collect()` / `safeCollect()` results followed by JS `.filter()` (41 baselined across 18 files)
- [x] **Client-side query filter** -- ratcheted in `check-queries.js` for query-hook results filtered in React components/routes (13 baselined across 11 files)
- [x] **Multi-filter on same result** -- ratcheted in `check-queries.js` for repeated `.filter()` passes on the same fetched/query result variable (9 baselined groups across 8 files)

## New Validators to Add (Non-Query)

- [x] **Screenshot manifest integrity** -- fail if any hash appears more than 2 times (legitimate dual-write is max 2; 3+ means spinner capture)
- [x] **`.catch(() => {})` audit** -- ratcheted for E2E and screenshot tooling (225 baselined across 10 files)
- [x] **Hardcoded timeout audit** -- extend `check-e2e-hard-rules.js` to ratchet `screenshot-pages.ts` timeout debt (7 `waitForTimeout`, 1 Promise sleep baselined) while keeping spec-file timeouts fully blocking
- [x] **Meeting page coverage** -- `check-screenshot-coverage.js` now requires the meetings spec folder and canonical screenshots

## Existing Validator Improvements

- [x] **Raw Tailwind validator** -- now ratchets repeated raw route-level `className` clusters in `check-raw-tailwind.js` (3 baselined route clusters at `3x+` reuse)
- [x] **E2E quality validator** -- removed the `screenshot-pages.ts` skip and ratcheted its current quality debt in `check-e2e-quality.js` (58 baselined harness issues)
- [x] **Screenshot coverage validator** -- meetings added to the required page-spec list in `check-screenshot-coverage.js`
- [ ] **Standards validator** -- ensure new pages like MeetingsWorkspace are caught immediately (currently it does, but violations persist -- need to fix the source)

## Ratchet Strategy

For advisory validators, implement a ratchet:
- [x] Store current baseline counts in a config file -- ratcheted validators now read baseline JSON from `scripts/ci/`
- [x] Fail if count increases (new violations) -- shared ratchet helper now enforces count overages deterministically
- [x] Pass if count stays same or decreases (cleanup in progress) -- shared ratchet helper preserves cleanup-in-progress behavior across count-based validators
- [ ] Remove ratchet once count hits zero

## Done When

- [ ] All 47+ validators pass with zero violations
- [ ] Advisory validators either block or use ratchet
- [ ] New validators for manifest integrity, catch swallows, timeout audit, and query/filter gaps
- [ ] Query filter validator catches backend post-fetch filtering and client-side filtering
- [ ] No validator skips without explicit TODO references
