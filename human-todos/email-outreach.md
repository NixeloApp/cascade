# Email Outreach: Lightweight Cold Email Sequences

> **Priority:** P2
> **Status:** Backend Complete + Tested — Frontend Pending
> **Last Updated:** 2026-03-24
> **Context:** See `docs/research/competitors/email-outreach/` for competitor analysis,
> `docs/research/comparisons/email-outreach-landscape.md` for full landscape

## Goal

Let users connect their own mailbox, create multi-step email sequences, send up to
50 cold emails/day, and track opens/replies/bounces — all from within the platform.
No warmup, no domain rotation, no extra mailboxes needed. Their existing email is
already warm.

## Decisions Made

- [x] Platform: **Nixelo (Convex)** — not StartHub
- [x] Gmail API (not SMTP/IMAP) — cleaner, already have OAuth tokens, no extra libraries
- [x] Contacts: CSV import + manual add
- [ ] Tracking subdomain — needs DNS setup (`t.nixelo.com` or similar)

## Backend Implementation

All backend code lives in `convex/outreach/` + `convex/http/outreachOAuth.ts`.

### 1. Schema & Validators — DONE
- [x] 7 tables: `outreachMailboxes`, `outreachContacts`, `outreachSuppressions`, `outreachSequences`, `outreachEnrollments`, `outreachEvents`, `outreachTrackingLinks`
- [x] 6 enum validators + 3 object validators + 9 type exports
- [x] All indexes for efficient queries
- **Files:** `convex/schema.ts`, `convex/validators/index.ts`

### 2. Mailbox Connection (OAuth2) — DONE
- [x] Gmail OAuth2 flow (initiate + callback)
- [x] Scopes: `gmail.send`, `gmail.readonly`, `userinfo.email`, `userinfo.profile`
- [x] Token storage in `outreachMailboxes` table
- [x] Token auto-refresh before expiry
- [x] Disconnect flow (deactivate, clear tokens)
- [x] Daily send limit management (default 50)
- [x] Tokens stripped from client responses (never sent to frontend)
- [ ] Microsoft 365 OAuth2 flow (deferred — Gmail first)
- [ ] UI: "Connect your email" settings page
- **Files:** `convex/http/outreachOAuth.ts`, `convex/outreach/mailboxes.ts`

### 3. Contact Management — DONE
- [x] CRUD (create, read, update, delete)
- [x] CSV batch import with deduplication
- [x] Suppression list check on import (skip suppressed emails)
- [x] Email normalization (lowercase, trim)
- [x] Custom fields for `{{variable}}` templates
- [x] Tags for segmentation
- [x] Org-scoped access control
- [x] Prevent deleting contacts with active enrollments
- [ ] Email validation on import (`deep-email-validator` — syntax + MX check)
- [ ] UI: contacts list, import, edit, tag management
- **Files:** `convex/outreach/contacts.ts`

### 4. Sequence Builder — DONE
- [x] CRUD (create, edit, activate, pause, delete)
- [x] Step validation (1-5 steps, first step delay=0, CAN-SPAM address required)
- [x] Status transitions: draft → active ↔ paused → completed
- [x] Mailbox validation (must be active to activate sequence)
- [x] Block editing active sequences (must pause first)
- [x] Block deleting sequences with active enrollments
- [x] Cached stats on sequence record for fast dashboard reads
- [ ] UI: sequence builder, step editor, preview
- **Files:** `convex/outreach/sequences.ts`

### 5. Sequence Engine (state machine) — DONE
- [x] Enrollment state machine: active → replied | bounced | unsubscribed | completed | paused
- [x] Batch enrollment with dedup + suppression checks
- [x] Business day scheduling (skip weekends)
- [x] Random jitter on send times (±30 min)
- [x] Business hours targeting (9-17 UTC, randomized)
- [x] Pre-send validation (suppression, daily limit, mailbox health, step exists)
- [x] Cron: process due enrollments every 2 minutes
- [x] Rate limiting: 50/day per mailbox, max 20 sends per cron batch
- [x] Deferred retry on failed pre-checks (15 min backoff)
- **Files:** `convex/outreach/enrollments.ts`, `convex/outreach/sendEngine.ts`

### 6. Gmail Sending — DONE
- [x] Send via Gmail REST API (not SMTP)
- [x] RFC 2822 message construction (From, To, Subject, MIME multipart)
- [x] Base64url encoding (Gmail API requirement)
- [x] Plain text + HTML alternatives
- [x] Compliance headers injected: `List-Unsubscribe`, `List-Unsubscribe-Post` (RFC 8058)
- [x] Custom `X-Nixelo-Enrollment` header for reply matching
- [x] Token auto-refresh before sending
- [x] Header injection protection (CR/LF sanitization on all header values)
- [x] Gmail thread ID captured on send (used for reply correlation)
- [x] Encrypted token storage at rest (transparent encrypt/decrypt via `mailboxTokens.ts`)
- **Files:** `convex/outreach/gmail.ts`, `convex/outreach/mailboxTokens.ts`

### 7. Reply Detection — DONE
- [x] Gmail API polling (list recent unread → check sender against active enrollments)
- [x] Cron: poll all active mailboxes every 5 minutes
- [x] Match reply to enrollment by sender email + active enrollment lookup
- [x] Auto-stop sequence on reply, record reply event, update stats
- [x] Auto-reply detection (OOO filtering) — checks `Auto-Submitted`, `X-Auto-Response-Suppress`, `Precedence` headers + body patterns
- [x] Gmail thread ID correlation (replies matched by thread, not just sender email)
- [x] Paginated polling (up to 5 pages per mailbox per cycle)
- [x] Watermark-based polling (only checks messages since last successful poll)
- [ ] Reply content extraction and storage — not yet implemented
- **Files:** `convex/outreach/gmail.ts`, `convex/outreach/helpers.ts`

### 8. Open & Click Tracking — DONE
- [x] Open pixel endpoint: `GET /t/o/{enrollmentId}` → 1x1 transparent GIF
- [x] Click redirect endpoint: `GET /t/c/{linkId}` → 302 redirect to original URL
- [x] Event logging (enrollment, sequence, contact, step, timestamp)
- [x] First-open-only stat counting (no inflation)
- [x] `Cache-Control: no-cache, no-store` on pixel
- [x] Convex ID validation on all tracking endpoints
- [x] Click tracking link injection — URLs rewritten in pre-send, `outreachTrackingLinks` records created
- [x] Open tracking pixel injection — pixel appended to email body in pre-send
- **Files:** `convex/outreach/tracking.ts`, `convex/outreach/helpers.ts`, `convex/router.ts`

### 9. Bounce Handling — DONE
- [x] Hard bounce detection via error message pattern matching (550, user not found, etc.)
- [x] Enrollment stopped on hard bounce, added to suppression
- [x] Sequence bounce stats incremented
- [x] Soft bounce (transient errors) deferred for retry (15 min backoff)
- [x] Encrypted token storage for mailbox credentials
- [ ] DSN message parsing (structured bounce classification) — deferred
- [ ] Campaign-level bounce rate alerting — deferred

### 10. Compliance — DONE
- [x] `List-Unsubscribe` + `List-Unsubscribe-Post` headers on every email (RFC 8058)
- [x] Unsubscribe endpoints: GET (page) + POST (one-click) at `/t/u/{enrollmentId}`
- [x] Visible unsubscribe link in email footer
- [x] Physical address in email footer (CAN-SPAM)
- [x] Global suppression list checked before every send
- [x] Idempotent unsubscribe (safe to click multiple times)
- **Files:** `convex/outreach/tracking.ts`, `convex/outreach/sendEngine.ts`

### 11. Analytics — DONE
- [x] Per-sequence stats (enrolled, sent, opened, replied, bounced, unsubscribed)
- [x] Per-step funnel (how many contacts reach each step)
- [x] Per-contact timeline (all events in order)
- [x] Organization overview (aggregate across all sequences)
- [x] Mailbox health (send count, remaining capacity, active status)
- [x] Rate calculations (open rate, reply rate, bounce rate, unsubscribe rate)
- [ ] UI: analytics dashboard, funnel charts, timeline view
- **Files:** `convex/outreach/analytics.ts`

### 12. Crons — DONE
- [x] Process due outreach sends — every 2 minutes
- [x] Poll mailbox replies — every 5 minutes
- [x] Reset daily send counts — daily at midnight UTC
- **File:** `convex/crons.ts`

### 13. HTTP Routes — DONE
- [x] `GET /outreach/google/auth` — initiate Gmail OAuth
- [x] `GET /outreach/google/callback` — handle Gmail OAuth callback
- [x] `GET /t/o/{id}` — open tracking pixel
- [x] `GET /t/c/{id}` — click tracking redirect
- [x] `GET /t/u/{id}` — unsubscribe page
- [x] `POST /t/u/{id}` — RFC 8058 one-click unsubscribe
- **File:** `convex/router.ts`

---

## What's Left: Frontend Only

### UI Pages Needed

- [ ] **Settings → Connect Mailbox** — "Connect Gmail" button opens OAuth popup, postMessage listener saves tokens via `createMailbox` mutation
- [ ] **Contacts page** — list, import CSV, manual add, search, filter by tag, suppression list view
- [ ] **Sequences list** — all sequences with status badges and stats summary
- [ ] **Sequence builder** — create/edit steps, set delays, template editor with `{{variable}}` support, preview with sample data
- [ ] **Campaign launch** — select sequence + contacts, schedule or send now
- [ ] **Analytics** — per-sequence funnel chart, per-contact timeline, mailbox health indicators
- [ ] **Inbox** — view replies grouped by sequence/contact (simplified unified inbox)

### Wiring Needed

- [x] ~~Inject open tracking pixel into email HTML body~~ — done in `helpers.ts` + `sendEngine.ts`
- [x] ~~Rewrite links in email body for click tracking~~ — done in `helpers.ts` + `sendEngine.ts`
- [ ] Frontend postMessage handler for OAuth popup callback → call `createMailbox` mutation
- [ ] Tracking subdomain DNS setup (`t.nixelo.com` → Convex site URL)

---

## Phase 2 Enhancements (after MVP ships)

- A/B testing (subject line + body variants per step, track which wins)
- AI email drafting (generate sequence content from a prompt using existing AI provider)
- Template library (pre-built sequences: investor outreach, partnership, customer discovery)
- Lead status CRM (interested / not interested / meeting booked / follow up later)
- Meeting integration — lead replies "yes" → suggest booking link from platform calendar
- Reply content extraction and display
- Microsoft Outlook OAuth support

## Deferred to Post-MVP (1+ year)

See `todos-post-mvp/email-outreach-scale.md` for:
- Multi-mailbox + account rotation
- Warmup network (needs 5K+ users)
- Deliverability monitoring
- Multichannel (LinkedIn, phone)

## Not In Scope

- Building a warmup network (needs massive user base — buy or defer)
- Domain rotation (overkill for 50/day)
- B2B lead database (not our product — users bring their own contacts)
- Phone/SMS/LinkedIn outreach (Phase 3+)
