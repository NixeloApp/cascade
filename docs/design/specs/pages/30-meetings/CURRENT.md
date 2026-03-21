# Meetings Page - Current State

> **Route**: `/:slug/meetings`
> **Status**: REVIEWED for core route and deep-state screenshot coverage
> **Last Updated**: 2026-03-21

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Purpose

The meetings route is the post-call operating surface:

- review recordings
- inspect summaries and transcript segments
- scan memory artifacts such as decisions and open questions
- filter by status, platform, project, and time window
- schedule or attach future recordings

It is no longer just "meeting bot output". It is supposed to behave like a searchable meeting
workspace that feeds later product/document workflows.

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Additional state captures

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|------|---------------|---------------|--------------|--------------|
| Selected-recording detail | `desktop-dark-detail.png` | `desktop-light-detail.png` | `tablet-light-detail.png` | `mobile-light-detail.png` |
| Memory-lens filter state | `desktop-dark-memory-lens.png` | `desktop-light-memory-lens.png` | `tablet-light-memory-lens.png` | `mobile-light-memory-lens.png` |
| Transcript search state | `desktop-dark-transcript-search.png` | `desktop-light-transcript-search.png` | `tablet-light-transcript-search.png` | `mobile-light-transcript-search.png` |

These screenshot states are already captured and approved. The earlier note claiming the meetings
baselines were still missing is no longer true.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Page header                                                                                 │
│ Meetings                                                   [Open Calendar] [Schedule]       │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Memory rail                                                                                 │
│ recent decisions | open questions | unresolved follow-ups                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Main workspace                                                                              │
│                                                                                             │
│  left column                                                                                │
│  - filter controls                                                                          │
│  - recordings list                                                                          │
│  - status / platform / project / time-window lens                                           │
│                                                                                             │
│  right column                                                                               │
│  - selected recording detail                                                                │
│  - summary                                                                                  │
│  - participants                                                                             │
│  - transcript segments                                                                      │
│  - action items                                                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Composition

### 1. Route header

- Provides an `Open Calendar` escape hatch back to the scheduling surface.
- Supports meeting scheduling and recording setup from the route itself.

### 2. Memory rail

- Surfaces cross-recording memory:
  - recent decisions
  - open questions
  - unresolved action items
- Can be narrowed by project lens.

### 3. Left-column workspace tools

- Search and filter flow for recordings
- Status filter
- Platform filter
- Project filter
- Time-window filter

This column is the operational list-management side of the route.

### 4. Right-column detail workspace

- Selected recording summary
- Participants
- Transcript
- Action items
- Project-aware follow-up context

This column is the review and handoff side of the route.

### 5. Schedule dialog

- Supports ad hoc recording setup or calendar-linked capture.
- Belongs to the route because capture initiation is part of the meetings workflow, not a
  separate settings-only flow.

---

## State Coverage

### Reviewed route states

- Canonical filled workspace
- Alternate selected-recording detail state
- Transcript search state
- Memory-lens filtered state
- Empty state with no recordings yet

### Important implementation states that still matter even without dedicated screenshots

- recording still processing
- failed/cancelled states
- action-item project assignment state
- schedule dialog validation states

Those are supported by the route logic, but the current visual review set is centered on the main
workspace states above.

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Screenshot depth | Good. This route now has real deep-state screenshots instead of a single canonical page image. |
| Route purpose | Clear. The page reads as a review/search workspace, not a generic transcript dump. |
| State coverage | Better than many other product routes because transcript search and memory lens are explicitly reviewed. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Meeting-to-document handoff is still a product backlog item, so the route stops at review/action extraction rather than completing the doc workflow | product flow | HIGH |
| 2 | Dense detail states can still feel busy on smaller widths because summary, transcript, and action items all compete for the same right-column attention | detail composition | MEDIUM |
| 3 | The route is current visually, but the spec still needs future expansion once meeting-to-doc and richer schedule flows land | documentation follow-up | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/meetings.tsx` | Route wrapper and page-level actions |
| `src/components/Meetings/MeetingsWorkspace.tsx` | Main meetings workspace |
| `e2e/screenshot-pages.ts` | Canonical and deep-state meetings screenshot capture |
| `todos/meeting-intelligence.md` | Remaining product backlog for meeting-to-doc and related flows |

---

## Review Guidance

- Treat this as a dense operational workspace, not a transcript viewer.
- Do not delete the deep-state screenshots; they are the real value of this spec.
- The next meaningful spec expansion should happen when meeting-to-doc is real, because that
  changes the route's end-to-end story more than another cosmetic pass would.

---

## Summary

The meetings spec is now current. Core route coverage and deep-state screenshots are real and
approved. The remaining gap is product-flow depth, not missing baseline captures.
