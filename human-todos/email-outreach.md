# Email Outreach: Lightweight Cold Email Sequences

> **Priority:** P2
> **Status:** Backend Complete + Tested (89 tests) — Frontend Pending
> **Last Updated:** 2026-03-28
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

### Infra (done)

- [x] ~~DNS: `t.nixelo.com` CNAME → Convex site URL~~ — Cloudflare
- [x] ~~Gmail API enabled~~ — Google Cloud Console (nixelo + nixelo-dev projects)
- [x] ~~Gmail scopes added~~ — `gmail.send`, `gmail.readonly`

### Blocking: Google OAuth Verification

Gmail scopes are "restricted" — Google requires verification before external users can connect.
Without it, only test users (added manually, max 100) can use the outreach feature.

- [ ] **Privacy Policy page** at `nixelo.com/privacy` — must disclose Gmail data access, storage, deletion, and comply with Google's [Limited Use policy](https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes)
- [ ] **Terms of Service page** at `nixelo.com/terms`
- [ ] **App logo** — upload 120x120 PNG to Google OAuth consent screen branding page
- [ ] **Branding page fields** — fill in homepage, privacy, terms URLs
- [ ] **Demo video** — unlisted YouTube screencast showing: user connects Gmail → sends outreach email → reply detection. Google requires this for restricted scope review.
- [ ] **Submit for verification** — Google review takes 2-6 weeks
- [ ] **Workaround while waiting:** add early users as test users (up to 100) in Google Cloud Console

### Setup (not blocking)

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
