# Nixelo Todo Portfolio

> **Last Updated:** 2026-03-04  
> **Scope:** `todos/*.md` + `todos/jules/open/*.md`

This is the control-plane view of all todo docs: what is urgent, what is blocked, what is in flight, and what should be executed next.

## Portfolio Snapshot

- Total markdown todo files: `21`
- Checkbox progress across tracked plans: `156 done / 105 open`
- Highest-risk unresolved queue: calendar access control, invoicing integrity, Slack authorization path

## Immediate Engineering Queue (P1/P2 Defects)

These are direct correctness/security/data-integrity issues and should be prioritized before post-launch feature work.

| Priority | Area | File | Risk | Recommended Next Action |
|---|---|---|---|---|
| P1 | Calendar access control | [calendar-access-control.md](./calendar-access-control.md) | Cross-scope event injection via insufficient project access validation | Add `canAccessProject()` gate in scope resolver + regression test |
| P1 | Invoicing integrity | [invoice-system-issues.md](./invoice-system-issues.md) | Orphaned billed entries, duplicate numbering, incomplete entry selection | Fix deletion unlinking + numbering + scoped fetch + linkage persistence |
| P1 | Slack auth/scoping | [slack-integration-issues.md](./slack-integration-issues.md) | Cross-org leakage / privilege mismatch in slash/unfurl flows | Enforce caller identity and org-scoped Slack connection model |
| P2 | Query correctness at scale | [query-filter-ordering.md](./query-filter-ordering.md) | Silent truncation from filtering after `take(limit)` | Move filtering into indexed query path; add >limit dataset tests |
| P2 | Security + migration hygiene | [security-and-migration.md](./security-and-migration.md) | Rate-limit bypass pattern and partial migration risk | Re-key limiter by requester identity; paginate migration with cursor |
| P2 | Performance | [performance-issues.md](./performance-issues.md) | Incorrect counts and avoidable recomputation hot paths | Fix bounded count semantics + memoize roadmap derivations |

## Active Workstreams (Execution Plans)

| Track | File | Progress | Current State | Main Blocker | Next Unblock |
|---|---|---:|---|---|---|
| E2E reliability | [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | 5/33 | Core hardening done, reliability closure pending | Need live PR CI run/history-derived summary | Run full CI on fresh PR, then close remaining flaky buckets |
| Bandwidth optimization | [bandwidth_optimization.md](./bandwidth_optimization.md) | 14/16 | Major query/payload work complete | Missing Convex dashboard metrics capture | Capture before/after metrics and publish final report |
| Multi-level views | [multi-level-views.md](./multi-level-views.md) | 36/37 | Feature work mostly complete | External install/DNS for final dependency graph validation | Re-run install + dependency graph validation after DNS recovery |
| OAuth monitoring finalization | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | 20/21 | Product-side controls mostly complete | Monitoring destination decision (DataDog/Grafana) | Decide destination and wire production sinks |
| Feature gaps | [feature-gaps.md](./feature-gaps.md) | 16/21 | Comments/attachments implemented; Slack phases partially open | Slack dashboard registration and secrets | Complete Slack app setup and finalize slash/unfurl paths |
| Emoji overhaul | [emoji-overhaul.md](./emoji-overhaul.md) | 10/16 | Component/audit work done | Manual WCAG/screen-reader pass pending | Run accessibility checklist and close compliance gap |
| Public launch | [public-launch.md](./public-launch.md) | 1/13 | Mostly planning stage | External launch ops/channels | Convert launch checklist into dated GTM runbook |
| Growth features | [growth-features.md](./growth-features.md) | 16/18 | Most internal implementation complete | Outlook app setup prerequisites | Complete Microsoft app registration/scopes/tenant config |
| Enterprise features | [enterprise.md](./enterprise.md) | 6/22 | Foundation tasks underway | Billing + IdP + infra prerequisites | Finalize dependency decisions and split MVP vs post-MVP |
| Uptime monitoring | [uptime-monitoring.md](./uptime-monitoring.md) | 0/32 | Planning/spec stage | Architecture/infrastructure decisions not made | Decide runner/check architecture and incident model first |
| Dependency vulnerability | [jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) | 0/3 | Upstream-blocked (no patched version) | Upstream release | Monitor `@boxyhq/saml-jackson` releases for patched version |

## Operational Baselines

| File | Role | Status |
|---|---|---|
| [consistency-tracking.md](./consistency-tracking.md) | Validator/standards debt ledger and rollout history | Ongoing operational tracking |
| [visual-inconsistencies-2026-03-04.md](./visual-inconsistencies-2026-03-04.md) | Screenshot-based visual audit baseline (176 captures) | All checklist items completed on 2026-03-04 |
| [TODO.md](./TODO.md) | Legacy quick-link stub | Kept for compatibility; not authoritative |

## Cross-Track Blocker Matrix

| Blocker Type | Affected Tracks | Practical Unblock Owner |
|---|---|---|
| Upstream dependency releases | Dependency vulnerability | Upstream maintainers |
| Slack app/dashboard setup | Feature gaps, Slack integration defects | Integrations owner |
| Monitoring destination decision | OAuth monitoring finalization | Platform/ops owner |
| External launch operations | Public launch | Product marketing + community |
| Microsoft app prerequisites | Growth features | Integrations owner |
| Billing/IdP/tooling procurement | Enterprise | Product + platform leadership |
| Manual accessibility QA bandwidth | Emoji overhaul | Design/QA |
| CI evidence capture | E2E reliability overhaul | QA/CI owner |

## Suggested Execution Order

1. Close P1 correctness/security docs first: calendar, invoice, Slack integration.
2. Resolve P2 data-quality/perf docs: query filter ordering, security+migration, performance.
3. Unblock and close near-finished tracks with low remaining scope: bandwidth, multi-level views, OAuth monitoring, growth.
4. Then tackle strategic/post-launch tracks: public-launch, enterprise, uptime.
