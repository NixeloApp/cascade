# Dialog Component

> **Source**: `src/components/ui/dialog.tsx`
> **Animation Reference**: `docs/research/library/mintlify/landing_deep.json` (scaleIn/scaleOut)
> **Visual Reference**: `e2e/screenshots/23-filled-calendar-event-modal.png`
> **Last Updated**: 2026-02-05

---

## Overview

The Dialog component provides a modal overlay for focused user interactions. Built on Radix UI primitives, it handles accessibility, focus management, and animations out of the box.

**Key Principles**:
1. **Focus capture** - Traps focus within the dialog
2. **Dismissible** - ESC key and overlay click to close
3. **Accessible** - Proper ARIA roles and keyboard navigation
4. **Animated** - Smooth entry/exit transitions with depth

---

## 1. Visual Reference

### Current Nixelo Implementation

From `e2e/screenshots/23-filled-calendar-event-modal.png`:

```
+----------------------------------------------------------+
|  [Sidebar]  |        February 2026 Calendar               |
|             |                                              |
|   Calendar  |    +----------------------------------+      |
|   Documents |    |  Sprint Planning              [X] |     |
|   Workspaces|    |                                   |     |
|             |    |  Meeting    Confirmed             |     |
|             |    |                                   |     |
|             |    |  Wed, February 4, 2026            |     |
|             |    |  3:00 AM - 4:00 AM                |     |
|             |    |                                   |     |
|             |    |  [E] Organizer                    |     |
|             |    |      Emily Chen                   |     |
|             |    |      e2e-teamlead-s0-...          |     |
|             |    |                                   |     |
|             |    |  Description                      |     |
|             |    |  Review sprint goals and assign   |     |
|             |    |                                   |     |
|             |    |  Attendance (0/3 marked)          |     |
|             |    |  Emily Chen    [Not marked v]     |     |
|             |    |  Alex Rivera   [Not marked v]     |     |
|             |    |  Sarah Kim     [Not marked v]     |     |
|             |    |                                   |     |
|             |    |  [Delete Event]         [Close]   |     |
|             |    +----------------------------------+      |
|             |                                              |
+----------------------------------------------------------+
```

**Observations from screenshot**:
- Centered modal with rounded corners
- Semi-transparent dark overlay behind
- Close button (X) in top-right corner
- Clear header/content/footer sections
- Footer with action buttons aligned right
- Destructive action (Delete) uses red/status color

---

## 2. Variants

### 2.1 Default Dialog

Standard dialog for general content display.

```
+------------------------------------+
|  Dialog Title                   [X] |
+------------------------------------+
|                                     |
|  Dialog content goes here.          |
|  Can contain any React elements.    |
|                                     |
+------------------------------------+
|                    [Cancel] [Save]  |
+------------------------------------+
```

**Use cases**: Settings panels, detail views, forms

---

### 2.2 Confirmation Dialog

For confirming destructive or important actions.

```
+------------------------------------+
|  Confirm Delete                 [X] |
+------------------------------------+
|                                     |
|  Are you sure you want to delete    |
|  "Project Alpha"? This action       |
|  cannot be undone.                  |
|                                     |
+------------------------------------+
|              [Cancel] [Delete]      |
+------------------------------------+
```

**Use cases**: Delete confirmations, logout, discard changes

---

### 2.3 Form Dialog

Contains form inputs for data entry.

```
+------------------------------------+
|  Create New Issue               [X] |
+------------------------------------+
|                                     |
|  Title                              |
|  +--------------------------------+ |
|  | Issue title here...            | |
|  +--------------------------------+ |
|                                     |
|  Description                        |
|  +--------------------------------+ |
|  |                                | |
|  |                                | |
|  +--------------------------------+ |
|                                     |
|  Priority        Status             |
|  [Medium v]      [To Do v]          |
|                                     |
+------------------------------------+
|              [Cancel] [Create]      |
+------------------------------------+
```

**Use cases**: Create/edit entities, quick forms, settings

---

### 2.4 Alert Dialog

For critical alerts that require acknowledgment. Uses AlertDialog primitive for stronger modal behavior (no dismiss on overlay click).

```
+------------------------------------+
|  Session Expired                    |
+------------------------------------+
|                                     |
|  Your session has expired. Please   |
|  sign in again to continue.         |
|                                     |
+------------------------------------+
|                        [Sign In]    |
+------------------------------------+
```

**Use cases**: Session timeout, critical errors, required acknowledgments

---

## 3. Anatomy

```
+------------------------------------------------+
|                   OVERLAY                       |
|    (fixed, full-screen, semi-transparent)       |
|                                                 |
|        +------------------------------+         |
|        |         CONTAINER            |         |
|        |  (centered, elevated, solid) |         |
|        |                              |         |
|        |  +------------------------+  |         |
|        |  |        HEADER          |  |         |
|        |  |  Title + Close Button  |  |         |
|        |  +------------------------+  |         |
|        |                              |         |
|        |  +------------------------+  |         |
|        |  |        CONTENT         |  |         |
|        |  |   (scrollable area)    |  |         |
|        |  |                        |  |         |
|        |  +------------------------+  |         |
|        |                              |         |
|        |  +------------------------+  |         |
|        |  |        FOOTER          |  |         |
|        |  |   (action buttons)     |  |         |
|        |  +------------------------+  |         |
|        |                              |         |
|        +------------------------------+         |
|                                                 |
+------------------------------------------------+
```

### Component Parts

| Part | Element | Purpose |
|------|---------|---------|
| `Dialog` | Root | State management (open/close) |
| `DialogTrigger` | Button | Opens the dialog |
| `DialogPortal` | Portal | Renders outside DOM tree |
| `DialogOverlay` | Backdrop | Dimmed background layer |
| `DialogContent` | Container | Main dialog box |
| `DialogHeader` | Header section | Contains title and description |
| `DialogTitle` | Heading | Accessible dialog title |
| `DialogDescription` | Paragraph | Optional description text |
| `DialogFooter` | Footer section | Action buttons |
| `DialogClose` | Close button | Dismisses dialog |

---

## 4. ASCII Layout Details

### Desktop (sm+)

```
+--[ VIEWPORT (100vw x 100vh) ]------------------+
|                                                 |
|    +--[ OVERLAY (inset-0, z-50) ]----------+   |
|    |                                        |   |
|    |   +--[ CONTENT (max-w-lg, centered) ]--+  |
|    |   |                                    |  |
|    |   |  [X] <-- absolute top-4 right-4    |  |
|    |   |                                    |  |
|    |   |  +--[ HEADER (text-left) ]------+  |  |
|    |   |  | Title (text-lg, semibold)    |  |  |
|    |   |  | Description (text-sm, muted) |  |  |
|    |   |  +------------------------------+  |  |
|    |   |                                    |  |
|    |   |  +--[ CONTENT (gap-4) ]---------+  |  |
|    |   |  | ... children ...             |  |  |
|    |   |  +------------------------------+  |  |
|    |   |                                    |  |
|    |   |  +--[ FOOTER (flex, justify-end)]+  |  |
|    |   |  | [Secondary] [Primary]        |  |  |
|    |   |  +------------------------------+  |  |
|    |   |                                    |  |
|    |   +------------------------------------+  |
|    |                                        |   |
|    +----------------------------------------+   |
|                                                 |
+------------------------------------------------+
```

### Mobile (<sm)

```
+--[ VIEWPORT ]--+
|                |
|  +--[ OVERLAY ]+
|  |             |
|  | +--[ CONTENT (max-w-[calc(100%-2rem)]) ]--+
|  | |                                         |
|  | |  [X]                                    |
|  | |                                         |
|  | |  +--[ HEADER (text-center) ]--------+   |
|  | |  | Title                            |   |
|  | |  | Description                      |   |
|  | |  +----------------------------------+   |
|  | |                                         |
|  | |  +--[ CONTENT ]---------------------+   |
|  | |  | ... children ...                 |   |
|  | |  +----------------------------------+   |
|  | |                                         |
|  | |  +--[ FOOTER (flex-col-reverse) ]---+   |
|  | |  | [Primary]                        |   |
|  | |  | [Secondary]                      |   |
|  | |  +----------------------------------+   |
|  | |                                         |
|  | +-----------------------------------------+
|  |             |
|  +-------------+
|                |
+----------------+
```

---

## 5. Props / API

### Dialog (Root)

```typescript
interface DialogProps {
  open?: boolean;                    // Controlled open state
  defaultOpen?: boolean;             // Uncontrolled initial state
  onOpenChange?: (open: boolean) => void;  // State change callback
  modal?: boolean;                   // Enable modal behavior (default: true)
  children: React.ReactNode;
}
```

### DialogContent

```typescript
interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean;  // Show/hide X button (default: true)
  className?: string;         // Additional CSS classes
  children: React.ReactNode;
}
```

### DialogHeader / DialogFooter

```typescript
interface DialogSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}
```

### DialogTitle / DialogDescription

```typescript
// Inherits from Radix primitives
interface DialogTitleProps extends React.ComponentProps<typeof DialogPrimitive.Title> {
  className?: string;
  children: React.ReactNode;
}
```

---

## 6. Styling Tokens

### Overlay

| Property | Token | Value |
|----------|-------|-------|
| Background | `bg-ui-bg-overlay` | `light-dark(rgba(0,0,0,0.5), rgba(0,0,0,0.75))` |
| Position | `fixed inset-0` | Full viewport coverage |
| Z-Index | `z-50` | Above content, below toast |

### Container

| Property | Token | Value |
|----------|-------|-------|
| Background | `bg-ui-bg` | `light-dark(white, gray-900)` |
| Border | `border border-ui-border` | Subtle edge definition |
| Border Radius | `rounded-lg` | `--radius: 8px` |
| Shadow | `shadow-lg` | `--shadow-elevated` |
| Padding | `p-6` | `24px` |
| Max Width | `sm:max-w-lg` | `512px` on desktop |
| Max Width (mobile) | `max-w-[calc(100%-2rem)]` | Full width minus margins |

### Header

| Property | Token | Value |
|----------|-------|-------|
| Gap | `gap-2` | `8px` between title/description |
| Text Align | `text-center sm:text-left` | Responsive alignment |

### Title

| Property | Token | Value |
|----------|-------|-------|
| Font Size | `text-lg` | `18px` |
| Font Weight | `font-semibold` | `600` |
| Line Height | `leading-none` | `1` |

### Description

| Property | Token | Value |
|----------|-------|-------|
| Font Size | `text-sm` | `14px` |
| Color | `text-ui-text-secondary` | Muted text color |

### Footer

| Property | Token | Value |
|----------|-------|-------|
| Gap | `gap-2` | `8px` between buttons |
| Layout | `flex-col-reverse sm:flex-row` | Stack on mobile, row on desktop |
| Justify | `sm:justify-end` | Right-aligned buttons on desktop |

### Close Button

| Property | Token | Value |
|----------|-------|-------|
| Position | `absolute top-4 right-4` | Top-right corner |
| Color | `text-ui-text-secondary` | Muted icon color |
| Opacity | `opacity-70 hover:opacity-100` | Subtle to clear on hover |
| Focus Ring | `focus:ring-2 focus:ring-brand-ring` | Visible focus state |

---

## 7. Animations

### Entry Animation: scaleIn (with Tilt)

From Mintlify's `landing_deep.json`:

```css
@keyframes scaleIn {
  0% {
    opacity: 0;
    transform: rotateX(-10deg) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: rotateX(0deg) scale(1);
  }
}
```

**Storyboard**:
```
Frame 0% (start)          Frame 50%              Frame 100% (end)
+----------------+        +----------------+      +----------------+
|                |   -->  |                |  --> |                |
|    +------+    |        |   +--------+   |      |  +----------+  |
|    |tilted|    |        |   | dialog |   |      |  |  dialog  |  |
|    +------+    |        |   +--------+   |      |  +----------+  |
|                |        |                |      |                |
+----------------+        +----------------+      +----------------+
   (96% scale,              (scaling up,           (100% scale,
    tilted back,             untilting)              flat)
    invisible)
```

**CSS Token**:
```css
--animation-dialog-enter: scaleIn 0.2s ease-out forwards;
```

### Exit Animation: scaleOut (with Tilt)

```css
@keyframes scaleOut {
  0% {
    opacity: 1;
    transform: rotateX(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: rotateX(-10deg) scale(0.96);
  }
}
```

**Storyboard**:
```
Frame 0% (start)          Frame 50%              Frame 100% (end)
+----------------+        +----------------+      +----------------+
|                |   -->  |                |  --> |                |
|  +----------+  |        |   +--------+   |      |    +------+    |
|  |  dialog  |  |        |   | dialog |   |      |    |tilted|    |
|  +----------+  |        |   +--------+   |      |    +------+    |
|                |        |                |      |                |
+----------------+        +----------------+      +----------------+
  (100% scale,              (scaling down,         (96% scale,
     flat)                    tilting back)          tilted,
                                                     invisible)
```

**CSS Token**:
```css
--animation-dialog-exit: scaleOut 0.15s ease-in forwards;
```

### Overlay Fade

```css
/* Entry */
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* Exit */
@keyframes fadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
```

### Current Implementation (tailwindcss-animate)

The current dialog uses `tailwindcss-animate` classes:

```
data-[state=open]:animate-in
data-[state=open]:fade-in-0
data-[state=open]:zoom-in-95

data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=closed]:zoom-out-95
```

### Target Implementation (Mintlify-style)

To achieve the Mintlify tilt effect, update to:

```css
/* Overlay */
.dialog-overlay {
  animation: fadeIn 0.15s ease-out;
}
.dialog-overlay[data-state="closed"] {
  animation: fadeOut 0.1s ease-in;
}

/* Content */
.dialog-content {
  animation: scaleIn 0.2s ease-out;
  transform-origin: top center;
}
.dialog-content[data-state="closed"] {
  animation: scaleOut 0.15s ease-in;
  transform-origin: top center;
}
```

---

## 8. Accessibility

### Focus Management

- **Focus trap**: Focus is locked within the dialog while open
- **Initial focus**: First focusable element receives focus on open
- **Return focus**: Focus returns to trigger element on close

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next focusable element |
| `Shift + Tab` | Move focus to previous focusable element |
| `Escape` | Close the dialog |
| `Enter` / `Space` | Activate focused button |

### ARIA Attributes

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `role="dialog"` | Content | Identifies as dialog |
| `aria-modal="true"` | Content | Indicates modal behavior |
| `aria-labelledby` | Content | Points to title element |
| `aria-describedby` | Content | Points to description element |

### Screen Reader Announcements

```tsx
// DialogTitle is announced as the dialog label
<DialogTitle id="dialog-title">Create Issue</DialogTitle>

// DialogDescription provides additional context
<DialogDescription id="dialog-desc">
  Fill out the form below to create a new issue.
</DialogDescription>

// Content links to both
<DialogContent
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
```

### Close Button Accessibility

```tsx
<DialogPrimitive.Close>
  <XIcon />
  <span className="sr-only">Close</span>  {/* Screen reader text */}
</DialogPrimitive.Close>
```

---

## 9. Code Examples

### Current Implementation

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function CreateIssueDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Issue</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>
            Add a new issue to this project's backlog.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Form fields */}
          <Input placeholder="Issue title" />
          <Textarea placeholder="Description (optional)" />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Create Issue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Controlled Dialog

```tsx
function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Target Implementation (with Enhanced Animations)

```tsx
// Update DialogContent className for Mintlify-style animation
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          // Base styles
          "bg-ui-bg fixed top-1/2 left-1/2 z-50",
          "w-full max-w-[calc(100%-2rem)] sm:max-w-lg",
          "-translate-x-1/2 -translate-y-1/2",
          "grid gap-4 rounded-lg border border-ui-border p-6 shadow-lg",

          // Animation: Entry (scaleIn with tilt)
          "data-[state=open]:animate-in",
          "data-[state=open]:fade-in-0",
          "data-[state=open]:zoom-in-95",
          // Future: add rotateX for tilt effect

          // Animation: Exit (scaleOut with tilt)
          "data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0",
          "data-[state=closed]:zoom-out-95",

          // Timing
          "duration-200",

          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              "absolute top-4 right-4 rounded-sm",
              "text-ui-text-secondary opacity-70",
              "transition-opacity hover:opacity-100",
              "focus:outline-none focus:ring-2 focus:ring-brand-ring focus:ring-offset-2",
              "disabled:pointer-events-none",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}
```

### Custom Animation (Full Mintlify Tilt)

To implement the full Mintlify tilt effect, add to `src/index.css`:

```css
@theme {
  /* Mintlify-style dialog animations */
  @keyframes dialogScaleIn {
    0% {
      opacity: 0;
      transform: rotateX(-10deg) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: rotateX(0deg) scale(1);
    }
  }

  @keyframes dialogScaleOut {
    0% {
      opacity: 1;
      transform: rotateX(0deg) scale(1);
    }
    100% {
      opacity: 0;
      transform: rotateX(-10deg) scale(0.96);
    }
  }

  --animation-dialog-in: dialogScaleIn 0.2s ease-out forwards;
  --animation-dialog-out: dialogScaleOut 0.15s ease-in forwards;
}

/* Apply to dialog content */
[data-slot="dialog-content"] {
  transform-origin: top center;
}

[data-slot="dialog-content"][data-state="open"] {
  animation: var(--animation-dialog-in);
}

[data-slot="dialog-content"][data-state="closed"] {
  animation: var(--animation-dialog-out);
}
```

---

## 10. Usage Guidelines

### DO

- Use dialogs for focused tasks that require user attention
- Provide clear titles that describe the action
- Include a visible close mechanism (X button or Cancel)
- Use appropriate button variants (primary for main action, outline for cancel)
- Keep content concise; scroll if needed

### DON'T

- Don't nest dialogs (open dialog from dialog)
- Don't use for notifications (use Toast instead)
- Don't use for small confirmations (use AlertDialog)
- Don't block important information behind dialogs
- Don't auto-open dialogs without user action

### When to Use Each Variant

| Scenario | Variant |
|----------|---------|
| Create/Edit form | Form Dialog |
| View details | Default Dialog |
| Delete confirmation | Confirmation Dialog |
| Session timeout | Alert Dialog |
| Settings panel | Default Dialog |
| Quick action confirm | Confirmation Dialog |

---

## 11. Related Components

- **AlertDialog** - For blocking confirmations
- **Sheet** - For slide-out panels
- **Drawer** - For mobile-first side panels
- **Popover** - For non-blocking floating content
- **Tooltip** - For contextual help

---

*This document is part of the Nixelo Design System. See [MASTER_PLAN.md](../MASTER_PLAN.md) for the full design system overview.*
