# Nixelo Todo — MVP

> **Last Updated:** 2026-03-19

## Health

| Metric | Value |
|--------|-------|
| Validators | 38/47 pass (9 failing, all from MeetingsWorkspace + minor) |
| Bundle | 337KB gzip |
| Screenshots | 226 in manifest, 37 are loading spinners (16.4% broken) |
| Raw TW baseline | 148 files with violations |
| CVA definitions | 48 files (38 in ui/, 10 in features) |

---

## Execution Order

Work is ordered as a pipeline -- each phase unblocks the next. AI will fix these in order.

### Phase 1: Fix Current Failures

Get validators back to green. Fix the code, not the validators.

| Order | File | What |
|-------|------|------|
| 1.1 | [meeting-intelligence.md](./meeting-intelligence.md) | Fix 55 validator violations in MeetingsWorkspace.tsx, add screenshots/spec folder, add E2E tests |
| 1.2 | [visual-consistency-hardening.md](./visual-consistency-hardening.md) | Absorb 43 Typography drift + 17 control-chrome drift points |

### Phase 2: Strengthen Validators

Make it impossible to ship slop. Advisory validators become blocking. New validators catch patterns we missed.

| Order | File | What |
|-------|------|------|
| 2.1 | [validator-strengthening.md](./validator-strengthening.md) | Promote 3 advisory validators to blocking/ratchet, add manifest integrity + catch-swallow + timeout validators |

### Phase 3: Fix Screenshot Tooling

Fix the capture infra so screenshots are real content, not loading spinners.

| Order | File | What |
|-------|------|------|
| 3.1 | [screenshot-tooling-cleanup.md](./screenshot-tooling-cleanup.md) | Kill 198 `.catch(() => {})`, fix 37 spinner captures, replace hardcoded timeouts, use TEST_IDS |

### Phase 4: Tailwind / CVA Consolidation

Reduce raw Tailwind, consolidate CVA sprawl, add validators to prevent regression.

| Order | File | What |
|-------|------|------|
| 4.1 | [tailwind-cva-consolidation.md](./tailwind-cva-consolidation.md) | Reduce 148 raw TW files, consolidate 48 CVA files, merge overlapping variants, add validators for CVA sprawl and class cluster repetition |

### Phase 5: Feature & Docs Expansion

Lower priority -- features and documentation that don't block quality.

| Order | File | What |
|-------|------|------|
| 5.1 | [feature-docs-expansion.md](./feature-docs-expansion.md) | 21 page spec folders missing CURRENT / IMPLEMENTATION / TARGET docs |
| 5.2 | [plane-features.md](./plane-features.md) | Gantt polish, intake/triage, deploy boards, stickies, analytics, automation, multi-provider AI, page versions |
| 5.3 | [cal-com-features.md](./cal-com-features.md) | AI agents/MCP, cancellation reasons (backend done, no UI), workflow translation, custom domain/SMTP, branding |
| 5.4 | [tech-debt-billing-export.md](./tech-debt-billing-export.md) | PDF export (CSV shipped, no PDF library) |

### Meeting Intelligence (parallel track)

Non-code-quality items from meetings that run alongside the pipeline.

| File | What |
|------|------|
| [meeting-intelligence.md](./meeting-intelligence.md) | Editor persistence (blocks meeting-to-doc), capture strategy decisions, platform breadth, OSS evaluation, agent layer |

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
