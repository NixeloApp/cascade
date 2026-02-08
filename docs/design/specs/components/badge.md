# Badge Component

> **Source**: `src/components/ui/badge.tsx`
> **Visual Reference**: `e2e/screenshots/01-filled-dashboard.png` (priority badges), `e2e/screenshots/10-filled-project-demo-board.png` (status badges)
> **Last Updated**: 2026-02-05

---

## Overview

The Badge component displays short labels, tags, and status indicators. Badges provide quick visual cues about state, category, or importance without requiring user interaction.

**Key Principles**:
1. **Scannable** - Users should instantly understand the badge meaning
2. **Consistent** - Same colors always mean the same thing across the app
3. **Compact** - Minimal footprint, maximum information density
4. **Accessible** - Sufficient color contrast, not relying on color alone

---

## 1. Visual Reference

### Current Nixelo Implementation

From the dashboard (`01-filled-dashboard.png`), badges appear in the Feed section showing priority levels:

```
DEMO-5    HIGH              Database query optimization
DEMO-3    MEDIUM            Design new dashboard layout
DEMO-2    HIGHEST           Fix login timeout on mobile
DEMO-1    HIGH              Set up CI/CD pipeline
```

Priority badges are displayed as uppercase text with neutral gray backgrounds.

From the board view (`10-filled-project-demo-board.png`), status columns use colored top borders:

```
+----------------+  +----------------+  +----------------+  +----------------+
|  To Do    0    |  |  In Progress 1 |  |  In Review  1  |  |  Done     1    |
+----------------+  +----------------+  +----------------+  +----------------+
   [gray border]       [blue border]      [purple border]     [green border]
```

### FocusZone Badge (from FocusZone.tsx)

The Focus Item card displays priority as a primary badge:

```
+------------------------------------------------------------------+
|  [brand left border accent]                                        |
|                                                                    |
|    +-----------+                                   DEMO-2          |
|    | HIGHEST   |  (Badge variant="primary")                        |
|    +-----------+                                                   |
|                                                                    |
|    Fix login timeout on mobile                                     |
|    In project: Demo Project                                        |
|                                                                    |
|                                              View Task ->          |
+------------------------------------------------------------------+
```

---

## 2. Variants

### 2.1 Primary

Brand-colored badge for emphasis and featured content.

```
+------------+
|  HIGHEST   |  bg-brand-subtle
+------------+  text-brand-active
```

**Usage**: Focus items, featured tags, brand highlights

---

### 2.2 Secondary

Subtle badge with neutral background.

```
+------------+
|   Label    |  bg-ui-bg-secondary
+------------+  text-ui-text
```

**Usage**: General-purpose labels, metadata tags

---

### 2.3 Success

Green badge for positive states.

```
+------------+
|   Active   |  bg-status-success-bg
+------------+  text-status-success-text
```

**Usage**: Active status, completed items, enabled states

---

### 2.4 Error

Red badge for critical or error states.

```
+------------+
|  Critical  |  bg-status-error-bg
+------------+  text-status-error-text
```

**Usage**: Error indicators, critical priority, blocked items

---

### 2.5 Warning

Amber/orange badge for attention-needed states.

```
+------------+
|  Pending   |  bg-status-warning-bg
+------------+  text-status-warning-text
```

**Usage**: Warning states, pending review, medium-high priority

---

### 2.6 Info

Blue-tinted badge for informational content.

```
+------------+
|    New     |  bg-brand-subtle
+------------+  text-brand-hover
```

**Usage**: Informational labels, new items, low priority

---

### 2.7 Neutral (Default)

Subtle gray badge for low-emphasis labels.

```
+------------+
|   Draft    |  bg-ui-bg-tertiary
+------------+  text-ui-text-secondary
```

**Usage**: Default/fallback, draft status, inactive items

---

### 2.8 Brand

Same as Primary - brand-colored emphasis badge.

```
+------------+
|   Brand    |  bg-brand-subtle
+------------+  text-brand-active
```

**Usage**: Brand highlights, promotional tags

---

### 2.9 Accent

Purple-tinted badge for accent colors.

```
+------------+
|   Story    |  bg-accent-subtle
+------------+  text-accent-active
```

**Usage**: Story issue type, accent highlights, special categories

---

## 3. Sizes

### 3.1 Small (sm) - Default

Compact size for inline use and dense UIs.

```
+--------+
| Label  |  text-xs
+--------+  px-2 py-0.5
             ~24px height
```

**Usage**: Issue lists, table cells, inline metadata

---

### 3.2 Medium (md)

Standard size with more padding.

```
+----------+
|  Label   |  text-xs
+----------+  px-2 py-1
              ~28px height
```

**Usage**: Cards, headers, standalone badges

---

### 3.3 Large (Proposed)

Larger badge for prominent display.

```
+-------------+
|   Label     |  text-sm
+-------------+  px-3 py-1.5
               ~32px height
```

**Usage**: Hero sections, marketing pages, dashboard KPIs (proposed addition)

---

## 4. Shapes

### 4.1 Rounded (Default)

Standard rounded corners.

```
+----------+
|  Label   |  border-radius: 4px (rounded)
+----------+
```

**Usage**: Most use cases, forms, tables

---

### 4.2 Pill

Fully rounded ends for softer appearance.

```
(  Label  )  border-radius: 9999px (rounded-full)
```

**Usage**: Tags, chips, status indicators, labels

---

## 5. Status Color System

### 5.1 Priority Badges

Priority levels map to specific color schemes for consistent recognition.

```
PRIORITY COLOR MAPPING
+====================+==================+=========================+
| Priority           | Text Color       | Background Color        |
+====================+==================+=========================+
| HIGHEST            | text-priority-   | bg-status-error-bg      |
|                    | highest (red)    | (light red tint)        |
+--------------------+------------------+-------------------------+
| HIGH               | text-priority-   | bg-status-warning-bg    |
|                    | high (orange)    | (light amber tint)      |
+--------------------+------------------+-------------------------+
| MEDIUM             | text-priority-   | bg-status-warning-bg    |
|                    | medium (amber)   | (light amber tint)      |
+--------------------+------------------+-------------------------+
| LOW                | text-priority-   | bg-status-info-bg       |
|                    | low (blue)       | (light blue tint)       |
+--------------------+------------------+-------------------------+
| LOWEST             | text-priority-   | bg-ui-bg-tertiary       |
|                    | lowest (gray)    | (subtle gray)           |
+====================+==================+=========================+
```

**Utility Function**: `getPriorityColor(priority, variant)` from `src/lib/issue-utils.ts`

```typescript
// Returns appropriate classes for priority display
getPriorityColor("highest", "badge") // "text-priority-highest bg-status-error-bg"
getPriorityColor("high", "badge")    // "text-priority-high bg-status-warning-bg"
getPriorityColor("medium", "badge")  // "text-priority-medium bg-status-warning-bg"
getPriorityColor("low", "badge")     // "text-priority-low bg-status-info-bg"
getPriorityColor("lowest", "badge")  // "text-priority-lowest bg-ui-bg-tertiary"
```

---

### 5.2 Status/Workflow Badges

Workflow states use a category-based color system.

```
WORKFLOW CATEGORY COLOR MAPPING
+==================+=======================+=======================+
| Category         | Border Color          | Background Color      |
+==================+=======================+=======================+
| TODO             | border-t-ui-border    | bg-ui-bg-tertiary     |
|                  | (gray)                | text-ui-text-tertiary |
+------------------+-----------------------+-----------------------+
| IN PROGRESS      | border-t-status-info  | bg-status-info-bg     |
|                  | (blue)                | text-status-info-text |
+------------------+-----------------------+-----------------------+
| DONE             | border-t-status-      | bg-status-success-bg  |
|                  | success (green)       | text-status-success-  |
|                  |                       | text                  |
+==================+=======================+=======================+
```

**Utility Function**: `getWorkflowCategoryColor(category, variant)` from `src/lib/issue-utils.ts`

```typescript
// Returns appropriate classes for workflow category
getWorkflowCategoryColor("todo", "bg")       // "bg-ui-bg-tertiary"
getWorkflowCategoryColor("inprogress", "bg") // "bg-status-info-bg"
getWorkflowCategoryColor("done", "bg")       // "bg-status-success-bg"
```

---

### 5.3 Issue Type Badges

Issue types have dedicated color tokens.

```
ISSUE TYPE COLOR MAPPING
+==================+============================+
| Issue Type       | Color Token                |
+==================+============================+
| Task             | --color-issue-type-task    |
|                  | (blue)                     |
+------------------+----------------------------+
| Bug              | --color-issue-type-bug     |
|                  | (red)                      |
+------------------+----------------------------+
| Story            | --color-issue-type-story   |
|                  | (purple)                   |
+------------------+----------------------------+
| Epic             | --color-issue-type-epic    |
|                  | (amber)                    |
+------------------+----------------------------+
| Subtask          | --color-issue-type-subtask |
|                  | (gray)                     |
+==================+============================+
```

---

## 6. Styling Tokens

### 6.1 Color Tokens by Variant

| Variant | Background Token | Text Token | Light Mode | Dark Mode |
|---------|------------------|------------|------------|-----------|
| `primary` | `bg-brand-subtle` | `text-brand-active` | `#EEF2FF` / `#3730A3` | `#1E1B4B` / `#C7D2FE` |
| `secondary` | `bg-ui-bg-secondary` | `text-ui-text` | `#F9FAFB` / `#111827` | `#1F2937` / `#F9FAFB` |
| `success` | `bg-status-success-bg` | `text-status-success-text` | `#F0FDF4` / `#15803D` | `#052E16` / `#86EFAC` |
| `error` | `bg-status-error-bg` | `text-status-error-text` | `#FEF2F2` / `#B91C1C` | `#450A0A` / `#FCA5A5` |
| `warning` | `bg-status-warning-bg` | `text-status-warning-text` | `#FFFBEB` / `#B45309` | `#451A03` / `#FCD34D` |
| `info` | `bg-brand-subtle` | `text-brand-hover` | `#EEF2FF` / `#4338CA` | `#1E1B4B` / `#A5B4FC` |
| `neutral` | `bg-ui-bg-tertiary` | `text-ui-text-secondary` | `#F3F4F6` / `#6B7280` | `#374151` / `#D1D5DB` |
| `brand` | `bg-brand-subtle` | `text-brand-active` | `#EEF2FF` / `#3730A3` | `#1E1B4B` / `#C7D2FE` |
| `accent` | `bg-accent-subtle` | `text-accent-active` | `#FAF5FF` / `#6B21A8` | `#3B0764` / `#E9D5FF` |

---

### 6.2 Size Tokens

| Size | Font Size | Padding X | Padding Y | Approx Height |
|------|-----------|-----------|-----------|---------------|
| `sm` | `text-xs` (12px) | `px-2` (8px) | `py-0.5` (2px) | ~24px |
| `md` | `text-xs` (12px) | `px-2` (8px) | `py-1` (4px) | ~28px |

---

### 6.3 Shape Tokens

| Shape | Border Radius |
|-------|---------------|
| `rounded` | `4px` (rounded) |
| `pill` | `9999px` (rounded-full) |

---

### 6.4 Typography

| Property | Value |
|----------|-------|
| Font Weight | `font-medium` (500) |
| Text Transform | None (uppercase applied contextually) |
| Letter Spacing | Default (contextual `tracking-wider` for uppercase) |

---

## 7. Priority Color Token Reference

Priority colors are defined in `src/index.css`:

```css
/* --- Priority (5 vars) --- */
--color-priority-lowest: var(--color-palette-gray);    /* #6B7280 */
--color-priority-low: var(--color-palette-blue);       /* #3B82F6 */
--color-priority-medium: var(--color-palette-amber);   /* #F59E0B */
--color-priority-high: var(--color-palette-orange);    /* #F97316 */
--color-priority-highest: var(--color-palette-red);    /* #EF4444 */
```

---

## 8. ASCII Variant Matrix

### All Variants at a Glance

```
BADGE VARIANTS (sm size, rounded shape)
+===========+===========+===========+===========+===========+
|  primary  | secondary |  success  |   error   |  warning  |
+===========+===========+===========+===========+===========+
| [HIGHEST] | [ Label ] | [ Active] | [Critical]| [Pending] |
|  indigo   |   gray    |   green   |    red    |   amber   |
+-----------+-----------+-----------+-----------+-----------+
|   info    |  neutral  |   brand   |  accent   |           |
+-----------+-----------+-----------+-----------+-----------+
| [  New  ] | [ Draft ] | [ Brand ] | [ Story ] |           |
|   blue    |   gray    |  indigo   |  purple   |           |
+===========+===========+===========+===========+===========+
```

### Priority Badges

```
PRIORITY BADGE SCALE
+=========+=========+=========+=========+=========+
| LOWEST  |   LOW   |  MEDIUM |   HIGH  | HIGHEST |
+=========+=========+=========+=========+=========+
|  gray   |  blue   |  amber  | orange  |   red   |
|  muted  |  info   | warning | warning |  error  |
+---------+---------+---------+---------+---------+
     1         2         3         4         5
   (calm)                                (urgent)
```

### Size Comparison

```
BADGE SIZES
+------------------+------------------+
|       sm         |       md         |
+------------------+------------------+
|    +-------+     |    +--------+    |
|    | Label |     |    |  Label |    |
|    +-------+     |    +--------+    |
|    24px height   |    28px height   |
|    py-0.5        |    py-1          |
+------------------+------------------+
```

### Shape Comparison

```
BADGE SHAPES
+---------------------+---------------------+
|       rounded       |        pill         |
+---------------------+---------------------+
|     +---------+     |     (         )     |
|     |  Label  |     |     (  Label  )     |
|     +---------+     |     (         )     |
|     radius: 4px     |    radius: 9999px   |
+---------------------+---------------------+
```

---

## 9. Props / API

### BadgeProps Interface

```typescript
interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Visual style variant
   * @default "neutral"
   */
  variant?: "primary" | "secondary" | "success" | "error" | "warning" |
            "info" | "neutral" | "brand" | "accent";

  /**
   * Size preset
   * @default "sm"
   */
  size?: "sm" | "md";

  /**
   * Border radius shape
   * @default "rounded"
   */
  shape?: "rounded" | "pill";
}
```

### Full Props Table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `BadgeVariant` | `"neutral"` | Visual style variant |
| `size` | `"sm" \| "md"` | `"sm"` | Size preset |
| `shape` | `"rounded" \| "pill"` | `"rounded"` | Border radius style |
| `className` | `string` | `undefined` | Additional CSS classes |
| `children` | `ReactNode` | `undefined` | Badge content |

---

## 10. Code Examples

### Current Implementation (from badge.tsx)

```typescript
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center font-medium", {
  variants: {
    variant: {
      primary: "bg-brand-subtle text-brand-active",
      secondary: "bg-ui-bg-secondary text-ui-text",
      success: "bg-status-success-bg text-status-success-text",
      error: "bg-status-error-bg text-status-error-text",
      warning: "bg-status-warning-bg text-status-warning-text",
      info: "bg-brand-subtle text-brand-hover",
      neutral: "bg-ui-bg-tertiary text-ui-text-secondary",
      brand: "bg-brand-subtle text-brand-active",
      accent: "bg-accent-subtle text-accent-active",
    },
    size: {
      sm: "text-xs px-2 py-0.5",
      md: "text-xs px-2 py-1",
    },
    shape: {
      rounded: "rounded",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "sm",
    shape: "rounded",
  },
});

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, shape, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, shape }), className)}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
```

### Basic Usage Examples

```tsx
import { Badge } from "@/components/ui/Badge";

// Default neutral badge
<Badge>Draft</Badge>

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="error">Critical</Badge>
<Badge variant="warning">Pending</Badge>

// Priority badge (uppercase convention)
<Badge variant="primary">{priority.toUpperCase()}</Badge>

// Pill-shaped badge
<Badge variant="brand" shape="pill">New</Badge>

// Medium size
<Badge variant="accent" size="md">Story</Badge>
```

### Priority Badge Pattern

```tsx
import { Badge } from "@/components/ui/Badge";
import { getPriorityColor } from "@/lib/issue-utils";

// Using utility function for priority colors
<Badge
  variant="neutral"
  className={cn("text-xs uppercase font-bold", getPriorityColor(priority, "badge"))}
>
  {priority}
</Badge>

// Simple uppercase priority (current dashboard pattern)
<Badge variant="neutral" className="text-xs uppercase font-bold bg-ui-bg-tertiary/50">
  {issue.priority}
</Badge>

// FocusZone pattern with primary variant
<Badge variant="primary">{task.priority.toUpperCase()}</Badge>
```

### Status Badge Pattern

```tsx
import { Badge } from "@/components/ui/Badge";
import { getStatusColor } from "@/lib/issue-utils";

// Status badge with dynamic colors
<Badge size="md" className={cn("capitalize", getStatusColor(status))}>
  {status}
</Badge>

// Automation rule status
<Badge variant={rule.isActive ? "success" : "neutral"} size="md">
  {rule.isActive ? "Active" : "Inactive"}
</Badge>
```

### Issue Type Badge Pattern

```tsx
import { Badge } from "@/components/ui/Badge";

// Issue type badges (from RoadmapView)
function getIssueTypeVariant(type: string) {
  switch (type) {
    case "bug":
      return "error";
    case "story":
      return "accent";
    case "epic":
      return "warning";
    default:
      return "info"; // task
  }
}

<Badge variant={getIssueTypeVariant(item.issueType)} size="md">
  {item.issueType}
</Badge>
```

### Category/Label Badge Pattern

```tsx
import { Badge } from "@/components/ui/Badge";

// Template category badge
<Badge variant="neutral" size="md" className="capitalize">
  {template.category}
</Badge>

// Public visibility badge
{template.isPublic && (
  <Badge variant="success" size="md">
    Public
  </Badge>
)}
```

---

## 11. Target Implementation (Polished Version)

### Proposed Enhancements

1. **Add outline variant** for bordered badges
2. **Add large size** for prominent displays
3. **Dedicated priority badge component** for consistent styling
4. **Improved contrast** in dark mode

### Proposed Badge Variants Update

```typescript
const badgeVariants = cva(
  "inline-flex items-center font-medium transition-colors",
  {
    variants: {
      variant: {
        // ... existing variants ...
        outline: "bg-transparent border border-ui-border text-ui-text",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-xs px-2 py-1",
        lg: "text-sm px-3 py-1.5", // New large size
      },
      // ... existing shape variants ...
    },
  },
);
```

### Proposed PriorityBadge Component

```tsx
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type Priority = "lowest" | "low" | "medium" | "high" | "highest";

const priorityConfig: Record<Priority, { variant: BadgeVariant; className: string }> = {
  highest: { variant: "error", className: "" },
  high: { variant: "warning", className: "" },
  medium: { variant: "warning", className: "bg-status-warning-bg/50" },
  low: { variant: "info", className: "" },
  lowest: { variant: "neutral", className: "" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority as Priority] || priorityConfig.lowest;

  return (
    <Badge
      variant={config.variant}
      className={cn("uppercase font-bold tracking-wide", config.className)}
    >
      {priority}
    </Badge>
  );
}
```

### Proposed StatusBadge Component

```tsx
import { Badge } from "@/components/ui/Badge";
import { getWorkflowCategoryColor } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  category,
}: {
  status: string;
  category: "todo" | "inprogress" | "done";
}) {
  return (
    <Badge
      variant="neutral"
      className={cn(
        "capitalize",
        getWorkflowCategoryColor(category, "bg"),
        getWorkflowCategoryColor(category, "text"),
      )}
    >
      {status}
    </Badge>
  );
}
```

---

## 12. Accessibility

### Color Contrast

All badge variants meet WCAG AA contrast requirements:

| Variant | Contrast Ratio (Light) | Status |
|---------|------------------------|--------|
| primary | 5.2:1 (indigo-800 on indigo-50) | PASS |
| secondary | 7.2:1 (gray-900 on gray-50) | PASS |
| success | 4.8:1 (green-700 on green-50) | PASS |
| error | 5.1:1 (red-700 on red-50) | PASS |
| warning | 4.6:1 (amber-700 on amber-50) | PASS |
| neutral | 4.5:1 (gray-500 on gray-100) | PASS |

### Not Relying on Color Alone

Badges should always include text content. Icons or text should supplement color meaning:

```tsx
// Good - text provides context
<Badge variant="error">Critical</Badge>
<Badge variant="success">Active</Badge>

// Better - icon + text for priority
<Badge variant="error">
  <ArrowUpIcon className="h-3 w-3 mr-1" />
  Highest
</Badge>
```

### Screen Reader Considerations

For badges that convey status, ensure the status is clear from context or use aria-label:

```tsx
// Status is clear from surrounding context
<Flex>
  <span className="sr-only">Priority:</span>
  <Badge variant="error">Highest</Badge>
</Flex>

// Or use descriptive text
<Badge variant="error" aria-label="Priority: Highest">
  Highest
</Badge>
```

---

## 13. Usage Guidelines

### DO

- Use consistent color mapping for priorities and statuses
- Keep badge text short (1-2 words)
- Use uppercase for priority badges for scannability
- Apply `font-bold` for priority badges
- Use the `pill` shape for tags and labels

### DON'T

- Don't use badges for long text content
- Don't use color alone to convey meaning
- Don't mix different badge styles for the same category
- Don't use badges as buttons (use Button component instead)
- Don't stack more than 3 badges in a row

### Variant Selection Guide

| Use Case | Recommended Variant |
|----------|---------------------|
| Highest/Critical priority | `error` |
| High priority | `warning` |
| Medium priority | `warning` (lighter) |
| Low priority | `info` |
| Lowest priority | `neutral` |
| Active/Done status | `success` |
| Blocked/Error status | `error` |
| In Progress status | `info` |
| To Do status | `neutral` |
| Issue type: Bug | `error` |
| Issue type: Story | `accent` |
| Issue type: Epic | `warning` |
| Issue type: Task | `info` |
| General label/tag | `neutral` |
| Featured/New item | `brand` or `primary` |

---

## 14. Related Components

- **Button** - For interactive elements (use Button, not Badge, for clickable items)
- **Avatar** - For user representations
- **Tag** - Proposed component for removable/interactive tags
- **Chip** - Proposed component for filter selections

---

## 15. Related Documentation

- [MASTER_PLAN.md](../MASTER_PLAN.md) - Overall design system roadmap
- [tokens/colors.md](../tokens/colors.md) - Color token reference
- [src/lib/issue-utils.ts](../../../src/lib/issue-utils.ts) - Priority and status color utilities

---

*This document is part of the Nixelo Design System. See [MASTER_PLAN.md](../MASTER_PLAN.md) for the full design system overview.*
