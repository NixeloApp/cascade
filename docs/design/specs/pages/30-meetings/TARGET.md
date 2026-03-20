# Meetings Page - Target State

> **Route**: `/:slug/meetings`
> **Goal**: Treat meetings as a first-class workspace with trustworthy visual baselines and interaction coverage

---

## Design Principles

1. **Real content over shell captures**: screenshots should prove the memory rail, recording list, and detail panel are rendered.
2. **Coverage for both empty and seeded states**: regressions often hide in one and not the other.
3. **Detail workflows stay visible**: transcript and follow-up flows need explicit validation, not just route-level smoke coverage.
4. **Specs track reality**: the page spec should reflect shipped UI, not aspirational placeholders.

---

## Acceptance Criteria

| Area | Target |
|------|--------|
| Spec folder | `30-meetings` exists with current/implementation/target docs |
| Screenshot routing | Meetings page IDs resolve into the page spec folder |
| Screenshot readiness | Harness waits for meetings content, not only global shell chrome |
| Empty state coverage | No-recordings state captured |
| Seeded state coverage | Memory rail and selected recording state captured |
| Interaction coverage | Meetings E2E spec covers transcript and follow-up flows |

---

## Follow-On Capture Targets

- Recording detail focused screenshot
- Transcript search/result screenshot
- Memory lens filtered screenshot
- Schedule recording dialog screenshot

These should be added only if the base seeded route capture does not make those states legible in the canonical layouts.
