# Dashboard Page

> **Design System Documentation** | Last Updated: 2026-02-05
> **Source Material**: Mintlify dashboard screenshots, Nixelo E2E captures

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Target State (Mintlify-Inspired)](#target-state-mintlify-inspired)
3. [ASCII Wireframe](#ascii-wireframe)
4. [Functionality Breakdown](#functionality-breakdown)
5. [Component Inventory](#component-inventory)
6. [Design Tokens Used](#design-tokens-used)
7. [Animations](#animations)
8. [Implementation Checklist](#implementation-checklist)

---

## Current State Analysis

**Screenshots**:
- Filled: `e2e/screenshots/01-filled-dashboard.png`
- Empty: `e2e/screenshots/04-empty-dashboard.png`

### Layout Structure

The current Nixelo dashboard uses a three-column layout:

```
+------------------+----------------------------------------+------------------+
|    SIDEBAR       |           MAIN CONTENT                 |  RIGHT SIDEBAR   |
|    (200px)       |           (flexible)                   |    (320px)       |
+------------------+----------------------------------------+------------------+
```

### Current Elements

#### Header Area
- **Logo**: "Nixelo E2E" with sidebar toggle icon
- **Top Bar**: Commands (Cmd+K), Start Timer button, Search (Cmd+K), Notifications bell, User avatar

#### Left Sidebar Navigation
- Dashboard (active - highlighted with indigo background)
- Issues
- Calendar
- Documents (expandable)
  - Templates
- Workspaces (expandable)
  - Product
- Time Tracking
- Settings (bottom)

#### Main Content Area

**Greeting Section**:
- Large italic heading: "Good evening, **Emily**." (or "there" for anonymous)
- Subtext: "1 task completed this week." (or "Here's your overview for today.")
- Top right: "Customize" button with settings icon

**Focus Item Card** (when data exists):
- Section label: "FOCUS ITEM"
- Card with:
  - Priority badge (e.g., "HIGHEST" in orange)
  - Issue key (e.g., "DEMO-2")
  - Issue title: "Fix login timeout on mobile"
  - Project reference: "In project: Demo Project"
  - "View Task ->" link

**Overview Stats** (4-card grid):
- Section label: "OVERVIEW"
- **Active Load**: "4 Assigned tasks"
- **Velocity**: "1 Done this week" (with progress bar)
- **Attention Needed**: "3 High Priority" (orange text)
- **Contribution**: "6 Reported issues"

**Feed Section**:
- Title: "Feed"
- Subtitle: "Track your active contributions"
- Tab navigation: ASSIGNED (4) | CREATED (6)
- Issue list with:
  - Issue key + Priority badge
  - Issue title
  - Project name + Status badge

#### Right Sidebar

**Workspaces Panel**:
- Title: "Workspaces"
- Subtitle: "1 active project"
- Project card: "Demo Project" with ADMIN badge, "4 ASSIGNED ISSUES"

**Feed Panel** (secondary):
- Title: "Feed"
- Subtitle: "Latest updates across all projects"
- Empty state: Chart icon, "No activity" message

### Issues Identified

1. **Card borders too visible** - Current borders are prominent gray (`border-ui-border`)
2. **Background not dark enough** - Using `gray-900` instead of near-black
3. **Greeting typography** - Good italic treatment, but could use more hierarchy
4. **Stats cards** - Lack visual depth, borders feel heavy
5. **Empty states** - Functional but not delightful
6. **Right sidebar** - Cards blend together, need more separation
7. **Tab styling** - Underline indicator could be more refined

---

## Target State (Mintlify-Inspired)

**Reference**: `docs/research/library/mintlify/dashboard/dashboard-overview.png`

### Mintlify Dashboard Characteristics

From the Mintlify dashboard screenshots, we can extract these design principles:

#### Background & Surface
- **Near-black background**: `#08090a` or gradient from dark
- **Subtle card backgrounds**: `rgba(255,255,255,0.03)` - barely visible
- **Very subtle borders**: `rgba(255,255,255,0.05-0.07)`

#### Typography & Hierarchy
- **Personalized greeting**: "Good morning, Agent" - clean sans-serif, not italic
- **Subtitle**: "Welcome back to your docs dashboard" - muted gray
- **Card labels**: Uppercase, smaller, muted text

#### Cards & Panels
- **Preview card**: Large thumbnail with rounded corners
- **Status badges**: "Live" with green dot indicator
- **Meta info**: "Last updated 1 minute ago by mintlify-bot"
- **Action buttons**: Icon buttons (copy, refresh) + "Visit site" button

#### Activity Feed
- **Table layout**: Activity | Status | Changes columns
- **Toggle**: "Live" vs "Previews" segment control
- **Status badges**: Green "Successful" with checkmark
- **Expandable rows**: Chevron to show details

#### Left Sidebar (Mintlify)
- Clean vertical navigation
- Section labels: "Products" (uppercase, muted)
- Icon + text items
- "New" badges on items (e.g., "Editor New")
- Floating promo card at bottom (Agent Suggestions)
- Footer icons: Chat, Settings, Theme toggle, Logout

### Key Polish Opportunities for Nixelo

1. **Darker background** - Adopt near-black for premium feel
2. **Softer borders** - Reduce opacity to 5-10%
3. **Better card hierarchy** - Focus item should stand out more
4. **Activity table** - Convert feed to table layout
5. **Status indicators** - Add live/status dots
6. **Promo/feature cards** - Floating card for new features
7. **Micro-interactions** - Hover lifts, smooth transitions

---

## ASCII Wireframe

### Full Dashboard Layout

```
+================================================================================+
|  HEADER BAR (64px)                                                             |
|  +--logo--+                      [Commands] [Timer] [Search] [Bell] [Avatar]   |
+================================================================================+
|          |                                                        |            |
| SIDEBAR  |  MAIN CONTENT                                          | RIGHT      |
| (200px)  |                                                        | SIDEBAR    |
|          |  Dashboard                                  [Customize]| (320px)    |
| +------+ |                                                        |            |
| |[Home]| |  +----------------------------------------------------+| +--------+ |
| |Dashbd| |  |                                                    || |Workspcs| |
| +------+ |  |  Good evening, Emily.                              || |1 active| |
| |Issues | |  |  1 task completed this week.                       || |        | |
| |Calend | |  |                                                    || |+------+| |
| |Docs  v| |  +----------------------------------------------------+| ||Demo  || |
| | Templ | |                                                        | ||Proj  || |
| |Worksp v| |  FOCUS ITEM                           OVERVIEW        | ||ADMIN || |
| | Produc| |  +------------------------+  +------------------------+| |+------+| |
| |Time Tk| |  | [HIGHEST]    DEMO-2    |  | ACTIVE     | VELOCITY  || +--------+ |
| |       | |  |                        |  | LOAD       |           || |        | |
| |       | |  | Fix login timeout on   |  | 4 Assigned | 1 Done    || | Feed   | |
| |       | |  | mobile                 |  | tasks      | this week || | Latest | |
| |       | |  |                        |  +------------+-----------+| |        | |
| |       | |  | In project: Demo Proj  |  | ATTENTION  | CONTRI-   || |+------+| |
| |       | |  |                        |  | NEEDED     | BUTION    || ||      || |
| |       | |  | View Task ->           |  | 3 High     | 6 Reported|| ||NoActy|| |
| |       | |  +------------------------+  | Priority   | issues    || ||      || |
| |       | |                              +------------+-----------+| |+------+| |
| |       | |                                                        | |        | |
| |       | |  Feed                                                  | |        | |
| |       | |  Track your active contributions                       | |        | |
| |       | |  +----------------------------------------------------+| |        | |
| |       | |  | [ASSIGNED (4)]  CREATED (6)                        || |        | |
| |       | |  +----------------------------------------------------+| |        | |
| |       | |  | DEMO-5  [HIGH]                                     || |        | |
| |       | |  | Database query optimization                        || |        | |
| |       | |  | DEMO PROJECT - IN-PROGRESS                         || |        | |
| |       | |  +----------------------------------------------------+| |        | |
| |       | |  | DEMO-3  [MEDIUM]                                   || |        | |
| |       | |  | Design new dashboard layout                        || |        | |
| |       | |  | DEMO PROJECT - IN-REVIEW                           || |        | |
| |       | |  +----------------------------------------------------+| |        | |
| |       | |  | DEMO-2  [HIGHEST]                                  || |        | |
| |       | |  | Fix login timeout on mobile                        || |        | |
| |       | |  | DEMO PROJECT - IN-PROGRESS                         || |        | |
| |       | |  +----------------------------------------------------+| |        | |
| |       | |  | DEMO-1  [HIGH]                                     || |        | |
| |       | |  | Set up CI/CD pipeline                              || |        | |
| +------+ |  | DEMO PROJECT - DONE                                 || |        | |
| [Settngs]|  +----------------------------------------------------+| |        | |
+----------+--------------------------------------------------------+-+--------+-+
```

### Focus Item Card Detail

```
+----------------------------------------------------------+
|  FOCUS ITEM                                               |
+----------------------------------------------------------+
|                                                           |
|  +-----------------------------------------------------+ |
|  |  +----------+                          DEMO-2       | |
|  |  | HIGHEST  |                                       | |
|  |  +----------+                                       | |
|  |                                                     | |
|  |  Fix login timeout on mobile                        | |
|  |                                                     | |
|  |  In project: Demo Project                           | |
|  |                                                     | |
|  |                              View Task ->           | |
|  +-----------------------------------------------------+ |
|                                                           |
+----------------------------------------------------------+
```

### Overview Stats Grid

```
+----------------------------------------------------------+
|  OVERVIEW                                                 |
+----------------------------------------------------------+
|                                                           |
|  +-------------+  +-------------+  +-------------+  +---+ |
|  | ACTIVE LOAD |  | VELOCITY    |  | ATTENTION   |  |CON| |
|  |             |  |             |  | NEEDED      |  |TRI| |
|  |    4        |  |    1        |  |    3        |  | 6 | |
|  | Assigned    |  | Done this   |  | High        |  |Rep| |
|  | tasks       |  | week        |  | Priority    |  |ort| |
|  |             |  | [===-----]  |  |             |  |ed | |
|  +-------------+  +-------------+  +-------------+  +---+ |
|                                                           |
+----------------------------------------------------------+
```

### Feed List Item

```
+----------------------------------------------------------+
|  DEMO-5   [HIGH]                                          |
|  Database query optimization                              |
|  DEMO PROJECT - IN-PROGRESS                               |
+----------------------------------------------------------+
     ^         ^              ^              ^
     |         |              |              |
 Issue Key  Priority       Title         Project + Status
            Badge
```

### Empty State (No Projects)

```
+----------------------------------------------------------+
|                                                           |
|                      +--------+                           |
|                      |  [?]   |                           |
|                      +--------+                           |
|                                                           |
|                    No projects                            |
|          You're not a member of any projects yet          |
|                                                           |
|                  [Go to Workspaces]                       |
|                                                           |
+----------------------------------------------------------+
```

---

## Functionality Breakdown

### Header Bar
- [ ] **Logo/Brand**: Click navigates to dashboard
- [ ] **Sidebar Toggle**: Collapse/expand left sidebar
- [ ] **Commands**: Opens command palette (Cmd+K)
- [ ] **Start Timer**: Quick time tracking start
- [ ] **Search**: Global search (Cmd+K)
- [ ] **Notifications**: Bell icon with unread count badge
- [ ] **User Avatar**: Dropdown with profile, settings, logout

### Left Sidebar Navigation
- [ ] **Dashboard**: Home view (current)
- [ ] **Issues**: All issues across projects
- [ ] **Calendar**: Calendar view with events
- [ ] **Documents**: Expandable section
  - [ ] Templates: Document templates
- [ ] **Workspaces**: Expandable section
  - [ ] Individual workspace items
- [ ] **Time Tracking**: Time entries and reports
- [ ] **Settings**: App settings (footer position)

### Main Content - Greeting
- [ ] **Time-aware greeting**: Good morning/afternoon/evening
- [ ] **User name display**: Personalized with first name
- [ ] **Weekly summary**: Tasks completed count
- [ ] **Customize button**: Opens dashboard customization

### Main Content - Focus Item
- [ ] **Priority display**: Color-coded badge
- [ ] **Issue key**: Clickable link to issue
- [ ] **Issue title**: Main heading
- [ ] **Project reference**: Link to project
- [ ] **View Task action**: Navigate to issue detail

### Main Content - Overview Stats
- [ ] **Active Load**: Count of assigned incomplete tasks
- [ ] **Velocity**: Tasks completed this week with progress
- [ ] **Attention Needed**: High priority items count
- [ ] **Contribution**: Total issues reported

### Main Content - Feed
- [ ] **Tab switching**: Assigned vs Created
- [ ] **Issue list**: Scrollable list of issues
- [ ] **Issue cards**: Clickable to navigate
- [ ] **Priority badges**: Visual priority indicator
- [ ] **Status display**: Current workflow state
- [ ] **Infinite scroll**: Load more on scroll

### Right Sidebar - Workspaces
- [ ] **Workspace count**: Active projects summary
- [ ] **Workspace cards**: Clickable project links
- [ ] **Role badge**: Admin/Editor/Viewer
- [ ] **Issue count**: Assigned issues per workspace

### Right Sidebar - Activity Feed
- [ ] **Activity stream**: Latest actions across projects
- [ ] **Empty state**: When no recent activity

---

## Component Inventory

### Cards

| Component | Location | Current Implementation | Polish Notes |
|-----------|----------|----------------------|--------------|
| Focus Item Card | Main content | `Card` with border | Reduce border, add subtle shadow |
| Stats Card | Overview grid | `Card` with border | Softer background, smaller border |
| Issue Card | Feed list | `Card` or `div` | Add hover lift effect |
| Workspace Card | Right sidebar | `Card` | Add role badge styling |
| Empty State Card | Various | `EmptyState` component | Add illustration, softer text |

### Stats Display

| Component | Data | Current | Polish Notes |
|-----------|------|---------|--------------|
| Stat Number | 4, 1, 3, 6 | Large text | Add subtle animation on load |
| Stat Label | "Assigned tasks" | Muted text | Use `text-ui-text-secondary` |
| Progress Bar | Velocity | Linear bar | Match brand color, smoother |
| Alert Badge | "ATTENTION NEEDED" | Orange text | Use `text-status-warning` |

### Lists

| Component | Data | Current | Polish Notes |
|-----------|------|---------|--------------|
| Issue List | Feed items | Stacked cards | Add dividers, hover states |
| Workspace List | Projects | Cards | Consistent spacing |
| Activity Feed | Events | Simple list | Convert to table or timeline |

### Tabs

| Component | Location | Current | Polish Notes |
|-----------|----------|---------|--------------|
| Feed Tabs | Feed section | Underline tabs | Add count badges, smooth indicator |

### Navigation

| Component | Location | Current | Polish Notes |
|-----------|----------|---------|--------------|
| Sidebar Nav | Left | Icon + text items | Add section headers, highlight active |
| Collapsible | Docs, Workspaces | Chevron toggle | Add smooth expand/collapse |

### Badges

| Component | Usage | Variants | Polish Notes |
|-----------|-------|----------|--------------|
| Priority Badge | Issues | HIGHEST, HIGH, MEDIUM, LOW | Color-coded backgrounds |
| Status Badge | Issues | Various workflow states | Outline or pill style |
| Role Badge | Workspaces | ADMIN, EDITOR, VIEWER | Uppercase, muted |
| Count Badge | Tabs | "(4)" | Inside parentheses or pill |

---

## Design Tokens Used

### Background Colors

| Element | Current Token | Target Token | Notes |
|---------|---------------|--------------|-------|
| Page background | `bg-ui-bg` | `bg-ui-bg` | Consider darker in dark mode |
| Card background | `bg-ui-bg-elevated` | `bg-ui-bg-elevated` | More transparent in dark |
| Sidebar background | `bg-ui-bg-sidebar` | `bg-ui-bg-sidebar` | Keep current |
| Hover states | `hover:bg-ui-bg-secondary` | `hover:bg-ui-bg-soft` | Subtler hover |

### Border Colors

| Element | Current Token | Target Token | Notes |
|---------|---------------|--------------|-------|
| Card borders | `border-ui-border` | `border-ui-border-subtle` | Reduce visibility |
| Section dividers | `border-ui-border` | `border-ui-border-surface` | Nearly invisible |
| Active tab | `border-brand` | `border-brand` | Keep brand color |

### Text Colors

| Element | Current Token | Target Token | Notes |
|---------|---------------|--------------|-------|
| Greeting heading | `text-ui-text` | `text-ui-text` | Primary |
| User name | `text-brand` | `text-brand` | Brand accent |
| Subtext | `text-ui-text-secondary` | `text-ui-text-secondary` | Secondary |
| Card labels | `text-ui-text-tertiary` | `text-ui-text-muted` | More muted |
| Stat numbers | `text-ui-text` | `text-ui-text` | Primary, large |
| Stat labels | `text-ui-text-secondary` | `text-ui-text-secondary` | Secondary |

### Brand Colors

| Element | Current Token | Notes |
|---------|---------------|-------|
| User name | `text-brand` | Indigo accent |
| Active nav item | `bg-brand-subtle` | Subtle indigo bg |
| Tab indicator | `border-brand` | Brand underline |
| Progress bar | `bg-brand` | Brand fill |
| Primary buttons | `bg-brand` | Brand background |

### Status Colors

| Element | Token | Notes |
|---------|-------|-------|
| HIGHEST priority | `bg-status-error-bg` + `text-status-error-text` | Red/orange |
| HIGH priority | `bg-status-warning-bg` + `text-status-warning-text` | Amber |
| MEDIUM priority | `bg-status-info-bg` + `text-status-info-text` | Blue |
| LOW priority | `bg-ui-bg-secondary` + `text-ui-text-secondary` | Neutral |
| Attention text | `text-status-warning` | Orange text |

### Typography Tokens

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Greeting | `text-4xl` | 400 italic | Large, welcoming |
| User name | `text-4xl` | 700 italic | Bold, branded |
| Section labels | `text-xs` | 500 uppercase | "FOCUS ITEM", "OVERVIEW" |
| Card titles | `text-lg` | 500 | Issue titles |
| Stat numbers | `text-3xl` | 700 | Large numbers |
| Stat labels | `text-sm` | 400 | Descriptions |

### Spacing Tokens

| Element | Token | Value |
|---------|-------|-------|
| Page padding | `p-6` | 24px |
| Card padding | `p-4` | 16px |
| Card gap | `gap-4` | 16px |
| Stats grid gap | `gap-4` | 16px |
| Section spacing | `space-y-6` | 24px between sections |
| List item spacing | `space-y-2` | 8px between items |

### Shadow Tokens

| Element | Current | Target | Notes |
|---------|---------|--------|-------|
| Cards | None or subtle | `shadow-card` | Add depth |
| Card hover | None | `shadow-card-hover` | Lift effect |
| Elevated panels | `shadow-md` | `shadow-elevated` | Right sidebar |

---

## Animations

### Card Hover

```
State: Default -> Hover -> Default
+----------------+     +----------------+     +----------------+
|   +--------+   | --> |   +--------+   | --> |   +--------+   |
|   |  Card  |   |     |   |  Card  | ^ |     |   |  Card  |   |
|   +--------+   |     |   +--------+ 2px     |   +--------+   |
+----------------+     +----------------+     +----------------+
     (flat)              (lifted, shadow)          (flat)
```

**Implementation**:
```css
.card-hover {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
```

### Tab Switching

```
ASSIGNED (4)  CREATED (6)      ASSIGNED (4)  CREATED (6)
[=========]   -----------  ->  -----------   [=========]
    ^                                             ^
 underline                                    underline
 slides to                                    new position
```

**Implementation**:
```css
.tab-indicator {
  transition: transform 0.2s ease-out, width 0.2s ease-out;
}
```

### Data Loading (Stats)

```
Frame 0: Skeleton     Frame 1: Number fades in    Frame 2: Final
+-------------+       +-------------+              +-------------+
| [▓▓▓▓▓▓▓]   |  -->  |     4       |    -->       |      4      |
| [▓▓▓▓▓▓▓▓]  |       | Assigned... |              | Assigned    |
+-------------+       +-------------+              +-------------+
```

**Implementation**:
```css
.stat-value {
  animation: fade-in 0.3s ease-out;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Staggered Entry (Feed Items)

```
T=0ms     T=50ms    T=100ms   T=150ms   T=200ms
+---+     +---+     +---+     +---+     +---+
|   | --> | 1 | --> | 1 | --> | 1 | --> | 1 |
+---+     +---+     +---+     +---+     +---+
|   |     |   |     | 2 |     | 2 |     | 2 |
+---+     +---+     +---+     +---+     +---+
|   |     |   |     |   |     | 3 |     | 3 |
+---+     +---+     +---+     +---+     +---+
|   |     |   |     |   |     |   |     | 4 |
+---+     +---+     +---+     +---+     +---+
```

**Implementation**:
```css
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
```

### Sidebar Collapse/Expand

```
Expanded (200px)           Collapsing              Collapsed (64px)
+------------------+       +----------+            +------+
| [Logo] Nixelo    |  -->  | [Logo]   |   -->      | [L]  |
| [H] Dashboard    |       | [H] Dash |            | [H]  |
| [I] Issues       |       | [I] Issu |            | [I]  |
| [C] Calendar     |       | [C] Cal  |            | [C]  |
+------------------+       +----------+            +------+
```

**Implementation**:
```css
.sidebar {
  transition: width 0.2s ease-out;
}
.sidebar-collapsed {
  width: 64px;
}
```

---

## Implementation Checklist

### Phase 1: Foundation (Background & Borders)

- [ ] Update dark mode background to near-black (`#0a0a0b` or `var(--p-gray-950)`)
- [ ] Add `--color-ui-border-subtle` token (5-7% opacity)
- [ ] Add `--color-ui-border-surface` token (3-5% opacity)
- [ ] Apply subtler borders to all dashboard cards
- [ ] Update card backgrounds for better transparency in dark mode

### Phase 2: Cards & Panels

- [ ] Polish Focus Item card
  - [ ] Reduce border visibility
  - [ ] Add subtle shadow
  - [ ] Improve priority badge styling
  - [ ] Add hover lift effect
- [ ] Polish Overview Stats cards
  - [ ] Consistent sizing (equal height)
  - [ ] Better number typography
  - [ ] Improve progress bar styling
  - [ ] Add loading skeleton states
- [ ] Polish Workspace cards
  - [ ] Improve role badge styling
  - [ ] Add assigned count styling

### Phase 3: Feed Section

- [ ] Improve tab styling
  - [ ] Add smooth indicator transition
  - [ ] Better count badge styling
- [ ] Polish issue list items
  - [ ] Add hover states
  - [ ] Improve priority badge alignment
  - [ ] Better status badge styling
  - [ ] Add dividers between items
- [ ] Add staggered entry animation

### Phase 4: Empty States

- [ ] Update empty state illustrations
- [ ] Softer text colors
- [ ] Improve CTA button styling
- [ ] Add subtle entrance animation

### Phase 5: Right Sidebar

- [ ] Better panel separation
- [ ] Polish workspace cards
- [ ] Improve activity feed layout
- [ ] Add "No activity" illustration

### Phase 6: Micro-interactions

- [ ] Card hover lift effects
- [ ] Tab indicator smooth transition
- [ ] Button hover/active states
- [ ] Link hover transitions
- [ ] Focus states for keyboard navigation

### Phase 7: Loading States

- [ ] Skeleton loading for greeting
- [ ] Skeleton loading for stats
- [ ] Skeleton loading for feed items
- [ ] Skeleton loading for workspace cards
- [ ] Smooth skeleton-to-content transition

### Phase 8: Responsive Adjustments

- [ ] Mobile: Stack right sidebar below main content
- [ ] Mobile: Collapse overview to 2x2 grid
- [ ] Tablet: Narrow right sidebar
- [ ] Wide: Max content width constraint

---

## Visual Reference Files

### Nixelo Current State
- `e2e/screenshots/01-filled-dashboard.png` - Full dashboard with data
- `e2e/screenshots/04-empty-dashboard.png` - Empty state view

### Mintlify Inspiration
- `docs/research/library/mintlify/dashboard/dashboard-overview.png` - Main dashboard
- `docs/research/library/mintlify/dashboard/analytics.png` - Stats cards style
- `docs/research/library/mintlify/dashboard/editor-full.png` - Editor/panel layout
- `docs/research/library/mintlify/dashboard/settings-domain-setup.png` - Settings layout

---

## Related Documentation

- [MASTER_PLAN.md](../MASTER_PLAN.md) - Overall design system roadmap
- [colors.md](../tokens/colors.md) - Color token reference
- [animations.md](../tokens/animations.md) - Animation system reference

---

*This document is part of the Nixelo Design System. See [MASTER_PLAN.md](../MASTER_PLAN.md) for the full design system overview.*
