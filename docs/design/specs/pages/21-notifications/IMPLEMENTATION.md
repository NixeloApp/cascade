# Notifications Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/notifications.tsx`

## Data

- `api.notifications.list` — paginated, filterable by read status and type
- `api.notifications.markAsRead` / `markAllAsRead`
- `api.notifications.archive` / `archiveAll`
- `api.notifications.snooze` / `delete`
- Offline replay: `notifications.markAsRead` queued via IndexedDB

## Components

| Component | Location |
|-----------|----------|
| NotificationsPage | `src/routes/_auth/_app/$orgSlug/notifications.tsx` |
| NotificationItem | `src/components/Notifications/NotificationItem.tsx` |
| NotificationCenter | `src/components/Notifications/NotificationCenter.tsx` |

## Offline Support

- Mark-as-read is offline-capable (queued to IndexedDB, replayed on reconnect)
- Other actions require network
