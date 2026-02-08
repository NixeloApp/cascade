# Loading Components

> **Design System Documentation** | Last Updated: 2026-02-05

Loading components provide visual feedback during asynchronous operations, data fetching, and processing states. They maintain user engagement and communicate system status.

---

## Table of Contents

1. [Visual Reference](#visual-reference)
2. [Variants](#variants)
3. [Anatomy](#anatomy)
4. [Props/API](#propsapi)
5. [Styling Tokens](#styling-tokens)
6. [Animations](#animations)
7. [Accessibility](#accessibility)
8. [Usage Guidelines](#usage-guidelines)
9. [Code Examples](#code-examples)

---

## Visual Reference

### Mintlify Reference

**Source**: `docs/research/library/mintlify/landing_deep.json`

Mintlify uses a minimal, elegant loading approach:

- **Loader-spin animation**: `@keyframes loader-spin { 100% { transform: rotate(1turn); } }`
- **Brand color integration**: Loading indicators use the brand accent color (`#18e299`)
- **Subtle shimmer**: Progress bars with gradient shimmer effect
- **Linear easing**: Continuous rotation without acceleration/deceleration

```
Mintlify Loader Appearance (Dark Mode):
+----------------------------------------+
|                                        |
|           +---+                        |
|          /     \                       |
|         |       |  <-- 2px stroke      |
|          \     /      brand color      |
|           +---+                        |
|                                        |
|    Continuous 360deg rotation          |
|    Duration: 0.8s-1s                   |
|    Easing: linear                      |
+----------------------------------------+
  Background: #08090a
  Spinner: #18e299 (brand)
```

### Current Nixelo

**Source**: `src/components/ui/LoadingSpinner.tsx`, `src/components/ui/Skeleton.tsx`

Current Nixelo implementation includes:

- **Spinner**: Border-based circular spinner with transparent top
- **Skeleton**: Pulse animation on neutral background
- **Progress**: Radix-based progress bar with smooth transitions
- **Full-page**: AppSplashScreen with shimmer loader

---

## Variants

### 1. Spinner (Circular)

Continuous rotation indicator for indeterminate loading states.

```
ASCII Animation Frames (1s loop):

  Frame 0%       Frame 25%      Frame 50%      Frame 75%      Frame 100%
     |              /              --              \              |
    / \            |  \            |  |            /  |          / \
   |   |          |    |          |    |          |    |        |   |
    \ /            |  /            |  |            \  |          \ /
     |              \              --              /              |

   [top]         [right]        [bottom]        [left]         [top]
                        ... repeats infinitely ...

Border structure:
+------------------+
|  .---.           |
| /     \          |  border: 2px solid text-color
||       |  <------|  border-top: transparent
| \     /          |
|  '---'           |
+------------------+
```

**Sizes**:

| Size | Dimensions | Border Width | Use Case |
|------|------------|--------------|----------|
| `xs` | 12x12px (h-3 w-3) | 1px | Inline with text |
| `sm` | 16x16px (h-4 w-4) | 2px | Buttons, compact UI |
| `md` | 32x32px (h-8 w-8) | 2px | Default, cards |
| `lg` | 48x48px (h-12 w-12) | 3px | Full sections, modals |

### 2. Skeleton Loaders

Placeholder shapes that pulse to indicate loading content.

```
Base Skeleton (animate-pulse):
+----------------------------------------+
|  ████████████████████████████          |  <-- bg-ui-bg-tertiary
|  Background pulses opacity 50% -> 100% |      rounded corners
+----------------------------------------+

Text Skeleton (3 lines, varying widths):
+----------------------------------------+
|  ██████████████████████████████████    |  Line 1: w-full
|  ████████████████████████████          |  Line 2: w-11/12
|  ██████████████████████████            |  Line 3: w-4/5
+----------------------------------------+

Card Skeleton:
+----------------------------------------+
|  +----------------------------------+  |
|  |  ████████████████████            |  |  Title: w-3/4
|  |  ██████████████                  |  |  Desc: w-1/2
|  |  ██████████████████████████      |  |  Body: w-5/6
|  +----------------------------------+  |
+----------------------------------------+

Avatar Skeleton (circular):
    +-------+
   /  ████   \     <-- rounded-full
  |   ████    |        bg-ui-bg-tertiary
   \  ████   /         animate-pulse
    +-------+

List Item Skeleton:
+----------------------------------------+
|  +---+  ██████████████████████████     |
|  | O |  ████████████████               |
|  +---+  avatar + text lines            |
+----------------------------------------+
```

**Skeleton Variants**:

| Variant | Component | Purpose |
|---------|-----------|---------|
| `Skeleton` | Base | Generic placeholder shape |
| `SkeletonCard` | Structured | Card with title/description |
| `SkeletonText` | Multi-line | Text paragraph placeholder |
| `SkeletonAvatar` | Circular | Profile image placeholder |
| `SkeletonTable` | Rows | Table data loading |
| `SkeletonList` | Items | List items with avatars |
| `SkeletonStatCard` | Dashboard | Stat card placeholder |
| `SkeletonKanbanCard` | Kanban | Issue card placeholder |
| `SkeletonProjectCard` | Projects | Project list item |

### 3. Progress Bar

Determinate progress indicator showing completion percentage.

```
Progress Bar Structure:
+----------------------------------------+
|  [====================                ]|  <-- bg-ui-bg-tertiary (track)
|   ^--- bg-brand (indicator)            |      rounded-full
+----------------------------------------+

Progress States:
  0%:   [                                ]
  25%:  [==========                      ]
  50%:  [====================            ]
  75%:  [==============================  ]
  100%: [================================]

Animation: translateX transition for smooth fill
```

### 4. Full-Page Loading (AppSplashScreen)

Premium full-screen loading for initial app load.

```
Full-Page Splash Screen:
+================================================+
|                                                |
|                    +---------+                 |
|                   /    :::    \                |  Logo with glow
|                  |    :::::    |  <-- pulse    |  bg-landing-accent/20
|                   \    :::    /                |  blur-2xl
|                    +---------+                 |
|                                                |
|                                                |
|              [================]                |  Shimmer progress bar
|               ^--- gradient shimmer            |  w-32, h-0.5
|                   left-to-right                |  bg-white/5 track
|                                                |
|              "Initializing..."                 |  Optional message
|                                                |
+================================================+
  Background: bg-ui-bg-hero (#030712)
  Gradient: from-landing-accent to-landing-accent-alt
```

### 5. Button Loading State

Inline spinner within buttons during form submission.

```
Button Loading States:

Normal:          Loading:
+----------+     +------------------+
| Submit   |  -> | (O) Loading...   |
+----------+     +------------------+
                  ^--- Loader2 icon (animate-spin)

Icon Button:
+----+     +----+
| +  |  -> | O  |  <-- spinner replaces icon
+----+     +----+
```

---

## Anatomy

### LoadingSpinner Component

```
+-----------------------------------------------+
|  LOADING SPINNER CONTAINER (Flex column)      |
|  +----------------------------------------+   |
|  |  SPINNER OUTPUT ELEMENT                |   |
|  |  +----------------------------------+  |   |
|  |  |                                  |  |   |
|  |  |     animate-spin                 |  |   |
|  |  |     rounded-full                 |  |   |
|  |  |     border-ui-text               |  |   |
|  |  |     border-t-transparent         |  |   |
|  |  |                                  |  |   |
|  |  +----------------------------------+  |   |
|  +----------------------------------------+   |
|                                               |
|  +----------------------------------------+   |
|  |  MESSAGE (optional)                    |   |
|  |  Typography variant="small"            |   |
|  |  text-ui-text-secondary                |   |
|  +----------------------------------------+   |
+-----------------------------------------------+
```

### Component Parts

| Part | Purpose | Default Classes |
|------|---------|-----------------|
| `LoadingSpinner` | Container wrapper | `Flex direction="column" align="center"` |
| `output` | Spinner element | `animate-spin rounded-full border-ui-text border-t-transparent` |
| `message` | Loading text | `Typography variant="small" text-ui-text-secondary` |
| `LoadingOverlay` | Overlay wrapper | `absolute inset-0 bg-ui-bg/90 z-10` |

---

## Props/API

### LoadingSpinner

```typescript
interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";  // Spinner size
  className?: string;                 // Additional CSS classes
  message?: string;                   // Optional loading message
  color?: string;                     // Custom border color (unused in current impl)
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | Spinner dimensions and border width |
| `className` | `string` | `""` | Additional CSS classes for spinner |
| `message` | `string` | - | Optional text displayed below spinner |

### LoadingOverlay

```typescript
interface LoadingOverlayProps {
  message?: string;  // Optional loading message
}
```

### Skeleton Components

```typescript
interface SkeletonProps {
  className?: string;  // Custom dimensions and styling
}

interface SkeletonTextProps {
  lines?: number;      // Number of text lines (default: 3)
  className?: string;
}

interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg";  // Avatar dimensions
}

interface SkeletonTableProps {
  rows?: number;  // Number of table rows (default: 5)
}

interface SkeletonListProps {
  items?: number;  // Number of list items (default: 5)
}
```

### Progress

```typescript
interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;              // Current progress (0-100)
  indicatorClassName?: string; // Custom indicator styles
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | `0` | Progress percentage (0-100) |
| `indicatorClassName` | `string` | - | Custom classes for the indicator bar |
| `className` | `string` | - | Custom classes for the track |

### Button isLoading

```typescript
interface ButtonProps {
  isLoading?: boolean;  // Shows spinner, disables button
  // ... other button props
}
```

---

## Styling Tokens

### Current Nixelo Tokens

| Property | Token | Value (Light) | Value (Dark) |
|----------|-------|---------------|--------------|
| Spinner Border | `border-ui-text` | `#111827` | `#F9FAFB` |
| Spinner Transparent | `border-t-transparent` | `transparent` | `transparent` |
| Skeleton Background | `bg-ui-bg-tertiary` | `#F3F4F6` | `#374151` |
| Progress Track | `bg-ui-bg-tertiary` | `#F3F4F6` | `#374151` |
| Progress Indicator | `bg-brand` | `#4F46E5` | `#818CF8` |
| Overlay Background | `bg-ui-bg/90` | `rgba(255,255,255,0.9)` | `rgba(17,24,39,0.9)` |
| Splash Background | `bg-ui-bg-hero` | `#030712` | `#030712` |
| Shimmer Gradient Start | `from-landing-accent` | `#06B6D4` | `#22D3EE` |
| Shimmer Gradient End | `to-landing-accent-alt` | `#A855F7` | `#C084FC` |

### Size Tokens

| Size | Height/Width | Border | Tailwind Classes |
|------|--------------|--------|------------------|
| `xs` | 12px | 1px | `h-3 w-3 border` |
| `sm` | 16px | 2px | `h-4 w-4 border-2` |
| `md` | 32px | 2px | `h-8 w-8 border-2` |
| `lg` | 48px | 3px | `h-12 w-12 border-3` |

### Mintlify-Inspired Enhancements

| Property | Current | Mintlify-Inspired | Notes |
|----------|---------|-------------------|-------|
| Spinner Color | `border-ui-text` | `border-brand` | Brand-colored spinner |
| Animation Duration | 1s (Tailwind default) | 0.8s | Slightly faster rotation |
| Shimmer Duration | 1.5s | 1.5s | Matches current |
| Skeleton Opacity | `animate-pulse` (50-100%) | Gradient shimmer | More sophisticated effect |

### Proposed New Tokens

```css
/* Add to @theme in src/index.css */

/* Loading-specific animations */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Skeleton shimmer overlay */
--skeleton-shimmer-gradient: linear-gradient(
  90deg,
  transparent 0%,
  rgba(255, 255, 255, 0.1) 50%,
  transparent 100%
);

/* Faster loader spin */
--animation-loader: loader-spin 0.8s linear infinite;
--animation-spin-fast: spin 0.5s linear infinite;
```

---

## Animations

### 1. Spinner Rotation

Continuous 360-degree rotation for indeterminate loading.

```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Tailwind default */
.animate-spin {
  animation: spin 1s linear infinite;
}

/* Faster variant (Mintlify-style) */
.animate-spin-fast {
  animation: spin 0.5s linear infinite;
}
```

**ASCII Storyboard**:
```
T=0ms        T=250ms      T=500ms      T=750ms      T=1000ms
   |            /            --            \            |
   |           /             --             \           |

 [top]      [right]      [bottom]       [left]       [top]
                ... repeats continuously ...
```

### 2. Skeleton Pulse

Opacity oscillation creating a breathing effect.

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**ASCII Storyboard**:
```
T=0ms (100%)     T=1000ms (50%)    T=2000ms (100%)
+------------+   +------------+    +------------+
|████████████|   |▓▓▓▓▓▓▓▓▓▓▓▓|    |████████████|
|████████████|   |▓▓▓▓▓▓▓▓▓▓▓▓|    |████████████|
+------------+   +------------+    +------------+
   (bright)         (dimmed)         (bright)
              ... repeats every 2s ...
```

### 3. Shimmer Effect (Premium)

Gradient sweep from left to right.

```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* AppSplashScreen implementation */
.animate-shimmer {
  animation: shimmer 1.5s infinite linear;
}
```

**ASCII Storyboard**:
```
T=0ms             T=500ms           T=1000ms          T=1500ms
[░░░░░░░░░░░░]    [░░░▓▓░░░░░░]     [░░░░░░▓▓░░]      [░░░░░░░░░░▓▓]
 ^gradient off     ^gradient mid     ^gradient right   ^exits right
                          ... repeats ...
```

### 4. Progress Width Transition

Smooth width change for determinate progress.

```css
/* Progress indicator */
.transition-all {
  transition: all 0.2s ease-out;
}

/* Transform-based animation (GPU accelerated) */
style={{ transform: `translateX(-${100 - value}%)` }}
```

**ASCII Storyboard**:
```
value=0%     value=25%    value=50%    value=75%    value=100%
[          ] [===       ] [=====     ] [=======   ] [=========]
```

### 5. Loader Button Transition

Smooth swap between content and spinner.

```css
/* Button content fade */
.button-content {
  transition: opacity 0.15s ease-out;
}

/* When loading */
.button-loading .button-content {
  opacity: 0;
}

.button-loading .button-spinner {
  opacity: 1;
}
```

---

## Accessibility

### Screen Reader Support

LoadingSpinner uses semantic HTML and ARIA attributes:

```tsx
<output
  className="animate-spin rounded-full..."
  aria-label="Loading"
>
  <span className="sr-only">Loading...</span>
</output>
```

| Element | ARIA | Purpose |
|---------|------|---------|
| `<output>` | Semantic element | Announces state changes to screen readers |
| `aria-label` | "Loading" | Provides accessible name |
| `.sr-only` | Hidden text | Fallback for screen readers |

### Overlay Loading States

When content is loading behind an overlay:

```tsx
<div aria-busy="true" aria-live="polite">
  <LoadingOverlay message="Saving changes..." />
  {/* Content being updated */}
</div>
```

### Progress Announcements

For progress bars, announce significant milestones:

```tsx
<Progress
  value={progress}
  aria-label={`Upload progress: ${progress}%`}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={progress}
/>
```

### Reduced Motion

Respect user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-spin,
  .animate-pulse {
    animation: none;
  }

  /* Provide static alternative */
  .animate-spin {
    opacity: 0.7;
  }
}
```

### Focus Management

When loading completes, manage focus appropriately:

- Move focus to newly loaded content
- Announce completion to screen readers
- Avoid trapping focus in loading states

---

## Usage Guidelines

### When to Use Each Variant

| Scenario | Recommended Variant | Rationale |
|----------|---------------------|-----------|
| **Data fetching** (unknown duration) | Spinner | Indeterminate, shows activity |
| **Page content loading** | Skeleton | Maintains layout, reduces shift |
| **File upload/download** | Progress Bar | Shows determinate progress |
| **Initial app load** | AppSplashScreen | Premium first impression |
| **Button action pending** | Button `isLoading` | Inline feedback, prevents double-click |
| **Background save** | Small spinner + toast | Non-blocking feedback |
| **Modal content loading** | LoadingOverlay | Blocks interaction during load |

### Duration Guidelines

| Duration | Recommendation |
|----------|----------------|
| < 1s | Consider no loader (perceived as instant) |
| 1-3s | Simple spinner or skeleton |
| 3-10s | Progress bar if determinate, skeleton with message if not |
| > 10s | Progress bar with time estimate, cancel option |

### Best Practices

**DO:**
- Use skeletons that match the shape of actual content
- Provide loading messages for operations > 3 seconds
- Show progress when known (file uploads, multi-step processes)
- Disable interactive elements during loading
- Use LoadingOverlay for overlay-style blocking states

**DON'T:**
- Show spinners for instant operations
- Use indeterminate spinners when progress is known
- Block entire page for partial updates
- Remove content and replace with spinner (use skeleton instead)
- Show multiple spinners simultaneously

### Loading Message Examples

```tsx
// Short operations (1-3s)
<LoadingSpinner message="Loading..." />

// Data operations
<LoadingSpinner message="Fetching projects..." />

// Save operations
<LoadingSpinner message="Saving changes..." />

// Complex operations
<LoadingSpinner message="Processing document..." />

// Initial load
<AppSplashScreen message="Initializing Nixelo..." />
```

---

## Code Examples

### Current Implementation

```tsx
import { LoadingSpinner, LoadingOverlay } from "@/components/ui/LoadingSpinner";
import { Skeleton, SkeletonCard, SkeletonText, SkeletonAvatar } from "@/components/ui/Skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/Button";

// Basic spinner
<LoadingSpinner />

// Spinner with size and message
<LoadingSpinner size="lg" message="Loading projects..." />

// Loading overlay for cards
<div className="relative">
  <Card>...</Card>
  {isLoading && <LoadingOverlay message="Updating..." />}
</div>

// Skeleton placeholders
<SkeletonCard />
<SkeletonText lines={3} />
<SkeletonAvatar size="md" />

// Progress bar
<Progress value={uploadProgress} />

// Button with loading state
<Button isLoading={isSaving}>
  Save Changes
</Button>

// Full-page splash
<AppSplashScreen message="Initializing..." />
```

### Query Loading Pattern

```tsx
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

function ProjectsList() {
  const projects = useQuery(api.projects.list);

  // Loading state
  if (projects === undefined) {
    return (
      <Flex direction="column" gap="md">
        <SkeletonProjectCard />
        <SkeletonProjectCard />
        <SkeletonProjectCard />
      </Flex>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return <EmptyState title="No projects yet" />;
  }

  // Loaded content
  return (
    <Flex direction="column" gap="md">
      {projects.map((project) => (
        <ProjectCard key={project._id} project={project} />
      ))}
    </Flex>
  );
}
```

### Optimistic UI with Loading Overlay

```tsx
function DocumentEditor({ documentId }: { documentId: Id<"documents"> }) {
  const [isSaving, setIsSaving] = useState(false);
  const updateDocument = useMutation(api.documents.update);

  const handleSave = async (content: string) => {
    setIsSaving(true);
    try {
      await updateDocument({ id: documentId, content });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <Editor onSave={handleSave} />
      {isSaving && <LoadingOverlay message="Saving..." />}
    </div>
  );
}
```

### Target Implementation (Mintlify-Inspired)

```tsx
// Enhanced LoadingSpinner with brand color option
interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "neutral" | "brand";  // NEW: brand-colored spinner
  message?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  variant = "neutral",
  message,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: "h-3 w-3 border",
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  const variantClasses = {
    neutral: "border-ui-text border-t-transparent",
    brand: "border-brand border-t-transparent",
  };

  return (
    <Flex direction="column" align="center" justify="center" gap="md">
      <output
        className={cn(
          "animate-spin rounded-full",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </output>
      {message && (
        <Typography variant="small" className="text-ui-text-secondary">
          {message}
        </Typography>
      )}
    </Flex>
  );
}

// Enhanced Skeleton with shimmer effect
export function SkeletonShimmer({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-ui-bg-tertiary rounded", className)}>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{ animation: "shimmer 1.5s infinite linear" }}
      />
    </div>
  );
}

// Inline loading indicator (for tables, lists)
export function InlineLoader({ text = "Loading" }: { text?: string }) {
  return (
    <Flex align="center" gap="sm" className="text-ui-text-secondary">
      <div className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
      <Typography variant="small">{text}</Typography>
    </Flex>
  );
}
```

### CSS Token Updates for Target

```css
/* Add to src/index.css @theme block */

/* Loading animation tokens */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

--animation-shimmer: shimmer 1.5s infinite linear;
--animation-loader-fast: spin 0.8s linear infinite;

/* Skeleton shimmer gradient */
--gradient-skeleton-shimmer: linear-gradient(
  90deg,
  transparent 0%,
  rgba(255, 255, 255, 0.1) 50%,
  transparent 100%
);
```

---

## Related Documentation

- [MASTER_PLAN.md](../MASTER_PLAN.md) - Overall design system roadmap
- [tokens/animations.md](../tokens/animations.md) - Animation patterns and keyframes
- [tokens/colors.md](../tokens/colors.md) - Color token reference
- [components/button.md](./button.md) - Button loading state details
- [src/components/ui/LoadingSpinner.tsx](../../../src/components/ui/LoadingSpinner.tsx) - Spinner implementation
- [src/components/ui/Skeleton.tsx](../../../src/components/ui/Skeleton.tsx) - Skeleton components
- [src/components/ui/progress.tsx](../../../src/components/ui/progress.tsx) - Progress bar
- [src/components/auth/AppSplashScreen.tsx](../../../src/components/auth/AppSplashScreen.tsx) - Full-page loader

---

## Implementation Checklist

- [ ] Add `variant` prop to LoadingSpinner ("neutral" | "brand")
- [ ] Create `SkeletonShimmer` component with gradient animation
- [ ] Add shimmer keyframe animation to `@theme` block
- [ ] Create `InlineLoader` component for table/list contexts
- [ ] Add `--animation-loader-fast` token (0.8s spin)
- [ ] Update Progress with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Add reduced motion media query support
- [ ] Create loading composition example for complex views
- [ ] Document loading message best practices
- [ ] Test skeleton dimensions match actual content
