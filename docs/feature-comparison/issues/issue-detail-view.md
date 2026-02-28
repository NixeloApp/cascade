# Issue Detail View - Deep UX Comparison

## Overview
The issue detail view is where users spend significant time reviewing and updating issues. This analysis compares Plane vs Cascade across every UX dimension including view modes, clicks, properties, and keyboard support.

---

## Entry Points Comparison

### How Users Access Issue Details

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Click on list item** | Side peek slides in | Sheet slides in | Tie |
| **Click on kanban card** | Side peek slides in | Sheet slides in | Tie |
| **Click on calendar event** | Side peek slides in | Sheet slides in | Tie |
| **Direct URL** | Full page view | Full page view | Tie |
| **Keyboard `Enter`** | Opens peek for focused item | Not implemented | Plane |
| **Right-click context menu** | "Open" option | Not implemented | Plane |
| **Command palette** | `Cmd+K` → "Open issue" | Not implemented | Plane |
| **Notification click** | Opens peek from notification | Opens sheet | Tie |
| **Arrow keys navigation** | Move between issues while peek open | Not implemented | Plane |

**Entry Points Score:** Plane 4, Cascade 0, Tie 5

---

## View Mode Analysis

### Available View Modes

| Mode | Plane | Cascade |
|------|-------|---------|
| **Side peek** | 50% width, right side | max-w-2xl Sheet |
| **Modal** | 5/6 screen centered | N/A |
| **Full screen** | Fills viewport with margins | N/A |
| **Full page** | Dedicated route | Dedicated route |

### Plane View Modes (3 options)
```
┌─────────────────────────────────────────────────────────────────────┐
│ Side Peek (default)                                                  │
├─────────────────────────────────┬───────────────────────────────────┤
│                                 │                                   │
│  Issue List/Board               │  Issue Detail (50% width)         │
│  (visible, interactive)         │  ┌───────────────────────────┐   │
│                                 │  │ Header: PROJ-123 [⋮]      │   │
│  [Card] [Card] [Card]          │  │ Title (editable)          │   │
│  [Card] [Card] [Card]          │  │ Description (rich text)   │   │
│  [Card] [Card] [Card]          │  │ Activity tabs             │   │
│                                 │  │                           │   │
│                                 │  │ Properties sidebar        │   │
│                                 │  └───────────────────────────┘   │
└─────────────────────────────────┴───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Modal (centered overlay)                                             │
├─────────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░┌─────────────────────────────────────────────────────┐░░░░░░░░░░│
│ ░░░│                Issue Detail (5/6 screen)            │░░░░░░░░░░│
│ ░░░│  Header: PROJ-123 [Actions ▼]                       │░░░░░░░░░░│
│ ░░░│  ┌───────────────────────────────────────────────┐  │░░░░░░░░░░│
│ ░░░│  │ Title (large, editable inline)               │  │░░░░░░░░░░│
│ ░░░│  │ Description (rich text editor)               │  │░░░░░░░░░░│
│ ░░░│  │ [Widgets] [Activity]                         │  │░░░░░░░░░░│
│ ░░░│  └───────────────────────────────────────────────┘  │░░░░░░░░░░│
│ ░░░│  Properties (below content in modal mode)           │░░░░░░░░░░│
│ ░░░└─────────────────────────────────────────────────────┘░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Full Screen                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────────┐│
│ │                    Issue Detail (with margins)                    ││
│ │                                                                   ││
│ │  ┌─────────────────────────────┬────────────────────────────────┐││
│ │  │ Main Content                │ Properties Sidebar (400px)    │││
│ │  │ Title                       │ State: [dropdown]             │││
│ │  │ Description                 │ Assignees: [multi-select]     │││
│ │  │ Widgets                     │ Priority: [dropdown]          │││
│ │  │ Activity                    │ Dates, Labels, etc.           │││
│ │  └─────────────────────────────┴────────────────────────────────┘││
│ └───────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Cascade View Mode (1 mode + full page)
```
┌─────────────────────────────────────────────────────────────────────┐
│ Sheet (slide-out from right)                                         │
├─────────────────────────────────────────────┬───────────────────────┤
│                                             │ max-w-2xl             │
│  Issue List/Board                           │                       │
│  (visible, NOT interactive - backdrop)      │ Header:               │
│                                             │ [Icon] PROJ-123 [📋]  │
│  [Card] [Card] [Card]                      │ Priority badge        │
│  [Card] [Card] [Card]                      │ Title                 │
│  [Card] [Card] [Card]                      │ [Edit] button         │
│                                             │─────────────────────│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ Content + Sidebar    │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ (stacked, scrollable)│
│                                             │                       │
└─────────────────────────────────────────────┴───────────────────────┘
```

**View Modes Score:** Plane 3 modes, Cascade 1 mode (+full page)

---

## Header Comparison

### Plane Header
```
┌─────────────────────────────────────────────────────────────────────┐
│ [PROJECT-123] ← identifier                                           │
│ ┌──────────────────────────────────────────────────────────────────┐│
│ │ [Breadcrumb: Project > Issues > PROJ-123]                        ││
│ ├──────────────────────────────────────────────────────────────────┤│
│ │ [◀ ▶] ← Peek mode buttons   [Subscribe 🔔] [Copy 📋] [⋮ Actions]││
│ │                             ↑ icon toggles    ↑ dropdown menu   ││
│ └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│ Actions dropdown contains:                                           │
│  • Edit issue                                                        │
│  • Duplicate issue                                                   │
│  • Archive issue                                                     │
│  • Delete issue                                                      │
│  • Open in new tab                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Cascade Header
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Icon] PROJ-123 [📋 Copy] [Priority Badge]                          │
│                                                                      │
│ Issue Title Text                                                     │
│                                                                      │
│ [Edit] button (if canEdit && !isEditing)                            │
└─────────────────────────────────────────────────────────────────────┘
```

| Header Element | Plane | Cascade | Notes |
|----------------|-------|---------|-------|
| **Issue identifier** | In breadcrumb + display | Prominent with icon | Cascade slightly cleaner |
| **Copy button** | In actions menu | Direct button + tooltip | Cascade more accessible |
| **Priority display** | In sidebar only | Badge in header | Cascade shows priority sooner |
| **Subscribe/Watch** | Header button with toggle | Not in header | Plane |
| **Peek mode buttons** | Arrows to switch modes | N/A | Plane |
| **Actions dropdown** | Full menu (edit, dup, archive, delete) | No dropdown, just Edit button | Plane |
| **Breadcrumb** | Full navigation path | N/A | Plane |

---

## Sidebar Properties Comparison

### Property Count & Types

| Property | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| **State/Status** | Dropdown | Dropdown | Both |
| **Assignees** | Multi-select with avatars | Single-select | **Plane wins** |
| **Priority** | Dropdown with icons | Dropdown | Both |
| **Created by** | Display only (avatar + name) | Reporter field (dropdown) | Different approach |
| **Start date** | Date picker with calendar | N/A | **Plane wins** |
| **Due date** | Date picker + overdue highlight | N/A | **Plane wins** |
| **Estimate** | Dropdown (when enabled) | Story points dropdown | Both |
| **Module** | Multi-select | N/A (no modules) | N/A |
| **Cycle/Sprint** | Dropdown | Via sprint context | Different |
| **Parent issue** | Search modal | N/A | **Plane wins** |
| **Labels** | Multi-select with colors | Multi-select | Both |
| **Worklog** | Time tracking widget | Estimated hours | Different |
| **Issue type** | In header/modal | Dropdown in sidebar | Different placement |
| **Custom fields** | Dynamic additional properties | N/A | **Plane wins** |

**Property Count:** Plane ~13+, Cascade ~8

### Sidebar Layout

**Plane Sidebar (fixed right, 300-400px)**
```
┌─────────────────────────────────┐
│ Properties                      │
├─────────────────────────────────┤
│ 🏷️ State       [Dropdown ▼]    │ ← Inline editable
│ 👥 Assignees   [Avatar +Add]   │ ← Multi-select
│ ⚡ Priority    [Icon] Medium   │ ← Visual indicator
│ 👤 Created by  [Avatar] Name   │ ← Display only
│ 📅 Start date  [Date picker]   │ ← With constraints
│ 📅 Due date    [Date picker]   │ ← Highlights overdue
│ 📊 Estimate    [None ▼]        │ ← When enabled
│ 📦 Module      [Select ▼]      │ ← Multi-select
│ 🔄 Cycle       [Select ▼]      │ ← With transfer info
│ ⬆️ Parent      [Search...]     │ ← Modal search
│ 🏷️ Labels      [Bug ×] [+Add]  │ ← Inline create
│ ⏱️ Worklog     [Track time]    │ ← Widget
│ + Additional properties...      │ ← Dynamic/custom
└─────────────────────────────────┘
```

**Cascade Sidebar (responsive, stacked on mobile)**
```
┌─────────────────────────────────┐
│ 📊 Status     [To Do ▼]        │
│ 🔧 Type       [Task ▼]         │
│ ⚡ Priority   [Medium ▼]       │
│ 👤 Assignee   [Select ▼]       │ ← Single only
│ 👤 Reporter   [Select ▼]       │
│ 📈 Story Pts  [3 ▼]            │
│ 🏷️ Labels     [Bug ×] [+]      │
│ ⏱️ Est. Hours [number]         │ ← If billing enabled
└─────────────────────────────────┘
```

---

## Click Analysis

### Minimum Clicks to Complete Actions

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **View issue** | 1 click | 1 click | Both open on single click |
| **Copy issue link** | 2 clicks (actions → copy) | 1 click (direct button) | **Cascade wins** |
| **Change status** | 2 clicks (open dropdown → select) | 2 clicks | Tie |
| **Add assignee** | 2 clicks | 2 clicks | Tie |
| **Remove assignee** | 2 clicks (open → click X) | N/A (single assignee) | N/A |
| **Add multiple assignees** | N clicks (open once, click N) | N/A | Plane only |
| **Change priority** | 2 clicks | 2 clicks | Tie |
| **Set due date** | 2 clicks (open picker → select) | N/A | Plane only |
| **Subscribe to issue** | 1 click (header toggle) | N/A | Plane only |
| **Archive issue** | 3 clicks (actions → archive → confirm) | N/A | Plane only |
| **Delete issue** | 3 clicks (actions → delete → confirm) | N/A | Plane only |
| **Switch peek modes** | 1 click (mode buttons) | N/A | Plane only |
| **Close peek** | 1 click (X or Escape) | 1 click | Tie |

---

## Keyboard Support

| Shortcut | Plane | Cascade |
|----------|-------|---------|
| **Escape** | Close peek/return to list | Close sheet |
| **Arrow Up/Down** | Navigate to prev/next issue (in peek) | N/A |
| **Enter** | Open focused issue | N/A |
| **Tab** | Navigate through fields | Navigate through fields |
| **Ctrl+Enter** | Submit comment | N/A |

**Keyboard Score:** Plane has more keyboard shortcuts

---

## Content Area Comparison

### Main Content Features

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Title** | Inline editable, large text | Display only (edit via button) |
| **Description** | Rich text editor (collaborative) | Textarea (edit mode) |
| **Edit mode** | Always editable (no explicit toggle) | Explicit Edit button |
| **Activity tabs** | All / Comments / Activity (3 tabs) | Single activity feed |
| **Comment input** | Rich text with file attachments | Not visible in sheet |
| **Reactions** | On issue and comments | N/A |
| **Real-time** | MobX reactive + optimistic | Convex reactive |

### Widgets Section

| Widget | Plane | Cascade |
|--------|-------|---------|
| **Sub-issues** | Collapsible list with progress | SubtasksList component |
| **Relations** | Blocking/blocked by/related | Dependencies section |
| **Links** | External URL links | N/A |
| **Attachments** | File upload/download | FileAttachments |
| **Watchers** | N/A | IssueWatchers |

---

## Loading & Error States

| State | Plane | Cascade |
|-------|-------|---------|
| **Initial load** | Skeleton loader for sections | Skeleton with pulse animation |
| **Error** | Error component with retry | N/A (handled by parent) |
| **Empty state** | EmptyState component with CTA | Returns null |
| **Saving** | isSubmitting state indicator | N/A |
| **Optimistic updates** | Via MobX stores | Via Convex optimistic |

---

## Accessibility

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Focus trap** | In modal/peek modes | In Sheet component |
| **Escape to close** | Implemented | Implemented |
| **Screen reader labels** | aria-labels on buttons | aria-labels + live regions |
| **Focus management** | Returns focus to trigger | Via Sheet component |
| **Loading announcements** | N/A | aria-live="polite" on loading |
| **Test IDs** | Various | TEST_IDS.ISSUE.DETAIL_MODAL |

---

## Mobile/Responsive

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Peek width** | Full width on mobile | max-w-xl on sm, max-w-2xl on lg |
| **Sidebar** | Stacks below content | Stacks below content |
| **Touch gestures** | N/A | N/A |
| **Swipe to close** | N/A | N/A |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| View modes | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane has 3 modes vs 1 |
| Entry points | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane has keyboard nav |
| Header actions | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane has more options |
| Property count | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane 13+ vs Cascade 8 |
| Multi-assignee | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Date fields | ⭐⭐⭐⭐⭐ | ⭐ | Plane has start/due |
| Inline editing | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane always editable |
| Activity tabs | ⭐⭐⭐⭐ | ⭐⭐ | Plane has filtered tabs |
| Keyboard support | ⭐⭐⭐⭐ | ⭐⭐ | Plane has arrow nav |
| Copy link UX | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade 1-click copy |
| Loading states | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Both good |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Add peek mode toggle** - Allow users to switch between side-peek, modal, and full-screen views
2. **Multi-assignee support** - Enable multiple assignees per issue

### P1 - High
3. **Inline editing** - Remove explicit Edit button, make fields directly editable
4. **Add start/due date fields** - Essential for project management
5. **Actions dropdown menu** - Archive, delete, duplicate from header
6. **Arrow key navigation** - Navigate between issues while peek is open

### P2 - Medium
7. **Activity tabs** - Separate Comments from Activity history
8. **Subscribe/Watch toggle** - Quick header button to follow issue
9. **Parent issue selector** - Enable sub-issue creation
10. **Rich text comments** - With file attachments

### P3 - Nice to Have
11. **Custom fields** - User-defined additional properties
12. **Reactions on comments** - Emoji reactions
13. **Links widget** - External URL attachments

---

## Code References

### Plane
- Root: `apps/web/core/components/issues/issue-detail/root.tsx`
- Peek Overview: `apps/web/core/components/issues/peek-overview/root.tsx`
- View Component: `apps/web/core/components/issues/peek-overview/view.tsx`
- Sidebar: `apps/web/core/components/issues/issue-detail/sidebar.tsx`
- Quick Actions: `apps/web/core/components/issues/issue-detail/issue-detail-quick-actions.tsx`
- Activity: `apps/web/core/components/issues/issue-detail/issue-activity/root.tsx`
- Widgets: `apps/web/core/components/issues/issue-detail-widgets/root.tsx`

### Cascade
- Sheet: `src/components/IssueDetailSheet.tsx`
- Layout: `src/components/IssueDetailView/IssueDetailLayout.tsx`
- Header: `src/components/IssueDetailView/IssueDetailHeader.tsx`
- Content: `src/components/IssueDetailView/IssueDetailContent.tsx`
- Sidebar: `src/components/IssueDetailView/IssueDetailSidebar.tsx`
- Hook: `src/components/IssueDetailView/useIssueDetail.ts`
