# Document Editor

> **Status**: TODO - Awaiting Implementation
> **Priority**: HIGH (Phase 4 - Core App Features)

---

## Current State Analysis

**Screenshot**: `e2e/screenshots/31-filled-document-editor.png` (shows templates page, not actual editor)

### Visual Description (Current Nixelo)

The current Nixelo document editor consists of:

1. **Page Layout**: Full-height container with header and scrollable editor area
2. **Document Header** (`DocumentHeader.tsx`):
   - Editable title (click to edit for owners)
   - Presence indicator showing active collaborators
   - Action buttons row:
     - History button (version count badge)
     - Import MD button (indigo background)
     - Export MD button (cyan background)
     - Public/Private toggle button
   - Metadata: "Created by [name]" and "Last updated [date]"
   - Border bottom separator
3. **Editor Area**:
   - Max-width 4xl (896px) centered container
   - Padding on sides (responsive: p-3 sm:p-6)
   - Plate.js editor with prose styling
   - Placeholder text: "Start writing..."
4. **Floating Toolbar**: Appears on text selection
   - Bold, Italic, Underline, Strikethrough
   - Inline Code, Link insertion
   - Popover positioned above selection
5. **Slash Menu**: Triggered by typing "/"
   - Command palette with block types
   - Paragraph, Headings (1-3), Lists, Quote, Code Block, Table, Image
   - Fuzzy search filtering

### Issues Identified

| Issue | Severity | Notes |
|-------|----------|-------|
| No document sidebar/tree | HIGH | Mintlify has hierarchical navigation |
| Header too busy/cluttered | HIGH | Multiple action buttons compete |
| No publish/preview workflow | MEDIUM | Mintlify has dedicated Publish button |
| Editor lacks visual polish | MEDIUM | Prose styles are basic |
| No branch indicator | LOW | Mintlify shows "main" branch |
| Missing breadcrumb navigation | LOW | Context for document location |
| No visual distinction for callouts | LOW | Mintlify has rich callout cards |

---

## Target State

**Reference**:
- `docs/research/library/mintlify/dashboard/editor-full.png` (Primary)

### Key Improvements

1. **Document navigation sidebar** - Hierarchical tree with collapsible sections
2. **Simplified header** - Branch indicator + single Publish CTA
3. **Rich content blocks** - Callout cards with icons and descriptions
4. **Clean editor chrome** - Minimal visual noise, focus on content
5. **Two-column layout** - Sidebar (240px) + main editor area
6. **External links** - Documentation and Blog with external link icons
7. **Add new button** - Quick document creation in tree

### Mintlify Editor Anatomy

From `editor-full.png`:

- **Left Sidebar** (~240px):
  - "Navigation" header with create + search icons
  - Top-level links with external icons: "Documentation", "Blog"
  - Collapsible "Guides" section (expanded with + and ... buttons):
    - "Getting started"
    - "Introduction" (selected, highlighted bg)
    - "Quickstart"
    - "Development"
    - "Customization"
    - "Writing content"
    - "AI tools"
  - "API reference" section
  - "Add new" button with green plus icon at bottom
  - Settings and additional icons in footer

- **Top Bar**:
  - Branch selector showing "main" with dropdown
  - Right side: Preview icon, Compare icon, "Publish" button (green bg)

- **Main Editor**:
  - Large heading: "Introduction"
  - Subtitle: "Welcome to the new home for your documentation"
  - Section heading: "Setting up"
  - Body text: "Get your documentation site up and running in minutes."
  - Callout card with icon:
    - Pencil icon (brand green)
    - "Start here" title
    - "Follow our three step quickstart guide."
  - Another section: "Make it yours"
  - Body text: "Design a docs site that looks great and empowers your users."
  - Two-column card grid:
    - "Edit locally" - Edit icon, description
    - "Customize your site" - Settings icon, description
    - "Set up navigation" - Book icon, description
    - "API documentation" - Terminal icon, description

---

## ASCII Wireframe

### Target Layout (Dark Theme)

```
+------------------+---------------------------------------------------------------+
| Navigation    +Q |  [branch: main v]                    [>] [=] [Publish]      |
+------------------+---------------------------------------------------------------+
|                  |                                                               |
| Documentation [^]|      Introduction                                             |
| Blog          [^]|      ____________________________________________             |
|                  |                                                               |
| v Guides     ... |      Welcome to the new home for your documentation          |
|   Getting started|                                                               |
|   [Introduction] |                                                               |
|   Quickstart     |      Setting up                                               |
|   Development    |      ___________                                              |
|   Customization  |                                                               |
|   Writing content|      Get your documentation site up and running in minutes.  |
|   AI tools       |                                                               |
|                  |      +--------------------------------------------------+    |
| API reference    |      | [pencil]  Start here                             |    |
|                  |      |           Follow our three step quickstart guide.|    |
|                  |      +--------------------------------------------------+    |
|                  |                                                               |
|                  |      Make it yours                                            |
|                  |      ____________                                             |
|                  |                                                               |
|                  |      Design a docs site that looks great and empowers users. |
|                  |                                                               |
|                  |      +------------------------+  +------------------------+  |
|                  |      | [edit]                 |  | [settings]             |  |
|                  |      | Edit locally           |  | Customize your site    |  |
|                  |      | Edit your docs locally |  | Customize the design   |  |
|                  |      | and preview in real    |  | and colors of your     |  |
|                  |      | time.                  |  | site to match brand.   |  |
|                  |      +------------------------+  +------------------------+  |
|                  |                                                               |
|                  |      +------------------------+  +------------------------+  |
| [+] Add new      |      | [book]                 |  | [terminal]             |  |
|                  |      | Set up navigation      |  | API documentation      |  |
+--[gear]----------+      | Organize your docs to  |  | Auto-generate API docs |  |
                          | help users find info.  |  | from your codebase.    |  |
                          +------------------------+  +------------------------+  |
                          |                                                        |
                          +--------------------------------------------------------+
```

### Sidebar Structure (Collapsible Tree)

```
Navigation                    [+] [Q]
------------------------------------
[icon] Documentation           [^]
[icon] Blog                    [^]

v Guides                    [...] [+]
    [doc] Getting started
    [doc] Introduction          <-- selected
    [doc] Quickstart
    [doc] Development
    [doc] Customization
    [doc] Writing content
    [doc] AI tools

> API reference

------------------------------------
[+] Add new

[gear] [?] [monitor]
```

### Editor Content Area

```
+--------------------------------------------------------------------+
|                                                                     |
|  Introduction                                        (H1, 48px)     |
|  _____________                                                      |
|                                                                     |
|  Welcome to the new home for your documentation     (body, muted)   |
|                                                                     |
|                                                                     |
|  Setting up                                          (H2, 28px)     |
|  __________                                                         |
|                                                                     |
|  Get your documentation site up and running in      (body)          |
|  minutes.                                                           |
|                                                                     |
|  +---------------------------------------------------------------+  |
|  |  [icon]  Start here                              (callout)    |  |
|  |          Follow our three step quickstart guide.              |  |
|  +---------------------------------------------------------------+  |
|                                                                     |
|                                                                     |
|  Make it yours                                       (H2, 28px)     |
|  _____________                                                      |
|                                                                     |
|  Design a docs site that looks great and empowers   (body)          |
|  your users.                                                        |
|                                                                     |
|  +---------------------------+  +---------------------------+       |
|  | [icon]                    |  | [icon]                    |       |
|  |                           |  |                           |       |
|  | Edit locally              |  | Customize your site       |       |
|  | Edit your docs locally... |  | Customize the design...   |       |
|  +---------------------------+  +---------------------------+       |
|                                                                     |
|  +---------------------------+  +---------------------------+       |
|  | [icon]                    |  | [icon]                    |       |
|  |                           |  |                           |       |
|  | Set up navigation         |  | API documentation         |       |
|  | Organize your docs to...  |  | Auto-generate API docs... |       |
|  +---------------------------+  +---------------------------+       |
|                                                                     |
+--------------------------------------------------------------------+
```

### Vertical Spacing Guide

```
Top of editor area
    |
    | 48px padding top
    |
[H1 Title] - 48px font size, line-height 1.1
    |
    | 16px gap
    |
[Subtitle/Description] - 16px, muted
    |
    | 48px gap
    |
[H2 Section] - 28px, semibold
    |
    | 16px gap
    |
[Body paragraph]
    |
    | 24px gap
    |
[Callout Card] - 16px padding, rounded-lg
    |
    | 48px gap
    |
[H2 Section]
    |
    | 16px gap
    |
[Body paragraph]
    |
    | 24px gap
    |
[Card Grid] - 2 columns, 16px gap
    |
    | 48px padding bottom
    |
Bottom of content
```

---

## Functionality Breakdown

### Document Navigation Sidebar

- [ ] **Hierarchical tree structure** - Documents organized in folders/sections
- [ ] **Collapsible sections** - Click to expand/collapse
- [ ] **Selected state** - Highlighted background for current document
- [ ] **External link indicators** - Arrow icon for external pages
- [ ] **Context menu** - "..." button for rename, delete, move
- [ ] **Quick create** - "+" button to add document in section
- [ ] **Add new button** - Bottom of sidebar for new document
- [ ] **Search integration** - Quick search icon in header
- [ ] **Drag and drop** - Reorder documents in tree (future)

### Editor Toolbar/Header

- [ ] **Branch selector** - Show current branch (e.g., "main")
- [ ] **Preview button** - Open live preview
- [ ] **Compare button** - View diff/changes
- [ ] **Publish button** - Deploy changes (green CTA)
- [ ] **Minimal chrome** - No version history, import/export in header

### Rich Text Editing

- [ ] **Block types** (slash menu):
  - Paragraph
  - Headings (H1, H2, H3)
  - Bulleted list
  - Numbered list
  - Blockquote
  - Code block (with syntax highlighting)
  - Table
  - Image
  - Callout/card (NEW)
  - Card grid (NEW)
- [ ] **Inline formatting** (floating toolbar):
  - Bold, Italic, Underline, Strikethrough
  - Inline code
  - Link
- [ ] **Keyboard shortcuts**:
  - `Ctrl+B` Bold
  - `Ctrl+I` Italic
  - `Ctrl+U` Underline
  - `Ctrl+K` Link
  - `/` Slash command
  - `#` Heading shortcuts

### Real-time Collaboration

- [ ] **Presence indicators** - Show active editors
- [ ] **Cursor positions** - Show other users' cursors (colored)
- [ ] **Selection highlighting** - See what others have selected
- [ ] **Sync status** - "Saving..." / "Saved" indicator
- [ ] **Conflict resolution** - Y.js CRDT merging

### Saving & Publishing

- [ ] **Auto-save** - Debounced save on content change
- [ ] **Save indicator** - Visual feedback when saving
- [ ] **Version history** - Accessible from menu (not header)
- [ ] **Publish workflow** - Explicit publish action
- [ ] **Draft state** - Unpublished changes indicator

---

## Component Inventory

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **Page Layout** | Single column | Two-column (sidebar + editor) | Add sidebar |
| **Document Sidebar** | None | Hierarchical tree | New component |
| **Sidebar Item** | N/A | Tree node with icon, label, actions | New component |
| **Branch Selector** | None | Dropdown with branch name | New component |
| **Publish Button** | None | Green CTA in header | Add to header |
| **Document Header** | Complex with actions | Simplified, branch + publish | Reduce chrome |
| **Editor Container** | Max-w-4xl centered | Max-w-3xl with wider margins | Adjust width |
| **Floating Toolbar** | Basic popover | Polished with animations | Enhance |
| **Slash Menu** | Command palette | Styled command palette | Enhance |
| **Callout Block** | None | Icon + title + description card | New editor block |
| **Card Grid Block** | None | 2-column card layout | New editor block |
| **Presence Indicator** | Avatar stack | Compact avatars in header | Keep, enhance |

### New Components Needed

1. **DocumentSidebar**: Navigation tree with sections
2. **SidebarSection**: Collapsible section with children
3. **SidebarItem**: Individual document/link node
4. **BranchSelector**: Dropdown for branch selection
5. **PublishButton**: Green CTA with loading state
6. **CalloutBlock**: Rich callout card for editor
7. **CardGridBlock**: Two-column card layout for editor
8. **SyncIndicator**: "Saving" / "Saved" status display

---

## Design Tokens Used

### Colors (Dark Mode)

| Element | Token | Value |
|---------|-------|-------|
| Sidebar background | `--color-ui-bg-secondary` | Slightly lighter than page |
| Sidebar border | `--color-ui-border` | Subtle vertical divider |
| Sidebar item default | Transparent | No background |
| Sidebar item hover | `--color-ui-bg-tertiary` | Slight highlight |
| Sidebar item selected | `--color-ui-bg-tertiary` | Visible highlight |
| Sidebar item selected text | `--color-ui-text` | White |
| Sidebar text | `--color-ui-text-secondary` | Muted |
| Section header | `--color-ui-text` | White |
| External link icon | `--color-ui-text-tertiary` | Subtle |
| Add new button bg | `--color-brand-soft` | Subtle brand |
| Add new button text | `--color-brand` | Brand color |
| Branch selector bg | `--color-ui-bg-tertiary` | Dark button |
| Branch selector text | `--color-ui-text` | White |
| Publish button bg | `--color-status-success` | Green |
| Publish button text | White | High contrast |
| Editor background | `--color-ui-bg` | Page bg |
| Editor text | `--color-ui-text` | White |
| Editor heading | `--color-ui-text` | White |
| Editor muted text | `--color-ui-text-secondary` | Subtitle |
| Callout background | `--color-ui-bg-secondary` | Subtle card |
| Callout border | `--color-ui-border` | Subtle |
| Callout icon | `--color-brand` | Brand accent |
| Card background | `--color-ui-bg-secondary` | Subtle |
| Card border | `--color-ui-border` | Subtle |
| Toolbar background | `--color-ui-bg` | Match page |
| Toolbar border | `--color-ui-border` | Subtle |

### Typography

| Element | Size | Weight | Token |
|---------|------|--------|-------|
| H1 Title | 48px | 700 | `text-5xl font-bold` |
| H2 Section | 28px | 600 | `text-2xl font-semibold` |
| H3 Subsection | 22px | 600 | `text-xl font-semibold` |
| Body text | 16px | 400 | `text-base` |
| Sidebar section | 14px | 500 | `text-sm font-medium` |
| Sidebar item | 14px | 400 | `text-sm` |
| Callout title | 16px | 600 | `text-base font-semibold` |
| Callout description | 14px | 400 | `text-sm` |
| Card title | 16px | 600 | `text-base font-semibold` |
| Card description | 14px | 400 | `text-sm` |
| Branch selector | 14px | 500 | `text-sm font-medium` |
| Publish button | 14px | 500 | `text-sm font-medium` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Sidebar width | 240px | `w-60` |
| Sidebar padding | 12px | `p-3` |
| Sidebar item padding | 8px 12px | `py-2 px-3` |
| Sidebar section gap | 4px | `gap-1` |
| Editor padding | 48px | `p-12` |
| Editor max-width | 768px | `max-w-3xl` |
| H1 to subtitle | 16px | `mt-4` |
| Subtitle to H2 | 48px | `mt-12` |
| H2 to body | 16px | `mt-4` |
| Body to callout | 24px | `mt-6` |
| Callout padding | 16px | `p-4` |
| Card grid gap | 16px | `gap-4` |
| Card padding | 20px | `p-5` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Sidebar item | 6px | `rounded-md` |
| Branch selector | 6px | `rounded-md` |
| Publish button | 6px | `rounded-md` |
| Callout card | 8px | `rounded-lg` |
| Feature card | 8px | `rounded-lg` |
| Floating toolbar | 8px | `rounded-lg` |
| Slash menu | 8px | `rounded-lg` |

---

## Animations

### Sidebar Interactions

```css
/* Sidebar item hover */
.sidebar-item {
  transition: background-color 0.15s ease, color 0.15s ease;
}
.sidebar-item:hover {
  background-color: var(--color-ui-bg-tertiary);
}

/* Section collapse/expand */
@keyframes collapse {
  from {
    opacity: 1;
    max-height: 500px;
  }
  to {
    opacity: 0;
    max-height: 0;
  }
}

@keyframes expand {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.sidebar-section-content {
  overflow: hidden;
}
.sidebar-section-content[data-state="closed"] {
  animation: collapse 0.2s ease-out forwards;
}
.sidebar-section-content[data-state="open"] {
  animation: expand 0.2s ease-out forwards;
}

/* Chevron rotation */
.sidebar-chevron {
  transition: transform 0.2s ease;
}
.sidebar-section[data-state="open"] .sidebar-chevron {
  transform: rotate(90deg);
}
```

### Save Feedback

```css
/* Sync indicator */
@keyframes pulse-opacity {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.sync-saving {
  animation: pulse-opacity 1s ease-in-out infinite;
}

/* Save success flash */
@keyframes save-flash {
  0% { opacity: 0; transform: scale(0.9); }
  20% { opacity: 1; transform: scale(1); }
  80% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.9); }
}

.save-indicator {
  animation: save-flash 1.5s ease-out forwards;
}
```

### Collaboration Cursors

```css
/* Cursor label entry */
@keyframes cursor-enter {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.collab-cursor-label {
  animation: cursor-enter 0.15s ease-out;
}

/* Cursor blink */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.collab-cursor-caret {
  animation: cursor-blink 1s step-end infinite;
}

/* Selection highlight */
.collab-selection {
  transition: background-color 0.1s ease;
}
```

### Block Insertion

```css
/* New block entry */
@keyframes block-enter {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.editor-block-new {
  animation: block-enter 0.2s ease-out;
}

/* Slash menu entry */
@keyframes menu-enter {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.slash-menu {
  animation: menu-enter 0.15s ease-out;
}
```

### Floating Toolbar

```css
/* Toolbar appear */
@keyframes toolbar-enter {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.floating-toolbar {
  animation: toolbar-enter 0.1s ease-out;
}

/* Button press */
.toolbar-button {
  transition: background-color 0.1s ease, transform 0.1s ease;
}
.toolbar-button:active {
  transform: scale(0.95);
}
```

### Publish Button

```css
/* Publish loading */
@keyframes publish-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.publish-button-loading .spinner {
  animation: publish-spin 0.8s linear infinite;
}

/* Publish success */
@keyframes publish-success {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.publish-button-success {
  animation: publish-success 0.3s ease;
}
```

---

## Implementation Checklist

### Phase 1: Layout Restructure

- [ ] Create two-column layout (sidebar + editor)
- [ ] Add DocumentSidebar component skeleton
- [ ] Move version history to document menu
- [ ] Remove Import/Export MD from header (move to menu)
- [ ] Simplify DocumentHeader to branch selector + publish
- [ ] Adjust editor max-width to 768px
- [ ] Update padding for Mintlify-style spacing

### Phase 2: Document Sidebar

- [ ] Create SidebarSection component with collapse
- [ ] Create SidebarItem component with states
- [ ] Implement tree structure from documents data
- [ ] Add external link indicator for special items
- [ ] Implement section expand/collapse animations
- [ ] Add "Add new" button at bottom
- [ ] Style selected state with proper highlight
- [ ] Add context menu (rename, delete, move)

### Phase 3: Header Updates

- [ ] Create BranchSelector component
- [ ] Create PublishButton with loading/success states
- [ ] Add Preview button (icon only)
- [ ] Add Compare button (icon only)
- [ ] Position controls in header right section
- [ ] Remove old action buttons (History, Import, Export, Public)

### Phase 4: Editor Enhancements

- [ ] Create CalloutBlock editor block
  - [ ] Icon slot (configurable)
  - [ ] Title field
  - [ ] Description field
  - [ ] Styled container
- [ ] Create CardGridBlock editor block
  - [ ] Two-column layout
  - [ ] Card items with icon, title, description
- [ ] Add these to slash menu
- [ ] Update prose styles for Mintlify typography
- [ ] Increase H1 size to 48px
- [ ] Adjust section spacing

### Phase 5: Collaboration Polish

- [ ] Style collaboration cursors with user colors
- [ ] Add cursor labels with names
- [ ] Animate cursor entry/exit
- [ ] Style selection highlights
- [ ] Add sync indicator (Saving.../Saved)
- [ ] Position sync indicator appropriately

### Phase 6: Animations

- [ ] Add sidebar item hover transitions
- [ ] Add section collapse/expand animations
- [ ] Add toolbar appear animation
- [ ] Add slash menu entry animation
- [ ] Add block insertion animation
- [ ] Add save feedback animation
- [ ] Add publish button loading state

### Phase 7: Polish & Testing

- [ ] Test keyboard navigation in sidebar
- [ ] Test slash menu keyboard selection
- [ ] Test floating toolbar positioning
- [ ] Verify auto-save functionality
- [ ] Test real-time collaboration sync
- [ ] Responsive testing (tablet, mobile)
- [ ] Dark mode verification
- [ ] Accessibility audit (ARIA, focus)

---

## Related Files

### Source References
- Mintlify editor: `docs/research/library/mintlify/dashboard/editor-full.png`
- Current Nixelo templates: `e2e/screenshots/31-filled-document-editor.png`
- Current documents list: `e2e/screenshots/04-filled-documents.png`

### Implementation Files
- Document route: `src/routes/_auth/_app/$orgSlug/documents/$id.tsx`
- Documents list: `src/routes/_auth/_app/$orgSlug/documents/index.tsx`
- Templates route: `src/routes/_auth/_app/$orgSlug/documents/templates.tsx`
- Plate Editor: `src/components/PlateEditor.tsx`
- Document Header: `src/components/DocumentHeader.tsx`
- Floating Toolbar: `src/components/plate/FloatingToolbar.tsx`
- Slash Menu: `src/components/plate/SlashMenu.tsx`
- Plate plugins: `src/lib/plate/plugins.ts`
- Plate config: `src/lib/plate/editor.ts`
- Theme tokens: `src/index.css`

### Related Pages
- Documents List: `pages/09-documents.md`
- Dashboard: `pages/04-dashboard.md`
- Settings: `pages/12-settings.md`

### Convex Backend
- Documents schema: `convex/schema.ts` (documents table)
- Documents queries: `convex/documents.ts`
- Document versions: `convex/documentVersions.ts`
- Presence: `convex/presence.ts`

---

*Last Updated: 2026-02-05*
*Status: Specification Complete - Awaiting Implementation*
