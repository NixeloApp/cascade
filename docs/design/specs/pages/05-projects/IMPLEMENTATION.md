# Projects List Page - Implementation

> **Priority**: Medium
> **Status**: Current
> **Last Updated**: 2026-03-25

## Route Structure

- Route file: `src/routes/_auth/_app/$orgSlug/projects/index.tsx`
- Main surface: `src/components/ProjectsList.tsx`
- Primary action: `src/components/CreateProjectFromTemplate.tsx`

## Current Behavior

`ProjectsList` renders one of four branches:

1. `ProjectsLoadingState`
   - Used for first-load query work and the E2E loading override.
   - Keeps the projects route in a real shell instead of dropping to a generic spinner.

2. Empty workspace
   - Uses `EmptyState` plus follow-on guidance cards.
   - Keeps the primary create action visible in both the page header and the empty shell.

3. Single-project workspace overview
   - Promotes the lone project into a workspace hub.
   - Shows project summary, quick navigation into board/roadmap/calendar, and guidance on when to split into more projects.

4. Multi-project grid
   - Standard card grid linking into project boards.
   - Used by the default seeded screenshot state.

## Test And Screenshot Hooks

- `TEST_IDS.PROJECT.GRID`
- `TEST_IDS.PROJECT.EMPTY_STATE`
- `TEST_IDS.PROJECT.LOADING_STATE`
- `TEST_IDS.PROJECT.SINGLE_PROJECT_OVERVIEW`

These are consumed by:

- `src/components/ProjectsList.test.tsx`
- `e2e/pages/projects.page.ts`
- `e2e/screenshot-lib/interactive-captures.ts`

## E2E State Control

The screenshot harness now has a dedicated projects-list state controller:

- Endpoint: `/e2e/configure-projects-state`
- Modes:
  - `default`
  - `single`
  - `empty`

Implementation lives in `convex/e2e.ts` and works by changing the seeded screenshot owner’s project memberships instead of deleting or recreating projects. That keeps the rest of the seeded org stable while still letting the route switch deterministically between branches.

## Verification

- Component tests cover loading, empty, single-project, multi-project, and load-more behavior.
- The screenshot matrix covers:
  - canonical multi-project grid
  - single-project branch
  - authenticated empty state
  - loading shell
  - create-project modal
