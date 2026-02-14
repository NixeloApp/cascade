# Board Page - Target State

> **Route**: `/:slug/projects/:key/board`
> **Reference**: Linear board view, Mintlify patterns
> **Goal**: Smooth drag-and-drop, premium cards, keyboard-first

---

## Reference Screenshots

| Source | Preview |
|--------|---------|
| Linear Board | ![](screenshots/reference-linear-board.png) |

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Column background | Light gray prominent | Subtle, blend with page |
| Card hover | Basic shadow | Lift + enhanced shadow |
| Status indicator | Full color bar | Thin top border (3px) |
| Drag feedback | Basic | Scale + rotate + shadow |
| Empty columns | Plain | Illustrated with CTA |
| Quick actions | None | Hover reveal |
| Keyboard nav | Limited | Full arrow key support |

---

## Design Tokens

### Background Colors

| Element | Token | Notes |
|---------|-------|-------|
| Page background | `bg-ui-bg` | Near-black in dark |
| Column background | `bg-ui-bg-secondary` | Subtle differentiation |
| Card background | `bg-ui-bg-elevated` | White/dark surface |

### Border Colors

| Element | Token | Notes |
|---------|-------|-------|
| Card border | `border-ui-border` | Default state |
| Card border (selected) | `border-brand` | Brand accent |
| Card border (focused) | `border-ui-border-focus` | Keyboard focus |

### Status Colors

| Status | Token | Usage |
|--------|-------|-------|
| To Do | `border-t-status-neutral` | Gray top border |
| In Progress | `border-t-status-info` | Blue top border |
| In Review | `border-t-status-warning` | Purple/amber top border |
| Done | `border-t-status-success` | Green top border |

### Priority Colors

| Priority | Token | Icon |
|----------|-------|------|
| Highest | `text-status-error` | Double up arrows |
| High | `text-status-error` | Single up arrow |
| Medium | `text-status-warning` | Dash |
| Low | `text-status-info` | Down arrow |
| Lowest | `text-status-neutral` | Double down arrows |

### Typography

| Element | Size | Weight |
|---------|------|--------|
| Column name | `text-sm` | 500 |
| Issue count | `text-xs` | 500 |
| Issue key | `text-xs` | 500 |
| Issue title | `text-sm` | 400 |

### Spacing

| Element | Token | Value |
|---------|-------|-------|
| Column gap | `gap-6` | 24px |
| Column padding | `p-2` | 8px |
| Card padding | `p-3` | 12px |
| Card gap | `space-y-2` | 8px |

### Shadows

| State | Token |
|-------|-------|
| Card default | `shadow-sm` |
| Card hover | `shadow-md` |
| Card dragging | `shadow-lg` |

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
.kanban-column:nth-child(1) { animation-delay: 0ms; }
.kanban-column:nth-child(2) { animation-delay: 50ms; }
.kanban-column:nth-child(3) { animation-delay: 100ms; }
.kanban-column:nth-child(4) { animation-delay: 150ms; }
```

---

## Card States

```
DEFAULT                    HOVER                      DRAGGING
+------------------+      +------------------+       +------------------+
| border-ui-border |      | border-ui-border |       | border-brand     |
| bg-ui-bg         |      | bg-ui-bg         |       | bg-ui-bg-hover   |
| shadow-sm        |      | shadow-md        |       | shadow-lg        |
|                  |      | scale(1.01)      |       | opacity-90       |
+------------------+      +------------------+       | rotate(-2deg)    |
                                                     +------------------+

SELECTED                   FOCUSED (keyboard)         DROP TARGET
+------------------+      +------------------+       +------------------+
| border-brand     |      | ring-2 ring-brand|       | Column bg        |
| bg-brand-subtle  |      | border-brand     |       | becomes          |
| [checkbox shown] |      |                  |       | bg-brand-subtle  |
+------------------+      +------------------+       +------------------+
```

---

## Component Inventory

### Cards

| Component | Target Changes |
|-----------|----------------|
| IssueCard | Hover lift, status border, drag feedback |
| EmptyColumnState | Illustration + CTA |
| DragGhostCard | Semi-transparent preview |

### Column

| Component | Target Changes |
|-----------|----------------|
| KanbanColumn | Reduced chrome, drop zone styling |
| ColumnHeader | Count badge, collapse toggle |

### Quick Actions

| Component | Target Changes |
|-----------|----------------|
| CardQuickActions | Hover overlay buttons |
| CardContextMenu | Right-click menu |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow keys | Navigate between cards |
| Enter | Open selected card |
| `C` | Create new issue |
| `E` | Edit focused card |
| `A` | Assign to me |
| `L` | Add label |
| `P` | Change priority |
| `M` | Move to column |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Horizontal scroll columns |
| Tablet (768-1024px) | Narrower columns |
| Desktop (>1024px) | Full column width |
| Wide (>1440px) | Max content width |

---

## Accessibility

- All cards focusable via Tab
- Arrow key navigation within and between columns
- Enter opens focused card
- Escape closes modals, clears selection
- Screen reader announces column name and count
- Drag operations announced
- Reduced motion alternatives
- Color not sole indicator (use icons)
