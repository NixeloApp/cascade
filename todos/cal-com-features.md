# Cal.com v6.3 Features To Evaluate

> **Priority:** P2
> **Status:** Partial
> **Last Updated:** 2026-03-18
> **Source:** Cal.com changelog v6.3 + repo at `github.com/calcom/cal.com` (pulled 2026-03-18)

Only unfinished items remain here. OOO work is complete and intentionally removed from this file.

## High Priority

### AI Agents & Skills

- [ ] **Evaluate agent architecture** — `agents/` and `agents/skills/` show a lightweight skill-based pattern that could inform our AI surface.
- [ ] **Scheduling via chat** — Cal.com supports scheduling/rescheduling from chat channels; our Pumble integration could grow into this.
- [ ] **MCP Server implementation** — Our MCP Server page is still a placeholder.

### Cancellation Reason Requirement

- [ ] **Evaluate cancellation reasons for calendar events** — Our events can be cancelled but do not persist a structured reason.

## Medium Priority

### Workflow Auto-Translation

- [ ] **Evaluate workflow translation for emails/notifications** — Our messaging remains English-only.

### Custom Domain & SMTP

- [ ] **Custom domain for client portal** — `/portal/$token` is still app-domain only.
- [ ] **Custom SMTP** — We still only expose the current provider path rather than enterprise SMTP configuration.

### Branding Control

- [ ] **Whitelabel option** — Client portal and emails still carry Nixelo branding.

## Already Shipped From This Review

- [x] Out-of-office profile status
- [x] OOO assignee visibility
- [x] OOO delegation / redirect behavior
- [x] Booking-page delegation while the owner is OOO
- [x] Internal calendar blocking for OOO windows

## Reference Paths

| Feature | Cal.com Path |
|---------|---------------|
| Agents | `agents/`, `agents/skills/` |
| OOO | `apps/api/v2/src/modules/ooo/` |
| Cancellation | `specs/cancellation-reason-requirement/` |
| Translation | `specs/workflow-translation/`, `packages/features/translation/` |
| Lyra (AI meetings) | `packages/app-store/lyra/` |
