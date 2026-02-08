# Issue Detail View

> **Design System Page Spec**
> **Status**: Documentation Complete
> **Last Updated**: 2026-02-05

---

## Current State

**Screenshot**: `e2e/screenshots/24-filled-issue-demo-1.png`

### Current Layout Analysis

The Nixelo issue detail view displays a full-page view with:
- **Header area**: Breadcrumb navigation (DEMO / DEMO-1), large title "Set up CI/CD pipeline"
- **Description**: "No description provided" placeholder text
- **Sub-tasks section**: Empty state with "+ Add Sub-task" link
- **Comments section**: Empty state with comment icon and "No comments yet" message
- **Comment input**: Text area with @ mention support and "Add Comment" button
- **Properties sidebar**: Status, Type, Assignee, Reporter, Story Points in card layout
- **Time Tracking card**: Start Timer / Log Time buttons, "No time logged yet"
- **Attachments card**: Drag-and-drop zone with "Choose Files" button
- **Watchers card**: Watch button with "No watchers yet" message

### Issues Identified

1. **Visual hierarchy**: Properties panel looks flat and lacks premium depth
2. **Section headers**: "SUB-TASKS", "COMMENTS", "PROPERTIES" use muted uppercase - functional but generic
3. **Empty states**: Adequate but could be more polished with subtle illustrations
4. **Metadata grid**: Two-column layout is dense; spacing could breathe more
5. **Action buttons**: "Start Timer" (teal) and "Log Time" could use consistent button styling
6. **Card separation**: Right sidebar cards blend together; need clearer visual boundaries
7. **Watch button**: Purple pill looks disconnected from the design language
8. **Edit Issue button**: Positioned in top-right but could have more visual weight

---

## Target State

**Inspiration**: Mintlify dashboard patterns - clean backgrounds, soft borders, generous whitespace, subtle shadows, grouped sections

### Key Improvements

1. **Elevated card styling**: Subtle backgrounds with soft borders, refined shadow layers
2. **Premium typography hierarchy**: Bolder title, refined section labels
3. **Grouped metadata**: Visual groupings with dividers, better label/value contrast
4. **Animated interactions**: Smooth field edit transitions, hover states on all interactive elements
5. **Refined empty states**: Softer icons, better microcopy
6. **Consistent button system**: Unified primary/secondary/ghost button styles
7. **Activity feed polish**: Timeline dots, avatar alignment, timestamp styling

---

## ASCII Wireframe

```
+-----------------------------------------------------------------------------------+
| [<] DEMO / [check] DEMO-1 [copy]                              [Edit Issue]        |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +------------------------------------------+  +-------------------------------+  |
|  |                                          |  |  PROPERTIES                   |  |
|  |  Set up CI/CD pipeline                   |  |  +-----------+ +-----------+  |  |
|  |  ~~~~~~~~~~~~~~~~~~~~~~~~~ (H1 Title)    |  |  | Status    | | Type      |  |  |
|  |                                          |  |  | [done]    | | Task      |  |  |
|  |  No description provided                 |  |  +-----------+ +-----------+  |  |
|  |  ~~~~~~~~~~~~~~~~~~~~~~~~~ (muted)       |  |  +-----------+ +-----------+  |  |
|  |                                          |  |  | Assignee  | | Reporter  |  |  |
|  |  ----------------------------------      |  |  | [Avatar]  | | [Avatar]  |  |  |
|  |                                          |  |  | Emily Chen| | Emily Chen|  |  |
|  |  SUB-TASKS                               |  |  +-----------+ +-----------+  |  |
|  |  +------------------------------------+  |  |  +-------------------------+  |  |
|  |  | Sub-tasks        [+ Add Sub-task] |  |  |  | Story Points            |  |  |
|  |  | - - - - - - - - - - - - - - - - - |  |  |  | Not set                 |  |  |
|  |  | No sub-tasks yet                   |  |  |  +-------------------------+  |  |
|  |  +------------------------------------+  |  +-------------------------------+  |
|  |                                          |  |                               |  |
|  |  ----------------------------------      |  |  TIME TRACKING                |  |
|  |                                          |  |  +-------------------------+  |  |
|  |  COMMENTS                                |  |  | Time Tracking           |  |  |
|  |  +------------------------------------+  |  |  | [> Start] [+ Log Time]  |  |  |
|  |  |          [chat bubble icon]        |  |  |  | No time logged yet      |  |  |
|  |  |                                    |  |  |  +-------------------------+  |  |
|  |  |         No comments yet            |  |  +-------------------------------+  |
|  |  |      Be the first to comment!      |  |                                     |
|  |  +------------------------------------+  |  ATTACHMENTS                        |
|  |                                          |  +-------------------------------+  |
|  |  Add Comment                             |  |  [paperclip icon]             |  |
|  |  +------------------------------------+  |  |  Drag and drop files here,    |  |
|  |  | Add a comment... Type @ to        |  |  |  or click to browse           |  |
|  |  | mention someone                   |  |  |  [Choose Files]               |  |
|  |  |                                    |  |  +-------------------------------+  |
|  |  +------------------------------------+  |                                     |
|  |  Type @ to mention team members         |  WATCHERS                            |
|  |                          [Add Comment]  |  +-------------------------------+  |
|  |                                          |  |  [eye] Watch                  |  |
|  +------------------------------------------+  |  No watchers yet. Be the     |  |
|                                                |  first to watch this issue!  |  |
|                                                +-------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Refined Target Layout

```
+-----------------------------------------------------------------------------------+
|  HEADER BAR                                                                       |
+-----------------------------------------------------------------------------------+
| [<-]  DEMO  /  DEMO-1 [copy]                               [Edit Issue] (primary) |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  MAIN CONTENT (flex: 2/3)                    SIDEBAR (flex: 1/3)                  |
|  +------------------------------------------+ +----------------------------------+|
|  |                                          | |                                  ||
|  |  Set up CI/CD pipeline                   | |  PROPERTIES                      ||
|  |  ================================        | |  +------------------------------+||
|  |  (32px bold, tracking tight)             | |  |                              |||
|  |                                          | |  |  Status          Type        |||
|  |  DESCRIPTION                             | |  |  +--------+     +--------+   |||
|  |  +--------------------------------------+| |  |  | done   |     | Task   |   |||
|  |  | No description provided              || |  |  | (badge)|     | (badge)|   |||
|  |  | (placeholder with edit affordance)   || |  |  +--------+     +--------+   |||
|  |  +--------------------------------------+| |  |                              |||
|  |                                          | |  |  -------------------------   |||
|  |  SUB-TASKS                 [+ Add]       | |  |                              |||
|  |  +--------------------------------------+| |  |  Assignee        Reporter    |||
|  |  |  (empty state)                       || |  |  [Avatar]        [Avatar]    |||
|  |  |  No sub-tasks yet                    || |  |  Emily Chen      Emily Chen  |||
|  |  +--------------------------------------+| |  |                              |||
|  |                                          | |  |  -------------------------   |||
|  |  ACTIVITY                                | |  |                              |||
|  |  +--------------------------------------+| |  |  Story Points               |||
|  |  |  [filter: All | Comments | History]  || |  |  Not set                    |||
|  |  |                                       || |  |                              |||
|  |  |  (empty state with icon)             || |  +------------------------------+||
|  |  |  No activity yet                     || |                                  ||
|  |  +--------------------------------------+| |  TIME TRACKING                   ||
|  |                                          | |  +------------------------------+||
|  |  ADD COMMENT                             | |  |  [>] Start Timer  [+] Log   |||
|  |  +--------------------------------------+| |  |  No time logged yet         |||
|  |  | Rich text area with toolbar          || |  +------------------------------+||
|  |  | @ mentions, formatting               || |                                  ||
|  |  +--------------------------------------+| |  ATTACHMENTS                     ||
|  |                       [Comment] (brand) | |  +------------------------------+||
|  |                                          | |  |  [drop zone with border]    |||
|  +------------------------------------------+ |  |  [Choose Files]             |||
|                                               |  +------------------------------+||
|                                               |                                  ||
|                                               |  WATCHERS                        ||
|                                               |  +------------------------------+||
|                                               |  |  [eye] Watch  (1 watcher)   |||
|                                               |  +------------------------------+||
|                                               +----------------------------------+|
+-----------------------------------------------------------------------------------+
```

---

## Functionality Breakdown

### Core Features

- [ ] **View issue details**: Title, description, all metadata
- [ ] **Inline editing**: Click-to-edit for title, description, all fields
- [ ] **Status changes**: Dropdown to change workflow state
- [ ] **Assignee management**: Avatar picker dropdown
- [ ] **Priority/Type badges**: Visual indicators with color coding
- [ ] **Sub-task management**: Create, view, check off sub-tasks
- [ ] **Comment system**: Add, edit, delete comments with @ mentions
- [ ] **Activity timeline**: Combined comments + change history
- [ ] **Time tracking**: Start/stop timer, manual time logging
- [ ] **File attachments**: Drag-drop upload, preview, download
- [ ] **Watchers**: Subscribe to issue notifications
- [ ] **Copy issue key**: Clipboard button for DEMO-1

### Editable Fields

| Field | Edit Mode | Validation |
|-------|-----------|------------|
| Title | Inline text input | Required, max 255 chars |
| Description | Rich text editor | Optional |
| Status | Dropdown | Must be valid workflow state |
| Type | Dropdown | Task, Bug, Story, Epic |
| Priority | Dropdown | Lowest to Highest (5 levels) |
| Assignee | Avatar picker | Project member |
| Reporter | Avatar picker (admin only) | Project member |
| Sprint | Dropdown | Active/future sprints |
| Story Points | Number input | 0-100, Fibonacci suggested |
| Labels | Multi-select tags | Custom labels |
| Due Date | Date picker | Optional |

### Comment System

- **Markdown support**: Basic formatting (bold, italic, code, links)
- **@ mentions**: Autocomplete for team members, sends notification
- **Edit/Delete**: Author can modify own comments
- **Timestamps**: Relative time ("2 hours ago") with full date on hover
- **Reactions**: Optional emoji reactions (future enhancement)

---

## Component Inventory

| Component | Current Implementation | Target Enhancement | Priority |
|-----------|----------------------|-------------------|----------|
| **Breadcrumb** | Text links with "/" | Add chevron icons, hover underlines | Medium |
| **Issue Title** | H1, black text | Larger (32px), tighter tracking (-0.5px) | High |
| **Status Badge** | Text "done" | Pill badge with status color, icon | High |
| **Type Badge** | Text "Task" | Icon + text badge, color-coded | High |
| **Avatar** | Basic circle avatar | Ring on hover, tooltip with name | Medium |
| **Metadata Label** | Muted uppercase | Smaller (11px), consistent spacing | Medium |
| **Section Header** | Uppercase muted text | Semibold, border-bottom accent | Medium |
| **Card Container** | Subtle background | Soft border, refined shadow | High |
| **Empty State** | Icon + text | Refined icon, better hierarchy | Medium |
| **Comment Input** | Textarea | Rich text editor, toolbar | High |
| **Action Button** | Solid teal/outline | Consistent primary/secondary styles | High |
| **Timeline Dot** | None | Colored dots for activity types | Low |
| **Dropdown** | Basic select | Search, keyboard nav, scroll | Medium |
| **File Drop Zone** | Dashed border | Animated hover state, progress | Medium |

### New Components Needed

1. **InlineEditField**: Click-to-edit wrapper for text fields
2. **ActivityTimeline**: Combined comments + history with filters
3. **UserMentionInput**: Rich text with @ autocomplete
4. **FileUploadZone**: Drag-drop with preview and progress
5. **WatchersList**: Avatar stack with +N overflow

---

## Design Tokens Used

### Colors

| Usage | Token | Value (Light) | Value (Dark) |
|-------|-------|---------------|--------------|
| Page background | `--color-ui-bg` | `#FFFFFF` | `#111827` |
| Sidebar cards | `--color-ui-bg-secondary` | `#F9FAFB` | `#1F2937` |
| Section headers | `--color-ui-text-secondary` | `#6B7280` | `#D1D5DB` |
| Metadata labels | `--color-ui-text-tertiary` | `#9CA3AF` | `#9CA3AF` |
| Primary text | `--color-ui-text` | `#111827` | `#F9FAFB` |
| Card borders | `--color-ui-border` | `#E5E7EB` | `#374151` |
| Status: Done | `--color-status-success` | `#22C55E` | `#4ADE80` |
| Status: In Progress | `--color-status-info` | `#3B82F6` | `#60A5FA` |
| Status: To Do | `--color-palette-gray` | `#6B7280` | `#9CA3AF` |
| Priority: Highest | `--color-priority-highest` | `#EF4444` | `#F87171` |
| Priority: High | `--color-priority-high` | `#F97316` | `#FB923C` |
| Priority: Medium | `--color-priority-medium` | `#F59E0B` | `#FBBF24` |
| Priority: Low | `--color-priority-low` | `#3B82F6` | `#60A5FA` |
| Priority: Lowest | `--color-priority-lowest` | `#6B7280` | `#9CA3AF` |
| Issue Type: Task | `--color-issue-type-task` | `#3B82F6` | `#60A5FA` |
| Issue Type: Bug | `--color-issue-type-bug` | `#EF4444` | `#F87171` |
| Issue Type: Story | `--color-issue-type-story` | `#A855F7` | `#C084FC` |
| Issue Type: Epic | `--color-issue-type-epic` | `#F59E0B` | `#FBBF24` |
| Brand button | `--color-brand` | `#4F46E5` | `#818CF8` |
| Timer accent | `--color-brand-teal-bg` | `#14B8A6` | `#2DD4BF` |

### Typography

| Element | Size | Weight | Line Height | Tracking |
|---------|------|--------|-------------|----------|
| Issue Title | 32px | 700 (bold) | 1.2 | -0.5px |
| Section Header | 11px | 600 (semibold) | 1.4 | 0.5px (uppercase) |
| Metadata Label | 12px | 400 | 1.4 | 0 |
| Metadata Value | 14px | 500 | 1.4 | 0 |
| Description | 16px | 400 | 1.6 | 0 |
| Comment Text | 14px | 400 | 1.5 | 0 |
| Timestamp | 12px | 400 | 1.4 | 0 |
| Button | 14px | 500 | 1 | 0 |

### Spacing

| Element | Spacing Token | Value |
|---------|---------------|-------|
| Page padding | `--spacing-section` | 32px |
| Card padding | `p-5` | 20px |
| Card gap | `gap-4` | 16px |
| Section margin | `mb-6` | 24px |
| Metadata row gap | `gap-3` | 12px |
| Label-value gap | `gap-1` | 4px |
| Button padding | `px-4 py-2` | 16px / 8px |

### Shadows

| Element | Token | Value |
|---------|-------|-------|
| Sidebar card | `--shadow-card` | `0 1px 3px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)` |
| Card hover | `--shadow-card-hover` | `0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` |
| Dropdown menu | `--shadow-elevated` | `0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)` |

### Border Radius

| Element | Token | Value |
|---------|-------|-------|
| Card | `--radius-container` | 12px |
| Badge | `--radius` | 8px |
| Button | `--radius` | 8px |
| Avatar | `rounded-full` | 9999px |
| Input | `--radius` | 8px |

---

## Animations

### Field Edit Transitions

```css
/* Inline edit focus */
.inline-edit-field {
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}
.inline-edit-field:focus-within {
  background-color: var(--color-ui-bg);
  box-shadow: 0 0 0 2px var(--color-ui-border-focus);
}

/* Value change highlight */
@keyframes value-updated {
  0% { background-color: var(--color-brand-subtle); }
  100% { background-color: transparent; }
}
.field-updated {
  animation: value-updated 1s ease-out;
}
```

### Comment Additions

```css
/* New comment slide-in */
@keyframes comment-enter {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.comment-new {
  animation: comment-enter 0.3s ease-out;
}
```

### Status Changes

```css
/* Status badge morph */
.status-badge {
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.1s ease;
}
.status-badge:hover {
  transform: scale(1.02);
}

/* Status dropdown open */
@keyframes dropdown-scale-in {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

### Attachment Upload

```css
/* Drop zone highlight */
.drop-zone {
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.drop-zone.drag-over {
  border-color: var(--color-brand);
  background-color: var(--color-brand-subtle);
}

/* Upload progress */
.upload-progress {
  transition: width 0.3s ease-out;
}
```

### Hover States

```css
/* Card hover lift */
.sidebar-card {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.sidebar-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}

/* Avatar hover ring */
.avatar-wrapper {
  transition: box-shadow 0.15s ease;
}
.avatar-wrapper:hover {
  box-shadow: 0 0 0 3px var(--color-brand-subtle);
}

/* Action button hover */
.action-btn {
  transition: all 0.15s ease;
}
.action-btn:hover {
  background-color: var(--color-brand-hover);
  transform: translateY(-1px);
}
```

---

## Implementation Checklist

### Phase 1: Layout Structure (High Priority)

- [ ] Implement responsive two-column layout (main content + sidebar)
- [ ] Add sticky sidebar on desktop (scrolls with page on mobile)
- [ ] Group related metadata fields with visual dividers
- [ ] Add consistent section headers with bottom border accent
- [ ] Implement collapsible sections for mobile

### Phase 2: Core Components (High Priority)

- [ ] Create `StatusBadge` component with color mapping
- [ ] Create `TypeBadge` component with icon + color
- [ ] Create `PriorityBadge` component
- [ ] Enhance `Avatar` with hover ring and tooltip
- [ ] Create `InlineEditField` wrapper component
- [ ] Update card styling with refined shadows

### Phase 3: Interactive Elements (Medium Priority)

- [ ] Implement click-to-edit for title
- [ ] Implement rich text description editor
- [ ] Add status change dropdown with keyboard nav
- [ ] Add assignee picker with search
- [ ] Implement @ mention autocomplete in comments
- [ ] Add file drag-and-drop with progress indicator

### Phase 4: Activity System (Medium Priority)

- [ ] Create `ActivityTimeline` component
- [ ] Add filter tabs (All / Comments / History)
- [ ] Implement comment edit/delete
- [ ] Add timestamp tooltips with full date
- [ ] Style timeline with colored dots by type

### Phase 5: Polish & Animation (Lower Priority)

- [ ] Add field update highlight animation
- [ ] Add comment enter animation
- [ ] Add status badge hover scale
- [ ] Add card hover lift effect
- [ ] Add avatar hover ring effect
- [ ] Implement smooth dropdown open/close
- [ ] Add loading skeletons for async data

### Phase 6: Empty States (Lower Priority)

- [ ] Refine no-description placeholder
- [ ] Refine no-subtasks empty state
- [ ] Refine no-comments empty state
- [ ] Refine no-attachments empty state
- [ ] Add helpful microcopy and CTAs

### Testing Requirements

- [ ] Verify all field edits persist correctly
- [ ] Test comment creation with @ mentions
- [ ] Test file upload with various file types
- [ ] Verify real-time updates (another user changes issue)
- [ ] Test keyboard navigation in dropdowns
- [ ] Verify mobile responsive layout
- [ ] Test screen reader accessibility
- [ ] Verify color contrast ratios meet WCAG AA

---

## Related Documentation

- **Component Specs**: `docs/design-system/components/badge.md`, `components/avatar.md`
- **Color Tokens**: `docs/design-system/tokens/colors.md`
- **Animation System**: `docs/design-system/tokens/animations.md`
- **Convex Schema**: `convex/schema.ts` (issues table)
- **Current Implementation**: `src/routes/$slug/issues/$issueKey/index.tsx`

---

*Created: 2026-02-05*
*Author: Design System Overhaul Initiative*
