# Screenshot Facelift Overhaul

> **Priority:** P0
> **Status:** Active
> **Last Updated:** 2026-03-15
> **Objective:** use screenshot review to drive a larger visual facelift, not scattered one-off tweaks.

## Direction

- Treat screenshots as a product-quality review loop, not just a regression check.
- Prioritize bigger page-level improvements over isolated component touch-ups.
- Push for stronger composition, spacing rhythm, hierarchy, and visual identity across the main product surfaces.

---

## Screenshot Infrastructure

### Cleanup

- [ ] Delete `scripts/capture-screenshots.mjs` — dead legacy script using banned anti-patterns (`waitForTimeout`, `networkidle`, hardcoded port 5173). Fully superseded by `e2e/screenshot-pages.ts`.
- [ ] Document the `check-e2e-quality.js` skip for `screenshot-pages.ts` with an explicit comment explaining why (utility, not a test).

### Resilience

- [ ] Replace `.animate-shimmer` CSS class selectors in `screenshot-pages.ts` with a `data-loading-skeleton` attribute. If the class name changes, screenshots silently capture loading states instead of loaded content.
- [ ] Deduplicate auth token injection — `autoLogin()` and inline auth in `captureForConfig()` repeat the same localStorage token-setting logic. Extract a shared helper.

### Missing page coverage

Current capture set is missing several product surfaces:

- [ ] Notification center (bell icon dropdown)
- [ ] AI chat panel
- [ ] Workspace backlog (filled state — only empty-state waiting logic exists today)
- [ ] Team calendar (filled state)
- [ ] Error states (404, permission denied)

### Visual regression tooling

- [ ] Add a lightweight screenshot diff script (hash-based) that flags new/removed/changed screenshots between runs. No pixel-level diffing needed — just detect which files changed so facelift passes can be evaluated quickly.

---

## Visual Facelift

### Bigger facelift pass

- [ ] Review the current screenshot set and identify the weakest product surfaces.
- [ ] Pick the first 3 high-visibility screens for a broader facelift pass.
- [ ] Replace "items here and there" polish with page-level layout, hierarchy, and visual-system improvements.
- [ ] Align facelift work with existing design specs where they help, but do not let the work collapse into narrow spec-chasing.

### Screenshot workflow

- [ ] Keep screenshot capture trustworthy enough to evaluate UI direction quickly.
- [ ] Document which screens are approved, which need rework, and why.
- [ ] Use before/after screenshot comparisons when landing facelift changes.

### Quality bar

- [ ] Improve visual cohesion across the selected screens.
- [ ] Remove obvious low-signal UI clutter, cramped spacing, and weak emphasis patterns.
- [ ] Raise the bar on overall presence so the product feels intentionally designed rather than incrementally patched.

---

## Execution Order

1. Clean up infra debt (delete legacy script, fix shimmer selectors, deduplicate auth).
2. Add missing page coverage so the screenshot set is complete.
3. Identify the worst-looking screens from the full set.
4. Redesign those screens in larger passes.
5. Re-run screenshots after each pass and keep only changes that materially improve the product.

## Acceptance Criteria

- [ ] Legacy `capture-screenshots.mjs` deleted.
- [ ] No `.animate-shimmer` CSS selectors in screenshot-pages.ts.
- [ ] All major product surfaces have screenshot coverage.
- [ ] The first facelift batch covers at least 3 high-visibility screens.
- [ ] Screenshot review shows clearly stronger hierarchy and cohesion on the touched screens.
- [ ] The work reads as a deliberate visual direction change, not scattered cleanup.
