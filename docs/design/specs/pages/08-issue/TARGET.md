# Issue Detail Page - Target State

> **Route**: `/:slug/issues/:key`
> **Reference**: Linear issue detail
> **Goal**: Clean, focused editing with inline fields

---

## Reference Screenshots

| Source | Preview |
|--------|---------|
| Linear Issue | ![](screenshots/reference-linear-issue.png) |

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Sidebar fields | Basic dropdowns | Hover states, inline editing |
| Activity feed | Plain list | Visual timeline with dots/lines |
| Comments | Basic input | Rich comment composer |
| Keyboard | Limited | Full shortcut support |
| Description | Basic editor | Polished with toolbar |

---

## Design Tokens

### Background Colors

| Element | Token | Notes |
|---------|-------|-------|
| Page background | `bg-ui-bg` | Near-black |
| Main content bg | `bg-ui-bg` | Same as page |
| Sidebar bg | `bg-ui-bg-secondary` | Slightly elevated |
| Field hover | `bg-ui-bg-tertiary` | Subtle highlight |

### Border Colors

| Element | Token |
|---------|-------|
| Sidebar border | `border-ui-border` |
| Field border | `border-transparent` (hover reveals) |
| Timeline line | `border-ui-border-subtle` |

### Typography

| Element | Size | Weight |
|---------|------|--------|
| Issue title | `text-2xl` | 600 |
| Section headers | `text-sm` | 500 uppercase |
| Field labels | `text-xs` | 500 |
| Field values | `text-sm` | 400 |
| Activity text | `text-sm` | 400 |
| Timestamps | `text-xs` | 400 |

### Spacing

| Element | Token | Value |
|---------|-------|-------|
| Main content padding | `p-6` | 24px |
| Sidebar width | `w-80` | 320px |
| Section gap | `space-y-6` | 24px |
| Field gap | `space-y-4` | 16px |
| Timeline gap | `space-y-4` | 16px |

---

## Animations

### Field Hover

```css
.sidebar-field {
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

.sidebar-field:hover {
  background-color: var(--color-ui-bg-tertiary);
}
```

### Inline Edit Focus

```css
.inline-edit-field:focus-within {
  background-color: var(--color-ui-bg-tertiary);
  outline: 2px solid var(--color-brand);
  outline-offset: -2px;
}
```

### Activity Entry

```css
@keyframes activity-enter {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.activity-item {
  animation: activity-enter 0.2s ease-out;
}
```

### Comment Submit

```css
@keyframes comment-submit {
  0% { transform: scale(1); }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.comment-form[data-submitting="true"] {
  animation: comment-submit 0.3s ease;
}
```

---

## Activity Timeline Structure

```
+------------------------------------------------------------------+
|  Activity                                                         |
+------------------------------------------------------------------+
|                                                                   |
|  ● Emily Chen changed status to IN PROGRESS                       |
|  │ 2 hours ago                                                    |
|  │                                                                |
|  ● Alex Rivera assigned to Emily Chen                             |
|  │ 4 hours ago                                                    |
|  │                                                                |
|  ● Alex Rivera created this issue                                 |
|    1 day ago                                                      |
|                                                                   |
+------------------------------------------------------------------+

Legend:
● = Timeline dot (8px circle)
│ = Timeline line (2px vertical line)
```

---

## Sidebar Field Structure

```
+---------------------------+
|  DETAILS                  |   <- Section header (uppercase, muted)
+---------------------------+
|  [hover area]             |
|  +---------------------+  |
|  | Status              |  |   <- Label (xs, muted)
|  | +----------------+  |  |
|  | | IN PROGRESS  ▼ |  |  |   <- Value with dropdown
|  | +----------------+  |  |
|  +---------------------+  |
|                           |
|  [hover area]             |
|  +---------------------+  |
|  | Priority            |  |
|  | +----------------+  |  |
|  | | [!!] HIGH    ▼ |  |  |   <- Icon + text
|  | +----------------+  |  |
|  +---------------------+  |
|                           |
|  [hover area]             |
|  +---------------------+  |
|  | Assignee            |  |
|  | +----------------+  |  |
|  | |[AV]Emily Chen▼ |  |  |   <- Avatar + name
|  | +----------------+  |  |
|  +---------------------+  |
+---------------------------+
```

---

## Component Inventory

### Main Content

| Component | Target Changes |
|-----------|----------------|
| IssueHeader | Type icon, key, inline title edit |
| IssueDescription | Polished editor, auto-save |
| ActivityFeed | Visual timeline with dots |
| CommentSection | Rich composer, reactions |

### Sidebar

| Component | Target Changes |
|-----------|----------------|
| SidebarField | Hover states, inline edit |
| StatusField | Colored badge in dropdown |
| PriorityField | Icon + text |
| AssigneeField | Avatar picker |
| LabelField | Tag input with colors |
| DateField | Calendar picker |
| EstimateField | Point selector |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `E` | Edit description |
| `A` | Assign to me |
| `S` | Change status |
| `P` | Change priority |
| `L` | Add label |
| `M` | Add comment |
| `Esc` | Close/cancel |
| `Cmd+Enter` | Save changes |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Sidebar below main, collapsible |
| Tablet (768-1024px) | Narrow sidebar |
| Desktop (>1024px) | Full two-column layout |

---

## Accessibility

- All fields keyboard accessible
- Focus visible on tab navigation
- Screen reader labels for all fields
- Activity changes announced
- Comment submission confirmed
