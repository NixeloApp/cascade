# Sign Up Page

> **Status**: TODO - Awaiting Implementation
> **Priority**: HIGH (Phase 3 - Auth Flow)

---

## Current State Analysis

**Source File**: `src/routes/signup.tsx`

### Visual Description (Current Nixelo)

The current sign-up page shares the same layout as sign-in via `AuthPageLayout`:

1. **Background**: Light gray/off-white solid background (`bg-ui-bg-secondary`)
2. **Layout**: Centered card-based design with visible border and rounded corners
3. **Navigation**: "Back to Home" link with left arrow above the card
4. **Logo**: Nixelo "N" logo (gradient) centered at top of card
5. **Typography**:
   - Heading: "Create an account" (dark text, ~24px, bold)
   - Subheading: "Sign up to get started with Nixelo" (muted gray)
6. **Auth Options**:
   - "Sign up with Google" button (full-width)
   - "or" divider with horizontal lines
   - "Continue with email" button - expands to show email/password fields
7. **Form Fields** (when expanded):
   - Email input (placeholder: "Email")
   - Password input (placeholder: "Password", min 8 chars)
   - "Create account" submit button
8. **Sign In Link**: "Already have an account? Sign in" (Sign in in brand color)
9. **Legal Text**: Terms & Conditions and Privacy Policy acknowledgment (small, muted, centered)
10. **Card**: White card with `rounded-2xl`, subtle border, ~400px max-width

### Issues Identified

| Issue | Severity | Notes |
|-------|----------|-------|
| Card-based layout feels dated | HIGH | Mintlify uses full-screen, no card |
| Light background lacks premium feel | HIGH | Near-black creates depth |
| Form expansion animation is abrupt | MEDIUM | Should be smoother |
| No onboarding flow after signup | HIGH | Mintlify has multi-step onboarding |
| Password shown immediately | MEDIUM | Mintlify collects name/company after OAuth |
| Buttons appear flat/generic | MEDIUM | Need subtle depth cues |
| No entry animations | LOW | Static page load |

---

## Target State

**Reference Screenshots**:
- `docs/research/library/mintlify/signup_desktop_dark.png` (Dark mode)
- `docs/research/library/mintlify/signup_desktop_light.png` (Light mode)
- `docs/research/library/mintlify/onboarding/*.png` (Post-signup flow)

### Key Improvements

1. **Full-screen dark canvas** - No card container, content floats on near-black background
2. **Email-first flow** - Email input + Continue button, OAuth as alternative
3. **Multi-step onboarding** - After auth: collect name, company, optional password
4. **Minimal hierarchy** - Logo, heading, form, footer - nothing else
5. **Subtle form fields** - Dark inputs with soft borders, icon prefixes
6. **Clear CTA separation** - Email flow vs OAuth visually distinct
7. **Bottom-anchored legal** - Terms/Privacy as footer, not crowded with form
8. **Entrance animation** - Fade + slide up on page load

### Mintlify Sign-Up Anatomy (Dark Mode)

From `signup_desktop_dark.png`:

- **Background**: Near-black (`#08090a` or similar)
- **Logo**: Mintlify leaf icon in brand green (`#18e299`), ~24px, left-aligned to content
- **Heading**: "Get Started with Mintlify" (white, ~28px, font-weight 600)
- **Subheading**: "Already have an account? Sign in ->" (muted white + green link with arrow)
- **Form Label**: "Enter your email" (white/light, ~14px, above input)
- **Input Field**: Dark background with subtle border, email icon prefix, placeholder "name@email.com"
- **Primary Button**: "Continue" (dark, subtle border, disabled until email entered)
- **Divider**: "OR" with subtle horizontal lines
- **OAuth Button**: "Continue with Google" (white/light background, Google icon)
- **Legal**: "By signing up, you agree to the Terms of Service and Privacy Policy" (muted, links underlined)

---

## ASCII Wireframe

### Step 1: Initial Sign-Up Page

```
+--------------------------------------------------------------------------------+
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                                   [N]                                          |
|                              (Nixelo logo,                                     |
|                               brand color)                                     |
|                                                                                |
|                                                                                |
|                         Get Started with Nixelo                                |
|                      (28px, white, font-weight 600)                            |
|                                                                                |
|                    Already have an account? Sign in ->                         |
|                      (14px muted + brand link)                                 |
|                                                                                |
|                                                                                |
|                            Enter your email                                    |
|                              (14px, white)                                     |
|                                                                                |
|                    +------------------------------------+                      |
|                    |  [mail]  name@email.com           |                      |
|                    +------------------------------------+                      |
|                         (dark input, subtle border)                           |
|                                                                                |
|                    +------------------------------------+                      |
|                    |            Continue               |                      |
|                    +------------------------------------+                      |
|                          (disabled until email valid)                         |
|                                                                                |
|                    ----------------  OR  ----------------                      |
|                                                                                |
|                    +------------------------------------+                      |
|                    |   [G]   Continue with Google       |                      |
|                    +------------------------------------+                      |
|                       (white/light bg, prominent OAuth)                        |
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                    By signing up, you agree to the                             |
|                    Terms of Service and Privacy Policy.                        |
|                          (12px, muted, links)                                  |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### Step 2: Post-OAuth Onboarding

From `onboarding/07-after-click-0.png`:

```
+--------------------------------------------------------------------------------+
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                                   [N]                                          |
|                              (Nixelo logo)                                     |
|                                                                                |
|                                                                                |
|                         Get Started with Nixelo                                |
|                      (28px, white, font-weight 600)                            |
|                                                                                |
|                   Enter your account information to get started                |
|                              (14px, muted green)                               |
|                                                                                |
|                                                                                |
|                    +------------------+  +------------------+                  |
|                    | First name       |  | Last name        |                 |
|                    | [user] Agent     |  | [user] Smith     |                 |
|                    +------------------+  +------------------+                  |
|                        (pre-filled from OAuth if available)                   |
|                                                                                |
|                    +------------------------------------+                      |
|                    | Company name                       |                      |
|                    | [building] ACME                    |                      |
|                    +------------------------------------+                      |
|                              (optional placeholder)                           |
|                                                                                |
|                    +------------------------------------+                      |
|                    | Password (optional)                |                      |
|                    | [lock] Enter your password    [v] |                      |
|                    +------------------------------------+                      |
|                       (optional - can use magic link instead)                 |
|                                                                                |
|                    +------------------------------------+                      |
|                    |            Continue               |                      |
|                    +------------------------------------+                      |
|                                                                                |
|                        Skip, use magic link instead                           |
|                           (link, muted text)                                  |
|                                                                                |
|                                                                                |
|                    By signing up, you agree to the                             |
|                    Terms of Service and Privacy Policy.                        |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### Step 3: Email Verification (if email signup)

```
+--------------------------------------------------------------------------------+
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                                   [N]                                          |
|                              (Nixelo logo)                                     |
|                                                                                |
|                                                                                |
|                            Check your email                                    |
|                      (28px, white, font-weight 600)                            |
|                                                                                |
|                   We sent a verification code to                               |
|                   user@example.com                                             |
|                              (14px, muted)                                     |
|                                                                                |
|                                                                                |
|                    +------------------------------------+                      |
|                    |  [  ] [  ] [  ] [  ] [  ] [  ]    |                      |
|                    +------------------------------------+                      |
|                         (6-digit code input boxes)                            |
|                                                                                |
|                    +------------------------------------+                      |
|                    |            Verify                 |                      |
|                    +------------------------------------+                      |
|                                                                                |
|                        Didn't receive the code?                               |
|                           Resend code (60s)                                   |
|                                                                                |
|                                                                                |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### Step 4: Workspace Creation (Post-verification)

```
+--------------------------------------------------------------------------------+
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                                   [N]                                          |
|                              (Nixelo logo)                                     |
|                                                                                |
|                                                                                |
|                         Create your workspace                                  |
|                      (28px, white, font-weight 600)                            |
|                                                                                |
|                   Workspaces help you organize projects                        |
|                   and collaborate with your team.                              |
|                              (14px, muted)                                     |
|                                                                                |
|                                                                                |
|                    +------------------------------------+                      |
|                    | Workspace name                     |                      |
|                    | [building] Acme Inc                |                      |
|                    +------------------------------------+                      |
|                         (pre-fill from company name)                          |
|                                                                                |
|                    +------------------------------------+                      |
|                    | Workspace URL                      |                      |
|                    | nixelo.app/ [acme-inc            ] |                      |
|                    +------------------------------------+                      |
|                       (auto-slugified, editable)                              |
|                                                                                |
|                    +------------------------------------+                      |
|                    |        Create workspace           |                      |
|                    +------------------------------------+                      |
|                                                                                |
|                                                                                |
|                        I'll do this later (skip)                              |
|                           (creates personal workspace)                        |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### Content Width: ~360px max (centered)

### Vertical Spacing Guide

```
Top of viewport
    |
    | ~20vh (flexible, centers content visually)
    |
[Logo] - 28px height
    |
    | 32px gap
    |
[Heading] - 34px line-height
    |
    | 8px gap
    |
[Subheading + link]
    |
    | 40px gap
    |
[Form label]
    |
    | 8px gap
    |
[Email input] - 48px height
    |
    | 12px gap
    |
[Continue button] - 48px height
    |
    | 24px gap
    |
[OR divider] - 20px height
    |
    | 24px gap
    |
[Google button] - 48px height
    |
    | ~auto (flexible, pushes legal to bottom)
    |
[Legal text] - 32px from bottom
    |
Bottom of viewport
```

---

## Onboarding Flow

### Complete User Journey

```
1. SIGNUP PAGE
   |
   +---> [Continue with Google] --> Google OAuth
   |                                    |
   |                                    v
   |                            ONBOARDING STEP 1
   |                            (Name, Company, Optional Password)
   |                                    |
   +---> [Continue with Email] -----+   |
                |                   |   |
                v                   |   |
        EMAIL VERIFICATION <--------+   |
        (6-digit code)                  |
                |                       |
                v                       |
        ONBOARDING STEP 1 <-------------+
        (Name, Company, Password required)
                |
                v
        WORKSPACE CREATION
        (Name, URL slug)
                |
                v
        DASHBOARD
        (First-time user experience)
```

### Onboarding Steps Detail

| Step | Required Fields | Optional Fields | Actions |
|------|-----------------|-----------------|---------|
| **1. Account Info** | First name, Last name | Company name, Password | Continue, Skip (magic link) |
| **2. Workspace** | Workspace name | - | Create, Skip (personal workspace) |
| **3. First Project** | (Optional) | Project name | Create, Skip |

### State Machine

```
STATES:
- signup_initial
- email_entered
- email_verification
- onboarding_profile
- onboarding_workspace
- complete

TRANSITIONS:
signup_initial --> email_entered (valid email)
email_entered --> email_verification (email submit)
signup_initial --> onboarding_profile (OAuth success)
email_verification --> onboarding_profile (code verified)
onboarding_profile --> onboarding_workspace (profile saved)
onboarding_workspace --> complete (workspace created OR skipped)
```

---

## Functionality Breakdown

### Form States

- [ ] **Empty state**: Email input empty, Continue button disabled
- [ ] **Email entered**: Validate email format, enable Continue button
- [ ] **Invalid email**: Show inline error below input, red border
- [ ] **Email submitted**: Show loading, transition to verification
- [ ] **Verification view**: 6-digit code input, Verify button
- [ ] **Code invalid**: Shake animation, error message
- [ ] **OAuth redirect**: Show loading state, redirect to Google
- [ ] **Onboarding profile**: Name/company/password form
- [ ] **Workspace creation**: Name/slug form with auto-generation
- [ ] **Error state**: Auth failed - show error toast/message

### OAuth Flows

1. **Google Sign-Up**:
   - Click "Continue with Google"
   - Show loading spinner in button
   - Redirect to Google OAuth consent
   - Return to callback URL
   - Check if new user
   - If new: redirect to onboarding profile step
   - If existing: redirect to dashboard

2. **Email Sign-Up**:
   - Enter email -> validate -> submit
   - Send verification code via email
   - Show verification code input
   - User enters 6-digit code
   - Verify code
   - Success: redirect to onboarding profile
   - Failure: show error, allow retry/resend

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Email | Valid email format | "Please enter a valid email address" |
| Email | Not already registered | "An account with this email already exists" |
| Verification code | 6 digits | "Please enter a 6-digit code" |
| Verification code | Valid/not expired | "Invalid or expired code" |
| First name | 1-50 chars | "First name is required" |
| Last name | 1-50 chars | "Last name is required" |
| Password | Min 8 chars | "Password must be at least 8 characters" |
| Workspace name | 2-50 chars | "Workspace name must be 2-50 characters" |
| Workspace slug | 2-30 chars, lowercase, alphanumeric + hyphens | "Invalid workspace URL" |

### Error States

| Error | Display | Recovery |
|-------|---------|----------|
| Invalid email format | Inline below input, red text | User corrects email |
| Email already exists | Toast: "Account exists" | Link to sign in |
| OAuth cancelled | Toast: "Sign up cancelled" | Try again |
| OAuth error | Toast: "Could not sign up" | Retry or email signup |
| Verification failed | Inline: "Invalid code" | Retry or resend |
| Code expired | Inline: "Code expired" | Resend code |
| Network error | Toast: "Connection failed" | Retry button |
| Rate limited | Full form overlay | Wait timer |

### Keyboard Navigation

- `Tab`: Move between inputs and buttons
- `Enter`: Submit current form step
- `Escape`: Clear errors
- `Backspace` (in code input): Move to previous digit

---

## Component Inventory

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **Page Container** | Card on gray bg | Full-screen dark canvas | Remove card wrapper |
| **Logo** | In card header | Floating, above heading | Keep Nixelo brand mark |
| **Heading** | "Create an account" | "Get Started with Nixelo" | More inviting |
| **Subheading** | Separate line | Inline with signin link | Compact |
| **Email Input** | White bg, border | Dark bg, subtle border, icon | Semantic input token |
| **Primary Button** | Same as signin | Dark with subtle depth | Disabled state darker |
| **OAuth Button** | Same as primary | White/light, elevated | Visual distinction |
| **Divider** | "or" with lines | "OR" with subtle lines | Same pattern, darker |
| **Legal Links** | In card footer | Page footer, fixed | Underlined on hover |
| **Verification Input** | Standard inputs | 6-box code entry | Auto-advance on digit |
| **Profile Form** | N/A | Name/company fields | Two-column for names |
| **Workspace Form** | N/A | Name/slug with preview | Auto-slug generation |

### New Components Needed

1. **AuthInput**: Dark-themed input with icon prefix slot (shared with sign-in)
2. **AuthButton**: Primary, secondary, OAuth variants (shared with sign-in)
3. **AuthDivider**: "OR" with horizontal rules (shared with sign-in)
4. **AuthLegal**: Footer text with legal links (shared with sign-in)
5. **VerificationCodeInput**: 6-box code entry with auto-advance
6. **OnboardingStep**: Container for multi-step onboarding
7. **WorkspaceSlugInput**: Name input with auto-generated slug preview

---

## Design Tokens Used

### Colors (Dark Mode)

| Element | Token | Value |
|---------|-------|-------|
| Page background | `--color-ui-bg-hero` | `#030712` (p-gray-950) |
| Logo | `--color-brand` | Indigo brand color |
| Heading text | `--color-ui-text` | White |
| Subheading text | `--color-ui-text-secondary` | `rgba(255,255,255,0.7)` |
| Link text | `--color-brand` | Indigo brand |
| Input background | `--color-ui-bg-secondary` | Dark gray |
| Input border | `--color-ui-border` | `rgba(255,255,255,0.1)` |
| Input border (focus) | `--color-ui-border-focus` | Indigo |
| Input text | `--color-ui-text` | White |
| Input placeholder | `--color-ui-text-tertiary` | `rgba(255,255,255,0.4)` |
| Button primary bg | `--color-ui-bg-tertiary` | Dark gray |
| Button primary text | `--color-ui-text` | White |
| Button OAuth bg | `--color-ui-bg` | White/very light |
| Button OAuth text | `--color-ui-text-inverted` | Dark |
| Button hover bg | Lightened variant | Subtle lift |
| Button disabled | `--color-ui-bg-secondary` | Darker, muted text |
| Divider line | `--color-ui-border` | Very subtle |
| Divider text | `--color-ui-text-tertiary` | Muted |
| Error text | `--color-status-error` | Red |
| Success text | `--color-status-success` | Green |
| Legal text | `--color-ui-text-tertiary` | Very muted |
| Code box border | `--color-ui-border` | Subtle |
| Code box focus | `--color-ui-border-focus` | Indigo |
| Code box filled | `--color-ui-bg-tertiary` | Slightly elevated |

### Typography

| Element | Size | Weight | Token |
|---------|------|--------|-------|
| Heading | 28px | 600 | `text-2xl font-semibold` |
| Subheading | 14px | 400 | `text-sm` |
| Form label | 14px | 500 | `text-sm font-medium` |
| Input text | 16px | 400 | `text-base` |
| Button text | 14px | 500 | `text-sm font-medium` |
| Divider text | 12px | 500 | `text-xs font-medium` |
| Legal text | 12px | 400 | `text-xs` |
| Helper text | 12px | 400 | `text-xs` |
| Code digits | 24px | 600 | `text-2xl font-semibold` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Content max-width | 360px | Custom |
| Logo to heading | 32px | `mb-8` |
| Heading to subheading | 8px | `mb-2` |
| Subheading to form | 40px | `mb-10` |
| Label to input | 8px | `mb-2` |
| Input to button | 12px | `gap-3` |
| Button to button | 12px | `gap-3` |
| Buttons to divider | 24px | `my-6` |
| Divider to OAuth | 24px | `my-6` |
| Code boxes gap | 8px | `gap-2` |
| Name fields gap | 12px | `gap-3` |
| Form sections gap | 24px | `gap-6` |
| Legal from bottom | 32px | `pb-8` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Input | 8px | `rounded-lg` |
| Button | 8px | `rounded-lg` |
| Code box | 8px | `rounded-lg` |

---

## Animations

### Entry Animation (Page Load)

```css
/* Staggered fade-in + slide-up */
@keyframes auth-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-content {
  animation: auth-enter 0.4s ease-out;
}

/* Stagger children */
.auth-logo { animation-delay: 0ms; }
.auth-header { animation-delay: 50ms; }
.auth-form { animation-delay: 100ms; }
.auth-oauth { animation-delay: 150ms; }
.auth-legal { animation-delay: 200ms; }
```

### Step Transitions

```css
/* Onboarding step slide */
@keyframes step-enter {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes step-exit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}

.step-enter {
  animation: step-enter 0.3s ease-out;
}

.step-exit {
  animation: step-exit 0.3s ease-out;
}
```

### Button Hover States

```css
/* Primary button */
.auth-button-primary {
  transition: background-color 0.15s ease, transform 0.15s ease;
}
.auth-button-primary:hover:not(:disabled) {
  background-color: var(--color-ui-bg-tertiary-hover);
  transform: translateY(-1px);
}
.auth-button-primary:active {
  transform: translateY(0);
}

/* OAuth button - subtle glow */
.auth-button-oauth {
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}
.auth-button-oauth:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}
```

### Input Focus

```css
.auth-input {
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.auth-input:focus {
  border-color: var(--color-ui-border-focus);
  box-shadow: 0 0 0 3px rgba(var(--color-brand-rgb), 0.1);
}
```

### Error Shake

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.auth-input-error {
  animation: shake 0.3s ease;
  border-color: var(--color-status-error);
}
```

### Verification Code Animation

```css
/* Code box fill animation */
@keyframes code-fill {
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.code-box-filled {
  animation: code-fill 0.15s ease-out;
}

/* Success checkmark */
@keyframes verify-success {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.verify-checkmark {
  animation: verify-success 0.3s ease-out;
}
```

### Loading States

```css
/* Button loading spinner */
.auth-button-loading .spinner {
  animation: spin 0.8s linear infinite;
}

/* Full form loading overlay */
.auth-form-loading {
  position: relative;
}
.auth-form-loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(2px);
  animation: fade-in 0.2s ease;
}
```

---

## Implementation Checklist

### Phase 1: Layout Restructure

- [ ] Remove card container wrapper (update `AuthPageLayout`)
- [ ] Set page background to `bg-ui-bg-hero` (near-black)
- [ ] Create centered content container (max-width 360px)
- [ ] Implement flex column layout with proper spacing
- [ ] Move legal text to fixed footer position
- [ ] Remove "Back to Home" link
- [ ] Update heading to "Get Started with Nixelo"
- [ ] Update subheading with sign-in link

### Phase 2: Email-First Flow

- [ ] Redesign to email-first (like Mintlify)
- [ ] Add email input with icon prefix
- [ ] Add "Continue" button (enabled when email valid)
- [ ] Add "OR" divider
- [ ] Update Google button styling (white/light background)
- [ ] Implement email validation on blur/submit

### Phase 3: Verification Code Input

- [ ] Create `VerificationCodeInput` component
  - [ ] 6 separate input boxes
  - [ ] Auto-advance on digit entry
  - [ ] Auto-backspace navigation
  - [ ] Paste support (full code)
  - [ ] Focus styling per box
  - [ ] Error state (shake + red border)
  - [ ] Success state (green checkmark)
- [ ] Update verification flow UI
- [ ] Add resend code functionality with cooldown timer

### Phase 4: Onboarding Profile Step

- [ ] Create onboarding profile form
  - [ ] First name / Last name (two-column)
  - [ ] Company name (optional)
  - [ ] Password (optional with toggle)
  - [ ] Show/hide password toggle
- [ ] Pre-fill name from OAuth if available
- [ ] Add "Skip, use magic link instead" option
- [ ] Implement form validation
- [ ] Connect to user profile mutation

### Phase 5: Workspace Creation Step

- [ ] Create workspace creation form
  - [ ] Workspace name input
  - [ ] Auto-generated slug preview
  - [ ] Slug validation (unique, format)
  - [ ] "Create workspace" button
- [ ] Pre-fill from company name
- [ ] Add "Skip" option (creates personal workspace)
- [ ] Implement slug uniqueness check
- [ ] Connect to workspace creation mutation

### Phase 6: Animations

- [ ] Add entry animation keyframes to `index.css`
- [ ] Implement staggered content reveal
- [ ] Add step transition animations
- [ ] Add button hover/active transitions
- [ ] Add input focus transitions
- [ ] Add error shake animation
- [ ] Add code input fill animation
- [ ] Add loading overlay animation

### Phase 7: Polish

- [ ] Test keyboard navigation (Tab, Enter, Escape, Backspace)
- [ ] Add proper ARIA labels and roles
- [ ] Test with screen reader
- [ ] Verify focus trap in form
- [ ] Test all error states
- [ ] Test OAuth redirect flow
- [ ] Test email verification flow
- [ ] Test onboarding skip paths
- [ ] Responsive check (mobile, tablet)
- [ ] Cross-browser testing

### Phase 8: Dark/Light Mode

- [ ] Verify dark mode is primary (current implementation)
- [ ] Create light mode variant if needed (like Mintlify light)
- [ ] Test toggle between modes
- [ ] Ensure `light-dark()` tokens work correctly

---

## Related Files

### Source References
- Mintlify dark: `docs/research/library/mintlify/signup_desktop_dark.png`
- Mintlify light: `docs/research/library/mintlify/signup_desktop_light.png`
- Mintlify onboarding: `docs/research/library/mintlify/onboarding/*.png`
- Current Nixelo: `src/routes/signup.tsx`

### Implementation Files
- Route: `src/routes/signup.tsx`
- Form component: `src/components/auth/SignUpForm.tsx`
- Layout: `src/components/auth/AuthPageLayout.tsx`
- Verification: `src/components/auth/EmailVerificationForm.tsx`
- Auth logic: `convex/auth.ts`
- Theme tokens: `src/index.css`
- UI components: `src/components/ui/`

### Related Pages
- Sign In: `pages/02-signin.md`
- Landing: `pages/01-landing.md`
- Dashboard: `pages/04-dashboard.md`

---

*Last Updated: 2026-02-05*
*Status: Specification Complete - Awaiting Implementation*
