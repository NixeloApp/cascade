# Documents Page - Target State

> **Route**: `/:slug/documents`
> **Reference**: Notion sidebar, Mintlify navigation
> **Goal**: Clean tree view, smooth navigation, quick access

---

## Reference Screenshots

| Source | Preview |
|--------|---------|
| Notion Sidebar | ![](screenshots/reference-notion-sidebar.png) |
| Mintlify Nav | ![](screenshots/reference-mintlify-nav.png) |

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Expand/collapse | No animation | Smooth collapse |
| Hover states | Basic | Actions reveal |
| Indentation | Inconsistent | Consistent 16px |
| Icons | Basic document | Type-specific |
| Drag-drop | None | Full reordering |
| Search | None | Quick filter |

---

## Design Tokens

### Background Colors

| Element | Token | Notes |
|---------|-------|-------|
| Page background | `bg-ui-bg` | Near-black |
| Tree background | `bg-ui-bg` | Same as page |
| Row hover | `bg-ui-bg-secondary` | Subtle highlight |
| Row selected | `bg-brand-subtle` | Brand accent |

### Border Colors

| Element | Token |
|---------|-------|
| Tree item | None (no borders) |
| Drop indicator | `border-brand` |

### Typography

| Element | Size | Weight |
|---------|------|--------|
| Page title | `text-2xl` | 700 |
| Folder name | `text-sm` | 500 |
| Document name | `text-sm` | 400 |
| Timestamp | `text-xs` | 400 |

### Spacing

| Element | Token | Value |
|---------|-------|-------|
| Tree item height | `h-8` | 32px |
| Tree indent | `pl-4` | 16px per level |
| Icon gap | `gap-2` | 8px |

---

## Animations

### Folder Expand/Collapse

```css
.folder-content {
  overflow: hidden;
  transition: height 0.2s ease-out;
}

.folder-content[data-collapsed="true"] {
  height: 0;
}
```

### Row Hover

```css
.tree-row {
  transition: background-color 0.15s ease;
}

.tree-row:hover {
  background-color: var(--color-ui-bg-secondary);
}
```

### Quick Actions Reveal

```css
.row-actions {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.tree-row:hover .row-actions {
  opacity: 1;
}
```

### Drag Preview

```css
.tree-row[data-dragging="true"] {
  opacity: 0.5;
  background-color: var(--color-brand-subtle);
}

.drop-indicator {
  height: 2px;
  background-color: var(--color-brand);
  animation: pulse 1s ease-in-out infinite;
}
```

---

## Tree Structure Target

```
+--------------------------------------------------------------------------------+
|  [🔍] Search documents...                                                      |
+--------------------------------------------------------------------------------+
|                                                                                |
|  [▼] Getting Started                                              [+] [...]   |
|      [📄] Welcome                                    2 days ago   [+] [...]   |
|      [📄] Quick Start Guide                          1 week ago   [+] [...]   |
|                                                                                |
|  [▶] Product Specs                                                [+] [...]   |
|                                                                                |
|  [▼] Team Notes                                                   [+] [...]   |
|      [📄] Meeting Notes                              3 hours ago  [+] [...]   |
|      [📄] Action Items                               1 day ago    [+] [...]   |
|                                                                                |
|  [+ New Document]                                                              |
|                                                                                |
+--------------------------------------------------------------------------------+

Legend:
[▼] = Expanded folder (rotated chevron)
[▶] = Collapsed folder
[📄] = Document icon
[+] = Add nested document (hover reveal)
[...] = More actions (hover reveal)
```

---

## Component Inventory

### Tree Components

| Component | Target Changes |
|-----------|----------------|
| DocumentTree | Add search, drag-drop |
| FolderRow | Smooth expand, hover actions |
| DocumentRow | Hover actions, type icon |
| TreeContext | Drag-drop state management |

### New Components

| Component | Purpose |
|-----------|---------|
| TreeSearch | Quick search/filter input |
| DropIndicator | Visual drop target line |
| RowActions | Quick action buttons |

---

## Quick Actions (Row Hover)

| Action | Icon | Description |
|--------|------|-------------|
| Add Child | Plus | Add nested document/folder |
| Rename | Pencil | Inline rename |
| Move | Arrows | Move to folder picker |
| Duplicate | Copy | Duplicate document |
| Delete | Trash | Delete (with confirmation) |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow Up/Down | Navigate between rows |
| Arrow Right | Expand folder |
| Arrow Left | Collapse folder / go to parent |
| Enter | Open document |
| `N` | New document |
| `Shift+N` | New folder |
| `R` | Rename |
| `Delete` | Delete |

---

## Drag and Drop

### Supported Operations
- Drag document to folder (move)
- Drag document to root (move to top level)
- Drag folder to folder (nest)
- Drag to reorder within same level

### Visual Feedback
- Dragged item: Reduced opacity + brand highlight
- Drop target folder: Brand background
- Drop line: 2px brand line between items
- Invalid drop: Cursor forbidden

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Full width, simplified actions |
| Tablet (768-1024px) | Standard tree |
| Desktop (>1024px) | Standard tree with all actions |

---

## Accessibility

- All items keyboard navigable
- Expand/collapse announced
- Focus visible on navigation
- Screen reader labels for actions
- Drag operations announced
