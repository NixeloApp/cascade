# 07 - Backlog View

> **Page Type**: Nixelo-specific (Project Management)
> **Screenshot**: `e2e/screenshots/11-filled-project-demo-backlog.png`
> **Last Updated**: 2026-02-05

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Target State](#target-state)
3. [ASCII Wireframe](#ascii-wireframe)
4. [Functionality Breakdown](#functionality-breakdown)
5. [Component Inventory](#component-inventory)
6. [Design Tokens Used](#design-tokens-used)
7. [Animations](#animations)
8. [Implementation Checklist](#implementation-checklist)

---

## Current State Analysis

### Screenshot Reference

`e2e/screenshots/11-filled-project-demo-backlog.png`

### Layout Structure

The backlog view currently uses a **Kanban board layout** (despite being labeled "Backlog" in navigation). It displays:

```
+------------------+------------------------------------------------------------+
|     SIDEBAR      |                    MAIN CONTENT                            |
|                  |  +----------------------------------------------------+   |
|  Nixelo E2E      |  | Board | Backlog | Roadmap | Calendar | Activity... |   |
|                  |  +----------------------------------------------------+   |
|  - Dashboard     |                                                            |
|  - Issues        |  Kanban Board                    [Undo] [Redo] [Select]   |
|  - Calendar      |                                                            |
|  - Documents     |  +----------+ +----------+ +----------+ +----------+      |
|    - Templates   |  | To Do  2 | |In Prog. 2| |In Review1| | Done   1 |      |
|  - Workspaces    |  +----------+ +----------+ +----------+ +----------+      |
|    - Product     |  |          | |          | |          | |          |      |
|  - Time Tracking |  | [Card 1] | | [Card 1] | | [Card 1] | | [Card 1] |      |
|                  |  |          | |          | |          | |          |      |
|  [Settings]      |  | [Card 2] | | [Card 2] | |          | |          |      |
|                  |  |          | |          | |          | |          |      |
+------------------+------------------------------------------------------------+
```

### Current Visual Characteristics

| Element | Current Implementation | Notes |
|---------|----------------------|-------|
| **Page Title** | "Kanban Board" text | Plain text, no visual emphasis |
| **Tab Navigation** | Horizontal tabs with underline | Active tab has brand underline |
| **Columns** | 4 status columns | Top color bar indicates status |
| **Column Headers** | Status name + count + add button | Clean layout |
| **Issue Cards** | White cards with metadata | Shadow, border-radius |
| **Card Layout** | Icon + Key, Title, Priority indicator | Compact but readable |
| **Actions** | Undo/Redo/Select Multiple buttons | Top-right aligned |

### Issues Identified

1. **Visual Depth**: Cards lack hover elevation; columns feel flat
2. **Status Colors**: Top color bars are thin and could be more expressive
3. **Empty State**: No visual indication when columns are empty
4. **Drag Affordance**: No visible drag handles on cards
5. **Card Density**: Could benefit from tighter spacing in dense views
6. **Column Headers**: Could use more visual weight
7. **Quick Actions**: No visible quick actions on card hover
8. **Animation**: No visible drag/drop or reorder animations

---

## Target State

### Mintlify-Inspired Polish Goals

Apply Mintlify's premium aesthetic principles to the Kanban backlog:

| Principle | Application |
|-----------|-------------|
| **Subtle Depth** | Cards lift on hover, columns have soft background differentiation |
| **Reduced Visual Noise** | Softer borders (5-15% opacity), cleaner dividers |
| **Purposeful Animation** | Smooth drag feedback, reorder animations, expand/collapse |
| **Clear Hierarchy** | Bold column counts, muted secondary text |
| **Micro-interactions** | Card hover states, quick action reveals |
| **Consistent Spacing** | Unified gap system across all elements |

### Key Improvements

1. **Card Hover States**: Lift effect with shadow enhancement
2. **Drag Feedback**: Scale down + rotation during drag, ghost card preview
3. **Column Polish**: Gradient or soft color washes for status indication
4. **Quick Actions**: Reveal edit/move/delete on card hover
5. **Empty Columns**: Illustrated empty state with dashed border
6. **Sprint Sections**: Collapsible sprint groups for true backlog view
7. **Bulk Selection**: Visual selection state with count badge
8. **Keyboard Navigation**: Focus rings and keyboard shortcuts

---

## ASCII Wireframe

### Detailed Layout

```
+--------------------------------------------------------------------------------------------------+
|  [Logo] Nixelo E2E                                     [Cmd] [?] [Timer] [Search] [Bell] [Avatar]|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +------------------+  +-----------------------------------------------------------------------+ |
|  |                  |  |  [Board] [Backlog*] [Roadmap] [Calendar] [Activity] [Analytics]...   | |
|  |  [Dashboard]     |  +-----------------------------------------------------------------------+ |
|  |  [Issues]        |                                                                          | |
|  |  [Calendar]      |  +-----------------------------------------------------------------------+ |
|  |  [Documents]  v  |  |  Kanban Board                              [<-] [->]  Select Multiple | |
|  |    Templates     |  +-----------------------------------------------------------------------+ |
|  |  [Workspaces] v  |                                                                          | |
|  |    Product       |  +----------------+ +----------------+ +----------------+ +----------------+|
|  |  [Time Tracking] |  |################| |================| |~~~~~~~~~~~~~~~~| |****************||
|  |                  |  | To Do        2 | | In Progress  2 | | In Review    1 | | Done         1 ||
|  |                  |  |           [+]  | |           [+]  | |           [+]  | |           [+]  ||
|  |                  |  +----------------+ +----------------+ +----------------+ +----------------+|
|  |                  |  |                | |                | |                | |                ||
|  |                  |  | +------------+ | | +------------+ | | +------------+ | | +------------+ ||
|  |                  |  | |[=] DEMO-4  | | | |[~] DEMO-2  | | | |[#] DEMO-3  | | | |[v] DEMO-1  | ||
|  |                  |  | |            | | | |      [!!]  | | | |        [-] | | | |        [^] | ||
|  |                  |  | | Add dark   | | | | Fix login  | | | | Design new | | | | Set up     | ||
|  |                  |  | | mode suppo | | | | timeout on | | | | dashboard  | | | | CI/CD      | ||
|  |                  |  | |            | | | | mobile     | | | | layout     | | | | pipeline   | ||
|  |                  |  | | [E]        | | | | [E]        | | | | [E]        | | | | [E]        | ||
|  |                  |  | +------------+ | | +------------+ | | +------------+ | | +------------+ ||
|  |                  |  |                | |                | |                | |                ||
|  |                  |  | +------------+ | | +------------+ | |                | |                ||
|  |                  |  | |[*] DEMO-6  | | | |[v] DEMO-5  | | |                | |                ||
|  |                  |  | |        [v] | | | |        [^] | | |                | |                ||
|  |                  |  | | User       | | | | Database   | | |                | |                ||
|  |                  |  | | onboarding | | | | query      | | |                | |                ||
|  |                  |  | | flow       | | | | optimizati | | |                | |                ||
|  |                  |  | |            | | | | [E]        | | |                | |                ||
|  |                  |  | +------------+ | | +------------+ | |                | |                ||
|  |                  |  |                | |                | |                | |                ||
|  |                  |  |  - - - - - -  | |                | |                | |                ||
|  |                  |  | (Drop zone)   | |                | |                | |                ||
|  |                  |  |  - - - - - -  | |                | |                | |                ||
|  |                  |  +----------------+ +----------------+ +----------------+ +----------------+|
|  |                  |                                                                          | |
|  |  [Settings]      |                                                                          | |
|  +------------------+                                                                          | |
+--------------------------------------------------------------------------------------------------+

LEGEND:
[=] Feature icon       [~] Bug icon         [#] Design icon      [v] Done/Check icon
[*] Enhancement icon   [!!] Critical priority  [-] Medium priority  [^] Low priority
[E] Assignee avatar    [+] Add issue button    [<-][->] Undo/Redo
#### Status color bar (colored top edge)
```

### Issue Card Detail (Expanded View)

```
+------------------------------------------+
| [Status Color Bar - full width, 3px]     |
+------------------------------------------+
|                                          |
|  [Type Icon]  DEMO-4              [Pri]  |
|                                          |
|  Add dark mode support                   |
|                                          |
|  +--------------------------------------+|
|  | Labels: [UI] [Enhancement]           ||
|  +--------------------------------------+|
|                                          |
|  [Avatar] [Due: Jan 15] [Comments: 3]   |
|                                          |
+------------------------------------------+

Card States:
- Default: bg-ui-bg-elevated, shadow-sm, border-ui-border
- Hover: translateY(-2px), shadow-md, border-ui-border-secondary
- Dragging: scale(1.02), rotate(2deg), shadow-lg, opacity(0.9)
- Selected: ring-2 ring-brand, bg-brand-subtle
```

### Sprint Section (Alternative Backlog View)

```
+--------------------------------------------------------------------------+
|  [v] Sprint 12: Performance Improvements           Jan 1 - Jan 14    [3] |
+--------------------------------------------------------------------------+
|                                                                          |
|  +------------------------------------------------------------------+   |
|  | [=] DEMO-4  Add dark mode support           [-] Medium  [Avatar] |   |
|  +------------------------------------------------------------------+   |
|  | [~] DEMO-2  Fix login timeout on mobile     [!!] Critical [Avatar]|   |
|  +------------------------------------------------------------------+   |
|  | [v] DEMO-5  Database query optimization     [^] Low      [Avatar] |   |
|  +------------------------------------------------------------------+   |
|                                                                          |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  [>] Sprint 11: Authentication (Completed)         Dec 15 - Dec 31   [5] |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  [v] Backlog (No Sprint)                                            [12] |
+--------------------------------------------------------------------------+
|  ... (collapsed by default) ...                                          |
+--------------------------------------------------------------------------+
```

---

## Functionality Breakdown

### Core Features

- [ ] **Kanban Columns**: Status-based swimlanes with drag-drop
- [ ] **Issue Cards**: Compact cards with key metadata
- [ ] **Drag and Drop**: Reorder within column, move between columns
- [ ] **Quick Add**: Add issue inline from column header
- [ ] **Undo/Redo**: History for drag operations
- [ ] **Bulk Selection**: Multi-select mode for batch operations

### Sprint Management

- [ ] **Sprint Sections**: Collapsible groups by sprint
- [ ] **Sprint Headers**: Name, date range, issue count
- [ ] **Expand/Collapse**: Accordion-style toggle
- [ ] **Sprint Progress**: Visual progress bar
- [ ] **Move to Sprint**: Drag or context menu to assign sprint

### Issue Operations

- [ ] **Inline Edit**: Double-click to edit title
- [ ] **Quick Status**: Drag to change status
- [ ] **Context Menu**: Right-click for full options
- [ ] **Card Preview**: Hover to show full details
- [ ] **Open Detail**: Click to navigate to issue page

### Filtering & Views

- [ ] **Filter Bar**: Filter by assignee, label, priority
- [ ] **Group By**: Group by sprint, assignee, priority
- [ ] **Sort Order**: Custom ordering, auto-sort by priority
- [ ] **View Toggle**: Switch between Kanban and List view

### Bulk Actions

- [ ] **Select Mode**: Enter selection mode via button
- [ ] **Multi-Select**: Click cards to select/deselect
- [ ] **Batch Move**: Move selected to status/sprint
- [ ] **Batch Assign**: Assign selected to user
- [ ] **Batch Delete**: Delete selected (with confirmation)

---

## Component Inventory

### Page-Level Components

| Component | Current Status | Target Updates | Priority |
|-----------|---------------|----------------|----------|
| `KanbanBoard` | Functional | Add animations, polish | HIGH |
| `KanbanColumn` | Functional | Hover states, empty state | HIGH |
| `IssueCard` | Functional | Hover lift, drag feedback | HIGH |
| `ColumnHeader` | Basic | Add count badge, polish | MEDIUM |
| `QuickAddInput` | Basic | Inline form styling | MEDIUM |

### Shared Components Used

| Component | Usage | Updates Needed |
|-----------|-------|----------------|
| `Button` | Actions, add buttons | Already polished |
| `Badge` | Issue count, labels | Add status variants |
| `Avatar` | Assignee display | Already polished |
| `Tooltip` | Truncated text, actions | Already polished |
| `DropdownMenu` | Context menus | Already polished |
| `EmptyState` | Empty columns | Add illustration |

### New Components Needed

| Component | Purpose | Notes |
|-----------|---------|-------|
| `SprintSection` | Collapsible sprint group | Accordion pattern |
| `DragPreview` | Ghost card during drag | Styled drag image |
| `SelectionBadge` | Count of selected items | Fixed position badge |
| `QuickActionBar` | Hover action buttons | Edit, move, delete |
| `IssueRow` | List view item | Alternative to card |

---

## Design Tokens Used

### Colors

| Element | Token | Value (Dark) | Value (Light) |
|---------|-------|--------------|---------------|
| Column Background | `--color-ui-bg-secondary` | gray-800 | gray-50 |
| Card Background | `--color-ui-bg-elevated` | gray-800 | white |
| Card Border | `--color-ui-border` | gray-700 | gray-200 |
| Card Border Hover | `--color-ui-border-secondary` | gray-600 | gray-300 |
| Status Bar (To Do) | `--color-ui-text-secondary` | gray-300 | gray-500 |
| Status Bar (In Progress) | `--color-status-info` | blue-400 | blue-500 |
| Status Bar (In Review) | `--color-status-warning` | amber-400 | amber-500 |
| Status Bar (Done) | `--color-status-success` | green-400 | green-500 |
| Priority Critical | `--color-priority-critical` | red-400 | red-600 |
| Priority High | `--color-priority-high` | orange-400 | orange-600 |
| Priority Medium | `--color-priority-medium` | amber-400 | amber-600 |
| Priority Low | `--color-priority-low` | green-400 | green-600 |

### Typography

| Element | Token/Class | Weight | Size |
|---------|-------------|--------|------|
| Page Title | `text-lg` | 600 | 18px |
| Column Header | `text-base` | 600 | 16px |
| Issue Count | `text-sm` | 500 | 14px |
| Issue Key | `text-xs` | 500 | 12px |
| Issue Title | `text-sm` | 500 | 14px |
| Metadata | `text-xs` | 400 | 12px |

### Spacing

| Element | Token | Value |
|---------|-------|-------|
| Column Gap | `gap-4` | 16px |
| Card Gap | `gap-3` | 12px |
| Card Padding | `p-3` | 12px |
| Column Header Padding | `p-3` | 12px |
| Page Padding | `p-6` | 24px |

### Shadows

| State | Token | Value |
|-------|-------|-------|
| Card Default | `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) |
| Card Hover | `shadow-md` | 0 4px 6px -1px rgba(0,0,0,0.1) |
| Card Dragging | `shadow-lg` | 0 10px 15px -3px rgba(0,0,0,0.1) |

### Border Radius

| Element | Token | Value |
|---------|-------|-------|
| Column | `rounded-lg` | 8px |
| Card | `rounded-md` | 6px |
| Badge | `rounded-full` | 9999px |
| Avatar | `rounded-full` | 9999px |

---

## Animations

### Card Hover

**Purpose**: Provide feedback that card is interactive

```css
.issue-card {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.issue-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

**ASCII Storyboard**:
```
Default                    Hover
+----------+              +----------+
|          |              |          |  ^ -2px
|  Card    |    -->       |  Card    |
|          |              |          |
+----------+              +----------+
  shadow-sm                 shadow-md
```

### Drag Feedback

**Purpose**: Indicate card is being dragged, show valid drop zones

```css
.issue-card.dragging {
  transform: scale(1.02) rotate(2deg);
  box-shadow: var(--shadow-lg);
  opacity: 0.9;
  cursor: grabbing;
}

.column.drag-over {
  background: var(--color-ui-bg-tertiary);
  border: 2px dashed var(--color-brand);
}
```

**ASCII Storyboard**:
```
Drag Start                 During Drag                 Drop
+----------+              +------------+              +----------+
|          |              |            | \            |          |
|  Card    |    -->       |   Card     |  } rotated  |  Card    |
|          |              |            | /   + scale |          |
+----------+              +------------+              +----------+
                              opacity: 0.9
```

### Reorder Animation

**Purpose**: Smooth transition when cards change position

```css
.issue-card {
  transition: transform 0.2s ease-out;
}

/* Applied by drag library */
.issue-card.reordering {
  animation: none;
  transform: translateY(var(--reorder-offset));
}
```

**ASCII Storyboard**:
```
Before                     Reordering                  After
+--------+                +--------+                   +--------+
| Card A |                | Card A | <--+              | Card B | (new position)
+--------+                +--------+    |              +--------+
| Card B |     -->        |        |    | slides up   | Card A |
+--------+                +--------+    |              +--------+
| Card C |                | Card C |----+              | Card C |
+--------+                +--------+                   +--------+
```

### Expand/Collapse (Sprint Sections)

**Purpose**: Smooth reveal of sprint contents

```css
.sprint-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease-out;
}

.sprint-content.expanded {
  grid-template-rows: 1fr;
}

.sprint-content > div {
  overflow: hidden;
}
```

**ASCII Storyboard**:
```
Collapsed                  Expanding                   Expanded
+------------------+      +------------------+        +------------------+
| [>] Sprint 12    |      | [v] Sprint 12    |        | [v] Sprint 12    |
+------------------+      +------------------+        +------------------+
                          | +--------------+ |        | +--------------+ |
                          | | Issue 1      | | h      | | Issue 1      | |
                          | +--------------+ | e      | +--------------+ |
                          | | Issue 2      | | i      | | Issue 2      | |
                          | +--------------+ | g      | +--------------+ |
                          +------------------+ h      | | Issue 3      | |
                                              t       | +--------------+ |
                                              grows   +------------------+
```

### Selection State

**Purpose**: Visual feedback for selected cards

```css
.issue-card.selected {
  ring: 2px solid var(--color-brand);
  background: var(--color-brand-subtle);
}

/* Entry animation for selection badge */
.selection-badge {
  animation: scale-in 0.2s ease-out;
}
```

### Quick Actions Reveal

**Purpose**: Show action buttons on card hover

```css
.quick-actions {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.issue-card:hover .quick-actions {
  opacity: 1;
  transform: translateY(0);
}
```

**ASCII Storyboard**:
```
Default                    Hover
+------------------+      +------------------+
| DEMO-4           |      | DEMO-4    [E][M] |  <-- actions appear
|                  |      |                  |
| Add dark mode... |      | Add dark mode... |
+------------------+      +------------------+
```

### Column Add Animation

**Purpose**: Animate new card appearing in column

```css
.issue-card.new {
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Implementation Checklist

### Phase 1: Card Polish (HIGH PRIORITY)

- [ ] Add hover lift effect to `IssueCard` component
- [ ] Implement card shadow transitions
- [ ] Add status color bar styling (3px top border)
- [ ] Polish issue type icons with consistent styling
- [ ] Add priority indicator with proper color tokens
- [ ] Implement truncation with tooltip for long titles

### Phase 2: Drag and Drop (HIGH PRIORITY)

- [ ] Add drag preview styling (scale, rotate, shadow)
- [ ] Implement drop zone highlighting
- [ ] Add reorder animation between cards
- [ ] Create ghost card for drag placeholder
- [ ] Polish cursor states (grab, grabbing)
- [ ] Add keyboard drag support

### Phase 3: Column Polish (MEDIUM PRIORITY)

- [ ] Enhance column header visual weight
- [ ] Add issue count badge styling
- [ ] Implement empty column state with illustration
- [ ] Add dashed border drop zone for empty columns
- [ ] Polish quick-add input styling
- [ ] Add column scroll shadows for overflow

### Phase 4: Bulk Operations (MEDIUM PRIORITY)

- [ ] Implement selection mode toggle
- [ ] Add card selection state styling
- [ ] Create selection count badge (fixed position)
- [ ] Add bulk action toolbar
- [ ] Implement shift-click multi-select
- [ ] Add select all / deselect all

### Phase 5: Sprint Sections (MEDIUM PRIORITY)

- [ ] Create `SprintSection` component
- [ ] Implement expand/collapse animation
- [ ] Add sprint header with progress bar
- [ ] Style collapsed vs expanded states
- [ ] Add sprint date range display
- [ ] Implement sprint quick actions

### Phase 6: Quick Actions (LOW PRIORITY)

- [ ] Add quick action overlay on card hover
- [ ] Implement edit-in-place for title
- [ ] Add quick status change buttons
- [ ] Create move-to-sprint dropdown
- [ ] Add assignee quick-assign popover
- [ ] Implement quick delete with confirmation

### Phase 7: Accessibility (ONGOING)

- [ ] Add focus ring styles for keyboard navigation
- [ ] Implement arrow key navigation between cards
- [ ] Add screen reader announcements for drag operations
- [ ] Ensure color contrast meets WCAG AA
- [ ] Add reduced motion alternatives
- [ ] Test with keyboard-only navigation

### Phase 8: Performance (ONGOING)

- [ ] Virtualize large card lists
- [ ] Optimize drag preview rendering
- [ ] Add will-change hints for animated elements
- [ ] Lazy load card metadata
- [ ] Cache column positions during drag
- [ ] Profile and optimize rerender triggers

---

## Related Documentation

- [MASTER_PLAN.md](../MASTER_PLAN.md) - Design system overview
- [06-board.md](./06-board.md) - Project board page (parent view)
- [08-issue.md](./08-issue.md) - Issue detail page (drill-down)
- [tokens/colors.md](../tokens/colors.md) - Color token reference
- [tokens/animations.md](../tokens/animations.md) - Animation reference

---

*This document is part of the Nixelo Design System. Last updated: 2026-02-05*
