# Growth Features

> **Priority:** P4 (Post-Launch)
> **Effort:** Medium-Large
> **Status:** Blocked (external Outlook integration setup required)
> **Last Audited:** 2026-03-02

---

## Tasks

### Calendar & Slack Sync

- [ ] **Outlook Calendar integration** - Sync events with Microsoft 365
- [x] **Post issue updates to Slack** - Webhook notifications ✅ (`convex/slack.ts`, `convex/issues/mutations.ts`, `convex/slack.test.ts`)
- [x] **Create issues from Slack** - `/nixelo create "Bug title"` command ✅ (`convex/slackCommandsCore.ts`, `convex/http/slackCommands.ts`, `convex/slackCommands.test.ts`)
- [x] **Unfurl issue links** - Paste URL → shows preview card ✅ (`convex/slackUnfurl.ts`, `convex/http/slackUnfurl.ts`, `convex/slackUnfurl.test.ts`)

### Enhanced Search

- [x] **Fuzzy matching** - Tolerate typos in search ✅ (`src/hooks/useFuzzySearch.ts`, `src/components/FuzzySearch/`)
- [x] **Search shortcuts** - `type:bug`, `@me`, `status:done` ✅ (`src/lib/search-shortcuts.ts`, `src/components/GlobalSearch.tsx`)
- [x] **Advanced search modal** - Visual query builder ✅ (`src/components/AdvancedSearchModal.tsx`, `src/components/GlobalSearch.tsx`)

### Documents

- [x] **Version history** - Track document changes over time ✅ (`convex/documentVersions.ts`, `src/components/VersionHistory.tsx`)
- [x] **Diff view** - Compare versions side-by-side ✅ (`src/components/VersionHistory.tsx`, `src/components/VersionHistory.test.tsx`)

### Board Enhancements (P3)

- [x] **Label descriptions** - Show description on hover ✅ (`convex/labels.ts`, `src/components/LabelsManager.tsx`, `src/components/IssueDetail/IssueCard.tsx`)
- [x] **Query language** - Simple `status:done priority:high` syntax ✅ (`src/lib/board-query-language.ts`, `src/components/KanbanBoard.tsx`, `src/components/FilterBar.tsx`)
- [x] **Swimlanes** - Group board rows by assignee/epic ✅ (`src/components/Kanban/SwimlanSelector.tsx`, `src/lib/swimlane-utils.ts`)
- [x] **WIP limits** - Warn when column exceeds limit ✅ (`src/components/Kanban/KanbanColumn.tsx`, `convex/schema.ts`)
- [x] **Auto-cycles** - Auto-create next sprint like Linear ✅ (`convex/sprints.ts`, `src/components/Sprints/SprintManager.tsx`, `convex/sprints.test.ts`)

---

## Related Files

- `convex/documents.ts` - Document queries
- `src/components/GlobalSearch.tsx` - Search UI

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S6-S8` (post-launch growth track)  
**Effort:** Medium-Large

### Milestones

- [x] `S3` Implement search shortcuts/query syntax (`type:`, `status:`, `@me`)
- [x] `S4` Add advanced search modal with query-builder UX
- [x] `S4` Ship one integration growth lever (Slack create/unfurl or Outlook sync)
- [ ] `S5` Prioritize remaining board/document enhancements based on usage data

### Dependencies

- Query parser design and search API contracts
- OAuth/integration app approvals (Slack/Outlook)

### Definition of Done

- At least two growth items ship with measurable adoption.

## Blocker Gate

Only remaining unchecked item is `Outlook Calendar integration`, which depends on external Microsoft 365 app provisioning and OAuth credential setup.

Unblock requirements:

- Microsoft Entra app registration complete.
- Calendar scopes approved (`Calendars.ReadWrite` + required identity scopes).
- Redirect URIs and environment variables configured for local + production.
- Integration test tenant/account available.

---

## Progress Log

### 2026-03-02 (Batch A)

**Progress**

- Audited Growth tasks against current code and marked shipped Slack growth items complete:
  - Slack issue event delivery
  - Slack slash-command issue creation
  - Slack issue-link unfurling
- Implemented first `S3` slice for search shortcuts in `GlobalSearch`:
  - `type:<value>`
  - `status:<value>`
  - `@me` / `assignee:me`

**Decisions**

- Focused this batch on high-confidence already-shipped Slack closures plus a minimal, deterministic shortcut parser for global search.
- Kept shortcuts parser intentionally strict and token-based to avoid introducing ambiguous query-language behavior before full parser work.

**Blockers**

- Outlook integration remains open pending Microsoft OAuth app setup and backend sync design.
- Advanced search modal and full query language remain open design/implementation work.

**Next step**

- Continue `S3` by extending shortcuts beyond `type/status/@me` (for example `priority:` and label tokens) and wiring user-facing shortcut hints in the search UI.

### 2026-03-02 (Batch B)

**Progress**

- Extended shortcuts parser with additional filters:
  - `priority:<value>`
  - `label:<value>` / `labels:<value>`
- Added user-facing shortcut hint strip in global search modal.
- Expanded tests to cover priority/label parsing and query argument propagation.

**Decisions**

- Delivered parser extensions inside the same `GlobalSearch` shortcut architecture instead of adding a separate query-language parser layer.
- Kept advanced visual query builder as a separate future step (`Advanced search modal`).

**Blockers**

- Advanced search modal still requires UX design + component architecture work.
- Outlook integration remains external-integration-heavy and not started.

**Next step**

- Start `Advanced search modal` scope (first pass: modal shell + structured filter controls wired to current search backend args).

### 2026-03-02 (Batch C)

**Progress**

- Wired existing `AdvancedSearchModal` into `GlobalSearch` via footer action (`Advanced Search`).
- Added issue-selection navigation from advanced results to project issue detail context.
- Fixed advanced modal pagination behavior by resetting offset whenever query/filters change.

**Decisions**

- Reused and integrated the existing modal implementation instead of building a duplicate query-builder surface.
- Marked advanced search task complete after integration into the main search entrypoint and routing flow.

**Blockers**

- Outlook calendar integration remains not started.
- Board/document growth items (diff view, label hover descriptions, query language, auto-cycles) remain open.

**Next step**

- Move to the next unfinished growth item by impact: board query language (`status:done priority:high`) with shared parser contracts.

### 2026-03-02 (Batch D)

**Progress**

- Implemented board query-language parser/matcher with tests:
  - `status:`
  - `priority:`
  - `type:`
  - `label:` / `labels:`
- Wired board query parser into Kanban filtering pipeline.
- Updated board search input placeholder to advertise supported query syntax.

**Decisions**

- Implemented parser as a shared utility (`src/lib/board-query-language.ts`) for reuse in future board/list views.
- Kept existing explicit dropdown filters intact and applied query-language filters as an additive search layer.

**Blockers**

- Outlook integration remains not started.
- Remaining board/document growth items are still open (`Label descriptions`, `Diff view`, `Auto-cycles`).

**Next step**

- Implement `Label descriptions` hover UX on board cards/chips (next unfinished board enhancement).

### 2026-03-02 (Batch E)

**Progress**

- Added optional `description` support to labels in backend schema and mutations.
- Extended label management UI to create/edit descriptions.
- Added hover tooltips for visible board-card labels, using description text when present.
- Added backend and component test coverage for label description behavior.

**Decisions**

- Implemented descriptions as an optional label field rather than a separate metadata table.
- Used existing tooltip primitives on board cards to keep UX consistent with current issue metadata hover affordances.

**Blockers**

- Outlook integration remains not started.
- Remaining growth items: `Diff view` and `Auto-cycles`.

**Next step**

- Continue with `Documents / Diff view` as the next unfinished growth feature.

### 2026-03-02 (Batch F)

**Progress**

- Implemented side-by-side version comparison in `VersionHistory`:
  - Select up to two historical versions via `Compare` buttons.
  - Render `Diff View` panel with older/newer snapshots in parallel.
  - Added clear-compare control and dialog-close selection reset.
- Added component test coverage for two-version compare flow and rendered diff panel.

**Decisions**

- Shipped a practical JSON snapshot diff view first (fast to ship, deterministic, no new dependency).
- Kept restore workflow unchanged and additive to comparison controls.

**Blockers**

- Outlook integration remains not started.
- `Auto-cycles` remains open in board enhancements.

**Next step**

- Implement `Auto-cycles` (automatic next sprint creation) or classify it with concrete rollout dependencies if blocked.

### 2026-03-02 (Batch G)

**Progress**

- Added optional sprint completion auto-cycle path in backend:
  - `api.sprints.completeSprint` now supports `autoCreateNext`.
  - Auto-generated next sprint copies duration, increments name, and schedules as future sprint.
- Wired complete-sprint modal with `Auto-create next sprint` checkbox in UI.
- Added backend regression test for auto-cycle behavior.

**Decisions**

- Implemented auto-cycle as explicit opt-in during sprint completion rather than always-on behavior.
- Name progression uses numeric suffix increment when present, otherwise appends ` 2`.

**Blockers**

- Outlook integration remains the only unchecked item in this todo.

**Next step**

- Classify `Outlook Calendar integration` as blocked until Microsoft app credentials + OAuth scopes are provisioned, then proceed to Priority `18`.

### 2026-03-02 (Batch H)

**Progress**

- Classified Priority 17 as externally blocked after completing all in-repo growth items except Outlook integration.

**Decisions**

- Did not start partial Outlook code scaffolding without confirmed Microsoft app credentials/scope constraints to avoid speculative implementation churn.

**Blockers**

- Missing external Microsoft OAuth app setup and credentials.

**Next step**

- Proceed to Priority `18` while waiting for Outlook integration prerequisites.
