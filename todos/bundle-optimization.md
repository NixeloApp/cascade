# Bundle Size Optimization

> **Created:** 2026-03-14
> **Priority:** P2 (maintenance)
> **Status:** Complete (core work done)

## Results

- **Vendor chunk:** 722KB → 337KB gzip (**53% reduction**)
- **10 cached chunks:** react, convex, editor, radix, router, motion, icons, date-fns, dnd, collab
- **Editor deferred:** 135KB only loads on document pages
- **3 routes lazy-loaded:** Calendar, Roadmap, ProjectSettings
- **Tree-shaking:** replaced `export *` with named exports
- **Brotli:** enabled (565KB → 338KB brotli)

## Acceptance Criteria

- [x] Vendor chunk < 500KB gzip (achieved: 337KB)
- [ ] Total initial load < 600KB gzip (at ~725KB, needs app chunk splitting)
- [ ] No regression in Lighthouse performance score

## Remaining (diminishing returns)

- App chunk 388KB — shared components across routes, hard to split further
- Lazy-load Board, Assistant, Invoices pages (complex URL state management)
- Audit remaining barrel imports
