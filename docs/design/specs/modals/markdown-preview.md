# Markdown Preview Modal

> **Component**: `MarkdownPreviewModal.tsx`
> **Status**: 🟢 GOOD
> **Lines**: 108

---

## Current State

The markdown preview modal sits in the document editor import flow and lets users inspect imported markdown before replacing the active editor session.

### Structure
```
┌──────────────────────────────────────────────────────────────┐
│  Preview Markdown Import                               [×]  │
│  Preview content before importing                           │
│                                                              │
│  import.md                                stats / line count │
│                                                              │
│  Warning: this replaces current document content             │
│                                                              │
│  [Preview] [Raw Markdown]                                    │
│                                                              │
│  Rendered markdown or raw source                             │
│                                                              │
│                  [Cancel] [Import & Replace Content]         │
└──────────────────────────────────────────────────────────────┘
```

---

## Strengths

| Aspect | Implementation |
|--------|----------------|
| Safety | Import is gated behind an explicit preview and replacement warning |
| Context | Filename and quick content stats make the incoming payload legible before applying it |
| Review flow | Preview/raw tabs make it easy to sanity-check both rendered output and source markdown |
| Reuse | Uses the owned dialog, tabs, button, icon, and typography primitives instead of custom chrome |

---

## Minor Issues

| # | Problem | Severity |
|---|---------|----------|
| 1 | Preview stats are useful but static; they do not distinguish ordered lists, links, or images | LOW |
| 2 | Primary CTA says “Import & Replace Content” but does not mention the current document title | LOW |

---

## Verdict

**KEEP AS-IS**. The modal is clear, cautious, and now attached to a real editor import flow rather than dead UI.

---

## Checklist

- [x] Uses owned `Dialog`, `Tabs`, `Button`, icon, and typography primitives
- [x] Shows filename plus lightweight content stats
- [x] Warns that the current document content will be replaced
- [x] Supports both rendered preview and raw markdown inspection
- [x] Fits cleanly in desktop, tablet, and mobile screenshot configs
