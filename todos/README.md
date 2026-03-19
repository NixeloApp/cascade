# Nixelo Todo Archive — MVP

> **Last Updated:** 2026-03-18

## Status

`/todos` is no longer an active MVP backlog. Everything in this directory is either complete, intentionally retired, or preserved as historical benchmark context.

| Metric | Value |
|--------|-------|
| Blocking validators | 42/42 pass |
| Screenshot validation | Route coverage audit + canonical spec screenshot audit + hash diff workflow |
| Screenshots | 300+ across 4 viewport/theme combos, 0 uncovered routes |
| Raw TW baseline | 148 files (run `node scripts/validate/check-raw-tailwind.js --audit` to inspect) |

---

## Archived Files

| File | Status | Notes |
|------|--------|-------|
| [cal-com-features.md](./cal-com-features.md) | **Archived** | Historical Cal.com benchmark. OOO work shipped; remaining ideas are no longer tracked as active MVP todo items. |
| [plane-features.md](./plane-features.md) | **Archived** | Historical Plane benchmark. Roadmap/Gantt parity work shipped enough for MVP; remaining ideas are not active `/todos` work. |
| [tech-debt-billing-export.md](./tech-debt-billing-export.md) | **Archived** | CSV export shipped. PDF export is not an active MVP task. |
| [screenshot-facelift-overhaul.md](./screenshot-facelift-overhaul.md) | **Archived Complete** | Visual facelift landed. Ongoing screenshot maintenance moved into validator + docs workflow. |

---

## Visual Validation Workflow

- Capture current UI state with `pnpm screenshots`
- Audit route/spec screenshot coverage with `pnpm run validate`
- Detect screenshot drift with `pnpm screenshots:diff`
- Approve intentional visual changes with `pnpm screenshots:approve`

If a new gap reopens later, track it in [../todos-post-mvp/README.md](../todos-post-mvp/README.md) or the feature-comparison docs instead of reactivating `/todos` as a live MVP queue.

## Reference Repos

| Repo | Path | Last pulled |
|------|------|-------------|
| Cal.com | [github.com/calcom/cal.com](https://github.com/calcom/cal.com) | 2026-03-18 |
| Plane | [github.com/makeplane/plane](https://github.com/makeplane/plane) | 2026-03-18 |
