# Move Document Dialog

> **Component**: `MoveDocumentDialog.tsx`
> **Status**: 🟢 GOOD
> **Lines**: 85

---

## Current State

The move document dialog is a compact relocation flow for reassigning a document between projects or back to the organization level.

### Structure
```
┌──────────────────────────────────────────────────────────────┐
│  Move Document                                         [×]  │
│  Move this document to a different project, or remove it    │
│  from its current project.                                  │
│                                                              │
│  Target Project                                              │
│  [ select project / No project ]                             │
│                                                              │
│  Optional helper copy when moving to org level               │
│                                                              │
│                  [Cancel] [Move]                             │
└──────────────────────────────────────────────────────────────┘
```

---

## Strengths

| Aspect | Implementation |
|--------|----------------|
| Scope | Single-purpose relocation dialog with no unrelated controls |
| Safety | Primary action stays disabled until the selected destination actually changes |
| Feedback | Success and failure toasts clearly distinguish move vs remove-from-project outcomes |
| Clarity | Organization-level helper copy appears only for the destructive-looking “remove from project” path |

---

## Minor Issues

| # | Problem | Severity |
|---|---------|----------|
| 1 | Project picker is flat rather than grouped or searchable, so it may get crowded in large orgs | LOW |
| 2 | CTA label stays “Move” even when the action is really “Remove from project” | LOW |

---

## Verdict

**KEEP AS-IS**. The dialog is clear, compact, and consistent with the owned dialog/footer/select patterns.

---

## Checklist

- [x] Uses owned `Dialog`, `Select`, `Button`, and typography primitives
- [x] Disables the primary action until the destination changes
- [x] Handles both project reassignment and organization-level removal
- [x] Shows success/error feedback for the mutation result
- [x] Fits cleanly in desktop, tablet, and mobile screenshot configs
