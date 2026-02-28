# Document Editor - Deep UX Comparison

## Overview
The document editor is the core writing experience. A powerful rich text editor enables teams to create formatted content with headings, lists, code blocks, images, and more. This analysis compares Plane (TipTap) vs Cascade (Plate.js) across formatting, toolbars, collaboration, and UX efficiency.

---

## Entry Points Comparison

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Document click** | Opens in same page | Opens document page | Tie |
| **New document** | Modal → editor | Direct to editor | Cascade faster |
| **Sidebar link** | Click page name | Click document name | Tie |
| **URL direct** | `/[ws]/projects/[proj]/pages/[id]` | `/:org/documents/:id` | Tie |
| **Search result** | Click opens editor | Click opens editor | Tie |

---

## Layout Comparison

### Plane Editor Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Page Header                                                                  │
│ [← Back] 📄 Document Title                    [👤 Collaborators] [⋯ Menu]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Fixed Toolbar                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ [H1▼] [B] [I] [U] [S] │ [📝] [🔗] [📷] │ [≡] [•] [☐] │ [A▼] [🎨▼] [⋯]││
│ │  ↑     ↑   ↑   ↑   ↑      ↑    ↑    ↑      ↑   ↑   ↑     ↑    ↑      ││
│ │ Text  Bold Ital Under Strike Code Link Img List Bullet Todo Color Bg  ││
│ └─────────────────────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────┬──────────────────────┤
│ Editor Body                                          │ Navigation Pane      │
│ ┌──────────────────────────────────────────────────┐ │ ┌──────────────────┐│
│ │                                                  │ │ │ [Outline] [📎] [ℹ]│
│ │ # Heading 1                                      │ │ ├──────────────────┤│
│ │                                                  │ │ │ Heading 1        ││
│ │ Paragraph text here...                           │ │ │   Heading 2      ││
│ │                                                  │ │ │   Heading 2      ││
│ │ ## Heading 2                                     │ │ │     Heading 3    ││
│ │                                                  │ │ │ Another H1       ││
│ │ - Bullet point                                   │ │ │                  ││
│ │ - Another point                                  │ │ │ ↑ Click to jump  ││
│ │                                                  │ │ └──────────────────┘│
│ │ ```javascript                                    │ │                      │
│ │ const code = "highlighted";                      │ │ Assets (📎 tab):     │
│ │ ```                                              │ │ ┌──────────────────┐│
│ │                                                  │ │ │ 📷 image1.png    ││
│ │ [+ Side menu appears on hover]                   │ │ │ 📷 image2.png    ││
│ │                                                  │ │ │ Click to jump    ││
│ └──────────────────────────────────────────────────┘ │ └──────────────────┘│
│                                                      │                      │
│ Collaboration:                                       │ Info (ℹ tab):       │
│ ┌──────────────────────────────────────────────────┐ │ ┌──────────────────┐│
│ │ 🔴 Alice (typing...)  🟢 Bob (viewing)           │ │ │ Created: Jan 15  ││
│ │ ↑ Multiple cursors with user colors              │ │ │ By: @alice       ││
│ └──────────────────────────────────────────────────┘ │ │ Editors: 3       ││
│                                                      │ │ Words: 1,234     ││
│                                                      │ └──────────────────┘│
└──────────────────────────────────────────────────────┴──────────────────────┘
```

### Cascade Editor Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Document Header                                                              │
│ 📄 Document Title                              [👥 3 online] [🔒] [⋯ Menu] │
│ ↑ Click to edit inline                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Editor Body (No fixed toolbar)                                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │                                                                          ││
│ │ # Heading 1                                                              ││
│ │                                                                          ││
│ │ Paragraph text here...                                                   ││
│ │ ┌──────────────────────────────────┐                                     ││
│ │ │ [B] [I] [U] [S] [H1▼] [📝] [⋯]  │ ← Floating Toolbar                  ││
│ │ └──────────────────────────────────┘   (appears on text selection)       ││
│ │ ## Heading 2                                                             ││
│ │                                                                          ││
│ │ - Bullet point                                                           ││
│ │ - Another point                                                          ││
│ │                                                                          ││
│ │ Type / for commands...                                                   ││
│ │ ┌──────────────────────────────────┐                                     ││
│ │ │ 📝 Heading 1                     │ ← Slash Menu                        ││
│ │ │ 📝 Heading 2                     │   (appears on /)                    ││
│ │ │ • Bullet List                    │                                     ││
│ │ │ 1. Numbered List                 │                                     ││
│ │ │ ☐ Todo List                      │                                     ││
│ │ │ " Quote                          │                                     ││
│ │ │ </> Code Block                   │                                     ││
│ │ └──────────────────────────────────┘                                     ││
│ │                                                                          ││
│ │ ⣿ (drag handle on hover)                                                 ││
│ │                                                                          ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ Presence Indicators (bottom-right corner):                                  │
│ ┌───────────────────────────┐                                               │
│ │ 🟢 Alice  🟢 Bob  🟡 Carol │ ← Cursor colors match in editor              │
│ └───────────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Toolbar Comparison

### Toolbar Position

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Position** | Fixed top bar | Floating (on selection) |
| **Visibility** | Always visible | On-demand |
| **Screen usage** | ~40px height always | 0px when not selecting |
| **Mobile friendly** | Fixed bar scrolls | Floating adapts |

### Toolbar Features

| Feature | Plane Toolbar | Cascade Toolbar |
|---------|---------------|-----------------|
| **Heading presets** | Dropdown (H1-H6) | Dropdown (H1-H3) |
| **Bold** | Yes (Cmd+B) | Yes (Cmd+B) |
| **Italic** | Yes (Cmd+I) | Yes (Cmd+I) |
| **Underline** | Yes (Cmd+U) | Yes (Cmd+U) |
| **Strikethrough** | Yes | Yes |
| **Inline code** | Yes | Yes |
| **Link** | Yes | Yes |
| **Text color** | Color picker | No |
| **Background color** | Color picker | No |
| **Text alignment** | Yes (L/C/R/J) | No |
| **List toggles** | Yes | Yes |
| **Table insert** | Via menu | Via slash |

---

## Formatting Features

### Typography

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Heading levels** | H1-H6 | H1-H3 |
| **Bold** | Yes | Yes |
| **Italic** | Yes | Yes |
| **Underline** | Yes | Yes |
| **Strikethrough** | Yes | Yes |
| **Inline code** | Yes | Yes |
| **Text colors** | Yes (picker) | No |
| **Background colors** | Yes (picker) | No |
| **Text alignment** | L/C/R/Justify | No |

### Block Elements

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Bullet lists** | Yes | Yes |
| **Numbered lists** | Yes | Yes |
| **Todo lists** | Yes (checkboxes) | Yes (checkboxes) |
| **Blockquotes** | Yes | Yes |
| **Code blocks** | Yes (highlight.js) | Yes (syntax) |
| **Tables** | Yes (full editing) | Yes |
| **Horizontal rules** | Yes | Yes |
| **Callout blocks** | Yes | No |
| **Images** | Yes (upload) | Yes (upload) |
| **Embeds** | Issue cards | No |

### Advanced Features

| Feature | Plane | Cascade |
|---------|-------|---------|
| **@mentions** | Users, issues | No |
| **Slash commands** | Yes (/) | Yes (/) |
| **Side menu** | Block operations | No |
| **Drag-drop blocks** | Yes | Yes |
| **AI assistance** | Yes (if enabled) | No |

---

## Click Analysis

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Bold text** | 1 click (toolbar) or Cmd+B | Select + 1 click or Cmd+B | Tie |
| **Add heading** | 2 clicks (dropdown → select) | Type `#` or 2 clicks | Tie |
| **Insert code block** | 2 clicks (toolbar → code) | Type `/code` + Enter | Cascade faster |
| **Insert table** | 3 clicks (menu → table → size) | Type `/table` + Enter | Cascade faster |
| **Add image** | 2 clicks (toolbar → upload) | Type `/image` + Enter | Cascade faster |
| **Change text color** | 3 clicks (A → picker → color) | N/A | Plane only |
| **Add @mention** | Type `@` + select | N/A | Plane only |
| **Navigate to heading** | 1 click (sidebar outline) | N/A | Plane only |
| **Jump to image** | 1 click (assets tab) | N/A | Plane only |

---

## Slash Commands

| Command | Plane | Cascade |
|---------|-------|---------|
| **Trigger** | `/` | `/` |
| **Heading 1** | `/heading1` | `/h1` |
| **Heading 2** | `/heading2` | `/h2` |
| **Heading 3** | `/heading3` | `/h3` |
| **Bullet list** | `/bullet` | `/bullet` |
| **Numbered list** | `/number` | `/numbered` |
| **Todo list** | `/todo` | `/todo` |
| **Quote** | `/quote` | `/quote` |
| **Code block** | `/code` | `/code` |
| **Table** | `/table` | `/table` |
| **Image** | `/image` | `/image` |
| **Divider** | `/divider` | `/divider` |
| **Callout** | `/callout` | N/A |
| **Mention** | `@` | N/A |

---

## Navigation Pane (Plane Only)

```
┌──────────────────────────────────────┐
│ [Outline] [Assets] [Info]            │
├──────────────────────────────────────┤
│                                      │
│ Outline Tab:                         │
│ ├─ Introduction                      │
│ │   ├─ Background                    │
│ │   └─ Objectives                    │
│ ├─ Implementation                    │
│ │   ├─ Phase 1                       │
│ │   └─ Phase 2                       │
│ └─ Conclusion                        │
│                                      │
│ Click any heading to scroll →        │
│                                      │
├──────────────────────────────────────┤
│ Assets Tab:                          │
│ 📷 screenshot1.png                   │
│ 📷 diagram.svg                       │
│ 📎 document.pdf                      │
├──────────────────────────────────────┤
│ Info Tab:                            │
│ Created: Jan 15, 2026                │
│ By: @alice                           │
│ Last edited: 2 hours ago             │
│ Word count: 1,234                    │
│ Editors: Alice, Bob, Carol           │
└──────────────────────────────────────┘
```

---

## Real-Time Collaboration

### Technology Stack

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **CRDT library** | Yjs | Yjs |
| **Transport** | Hocuspocus (WebSocket) | Convex-Yjs Provider |
| **Persistence** | IndexedDB | Convex DB |
| **Offline support** | Yes | No |

### Collaboration Features

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Multiple cursors** | Yes (colored) | Yes (colored) |
| **Cursor names** | Username labels | On hover |
| **Presence indicators** | Header avatars | Avatar pile |
| **Offline editing** | Yes (sync on reconnect) | No |
| **Connection state** | Visual indicator | Basic indicator |
| **Conflict resolution** | CRDT automatic | CRDT automatic |

### Collaboration States (Plane)
```
┌────────────┐    ┌─────────────┐    ┌───────────────┐    ┌────────────┐
│  Initial   │───▶│ Connecting  │───▶│ Awaiting Sync │───▶│   Synced   │
└────────────┘    └─────────────┘    └───────────────┘    └────────────┘
                         │                                       │
                         │ fail                                  │ disconnect
                         ▼                                       ▼
                  ┌─────────────┐                        ┌─────────────┐
                  │  Retry (3x) │                        │ Reconnecting│
                  └─────────────┘                        └─────────────┘
```

---

## Version History

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Auto-save versions** | Yes | Yes |
| **Max versions** | Unlimited? | 50 |
| **Restore version** | Yes | Yes |
| **Compare versions** | Yes (diff view) | No |
| **Version metadata** | Author, timestamp | Creator, timestamp |
| **Delete versions** | No | No |

---

## Keyboard Shortcuts

| Shortcut | Plane | Cascade |
|----------|-------|---------|
| **Bold** | Cmd/Ctrl+B | Cmd/Ctrl+B |
| **Italic** | Cmd/Ctrl+I | Cmd/Ctrl+I |
| **Underline** | Cmd/Ctrl+U | Cmd/Ctrl+U |
| **Code** | Cmd/Ctrl+E | Cmd/Ctrl+E |
| **Link** | Cmd/Ctrl+K | Cmd/Ctrl+K |
| **Undo** | Cmd/Ctrl+Z | Cmd/Ctrl+Z |
| **Redo** | Cmd/Ctrl+Shift+Z | Cmd/Ctrl+Shift+Z |
| **Heading 1** | Cmd+Alt+1 | N/A |
| **Heading 2** | Cmd+Alt+2 | N/A |
| **Bullet list** | Cmd+Shift+8 | N/A |
| **Numbered list** | Cmd+Shift+7 | N/A |
| **Slash menu** | / | / |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Formatting richness | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane has colors, alignment |
| Toolbar accessibility | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane always visible |
| Clean interface | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade minimal |
| Navigation pane | ⭐⭐⭐⭐⭐ | ⭐ | Plane has outline/assets |
| @Mentions | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Slash commands | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both full support |
| Offline support | ⭐⭐⭐⭐⭐ | ⭐ | Plane IndexedDB |
| Version comparison | ⭐⭐⭐⭐⭐ | ⭐ | Plane diff view |
| Real-time collab | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both excellent |
| Keyboard shortcuts | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane more shortcuts |
| Drag-drop blocks | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both supported |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Add @mentions** - Trigger with `@`, search users, link to profile
   ```tsx
   // Already in progress via MentionPlugin
   const MentionElement = ({ attributes, children, element }) => (
     <span {...attributes} className="text-brand">
       @{element.value}
       {children}
     </span>
   );
   ```

2. **Add text colors** - Text foreground and background color pickers
   ```tsx
   <ColorPickerButton
     icon={<TextColorIcon />}
     onChange={(color) => toggleMark(editor, "textColor", { color })}
   />
   ```

### P1 - High
3. **Add navigation pane sidebar** - Outline, assets, info tabs
4. **Add H4-H6 heading levels** - Full heading hierarchy for long documents
5. **Add text alignment** - Left, center, right, justify

### P2 - Medium
6. **Add offline support** - IndexedDB persistence with sync on reconnect
7. **Add version comparison** - Diff view between versions
8. **Add callout blocks** - Info, warning, error, success callouts
9. **Add more keyboard shortcuts** - Heading levels, list toggles

### P3 - Nice to Have
10. **Add fixed toolbar option** - Toggle between floating and fixed
11. **Add issue/work item embeds** - Embed issue cards in documents
12. **Add AI writing assistance** - Grammar, summarize, expand

---

## Code References

### Plane
- Editor body: `apps/web/core/components/pages/editor/editor-body.tsx`
- Collaborative editor: `packages/editor/src/core/components/editors/document/collaborative-editor.tsx`
- Extensions: `packages/editor/src/core/extensions/`
- Toolbar: `apps/web/core/components/pages/editor/toolbar/`
- Navigation pane: `apps/web/core/components/pages/navigation-pane/`
- Yjs provider: `packages/editor/src/core/providers/`

### Cascade
- PlateEditor: `src/components/PlateEditor.tsx`
- Plugins: `src/lib/plate/plugins.ts`
- FloatingToolbar: `src/components/Plate/FloatingToolbar.tsx`
- SlashMenu: `src/components/Plate/SlashMenu.tsx`
- MentionElement: `src/components/Plate/MentionElement.tsx`
- ColorPickerButton: `src/components/Plate/ColorPickerButton.tsx`
- Collaborators: `src/components/Plate/Collaborators.tsx`
- Yjs integration: `convex/yjsDocuments.ts`
