# Cal.com v6.3 Feature Snapshot

> **Priority:** Archived
> **Status:** Historical reference only
> **Last Updated:** 2026-03-18
> **Source:** Cal.com changelog v6.3 + repo at `github.com/calcom/cal.com` (pulled 2026-03-18)

This file is no longer an active todo list. It remains here as a compact reference for what was reviewed against Cal.com during MVP parity work.

## Shipped From This Review

- Out of office status and visibility
- OOO delegation / redirect behavior
- Booking-page delegation while the owner is OOO
- Internal calendar blocking for OOO windows

## Not Tracked As Active MVP Work

- AI agents / chat scheduling / MCP expansion
- Cancellation reasons
- Workflow auto-translation
- Custom domains and SMTP
- Branding / whitelabel controls

If any of these reopen later, treat them as new scoped work in `todos-post-mvp/` or feature-comparison docs instead of reviving this file as an active backlog.

## Reference Paths

| Feature | Cal.com Path |
|---------|---------------|
| Agents | `agents/`, `agents/skills/` |
| OOO | `apps/api/v2/src/modules/ooo/` |
| Cancellation | `specs/cancellation-reason-requirement/` |
| Translation | `specs/workflow-translation/`, `packages/features/translation/` |
| Lyra (AI meetings) | `packages/app-store/lyra/` |
