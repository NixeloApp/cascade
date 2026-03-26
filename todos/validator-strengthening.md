# Validator Strengthening

> **Priority:** P1
> **Status:** Ongoing improvement
> **Last Updated:** 2026-03-25

## Remaining

### Potential New Validators

- [ ] Detect raw `Date.now()` usage in Convex mutations where server timestamps should be used more intentionally.
- [ ] Tighten unbounded `.collect()` detection so safe bulk-processing exceptions stay explicit and normal query code gets less regex-driven allowance.
- [ ] Cross-check route definitions against shared route config to catch drift.
