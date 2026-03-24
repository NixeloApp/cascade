# Email Outreach — Scale Features (Omega Post-MVP)

> **Priority:** P4
> **Status:** Deferred (1+ year)
> **Last Updated:** 2026-03-23
> **Depends on:** [../todos/email-outreach.md](../todos/email-outreach.md) (MVP must ship first)

---

## Context

The MVP email outreach feature covers users who send <50 emails/day from their own
warm mailbox. This doc covers what's needed when users demand higher volume.

**Prerequisites before building any of this:**
- MVP outreach shipped and adopted
- Proven user demand for >50 emails/day
- Platform user base of 5,000+ (for warmup network viability)

---

## Scale Features

### Multi-Mailbox Support

- [ ] Allow users to connect 5-10+ mailboxes per account
- [ ] Mailbox health dashboard (per-account send counts, bounce rates, reputation signals)
- [ ] Account-level send limits (aggregate across all mailboxes)

### Account Rotation

- [ ] Round-robin or smart rotation across connected mailboxes
- [ ] Weighted rotation (shift volume to healthier mailboxes)
- [ ] Auto-pause mailboxes showing degraded metrics
- [ ] Per-mailbox daily send cap enforcement

### Domain Management

- [ ] SPF/DKIM/DMARC setup wizard for new domains
- [ ] Domain health monitoring (blacklist checks, MX verification)
- [ ] Guidance: never cold-email from primary business domain
- [ ] DNS record validator

### Warmup Network

> This is the hardest feature. It only works at scale. Do not attempt before 5,000+
> connected mailboxes on the platform.

**How it works:**
- Every user who connects a mailbox opts into the warmup pool
- The platform coordinates warmup interactions between users' mailboxes
- Mailbox A sends warmup email to Mailbox B; B opens, replies, moves from spam
- Volume ramps gradually per mailbox
- Content is varied and human-looking

**Why it needs scale:**
- <100 mailboxes: ISPs detect the small pool, penalize participants
- 100-1,000: Marginal effectiveness, limited provider/geo diversity
- 1,000-5,000: Starting to work, but fragile
- 5,000+: Genuinely effective (this is where Instantly started gaining traction)
- 200,000+: Best-in-class (where Instantly is now)

**Implementation:**
- [ ] Opt-in warmup pool (connected mailboxes participate by default, opt-out available)
- [ ] Warmup scheduler (randomized timing, varied content, gradual ramp)
- [ ] Warmup interaction engine (open, reply, move-from-spam via IMAP)
- [ ] Anti-detection measures (randomized delays, human-like patterns, mixed with real activity)
- [ ] Warmup health monitoring per mailbox
- [ ] Admin dashboard for pool health metrics

**Alternative: Buy warmup instead of building:**
- [ ] Integrate Instantly API ($97/mo flat) for users who need scale sending
- [ ] Integrate standalone warmup services (MailReach $25/mailbox/mo, Warmup Inbox $15/mailbox/mo)
- [ ] Let users choose: platform warmup (free, requires pool size) or paid external warmup

### Bounce Classification

- [ ] Parse DSN (Delivery Status Notification) messages
- [ ] Classify hard bounce (permanent: address doesn't exist) vs soft bounce (temporary: mailbox full)
- [ ] Auto-suppress hard bounces globally
- [ ] Retry soft bounces with exponential backoff (1hr → 4hr → 24hr → give up)
- [ ] Campaign-level bounce rate alerting (pause campaign if >5%)

### Deliverability Monitoring

- [ ] Inbox placement testing (send to seed accounts across Gmail, Outlook, Yahoo)
- [ ] Blacklist monitoring (check major RBLs daily per sending domain)
- [ ] Google Postmaster Tools integration (reputation data for Gmail)
- [ ] Per-domain deliverability score dashboard
- [ ] Alerting when domain reputation degrades

### Multichannel (Study Lemlist's Approach)

- [ ] LinkedIn integration (profile visits, connection requests, messages)
- [ ] Phone/SMS step in sequences
- [ ] Unified sequence: email → wait → LinkedIn connect → wait → email follow-up → wait → phone
- [ ] Note: LinkedIn actively fights automation — high account suspension risk

---

## Cost Projections at Scale

| Users Needing Scale | Monthly Infra Cost | Notes |
|:--------------------|:-------------------|:------|
| 100 users × 500 emails/day | ~$200/mo (platform compute) | Warmup pool: 100-500 mailboxes (marginal) |
| 1,000 users × 500 emails/day | ~$500/mo | Warmup pool: 1,000-5,000 (starting to work) |
| 5,000 users × 500 emails/day | ~$1,000/mo | Warmup pool: 5,000-25,000 (genuinely effective) |

Compare to Instantly: users would pay $97/mo each = $485,000/mo for 5,000 users.
Building this as a platform feature saves users money and increases platform stickiness.

---

## Decision Framework

```
Do users demand >50 emails/day?
├─ NO → Stay with MVP. Done.
└─ YES → Do we have 5,000+ connected mailboxes?
         ├─ NO → Offer Instantly API integration as a bridge
         └─ YES → Build warmup network
                  └─ Is multichannel demand proven?
                     ├─ NO → Stop at email scale
                     └─ YES → Add LinkedIn + phone (study Lemlist)
```

---

## Research References

- [Full landscape comparison](../docs/research/comparisons/email-outreach-landscape.md)
- [Market refresh & build-vs-buy](../docs/research/competitors/email-outreach/market-refresh-2026-03.md)
- [Instantly deep-dive](../docs/research/competitors/email-outreach/instantly.md) — warmup network details
- [Lemlist deep-dive](../docs/research/competitors/email-outreach/lemlist.md) — multichannel approach
