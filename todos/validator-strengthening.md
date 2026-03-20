# Validator Strengthening

> **Priority:** P2
> **Status:** In Progress
> **Last Updated:** 2026-03-20

## Goal

Make the validator suite stricter and more comprehensive, then retire the temporary ratchets and debt baselines as cleanup lands.

## Query/Filter Validator Gaps

The ratchets exist, but the underlying query/filter debt still needs to be removed from product code.

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

## Existing Validator Improvements

- [ ] Ensure the standards validator keeps catching new page-level violations early, without relying on follow-up todo cleanup
- [ ] Add validator coverage for primitive restyling drift -- repeated size/radius/chrome/color overrides on owned controls should be treated as missing variants or misuse
- [ ] Add validator coverage for degenerate CVAs -- base-only CVAs, single-use feature CVAs, and local variant wrappers that should be plain components or shared primitives
- [ ] Ratchet raw Tailwind downward, not just flat -- the baseline should shrink as cleanup lands instead of only blocking regressions

## Ratchet Strategy

For advisory validators, keep the ratchet only as long as cleanup is still in flight.
- [ ] Remove ratchet once count hits zero

## Done When

- [ ] All 47+ validators pass with zero violations
- [ ] Baselined query/filter debt is removed from product code so the ratchets can be deleted
- [ ] No validator skips without explicit TODO references
- [ ] Styling/CVA validators are strict enough that screenshot-driven cleanup does not regress on the next pass
