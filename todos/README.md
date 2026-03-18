# Nixelo Todo Portfolio

> **Last Updated:** 2026-03-18

## Health

| Metric | Value |
|--------|-------|
| Validators | 44/44 pass |
| Tests | 250 files, 1966 tests |
| Bundle | 337KB gzip |
| Screenshots | 300+ across 4 viewport/theme combos, 0 uncovered routes |
| Raw TW baseline | 148 files (run `node scripts/validate/check-raw-tailwind.js --audit` to check) |

---

## What to work on next

### Actionable now (no external blockers)

| Priority | File | What | Open items |
|----------|------|------|------------|
| P2 | [cal-com-features.md](./cal-com-features.md) | Port features from Cal.com v6.3 | 8 items: AI agents, OOO status, cancellation reasons, workflow translation, custom domain/SMTP, branding |
| P2 | [plane-features.md](./plane-features.md) | Port features from Plane | 12 items: Gantt chart, intake/triage, deploy boards, stickies, analytics, auto-archive, multi-provider AI, page versions |
| P3 | [tech-debt-billing-export.md](./tech-debt-billing-export.md) | PDF export for billing reports | 1 item: needs jsPDF or server-side generation |

### Blocked (needs human action first)

| Priority | File | What | Blocker | To unblock |
|----------|------|------|---------|------------|
| P1 | [slack-integration-issues.md](./slack-integration-issues.md) | Org-scoped Slack connections leak across orgs | Slack API dashboard | Create Slack OAuth app, register commands |
| P1 | [multi-level-views.md](./multi-level-views.md) | Cross-team dependency graph | Package install | Install `@xyflow/react` |
| P2 | [feature-gaps.md](./feature-gaps.md) | Slack slash commands + URL unfurl | Slack dashboard | Register `/nixelo` command, unfurl patterns, provision env vars |
| P2 | [emoji-overhaul.md](./emoji-overhaul.md) | Accessibility QA for icon changes | Manual testing | Screen reader + WCAG contrast testing |
| P2 | [oauth-monitoring-finalization.md](./oauth-monitoring-finalization.md) | Ship OAuth health metrics | Monitoring destination | Pick DataDog/Grafana/etc, provision credentials |
| P3 | [public-launch.md](./public-launch.md) | Launch on HN, Reddit, PH | Content + ops | Record demo, write blog post, set up Discord |
| P3 | [uptime-monitoring.md](./uptime-monitoring.md) | Status pages + monitoring | Architecture | Decide check runner model, domain strategy, alerting policy |
| P4 | [growth-features.md](./growth-features.md) | Outlook Calendar integration | Microsoft Entra | App registration, calendar scopes, redirect URIs |
| P4 | [enterprise.md](./enterprise.md) | Stripe billing, SSO (Google/MS/Okta/SAML) | Billing + IdP decisions | Define enterprise wedge, pick billing approach |

### Done (archive when ready)

| File | Status |
|------|--------|
| [screenshot-facelift-overhaul.md](./screenshot-facelift-overhaul.md) | **Complete** — all visual polish done (PR #899). Residual: screenshot coverage for modals/interactive states, raw TW baseline. |

---

## Biggest feature gaps vs competitors

Based on Cal.com v6.3 and Plane preview (both repos updated 2026-03-18):

| Feature | Cal.com | Plane | Nixelo | Impact |
|---------|---------|-------|--------|--------|
| **Gantt chart** | — | ✅ Full | ❌ Simple roadmap only | High — standard PM expectation |
| **OOO status** | ✅ Full API | — | ❌ Missing | High — affects calendar, assignments, notifications |
| **Org analytics** | — | ✅ Trends, insights | ✅ Metrics + charts | ~~High~~ Done |
| **AI agents** | ✅ Multi-channel | — | ❌ MCP placeholder | Medium — differentiator |
| **Intake/triage** | — | ✅ Full system | ❌ Skeleton inbox | Medium — external request capture |
| **Auto-archive** | — | ✅ Scheduled | ❌ Basic automation | Medium — reduces clutter |
| **Deploy boards** | — | ✅ Per-entity | ⚠️ Token portal | Medium — public sharing |
| **Multi-provider AI** | — | ✅ Admin config | ❌ Single provider | Low — flexibility |
| **Page versions** | — | ✅ Restore UI | ⚠️ Component exists | Low — may already work |
| **Custom domain** | ✅ Waitlist | — | ❌ Missing | Low — enterprise only |
| **Workflow translation** | ✅ lingo.dev | — | ❌ English only | Low — i18n |

---

## Maintenance

- **Raw tailwind baseline:** 148 files with violations. Gradually shrinks as components are touched.
- **Jules:** [lodash vulnerability](./jules/open/jules-librarian-2026-02-23-lodash-vulnerability.md) — open issue.

## Reference repos

| Repo | Path | Last pulled |
|------|------|-------------|
| Cal.com | `/Desktop/cal.com` | 2026-03-18 |
| Plane | `/Desktop/plane` | 2026-03-18 |
