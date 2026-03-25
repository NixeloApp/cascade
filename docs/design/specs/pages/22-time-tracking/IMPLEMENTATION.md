# Time Tracking Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/time-tracking.tsx`
> **Last Updated**: 2026-03-25

---

## Data Flow

### Queries

| Query | Source | Purpose |
|-------|--------|---------|
| `api.users.isOrganizationAdmin` | `useAuthenticatedQuery` | Admin gate (route redirects non-admins) |
| `api.timeTracking.getTimeEntrySummary` | `useAuthenticatedQuery` | Overview metrics (duration, count, billable value, `isTruncated`) |
| `api.timeTracking.listTimeEntries` | `useAuthenticatedQuery` | Time entries for the entries tab |
| `api.timeTracking.getBurnRate` | `useAuthenticatedQuery` | Project burn-rate summary cards |
| `api.timeTracking.getTeamCosts` | `useAuthenticatedQuery` | Team cost breakdown on the burn-rate tab |
| `api.timeTracking.listUserRates` | `useAuthenticatedQuery` | Active rate rows for the rates tab |
| `api.projects.getCurrentUserProjects` | `useAuthenticatedQuery` | Project dropdown options |
| `api.auth.loggedInUser` | `useAuthenticatedQuery` | Current user identity for rate editing |

### Mutations

| Mutation | Purpose |
|----------|---------|
| `api.timeTracking.createTimeEntry` | Log a new time entry from the shared modal |
| `api.timeTracking.startTimer` | Start a live timer from the shared modal |
| `api.timeTracking.deleteTimeEntry` | Remove an existing entry |
| `api.timeTracking.setUserRate` | Set a default or project-scoped user rate |

### State Management

```text
Route state (useState):
+-- activeTab: "entries" | "burn-rate" | "rates"
+-- selectedProject: Id<"projects"> | "all"
+-- dateRange: "week" | "month" | "all"

One-shot screenshot overrides can also bootstrap:
+-- activeTab from session storage (`burn-rate`, `rates`)
+-- dateRange from session storage (`all-time`)
+-- selectedProject to the first visible project for burn-rate review
```

Date range maps to query bounds:
```text
"week"  -> startDate = now - WEEK
"month" -> startDate = now - MONTH
"all"   -> no startDate bound
```

---

## Component Tree

```text
TimeTrackingPageRoute (route, admin gate)
+-- TimeTrackingPage (422 lines)
    +-- OverviewBand (3 summary metrics with truncation markers)
    +-- PageControls
    |   +-- Select (project filter)
    |   +-- Select (date range)
    +-- Tabs
        +-- TabsTrigger "entries" (always visible)
        +-- TabsTrigger "burn-rate" (admin)
        +-- TabsTrigger "rates" (admin)
        +-- TimeEntriesList (286 lines)
        |   +-- Grouped entry rows with delete
        |   +-- "Add Time Entry" button -> TimeEntryModal
        +-- BurnRateDashboard (277 lines)
        |   +-- Summary cards
        |   +-- Hours / billable panels
        |   +-- Team cost breakdown
        +-- UserRatesManagement (291 lines)
            +-- Active rate list with empty-state fallback
            +-- Default + project-specific rates
```

---

## Tab Visibility Logic

```text
canSeeSensitiveTabs = isGlobalAdmin || userRole === "admin"
showBurnRatePrompt = canSeeSensitiveTabs && activeTab === "burn-rate" && selectedProject === "all"
showRates = canSeeSensitiveTabs && activeTab === "rates"
```

The burn-rate tab stays visible for admins and swaps between the project-selection prompt and
the project-scoped dashboard. The rates tab stays visible and does not require a project filter.

---

## Permissions

| Action | Required Role |
|--------|---------------|
| View page | Organization admin |
| View entries | Organization admin |
| View burn rate | Organization admin + project selected |
| Manage rates | Organization admin + project selected |
| Log/edit/delete entries | Organization admin |

---

## Testing

| Test File | Coverage |
|-----------|----------|
| `TimeTrackingPage.test.tsx` | Tabs, filters, overview metrics, truncation, screenshot boot states |
| `TimeEntriesList.test.tsx` | Entry rendering, actions |
| `BurnRateDashboard.test.tsx` | Chart rendering, cost breakdown |
| `UserRatesManagement.test.tsx` | Rate table, add/edit validation, auth-gap fallback rendering |
| `TimeEntryModal.test.tsx` | Shared timer/log-time form validation and submission |
| `e2e/screenshot-pages.ts` | `filled-time-tracking` spec with burn-rate, rates, empty, all-time, truncated, and modal states |
