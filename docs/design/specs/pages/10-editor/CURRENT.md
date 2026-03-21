# Document Editor Page - Current State

> **Route**: `/:slug/documents/:id`
> **Status**: 🟢 REVIEWED
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
- The default seeded document now reads like a real workspace note instead of a sparse demo shell, so the base route shows the same document rhythm the richer interaction captures already depended on.
- The interaction captures now exercise the actual editor UI instead of soft-skipping when those states drift.

---

## Recent Improvements

- Editor route discovery and seeded document selection were fixed in `e2e/screenshot-pages.ts`.
- The document header now keeps core actions visible and pushes lower-frequency owner actions into overflow.
- Rich-block, color-picker, slash-menu, floating-toolbar, mention-popover, move-dialog, markdown-preview, favorite, sidebar-favorite, and locked-state screenshots now capture deterministically across every viewport/theme config.
- The screenshot harness now uses explicit editor e2e hooks for rich-content, slash-menu, floating-toolbar, and mention-popover state instead of relying on brittle seeded prose or silent soft-skips.
- The seeded document snapshots in `convex/e2e.ts` now carry enough real structure to exercise headings, lists, and callout-style body rhythm in the base editor screenshots.
- The editor surface now uses tighter empty/error/default anatomy in `src/components/PlateEditor.tsx` and stronger prose spacing in `src/components/ui/PlateRichTextContent.tsx`.

---

## Review Notes

| Focus | Result | Severity |
|-------|--------|----------|
| Base document density | Fixed by seeding richer workspace-note content instead of a barely filled demo paragraph | RESOLVED |
| Editor body rhythm | Fixed for the current route baseline with stronger heading/list/blockquote spacing in the shared editor prose surface | RESOLVED |
| Screenshot harness discipline | Stable again, including color-picker capture through the deterministic floating-toolbar path | RESOLVED |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/documents/$id.tsx`
- `src/components/PlateEditor.tsx`
- `src/components/Documents/DocumentHeader.tsx`
- `src/components/Plate/FloatingToolbar.tsx`
- `e2e/screenshot-pages.ts`
