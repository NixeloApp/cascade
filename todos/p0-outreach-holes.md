# P0: Outreach Security & Correctness Holes

> **Priority:** P0
> **Status:** Open — must fix before any user touches outreach
> **Created:** 2026-03-25

## Context

The outreach module was merged to main (PR #928) with known P1 issues. PR #929 fixes most of them but introduced its own review comments. This doc tracks every known hole.

## Fixed in PR #929 (pending merge)

All items below are fixed and pushed. Merge #929 to resolve.

- [x] OAuth tokens no longer sent to browser — server-side storage via internal mutation
- [x] HMAC-signed OAuth state — userId/organizationId can't be forged
- [x] Click tracking uses Convex document `_id`s, not random UUIDs
- [x] Reply correlation uses `gmailThreadIds` array (not overwritten per step)
- [x] Transient send errors deferred (not hard-bounced)
- [x] RFC 2822 header injection prevention (CR/LF stripped)
- [x] Tracking domain passed through call chain (not hardcoded)
- [x] Tracking domain sanitized before header interpolation
- [x] Gmail pagination follows nextPageToken (up to 250 messages)
- [x] Watermark only advances on fully completed polls
- [x] Empty inbox polls still advance watermark (quiet mailboxes don't re-query 24h)
- [x] OAuth response has Cache-Control: no-store
- [x] OAuth postMessage restricted to SITE_URL origin
- [x] Regex metacharacter escaping in custom field template keys
- [x] `is:unread` removed from reply polling query
- [x] createMailboxFromOAuth validates userId/organizationId exist in DB

## Still Open — Must Fix

### Security

- [ ] **OAuth state should use DB-stored nonces, not just HMAC** — Current HMAC approach signs userId+orgId with the Google client secret. This works but a dedicated `oauthStates` table with expiring nonces (as described in the research doc) would be more robust. The HMAC has no expiry — a signed state URL could theoretically be replayed.
- [ ] **Token encryption at rest** — OAuth access/refresh tokens are stored as plaintext strings in the `outreachMailboxes` table. Industry standard is AES-256 encryption with a server-side key (env var). If the DB is compromised, all connected Gmail accounts are exposed.

### Correctness

- [ ] **No frontend UI exists** — The entire outreach module (sequences, enrollments, contacts, mailboxes, tracking, analytics, gmail, send engine) has zero frontend components. Users can't create sequences, connect mailboxes, or manage contacts. The backend is complete but untestable without UI.
- [ ] **Click tracking redirect handler not wired** — The `handleClickRedirect` HTTP handler exists but may not be registered in the HTTP router. Needs verification.
- [ ] **Open tracking pixel handler not wired** — Same as above for `handleOpenPixel`.
- [ ] **Unsubscribe handler not wired** — Same for `handleUnsubscribeGet`/`handleUnsubscribePost`.
- [ ] **No rate limiting on send engine** — The cron processes up to 20 enrollments per tick with no per-mailbox rate limiting beyond the daily cap. Gmail's per-minute sending limits could be hit.
- [ ] **No bounce classification beyond pattern matching** — Hard bounce detection uses regex patterns. Should integrate with Gmail's bounce notification parsing (DSN messages) for accuracy.

### Testing

- [ ] **No integration tests for the send pipeline** — Unit tests only verify module exports. Need tests for: checkPreSend validation, template rendering with custom fields, click tracking URL rewriting, open pixel injection, bounce classification, reply matching with thread IDs.
- [ ] **No E2E test for OAuth flow** — The popup-based OAuth flow can't be tested without a mock Google OAuth server.

## Out of Scope (Post-MVP)

- Email warmup network
- Domain management (SPF/DKIM/DMARC wizard)
- A/B testing
- AI-powered email writing
- Unified inbox
- Microsoft Outlook support
