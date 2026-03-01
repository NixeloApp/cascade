# Create Sprint/Cycle - Deep UX Comparison

## Overview
Creating a sprint (Cascade) or cycle (Plane) is the first step in iteration planning. This allows teams to group issues into time-boxed periods for focused delivery. This analysis compares Plane vs Cascade across triggers, modals, form fields, and UX efficiency.

---

## Entry Points Comparison

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Primary button** | "Add Cycle" in header | "New Sprint" in manager | Tie |
| **Sidebar action** | N/A | N/A | Tie |
| **Context menu** | N/A | N/A | Tie |
| **Keyboard shortcut** | Escape (close only) | None | Tie |
| **Command palette** | N/A | N/A | Tie |
| **Empty state CTA** | "Create your first cycle" | "Create Sprint" | Tie |
| **URL direct** | `/[ws]/projects/[proj]/cycles/create` | N/A | Plane |

---

## Layout Comparison

### Plane Cycle Creation
```
Location: Modal overlay (top-center)
┌─────────────────────────────────────────────────────────────────────────────┐
│ Cycles List Page Header                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🔄 Cycles                           [🔍 Search] [+ Add Cycle] ← Trigger     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Active Cycle                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ⭕ 75%  Sprint 5  •  Jan 15 - Jan 29  •  👤👤👤  •  [⭐] [⋯]           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ▼ Upcoming Cycles (3)                                                       │
│   ...                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Modal (CycleCreateUpdateModal):
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Create Cycle                                  [×] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Project *                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [🔵 Current Project ▼]                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Cycle Name *                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Sprint 6 (auto-focused)                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Description                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Optional description...                                             │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Date Range                                                                 │
│  ┌───────────────────────────┐  ┌───────────────────────────┐              │
│  │ [📅 Start Date]           │  │ [📅 End Date]             │              │
│  └───────────────────────────┘  └───────────────────────────┘              │
│  (Optional - leave blank for Draft status)                                  │
│                                                                             │
│                                         [Cancel]  [Create Cycle]           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
Position: EModalPosition.TOP (center-top of viewport)
Width: max-w-xl (XXL size)
Backdrop: Click to close
```

### Cascade Sprint Creation
```
Location: Inline form (expands in place)
┌─────────────────────────────────────────────────────────────────────────────┐
│ Sprint Manager Page                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Sprints                                                                      │
│                                                                             │
│ [+ New Sprint] ← Primary trigger                                            │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Sprint Name *                                                           ││
│ │ ┌─────────────────────────────────────────────────────────────────────┐││
│ │ │ Enter sprint name...                                                │││
│ │ └─────────────────────────────────────────────────────────────────────┘││
│ │                                                                         ││
│ │ Sprint Goal                                                             ││
│ │ ┌─────────────────────────────────────────────────────────────────────┐││
│ │ │ Optional goal for this sprint...                                    │││
│ │ │                                                                      │││
│ │ └─────────────────────────────────────────────────────────────────────┘││
│ │                                                                         ││
│ │ Duration                                                                ││
│ │ ┌─────────────────────────────────────────────────────────────────────┐││
│ │ │ ( ) 1 Week   (●) 2 Weeks   ( ) 3 Weeks   ( ) 4 Weeks   ( ) Custom  │││
│ │ │      ↑            ↑                                         ↑       │││
│ │ │   7 days     14 days (default)                         Show dates   │││
│ │ └─────────────────────────────────────────────────────────────────────┘││
│ │                                                                         ││
│ │ (When Custom selected):                                                 ││
│ │ ┌───────────────────────────┐  ┌───────────────────────────┐           ││
│ │ │ [📅 Start Date]           │  │ [📅 End Date]             │           ││
│ │ └───────────────────────────┘  └───────────────────────────┘           ││
│ │                                                                         ││
│ │                                     [Cancel]  [Create Sprint]          ││
│ │                                                                         ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─ Sprint 5 ─────────────────────────────────────────────────────────────┐ │
│ │ 🟢 Active  •  12 issues  •  Jan 15 - Jan 29                    [...]  │ │
│ │ Goal: Complete payment integration                                     │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░  8 of 12 (67%)            │ │
│ │                                                [Complete Sprint]       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Form Fields Comparison

| Field | Plane | Cascade | Notes |
|-------|-------|---------|-------|
| **Name** | Required, auto-focused | Required | Plane auto-focus |
| **Description/Goal** | TextArea | TextArea (2 rows) | Tie |
| **Project** | Dropdown (switchable) | Implicit (current project) | Plane more flexible |
| **Start Date** | Date picker (optional) | Date picker (if Custom) | Different UX |
| **End Date** | Date picker (optional) | Date picker (if Custom) | Different UX |
| **Duration presets** | N/A | 1/2/3/4 weeks + Custom | **Cascade** |

### Form Field Count

| Metric | Plane | Cascade |
|--------|-------|---------|
| Required fields | 2 (project, name) | 2 (name, duration) |
| Optional fields | 3 (description, start, end) | 2 (goal, custom dates) |
| Total form fields | 5 | 4 |
| Duration presets | 0 | 5 |

---

## Click Analysis

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Create minimal sprint** | 3 clicks (+ → name → create) | 3 clicks (+ → name → create) | Tie |
| **Create with dates** | 5 clicks (+ dates picker × 2 + create) | 2 clicks (preset + create) | **Cascade faster** |
| **Create 2-week sprint** | 5 clicks | 3 clicks (+ → name → create) | **Cascade** (preset default) |
| **Create custom duration** | 5 clicks | 5 clicks (+ → name → custom → dates → create) | Tie |
| **Create in different project** | 4 clicks (+ → project dropdown → name → create) | N/A | Plane only |
| **Cancel creation** | 1 click (Cancel/Escape/backdrop) | 1 click (Cancel) | Tie |
| **Close modal** | 1 click (×) | N/A (inline) | Different UX |

---

## Creation Flow Comparison

### Plane Flow (Modal-based)
```
User Journey:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Click [+ Add] │───▶│ Modal opens  │───▶│ Fill fields  │───▶│Click Create  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      │                   │                    │                   │
   1 click          (auto-focus)          2-4 clicks          1 click
      │                   │                    │                   │
      ▼                   ▼                    ▼                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        Total: 4-6 clicks                                   │
│                        Modals: 1                                            │
│                        Form fields visible: All at once                     │
└────────────────────────────────────────────────────────────────────────────┘
```

### Cascade Flow (Inline Form)
```
User Journey:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Click [+ New] │───▶│ Form expands │───▶│ Fill fields  │───▶│Click Create  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      │                   │                    │                   │
   1 click         (inline expand)        2-3 clicks          1 click
      │                   │                    │                   │
      ▼                   ▼                    ▼                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        Total: 3-5 clicks                                   │
│                        Modals: 0                                            │
│                        Duration presets: Reduce date selection friction     │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Duration Presets (Cascade Only)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Duration                                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ( ) 1 Week                                                                 │
│      "Short iteration for rapid delivery" (7 days)                          │
│                                                                             │
│  (●) 2 Weeks  [DEFAULT]                                                     │
│      "Standard sprint duration" (14 days)                                   │
│                                                                             │
│  ( ) 3 Weeks                                                                │
│      "Extended sprint for larger features" (21 days)                        │
│                                                                             │
│  ( ) 4 Weeks                                                                │
│      "Monthly iteration cycle" (28 days)                                    │
│                                                                             │
│  ( ) Custom                                                                 │
│      "Set custom start and end dates"                                       │
│      ↓ (reveals date inputs when selected)                                  │
│      ┌───────────────────┐  ┌───────────────────┐                          │
│      │ [📅 Start Date]   │  │ [📅 End Date]     │                          │
│      └───────────────────┘  └───────────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Date Validation

| Validation | Plane | Cascade |
|------------|-------|---------|
| **Start < End** | Yes | Yes (HTML5) |
| **Start >= Today** | Yes | No |
| **Overlap prevention** | Yes (API validation) | No |
| **Draft without dates** | Yes | Yes ("future" status) |
| **Date format** | Date range dropdown | HTML5 date input |

### Plane Date Overlap Prevention
```
Create Cycle API:
1. User selects dates
2. cycleDateCheck() called
3. Compares with existing cycles in project
4. Returns error if overlap detected
5. User must adjust dates

Error Message:
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Date conflict                                                            │
│ These dates overlap with "Sprint 5" (Jan 15 - Jan 29).                      │
│ Please select different dates.                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Keyboard Support

| Shortcut | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| **Create sprint** | N/A | N/A | Neither |
| **Focus name** | Auto-focus on open | Manual click | Plane better |
| **Submit form** | Enter (in single-line) | Enter? | Plane |
| **Cancel/Close** | Escape | Escape? | Plane documented |
| **Tab navigation** | Full (getTabIndex) | Basic | Plane |

---

## Loading & Feedback

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Loading indicator** | Button spinner | Button spinner |
| **Success feedback** | Toast + modal closes | Toast + form collapses |
| **Error feedback** | Inline validation | Toast with error |
| **Date conflict** | Inline error message | N/A |
| **Validation timing** | On submit | On submit |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Click efficiency | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade presets faster |
| Duration presets | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Auto-focus | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane auto-focuses |
| Project flexibility | ⭐⭐⭐⭐⭐ | ⭐ | Plane can switch project |
| Date validation | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane overlap check |
| UI pattern | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Modal vs inline |
| Keyboard support | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane full tab support |
| Form simplicity | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade fewer fields |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Add auto-focus to name field** - Focus input when form expands
   ```tsx
   useEffect(() => {
     if (isExpanded) {
       nameInputRef.current?.focus();
     }
   }, [isExpanded]);
   ```
2. **Add date overlap validation** - Prevent overlapping sprints (data integrity)
3. **Add past date prevention** - Require start date >= today (prevents user error)

### P1 - High
4. **Add keyboard shortcut** - `Cmd/Ctrl+Shift+S` or just `S` to create sprint
5. **Auto-calculate end date** - When start date selected with preset duration

### P2 - Medium
6. **Add project switcher** - Allow creating sprint in different project from context
7. **Add sprint templates** - Pre-fill name patterns like "Sprint {N}"
8. **Add recurrence option** - Auto-create next sprint

### P3 - Nice to Have
9. **Add calendar view for date selection** - Visual date range picker
10. **Add sprint capacity planning** - Team velocity-based suggestions
11. **Add import from backlog** - Pre-select issues during creation

---

## Code References

### Plane
- Modal: `apps/web/core/components/cycles/modal.tsx`
- Form: `apps/web/core/components/cycles/form.tsx`
- Date validation: `apps/web/core/services/cycle.service.ts` → `cycleDateCheck`
- Store: `apps/web/core/store/cycle.store.ts`
- Date dropdown: `apps/web/core/components/cycles/date-range-dropdown.tsx`

### Cascade
- Sprint manager: `src/components/SprintManager.tsx`
- Duration presets: `src/lib/sprint-presets.ts` (if exists)
- Backend: `convex/sprints.ts` → `create` mutation
- Route: `src/routes/_auth/_app/$orgSlug/projects/$key/sprints.tsx`
