# E2E And Screenshot Consolidation

> **Priority:** P0
> **Status:** Open
> **Last Updated:** 2026-03-26

## Why This Is P0

- [ ] The repo still has two overlapping automation systems: real E2E/product testing and a screenshot-specific Playwright harness. They duplicate readiness logic, state setup, and route-driving behavior instead of sharing one reusable path.
- [ ] Screenshot capture has leaked into production code through test-only component hooks. That makes components harder to trust and harder to reason about.
- [x] PR CI no longer runs the separate screenshot recapture workflow. Local/manual capture plus `static` artifact integrity is the new baseline.
- [ ] The goal is reuse. If screenshot generation cannot be described as "thin capture on top of existing E2E state helpers," then the automation architecture is wrong.
- [ ] The current raw-locator baseline proves the screenshot harness is still acting like a parallel framework.
  Current hotspots:
  - `e2e/screenshot-lib/filled-states.ts` (`79`)
  - `e2e/screenshot-lib/readiness.ts` (`64`)
  - `e2e/screenshot-lib/interactive-captures.ts` (`46`)
  - `e2e/screenshot-lib/helpers.ts` (`14`)

## Target Architecture

- [ ] E2E/page-object logic is the single source of truth for route navigation, readiness, seeded states, modal/dialog opening, and proof that a state is real.
- [ ] Screenshot capture is only an artifact layer:
  - pick a reusable state helper
  - open the state through normal E2E helpers
  - capture the image
  - write it to the reviewed spec folder
- [x] `static` is the integrity gate for approved screenshot artifacts.
- [x] Full screenshot recapture is no longer a normal PR CI gate.
  The default CI path now validates artifacts instead of regenerating the whole visual library on every PR.

## First Pass Targets

- [ ] Split the main screenshot-lib hotspots into:
  - reusable helpers that should live with E2E/page objects
  - thin screenshot wrappers that stay in screenshot-lib
  - harness-only complexity that should be deleted
- [x] Collapse the document-editor capture path onto [DocumentsPage](/home/mikhail/Desktop/cascade/e2e/pages/documents.page.ts) and file-chooser based markdown import instead of screenshot-only window events.
- [x] Collapse roadmap and time-tracking reviewed states onto reusable page-object interactions instead of session-storage/window-based screenshot boot state.
- [ ] Start with the biggest offenders:
  - `e2e/screenshot-lib/filled-states.ts` (`79`)
  - `e2e/screenshot-lib/readiness.ts` (`64`)
  - `e2e/screenshot-lib/interactive-captures.ts` (`46`)
  - `e2e/screenshot-lib/helpers.ts` (`14`)
- [ ] Replace raw locator usage in those files with shared page-object helpers or route-specific readiness contracts until the screenshot-lib raw-locator baseline is materially smaller.
- [ ] Remove duplicate readiness logic where screenshot helpers re-implement waits already owned by page objects or route E2E utilities.
- [ ] Remove duplicate modal/state openers where screenshot helpers bypass existing user-path helpers.

## Production Hook Cleanup

- [x] Remove screenshot-only document-editor hooks from:
  - `PlateEditor.tsx`
  - `SlashMenu.tsx`
  - `FloatingToolbar.tsx`
  - `src/lib/plate/markdown.ts`
- [ ] Audit production components for screenshot/E2E-only hooks, events, globals, and branches.
  First targets:
  - route-specific state toggles added only for capture
  - remaining screenshot boot-state shortcuts outside the document, roadmap, and time-tracking surfaces
- [ ] Keep only the minimum test hooks that are truly unavoidable, and document each remaining one with a concrete reason.
- [ ] Prefer seeded backend state, route params, or normal UI interaction over window-event hooks.
- [ ] If a hook remains, it must serve reusable test setup broadly, not just one screenshot state.

## CI Simplification

- [x] Remove full screenshot recapture from normal PR CI.
- [x] Keep `static`-level screenshot integrity checks in local and CI workflows.
- [ ] Keep screenshot capture local/manual unless we later add a small reusable smoke subset that clearly earns its cost.
- [ ] Update the workflow/docs so the CI surface area is obvious:
  - what validates product behavior
  - what validates static artifacts
  - what no longer exists as a default workflow

## Documentation And Rules

- [x] Update docs to explain the new split:
  - E2E owns reusable state setup
  - screenshots consume reusable state setup
  - static validates approved artifacts
- [ ] Add validator coverage so screenshot-only helper sprawl cannot quietly grow again.
  At minimum:
  - ratchet screenshot-specific raw locators downward
  - block new screenshot-only route/state helpers when an E2E/page-object helper already exists
  - block new production component hooks added only for screenshot capture without a documented exception
- [x] Explicitly document that screenshots are not a second E2E framework.

## Exit Criteria

- [ ] A contributor can point to one reusable helper path for a given route/state instead of choosing between E2E helpers and screenshot-only helpers.
- [ ] Production components no longer carry screenshot-only hooks unless there is a documented, justified exception.
- [x] PR CI no longer runs the full screenshot recapture workflow by default.
- [ ] Screenshot generation and screenshot integrity checking are clearly separate concepts in code and docs.
