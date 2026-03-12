# Database Bandwidth Optimization

> **Priority:** P2
> **Status:** Blocked
> **Last Audited:** 2026-03-12
> **Blocker:** Convex dashboard metrics capture is still required for the final report.

## Remaining Work

- [ ] Review queries returning arrays of documents and apply field projection where callers only need a small subset of fields.
- [ ] Publish the before/after bandwidth report using Convex dashboard metrics.

## Guardrails

- Avoid `.collect()` or large `.take()` values for counts.
- Prefer index-backed query paths before adding in-memory filtering.
- Keep sidebar and navigation queries especially small.
