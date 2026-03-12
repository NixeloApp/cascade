# Sprints Page - Current State

> **Route**: `/:slug/projects/:key/sprints`
> **Status**: 🟡 Functional baseline, now tracked by the screenshot harness
> **Last Updated**: 2026-03-12

---

## Screenshots

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Current UI

- The sprints route now participates in the promoted screenshot baseline instead of only landing in `e2e/screenshots`.
- Desktop and mobile captures are both valid and show the real sprint-management state rather than a partial shell.
- The page still reads as a straightforward management surface, not a polished planning workspace.

---

## Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  [Sidebar]  │  Sprint Management                         [Create Sprint]   │
│             │  ───────────────────────────────────────────────────────     │
│             │                                                               │
│             │  ┌─ Sprint Card ─────────────────────────────────────────┐   │
│             │  │                                                       │   │
│             │  │  Sprint 1              [active]  [12 issues]          │   │
│             │  │  ─────────────────────────────────                    │   │
│             │  │  Ship the new dashboard                               │   │
│             │  │                                                       │   │
│             │  │  Sprint progress                             45%      │   │
│             │  │  [████████████░░░░░░░░░░░░░░░]                        │   │
│             │  │                                                       │   │
│             │  │  Jan 15, 2026 - Jan 29, 2026                          │   │
│             │  │                                                       │   │
│             │  │                                   [Complete Sprint]   │   │
│             │  │                                                       │   │
│             │  └───────────────────────────────────────────────────────┘   │
│             │                                                               │
│             │  ┌─ Sprint Card ─────────────────────────────────────────┐   │
│             │  │                                                       │   │
│             │  │  Sprint 2              [future]  [5 issues]           │   │
│             │  │                                                       │   │
│             │  │  Plan the API redesign                                │   │
│             │  │                                                       │   │
│             │  │                                     [Start Sprint]    │   │
│             │  │                                                       │   │
│             │  └───────────────────────────────────────────────────────┘   │
│             │                                                               │
│             │  [Empty State if no sprints]                                 │
│             │  🏆 No sprints yet                                           │
│             │  Create a sprint to start planning work                      │
│             │  [Create Sprint]                                             │
│             │                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/_auth/_app/$orgSlug/projects/$key/sprints.tsx` | Route definition | 35 |
| `src/components/SprintManager.tsx` | All sprint UI logic | 267 |
| `convex/sprints.ts` | Sprint CRUD + queries | ~200 |

---

## Current Features

| Feature | Status | Notes |
|---------|--------|-------|
| List sprints | ✅ | Cards with status badges |
| Create sprint | ✅ | Name + optional goal |
| Start sprint | ✅ | Sets 2-week duration |
| Complete sprint | ✅ | Changes status to completed |
| Progress bar | ✅ | Time-based (not issue-based) |
| Issue count | ✅ | Badge showing total issues |
| Empty state | ✅ | Trophy icon + CTA |
| Loading state | ✅ | Skeleton cards |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | `card-subtle` wrapper | SprintManager.tsx:43 | LOW |
| 2 | Progress is time-based, not work-based | SprintManager.tsx:32-38 | MEDIUM |
| 3 | No sprint editing (name/goal/dates) | N/A | MEDIUM |
| 4 | No drag-and-drop between sprints | N/A | LOW |
| 5 | 2-week duration hardcoded | SprintManager.tsx:146 | LOW |
| 6 | No completed sprints archive | N/A | LOW |
| 7 | Badge using `getStatusColor` (issue util) | SprintManager.tsx:54 | LOW |

---

## Sprint States

| State | Value | Actions Available |
|-------|-------|-------------------|
| Future | `status: "future"` | Start Sprint |
| Active | `status: "active"` | Complete Sprint |
| Completed | `status: "completed"` | None |

---

## Data Model

```typescript
interface Sprint {
  _id: Id<"sprints">;
  name: string;
  goal?: string;
  projectId: Id<"projects">;
  status: "future" | "active" | "completed";
  startDate?: number;
  endDate?: number;
  createdAt: number;
  createdBy: Id<"users">;
}
```

---

## Summary

The sprints page is now part of the trustworthy screenshot baseline. Functionally it still covers
the basic lifecycle only:
- Create → Start → Complete

The remaining product gap is not harness-related anymore. It is the feature depth of the sprint
surface itself: editing, issue-based progress, planning, history, and richer analytics.

Current implementation is a good MVP. Main UX issues:
- Time-based progress bar is misleading (shows time elapsed, not work done)
- Can't edit sprint once created
- 2-week duration is fixed
