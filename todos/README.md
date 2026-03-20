# Nixelo Todo — MVP

> **Last Updated:** 2026-03-19

## Health

| Metric | Value |
|--------|-------|
| Validators | 47/47 pass |
| Bundle | 337KB gzip |
| Screenshots | 300+ across 4 viewport/theme combos, 0 uncovered routes |
| Screenshot validation | Route coverage audit + page/modal screenshot audit + hash diff workflow |
| Raw TW baseline | 148 files (run `node scripts/validate/check-raw-tailwind.js --audit` to inspect) |

---

## What Is Still Open

Only unfinished work stays in `/todos`. Completed slices should be removed from these files instead of lingering as historical backlog.

| Priority | File | Remaining work |
|----------|------|----------------|
| P1 | [visual-consistency-hardening.md](./visual-consistency-hardening.md) | Broader consistency system is in place; cleanup remains for 50 Typography drift points, 16 control-chrome drift points, and residual screenshot/state cohesion gaps |
| P2 | [feature-docs-expansion.md](./feature-docs-expansion.md) | Expand current feature/design docs into concrete user-story-grade product specs for shipped behavior, starting with the 21 page spec folders still missing CURRENT / IMPLEMENTATION / TARGET docs |
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

## P2 Backlog
- [x] `convex/bookings.ts:263` — Per-slot OOO delegate resolution. ✅ Fixed: resolves per-slot using cached user data.
