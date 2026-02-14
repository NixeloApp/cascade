# Dashboard Page - Target State

> **Route**: `/:slug/dashboard`
> **Reference**: Mintlify dashboard
> **Goal**: Premium, dark-first, data-rich with micro-interactions

---

## Reference Screenshots (Mintlify)

| Viewport | Preview |
|----------|---------|
| Desktop | ![](screenshots/reference-mintlify-dashboard.png) |

---

## Mintlify Dashboard Characteristics

### Background & Surface
- **Near-black background**: `#08090a` or gradient from dark
- **Subtle card backgrounds**: `rgba(255,255,255,0.03)` - barely visible
- **Very subtle borders**: `rgba(255,255,255,0.05-0.07)`

### Typography & Hierarchy
- **Personalized greeting**: "Good morning, Agent" - clean sans-serif, not italic
- **Subtitle**: "Welcome back to your docs dashboard" - muted gray
- **Card labels**: Uppercase, smaller, muted text

### Cards & Panels
- **Preview card**: Large thumbnail with rounded corners
- **Status badges**: "Live" with green dot indicator
- **Meta info**: "Last updated 1 minute ago by mintlify-bot"
- **Action buttons**: Icon buttons (copy, refresh) + "Visit site" button

### Activity Feed
- **Table layout**: Activity | Status | Changes columns
- **Toggle**: "Live" vs "Previews" segment control
- **Status badges**: Green "Successful" with checkmark
- **Expandable rows**: Chevron to show details

### Left Sidebar (Mintlify)
- Clean vertical navigation
- Section labels: "Products" (uppercase, muted)
- Icon + text items
- "New" badges on items (e.g., "Editor New")
- Floating promo card at bottom (Agent Suggestions)
- Footer icons: Chat, Settings, Theme toggle, Logout

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Page background | `gray-900` | Near-black `#08090a` |
| Card borders | Visible `border-ui-border` | Nearly invisible (5-7% opacity) |
| Card backgrounds | Solid elevated | Transparent `rgba(255,255,255,0.03)` |
| Stats cards | Flat, bordered | Subtle shadow, hover lift |
| Tab indicator | Basic underline | Smooth animated transition |
| Empty states | Basic icon + text | Custom illustration, softer text |
| Sidebar | Static | Collapsible with animation |

---

## Design Tokens

### Background Colors

| Element | Current Token | Target Token | Value |
|---------|---------------|--------------|-------|
| Page background | `bg-ui-bg` | `bg-ui-bg` | #08090a (verify dark) |
| Card background | `bg-ui-bg-elevated` | `bg-ui-bg-elevated` | rgba(255,255,255,0.03) |
| Sidebar background | `bg-ui-bg-sidebar` | `bg-ui-bg-sidebar` | Keep current |
| Hover states | `hover:bg-ui-bg-secondary` | `hover:bg-ui-bg-soft` | Subtler hover |

### Border Colors

| Element | Current Token | Target Token |
|---------|---------------|--------------|
| Card borders | `border-ui-border` | `border-ui-border` (5-7% opacity) |
| Section dividers | `border-ui-border` | Nearly invisible (3-5% opacity) |
| Active tab | `border-brand` | `border-brand` |

### Text Colors

| Element | Token |
|---------|-------|
| Greeting heading | `text-ui-text` |
| User name | `text-brand` (indigo accent) |
| Subtext | `text-ui-text-secondary` |
| Card labels | `text-ui-text-tertiary` (uppercase) |
| Stat numbers | `text-ui-text` (large) |
| Stat labels | `text-ui-text-secondary` |

### Status Colors

| Element | Token |
|---------|-------|
| HIGHEST priority | `bg-status-error-bg` + `text-status-error-text` |
| HIGH priority | `bg-status-warning-bg` + `text-status-warning-text` |
| MEDIUM priority | `bg-status-info-bg` + `text-status-info-text` |
| LOW priority | `bg-ui-bg-secondary` + `text-ui-text-secondary` |
| Attention text | `text-status-warning` |

### Typography

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Greeting | `text-4xl` | 400 italic | Large, welcoming |
| User name | `text-4xl` | 700 italic | Bold, branded |
| Section labels | `text-xs` | 500 uppercase | "FOCUS ITEM", "OVERVIEW" |
| Card titles | `text-lg` | 500 | Issue titles |
| Stat numbers | `text-3xl` | 700 | Large numbers |
| Stat labels | `text-sm` | 400 | Descriptions |

### Spacing

| Element | Token | Value |
|---------|-------|-------|
| Page padding | `p-6` | 24px |
| Card padding | `p-4` | 16px |
| Card gap | `gap-4` | 16px |
| Stats grid gap | `gap-4` | 16px |
| Section spacing | `space-y-6` | 24px |
| List item spacing | `space-y-2` | 8px |

### Shadows

| Element | Token |
|---------|-------|
| Cards (default) | `shadow-card` |
| Cards (hover) | `shadow-card-hover` |
| Elevated panels | `shadow-elevated` |

---

## Animations

### Card Hover

```
State: Default -> Hover -> Default
+----------------+     +----------------+     +----------------+
|   +--------+   | --> |   +--------+   | --> |   +--------+   |
|   |  Card  |   |     |   |  Card  | ^ |     |   |  Card  |   |
|   +--------+   |     |   +--------+ 2px     |   +--------+   |
+----------------+     +----------------+     +----------------+
     (flat)              (lifted, shadow)          (flat)
```

```css
.card-hover {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
```

### Tab Switching

```
ASSIGNED (4)  CREATED (6)      ASSIGNED (4)  CREATED (6)
[=========]   -----------  ->  -----------   [=========]
    ^                                             ^
 underline                                    underline
 slides to                                    new position
```

```css
.tab-indicator {
  transition: transform 0.2s ease-out, width 0.2s ease-out;
}
```

### Data Loading (Stats)

```
Frame 0: Skeleton     Frame 1: Number fades in    Frame 2: Final
+-------------+       +-------------+              +-------------+
| [▓▓▓▓▓▓▓]   |  -->  |     4       |    -->       |      4      |
| [▓▓▓▓▓▓▓▓]  |       | Assigned... |              | Assigned    |
+-------------+       +-------------+              +-------------+
```

```css
.stat-value {
  animation: fade-in 0.3s ease-out;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Staggered Entry (Feed Items)

```
T=0ms     T=50ms    T=100ms   T=150ms   T=200ms
+---+     +---+     +---+     +---+     +---+
|   | --> | 1 | --> | 1 | --> | 1 | --> | 1 |
+---+     +---+     +---+     +---+     +---+
|   |     |   |     | 2 |     | 2 |     | 2 |
+---+     +---+     +---+     +---+     +---+
|   |     |   |     |   |     | 3 |     | 3 |
+---+     +---+     +---+     +---+     +---+
|   |     |   |     |   |     |   |     | 4 |
+---+     +---+     +---+     +---+     +---+
```

```css
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
```

### Sidebar Collapse/Expand

```
Expanded (200px)           Collapsing              Collapsed (64px)
+------------------+       +----------+            +------+
| [Logo] Nixelo    |  -->  | [Logo]   |   -->      | [L]  |
| [H] Dashboard    |       | [H] Dash |            | [H]  |
| [I] Issues       |       | [I] Issu |            | [I]  |
| [C] Calendar     |       | [C] Cal  |            | [C]  |
+------------------+       +----------+            +------+
```

```css
.sidebar {
  transition: width 0.2s ease-out;
}
.sidebar-collapsed {
  width: 64px;
}
```

---

## Component Inventory

### Cards

| Component | Target Changes |
|-----------|----------------|
| Focus Item Card | Reduce border, add subtle shadow, hover lift |
| Stats Card | Softer background, smaller border, equal heights |
| Issue Card | Add hover lift effect |
| Workspace Card | Add role badge styling |
| Empty State Card | Add illustration, softer text |

### Stats Display

| Component | Target Changes |
|-----------|----------------|
| Stat Number | Add subtle animation on load |
| Stat Label | Use `text-ui-text-secondary` |
| Progress Bar | Match brand color, smoother |
| Alert Badge | Use `text-status-warning` |

### Lists

| Component | Target Changes |
|-----------|----------------|
| Issue List | Add dividers, hover states |
| Workspace List | Consistent spacing |
| Activity Feed | Convert to table or timeline |

### Tabs

| Component | Target Changes |
|-----------|----------------|
| Feed Tabs | Add count badges, smooth indicator transition |

### Badges

| Component | Variants | Target Changes |
|-----------|----------|----------------|
| Priority Badge | HIGHEST, HIGH, MEDIUM, LOW | Color-coded backgrounds |
| Status Badge | Workflow states | Outline or pill style |
| Role Badge | ADMIN, EDITOR, VIEWER | Uppercase, muted |
| Count Badge | Numbers | Inside parentheses or pill |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Stack right sidebar below main content |
| Mobile | Collapse overview to 2x2 grid |
| Tablet (768-1024px) | Narrow right sidebar |
| Desktop (>1024px) | Full three-column layout |
| Wide (>1440px) | Max content width constraint |

---

## Accessibility

- Focus states for keyboard navigation
- Tab order: Sidebar → Main content → Right sidebar
- Screen reader labels for all interactive elements
- Color contrast AA compliance
- Reduced motion support
