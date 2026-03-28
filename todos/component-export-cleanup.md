# Component Export Cleanup

> **Priority:** P2
> **Status:** Not started
> **Last Updated:** 2026-03-28

Several feature components export internal subcomponents that are never imported outside their own directory. This leaks implementation details into the public API, makes barrel files noisy, and makes it harder to refactor internals.

## High Priority

- [ ] **IssueDetail barrel** (`src/components/IssueDetail/index.ts`): Remove 8 exports that are only consumed within the folder:
  - `InlinePrioritySelect`, `InlineTypeSelect`, `InlineAssigneeSelect`, `InlineStatusSelect`, `InlineStoryPointsInput`, `PropertyRow` (all only used by `IssueMetadataSection`)
  - `areIssuesEqual` (only used inside `IssueCard.tsx` + its test)
  - Verify `IssueDetailSection` — likely internal-only too

## Medium Priority

- [ ] **RoadmapRows dead exports** (`src/components/Roadmap/RoadmapRows.tsx`): `RoadmapTimelineBar`, `RoadmapIssueIdentity`, `RoadmapSummaryBar` are only imported in their own test file. Remove exports (tests can still import non-exported via direct file import or test indirectly).
- [ ] **ProfileContent dead exports** (`src/components/Settings/ProfileContent.tsx`): `UserStatsCards`, `AccountInfo`, `ProfileHeader` are exported but never imported anywhere. Drop `export` keyword.
- [ ] **KanbanColumn** (`src/components/Kanban/KanbanColumn.tsx`): `arePropsEqual` is test-only. Drop export.

## Low Priority

- [ ] **Roadmap render helpers**: `renderDependencyLine` (in `RoadmapDependencyPanel.tsx`) and `renderRoadmapTodayMarker` (in `RoadmapTodayMarker.tsx`) each have a single external consumer (`RoadmapTimelineSurface`). Consider colocating or keeping unexported.
