# Card Component

> **Design System Documentation** | Last Updated: 2026-02-05

Cards are container components that group related content and actions. They provide visual hierarchy, define content boundaries, and support interactive patterns like clickable navigation.

---

## Table of Contents

1. [Visual Reference](#visual-reference)
2. [Anatomy](#anatomy)
3. [Variants](#variants)
4. [Props/API](#propsapi)
5. [Styling Tokens](#styling-tokens)
6. [Animations](#animations)
7. [Accessibility](#accessibility)
8. [Code Examples](#code-examples)

---

## Visual Reference

### Mintlify Reference

**Source**: `docs/research/library/mintlify/landing_desktop_dark.png`

Mintlify cards exhibit these premium characteristics:

- **Ultra-subtle borders**: `rgba(255,255,255,0.07)` - barely visible, adds depth without visual noise
- **Soft background**: `rgba(255,255,255,0.03)` - slight lift from page background
- **No harsh shadows**: Relies on subtle borders and background contrast
- **Generous padding**: Large internal spacing for breathing room
- **Rounded corners**: Consistent radius (typically 12-16px)

```
Mintlify Card Appearance (Dark Mode):
+--------------------------------------------------+
|  [barely visible border - 7% white opacity]      |
|                                                  |
|     Icon/Image                                   |
|                                                  |
|     Title Text (white, semibold)                 |
|     Description (70% white opacity)              |
|                                                  |
|     [optional CTA link in brand color]           |
|                                                  |
+--------------------------------------------------+
  Background: rgba(255,255,255,0.03) - 3% white
```

### Current Nixelo

**Source**: `e2e/screenshots/01-filled-dashboard.png`, `src/components/ui/card.tsx`

Current Nixelo cards use:

- Solid background: `bg-ui-bg` (white/gray-900)
- Visible border: `border-ui-border` (gray-200/gray-700)
- Standard shadow on hover: `hover:shadow-md`
- Consistent padding: `p-4` to `p-6`

---

## Anatomy

### ASCII Structure

```
+------------------------------------------------------------------+
|  CARD CONTAINER                                                   |
|  +---------------------------------------------------------+     |
|  |  CARD HEADER (optional)                                  |     |
|  |  +----------------------+  +-------------------------+   |     |
|  |  | Title + Description  |  | Action (button/icon)    |   |     |
|  |  +----------------------+  +-------------------------+   |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  +---------------------------------------------------------+     |
|  |  CARD CONTENT                                            |     |
|  |                                                          |     |
|  |  Main body content goes here. Can contain any           |     |
|  |  combination of text, images, lists, forms, etc.        |     |
|  |                                                          |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  +---------------------------------------------------------+     |
|  |  CARD FOOTER (optional)                                  |     |
|  |  Actions, metadata, links                                |     |
|  +---------------------------------------------------------+     |
+------------------------------------------------------------------+
```

### Component Parts

| Part | Purpose | Default Classes |
|------|---------|-----------------|
| `Card` | Container wrapper | `bg-ui-bg rounded-lg border border-ui-border` |
| `CardHeader` | Title/description area | `p-4 border-b border-ui-border` or `p-6` (structured) |
| `CardTitle` | Main heading | `text-lg font-semibold text-ui-text` |
| `CardDescription` | Subtext | `text-sm text-ui-text-secondary` |
| `CardContent` | Body area | `p-6 pt-0` |
| `CardBody` | Alias for content | `p-4` |
| `CardFooter` | Actions/metadata | `p-6 pt-0` (uses Flex) |

---

## Variants

### 1. Default Card

Static container for displaying content.

```
+----------------------------------------+
|  bg-ui-bg                              |
|  border: 1px solid border-ui-border    |
|  border-radius: 8px (rounded-lg)       |
|                                        |
|     Content                            |
|                                        |
+----------------------------------------+
```

**Usage**: Dashboard widgets, information displays, form containers

### 2. Interactive/Clickable Card

Responds to user interaction with visual feedback.

```
RESTING STATE:
+----------------------------------------+
|  Standard card appearance              |
|  cursor: default                       |
+----------------------------------------+

HOVER STATE:
+========================================+
|  shadow-md                             |
|  cursor: pointer                       |
|  (optional: slight scale or lift)      |
+========================================+

FOCUS STATE:
+[======================================]+
|  outline: 2px solid brand-ring         |
|  outline-offset: 2px                   |
+[======================================]+
```

**Usage**: Navigation cards, project cards, clickable list items

### 3. Stat Card

Displays key metrics with emphasis on the number.

```
+----------------------------------------+
|  LABEL                    TREND ICON   |
|  text-ui-text-secondary                |
|                                        |
|  42                                    |
|  text-3xl font-bold text-ui-text       |
|                                        |
|  [========] progress bar (optional)    |
+----------------------------------------+
```

**Example from Dashboard**: "Active Load" (4), "Velocity" (1), "Attention Needed" (3)

### 4. Feature Card

Marketing-style card with icon, title, and description.

```
+----------------------------------------+
|                                        |
|      [ICON]                            |
|      40x40, brand-subtle-bg            |
|                                        |
|  Feature Title                         |
|  font-semibold text-ui-text            |
|                                        |
|  Brief description of the feature      |
|  text-ui-text-secondary                |
|                                        |
|  Learn more ->                         |
|  text-brand                            |
+----------------------------------------+
```

**Mintlify Style Enhancement**:
- Icon with soft brand background
- Clean vertical stack layout
- Link as call-to-action (not button)

---

## Props/API

### Card Component

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;  // Enable hover shadow/cursor
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;  // Click handler
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hoverable` | `boolean` | `false` | Adds `hover:shadow-md transition-shadow cursor-pointer` |
| `onClick` | `function` | - | Click handler; adds `role="button"`, `tabIndex={0}`, keyboard support |
| `className` | `string` | - | Additional CSS classes |
| `children` | `ReactNode` | - | Card content |

### CardHeader Component

```typescript
interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `ReactNode` | - | Header title text |
| `description` | `ReactNode` | - | Subtitle/description |
| `action` | `ReactNode` | - | Right-aligned action (button, icon, etc.) |
| `children` | `ReactNode` | - | Alternative to structured props |

### CardTitle / CardDescription / CardContent / CardFooter

Standard `HTMLDivElement` props with pre-applied styling.

---

## Styling Tokens

### Current Nixelo Tokens

| Property | Token | Value (Light) | Value (Dark) |
|----------|-------|---------------|--------------|
| Background | `bg-ui-bg` | `#FFFFFF` | `#111827` (gray-900) |
| Border | `border-ui-border` | `#E5E7EB` (gray-200) | `#374151` (gray-700) |
| Border Radius | `rounded-lg` | `8px` | `8px` |
| Shadow | `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | - |
| Text | `text-ui-text` | `#111827` | `#F9FAFB` |
| Secondary Text | `text-ui-text-secondary` | `#6B7280` | `#D1D5DB` |

### Mintlify-Inspired Token Recommendations

For premium polish, consider these Mintlify-inspired values:

| Property | Current | Mintlify-Inspired | Notes |
|----------|---------|-------------------|-------|
| Background | `var(--p-white)` / `var(--p-gray-900)` | `rgba(255,255,255,0.03)` (dark) | Subtle lift from page |
| Border | `var(--p-gray-200)` / `var(--p-gray-700)` | `rgba(255,255,255,0.07)` (dark) | Ultra-subtle |
| Shadow | `shadow-md` on hover | None or very subtle | Rely on border/background |
| Border Radius | `8px` | `12px` | Slightly larger for softness |

### Proposed New Tokens

```css
/* Add to @theme in src/index.css */

/* Card-specific surfaces */
--color-card-bg: light-dark(
  var(--p-white),
  rgba(255, 255, 255, 0.03)
);

--color-card-bg-hover: light-dark(
  var(--p-gray-50),
  rgba(255, 255, 255, 0.05)
);

/* Ultra-subtle card border */
--color-card-border: light-dark(
  rgba(0, 0, 0, 0.07),
  rgba(255, 255, 255, 0.07)
);

/* Card shadow tokens already exist */
--shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
```

---

## Animations

### Hover Lift Effect

Subtle upward movement and shadow enhancement on hover.

```css
/* Transition properties */
transition: transform 0.2s ease, box-shadow 0.2s ease;

/* Hover state */
:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
```

### Hover Glow Effect (Mintlify-style)

Subtle border brightness increase.

```css
/* Transition */
transition: border-color 0.2s ease;

/* Hover - brighten border */
:hover {
  border-color: rgba(255, 255, 255, 0.15); /* From 0.07 to 0.15 */
}
```

### Scale Effect

Micro-scale on click for tactile feedback.

```css
/* Active/pressed state */
:active {
  transform: scale(0.98);
}
```

### Entry Animation

Fade and slide up for staggered card reveals.

```css
/* Keyframe (already in @theme) */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Usage */
animation: var(--animation-slide-up); /* 0.4s ease-out */
```

### Recommended Animation Classes

```tsx
// Static card - no animation
<Card>...</Card>

// Hoverable card with lift
<Card className="hover:-translate-y-0.5 transition-transform">...</Card>

// Entry animation (staggered)
<Card className="animate-[slide-up_0.4s_ease-out]" style={{ animationDelay: '100ms' }}>...</Card>
```

---

## Accessibility

### Keyboard Navigation

When `onClick` is provided, the Card component automatically adds:

- `role="button"` - Announces as interactive
- `tabIndex={0}` - Makes focusable via Tab key
- `onKeyDown` handler - Activates on Enter or Space

### Focus Indicators

Use the global focus styles from `src/index.css`:

```css
*:focus-visible {
  outline: 2px solid var(--color-ui-border-focus);
  outline-offset: 2px;
}
```

### ARIA Guidelines

| Scenario | ARIA Attribute | Value |
|----------|----------------|-------|
| Clickable card | `role` | `"button"` (auto-added) |
| Card with link | Use `<a>` wrapper | Native semantics |
| Stat card | `aria-label` | Include full context: "4 assigned tasks" |
| Loading state | `aria-busy` | `"true"` |

### Color Contrast

Ensure all text meets WCAG 2.1 AA standards:

- Primary text: 7:1 contrast ratio (AAA)
- Secondary text: 4.5:1 minimum (AA)
- Interactive elements: 3:1 non-text contrast

---

## Code Examples

### Current Implementation

```tsx
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

// Basic card
<Card>
  <CardHeader title="Card Title" description="Optional description" />
  <CardContent>
    <p>Main content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Clickable card
<Card hoverable onClick={() => navigate(ROUTES.projectDetail(slug, key))}>
  <CardContent>
    <h3>Project Name</h3>
    <p>Click to view details</p>
  </CardContent>
</Card>

// Stat card (custom composition)
<Card>
  <CardContent>
    <Flex justify="between" align="center">
      <Typography variant="caption" color="secondary">ACTIVE LOAD</Typography>
      <Icon name="trending-up" size="sm" />
    </Flex>
    <Typography variant="h2" className="mt-2">4</Typography>
    <Typography variant="body-sm" color="secondary">Assigned tasks</Typography>
  </CardContent>
</Card>
```

### Target Implementation (Mintlify-Inspired)

```tsx
// Enhanced card with subtle styling
const cardVariants = cva(
  "rounded-container border transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-ui-bg border-ui-border",
        subtle: "bg-card-bg border-card-border", // New tokens
        elevated: "bg-ui-bg-elevated shadow-card",
      },
      hoverable: {
        true: "hover:border-ui-border-secondary hover:-translate-y-0.5 cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      hoverable: false,
    },
  }
);

// Feature card (Mintlify-style)
<Card variant="subtle" className="p-6">
  <Flex direction="column" gap="md" align="start">
    <div className="p-3 rounded-lg bg-brand-subtle">
      <Icon name="document" className="text-brand" />
    </div>
    <div>
      <Typography variant="h4" className="mb-1">Documents</Typography>
      <Typography variant="body-sm" color="secondary">
        Create and collaborate on rich text documents with your team.
      </Typography>
    </div>
    <Link to={ROUTES.documents(slug)} className="text-brand text-sm font-medium">
      Explore documents &rarr;
    </Link>
  </Flex>
</Card>

// Stat card with attention state
<Card
  variant="subtle"
  className={cn(
    "p-4",
    needsAttention && "border-status-warning"
  )}
>
  <Typography variant="caption" color="secondary" className="uppercase tracking-wide">
    Attention Needed
  </Typography>
  <Flex align="baseline" gap="xs" className="mt-2">
    <Typography variant="h2" className="text-status-warning">3</Typography>
    <Typography variant="body-sm" color="secondary">High Priority</Typography>
  </Flex>
</Card>
```

### CSS Token Updates for Target

```css
/* Add to src/index.css @theme block */

/* Card-specific tokens */
--color-card-bg: light-dark(
  var(--p-white),
  rgba(255, 255, 255, 0.03)
);

--color-card-border: light-dark(
  var(--p-gray-200),
  rgba(255, 255, 255, 0.07)
);

--color-card-border-hover: light-dark(
  var(--p-gray-300),
  rgba(255, 255, 255, 0.15)
);

/* Container radius for cards */
--radius-container: 12px;
```

---

## Related Documentation

- [MASTER_PLAN.md](../MASTER_PLAN.md) - Overall design system roadmap
- [tokens/colors.md](../tokens/colors.md) - Color token reference
- [tokens/animations.md](../tokens/animations.md) - Animation patterns
- [src/components/ui/card.tsx](../../../src/components/ui/card.tsx) - Source implementation
- [Mintlify Research](../../research/library/mintlify/) - Design inspiration source

---

## Implementation Checklist

- [ ] Add `--color-card-bg` token to `src/index.css`
- [ ] Add `--color-card-border` token with subtle opacity
- [ ] Add `--color-card-border-hover` for interactive states
- [ ] Update `cardVariants` with `variant` prop (default, subtle, elevated)
- [ ] Add hover lift animation (`hover:-translate-y-0.5`)
- [ ] Update border radius to use `rounded-container` (12px)
- [ ] Add entry animation support via className
- [ ] Create `StatCard` composition example
- [ ] Create `FeatureCard` composition example
- [ ] Test dark mode appearance
- [ ] Verify focus states meet accessibility requirements
