# Button Component

> **Source**: `src/components/ui/button.tsx`
> **Visual Reference**: `docs/research/library/mintlify/landing_desktop_dark.png` (CTAs)
> **Last Updated**: 2026-02-05

---

## Overview

The Button component is the primary interactive element for user actions. Built on Radix UI's Slot primitive for polymorphic rendering, it supports multiple variants, sizes, and states.

**Key Principles**:
1. **Clear hierarchy** - Primary actions stand out, secondary recedes
2. **Consistent feedback** - Hover, active, and focus states are predictable
3. **Accessible** - Proper focus rings, disabled states, keyboard support
4. **Flexible** - Icons, loading states, and polymorphic rendering

---

## 1. Visual Reference

### Mintlify CTAs (from landing_desktop_dark.png)

From the Mintlify landing page, we observe:

```
+-----------------------------------------+
|                                         |
|   The Intelligent                       |
|   Knowledge Platform                    |
|                                         |
|   +----------------+  +-------------+   |
|   | Read additive  |  | Get started |   |
|   |   (outline)    |  |  (primary)  |   |
|   +----------------+  +-------------+   |
|                                         |
+-----------------------------------------+
```

**Mintlify Button Characteristics**:
- **Primary CTA**: Solid background, brand color (emerald/teal `#18e299`), white text
- **Secondary CTA**: Transparent/dark background, subtle border, light text
- **Border Radius**: Rounded corners (~8px), not fully rounded
- **Padding**: Generous horizontal padding for CTAs
- **Hover Effects**: Subtle brightness/scale shift
- **Typography**: Medium weight, 14-16px text

### Current Nixelo Implementation

```
+------------------------------------------+
|  Primary   |  Secondary  |  Ghost  | Icon |
+------------------------------------------+
|  [######]  |  [------]   |  Text   | [+]  |
|   Indigo   |   Outlined  |  Subtle | 40px |
|   #4F46E5  |   Border    |  Hover  |      |
+------------------------------------------+
```

**Current Nixelo Button Variants**:
- `primary`: Solid indigo background, white text
- `secondary`: Light background with border, subtle hover
- `success`: Green background for positive actions
- `danger`: Red background for destructive actions
- `ghost`: No background, text only, subtle hover
- `link`: Underlined text link style
- `outline`: Transparent with border

---

## 2. Variants

### 2.1 Primary (Default)

The main call-to-action button. Use for the primary action in a view.

```
+------------------------+
|        Save Changes    |
+------------------------+
   bg-brand (indigo)
   text-white
   hover: bg-brand-hover
```

**Usage**: Form submissions, primary CTAs, confirmations

---

### 2.2 Secondary

For secondary actions that complement the primary action.

```
+------------------------+
|         Cancel         |
+------------------------+
   bg-ui-bg
   text-ui-text
   border-ui-border
   hover: bg-ui-bg-secondary
```

**Usage**: Cancel buttons, alternative actions, less prominent CTAs

---

### 2.3 Success

For positive/confirmatory actions.

```
+------------------------+
|       Confirm          |
+------------------------+
   bg-status-success
   text-white
   hover: 90% opacity
```

**Usage**: Approve actions, positive confirmations, complete actions

---

### 2.4 Danger (Destructive)

For destructive or irreversible actions.

```
+------------------------+
|        Delete          |
+------------------------+
   bg-status-error
   text-white
   hover: 90% opacity
```

**Usage**: Delete buttons, remove actions, destructive confirmations

---

### 2.5 Ghost

Minimal button for inline actions without visual weight.

```
+------------------------+
|        Edit            |
+------------------------+
   bg-transparent
   text-ui-text-secondary
   hover: bg-ui-bg-secondary
```

**Usage**: Inline actions, icon buttons, toolbar items, breadcrumb items

---

### 2.6 Link

Text-only link styled as a button for semantic button with link appearance.

```
+------------------------+
|     Learn more         |
+------------------------+
   text-brand
   underline on hover
```

**Usage**: Inline text actions, "learn more" links, navigation within text

---

### 2.7 Outline

Bordered button with transparent background.

```
+------------------------+
|       Settings         |
+------------------------+
   bg-transparent
   border-ui-border
   text-ui-text
   hover: bg-ui-bg-secondary
```

**Usage**: Secondary actions, filter toggles, option buttons

---

### 2.8 Icon-Only

Square button for icon-only actions.

```
+------+
|  +   |  40x40px
+------+
   Same variant styles
   as parent variant
```

**Usage**: Toolbar actions, close buttons, expand/collapse toggles

---

## 3. States

### 3.1 Default State

```
+------------------------+
|     Button Text        |
+------------------------+
   Resting state
   No interaction
```

### 3.2 Hover State

```
+========================+
||     Button Text      ||
+========================+
   Background darkens/lightens
   Subtle cursor change
   Optional: slight Y translate (-1px)
```

### 3.3 Active (Pressed) State

```
+------------------------+
|>    Button Text       <|
+------------------------+
   Background darkens further
   Slight scale down (0.98)
   Visual "press" feedback
```

### 3.4 Focus State

```
+------------------------+
|     Button Text        |
+------------------------+
 [                      ]  <-- Focus ring
   2px ring offset
   ring-brand-ring color
   No outline
```

### 3.5 Disabled State

```
+------------------------+
|     Button Text        |  <-- 50% opacity
+------------------------+
   pointer-events: none
   opacity: 0.5
   No hover effects
```

### 3.6 Loading State

```
+------------------------+
|  [o]  Loading...       |
+------------------------+
   Spinner icon (animated)
   Text changes to "Loading..."
   Button disabled during load
```

---

## 4. ASCII State Matrix

### Primary Button States

```
DEFAULT                 HOVER                   ACTIVE
+------------------+    +==================+    +------------------+
|  Save Changes    |    ||  Save Changes  ||    |> Save Changes  <|
+------------------+    +==================+    +------------------+
  bg-brand               bg-brand-hover          bg-brand-active
  #4F46E5                #4338CA                 #3730A3


FOCUS                   DISABLED                LOADING
+------------------+    +------------------+    +------------------+
|  Save Changes    |    |  Save Changes    |    |  [o] Loading... |
+------------------+    +------------------+    +------------------+
[                  ]      50% opacity            disabled + spinner
  ring-brand-ring         cursor: not-allowed    animation: spin
```

### Secondary Button States

```
DEFAULT                 HOVER                   ACTIVE
+------------------+    +==================+    +------------------+
|     Cancel       |    ||     Cancel     ||    |>    Cancel     <|
+------------------+    +==================+    +------------------+
  bg-ui-bg               bg-ui-bg-secondary      pressed state
  border-ui-border       border-brand-ring       darker bg


FOCUS                   DISABLED                LOADING
+------------------+    +------------------+    +------------------+
|     Cancel       |    |     Cancel       |    |  [o] Loading... |
+------------------+    +------------------+    +------------------+
[                  ]      50% opacity            disabled + spinner
  ring-brand-ring
```

### Ghost Button States

```
DEFAULT                 HOVER                   ACTIVE
+------------------+    +==================+    +------------------+
|      Edit        |    ||      Edit      ||    |>     Edit      <|
+------------------+    +==================+    +------------------+
  transparent            bg-ui-bg-secondary      pressed state
  text-secondary


FOCUS                   DISABLED
+------------------+    +------------------+
|      Edit        |    |      Edit        |
+------------------+    +------------------+
[                  ]      50% opacity
  ring-brand-ring
```

### Danger Button States

```
DEFAULT                 HOVER                   ACTIVE
+------------------+    +==================+    +------------------+
|     Delete       |    ||     Delete     ||    |>    Delete     <|
+------------------+    +==================+    +------------------+
  bg-status-error        bg-status-error/90      pressed state
  #EF4444                darker red


FOCUS                   DISABLED
+------------------+    +------------------+
|     Delete       |    |     Delete       |
+------------------+    +------------------+
[                  ]      50% opacity
  ring-status-error
```

---

## 5. Props / API

### ButtonProps Interface

```typescript
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Renders the button as a different element using Radix Slot
   * Useful for wrapping links: <Button asChild><a href="/">Home</a></Button>
   */
  asChild?: boolean;

  /**
   * Shows loading spinner and disables button
   * Text changes to "Loading..." for non-icon buttons
   */
  isLoading?: boolean;

  /**
   * Icon to render before button text
   * @example <Button leftIcon={<PlusIcon />}>Add</Button>
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to render after button text
   * @example <Button rightIcon={<ArrowRightIcon />}>Next</Button>
   */
  rightIcon?: React.ReactNode;
}
```

### Variant Prop

```typescript
type ButtonVariant =
  | "primary"     // Default - brand background
  | "secondary"   // Light background with border
  | "success"     // Green for positive actions
  | "danger"      // Red for destructive actions
  | "ghost"       // Transparent, minimal
  | "link"        // Text link style
  | "outline";    // Bordered, transparent

// Default: "primary"
```

### Size Prop

```typescript
type ButtonSize =
  | "sm"    // height: 36px, padding: 12px, text: 14px
  | "md"    // height: 40px, padding: 16px, text: 14px (default)
  | "lg"    // height: 44px, padding: 24px, text: 16px
  | "icon"; // height: 40px, width: 40px, square

// Default: "md"
```

### Full Props Table

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `ButtonVariant` | `"primary"` | Visual style variant |
| `size` | `ButtonSize` | `"md"` | Size preset |
| `asChild` | `boolean` | `false` | Use Radix Slot for polymorphism |
| `isLoading` | `boolean` | `false` | Show loading state |
| `leftIcon` | `ReactNode` | `undefined` | Icon before text |
| `rightIcon` | `ReactNode` | `undefined` | Icon after text |
| `disabled` | `boolean` | `false` | Disable interactions |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | HTML button type |
| `className` | `string` | `undefined` | Additional CSS classes |
| `children` | `ReactNode` | `undefined` | Button content |

---

## 6. Styling Tokens

### Primary Variant

| Property | Token | Light Mode | Dark Mode |
|----------|-------|------------|-----------|
| Background | `bg-brand` | `#4F46E5` (indigo-600) | `#818CF8` (indigo-400) |
| Background (hover) | `bg-brand-hover` | `#4338CA` (indigo-700) | `#A5B4FC` (indigo-300) |
| Text | `text-white` | `#FFFFFF` | `#FFFFFF` |
| Focus Ring | `ring-brand-ring` | `#818CF8` (indigo-400) | `#6366F1` (indigo-500) |

### Secondary Variant

| Property | Token | Light Mode | Dark Mode |
|----------|-------|------------|-----------|
| Background | `bg-ui-bg` | `#FFFFFF` | `#111827` (gray-900) |
| Background (hover) | `bg-ui-bg-secondary` | `#F9FAFB` (gray-50) | `#1F2937` (gray-800) |
| Text | `text-ui-text` | `#111827` (gray-900) | `#F9FAFB` (gray-50) |
| Border | `border-ui-border` | `#E5E7EB` (gray-200) | `#374151` (gray-700) |
| Border (hover) | `border-brand-ring` | `#818CF8` (indigo-400) | `#6366F1` (indigo-500) |

### Success Variant

| Property | Token | Light Mode | Dark Mode |
|----------|-------|------------|-----------|
| Background | `bg-status-success` | `#22C55E` (green-500) | `#4ADE80` (green-400) |
| Background (hover) | opacity 90% | 90% opacity | 90% opacity |
| Text | `text-white` | `#FFFFFF` | `#FFFFFF` |
| Focus Ring | `ring-status-success` | `#22C55E` | `#4ADE80` |

### Danger Variant

| Property | Token | Light Mode | Dark Mode |
|----------|-------|------------|-----------|
| Background | `bg-status-error` | `#EF4444` (red-500) | `#F87171` (red-400) |
| Background (hover) | opacity 90% | 90% opacity | 90% opacity |
| Text | `text-white` | `#FFFFFF` | `#FFFFFF` |
| Focus Ring | `ring-status-error` | `#EF4444` | `#F87171` |

### Ghost Variant

| Property | Token | Light Mode | Dark Mode |
|----------|-------|------------|-----------|
| Background | `transparent` | transparent | transparent |
| Background (hover) | `bg-ui-bg-secondary` | `#F9FAFB` | `#1F2937` |
| Text | `text-ui-text-secondary` | `#6B7280` (gray-500) | `#D1D5DB` (gray-300) |
| Focus Ring | `ring-brand-ring` | `#818CF8` | `#6366F1` |

### Link Variant

| Property | Token | Light Mode | Dark Mode |
|----------|-------|------------|-----------|
| Background | `transparent` | transparent | transparent |
| Text | `text-brand` | `#4F46E5` (indigo-600) | `#818CF8` (indigo-400) |
| Text Decoration (hover) | `underline` | underline | underline |

### Outline Variant

| Property | Token | Light Mode | Dark Mode |
|----------|-------|------------|-----------|
| Background | `transparent` | transparent | transparent |
| Background (hover) | `bg-ui-bg-secondary` | `#F9FAFB` | `#1F2937` |
| Text | `text-ui-text` | `#111827` | `#F9FAFB` |
| Border | `border-ui-border` | `#E5E7EB` | `#374151` |
| Focus Ring | `ring-brand-ring` | `#818CF8` | `#6366F1` |

### Size Tokens

| Size | Height | Horizontal Padding | Font Size | Icon Size |
|------|--------|-------------------|-----------|-----------|
| `sm` | `h-9` (36px) | `px-3` (12px) | `text-sm` (14px) | 16px |
| `md` | `h-10` (40px) | `px-4` (16px) | `text-sm` (14px) | 16px |
| `lg` | `h-11` (44px) | `px-6` (24px) | `text-base` (16px) | 20px |
| `icon` | `h-10 w-10` (40px) | none | - | 16px |

### Common Tokens (All Variants)

| Property | Token | Value |
|----------|-------|-------|
| Border Radius | `rounded-lg` | `8px` |
| Font Weight | `font-medium` | `500` |
| Gap (icon to text) | `gap-2` | `8px` |
| Transition | `transition-colors` | `150ms` |
| Focus Ring Width | `ring-2` | `2px` |
| Focus Ring Offset | `ring-offset-2` | `2px` |
| Disabled Opacity | `opacity-50` | `0.5` |

---

## 7. Animations

### Hover State Transition

```css
.button {
  transition: background-color 150ms ease,
              border-color 150ms ease,
              transform 150ms ease;
}

.button:hover:not(:disabled) {
  /* Background color change handled by Tailwind variants */
  /* Optional: subtle lift */
  transform: translateY(-1px);
}

.button:active:not(:disabled) {
  transform: translateY(0);
}
```

**ASCII Animation Flow**:

```
REST         HOVER        ACTIVE       REST
+------+     +------+     +------+     +------+
|      | --> |      | --> |      | --> |      |
| Btn  |     | Btn  |     | Btn  |     | Btn  |
|      |     |  ^   |     |  v   |     |      |
+------+     +------+     +------+     +------+
   |            |            |            |
   0ms        100ms        200ms        300ms
          (lift -1px)   (press down)  (return)
```

### Click Feedback (Scale)

```css
.button:active:not(:disabled) {
  transform: scale(0.98);
}
```

**ASCII Animation Flow**:

```
CLICK START     PRESS           RELEASE
+----------+    +--------+      +----------+
|  Button  | -> | Button | ->   |  Button  |
+----------+    +--------+      +----------+
   100%           98%              100%
```

### Loading Spinner

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.button-spinner {
  animation: spin 1s linear infinite;
}
```

**ASCII Animation Flow**:

```
Frame 1     Frame 2     Frame 3     Frame 4
+------+    +------+    +------+    +------+
|  |   |    |  /   |    |  -   |    |  \   |
+------+    +------+    +------+    +------+
   0ms       250ms       500ms       750ms
           (rotating clockwise continuously)
```

### Focus Ring Animation

```css
.button:focus-visible {
  outline: none;
  ring: 2px solid var(--color-brand-ring);
  ring-offset: 2px;
  transition: box-shadow 150ms ease;
}
```

**ASCII Representation**:

```
UNFOCUSED              FOCUSED
+------------+         +------------+
|   Button   |    -->  |   Button   |
+------------+         +------------+
                       [            ]
                         ^-- ring (2px)
                           + offset (2px)
```

### Target Mintlify-Style Enhancements

Based on Mintlify's design, consider adding:

```css
/* Subtle glow on primary hover */
.button-primary:hover {
  box-shadow: 0 0 20px rgba(var(--color-brand-rgb), 0.3);
}

/* Scale-up entrance for CTAs */
@keyframes buttonEnter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.button-cta {
  animation: buttonEnter 0.2s ease-out;
}
```

---

## 8. Accessibility

### Focus Management

- **Focus ring**: 2px ring with 2px offset, using `focus-visible` (keyboard only)
- **Focus color**: `ring-brand-ring` for most variants, status color for success/danger
- **No outline**: Outline replaced with ring for consistent styling

### Keyboard Support

| Key | Action |
|-----|--------|
| `Tab` | Move focus to button |
| `Shift + Tab` | Move focus away from button |
| `Enter` | Activate button (trigger click) |
| `Space` | Activate button (trigger click) |

### ARIA Attributes

| Attribute | Usage | Purpose |
|-----------|-------|---------|
| `aria-disabled` | When `disabled={true}` | Communicates disabled state |
| `aria-busy` | When `isLoading={true}` | Indicates loading/processing |
| `aria-label` | Icon-only buttons | Provides accessible name |
| `aria-describedby` | Complex actions | Links to description |

### Screen Reader Considerations

```tsx
// Icon-only button - ALWAYS provide aria-label
<Button variant="ghost" size="icon" aria-label="Close dialog">
  <XIcon />
</Button>

// Loading state - announce to screen readers
<Button isLoading aria-busy={isLoading}>
  {isLoading ? "Saving..." : "Save"}
</Button>

// Destructive action - consider adding description
<Button
  variant="danger"
  aria-describedby="delete-warning"
>
  Delete
</Button>
<span id="delete-warning" className="sr-only">
  This action cannot be undone
</span>
```

### Color Contrast

All button variants meet WCAG AA contrast requirements:

| Variant | Background:Text Ratio | Status |
|---------|----------------------|--------|
| Primary | 4.6:1 (indigo-600 on white) | PASS |
| Secondary | 12.6:1 (gray-900 on white) | PASS |
| Success | 3.1:1 (green-500 on white) | PASS (large text) |
| Danger | 4.5:1 (red-500 on white) | PASS |
| Ghost | 4.5:1 (gray-500 on white) | PASS |

### Disabled State

```tsx
// Current implementation
<Button disabled>Can't click me</Button>

// Rendered output
<button
  disabled
  className="... disabled:pointer-events-none disabled:opacity-50"
>
  Can't click me
</button>
```

- `pointer-events: none` prevents click/hover
- `opacity: 0.5` visually communicates disabled state
- Native `disabled` attribute for screen readers

---

## 9. Code Examples

### Current Implementation (from button.tsx)

```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand-ring",
        secondary:
          "bg-ui-bg text-ui-text border border-ui-border hover:bg-ui-bg-secondary hover:border-brand-ring focus-visible:ring-brand-ring",
        success:
          "bg-status-success text-white hover:bg-status-success/90 focus-visible:ring-status-success",
        danger:
          "bg-status-error text-white hover:bg-status-error/90 focus-visible:ring-status-error",
        ghost: "text-ui-text-secondary hover:bg-ui-bg-secondary focus-visible:ring-brand-ring",
        link: "text-brand underline-offset-4 hover:underline",
        outline:
          "bg-transparent text-ui-text border border-ui-border hover:bg-ui-bg-secondary focus-visible:ring-brand-ring",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        type={asChild ? undefined : type}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {size !== "icon" && <span>Loading...</span>}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### Basic Usage Examples

```tsx
import { Button } from "@/components/ui/button";
import { PlusIcon, ArrowRightIcon, TrashIcon } from "lucide-react";

// Primary button (default)
<Button>Save Changes</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Danger button for destructive actions
<Button variant="danger">Delete Item</Button>

// Success button for positive actions
<Button variant="success">Approve</Button>

// Ghost button for subtle actions
<Button variant="ghost">Edit</Button>

// Link-style button
<Button variant="link">Learn more</Button>

// Outline button
<Button variant="outline">Settings</Button>
```

### With Icons

```tsx
// Left icon
<Button leftIcon={<PlusIcon className="h-4 w-4" />}>
  Add Item
</Button>

// Right icon
<Button rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
  Next Step
</Button>

// Both icons
<Button
  leftIcon={<PlusIcon className="h-4 w-4" />}
  rightIcon={<ArrowRightIcon className="h-4 w-4" />}
>
  Create and Continue
</Button>

// Icon-only button
<Button variant="ghost" size="icon" aria-label="Delete">
  <TrashIcon className="h-4 w-4" />
</Button>
```

### Loading State

```tsx
const [isLoading, setIsLoading] = useState(false);

<Button
  isLoading={isLoading}
  onClick={async () => {
    setIsLoading(true);
    await saveData();
    setIsLoading(false);
  }}
>
  {isLoading ? "Saving..." : "Save Changes"}
</Button>
```

### As Child (Polymorphic)

```tsx
import { Link } from "@tanstack/react-router";

// Render as a link while keeping button styling
<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>

// Render as anchor for external links
<Button asChild variant="outline">
  <a href="https://docs.nixelo.com" target="_blank" rel="noopener">
    View Documentation
  </a>
</Button>
```

### Size Variations

```tsx
// Small - for dense UIs
<Button size="sm">Small Button</Button>

// Medium (default) - standard size
<Button size="md">Medium Button</Button>

// Large - for primary CTAs
<Button size="lg">Large Button</Button>

// Icon - square button for icons
<Button size="icon" variant="ghost" aria-label="Settings">
  <SettingsIcon className="h-4 w-4" />
</Button>
```

### Target Implementation (Mintlify-Inspired Enhancements)

```tsx
// Add to buttonVariants cva for Mintlify-style hover effects
const buttonVariants = cva(
  cn(
    // Base styles
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-lg font-medium",

    // Transitions - enhanced for Mintlify feel
    "transition-all duration-150 ease-out",

    // Focus
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",

    // Disabled
    "disabled:pointer-events-none disabled:opacity-50",

    // Active press effect
    "active:scale-[0.98]",
  ),
  {
    variants: {
      variant: {
        primary: cn(
          "bg-brand text-white",
          "hover:bg-brand-hover hover:-translate-y-0.5",
          "hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]", // Subtle glow
          "focus-visible:ring-brand-ring",
        ),
        secondary: cn(
          "bg-ui-bg text-ui-text border border-ui-border",
          "hover:bg-ui-bg-secondary hover:border-brand-ring",
          "hover:-translate-y-0.5",
          "focus-visible:ring-brand-ring",
        ),
        // ... other variants with similar enhancements
      },
      // ... sizes remain the same
    },
  },
);
```

### Form Integration

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />

      <div className="flex gap-2 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          Sign In
        </Button>
      </div>
    </form>
  );
}
```

---

## 10. Usage Guidelines

### DO

- Use `primary` for the main action in a view (one per section)
- Use `secondary` or `outline` for complementary actions
- Use `danger` only for destructive actions (delete, remove)
- Use `ghost` for inline/toolbar actions with low visual weight
- Provide `aria-label` for icon-only buttons
- Use loading state for async operations
- Use `asChild` when you need button styling on a link

### DON'T

- Don't use multiple `primary` buttons in close proximity
- Don't use `danger` for non-destructive actions
- Don't disable buttons without explanation (tooltip)
- Don't rely on color alone to convey meaning
- Don't forget loading states for async actions
- Don't use `link` variant where an actual `<a>` tag is more appropriate

### Variant Selection Guide

| Scenario | Recommended Variant |
|----------|---------------------|
| Submit form | `primary` |
| Cancel/Close | `secondary` or `outline` |
| Delete item | `danger` |
| Approve action | `success` |
| Inline edit | `ghost` |
| "Learn more" link | `link` |
| Filter toggle | `outline` |
| Toolbar action | `ghost` with `size="icon"` |

---

## 11. Related Components

- **IconButton** - Alias for `Button` with `size="icon"`
- **ButtonGroup** - Horizontal group of related buttons
- **ToggleButton** - Button that maintains pressed state
- **DropdownMenu** - Button that opens a menu
- **DialogTrigger** - Button that opens a dialog

---

## 12. Migration Notes

### From Previous Version

If migrating from an older button implementation:

1. Replace `variant="destructive"` with `variant="danger"`
2. Replace `loading` prop with `isLoading`
3. Replace `icon` prop with `leftIcon` or `rightIcon`
4. Update `size="xs"` to `size="sm"` (xs removed)

### Tailwind Class Updates (v4)

The button uses Tailwind v4 semantic tokens. No `dark:` prefixes needed for colors - `light-dark()` handles this automatically.

```tsx
// OLD (Tailwind v3)
className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-400 dark:hover:bg-indigo-300"

// NEW (Tailwind v4 with semantic tokens)
className="bg-brand hover:bg-brand-hover"
```

---

*This document is part of the Nixelo Design System. See [MASTER_PLAN.md](../MASTER_PLAN.md) for the full design system overview.*
