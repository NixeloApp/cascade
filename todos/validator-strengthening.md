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

These 3 validators report real issues (43 + 17 + N) but pass anyway:

- [ ] **Typography drift** (43 drift points) -- promote from advisory to blocking, or set a baseline threshold that blocks on increase
- [ ] **Control chrome drift** (17 drift points) -- same: promote to blocking or ratchet
- [ ] **Shared shape drift** -- promote or ratchet

## New Validators to Add

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

- [ ] All 47 validators pass with zero violations
- [ ] Advisory validators either block or use ratchet
- [ ] New validators for manifest integrity, catch swallows, and timeout audit
- [ ] No validator skips without explicit TODO references
