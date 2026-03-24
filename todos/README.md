# Nixelo Todo — MVP

> **Last Updated:** 2026-03-25

---

## Critical

- [ ] [p0-outreach-holes.md](./p0-outreach-holes.md) — **P0**: Outreach security & correctness holes. Token encryption, OAuth nonce expiry, missing HTTP handler wiring, no frontend UI, no integration tests. **Must fix before any user touches outreach.**

---

## Remaining Work

### Infrastructure

- [ ] [tailwind-cva-consolidation.md](./tailwind-cva-consolidation.md) — Ongoing ratchet (73 files / 102 violations). Flex/Stack have mb/mt/pt props. SelectTrigger/DropdownMenuContent have semantic width.
- [ ] [validator-strengthening.md](./validator-strengthening.md) — Validator framework improvements — 6 items
- [ ] [e2e-overhaul.md](./e2e-overhaul.md) — Monolith split done (5,292→619). Phase 5 done (21 page objects). Remaining: CI integration.
- [ ] [visual-consistency-hardening.md](./visual-consistency-hardening.md) — Screenshot-driven visual cleanup — 19 items (needs human review)

### Features (need product decisions)

- [ ] [meeting-intelligence.md](./meeting-intelligence.md) — 3-tier provider system done. Remaining: speaker ID UI, meeting-to-doc (blocked), multi-platform, benchmarks — 25 items
- [ ] [email-outreach.md](./email-outreach.md) — Backend complete. No frontend UI. See p0-outreach-holes.md for security items.
- [ ] [cal-com-features.md](./cal-com-features.md) — AI scheduling, custom domain, whitelabel — 8 items
- [ ] [plane-features.md](./plane-features.md) — External notification routing (Slack/Pumble/webhook) — 1 item
- [ ] [offline-pwa.md](./offline-pwa.md) — Push verification, optimistic UI, idempotency — 5 items
- [ ] [feature-docs-expansion.md](./feature-docs-expansion.md) — Page spec triplets, feature coverage audit — 17 items

---

## Current Health

| Metric | Value |
|--------|-------|
| Validators | 53/53 pass |
| Unit tests | 4553 pass |
| E2E tests | 164 pass |
| Page spec docs | 21/21 complete |
| TEST_IDs | 207 defined, 21 page objects |
| Biome warnings | 0 |
| MEDIUM page spec issues | 0 |
| Screenshot monolith | 619 lines (was 5,292) |
| Raw styling debt | 73 files / 102 violations (was 148/436) |
