# Notifications Page - Current State

> **Route**: `/:slug/notifications`
> **Last Updated**: 2026-03-23

## Purpose

Central notification hub for all user notifications across the organization.

## Layout

- Tabs: Inbox | Archived
- Filter pills: All, Mentions, Assigned, Comments, Updates
- Bulk actions bar: Mark all read, Archive all
- Notification list grouped by date (Today, Yesterday, This Week, Older)
- Unread count badge on Inbox tab

## Per-Notification Actions

- Mark as read / unread
- Archive
- Snooze (with duration picker)
- Delete

## States

- **Loading**: skeleton list
- **Empty**: EmptyState per tab ("No notifications" / "No archived notifications")
- **Unread**: bold text, unread indicator dot
- **Snoozed**: snooze icon with resume timestamp
- **Filtered**: subset matching selected category
