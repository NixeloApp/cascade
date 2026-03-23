# Notifications Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/notifications.tsx`
> **Last Updated**: 2026-03-23

---

## Data Flow

### Queries

| Query | Source | Purpose |
|-------|--------|---------|
| `api.notifications.list` | `usePaginatedQuery` | Active notifications with optional type filter, paginated (100 items) |
| `api.notifications.listArchived` | `useAuthenticatedQuery` | All archived notifications (no pagination) |
| `api.notifications.getUnreadCount` | `useAuthenticatedQuery` | Unread badge count |

### Mutations

| Mutation | Hook | Offline |
|----------|------|---------|
| `notifications.markAsRead` | `useOfflineNotificationMarkAsRead` | Yes — queued to IndexedDB |
| `notifications.markAllAsRead` | `useAuthenticatedMutation` | No |
| `notifications.archiveNotification` | `useAuthenticatedMutation` | No |
| `notifications.unarchiveNotification` | `useAuthenticatedMutation` | No |
| `notifications.archiveAllNotifications` | `useAuthenticatedMutation` | No |
| `notifications.snoozeNotification` | `useAuthenticatedMutation` | No |
| `notifications.softDeleteNotification` | `useAuthenticatedMutation` | No |

### State Management

```text
Route state (useState):
+-- bulkActionLoading: "markAll" | "archiveAll" | null
+-- filter: "all" | "mentions" | "assigned" | "comments" | "updates"
+-- activeTab: "inbox" | "archived"
```

### Filter to Type Mapping

```text
all       -> null (no filter, show everything)
mentions  -> ["issue_mentioned", "document_mentioned"]
assigned  -> ["issue_assigned"]
comments  -> ["issue_commented"]
updates   -> ["issue_status_changed", "sprint_started", "sprint_ended", "document_shared"]
```

Filter types are passed as the `types` arg to `api.notifications.list` — server-side filtering
so pagination works correctly across the filtered set.

### Date Grouping

Uses `date-fns` functions (`isToday`, `isYesterday`, `isThisWeek`) to bucket notifications:

```text
Today     -> isToday(date)
Yesterday -> isYesterday(date)
This Week -> isThisWeek(date, { weekStartsOn: 1 })
Older     -> everything else
```

Grouping happens client-side on the already-loaded page. Group headers are sticky (`sticky top-0 z-10`).

---

## Component Tree

```text
NotificationsPage
+-- PageLayout
|   +-- PageStack
|       +-- PageHeader (title, unread description, bulk action buttons)
|       +-- PageContent
|           +-- Tabs (inbox | archived)
|               +-- PageStack
|                   +-- PageControls
|                   |   +-- TabsList (Inbox + badge, Archived)
|                   |   +-- Filter pills (All | Mentions | Assigned | Comments | Updates)
|                   +-- Card (padding=none, wraps tab content)
|                       +-- TabsContent "inbox"
|                       |   +-- Date group headers (sticky)
|                       |   +-- NotificationItem[] (per group)
|                       +-- TabsContent "archived"
|                           +-- NotificationItem[] (flat list)
|                           +-- or EmptyState
```

---

## NotificationItem (279 lines)

Each notification row renders:

- Actor avatar (or system icon for automated notifications)
- Message text: `"[Actor] [action] [target]"` with linked entity key
- Relative timestamp (`2h ago`, `1d ago`)
- Unread indicator dot (brand color)
- Action buttons:
  - Mark as read (only for unread items)
  - Archive / Unarchive (depending on tab)
  - Overflow menu: Snooze (with duration popover), Delete

The component handles click-to-navigate: clicking the notification body
navigates to the referenced issue or document.

---

## Permissions

| Action | Required |
|--------|----------|
| View notifications | Authenticated user (own notifications only) |
| Mark as read | Authenticated user |
| Archive / snooze / delete | Authenticated user |
| Mark all read / archive all | Authenticated user |

Notifications are always scoped to the current user. No cross-user visibility.

---

## Testing

| Test File | Coverage |
|-----------|----------|
| `src/components/Notifications/NotificationItem.test.tsx` | Item rendering, actions, message formatting |
| `src/components/Notifications/NotificationCenter.test.tsx` | Popover version (header dropdown) |
| `src/hooks/useOfflineNotificationMarkAsRead.test.ts` | Offline queueing and replay |
| `e2e/screenshot-pages.ts` | `empty-notifications` + `filled-notifications` specs |
