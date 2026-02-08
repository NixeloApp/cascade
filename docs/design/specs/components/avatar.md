# Avatar Component

> **Status**: Implemented
> **Location**: `src/components/ui/avatar.tsx`

---

## Overview

The Avatar component displays user profile images with graceful fallbacks to initials or icons. Built on Radix UI Avatar primitives for accessibility, it supports multiple sizes, color variants, and can be composed into groups for displaying multiple users.

**Screenshots**:
- Dashboard user avatar: `e2e/screenshots/01-filled-dashboard.png` (top-right header)
- Board assignee avatars: `e2e/screenshots/10-filled-project-demo-board.png` (issue cards)

---

## Visual Reference

### Current Nixelo Implementation

From the screenshots:

1. **Header Avatar**: User avatar "EC" (Emily Chen) in top-right corner with brand indigo background
2. **Issue Card Avatars**: Small "E" initials on Kanban cards showing assignees
3. **Styling**: Circular shape, consistent sizing within context, clear initials

---

## Variants

### 1. Image Avatar

Displays a user's profile photo when available.

```
+--------+
|        |
|  [IMG] |
|        |
+--------+
```

**Behavior**:
- Image loads with 600ms delay before showing fallback
- Covers the full avatar area with `object-cover`
- Falls back to initials on load error

### 2. Initials Fallback

Displays 1-2 letter initials when no image is available.

```
+--------+      +--------+
|        |      |        |
|   JD   |      |   J    |
|        |      |        |
+--------+      +--------+
  (2 letters)   (1 letter)
```

**Initials Logic**:
- Full name "John Doe" -> "JD" (first + last initial)
- Single name "John" -> "J"
- Email "john@example.com" -> "J"
- Nothing provided -> "?"

### 3. Icon Fallback

Uses a "?" placeholder when no name or email is provided.

```
+--------+
|        |
|   ?    |
|        |
+--------+
```

### 4. Avatar with Status Indicator

Avatar with a status dot overlay (e.g., online, offline, busy).

```
+--------+
|        |
|   JD   |
|      * |  <- Status dot (bottom-right)
+--------+
```

**Note**: Status indicator not yet implemented in current codebase.

### 5. Avatar Group (Stacked)

Multiple avatars overlapping to show team members or assignees.

```
+--------+
|   JD   +------+
+--------|  AB  +------+
         +------|  CD  +--+
                +------|+3|   <- Overflow indicator
                       +--+
```

**Overlap amounts by size**:
- `xs`: -6px (`-ml-1.5`)
- `sm`: -8px (`-ml-2`)
- `md`: -10px (`-ml-2.5`)
- `lg`: -12px (`-ml-3`)
- `xl`: -14px (`-ml-3.5`)

---

## Sizes

| Size | Dimensions | Font Size | Use Case |
|------|------------|-----------|----------|
| `xs` | 20px (w-5 h-5) | 12px (text-xs) | Compact lists, inline mentions |
| `sm` | 24px (w-6 h-6) | 12px (text-xs) | Table rows, small cards |
| `md` | 32px (w-8 h-8) | 14px (text-sm) | **Default** - Cards, comments |
| `lg` | 40px (w-10 h-10) | 16px (text-base) | Profile headers, larger cards |
| `xl` | 48px (w-12 h-12) | 18px (text-lg) | Profile pages, hero sections |

### ASCII Size Comparison

```
xs     sm      md        lg          xl
+--+   +---+   +----+    +-----+     +------+
|JD|   |JD |   | JD |    |  JD |     |  JD  |
+--+   +---+   +----+    +-----+     +------+
20px   24px    32px      40px        48px
```

---

## Color Variants (Fallback Background)

| Variant | Background | Text | Use Case |
|---------|------------|------|----------|
| `brand` | `bg-brand` (indigo) | White | **Default** - Primary users |
| `accent` | `bg-accent` (purple) | White | Special roles, highlights |
| `neutral` | `bg-ui-bg-tertiary` | `text-ui-text` | System users, placeholders |
| `success` | `bg-status-success` | White | Active/online status |
| `warning` | `bg-status-warning` | White | Away/idle status |
| `error` | `bg-status-error` | White | Busy/DND status |

### Color Swatches (ASCII)

```
 brand     accent    neutral   success   warning   error
+------+  +------+  +------+  +------+  +------+  +------+
|INDIGO|  |PURPLE|  | GRAY |  |GREEN |  |AMBER |  | RED  |
| (JD) |  | (JD) |  | (JD) |  | (JD) |  | (JD) |  | (JD) |
+------+  +------+  +------+  +------+  +------+  +------+
```

---

## Design Tokens

### Shape

| Property | Value | Token |
|----------|-------|-------|
| Border radius | Full circle | `rounded-full` |
| Overflow | Hidden | `overflow-hidden` |

### Sizing

| Size | Width/Height | Tailwind Class |
|------|--------------|----------------|
| xs | 20px | `w-5 h-5` |
| sm | 24px | `w-6 h-6` |
| md | 32px | `w-8 h-8` |
| lg | 40px | `w-10 h-10` |
| xl | 48px | `w-12 h-12` |

### Typography

| Size | Font Size | Tailwind Class |
|------|-----------|----------------|
| xs | 12px | `text-xs` |
| sm | 12px | `text-xs` |
| md | 14px | `text-sm` |
| lg | 16px | `text-base` |
| xl | 18px | `text-lg` |

### Colors (Semantic Tokens)

| Element | Token | Light Mode | Dark Mode |
|---------|-------|------------|-----------|
| Brand bg | `--color-brand` | `#4F46E5` (indigo-600) | `#818CF8` (indigo-400) |
| Accent bg | `--color-accent` | `#9333EA` (purple-600) | `#C084FC` (purple-400) |
| Neutral bg | `--color-ui-bg-tertiary` | `#F3F4F6` (gray-100) | `#374151` (gray-700) |
| Success bg | `--color-status-success` | `#22C55E` (green-500) | `#4ADE80` (green-400) |
| Warning bg | `--color-status-warning` | `#F59E0B` (amber-500) | `#FBBF24` (amber-400) |
| Error bg | `--color-status-error` | `#EF4444` (red-500) | `#F87171` (red-400) |
| Text (dark bg) | White | `#FFFFFF` | `#FFFFFF` |
| Text (neutral) | `--color-ui-text` | `#111827` (gray-900) | `#F9FAFB` (gray-50) |

### Avatar Group Ring

| Property | Value | Token |
|----------|-------|-------|
| Ring width | 2px | `ring-2` |
| Ring color | `--color-ui-bg` | `ring-ui-bg` |

---

## Avatar Group Details

### Maximum Display

The `AvatarGroup` component accepts a `max` prop to limit visible avatars:

```
max=3 with 6 avatars:

[A1][A2][A3][+3]
```

### Overflow Indicator Styling

- Background: `bg-ui-bg-tertiary`
- Text: `text-ui-text-secondary`
- Font: `font-medium`
- Ring: Same as avatars (`ring-2 ring-ui-bg`)
- Size: Matches avatar size in group

### Overlap Calculation

Each subsequent avatar overlaps the previous by a size-dependent amount:

```
Size    Overlap    CSS
----    -------    ---
xs      6px        -ml-1.5
sm      8px        -ml-2
md      10px       -ml-2.5
lg      12px       -ml-3
xl      14px       -ml-3.5
```

---

## Code Examples

### Current Implementation

```tsx
import { Avatar, AvatarGroup } from "@/components/ui/avatar";

// Basic avatar with name (initials fallback)
<Avatar name="John Doe" />

// Avatar with image
<Avatar
  name="John Doe"
  src="/avatars/john.jpg"
  size="lg"
/>

// Avatar with email fallback
<Avatar email="john@example.com" />

// Avatar with custom variant
<Avatar
  name="Jane Smith"
  variant="accent"
  size="md"
/>

// Avatar group with max limit
<AvatarGroup max={3} size="sm">
  <Avatar name="John Doe" />
  <Avatar name="Jane Smith" />
  <Avatar name="Bob Wilson" />
  <Avatar name="Alice Brown" />
  <Avatar name="Charlie Davis" />
</AvatarGroup>
```

### Props Interface

```tsx
interface AvatarProps {
  /** User's name - used to generate initials */
  name?: string | null;
  /** User's email - fallback for initials if name is missing */
  email?: string | null;
  /** Image URL for the avatar */
  src?: string | null;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Color variant for the background */
  variant?: "brand" | "accent" | "neutral" | "success" | "warning" | "error";
  /** Additional CSS classes */
  className?: string;
  /** Alt text for image (defaults to name) */
  alt?: string;
}

interface AvatarGroupProps {
  children: React.ReactNode;
  /** Maximum avatars to show before +N indicator */
  max?: number;
  /** Size for all avatars in group */
  size?: AvatarProps["size"];
  /** Additional CSS classes */
  className?: string;
}
```

---

## Accessibility

### Current Implementation

- Built on Radix UI Avatar primitive
- Image has `alt` text (defaults to name or "User avatar")
- Fallback delay (600ms) prevents flash when image loads slowly
- Sufficient color contrast for initials on all variants

### Recommendations

- Add `role="img"` for screen reader context on fallback avatars
- Consider `aria-label` for avatar groups describing member count

---

## Usage Guidelines

### Do

- Use consistent sizes within the same context
- Provide `name` when available for meaningful initials
- Use `brand` variant for primary users, `neutral` for system/placeholder
- Set `max` on avatar groups to prevent overcrowding

### Don't

- Mix multiple sizes in the same avatar group
- Use status color variants (`success`, `warning`, `error`) just for decoration
- Display more than 5-6 avatars without using a group with `max`

---

## Future Enhancements

### Status Indicator (Not Yet Implemented)

Add online/offline status dots:

```tsx
interface AvatarProps {
  // ... existing props
  status?: "online" | "offline" | "away" | "busy";
}
```

**Styling**:
- Position: `absolute bottom-0 right-0`
- Size: 25% of avatar (e.g., 8px for `md` avatar)
- Border: `ring-2 ring-ui-bg` to separate from avatar
- Colors:
  - Online: `bg-status-success`
  - Offline: `bg-ui-text-tertiary`
  - Away: `bg-status-warning`
  - Busy: `bg-status-error`

### Animated Presence

For real-time collaboration indicators:

```css
@keyframes presence-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.avatar-status-online {
  animation: presence-pulse 2s ease-in-out infinite;
}
```

---

## Related Components

- **Flex**: Used in `AvatarGroup` for layout
- **Badge**: Often paired with avatars for labels
- **Tooltip**: Can wrap avatars to show full name on hover
- **Card**: Common container for avatar + user info

---

## Related Files

### Implementation
- Component: `src/components/ui/avatar.tsx`
- Design tokens: `src/index.css` (`@theme` block)
- Utils: `src/lib/utils.ts` (`cn()`)

### Screenshots
- Dashboard: `e2e/screenshots/01-filled-dashboard.png`
- Board: `e2e/screenshots/10-filled-project-demo-board.png`

---

*Last Updated: 2026-02-05*
*Status: Documented - Implementation Complete*
