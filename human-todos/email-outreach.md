# Email Outreach: Lightweight Cold Email Sequences

> **Priority:** P2
> **Status:** Backend Complete + Tested (89 tests) — Frontend Pending
> **Last Updated:** 2026-03-27
> **Context:** See `docs/research/competitors/email-outreach/` for competitor analysis,
> `docs/research/comparisons/email-outreach-landscape.md` for full landscape

## Goal

Let users connect their own mailbox, create multi-step email sequences, send up to
50 cold emails/day, and track opens/replies/bounces — all from within the platform.
No warmup, no domain rotation, no extra mailboxes needed. Their existing email is
already warm.

## Backend

Done. All code in `convex/outreach/` + `convex/http/outreachOAuth.ts`.

13 modules: `contacts.ts`, `sequences.ts`, `enrollments.ts`, `sendEngine.ts`,
`gmail.ts`, `tracking.ts`, `analytics.ts`, `mailboxes.ts`, `helpers.ts`,
`mailboxTokens.ts`, `mailboxRateLimits.ts`, `oauthNonces.ts` + `http/outreachOAuth.ts`

## What's Left

### Setup

- [ ] Tracking subdomain DNS (`t.nixelo.com` → Convex site URL)
- [ ] Microsoft 365 OAuth (deferred — Gmail only for now)
- [ ] Email validation on contact import (`deep-email-validator` — syntax + MX check)

### Frontend

- [ ] **Settings → Connect Mailbox** — "Connect Gmail" button opens OAuth popup, postMessage listener saves tokens via `createMailbox` mutation
- [ ] **Contacts page** — list, import CSV, manual add, search, filter by tag, suppression list view
- [ ] **Sequences list** — all sequences with status badges and stats summary
- [ ] **Sequence builder** — create/edit steps, set delays, template editor with `{{variable}}` support, preview with sample data
- [ ] **Campaign launch** — select sequence + contacts, schedule or send now
- [ ] **Analytics** — per-sequence funnel chart, per-contact timeline, mailbox health indicators
- [ ] **Inbox** — view replies grouped by sequence/contact (simplified unified inbox)
- [ ] Frontend postMessage handler for OAuth popup callback

### Backend (nice-to-have, not blocking)

- [ ] Reply content extraction and storage
- [ ] DSN message parsing (structured bounce classification)
- [ ] Campaign-level bounce rate alerting

## Phase 2 (after MVP ships)

- A/B testing (subject line + body variants per step)
- AI email drafting (generate sequence content from a prompt)
- Template library (investor outreach, partnership, customer discovery)
- Lead status CRM (interested / not interested / meeting booked / follow up later)
- Meeting integration — lead replies "yes" → suggest booking link
- Microsoft Outlook OAuth support

## Deferred (1+ year)

See `todos-post-mvp/email-outreach-scale.md` for:
- Multi-mailbox + account rotation
- Warmup network (needs 5K+ users)
- Deliverability monitoring
- Multichannel (LinkedIn, phone)
