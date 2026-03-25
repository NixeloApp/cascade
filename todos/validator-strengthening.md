# Validator Strengthening

> **Priority:** P3
> **Status:** Ongoing improvement
> **Last Updated:** 2026-03-24

Current baseline: 53/53 validators pass.

## Remaining

### Validator Framework

- [ ] Extract shared ratchet, baseline, and reporting patterns into a clearer common validator framework.
- [ ] Make blocking vs informational checks structurally obvious.
- [ ] Document validator authoring conventions for future additions.

### Potential New Validators

- [ ] Detect raw `Date.now()` usage in Convex mutations where server timestamps should be used more intentionally.
- [ ] Detect unbounded `.collect()` usage when `.take()` or pagination should be required.
- [ ] Cross-check route definitions against shared route config to catch drift.
