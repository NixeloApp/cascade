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
