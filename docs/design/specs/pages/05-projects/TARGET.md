# Projects List Page - Target State

> **Route**: `/:slug/projects`
> **Status**: Largely met
> **Last Updated**: 2026-03-25

## Target

The projects route should read as a credible workspace entry surface in all meaningful states:

- populated multi-project grid
- lone-project workspace overview
- empty first-run state
- loading shell
- create-project modal

It should not depend on filler cards, oversized decoration, or hidden modal-only flows to feel complete.

## What Is Already True

- The multi-project route looks like a real workspace list instead of a sparse placeholder.
- The single-project branch is intentionally treated as a hub and is now fully reviewed.
- The empty state has a concrete recovery path.
- Loading preserves the route shape instead of collapsing to a generic spinner.
- The create-project flow is part of the approved screenshot matrix.

## Remaining Direction

- Keep future visual changes aligned with the shared dashboard/overlay shell language.
- If search, filters, quick actions, archive controls, or richer project metadata land here, they must ship with their own reviewed empty/loading/interaction captures.
- Do not reintroduce speculative “premium card” patterns or one-off hover theatrics that drift away from the rest of the product.
