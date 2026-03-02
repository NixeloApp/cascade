# Database Bandwidth Burn Assessment

This document breaks down the **6.25 GB** total bandwidth usage into percentage-based "burn" per function. This identifies the highest impact areas for optimization.

## 📊 Bandwidth Consumption Breakdown

| Function Path | Usage (GB/MB) | % of Total Burn | Impact Level |
| :--- | :--- | :--- | :--- |
| `organizations.getUserOrganizations` | 2.24 GB | **35.8%** | 🔥 Critical |
| `teams.getOrganizationTeams` | 755 MB | **11.8%** | 🔴 High |
| `e2e.nukeAllTestUsersInternal` | 624 MB | **9.8%** | 🔴 High |
| `workspaces.list` | 575 MB | **9.0%** | 🟠 Medium-High |
| `e2e.deleteTestUserInternal` | 565 MB | **8.8%** | 🟠 Medium-High |
| `e2e.debugVerifyPasswordInternal` | 394 MB | **6.2%** | 🟠 Medium |
| `analytics.getRecentActivity` | 245 MB | **3.8%** | 🟡 Medium-Low |
| `dashboard.getMyRecentActivity` | 171 MB | **2.7%** | 🟡 Medium-Low |
| *Other Functions (Combined)* | ~750 MB | **12.1%** | 🟢 Low (Aggregate) |

---

## 📈 Analysis by Category

### 1. The "Sidebar Tax" (56.6% Total Burn)
Top 3 consumers (`getUserOrganizations`, `getOrganizationTeams`, `workspaces.list`) account for over half of total bandwidth.
- **Why**: These functions are called in `AppSidebar.tsx`, which triggers on almost every page transition/load in the main app layout.
- **Optimization Strategy**: Already refactored to use tighter limits and avoid fetching full document arrays for counts.

### 2. E2E Legacy Scans (24.8% Total Burn)
The E2E test helpers (`nukeAllTestUsers`, `deleteTestUser`, `debugVerifyPassword`) account for nearly a quarter of the burn.
- **Why**: These functions were performing full table scans (e.g., `ctx.db.query("users").collect()`) instead of using indexes like `isTestUser`.
- **Optimization Strategy**: Refactored to use indexed lookups.

### 3. Dashboard/Analytics Feeds (6.5% Total Burn)
Recent activity and dashboard stats account for a smaller but steady portion.
- **Why**: Periodic refreshes of activity feeds that scan global tables then filter in-memory.
- **Optimization Strategy**: Partially optimized; further improvements planned via project-specific activity indexing.

---

## 🎯 Optimization Target
After implementing the current changes, we expect a **70-80% reduction** in total bandwidth, bringing the "Sidebar Tax" from **3.5 GB** down to under **500 MB**.
