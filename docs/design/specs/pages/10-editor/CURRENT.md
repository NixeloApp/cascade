# Document Editor Page - Current State

> **Route**: `/:slug/documents/:id`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-21

---

## Screenshots

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Current UI

- The screenshot baseline now targets the actual editor route again instead of the templates page.
- The page uses the Plate editor stack with a document header, optional sidebar, floating toolbar, slash menu, mention popover, and markdown import preview.
- The default seeded document state is stable again across desktop, tablet, and mobile, and the interaction captures now exercise the actual editor UI instead of soft-skipping when those states drift.

---

## Recent Improvements

- Editor route discovery and seeded document selection were fixed in `e2e/screenshot-pages.ts`.
- The document header now keeps core actions visible and pushes lower-frequency owner actions into overflow.
- Rich-block, color-picker, slash-menu, floating-toolbar, mention-popover, move-dialog, markdown-preview, favorite, sidebar-favorite, and locked-state screenshots now capture deterministically across every viewport/theme config.
- The screenshot harness now uses explicit editor e2e hooks for rich-content, slash-menu, floating-toolbar, and mention-popover state instead of relying on brittle seeded prose or silent soft-skips.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| The base document screenshot still reads slightly sparse compared with the richer interaction states because the default seeded note body is intentionally light | Editor composition + seed content | MEDIUM |
| The editor still needs stronger typography and body rhythm once the default seeded content grows beyond a few paragraphs | Editor surface system | LOW |
| The screenshot spec is now interaction-complete, but future editor UI changes should keep the new deterministic hooks and captures in sync instead of reintroducing silent skips | Screenshot harness discipline | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/documents/$id.tsx`
- `src/components/PlateEditor.tsx`
- `src/components/Documents/DocumentHeader.tsx`
- `src/components/Plate/FloatingToolbar.tsx`
- `e2e/screenshot-pages.ts`
