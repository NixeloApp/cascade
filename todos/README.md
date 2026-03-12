# Nixelo Todo Portfolio

> **Last Updated:** 2026-03-12
> **Scope:** open work only

## Current Focus

1. [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md)
   - Keep the full suite green while finishing deterministic waits, selector cleanup, and retry removal.
2. [slack-integration-issues.md](./slack-integration-issues.md)
   - Add organization-scoped Slack connection storage and destination lookup.
3. [query-filter-ordering.md](./query-filter-ordering.md)
   - Fix the remaining filter-after-limit query paths and add over-limit coverage.

## Open Tracks

| Priority | File | State | Next Action |
|---|---|---|---|
| P0 | [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | Active | Finish deterministic E2E hardening |
| P1 | [slack-integration-issues.md](./slack-integration-issues.md) | Active | Scope Slack connections by organization |
| P2 | [query-filter-ordering.md](./query-filter-ordering.md) | Queued | Fix remaining query-shape bugs |
| P2 | [bandwidth_optimization.md](./bandwidth_optimization.md) | Blocked | Finish field-projection audit and publish metrics report |
| P2 | [feature-gaps.md](./feature-gaps.md) | Blocked | Complete external Slack dashboard setup |
| P2 | [emoji-overhaul.md](./emoji-overhaul.md) | Blocked | Finish manual accessibility QA |
| P2 | [multi-level-views.md](./multi-level-views.md) | Blocked | Add dependency visualization after package/DNS unblock |
| P2 | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | Blocked | Choose monitoring destination and wire push path |
| P3 | [public-launch.md](./public-launch.md) | Blocked | Execute launch ops and community setup |
| P3 | [uptime-monitoring.md](./uptime-monitoring.md) | Blocked | Decide runner/routing architecture and start MVP |
| P4 | [growth-features.md](./growth-features.md) | Blocked | Set up Outlook integration and prioritize next enhancement |
| P4 | [enterprise.md](./enterprise.md) | Blocked | Resolve billing and IdP decisions, then implement wedge |

## External Blockers

| Blocker | Affected Files |
|---|---|
| Slack app/dashboard actions | [feature-gaps.md](./feature-gaps.md) |
| Monitoring destination decision | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) |
| Convex dashboard metric capture | [bandwidth_optimization.md](./bandwidth_optimization.md) |
| Accessibility QA capacity | [emoji-overhaul.md](./emoji-overhaul.md) |
| Package install or DNS unblock for `@xyflow/react` | [multi-level-views.md](./multi-level-views.md) |
| Outlook app setup | [growth-features.md](./growth-features.md) |
| Billing, IdP, and architecture decisions | [enterprise.md](./enterprise.md), [uptime-monitoring.md](./uptime-monitoring.md) |
| Launch ops channels and community setup | [public-launch.md](./public-launch.md) |
| Upstream dependency release | [jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) |

## Open Jules Issue

- [jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md)

## Suggested Execution Order

1. Keep [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) green.
2. Fix [slack-integration-issues.md](./slack-integration-issues.md).
3. Fix [query-filter-ordering.md](./query-filter-ordering.md).
4. Close the near-finished blocked tracks as externals unblock.
5. Then move to public launch, enterprise, and uptime.
