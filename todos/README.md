# Nixelo Todo Portfolio

> **Last Updated:** 2026-03-04  
> **Scope:** `todos/*.md` + `todos/jules/open/*.md`

Canonical control plane for all todo docs: what to do first, what is blocked externally, and what is already done.

## Portfolio Snapshot

- Total todo markdown files (including control files): `21`
- Tracked execution docs (excluding `README.md` and `TODO.md`): `19`
- Checkbox rollup across tracked docs: `156 done / 108 open / 1 in-progress`
- Highest-risk unresolved queue: calendar access control, invoice integrity, Slack auth/scoping

## Current Focus

1. P1 correctness/security defects:
   - [calendar-access-control.md](./calendar-access-control.md)
   - [invoice-system-issues.md](./invoice-system-issues.md)
   - [slack-integration-issues.md](./slack-integration-issues.md)
2. P2 correctness-at-scale defects:
   - [query-filter-ordering.md](./query-filter-ordering.md)
   - [security-and-migration.md](./security-and-migration.md)
   - [performance-issues.md](./performance-issues.md)
3. Near-complete blocked tracks (minimal remaining in-repo scope):
   - [bandwidth_optimization.md](./bandwidth_optimization.md) (`14/16`)
   - [multi-level-views.md](./multi-level-views.md) (`36/37`)
   - [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) (`20/21`)
   - [growth-features.md](./growth-features.md) (`16/18`)

## Active Todos

### Critical Defect Docs

| Priority | File | Problem Class | Next Action |
|---|---|---|---|
| P1 | [calendar-access-control.md](./calendar-access-control.md) | Cross-scope event injection risk | Gate scope derivation with `canAccessProject()` and add regression test |
| P1 | [invoice-system-issues.md](./invoice-system-issues.md) | Billing data integrity and numbering collisions | Fix unlinking, uniqueness, scoped fetch, and line-item linkage |
| P1 | [slack-integration-issues.md](./slack-integration-issues.md) | Cross-org leakage / caller-identity mismatch | Pass Slack caller identity end-to-end and enforce org scoping |
| P2 | [query-filter-ordering.md](./query-filter-ordering.md) | Result truncation from filter-after-limit | Move filtering into indexed query paths and add >limit tests |
| P2 | [security-and-migration.md](./security-and-migration.md) | Rate-limit bypass + partial migration completion | Re-key rate limiter and paginate/filter migration |
| P2 | [performance-issues.md](./performance-issues.md) | Incorrect counts and recomputation overhead | Fix project totals and memoize roadmap derivations |

### Execution Tracks (Implementation Plans)

| Priority | File | Progress | State | Main Blocker |
|---|---|---:|---|---|
| P0 | [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | `5/33` | Blocked | Need live PR CI evidence run |
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
| Slack app/dashboard actions | [feature-gaps.md](./feature-gaps.md), [slack-integration-issues.md](./slack-integration-issues.md) |
| CI evidence capture | [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) |
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
| [visual-inconsistencies-2026-03-04.md](./visual-inconsistencies-2026-03-04.md) | Screenshot audit baseline (176 captures) | Checklist complete on 2026-03-04 |
| [consistency-tracking.md](./consistency-tracking.md) | Standards/validator ledger | Operational tracking ongoing (`23/23` checklist complete) |

## Jules Issues (Open)

| File | Progress | State | Next Unblock |
|---|---:|---|---|
| [jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) | `0/3` | Blocked on upstream (`@boxyhq/saml-jackson` latest is still `1.52.2`) | Upgrade when upstream ships a non-vulnerable transitive path |

## Control Files

- [TODO.md](./TODO.md): quick links only (non-authoritative)
- [README.md](./README.md): authoritative portfolio view

## Suggested Execution Order

1. Fix all P1 defect docs first: calendar access, invoices, Slack integration.
2. Close P2 correctness docs next: query filtering, security/migration, performance.
3. Unblock and close near-complete tracks: bandwidth, multi-level views, OAuth monitoring, growth.
4. Then execute strategic tracks: public launch, enterprise, uptime.
