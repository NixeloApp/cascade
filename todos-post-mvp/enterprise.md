# Enterprise Features

> **Priority:** P4
> **Status:** Blocked
> **Last Reviewed:** 2026-03-12
> **Blocker:** Billing, IdP, and infrastructure decisions are still unresolved.

## Remaining Work

### Billing

- [ ] Add Stripe integration.
- [ ] Add subscription management, plans, billing portal, and usage tracking.

### SSO And Identity

- [ ] Complete Google Workspace SSO end to end, including real IdP callback validation.
- [ ] Implement Microsoft Entra ID SSO.
- [ ] Implement Okta SSO.
- [ ] Implement generic SAML support.

### Test Infrastructure

- [ ] Add visual regression testing.
- [ ] Add actual OAuth flow tests with providers or stable mocks.

### Technical Debt

- [ ] Add an alternative email provider path such as SendPulse.
- [ ] Define a caching strategy.
- [ ] Add monitoring and alerting coverage for enterprise surfaces.
- [ ] Add activity log archiving.

## Next Milestones

- [ ] Define the first enterprise wedge.
- [ ] Implement identity-provider integration and org policy UI.
- [ ] Add billing substrate only for shipped enterprise capabilities.
