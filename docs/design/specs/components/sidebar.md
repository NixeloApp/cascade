# Sidebar Component

> **Design System Documentation** | Component: Sidebar/Navigation
> **Last Updated**: 2026-02-05

---

## Visual Reference

### Mintlify Sidebar
- **Screenshot**: `docs/research/library/mintlify/dashboard/editor-full.png`
- **Characteristics**:
  - Clean white/light gray background
  - Subtle left border navigation indicator
  - Hierarchical tree structure with chevron toggles
  - Icon-only primary navigation (vertical rail on far left)
  - Expanded section shows nested items with indent
  - "Navigation" label at top with utility icons
  - Footer items pinned at bottom (settings gear)

### Nixelo Sidebar (Current)
- **Screenshot**: `e2e/screenshots/01-filled-dashboard.png`
- **Characteristics**:
  - Light sidebar background (`bg-ui-bg-sidebar`)
  - Organization name as header with collapse toggle
  - Icon + text navigation items
  - Collapsible sections (Documents, Workspaces)
  - Nested tree structure (Workspaces > Teams > Projects)
  - Active state uses indigo background highlight
  - Settings pinned at bottom with border separator

---

## Anatomy

```
+------------------------------------------+
|  SIDEBAR                                  |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  |  HEADER                            |  |
|  |  [Logo/Org Name]     [Collapse]    |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |  PRIMARY NAV                       |  |
|  |  [icon] Dashboard                  |  |  <-- NavItem
|  |  [icon] Issues                     |  |
|  |  [icon] Calendar                   |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |  COLLAPSIBLE SECTION               |  |
|  |  [v] [icon] Documents    [+]       |  |  <-- Section header
|  |      Templates                     |  |  <-- NavSubItem
|  |      ---                           |  |  <-- Divider
|  |      Meeting Notes                 |  |  <-- NavSubItem
|  |      Product Spec                  |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |  NESTED SECTION (Workspaces)       |  |
|  |  [v] [icon] Workspaces   [+]       |  |
|  |      [>] Engineering               |  |  <-- Workspace
|  |          [>] Frontend              |  |  <-- Team
|  |              PROJ-1 - Project      |  |  <-- Project
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |  FOOTER                            |  |
|  |  [icon] Settings                   |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

### Component Breakdown

| Area | Component | Description |
|------|-----------|-------------|
| **Header** | Org name + toggle | Brand area with collapse control |
| **Primary Nav** | `NavItem` | Top-level navigation items with icons |
| **Collapsible Section** | `CollapsibleSection` | Expandable groups with add button |
| **Sub Items** | `NavSubItem` | Nested navigation items |
| **Team Item** | `SidebarTeamItem` | Workspace/Team/Project hierarchy |
| **Footer** | `NavItem` | Settings and utilities pinned at bottom |

---

## States

### NavItem States

```
+------------------------------------------+
|  DEFAULT                                  |
+------------------------------------------+
|  [icon] Dashboard                         |
|  text-ui-text-secondary                   |
|  bg: transparent                          |
+------------------------------------------+

+------------------------------------------+
|  HOVER                                    |
+------------------------------------------+
|  [icon] Dashboard                         |
|  text-ui-text                             |
|  bg-ui-bg-secondary                       |
+------------------------------------------+

+------------------------------------------+
|  ACTIVE / SELECTED                        |
+------------------------------------------+
|  [icon] Dashboard                         |
|  text-brand-indigo-text                   |
|  bg-brand-indigo-track                    |
+------------------------------------------+

+------------------------------------------+
|  COLLAPSED (Icon only)                    |
+------------------------------------------+
|        [icon]                             |
|  Tooltip on hover: "Dashboard"            |
|  justify-center                           |
+------------------------------------------+
```

### Collapsible Section States

```
+------------------------------------------+
|  EXPANDED                                 |
+------------------------------------------+
|  [v] [icon] Documents         [+]         |
|      Templates                            |
|      ---                                  |
|      Meeting Notes                        |
|      Product Spec                         |
+------------------------------------------+

+------------------------------------------+
|  COLLAPSED                                |
+------------------------------------------+
|  [>] [icon] Documents         [+]         |
+------------------------------------------+

+------------------------------------------+
|  SIDEBAR COLLAPSED (Icon only)            |
+------------------------------------------+
|            [icon]                         |
|  Tooltip: "Documents"                     |
+------------------------------------------+
```

### Sidebar Collapsed State

```
EXPANDED (w-64)              COLLAPSED (w-16)
+------------------+         +--------+
| Nixelo E2E    [<]|         |   [>]  |
+------------------+         +--------+
| [H] Dashboard    |         |  [H]   |  <- Tooltip on hover
| [L] Issues       |         |  [L]   |
| [C] Calendar     |         |  [C]   |
| [v] Documents [+]|         |  [D]   |
|     Templates    |         |        |
|     Meeting      |         +--------+
| [v] Workspaces   |         |  [S]   |
|     Product      |         +--------+
+------------------+
| [S] Settings     |
+------------------+
```

---

## ASCII Layout: Full Structure

```
+================================================================+
|                        SIDEBAR (w-64 / w-16)                    |
+================================================================+
|                                                                 |
|  +-----------------------------------------------------------+  |
|  |  HEADER (p-4, border-b)                                   |  |
|  |                                                           |  |
|  |  [Organization Name]                    [Toggle Button]   |  |
|  |  <Typography variant="h3" className="text-lg font-bold">  |  |
|  |                                                           |  |
|  +-----------------------------------------------------------+  |
|                                                                 |
|  +-----------------------------------------------------------+  |
|  |  NAVIGATION (flex-1, overflow-y-auto, p-2)                |  |
|  |                                                           |  |
|  |  +-------------------------------------------------------+|  |
|  |  | NavItem: Dashboard                                    ||  |
|  |  | [Home] Dashboard                                      ||  |
|  |  | px-3 py-2 rounded-md gap-3                           ||  |
|  |  +-------------------------------------------------------+|  |
|  |                                                           |  |
|  |  +-------------------------------------------------------+|  |
|  |  | NavItem: Issues                                       ||  |
|  |  | [ListIcon] Issues                                     ||  |
|  |  +-------------------------------------------------------+|  |
|  |                                                           |  |
|  |  +-------------------------------------------------------+|  |
|  |  | NavItem: Calendar                                     ||  |
|  |  | [Calendar] Calendar                                   ||  |
|  |  +-------------------------------------------------------+|  |
|  |                                                           |  |
|  |  +-------------------------------------------------------+|  |
|  |  | CollapsibleSection: Documents                         ||  |
|  |  | +---------------------------------------------------+ ||  |
|  |  | | [v] [FileText] Documents             [+]          | ||  |
|  |  | +---------------------------------------------------+ ||  |
|  |  | | ml-4 mt-1                                         | ||  |
|  |  | | +-----------------------------------------------+ | ||  |
|  |  | | | NavSubItem: Templates                         | | ||  |
|  |  | | | [Copy] Templates                              | | ||  |
|  |  | | +-----------------------------------------------+ | ||  |
|  |  | | | --- (divider h-px bg-ui-border mx-2)          | | ||  |
|  |  | | +-----------------------------------------------+ | ||  |
|  |  | | | NavSubItem: Document 1                        | | ||  |
|  |  | | | Meeting Notes                                 | | ||  |
|  |  | | +-----------------------------------------------+ | ||  |
|  |  | +---------------------------------------------------+ ||  |
|  |  +-------------------------------------------------------+|  |
|  |                                                           |  |
|  |  +-------------------------------------------------------+|  |
|  |  | CollapsibleSection: Workspaces                        ||  |
|  |  | +---------------------------------------------------+ ||  |
|  |  | | [v] [FolderKanban] Workspaces        [+]          | ||  |
|  |  | +---------------------------------------------------+ ||  |
|  |  | | ml-2 group                                        | ||  |
|  |  | | +-----------------------------------------------+ | ||  |
|  |  | | | [>] Product     [+] (hover:opacity-100)       | | ||  |
|  |  | | +-----------------------------------------------+ | ||  |
|  |  | | | ml-4 (SidebarTeamItem)                        | | ||  |
|  |  | | | [>] Frontend                                  | | ||  |
|  |  | | |   ml-6 border-l (SidebarTeamProjects)         | | ||  |
|  |  | | |   PROJ-1 - Project Name                       | | ||  |
|  |  | | +-----------------------------------------------+ | ||  |
|  |  | +---------------------------------------------------+ ||  |
|  |  +-------------------------------------------------------+|  |
|  |                                                           |  |
|  |  +-------------------------------------------------------+|  |
|  |  | NavItem: Time Tracking (admin only)                   ||  |
|  |  | [Clock] Time Tracking                                 ||  |
|  |  +-------------------------------------------------------+|  |
|  |                                                           |  |
|  +-----------------------------------------------------------+  |
|                                                                 |
|  +-----------------------------------------------------------+  |
|  |  FOOTER (p-2, border-t)                                   |  |
|  |                                                           |  |
|  |  +-------------------------------------------------------+|  |
|  |  | NavItem: Settings                                     ||  |
|  |  | [Settings] Settings                                   ||  |
|  |  +-------------------------------------------------------+|  |
|  |                                                           |  |
|  +-----------------------------------------------------------+  |
|                                                                 |
+================================================================+
```

---

## Styling Tokens

### Background Colors

| Element | Token | Light Mode | Dark Mode |
|---------|-------|------------|-----------|
| Sidebar container | `bg-ui-bg-sidebar` | `#f8f9fb` | `gray-900` |
| Hover state | `bg-ui-bg-secondary` | `gray-50` | `gray-800` |
| Active state | `bg-brand-indigo-track` | `indigo-100` | `rgba(49,46,129,0.4)` |

### Text Colors

| Element | Token | Light Mode | Dark Mode |
|---------|-------|------------|-----------|
| Default text | `text-ui-text-secondary` | `gray-500` | `gray-300` |
| Hover text | `text-ui-text` | `gray-900` | `gray-50` |
| Active text | `text-brand-indigo-text` | `indigo-600` | `indigo-400` |
| Tertiary text | `text-ui-text-tertiary` | `gray-400` | `gray-400` |

### Border Colors

| Element | Token | Light Mode | Dark Mode |
|---------|-------|------------|-----------|
| Sidebar border | `border-ui-border` | `gray-200` | `gray-700` |
| Nested indicator | `border-ui-border` | `gray-200` | `gray-700` |

### Dimensions

| Element | Value | Token/Class |
|---------|-------|-------------|
| Sidebar expanded | `256px` | `w-64` |
| Sidebar collapsed | `64px` | `w-16` |
| NavItem height | `40px` | `py-2` |
| NavSubItem height | `32px` | `py-1.5` |
| Icon size | `20px` | `w-5 h-5` |
| Small icon | `16px` | `w-4 h-4` |
| Gap (icon to text) | `12px` | `gap-3` |
| Section indent | `16px` | `ml-4` |
| Nested indent | `24px` | `ml-6` |

### Icon Styling

| State | Color | Size |
|-------|-------|------|
| Default | `text-ui-text-secondary` | `w-5 h-5` |
| Active | `text-brand-indigo-text` | `w-5 h-5` |
| Chevron | `text-ui-text-tertiary` | `w-4 h-4` |
| Add button | `text-ui-text-tertiary` | `w-4 h-4` |

### Section Headers

```
+--------------------------------------------------+
|  [Chevron] [Icon] Section Name           [+]     |
|  h-6 w-6   w-5    text-sm font-medium   h-6 w-6  |
|  p-0.5     h-5    flex-1                p-1      |
|                                         opacity-0|
|                                         group-hover:opacity-100
+--------------------------------------------------+
```

---

## Animations

### Hover Transitions

```css
/* NavItem and NavSubItem */
.nav-item {
  transition: colors 0.2s ease-out;
}

/* Section hover reveal for add button */
.section-header {
  transition: opacity 0.2s ease-out;
}
.section-header .add-button {
  opacity: 0;
  transition: opacity 0.2s ease-out;
}
.section-header:hover .add-button {
  opacity: 1;
}
```

### Collapse/Expand Animation

```css
/* Sidebar width transition */
aside {
  transition: all 0.2s ease-in-out;
}

/* From expanded to collapsed */
.sidebar-expanded {
  width: 256px; /* w-64 */
}
.sidebar-collapsed {
  width: 64px; /* w-16 */
}
```

### Section Expand/Collapse

```css
/* Chevron rotation */
.chevron {
  transition: transform 0.15s ease-out;
}
.chevron-expanded {
  transform: rotate(0deg); /* ChevronDown */
}
.chevron-collapsed {
  transform: rotate(-90deg); /* ChevronRight */
}

/* Content reveal */
.section-content {
  transition: height 0.2s ease-out, opacity 0.15s ease-out;
}
```

### Active Indicator

```css
/* Current implementation: background highlight */
.nav-item-active {
  background: var(--color-brand-indigo-track);
  color: var(--color-brand-indigo-text);
}

/* Mintlify alternative: left border indicator */
.nav-item-active-border {
  border-left: 2px solid var(--color-brand);
  background: var(--color-ui-bg-secondary);
}
```

### Mobile Slide Animation

```css
/* Mobile overlay */
.sidebar-overlay {
  transition: opacity 0.2s ease-out;
}

/* Sidebar slide */
.sidebar-mobile {
  transition: transform 0.2s ease-in-out;
}
.sidebar-mobile-open {
  transform: translateX(0);
}
.sidebar-mobile-closed {
  transform: translateX(-100%);
}
```

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< lg` (1024px) | Sidebar hidden by default, toggle reveals overlay |
| `>= lg` | Sidebar visible, collapsible via toggle |

### Mobile Behavior

```
+------------------------------------------+
|  MOBILE (< 1024px)                        |
+------------------------------------------+
|                                          |
|  Default: Sidebar off-screen             |
|  transform: -translate-x-full            |
|                                          |
|  Open: Full overlay + slide-in           |
|  - Overlay: bg-ui-bg-overlay (50% black) |
|  - z-index: z-50 for sidebar             |
|  - z-index: z-40 for overlay             |
|                                          |
|  Close triggers:                         |
|  - Click overlay                         |
|  - Press Escape                          |
|  - Navigate to a new route               |
|                                          |
+------------------------------------------+
```

### Collapsed State (Desktop)

```
+------------------------------------------+
|  COLLAPSED (w-16)                         |
+------------------------------------------+
|                                          |
|  - Icons centered                        |
|  - Labels hidden                         |
|  - Tooltips on hover (side="right")      |
|  - Collapsible sections show icon only   |
|  - State persisted to localStorage       |
|  - Key: "sidebar-collapsed"              |
|                                          |
+------------------------------------------+
```

---

## Code Example

### Current Implementation (NavItem)

```tsx
// src/components/AppSidebar.tsx

type NavItemProps = Omit<LinkProps, "to"> & {
  to: LinkProps["to"];
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  "data-tour"?: string;
  onClick?: (event: React.MouseEvent) => void;
};

function NavItem({
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  "data-tour": dataTour,
  to,
  params,
  search,
  onClick,
  ...props
}: NavItemProps) {
  const content = (
    <Link
      to={to}
      params={params}
      search={search}
      onClick={onClick}
      {...props}
      data-tour={dataTour}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        "text-sm font-medium",
        isActive
          ? "bg-brand-indigo-track text-brand-indigo-text"
          : "text-ui-text-secondary hover:bg-ui-bg-secondary hover:text-ui-text",
        isCollapsed && "justify-center px-2",
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} side="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}
```

### Current Implementation (NavSubItem)

```tsx
// src/components/AppSidebar.tsx

type NavSubItemProps = Omit<LinkProps, "to"> & {
  to: LinkProps["to"];
  label: string;
  isActive: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: (event: React.MouseEvent) => void;
};

function NavSubItem({
  label,
  isActive,
  icon: Icon,
  to,
  params,
  onClick,
  ...props
}: NavSubItemProps) {
  return (
    <Link
      to={to}
      params={params}
      {...props}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm truncate transition-colors",
        isActive
          ? "bg-brand-indigo-track text-brand-indigo-text"
          : "text-ui-text-secondary hover:bg-ui-bg-secondary hover:text-ui-text",
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="truncate">{label}</span>
    </Link>
  );
}
```

### Sidebar State Hook

```tsx
// src/hooks/useSidebarState.tsx

const STORAGE_KEY = "sidebar-collapsed";

interface SidebarContextValue {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapse: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarState must be used within a SidebarProvider");
  }
  return context;
}
```

---

## Target Implementation (Mintlify-inspired Enhancements)

### Enhanced Active Indicator

```tsx
// Option 1: Left border indicator (Mintlify style)
<Link
  className={cn(
    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
    "text-sm font-medium",
    isActive
      ? "border-l-2 border-brand bg-ui-bg-secondary text-brand"
      : "text-ui-text-secondary hover:bg-ui-bg-secondary hover:text-ui-text",
  )}
>
```

### Smoother Section Animations

```tsx
// Add height animation for section expand/collapse
import { AnimatePresence, motion } from "framer-motion";

{isExpanded && (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: "auto", opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="overflow-hidden"
  >
    <Flex direction="column" gap="none" className="ml-4 mt-1">
      {children}
    </Flex>
  </motion.div>
)}
```

### Icon Rail (Future Enhancement)

```
+----------------------------------------------------------------+
|  ICON RAIL + EXPANDED PANEL (Mintlify pattern)                  |
+----------------------------------------------------------------+
|                                                                 |
|  +--------+------------------------------------------------+    |
|  | [icon] |  Navigation                    [+] [search]    |    |
|  |        |------------------------------------------------|    |
|  | [home] |  Documentation ->                              |    |
|  | [docs] |  Blog ->                                       |    |
|  | [team] |------------------------------------------------|    |
|  | [gear] |  [v] Guides                                    |    |
|  |        |      Getting started                           |    |
|  |        |      > Introduction                            |    |
|  |        |        Quickstart                              |    |
|  |        |        Development                             |    |
|  +--------+------------------------------------------------+    |
|                                                                 |
+----------------------------------------------------------------+
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus between nav items |
| `Enter` / `Space` | Activate nav item or toggle section |
| `Escape` | Close mobile sidebar |
| `Arrow Down` | Move to next item (within section) |
| `Arrow Up` | Move to previous item |
| `Arrow Right` | Expand section |
| `Arrow Left` | Collapse section |

### ARIA Attributes

```tsx
// Collapse toggle button
<Button
  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
  aria-expanded={!isCollapsed}
/>

// Section toggle
<Button
  aria-expanded={isExpanded}
  aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
/>

// Navigation landmark
<nav aria-label="Main navigation">

// Mobile overlay
<button
  aria-label="Close sidebar"
  onKeyDown={(e) => e.key === "Escape" && closeMobile()}
/>
```

### Focus Management

- Focus trap within mobile sidebar when open
- Restore focus to trigger when sidebar closes
- Visible focus indicators on all interactive elements
- Skip link to main content

---

## Related Files

| File | Purpose |
|------|---------|
| `src/components/AppSidebar.tsx` | Main sidebar component |
| `src/components/sidebar/SidebarTeamItem.tsx` | Nested team/project navigation |
| `src/hooks/useSidebarState.tsx` | Collapse/mobile state management |
| `src/routes/_auth/_app/$orgSlug/route.tsx` | Layout using sidebar |

---

## Comparison: Mintlify vs Nixelo

| Aspect | Mintlify | Nixelo Current | Recommendation |
|--------|----------|----------------|----------------|
| **Active indicator** | Left border + subtle bg | Indigo background | Consider border option |
| **Section toggles** | Inline chevrons | Separate button | Keep current |
| **Add buttons** | Not visible | Hover reveal | Good pattern |
| **Nesting** | Deep tree (3+ levels) | 3 levels | Matches |
| **Collapsed state** | Icon rail + panel | Icon-only sidebar | Current is simpler |
| **Animations** | Smooth height transitions | CSS transitions | Add framer-motion |
| **Typography** | Slightly smaller | text-sm | Matches |
| **Icons** | Outline style | Lucide outline | Matches |

---

## Implementation Checklist

- [x] Basic sidebar structure
- [x] Collapsible sections
- [x] Nested navigation (3 levels)
- [x] Mobile responsive with overlay
- [x] Collapse/expand persistence
- [x] Tooltips in collapsed state
- [x] Active state highlighting
- [ ] Smooth height animations (framer-motion)
- [ ] Keyboard arrow navigation within sections
- [ ] Left border active indicator option
- [ ] Icon rail variant (future)
- [ ] Search in sidebar (future)

---

*This document is part of the Nixelo Design System. See [MASTER_PLAN.md](../MASTER_PLAN.md) for the full design system overview.*
