# Consistency Contract

> The practical contract for keeping the product visually cohesive and code-consistent.

This is the bridge between the vision docs and the validator suite. If `DIRECTOR.md` is the bar, this file is the repeatable review standard.

## What Must Stay Consistent

### 1. Shells

- Repeated rounded/bordered/elevated surfaces should come from owned primitives or recipes
- Nested cards are a regression unless there is a very explicit exception
- Page and section shells should read like one system, not per-route inventions

### 2. Typography

- `Typography` picks semantic meaning first, visual styling second
- Do not restyle `Typography` with raw size, weight, or tracking classes unless the primitive surface is truly missing a needed variant
- Raw `p`, `h1`-`h6`, `strong`, and `em` in feature code are drift

### 3. Layout Rhythm

- Use `Flex`, `Stack`, `Grid`, and page shells instead of ad-hoc layout clusters
- Spacing should feel like one product-wide rhythm, not one-off route tuning
- Repeated spacing/state clusters belong in a component or CVA recipe

### 4. Control Behavior

- Buttons, badges, tabs, segmented controls, popovers, dialogs, and sheets should express state through owned variants before feature-local class overrides
- Hover, focus, disabled, selected, loading, and destructive states should look related across surfaces

### 5. Visual Validation

- The screenshot set is the source of truth for what the product actually looks like
- Every meaningful visual change should go through the screenshot workflow
- Missing screenshot coverage is not invisible debt; it should stay visible in validation or `/todos`

## Enforced Today

These are already backed by validators or review workflow:

- `check-standards.js` — raw typography tags, raw form elements, raw flex/grid, font styles on raw elements
- `check-colors.js` — semantic token discipline
- `check-raw-tailwind.js` — drift audit for generic utility buildup
- `check-surface-shells.js` and `check-recipe-drift.js` — repeated shell enforcement
- `check-layout-prop-usage.js` and `check-page-layout.js` — layout consistency
- `check-nested-cards.js` and `check-border-radius.js` — surface/chrome cohesion
- `check-screenshot-coverage.js` — route coverage and canonical screenshot variant audit
- `check-typography-drift.js` — advisory audit for `Typography` components restyled with raw size/weight/tracking classes
- `pnpm screenshots:diff` — screenshot drift against the approved baseline

## Review Loop

When a change touches UI, use this loop:

```bash
pnpm run validate
pnpm screenshots
pnpm screenshots:diff
```

If the visuals changed intentionally:

```bash
pnpm screenshots:approve
```

## No-Corner-Missed Checklist

Use this when reviewing a visually meaningful PR:

- Shells: no new one-off card/panel recipes
- Typography: no raw heading/paragraph tags in feature code; no `Typography` size/weight/tracking overrides without a clear reason
- Layout: no new `div className="flex"` / `div className="grid"` drift where primitives should be used
- States: hover, focus, selected, disabled, loading, and error states still match neighboring surfaces
- Empty/loading/error: all remain visually coherent with the surrounding page family
- Screenshots: route coverage still holds and canonical spec screenshots remain complete where expected
- Drift approval: screenshot diff is either clean or explicitly approved

## Known Remaining Blind Spots

These are still only partially automated and need human review:

- motion/animation consistency across page families
- density and hierarchy consistency inside large complex surfaces
- feature-local `Typography` overrides that are intentional but should probably become real variants
- screenshot coverage for deep modal and interaction states that are not yet captured

## Escalation Rule

If a consistency rule keeps being broken in feature code, do not keep patching the same symptom. Move the pattern into:

- a component prop
- a component variant
- a recipe
- a validator rule

That is the point of the system.
