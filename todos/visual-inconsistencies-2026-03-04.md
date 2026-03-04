# Visual Inconsistencies TODO (2026-03-04)

> Source: `pnpm screenshots` run on 2026-03-04 (`176` captures)
> Scope: visual quality issues from generated desktop/tablet/mobile screenshots

## P0 - Blockers (fix first)

- [ ] Calendar pages are captured in loading state instead of actual UI.
  - Evidence: `docs/design/specs/pages/11-calendar/screenshots/desktop-light-day.png`
  - Evidence: `docs/design/specs/pages/11-calendar/screenshots/desktop-light-week.png`
  - Evidence: `docs/design/specs/pages/11-calendar/screenshots/desktop-light-month.png`
  - Evidence: `docs/design/specs/pages/11-calendar/screenshots/mobile-light-month.png`
  - Expected: stable loaded calendar content before snapshot.

- [ ] Project board captures skeleton loaders instead of loaded cards on tablet/mobile.
  - Evidence: `docs/design/specs/pages/06-board/screenshots/tablet-light.png`
  - Evidence: `docs/design/specs/pages/06-board/screenshots/mobile-light.png`
  - Expected: real board content in visual baseline screenshots.

- [ ] Project settings tablet capture shows only spinner for full page.
  - Evidence: `docs/design/specs/pages/12-settings/screenshots/tablet-light-project.png`
  - Expected: settings form loaded before screenshot.

## P1 - Major UX/visual consistency gaps

- [ ] Align visual language between marketing and app shell.
  - Evidence: high-contrast/glossy hero (`docs/design/specs/pages/01-landing/screenshots/desktop-light.png`) vs very flat app surfaces (`docs/design/specs/pages/04-dashboard/screenshots/desktop-light.png`).
  - Problem: feels like two unrelated products.

- [ ] Improve contrast for secondary text and muted borders in light mode.
  - Evidence: dashboard metadata and sidebar labels are very faint (`docs/design/specs/pages/04-dashboard/screenshots/desktop-light.png`).
  - Evidence: project/settings descriptive text is low legibility (`docs/design/specs/pages/05-projects/screenshots/desktop-light.png`, `docs/design/specs/pages/12-settings/screenshots/desktop-light-project.png`).

- [ ] Reduce excessive empty canvas in core app pages.
  - Evidence: large unstructured whitespace in projects and roadmap views (`docs/design/specs/pages/05-projects/screenshots/desktop-light.png`, `e2e/screenshots/desktop-light-filled-project-demo-roadmap.png`).
  - Expected: clearer layout framing and empty-state composition.

## P2 - Polish and responsive improvements

- [ ] Tighten mobile top bar density and consistency.
  - Evidence: action/search cluster feels cramped and icon spacing is uneven (`docs/design/specs/pages/04-dashboard/screenshots/mobile-light.png`, `docs/design/specs/pages/06-board/screenshots/mobile-light.png`).

- [ ] Normalize CTA hierarchy and button styling across pages.
  - Evidence: marketing CTAs are bold cyan pills, while app primary actions are mostly purple and visually subtler (`docs/design/specs/pages/01-landing/screenshots/desktop-light.png`, `docs/design/specs/pages/05-projects/screenshots/desktop-light.png`).

- [ ] Standardize card elevation/border treatment across modules.
  - Evidence: dashboard cards, time tracking rows, and settings sections use different border/elevation intensity (`docs/design/specs/pages/04-dashboard/screenshots/desktop-light.png`, `e2e/screenshots/desktop-light-empty-time-tracking.png`, `docs/design/specs/pages/12-settings/screenshots/desktop-light-project.png`).

## Notes

- First priority should be screenshot determinism (wait for data + no loading placeholders in baselines).
- After determinism, address token-level consistency (contrast, spacing, surface depth, CTA color system).
