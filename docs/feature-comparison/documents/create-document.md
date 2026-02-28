# Create Document

## Overview

Document creation is the entry point for knowledge management. Users create new documents to capture meeting notes, project plans, specifications, and other team knowledge.

---

## plane

### Trigger

- **Button**: "Add Page" in pages list header
- **Location**: `/[workspace]/projects/[project]/pages/`
- **Keyboard shortcut**: None

### UI Elements

**Modal**: `CreatePageModal`
- Position: Top of viewport (`EModalPosition.TOP`)
- Width: XXL
- Backdrop click to close

**Form Fields** (`PageForm`):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Title | Text input | Yes | Max 255 characters |
| Logo | Emoji/Icon picker | No | Emoji or custom icon with color |
| Access | Radio buttons | Yes | Public or Private |

### Flow

1. User clicks "Add Page" button in header
2. Modal opens with form fields
3. User enters page title (required)
4. Optionally selects emoji/icon for logo
5. Selects access level (Public/Private)
6. Clicks "Create Page"
7. Page created via `ProjectPageService.create()`
8. Modal closes, navigates to new page editor

### Feedback

- **Success**: Modal closes, redirects to editor
- **Error**: Inline validation messages
- **Loading**: Submit button shows loading state

### Notable Features

- Emoji picker with search
- Custom icon selection with color
- Access control set at creation time
- Async creation with loading states

---

## Cascade

### Trigger

- **Button**: "+" in sidebar Documents section
- **Location**: Sidebar, always visible
- **Keyboard shortcut**: None

### UI Elements

**Inline Creation**: No modal
- Creates document immediately with default title
- Redirects to document page for editing

**No Form Fields**: Document created with defaults:
- Title: "Untitled Document"
- Visibility: Private
- Organization-scoped

### Flow

1. User clicks "+" button in sidebar Documents section
2. `createDocument` mutation called immediately
3. Document created with:
   - Title: "Untitled Document"
   - isPublic: false
   - organizationId: current org
4. User redirected to document detail page
5. User can edit title in DocumentHeader

### Feedback

- **Success**: Redirect to document page
- **Error**: Toast notification
- **Loading**: Minimal (fast optimistic creation)

### Notable Features

- Instant creation (no modal)
- Edit title inline after creation
- Supports parent document (hierarchy)
- Order field for sibling sorting
- Rate limiting enforced

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Creation trigger | Modal | Instant (no modal) | Cascade (faster) |
| Title input | In modal | After creation | plane (explicit) |
| Emoji/icon | Yes (picker) | No | plane |
| Access control | At creation | Default private | plane |
| Project scoping | Always | Optional | tie |
| Keyboard shortcut | No | No | tie |
| Parent/hierarchy | No | Yes | Cascade |
| Loading state | In modal | Redirect | tie |

---

## Recommendations

1. **Priority 1**: Add optional quick-create modal with title and emoji
   - Keep current instant creation as default
   - Modal accessible via dropdown or Shift+Click

2. **Priority 2**: Add emoji/icon picker for documents
   - Show in document header
   - Persist to document metadata

3. **Priority 3**: Add access control in creation flow
   - Dropdown to select Public/Private
   - Default to Private

4. **Priority 4**: Add keyboard shortcut for document creation
   - `D` or `Ctrl+Shift+D` from anywhere

---

## Implementation Suggestion

```tsx
// Quick create with options modal
function CreateDocumentModal({ onClose }) {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState(null);
  const [isPublic, setIsPublic] = useState(false);

  return (
    <Dialog>
      <DialogHeader>Create Document</DialogHeader>
      <DialogContent>
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <Input
          value={title}
          onChange={setTitle}
          placeholder="Document title..."
          autoFocus
        />
        <Switch
          checked={isPublic}
          onCheckedChange={setIsPublic}
          label="Public document"
        />
      </DialogContent>
      <DialogFooter>
        <Button onClick={handleCreate}>Create</Button>
      </DialogFooter>
    </Dialog>
  );
}
```

---

## Screenshots/References

### plane
- Create modal: `~/Desktop/plane/apps/web/core/components/pages/modals/create-page-modal.tsx`
- Page form: `~/Desktop/plane/apps/web/core/components/pages/modals/page-form.tsx`
- Service: `~/Desktop/plane/apps/web/core/services/page/project-page.service.ts`

### Cascade
- Sidebar create: `~/Desktop/cascade/src/components/AppSidebar.tsx`
- Backend: `~/Desktop/cascade/convex/documents.ts` (create mutation)
- Route: `~/Desktop/cascade/src/routes/_auth/_app/$orgSlug/documents/index.tsx`
