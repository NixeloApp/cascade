# Email Outreach: Lightweight Cold Email Sequences

> **Priority:** P2
> **Status:** In Progress — manual rollout blockers remain
> **Last Updated:** 2026-03-28
> **Context:** See `docs/research/competitors/email-outreach/` for competitor analysis,
> `docs/research/comparisons/email-outreach-landscape.md` for full landscape

## What's Left

### Blocking: Google OAuth Verification

Gmail scopes are "restricted" — Google requires verification before external users can connect.
Without it, only test users (added manually, max 100) can use the outreach feature.

- [ ] **Privacy Policy page** at `nixelo.com/privacy` — must disclose Gmail data access, storage, deletion, and comply with Google's [Limited Use policy](https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes)
- [ ] **Terms of Service page** at `nixelo.com/terms`
- [ ] **App logo** — upload 120x120 PNG to Google OAuth consent screen branding page
- [ ] **Branding page fields** — fill in homepage, privacy, terms URLs
- [ ] **Demo video** — unlisted YouTube screencast showing: user connects Gmail → sends outreach email → reply detection. Google requires this for restricted scope review.
- [ ] **Submit for verification** — Google review takes 2-6 weeks
- [ ] **Workaround while waiting:** add early users as test users (up to 100) in Google Cloud Console

### Setup (not blocking)

- [ ] Microsoft 365 OAuth (deferred — Gmail only for now)
- [ ] Email validation on contact import (`deep-email-validator` — syntax + MX check)

### Backend (nice-to-have, not blocking)

- [ ] Reply content extraction and storage
- [ ] DSN message parsing (structured bounce classification)
- [ ] Campaign-level bounce rate alerting
