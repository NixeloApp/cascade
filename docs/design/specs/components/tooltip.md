# Tooltip Component

> **Source**: `src/components/ui/tooltip.tsx`
> **Design Reference**: Mintlify patterns from `docs/research/library/mintlify/landing_deep.json`
> **Last Updated**: 2026-02-05

---

## Overview

Tooltips provide contextual information when users hover over or focus on an element. They should be concise, informative, and non-intrusive.

**Core Principles**:
1. **Helpful, not obstructive** - Appear quickly, dismiss quickly
2. **Concise content** - Single line preferred, max 2-3 lines
3. **Accessible** - Works with keyboard focus and screen readers
4. **Consistent positioning** - Predictable placement relative to trigger

---

## 1. Visual Reference

### Current Nixelo Implementation

```
+----------------------------------+
|  px-3 py-1.5                     |
|  +----------------------------+  |
|  |  Helpful tooltip text      |  |
|  +----------------------------+  |
|  bg-ui-bg-hero (gray-950)        |
|  text-ui-text-inverse (white)    |
|  rounded-md, shadow-md           |
+----------------------------------+
```

### Mintlify Pattern

```
+----------------------------------+
|  px-2.5 py-1.5                   |
|  +----------------------------+  |
|  |  Tooltip content           |  |
|  +----------------------------+  |
|  bg: #151819 (near-black)        |
|  text: white                     |
|  border: rgba(255,255,255,.07)   |
|  rounded-md, subtle shadow       |
+----------------------------------+
```

---

## 2. Variants

### 2.1 Default Tooltip

Simple text tooltip for quick hints and labels.

```
         +------------------+
         | Save document    |
         +------------------+
                  |
                  v
            +----------+
            |   Save   |
            +----------+
```

**Usage**: Icon buttons, truncated text, keyboard shortcuts

### 2.2 Rich Tooltip (Title + Description)

For more detailed explanations. Not currently implemented in Nixelo.

```
    +--------------------------------+
    |  Auto-save                     |  <- title (semi-bold)
    |  Changes are saved every 30    |  <- description (muted)
    |  seconds automatically.        |
    +--------------------------------+
                    |
                    v
              +----------+
              |   Save   |
              +----------+
```

**Target Implementation**:
```tsx
<Tooltip
  content={{
    title: "Auto-save",
    description: "Changes are saved every 30 seconds automatically."
  }}
>
  <SaveIcon />
</Tooltip>
```

### 2.3 Positioned Tooltips

Tooltips can appear on any side of the trigger element.

```
SIDE=TOP (default)
                  +-------------+
                  | Tooltip     |
                  +-------------+
                        v
                  +-----------+
                  |  Trigger  |
                  +-----------+

SIDE=BOTTOM
                  +-----------+
                  |  Trigger  |
                  +-----------+
                        ^
                  +-------------+
                  | Tooltip     |
                  +-------------+

SIDE=LEFT                                  SIDE=RIGHT
        +-------------+                    +-----------+  +-------------+
        | Tooltip     | >  +-----------+   |  Trigger  | <| Tooltip     |
        +-------------+    |  Trigger  |   +-----------+  +-------------+
                           +-----------+
```

---

## 3. Anatomy

```
+--------------------------------------------------+
|                                                  |
|  +--------------------------------------------+  |
|  |                                            |  |
|  |           Tooltip Content                  |  |  <- Content area
|  |                                            |  |
|  +--------------------------------------------+  |
|                        ^                         |
|                        |                         |
|                     Arrow                        |  <- Arrow (optional)
|                                                  |
+--------------------------------------------------+
      ^                                       ^
      |                                       |
   Container                              Padding
   (bg + border + shadow)                 (px-3 py-1.5)
```

### Element Breakdown

| Element | Description | Current Token |
|---------|-------------|---------------|
| Container | Outer wrapper with background | `bg-ui-bg-hero` |
| Content | Text content area | `text-xs text-ui-text-inverse` |
| Arrow | Pointer to trigger (optional) | Not implemented |
| Padding | Internal spacing | `px-3 py-1.5` |

---

## 4. Styling Tokens

### 4.1 Current Implementation

| Property | Value | Token/Class |
|----------|-------|-------------|
| Background | `#030712` (gray-950) | `bg-ui-bg-hero` |
| Text | `#FFFFFF` (white) | `text-ui-text-inverse` |
| Text size | `12px` | `text-xs` |
| Border radius | `6px` | `rounded-md` |
| Padding X | `12px` | `px-3` |
| Padding Y | `6px` | `py-1.5` |
| Shadow | Medium depth | `shadow-md` |
| Z-index | 50 | `z-50` |
| Side offset | `4px` | `sideOffset={4}` |

### 4.2 Target Implementation (Mintlify-inspired)

| Property | Current | Target | Notes |
|----------|---------|--------|-------|
| Background | `bg-ui-bg-hero` | `--color-bg-tooltip` | Slightly less black |
| Border | None | `rgba(255,255,255,.07)` | Subtle definition |
| Text | `text-xs` | `text-xs` | Keep as-is |
| Padding | `px-3 py-1.5` | `px-2.5 py-1.5` | Slightly tighter X |
| Max width | None | `200px` | Prevent overly wide tooltips |
| Arrow | None | Optional subtle arrow | Mintlify uses no arrow |

### 4.3 Proposed New Tokens

Add to `src/index.css` `@theme` block:

```css
@theme {
  /* Tooltip-specific tokens */
  --color-tooltip-bg: var(--p-gray-950);
  --color-tooltip-text: var(--p-white);
  --color-tooltip-border: rgba(255, 255, 255, 0.07);
  --max-width-tooltip: 200px;
  --max-width-tooltip-lg: 300px;
}
```

---

## 5. Animations

### 5.1 Entry Animation

The current implementation uses `tailwindcss-animate` with:

```
animate-in fade-in-0 zoom-in-95
```

**Breakdown**:
- `fade-in-0`: Starts at opacity 0, fades to 1
- `zoom-in-95`: Starts at 95% scale, grows to 100%

**ASCII Storyboard**:
```
Frame 0% (trigger)      Frame 50%              Frame 100% (visible)
+-----------------+     +-----------------+     +-----------------+
|                 |     |   +-------+     |     |   +-------+     |
|   [Trigger]     | --> |   |tooltip|     | --> |   |tooltip|     |
|                 |     |   +-------+     |     |   +-------+     |
+-----------------+     |   (fading in,   |     |   (fully        |
                        |    scaling up)  |     |    visible)     |
                        +-----------------+     +-----------------+
      opacity: 0              opacity: 0.5            opacity: 1
      scale: 0.95             scale: 0.975            scale: 1
```

### 5.2 Exit Animation

```
data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
```

**Breakdown**:
- Fade from opacity 1 to 0
- Scale from 100% to 95%

### 5.3 Directional Slide

Tooltips slide in from the opposite direction of their placement:

| Side | Animation Class | Effect |
|------|-----------------|--------|
| Top | `slide-in-from-bottom-2` | Slides up 8px |
| Bottom | `slide-in-from-top-2` | Slides down 8px |
| Left | `slide-in-from-right-2` | Slides left 8px |
| Right | `slide-in-from-left-2` | Slides right 8px |

**ASCII for slide-in-from-bottom (side=top)**:
```
T=0ms (hover)           T=100ms                 T=200ms (complete)
+-----------------+     +-----------------+     +-----------------+
|                 |     |   +-------+     |     |   +-------+     |
|                 |     |   |tooltip| ^   |     |   |tooltip|     |
|                 |     |   +-------+ |   |     |   +-------+     |
|   [Trigger]     |     |   [Trigger] |   |     |   [Trigger]     |
+-----------------+     +-----------------+     +-----------------+
     (waiting)           (sliding up 8px)           (settled)
```

### 5.4 Recommended Timing

| Phase | Duration | Easing |
|-------|----------|--------|
| Delay before show | `0ms` - `700ms` (default 0) | N/A |
| Entry animation | `150ms` | `ease-out` |
| Exit animation | `100ms` | `ease-in` |

---

## 6. Timing Configuration

### 6.1 Delay Duration

The `delayDuration` prop controls how long to wait before showing the tooltip.

| Scenario | Recommended Delay | Rationale |
|----------|-------------------|-----------|
| Icon buttons | `300ms` | User might be passing through |
| Help icons | `0ms` | User explicitly seeking help |
| Truncated text | `500ms` | Only show if user pauses |
| Keyboard shortcuts | `700ms` | Power user hint, not urgent |

### 6.2 Implementation

```tsx
// Quick show for help icons
<Tooltip content="Get help" delayDuration={0}>
  <HelpIcon />
</Tooltip>

// Standard delay for icon buttons
<Tooltip content="Save" delayDuration={300}>
  <SaveButton />
</Tooltip>

// Longer delay for hints
<Tooltip content="Cmd+S" delayDuration={700}>
  <SaveButton />
</Tooltip>
```

### 6.3 Skip Delay on Touch

Radix Tooltip automatically skips delay when user has recently interacted with another tooltip (skipDelayDuration on Provider).

---

## 7. Accessibility

### 7.1 ARIA Requirements

| Attribute | Element | Value |
|-----------|---------|-------|
| `role` | Content | `tooltip` (automatic via Radix) |
| `aria-describedby` | Trigger | References tooltip content |
| `tabindex` | Trigger | Must be focusable |

### 7.2 Keyboard Support

| Key | Action |
|-----|--------|
| `Tab` | Focus trigger element |
| `Escape` | Dismiss tooltip |
| `Enter/Space` | Activate trigger (if button) |

### 7.3 Screen Reader Behavior

- Tooltip content is announced when trigger receives focus
- Content is associated via `aria-describedby`
- Radix handles the ARIA relationship automatically

### 7.4 Implementation Checklist

- [ ] Ensure trigger is focusable (`button`, `a`, or `tabindex="0"`)
- [ ] Use `asChild` to preserve trigger element semantics
- [ ] Keep content concise for screen reader users
- [ ] Avoid putting interactive elements in tooltips (use Popover instead)

---

## 8. Props / API

### 8.1 Tooltip (Convenience Wrapper)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `ReactNode` | Required | Tooltip text or content |
| `children` | `ReactNode` | Required | Trigger element |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"top"` | Preferred side |
| `align` | `"start" \| "center" \| "end"` | `"center"` | Alignment on side |
| `delayDuration` | `number` | `undefined` (uses Provider default) | Delay in ms |
| `className` | `string` | `undefined` | Additional content classes |

### 8.2 Primitive Components (Advanced Usage)

```tsx
import {
  TooltipProvider,  // Wrap app root
  TooltipRoot,      // Individual tooltip instance
  TooltipTrigger,   // Trigger element wrapper
  TooltipContent    // Content container
} from "@/components/ui/tooltip";
```

---

## 9. Code Examples

### 9.1 Current Implementation

```tsx
import { Tooltip } from "@/components/ui/tooltip";

// Basic usage
<Tooltip content="Save document">
  <Button variant="ghost" size="icon">
    <SaveIcon />
  </Button>
</Tooltip>

// With positioning
<Tooltip content="Delete item" side="right">
  <Button variant="destructive" size="icon">
    <TrashIcon />
  </Button>
</Tooltip>

// With delay
<Tooltip content="Press Cmd+S to save" delayDuration={700}>
  <Button>Save</Button>
</Tooltip>
```

### 9.2 Target Implementation (Rich Tooltip)

```tsx
import { Tooltip, type TooltipContent } from "@/components/ui/tooltip";

interface RichTooltipContent {
  title: string;
  description?: string;
}

// Rich tooltip with title and description
<Tooltip
  content={
    <div className="space-y-1">
      <div className="font-medium">Auto-save enabled</div>
      <div className="text-ui-text-secondary text-[11px]">
        Changes are saved automatically every 30 seconds.
      </div>
    </div>
  }
>
  <StatusIndicator />
</Tooltip>

// With keyboard shortcut
<Tooltip
  content={
    <Flex gap="2" align="center">
      <span>Save</span>
      <kbd className="px-1.5 py-0.5 bg-ui-bg-tertiary rounded text-[10px]">
        Cmd+S
      </kbd>
    </Flex>
  }
>
  <SaveButton />
</Tooltip>
```

### 9.3 Using Primitives (Advanced)

```tsx
import {
  TooltipRoot,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";

// For complex trigger elements or custom behavior
<TooltipRoot delayDuration={500}>
  <TooltipTrigger asChild>
    <span className="inline-flex cursor-help">
      <InfoIcon className="h-4 w-4 text-ui-text-tertiary" />
    </span>
  </TooltipTrigger>
  <TooltipContent side="bottom" align="start">
    This field is required for billing purposes.
  </TooltipContent>
</TooltipRoot>
```

---

## 10. Do's and Don'ts

### Do

- Use for brief supplementary information
- Keep content under 80 characters when possible
- Position to avoid covering related content
- Use for icon-only buttons to explain function
- Show keyboard shortcuts in tooltips

### Don't

- Put interactive elements (links, buttons) in tooltips
- Use for critical information (use inline text instead)
- Make tooltips too wide (max 200-300px)
- Rely on tooltip for form validation (use inline errors)
- Show on touch devices (they have no hover state)

---

## 11. Related Components

| Component | When to Use Instead |
|-----------|---------------------|
| **Popover** | Interactive content, forms, menus |
| **Dialog** | Important information requiring action |
| **Toast** | Temporary feedback messages |
| **Inline Help** | Critical instructions, always visible |

---

## 12. Migration Checklist

To align with Mintlify polish:

- [ ] Add `--color-tooltip-bg` and `--color-tooltip-border` tokens
- [ ] Add subtle border to tooltip content
- [ ] Add `max-w-[200px]` default constraint
- [ ] Consider adding arrow option for emphasized tooltips
- [ ] Create rich tooltip variant with title/description support
- [ ] Document recommended delay durations in component JSDoc

---

*This document is part of the Nixelo Design System. See [MASTER_PLAN.md](../MASTER_PLAN.md) for the full design system overview.*
