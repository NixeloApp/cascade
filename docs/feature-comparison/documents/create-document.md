# Create Document - Deep UX Comparison

## Overview
Document creation is the entry point for knowledge management. Users create new documents to capture meeting notes, project plans, specifications, and other team knowledge. This analysis compares Plane vs Cascade across triggers, modals, form fields, and creation flow.

---

## Entry Points Comparison

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Sidebar button** | "Add Page" in pages header | "+" in Documents section | Tie |
| **Context menu** | Right-click in list | N/A | Plane |
| **Keyboard shortcut** | None | None | Tie |
| **Empty state CTA** | "Create your first page" | "Create Document" | Tie |
| **Command palette** | Yes (`P` then "Create") | N/A | Plane |
| **URL direct** | `/[ws]/projects/[proj]/pages/create` | N/A | Plane |

---

## Layout Comparison

### Plane Document Creation
```
Location: Header + Sidebar + Command Palette
┌─────────────────────────────────────────────────────────────────────────────┐
│ Project Pages Header                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📄 Pages                           [🔍] [+ Add Page] ← Primary trigger      │
│                                         ↑ Shows modal                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Sidebar                            │ Main Content                            │
│ ┌────────────────────────────────┐ │                                        │
│ │ ▼ Pages                        │ │                                        │
│ │   📄 Meeting Notes             │ │                                        │
│ │   📄 Product Spec              │ │                                        │
│ │   📄 Design Doc        [+] ←───┼─┼─ Also triggers modal                   │
│ └────────────────────────────────┘ │                                        │
└─────────────────────────────────────────────────────────────────────────────┘

Modal (CreatePageModal):
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Create Page                                    [×] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Icon / Emoji                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 😀 (click to change)                                    [🎨 Color] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Page Title *                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Enter page title...                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Access                                                                     │
│  ( ) 🔓 Public - Visible to all project members                            │
│  (●) 🔒 Private - Only you can access                                      │
│                                                                             │
│                                           [Cancel]  [Create Page]          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
Position: EModalPosition.TOP (center-top of viewport)
Width: XXL (max-w-xl)
```

### Cascade Document Creation
```
Location: Sidebar only (instant creation)
┌─────────────────────────────────────────────────────────────────────────────┐
│ Sidebar                            │ Main Content                            │
│ ┌────────────────────────────────┐ │                                        │
│ │ 📊 Dashboard                   │ │                                        │
│ │ 📋 Issues                      │ │                                        │
│ │ ▼ Documents                    │ │                                        │
│ │   📄 Meeting Notes        [+] ←┼─┼─ Primary (only) trigger                │
│ │   📄 Product Spec             │ │   (instant creation, no modal)          │
│ │   📄 Design Doc               │ │                                        │
│ └────────────────────────────────┘ │                                        │
└─────────────────────────────────────────────────────────────────────────────┘

No modal - redirects immediately to:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Document Detail Page                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Untitled Document                                            [🔒] [⋯] ││
│ │ ↑ Click to edit inline                                                 ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Start typing here...                                                   ││
│ │                                                                         ││
│ │                                                                         ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Form Fields Comparison

| Field | Plane | Cascade | Notes |
|-------|-------|---------|-------|
| **Title** | Required in modal | Default "Untitled", edit after | Different UX |
| **Emoji/Icon** | Picker with search | N/A | Plane only |
| **Icon color** | Color picker | N/A | Plane only |
| **Access level** | Public/Private radio | Default private | Plane upfront |
| **Parent document** | N/A | Optional (hierarchy) | Cascade only |
| **Project scope** | Required (implicit) | Optional | Different model |

### Form Field Count

| Metric | Plane | Cascade |
|--------|-------|---------|
| Required fields | 1 (title) | 0 |
| Optional fields | 2 (emoji, access) | 0 |
| Total form fields | 3 | 0 |
| Form validation | Yes | N/A |

---

## Click Analysis

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Create document (minimal)** | 3 clicks (+ button → title → create) | 1 click (+ button) | **Cascade faster** |
| **Create with title** | 3 clicks | 3 clicks (+ → header → type) | Tie |
| **Create with emoji** | 5 clicks (+ → emoji picker → select → title → create) | N/A | Plane only |
| **Create as private** | 3 clicks (default) | 1 click (default) | **Cascade** |
| **Create as public** | 4 clicks (+ → public → title → create) | 3+ clicks (create → toggle) | Plane better UX |
| **Create nested doc** | N/A | 2 clicks (+ on parent → redirect) | Cascade only |
| **Cancel creation** | 1 click (Cancel/Escape) | N/A | N/A |

---

## Creation Flow Comparison

### Plane Flow (Modal-based)
```
User Journey:
┌────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Click [+]  │───▶│ Modal opens  │───▶│ Fill fields  │───▶│ Click Create │
└────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
     │                  │                   │                    │
     │             1 click            2-5 clicks            1 click
     │                  │                   │                    │
     ▼                  ▼                   ▼                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Total: 4-7 clicks                               │
│                        Modals: 1                                        │
│                        Time to content: ~5-10 seconds                   │
└────────────────────────────────────────────────────────────────────────┘
```

### Cascade Flow (Instant Creation)
```
User Journey:
┌────────────┐    ┌──────────────┐    ┌──────────────┐
│ Click [+]  │───▶│ Doc created  │───▶│ Start typing │
└────────────┘    └──────────────┘    └──────────────┘
     │                  │                   │
  1 click         (automatic)          (immediate)
     │                  │                   │
     ▼                  ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Total: 1 click                                  │
│                        Modals: 0                                        │
│                        Time to content: ~1-2 seconds                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Keyboard Support

| Shortcut | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| **Create document** | N/A | N/A | Neither |
| **Focus title** | Auto-focus in modal | Click header | Plane better |
| **Submit form** | Enter (in title) | N/A | Plane |
| **Cancel/Close** | Escape | N/A | Plane |
| **Command palette** | `Cmd/Ctrl+K` → "Page" | N/A | Plane |

---

## Loading & Feedback

| Aspect | Plane | Cascade |
|--------|-------|---------|
| **Loading indicator** | Button spinner | Redirect indicator |
| **Success feedback** | Modal closes, redirects | Toast + redirect |
| **Error feedback** | Inline validation | Toast message |
| **Optimistic UI** | No | Yes (instant) |
| **Rate limiting** | Unknown | Yes (enforced) |

---

## Accessibility

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Modal focus trap** | Yes | N/A |
| **Form labels** | Yes | N/A |
| **Error announcements** | Yes | Toast (aria-live) |
| **Keyboard navigation** | Full modal support | Button only |
| **Screen reader** | Form field labels | Button label |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Speed to content | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade instant |
| Customization upfront | ⭐⭐⭐⭐⭐ | ⭐ | Plane has emoji/access |
| Click efficiency | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade 1-click |
| Entry point variety | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane multiple |
| Keyboard support | ⭐⭐⭐⭐ | ⭐⭐ | Plane form shortcuts |
| Document hierarchy | ⭐ | ⭐⭐⭐⭐⭐ | Cascade parent/child |
| Error handling | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane inline validation |
| Optimistic updates | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade instant |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Add emoji/icon picker** - Allow setting document icon at creation or in header
   ```tsx
   <EmojiPicker
     value={emoji}
     onChange={updateDocumentEmoji}
     trigger={<Button variant="ghost">{emoji || "📄"}</Button>}
   />
   ```

### P1 - High
2. **Add quick-create modal option** - Shift+Click for power users who want upfront config
3. **Add keyboard shortcut** - `Cmd/Ctrl+Shift+D` for document creation
4. **Show access control in creation** - Quick toggle for public/private

### P2 - Medium
5. **Add command palette integration** - Search "Create document" in command menu
6. **Add context menu creation** - Right-click in document list
7. **Add template selection** - Choose from document templates

### P3 - Nice to Have
8. **Add duplicate action** - Create copy of existing document
9. **Add bulk creation** - Create multiple documents from outline
10. **Add import from file** - Import Markdown/Word documents

---

## Code References

### Plane
- Create modal: `apps/web/core/components/pages/modals/create-page-modal.tsx`
- Page form: `apps/web/core/components/pages/modals/page-form.tsx`
- Emoji picker: `apps/web/core/components/pages/modals/page-form.tsx` (integrated)
- Service: `apps/web/core/services/page/project-page.service.ts`
- Store: `apps/web/core/store/pages/project-page.store.ts`

### Cascade
- Sidebar trigger: `src/components/AppSidebar.tsx` (Documents section)
- Backend mutation: `convex/documents.ts` → `create`
- Document header: `src/components/DocumentHeader.tsx` (inline title edit)
- Route: `src/routes/_auth/_app/$orgSlug/documents/$documentId.tsx`
