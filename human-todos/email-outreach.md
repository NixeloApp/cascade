# Email Outreach: Lightweight Cold Email Sequences

> **Priority:** P2
> **Status:** Research Complete
> **Last Updated:** 2026-03-23
> **Context:** See `docs/research/competitors/email-outreach/` for competitor analysis,
> `docs/research/comparisons/email-outreach-landscape.md` for full landscape

## Goal

Let users connect their own mailbox, create multi-step email sequences, send up to
50 cold emails/day, and track opens/replies/bounces — all from within the platform.
No warmup, no domain rotation, no extra mailboxes needed. Their existing email is
already warm.

## Open Questions

- [ ] Which platform first — Nixelo (Convex) or StartHub (NestJS)?
- [ ] Gmail API vs raw SMTP/IMAP via nodemailer/imapflow? (Gmail API is cleaner but Google-only; SMTP/IMAP works with any provider)
- [ ] Tracking subdomain — `t.nixelo.com`? `track.starthub.academy`? Needs DNS setup.
- [ ] Where do contacts come from — CSV import only, or also manual add / platform integration?

## Libraries

Already installed: `nodemailer`, `react-email`

Evaluate before starting:

| Library | Purpose |
|:--------|:--------|
| `imapflow` | Read inbox, detect replies via IMAP |
| `mailparser` / `postal-mime` | Parse reply content, detect OOO/bounces |
| `deep-email-validator` | Verify email addresses before sending (syntax + MX + SMTP) |
| `email-reply-parser` | Strip quoted text from replies, extract new content only |
| `googleapis` (gmail) | Alternative to IMAP — Gmail API for send + read |

## Tasks

### 1. Mailbox Connection (OAuth2)

- Google Workspace OAuth2 flow (connect Gmail)
  - Scopes: `gmail.send`, `gmail.readonly` (or IMAP equivalent)
  - Token storage (encrypted at rest)
  - Token refresh logic
- Microsoft 365 OAuth2 flow (connect Outlook)
  - Same pattern, Microsoft Graph API scopes
- Mailbox health check endpoint (verify connection is alive, token valid)
- UI: "Connect your email" settings page
- Disconnect flow (revoke token, clean up)

### 2. Contact Management

- Contacts table (email, firstName, lastName, company, custom fields, status, suppression flag)
- CSV import with column mapping UI
- Deduplication on import (by email)
- Email validation on import (`deep-email-validator` — reject obviously bad addresses)
- Global suppression list (bounced + unsubscribed = never email again)
- Manual add/edit/delete contacts
- Tag/segment contacts for targeting

### 3. Sequence Builder

- Sequences table (name, steps[], status: draft/active/paused/completed)
- Step definition: content (subject, body), delay before this step (e.g. "3 business days"), variant (for A/B later)
- Template editor with personalization variables:
  - `{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{customField}}`
  - Preview with sample contact data
- Max 5 steps per sequence (MVP constraint)
- UI: drag-to-reorder steps, edit content inline, set delays between steps

### 4. Sequence Engine (core state machine)

This is the brain. Each contact enrolled in a sequence gets their own enrollment record that tracks where they are.

**Data model:**
- Enrollments table: `{ contactId, sequenceId, currentStep, status, nextSendAt, enrolledAt }`
- Status values: `active`, `replied`, `bounced`, `unsubscribed`, `completed`, `paused`
- Per-step log: `{ enrollmentId, step, sentAt, openedAt, clickedAt, repliedAt }`

**Enrollment flow:**
- User selects contacts + sequence → creates enrollment records for each
- Each enrollment starts at step 1 with `nextSendAt` = now (or scheduled time)
- Scheduled function picks up enrollments where `nextSendAt <= now` and `status = active`

**Send logic (runs per enrollment per step):**
- Check: is enrollment still `active`? (could have replied/bounced/unsubscribed since scheduling)
- Check: is contact on suppression list?
- Check: has daily send limit (50/day) been reached for this mailbox?
- If all clear → render template with contact data → send via connected mailbox
- Log the send event
- Calculate next step's `nextSendAt`:
  - Add delay (e.g. 3 business days)
  - Skip weekends
  - Adjust to recipient's business hours (if timezone known, otherwise default to sender's timezone)
  - Add small random jitter (±30 min) so sends don't look automated
- If this was the last step → mark enrollment as `completed`

**Stop conditions (checked before every send):**
- Contact replied → status = `replied`, cancel remaining steps
- Contact bounced → status = `bounced`, cancel remaining, add to suppression
- Contact unsubscribed → status = `unsubscribed`, cancel remaining, add to suppression
- User manually paused sequence → all enrollments paused
- Daily limit reached → defer to next business day (don't skip, just delay)

**Rate limiting:**
- Redis counter or Convex field: sends per mailbox per day
- Hard cap: 50/day per connected mailbox
- Per-minute throttle: max 2 sends/minute per mailbox (looks human)
- Random delay between sends: 30-120 seconds

### 5. Reply Detection

- IMAP polling (via `imapflow`) or Gmail API push notifications
- Poll frequency: every 2-5 minutes per connected mailbox
- For each new message in inbox:
  - Match to an active enrollment by: `In-Reply-To` header, `References` header, or sender email matching a contact in an active sequence
  - If match found → mark enrollment as `replied`, stop sequence
  - Parse reply content (`email-reply-parser` to strip quoted text)
  - Store reply content for display in UI
- Auto-reply detection:
  - Check headers: `Auto-Submitted: auto-replied`, `X-Auto-Response-Suppress`
  - Check body patterns: "out of office", "on vacation", "auto-reply", "I am currently away"
  - Auto-replies do NOT stop the sequence (just flag them)

### 6. Open & Click Tracking

**Open tracking:**
- Tracking pixel endpoint: `GET /t/o/{trackingId}` → returns 1x1 transparent GIF
- Inject `<img src="https://track.domain.com/t/o/{id}" width="1" height="1" />` into email HTML
- On hit: record open event with timestamp, IP, user-agent
- Set `Cache-Control: no-cache, no-store` so repeat opens are tracked
- Note: unreliable metric (Apple MPP pre-fetches, Gmail proxies) — track but don't rely on

**Click tracking:**
- Rewrite all links in email body: `https://example.com` → `https://track.domain.com/t/c/{linkId}`
- Click endpoint: `GET /t/c/{linkId}` → log click → 302 redirect to original URL
- Record: which link, which email, timestamp
- Custom tracking subdomain with SSL (required — browsers warn on HTTP redirects)
- Bot click detection: filter clicks where all links are hit within milliseconds (spam filters follow all links)

### 7. Bounce Handling

- Parse bounce/DSN emails arriving in connected mailbox (or via webhook if using Gmail API)
- Use `mailparser` to extract bounce details from `message/delivery-status` MIME parts
- Classify:
  - Hard bounce (5xx: user unknown, mailbox not found) → suppress globally, stop sequence
  - Soft bounce (4xx: mailbox full, server temp error) → retry up to 3x with backoff, then treat as hard
- Campaign-level bounce rate monitoring: if >5% of a batch bounces, alert the user

### 8. Compliance (non-negotiable, build alongside everything else)

- One-click unsubscribe header in every email (RFC 8058 `List-Unsubscribe-Post`)
  - Required by Google/Yahoo since Feb 2024
  - `List-Unsubscribe: <https://track.domain.com/unsub/{id}>`
  - `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- Unsubscribe link in email footer (visible text link as backup)
- Physical address in footer (CAN-SPAM requirement)
  - User configures their address in settings
  - Auto-injected into every outgoing sequence email
- Global suppression list checked before every send
- GDPR: store consent/legitimate-interest basis per contact (if emailing EU)

### 9. Analytics Dashboard

- Per-sequence metrics: enrolled, sent, opened, replied, bounced, unsubscribed
- Per-step funnel: how many contacts reach step 2, step 3, etc. (conversion funnel)
- Per-contact timeline: sent → opened → clicked → replied (or bounced/unsubscribed)
- Reply rate is the primary metric (not open rate — opens are unreliable)
- Mailbox health: daily send count, bounce rate, complaint rate

### 10. UI Pages

- **Sequences list** — all sequences with status, metrics summary
- **Sequence builder** — create/edit steps, delays, content, preview
- **Contacts** — import, list, search, filter by tag/status, suppression list
- **Campaign launch** — select sequence + contacts, schedule or send immediately
- **Analytics** — per-sequence funnel, per-contact timeline
- **Inbox** — view replies grouped by sequence/contact (simplified unified inbox)
- **Settings** — connect mailbox, physical address, tracking domain config

## Phase 2 Enhancements (after MVP ships)

- A/B testing (subject line + body variants per step, track which wins)
- AI email drafting (generate sequence content from a prompt using existing AI provider)
- Template library (pre-built sequences: investor outreach, partnership, customer discovery)
- Lead status CRM (interested / not interested / meeting booked / follow up later)
- Meeting integration — lead replies "yes" → suggest booking link from platform calendar

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
