# Bundle Size Optimization

> **Created:** 2026-03-14
> **Priority:** P3
> **Status:** Open

## Current State

- **Main bundle:** 721KB gzip (2.4MB raw)
- **Budget:** 730KB gzip
- **Headroom:** ~9KB

The main vendor chunk (`index-*.js`) contains almost all vendor dependencies in a single file. Code splitting is working for routes (Settings, PlateEditor, TimeTracking, Analytics are lazy-loaded), but the vendor bundle is monolithic.

## Problem

The 721KB vendor bundle loads on initial page load, which is at the upper end of acceptable for a complex SPA. As features grow, this will exceed budget again.

## Optimization Opportunities

### High Impact

1. **Split vendor chunk** - Separate React, Convex, Radix UI, BlockNote, date-fns into individual chunks
   - Use `manualChunks` in Vite config
   - Allows better caching (React changes rarely vs app code)

2. **Audit unused exports** - Check if tree-shaking is working correctly
   - Run `npx vite-bundle-visualizer` to see what's actually bundled
   - Look for barrel file imports that pull in everything

3. **Lazy load heavy features** - Move more routes to dynamic imports
   - Calendar page
   - Roadmap view
   - Admin settings

### Medium Impact

4. **Replace heavy deps** - Consider lighter alternatives
   - `date-fns` → `dayjs` (smaller)
   - Check if all Radix components are needed

5. **Preload critical chunks** - Use `<link rel="modulepreload">` for important chunks

### Low Impact

6. **Enable Brotli** - Already configured, verify CDN serves it (563KB vs 721KB gzip)

## Acceptance Criteria

- [ ] Main vendor chunk < 500KB gzip
- [ ] Total initial load < 600KB gzip
- [ ] No regression in Lighthouse performance score

## Notes

- Current 721KB is acceptable for a complex SPA with real-time collab, rich text editor, calendar, etc.
- Optimization is not urgent but should be addressed before adding more features
