# Refactor Journal

This journal tracks critical learnings and major refactoring decisions.

## 2026-02-20 - Initial Setup
- Created refactor journal.
- Refactored `convex/users.ts` to consolidate parallel project counting logic into `countByProjectParallel` helper.
- Learned: When extracting helpers for "fast path" optimizations, ensure that clamping logic (e.g. `Math.min`) is applied at the appropriate level (per-project vs global) to preserve exact behavior.
