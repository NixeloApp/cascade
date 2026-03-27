# E2E And Screenshot Consolidation

> **Priority:** P0
> **Status:** Open
> **Last Updated:** 2026-03-27

## Why This Is Still Open

- [ ] The repo still has two overlapping automation systems: real E2E/product testing and a screenshot-specific Playwright harness. They duplicate readiness logic, state setup, and route-driving behavior instead of sharing one reusable path.
- [ ] Screenshot capture has leaked into production code through test-only component hooks. That makes components harder to trust and harder to reason about.
- [ ] The goal is reuse. If screenshot generation cannot be described as "thin capture on top of existing E2E state helpers," then the automation architecture is wrong.
- [ ] This is the first infrastructure priority again. The current overlap between screenshot-lib and reusable E2E/page objects is active execution debt, not just cleanup polish.
- [ ] The remaining debt is no longer one giant screenshot-lib selector hotspot. What is left is smaller but still structural: shared blocked-transport policy, screenshot session/bootstrap orchestration, and the remaining places where screenshot capture can still diverge from reusable E2E flows.

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
- [ ] Keep screenshot auth/bootstrap on the shared session helper path and shared injected-token fixture-auth helpers instead of letting new harness-only entrypoints or config-specific login paths reappear.
- [ ] Keep config-level browser launch/auth/retry orchestration on shared screenshot session helpers instead of re-implementing browser sessions around empty vs filled capture paths.
- [ ] Keep screenshot phase gating derived from the canonical screenshot target list so empty/public/filled orchestration cannot drift out of sync with actual capture ids.
- [ ] Keep screenshot phase planning on one selected-target plan derived from canonical screenshot ids. Session bootstrap, empty-before-seed ordering, and public/filled phase decisions should not rebuild their own boolean gating ad hoc.
- [ ] Keep empty screenshot target policy on one canonical manifest. Empty-state route ownership should not live in a separate hand-maintained list and imperative `takeScreenshot(...)` sequence.
- [ ] Keep seedless public-page captures off the authenticated bootstrap and seeding path; landing/auth-style screenshots should not pay for screenshot user setup or seeded tokens they do not need.
- [ ] Keep public screenshot target policy on one canonical manifest. Seeded vs seedless grouping and route/token requirements should not live in separate hand-maintained sets and imperative branches.
- [ ] Keep browser launch/close, config retry policy, and auth bootstrap on the shared screenshot session helper path instead of re-implementing them in CLI entrypoints or route-specific capture code.
- [ ] Keep staged screenshot output lifecycle on the shared session helper path instead of re-implementing staging-root setup, promotion, or cleanup in CLI entrypoints.
- [ ] Keep generic browser/context/page target lifecycle on shared E2E utilities instead of rebuilding it inside screenshot-lib session helpers.
- [ ] Keep empty-before-seed ordering and screenshot seed/bootstrap orchestration on the shared session helper path instead of re-implementing capture phases in the CLI entrypoint.
- [ ] Keep screenshot bootstrap org resolution non-seeding; the empty-state phase must not call screenshot data seeders just to discover org context.
- [ ] Keep the screenshot harness private-helper baseline at zero; new top-level harness-only helpers must either become tested public harness API or move into reusable E2E/page-object utilities.
- [ ] Keep the screenshot-lib raw-locator baseline at zero for tracked screenshot helpers; do not let new route-specific selectors creep back into `readiness.ts`, `helpers.ts`, or new screenshot-lib files.
- [ ] Remove duplicate readiness logic where screenshot helpers re-implement waits already owned by page objects or route E2E utilities.
- [ ] Remove duplicate modal/state openers where screenshot helpers bypass existing user-path helpers.
- [ ] Keep shrinking direct screenshot-lib route-driving so ordinary canonical, modal, and loading captures go through page-object navigation, leaving only shared blocked-transport policy and shared screenshot-session bootstrap as the justified exceptions.
- [ ] Keep blocked transport/page-target lifecycle on shared E2E helpers instead of re-creating sibling or isolated capture-page setup inside screenshot-lib or route-specific loading helpers.
- [ ] Keep blocked transport policy on one shared helper contract instead of growing separate `withConvexLoadingPage` / `withQueryBlockedPage` / `withMutationBlockedPage` variants again.
- [ ] Keep blocked transport policy explicit at call sites. Loading helpers should declare `transport` vs `queries` vs `mutations` and `isolated` vs `sibling` directly instead of leaning on option-bag defaults or implicit harness folklore.
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
