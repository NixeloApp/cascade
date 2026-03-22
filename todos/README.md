# Nixelo Todo — MVP

> **Last Updated:** 2026-03-22

---

## Unresolved PR Review Comments

Issues flagged by reviewers on PRs #905-#918 that were not fixed before merge. Grouped by severity.

### Critical

*All resolved.*

### Major

| PR | File | Issue |
|----|------|-------|
| ~~#908~~ | ~~`convex/export.ts:327`~~ | ~~Export queries use `.filter()` for sprintId/status.~~ **Fixed** — uses compound indexes `by_project_sprint_status` and `by_project_status`. |
| ~~#908~~ | ~~`convex/hourCompliance.ts:563`~~ | ~~Compliance summary silently truncates.~~ **Fixed** — `isTruncated` flag exposed; dashboard shows "+" suffix and warning. |
| ~~#908~~ | ~~`scripts/validate/check-raw-tailwind.js:252`~~ | ~~Structural allowlist short-circuits entire attribute.~~ **Fixed** — per-token stripping; only allowed tokens removed. |
| ~~#908~~ | ~~`scripts/validate/tailwind-policy.js:92`~~ | ~~Class-string detection requires uppercase names.~~ **Fixed** — matches any const name containing TW patterns. |
| #908 | `e2e/preview/offline-replay-preview.spec.ts:30` | Entire offline preview suite skipped in CI. Should find a reliable way to test SW caching, not skip it entirely. |
| ~~#909~~ | ~~`src/hooks/useOfflineIssueUpdateStatus.test.ts:96`~~ | ~~Tests use `as never` casts.~~ **Fixed** — replaced with `as Id<"table">` across 7 test files. |
| ~~#918~~ | ~~`convex/deployBoards.ts:168`~~ | ~~Deploy board returns empty `workflowStates` when `status: false`.~~ **Fixed** — always return workflowStates; resolve assignee names. |
| ~~#918~~ | ~~`src/routes/board.$slug.tsx`~~ | ~~Board card doesn't render assignee or dueDate.~~ **Fixed** — BoardIssueCard renders both fields. |
| ~~#918~~ | ~~`src/routes/board.$slug.tsx:58`~~ | ~~Board renders no issues when status disabled.~~ **Fixed** — status always included for column grouping. |

### Minor

| PR | File | Issue |
|----|------|-------|
| #905 | `src/components/Settings/ProfileContent.tsx:319` | Profile grid span doesn't adapt when `showAccountInfo` is false. |
| ~~#905~~ | ~~`e2e/utils/wait-helpers.ts:299`~~ | ~~Screenshot readiness waits on first spinner only.~~ **Fixed** — `waitForAllSpinnersToClear` polls until all spinners are hidden. |
| #908 | `src/components/AI/AIAssistantButton.test.tsx:131` | Test only checks base `size-*` class, misses responsive `sm:size-*` variants. |
| ~~#908~~ | ~~`todos/tailwind-cva-consolidation.md:29`~~ | ~~Stale violation counts.~~ **Fixed** — updated to current numbers with strikethrough. |
| ~~#908~~ | ~~`todos/validator-strengthening.md:53`~~ | ~~Stale export.ts description.~~ **Fixed** — updated to reflect compound index migration. |
| #909 | 6 files | EmptyState imports use relative paths instead of `@/` alias. |
| ~~#910~~ | ~~`src/hooks/useOfflineAddComment.test.ts:64`~~ | ~~Test uses `as never` cast.~~ **Fixed** — replaced with `as Id<"issues">`. |
| ~~#911~~ | ~~`convex/autoArchive.test.ts`~~ | ~~Magic numbers; missing workflow state assertion.~~ **Fixed** — named constants, `moveIssueToDone` helper with assertion, new non-done test. |
| ~~#911~~ | ~~`convex/schemaFields.ts:44`~~ | ~~`autoArchiveDays` not in mutation args.~~ **Fixed** — added to `updateProject` with non-negative integer clamping. |
| ~~#912~~ | ~~`todos/README.md:79`~~ | ~~Inconsistent terminology.~~ **Fixed** — "4 mutation families." |
| ~~#913~~ | ~~`todos/plane-features.md:8`~~ | ~~"Only unfinished items remain" contradiction.~~ **Fixed** — reworded to "Completed items are marked as shipped." |
| ~~#913~~ | ~~`todos/README.md:82`~~ | ~~Phase 4 stickies reference.~~ **Fixed** — stickies already listed as shipped in Phase 3. |
| ~~#917~~ | ~~`convex/http/intake.ts:52`~~ | ~~Bearer token parsing accepts non-Bearer headers.~~ **Fixed** — strict RFC 6750 parsing with `extractBearerToken()`, 10 unit tests. |
| ~~#917~~ | ~~`todos/README.md:38`~~ | ~~Lists intake as remaining.~~ **Fixed** — already marked as shipped in Phase 3. |

---

## Execution Pipeline

### Phase 1: Styling & Validators *(complete)*

| Item | Status |
|------|--------|
| Raw TW reduction | ✅ 148 → 102 files / 261 violations |
| Validator smartening | ✅ Structural allowlist, const/object-map detection |
| Backend query fixes | ✅ All post-fetch JS filters moved to query level |
| Icon sizing batch | ✅ 31 files h-X w-X → size-X |
| Icon inline prop | ✅ 21 instances consolidated |
| Margins → gaps | ✅ 14 files |
| Empty states | ✅ 8 inline → EmptyState component |

### Phase 2: Visual Consistency

| Item | Status |
|------|--------|
| [visual-consistency-hardening.md](./visual-consistency-hardening.md) | Screenshot-driven cleanup, broken states, cross-surface drift |
| [meeting-intelligence.md](./meeting-intelligence.md) | Meetings visual QA, meeting-to-doc flow |

### Phase 3: Feature Gaps

| Feature | Status |
|---------|--------|
| Gantt chart polish | 🟡 RoadmapView exists (2671 lines). Needs: drag-resize, dependency arrows, zoom. |
| Intake external capture | ✅ Backend shipped (PR #917). Needs: admin UI for token management. |
| Deploy boards | ✅ Shipped — backend, public page, assignee/dueDate rendering, status-hidden column fix. |
| Auto-archive | ✅ Shipped |
| Scheduled automation | ✅ Shipped (stale_in_status triggers) |
| Stickies | ✅ Shipped |
| Bulk operations | ✅ Shipped (9 operation types including labels) |
| Cycle/lead time | ✅ Shipped |
| Multi-provider AI | ✅ Shipped (Anthropic + OpenAI) |
| Version history | ✅ Shipped (list + restore) |
| Offline replay | ✅ Shipped (4 mutation families, header badges, queue UI) |

### Phase 4: Docs & Low Priority

| Item | Status |
|------|--------|
| [feature-docs-expansion.md](./feature-docs-expansion.md) | 21 page specs missing CURRENT/IMPLEMENTATION/TARGET docs |
| [cal-com-features.md](./cal-com-features.md) | AI agents/MCP, cancellation UI, workflow translation |
| [tech-debt-billing-export.md](./tech-debt-billing-export.md) | PDF export (CSV shipped, no PDF library) |

### Parallel Tracks

| Track | Status |
|-------|--------|
| [offline-pwa.md](./offline-pwa.md) | SW ownership cleanup, push safety verification still pending |
| [meeting-intelligence.md](./meeting-intelligence.md) | Editor dependency, capture strategy |

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Raw TW violations | 102 files / 261 violations (was 148 / 436) |
| Backend query debt | 0 (was 11 post-fetch JS filters) |
| CVA boundaries | Clean — 0 feature CVAs outside ui/ |
| Unresolved PR comments | 12 (0 critical, 1 major, 11 minor) |
| Unit tests | 4420 pass |
| E2E tests | 164 pass (non-preview) |

---

## Visual Validation Workflow

- Capture current UI state with `pnpm screenshots`
- Audit route/spec screenshot coverage with `pnpm run validate`
- Detect screenshot drift with `pnpm screenshots:diff`
- Approve intentional visual changes with `pnpm screenshots:approve`

## Post-MVP

See [../todos-post-mvp/README.md](../todos-post-mvp/README.md) for blocked and post-MVP items.
