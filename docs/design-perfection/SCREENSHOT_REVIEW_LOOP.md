# Screenshot Review Loop

> **Goal:** Turn `pnpm screenshots` into a disciplined visual-quality loop instead of ad hoc reactions.
> **Use When:** Any UI polish round, theme consistency pass, spacing audit, modal review, or screenshot doc-sync pass.
> **Primary Inputs:** `docs/design/specs/pages/*/screenshots/`, page `CURRENT.md` files, and the latest local code.

---

## Why This Exists

The app now has broad screenshot coverage, but raw screenshots alone do not force good design decisions.

Without a strict loop, we drift into:

- one-off page fixes instead of reusable primitives
- dark mode looking intentional while light mode looks washed out
- padding and card treatment changing from screen to screen
- modals and overlays getting less attention than full pages
- screenshot docs going stale after code changes

This document defines the recursive review process:

1. capture screenshots
2. review every page and modal carefully
3. classify defects
4. fix the highest-leverage issues in shared primitives first
5. recapture screenshots
6. update the page docs
7. repeat until the screenshots look cohesive

---

## Source Of Truth

### Screenshot Baseline

Generate the current visual baseline with:

```bash
pnpm screenshots
```

Primary screenshot locations:

- `docs/design/specs/pages/01-landing/screenshots/`
- `docs/design/specs/pages/02-signin/screenshots/`
- `docs/design/specs/pages/03-signup/screenshots/`
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
- `docs/design/specs/pages/14-verify-email/screenshots/`
- `docs/design/specs/pages/15-invite/screenshots/`
- `docs/design/specs/pages/16-unsubscribe/screenshots/`
- `docs/design/specs/pages/17-members/screenshots/`
- `docs/design/specs/pages/18-sprints/screenshots/`

### Design Intent

For each page, use:

- `CURRENT.md` for what the page looks like now
- `TARGET.md` for what the page should become
- `docs/design/DIRECTOR.md` for the quality bar
- `docs/design/specs/components/*.md` for reusable component expectations

---

## Non-Negotiable Rules

### 1. Review All Captured Variants

A page is not "good" because one desktop-dark screenshot looks good.

Each round must check:

- desktop dark
- desktop light
- tablet light
- mobile light
- key modal states where they exist

### 2. Fix Repeated Problems Centrally

If the same issue appears in two or more places, do not patch each page separately unless forced by layout differences.

Prefer to fix:

- tokens
- shared spacing rules
- reusable surface patterns
- shared headers
- shared section wrappers
- shared modal/dialog primitives
- shared list/table/card patterns

### 3. Theme Parity Is Mandatory

Every visual decision must be judged in both themes.

Common failure modes:

- dark mode feels premium, light mode feels flat
- muted text is readable in dark mode but too faint in light mode
- borders are balanced in dark mode but noisy in light mode
- shadows look acceptable in light mode but muddy in dark mode

### 4. Screenshot Review Must Produce Code-Level Conclusions

Do not stop at "this looks off."

Every issue should map to one of:

- token change
- shared component change
- layout composition change
- one-page exception
- screenshot/test harness issue

### 5. Docs Must Move With The UI

After each meaningful round:

- update the relevant `CURRENT.md`
- update the active todo/control doc if priorities changed
- note what improved and what still looks bad

---

## Review Rubric

Score each page and modal against these categories.

Use this scale:

- `0` broken or visibly bad
- `1` functional but weak/inconsistent
- `2` good enough but still rough
- `3` strong and intentional

### A. Hierarchy

Check:

- Is the main action obvious?
- Is the page title dominant enough?
- Do secondary controls stay secondary?
- Are dense zones readable without feeling noisy?

Red flags:

- everything looks the same weight
- giant headers with weak content below
- important actions lost in muted controls

### B. Spacing Rhythm

Check:

- section gaps
- internal padding
- card density
- list row height
- toolbar spacing

Red flags:

- random padding jumps
- large dead zones
- cramped controls beside oversized cards
- mobile headers tighter or looser than desktop with no reason

### C. Surface System

Check:

- card borders
- shadows
- background layers
- nested containers
- section framing

Red flags:

- card-inside-card noise
- too many similar border treatments
- light mode with no depth
- dark mode using gray slabs instead of near-black layering

### D. Theme Parity

Check:

- text contrast
- border contrast
- CTA emphasis
- active/hover states
- empty states

Red flags:

- light mode washed out
- dark mode oversaturated
- accent colors carry different visual weight across themes

### E. Reuse And Pattern Discipline

Check:

- repeated header structure
- repeated card shells
- repeated modal anatomy
- repeated list/section framing

Red flags:

- three different panel paddings for the same concept
- one-off toolbar/button treatments
- similar modals with different header/footer spacing

### F. Content Density

Check:

- does the page feel premium and confident?
- does it use the screen area well?
- do empty states still feel designed?

Red flags:

- excessive empty canvas
- too much explanatory copy
- giant containers with tiny content payload

### G. Modal And Overlay Quality

Check:

- visual relationship to parent page
- padding consistency
- search/command surfaces
- keyboard shortcut/help overlays
- creation dialogs

Red flags:

- modal feels like a different product
- search and commands overlap conceptually
- modal body and footer spacing mismatch

---

## Defect Taxonomy

Every screenshot issue should be classified before fixing it.

### Token-Level

Examples:

- muted text too faint
- border opacity wrong
- inconsistent radius
- shadow depth wrong

Expected fix location:

- shared tokens
- theme variables
- shared utility variants

### Primitive-Level

Examples:

- dialogs use inconsistent shell spacing
- cards have inconsistent header/body/footer rhythm
- section headers vary too much

Expected fix location:

- shared UI components
- reusable layout wrappers
- component spec updates

### Composition-Level

Examples:

- dashboard feels empty
- landing hero lacks enough proof or product context
- analytics cards compete with charts

Expected fix location:

- page section structure
- route-level composition
- information hierarchy

### Content-Level

Examples:

- placeholder copy lowers perceived quality
- fake logos or filler stats reduce credibility
- label wording is too generic

Expected fix location:

- copy
- icon selection
- proof/content modules

### Harness/Data-Level

Examples:

- screenshots caught loading state
- modal never opened
- seeded content absent

Expected fix location:

- E2E helpers
- screenshot runner
- seed data

---

## Execution Loop

Run this loop for every visual round.

### Step 1. Capture Fresh Screenshots

```bash
pnpm screenshots
```

If screenshots fail, fix the deterministic capture issue before doing visual critique.

### Step 2. Review By Page Family

Review in this order:

1. landing and auth
2. app shell and dashboard
3. project surfaces
4. entity detail and editors
5. calendar/analytics/settings
6. modal and overlay states

This order matters because shell-level changes often improve several downstream pages.

### Step 3. Log Issues By Leverage

For each issue, record:

- screenshot path
- viewport/theme
- what looks wrong
- category from the rubric
- likely shared fix point

Prefer statements like:

- "light-mode muted text is too faint across dashboard, projects, and settings"
- "dialog header/body/footer rhythm diverges between omnibox, create issue, and create project"

Avoid isolated observations with no generalization.

### Step 4. Extract Shared Fixes

Before editing, ask:

- Is this really a token problem?
- Is this a reusable component problem?
- Is there already a primitive that should own this?
- Will a layout wrapper solve this for multiple screens?

Only accept one-off fixes when the problem is page-specific.

### Step 5. Implement The Smallest High-Leverage Set

Do not try to redesign the entire product in one pass.

A good round usually targets one to three themes:

- shell density and section rhythm
- light/dark parity
- modal consistency
- landing cohesion
- sidebar/navigation polish

### Step 6. Re-Capture And Compare

```bash
pnpm screenshots
```

Then check:

- did the target pages improve?
- did any untouched pages regress?
- did theme parity get better or worse?

### Step 7. Update Docs

Update:

- page `CURRENT.md` files that materially changed
- any todo/control docs whose priorities changed
- this review loop doc only if the process itself improved

---

## Required Output For Each Round

Each screenshot-driven iteration should produce a short review entry somewhere in the active work log or commit summary with:

- baseline date
- screenshot count
- main visual themes addressed
- shared primitives changed
- pages intentionally improved
- pages still below bar
- validation commands run

Minimum standard:

- exact command run
- exact screenshot count
- the next visual target

---

## Round Template

Use this template when logging a visual pass:

```md
## Screenshot Round - YYYY-MM-DD

- Baseline: `pnpm screenshots` -> `N screenshots captured`
- Focus:
  - shell / landing / modal / theme parity / spacing rhythm / sidebar
- Main issues found:
  - [page + viewport] ...
  - [page + viewport] ...
- Shared fixes chosen:
  - token:
  - primitive:
  - composition:
- Validation:
  - `pnpm run typecheck`
  - `pnpm screenshots`
- Result:
  - improved:
  - still weak:
  - next round:
```

---

## Page Review Checklist

Use this checklist for each page folder under `docs/design/specs/pages/`.

### Full Pages

- latest screenshots exist for current supported variants
- `CURRENT.md` status matches the actual UI
- `CURRENT.md` remaining gaps reflect what the screenshots show now
- the page looks coherent with the app shell
- spacing and surface treatment match neighboring pages

### Modals And Overlays

- opening state is deterministic in screenshots
- padding matches other dialogs
- title/body/footer rhythm is consistent
- light and dark variants both look intentional
- the modal does not duplicate another existing surface without a clear reason

---

## When To Escalate To A Design System Change

Escalate from page tweaking to shared-system work when one of these happens:

- the same spacing issue appears in three or more pages
- light mode repeatedly looks worse than dark mode
- multiple dialogs have inconsistent anatomy
- multiple dashboard/project pages use different section shells
- repeated CTA/button emphasis looks different across flows

When escalated, update or create:

- shared UI primitives
- component specs in `docs/design/specs/components/`
- theme/token definitions

---

## Current Known Focus Areas

As of the latest screenshot baseline, keep reviewing these aggressively:

- landing page cohesion versus app shell
- sidebar density and navigation polish
- dashboard section rhythm in both themes
- modal consistency across omnibox, create flows, and detail dialogs
- light-mode contrast, borders, and muted text
- page-to-page padding consistency

---

## Success Criteria

This loop is working when:

- screenshots stop surfacing obvious regressions after each round
- light and dark mode both feel intentional
- the shell, landing, and modals feel like the same product
- repeated visual issues are solved in shared primitives, not copied page fixes
- `CURRENT.md` files describe the actual UI, not stale intentions
