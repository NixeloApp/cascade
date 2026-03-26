# E2E And Screenshot Consolidation

> **Priority:** P0
> **Status:** Open
> **Last Updated:** 2026-03-26

## Why This Is P0

- [ ] The repo currently has two overlapping automation systems: real E2E/product testing and a screenshot-specific Playwright harness. They duplicate readiness logic, state setup, and route-driving behavior instead of sharing one reusable path.
- [ ] Screenshot capture has leaked into production code through test-only component hooks. That makes components harder to trust and harder to reason about.
- [ ] PR CI is paying for expensive screenshot recapture work even though local and CI `static` already validate screenshot artifact integrity. We should not keep a second heavyweight pipeline unless it is clearly worth the cost.
- [ ] The goal is reuse. If screenshot generation cannot be described as "thin capture on top of existing E2E state helpers," then the automation architecture is wrong.
- [ ] The current raw-locator baseline proves the screenshot harness is still acting like a parallel framework.
  Current hotspots:
  - `e2e/screenshot-lib/filled-states.ts` (`79`)
  - `e2e/screenshot-lib/readiness.ts` (`64`)
  - `e2e/screenshot-lib/interactive-captures.ts` (`46`)
  - `e2e/screenshot-lib/helpers.ts` (`14`)

## Target Architecture

- [ ] E2E/page-object logic is the single source of truth for:
  - route navigation
  - readiness
  - seeded states
  - modal/dialog opening
  - assertions that a state is actually real
- [ ] Screenshot capture becomes a thin artifact layer that only:
  - selects a known reusable state helper
  - opens the page/state through normal E2E helpers
  - takes the screenshot
  - writes the result to the reviewed spec folder
- [ ] `static` remains the integrity gate for approved screenshot artifacts:
  - manifest matches files
  - no stale diffs
  - no duplicate/loading-shell junk
- [ ] Full screenshot recapture stops being a normal PR CI gate.
  The default CI path should validate artifacts, not regenerate the whole visual library on every PR.

## Screenshot Harness Cleanup

- [ ] Audit `e2e/screenshot-lib/**` and split it into:
  - reusable pieces that should become normal E2E/page-object helpers
  - screenshot-only wrappers that should stay thin
  - harness-only complexity that should be deleted
- [ ] Replace raw locator usage in screenshot helpers with shared page-object helpers or route-specific readiness contracts until the screenshot-specific raw-locator baseline is near zero.
- [ ] Remove duplicate readiness logic where screenshot helpers re-implement the same waits already owned by page objects or route-specific E2E utilities.
- [ ] Remove duplicate modal/state openers where screenshot helpers bypass existing user-path helpers.
- [ ] Make screenshot targets reference shared page-object/state helpers instead of bespoke ad hoc logic whenever the same route/state is already covered elsewhere.

## Production Hook Cleanup

- [ ] Audit production components for screenshot/E2E-only hooks, events, globals, and branches.
  Start with:
  - `PlateEditor.tsx`
  - any screenshot seeding globals in editor/document flows
  - route-specific state toggles added only for capture
- [ ] Keep only the minimum test hooks that are truly unavoidable, and document each remaining one with a concrete reason.
- [ ] Prefer seeded backend state, route params, or normal UI interaction over window-event hooks.
- [ ] If a hook remains, it must serve reusable test setup broadly, not just one screenshot state.

## CI Simplification

- [ ] Remove full screenshot recapture from normal PR CI.
- [ ] Keep `static`-level screenshot integrity checks in local and CI workflows.
- [ ] If any screenshot-related CI remains beyond `static`, make it a small reusable smoke subset that uses existing E2E helpers rather than the full recapture pipeline.
- [ ] Update the workflow/docs so the CI surface area is obvious:
  - what validates product behavior
  - what validates static artifacts
  - what no longer runs by default

## Documentation And Rules

- [ ] Update docs to explain the new split:
  - E2E owns reusable state setup
  - screenshots consume reusable state setup
  - static validates approved artifacts
- [ ] Add validator coverage so screenshot-only helper sprawl cannot quietly grow again.
  At minimum:
  - ratchet screenshot-specific raw locators downward
  - block new screenshot-only route/state helpers when an E2E/page-object helper already exists
  - block new production component hooks added only for screenshot capture without a documented exception
- [ ] Explicitly document that screenshots are not a second E2E framework.

## Exit Criteria

- [ ] A contributor can point to one reusable helper path for a given route/state instead of choosing between E2E helpers and screenshot-only helpers.
- [ ] Production components no longer carry screenshot-only hooks unless there is a documented, justified exception.
- [ ] PR CI no longer runs the full screenshot recapture workflow by default.
- [ ] Screenshot generation and screenshot integrity checking are clearly separate concepts in code and docs.
