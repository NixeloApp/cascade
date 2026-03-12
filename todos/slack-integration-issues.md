# Slack Integration Issues

> **Priority:** P1
> **Status:** Active
> **Last Updated:** 2026-03-12
> **Verification Summary:** `1` verified unresolved issue remains.

## Remaining Issue

### Scope Slack connections to organization context

**File:** `convex/slack.ts`

`connectSlack` still stores one active connection per user via `by_user`, and project notification lookup still resolves Slack destinations per user without an organization key. A user connected in org A can still bleed Slack delivery context into org B.

**Fix:** Add organization-scoped connection storage and lookup and use that scope when resolving Slack delivery destinations.
