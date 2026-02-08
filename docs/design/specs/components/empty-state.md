# Empty State Component

> **Status**: Needs Enhancement
> **Location**: `src/components/ui/EmptyState.tsx`

---

## Overview

The Empty State component communicates when a section or page has no content to display. It guides users toward taking action or understanding why content is missing. Currently uses emoji-based icons; target state includes custom SVG illustrations for a more polished, professional appearance.

**Screenshots**:
- Empty Dashboard Feed: `e2e/screenshots/04-empty-dashboard.png`
- Empty Projects: `e2e/screenshots/05-empty-projects.png`
- Empty Issues: `e2e/screenshots/06-empty-issues.png`
- Empty Documents: `e2e/screenshots/07-empty-documents.png`

---

## Visual Reference

### Current Nixelo Implementation

From the screenshots, the current empty states show:

1. **Dashboard Feed** ("Inbox Clear"):
   - Purple/pink chat bubble emoji icon
   - Title: "Inbox Clear"
   - Description: "No pending items in your feed."
   - Action: "Explore Projects" button (brand indigo)

2. **Dashboard Workspaces** ("No projects"):
   - Yellow folder emoji icon
   - Title: "No projects"
   - Description: "You're not a member of any projects yet"
   - Action: "Go to Workspaces" button

3. **Projects Page** ("No projects yet"):
   - Yellow folder emoji icon
   - Title: "No projects yet"
   - Description: "Create your first project to organize work"
   - Action: "+ Create Project" button

4. **Issues Page** ("No issues found"):
   - Magnifying glass with document emoji icon
   - Title: "No issues found"
   - Description: "Try adjusting your filters or create a new issue."
   - No action button (contextual - suggests filter adjustment)

5. **Documents Page** ("Welcome to your project"):
   - Purple document/notepad emoji icon
   - Title: "Welcome to your project"
   - Description: "Select a document from the sidebar or create a new one to get started."
   - No action button (action is in sidebar)

### Current Issues

- Emoji icons feel casual/generic, not premium
- No consistent illustration style
- Limited visual hierarchy
- No entry animations beyond basic fade
- Missing variants for error/loading states

### Target State (Mintlify-Inspired)

Rich empty states with:
- Custom SVG/Lottie illustrations matching brand
- Subtle gradient backgrounds or decorative elements
- Smooth entry animations
- Clear visual hierarchy with proper spacing
- Contextual messaging that guides action

---

## Variants

### 1. No Data (First Time / Welcome)

Used when a user visits a section for the first time with no existing content.

```
+--------------------------------------------------+
|                                                  |
|              +------------------+                |
|              |                  |                |
|              |   [ILLUSTRATION] |                |
|              |    (welcome)     |                |
|              |                  |                |
|              +------------------+                |
|                                                  |
|              Welcome to Projects                 |
|                                                  |
|         Create your first project to            |
|         start organizing your work              |
|                                                  |
|            [ + Create Project ]                  |
|                                                  |
+--------------------------------------------------+
```

**Characteristics**:
- Welcoming, encouraging tone
- Illustration shows potential/possibility
- Strong CTA to create first item
- May include secondary link (e.g., "Learn more")

**Copy Guidelines**:
- Title: Welcoming ("Welcome to...", "Get started with...")
- Description: Value proposition, what they can do
- Action: Primary creation action

### 2. No Results (Search/Filter Empty)

Used when a search or filter returns no matching items.

```
+--------------------------------------------------+
|                                                  |
|              +------------------+                |
|              |                  |                |
|              |   [ILLUSTRATION] |                |
|              |    (search)      |                |
|              |                  |                |
|              +------------------+                |
|                                                  |
|              No issues found                     |
|                                                  |
|         Try adjusting your filters or           |
|         search with different keywords          |
|                                                  |
|       [ Clear Filters ]   [ Create New ]        |
|                                                  |
+--------------------------------------------------+
```

**Characteristics**:
- Helpful, not discouraging
- Illustration shows "searching" or "empty results"
- Suggests next steps (clear filters, try again)
- Optional secondary action to create new

**Copy Guidelines**:
- Title: Factual ("No results", "No matches found")
- Description: Helpful suggestion for next step
- Action: Clear filters (primary), Create new (secondary)

### 3. Error State

Used when content fails to load due to an error.

```
+--------------------------------------------------+
|                                                  |
|              +------------------+                |
|              |                  |                |
|              |   [ILLUSTRATION] |                |
|              |    (error)       |                |
|              |                  |                |
|              +------------------+                |
|                                                  |
|           Something went wrong                   |
|                                                  |
|         We couldn't load your projects.         |
|         Please try again in a moment.           |
|                                                  |
|              [ Try Again ]                       |
|                                                  |
+--------------------------------------------------+
```

**Characteristics**:
- Apologetic but not alarming
- Illustration shows gentle error (not scary)
- Clear retry action
- Optional "Contact support" link

**Copy Guidelines**:
- Title: Acknowledging ("Something went wrong", "Unable to load")
- Description: Brief explanation + reassurance
- Action: Retry (primary), Contact support (link)

### 4. Loading Placeholder (Skeleton)

Used while content is being fetched.

```
+--------------------------------------------------+
|                                                  |
|              +------------------+                |
|              |                  |                |
|              |   [SHIMMER]      |  <- Animated  |
|              |                  |                |
|              +------------------+                |
|                                                  |
|              [====  ====  ====]    <- Skeleton  |
|                                                  |
|              [==============]      <- Skeleton  |
|                                                  |
+--------------------------------------------------+
```

**Characteristics**:
- Subtle animation (shimmer/pulse)
- Matches approximate layout of loaded content
- No text messaging (silent loading)
- Transitions smoothly to content

### 5. Permission Denied

Used when user lacks access to content.

```
+--------------------------------------------------+
|                                                  |
|              +------------------+                |
|              |                  |                |
|              |   [ILLUSTRATION] |                |
|              |    (locked)      |                |
|              |                  |                |
|              +------------------+                |
|                                                  |
|             Access Restricted                    |
|                                                  |
|         You don't have permission to            |
|         view this project.                      |
|                                                  |
|          [ Request Access ]                      |
|                                                  |
+--------------------------------------------------+
```

**Characteristics**:
- Clear about restriction (not confusing)
- Illustration shows "locked" concept gently
- Action to request access or go back
- May show who to contact

---

## Anatomy

```
+----------------------------------------------------------+
|                                                          |
|    +------------------------------------------+          |
|    |                                          |          |
|    |           ILLUSTRATION AREA              |    1     |
|    |           (64-128px height)              |          |
|    |                                          |          |
|    +------------------------------------------+          |
|                                                          |
|    +--------------HEADING-----------------+        2     |
|    |     No projects yet                  |              |
|    +--------------------------------------+              |
|                                                          |
|    +-----------DESCRIPTION----------------+        3     |
|    |   Create your first project to       |              |
|    |   start organizing your work         |              |
|    +--------------------------------------+              |
|                                                          |
|    +----------ACTION AREA-----------------+        4     |
|    |   [ Primary ]    Secondary Link      |              |
|    +--------------------------------------+              |
|                                                          |
+----------------------------------------------------------+
```

### Component Parts

| # | Part | Required | Description |
|---|------|----------|-------------|
| 1 | Illustration | Yes* | SVG/emoji icon representing the state |
| 2 | Heading | Yes | Short, descriptive title (1 line) |
| 3 | Description | No | Supporting text explaining the state |
| 4 | Action(s) | No | Button(s) or link(s) for next steps |

*Currently uses emoji; target uses custom SVG illustrations

---

## ASCII Layout Structure

### Centered (Default)

```
+--------------------------------------------------+
|                    padding-y: 48px (py-12)       |
|                    padding-x: 16px (px-4)        |
|                                                  |
|                  +-----------+                   |
|                  | ICON/IMG  |                   |
|                  | (64px)    |                   |
|                  +-----------+                   |
|                    gap: 12px                     |
|                  +------------+                  |
|                  |  HEADING   |                  |
|                  | (text-lg)  |                  |
|                  +------------+                  |
|                    gap: 4px                      |
|                  +------------+                  |
|                  |DESCRIPTION |                  |
|                  | (text-sm)  |                  |
|                  | max-w: sm  |                  |
|                  +------------+                  |
|                    gap: 16px                     |
|                  +------------+                  |
|                  |  [BUTTON]  |                  |
|                  +------------+                  |
|                                                  |
+--------------------------------------------------+
            text-center alignment
```

### Inline (Compact)

For smaller spaces like sidebars or card sections.

```
+--------------------------------+
|  +------+  No items yet        |
|  | ICON |  Add your first item |
|  +------+  [ + Add ]           |
+--------------------------------+
     flex-row, items-center
```

### Full Page (Hero)

For main content areas with more visual impact.

```
+------------------------------------------------------------------+
|                                                                  |
|                                                                  |
|                    +----------------------+                      |
|                    |                      |                      |
|                    |    ILLUSTRATION      |                      |
|                    |    (128-200px)       |                      |
|                    |                      |                      |
|                    +----------------------+                      |
|                                                                  |
|                    Welcome to Documents                          |
|                                                                  |
|                Create beautiful documentation                    |
|                for your team and customers                       |
|                                                                  |
|                      [ Get Started ]                             |
|                                                                  |
|                    Not sure where to start?                      |
|                       View templates ->                          |
|                                                                  |
+------------------------------------------------------------------+
```

---

## Styling Tokens

### Container

| Property | Value | Token/Class |
|----------|-------|-------------|
| Padding Y | 48px | `py-12` |
| Padding X | 16px | `px-4` |
| Text align | Center | `text-center` |
| Max width (description) | 384px | `max-w-sm` |

### Illustration Area

| Property | Value | Token/Class |
|----------|-------|-------------|
| Size (current emoji) | 60px | `text-6xl` |
| Size (target SVG) | 64-128px | `w-16 h-16` to `w-32 h-32` |
| Margin bottom | 12px | `mb-3` |
| Animation | Fade in | `animate-in fade-in duration-500` |

### Heading

| Property | Value | Token/Class |
|----------|-------|-------------|
| Font size | 18px | `text-lg` |
| Font weight | 500 (medium) | `font-medium` |
| Color | `--color-ui-text` | `text-ui-text` |
| Margin bottom | 4px | `mb-1` |

### Description

| Property | Value | Token/Class |
|----------|-------|-------------|
| Font size | 14px | `text-sm` |
| Color | `--color-ui-text-tertiary` | `text-ui-text-tertiary` |
| Margin bottom | 16px | `mb-4` |
| Max width | 384px | `max-w-sm` |
| Horizontal centering | Auto | `mx-auto` |

### Action Button

| Property | Value | Token/Class |
|----------|-------|-------------|
| Variant | Default (brand) | Default Button styling |
| Size | Default | Standard button size |

### Color Tokens by Variant

| Variant | Illustration Accent | Heading | Description |
|---------|---------------------|---------|-------------|
| No Data | `--color-brand` | `text-ui-text` | `text-ui-text-tertiary` |
| No Results | `--color-palette-blue` | `text-ui-text` | `text-ui-text-tertiary` |
| Error | `--color-status-error` | `text-ui-text` | `text-ui-text-tertiary` |
| Permission | `--color-status-warning` | `text-ui-text` | `text-ui-text-tertiary` |

---

## Illustrations

### Current State (Emoji Icons)

| Context | Current Icon | Description |
|---------|--------------|-------------|
| Projects | Folder emoji | Yellow folder |
| Issues | Magnifying glass | Search/filter indicator |
| Documents | Document emoji | Purple notepad |
| Feed/Inbox | Chat bubbles | Purple/pink speech bubbles |
| Workspaces | Folder emoji | Yellow folder |

### Target State (Custom SVG Illustrations)

Recommendations for custom illustration system:

#### Style Guidelines

1. **Consistent Art Style**
   - Line weight: 1.5-2px stroke
   - Colors: Brand palette (indigo/purple) + neutral grays
   - Style: Minimalist, geometric, friendly
   - Avoid: Overly detailed, photorealistic, clip-art

2. **Size Variants**
   - Small (48px): Inline/compact empty states
   - Medium (64-80px): Default card empty states
   - Large (120-160px): Full-page empty states

3. **Animation-Ready**
   - Separate layers for potential animation
   - Simple shapes that can have hover/entry effects
   - Consider Lottie for complex animations

#### Illustration Concepts by Context

| Context | Concept | Elements |
|---------|---------|----------|
| Projects | Blueprint/Cube | Isometric cube with plus sign, construction lines |
| Issues | Checklist/Clipboard | Empty clipboard with checkmark, magnifying glass |
| Documents | Papers/Notebook | Stack of papers, pen, subtle sparkle |
| Feed/Activity | Bell/Inbox | Notification bell, inbox tray |
| Search Empty | Telescope/Binoculars | Looking into distance, stars |
| Error | Broken Link/Cloud | Disconnected elements, subtle warning |
| Permission | Lock/Shield | Padlock with keyhole, shield icon |
| Calendar | Empty Calendar | Calendar grid with subtle decorations |

#### Implementation Options

1. **Static SVG** (Recommended for v1)
   - Inline SVG components
   - Easy to style with CSS custom properties
   - Small bundle size

2. **Animated SVG** (Enhancement)
   - CSS keyframe animations
   - Subtle float/pulse effects
   - Hover interactions

3. **Lottie Animations** (Premium)
   - Complex entry animations
   - Delightful micro-interactions
   - Larger bundle trade-off

---

## Animations

### Entry Animation (Current)

```css
/* Current: Basic fade-in on icon */
.animate-in.fade-in.duration-500 {
  animation: fade-in 500ms ease-out;
}
```

### Target Entry Animation

```css
/* Staggered entry for all elements */
@keyframes empty-state-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state-illustration {
  animation: empty-state-enter 0.4s ease-out;
}

.empty-state-heading {
  animation: empty-state-enter 0.4s ease-out 0.1s both;
}

.empty-state-description {
  animation: empty-state-enter 0.4s ease-out 0.15s both;
}

.empty-state-action {
  animation: empty-state-enter 0.4s ease-out 0.2s both;
}
```

### Illustration Motion (Optional)

```css
/* Subtle float animation for illustration */
@keyframes gentle-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.empty-state-illustration {
  animation: gentle-float 3s ease-in-out infinite;
}

/* Pulse glow effect (premium) */
@keyframes soft-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

### Loading State Animation

```css
/* Skeleton shimmer */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
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

## Code Examples

### Current Implementation

```tsx
// src/components/ui/EmptyState.tsx
import type { ReactNode } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?:
    | ReactNode
    | {
        label: string;
        onClick: () => void;
      };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const renderAction = () => {
    if (!action) return null;

    if (typeof action === "object" && action !== null && "label" in action && "onClick" in action) {
      const act = action as { label: string; onClick: () => void };
      if (typeof act.label === "string" && typeof act.onClick === "function") {
        return <Button onClick={act.onClick}>{act.label}</Button>;
      }
    }
    return action as ReactNode;
  };

  return (
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-3 animate-in fade-in duration-500">{icon}</div>
      <h3 className="text-lg font-medium text-ui-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ui-text-tertiary mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {renderAction()}
    </div>
  );
}
```

### Current Usage

```tsx
// Dashboard Feed empty state
<EmptyState
  icon="🗨️"
  title="Inbox Clear"
  description="No pending items in your feed."
  action={{ label: "Explore Projects", onClick: () => navigate(ROUTES.projects.list(slug)) }}
/>

// Projects list empty state
<EmptyState
  icon="📂"
  title="No projects yet"
  description="Create your first project to organize work"
  action={{ label: "+ Create Project", onClick: openCreateDialog }}
/>

// Issues empty state (no results)
<EmptyState
  icon="🔍"
  title="No issues found"
  description="Try adjusting your filters or create a new issue."
/>
```

### Target Implementation

```tsx
// src/components/ui/EmptyState.tsx (Enhanced)
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Flex } from "./Flex";
import { Typography } from "./Typography";
import { cn } from "@/lib/utils";

// Illustration components (to be created)
import {
  ProjectsIllustration,
  IssuesIllustration,
  DocumentsIllustration,
  FeedIllustration,
  SearchIllustration,
  ErrorIllustration,
  LockedIllustration,
} from "./illustrations";

type IllustrationType =
  | "projects"
  | "issues"
  | "documents"
  | "feed"
  | "search"
  | "error"
  | "locked"
  | "custom";

type EmptyStateVariant = "default" | "no-results" | "error" | "permission";

interface EmptyStateProps {
  /** Illustration type or custom icon/emoji */
  illustration?: IllustrationType | string;
  /** Custom illustration component */
  customIllustration?: ReactNode;
  /** Main heading text */
  title: string;
  /** Supporting description text */
  description?: string;
  /** Primary action button or custom ReactNode */
  action?:
    | ReactNode
    | {
        label: string;
        onClick: () => void;
        variant?: "default" | "outline" | "ghost";
      };
  /** Secondary action (link style) */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Visual variant affecting colors/tone */
  variant?: EmptyStateVariant;
  /** Size affects illustration and spacing */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const illustrationMap: Record<string, React.FC<{ className?: string }>> = {
  projects: ProjectsIllustration,
  issues: IssuesIllustration,
  documents: DocumentsIllustration,
  feed: FeedIllustration,
  search: SearchIllustration,
  error: ErrorIllustration,
  locked: LockedIllustration,
};

const sizeConfig = {
  sm: {
    illustration: "w-12 h-12",
    padding: "py-6 px-3",
    gap: "gap-2",
    title: "text-base",
    description: "text-xs",
  },
  md: {
    illustration: "w-20 h-20",
    padding: "py-12 px-4",
    gap: "gap-3",
    title: "text-lg",
    description: "text-sm",
  },
  lg: {
    illustration: "w-32 h-32",
    padding: "py-16 px-6",
    gap: "gap-4",
    title: "text-xl",
    description: "text-base",
  },
};

export function EmptyState({
  illustration,
  customIllustration,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
  size = "md",
  className,
}: EmptyStateProps) {
  const config = sizeConfig[size];

  const renderIllustration = () => {
    if (customIllustration) {
      return customIllustration;
    }

    if (illustration && illustration in illustrationMap) {
      const IllustrationComponent = illustrationMap[illustration];
      return (
        <IllustrationComponent
          className={cn(
            config.illustration,
            "animate-in fade-in slide-in-from-bottom-2 duration-400"
          )}
        />
      );
    }

    // Fallback to emoji (legacy support)
    if (illustration) {
      return (
        <span
          className={cn(
            "text-6xl animate-in fade-in duration-500",
            size === "sm" && "text-4xl",
            size === "lg" && "text-7xl"
          )}
        >
          {illustration}
        </span>
      );
    }

    return null;
  };

  const renderAction = () => {
    if (!action) return null;

    if (
      typeof action === "object" &&
      action !== null &&
      "label" in action &&
      "onClick" in action
    ) {
      const act = action as {
        label: string;
        onClick: () => void;
        variant?: "default" | "outline" | "ghost";
      };
      return (
        <Button
          onClick={act.onClick}
          variant={act.variant}
          className="animate-in fade-in slide-in-from-bottom-2 duration-400 delay-200"
        >
          {act.label}
        </Button>
      );
    }

    return action as ReactNode;
  };

  return (
    <Flex
      direction="col"
      align="center"
      justify="center"
      className={cn("text-center", config.padding, className)}
    >
      {/* Illustration */}
      <div className="mb-3">{renderIllustration()}</div>

      {/* Heading */}
      <Typography
        as="h3"
        className={cn(
          "font-medium text-ui-text mb-1",
          "animate-in fade-in slide-in-from-bottom-2 duration-400 delay-100",
          config.title
        )}
      >
        {title}
      </Typography>

      {/* Description */}
      {description && (
        <Typography
          className={cn(
            "text-ui-text-tertiary mb-4 max-w-sm mx-auto",
            "animate-in fade-in slide-in-from-bottom-2 duration-400 delay-150",
            config.description
          )}
        >
          {description}
        </Typography>
      )}

      {/* Actions */}
      <Flex gap="3" align="center" className="mt-2">
        {renderAction()}
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className={cn(
              "text-sm text-brand hover:text-brand-hover underline-offset-4 hover:underline",
              "animate-in fade-in duration-400 delay-300"
            )}
          >
            {secondaryAction.label}
          </button>
        )}
      </Flex>
    </Flex>
  );
}
```

### Target Usage

```tsx
// Projects empty state with illustration
<EmptyState
  illustration="projects"
  title="No projects yet"
  description="Create your first project to start organizing your work"
  action={{ label: "+ Create Project", onClick: openCreateDialog }}
  secondaryAction={{ label: "View templates", onClick: openTemplates }}
  size="lg"
/>

// Search empty state
<EmptyState
  illustration="search"
  title="No issues found"
  description="Try adjusting your filters or search with different keywords"
  action={{ label: "Clear Filters", onClick: clearFilters, variant: "outline" }}
  variant="no-results"
/>

// Error state
<EmptyState
  illustration="error"
  title="Something went wrong"
  description="We couldn't load your projects. Please try again."
  action={{ label: "Try Again", onClick: refetch }}
  variant="error"
/>

// Compact inline empty state
<EmptyState
  illustration="📋"
  title="No tasks"
  description="Add your first task"
  size="sm"
/>
```

---

## Props Interface

```tsx
interface EmptyStateProps {
  /**
   * Illustration identifier or emoji string
   * Built-in: "projects" | "issues" | "documents" | "feed" | "search" | "error" | "locked"
   * Or any emoji string for legacy support
   */
  illustration?: string;

  /** Custom illustration component (overrides illustration prop) */
  customIllustration?: ReactNode;

  /** Main heading text */
  title: string;

  /** Supporting description text */
  description?: string;

  /**
   * Primary action - either a ReactNode or button configuration
   */
  action?:
    | ReactNode
    | {
        label: string;
        onClick: () => void;
        variant?: "default" | "outline" | "ghost";
      };

  /** Secondary action rendered as a text link */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

  /** Visual variant affecting the overall tone */
  variant?: "default" | "no-results" | "error" | "permission";

  /** Size variant affecting spacing and illustration size */
  size?: "sm" | "md" | "lg";

  /** Additional CSS classes */
  className?: string;
}
```

---

## Accessibility

### Current Implementation

- Heading uses `<h3>` for proper document structure
- Description uses `<p>` for semantic text
- Button is keyboard accessible

### Recommendations

1. **ARIA Live Region**: For dynamic empty states (e.g., after filtering)
   ```tsx
   <div role="status" aria-live="polite">
     <EmptyState ... />
   </div>
   ```

2. **Illustration Alt Text**: Add `aria-hidden="true"` to decorative illustrations
   ```tsx
   <IllustrationComponent aria-hidden="true" />
   ```

3. **Focus Management**: After clearing filters, focus should move to a logical element

4. **Reduced Motion**: Respect `prefers-reduced-motion`
   ```css
   @media (prefers-reduced-motion: reduce) {
     .empty-state * {
       animation: none !important;
     }
   }
   ```

---

## Usage Guidelines

### Do

- Use consistent illustrations within the same product area
- Write clear, actionable copy that guides users
- Provide a primary action when users can take immediate action
- Match the tone to the context (welcoming for first-time, helpful for no-results)
- Use the `size` prop appropriately for the available space

### Don't

- Use generic messages like "Nothing here" without guidance
- Show empty states when loading (use skeleton instead)
- Include too many action options (max 2: primary + secondary)
- Use alarming language for simple "no data" states
- Mix emoji icons with SVG illustrations in the same view

### Copy Guidelines by Variant

| Variant | Title Tone | Description Tone | Example |
|---------|------------|------------------|---------|
| No Data | Welcoming | Encouraging | "Welcome to Projects" / "Create your first project to get started" |
| No Results | Factual | Helpful | "No issues found" / "Try adjusting your filters" |
| Error | Apologetic | Reassuring | "Something went wrong" / "We're working on it" |
| Permission | Clear | Instructive | "Access restricted" / "Request access from the owner" |

---

## Migration Path

### Phase 1: Keep Current (Emoji Icons)
- No code changes
- Document existing patterns

### Phase 2: Add Illustration Components
- Create SVG illustration components
- Add `illustration` prop to EmptyState
- Support both emoji and illustration types

### Phase 3: Enhanced Animations
- Add staggered entry animations
- Add optional float/pulse effects
- Respect reduced motion preferences

### Phase 4: Full Rollout
- Replace all emoji icons with illustrations
- Update all empty state instances
- Remove legacy emoji support (optional)

---

## Related Components

- **Button**: Primary action rendering
- **Flex**: Layout container
- **Typography**: Text elements
- **LoadingSpinner**: Alternative when loading
- **ErrorBoundary**: Error state wrapper

---

## Related Files

### Implementation
- Component: `src/components/ui/EmptyState.tsx`
- Tests: `src/components/ui/EmptyState.test.tsx`
- Design tokens: `src/index.css` (`@theme` block)

### Screenshots (Current)
- Dashboard: `e2e/screenshots/04-empty-dashboard.png`
- Projects: `e2e/screenshots/05-empty-projects.png`
- Issues: `e2e/screenshots/06-empty-issues.png`
- Documents: `e2e/screenshots/07-empty-documents.png`

### Design Research
- Mintlify dashboard: `docs/research/library/mintlify/dashboard/`
- Mintlify onboarding: `docs/research/library/mintlify/dashboard/onboarding-form.png`

---

*Last Updated: 2026-02-05*
*Status: Documented - Enhancement Planned*
