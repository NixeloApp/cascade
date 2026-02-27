# Database Bandwidth Optimization TODOs

**Status**: Critical - Current usage (6.25 GB) exceeds free tier limits (1 GB).

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
- [ ] **`dashboard.getMyRecentActivity`**: Currently scans the global `issueActivity` table. Needs to be refactored to query only projects the user is a member of (requires adding a `projectId` index to `issueActivity` or indexing by project membership).
- [ ] **`analytics.getProjectAnalytics`**: Projecting fields or using pre-aggregated status counts to avoid fetching 1000 full issue documents.
- [ ] **`dashboard.getMyIssues`**: Ensure pagination is strictly enforced and only necessary fields are transferred if issues have large descriptions.

### 2. General Infrastructure
- [ ] **Field Projection**: Review all queries that return arrays of documents. If only a few fields are used (e.g., only `_id` and `name` in a picker), use helper patterns to avoid fetching full `Doc<"table">` objects.
- [ ] **Stats Table**: Implement a `counters` or `stats` table for high-frequency counts (e.g., total issues in a project) to eliminate the need for `.take(1000).length` queries.

---

## 🛡️ Best Practices for Developers
1. **Never use `.collect()` or `.take(1000)` just for counts.** If the count might exceed 100, consider if a real-time count is actually necessary or if a "99+" style capped count is sufficient.
2. **Always search for an index.** Before using `.filter()`, check `schema.ts` for an existing index.
3. **Sidebar is Sensitive.** Any query called in `AppSidebar.tsx` will be your #1 bandwidth consumer. Keep it extremely light.
4. **Project fields.** If you only need 2 fields out of 20, fetch only those if possible (especially for tables with large description fields).
