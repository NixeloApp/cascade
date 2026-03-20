# Nixelo Todo — MVP

> **Last Updated:** 2026-03-19

## Health

| Metric | Value |
|--------|-------|
| Validators | 44/44 pass |
| Bundle | 337KB gzip |
| Screenshots | 300+ across 4 viewport/theme combos, 0 uncovered routes |
| Raw TW baseline | 148 files (run `node scripts/validate/check-raw-tailwind.js --audit` to check) |

---

## What to work on next

| Priority | File | What | Open items |
|----------|------|------|------------|
| P1 | [meeting-intelligence.md](./meeting-intelligence.md) | Turn the shipped Meetings workspace into a full meeting-intelligence workflow | Remaining items: meeting-to-doc, document-editor reliability, capture strategy, OSS evaluation |
| P2 | [cal-com-features.md](./cal-com-features.md) | Port features from Cal.com v6.3 | 8 items: AI agents, OOO status, cancellation reasons, workflow translation, custom domain/SMTP, branding |
| P2 | [plane-features.md](./plane-features.md) | Port features from Plane | 12 items: Gantt chart, intake/triage, deploy boards, stickies, analytics, auto-archive, multi-provider AI, page versions |
| P3 | [tech-debt-billing-export.md](./tech-debt-billing-export.md) | PDF export for billing reports | 1 item: needs jsPDF or server-side generation |

### Done (archive when ready)

| File | Status |
|------|--------|
| [screenshot-facelift-overhaul.md](./screenshot-facelift-overhaul.md) | **Complete** — all visual polish done (PR #899). Residual: screenshot coverage for modals/interactive states, raw TW baseline. |

---

## Biggest feature gaps vs competitors

Based on Cal.com v6.3 and Plane preview (both repos updated 2026-03-18):

| Feature | Cal.com | Plane | Nixelo | Impact |
|---------|---------|-------|--------|--------|
| **Meeting intelligence hub** | ⚠️ AI scheduling adjacencies | — | ⚠️ Sidebar workspace exists; docs/platform breadth still incomplete | High — product surface is now real, but not yet end-to-end |
| **Cross-meeting memory/search** | ⚠️ Agent-oriented adjacencies | — | ⚠️ Search and memory rail exist; no agent layer yet | High — category is moving beyond one-meeting summaries |
| **Action-item execution from meetings** | — | — | ⚠️ Issue flow exists; document flow missing | High — core Nixelo differentiation opportunity |
| **Gantt chart** | — | ✅ Full | ❌ Simple roadmap only | High — standard PM expectation |
| **OOO status** | ✅ Full API | — | ❌ Missing | High — affects calendar, assignments, notifications |
| **Org analytics** | — | ✅ Trends, insights | ✅ Metrics + charts | ~~High~~ Done |
| **AI agents** | ✅ Multi-channel | — | ❌ MCP placeholder | Medium — differentiator |
| **Intake/triage** | — | ✅ Full system | ❌ Skeleton inbox | Medium — external request capture |
| **Auto-archive** | — | ✅ Scheduled | ❌ Basic automation | Medium — reduces clutter |
| **Deploy boards** | — | ✅ Per-entity | ⚠️ Token portal | Medium — public sharing |

---

## Maintenance

- **Raw tailwind baseline:** 148 files with violations. Gradually shrinks as components are touched.

## Reference repos

| Repo | Path | Last pulled |
|------|------|-------------|
| Cal.com | [github.com/calcom/cal.com](https://github.com/calcom/cal.com) | 2026-03-18 |
| Plane | [github.com/makeplane/plane](https://github.com/makeplane/plane) | 2026-03-18 |

## Post-MVP

See [../todos-post-mvp/README.md](../todos-post-mvp/README.md) for blocked and post-MVP items.
