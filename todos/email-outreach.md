# Email Outreach

> **Priority:** P2
> **Status:** Gmail-first MVP shipped; polish and expansion remain
> **Last Updated:** 2026-03-25

## Current State

- Gmail-first Convex backend exists for mailboxes, sequences, enrollments, tracking, analytics, and send/reply processing.
- The app now ships an organization-level outreach workspace for mailbox connection, sequence building, contact import and management, enrollment control, tracking timelines, and analytics.
- The outreach route now has first-class page-spec coverage and reviewed screenshots for the canonical workspace plus sequences, contacts, mailboxes, and analytics tab states.
- The implementation currently uses Gmail REST APIs, not SMTP/IMAP as the primary path.
- Mailboxes now enforce both daily send caps and minute-window throttling before outbound sends start.
- Gmail inbox polling now parses DSN-style bounce notifications and suppresses failed recipients automatically.
- The send/reply pipeline now has integration coverage for pre-send suppression, template rendering, tracking rewrite, successful sends, hard bounces, and mailbox-scoped reply matching.
- Security and launch blockers are tracked in [p0-outreach-holes.md](./p0-outreach-holes.md).

## Remaining Work

- [ ] Contact import dedup UX and richer validation feedback for larger CSV uploads.
- [ ] Better per-contact and per-sequence analytics views beyond the current operational dashboard.
- [ ] Outlook / Microsoft 365 mailbox connection and send path, if multi-provider outreach stays in scope.
- [ ] Deliverability monitoring and mailbox warmup strategy if outbound volume increases.

## Deferred

- [ ] Multiple mailbox rotation.
- [ ] Warmup network.
- [ ] A/B testing.
- [ ] Unified inbox.
- [ ] AI drafting.
