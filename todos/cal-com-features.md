# Cal.com v6.3 Features to Evaluate

> **Priority:** P2
> **Status:** In Progress
> **Last Updated:** 2026-03-18
> **Source:** Cal.com changelog v6.3 + repo at `github.com/calcom/cal.com` (pulled 2026-03-18, 119 new commits)

## High Priority

### AI Agents & Skills
Cal.com launched agent-powered scheduling via Slack, Telegram, email, CLI. Maps directly to our AI/MCP Server placeholders.

- [ ] **Evaluate agent architecture** — `agents/` dir has skills for API patterns, React, and design guidelines. Lightweight skill-based system, not a full agent framework.
- [ ] **Scheduling via chat** — Agents can schedule/reschedule from Slack. Our Pumble integration could add scheduling commands.
- [ ] **MCP Server implementation** — Our MCP Server page is a placeholder. Cal.com's agent CLI could inform what we expose.

### Out of Office (OOO)
Full CRUD API at `apps/api/v2/src/modules/ooo/`. Reasons: vacation, travel, sick_leave, public_holiday. Optional redirect to another user.

- [x] **Add OOO status to user profile** — Implemented: profile settings card, persisted OOO state, and assignee visibility in issue surfaces.
- [ ] **OOO redirect** — When a user is OOO, redirect their calendar bookings or issue assignments to a delegate.

### Cancellation Reason Requirement
New spec at `specs/cancellation-reason-requirement/`. Event type hosts can require cancellation reasons (mandatory/optional, by role).

- [ ] **Evaluate for calendar events** — Our calendar events can be cancelled but don't track reasons. Could add to `calendarEvents` schema.

## Medium Priority

### Workflow Auto-Translation
Spec at `specs/workflow-translation/`. Uses lingo.dev to auto-translate workflow email/SMS to attendee's browser language.

- [ ] **Evaluate for notifications/emails** — Our email templates in `emails/` are English-only. Translation service pattern could apply.

### Custom Domain & SMTP
Custom domains for booking links, custom SMTP for email.

- [ ] **Custom domain for client portal** — Our `/portal/$token` uses app domain. Enterprise feature.
- [ ] **Custom SMTP** — We use Resend. Could add SMTP provider option for enterprise orgs.

### Branding Control
Hide Cal.com branding for orgs/teams.

- [ ] **Whitelabel option** — Our client portal and emails show Nixelo branding. Enterprise whitelabel feature.

## Low Priority (Already Have or Not Applicable)

- [ ] Microsoft Sign-up — We already have multi-provider auth
- [ ] Booking attendees API — We have `calendarEvents.attendeeIds`
- [ ] API v2 architecture — We use Convex, different paradigm

## Reference Paths

| Feature | Cal.com Path |
|---------|-------------|
| Agents | `agents/`, `agents/skills/` |
| OOO | `apps/api/v2/src/modules/ooo/` |
| Cancellation | `specs/cancellation-reason-requirement/` |
| Translation | `specs/workflow-translation/`, `packages/features/translation/` |
| Lyra (AI meetings) | `packages/app-store/lyra/` |
