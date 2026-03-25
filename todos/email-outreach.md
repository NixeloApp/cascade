# Email Outreach

> **Priority:** P2
> **Status:** Backend-first, not product-ready
> **Last Updated:** 2026-03-24

## Current State

- Gmail-first Convex backend exists for mailboxes, sequences, enrollments, tracking, analytics, and send/reply processing.
- The implementation currently uses Gmail REST APIs, not SMTP/IMAP as the primary path.
- Mailboxes now enforce both daily send caps and minute-window throttling before outbound sends start.
- Gmail inbox polling now parses DSN-style bounce notifications and suppresses failed recipients automatically.
- The send/reply pipeline now has integration coverage for pre-send suppression, template rendering, tracking rewrite, successful sends, hard bounces, and mailbox-scoped reply matching.
- User-facing workflow is still missing because there is no frontend surface yet.
- Security and launch blockers are tracked in [p0-outreach-holes.md](./p0-outreach-holes.md).

## Remaining MVP Work

### Product UI

- [ ] Mailbox connection and health UI.
- [ ] Sequence builder UI.
- [ ] Contact import and management UI.
- [ ] Enrollment / campaign management UI.
- [ ] Tracking and analytics UI.

### Feature Gaps

- [ ] CSV import and dedup UX.
- [ ] Better per-contact and per-sequence analytics views.
- [ ] Outlook / Microsoft 365 path, if we still want multi-provider outreach in MVP scope.

## Deferred

- [ ] Multiple mailbox rotation.
- [ ] Warmup network.
- [ ] Deliverability monitoring.
- [ ] A/B testing.
- [ ] Unified inbox.
- [ ] AI drafting.
