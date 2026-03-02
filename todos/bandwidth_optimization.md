# Database Bandwidth Optimization TODOs

**Status**: Critical - Current usage (6.25 GB) exceeds free tier limits (1 GB).
**Last Audited**: 2026-03-02
**Note**: Bandwidth numbers are historical baseline values from the original investigation.

## 📊 Summary of Issues
The primary bandwidth drains were identified as:
1. **Sidebar Queries**: Functions like `getUserOrganizations` and `getOrganizationTeams` fire on every navigation and were fetching hundreds of full documents merely to compute a `.length` count.
2. **E2E Cleanup**: Test user cleanup functions were performing full table scans on the `users` table instead of using the `isTestUser` index.
3. **Dashboard Activity**: Global activity feeds that scan large tables then filter in-memory.

---

## ✅ Completed Optimizations

### 1. Sidebar: Organization & Team Lists
- [x] **`organizations.getUserOrganizations`**: Reduced project count `.take()` limit from 1000 to `MAX_PAGE_SIZE` (100).
- [x] **`teams.getOrganizationTeams`**: Reduced member count `.take()` from 500 to 100.
- [x] **`teams.getOrganizationTeams`**: Reduced project count `.take()` from 200 to `MAX_PAGE_SIZE` (100).

### 2. End-to-End (E2E) Testing
- [x] **`e2e.nukeAllTestUsersInternal`**: Replaced full table scan with `isTestUser` index lookup.
- [x] **`e2e.cleanupTestUsersInternal`**: Replaced `.filter()` scan with `isTestUser` index.
- [x] **`e2e.deleteTestUserInternal`**: Replaced `.filter()` on `authAccounts` with the `providerAndAccountId` index.
- [x] **`e2e.createTestUserInternal`**: Replaced `.filter()` on `users` with the `email` index.

---

## ⏳ Pending Optimizations

### 1. Dashboard & Analytics
- [x] **`dashboard.getMyRecentActivity`**: Refactored to avoid global `issueActivity` scan by sampling recent issues only from member projects, then querying `issueActivity` via `by_issue` for those scoped issue IDs.
- [x] **`analytics.getProjectAnalytics`**: Replaced full issue fetch with index-backed bounded counts for status/type/priority/assignee and unassigned totals.
- [x] **`dashboard.getMyIssues`**: Ensure pagination is strictly enforced and only necessary fields are transferred if issues have large descriptions.

### 2. General Infrastructure
- [ ] **Field Projection**: Review all queries that return arrays of documents. If only a few fields are used (e.g., only `_id` and `name` in a picker), use helper patterns to avoid fetching full `Doc<"table">` objects.
- [ ] **Stats Table**: Implement a `counters` or `stats` table for high-frequency counts (e.g., total issues in a project) to eliminate the need for `.take(1000).length` queries.

---

## 🛡️ Best Practices for Developers
1. **Never use `.collect()` or `.take(1000)` just for counts.** If the count might exceed 100, consider if a real-time count is actually necessary or if a "99+" style capped count is sufficient.
2. **Always search for an index.** Before using `.filter()`, check `schema.ts` for an existing index.
3. **Sidebar is Sensitive.** Any query called in `AppSidebar.tsx` will be your #1 bandwidth consumer. Keep it extremely light.
4. **Project fields.** If you only need 2 fields out of 20, fetch only those if possible (especially for tables with large description fields).

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S1-S2`  
**Effort:** Medium

### Milestones

- [x] `S1` Finish dashboard/activity query scoping and payload minimization
- [ ] `S1` Add query-level payload telemetry for top bandwidth endpoints
- [ ] `S2` Introduce counters/stats table for high-frequency counts
- [ ] `S2` Publish before/after bandwidth report from Convex dashboard metrics

### Dependencies

- Query index coverage in `convex/schema.ts`
- Agreement on acceptable precision for cached counts

### Definition of Done

- Top recurring bandwidth offenders are reduced and documented with measured deltas.

---

## Progress Log

### 2026-03-02 - Batch A (`dashboard.getMyIssues` payload minimization)

- Decision:
  - start Priority `07` with the lowest-risk high-impact item: reduce `dashboard.getMyIssues` payload shape instead of returning full issue documents.
- Change:
  - updated `convex/dashboard.ts`:
    - `getMyIssues` now returns a minimal issue shape needed by dashboard/command palette (`_id`, `_creationTime`, `projectId`, `key`, `title`, `type`, `status`, `priority`, `updatedAt`, `projectName`, `projectKey`, `reporterName`, `assigneeName`) instead of full `issuesFields`.
    - filtered out malformed entries missing `projectId` in enriched result mapping.
    - aligned `getMyCreatedIssues` output with `reporterName` to keep dashboard feed merge typing consistent.
  - updated `src/components/CommandPalette.tsx`:
    - removed over-strict `Doc<"issues">` callback annotation for recent-issues mapping so it matches the new lightweight query payload contract.
- Validation:
  - `pnpm run typecheck` => pass
  - `pnpm test convex/dashboard.test.ts` => pass (`29 passed`)
- Blockers:
  - none for this subtask.
- Next Step:
  - tackle `dashboard.getMyRecentActivity` query scoping (remove global activity scan pattern) and/or analytics payload slimming.

### 2026-03-02 - Batch B (`dashboard.getMyRecentActivity` membership-scoped activity pipeline)

- Decision:
  - avoid schema-wide churn by implementing project-membership-scoped activity retrieval using existing indexes (`issues.by_project_deleted`, `issueActivity.by_issue`) instead of global table scan.
- Change:
  - updated `convex/dashboard.ts` (`getMyRecentActivity`):
    - removed global `ctx.db.query("issueActivity").order("desc").take(...)` scan.
    - now:
      - loads member projects from `projectMembers.by_user`,
      - samples recent issues per member project via `issues.by_project_deleted`,
      - queries activity per sampled issue via `issueActivity.by_issue`,
      - merges/sorts/slices results and enriches with project/user metadata.
  - updated `convex/dashboard.test.ts`:
    - added regression proving activity from non-member projects is excluded.
- Validation:
  - `pnpm run typecheck` => pass
  - `pnpm test convex/dashboard.test.ts` => pass (`30 passed`)
- Blockers:
  - none for this subtask.
- Next Step:
  - continue Priority `07` with analytics payload slimming (`analytics.getProjectAnalytics`) and/or query-level telemetry (`S1` telemetry milestone).

### 2026-03-02 - Batch C (`analytics.getProjectAnalytics` index-backed counts)

- Decision:
  - avoid returning/fetching large issue document arrays for analytics aggregates; switch to bounded index count queries per dimension.
- Change:
  - updated `convex/analytics.ts` (`getProjectAnalytics`):
    - replaced full `issues.by_project_deleted.take(1000)` fetch + in-memory grouping with `efficientCount` queries over existing indexes for:
      - total issue count,
      - status buckets (`by_project_status_deleted`),
      - type buckets (`by_project_type_deleted`),
      - priority buckets (`by_project_priority_deleted`, newly added),
      - unassigned + per-assignee buckets (`by_project_assignee`).
    - kept output contract unchanged (`totalIssues`, `issuesByStatus`, `issuesByType`, `issuesByPriority`, `issuesByAssignee`, `unassignedCount`).
  - updated `convex/schema.ts`:
    - added `issues` index `by_project_priority_deleted` to support priority counting without full document scans.
  - updated `convex/analytics.test.ts`:
    - ensured secondary assignee in `getProjectAnalytics` test is an actual project member so assignee-count behavior matches access model.
- Validation:
  - `pnpm run typecheck` => pass
  - `pnpm test convex/analytics.test.ts` => pass (`26 passed`)
- Blockers:
  - none for this subtask.
- Next Step:
  - continue Priority `07` with query-level payload telemetry for top bandwidth endpoints (`S1` telemetry milestone).
