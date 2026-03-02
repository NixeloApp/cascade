# Phase 2: Editor & Polish

> **Status:** ✅ Complete
> **Last Updated:** 2026-02-17

Focus on editor features and document polish.

---

## Checklist

| Item | Status | Notes |
|------|--------|-------|
| Markdown import/export | ✅ | Uses markdown.ts utilities, integrated in DocumentHeader |
| Y.js real-time collaboration | ⏸️ | Deferred - requires infrastructure changes |
| Image upload in slash menu | ⏸️ | Deferred to Phase 3 |
| Link insertion in toolbar | ⏸️ | Deferred to Phase 3 |

---

## Completed Items

### Markdown Import/Export
- `src/lib/markdown.ts` - utilities for conversion
- `DocumentHeader.tsx` - Import/Export buttons
- Supports full round-trip (import → edit → export)

### Deferred Items

**Y.js Real-time Collaboration:**
- Requires Hocuspocus server or equivalent
- Convex doesn't natively support Y.js sync
- Alternative: Use Convex's built-in real-time sync (already working)

**Image Upload in Slash Menu:**
- BlockNote/Plate has built-in support
- Needs Convex file storage integration
- Low priority - drag-drop works

**Link Insertion in Toolbar:**
- Plate has LinkToolbarButton
- Minor UI polish item
