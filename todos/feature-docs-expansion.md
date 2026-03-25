# Feature Docs Expansion

> **Priority:** P2
> **Status:** Open
> **Last Updated:** 2026-03-24

All page-spec triplets already exist. The remaining gap is not missing `CURRENT.md` / `IMPLEMENTATION.md` / `TARGET.md` files; it is missing current-state feature coverage for real shipped behavior.

## Remaining

### Shared Structure

- [ ] Define a standard current-state feature doc template with user goals, permissions, primary flow, alternate/failure flows, empty/loading/error states, linked routes/components/functions, and acceptance criteria.

### Coverage Audit

- [ ] Audit which shipped surfaces still require route-code reading or screenshot-filename archaeology to understand current behavior.
- [ ] Expand docs for under-documented states: empty, loading, error, destructive, permission-denied, filters, modal/drawer branches, selected-detail states, and inline-edit states.
- [ ] Link feature docs to the screenshot states that are considered canonical so mobile/tablet/alternate-state behavior is explicit.

### Highest-Value Surfaces

- [ ] Roadmap / Gantt current behavior.
- [ ] Client portal / public sharing limits.
- [ ] Time tracking / billing current reporting and export behavior.
- [ ] Meetings current workflow and actual shipped states.
- [ ] Settings / integrations exceptional states and setup/disconnected flows.

## Done When

- [ ] A developer can answer “what is currently shipped here?” from docs without reading route code first.
- [ ] Important states are described explicitly instead of being implied by screenshots or tests.
- [ ] New feature work can point to current-state docs as implementation input rather than only comparison/reference material.
