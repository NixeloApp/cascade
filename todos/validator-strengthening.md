# Validator Strengthening

> **Priority:** P2
> **Status:** In Progress
> **Last Updated:** 2026-03-20

## Goal

Make the validator suite stricter and more comprehensive, then retire the temporary ratchets and debt baselines as cleanup lands.
The validator suite itself now also needs a facelift: it has grown into a large monolithic registry with inconsistent ratchet/audit conventions and too much suite structure encoded inline.

## Validator Suite Facelift

The validators are useful, but the suite itself is becoming harder to reason about:

- `scripts/validate.js` is a long ordered registry with policy and grouping embedded inline
- ratchet / baseline / audit behavior is inconsistent across checks
- blocking vs informational checks are not structurally obvious enough
- validator authoring conventions are implicit instead of documented
- multiple checks re-implement similar repo-scan / ratchet / reporting patterns

- [ ] Extract the validator registry into a clearer config structure instead of one long inline array in `scripts/validate.js`
- [ ] Group validators by domain (`styling`, `routes`, `convex`, `tests`, `screenshots`, etc.) so the suite is readable and maintainable
- [ ] Separate registry/config from runner/execution/report formatting, so suite structure is not only understandable by reading `validate.js`
- [ ] Document the validator authoring contract inside `scripts/validate/`:
  - expected result shape
  - blocking vs informational behavior
  - how `showMessagesOnPass` should be used
  - how ratchets/baselines should work
  - when a validator should expose `--audit`
  - how to run a single validator through `run-check.mjs`
- [ ] Standardize ratchet helpers further -- one shared baseline/ratchet reporting path instead of many locally-shaped variants
- [ ] Standardize validator CLI behavior where relevant -- avoid each heavy validator inventing its own argument parsing or audit output style
- [ ] Add a lightweight test harness for validator modules themselves so result shape, baseline semantics, and audit output do not drift silently
- [ ] Audit expensive validators and reduce repeated whole-repo scans or duplicated file discovery where practical
- [ ] Clarify naming -- make the file name, user-facing validator label, and domain align more obviously
- [ ] Decide whether screenshot/spec checks should remain interleaved with code-quality checks or be grouped more explicitly as a separate coverage section
- [ ] Keep validator output plain, technical, and predictable; avoid letting the suite UX drift into vague or editorial language

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
- [ ] Add validator coverage for primitive-default ownership drift -- shared wrappers should not restate defaults already owned by the primitive they wrap
- [ ] Add validator coverage that distinguishes real Tailwind-first layout from hidden local style systems (`SECTION_CLASSES`, class-string maps, helper bags) and penalizes the hidden style-system path harder

## Ratchet Strategy

For advisory validators, keep the ratchet only as long as cleanup is still in flight.
- [ ] Remove ratchet once count hits zero

## Done When

- [ ] All 47+ validators pass with zero violations
- [ ] Baselined query/filter debt is removed from product code so the ratchets can be deleted
- [ ] No validator skips without explicit TODO references
- [ ] Styling/CVA validators are strict enough that screenshot-driven cleanup does not regress on the next pass
- [ ] Validator rules make the intended contract obvious: Tailwind for static layout, shared primitives for semantics, global CSS only for truly global/shared concerns
- [ ] Validator rules also make icon ownership obvious: semantic size/tone through shared primitives, not ad hoc raw color and spacing classes
- [ ] The validator suite itself is easy to extend: grouped, documented, and consistent in ratchet/audit/result behavior
