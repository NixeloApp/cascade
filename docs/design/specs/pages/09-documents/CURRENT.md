# Documents Page - Current State

> **Route**: `/:slug/documents`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: Run `pnpm screenshots` to regenerate

---

## Screenshots

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Filled | ![](screenshots/desktop-dark-filled.png) |
| Desktop | Empty | ![](screenshots/desktop-dark-empty.png) |

---

## Structure

Document tree with folders and files:

```
+-------------------------------------------------------------------------------------------+
| [=] Nixelo E2E                      [Commands Cmd+K] [?] [> Timer] [Search Cmd+K] [N] [AV]|
+-------------------------------------------------------------------------------------------+
| [Sidebar] |                                                                               |
|           |  Documents                                                    [+ New Document] |
| Dashboard |  Organize your team's knowledge                                               |
| Issues    |                                                                               |
| Calendar  |  +--------------------------------------------------------------------------+ |
| Documents |  |                                                                          | |
|  > Guides |  |  > Getting Started                                                       | |
|           |  |    ├─ Welcome                                               2 days ago  | |
|           |  |    └─ Quick Start Guide                                     1 week ago  | |
| Workspaces|  |                                                                          | |
|  > Demo   |  |  > Product Specs                                                         | |
|           |  |    └─ Feature Requirements                                  3 hours ago | |
| Time Track|  |                                                                          | |
|           |  |  + Team Notes                                                (empty)    | |
|           |  |                                                                          | |
|           |  +--------------------------------------------------------------------------+ |
| Settings  |                                                                               |
+-------------------------------------------------------------------------------------------+
```

---

## Current Elements

### Page Header
- **Title**: "Documents" (24px, bold)
- **Description**: "Organize your team's knowledge"
- **Action**: "+ New Document" button

### Document Tree
- **Folder rows**: Expandable with chevron icon
- **Document rows**: Icon + name + last updated
- **Nested levels**: Indentation for hierarchy
- **Empty folders**: "(empty)" indicator

### Tree Item States
- Default: Normal text
- Hover: Subtle background
- Selected: Brand highlight
- Dragging: (not implemented)

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/_auth/_app/$orgSlug/documents/index.tsx` | Route definition | ~80 |
| `src/components/documents/DocumentTree.tsx` | Tree container | ~150 |
| `src/components/documents/DocumentRow.tsx` | Single row | ~80 |
| `src/components/documents/FolderRow.tsx` | Folder with expand | ~100 |
| `src/components/documents/CreateDocument.tsx` | Create modal | ~120 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Tree indentation inconsistent | DocumentTree | MEDIUM |
| 2 | Expand/collapse no animation | FolderRow | MEDIUM |
| 3 | Document rows lack hover actions | DocumentRow | MEDIUM |
| 4 | No drag-and-drop reordering | DocumentTree | LOW |
| 5 | Empty state needs illustration | DocumentTree | LOW |
| 6 | No document preview/thumbnail | DocumentRow | LOW |
| 7 | No quick search/filter | Page header | LOW |
| 8 | Last updated format inconsistent | DocumentRow | LOW |

---

## Tree Item Detail

```
+--------------------------------------------------------------------------------+
| [▶] Getting Started                                                            |
|     ├─ [📄] Welcome                                               2 days ago   |
|     └─ [📄] Quick Start Guide                                     1 week ago   |
+--------------------------------------------------------------------------------+
    ^     ^         ^                                                ^
  expand  icon    name                                           timestamp
```

---

## Summary

The documents page is functional but needs polish:
- Tree expand/collapse needs smooth animation
- Document rows need hover actions (edit, delete, move)
- Consider adding document preview/thumbnail
- Add quick search/filter capability
- Empty state should have illustration
