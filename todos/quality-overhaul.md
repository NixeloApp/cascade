# Quality Overhaul

> **Priority:** P0 (Critical)
> **Effort:** Medium
> **Status:** In Progress

---

## Flaky E2E Tests

These tests fail intermittently in CI. Each needs investigation and fix:

### Authentication Tests
- [ ] `auth-comprehensive.spec.ts:15` - Sign in form elements not found
- [ ] `auth.spec.ts:126` - Sign up verification email flow timing

### Dashboard & Navigation
- [ ] `integration-workflow.spec.ts:113` - Dashboard shows issues assertion fails
- [ ] `teams.spec.ts:28` - Navigate to teams list timing issue

### Permissions & Invites
- [ ] `invite.spec.ts:33` - Invalid invite page detection
- [ ] `invites.spec.ts:26` - Admin send/revoke invites race condition
- [ ] `permission-cascade.spec.ts:46` - Org owner create workspaces

### Features
- [ ] `analytics.spec.ts:25` - "Completed Sprints" strict mode violation (2 elements)
- [ ] `analytics.spec.ts:69` - Chart sections rendering
- [ ] `activity-feed.spec.ts:26` - Empty state detection
- [ ] `search.spec.ts:70` - No results found timing

---

## Investigation Approach

For each flaky test:
1. Run locally 10+ times to reproduce
2. Check for race conditions (state not ready, animations)
3. Replace hardcoded waits with proper assertions
4. Use `expect().toPass()` for retry patterns
5. Verify CI environment differences

---

## Related Files

- `e2e/` - All E2E test files
- `e2e/pages/` - Page object models
- `scripts/validate/check-e2e-quality.js` - E2E validator
