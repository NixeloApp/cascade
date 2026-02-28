# Document Editor

## Overview

The document editor is the core writing experience. A powerful rich text editor enables teams to create formatted content with headings, lists, code blocks, images, and more.

---

## plane

### Editor Library

**TipTap 2.22.3** (ProseMirror-based)
- Industry-standard rich text editor
- Extensive extension ecosystem
- Built-in collaboration support

### Editor Structure

```
PageRoot
├── PageEditorToolbarRoot (formatting toolbar)
├── PageEditorBody (main editor)
│   └── CollaborativeDocumentEditorWithRef
│       ├── PageEditorTitle (separate title editor)
│       └── TipTap Editor
└── PageNavigationPaneRoot (sidebar)
    ├── Outline tab (table of contents)
    ├── Assets tab (images)
    └── Info tab (metadata)
```

### Formatting Features

**Typography**:
- Headings (H1-H6)
- Bold, Italic, Underline, Strikethrough
- Code inline
- Text colors and backgrounds
- Text alignment

**Block Elements**:
- Bullet lists
- Numbered lists
- Task lists (checkboxes)
- Blockquotes
- Code blocks (syntax highlighting via highlight.js)
- Tables
- Horizontal rules
- Callout blocks

**Advanced**:
- Images with upload
- Links with preview
- User @mentions
- Work item embeds
- Slash commands (`/` menu)
- Side menu for block operations
- Drag-and-drop blocks

### Toolbar

**Location**: Fixed top toolbar

**Features**:
- Typography presets (H1, H2, paragraph)
- Bold, Italic, Underline buttons
- List type toggles
- Link insertion
- Color picker (text/background)
- More options dropdown

**Dynamic States**:
- Buttons reflect current selection
- Keyboard shortcuts in tooltips

### Real-Time Collaboration

**Stack**:
- Yjs (CRDT) for conflict-free editing
- Hocuspocus Provider (WebSocket)
- IndexedDB persistence (offline support)

**Features**:
- Multiple cursors with user colors
- Real-time sync across devices
- Offline editing with sync on reconnect
- Connection state tracking

**Collaboration States**:
- Initial → Connecting → Awaiting Sync → Synced
- Reconnection with retry logic (max 3)
- Fallback recovery for corrupted cache

### Navigation Pane (Sidebar)

**Outline Tab**:
- Auto-generated from headings
- Click to jump to section
- Hierarchical structure

**Assets Tab**:
- List of embedded images
- Click to jump to image

**Info Tab**:
- Creation date, owner
- Collaborators list
- Activity log

### Version History

- Full version tracking
- Restore previous versions
- Compare changes
- Version metadata (author, timestamp)

---

## Cascade

### Editor Library

**Plate.js** (Slate-based)
- Modern React-first editor
- shadcn/ui styling compatibility
- AI plugin support

### Editor Structure

```
DocumentPage
├── DocumentHeader (title, controls)
├── PlateEditor (main editor)
│   ├── FloatingToolbar (context menu)
│   ├── SlashMenu (/ commands)
│   └── DragHandle (block reordering)
└── PresenceIndicator (collaborators)
```

### Formatting Features

**Typography**:
- Headings (H1-H3)
- Bold, Italic, Underline, Strikethrough
- Code inline

**Block Elements**:
- Bullet lists
- Numbered lists
- Todo lists (checkboxes)
- Blockquotes
- Code blocks (syntax highlighting)
- Tables
- Images

**Plugins** (from plugins.ts):
- `BoldPlugin`, `ItalicPlugin`, `UnderlinePlugin`
- `CodePlugin`, `CodeSyntaxPlugin`
- `BlockquotePlugin`, `HeadingPlugin`
- `ListPlugin`, `TodoListPlugin`
- `TablePlugin`, `ImagePlugin`
- `DndPlugin` (drag-and-drop)
- `BaseSlashPlugin` (slash commands)

### Toolbar

**Location**: Floating toolbar (appears on selection)

**Features**:
- Bold, Italic, Underline buttons
- Heading toggles
- List toggles
- Code toggle
- Context-sensitive (shows relevant options)

### Real-Time Collaboration

**Stack**:
- Yjs for CRDT
- Convex-Yjs Provider (custom)
- Convex presence API

**Features**:
- User presence indicators
- Cursor colors per user
- Real-time sync via Convex

**Tables**:
- `yjsDocuments`: Stores Y.js state
- `yjsAwareness`: Tracks active editors

### Slash Commands

**Trigger**: Type `/`

**Available Commands**:
- Headings (H1, H2, H3)
- Lists (bullet, numbered, todo)
- Quote
- Code block
- Table
- Image

### Version History

- Auto-save versions
- Up to 50 versions kept
- Restore with reload
- Creator attribution
- Relative timestamps

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Editor library | TipTap | Plate.js | tie |
| Heading levels | H1-H6 | H1-H3 | plane |
| Text colors | Yes | No | plane |
| Code highlighting | Yes (highlight.js) | Yes | tie |
| Tables | Yes | Yes | tie |
| Images | Yes (upload) | Yes | tie |
| User mentions | Yes | No | plane |
| Work item embeds | Yes | No | plane |
| Toolbar position | Fixed top | Floating | preference |
| Slash commands | Yes | Yes | tie |
| Drag-drop blocks | Yes | Yes | tie |
| Real-time collab | Yes (Hocuspocus) | Yes (Convex) | tie |
| Multiple cursors | Yes | Yes | tie |
| Offline support | Yes (IndexedDB) | No | plane |
| Navigation pane | Yes (outline, assets, info) | No | plane |
| Version history | Yes | Yes | tie |
| Version comparison | Yes | No | plane |

---

## Recommendations

1. **Priority 1**: Add navigation pane sidebar
   - Outline tab with auto-generated TOC
   - Click to jump to sections
   - Show document structure

2. **Priority 2**: Add user @mentions
   - Trigger with `@` symbol
   - Search users in org
   - Link to user profile

3. **Priority 3**: Add text colors
   - Text foreground color
   - Background highlight color
   - Color picker UI

4. **Priority 4**: Add H4-H6 heading levels
   - Full heading hierarchy
   - Useful for long documents

5. **Priority 5**: Add offline support
   - IndexedDB persistence
   - Sync when reconnected
   - Offline indicator

6. **Priority 6**: Add issue/work item embeds
   - Embed issue cards in documents
   - Link to issue detail
   - Real-time status updates

---

## Implementation: Navigation Pane

```tsx
function DocumentNavigationPane({ editor }) {
  const [activeTab, setActiveTab] = useState<"outline" | "assets" | "info">("outline");

  return (
    <div className="w-64 border-l">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="outline">
          <OutlineTree editor={editor} />
        </TabsContent>

        <TabsContent value="assets">
          <AssetsList editor={editor} />
        </TabsContent>

        <TabsContent value="info">
          <DocumentInfo document={document} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OutlineTree({ editor }) {
  const headings = useMemo(() => {
    return editor.children
      .filter(node => node.type?.startsWith("h"))
      .map(node => ({
        level: parseInt(node.type.replace("h", "")),
        text: Node.string(node),
        id: node.id,
      }));
  }, [editor.children]);

  return (
    <ul className="space-y-1">
      {headings.map(heading => (
        <li
          key={heading.id}
          style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
        >
          <button onClick={() => scrollToHeading(heading.id)}>
            {heading.text}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

---

## Implementation: @Mentions

```tsx
// Plate.js mention plugin
const mentionPlugin = createPluginFactory({
  key: "mention",
  isElement: true,
  isInline: true,
  isVoid: true,
  handlers: {
    onKeyDown: (editor) => (event) => {
      if (event.key === "@") {
        // Open mention picker
        openMentionPicker();
      }
    },
  },
})();

// Mention picker component
function MentionPicker({ onSelect }) {
  const users = useQuery(api.users.listOrganizationMembers, { organizationId });
  const [search, setSearch] = useState("");

  const filtered = users?.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Command>
      <CommandInput value={search} onValueChange={setSearch} />
      <CommandList>
        {filtered?.map(user => (
          <CommandItem key={user._id} onSelect={() => onSelect(user)}>
            <Avatar user={user} size="sm" />
            <span>{user.name}</span>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
```

---

## Screenshots/References

### plane
- Editor body: `~/Desktop/plane/apps/web/core/components/pages/editor/editor-body.tsx`
- Collaborative editor: `~/Desktop/plane/packages/editor/src/core/components/editors/document/collaborative-editor.tsx`
- Extensions: `~/Desktop/plane/packages/editor/src/core/extensions/`
- Toolbar: `~/Desktop/plane/apps/web/core/components/pages/editor/toolbar/`
- Navigation pane: `~/Desktop/plane/apps/web/core/components/pages/navigation-pane/`

### Cascade
- PlateEditor: `~/Desktop/cascade/src/components/PlateEditor.tsx`
- Plugins: `~/Desktop/cascade/src/lib/plate/plugins.ts`
- FloatingToolbar: `~/Desktop/cascade/src/components/Plate/FloatingToolbar.tsx`
- SlashMenu: `~/Desktop/cascade/src/components/Plate/SlashMenu.tsx`
- Collaborators: `~/Desktop/cascade/src/components/Plate/Collaborators.tsx`
