# Feature Docs Expansion

> **Priority:** P2
> **Status:** New
> **Last Updated:** 2026-03-19

## Goal

Expand the docs we already have into concrete product-spec docs for current shipped behavior, not just comparisons, page visuals, or strategy notes.

## Current Starting Point

We already have three useful inputs:

- `docs/feature-comparison/` — feature-by-feature comparison docs
- `docs/design/specs/pages/*` — visual CURRENT / TARGET / IMPLEMENTATION specs
- `docs/research/strategy/` — higher-level gap and positioning docs

What is still missing is a tighter “this is how the product works today” layer with user stories, permissions, happy paths, failure cases, and acceptance criteria.

The validator-backed gap is now explicit: 21 page-spec folders already have screenshot directories but still do not have the full `CURRENT.md` / `IMPLEMENTATION.md` / `TARGET.md` triplet.
There is a second gap too: even where page specs exist, many shipped features still are not documented at the level of actual behavior/state coverage. We need docs for the real feature surface, not just the base route screenshot.

## Deliverables

### 1. Define a shared feature-doc structure

- [ ] Add a standard template for current-state feature docs
- [ ] Template must include:
  - user stories / actor goals
  - roles / permissions
  - primary flow
  - alternate / failure flows
  - empty / loading / error states
  - linked routes / components / backend functions
  - screenshots / design-spec references
  - acceptance criteria

### 1.5. Close the page-spec doc triplet gap first

- [ ] Backfill the 21 page spec folders currently missing `CURRENT.md`, `IMPLEMENTATION.md`, and `TARGET.md`
- [ ] Start with the highest-signal missing folders:
  - `22-time-tracking`
  - `26-clients`
  - `28-workspace-detail`
  - `35-roadmap`
  - `37-billing`
- [ ] Keep screenshot folders linked as the visual baseline for each new triplet
- [ ] When backfilling the triplets, include the full reviewed screenshot matrix:
  - desktop
  - tablet
  - mobile
  - extra reviewed feature states where they exist
- [ ] Do not write base-route-only CURRENT docs for pages whose real product surface depends on alternate states like dialogs, side panels, filters, selected-detail states, or workflow variants

### 1.6. Close current feature-coverage gaps, not just page-file gaps

- [ ] Audit shipped surfaces for missing feature-state coverage in docs:
  - empty / loading / error
  - create / edit / confirm / destructive
  - permission / access-denied
  - alternate modes and filters
  - modal / drawer / popover branches
  - selected-detail / inline-edit / expanded row states
- [ ] Create or expand docs where the page spec exists but the actual feature behavior is still under-documented
- [ ] Make sure "what features/states are actually shipped?" is answerable without reading route code or screenshot file names
- [ ] Link missing feature-state coverage back to screenshot debt when the screenshots themselves are not yet captured

### 2. Expand the highest-value current surfaces first

- [ ] **Roadmap / Gantt** — document the actual shipped roadmap behavior in detail:
  - drag / resize
  - milestones
  - zoom
  - grouping
  - dependency highlighting
  - hierarchy / rollups
- [ ] **Board / backlog / issue detail** — document creation, editing, relations, filters, and panel/modal behavior as product flows, not just UI comparison notes
- [ ] **Calendar / bookings / OOO** — document internal events, booking delegation, OOO blocking, and organizer behavior
- [ ] **Documents / editor** — document locking, mentions, colors, sharing, and current version-history reality
- [ ] **Client portal / public sharing** — document what the token portal supports today and its permission limits
- [ ] **Time tracking / billing** — document current reporting/export behavior, including the remaining PDF gap
- [ ] **Issues / notifications / inbox / assistant / analytics / meetings** — document the states that are actually shipped today, not just the main route shell
- [ ] **Settings / admin / integrations** — document tab-specific behavior and exceptional states (permission denied, disconnected, destructive, setup, validation)

### 3. Tie feature docs back to current page specs

- [ ] Link each expanded feature doc to the relevant page specs in `docs/design/specs/pages/*`
- [ ] Link each expanded feature doc to the relevant screenshot coverage or missing screenshot todo when coverage is incomplete
- [ ] Link each feature doc to the specific reviewed states that are considered canonical, so tablet/mobile and alternate states are not implied by accident

### 4. Make docs usable as implementation input

- [ ] Each expanded doc should end with a “current gaps / next expansion opportunities” section
- [ ] Keep this grounded in what exists now; do not turn it into aspirational product fiction

## Suggested Target Files

- `docs/feature-comparison/views/gantt-chart.md`
- `docs/feature-comparison/issues/issue-detail-view.md`
- `docs/feature-comparison/issues/create-issue.md`
- `docs/feature-comparison/views/kanban-board.md`
- `docs/feature-comparison/views/calendar-view.md`
- `docs/feature-comparison/documents/document-editor.md`
- `docs/feature-comparison/projects/project-settings.md`
- new docs if needed for portal / time tracking / roadmap behavior that do not fit cleanly in the current set

## Done When

- [ ] The current shipped product can be understood from docs without reading the code first
- [ ] The main surfaces above have user-story-grade current-state docs
- [ ] Important shipped states are covered explicitly instead of being discoverable only by screenshot filenames or tests
- [ ] New feature work can point to these docs as implementation/reference specs
