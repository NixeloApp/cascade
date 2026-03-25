# P0: Outreach Launch Holes

> **Priority:** P0
> **Status:** Open
> **Last Updated:** 2026-03-24

This file tracks the remaining blockers before outreach should be treated as user-ready.

## Product / UX

- [ ] Build the frontend surface for sequences, enrollments, contacts, mailboxes, tracking, and analytics.
- [ ] Improve bounce handling beyond regex heuristics by parsing Gmail/DSN-style bounce signals.

## Testing

- [ ] Add send-pipeline integration coverage for pre-send validation, template rendering, tracking rewrite/injection, bounce handling, and reply matching.

## Notes

- Tracking HTTP handlers are already wired in the router and are no longer a todo item.
- Outreach OAuth state now uses DB-backed single-use expiring nonces with handler coverage for success, replay rejection, expiry, and provider errors.
- OAuth mailbox tokens are now encrypted at rest and legacy plaintext rows self-heal on runtime access.
- Mailbox sending now reserves per-minute capacity during pre-send validation and preserves migration-safe defaults for legacy mailbox rows.
- This file intentionally keeps only open blockers; completed outreach fixes belong in git history and tests, not here.
