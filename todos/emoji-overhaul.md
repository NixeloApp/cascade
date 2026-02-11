# Emoji Overhaul Plan

> Status: **In Progress**
> Last Updated: 2026-02-07

## Overview

This document tracks the migration from Unicode emoji to structured icon systems across the Nixelo codebase. The goal is to provide a consistent, accessible, and enterprise-grade icon experience.

---

## Phase 1: Icon Component Consolidation ✅

**Status:** Complete

Replaced all hardcoded emoji in UI components with Lucide icons via the centralized `<Icon>` component.

### What Was Done

| Area | Before | After |
|------|--------|-------|
| Status indicators | ✓ ✗ | `<Icon icon={Check\|X} />` |
| Navigation hints | ↑↓←→ | `<Icon icon={ArrowUp\|ArrowDown\|...} />` |
| Action buttons | ▶️ ⏸️ ✏️ 🗑️ | `<Icon icon={Play\|Pause\|Pencil\|Trash2} />` |
| Empty states | 📊 📭 🔔 | `<Icon icon={BarChart3\|Inbox\|Bell} />` |
| Keyboard shortcuts | ⌘ ⌫ ↵ | `<Icon icon={Command\|Delete\|CornerDownLeft} />` |
| Badge icons | 💎 🎯 | `<Icon icon={Gem\|Target} />` |

### Files Modified

- 43 component files updated
- `src/lib/icons.ts` - centralized Lucide exports
- `src/components/ui/Icon.tsx` - unified icon component
- `src/components/ui/KeyboardShortcut.tsx` - keyboard key icons

### Remaining Intentional Emoji

| File | Emoji | Reason |
|------|-------|--------|
| `DocumentTemplatesManager.tsx` | 📄 | User-configurable template icon (see Phase 2) |

---

## Phase 2: Emoji Picker Component 🚧

**Status:** Not Started

Replace raw text input for emoji with a proper picker UI, similar to Notion/Slack.

### Current Problem

```tsx
// Current: Raw text input - poor UX
<FormInput
  label="Icon (Emoji)"
  placeholder="📄"
  maxLength={2}
/>
```

Users must:
- Know how to type emoji on their OS
- Guess what emoji are available
- No visual preview before selection

### Proposed Solution

Create an `IconPicker` component with three modes:

#### Option A: Lucide Icon Picker (Recommended for MVP)

Predefined set of Lucide icons appropriate for documents/templates:

```tsx
<IconPicker
  value={selectedIcon}
  onChange={setSelectedIcon}
  icons={[
    { id: "file-text", icon: FileText, label: "Document" },
    { id: "folder", icon: Folder, label: "Folder" },
    { id: "book-open", icon: BookOpen, label: "Guide" },
    { id: "clipboard-list", icon: ClipboardList, label: "Checklist" },
    { id: "calendar", icon: Calendar, label: "Schedule" },
    { id: "target", icon: Target, label: "Goals" },
    // ... 20-30 curated icons
  ]}
/>
```

**Pros:**
- Consistent visual style
- No emoji rendering differences across OS/browsers
- Accessible (proper aria labels)
- Fast to implement

**Cons:**
- Less expressive than full emoji set
- Users can't add custom icons

#### Option B: Emoji Picker (Notion-style)

Full emoji picker with categories and search:

```tsx
<EmojiPicker
  value={selectedEmoji}
  onChange={setSelectedEmoji}
  categories={["smileys", "objects", "symbols", "flags"]}
  recents={true}
  search={true}
/>
```

**Pros:**
- Maximum expressiveness
- Familiar to Notion/Slack users
- Fun, personal

**Cons:**
- Emoji render differently per OS
- Larger bundle size (emoji data)
- Accessibility challenges
- Need third-party library or build custom

#### Option C: Hybrid Picker (Best UX)

Tabs for both Lucide icons and emoji:

```tsx
<IconPicker
  value={selectedIcon}
  onChange={setSelectedIcon}
  tabs={["icons", "emoji", "upload"]}
/>
```

**Pros:**
- Best of both worlds
- Option to upload custom images (like Notion)
- Progressive enhancement

**Cons:**
- Most complex to implement
- Largest scope

### Recommended Implementation

1. **MVP:** Option A (Lucide Icon Picker)
   - Create `src/components/ui/IconPicker.tsx`
   - Curate 30-40 icons for templates/documents
   - Grid layout with hover preview
   - Keyboard navigation support

2. **V2:** Add emoji tab (Option C)
   - Integrate `emoji-mart` or similar
   - Add "Recent" section
   - Search functionality

3. **V3:** Custom upload
   - Allow image upload for icons
   - Store in Convex file storage
   - Resize/crop UI

### Schema Changes

```typescript
// Current
icon: v.string(), // "📄"

// Proposed
icon: v.union(
  v.object({
    type: v.literal("lucide"),
    name: v.string(), // "file-text"
  }),
  v.object({
    type: v.literal("emoji"),
    value: v.string(), // "📄"
  }),
  v.object({
    type: v.literal("custom"),
    fileId: v.id("_storage"),
  }),
),
```

### Migration Path

1. Add new `icon` schema with union type
2. Migrate existing emoji strings to `{ type: "emoji", value: "📄" }`
3. Update all icon rendering to handle union type
4. Deploy IconPicker component
5. Backfill old templates to use Lucide icons

---

## Phase 3: Audit Other Emoji Usage 📋

**Status:** Not Started

Review other areas where emoji might be user-generated or stored:

### Areas to Audit

| Feature | Current State | Action Needed |
|---------|---------------|---------------|
| Document templates | Emoji text input | Phase 2 |
| Project icons | Unknown | Audit |
| Team icons | Unknown | Audit |
| Workspace icons | Unknown | Audit |
| Custom field options | Unknown | Audit |
| Comment reactions | Intentional emoji | Keep (reaction picker) |
| User status | Unknown | Audit |

### Detection Script

Run `node scripts/find-emoji.js` to detect emoji in source files.

Current output (after Phase 1):
```
📊 Summary: 2 emoji occurrences in 1 file
- DocumentTemplatesManager.tsx (template icon default/placeholder)
```

---

## Phase 4: Accessibility Improvements 🎯

**Status:** Not Started

Ensure all icons meet accessibility standards:

### Checklist

- [ ] All `<Icon>` components have `aria-label` when used as buttons
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Icon-only buttons have visible text alternative or tooltip
- [ ] Color is not the only differentiator (icons have distinct shapes)
- [ ] Icons meet WCAG contrast requirements
- [ ] Screen reader testing complete

### Icon Button Pattern

```tsx
// ✅ Correct - has accessible label
<button aria-label="Delete item">
  <Icon icon={Trash2} />
</button>

// ✅ Correct - has visible text
<button>
  <Icon icon={Trash2} />
  <span>Delete</span>
</button>

// ❌ Wrong - no accessible name
<button>
  <Icon icon={Trash2} />
</button>
```

---

## Timeline

| Phase | Scope | Effort | Priority |
|-------|-------|--------|----------|
| Phase 1 | Icon consolidation | ✅ Done | - |
| Phase 2 | IconPicker component | 2-3 days | High |
| Phase 3 | Emoji usage audit | 1 day | Medium |
| Phase 4 | Accessibility | 1-2 days | Medium |

---

## Resources

- [Lucide Icons](https://lucide.dev/icons) - Icon library
- [emoji-mart](https://github.com/missive/emoji-mart) - Emoji picker library
- [Notion's approach](https://www.notion.so) - Reference implementation
- [WCAG Icon Guidelines](https://www.w3.org/WAI/WCAG21/Techniques/general/G196)

---

## Scripts

```bash
# Find remaining emoji in codebase
node scripts/find-emoji.js

# Validate icon usage
node scripts/validate.js
```
