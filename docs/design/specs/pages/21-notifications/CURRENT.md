# Notifications Page - Current State

> **Route**: `/:slug/notifications`
> **Status**: REVIEWED
> **Last Updated**: 2026-03-25

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
| Filter active | `desktop-dark-filter-active.png` | `desktop-light-filter-active.png` | `tablet-light-filter-active.png` | `mobile-light-filter-active.png` |
| Archived tab | `desktop-dark-archived.png` | `desktop-light-archived.png` | `tablet-light-archived.png` | `mobile-light-archived.png` |
| Snooze popover | `desktop-dark-snooze-popover.png` | `desktop-light-snooze-popover.png` | `tablet-light-snooze-popover.png` | `mobile-light-snooze-popover.png` |
| Inbox empty state | `desktop-dark-inbox-empty.png` | `desktop-light-inbox-empty.png` | `tablet-light-inbox-empty.png` | `mobile-light-inbox-empty.png` |
| Archived empty state | `desktop-dark-archived-empty.png` | `desktop-light-archived-empty.png` | `tablet-light-archived-empty.png` | `mobile-light-archived-empty.png` |
| Mark all read loading | `desktop-dark-mark-all-read-loading.png` | `desktop-light-mark-all-read-loading.png` | `tablet-light-mark-all-read-loading.png` | `mobile-light-mark-all-read-loading.png` |
| 99+ unread badge | `desktop-dark-unread-overflow.png` | `desktop-light-unread-overflow.png` | `tablet-light-unread-overflow.png` | `mobile-light-unread-overflow.png` |

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
- E2E route override can force the mark-all-read loading state without mutating live UI flow.

### 3. Tab bar and filters

- `Tabs` with two triggers:
  - **Inbox** — with unread count badge (brand pill, "99+" cap)
  - **Archived** — with Archive icon
- Filter pills (inbox tab only): All | Mentions | Assigned | Comments | Updates
  - Each maps to backend notification type(s) via `FILTER_TYPE_MAP`
  - "All" sends no type filter. Others send specific types as query args.
  - Uses `chrome="filter"` / `chrome="filterActive"` for selected state.
- E2E screenshot bootstrap can force the archived tab on first render for deterministic archived-empty capture.

### 4. Notification list (inbox)

- Date-grouped using `date-fns`: Today, Yesterday, This Week, Older
- Each group has a sticky header (`sticky top-0 z-10`, secondary background)
- Notifications within groups are separated by `divide-y`
- Each `NotificationItem` (279 lines) renders:
  - Actor avatar
  - Message text with linked issue/document key
  - Relative timestamp
  - Responsive action cluster:
    - mobile: compact footer action bar beneath the content
    - tablet/desktop: right-hand action rail
    - actions: Mark as read, Archive, overflow (snooze, delete)
- Unread items: bold text, unread indicator dot
- Snoozed items: snooze icon with "snoozed until" tooltip
- Empty inbox states now branch intentionally:
  - active filter with no matches → "No matching notifications" + clear-filter action
  - truly empty inbox with archived history → "You're all caught up" + view-archived action
  - truly empty inbox with no archive → passive empty state only

### 5. Notification list (archived)

- Flat list (no date grouping)
- Same `NotificationItem` component but with "Unarchive" instead of "Archive"
- No snooze action in archived tab
- Empty state: "No archived notifications" with Archive icon and a "View inbox" recovery action when active inbox items exist

### 6. Offline support

- Mark-as-read uses `useOfflineNotificationMarkAsRead` hook
- Queued to IndexedDB when offline, replayed on reconnect
- Other actions (archive, snooze, delete) require network

---

## State Coverage

### States the current spec explicitly covers

- Filled inbox with date groups (4 viewports, 2 themes)
- Filter active showing subset (4 viewports)
- Archived tab with items (4 viewports)
- Snooze popover open (4 viewports)
- Inbox empty ("You're all caught up") with recovery action when archive exists
- Archived empty state with recovery action when inbox still has items
- Bulk "Mark all read" loading state
- 99+ unread badge overflow

### States intentionally not over-specified here

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
| Empty-state recovery | Empty inbox/archive states now point users back to the next useful place instead of dead-ending. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| ~~1~~ | ~~Large initial page size, no pagination~~ **Fixed** — reduced to 25 items with "Load more" button (loads 25 more each click) | ~~performance~~ | ~~MEDIUM~~ |
| ~~2~~ | ~~Archived notifications load all at once~~ **Fixed** — converted to `fetchPaginatedQuery` with `paginationOpts`; frontend uses `usePaginatedQuery` with 25 items initially and "Load more archived" button | ~~performance~~ | ~~MEDIUM~~ |
| 3 | No search within notifications — must use filter pills or scan visually. | UX | LOW |
| ~~4~~ | ~~Snooze duration options are in a popover but the interaction is not captured in the canonical screenshots.~~ **Fixed** — canonical-plus-state matrix now covers snooze popover, archive tab, filter state, both empty tabs, unread overflow, and mark-all-read loading across the reviewed viewport set | ~~screenshot gap~~ | ~~LOW~~ |

---

## Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/routes/_auth/_app/$orgSlug/notifications.tsx` | 512 | Route: layout, tabs, filters, date grouping, bulk actions, empty-state recovery, E2E overrides |
| `src/components/Notifications/NotificationItem.tsx` | 279 | Single notification row with actions |
| `src/components/Notifications/NotificationCenter.tsx` | 316 | Header popover version (not used on this page) |
| `src/hooks/useOfflineNotificationMarkAsRead.ts` | — | Offline-capable mark-as-read hook |
| `convex/notifications.ts` | — | Backend: list, markAsRead, archive, snooze, delete |
| `convex/e2e.ts` | — | Deterministic seeded notification screenshot states |
| `e2e/pages/notifications.page.ts` | 73 | Notification route screenshot/page-object selectors |
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
filtering, bulk actions, offline mark-as-read, tab separation, and empty-state recovery all work
as intended. The screenshot/spec matrix now covers the route’s important tab, popover, empty,
loading, and overflow states across desktop/tablet/mobile. The main remaining product gap is the
lack of search within notifications, not route credibility or screenshot depth.
