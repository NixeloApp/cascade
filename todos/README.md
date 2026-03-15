# Nixelo Todo Portfolio

> **Last Updated:** 2026-03-15
> **Scope:** open work only

## Current Status

- **41/41** validators pass. **519** test files, **4100** tests passing.
- **Vendor bundle:** 337KB gzip (was 722KB). 10 cached chunks. 3 lazy-loaded routes.
- **E2E suite:** zero anti-patterns remaining.
- **Test coverage baseline:** 2 files remain (was 49).
- **All tech debt items closed.**

## Open Tracks

| Priority | File | State | Next Action |
|---|---|---|---|
| P0 | [screenshot-facelift-overhaul.md](./screenshot-facelift-overhaul.md) | Active | Visual facelift (needs running app) |
| P1 | [slack-integration-issues.md](./slack-integration-issues.md) | Blocked | Org-scoped Slack connections (needs external access) |
| P2 | [tech-debt-billing-export.md](./tech-debt-billing-export.md) | Partial | CSV done, PDF export deferred |
| P2 | [bandwidth_optimization.md](./bandwidth_optimization.md) | Blocked | Field-projection audit |
| P2 | [feature-gaps.md](./feature-gaps.md) | Blocked | Slack dashboard setup |
| P2 | [emoji-overhaul.md](./emoji-overhaul.md) | Blocked | Accessibility QA |
| P2 | [multi-level-views.md](./multi-level-views.md) | Blocked | `@xyflow/react` package |
| P2 | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | Blocked | Monitoring destination |
| P3 | [public-launch.md](./public-launch.md) | Blocked | Launch ops |
| P3 | [uptime-monitoring.md](./uptime-monitoring.md) | Blocked | Architecture decisions |
| P4 | [growth-features.md](./growth-features.md) | Blocked | Outlook integration |
| P4 | [enterprise.md](./enterprise.md) | Blocked | Billing/IdP decisions |

## External Blockers

| Blocker | Affected Files |
|---|---|
| Slack app/dashboard | [feature-gaps.md](./feature-gaps.md) |
| Monitoring destination | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) |
| Convex dashboard metrics | [bandwidth_optimization.md](./bandwidth_optimization.md) |
| Accessibility QA | [emoji-overhaul.md](./emoji-overhaul.md) |
| `@xyflow/react` package | [multi-level-views.md](./multi-level-views.md) |
| Outlook app setup | [growth-features.md](./growth-features.md) |
| Billing/IdP decisions | [enterprise.md](./enterprise.md), [uptime-monitoring.md](./uptime-monitoring.md) |
| Launch ops | [public-launch.md](./public-launch.md) |

## Open Jules Issue

- [jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md)
