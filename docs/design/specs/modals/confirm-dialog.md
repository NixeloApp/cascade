# Confirm Dialog

> **Component**: `ui/ConfirmDialog.tsx`
> **Status**: 🟢 GOOD
> **Lines**: 142

---

## Current State

The confirm dialog is the shared high-risk action pattern used for destructive and cautionary flows such as member removal.

### Structure
```
┌──────────────────────────────────────────────────────────────┐
│  [warning icon]  Remove Member                              │
│  Are you sure you want to remove Sarah Kim from this        │
│  project? They will lose access to all project resources.   │
│                                                              │
│                  [Cancel] [Remove]                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Strengths

| Aspect | Implementation |
|--------|----------------|
| Reuse | One owned destructive-confirmation primitive instead of many feature-local dialogs |
| Clarity | Icon, title, and message establish action severity immediately |
| Safety | Cancel and confirm actions are clearly separated with danger styling only on the primary action |
| Accessibility | Uses Radix `AlertDialog` semantics for focus trap and blocking confirmation behavior |

---

## Minor Issues

| # | Problem | Severity |
|---|---------|----------|
| 1 | Message length can vary a lot across features, so some consumers may feel dense on mobile | LOW |
| 2 | Loading state text is generic (`Loading...`) rather than action-specific | LOW |

---

## Verdict

**KEEP AS-IS**. The shared confirm dialog is visually coherent, appropriately forceful for destructive actions, and flexible enough to cover current confirmation flows without bespoke styling.

---

## Checklist

- [x] Uses blocking `AlertDialog` semantics
- [x] Supports danger, warning, and info confirmation states
- [x] Keeps cancel and confirm actions visually distinct
- [x] Handles loading state without layout collapse
- [x] Fits cleanly in desktop, tablet, and mobile screenshot configs
