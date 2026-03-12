# Nixelo Todo Portfolio

> **Last Updated:** 2026-03-12
> **Scope:** `todos/*.md` + `todos/jules/open/*.md`

Canonical control plane for all todo docs: what to do first, what is blocked externally, and what is already done.

## Portfolio Snapshot

- Total todo markdown files (including control files): `22`
- Tracked execution docs (excluding `README.md` and `TODO.md`): `20`
- Checkbox rollup across tracked docs: tracked within each doc; see individual files for per-track progress
- Highest-risk unresolved queue: screenshot baseline trust, Slack org scoping, query filter-after-limit paths, external unblock decisions

## Current Focus

1. Active screenshot and visual-baseline loop:
   - [e2e-screenshot-quality.md](./e2e-screenshot-quality.md) as the canonical screenshot determinism + visual review execution doc
   - design-cohesion foundation is complete; remaining visual follow-through now runs through screenshot review and shared-surface polish
   - keep route-specific readiness contracts expanding past the core project subroutes and shared mobile/filter chrome polish moving together so the spec folders stay trustworthy
2. P1 correctness/security defects:
   - [slack-integration-issues.md](./slack-integration-issues.md)
3. E2E and screenshot sustainment:
   - [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md)
   - keep the full Playwright suite green while visual work continues
   - keep screenshot capture deterministic as modal/shell visuals change
4. P2 correctness-at-scale defects:
   - [query-filter-ordering.md](./query-filter-ordering.md)
5. Near-complete blocked tracks (minimal remaining in-repo scope):
   - [bandwidth_optimization.md](./bandwidth_optimization.md) (`14/16`)
   - [multi-level-views.md](./multi-level-views.md) (`36/37`)
   - [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) (`20/21`)
   - [growth-features.md](./growth-features.md) (`16/18`)

## Active Todos

### Immediate Execution

| Priority | File | Role | Next Action |
|---|---|---|---|
| P0 | [e2e-screenshot-quality.md](./e2e-screenshot-quality.md) | Screenshot determinism + visual review control plane | Keep extending explicit route readiness beyond the covered core project flows and continue shared mobile/filter chrome follow-through on top of a clean full screenshot matrix |
| P0 | [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | Reliability sustainment while UI churn continues | Keep full suite green and keep replacing retry-heavy helpers with explicit completion contracts |
| P1 | [slack-integration-issues.md](./slack-integration-issues.md) | Remaining Slack multi-org delivery isolation defect | Add organization-scoped Slack connection storage and destination lookup |

### Correctness Queue

| Priority | File | Problem Class | Next Action |
|---|---|---|---|
| P2 | [query-filter-ordering.md](./query-filter-ordering.md) | Result truncation from filter-after-limit | Fix remaining workspace/org/invoice query paths and add >limit tests |

### Blocked Or Deferred Tracks

| Priority | File | Progress | State | Main Blocker |
|---|---|---:|---|---|
| P1 | [multi-level-views.md](./multi-level-views.md) | `36/37` | Blocked | External package install/DNS for final validation |
| P2 | [feature-gaps.md](./feature-gaps.md) | `16/21` | Blocked | Slack dashboard setup/registration |
| P2 | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | `20/21` | Blocked | Monitoring destination decision |
| P2 | [bandwidth_optimization.md](./bandwidth_optimization.md) | `14/16` | Blocked | Manual Convex dashboard metrics capture |
| P2 | [emoji-overhaul.md](./emoji-overhaul.md) | `10/16` | Blocked | Manual accessibility QA |
| P3 | [public-launch.md](./public-launch.md) | `1/13` | Blocked | External launch operations |
| P3 | [uptime-monitoring.md](./uptime-monitoring.md) | `0/32` | Blocked | Architecture and infra decisions not finalized |
| P4 | [growth-features.md](./growth-features.md) | `16/18` | Blocked | Outlook integration prerequisites |
| P4 | [enterprise.md](./enterprise.md) | `6/22` | Blocked | Billing/IdP/infrastructure dependencies |

## Blocked By External Dependencies

| Blocker | Affected Files |
|---|---|
| Slack app/dashboard actions | [feature-gaps.md](./feature-gaps.md) |
| Monitoring destination decision | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) |
| Convex dashboard metric capture | [bandwidth_optimization.md](./bandwidth_optimization.md) |
| Accessibility QA capacity | [emoji-overhaul.md](./emoji-overhaul.md) |
| Outlook app setup | [growth-features.md](./growth-features.md) |
| Enterprise procurement/decisions | [enterprise.md](./enterprise.md), [uptime-monitoring.md](./uptime-monitoring.md) |
| Launch ops channels | [public-launch.md](./public-launch.md) |
| Upstream dependency release | [jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) |

## Completed Baselines

| File | Role | State |
|---|---|---|
| [calendar-access-control.md](./calendar-access-control.md) | Calendar scope access-control guard | Complete (verified fixed in `convex/calendarEvents.ts`) |
| [design-cohesion-overhaul.md](./design-cohesion-overhaul.md) | Visual-system foundation and validator-boundary overhaul | Complete (`12/12` checklist complete; follow-through continues in screenshot-quality loop) |
| [invoice-system-issues.md](./invoice-system-issues.md) | Invoice integrity defect set | Complete (verified fixed in `convex/invoices.ts` and invoice editor route) |
| [performance-issues.md](./performance-issues.md) | Project totals and roadmap render performance | Complete (verified fixed in `convex/lib/projectIssueStats.ts` and `src/components/RoadmapView.tsx`) |
| [security-and-migration.md](./security-and-migration.md) | Portal rate-limit hardening and legacy icon migration cleanup | Complete (verified fixed in `convex/clientPortal.ts` / `convex/documentTemplates.ts`) |
| [consistency-tracking.md](./consistency-tracking.md) | Standards/validator ledger | Operational tracking ongoing (`23/23` checklist complete) |

## Jules Issues (Open)

| File | Progress | State | Next Unblock |
|---|---:|---|---|
| [jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) | `0/3` | Blocked on upstream (`@boxyhq/saml-jackson` latest is still `1.52.2`) | Upgrade when upstream ships a non-vulnerable transitive path |

## Control Files

- [TODO.md](./TODO.md): quick links only (non-authoritative)
- [README.md](./README.md): authoritative portfolio view

## Suggested Execution Order

1. Keep screenshot capture deterministic in [e2e-screenshot-quality.md](./e2e-screenshot-quality.md) so the baseline stays trustworthy while visual follow-through continues.
2. While visual work continues, keep the full E2E/screenshot path green via [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md).
3. Then fix the remaining P1 defect doc: Slack organization-scoped delivery isolation.
4. Close the remaining P2 correctness doc: query filtering/order-of-operations.
5. Unblock and close near-complete tracks: bandwidth, multi-level views, OAuth monitoring, growth.
6. Then execute strategic tracks: public launch, enterprise, uptime.
