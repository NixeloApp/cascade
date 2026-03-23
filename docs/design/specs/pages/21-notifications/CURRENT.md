# Notifications Page - Current State

> **Route**: `/:slug/notifications`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-23

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Purpose

The notifications page is the full-page notification hub. It answers:

1. What happened while I was away?
2. Which notifications need my attention right now?
3. Can I quickly clear, snooze, or archive things I've already seen?
4. What did I archive earlier?

This is the expanded version of the header notification popover. It provides date grouping,
category filtering, bulk actions, and an archive tab that the popover does not.

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Additional state captures

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|-------|-------------|---------------|--------------|--------------|
| Filter active | `desktop-dark-filter-active.png` | — | `tablet-light-filter-active.png` | `mobile-light-filter-active.png` |
| Archived tab | — | `desktop-light-archived.png` | — | `mobile-light-archived.png` |
| Snooze popover | `desktop-dark-snooze-popover.png` | `desktop-light-snooze-popover.png` | `tablet-light-snooze-popover.png` | `mobile-light-snooze-popover.png` |

### Missing captures (should be added)

- Empty inbox state ("You're all caught up")
- Empty archive state
- Bulk "Mark all read" in progress (loading state)
- Unread badge showing 99+

---

## Route Anatomy

```text
+------------------------------------------------------------------------------+
| Global app shell                                                             |
| sidebar + top utility bar                                                    |
+------------------------------------------------------------------------------+
| Notifications route                                                          |
|                                                                              |
|  PageHeader                                                                  |
|  "Notifications" + "3 unread notifications"                                  |
|                                      [Mark all read] [Archive all]           |
|                                                                              |
|  PageControls                                                                |
|  +------------------+  +-----------------------------------------------+    |
|  | Inbox (3) | Arch |  | [All] [Mentions] [Assigned] [Comments] [Upd]  |    |
|  +------------------+  +-----------------------------------------------+    |
|                                                                              |
|  Card (notification list)                                                    |
|  +--------------------------------------------------------------------------+|
|  | Today                                                       (sticky hdr) ||
|  |--------------------------------------------------------------------------|
|  | * Issue PROJ-42 was assigned to you          2h ago    [Read][Arch][...]  ||
|  | * @you was mentioned in PROJ-18              4h ago    [Read][Arch][...]  ||
|  |--------------------------------------------------------------------------|
|  | Yesterday                                               (sticky hdr)     ||
|  |--------------------------------------------------------------------------|
|  | o Sprint "Week 12" started                   1d ago    [Arch][...]       ||
|  |--------------------------------------------------------------------------|
|  | This Week                                               (sticky hdr)     ||
|  |--------------------------------------------------------------------------|
|  | o Status changed on PROJ-7                   3d ago    [Arch][...]       ||
|  +--------------------------------------------------------------------------+|
|                                                                              |
+------------------------------------------------------------------------------+

  * = unread (bold, dot indicator)
  o = read (normal weight)
  [...] = overflow menu: snooze, delete
```

---

## Current Composition

### 1. Route shell

- Route lives under `_auth/_app/$orgSlug`.
- Inherits standard app shell. Uses `PageLayout` / `PageStack` / `PageHeader`.
- No route-specific decorative overrides.

### 2. Header

- Title: "Notifications"
- Dynamic description: `"3 unread notifications"` or `"You're all caught up"`
- Actions (visible only on inbox tab):
  - "Mark all read" button (ghost variant) with CheckCheck icon — only when unread > 0
  - "Archive all" button (ghost variant) with Archive icon — only when notifications > 0
- Both actions show loading spinners during execution. Disabled while any bulk action runs.

### 3. Tab bar and filters

- `Tabs` with two triggers:
  - **Inbox** — with unread count badge (brand pill, "99+" cap)
  - **Archived** — with Archive icon
- Filter pills (inbox tab only): All | Mentions | Assigned | Comments | Updates
  - Each maps to backend notification type(s) via `FILTER_TYPE_MAP`
  - "All" sends no type filter. Others send specific types as query args.
  - Uses `chrome="filter"` / `chrome="filterActive"` for selected state.

### 4. Notification list (inbox)

- Date-grouped using `date-fns`: Today, Yesterday, This Week, Older
- Each group has a sticky header (`sticky top-0 z-10`, secondary background)
- Notifications within groups are separated by `divide-y`
- Each `NotificationItem` (279 lines) renders:
  - Actor avatar
  - Message text with linked issue/document key
  - Relative timestamp
  - Action buttons: Mark as read, Archive, overflow (snooze, delete)
- Unread items: bold text, unread indicator dot
- Snoozed items: snooze icon with "snoozed until" tooltip

### 5. Notification list (archived)

- Flat list (no date grouping)
- Same `NotificationItem` component but with "Unarchive" instead of "Archive"
- No snooze action in archived tab
- Empty state: "No archived notifications" with Archive icon

### 6. Offline support

- Mark-as-read uses `useOfflineNotificationMarkAsRead` hook
- Queued to IndexedDB when offline, replayed on reconnect
- Other actions (archive, snooze, delete) require network

---

## State Coverage

### States the current spec explicitly covers

- Filled inbox with date groups (4 viewports, 2 themes)
- Filter active showing subset (3 viewports)
- Archived tab with items (2 viewports)
- Snooze popover open (4 viewports)

### States intentionally not over-specified here

- Empty inbox ("You're all caught up")
- Empty archive
- Bulk action loading states
- 99+ unread badge overflow
- Individual notification hover states
- Snooze duration picker interaction

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Date grouping | Clear temporal context without manual sorting. Sticky headers work well on scroll. |
| Filter pills | Fast category switching without a dropdown. Server-side filtering is correct. |
| Offline resilience | Mark-as-read works offline. Users don't lose read state during blips. |
| Bulk actions | Mark all read and archive all are one-click operations with loading feedback. |
| Tab separation | Inbox vs archived is clean. No mixing of active and resolved items. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Large initial page size (100 items) — could be slow for users with many notifications. No pagination UI; relies on Convex reactive updates. | performance | MEDIUM |
| 2 | Archived notifications query (`listArchived`) loads all at once, no pagination. | performance | MEDIUM |
| 3 | No search within notifications — must use filter pills or scan visually. | UX | LOW |
| 4 | Snooze duration options are in a popover but the interaction is not captured in the canonical screenshots. | screenshot gap | LOW |

---

## Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/routes/_auth/_app/$orgSlug/notifications.tsx` | 380 | Route: layout, tabs, filters, date grouping, bulk actions |
| `src/components/Notifications/NotificationItem.tsx` | 279 | Single notification row with actions |
| `src/components/Notifications/NotificationCenter.tsx` | 316 | Header popover version (not used on this page) |
| `src/hooks/useOfflineNotificationMarkAsRead.ts` | — | Offline-capable mark-as-read hook |
| `convex/notifications.ts` | — | Backend: list, markAsRead, archive, snooze, delete |
| `e2e/screenshot-pages.ts` | — | `empty-notifications` + `filled-notifications` specs |

---

## Review Guidance

- The date grouping with sticky headers is the right pattern. Do not flatten to a plain list.
- The filter pills pattern is correct. Do not replace with a dropdown or modal filter.
- If notification volume becomes a problem, add pagination to the inbox query, do not
  reduce the initial page size below a useful threshold.
- The archived tab should remain a separate tab, not a filter within the inbox.
- Do not add real-time notification sounds or alerts on this page — that belongs at the
  app shell level (header popover + push notifications).

---

## Summary

The notifications page is a mature, well-structured notification hub. Date grouping, category
filtering, bulk actions, offline mark-as-read, and tab separation all work as intended. The
main gaps are pagination for the archived tab and the lack of search within notifications.
The page uses standard layout primitives and does not need shell or composition rework.
