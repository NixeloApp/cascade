# Create Sprint/Cycle

## Overview

Creating a sprint (Cascade) or cycle (plane) is the first step in iteration planning. This allows teams to group issues into time-boxed periods for focused delivery.

---

## plane

### Trigger

- **Button**: "Add Cycle" in cycles list header
- **Location**: `/[workspace]/projects/[project]/cycles/`
- **Keyboard shortcut**: None for creation (Escape to close modal)

### UI Elements

**Modal**: `CycleCreateUpdateModal`
- Position: Top of viewport (`EModalPosition.TOP`)
- Width: XXL
- Backdrop click to close: Yes

**Form Fields** (`CycleForm`):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Project | Dropdown | Yes | Auto-selected, can change |
| Name | Text input | Yes | Max 255 chars, auto-focused |
| Description | TextArea | No | Min-height 24px |
| Start Date | DateRangeDropdown | No | Min date = today |
| End Date | DateRangeDropdown | No | Must be after start |

### Flow

1. User clicks "Add Cycle" button in header
2. Modal opens with form, name field auto-focused
3. Project pre-selected (can be changed via dropdown)
4. User enters cycle name (required)
5. Optionally adds description
6. Optionally selects date range
7. On submit:
   - If dates provided, validates no overlap with existing cycles
   - Creates cycle via `createCycle()` store method
   - Mutates `PROJECT_ACTIVE_CYCLE` cache if applicable
8. Modal closes on success

### Feedback

- **Success**: Toast notification, modal closes
- **Error**: Inline validation for date conflicts
- **Draft cycles**: Allowed without dates (no validation)

### Notable Features

- **Date overlap prevention**: Cannot create cycles with overlapping dates
- **Draft mode**: Cycles without dates are valid ("Draft" status)
- **Project switcher**: Can create cycle in different project from modal
- **Tab index support**: Full accessibility via `getTabIndex()`

---

## Cascade

### Trigger

- **Button**: "New Sprint" in sprint manager
- **Location**: `/[org]/projects/[key]/sprints`
- **Keyboard shortcut**: None

### UI Elements

**Inline Form** (not modal):
- Expands within SprintManager component
- Card-based design

**Form Fields**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Sprint Name | Text input | Yes | Non-empty after trim |
| Sprint Goal | TextArea (2 rows) | No | — |
| Duration | Preset selector | Yes | 1/2/3/4 weeks or Custom |
| Start Date | Date input | If Custom | HTML5 date validation |
| End Date | Date input | If Custom | HTML5 date validation |

**Duration Presets**:
- 1 Week (7 days) — "Short iteration for rapid delivery"
- 2 Weeks (14 days) — "Standard sprint duration" [DEFAULT]
- 3 Weeks (21 days) — "Extended sprint for larger features"
- 4 Weeks (28 days) — "Monthly iteration cycle"
- Custom — "Set custom start and end dates"

### Flow

1. User clicks "New Sprint" button
2. Inline form expands below button
3. User enters sprint name (required)
4. Optionally enters sprint goal
5. Selects duration preset (default: 2 weeks)
6. If "Custom" selected, date inputs appear
7. Clicks "Create Sprint"
8. Sprint created with `status: "future"`
9. Form collapses, sprint card appears in list

### Feedback

- **Success**: "Sprint created successfully" toast
- **Error**: "Failed to create sprint" toast with details
- **Validation**: Empty name prevented from submit

### Notable Features

- **Duration presets**: Quick selection for common sprint lengths
- **Inline form**: No modal, form expands in place
- **Future status**: New sprints start in "future" state
- **Start sprint separate**: Dates finalized when starting, not creating

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Trigger location | Header button | Inline in manager | tie |
| UI pattern | Modal | Inline form | plane (cleaner) |
| Keyboard shortcut | Escape to close | None | plane |
| Auto-focus name | Yes | No | plane |
| Duration presets | No | Yes (1-4 weeks) | Cascade |
| Date overlap check | Yes | No | plane |
| Draft/dateless support | Yes | Yes (future status) | tie |
| Project switcher | Yes (in modal) | No | plane |
| Description field | Yes | Yes (goal) | tie |
| Tab accessibility | Yes (`getTabIndex`) | Basic | plane |

---

## Recommendations

1. **Priority 1**: Add keyboard shortcut for creating sprints (e.g., `S` or `Shift+S`)
2. **Priority 2**: Auto-focus sprint name input when form opens
3. **Priority 3**: Consider modal pattern for consistency with other create flows
4. **Priority 4**: Add date overlap validation when starting sprints
5. **Priority 5**: Add ability to create sprint from different views (board, backlog)

---

## Screenshots/References

### plane
- Modal: `~/Desktop/plane/apps/web/core/components/cycles/modal.tsx`
- Form: `~/Desktop/plane/apps/web/core/components/cycles/form.tsx`
- Date validation: `CycleService.cycleDateCheck()`

### Cascade
- Manager: `~/Desktop/cascade/src/components/SprintManager.tsx`
- Presets: `~/Desktop/cascade/src/lib/sprint-presets.ts`
- Backend: `~/Desktop/cascade/convex/sprints.ts` (create mutation)
