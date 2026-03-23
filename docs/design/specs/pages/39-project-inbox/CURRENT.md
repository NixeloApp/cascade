# Project Inbox Page - Current State

> **Route**: `/:slug/projects/:key/inbox`
> **Last Updated**: 2026-03-23

## Purpose

Triage queue for incoming issues. Issues arrive via the external intake API or email-to-inbox pipeline.

## Layout

- Tabs: Open (pending + snoozed) | Closed (accepted + declined + duplicate)
- Issue count badges per tab
- Selection checkboxes for bulk actions
- Bulk action bar: Accept all, Decline all, Snooze 1 week
- Per-issue row with status icon, title, submitter info, metadata

## Per-Issue Actions

- Accept (moves to project backlog)
- Decline (with optional reason)
- Snooze / Unsnooze (defers triage)
- Mark as duplicate (link to existing issue)
- Reopen (from closed tab)
- Remove

## States

- **Loading**: skeleton list
- **Empty open tab**: EmptyState "No issues awaiting triage"
- **Empty closed tab**: EmptyState "No resolved inbox items"
- **Populated**: rows with status badges and metadata
- **Selected**: checkbox active, bulk action bar visible
