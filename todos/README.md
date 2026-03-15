# Nixelo Todo Portfolio

> **Last Updated:** 2026-03-15
> **Scope:** open work only

## Current Status

- **41/41** validators pass.
- **Vendor bundle:** 722KB → 337KB gzip (53% reduction).
- **E2E suite:** zero `waitForTimeout`, zero `networkidle`, zero brittle selectors.
- **Validator baselines:** border-radius 50→10, nested cards 73→7, test coverage 49→16.
- **New UI components:** `Dot`, `IconCircle`, Typography `variant="strong"`, Alert `radius`, Button `chromeSize="sectionToggle"`.
- **Search inputs consolidated:** `Input variant="search/filter"` includes icons automatically.
- **3 routes lazy-loaded:** Calendar, Roadmap, ProjectSettings.

## Open Tracks

| Priority | File | State | Next Action |
|---|---|---|---|
| P0 | [screenshot-facelift-overhaul.md](./screenshot-facelift-overhaul.md) | Active | Run screenshot-driven visual facelift (needs running app) |
| P1 | [slack-integration-issues.md](./slack-integration-issues.md) | Blocked | Scope Slack connections by organization (needs external access) |
| P2 | [validator-exceptions-burndown.md](./validator-exceptions-burndown.md) | Maintenance | 16 test coverage, 10 border-radius, 7 nested cards remain |
| P2 | [bundle-optimization.md](./bundle-optimization.md) | Maintenance | App chunk 388KB, diminishing returns |
| P2 | [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | Maintenance | Core work done, monitor for regressions |
| P2 | [bandwidth_optimization.md](./bandwidth_optimization.md) | Blocked | Finish field-projection audit |
| P2 | [feature-gaps.md](./feature-gaps.md) | Blocked | Complete external Slack dashboard setup |
| P2 | [emoji-overhaul.md](./emoji-overhaul.md) | Blocked | Finish manual accessibility QA |
| P2 | [multi-level-views.md](./multi-level-views.md) | Blocked | Package/DNS unblock for `@xyflow/react` |
| P2 | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | Blocked | Choose monitoring destination |
| P3 | [public-launch.md](./public-launch.md) | Blocked | Launch ops and community setup |
| P3 | [uptime-monitoring.md](./uptime-monitoring.md) | Blocked | Architecture decisions |
| P3 | Tech debt items (5 files) | Backlog | Automation notifications, billing export, image upload, link insertion, project creation UI |
| P4 | [growth-features.md](./growth-features.md) | Blocked | Outlook integration |
| P4 | [enterprise.md](./enterprise.md) | Blocked | Billing and IdP decisions |

## Completed This Session

- [x] [query-filter-ordering.md](./query-filter-ordering.md) — all query shape issues resolved
- [x] Bundle vendor split (10 chunks, 53% reduction)
- [x] E2E reliability (zero anti-patterns)
- [x] Validator baselines (border-radius 80%, nested cards 90%, inline strong 91%)
- [x] Test coverage (67% baseline reduction)
- [x] Search input consolidation
- [x] Dynamic workflow state filters
- [x] Husky hooks: validate+tests moved to pre-commit

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

## Open Jules Issue

- [jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md)

## What's Left

The only actionable P0 is **screenshot facelift** which requires a running dev server. Everything else is either blocked on external access or at diminishing returns. The tech debt items (P3) are next in line when higher-priority blocked items unblock.
