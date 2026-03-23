# Plate Editor Architecture

Document editor built on [Plate.js](https://platejs.org/) (Slate-based).

## Overview

The Plate editor replaces the previous BlockNote implementation with:

- Better React 19 compatibility
- AI plugin support (future)
- Native shadcn/ui styling
- Y.js collaboration support (stubbed)

## Architecture

```
src/
├── components/
│   ├── PlateEditor.tsx           # Main editor wrapper component
│   └── plate/
│       ├── FloatingToolbar.tsx   # Selection-based formatting toolbar
│       ├── SlashMenu.tsx         # "/" command menu
│       ├── DragHandle.tsx        # Block drag-drop handles
│       └── Collaborators.tsx     # Real-time collaborator avatars
├── lib/
│   ├── plate/
│   │   ├── plugins.ts            # Plugin configuration & node types
│   │   ├── editor.ts             # Editor instance factory
│   │   └── markdown.ts           # Markdown <-> Slate conversion
│   └── yjs/
│       ├── ConvexYjsProvider.ts  # Y.js sync provider (stub)
│       └── awareness.ts          # Cursor position sync (stub)
convex/
├── yjs.ts                        # Y.js backend functions
└── migrations/
    ├── blockNoteToPlate.ts       # Format converter
    └── migrateDocuments.ts       # Batch migration mutation
```

## Plugin Configuration

**File:** `src/lib/plate/plugins.ts`

| Category | Plugins |
|----------|---------|
| Core | `BaseParagraphPlugin` |
| Marks | `BoldPlugin`, `ItalicPlugin`, `UnderlinePlugin`, `StrikethroughPlugin`, `CodePlugin` |
| Blocks | `H1Plugin`, `H2Plugin`, `H3Plugin`, `BlockquotePlugin` |
| Lists | `ListPlugin` |
| Code | `CodeBlockPlugin`, `CodeLinePlugin`, `CodeSyntaxPlugin` |
| Tables | `TablePlugin`, `TableRowPlugin`, `TableCellPlugin`, `TableCellHeaderPlugin` |
| Media | `ImagePlugin` |
| Interaction | `DndPlugin`, `BaseSlashPlugin` |

## Node Types

**File:** `src/lib/plate/plugins.ts` - `NODE_TYPES` constant

```typescript
const NODE_TYPES = {
  // Blocks
  paragraph: "p",
  heading1: "h1",
  heading2: "h2",
  heading3: "h3",
  blockquote: "blockquote",
  codeBlock: "code_block",

  // Lists
  bulletedList: "ul",
  numberedList: "ol",
  listItem: "li",

  // Tables
  table: "table",
  tableRow: "tr",
  tableCell: "td",
  tableCellHeader: "th",

  // Marks
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikethrough",
  code: "code",
};
```

## Components

### PlateEditor

Main wrapper component. Handles document loading, saving, and renders the editor.

```tsx
<PlateEditor documentId={doc._id} />
```

### FloatingToolbar

Appears when text is selected. Provides quick access to:
- Bold, Italic, Underline, Strikethrough
- Inline code
- Link insertion

### SlashMenu

Triggered by typing `/`. Supports fuzzy search. Available commands:
- Text, Heading 1-3
- Bullet/Numbered lists
- Quote, Code block
- Table, Image

### DragHandle

Shows on block hover. Enables:
- Drag-and-drop reordering
- Block duplication
- Block deletion

## Y.js Collaboration (Stub)

Real-time collaboration is currently stubbed. Full implementation requires:

1. **Backend endpoints** in `convex/yjs.ts`:
   - `getDocumentState` - fetch Y.js state vector
   - `applyUpdate` - apply Y.js update
   - `getAwareness` - get cursor positions

2. **ConvexYjsProvider** (`src/lib/yjs/ConvexYjsProvider.ts`):
   - Connects Y.Doc to Convex backend
   - Handles conflict resolution via Y.js CRDT
   - Broadcasts local changes, applies remote changes

3. **Awareness** (`src/lib/yjs/awareness.ts`):
   - Tracks cursor positions per user
   - Shows collaborator presence

## Editor API

### Creating an Editor

```typescript
import { usePlateEditor } from "platejs/react";
import { getEditorPlugins, getInitialValue } from "@/lib/plate/editor";

const editor = usePlateEditor({
  plugins: getEditorPlugins(),
  value: getInitialValue(),
});
```

### Transforms

Use `editor.tf.*` methods for operations:

```typescript
// Set block type
editor.tf.setNodes({ type: NODE_TYPES.heading1 });

// Insert content
editor.tf.insertNodes({ type: NODE_TYPES.image, url: "...", children: [{ text: "" }] });

// Delete
editor.tf.deleteBackward("character");
editor.tf.removeNodes({ at: path });

// Selection
editor.tf.select(path);
```

### Serialization

```typescript
import { serializeValue, deserializeValue } from "@/lib/plate/editor";

// Save
const json = serializeValue(editor.children);

// Load
const value = deserializeValue(storedJson);
```

## Migration from BlockNote

**Converter:** `convex/migrations/blockNoteToPlate.ts`

Converts BlockNote JSON format to Plate/Slate nodes:

| BlockNote | Plate |
|-----------|-------|
| `paragraph` | `p` |
| `heading.level=1` | `h1` |
| `bulletListItem` | `ul > li` |
| `numberedListItem` | `ol > li` |
| `checkListItem` | `todo_li` |
| `codeBlock` | `code_block > code_line` |
| `table` | `table > tr > td/th` |

**Migration mutation:** `convex/migrations/migrateDocuments.ts`

```bash
# Run migration (in Convex dashboard or via mutation call)
npx convex run migrations:migrateDocuments:migrateAllDocuments
```

## Testing

### Unit Tests

- `src/lib/plate/markdown.test.ts` - Markdown conversion
- `convex/yjs.test.ts` - Y.js backend functions
- `convex/migrations/blockNoteToPlate.test.ts` - Format conversion

### E2E Tests

**File:** `e2e/documents.spec.ts`

```typescript
// Page object selectors
this.editor = page.getByTestId("plate-editor");

// Basic editing test
await page.getByTestId("plate-editor").click();
await page.keyboard.type("Hello world");
```

## Known Limitations

1. **Y.js sync is stubbed** - Collaboration requires backend implementation
2. **Markdown import/export** - Not yet wired to UI (converter exists)
3. **Link plugin** - Basic prompt-based, no proper LinkPlugin integration
4. **Image upload** - URL-only, no file upload dialog
