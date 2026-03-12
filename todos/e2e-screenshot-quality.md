# E2E Screenshot Quality

> **Priority:** P0
> **Status:** Active
> **Last Updated:** 2026-03-12
> **Supersedes:** previous screenshot review loop docs and separate visual-polish todo files
> **Scope:** canonical doc for screenshot determinism, screenshot-driven UI review, and screenshot-specific E2E quality work

## Objective

Keep `pnpm screenshots` trustworthy and useful.

That means three things must stay true at the same time:

1. the screenshot runner captures real, loaded UI states deterministically
2. the resulting screenshots drive disciplined visual improvements instead of ad hoc page tweaks
3. a screenshot that is technically valid but visually broken must still be called broken in review

This is the single control doc for both.

## Commands

### Primary Commands

```bash
pnpm screenshots
pnpm screenshots -- --spec 01-landing --config desktop-dark,desktop-light
pnpm screenshots -- --spec 02-signin,03-signup,04-forgot-password --config desktop-dark,desktop-light,mobile-light
pnpm exec playwright test --reporter=line
```

### Interpretation

- `pnpm screenshots` is the visual baseline generator.
- Use targeted `pnpm screenshots -- --spec ... --config ...` runs while iterating on a single page family, then rerun the full matrix once the shared fix is credible.
- `pnpm exec playwright test --reporter=line` is the reliability gate for the broader E2E path.
- If screenshot capture is invalid, fix the harness first before doing design critique.

## Screenshot Matrix

Supported variants:

- `desktop-dark` (`1920x1080`)
- `desktop-light` (`1920x1080`)
- `tablet-light` (`768x1024`)
- `mobile-light` (`390x844`)

Each review round must check:

- full pages
- key modal states
- light/dark parity where supported
- responsive compression on tablet/mobile

## Source Of Truth

### Screenshot Outputs

Primary screenshot folders:

- `docs/design/specs/pages/01-landing/screenshots/`
- `docs/design/specs/pages/02-signin/screenshots/`
- `docs/design/specs/pages/03-signup/screenshots/`
- `docs/design/specs/pages/04-forgot-password/screenshots/`
- `docs/design/specs/pages/04-dashboard/screenshots/`
- `docs/design/specs/pages/05-projects/screenshots/`
- `docs/design/specs/pages/06-board/screenshots/`
- `docs/design/specs/pages/07-backlog/screenshots/`
- `docs/design/specs/pages/08-issue/screenshots/`
- `docs/design/specs/pages/09-documents/screenshots/`
- `docs/design/specs/pages/10-editor/screenshots/`
- `docs/design/specs/pages/11-calendar/screenshots/`
- `docs/design/specs/pages/12-settings/screenshots/`
- `docs/design/specs/pages/13-analytics/screenshots/`

Fallback screenshots without spec folders land in:

- `e2e/screenshots/`

### Design Intent References

Use these while reviewing:

- page `CURRENT.md`
- page `TARGET.md`
- `docs/design/DIRECTOR.md`
- relevant component specs in `docs/design/specs/components/`

## Hard Rules

### 1. Do Not Review Broken Captures As If They Were UI Defects

Common invalid-baseline cases:

- loading spinner
- splash screen
- wrong route captured
- modal shell captured before content hydrates
- empty/error state captured instead of seeded state

These are harness/data issues first.

### 1A. Do Not Mistake A Valid Capture For A Good UI

Examples:

- header controls overlap or float awkwardly but the page is fully loaded
- a modal technically opens, but the content obviously exceeds the frame and the scroll behavior is wrong
- a hero/showcase composition is cramped, noisy, or internally inconsistent

These are review-quality failures, not harness successes.

### 2. Review All Variants

A page is not done because one desktop-dark screenshot looks decent.

Minimum review set:

- desktop dark
- desktop light
- tablet light
- mobile light
- key modal states where they exist

### 3. Fix Repeated Problems Centrally

If the same defect appears across two or more screens, prefer:

- token changes
- shared primitives
- page-shell/layout wrappers
- shared dialog anatomy
- shared card/list/header patterns

### 4. Theme Parity Is Mandatory

Every visual decision must be judged in both themes where both exist.

### 5. Docs Must Move With The UI

After each meaningful round:

- update relevant `CURRENT.md`
- update this doc if priorities changed
- update `todos/README.md` only if execution order changed materially

## Review Rubric

Score each page/modal from `0` to `3`:

- `0` broken or visibly bad
- `1` functional but weak/inconsistent
- `2` good enough but still rough
- `3` strong and intentional

### A. Hierarchy

Check:

- Is the main action obvious?
- Is the title strong enough?
- Do secondary controls stay secondary?
- Can dense areas be parsed quickly?

Red flags:

- everything same weight
- oversized headers with weak content below
- important actions getting lost in chrome

### B. Spacing Rhythm

Check:

- section gaps
- internal padding
- row density
- toolbar spacing
- mobile versus desktop consistency

Red flags:

- random padding jumps
- dead space
- cramped controls next to oversized shells

### C. Surface System

Check:

- borders
- shadows
- background layering
- nested container discipline
- empty-state framing

Red flags:

- card-inside-card noise
- pale surfaces stacked on pale surfaces
- dark mode using muddy gray slabs

### D. Theme Parity

Check:

- contrast
- muted text legibility
- CTA weight
- active/hover states
- empty states

### E. Reuse And Pattern Discipline

Check:

- repeated header structure
- repeated card shells
- repeated modal anatomy
- repeated section wrappers

### F. Content Density

Check:

- does the page use the screen well?
- does it feel intentional?
- do empty states still feel designed?

### G. Modal And Overlay Quality

Check:

- relationship to parent page
- header/body/footer rhythm
- visual consistency across omnibox/create/detail flows
- mobile fit
- whether overflowing content has a deliberate scroll region
- whether the modal family feels like one system instead of separate one-off surfaces

## Defect Taxonomy

Classify every issue before fixing it.

### Harness/Data-Level

Examples:

- wrong route captured
- loading state captured
- seeded content missing
- modal not ready before screenshot

Expected fix location:

- `e2e/screenshot-pages.ts`
- seed helpers
- E2E wait contracts

### Token-Level

Examples:

- muted text too faint
- borders too noisy
- shadows too weak/strong
- radius mismatch

### Primitive-Level

Examples:

- card shells inconsistent
- dialog anatomy inconsistent
- tabs/toolbars inconsistent

### Composition-Level

Examples:

- page header too large on mobile
- dashboard feels over-wrapped
- settings hierarchy too shallow

### Content-Level

Examples:

- filler copy lowering quality
- weak labels
- unconvincing proof/stat content

## Active Queue

### P0 - Keep The Baseline Trustworthy

- [x] Fix issue-detail capture so the baseline shows the real issue UI instead of the error state.
  - Fixed in: `e2e/screenshot-pages.ts`, `convex/e2e.ts`
  - Evidence now: `docs/design/specs/pages/08-issue/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/08-issue/screenshots/mobile-light.png`

- [x] Fix document-editor capture so `10-editor` stops resolving to the templates page.
  - Fixed in: `e2e/screenshot-pages.ts`
  - Evidence now: `docs/design/specs/pages/10-editor/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/10-editor/screenshots/mobile-light.png`

- [x] Fix create-issue modal capture readiness so the modal is no longer captured as a spinner or skipped state.
  - Fixed in: `e2e/screenshot-pages.ts`, `e2e/pages/projects.page.ts`
  - Evidence now: `docs/design/specs/pages/06-board/screenshots/desktop-dark-create-issue-modal.png`
  - Evidence now: `docs/design/specs/pages/06-board/screenshots/desktop-light-create-issue-modal.png`
  - Evidence now: `docs/design/specs/pages/06-board/screenshots/mobile-light-create-issue-modal.png`

- [x] Restore seeded project and issue data so “filled” screenshots are real again.
  - Fixed in: `convex/e2e.ts`
  - Evidence now: `docs/design/specs/pages/05-projects/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/06-board/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/07-backlog/screenshots/desktop-light.png`

- [ ] Keep expanding screenshot readiness contracts where partial-load captures can still leak through.
  - 2026-03-12 hardening added route-specific readiness for public pages, project backlog, calendar event content, project modal navigation, and create-issue modal form readiness.
  - Remaining risk: route-specific completion signals are still uneven outside the core auth/project/editor/calendar paths.
  - Expected: every captured route has a deterministic loaded-content signal before capture.

### P1 - Highest-Leverage Remaining Visual Fixes

- [x] Fix public-page theme parity, especially landing/auth light mode.
  - Fixed in: `src/index.css`, `src/components/Auth/AuthPageLayout.tsx`, `src/components/Landing/NavHeader.tsx`, `src/components/Landing/ProductShowcase.tsx`, `src/components/ui/Card.tsx`, `e2e/screenshot-pages.ts`
  - Evidence now: `docs/design/specs/pages/01-landing/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/02-signin/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/03-signup/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/04-forgot-password/screenshots/desktop-light.png`

- [x] Simplify the auth shell so it stops reading like a nested marketing card pile.
  - Fixed in: `src/components/Auth/AuthPageLayout.tsx`
  - Evidence now: `docs/design/specs/pages/02-signin/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/03-signup/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/04-forgot-password/screenshots/desktop-light.png`

- [x] Simplify mobile project chrome and tab density further.
  - Fixed in: `src/components/ui/RouteNav.tsx`, `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx`, `src/routes/_auth/_app/$orgSlug/projects/$key/board.tsx`, `src/components/FilterBar.tsx`, `src/components/Calendar/shadcn-calendar/header/*`
  - Evidence now: `docs/design/specs/pages/06-board/screenshots/mobile-light.png`
  - Evidence now: `docs/design/specs/pages/07-backlog/screenshots/mobile-light.png`
  - Evidence now: `docs/design/specs/pages/11-calendar/screenshots/mobile-light.png`

- [x] Continue reducing card layering and restore theme parity for internal app surfaces, especially light-mode depth/contrast.
  - Fixed in: `src/components/ui/Card.tsx`, `src/index.css`, `src/components/PlateEditor.tsx`, `src/components/Documents/DocumentHeader.tsx`, `src/components/Settings/ProfileContent.tsx`
  - Evidence now: `docs/design/specs/pages/05-projects/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/10-editor/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/12-settings/screenshots/desktop-light.png`

- [x] Make the filled projects state credible again.
  - Fixed in: `convex/e2e.ts`, `src/components/ProjectsList.tsx`
  - Evidence now: `docs/design/specs/pages/05-projects/screenshots/desktop-light.png`
  - Evidence now: `docs/design/specs/pages/05-projects/screenshots/tablet-light.png`
  - Evidence now: `docs/design/specs/pages/05-projects/screenshots/mobile-light.png`

- [x] Tighten settings tab density and reduce shell weight on tablet/mobile.
  - Fixed in: `src/components/Settings.tsx`, `src/components/ui/Tabs.tsx`, `src/components/Settings/ProfileContent.tsx`
  - Evidence now: `docs/design/specs/pages/12-settings/screenshots/mobile-light.png`
  - Evidence now: `docs/design/specs/pages/12-settings/screenshots/tablet-light.png`

### P2 - Follow-Through

- [x] Refresh affected `CURRENT.md` docs once the screenshots reflect the real UI.
- [x] Rerun `pnpm screenshots` after each meaningful polish round.
  - Latest evidence: `2026-03-12` full matrix rerun passed with `207 screenshots captured` and promoted output.
- [x] Keep screenshot-specific reliability work synced with `todos/e2e-reliability-overhaul.md`.
  - Synced on `2026-03-12` with the latest screenshot-harness readiness and page-object navigation fixes.

## Execution Loop

### Step 1. Capture

```bash
pnpm screenshots
```

If the run is invalid, fix the harness before critiquing visuals.

### Step 2. Review By Family

Review in this order:

1. landing and auth
2. app shell and dashboard
3. project surfaces
4. issue/editor/detail surfaces
5. calendar, analytics, settings
6. modal and overlay states

### Step 3. Log By Leverage

For each issue, record:

- screenshot path
- viewport/theme
- what is wrong
- rubric category
- likely shared fix point

### Step 4. Prefer Shared Fixes

Ask before editing:

- Is this actually a token problem?
- Is there a shared primitive that should own this?
- Is this page-specific, or am I patching around a system defect?

### Step 5. Implement Small High-Leverage Sets

A good round usually targets one to three themes:

- screenshot determinism
- auth/landing cohesion
- theme parity across light and dark
- shell density
- modal consistency
- light-theme contrast and depth

### Step 6. Re-Capture

```bash
pnpm screenshots
```

Then verify:

- target pages improved
- untouched pages did not regress
- theme parity got better, not worse

### Step 7. Update Docs

Update:

- relevant `CURRENT.md`
- this doc
- `todos/README.md` only if priority order changed

## Required Round Log

Each screenshot-driven round should leave a short entry in the active log or commit summary with:

- baseline date
- screenshot count
- main themes addressed
- shared primitives changed
- pages improved
- pages still below bar
- commands run
- next target

### Round Template

```md
## Screenshot Round - YYYY-MM-DD

- Baseline: `pnpm screenshots` -> `N screenshots captured`
- Focus:
  - screenshot determinism / auth / shell / modal / light-theme depth
- Main issues found:
  - [page + viewport] ...
  - [page + viewport] ...
- Shared fixes chosen:
  - harness:
  - token:
  - primitive:
  - composition:
- Validation:
  - `pnpm screenshots`
  - `pnpm exec playwright test --reporter=line`
- Result:
  - improved:
  - still weak:
  - next round:
```

## Historical Notes

### 2026-03-04 Baseline

- Initial screenshot audit established the first determinism + visual consistency backlog.
- The notable fixed classes from that round were:
  - calendar captured in loading state
  - board/settings tablet and mobile partial-load captures
  - light-theme contrast and border inconsistency
  - mobile top-bar density problems

### 2026-03-09 Baseline

- Fresh rerun completed successfully: `198 screenshots captured`
- New blockers found:
  - issue detail captured as not-found state
  - editor captured as templates page
  - create-issue modal captured before hydration
  - projects/analytics still vulnerable to partial-load captures

### 2026-03-09 Follow-Through

- Latest trustworthy full rerun completed successfully: `205 screenshots captured`
- Main shared fixes that landed:
  - `convex/e2e.ts`: reattached stale demo seeds to the active org/workspace/project
  - `e2e/screenshot-pages.ts`: fixed issue/editor route discovery, modal readiness, and document-list capture readiness
  - `e2e/screenshot-pages.ts`: added targeted `--spec`, `--config`, and `--match` capture support so single page families can be iterated without rerunning the full matrix
  - `e2e/pages/projects.page.ts`: stabilized create-issue modal entry for screenshots
  - `src/components/Auth/AuthPageLayout.tsx`: simplified the auth shell
  - `src/components/ui/Card.tsx`: improved shared light-theme surface depth
  - `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx`: reduced shared project-shell density
  - `src/components/ProjectsList.tsx`: made the single-project filled state feel intentional instead of broken
  - `src/components/Settings.tsx` and `src/components/Settings/settingsTabs.ts`: moved settings tabs to a typed canonical model
- Pages materially improved:
  - `02-signin`, `03-signup`, `04-forgot-password`
  - `05-projects`
  - `06-board`
  - `07-backlog`
  - `08-issue`
  - `10-editor`
  - `12-settings`
- Remaining below-bar areas:
  - landing/auth light-mode palette and background treatment versus dark mode
  - mobile project chrome on board/backlog/calendar
  - desktop light-mode depth on projects/editor/settings
  - settings shell density on smaller viewports

### 2026-03-12 Follow-Through

- Targeted screenshot reruns completed successfully for calendar, then mobile board/backlog/calendar:
  - `pnpm screenshots -- --spec 11-calendar --config desktop-light,tablet-light,mobile-light`
  - `pnpm screenshots -- --spec 06-board,07-backlog,11-calendar --config mobile-light`
- Additional public-page reruns completed successfully:
  - `pnpm screenshots -- --spec 01-landing --config desktop-light`
  - `pnpm screenshots -- --spec 02-signin,03-signup,04-forgot-password --config desktop-light,mobile-light`
- Additional internal-surface reruns completed successfully:
  - `pnpm screenshots -- --spec 05-projects,10-editor,12-settings --config desktop-light`
  - `pnpm screenshots -- --spec 12-settings --config desktop-light`
- Additional settings-density reruns completed successfully:
  - `pnpm screenshots -- --spec 12-settings --config tablet-light,mobile-light`
- Main shared fixes that landed:
  - `e2e/screenshot-pages.ts`: calendar captures now wait for real event content instead of trusting a loaded shell alone
  - `e2e/screenshot-pages.ts`: public pages now wait for real hero/form content and entrance animations before capture
  - `src/components/Calendar/shadcn-calendar/body/use-calendar-initial-scroll.ts`: preserved horizontal scroll when applying the initial hour anchor
  - `src/components/Calendar/shadcn-calendar/body/week/calendar-body-week.tsx`: re-anchored the active day once event content is present, which restored valid mobile week/day framing
  - `src/components/Calendar/shadcn-calendar/body/month/calendar-body-month.tsx`: made month view responsive at every breakpoint and added compact mobile event indicators instead of an effectively empty list layout
  - `src/components/Calendar/shadcn-calendar/calendar-event.tsx`: simplified month event chips so desktop/tablet month view reads at a glance
  - `src/components/Calendar/shadcn-calendar/header/*`: reduced mobile calendar-header density
  - `src/components/ui/RouteNav.tsx` and `src/routes/_auth/_app/$orgSlug/projects/$key/route.tsx`: tightened the shared mobile project shell and tab pills
  - `src/routes/_auth/_app/$orgSlug/projects/$key/board.tsx` and `src/components/FilterBar.tsx`: removed extra mobile board shell and reduced the filter row's top-weight
  - `src/index.css`, `src/components/Auth/AuthPageLayout.tsx`, `src/components/Landing/NavHeader.tsx`, `src/components/Landing/ProductShowcase.tsx`, and `src/components/ui/Card.tsx`: rebalanced public light-mode backgrounds and shared landing/auth surfaces so light mode no longer reads like dimmed dark-mode art
  - `src/components/ui/Card.tsx` and `src/index.css`: improved shared app-surface depth so light pages stop stacking pale cards on pale page backgrounds
  - `src/components/PlateEditor.tsx` and `src/components/Documents/DocumentHeader.tsx`: gave the editor a clearer paper/header relationship in desktop light mode
  - `src/components/Settings/ProfileContent.tsx`: reduced the profile shell weight after the shared surface pass landed
  - `src/components/Settings.tsx` and `src/components/ui/Tabs.tsx`: switched settings to short labels until large viewports and tightened compact tab spacing so tablet/mobile tab rows stop collapsing under the tab count
- Pages materially improved:
  - `01-landing`
  - `02-signin`
  - `03-signup`
  - `04-forgot-password`
  - `05-projects`
  - `10-editor`
  - `11-calendar`
  - mobile `06-board`
  - mobile `07-backlog`
  - `12-settings`
- Remaining below-bar areas:
  - backlog still needs stronger row/section hierarchy in light mode

## Success Criteria

This doc is doing its job when:

- `pnpm screenshots` stops producing obviously invalid baselines
- repeated visual problems are solved in shared primitives instead of page patches
- the shell, auth, and modal surfaces feel like the same product
- light mode and dark mode both look intentional
- `CURRENT.md` files describe the actual UI instead of stale intentions
