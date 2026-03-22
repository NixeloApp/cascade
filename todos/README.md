# Nixelo Todo — MVP

> **Last Updated:** 2026-03-22

---

## Execution Order

Work is ordered as a pipeline — each phase unblocks the next.

### Phase 1: Tighten Styling Rules *(mechanical work complete)*

| Order | File | Status | What |
|-------|------|--------|------|
| 1.1 | [tailwind-cva-consolidation.md](./tailwind-cva-consolidation.md) | ✅ Mechanical done | Raw TW: 148 → 102 files / 261 violations. Validator smartened (structural allowlist, const/object-map detection). Icon sizing (31 files), Icon inline prop (21 instances), stat cells → Card, margins → gaps (14 files). Remaining violations are non-uniform/responsive/structural — not mechanically fixable. |
| 1.2 | [validator-strengthening.md](./validator-strengthening.md) | ✅ Done | Backend query/filter debt fully resolved. Query baselines ratcheted. 53/53 validators pass. |

### Phase 2: Screenshot-Driven Cleanup

| Order | File | What |
|-------|------|------|
| 2.1 | [visual-consistency-hardening.md](./visual-consistency-hardening.md) | Fix screenshot-exposed inconsistencies, broken states, cross-surface visual drift, and missing tablet/mobile + feature-state screenshot coverage |
| 2.2 | [meeting-intelligence.md](./meeting-intelligence.md) | Finish meetings visual QA and build meeting-to-doc now that editor persistence/save wiring is closed |

### Phase 3: Finish Validator Paydown

| Order | File | What |
|-------|------|------|
| 3.1 | [validator-strengthening.md](./validator-strengthening.md) | Retire temporary ratchets as debt hits zero and close remaining standards cleanup |

### Phase 4: Feature & Docs Expansion

Lower priority — features and documentation that don't block quality.

| Order | File | What |
|-------|------|------|
| 4.1 | [feature-docs-expansion.md](./feature-docs-expansion.md) | Missing page-spec doc triplets plus missing current-feature coverage/state docs for shipped surfaces |
| 4.2 | [plane-features.md](./plane-features.md) | Gantt polish, intake/triage, deploy boards, stickies, analytics, automation, multi-provider AI, page versions |
| 4.3 | [cal-com-features.md](./cal-com-features.md) | AI agents/MCP, cancellation reasons (backend done, no UI), workflow translation, custom domain/SMTP, branding |
| 4.4 | [tech-debt-billing-export.md](./tech-debt-billing-export.md) | PDF export (CSV shipped, no PDF library) |

### Parallel Tracks

| File | What |
|------|------|
| [meeting-intelligence.md](./meeting-intelligence.md) | Meeting-to-doc, capture strategy, platform breadth, OSS evaluation, agent layer |
| [offline-pwa.md](./offline-pwa.md) | SW ownership, push safety, replay expansion (notifications, issues, comments), graceful degradation UX |

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Raw TW violations | 102 files / 261 violations (was 148 / 436) |
| Backend query debt | 0 (was 11 post-fetch JS filters) |
| CVA boundaries | Clean — 0 feature CVAs outside ui/ |
| Empty states | Standardized — 8 inline implementations → EmptyState component |
| Unit tests | 4372 pass |
| E2E tests | 164 pass (non-preview) |

---

## Biggest Remaining Feature Gaps

Based on Cal.com v6.3 and Plane preview (both repos updated 2026-03-18):

| Feature | Cal.com | Plane | Nixelo | Impact |
|---------|---------|-------|--------|--------|
| **Gantt chart** | -- | Full | Roadmap upgraded, dedicated Gantt polish remaining | High |
| **OOO status** | Full API | -- | Shipped | Done |
| **AI agents** | Multi-channel | -- | MCP placeholder | Medium |
| **Intake/triage** | -- | Full system | Skeleton inbox | Medium |
| **Auto-archive** | -- | Scheduled | Basic automation | Medium |
| **Deploy boards** | -- | Per-entity | Token portal only | Medium |
| **Billing PDF export** | -- | -- | CSV only | Low |

---

## Visual Validation Workflow

- Capture current UI state with `pnpm screenshots`
- Audit route/spec screenshot coverage with `pnpm run validate`
- Detect screenshot drift with `pnpm screenshots:diff`
- Approve intentional visual changes with `pnpm screenshots:approve`

## Reference Repos

| Repo | Path | Last pulled |
|------|------|-------------|
| Cal.com | [github.com/calcom/cal.com](https://github.com/calcom/cal.com) | 2026-03-18 |
| Plane | [github.com/makeplane/plane](https://github.com/makeplane/plane) | 2026-03-18 |

## Post-MVP

See [../todos-post-mvp/README.md](../todos-post-mvp/README.md) for blocked and post-MVP items.
