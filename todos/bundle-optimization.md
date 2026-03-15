# Bundle Size Optimization

> **Created:** 2026-03-14
> **Priority:** P0
> **Status:** In Progress

## Current State (after optimization)

- **Vendor chunk:** 337KB gzip (was 722KB — 53% reduction)
- **App chunk:** 388KB gzip (unchanged, needs route-level splitting)
- **Editor chunk:** 135KB gzip (deferred, only loads on doc pages)
- **Budget:** 500KB gzip vendor

## Completed

- [x] Split vendor chunk via `manualChunks`: react, convex, editor, radix, router, motion, icons, date-fns, dnd, collab
- [x] Lazy-load Calendar route (defers framer-motion)
- [x] Lazy-load Roadmap route (defers react-window)
- [x] Lazy-load ProjectSettings route
- [x] Brotli compression enabled

## Remaining Opportunities

### High Impact
1. **Lazy-load Board page** — KanbanBoard + FilterBar + SprintProgressBar are heavy but need URL search param integration
2. **Lazy-load Assistant page** — Full page component, straightforward
3. **Lazy-load Invoices page** — Full page component

### Medium Impact
4. **Audit barrel imports** — Check if `@/components/ui` barrel pulls in everything
5. **Tree-shake icons** — Verify lucide-react only includes used icons

### Low Impact
6. **Preload critical chunks** — `<link rel="modulepreload">` for react, router, convex

## Acceptance Criteria

- [x] Vendor chunk < 500KB gzip (achieved: 337KB)
- [ ] Total initial load < 600KB gzip
- [ ] No regression in Lighthouse performance score
