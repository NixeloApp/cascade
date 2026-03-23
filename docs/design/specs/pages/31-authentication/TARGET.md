# Authentication Pages - Target State

> **Routes**: `/signin` and `/signup`

---

## Priority Improvements

| # | Improvement | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | Add screenshot coverage for sign-up page (step 0, step 1 with password, step 2 verification) | HIGH | Only sign-in has screenshots; sign-up states are undocumented visually |
| 2 | Debounce SSO discovery query instead of firing on every keystroke | MEDIUM | Typing "user@company.com" fires ~17 queries; debounce to 300ms would reduce to 1-2 |
| 3 | Simplify `hydrated` / `formReady` two-phase pattern | MEDIUM | The microtask-based `formReady` flag adds complexity; a single `useEffect` + ref approach would be cleaner |
| 4 | Replace `max-h-48` / `max-h-64` arbitrary values with design tokens for form expansion | LOW | These values are hardcoded for the progressive disclosure animation |
| 5 | Improve error messages for common sign-in failures (account not found, unverified email, rate limited) | LOW | Generic "Could not sign in" message does not help users diagnose the issue |
| 6 | Add "Remember me" checkbox for persistent sessions | LOW | Currently sessions always expire at the same interval; no user control |

---

## Not Planned

- **Social auth providers beyond Google**: Only Google OAuth is supported. Adding GitHub, Apple, etc. is a separate feature track.
- **Magic link / passwordless sign-in**: The email/password + Google OAuth flow covers the target audience. Magic links add complexity without clear demand.
- **CAPTCHA / bot protection**: Rate limiting is handled server-side. Client-side CAPTCHA is not planned.
- **SSR for auth pages**: Auth pages are client-only (`ssr: false`) because they depend on Convex client state. Enabling SSR would require a different auth architecture.
- **Multi-factor authentication (MFA)**: MFA is a future security enhancement, not part of the current auth flow.

---

## Acceptance Criteria

### Screenshots

- [ ] Sign-up step 0 (initial state) captured for all viewport/theme combos
- [ ] Sign-up step 1 (email form expanded with password strength indicator) captured
- [ ] Sign-up step 2 (email verification OTP) captured
- [ ] Sign-in with email form expanded captured

### Performance

- [ ] SSO discovery query is debounced (300ms) -- verify no query fires until user pauses typing
- [ ] No visible jank during progressive disclosure animation

### Code Quality

- [ ] `hydrated` / `formReady` pattern replaced with a simpler single-phase approach (or justified with a comment if kept)
- [ ] Form expansion animation uses design tokens instead of arbitrary `max-h-*` values

### UX

- [ ] Sign-in error messages distinguish between "account not found", "invalid password", and "email not verified"
- [ ] Password strength indicator provides clear guidance on what makes a strong password
- [ ] Screenshots pass visual diff after changes (`pnpm screenshots -- --spec authentication`)
