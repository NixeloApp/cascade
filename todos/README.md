# Nixelo Todo — MVP

> **Last Updated:** 2026-03-20

---

## Execution Order

Work is ordered as a pipeline -- each phase unblocks the next. AI will fix these in order.

### Phase 1: Tighten Styling Rules

Make CVA usage and raw Tailwind rules stricter first, so the next cleanup passes do not reintroduce slop.
Default to Tailwind for static feature/page layout, reserve `cva()` for shared primitive semantics, and keep `index.css` for tokens/global utilities/shared effects instead of section-specific dumping grounds.

| Order | File | What |
|-------|------|------|
| 1.1 | [tailwind-cva-consolidation.md](./tailwind-cva-consolidation.md) | Tighten CVA boundaries, tighten raw Tailwind rules, and reduce remaining styling escape hatches |
| 1.2 | [validator-strengthening.md](./validator-strengthening.md) | Make the stricter styling rules enforceable so new slop cannot land, and keep the validator suite itself maintainable as it grows |

### Phase 2: Screenshot-Driven Cleanup

Use screenshots as the review surface, fix obviously broken states, and turn visual weirdness into explicit cleanup items.
Main-page/landing cleanup belongs here too: if the marketing surface is inconsistent or looks unlike the actual product, treat that as product-quality debt, not decoration.
This phase also owns screenshot-matrix completeness: page specs should not silently stay desktop-first, and important feature states should not be left uncaptured just because the canonical route screenshot looks acceptable.

| Order | File | What |
|-------|------|------|
| 2.1 | [visual-consistency-hardening.md](./visual-consistency-hardening.md) | Fix screenshot-exposed inconsistencies, broken states, cross-surface visual drift, and missing tablet/mobile + feature-state screenshot coverage |
| 2.2 | [meeting-intelligence.md](./meeting-intelligence.md) | Finish meetings visual QA and build meeting-to-doc now that editor persistence/save wiring is closed |

### Phase 3: Finish Validator Paydown

Keep the stricter validator regime, but pay off the remaining debt so ratchets and baselines can be removed.

| Order | File | What |
|-------|------|------|
| 3.1 | [validator-strengthening.md](./validator-strengthening.md) | Retire temporary ratchets as debt hits zero and close the remaining standards/query-filter cleanup |

### Phase 4: Feature & Docs Expansion

Lower priority -- features and documentation that don't block quality.

| Order | File | What |
|-------|------|------|
| 4.1 | [feature-docs-expansion.md](./feature-docs-expansion.md) | Missing page-spec doc triplets plus missing current-feature coverage/state docs for shipped surfaces |
| 4.2 | [plane-features.md](./plane-features.md) | Gantt polish, intake/triage, deploy boards, stickies, analytics, automation, multi-provider AI, page versions |
| 4.3 | [cal-com-features.md](./cal-com-features.md) | AI agents/MCP, cancellation reasons (backend done, no UI), workflow translation, custom domain/SMTP, branding |
| 4.4 | [tech-debt-billing-export.md](./tech-debt-billing-export.md) | PDF export (CSV shipped, no PDF library) |

### Meeting Intelligence (parallel track)

Non-code-quality items from meetings that run alongside the pipeline.

| File | What |
|------|------|
| [meeting-intelligence.md](./meeting-intelligence.md) | Meeting-to-doc, capture strategy, platform breadth, OSS evaluation, agent layer |
| [offline-pwa.md](./offline-pwa.md) | SW ownership, push safety, replay expansion (notifications, issues, comments), graceful degradation UX |

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
