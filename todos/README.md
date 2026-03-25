# Nixelo Todo Index

> **Last Updated:** 2026-03-24

## Critical

- [ ] [p0-outreach-holes.md](./p0-outreach-holes.md) — Outreach still has real launch blockers: expiring OAuth nonces, no frontend UI, and missing integration coverage.

## Infrastructure

- [ ] [e2e-overhaul.md](./e2e-overhaul.md) — E2E and screenshot infrastructure is mostly complete; remaining work is CI guardrails and selector ratchets.
- [ ] [visual-consistency-hardening.md](./visual-consistency-hardening.md) — Screenshot-driven product polish and human review debt.
- [ ] [tailwind-cva-consolidation.md](./tailwind-cva-consolidation.md) — Ongoing raw Tailwind ratchet and primitive extraction where repetition justifies it.
- [ ] [validator-strengthening.md](./validator-strengthening.md) — Framework cleanup plus a few missing validator ideas.

## Features

- [ ] [meeting-intelligence.md](./meeting-intelligence.md) — Speaker-labeled UI, meeting-to-doc, and multi-platform capture remain open.
- [ ] [email-outreach.md](./email-outreach.md) — Gmail-first backend exists; product UI, hardening, and richer reliability work remain.
- [ ] [offline-pwa.md](./offline-pwa.md) — Push verification, optimistic UI, and replay/idempotency polish.
- [ ] [cal-com-features.md](./cal-com-features.md) — AI scheduling, MCP/chat scheduling ideas, branding, and portal/domain controls.
- [ ] [plane-features.md](./plane-features.md) — External notification routing.
- [ ] [feature-docs-expansion.md](./feature-docs-expansion.md) — Current-state feature documentation still needs coverage and structure cleanup.

## Health Snapshot

Verified on this branch:

| Metric | Value |
|--------|-------|
| Typecheck | pass |
| Validators | 53/53 pass |
| App tests (`vitest run`) | 4551 pass / 5 skipped |
| Convex tests (`vitest.convex`) | 2106 pass / 3 skipped |
| Page spec triplets | 41/41 present |
| Screenshot harness shell (`filled-states.ts`) | 1452 lines |
| TEST_ID constants / page-object files | 207 / 22 |
| Raw styling debt baseline | 73 files / 102 violations |
