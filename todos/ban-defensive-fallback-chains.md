# Ban Defensive Fallback Chains

> **Priority:** P1
> **Status:** Not started
> **Last Updated:** 2026-03-28

We control this repo end-to-end. We know exactly what inputs our components receive because we wrote both sides. Deep nested ternary fallback chains (like the Select `selectedValueContent` computation) add complexity without protecting against anything real — the "impossible" branches just hide bugs instead of surfacing them.

## Validators to add

- [ ] **Ban deep ternary fallback chains in component value rendering.** Flag ternary expressions nested 3+ levels deep that mix `undefined`/`null` checks. These are a code smell — the component should know what it's rendering and assert on it, not defensively handle every impossible combination.

- [ ] **Ban `undefined` fallback returns in render logic.** If a component computes a display value and lands on `undefined`, that's a bug (renders nothing silently). The validator should flag computed-value expressions that can resolve to `undefined` when they feed into JSX children. Prefer explicit empty states or throwing over silent nothing.

## Immediate cleanup targets

- [ ] **`src/components/ui/Select.tsx` line 164-171** — The `selectedValueContent` ternary. Simplify to: if `renderValue` exists, use it; otherwise show `selectedOption.label`. Drop the `currentValue !== undefined` fallback branch entirely — it hides misuse.

## Principle

If a branch "can't happen", don't handle it — delete it. If it can happen, handle it loudly (throw, error state), not silently (`undefined`, empty string). Defensive code in an owned codebase is just untested code.
