# Enterprise Features

> **Priority:** P4 (Post-Launch)
> **Effort:** Large
> **Status:** Not started

---

## Tasks

### Nixelo Cloud (Hosted SaaS)

- [ ] **Stripe integration** - Payment processing for subscriptions
- [ ] **Subscription management** - Plans, billing portal, usage tracking
- [ ] **Pricing page** - Tier comparison, feature matrix

### SSO/SAML

- [ ] **Google Workspace SSO** - OIDC integration
- [ ] **Microsoft Entra ID** - SAML integration
- [ ] **Okta** - SAML/OIDC integration
- [ ] **Generic SAML** - Support any SAML provider

### AI Assistant

- [ ] **Natural language queries** - "Show me all bugs assigned to me this sprint"
- [ ] **Project insights** - Auto-generated summaries, trends, risks
- [ ] **Auto-summarize** - Meeting notes, long threads

### E2E Infrastructure (Low Priority)

- [ ] **Visual regression testing** - Percy or similar
- [ ] **Mobile viewport tests** - Responsive testing
- [ ] **OAuth flow tests** - Test actual OAuth with mock providers
- [ ] **Multi-browser testing** - Firefox, WebKit

### Technical Debt (Low Priority)

- [ ] **SendPulse email provider** - Alternative to Resend
- [ ] **Caching strategy** - Query caching, CDN
- [ ] **Monitoring/alerting** - Error tracking, performance
- [ ] **Activity log archiving** - Archive old activity for performance

---

## Related Files

- `convex/auth.ts` - Authentication
- `src/routes/` - Routes for new features

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S8+` (post-launch enterprise track)  
**Effort:** Large

### Milestones

- [ ] `S4` Define first enterprise wedge (recommended: one SSO provider + admin controls)
- [ ] `S4` Implement identity-provider integration + org policy UI
- [ ] `S5` Add billing substrate (plans/entitlements) only for shipped enterprise features
- [ ] `S5+` Expand provider matrix + advanced enterprise controls

### Dependencies

- Product packaging decisions (feature tiers and entitlement model)
- Security/legal requirements for enterprise auth flows

### Definition of Done

- At least one enterprise-tier capability is production deployable and supportable.
