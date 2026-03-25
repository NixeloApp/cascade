# Nixelo Todo Index

> **Last Updated:** 2026-03-25

## Critical

No open critical items on this branch.

## Infrastructure

- [ ] [e2e-overhaul.md](./e2e-overhaul.md) — E2E and screenshot infrastructure now has modular validator guardrails plus raw-selector ratchets; remaining work is the optional CI split decision.
- [ ] [visual-consistency-hardening.md](./visual-consistency-hardening.md) — Screenshot-driven product polish and human review debt; the shared page header/content shell cleanup plus the flatter `OverviewBand` cleanup are now in, the public auth suite now uses a shared email-reveal shell with current reviewed specs, dashboard/projects/invoices/outreach/documents/issues/my-issues/notifications/roadmap/time-tracking/project-inbox/workspaces/org-calendar/project-analytics/org-analytics/assistant coverage is now in-spec, but broader page-by-page cleanup remains.
- [ ] [tailwind-cva-consolidation.md](./tailwind-cva-consolidation.md) — Ongoing raw Tailwind ratchet and primitive extraction where repetition justifies it.
- [ ] [validator-strengthening.md](./validator-strengthening.md) — Validator framework cleanup plus a few missing rule ideas.

## Features

- [ ] [meeting-intelligence.md](./meeting-intelligence.md) — Speaker-attributed meeting detail, meeting-to-doc export, and reviewed meetings screenshots shipped; remaining work is provider rollout plus multi-platform capture.
- [ ] [email-outreach.md](./email-outreach.md) — Gmail-first outreach is now usable end to end with reviewed route, tab, dialog, and destructive-state screenshots; remaining work is reliability polish, richer analytics, and provider expansion.
- [ ] [offline-pwa.md](./offline-pwa.md) — Push verification, optimistic UI, and worker/replay polish.
- [ ] [cal-com-features.md](./cal-com-features.md) — AI scheduling, MCP/chat scheduling ideas, branding, and portal/domain controls.
- [ ] [plane-features.md](./plane-features.md) — External notification routing.
- [ ] [feature-docs-expansion.md](./feature-docs-expansion.md) — Current-state feature documentation still needs coverage and structure cleanup.

## Health Snapshot

Verified on this branch:

| Metric | Value |
|--------|-------|
| Typecheck | pass |
| Validators | 55/55 pass |
| App tests (`vitest run`) | 4662 pass / 3 skipped |
| Convex tests (`vitest.convex`) | 2121 pass / 3 skipped |
| Page spec triplets | 42/42 present |
| Screenshot harness shell (`filled-states.ts`) | 2133 lines |
| TEST_ID constants / page-object files | 331 / 26 |
| Raw styling debt baseline | 73 files / 102 violations |
