# Growth Features

> **Priority:** P4 (Post-Launch)
> **Effort:** Medium-Large
> **Status:** In Progress (partially shipped)
> **Last Audited:** 2026-03-02

---

## Tasks

### Calendar & Slack Sync

- [ ] **Outlook Calendar integration** - Sync events with Microsoft 365
- [ ] **Post issue updates to Slack** - Webhook notifications
- [ ] **Create issues from Slack** - `/nixelo create "Bug title"` command
- [ ] **Unfurl issue links** - Paste URL → shows preview card

### Enhanced Search

- [x] **Fuzzy matching** - Tolerate typos in search ✅ (`src/hooks/useFuzzySearch.ts`, `src/components/FuzzySearch/`)
- [ ] **Search shortcuts** - `type:bug`, `@me`, `status:done`
- [ ] **Advanced search modal** - Visual query builder

### Documents

- [x] **Version history** - Track document changes over time ✅ (`convex/documentVersions.ts`, `src/components/VersionHistory.tsx`)
- [ ] **Diff view** - Compare versions side-by-side

### Board Enhancements (P3)

- [ ] **Label descriptions** - Show description on hover
- [ ] **Query language** - Simple `status:done priority:high` syntax
- [x] **Swimlanes** - Group board rows by assignee/epic ✅ (`src/components/Kanban/SwimlanSelector.tsx`, `src/lib/swimlane-utils.ts`)
- [x] **WIP limits** - Warn when column exceeds limit ✅ (`src/components/Kanban/KanbanColumn.tsx`, `convex/schema.ts`)
- [ ] **Auto-cycles** - Auto-create next sprint like Linear

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

- [ ] `S3` Implement search shortcuts/query syntax (`type:`, `status:`, `@me`)
- [ ] `S4` Add advanced search modal with query-builder UX
- [ ] `S4` Ship one integration growth lever (Slack create/unfurl or Outlook sync)
- [ ] `S5` Prioritize remaining board/document enhancements based on usage data

### Dependencies

- Query parser design and search API contracts
- OAuth/integration app approvals (Slack/Outlook)

### Definition of Done

- At least two growth items ship with measurable adoption.
