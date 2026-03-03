# Nixelo Todos

Central index for active roadmap and issue todos.

> **Last Updated:** 2026-03-02

---

## Active (Blocked)

| # | File | Status | Blocker |
|---|------|--------|---------|
| 01 | [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | Blocked | Live PR CI run for `history-derived` summary validation |
| 04 | [jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) | Blocked | Registry DNS (`EAI_AGAIN`) prevents upgrade |
| 06 | [multi-level-views.md](./multi-level-views.md) | Blocked | `@xyflow/react` install blocked (DNS) |
| 07 | [bandwidth_optimization.md](./bandwidth_optimization.md) | Blocked | External Convex dashboard metrics capture |
| 08 | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | Blocked | DataDog/Grafana destination selection |
| 09 | [feature-gaps.md](./feature-gaps.md) | Blocked | Slack dashboard registration pending |
| 14 | [emoji-overhaul.md](./emoji-overhaul.md) | Blocked | Manual WCAG accessibility QA |
| 16 | [public-launch.md](./public-launch.md) | Blocked | External launch operations |
| 17 | [growth-features.md](./growth-features.md) | Blocked | Outlook Calendar integration prereqs |
| 18 | [enterprise.md](./enterprise.md) | Blocked | Billing/IdP/tooling prereqs |
| 19 | [uptime-monitoring.md](./uptime-monitoring.md) | Blocked | Architecture/infra decisions |

---

## Operational Tracking

| File | Status | Notes |
|------|--------|-------|
| [consistency-tracking.md](./consistency-tracking.md) | Active | 41 strict errors remain; monthly snapshot cadence |

---

## Archived (Complete)

| File | Resolution |
|------|------------|
| [archive/agency-mvp.md](./archive/agency-mvp.md) | MVP scope complete |
| [archive/rich-text-description-followup.md](./archive/rich-text-description-followup.md) | Plain-text extraction shipped |
| [archive/sidebar-display-limits.md](./archive/sidebar-display-limits.md) | Search + show-all affordances done |
| [archive/memoization-cleanup.md](./archive/memoization-cleanup.md) | Baseline optimized (96 → 30) |

---

## Jules Issues

### Closed

| File | Resolution |
|------|------------|
| [jules/closed/jules-sentinel-2026-02-26-issue-search-security.md](./jules/closed/jules-sentinel-2026-02-26-issue-search-security.md) | Access-scoped search enforcement |
| [jules/closed/jules-scribe-2024-05-22-fix-cascade-delete-limit.md](./jules/closed/jules-scribe-2024-05-22-fix-cascade-delete-limit.md) | Fanout-safe cascade traversal |
| [jules/closed/jules-spectra-2025-02-24-deduplicate-hashapikey.md](./jules/closed/jules-spectra-2025-02-24-deduplicate-hashapikey.md) | Tests reuse production helper |

### Open

| File | Blocker |
|------|---------|
| [jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) | Registry DNS outage |

---

## External Blockers Summary

| Category | Todos Affected | Unblock Action |
|----------|----------------|----------------|
| **Registry DNS** | lodash, multi-level-views | Wait for `registry.npmjs.org` connectivity |
| **Slack Dashboard** | feature-gaps | Create OAuth app, register `/nixelo`, URL patterns, provision secrets |
| **Convex Metrics** | bandwidth_optimization | Capture before/after from dashboard |
| **Monitoring Dest** | oauth-monitoring | Select DataDog/Grafana + credentials |
| **Launch Ops** | public-launch | Discussions/Discord setup, channel posting |
| **Microsoft** | growth-features | App registration, scopes, test tenant |
| **Enterprise** | enterprise | Billing provider, IdP tenant, visual-regression tooling |
| **Infra/Arch** | uptime-monitoring | Runner model, status-page routing, alert policy |
| **Manual QA** | emoji-overhaul | WCAG contrast + screen-reader verification |
| **Live CI** | e2e-reliability | One successful PR CI run with Actions history |

---

## Codex Review Items (PR #873)

| File | Severity | Issue | Status |
|------|----------|-------|--------|
| `convex/workspaces.ts:233-236` | P2 | Ignore soft-deleted teams in workspace deletion check | ✅ Fixed |
