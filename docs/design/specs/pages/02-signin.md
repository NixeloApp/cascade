# Sign In Page

> **Status**: TODO - Awaiting Implementation
> **Priority**: HIGH (Phase 3 - Auth Flow)

---

## Current State Analysis

**Screenshot**: `e2e/screenshots/02-empty-signin.png`

### Visual Description (Current Nixelo)

The current sign-in page features:

1. **Background**: Light gray/off-white solid background (`bg-ui-bg-secondary`)
2. **Layout**: Centered card-based design with visible shadow
3. **Navigation**: "Back to Home" link with left arrow above the card
4. **Logo**: Nixelo "N" logo (blue/purple gradient) centered at top of card
5. **Typography**:
   - Heading: "Welcome back" (dark text, ~24px, bold)
   - Subheading: "Sign in to your account to continue" (muted gray, ~14px)
6. **Auth Options**:
   - "Sign in with Google" button (white with Google icon, full-width)
   - "or" divider with horizontal lines
   - "Continue with email" button (white with envelope icon, full-width)
7. **Sign Up Link**: "Don't have an account? Sign up" (Sign up in pink/brand color)
8. **Legal Text**: "By continuing, you acknowledge that you understand and agree to the Terms & Conditions and Privacy Policy" (small, muted, centered)
9. **Card**: White card with rounded corners (~12px), subtle shadow, ~400px max-width

### Issues Identified

| Issue | Severity | Notes |
|-------|----------|-------|
| Card-based layout feels dated | HIGH | Mintlify uses full-screen, no card |
| Light background lacks premium feel | HIGH | Near-black creates depth |
| Too much visual hierarchy | MEDIUM | Multiple containers, dividers |
| Buttons appear flat/generic | MEDIUM | Need subtle depth cues |
| Legal text placement crowded | LOW | Should float at bottom |
| No entry animations | LOW | Static page load |

---

## Target State

**Reference**:
- `docs/research/library/mintlify/app-dashboard_desktop_dark.png` (Primary)
- `docs/research/library/mintlify/dashboard/login-page.png` (Light mode variant)

### Key Improvements

1. **Full-screen dark canvas** - No card container, content floats on `#08090a` background
2. **Minimal hierarchy** - Logo, heading, form, footer - nothing else
3. **Subtle form fields** - Dark inputs with soft borders, not white cards
4. **Clear CTA separation** - Email/password flow vs OAuth visually distinct
5. **Bottom-anchored legal** - Terms/Privacy as footer, not crowded with form
6. **Entrance animation** - Fade + slide up on page load

### Mintlify Sign-In Anatomy (Dark Mode)

From `app-dashboard_desktop_dark.png`:

- **Background**: Near-black (`#08090a` or similar)
- **Logo**: Mintlify leaf icon in brand green (`#18e299`), ~24px, left-aligned to content
- **Heading**: "Sign in to Mintlify" (white, ~28px, font-weight 600)
- **Subheading**: "Don't have an account? Get started ->" (muted white + green link)
- **Form Label**: "Enter your email" (white/light, ~14px, above input)
- **Input Field**: Dark background with subtle border, email icon prefix, placeholder "name@email.com"
- **Primary Buttons**:
  - "Continue with password" (dark, subtle border, disabled until email entered)
  - "Continue with email" (dark with email icon)
- **Divider**: "OR" with subtle horizontal lines
- **OAuth Button**: "Continue with Google" (slightly lighter background, Google icon)
- **Legal**: "By signing in, you agree to the Terms of Service and Privacy Policy" (muted, links underlined)

---

## ASCII Wireframe

### Target Layout (Dark Theme)

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
|                           Sign in to Nixelo                                    |
|                      (28px, white, font-weight 600)                            |
|                                                                                |
|                    Don't have an account? Get started ->                       |
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
|                    |       Continue with password       |                      |
|                    +------------------------------------+                      |
|                          (disabled until email valid)                         |
|                                                                                |
|                    +------------------------------------+                      |
|                    |  [mail]  Continue with email       |                      |
|                    +------------------------------------+                      |
|                            (magic link option)                                |
|                                                                                |
|                    ----------------  OR  ----------------                      |
|                                                                                |
|                    +------------------------------------+                      |
|                    |   [G]   Continue with Google       |                      |
|                    +------------------------------------+                      |
|                       (lighter bg, prominent OAuth)                           |
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                                                                                |
|                    By signing in, you agree to the                            |
|                    Terms of Service and Privacy Policy.                       |
|                          (12px, muted, links)                                 |
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
[Password button] - 48px height
    |
    | 12px gap
    |
[Email button] - 48px height
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

## Functionality Breakdown

### Form States

- [ ] **Empty state**: Email input empty, buttons disabled (password) or enabled (email/Google)
- [ ] **Email entered**: Validate email format, enable "Continue with password"
- [ ] **Invalid email**: Show inline error below input, red border
- [ ] **Password mode**: Slide in password field below email
- [ ] **Magic link mode**: Show success message "Check your email"
- [ ] **OAuth redirect**: Show loading state, redirect to Google
- [ ] **Error state**: Auth failed - show error toast/message
- [ ] **Rate limited**: Show "Too many attempts" message

### OAuth Flows

1. **Google Sign-In**:
   - Click "Continue with Google"
   - Show loading spinner in button
   - Redirect to Google OAuth consent
   - Return to callback URL
   - Create/update user session
   - Redirect to dashboard or onboarding

2. **Email + Password**:
   - Enter email -> validate -> show password field
   - Enter password -> submit
   - Validate credentials
   - Success: redirect to dashboard
   - Failure: show error, keep form state

3. **Magic Link**:
   - Enter email -> click "Continue with email"
   - Send magic link via email
   - Show "Check your email" message
   - User clicks link -> auto-auth -> redirect

### Error States

| Error | Display | Recovery |
|-------|---------|----------|
| Invalid email format | Inline below input, red text | User corrects email |
| User not found | Toast: "No account found" | Link to sign up |
| Wrong password | Inline: "Incorrect password" | Retry or magic link |
| OAuth cancelled | Toast: "Sign in cancelled" | Try again |
| Network error | Toast: "Connection failed" | Retry button |
| Rate limited | Full form overlay | Wait timer |

### Keyboard Navigation

- `Tab`: Move between inputs and buttons
- `Enter`: Submit current form step
- `Escape`: Clear errors, reset form

---

## Component Inventory

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **Page Container** | Card on gray bg | Full-screen dark canvas | Remove card wrapper |
| **Logo** | In card header | Floating, above heading | Keep Nixelo brand mark |
| **Heading** | "Welcome back" | "Sign in to Nixelo" | More direct |
| **Subheading** | Separate line | Inline with signup link | Compact |
| **Email Input** | White bg, border | Dark bg, subtle border, icon | Semantic input token |
| **Password Input** | N/A (hidden) | Same as email, toggleable | Eye icon for show/hide |
| **Primary Button** | White with border | Dark with subtle depth | Disabled state darker |
| **OAuth Button** | Same as primary | Slightly elevated | Visual distinction |
| **Divider** | "or" with lines | "OR" with subtle lines | Same pattern, darker |
| **Legal Links** | In card footer | Page footer, fixed | Underlined on hover |
| **Back Link** | Above card | Remove or minimal | Less escape hatches |

### New Components Needed

1. **AuthInput**: Dark-themed input with icon prefix slot
2. **AuthButton**: Primary, secondary, OAuth variants
3. **AuthDivider**: "OR" with horizontal rules
4. **AuthLegal**: Footer text with legal links

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
| Button hover bg | Lightened variant | Subtle lift |
| Button disabled | `--color-ui-bg-secondary` | Darker, muted text |
| Divider line | `--color-ui-border` | Very subtle |
| Divider text | `--color-ui-text-tertiary` | Muted |
| Error text | `--color-status-error` | Red |
| Legal text | `--color-ui-text-tertiary` | Very muted |

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
| Legal from bottom | 32px | `pb-8` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Input | 8px | `rounded-lg` |
| Button | 8px | `rounded-lg` |

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
.auth-button-oauth:hover {
  box-shadow: 0 0 0 1px rgba(255,255,255,0.1);
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

### Password Field Reveal

```css
@keyframes slide-down {
  from {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
  }
  to {
    opacity: 1;
    max-height: 80px;
    margin-top: 12px;
  }
}

.password-field-enter {
  animation: slide-down 0.25s ease-out forwards;
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

- [ ] Remove card container wrapper
- [ ] Set page background to `bg-ui-bg-hero` (near-black)
- [ ] Create centered content container (max-width 360px)
- [ ] Implement flex column layout with proper spacing
- [ ] Move legal text to fixed footer position
- [ ] Remove "Back to Home" link (or make minimal)

### Phase 2: Component Updates

- [ ] Create `AuthInput` component with dark theme
  - [ ] Icon prefix slot
  - [ ] Focus ring styling
  - [ ] Error state styling
  - [ ] Disabled state
- [ ] Create `AuthButton` component variants
  - [ ] Primary (dark bg)
  - [ ] Secondary (lighter)
  - [ ] OAuth (with provider icon)
  - [ ] Loading state with spinner
  - [ ] Disabled state
- [ ] Create `AuthDivider` component
- [ ] Update logo component for auth pages

### Phase 3: Form Logic

- [ ] Implement email validation (client-side)
- [ ] Add password field toggle (show/hide)
- [ ] Implement form state machine (empty -> email -> password)
- [ ] Add proper error handling and display
- [ ] Connect to Convex auth mutations
- [ ] Implement magic link flow
- [ ] Implement Google OAuth flow

### Phase 4: Animations

- [ ] Add entry animation keyframes to `index.css`
- [ ] Implement staggered content reveal
- [ ] Add button hover/active transitions
- [ ] Add input focus transitions
- [ ] Add error shake animation
- [ ] Add password field slide animation
- [ ] Add loading overlay animation

### Phase 5: Polish

- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Add proper ARIA labels and roles
- [ ] Test with screen reader
- [ ] Verify focus trap in form
- [ ] Test all error states
- [ ] Test OAuth redirect flow
- [ ] Test magic link email delivery
- [ ] Responsive check (mobile, tablet)
- [ ] Cross-browser testing

### Phase 6: Dark/Light Mode

- [ ] Verify dark mode is primary (current implementation)
- [ ] Create light mode variant tokens if needed
- [ ] Test toggle between modes
- [ ] Ensure `light-dark()` tokens work correctly

---

## Related Files

### Source References
- Mintlify dark: `docs/research/library/mintlify/app-dashboard_desktop_dark.png`
- Mintlify light: `docs/research/library/mintlify/dashboard/login-page.png`
- Current Nixelo: `e2e/screenshots/02-empty-signin.png`

### Implementation Files
- Route: `src/routes/signin.tsx` (or similar)
- Auth logic: `convex/auth.ts`
- Theme tokens: `src/index.css`
- UI components: `src/components/ui/`

### Related Pages
- Sign Up: `pages/03-signup.md`
- Landing: `pages/01-landing.md`
- Dashboard: `pages/04-dashboard.md`

---

*Last Updated: 2026-02-05*
*Status: Specification Complete - Awaiting Implementation*
