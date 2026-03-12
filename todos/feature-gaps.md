# Feature Gaps

> **Priority:** P2
> **Status:** Blocked
> **Last Reviewed:** 2026-03-12
> **Blocker:** Slack app setup and dashboard registrations are still external.

## Remaining Work

- [ ] Create the Slack OAuth app in the Slack API dashboard.
- [ ] Register the `/nixelo` slash command and point it at `POST /slack/commands`.
- [ ] Register URL unfurl patterns and point them at `POST /slack/unfurl`.
- [ ] Provision production Slack env vars:
  - `SLACK_CLIENT_ID`
  - `SLACK_CLIENT_SECRET`
  - `SLACK_SIGNING_SECRET`
- [ ] Verify the full Slack path in a configured workspace after dashboard setup is complete.
