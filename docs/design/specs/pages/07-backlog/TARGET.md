# Backlog Page - Target State

> **Route**: `/:slug/projects/:key/backlog`
> **Reference**: Jira backlog, Linear sprints
> **Goal**: Clear sprint organization, smooth interactions, progress visibility

---

## Reference Screenshots

| Source | Preview |
|--------|---------|
| Jira Backlog | ![](screenshots/reference-jira-backlog.png) |
| Linear Cycles | ![](screenshots/reference-linear-cycles.png) |

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Sprint header | Basic text | Rich header with progress bar |
| Issue rows | No hover | Hover highlight + quick actions |
| Drag feedback | None | Visual drop zone, reorder preview |
| Progress | Not shown | Progress bar + stats |
| Selection | Basic checkbox | Multi-select with bulk actions |
| Empty state | Plain text | Illustrated with CTA |

---

## Design Tokens

### Background Colors

| Element | Token | Notes |
|---------|-------|-------|
| Page background | `bg-ui-bg` | Near-black |
| Sprint card bg | `bg-ui-bg-elevated` | Slightly elevated |
| Issue row bg | `transparent` | Blends with sprint card |
| Issue row hover | `bg-ui-bg-secondary` | Subtle highlight |

### Border Colors

| Element | Token |
|---------|-------|
| Sprint card border | `border-ui-border` |
| Section divider | `border-ui-border-subtle` |
| Drop zone active | `border-brand` (dashed) |

### Typography

| Element | Size | Weight |
|---------|------|--------|
| Sprint name | `text-lg` | 600 |
| Sprint dates | `text-sm` | 400 |
| Section label | `text-xs` | 500 uppercase |
| Issue key | `text-xs` | 500 |
| Issue title | `text-sm` | 400 |

### Spacing

| Element | Token | Value |
|---------|-------|-------|
| Sprint card padding | `p-4` | 16px |
| Issue row padding | `px-4 py-2` | 16px / 8px |
| Section gap | `space-y-4` | 16px |
| Sprint gap | `space-y-6` | 24px |

---

## Animations

### Row Hover

```css
.backlog-row {
  transition: background-color 0.15s ease;
}

.backlog-row:hover {
  background-color: var(--color-ui-bg-secondary);
}
```

### Row Selection

```css
.backlog-row[data-selected="true"] {
  background-color: var(--color-brand-subtle);
  border-left: 3px solid var(--color-brand);
}
```

### Drag Over Drop Zone

```css
.sprint-card[data-drag-over="true"] {
  border-color: var(--color-brand);
  border-style: dashed;
  background-color: var(--color-brand-subtle);
}

@keyframes pulse-border {
  0%, 100% { border-color: var(--color-brand); }
  50% { border-color: transparent; }
}

.sprint-card[data-drag-over="true"] {
  animation: pulse-border 1s ease-in-out infinite;
}
```

### Row Reorder Animation

```css
.backlog-row[data-dragging="true"] {
  opacity: 0.5;
  background-color: var(--color-brand-subtle);
}

.backlog-row[data-drop-preview="true"] {
  box-shadow: 0 -2px 0 var(--color-brand);
}
```

### Section Collapse

```css
.sprint-content {
  overflow: hidden;
  transition: height 0.2s ease-out;
}

.sprint-content[data-collapsed="true"] {
  height: 0;
}
```

---

## Sprint Card Structure

```
+--------------------------------------------------------------------------------+
| ▼ CURRENT SPRINT                                                               |
+--------------------------------------------------------------------------------+
|                                                                                |
|  Sprint 1                                                                      |
|  Jan 15 - Jan 29, 2026 · 3 issues · 5 points                                  |
|                                                                                |
|  [==========---------------] 40%                                              |
|                                                                                |
|  [Start Sprint]                                                               |
|                                                                                |
+--------------------------------------------------------------------------------+
| [ ] [BUG]  DEMO-2   Fix login timeout...      [HIGH]    @Emily     IN-PROG    |
| [ ] [TSK]  DEMO-3   Design dashboard...       [MED]     @Alex      TO-DO      |
| [ ] [STY]  DEMO-4   Update onboarding...      [LOW]     @Sarah     TO-DO      |
+--------------------------------------------------------------------------------+
```

---

## Component Inventory

### Cards

| Component | Target Changes |
|-----------|----------------|
| SprintCard | Progress bar, stats, improved header |
| SprintHeader | Collapse toggle, date formatting |
| BacklogSection | Count badge, collapse animation |

### Rows

| Component | Target Changes |
|-----------|----------------|
| BacklogIssueRow | Hover states, inline quick actions |
| IssueRowDragPreview | Ghost preview while dragging |

### Progress

| Component | Purpose |
|-----------|---------|
| SprintProgress | Progress bar with percentage |
| SprintStats | Issue count, story points |

---

## Quick Actions (Row Hover)

| Action | Icon | Shortcut |
|--------|------|----------|
| Edit | Pencil | `E` |
| Assign | Person | `A` |
| Change Status | Columns | `S` |
| Move to Sprint | Calendar | `M` |
| Delete | Trash | `Del` |

---

## Bulk Actions (Selection Mode)

| Action | Description |
|--------|-------------|
| Move to Sprint | Move selected to chosen sprint |
| Set Priority | Bulk update priority |
| Assign | Bulk assign to user |
| Add Label | Bulk add label |
| Delete | Bulk delete (with confirmation) |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Stack columns, hide secondary info |
| Tablet (768-1024px) | Narrower columns |
| Desktop (>1024px) | Full width with all columns |
| Wide (>1440px) | Max content width constraint |

---

## Accessibility

- All rows focusable via Tab
- Arrow key navigation between rows
- Enter to open row
- Space to toggle selection
- Escape clears selection
- Screen reader announces row content
- Drag operations announced
