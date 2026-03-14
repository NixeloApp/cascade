# Nixelo Todo Portfolio

> **Last Updated:** 2026-03-14
> **Scope:** open work only

## Status After `62ffb8a`

- The validator-hardening and manual-memoization sweep is landed, and the validator-specific todo docs were pruned in that commit.
- The validator suite now passes `37/37` checks, and the remaining explicit validator debt is the test-coverage baseline.
- The top execution queue is now: validator exception burndown, screenshot-driven facelift, and E2E reliability.
- Slack org scoping stays active behind those tracks.
- Everything else still open is blocked on external setup, environment access, or product/infra decisions.

## Current Focus

1. [validator-exceptions-burndown.md](./validator-exceptions-burndown.md)
   - Burn down the remaining `93`-file test-coverage baseline.
2. [screenshot-facelift-overhaul.md](./screenshot-facelift-overhaul.md)
   - Use screenshot review to drive a broader visual facelift across the weakest product surfaces.
3. [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md)
   - Keep the full suite green while finishing deterministic waits, selector cleanup, and retry removal.
4. [slack-integration-issues.md](./slack-integration-issues.md)
   - Add organization-scoped Slack connection storage and destination lookup.

## Open Tracks

| Priority | File | State | Next Action |
|---|---|---|---|
| P0 | [validator-exceptions-burndown.md](./validator-exceptions-burndown.md) | Active | Burn down validator allowlists and the test-coverage baseline |
| P0 | [screenshot-facelift-overhaul.md](./screenshot-facelift-overhaul.md) | Active | Run a bigger screenshot-driven visual facelift pass |
| P1 | [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | Active | Finish deterministic E2E hardening |
| P1 | [slack-integration-issues.md](./slack-integration-issues.md) | Active | Scope Slack connections by organization |
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

1. Burn down [validator-exceptions-burndown.md](./validator-exceptions-burndown.md).
2. Run the first pass in [screenshot-facelift-overhaul.md](./screenshot-facelift-overhaul.md).
3. Keep [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) green while those changes land.
4. Fix [slack-integration-issues.md](./slack-integration-issues.md).
5. Close the near-finished blocked tracks as externals unblock.
6. Then move to public launch, enterprise, and uptime.
