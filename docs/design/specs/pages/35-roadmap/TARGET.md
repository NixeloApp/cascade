# Roadmap Page - Target

> **Last Updated**: 2026-03-23

---

## Priority Improvements

### 1. Split RoadmapView into sub-components (MEDIUM)

The 2671-line single file should be decomposed:
- `RoadmapToolbar` — all toolbar controls and state
- `RoadmapInfoColumn` — issue list with grouping
- `RoadmapTimelineBar` — individual bar with drag/resize
- `RoadmapDependencyLayer` — SVG arrow overlay
- `RoadmapView` — orchestrator that composes the above

### 2. Touch support for drag/resize (MEDIUM)

Current drag/resize only works with mouse events. Mobile/tablet users
cannot adjust dates. Add touch equivalents (touchstart/touchmove/touchend)
with the same delta math.

### 3. Screenshot matrix expansion (LOW)

Add captures for: empty state, drag in progress, dependency arrows,
group-by active, epic filter, milestone markers, week view, zoom levels.

---

## Not Planned

- Critical path highlighting (requires dependency chain analysis)
- Resource leveling (requires capacity model)
- Multi-project roadmap (this is project-scoped)
- Print/export (would need a separate render path)

---

## Acceptance Criteria

- [ ] RoadmapView split into 4+ sub-components, each under 500 lines
- [ ] Touch drag/resize works on tablet
- [ ] Screenshot matrix includes all listed missing captures
- [ ] No regressions in bar positioning, dependency arrows, or keyboard nav
