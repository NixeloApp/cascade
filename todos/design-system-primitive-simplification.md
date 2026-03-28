# Design System Primitive Simplification

> **Priority:** P2
> **Status:** Paused pending validator overhaul
> **Last Updated:** 2026-03-28

## Remaining

- [ ] Re-triage the remaining raw-styling backlog after [`outcome-driven-validation-overhaul.md`](./outcome-driven-validation-overhaul.md) lands. Do not continue single-surface helper extraction just to reduce a baseline.
- [ ] Only land a remaining raw-styling slice if it also fixes a real UX inconsistency, deletes duplicated code across multiple call sites, or simplifies a shared API.
- [ ] Delete any remaining slice that cannot clear that bar instead of preserving it as “debt” forever.
- [ ] Re-evaluate whether the current `58 violations across 52 files` baseline represents real duplication/product problems or just validator residue.
- [ ] If the backlog still matters after re-triage, start with the smallest unresolved surfaces that actually improve shipped UI: `src/components/IssueDetailSheet.tsx`, `src/components/Onboarding/OnboardingChecklist.tsx`, and `src/components/Plate/SlashMenu.tsx`.

- [ ] Raw Tailwind violations at 0.
