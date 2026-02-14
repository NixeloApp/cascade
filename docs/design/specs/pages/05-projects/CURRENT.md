# Projects List Page - Current State

> **Route**: `/:slug/projects`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: Run `pnpm screenshots` to regenerate

---

## Screenshots

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Filled | ![](screenshots/desktop-dark-filled.png) |
| Desktop | Empty | ![](screenshots/desktop-dark-empty.png) |

---

## Structure

Standard page layout with responsive grid:

```
+------------------+------------------------------------------------------------+
|     SIDEBAR      |                    MAIN CONTENT                            |
|     (200px)      |                    (flexible)                              |
+------------------+------------------------------------------------------------+
```

### Full Layout (Filled State)

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

### Empty State

```
+--------------------------------------------------------------------------------+
|                                                                                |
|                                                                                |
|                           +------------------+                                 |
|                           |                  |                                 |
|                           |   [Folder Emoji] |                                 |
|                           |       📁         |                                 |
|                           |                  |                                 |
|                           +------------------+                                 |
|                                                                                |
|                            No projects yet                                     |
|                          (18px, font-weight 600)                               |
|                                                                                |
|                 Create your first project to organize work                     |
|                           (14px, muted text)                                   |
|                                                                                |
|                        [ + Create Project ]                                    |
|                          (primary button)                                      |
|                                                                                |
+--------------------------------------------------------------------------------+
```

---

## Current Elements

### Page Header
- **Title**: "Projects" (24px, bold, dark text)
- **Description**: "Manage your projects and initiatives" (14px, muted gray)
- **Action**: "+ Create Project" button (primary, brand color)
- Standard `PageLayout` wrapper with sidebar visible

### Project Cards
- **Layout**: 3-column responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- **Card background**: White with subtle border
- **Padding**: `p-6` (24px)
- **Hover state**: `shadow-lg` transition
- **Content structure**:
  - Row 1: Project name (h3) + Key badge (inline code style)
  - Row 2: Description (secondary text, `line-clamp-2`)
  - Row 3: Issue count + Board type (muted, small text)

### Project Card Detail

```
+--------------------------------------------------+
|                                                  |
|   Project Name                         [KEY]     |
|   ~~~~~~~~~~~~~                        (badge)   |
|                                                  |
|   Description text that can span multiple        |
|   lines but gets truncated after two...          |
|                                                  |
|   12 issues   |   kanban                         |
|   (muted)         (board type)                   |
|                                                  |
+--------------------------------------------------+
```

### Pagination
- "Load More Projects" button (outline variant)
- Initial load: 20 items

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/_auth/_app/$orgSlug/projects/index.tsx` | Route definition | ~100 |
| `src/components/ProjectsList.tsx` | Project list component | ~150 |
| `src/components/CreateProjectFromTemplate.tsx` | Create modal | ~200 |
| `src/components/layout/PageLayout.tsx` | Layout wrapper | ~100 |
| `src/components/layout/PageHeader.tsx` | Header component | ~50 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Cards lack visual depth | Project cards | HIGH |
| 2 | No project avatars/icons | Card header | MEDIUM |
| 3 | Grid feels sparse | Card spacing | MEDIUM |
| 4 | Empty state icon dated | EmptyState | MEDIUM |
| 5 | No quick actions on cards | Card hover | LOW |
| 6 | No filtering/sorting | Page header | LOW |
| 7 | Load more button placement | Pagination | LOW |
| 8 | Key badge styling inconsistent | Card header | LOW |

---

## Component Details

### PageHeader Component

```
+------------------------------------------------------------------+
|  Projects                                    [ + Create Project ] |
|  Manage your projects and initiatives                             |
+------------------------------------------------------------------+
```

### Project Card Structure

```
+--------------------------------------------------+
|  p-6 padding                                     |
|                                                  |
|  +--------------------------------------------+  |
|  | h3: Project Name              [KEY badge]  |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | p: Description text with line-clamp-2...   |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | span: 12 issues  |  span: kanban           |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

---

## Summary

The projects page is functional but needs polish:
- Cards lack premium visual depth (no shadows, no hover lift)
- No project identity (avatars/icons)
- Empty state uses dated emoji icon
- Missing quick actions and filtering
- Key badge styling inconsistent with design system
