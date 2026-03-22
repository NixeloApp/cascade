# Validator Strengthening

> **Priority:** P3
> **Status:** Ongoing improvement

## Current State

53/53 validators pass. Backend query debt: 0. All post-fetch JS filters resolved.

Key improvements shipped:
- Per-token structural allowlist (not per-attribute)
- Case-insensitive const-string detection
- Compound indexes for export queries
- Compliance truncation flag

## Remaining Improvement Ideas

### Validator Suite Structure

- [ ] Extract shared ratchet/baseline/reporting patterns into a common validator framework
- [ ] Make blocking vs informational checks structurally obvious
- [ ] Document validator authoring conventions

### Potential New Validators

- [ ] Detect raw `Date.now()` in Convex mutations (should use server timestamps)
- [ ] Detect unbounded `.collect()` without `.take()` limit
- [ ] Cross-reference route definitions against ROUTES config for drift
