# Tech Debt: Image Upload Dialog

> **Priority:** P3
> **Status:** Complete
> **File:** `src/components/Plate/SlashMenu.tsx`

## Completed

- [x] Wire slash menu "Image" command to file picker
- [x] File type validation (JPG, PNG, GIF, WebP)
- [x] File size validation (5MB max)
- [x] Insert image as data URL (immediate preview)
- [x] Remove window.prompt fallback
- [ ] Upload to Convex storage for persistent URLs (deferred — needs document-level storage)
- [ ] Drag-and-drop support (deferred — needs editor plugin)
