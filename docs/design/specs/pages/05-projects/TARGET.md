# Projects List Page - Target State

> **Route**: `/:slug/projects`
> **Reference**: Mintlify dashboard patterns
> **Goal**: Premium card grid, rich metadata, micro-interactions

---

## Reference Screenshots

| Source | Preview |
|--------|---------|
| Mintlify Dashboard | ![](screenshots/reference-mintlify-dashboard.png) |

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Card shadows | None or minimal | `shadow-card`, hover lift |
| Card borders | Visible `border-ui-border` | Nearly invisible (5-7% opacity) |
| Project identity | None | Avatar/icon with generated color |
| Hover states | Basic shadow-lg | Lift effect (-2px) + border glow |
| Empty state | Emoji icon | Custom illustration with animation |
| Metadata | Plain text | Rich display with member avatars |
| Quick actions | None | Hover menu (settings, archive) |
| Entry animation | None | Staggered card reveal |

---

## Design Tokens

### Background Colors

| Element | Token | Value |
|---------|-------|-------|
| Page background | `bg-ui-bg` | Near-black in dark mode |
| Card background | `bg-ui-bg-elevated` | `rgba(255,255,255,0.03)` |
| Card hover bg | `bg-ui-bg-elevated` | Slightly lighter |

### Border Colors

| Element | Token | Notes |
|---------|-------|-------|
| Card border | `border-ui-border-subtle` | 5-7% opacity |
| Card border (hover) | `border-ui-border-focus` | Brand accent glow |

### Text Colors

| Element | Token |
|---------|-------|
| Project name | `text-ui-text` |
| Description | `text-ui-text-secondary` |
| Metadata (issues, type) | `text-ui-text-tertiary` |
| Key badge text | `text-ui-text-secondary` |
| Key badge bg | `bg-ui-bg-tertiary` |

### Typography

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Page title | `text-2xl` | 700 | Bold |
| Page description | `text-sm` | 400 | Muted |
| Card title | `text-lg` | 600 | Semibold |
| Card description | `text-sm` | 400 | Line-clamp-2 |
| Metadata | `text-xs` | 400 | Small |
| Key badge | `text-xs` | 500 | Monospace |

### Spacing

| Element | Token | Value |
|---------|-------|-------|
| Grid gap | `gap-6` | 24px |
| Card padding | `p-6` | 24px |
| Card inner gap | `gap-3` | 12px |
| Header margin | `mb-6` | 24px |
| Load more margin | `mt-8` | 32px |

### Border Radius

| Element | Token | Value |
|---------|-------|-------|
| Card | `rounded-xl` | 12px |
| Key badge | `rounded-md` | 6px |
| Avatar | `rounded-full` | 9999px |
| Button | `rounded-lg` | 8px |

### Shadows

| State | Token | Value |
|-------|-------|-------|
| Card default | `shadow-card` | Subtle elevation |
| Card hover | `shadow-card-hover` | Enhanced shadow |

---

## Animations

### Page Entry (Staggered Card Reveal)

```
T=0ms     T=50ms    T=100ms   T=150ms   T=200ms   T=250ms
+---+     +---+     +---+     +---+     +---+     +---+
|   | --> | 1 | --> | 1 | --> | 1 | --> | 1 | --> | 1 |
+---+     +---+     +---+     +---+     +---+     +---+
|   |     |   |     | 2 |     | 2 |     | 2 |     | 2 |
+---+     +---+     +---+     +---+     +---+     +---+
|   |     |   |     |   |     | 3 |     | 3 |     | 3 |
+---+     +---+     +---+     +---+     +---+     +---+
```

```css
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.project-card {
  animation: card-enter 0.3s ease-out backwards;
}

.project-card:nth-child(1) { animation-delay: 0ms; }
.project-card:nth-child(2) { animation-delay: 50ms; }
.project-card:nth-child(3) { animation-delay: 100ms; }
.project-card:nth-child(4) { animation-delay: 150ms; }
.project-card:nth-child(5) { animation-delay: 200ms; }
.project-card:nth-child(6) { animation-delay: 250ms; }
```

### Card Hover

```
Default                    Hover                      Default
+------------------+      +------------------+       +------------------+
| Card             |      | Card             | ^     | Card             |
|                  |  --> |                  | 2px   |                  |
| shadow-sm        |      | shadow-lg        |       | shadow-sm        |
+------------------+      +------------------+       +------------------+
                          + border-brand glow
```

```css
.project-card {
  transition:
    transform 0.2s ease-out,
    box-shadow 0.2s ease-out,
    border-color 0.2s ease-out;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-ui-border-focus);
}

/* Dark mode glow effect */
.dark .project-card:hover {
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(99, 102, 241, 0.2);
}
```

### Quick Actions Reveal

```css
.card-actions {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.project-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}
```

### Empty State Icon Float

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-state-icon {
  animation: float 3s ease-in-out infinite;
}
```

### Loading Skeleton Shimmer

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-ui-bg-secondary) 25%,
    var(--color-ui-bg-tertiary) 50%,
    var(--color-ui-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

---

## Component Inventory

### Cards

| Component | Target Changes |
|-----------|----------------|
| ProjectCard | Add avatar, hover lift, border glow, quick actions |
| ProjectCardSkeleton | Shimmer loading state |

### New Components Needed

| Component | Purpose |
|-----------|---------|
| ProjectAvatar | Generated icon from name + color |
| MemberStack | Overlapping avatar display |
| CardQuickActions | Hover-revealed action buttons |

### Badges

| Component | Variants |
|-----------|----------|
| Key Badge | `DEMO`, `API` - uppercase, muted bg |
| Board Type | `kanban`, `scrum` - lowercase, subtle |
| Role Badge | Admin, Editor, Viewer - for member stack |

---

## Target Card Structure

```
+--------------------------------------------------+
|                                                  |
|   +------+                                       |
|   | Logo |   Project Name              [KEY]     |
|   | Icon |   ~~~~~~~~~~~~~             (badge)   |
|   +------+                                       |
|                                                  |
|   Description text that can span multiple        |
|   lines but gets truncated after two...          |
|                                                  |
|   +---+---+---+                                  |
|   |ooo|     12 issues   |   kanban               |
|   +---+  (member stack)  (board type)            |
|                                                  |
|            [Last updated 2h ago]                 |
|                                                  |
+--------------------------------------------------+
```

---

## Responsive

| Breakpoint | Columns | Notes |
|------------|---------|-------|
| Mobile (<768px) | 1 | Full width cards |
| Tablet (768-1024px) | 2 | 2-column grid |
| Desktop (>1024px) | 3 | 3-column grid |
| Wide (>1440px) | 3 | Max content width constraint |

---

## Accessibility

- Tab navigation through cards
- Focus ring on keyboard focus
- Card acts as link (Enter to navigate)
- Screen reader: Project name, key, description, issue count
- Quick actions accessible via keyboard
- Reduced motion: disable animations
