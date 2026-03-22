# Tailwind-to-CVA Consolidation

> **Priority:** P3
> **Status:** Ongoing maintenance

## Current State

102 files / 261 violations baselined (was 148 / 436). Validator catches new violations via ratchet.

## Styling Contract

- Tailwind-first for static feature/page layout
- `cva()` for shared primitive/component semantics only
- If a pattern repeats, extract a component; if not, keep it raw Tailwind
- Do not create local style objects or class-string hiding

## Top Violation Files

| File | Count |
|------|-------|
| RoadmapView.tsx | 27 |
| AppSidebar.tsx | 9 |
| FilterBar.tsx | 7 |
| InboxList.tsx | 7 |
| SprintManager.tsx | 7 |

## How to Fix

Violations are padding/margin utilities (`px-3`, `py-2`, `mb-1`, `mt-2`). Each fix requires visual verification since spacing changes affect layout. Run `pnpm screenshots` before and after to verify.
