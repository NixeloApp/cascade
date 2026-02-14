# Document Editor Page - Target State

> **Route**: `/:slug/documents/:id`
> **Reference**: Mintlify editor, Notion
> **Goal**: Clean editing, document navigation, rich blocks

---

## Reference Screenshots

| Source | Preview |
|--------|---------|
| Mintlify Editor | ![](screenshots/reference-mintlify-editor.png) |

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Layout | Single column | Two-column with sidebar |
| Header | Cluttered actions | Minimal: branch + publish |
| Navigation | None | Document tree sidebar |
| Blocks | Basic types | Callouts, cards, embeds |
| Toolbar | Floating only | Floating + fixed header |
| Collaboration | Avatars only | Cursors + avatars |

---

## Target Layout

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
| [+] Add new      |      | Edit locally           |  | Customize your site    |  |
|                  |      | Edit your docs locally |  | Customize the design   |  |
+--[gear]----------+      +------------------------+  +------------------------+  |
```

---

## Design Tokens

### Background Colors

| Element | Token | Notes |
|---------|-------|-------|
| Sidebar bg | `bg-ui-bg-secondary` | Slightly lighter |
| Editor bg | `bg-ui-bg` | Main page bg |
| Callout bg | `bg-ui-bg-secondary` | Subtle card |
| Card bg | `bg-ui-bg-secondary` | Feature cards |

### Border Colors

| Element | Token |
|---------|-------|
| Sidebar border | `border-ui-border` |
| Callout border | `border-ui-border` |
| Card border | `border-ui-border` |

### Typography

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| H1 | `text-4xl` | 700 | 48px, bold |
| H2 | `text-2xl` | 600 | 28px, semibold |
| H3 | `text-xl` | 600 | 20px, semibold |
| Body | `text-base` | 400 | 16px |
| Subtitle | `text-base` | 400 | Muted color |
| Callout title | `text-base` | 500 | Medium |
| Callout text | `text-sm` | 400 | Smaller |

### Spacing

| Element | Value | Notes |
|---------|-------|-------|
| Sidebar width | 240px | Fixed |
| Editor max-width | 768px | 3xl centered |
| Editor padding | 48px top | Comfortable |
| Section gap | 48px | Between H2 sections |
| Paragraph gap | 16px | Between paragraphs |
| Callout padding | 16px | All sides |

---

## Animations

### Sidebar Item Hover

```css
.sidebar-item {
  transition: background-color 0.15s ease;
}

.sidebar-item:hover {
  background-color: var(--color-ui-bg-tertiary);
}

.sidebar-item[data-selected="true"] {
  background-color: var(--color-ui-bg-tertiary);
  color: var(--color-ui-text);
}
```

### Save Indicator

```css
@keyframes save-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.save-indicator[data-saving="true"] {
  animation: save-pulse 1s ease-in-out infinite;
}
```

### Callout Icon Bounce

```css
@keyframes icon-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.callout-icon:hover {
  animation: icon-bounce 0.3s ease;
}
```

---

## New Block Types

### Callout Block

```
+--------------------------------------------------+
| [icon]  Title                                     |
|         Description text that can span multiple   |
|         lines and provides context.               |
+--------------------------------------------------+

Variants:
- Info (blue icon)
- Tip (green icon)
- Warning (yellow icon)
- Error (red icon)
```

### Card Grid Block

```
+------------------------+  +------------------------+
| [icon]                 |  | [icon]                 |
|                        |  |                        |
| Card Title             |  | Card Title             |
| Description text...    |  | Description text...    |
+------------------------+  +------------------------+
```

---

## Component Inventory

### New Components Needed

| Component | Purpose |
|-----------|---------|
| DocumentSidebar | Navigation tree |
| SidebarSection | Collapsible group |
| SidebarItem | Document link |
| BranchSelector | Branch dropdown |
| PublishButton | Green CTA |
| CalloutBlock | Rich callout |
| CardGridBlock | Two-column cards |
| SyncIndicator | Save status |

### Existing to Enhance

| Component | Changes |
|-----------|---------|
| DocumentHeader | Simplify, add branch/publish |
| BlockNoteEditor | Add callout/card blocks |
| FloatingToolbar | Polish styling |
| SlashMenu | Add new block types |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Cmd+S` | Save (manual) |
| `Cmd+B` | Bold |
| `Cmd+I` | Italic |
| `Cmd+U` | Underline |
| `Cmd+K` | Insert link |
| `/` | Slash commands |
| `#` | Heading shortcut |

---

## Collaboration Features

- Real-time presence avatars in header
- Colored cursors showing other users
- Selection highlighting
- "Saving..." / "Saved" indicator
- Conflict resolution (Y.js CRDT)

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Sidebar hidden, hamburger menu |
| Tablet (768-1024px) | Narrow sidebar |
| Desktop (>1024px) | Full two-column layout |

---

## Accessibility

- All toolbar buttons keyboard accessible
- Slash menu navigable with arrows
- Editor announces changes
- Focus management on dialog open/close
- Heading hierarchy maintained
