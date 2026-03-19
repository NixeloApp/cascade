# Modal & Overlay Specs

This directory contains design specifications for modal dialogs and overlay components.

## Index

| Modal | Status | File |
|-------|--------|------|
| Create Issue | 🟢 SPEC'D | `create-issue.md` |
| Create Event | 🟢 SPEC'D | `create-event.md` |
| Command Palette | 🟢 SPEC'D | `command-palette.md` |
| Confirm Dialog | 🟢 SPEC'D | `confirm-dialog.md` |
| Avatar Upload | 🟢 SPEC'D | `avatar-upload.md` |
| Cover Image Upload | 🟢 SPEC'D | `cover-image-upload.md` |
| Dashboard Customize | 🟢 SPEC'D | `dashboard-customize.md` |
| Move Document | 🟢 SPEC'D | `move-document.md` |
| Create Workspace | 🟡 REVIEW | - |
| Create Team | 🟡 REVIEW | - |
| Issue Detail | 🟡 REVIEW | - |
| Import/Export | 🟡 REVIEW | - |

## Modal Design Principles

1. **No unnecessary wrappers** - DialogContent handles containment
2. **Clear hierarchy** - Title > Description > Form > Actions
3. **Consistent footer** - Cancel left, Primary action right
4. **Escape to close** - Always closeable via keyboard
5. **Focus trap** - Tab stays within modal
6. **Backdrop click** - Closes by default (configurable)

## Standard Modal Structure

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>Create Issue</DialogTitle>
      <DialogDescription className="sr-only">Form description</DialogDescription>
    </DialogHeader>

    <form className="space-y-4">
      {/* Form fields */}
    </form>

    <DialogFooter>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button type="submit">Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
