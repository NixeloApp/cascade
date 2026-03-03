# Nixelo Todos

> **Last Updated:** 2026-03-02

---

## Active (Blocked)

| # | File | Blocker |
|---|------|---------|
| 01 | [e2e-reliability-overhaul.md](./e2e-reliability-overhaul.md) | Live PR CI run for `history-derived` summary |
| 04 | [jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) | Registry DNS (`EAI_AGAIN`) |
| 06 | [multi-level-views.md](./multi-level-views.md) | `@xyflow/react` install (DNS) |
| 07 | [bandwidth_optimization.md](./bandwidth_optimization.md) | Convex dashboard metrics capture |
| 08 | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | DataDog/Grafana destination |
| 09 | [feature-gaps.md](./feature-gaps.md) | Slack dashboard registration |
| 14 | [emoji-overhaul.md](./emoji-overhaul.md) | Manual WCAG accessibility QA |
| 16 | [public-launch.md](./public-launch.md) | External launch operations |
| 17 | [growth-features.md](./growth-features.md) | Outlook Calendar prereqs |
| 18 | [enterprise.md](./enterprise.md) | Billing/IdP/tooling prereqs |
| 19 | [uptime-monitoring.md](./uptime-monitoring.md) | Architecture/infra decisions |

---

## Operational

| File | Notes |
|------|-------|
| [consistency-tracking.md](./consistency-tracking.md) | 41 strict errors; monthly snapshot |

---

## External Blockers

| Category | Todos | Unblock Action |
|----------|-------|----------------|
| Registry DNS | lodash, multi-level-views | Wait for `registry.npmjs.org` |
| Slack Dashboard | feature-gaps | OAuth app, `/nixelo`, URL patterns, secrets |
| Convex Metrics | bandwidth_optimization | Capture before/after |
| Monitoring | oauth-monitoring | DataDog/Grafana + credentials |
| Launch Ops | public-launch | Discussions/Discord, channel posts |
| Microsoft | growth-features | App registration, scopes, tenant |
| Enterprise | enterprise | Billing, IdP, visual-regression |
| Infra/Arch | uptime-monitoring | Runner, status-page, alerts |
| Manual QA | emoji-overhaul | WCAG contrast, screen-reader |
| Live CI | e2e-reliability | PR CI run with Actions history |
