# Input Component

> **Status**: Implemented
> **Location**: `src/components/ui/input.tsx`
> **Visual Reference**: Mintlify auth - `docs/research/library/mintlify/app-dashboard_desktop_dark.png`
> **Current Nixelo**: `e2e/screenshots/02-empty-signin.png`

---

## Overview

The Input component provides text entry fields with consistent styling, validation states, and accessibility features. Built with `class-variance-authority` (CVA) for variant management, it supports multiple sizes, variants, and error states with automatic error message display.

**Design Inspiration (Mintlify)**:
- Minimal, subtle borders that don't distract
- Dark backgrounds in dark mode (nearly blending with page)
- Left-aligned icons inside input fields
- Generous padding for comfortable touch targets
- Clear placeholder text with muted color
- Smooth focus transitions

---

## Visual Reference

### Mintlify Auth Input (Dark Mode)

From `docs/research/library/mintlify/app-dashboard_desktop_dark.png` and `signup_desktop_dark.png`:

```
+--[ Email Input with Icon ]---------------------------+
|  [mail icon]  name@email.com                         |
+------------------------------------------------------+
```

**Observations**:
1. Very subtle border (barely visible in dark mode)
2. Icon positioned inside left padding
3. Placeholder text is muted/tertiary color
4. Background matches or slightly differs from page background
5. Rounded corners (approximately 8px)
6. No visible focus ring on default - only subtle border change

### Mintlify Onboarding Form (Light Mode)

From `docs/research/library/mintlify/onboarding/error-state.png`:

```
First name                    Last name
+--[ Input ]-------------+   +--[ Input ]-------------+
|  [user icon]  Agent    |   |  [user icon]  Smith    |
+------------------------+   +------------------------+

Company name
+--[ Input ]------------------------------------------+
|  [building icon]  ACME                              |
+-----------------------------------------------------+

Password (optional)
+--[ Input ]------------------------------------------+
|  [lock icon]  Enter your password         [eye icon]|
+-----------------------------------------------------+
```

**Observations**:
1. Labels positioned above inputs
2. Leading icons for context
3. Trailing icons for actions (password toggle)
4. Optional indicator in label text
5. Filled state shows actual text (not placeholder)

### Current Nixelo Sign-in

From `e2e/screenshots/02-empty-signin.png`:

```
+--[ Card Container ]----------------------------------+
|                                                      |
|                    [Nixelo Logo]                     |
|                                                      |
|                   Welcome back                       |
|            Sign in to your account to continue       |
|                                                      |
|     +--[ Google Sign-in Button ]----------------+    |
|     |  [G]  Sign in with Google                 |    |
|     +-------------------------------------------+    |
|                                                      |
|                        or                            |
|                                                      |
|     +--[ Email Button ]--------------------------+   |
|     |  [mail]  Continue with email               |   |
|     +--------------------------------------------+   |
|                                                      |
+------------------------------------------------------+
```

---

## Variants

### 1. Default Text Input

Standard text input for general data entry.

```
+--[ Default Input ]-----------------------------------+
|  Enter text here...                                  |
+------------------------------------------------------+
```

**Styling**:
- Background: `bg-ui-bg`
- Border: `border-ui-border-base`
- Text: `text-ui-text`

### 2. Search Input

Input with left-aligned search icon and secondary background.

```
+--[ Search Input ]------------------------------------+
|  [magnifier]  Search...                              |
+------------------------------------------------------+
```

**Styling**:
- Background: `bg-ui-bg-secondary`
- Border: `border-ui-border-base`
- Left padding: `pl-9` (space for icon)

### 3. Ghost Input

Transparent background input for inline editing.

```
+--[ Ghost Input ]-------------------------------------+
|  Editable text here                                  |  (no visible border)
+------------------------------------------------------+
```

**Styling**:
- Background: `transparent`
- Border: `transparent`
- Hover: `bg-ui-bg-secondary`

### 4. Error Input

Input displaying validation error state.

```
+--[ Error Input ]-------------------------------------+
|  Invalid value                                       |  (red border)
+------------------------------------------------------+
  This field is required                                   (error message)
```

**Styling**:
- Border: `border-status-error`
- Focus ring: `ring-status-error`
- Error text: `text-status-error`

### 5. Password Input

Input with obscured text and optional visibility toggle.

```
+--[ Password Input ]----------------------------------+
|  [lock icon]  ••••••••••••••••          [eye icon]  |
+------------------------------------------------------+
```

**Behavior**:
- Type: `password` (toggleable to `text`)
- Optional: trailing icon button to reveal/hide

### 6. Textarea (Related Component)

Multi-line text input for longer content.

```
+--[ Textarea ]----------------------------------------+
|  Enter your message here...                          |
|                                                      |
|                                                      |
+------------------------------------------------------+
```

**Note**: Textarea is a separate component but follows the same styling tokens.

---

## States

### Default State

Input at rest, waiting for interaction.

```
+------------------------------------------------------+
|  Placeholder text...                                 |
+------------------------------------------------------+
   ^
   Subtle border (ui-border-base)
   Placeholder in tertiary text color
```

### Focus State

Input receiving keyboard focus.

```
+======================================================+
|  |                                                   |
+======================================================+
   ^
   Ring: 2px brand-ring color
   Ring offset: 2px
   Border may change color
```

### Filled State

Input with user-entered content.

```
+------------------------------------------------------+
|  User entered text                                   |
+------------------------------------------------------+
   ^
   Text in primary color (ui-text)
   Same border as default
```

### Error State

Input with validation error.

```
+------------------------------------------------------+  (red border)
|  Invalid input                                       |
+------------------------------------------------------+
  Error message displayed here                            (red text)
   ^
   Border: status-error color
   Error message below with spacing
```

### Disabled State

Input that cannot be interacted with.

```
+------------------------------------------------------+  (50% opacity)
|  Disabled text                                       |
+------------------------------------------------------+
   ^
   cursor-not-allowed
   opacity: 50%
```

---

## ASCII State Diagram

```
                        +------------------+
                        |     DEFAULT      |
                        |  (placeholder)   |
                        +--------+---------+
                                 |
             +-------------------+-------------------+
             |                   |                   |
             v                   v                   v
    +--------+--------+  +-------+-------+   +------+------+
    |      FOCUS      |  |    FILLED     |   |   ERROR     |
    | (ring, typing)  |  | (user input)  |   | (red border)|
    +--------+--------+  +-------+-------+   +------+------+
             |                   |                   |
             |                   v                   |
             |           +-------+-------+           |
             +---------->|    BLUR       |<----------+
                         | (lose focus)  |
                         +---------------+
                                 |
                                 v
                        +--------+--------+
                        |    DISABLED     |
                        |   (read-only)   |
                        +----------------+
```

---

## Sizes

| Size | Height | Horizontal Padding | Font Size | Use Case |
|------|--------|-------------------|-----------|----------|
| `sm` | 36px (h-9) | 12px (px-3) | 14px (text-sm) | Compact forms, inline inputs |
| `md` | 40px (h-10) | 16px (px-4) | 14px (text-sm) | **Default** - Standard forms |
| `lg` | 44px (h-11) | 16px (px-4) | 16px (text-base) | Prominent forms, auth pages |

### ASCII Size Comparison

```
sm:   +--[ Input sm ]-----------------------------+   h=36px
      |  Placeholder text                         |
      +-------------------------------------------+

md:   +--[ Input md ]-----------------------------+   h=40px
      |  Placeholder text                         |
      +-------------------------------------------+

lg:   +--[ Input lg ]-----------------------------+   h=44px
      |  Placeholder text                         |
      +-------------------------------------------+
```

---

## Props / API

### InputProps Interface

```typescript
interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Error message to display below input */
  error?: string;

  /** Size variant for the input */
  inputSize?: "sm" | "md" | "lg";

  /** Visual variant */
  variant?: "default" | "search" | "ghost" | "error";

  /** All standard input attributes */
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  // ... inherited from HTMLInputElement
}
```

### Prop Details

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "search" \| "ghost" \| "error"` | `"default"` | Visual style variant |
| `inputSize` | `"sm" \| "md" \| "lg"` | `"md"` | Size variant (height/padding) |
| `error` | `string` | `undefined` | Error message; triggers error state |
| `type` | `string` | `"text"` | HTML input type |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable input interaction |
| `className` | `string` | `undefined` | Additional CSS classes |

---

## Styling Tokens

### Background

| Variant | Token | Light Mode | Dark Mode |
|---------|-------|------------|-----------|
| default | `--color-ui-bg` | `#FFFFFF` | `#111827` (gray-900) |
| search | `--color-ui-bg-secondary` | `#F9FAFB` (gray-50) | `#1F2937` (gray-800) |
| ghost | `transparent` | `transparent` | `transparent` |

### Border

| State | Token | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| default | `--color-ui-border-base` | `#E5E7EB` (gray-200) | `#374151` (gray-700) |
| focus | `--color-ui-border-focus` | `#4F46E5` (indigo-600) | `#818CF8` (indigo-400) |
| error | `--color-ui-border-error` | `#EF4444` (red-500) | `#F87171` (red-400) |

### Focus Ring

| Property | Value | Token |
|----------|-------|-------|
| Ring width | 2px | `ring-2` |
| Ring color | Brand ring | `--color-brand-ring` |
| Ring offset | 2px | `ring-offset-2` |

### Text Colors

| Element | Token | Light Mode | Dark Mode |
|---------|-------|------------|-----------|
| Input text | `--color-ui-text` | `#111827` (gray-900) | `#F9FAFB` (gray-50) |
| Placeholder | `--color-ui-text-tertiary` | `#9CA3AF` (gray-400) | `#9CA3AF` (gray-400) |
| Error message | `--color-status-error` | `#EF4444` (red-500) | `#F87171` (red-400) |

### Shape

| Property | Value | Token |
|----------|-------|-------|
| Border radius | 8px | `rounded-lg` / `--radius` |
| Border width | 1px | `border` |

---

## Animations

### Focus Transition

Smooth transition when input gains/loses focus.

```css
transition: colors 150ms ease
```

**Properties transitioned**:
- `border-color`
- `background-color`
- `box-shadow` (ring)

### Error Shake (Enhancement)

Optional shake animation for error state feedback.

```css
@keyframes inputShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.input-error-shake {
  animation: inputShake 0.4s ease-in-out;
}
```

**Storyboard**:

```
Frame 0%      Frame 25%     Frame 50%     Frame 75%     Frame 100%
+--------+    +--------+    +--------+    +--------+    +--------+
|[input] |    | [input]|    |[input] |    | [input]|    |[input] |
+--------+    +--------+    +--------+    +--------+    +--------+
   center        left         right         left         center
```

### Focus Ring Animation (Enhancement)

Smooth ring appearance on focus.

```css
@keyframes ringPulse {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  70% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}
```

---

## Accessibility

### Labels

Every input should have an associated label for screen readers.

```tsx
// Explicit label
<label htmlFor="email">Email address</label>
<Input id="email" type="email" />

// Using aria-label
<Input aria-label="Search documents" variant="search" />

// Using aria-labelledby
<span id="email-label">Email</span>
<Input aria-labelledby="email-label" />
```

### Error Messages

Error messages should be associated with inputs using `aria-describedby`.

```tsx
<Input
  id="email"
  error="Please enter a valid email"
  aria-describedby="email-error"
/>
// Error message is rendered with id="email-error" automatically
```

### ARIA Attributes

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `aria-invalid` | `true` (when error) | Indicates validation error |
| `aria-describedby` | Error element ID | Links to error message |
| `aria-required` | `true` (when required) | Indicates required field |
| `aria-disabled` | `true` (when disabled) | Indicates disabled state |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to/from input |
| `Enter` | Submit form (in form context) |
| `Escape` | Clear input (optional enhancement) |

### Focus Indicators

All inputs have visible focus indicators per WCAG 2.1 guidelines:
- Focus ring: 2px brand color with 2px offset
- Sufficient color contrast (> 3:1 against background)

---

## Code Examples

### Current Implementation

```tsx
import { Input } from "@/components/ui/input";

// Basic text input
<Input placeholder="Enter your name" />

// Email input with type
<Input type="email" placeholder="name@example.com" />

// Password input
<Input type="password" placeholder="Enter password" />

// With error state
<Input
  variant="error"
  error="Email is required"
  placeholder="Enter email"
/>

// Different sizes
<Input inputSize="sm" placeholder="Small input" />
<Input inputSize="md" placeholder="Medium input (default)" />
<Input inputSize="lg" placeholder="Large input" />

// Search variant
<Input variant="search" placeholder="Search..." />

// Ghost variant (inline editing)
<Input variant="ghost" defaultValue="Editable text" />

// Disabled
<Input disabled placeholder="Cannot edit" />
```

### With Form Label

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flex } from "@/components/ui/flex";

<Flex direction="column" gap="2">
  <Label htmlFor="email">Email address</Label>
  <Input
    id="email"
    type="email"
    placeholder="name@example.com"
  />
</Flex>
```

### With Error Handling

```tsx
import { Input } from "@/components/ui/input";
import { useState } from "react";

function EmailInput() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  const handleBlur = () => {
    if (!email) {
      setError("Email is required");
    } else if (!email.includes("@")) {
      setError("Please enter a valid email");
    } else {
      setError(undefined);
    }
  };

  return (
    <Input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      onBlur={handleBlur}
      error={error}
      placeholder="name@example.com"
    />
  );
}
```

### Search Input with Icon

```tsx
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { Flex } from "@/components/ui/flex";

<Flex className="relative">
  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ui-text-tertiary" />
  <Input
    variant="search"
    placeholder="Search documents..."
  />
</Flex>
```

### Target Implementation (Mintlify-style)

For a more Mintlify-like input with icon support:

```tsx
// Future enhancement: built-in icon support
interface InputProps {
  // ... existing props
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

<Input
  leadingIcon={<MailIcon />}
  placeholder="name@email.com"
  inputSize="lg"
/>

<Input
  type="password"
  leadingIcon={<LockIcon />}
  trailingIcon={<EyeIcon onClick={toggleVisibility} />}
  placeholder="Enter password"
/>
```

---

## Usage Guidelines

### Do

- Always provide a visible label or `aria-label`
- Use appropriate input types (`email`, `password`, `tel`, etc.)
- Display error messages below the input, not in tooltips
- Use `inputSize="lg"` for important forms (auth, onboarding)
- Use consistent sizes within the same form
- Provide helpful placeholder text as examples, not labels

### Don't

- Don't use placeholder text as the only label
- Don't hide errors behind icons or tooltips
- Don't mix input sizes in the same form section
- Don't use ghost variant for standalone inputs (hard to identify)
- Don't auto-focus inputs without user action
- Don't use red for non-error states

### When to Use Each Variant

| Scenario | Variant |
|----------|---------|
| Standard form field | `default` |
| Search/filter input | `search` |
| Inline/table editing | `ghost` |
| Validation failed | `error` |

---

## Related Components

- **Label**: Accessible label for form inputs
- **Textarea**: Multi-line text input
- **Select**: Dropdown selection
- **Checkbox**: Boolean input
- **Form**: Form wrapper with validation context

---

## Related Files

### Implementation
- Component: `src/components/ui/input.tsx`
- Design tokens: `src/index.css` (`@theme` block)
- Utils: `src/lib/utils.ts` (`cn()`)

### Visual References
- Mintlify auth: `docs/research/library/mintlify/app-dashboard_desktop_dark.png`
- Mintlify signup: `docs/research/library/mintlify/signup_desktop_dark.png`
- Mintlify onboarding: `docs/research/library/mintlify/onboarding/error-state.png`
- Current Nixelo: `e2e/screenshots/02-empty-signin.png`

---

## Future Enhancements

### Built-in Icon Support

Add `leadingIcon` and `trailingIcon` props for common patterns:

```tsx
<Input
  leadingIcon={<MailIcon className="size-4" />}
  placeholder="name@email.com"
/>
```

### Input Group

Combine inputs with buttons or addons:

```tsx
<InputGroup>
  <InputAddon>https://</InputAddon>
  <Input placeholder="example.com" />
  <InputAddon>.com</InputAddon>
</InputGroup>
```

### Character Counter

Show remaining characters for length-limited inputs:

```tsx
<Input
  maxLength={100}
  showCharacterCount
  placeholder="Enter bio (max 100 characters)"
/>
```

### Auto-resize (Textarea)

Textarea that grows with content:

```tsx
<Textarea autoResize minRows={2} maxRows={8} />
```

---

*Last Updated: 2026-02-05*
*Status: Documented - Implementation Complete*
