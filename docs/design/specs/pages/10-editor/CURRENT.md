# Document Editor Page - Current State

> **Route**: `/:slug/documents/:id`
> **Status**: REVIEWED, with follow-up surface polish only
> **Last Updated**: 2026-03-26

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Purpose

The editor route is the document workspace. The current branch fixed two important regressions:

1. screenshot coverage now targets the real editor interactions deterministically
2. editor persistence now round-trips through explicit snapshot sync instead of living as local-only
   temporary state

This route is no longer just visually reviewed; it is operationally closer to the real product.

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Additional interaction captures

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|------|---------------|---------------|--------------|--------------|
| Slash menu | `desktop-dark-slash-menu.png` | `desktop-light-slash-menu.png` | `tablet-light-slash-menu.png` | `mobile-light-slash-menu.png` |
| Floating toolbar | `desktop-dark-floating-toolbar.png` | `desktop-light-floating-toolbar.png` | `tablet-light-floating-toolbar.png` | `mobile-light-floating-toolbar.png` |
| Mention popover | `desktop-dark-mention-popover.png` | `desktop-light-mention-popover.png` | `tablet-light-mention-popover.png` | `mobile-light-mention-popover.png` |
| Color picker | `desktop-dark-color-picker.png` | `desktop-light-color-picker.png` | `tablet-light-color-picker.png` | `mobile-light-color-picker.png` |
| Markdown preview modal | `desktop-dark-markdown-preview-modal.png` | `desktop-light-markdown-preview-modal.png` | `tablet-light-markdown-preview-modal.png` | `mobile-light-markdown-preview-modal.png` |
| Move dialog | `desktop-dark-move-dialog.png` | `desktop-light-move-dialog.png` | `tablet-light-move-dialog.png` | `mobile-light-move-dialog.png` |
| Locked state | `desktop-dark-locked.png` | `desktop-light-locked.png` | `tablet-light-locked.png` | `mobile-light-locked.png` |
| Favorites sidebar | `desktop-dark-sidebar-favorites.png` | `desktop-light-sidebar-favorites.png` | `tablet-light-sidebar-favorites.png` | `mobile-light-sidebar-favorites.png` |
| Rich blocks | `desktop-dark-rich-blocks.png` | `desktop-light-rich-blocks.png` | `tablet-light-rich-blocks.png` | `mobile-light-rich-blocks.png` |
| Favorite state | `desktop-dark-favorite.png` | `desktop-light-favorite.png` | `tablet-light-favorite.png` | `mobile-light-favorite.png` |

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Document header                                                                             │
│ title + save/sync state + primary actions + overflow actions                                │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Editor workspace                                                                            │
│                                                                                             │
│  optional sidebar / favorites                                                               │
│  main Plate editor body                                                                     │
│  richer prose rhythm                                                                        │
│                                                                                             │
│  interaction overlays                                                                       │
│  - slash menu                                                                               │
│  - floating toolbar                                                                         │
│  - mention popover                                                                          │
│  - color picker                                                                             │
│  - markdown preview                                                                         │
│  - move dialog                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Composition

### 1. Header

- Core actions stay visible.
- Owner-only lock/move/archive behavior is pushed into a clearer overflow path.
- Save state is explicit: saving, saved, and error chrome now reflect the real snapshot pipeline.

### 2. Editor body

- The route uses the Plate editor stack.
- Blank or lightly seeded states now settle into a deliberate starter panel instead of a half-hydrated
  placeholder shell.
- The screenshot harness waits for editor hydration before capture, so the reviewed images now reflect
  the real settled route state instead of the first visible shell.

### 3. Interaction layers

- Screenshot capture for slash menu, floating toolbar, mention popover, and color picker is now
  deterministic.
- The screenshot harness no longer depends on brittle incidental selection state.

### 4. Persistence behavior

- The editor now hydrates from the current snapshot.
- Debounced writes submit through the explicit snapshot path.
- Version restore flows round-trip through the same persistence contract.

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Some overlay states are stable and current, but still visually denser than the calmest page shells elsewhere in the app | overlay polish | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/documents/$id.tsx` | Editor route |
| `src/components/PlateEditor.tsx` | Main editor workspace |
| `src/components/Documents/DocumentHeader.tsx` | Header and save-state chrome |
| `src/components/Plate/SlashMenu.tsx` | Slash menu |
| `src/components/Plate/FloatingToolbar.tsx` | Floating toolbar |
| `src/components/ui/PlateRichTextContent.tsx` | Rich prose rhythm |
| `src/lib/plate/editor.ts` | Snapshot serialization bridge |
| `e2e/screenshot-pages.ts` | Canonical and interaction screenshot capture |

---

## Summary

The editor spec is current again. It now reflects the real route, the real interaction matrix, and
the real save/restore path. The thin placeholder capture is gone; remaining work is mostly overlay
polish rather than route-body honesty.
