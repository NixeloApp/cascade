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

### 3. Tie feature docs back to current page specs

- [ ] Link each expanded feature doc to the relevant page specs in `docs/design/specs/pages/*`
- [ ] Link each expanded feature doc to the relevant screenshot coverage or missing screenshot todo when coverage is incomplete

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
- [ ] New feature work can point to these docs as implementation/reference specs
