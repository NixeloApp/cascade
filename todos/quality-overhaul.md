# Quality Overhaul

> **Priority:** P0 (Critical)
> **Effort:** Medium
> **Status:** ✅ Complete

---

## Summary

E2E test suite is now stable. Last 4+ CI runs passing all shards.

### What Was Fixed

- Force clicks replaced with retry patterns
- Hardcoded timeouts replaced with Playwright assertions
- CI environment variables properly configured for local Convex backend
- Invite test fixed to wait for table result instead of toast
- Query optimizations for `listSelectableIssues`

### Current State

- **27 E2E spec files** with ~182 tests
- **4 shards** running in parallel in CI
- All passing consistently

---

## Monitoring

If flakiness returns, check:
1. Race conditions (state not ready)
2. CI environment differences
3. Missing `expect().toPass()` patterns
4. Animations blocking assertions
