# Email Outreach (Lightweight Cold Email)

> **Priority:** P2
> **Status:** Research Complete
> **Last Updated:** 2026-03-23

### Context

> Research completed 2026-03-23. See `docs/research/competitors/email-outreach/` for full
> competitor analysis and `docs/research/comparisons/email-outreach-landscape.md` for the
> landscape overview.

**Key insight:** Our users (entrepreneurs) need to reach investors, partners, and early
customers. They already have their own email. They don't need 10,000 emails/day — they
need 30-50 personalized outreach emails with tracking and follow-up sequences.

**Strategy:** Build a lightweight outreach tool — not Instantly. No warmup network, no
domain rotation, no massive infrastructure. Users connect their existing warm mailbox,
send <50/day, and track results. Scale features (warmup, rotation) deferred to post-MVP.

---

### Libraries to Evaluate

> No full cold-email OSS tool exists. The value is in the building blocks — we assemble
> them with sequence logic on top of Convex.

**Sending & Mailbox:**

| Library | What | Why | Status in Cascade |
|:--------|:-----|:----|:------------------|
| `nodemailer` | Send emails via SMTP/OAuth2 | Connects to user's Gmail/Outlook, handles auth, attachments, HTML | ✅ Already installed |
| `react-email` | Email template components | Build sequence emails with React, already used elsewhere | ✅ Already installed |
| `googleapis` (gmail) | Gmail API client | OAuth2 send + read for Gmail (alternative to raw IMAP) | Evaluate |
| `@microsoft/microsoft-graph-client` | Outlook API client | OAuth2 send + read for Outlook/365 | Evaluate |

**Reply Detection & Inbox Reading:**

| Library | What | Why | Status |
|:--------|:-----|:----|:-------|
| `imapflow` | Modern IMAP client | Read inbox, detect replies, poll for new messages. Handles Gmail IMAP well. | Evaluate |
| `mailparser` / `postal-mime` | Parse email MIME | Extract reply body, detect auto-replies (OOO), parse bounce DSN messages | Evaluate |

**Validation & Deliverability:**

| Library | What | Why | Status |
|:--------|:-----|:----|:-------|
| `deep-email-validator` | Verify email addresses | Syntax + MX + SMTP check before sending. Reduces bounces. | Evaluate |
| `mailcheck` | Typo suggestions | "Did you mean gmail.com?" — catches obvious typos in imported lists | Evaluate |
| `email-reply-parser` | Extract reply text | Strip quoted text from replies, get just the new content | Evaluate |

**Tracking:**

| Library | What | Why | Status |
|:--------|:-----|:----|:-------|
| None needed | Open pixel | 10-line HTTP handler returns 1x1 transparent GIF, logs the open | Build |
| None needed | Click redirect | URL rewrite + 302 redirect handler, logs the click | Build |

**Queue & Scheduling:**

| Library | What | Why | Status |
|:--------|:-----|:----|:-------|
| Convex scheduled functions | Job scheduling | Schedule sequence steps (send email 2 in 3 days). Native to our stack. | ✅ Already available |
| `bullmq` | Job queue (alternative) | Only if Convex scheduled functions hit limits at scale | Fallback |

**Key takeaway:** The hard part isn't finding libraries — it's wiring them into a
sequence engine with proper state management (who replied, who bounced, who's on step
2, etc.). That's the product logic we build on Convex.

---

### Phase 1: MVP — Lightweight Sequence Engine (~4-6 weeks)

**Mailbox Connection:**
- [ ] OAuth2 flow for Google Workspace (Gmail API)
- [ ] OAuth2 flow for Microsoft 365 (Outlook)
- [ ] Secure credential storage (encrypted at rest)
- [ ] Mailbox health check (verify connection is alive)
- [ ] Rate limiter: hard cap at 50 sends/day per connected mailbox

**Sequence Engine:**
- [ ] Multi-step sequences (email 1 → wait N days → email 2 → wait N days → email 3)
- [ ] Max 3-5 steps per sequence
- [ ] Personalization variables ({{firstName}}, {{company}}, custom fields)
- [ ] Spintax support for content variation
- [ ] Timezone-aware scheduling (send during recipient's business hours)
- [ ] Auto-stop sequence when recipient replies
- [ ] Job queue for scheduled sends (BullMQ or Convex scheduled functions)

**Contact Management:**
- [ ] CSV import for lead lists
- [ ] Deduplication
- [ ] Custom fields
- [ ] Global suppression list (bounced + unsubscribed contacts never emailed again)

**Reply Detection:**
- [ ] IMAP polling or Gmail API push notifications
- [ ] Match replies to sent emails (In-Reply-To / References headers)
- [ ] Auto-reply detection (filter out OOO, bounce messages)
- [ ] Mark contact as "replied" and stop sequence

**Tracking:**
- [ ] Open tracking (1x1 pixel via custom tracking subdomain)
- [ ] Click tracking (URL rewrite + redirect via custom tracking subdomain)
- [ ] Note: open tracking is unreliable (Apple MPP, Gmail proxy) — reply rate is the real metric

**Compliance (non-negotiable):**
- [ ] One-click unsubscribe header (RFC 8058 — required by Google/Yahoo since 2024)
- [ ] Unsubscribe link in every email
- [ ] Physical address footer (CAN-SPAM requirement)
- [ ] Global suppression list checked before every send
- [ ] Hard bounce auto-suppression

**Analytics Dashboard:**
- [ ] Per-campaign metrics: sent, delivered, opened, replied, bounced, unsubscribed
- [ ] Per-contact status: pending, sent, opened, replied, bounced
- [ ] Sequence funnel view (how many contacts reach step 2, step 3, etc.)

---

### Phase 2: Post-MVP Enhancements

- [ ] A/B testing (subject lines, body variants)
- [ ] AI-powered email writing (draft suggestions using existing AI provider)
- [ ] Template library (pre-built sequences for common use cases: investor outreach, partnership, customer discovery)
- [ ] CRM-like lead status (interested, not interested, meeting booked, follow up later)
- [ ] Unified inbox (view all replies across campaigns in one place)
- [ ] Meeting integration — lead replies "yes" → auto-suggest booking link

---

### Deferred: Scale Features (omega-post-MVP, 1+ year)

> Only build these if user demand proves the need. See research docs for full analysis.

- [ ] Multiple mailbox support per user (connect 5-10 accounts)
- [ ] Account rotation (distribute sends across mailboxes)
- [ ] Domain management guidance (SPF/DKIM/DMARC setup wizard)
- [ ] Warmup network — by then the user base may be large enough to form a natural pool
  - Every connected mailbox can participate in peer warmup
  - Same model as Instantly — users' mailboxes warm each other
  - Only viable at 5,000+ connected mailboxes across the platform
- [ ] Alternatively: integrate Instantly/Smartlead API for users who need >50/day
- [ ] Bounce classification (hard vs soft, DSN parsing)
- [ ] Deliverability monitoring (inbox placement testing, blacklist checks)
- [ ] Multichannel: LinkedIn + phone (study Lemlist's approach)

---

### Architecture Notes

**Where this lives:**
- If built for Nixelo (Convex): Convex scheduled functions for send queue, Convex tables for campaigns/contacts/events
- If built for StartHub (NestJS): Extend existing `NotificationCampaignAggregate` + `DeliveryEngine`, add IMAP polling service, BullMQ for scheduling

**Key decisions needed:**
- [ ] Which platform first? Nixelo or StartHub?
- [ ] OAuth2 provider selection (Google APIs vs nodemailer direct SMTP)
- [ ] Tracking subdomain setup (e.g., `track.nixelo.com` or `t.starthub.academy`)

---

### Research References

- [Instantly deep-dive](../docs/research/competitors/email-outreach/instantly.md)
- [Smartlead deep-dive](../docs/research/competitors/email-outreach/smartlead.md)
- [Lemlist deep-dive](../docs/research/competitors/email-outreach/lemlist.md)
- [Apollo deep-dive](../docs/research/competitors/email-outreach/apollo.md)
- [Market refresh & build-vs-buy](../docs/research/competitors/email-outreach/market-refresh-2026-03.md)
- [Full landscape comparison](../docs/research/comparisons/email-outreach-landscape.md)

### Why Not Just Integrate Instantly API?

Considered and rejected for MVP because:
1. Users pay $97/mo extra on top of our subscription — friction
2. API requires Hypergrowth plan — can't start free/cheap
3. Our users need 30-50 emails/day, not 25,000 — massive overkill
4. We lose control of the UX and data
5. Building the MVP feature set is only 4-6 weeks of work

Instantly API remains the recommended path for scale features (omega-post-MVP).
