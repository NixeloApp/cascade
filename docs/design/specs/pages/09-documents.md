# Documents Page

> **Status**: TODO - Awaiting Implementation
> **Priority**: HIGH (Phase 2 - Core Features)

---

## Current State Analysis

**Screenshots**:
- `e2e/screenshots/04-filled-documents.png` (Documents section expanded)
- `e2e/screenshots/07-empty-documents.png` (Documents empty state)
- `e2e/screenshots/05-filled-documents-templates.png` (Templates view)

### Visual Description (Current Nixelo)

The current Documents page features:

1. **Layout**: Two-panel design with sidebar navigation and main content area
2. **Sidebar Navigation**:
   - Documents section with chevron expander
   - Templates sub-item (nested under Documents)
   - Workspaces section with "Product" workspace nested
   - Other nav items: Dashboard, Issues, Calendar, Time Tracking, Settings
   - Sidebar toggle button at top right
3. **Main Content Area**:
   - Page header: "Documents" title with subtitle "Create and manage documents"
   - Empty state: Centered document icon (purple/lavender), "Welcome to your project" heading, "Select a document from the sidebar or create a new one to get started." subtext
4. **Templates View**:
   - Header: "Document Templates" with "+ New Template" button (brand color)
   - Category tabs: All Templates, Meetings, Planning, Engineering, Design, Other
   - Empty state: Document icon, "No templates yet", "Create templates to speed up document creation", CTA button "Create Your First Template"
5. **Global Elements**: Header with "Nixelo E2E" branding, Commands, Start Timer, Search, Help, Notifications, Avatar

### Issues Identified

| Issue | Severity | Notes |
|-------|----------|-------|
| No document tree hierarchy visible | HIGH | Documents not shown in sidebar tree |
| Empty state lacks visual engagement | HIGH | Static icon, no animation or depth |
| Templates tabs feel flat | MEDIUM | No visual distinction for selected state |
| Sidebar lacks search within documents | MEDIUM | Must use global search |
| No drag-and-drop visual cues | MEDIUM | No affordance for reordering |
| Missing quick actions on hover | LOW | No inline create/options buttons |
| No recent documents section | LOW | No quick access to recent items |
| Workspaces section underutilized | LOW | Could show document counts |

---

## Target State

**References**:
- `docs/research/library/mintlify/docs_desktop_dark.png` (Navigation sidebar)
- `docs/research/library/mintlify/docs_desktop_light.png` (Light mode variant)
- `docs/research/library/mintlify/dashboard/editor-full.png` (Document tree structure)

### Key Improvements

1. **Rich document tree** - Hierarchical tree with folders, expand/collapse, drag-to-reorder
2. **Inline search** - Search field within Documents section for quick filtering
3. **Hover quick actions** - Add child, options menu on hover for each item
4. **Visual hierarchy indicators** - Indentation guides, folder icons vs document icons
5. **Active item highlight** - Clear brand-colored highlight for selected document
6. **Empty state polish** - Animated illustration, gradient CTA button
7. **Templates as cards** - Visual card grid instead of bare list
8. **Recent documents strip** - Quick access row at top of main content

### Mintlify Navigation Anatomy

From `docs_desktop_dark.png` and `dashboard/editor-full.png`:

- **Search bar**: Search field with keyboard shortcut badge (Ctrl K)
- **Section headers**: Icon + label, collapsible with subtle styling
- **Tree structure**:
  - Sections: "Get started", "Organize", "Customize", "Create content"
  - Items with document icons, indented under sections
  - Active item: Brand-colored background highlight (green tint)
  - Hover state: Subtle background change
- **Add button**: "+ Add new" at bottom of tree (editor view)
- **Nested items**: Folder icons for groups, document icons for pages
- **External links**: Arrow-out icon for items linking externally
- **Visual guides**: Vertical lines for indentation (editor view)

---

## ASCII Wireframe

### Target Layout (Dark Theme)

```
+--------------------------------------------------------------------------------+
|  [N] Nixelo E2E      [Sidebar Toggle]    Commands  Timer  Search  ?  Bell  Av  |
+--------------------------------------------------------------------------------+
|                      |                                                         |
|   [Search docs...]   |         Documents                                       |
|                      |         Create and manage documents                     |
|   DOCUMENTS          |                                                         |
|   v                  |   +--------------------------------------------------+  |
|   +----------------+ |   |  RECENT DOCUMENTS                         View all |  |
|   | [Search...]  Q | |   |  +----------+  +----------+  +----------+        |  |
|   +----------------+ |   |  | [doc]    |  | [doc]    |  | [doc]    |        |  |
|                      |   |  | Meeting  |  | Sprint   |  | PRD:     |        |  |
|   > Getting Started  |   |  | Notes    |  | Plan Q1  |  | Feature  |        |  |
|     [doc] Overview   |   |  | 2h ago   |  | 1d ago   |  | 3d ago   |        |  |
|     [doc] Quickstart |   |  +----------+  +----------+  +----------+        |  |
|                      |   +--------------------------------------------------+  |
|   v Engineering      |                                                         |
|     [doc] API Docs   |   +--------------------------------------------------+  |
|     [doc] Arch Diag  |   |  ALL DOCUMENTS                           [+ New]   |  |
|     > Backend ----+  |   |                                                   |  |
|       [doc] Auth  |  |   |  +----------------------------------------------+ |  |
|       [doc] DB    |  |   |  | [folder]  Getting Started            3 docs  | |  |
|       [+] Add...  |  |   |  +----------------------------------------------+ |  |
|     > Frontend       |   |  | [folder]  Engineering                 8 docs  | |  |
|       [doc] Comp     |   |  +----------------------------------------------+ |  |
|                      |   |  | [folder]  Product                     5 docs  | |  |
|   v Product          |   |  +----------------------------------------------+ |  |
|     [doc] Roadmap    |   |  | [doc]     Roadmap 2026               Updated   | |  |
|     [doc] PRDs       |   |  +----------------------------------------------+ |  |
|                      |   |  | [doc]     Team Wiki                   Pinned   | |  |
|   v Templates        |   |  +----------------------------------------------+ |  |
|     [tmpl] Meeting   |   |                                                   |  |
|     [tmpl] Sprint    |   |  [Empty area - or more documents]                 |  |
|     [tmpl] PRD       |   |                                                   |  |
|                      |   +--------------------------------------------------+  |
|   [+] New Document   |                                                         |
|   [+] New Folder     |                                                         |
|                      |                                                         |
|   ---------------    |                                                         |
|   Settings           |                                                         |
+--------------------------------------------------------------------------------+
```

### Sidebar Document Tree (Expanded View)

```
+------------------------+
| [Q] Search docs...     |  <- Quick search with icon
+------------------------+
|                        |
| DOCUMENTS         [+]  |  <- Section header with add btn
|                        |
| v Getting Started  ... |  <- Expanded folder, hover shows ...
|   |-- [doc] Overview   |     <- Active highlight (brand bg)
|   |-- [doc] Quickstart |
|   +-- [+] Add page     |     <- Inline add on hover
|                        |
| > Engineering      ... |  <- Collapsed folder
|                        |
| > Product          ... |
|                        |
| [doc] Standalone Note  |  <- Root-level document
|                        |
+------------------------+
| TEMPLATES          [+] |
| [tmpl] Meeting Notes   |
| [tmpl] Sprint Retro    |
+------------------------+
| [+] New Document       |  <- Primary action
| [+] New Folder         |  <- Secondary action
+------------------------+
```

### Templates Grid View

```
+--------------------------------------------------------------------------------+
|         Document Templates                                       [+ New Template]|
|         Create documents from pre-built templates                               |
|                                                                                 |
|   [All] [Meetings] [Planning] [Engineering] [Design] [Other]    <- Tab bar     |
|    ^^^                                                                          |
|   Active tab has brand underline                                                |
|                                                                                 |
|   +---------------------------+  +---------------------------+                  |
|   |   [Meeting Notes icon]    |  |   [Sprint Retro icon]     |                  |
|   |                           |  |                           |                  |
|   |   Meeting Notes           |  |   Sprint Retrospective    |                  |
|   |   Standard meeting        |  |   End-of-sprint review    |                  |
|   |   template with agenda    |  |   with action items       |                  |
|   |                           |  |                           |                  |
|   |   [Use Template]          |  |   [Use Template]          |                  |
|   +---------------------------+  +---------------------------+                  |
|                                                                                 |
|   +---------------------------+  +---------------------------+                  |
|   |   [PRD icon]              |  |   [Tech Spec icon]        |                  |
|   |                           |  |                           |                  |
|   |   Product Requirements    |  |   Technical Spec          |                  |
|   |   Full PRD structure      |  |   Architecture document   |                  |
|   |   with sections           |  |   template                |                  |
|   |                           |  |                           |                  |
|   |   [Use Template]          |  |   [Use Template]          |                  |
|   +---------------------------+  +---------------------------+                  |
+--------------------------------------------------------------------------------+
```

### Empty State (No Documents)

```
+--------------------------------------------------------------------------------+
|                                                                                 |
|                                                                                 |
|                          [   Animated doc stack   ]                             |
|                          [   with floating dots   ]                             |
|                          [   subtle glow effect   ]                             |
|                                                                                 |
|                                                                                 |
|                        Start Building Your Docs                                 |
|                        (28px, white, font-weight 600)                           |
|                                                                                 |
|                Create your first document to capture ideas,                     |
|                specs, meeting notes, and team knowledge.                        |
|                        (14px, muted text)                                       |
|                                                                                 |
|                                                                                 |
|                    +--------------------------------+                           |
|                    |  [+]  Create First Document   |                           |
|                    +--------------------------------+                           |
|                           (brand gradient button)                               |
|                                                                                 |
|                      or choose from a  [template ->]                            |
|                             (brand link)                                        |
|                                                                                 |
|                                                                                 |
+--------------------------------------------------------------------------------+
```

### Vertical Spacing Guide

```
Sidebar Document Tree
    |
[Search input] - 36px height
    |
    | 16px gap
    |
[Section header] - 24px height
    |
    | 4px gap
    |
[Tree item] - 32px height
    |
    | 2px gap (between items)
    |
[Tree item]
    |
    | 4px gap (before nested)
    |
    [Nested item] - 32px height, 24px indent
    |
    | 16px gap (between sections)
    |
[Section header]
    ...

Main Content Area
    |
[Page header] - title + subtitle
    |
    | 24px gap
    |
[Recent documents strip] - 120px height
    |
    | 32px gap
    |
[Documents list/grid]
```

---

## Functionality Breakdown

### Document Tree Operations

- [ ] **Expand/collapse folders**: Click chevron or folder name to toggle
- [ ] **Select document**: Click to load in main area, highlight in sidebar
- [ ] **Hover quick actions**: Show "..." menu and "+" add child on hover
- [ ] **Drag to reorder**: Drag handle or item to reorder within folder
- [ ] **Drag to nest**: Drag item onto folder to move inside
- [ ] **Keyboard navigation**: Arrow keys to navigate, Enter to select
- [ ] **Right-click context menu**: Rename, duplicate, move, delete
- [ ] **Inline rename**: Double-click or F2 to rename in place
- [ ] **Search filter**: Type in search to filter visible tree items

### Document CRUD

1. **Create Document**:
   - Click "+ New Document" button
   - Choose location (current folder or root)
   - Open in editor with untitled placeholder
   - Auto-focus title for immediate typing

2. **Create from Template**:
   - Click template card or "Use Template"
   - Document created with template content
   - Opens immediately in editor

3. **Create Folder**:
   - Click "+ New Folder" button
   - Inline editing for folder name
   - Created at current context level

4. **Delete Document**:
   - Confirm dialog with document title
   - Option to move to trash vs permanent delete
   - Cannot delete folders with children (must empty first)

5. **Move Document**:
   - Drag and drop to new location
   - Or use "Move to..." in context menu
   - Shows folder picker dialog

### Templates

1. **View Templates**:
   - Click Templates in sidebar
   - See grid of available templates
   - Filter by category tabs

2. **Create Template**:
   - Click "+ New Template"
   - Opens template editor
   - Set category, name, description

3. **Use Template**:
   - Click "Use Template" on card
   - Creates new document
   - Opens document in editor

4. **Manage Templates**:
   - Edit template content
   - Update category/metadata
   - Delete template (confirm dialog)

### Search & Filter

- [ ] **Quick search**: Cmd/Ctrl + K for global, sidebar search for docs only
- [ ] **Filter tree**: Type to filter visible items, highlight matches
- [ ] **Search results**: Show matching documents with path context
- [ ] **Recent filter**: Quick toggle to show only recent documents

### Error States

| Error | Display | Recovery |
|-------|---------|----------|
| Document not found | Toast: "Document not found" | Navigate to documents root |
| Permission denied | Toast: "No access to this document" | Link to request access |
| Save failed | Inline error, retry button | Auto-retry with backoff |
| Delete failed | Toast: "Could not delete" | Retry action |
| Move failed | Toast: "Could not move document" | Revert position |
| Template error | Modal: "Template unavailable" | Try different template |

---

## Component Inventory

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **Document Tree** | Basic sidebar list | Full tree with folders, icons, drag | New component |
| **Tree Item** | Static text | Interactive with hover states, chevron | Collapsible |
| **Tree Folder** | Not visible | Folder icon, expand/collapse, child count | New |
| **Inline Search** | None in sidebar | Search input within Documents section | Filter tree |
| **Quick Actions** | None | Hover overlay with +, ... buttons | On tree items |
| **Document Card** | N/A | Card for grid view | For templates, recent |
| **Template Card** | Empty state | Rich card with icon, title, desc, CTA | Visual cards |
| **Tab Bar** | Flat tabs | Underline active indicator, brand color | Templates filter |
| **Empty State** | Basic centered | Animated illustration, gradient CTA | Premium feel |
| **Recent Strip** | None | Horizontal scroll of recent doc cards | Quick access |
| **Context Menu** | None | Right-click menu for tree items | Rename, move, delete |

### New Components Needed

1. **DocumentTree**: Recursive tree component with folder/item support
2. **TreeItem**: Individual tree node with icon, label, actions
3. **TreeFolder**: Expandable folder node with children
4. **InlineSearch**: Search input for filtering tree
5. **DocumentCard**: Card component for grid/recent views
6. **TemplateCard**: Richer card with description and CTA
7. **RecentDocumentsStrip**: Horizontal scrollable recent items
8. **CreateDocumentDialog**: Modal for document creation options

---

## Design Tokens Used

### Colors

| Element | Token | Value |
|---------|-------|-------|
| Tree background | `--color-ui-bg` | Light: white, Dark: near-black |
| Tree item text | `--color-ui-text` | Primary text color |
| Tree item text (muted) | `--color-ui-text-secondary` | Paths, counts |
| Tree item hover bg | `--color-ui-bg-hover` | Subtle highlight |
| Tree item active bg | `--color-ui-bg-brand-subtle` | Brand tinted background |
| Tree item active text | `--color-brand` | Brand color for active |
| Folder icon | `--color-ui-icon-secondary` | Muted icon color |
| Document icon | `--color-ui-icon` | Standard icon color |
| Tree indent guide | `--color-ui-border-subtle` | Very subtle vertical line |
| Search input bg | `--color-ui-bg-secondary` | Slightly recessed |
| Search input border | `--color-ui-border` | Input border |
| Card background | `--color-ui-bg-card` | Elevated surface |
| Card border | `--color-ui-border` | Subtle border |
| Card hover border | `--color-ui-border-hover` | Stronger on hover |
| Template icon bg | `--color-ui-bg-brand-subtle` | Brand tinted icon area |
| Tab inactive | `--color-ui-text-tertiary` | Muted tab text |
| Tab active | `--color-ui-text` | Full text + underline |
| Tab underline | `--color-brand` | Brand underline |
| Empty state illustration | `--color-brand-alpha-10` | Soft brand tint |
| CTA button | `--color-brand-gradient` | Brand gradient fill |

### Typography

| Element | Size | Weight | Token |
|---------|------|--------|-------|
| Page title | 24px | 600 | `text-xl font-semibold` |
| Page subtitle | 14px | 400 | `text-sm text-ui-text-secondary` |
| Section header | 12px | 600 | `text-xs font-semibold uppercase` |
| Tree item | 14px | 400 | `text-sm` |
| Tree item active | 14px | 500 | `text-sm font-medium` |
| Folder name | 14px | 500 | `text-sm font-medium` |
| Card title | 16px | 500 | `text-base font-medium` |
| Card description | 14px | 400 | `text-sm text-ui-text-secondary` |
| Tab label | 14px | 500 | `text-sm font-medium` |
| Empty heading | 24px | 600 | `text-xl font-semibold` |
| Empty subtext | 14px | 400 | `text-sm text-ui-text-secondary` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Sidebar padding | 12px | `p-3` |
| Tree item padding | 8px 12px | `px-3 py-2` |
| Tree item indent | 24px per level | `pl-6` per depth |
| Tree item gap | 2px | `gap-0.5` |
| Section gap | 16px | `gap-4` |
| Main content padding | 24px | `p-6` |
| Card padding | 16px | `p-4` |
| Card gap | 16px | `gap-4` |
| Recent strip gap | 12px | `gap-3` |
| Tab gap | 4px | `gap-1` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Search input | 8px | `rounded-lg` |
| Tree item | 6px | `rounded-md` |
| Document card | 12px | `rounded-xl` |
| Template card | 12px | `rounded-xl` |
| Tab pill (if used) | 6px | `rounded-md` |
| CTA button | 8px | `rounded-lg` |

### Shadows

| Element | Value | Token |
|---------|-------|-------|
| Card default | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` |
| Card hover | `0 4px 12px rgba(0,0,0,0.08)` | `shadow-md` |
| Dropdown menu | `0 4px 16px rgba(0,0,0,0.12)` | `shadow-lg` |

---

## Animations

### Tree Expand/Collapse

```css
/* Folder expansion animation */
@keyframes tree-expand {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    max-height: 1000px; /* Large enough for content */
    transform: translateY(0);
  }
}

.tree-children-enter {
  animation: tree-expand 0.2s ease-out forwards;
}

.tree-children-exit {
  animation: tree-expand 0.15s ease-in reverse forwards;
}

/* Chevron rotation */
.tree-chevron {
  transition: transform 0.2s ease;
}
.tree-folder-open .tree-chevron {
  transform: rotate(90deg);
}
```

### Tree Item Hover

```css
/* Smooth hover transition */
.tree-item {
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.tree-item:hover {
  background-color: var(--color-ui-bg-hover);
}

/* Quick actions fade in */
.tree-item-actions {
  opacity: 0;
  transition: opacity 0.15s ease;
}
.tree-item:hover .tree-item-actions {
  opacity: 1;
}
```

### Tree Item Selection

```css
/* Active state with subtle pulse */
@keyframes tree-select {
  0% {
    background-color: var(--color-ui-bg-brand-subtle);
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.tree-item-active {
  animation: tree-select 0.2s ease-out;
  background-color: var(--color-ui-bg-brand-subtle);
}
```

### Document Card Hover

```css
/* Card lift on hover */
.document-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-ui-border-hover);
}

/* Icon subtle scale */
.document-card-icon {
  transition: transform 0.2s ease;
}
.document-card:hover .document-card-icon {
  transform: scale(1.05);
}
```

### Template Card Use Button

```css
/* Button reveal on card hover */
.template-card-cta {
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.template-card:hover .template-card-cta {
  opacity: 1;
  transform: translateY(0);
}

/* Or always visible with hover enhancement */
.template-card-cta {
  transition:
    background-color 0.15s ease,
    transform 0.15s ease;
}
.template-card-cta:hover {
  background-color: var(--color-brand-hover);
  transform: scale(1.02);
}
```

### Document Creation

```css
/* New document appears in tree */
@keyframes doc-create {
  from {
    opacity: 0;
    transform: translateX(-8px);
    background-color: var(--color-ui-bg-brand-subtle);
  }
  to {
    opacity: 1;
    transform: translateX(0);
    background-color: transparent;
  }
}

.tree-item-new {
  animation: doc-create 0.3s ease-out;
}
```

### Empty State Animation

```css
/* Floating document stack illustration */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.empty-state-illustration {
  animation: float 3s ease-in-out infinite;
}

/* Subtle glow pulse */
@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}

.empty-state-glow {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

### Tab Underline Slide

```css
/* Active tab indicator slides */
.tab-underline {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: var(--color-brand);
  transition:
    left 0.2s ease,
    width 0.2s ease;
}
```

### Drag and Drop

```css
/* Dragging item ghost */
.tree-item-dragging {
  opacity: 0.8;
  transform: scale(1.02);
  box-shadow: var(--shadow-lg);
  background-color: var(--color-ui-bg-card);
}

/* Drop target highlight */
.tree-folder-drop-target {
  background-color: var(--color-ui-bg-brand-subtle);
  border: 2px dashed var(--color-brand);
  border-radius: var(--radius-md);
}

/* Insert line indicator */
.tree-insert-indicator {
  height: 2px;
  background: var(--color-brand);
  animation: pulse 0.5s ease-in-out infinite;
}
```

---

## Implementation Checklist

### Phase 1: Document Tree Structure

- [ ] Create `DocumentTree` component with recursive rendering
- [ ] Implement `TreeItem` component with proper spacing/icons
- [ ] Implement `TreeFolder` component with expand/collapse
- [ ] Add chevron rotation animation for folders
- [ ] Add tree item hover states and quick action placeholders
- [ ] Implement proper indentation with optional guide lines
- [ ] Add active item highlight with brand color

### Phase 2: Tree Interactivity

- [ ] Add click to select document behavior
- [ ] Implement expand/collapse with animation
- [ ] Add keyboard navigation (arrow keys, Enter)
- [ ] Implement inline search/filter for tree
- [ ] Add right-click context menu
- [ ] Add hover quick actions (add, options)
- [ ] Implement inline rename on double-click/F2

### Phase 3: Drag and Drop

- [ ] Implement drag handle or full-item drag
- [ ] Add drag ghost styling
- [ ] Implement drop targets (between items, into folders)
- [ ] Add visual feedback for valid drop targets
- [ ] Handle reorder within folder
- [ ] Handle move to different folder
- [ ] Add undo support for moves

### Phase 4: Document CRUD

- [ ] Implement "+ New Document" button and flow
- [ ] Implement "+ New Folder" button and flow
- [ ] Add create document dialog (optional location picker)
- [ ] Implement delete with confirmation dialog
- [ ] Connect to Convex mutations for CRUD
- [ ] Add optimistic updates for tree changes
- [ ] Handle error states with proper feedback

### Phase 5: Templates Section

- [ ] Create `TemplateCard` component with icon, title, desc
- [ ] Implement template grid layout
- [ ] Add category tab bar with animated underline
- [ ] Implement "Use Template" action
- [ ] Add "+ New Template" flow
- [ ] Connect to Convex queries for templates
- [ ] Handle empty templates state

### Phase 6: Recent Documents

- [ ] Create `RecentDocumentsStrip` component
- [ ] Implement horizontal scroll with subtle fade edges
- [ ] Create `DocumentCard` for recent items
- [ ] Add hover states and click to open
- [ ] Show timestamp/last edited info
- [ ] Connect to recent documents query
- [ ] Handle empty state (no recent)

### Phase 7: Empty States

- [ ] Design animated illustration for empty documents
- [ ] Add floating animation and glow effect
- [ ] Create gradient CTA button
- [ ] Add link to templates as secondary action
- [ ] Implement separate empty states for:
  - [ ] No documents at all
  - [ ] Empty folder
  - [ ] No search results
  - [ ] No templates

### Phase 8: Polish & Accessibility

- [ ] Add proper ARIA labels for tree navigation
- [ ] Implement focus management for tree
- [ ] Test keyboard-only navigation
- [ ] Add screen reader announcements for tree changes
- [ ] Test with high contrast mode
- [ ] Ensure all interactive elements have focus rings
- [ ] Add loading skeletons for tree items
- [ ] Test responsive behavior (mobile sidebar collapse)

### Phase 9: Performance

- [ ] Implement virtualized tree for large document sets
- [ ] Add lazy loading for folder contents
- [ ] Optimize re-renders with proper memoization
- [ ] Add skeleton loading states
- [ ] Test with 100+ documents

---

## Related Files

### Source References
- Current empty: `e2e/screenshots/07-empty-documents.png`
- Current filled: `e2e/screenshots/04-filled-documents.png`
- Templates view: `e2e/screenshots/05-filled-documents-templates.png`
- Mintlify docs nav: `docs/research/library/mintlify/docs_desktop_dark.png`
- Mintlify editor tree: `docs/research/library/mintlify/dashboard/editor-full.png`

### Implementation Files
- Route: `src/routes/$slug/documents.tsx`
- Components: `src/components/documents/`
- Backend: `convex/documents.ts`
- Theme tokens: `src/index.css`

### Related Pages
- Dashboard: `pages/04-dashboard.md`
- Document Editor: `pages/10-document-editor.md` (if exists)
- Sidebar Navigation: `pages/XX-sidebar.md` (if exists)

---

*Last Updated: 2026-02-05*
*Status: Specification Complete - Awaiting Implementation*
