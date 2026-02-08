# Project Board (Kanban)

> **Status**: TODO - Awaiting Implementation
> **Priority**: HIGH (Phase 4 - Dashboard & App)

---

## Current State Analysis

**Screenshot**: `e2e/screenshots/10-filled-project-demo-board.png`

### Visual Description (Current Nixelo)

The current Kanban board page features:

1. **Global Header**:
   - Left: "Nixelo E2E" workspace name with sidebar toggle icon
   - Right: Commands button (Cmd+K), Help icon, "Start Timer" button, Search (Cmd+K), Notifications bell, User avatar

2. **Project Tab Navigation**:
   - Horizontal tab bar: Board (active, underlined), Backlog, Roadmap, Calendar, Activity, Analytics, Billing, Timesheet, Settings
   - Active tab has subtle underline indicator

3. **Project Header**:
   - "Demo Project" title with "DEMO" badge and "kanban" badge (green pill)
   - Right side: Import / Export button

4. **Filter Bar**:
   - Four dropdown buttons: Type, Priority, Assignee, Labels
   - Each with chevron-down icon
   - Ghost button variant, subtle styling

5. **Sprint Board Section**:
   - "Sprint Board" heading on the left
   - Right side: Undo/Redo arrows, "Select Multiple" button

6. **Kanban Columns** (4 columns):
   - **To Do** (0 issues) - Gray status bar at top
   - **In Progress** (1 issue) - Blue status bar at top
   - **In Review** (1 issue) - Purple status bar at top
   - **Done** (1 issue) - Green status bar at top
   - Each column has a "+" button for adding issues

7. **Issue Cards**:
   - White cards with subtle shadow on light gray column background
   - Card anatomy:
     - Type icon (bug, task, story) with colored background
     - Issue key (e.g., "DEMO-2", "DEMO-3", "DEMO-1")
     - Priority indicator (double arrows for high, dash for medium, down arrow for low)
     - Title text
     - Assignee avatar (small circular) in bottom left

8. **Sidebar Navigation**:
   - Dashboard, Issues, Calendar
   - Documents (expandable with Templates)
   - Workspaces (expandable with Product)
   - Time Tracking
   - Settings at bottom

### Issues Identified

| Issue | Severity | Notes |
|-------|----------|-------|
| Column background too prominent | MEDIUM | Light gray columns on white page feels heavy |
| Cards lack visual hierarchy | MEDIUM | All elements similar visual weight |
| Status bar colors not semantic | LOW | Could use more distinct workflow indicators |
| Filter bar feels disconnected | MEDIUM | Should integrate more with column headers |
| No visible drag affordance | LOW | Cards don't indicate draggability clearly |
| Column headers could be more compact | LOW | Wasted vertical space |
| "Sprint Board" section title redundant | LOW | Tab already indicates Board view |
| No empty state guidance in To Do | LOW | 0 count but no prompt to add |

---

## Target State

**Reference**:
- Linear board view patterns (keyboard-first, fast drag-drop)
- Jira board patterns (filter integration, swimlanes)
- Mintlify dashboard polish (subtle backgrounds, micro-interactions)

### Key Improvements

1. **Reduced visual weight** - Columns blend into page, cards are the focus
2. **Elevated card design** - Subtle hover lift, priority color accents
3. **Integrated filter bar** - Sticky, prominent, quick-access
4. **Clear drag affordance** - Cursor change, shadow on grab
5. **Status colors as accent** - Top border, not full bar
6. **Keyboard shortcuts visible** - Quick-add, navigation hints
7. **Empty column guidance** - Prompt to add first issue
8. **Smooth animations** - Drag preview, column highlight, card settle

### Linear-Inspired Patterns

- Minimal column chrome, maximum card focus
- Command palette for quick issue creation (`C` key)
- Keyboard navigation between cards (arrow keys)
- Instant optimistic updates on drag
- Subtle column highlight on drag-over
- Card count in column header pill badge

### Jira-Inspired Patterns

- Persistent filter bar with clear active states
- Saved filter dropdown
- WIP limits per column (optional display)
- Swimlane grouping option (by assignee, priority)
- Quick filters (My Issues, Recently Updated)

---

## ASCII Wireframe

### Target Layout (Desktop, Dark Mode)

```
+-------------------------------------------------------------------------------------------+
| [=] Nixelo E2E                      [Commands Cmd+K] [?] [> Timer] [Search Cmd+K] [N] [AV]|
+-------------------------------------------------------------------------------------------+
| Board  Backlog  Roadmap  Calendar  Activity  Analytics  Billing  Timesheet  Settings      |
| -----                                                                                     |
+-------------------------------------------------------------------------------------------+
| Demo Project  [DEMO]  [kanban]                                    [Import/Export]         |
+-------------------------------------------------------------------------------------------+
| [Type v]  [Priority v]  [Assignee v]  [Labels v]  |  [x Clear (2)]  [Save Filter]  |  Q  |
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  Sprint Board                                                   [<] [>]  Select Multiple  |
|                                                                                           |
|  +---------------------+  +---------------------+  +---------------------+  +-----------+ |
|  | ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ |  | ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ |  | ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ |  | ▬▬▬▬▬▬▬▬▬ | |
|  | (gray bar)          |  | (blue bar)          |  | (purple bar)        |  | (green)   | |
|  +---------------------+  +---------------------+  +---------------------+  +-----------+ |
|  | To Do          0 [+]|  | In Progress    1 [+]|  | In Review      1 [+]|  | Done   1  | |
|  +---------------------+  +---------------------+  +---------------------+  +-----------+ |
|  |                     |  | +------------------+|  | +------------------+|  | +---------+| |
|  |   Drop an issue     |  | |[BUG] DEMO-2   !!||  | |[TSK] DEMO-3    - ||  | |[OK] DEM|| |
|  |   here or press     |  | |Fix login timeout ||  | |Design dashboard  ||  | |Set up C|| |
|  |   [C] to create     |  | |on mobile         ||  | |layout            ||  | |pipeline|| |
|  |                     |  | |               [A]||  | |               [A]||  | |      [A]|| |
|  |                     |  | +------------------+|  | +------------------+|  | +---------+| |
|  |                     |  |                     |  |                     |  |           | |
|  |                     |  |                     |  |                     |  |           | |
|  |                     |  |                     |  |                     |  |           | |
|  |                     |  |                     |  |                     |  |           | |
|  +---------------------+  +---------------------+  +---------------------+  +-----------+ |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
```

### Issue Card Detail (Expanded View)

```
+----------------------------------------+
| ▸ border-t-4 (status color)            |
+----------------------------------------+
|  [BUG]  DEMO-2                     [!!]|  <- Type icon, Key, Priority
|                                        |
|  Fix login timeout on mobile           |  <- Title (truncate at 2 lines)
|                                        |
|  [Label 1] [Label 2]             [AV]  |  <- Labels, Assignee avatar
+----------------------------------------+
   ^                                  ^
   p-3 padding                        hover: shadow-md, scale-hover-subtle
```

### Card States

```
DEFAULT                    HOVER                      DRAGGING
+------------------+      +------------------+       +------------------+
| border-ui-border |      | border-ui-border |       | border-brand     |
| bg-ui-bg         |      | bg-ui-bg         |       | bg-ui-bg-hover   |
| shadow-sm        |      | shadow-md        |       | shadow-lg        |
|                  |      | scale(1.02)      |       | opacity-80       |
+------------------+      +------------------+       | rotate(-2deg)    |
                                                     +------------------+

SELECTED                   FOCUSED (keyboard)         DROP TARGET
+------------------+      +------------------+       +------------------+
| border-brand     |      | ring-2 ring-brand|       | Column bg        |
| bg-brand-subtle  |      | border-brand     |       | becomes          |
| [checkbox shown] |      |                  |       | bg-brand-subtle  |
+------------------+      +------------------+       +------------------+
```

### Column Empty State

```
+---------------------+
| ▬▬▬▬▬▬▬ (status)   |
| To Do          0 [+]|
+---------------------+
|                     |
|    +-------------+  |
|    |    [icon]   |  |
|    |             |  |
|    | No issues   |  |
|    | here yet    |  |
|    |             |  |
|    | [+ Create]  |  |
|    | or drag one |  |
|    | here        |  |
|    +-------------+  |
|                     |
+---------------------+
```

---

## Functionality Breakdown

### Drag and Drop

- [x] Drag issue card to different column (change status)
- [x] Reorder issues within same column
- [x] Visual feedback during drag (card shadow, column highlight)
- [ ] **Polish**: Ghost card preview during drag
- [ ] **Polish**: Smooth animation when card settles
- [ ] **Polish**: Haptic-style bounce on drop
- [ ] **Enhancement**: Multi-select drag (drag selected cards together)

### Filtering

- [x] Filter by type (Bug, Task, Story, Epic)
- [x] Filter by priority (Highest to Lowest)
- [x] Filter by assignee
- [x] Filter by labels
- [x] Clear all filters
- [x] Save filter configuration
- [x] Load saved filters
- [ ] **Enhancement**: Quick filters (My Issues, Unassigned, Recently Updated)
- [ ] **Enhancement**: Filter URL persistence (shareable filter state)

### Card Interactions

- [x] Click to open issue detail modal
- [x] Drag to reorder/move
- [x] Selection mode with checkboxes
- [x] Keyboard navigation (arrow keys)
- [ ] **Enhancement**: Right-click context menu
- [ ] **Enhancement**: Inline quick edit (title, assignee)
- [ ] **Enhancement**: Hover to show quick actions (assign, priority, labels)

### Keyboard Shortcuts

- [x] Arrow keys: Navigate between cards
- [x] Enter: Open selected card
- [ ] **Enhancement**: `C`: Create new issue (open modal)
- [ ] **Enhancement**: `E`: Edit focused card
- [ ] **Enhancement**: `A`: Assign to me
- [ ] **Enhancement**: `L`: Add label
- [ ] **Enhancement**: `P`: Change priority
- [ ] **Enhancement**: `M`: Move to column (submenu)
- [ ] **Enhancement**: `Backspace/Delete`: Archive issue

### Board Actions

- [x] Undo/Redo for drag operations
- [x] Select multiple for bulk operations
- [ ] **Enhancement**: Column WIP limits (show warning when exceeded)
- [ ] **Enhancement**: Collapse/expand columns
- [ ] **Enhancement**: Hide empty columns option
- [ ] **Enhancement**: Swimlane grouping (by assignee, priority, label)

---

## Component Inventory

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **KanbanBoard** | `src/components/KanbanBoard.tsx` | Keep structure, polish styling | Main container |
| **KanbanColumn** | `src/components/Kanban/KanbanColumn.tsx` | Reduce chrome, add empty state | Column wrapper |
| **IssueCard** | `src/components/IssueCard.tsx` | Enhanced hover, drag states | Card component |
| **FilterBar** | `src/components/FilterBar.tsx` | Add quick filters, sticky | Filter controls |
| **BoardToolbar** | `src/components/Kanban/BoardToolbar.tsx` | Integrate with Sprint selector | Sprint + actions |
| **ColumnHeader** | Inline in KanbanColumn | Extract, add collapse | Header with count |
| **EmptyColumn** | N/A | Create new | Empty state message |
| **CardQuickActions** | N/A | Create new | Hover action buttons |
| **DragPreview** | N/A | Create new | Ghost card during drag |

### New Components Needed

1. **ColumnHeader**: Extracted column header with name, count badge, add button, collapse toggle
2. **EmptyColumnState**: Illustration + text + CTA for empty columns
3. **CardQuickActions**: Overlay buttons on card hover (assign, priority, etc.)
4. **DragGhostCard**: Semi-transparent card preview during drag
5. **QuickFilterBar**: Preset filter buttons (My Issues, Unassigned, etc.)
6. **KeyboardHint**: Small badge showing available shortcuts

---

## Design Tokens Used

### Colors

| Element | Token | Notes |
|---------|-------|-------|
| Page background | `bg-ui-bg` | Main canvas |
| Column background | `bg-ui-bg-secondary` | Subtle differentiation |
| Column header bg | `bg-ui-bg` | Matches page |
| Card background | `bg-ui-bg` | White/dark surface |
| Card border | `border-ui-border` | Default state |
| Card border (hover) | `border-ui-border` | Same, shadow changes |
| Card border (selected) | `border-brand` | Brand accent |
| Card border (focused) | `border-ui-border-focus` | Keyboard focus |
| Card shadow | `shadow-sm` | Default elevation |
| Card shadow (hover) | `shadow-md` | Lifted state |
| Status bar - Todo | `border-t-status-neutral` | Gray |
| Status bar - In Progress | `border-t-status-info` | Blue |
| Status bar - In Review | `border-t-status-warning` | Purple/Orange |
| Status bar - Done | `border-t-status-success` | Green |
| Filter button (active) | `bg-brand-subtle text-brand` | Highlighted state |
| Priority - Highest | `text-status-error` | Red double arrows |
| Priority - High | `text-status-error` | Red single arrow |
| Priority - Medium | `text-status-warning` | Orange dash |
| Priority - Low | `text-status-info` | Blue down arrow |
| Priority - Lowest | `text-status-neutral` | Gray double down |

### Typography

| Element | Size | Weight | Token |
|---------|------|--------|-------|
| Column name | 14px | 500 | `text-sm font-medium` |
| Issue count badge | 12px | 500 | `text-xs font-medium` |
| Issue key | 12px | 500 | `text-xs font-medium text-ui-text-secondary` |
| Issue title | 14px | 400 | `text-sm` |
| Filter button | 14px | 400 | `text-sm` |
| Sprint header | 16px | 600 | `text-base font-semibold` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Column gap | 24px | `gap-6` |
| Column padding | 8px | `p-2` |
| Column header padding | 12-16px | `p-3 sm:p-4` |
| Card padding | 8-12px | `p-2 sm:p-3` |
| Card gap (between) | 8px | `space-y-2` |
| Card internal gap | 8px | `mb-2`, `space-x-2` |
| Filter bar padding | 8px 16px | `px-4 py-2` |
| Board horizontal padding | 16-24px | `px-4 lg:px-6` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Column | 8px | `rounded-lg` |
| Card | 8px | `rounded-lg` |
| Badge | 9999px | `rounded-full` (pill) |
| Avatar | 9999px | `rounded-full` |
| Filter button | 6px | `rounded-md` |

### Sizing

| Element | Value | Token |
|---------|-------|-------|
| Column width | 320px | `w-80` |
| Column min-height | 384px | `min-h-96` |
| Card min-height | ~80px | Auto, based on content |
| Avatar (card) | 24px | `w-6 h-6` |
| Type icon | 16px | `w-4 h-4` |
| Add button hit area | 40-48px | `p-2.5 sm:p-3` |

---

## Animations

### Card Hover

```css
.issue-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.15s ease;
}

.issue-card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: var(--shadow-md);
}

.issue-card:active {
  transform: translateY(0) scale(1);
}
```

### Drag Start

```css
.issue-card[dragging] {
  transform: rotate(-2deg) scale(1.05);
  box-shadow: var(--shadow-lg);
  opacity: 0.9;
  cursor: grabbing;
  z-index: 100;
}
```

### Column Drop Target

```css
.kanban-column[data-drag-over="true"] {
  background-color: var(--color-brand-subtle);
  transition: background-color 0.15s ease;
}

.kanban-column[data-drag-over="true"]::after {
  content: '';
  position: absolute;
  inset: 8px;
  border: 2px dashed var(--color-brand);
  border-radius: 8px;
  pointer-events: none;
  animation: pulse 1.5s ease-in-out infinite;
}
```

### Card Settle (after drop)

```css
@keyframes card-settle {
  0% {
    transform: translateY(-10px) scale(1.02);
    opacity: 0.8;
  }
  50% {
    transform: translateY(2px) scale(0.99);
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.issue-card[data-just-dropped] {
  animation: card-settle 0.3s ease-out;
}
```

### Column Stagger Entry

```css
/* Already implemented - ANIMATION.STAGGER_DELAY */
.kanban-column {
  animation: slide-up 0.3s ease-out;
  animation-fill-mode: both;
}

.kanban-column:nth-child(1) { animation-delay: 0ms; }
.kanban-column:nth-child(2) { animation-delay: 50ms; }
.kanban-column:nth-child(3) { animation-delay: 100ms; }
.kanban-column:nth-child(4) { animation-delay: 150ms; }
```

### Card Stagger Entry (within column)

```css
/* Already implemented */
.issue-card {
  animation: scale-in 0.2s ease-out;
  animation-fill-mode: both;
}
```

### Filter Active Indicator

```css
.filter-button[data-active="true"] {
  background-color: var(--color-brand-subtle);
  color: var(--color-brand);
  transition: background-color 0.15s ease, color 0.15s ease;
}
```

### Keyboard Focus Ring

```css
.issue-card:focus-visible {
  outline: none;
  ring: 2px solid var(--color-ui-border-focus);
  ring-offset: 2px;
}
```

---

## Implementation Checklist

### Phase 1: Visual Polish

- [ ] Reduce column background opacity (blend with page)
- [ ] Add top border color for status indication (replace full bar)
- [ ] Enhance card hover state (lift + shadow)
- [ ] Add subtle card border on hover
- [ ] Improve type icon visual (colored background pill)
- [ ] Add priority color indicator (left border or icon color)
- [ ] Refine column header spacing
- [ ] Add column count as pill badge

### Phase 2: Empty States

- [ ] Create EmptyColumnState component
- [ ] Add illustration or icon for empty state
- [ ] Add "Create issue" CTA button
- [ ] Add "or drag here" helper text
- [ ] Show empty state only when column truly empty (not filtered)

### Phase 3: Drag & Drop Enhancement

- [ ] Add drag cursor indicator on draggable cards
- [ ] Create ghost card preview during drag
- [ ] Enhance column highlight on drag-over
- [ ] Add settle animation after drop
- [ ] Support multi-select drag (selection mode)

### Phase 4: Filter Bar Enhancement

- [ ] Make filter bar sticky on scroll
- [ ] Add quick filter presets (My Issues, Unassigned)
- [ ] Improve active filter visual state
- [ ] Add filter count badge
- [ ] Persist filters in URL (shareable)

### Phase 5: Card Interactions

- [ ] Add hover quick actions overlay
- [ ] Implement right-click context menu
- [ ] Add inline edit mode (double-click title)
- [ ] Enhance selection mode checkboxes
- [ ] Improve keyboard focus navigation

### Phase 6: Keyboard Shortcuts

- [ ] Implement `C` for create issue
- [ ] Implement `E` for edit focused issue
- [ ] Implement `A` for assign to me
- [ ] Implement `L` for add label
- [ ] Implement `P` for priority picker
- [ ] Implement `M` for move to column
- [ ] Add keyboard shortcut hints (tooltip or footer)

### Phase 7: Advanced Features

- [ ] Column collapse/expand toggle
- [ ] WIP limit display and warning
- [ ] Swimlane grouping option
- [ ] Hide empty columns toggle
- [ ] Column reordering (drag column header)

### Phase 8: Performance

- [ ] Virtualize long columns (100+ cards)
- [ ] Optimize drag-drop re-renders
- [ ] Lazy load card details on hover
- [ ] Debounce filter changes

---

## Related Files

### Source References
- Current Nixelo: `e2e/screenshots/10-filled-project-demo-board.png`
- Linear patterns: `docs/research/competitors/pm-suites/linear.md`
- Jira patterns: `docs/research/competitors/pm-suites/jira.md`
- Mintlify dashboard: `docs/research/library/mintlify/dashboard/`

### Implementation Files
- Board container: `src/components/KanbanBoard.tsx`
- Column component: `src/components/Kanban/KanbanColumn.tsx`
- Card component: `src/components/IssueCard.tsx`
- Filter bar: `src/components/FilterBar.tsx`
- Board toolbar: `src/components/Kanban/BoardToolbar.tsx`
- Drag-drop hook: `src/hooks/useBoardDragAndDrop.ts`
- Board data hook: `src/hooks/useSmartBoardData.ts`
- Theme tokens: `src/index.css`

### Related Pages
- Projects List: `pages/05-projects.md`
- Backlog: `pages/07-backlog.md`
- Issue Detail: `pages/08-issue.md`
- Dashboard: `pages/04-dashboard.md`

---

## Accessibility Considerations

### Keyboard Navigation
- All cards must be focusable via Tab
- Arrow keys should navigate within column and between columns
- Enter should open focused card
- Escape should close modals and clear selection

### Screen Reader
- Column headers should announce column name and count
- Cards should announce key, title, type, priority, assignee
- Drag operations should announce source and destination
- Filter changes should announce current filter state

### Motion
- Respect `prefers-reduced-motion` for animations
- Provide alternative visual feedback for drag-drop
- Ensure hover states are not required for functionality

### Color
- Status colors should not be sole indicator (use icons/text)
- Priority should use icons in addition to color
- Ensure sufficient contrast for all text

---

*Last Updated: 2026-02-05*
*Status: Specification Complete - Awaiting Implementation*
