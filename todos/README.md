# Nixelo Todo — MVP

> **Last Updated:** 2026-03-18

## Health

| Metric | Value |
|--------|-------|
| Validators | 44/44 pass |
| Bundle | 337KB gzip |
| Screenshots | 300+ across 4 viewport/theme combos, 0 uncovered routes |
| Screenshot validation | Route coverage audit + canonical spec screenshot audit + hash diff workflow |
| Raw TW baseline | 148 files (run `node scripts/validate/check-raw-tailwind.js --audit` to inspect) |

---

## What Is Still Open

Only unfinished work stays in `/todos`. Completed slices should be removed from these files instead of lingering as historical backlog.

| Priority | File | Remaining work |
|----------|------|----------------|
| P1 | [screenshot-facelift-overhaul.md](./screenshot-facelift-overhaul.md) | Screenshot capture/approval residue: 6 spec folders missing canonical variants, portal capture, modal/interactive-state coverage, CI manifest workflow |
| P2 | [plane-features.md](./plane-features.md) | Remaining Plane-inspired gaps: dedicated Gantt polish, intake/triage, deploy boards, stickies, analytics enhancements, automation, multi-provider AI, page versions |
| P2 | [cal-com-features.md](./cal-com-features.md) | Remaining Cal.com-inspired gaps: AI agents/MCP, cancellation reasons, workflow translation, custom domain/SMTP, branding |
| P3 | [tech-debt-billing-export.md](./tech-debt-billing-export.md) | PDF export for billing reports |

---

## Biggest Remaining Feature Gaps

Based on Cal.com v6.3 and Plane preview (both repos updated 2026-03-18):

| Feature | Cal.com | Plane | Nixelo | Impact |
|---------|---------|-------|--------|--------|
| **Gantt chart** | — | ✅ Full | ⚠️ Roadmap is substantially upgraded, but still has remaining dedicated Gantt polish and deeper timeline-management work | High — standard PM expectation |
| **OOO status** | ✅ Full API | — | ✅ Shipped | Done |
| **AI agents** | ✅ Multi-channel | — | ❌ MCP placeholder | Medium — differentiator |
| **Intake/triage** | — | ✅ Full system | ❌ Skeleton inbox | Medium — external request capture |
| **Auto-archive** | — | ✅ Scheduled | ❌ Basic automation | Medium — reduces clutter |
| **Deploy boards** | — | ✅ Per-entity | ⚠️ Token portal only | Medium — public sharing |
| **Billing PDF export** | — | — | ❌ CSV only | Low — focused tech debt |

---

## Visual Validation Workflow

- Capture current UI state with `pnpm screenshots`
- Audit route/spec screenshot coverage with `pnpm run validate`
- Detect screenshot drift with `pnpm screenshots:diff`
- Approve intentional visual changes with `pnpm screenshots:approve`

## Maintenance

- Raw Tailwind baseline: 148 files with violations. Shrink opportunistically as touched files are cleaned up.

## Reference Repos

| Repo | Path | Last pulled |
|------|------|-------------|
| Cal.com | [github.com/calcom/cal.com](https://github.com/calcom/cal.com) | 2026-03-18 |
| Plane | [github.com/makeplane/plane](https://github.com/makeplane/plane) | 2026-03-18 |

## Post-MVP

See [../todos-post-mvp/README.md](../todos-post-mvp/README.md) for blocked and post-MVP items.
