# E2E And Screenshot Consolidation

> **Priority:** P0
> **Status:** Open
> **Last Updated:** 2026-03-28

## Why This Is Still Open

- [ ] The repo still has two overlapping automation systems: real E2E/product testing and a screenshot-specific Playwright harness. They duplicate readiness logic, state setup, and route-driving behavior instead of sharing one reusable path.
- [ ] Screenshot capture has leaked into production code through test-only component hooks. That makes components harder to trust and harder to reason about.
- [ ] The goal is reuse. If screenshot generation cannot be described as "thin capture on top of existing E2E state helpers," then the automation architecture is wrong.
- [ ] This is the first infrastructure priority again. The current overlap between screenshot-lib and reusable E2E/page objects is active execution debt, not just cleanup polish.
- [ ] The remaining debt is no longer one giant screenshot-lib selector hotspot. What is left is smaller but still structural: screenshot-specific helper seams, shared blocked-transport policy, and the remaining places where screenshot capture can still diverge from reusable E2E flows.

## Target Architecture

- [ ] E2E/page-object logic is the single source of truth for route navigation, readiness, seeded states, modal/dialog opening, and proof that a state is real.
- [ ] Screenshot capture is only an artifact layer:
  - pick a reusable state helper
  - open the state through normal E2E helpers
  - capture the image
  - write it to the reviewed spec folder

## First Pass Targets

- [ ] Finish the remaining screenshot-lib cleanup into:
  - reusable helpers that should live with E2E/page objects
  - thin screenshot wrappers that stay in screenshot-lib
  - harness-only complexity that should be deleted
- [ ] Keep collapsing the remaining screenshot-specific auth/bootstrap logic onto reusable E2E auth helpers instead of letting screenshot session setup drift into new harness-only entrypoints or config-specific login paths.
- [ ] Keep the screenshot harness private-helper baseline at zero; new top-level harness-only helpers must either become tested public harness API or move into reusable E2E/page-object utilities.
- [ ] Keep the screenshot-lib raw-locator baseline at zero for tracked screenshot helpers; do not let new route-specific selectors creep back into `readiness.ts`, `helpers.ts`, or new screenshot-lib files.
- [ ] Remove duplicate readiness logic where screenshot helpers re-implement waits already owned by page objects or route E2E utilities.
- [ ] Remove duplicate modal/state openers where screenshot helpers bypass existing user-path helpers.
- [ ] Keep shrinking direct screenshot-lib route-driving so ordinary canonical, modal, and loading captures go through page-object navigation, leaving only shared blocked-transport policy as the justified exception.
- [ ] Finish the remaining helper extractions in screenshot-lib itself so the only tracked raw-locator debt left is normal E2E specs, not screenshot capture code.

## Production Hook Cleanup

- [ ] Audit production components for screenshot/E2E-only hooks, events, globals, and branches.
  First targets:
  - route-specific state toggles added only for capture
  - remaining screenshot boot-state shortcuts outside the document, roadmap, time-tracking, notifications archived-tab, project-inbox, and invoices surfaces
- [ ] Keep the loading-hook exception list at zero unless a new exception is explicitly justified.
- [ ] Keep validator coverage in place so new window-key reads or ad-hoc loading override call sites cannot spread back into production or E2E code.
- [ ] Keep only the minimum test hooks that are truly unavoidable, and document each remaining one with a concrete reason.
- [ ] Prefer seeded backend state, route params, or normal UI interaction over window-event hooks.
- [ ] If a hook remains, it must serve reusable test setup broadly, not just one screenshot state.

## CI Simplification

- [ ] Keep screenshot capture local/manual unless we later add a small reusable smoke subset that clearly earns its cost.
- [ ] Update the workflow/docs so the CI surface area is obvious:
  - what validates product behavior
  - what validates static artifacts
  - what no longer exists as a default workflow

## Documentation And Rules

- [ ] Add validator coverage so screenshot-only helper sprawl cannot quietly grow again.
  At minimum:
  - ratchet screenshot-specific raw locators downward
  - block new screenshot-only route/state helpers when an E2E/page-object helper already exists
  - block new production component hooks added only for screenshot capture without a documented exception

## Exit Criteria

- [ ] A contributor can point to one reusable helper path for a given route/state instead of choosing between E2E helpers and screenshot-only helpers.
- [ ] Production components no longer carry screenshot-only hooks unless there is a documented, justified exception.
- [ ] Screenshot generation and screenshot integrity checking are clearly separate concepts in code and docs.
