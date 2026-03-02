# Enterprise Features

> **Priority:** P4 (Post-Launch)
> **Effort:** Large
> **Status:** In progress

---

## Tasks

### Nixelo Cloud (Hosted SaaS)

- [ ] **Stripe integration** - Payment processing for subscriptions
- [ ] **Subscription management** - Plans, billing portal, usage tracking
- [x] **Pricing page** - Tier comparison, feature matrix ✅ (`src/components/Landing/PricingSection.tsx`, `src/routes/index.tsx`)

### SSO/SAML

- [ ] **Google Workspace SSO** - OIDC integration (partial: runtime sign-in discovery/routing guard shipped; full IdP callback validation pending)
- [ ] **Microsoft Entra ID** - SAML integration
- [ ] **Okta** - SAML/OIDC integration
- [ ] **Generic SAML** - Support any SAML provider

### AI Assistant

- [x] **Natural language queries** - "Show me all bugs assigned to me this sprint" ✅ (`convex/ai/actions.ts` -> `answerQuestion`)
- [x] **Project insights** - Auto-generated summaries, trends, risks ✅ (`convex/ai/actions.ts` -> `generateProjectInsights`)
- [x] **Auto-summarize** - Meeting notes, long threads ✅ (`convex/meetingBot.ts`, `convex/ai/config.ts`)

### E2E Infrastructure (Low Priority)

- [ ] **Visual regression testing** - Percy or similar
- [x] **Mobile viewport tests** - Responsive smoke coverage via Playwright mobile projects (`mobile-chrome`, `mobile-safari`) gated behind `E2E_CROSS_BROWSER=1` and `pnpm run e2e:cross-browser:smoke`
- [ ] **OAuth flow tests** - Test actual OAuth with mock providers
- [x] **Multi-browser testing** - Firefox/WebKit smoke coverage via opt-in Playwright projects (`E2E_CROSS_BROWSER=1`)

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

---

## Progress Log

### 2026-03-02 (Batch A)

**Progress**

- Added production-ready landing pricing section with tier comparison cards:
  - `Starter`
  - `Team`
  - `Enterprise`
- Integrated pricing section into home route and exports.
- Added component test coverage for pricing section rendering.

**Decisions**

- Shipped pricing as a first concrete enterprise-facing artifact while billing substrate remains pending.
- Kept pricing CTA copy sales/contact oriented until Stripe/subscription plumbing is implemented.

**Blockers**

- Stripe integration and subscription management remain blocked by billing architecture + provider setup decisions.

**Next step**

- Audit current SSO implementation depth and close or split enterprise SSO tasks based on actual runtime support (configuration-only vs full sign-in flow).

### 2026-03-02 (Batch B)

**Progress**

- Added OIDC provider presets in SSO configuration UI for:
  - Google Workspace
  - Microsoft Entra
  - Okta
- Exposed optional OIDC endpoint/scopes fields (authorization URL, token URL, user info URL, scopes).
- Added preset regression tests in `src/lib/sso-oidc-presets.test.ts`.

**Decisions**

- Treated provider-specific enterprise SSO work as configuration-acceleration first (preset defaults) while full auth callback/runtime integration remains a separate step.

**Blockers**

- Full provider integrations still require runtime OIDC/SAML sign-in callback flows and enterprise validation environments.

**Next step**

- Implement and validate one full provider runtime flow end-to-end (recommended first: Google Workspace OIDC).

### 2026-03-02 (Batch C)

**Progress**

- Audited enterprise AI assistant items against shipped backend features and marked them complete.
- Confirmed natural-language Q&A and project-insights actions are present in `convex/ai/actions.ts`.
- Confirmed automated meeting summarization pipeline exists in `convex/meetingBot.ts`.

**Decisions**

- Treated meeting-summary automation as the implementation target for `Auto-summarize`.
- Kept SSO provider tasks open until runtime provider login/callback flows are validated end-to-end.

**Blockers**

- SSO provider tasks remain partially implemented (configuration support exists, end-to-end auth flow validation pending).
- Stripe/subscription remain blocked on product packaging + billing provider setup.

**Next step**

- Decide whether to build Google Workspace OIDC runtime flow now or classify SSO provider tasks as externally blocked behind IdP test environments.

### 2026-03-02 (Batch D)

**Progress**

- Added opt-in cross-browser + mobile Playwright project matrix in `playwright.config.ts`:
  - Desktop: `chromium`, `firefox`, `webkit`
  - Mobile: `mobile-chrome` (Pixel 5), `mobile-safari` (iPhone 12)
- Added `pnpm run e2e:cross-browser:smoke` script to run a deterministic landing smoke slice across all enabled projects.

**Decisions**

- Kept default test lane unchanged (chromium-only) to avoid increasing CI flake/runtime while still shipping executable cross-browser/mobile coverage on demand.
- Counted enterprise `Multi-browser testing` and `Mobile viewport tests` as complete at smoke-lane level; full-suite multi-browser execution remains a future scaling task.

**Blockers**

- Full provider SSO runtime validation still needs IdP tenant credentials and callback environment setup.
- Stripe/subscription work remains blocked on billing packaging/provider decisions.

**Next step**

- Implement one end-to-end enterprise SSO provider runtime path (Google Workspace OIDC preferred) or explicitly classify it as externally blocked behind IdP test tenancy.

### 2026-03-02 (Batch E)

**Progress**

- Added runtime SSO domain discovery in sign-in flow (`src/components/Auth/SignInForm.tsx`) using `api.sso.getForDomain`:
  - Detects the typed email domain.
  - Switches Google CTA copy to organization-aware text for Google Workspace domains.
  - Blocks password submit path with explicit guidance when Google Workspace SSO is detected.
- Added OIDC provider metadata persistence (`google-workspace`, `microsoft-entra`, `okta`) in SSO config schema/backend:
  - `convex/schema.ts`
  - `convex/sso.ts`
  - `src/components/Settings/SSOSettings.tsx`
  - `src/lib/sso-oidc-presets.ts`
- Added regression tests:
  - `src/lib/sso-discovery.test.ts`
  - `src/lib/sso-oidc-presets.test.ts`
  - `convex/sso.test.ts` (provider metadata update + domain resolution)

**Decisions**

- Implemented runtime guidance/routing guard first, without replacing the existing Convex Auth Google provider flow, to keep auth risk low and preserve existing login behavior.
- Used explicit provider metadata in OIDC config for deterministic runtime detection instead of relying only on connection-name matching.

**Blockers**

- Full enterprise SSO completion still requires real IdP callback/tenant validation for Google Workspace and other providers.
- Billing substrate tasks remain blocked on packaging/provider decisions.

**Next step**

- Execute end-to-end Google Workspace IdP tenant validation (auth callback + org membership provisioning assertions) and decide if remaining provider tasks are implement-now or external-blocked.
