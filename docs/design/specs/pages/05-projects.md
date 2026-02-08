# Projects List Page

> **Status**: TODO - Awaiting Implementation
> **Priority**: MEDIUM (Phase 4 - Dashboard & App)

---

## Current State Analysis

**Screenshots**:
- Empty state: `e2e/screenshots/05-empty-projects.png`
- Filled state: `e2e/screenshots/02-filled-projects.png`

### Visual Description (Current Nixelo)

The current projects list page features:

1. **Page Header**:
   - Title: "Projects" (dark text, ~24px, bold)
   - Description: "Manage your projects and initiatives" (muted gray, ~14px)
   - Action: "+ Create Project" button (primary, blue/indigo)
   - Standard `PageLayout` wrapper with sidebar visible on left

2. **Empty State** (no projects):
   - Centered content area
   - Folder emoji icon (yellow folder)
   - Heading: "No projects yet" (dark, ~18px)
   - Subtext: "Create your first project to organize work" (muted, ~14px)
   - "+ Create Project" button (primary)

3. **Filled State** (with projects):
   - 3-column responsive grid layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
   - Each project rendered as a Card component
   - Card contains: name, key badge, description (2-line clamp), issue count, board type

4. **Project Card Structure**:
   - White background with subtle border
   - Padding: `p-6`
   - Hover: shadow-lg transition
   - Content:
     - Row 1: Project name (h3) + Key badge (inline code style)
     - Row 2: Description (secondary, line-clamp-2)
     - Row 3: Issue count + Board type (muted, small)

5. **Pagination**:
   - "Load More Projects" button (outline variant)
   - Initial load: 20 items

### Issues Identified

| Issue | Severity | Notes |
|-------|----------|-------|
| Cards lack visual depth | HIGH | Need subtle gradient or glass effect |
| No project avatars/icons | MEDIUM | Projects should have visual identity |
| Grid feels sparse | MEDIUM | Need better spacing and card polish |
| Empty state icon dated | MEDIUM | Emoji icon not premium |
| No quick actions on cards | LOW | Could add hover menu |
| No filtering/sorting | LOW | Feature gap, not polish |
| Load more button placement | LOW | Could use infinite scroll |

---

## Target State

**Reference**: Apply Mintlify polish patterns - refined cards, subtle depth, premium animations

### Key Improvements

1. **Premium card design** - Subtle border glow, refined shadows, hover lift effect
2. **Project avatars** - Generated or custom project icon/color
3. **Rich metadata display** - Member avatars, progress indicator, last activity
4. **Refined empty state** - Custom illustration, better typography hierarchy
5. **Micro-interactions** - Card hover animations, staggered entry
6. **Quick actions** - Hover menu for common actions (settings, archive, etc.)

---

## ASCII Wireframe

### Page Layout (Desktop - Filled State)

```
+--------------------------------------------------------------------------------------------------+
| [Sidebar]  |                                                                                      |
|            |  Projects                                              [ + Create Project ]          |
|  Dashboard |  Manage your projects and initiatives                                                |
|  Issues    |                                                                                      |
|  Calendar  |  +--------------------------------+  +--------------------------------+              |
|  Documents |  |                                |  |                                |              |
|  > Templates|  |  [Logo]  Demo Project    DEMO |  |  [Logo]  API Platform     API  |              |
|            |  |          ~~~~~~~~~~~~~~~~~~~~~~ |  |          ~~~~~~~~~~~~~~~~~~~~~~ |              |
|  Workspaces|  |                                |  |                                |              |
|  > Product |  |  Build and ship the next...   |  |  Backend services and...       |              |
|            |  |                                |  |                                |              |
| Time Track |  |  +-+-+  12 issues  kanban     |  |  +-+-+  48 issues  scrum       |              |
|            |  |  [o o]                         |  |  [o o]                         |              |
|            |  +--------------------------------+  +--------------------------------+              |
|            |                                                                                      |
|            |  +--------------------------------+  +--------------------------------+              |
|            |  |                                |  |                                |              |
|  Settings  |  |  [Logo]  Mobile App      MOB  |  |  [Logo]  Marketing Site  MKT  |              |
|            |  |          ~~~~~~~~~~~~~~~~~~~~~~ |  |          ~~~~~~~~~~~~~~~~~~~~~~ |              |
|            |  |                                |  |                                |              |
|            |  |  iOS and Android apps...      |  |  Landing pages and...          |              |
|            |  |                                |  |                                |              |
|            |  |  +-+-+  28 issues  scrum      |  |  +-+-+   8 issues  kanban      |              |
|            |  |  [o o]                         |  |  [o o]                         |              |
|            |  +--------------------------------+  +--------------------------------+              |
+--------------------------------------------------------------------------------------------------+
```

### Project Card Detail (Target)

```
+--------------------------------------------------+
|                                                  |
|   +------+                                       |
|   | Logo |   Project Name              [KEY]     |
|   | Icon |   ~~~~~~~~~~~~~             (badge)   |
|   +------+                                       |
|                                                  |
|   Description text that can span multiple        |
|   lines but gets truncated after two...          |
|                                                  |
|   +---+---+---+                                  |
|   |ooo|     12 issues   |   kanban               |
|   +---+  (member stack)  (board type)            |
|                                                  |
|            [Last updated 2h ago]                 |
|                                                  |
+--------------------------------------------------+
```

### Empty State (Target)

```
+--------------------------------------------------------------------------------+
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                           +------------------+                                 |
|                           |                  |                                 |
|                           |   [Illustration] |                                 |
|                           |    (folder +     |                                 |
|                           |     sparkles)    |                                 |
|                           |                  |                                 |
|                           +------------------+                                 |
|                                                                                |
|                            No projects yet                                     |
|                          (20px, font-weight 600)                               |
|                                                                                |
|                 Create your first project to organize work                     |
|                           (14px, muted text)                                   |
|                                                                                |
|                        [ + Create Project ]                                    |
|                          (primary button)                                      |
|                                                                                |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### Card Hover State

```
+--------------------------------------------------+
|                           ┌─────────┐            |  <- Hover reveals actions
|   +------+                │ Open    │            |
|   | Logo |   Project Name │ Board   │   [KEY]    |
|   | Icon |   ~~~~~~~~~~~~ │ Settings│            |
|   +------+                │ Archive │            |
|                           └─────────┘            |
|   Description text...                            |
|                                                  |
|   [ooo]  12 issues  |  kanban                    |
|                                                  |
+--------------------------------------------------+  <- Subtle lift: translateY(-2px)
      |                                               <- Enhanced shadow
      +-- Card border glow on hover
```

---

## Functionality Breakdown

### Core Actions

- [ ] **View projects list** - Paginated grid of project cards
- [ ] **Create project** - Opens `CreateProjectFromTemplate` modal
- [ ] **Navigate to project** - Click card to go to project board
- [ ] **Load more** - Pagination via "Load More" button (20 items per page)

### Project Card Interactions

- [ ] **Hover state** - Card lifts with enhanced shadow
- [ ] **Quick actions menu** - Three-dot menu on hover (Open, Settings, Archive)
- [ ] **Click navigation** - Full card is clickable, navigates to board
- [ ] **Keyboard navigation** - Tab between cards, Enter to select

### Empty State

- [ ] **Create prompt** - Clear CTA to create first project
- [ ] **Illustration** - Custom SVG or Lottie animation
- [ ] **Helpful text** - Explains purpose of projects

### Future Enhancements (Not in initial scope)

- [ ] **Search/filter** - Filter by name, board type, status
- [ ] **Sort options** - By name, date created, issue count
- [ ] **Grid/list toggle** - Switch between card grid and list view
- [ ] **Infinite scroll** - Replace "Load More" with scroll-based loading
- [ ] **Drag to reorder** - Custom project ordering

---

## Component Inventory

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **PageLayout** | Standard layout | Keep | No changes needed |
| **PageHeader** | Title + description + action | Add filters | Future: add search/filter bar |
| **Card** | Basic white card | Enhanced with hover effects | Add glow, lift, shadow |
| **EmptyState** | Emoji icon variant | Custom illustration | Premium SVG |
| **Button** | Primary variant | Keep | Good as-is |
| **Typography** | h3, p, muted variants | Keep | Good hierarchy |
| **Avatar** | Not used | Add member avatars | Stack of project members |
| **Badge** | Inline code style for key | Proper Badge component | Consistent styling |
| **LoadingSpinner** | Centered spinner | Add skeleton | Skeleton grid for loading |
| **DropdownMenu** | Not used | Add quick actions | Three-dot menu on cards |

### New Components Needed

1. **ProjectCard** - Dedicated card component for projects
   - Props: project, onNavigate, onOpenSettings
   - Includes: avatar, metadata, hover menu

2. **ProjectAvatar** - Project icon/logo with fallback
   - Props: name, color, icon, size
   - Generates initials or uses custom icon

3. **MemberStack** - Overlapping avatar stack
   - Props: members[], maxVisible, size
   - Shows +N indicator for overflow

4. **ProjectCardSkeleton** - Loading placeholder
   - Matches card dimensions
   - Animated shimmer effect

---

## Design Tokens Used

### Colors

| Element | Token | Value |
|---------|-------|-------|
| Page background | `--color-ui-bg` | White (light) / Gray-900 (dark) |
| Card background | `--color-ui-bg-elevated` | White (light) / Gray-800 (dark) |
| Card border | `--color-ui-border` | Gray-200 (light) / Gray-700 (dark) |
| Card border (hover) | `--color-ui-border-focus` | Indigo-600 (light) / Indigo-400 (dark) |
| Title text | `--color-ui-text` | Gray-900 (light) / Gray-50 (dark) |
| Description text | `--color-ui-text-secondary` | Gray-500 (light) / Gray-300 (dark) |
| Metadata text | `--color-ui-text-tertiary` | Gray-400 (light) / Gray-400 (dark) |
| Key badge bg | `--color-ui-bg-tertiary` | Gray-100 (light) / Gray-700 (dark) |
| Key badge text | `--color-ui-text-secondary` | Gray-600 (light) / Gray-300 (dark) |
| Button primary bg | `--color-brand` | Indigo-600 (light) / Indigo-400 (dark) |
| Empty state icon | `--color-ui-text-tertiary` | Muted color for illustration |

### Typography

| Element | Size | Weight | Token |
|---------|------|--------|-------|
| Page title | 24px | 700 | `text-2xl font-bold` |
| Page description | 14px | 400 | `text-sm` |
| Card title | 18px | 600 | `text-lg font-semibold` |
| Card description | 14px | 400 | `text-sm` |
| Card metadata | 12px | 400 | `text-xs` |
| Key badge | 12px | 500 | `text-xs font-medium` (mono) |
| Empty state title | 18px | 600 | `text-lg font-semibold` |
| Empty state description | 14px | 400 | `text-sm` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Grid gap | 24px | `gap-6` |
| Card padding | 24px | `p-6` |
| Card inner gap | 12px | `gap-3` |
| Header margin-bottom | 24px | `mb-6` |
| Load more margin-top | 32px | `mt-8` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Card | 12px | `rounded-xl` |
| Key badge | 6px | `rounded-md` |
| Button | 8px | `rounded-lg` |
| Avatar | 9999px | `rounded-full` |

### Shadows

| State | Value | Token |
|-------|-------|-------|
| Card default | `0 1px 3px rgba(0,0,0,0.1)` | `shadow-sm` |
| Card hover | `0 10px 25px rgba(0,0,0,0.1)` | `shadow-lg` |
| Card focus | Ring + shadow | `ring-2 ring-brand-ring` |

---

## Animations

### Page Entry Animation

```css
/* Staggered grid reveal */
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.project-card {
  animation: card-enter 0.3s ease-out backwards;
}

/* Stagger each card */
.project-card:nth-child(1) { animation-delay: 0ms; }
.project-card:nth-child(2) { animation-delay: 50ms; }
.project-card:nth-child(3) { animation-delay: 100ms; }
.project-card:nth-child(4) { animation-delay: 150ms; }
.project-card:nth-child(5) { animation-delay: 200ms; }
.project-card:nth-child(6) { animation-delay: 250ms; }
/* Continue pattern for more cards */
```

### Card Hover Animation

```css
.project-card {
  transition:
    transform 0.2s ease-out,
    box-shadow 0.2s ease-out,
    border-color 0.2s ease-out;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.08),
    0 4px 10px rgba(0, 0, 0, 0.04);
  border-color: var(--color-ui-border-focus);
}

.project-card:active {
  transform: translateY(0);
  transition-duration: 0.1s;
}
```

### Card Border Glow (Dark Mode Enhancement)

```css
/* Subtle glow on hover in dark mode */
.dark .project-card:hover {
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(99, 102, 241, 0.2); /* Indigo glow */
}
```

### Quick Actions Menu

```css
/* Fade in on hover */
.card-actions {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.project-card:hover .card-actions,
.project-card:focus-within .card-actions {
  opacity: 1;
  transform: translateY(0);
}
```

### Empty State Animation

```css
/* Subtle bounce for empty state icon */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.empty-state-icon {
  animation: float 3s ease-in-out infinite;
}
```

### Loading Skeleton Shimmer

```css
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

### Creation Feedback

```css
/* Success flash when project created */
@keyframes success-flash {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.project-card-new {
  animation: success-flash 0.6s ease-out;
}
```

---

## Implementation Checklist

### Phase 1: Card Component Enhancement

- [ ] Create `ProjectCard` component
  - [ ] Add project avatar/icon slot
  - [ ] Implement hover state with lift effect
  - [ ] Add subtle border glow on hover
  - [ ] Include metadata row (issues, board type, members)
  - [ ] Add keyboard focus ring
- [ ] Create `ProjectAvatar` component
  - [ ] Generate from project name (initials + color)
  - [ ] Support custom icon override
  - [ ] Multiple sizes (sm, md, lg)
- [ ] Create `MemberStack` component
  - [ ] Overlapping avatar display
  - [ ] +N overflow indicator
  - [ ] Tooltip with full list

### Phase 2: Grid & Layout Polish

- [ ] Update grid gap and card sizing
- [ ] Ensure consistent card heights (min-height or equal columns)
- [ ] Add responsive breakpoints (1, 2, 3 columns)
- [ ] Verify grid alignment on ultrawide displays
- [ ] Add max-width constraint for content area

### Phase 3: Empty State Upgrade

- [ ] Design/source custom illustration (folder + sparkles)
- [ ] Update typography hierarchy
- [ ] Add subtle floating animation to icon
- [ ] Ensure responsive centering
- [ ] Add secondary CTA (e.g., "Learn about projects" link)

### Phase 4: Animations

- [ ] Add entry animations (staggered card reveal)
- [ ] Implement card hover transitions
- [ ] Add focus state animations
- [ ] Create loading skeleton with shimmer
- [ ] Add creation success feedback animation

### Phase 5: Quick Actions

- [ ] Add three-dot menu to cards (hover reveal)
- [ ] Implement dropdown with actions:
  - [ ] Open Board
  - [ ] Project Settings
  - [ ] Archive Project
- [ ] Ensure keyboard accessibility for menu
- [ ] Add confirmation dialog for destructive actions

### Phase 6: Polish & Testing

- [ ] Test all hover states
- [ ] Verify dark mode appearance
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Add proper ARIA labels and roles
- [ ] Test with screen reader
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Responsive testing (mobile, tablet, desktop, ultrawide)
- [ ] Performance check (many projects scenario)

---

## Related Files

### Source References
- Current empty: `e2e/screenshots/05-empty-projects.png`
- Current filled: `e2e/screenshots/02-filled-projects.png`
- Project board: `e2e/screenshots/10-filled-project-demo-board.png`

### Implementation Files
- Route: `src/routes/_auth/_app/$orgSlug/projects/index.tsx`
- List component: `src/components/ProjectsList.tsx`
- Create modal: `src/components/CreateProjectFromTemplate.tsx`
- Layout: `src/components/layout/PageLayout.tsx`, `PageHeader.tsx`
- Card: `src/components/ui/Card.tsx`
- Empty state: `src/components/ui/EmptyState.tsx`
- Theme tokens: `src/index.css`

### Related Pages
- Dashboard: `pages/04-dashboard.md` (shows project widgets)
- Board: `pages/06-board.md` (project board view)
- Settings: `pages/12-settings.md` (project settings)

---

*Last Updated: 2026-02-05*
*Status: Specification Complete - Awaiting Implementation*
