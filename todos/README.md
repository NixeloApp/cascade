# Nixelo Todo — MVP

> **Last Updated:** 2026-03-25

---

## Remaining Work

### Infrastructure

| Item | Detail |
|------|--------|
| [e2e-overhaul.md](./e2e-overhaul.md) | E2E data-testid migration ~57% complete. 72 fragile selectors remain in screenshot tool. 2 page objects at 0 TEST_IDs. |
| [visual-consistency-hardening.md](./visual-consistency-hardening.md) | Screenshot-driven visual cleanup — 19 items |
| [validator-strengthening.md](./validator-strengthening.md) | Validator framework improvements — 6 items |
| [tailwind-cva-consolidation.md](./tailwind-cva-consolidation.md) | Ongoing ratchet (102 files / 261 violations) |

### Features (need product decisions)

| Item | Detail |
|------|--------|
| [meeting-intelligence.md](./meeting-intelligence.md) | Meeting-to-doc flow, provider choice, speaker ID — 21 items |
| [email-outreach.md](./email-outreach.md) | OAuth email sending, templates, analytics — 35 items |
| [cal-com-features.md](./cal-com-features.md) | AI scheduling, custom domain, whitelabel — 8 items |
| [plane-features.md](./plane-features.md) | External notification routing (Slack/Pumble/webhook) — 1 item |
| [offline-pwa.md](./offline-pwa.md) | Push verification, optimistic UI, idempotency — 5 items |
| [feature-docs-expansion.md](./feature-docs-expansion.md) | Page spec triplets, feature coverage audit — 17 items |

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Unit tests | 4479 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| TEST_IDs | 197 defined, 95 used in screenshot tool |
| Biome lint warnings | 0 |
| MEDIUM page spec issues | 0 |
