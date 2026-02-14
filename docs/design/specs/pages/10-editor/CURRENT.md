# Document Editor Page - Current State

> **Route**: `/:slug/documents/:id`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: Run `pnpm screenshots` to regenerate

---

## Screenshots

| Viewport | Preview |
|----------|---------|
| Desktop | ![](screenshots/desktop-dark.png) |

---

## Structure

Full-page editor with header and toolbar:

```
+-------------------------------------------------------------------------------------------+
| [=] Nixelo E2E                      [Commands Cmd+K] [?] [> Timer] [Search Cmd+K] [N] [AV]|
+-------------------------------------------------------------------------------------------+
| < Documents  |  Welcome                                                                   |
|              |  ~~~~~~~                                                                   |
|              |                                                                            |
|              |  [Edit Title]  [AV] [AV]  [History (3)] [Import] [Export] [🌐] [...] |
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  +--------------------------------------------------------------------------------------+ |
|  |                                                                                      | |
|  |  # Welcome                                                                           | |
|  |                                                                                      | |
|  |  Welcome to Nixelo! This is your collaborative documentation space.                  | |
|  |                                                                                      | |
|  |  ## Getting Started                                                                  | |
|  |                                                                                      | |
|  |  Here's how to get started with your new workspace:                                  | |
|  |                                                                                      | |
|  |  1. Create a project to organize your work                                           | |
|  |  2. Add team members to collaborate                                                  | |
|  |  3. Start tracking issues and documentation                                          | |
|  |                                                                                      | |
|  |  > 💡 **Tip**: Use the slash command (/) to insert blocks                           | |
|  |                                                                                      | |
|  +--------------------------------------------------------------------------------------+ |
|                                                                                           |
|  Created by Emily Chen · Last updated 2 hours ago                                         |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
```

---

## Current Elements

### Header Bar
- **Back link**: "< Documents" navigation
- **Document title**: Editable title (click to edit)
- **Presence indicators**: Active collaborator avatars
- **History**: Version count badge
- **Import/Export**: Markdown import/export buttons
- **Public toggle**: Globe icon for visibility
- **More actions**: Dropdown menu

### Editor Area
- **BlockNote editor**: Rich text editing
- **Max width**: 4xl (896px) centered
- **Padding**: Responsive p-3 sm:p-6
- **Placeholder**: "Start writing..."

### Toolbar Features (Floating)
- Bold, Italic, Underline, Strikethrough
- Inline Code, Link insertion
- Appears on text selection

### Slash Menu
- Triggered by typing "/"
- Paragraph, Headings (1-3)
- Lists (bullet, numbered)
- Quote, Code Block, Table, Image
- Fuzzy search filtering

### Footer
- Creator name
- Last updated timestamp

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/_auth/_app/$orgSlug/documents/$id.tsx` | Route definition | ~80 |
| `src/components/editor/DocumentEditor.tsx` | Main editor wrapper | ~200 |
| `src/components/editor/DocumentHeader.tsx` | Header with actions | ~150 |
| `src/components/editor/BlockNoteEditor.tsx` | BlockNote integration | ~250 |
| `src/components/editor/FloatingToolbar.tsx` | Selection toolbar | ~100 |
| `src/components/editor/SlashMenu.tsx` | Block insertion menu | ~150 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Header too cluttered with actions | DocumentHeader | HIGH |
| 2 | No document sidebar/navigation | DocumentEditor | HIGH |
| 3 | Editor prose styling basic | BlockNoteEditor | MEDIUM |
| 4 | No publish/preview workflow | DocumentHeader | MEDIUM |
| 5 | Missing breadcrumb navigation | DocumentHeader | LOW |
| 6 | No callout/card blocks | SlashMenu | LOW |
| 7 | Floating toolbar needs polish | FloatingToolbar | LOW |
| 8 | No branch indicator | DocumentHeader | LOW |

---

## Editor Block Types

```
Current supported blocks:
- Paragraph
- Heading (H1, H2, H3)
- Bullet List
- Numbered List
- Blockquote
- Code Block
- Table
- Image

Missing (target):
- Callout/Card blocks
- Card grid layout
- Embed blocks
- Divider
```

---

## Summary

The document editor is functional but needs polish:
- Header is cluttered with too many action buttons
- Missing document navigation sidebar
- Editor content needs better typography
- No publish/preview workflow like Mintlify
- Could add rich callout and card blocks
