# Alert Dialog

> **Component**: `ui/AlertDialog.tsx`
> **Status**: 🟢 GOOD
> **Lines**: 134

---

## Current State

The alert dialog is the stricter blocking-confirmation primitive used for destructive actions that need more than a single warning sentence, such as project deletion with typed confirmation.

### Structure
```
┌──────────────────────────────────────────────────────────────┐
│  Delete this project?                                  [×]  │
│  This permanently deletes Alpha, including issues,          │
│  sprints, and project data.                                 │
│                                                              │
│  To confirm, type ALPHA below                                │
│  [ Type ALPHA to confirm ]                                   │
│                                                              │
│                  [Cancel] [I understand, delete…]           │
└──────────────────────────────────────────────────────────────┘
```

---

## Strengths

| Aspect | Implementation |
|--------|----------------|
| Safety | Blocking modal semantics and disabled primary action reduce accidental destructive actions |
| Flexibility | Supports richer body content than the lighter `ConfirmDialog`, including typed confirmation fields |
| Consistency | Reuses owned dialog anatomy and button variants instead of bespoke destructive panels |
| Accessibility | Uses Radix alert-dialog semantics for focus trap and high-salience confirmation flows |

---

## Minor Issues

| # | Problem | Severity |
|---|---------|----------|
| 1 | Destructive body copy can grow dense when consumers add too much custom content | LOW |
| 2 | The primitive still relies on each feature to choose strong enough warning copy | LOW |

---

## Verdict

**KEEP AS-IS**. This is the right primitive for multi-step destructive confirmations that need more context than a standard confirm dialog but should still feel system-owned and consistent.

---

## Checklist

- [x] Uses blocking alert-dialog semantics
- [x] Supports rich custom body content
- [x] Allows disabling the primary action until prerequisites are met
- [x] Works cleanly for typed-confirmation destructive flows
- [x] Fits desktop, tablet, and mobile screenshot configs
