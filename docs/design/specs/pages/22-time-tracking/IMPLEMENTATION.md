# Time Tracking Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/time-tracking.tsx`
> **Last Updated**: 2026-03-23

---

## Data Flow

### Queries

| Query | Source | Purpose |
|-------|--------|---------|
| `api.users.isOrganizationAdmin` | `useAuthenticatedQuery` | Admin gate (route redirects non-admins) |
| `api.timeTracking.getSummary` | `useAuthenticatedQuery` | Overview metrics (duration, cost, count, isTruncated) |
| `api.timeTracking.list` | `useAuthenticatedQuery` | Time entries for the entries tab |
| `api.projects.listUserProjects` | `useAuthenticatedQuery` | Project dropdown options |

### Mutations

| Mutation | Purpose |
|----------|---------|
| `api.timeTracking.create` | Log new time entry (manual modal) |
| `api.timeTracking.update` | Edit existing entry |
| `api.timeTracking.delete` | Remove entry |
| `api.timeTracking.updateUserRate` | Set hourly rate for a user |

### State Management

```text
Route state (useState):
+-- activeTab: "entries" | "burn-rate" | "rates"
+-- selectedProject: Id<"projects"> | "all"
+-- dateRange: "week" | "month" | "all"
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
    +-- OverviewBand (4 summary metrics)
    +-- PageControls
    |   +-- Select (project filter)
    |   +-- Select (date range)
    +-- Tabs
        +-- TabsTrigger "entries" (always visible)
        +-- TabsTrigger "burn-rate" (admin + project selected)
        +-- TabsTrigger "rates" (admin + project selected)
        +-- TimeEntriesList (286 lines)
        |   +-- Entry rows with edit/delete
        |   +-- "Log Time" button -> ManualTimeEntryModal
        +-- BurnRateDashboard (277 lines)
        |   +-- Cost over time chart
        |   +-- Budget vs actual
        |   +-- Team cost breakdown
        +-- UserRatesManagement (291 lines)
            +-- Rate table with add/edit
            +-- Default + project-specific rates
```

---

## Tab Visibility Logic

```text
canSeeSensitiveTabs = isGlobalAdmin || userRole === "admin"
showBurnRate = canSeeSensitiveTabs && selectedProject !== "all"
showRates = canSeeSensitiveTabs && selectedProject !== "all"
```

When tabs are hidden, `activeTab` falls back to "entries" automatically.

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
| `TimeTrackingPage.test.tsx` | Tabs, filters, overview metrics, truncation |
| `TimeEntriesList.test.tsx` | Entry rendering, actions |
| `BurnRateDashboard.test.tsx` | Chart rendering, cost breakdown |
| `UserRatesManagement.test.tsx` | Rate table, add/edit validation |
| `ManualTimeEntryModal.test.tsx` | Form validation, submission |
| `TimeEntryModal.test.tsx` | Edit form, validation |
| `e2e/screenshot-pages.ts` | `filled-time-tracking` spec |
