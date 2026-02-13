# THE DIRECTOR

> The vision layer. What perfection looks like. The bar that must be met.
>
> This document does not care about implementation. It dictates outcomes.
> For execution details, see individual specs in `specs/pages/`.

---

## Philosophy

### What Is "AI Slop"?

AI-generated UI has telltale signs:

1. **Over-wrapping** - Cards inside cards, containers for no reason
2. **Verbose helper text** - Explaining obvious things
3. **Generic patterns** - "Welcome back!" headers, "Back to Home" links
4. **Emoji icons** - 📋 🎫 ⚡ instead of proper icon library
5. **Excessive padding** - Everything floats in huge white space
6. **No hierarchy confidence** - Everything same visual weight
7. **Missing polish** - No animations, no hover states, no micro-interactions
8. **Template feel** - Looks like every other AI-generated SaaS

### What Is "Premium"?

Real products (Linear, Stripe, Vercel, Mintlify) have:

1. **Confident minimalism** - Only what's needed, nothing more
2. **Purposeful spacing** - Tight where it should be, breathing room where it matters
3. **Clear hierarchy** - Instantly know what's important
4. **Subtle depth** - Shadows, borders, backgrounds create layers
5. **Micro-interactions** - Hover states, transitions, feedback
6. **Consistent rhythm** - Spacing, sizing follows a system
7. **Professional illustrations** - Custom icons, not emoji
8. **Premium dark mode** - Near-black (#08090a), not gray (#111827)

### The Bar

For each page, ask:

> "Would I be embarrassed to show this to a designer at Linear?"

If yes → it's slop. Fix it.

---

## Reference Material

### Primary Reference: Mintlify

Location: `docs/research/library/mintlify/`

We're not copying Mintlify. We're learning from them:
- How they handle dark mode (near-black, opacity-based text)
- How they do auth pages (minimal, no cards)
- How they structure landing pages (product preview, customer logos)
- Their animation timing (0.2s default)
- Their spacing rhythm

### Our Screenshots

Location: `e2e/screenshots/`

Generated via `pnpm screenshots`. Four configs:
- `desktop-dark-*` (1920x1080)
- `desktop-light-*` (1920x1080)
- `tablet-light-*` (768x1024)
- `mobile-light-*` (390x844)

These are the SOURCE OF TRUTH for current state.

---

## Page Directory

### Public Pages

| Route | Status | Verdict |
|-------|--------|---------|
| `/` | 🔴 SLOP | Needs product preview, customer logos, tighter hero |
| `/signin` | 🔴 SLOP | Kill the card, kill back link, minimal |
| `/signup` | 🔴 SLOP | Same as signin |
| `/forgot-password` | 🔴 SLOP | Same pattern as signin |
| `/verify-email` | 🟡 REVIEW | Check for slop patterns |
| `/invite/:code` | 🟡 REVIEW | Check for slop patterns |
| `/unsubscribe` | 🟡 REVIEW | Simple page, probably fine |

### App Pages - Workspace Level

| Route | Status | Verdict |
|-------|--------|---------|
| `/:slug/dashboard` | 🟡 REVIEW | Check card usage, empty states |
| `/:slug/projects` | 🟡 REVIEW | List view patterns |
| `/:slug/issues` | 🟡 REVIEW | Table/list patterns |
| `/:slug/documents` | 🟡 REVIEW | Grid/list patterns |
| `/:slug/calendar` | 🟡 REVIEW | Calendar-specific patterns |
| `/:slug/analytics` | 🟡 REVIEW | Chart patterns |
| `/:slug/settings/*` | 🟡 REVIEW | Form patterns |
| `/:slug/members` | 🟡 REVIEW | Table patterns |

### App Pages - Project Level

| Route | Status | Verdict |
|-------|--------|---------|
| `/:slug/projects/:key` | 🟡 REVIEW | Project overview |
| `/:slug/projects/:key/board` | 🟡 REVIEW | Kanban patterns |
| `/:slug/projects/:key/backlog` | 🟡 REVIEW | List patterns |
| `/:slug/projects/:key/sprints` | 🟡 REVIEW | Sprint planning |
| `/:slug/projects/:key/settings` | 🟡 REVIEW | Form patterns |

### App Pages - Entity Detail

| Route | Status | Verdict |
|-------|--------|---------|
| `/:slug/issues/:key` | 🟡 REVIEW | Detail view patterns |
| `/:slug/documents/:id` | 🟡 REVIEW | Editor patterns |

### Modals & Overlays

| Component | Status | Verdict |
|-----------|--------|---------|
| Create Issue Modal | 🟡 REVIEW | Form in modal |
| Create Project Modal | 🟡 REVIEW | Form in modal |
| Create Document Modal | 🟡 REVIEW | Form in modal |
| Create Event Modal | 🟡 REVIEW | Form in modal |
| Global Search (⌘K) | 🟡 REVIEW | Command palette |
| Notification Panel | 🟡 REVIEW | Dropdown panel |
| User Menu | 🟡 REVIEW | Dropdown menu |
| Filter Panel | 🟡 REVIEW | Filter UI |
| Bulk Operations Bar | 🟡 REVIEW | Action bar |

### Onboarding Flow

| Step | Status | Verdict |
|------|--------|---------|
| Welcome Screen | 🟡 REVIEW | First impression |
| Create Organization | 🟡 REVIEW | Form |
| Create Workspace | 🟡 REVIEW | Form |
| Invite Team | 🟡 REVIEW | Form |
| Create First Project | 🟡 REVIEW | Form |

---

## Page Verdicts

### `/signin` - Sign In Page

**Current State**: SLOP

**Problems**:
1. Card wrapper - unnecessary container, adds visual noise
2. "Back to Home" link - patronizing, users know how to navigate
3. Verbose legal text - "By continuing, you acknowledge that you understand and agree to the Terms & Conditions and Privacy Policy" → too long
4. Full logo - could be icon-only on auth pages
5. Stacked animations - too many delayed animations feel gimmicky
6. Generic heading - "Welcome back" is template-speak

**Target State**:
- Pure background (#08090a dark / white light), NO card
- Logo (icon only) → Heading → Subheading with link → Form → Legal (one line)
- Content floats centered, ~360px max width
- Single subtle fade-in animation, not staggered
- Confident, minimal, premium

**Done When**:
- No card wrapper visible
- No "Back to Home" link
- Legal text is ONE line
- Page feels like Mintlify's auth, not a Bootstrap template

**Spec**: `specs/pages/signin.md`

---

### `/signup` - Sign Up Page

**Current State**: SLOP (same patterns as signin)

**Target State**: Same approach as signin - minimal, no card, confident

**Done When**: Indistinguishable quality from signin

**Spec**: `specs/pages/signup.md`

---

### `/` - Landing Page

**Current State**: SLOP

**Problems**:
1. No product preview - hero has no screenshot of actual product
2. No customer logos - no social proof
3. Emoji icons in feature cards - 📋 instead of proper icons
4. Circuit lines background - too subtle to matter
5. Generic stats - "30% faster" with no customer attribution
6. No case studies - abstract claims, not real stories
7. CTAs lack confidence - no arrows, generic text

**Target State**:
- Hero with product screenshot/mockup
- Customer logo strip below hero (grayscale)
- Feature cards with proper illustrations or icons
- At least one customer quote/case study
- CTAs with arrows ("Get Started →")
- Optional: announcement bar at top

**Done When**:
- Product screenshot visible in hero
- At least 4 customer logos visible
- No emoji icons anywhere
- At least one real testimonial/quote
- Would not look out of place next to mintlify.com

**Spec**: `specs/pages/landing.md`

---

### `/:slug/dashboard` - Dashboard

**Current State**: REVIEW NEEDED

**Potential Problems**:
- Over-carded layout (card inside card)
- Empty states too generic
- Stats without context
- Activity feed styling

**Target State**:
- Clean information hierarchy
- Meaningful empty states with clear CTAs
- Stats that tell a story
- Activity that's scannable

**Done When**:
- No unnecessary nesting
- Empty states have personality
- Information density feels right

**Spec**: `specs/pages/dashboard.md`

---

### Kanban Board (`/:slug/projects/:key/board`)

**Current State**: REVIEW NEEDED

**Potential Problems**:
- Column headers styling
- Card density and spacing
- Drag states
- Empty column states

**Target State**:
- Clean column separation
- Cards with clear hierarchy (title > meta > labels)
- Smooth drag animations
- Helpful empty states

**Done When**:
- Feels as polished as Linear's board view
- Drag and drop is buttery smooth
- No visual clutter

**Spec**: `specs/pages/board.md`

---

### Issue Detail (`/:slug/issues/:key`)

**Current State**: REVIEW NEEDED

**Potential Problems**:
- Too many sections visible at once
- Metadata styling (labels, assignee, dates)
- Comment section styling
- Activity feed integration

**Target State**:
- Clear primary content (title, description)
- Secondary info (metadata) clearly subordinate
- Comments feel conversational
- Activity is supplementary, not noisy

**Done When**:
- Can focus on issue content without distraction
- Metadata is accessible but not dominant
- Feels like Linear's issue detail

**Spec**: `specs/pages/issue-detail.md`

---

## Global Patterns

These apply to ALL pages:

### Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page enter | fade-in + slide-up | 0.3s | ease-out |
| Modal enter | scale-in + fade-in | 0.2s | ease-out |
| Modal exit | scale-out + fade-out | 0.15s | ease-in |
| Dropdown enter | slide-down + fade-in | 0.15s | ease-out |
| Hover states | all properties | 0.2s | ease |
| Focus ring | opacity | 0.1s | ease |

### Empty States

Every list/grid/table needs an empty state that:
- Has a relevant illustration or icon (not emoji)
- Has a clear headline
- Has a brief description (one line)
- Has a primary CTA when applicable
- Does NOT say "No items found" or "Nothing here"

### Loading States

- Skeletons for content areas (not spinners)
- Spinners only for actions (buttons, form submission)
- Skeleton should match actual content shape
- Subtle pulse animation, not harsh

### Error States

- Inline errors for forms (below input, red text)
- Toast for action failures
- Full-page error only for catastrophic failures
- Always provide recovery path

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (1200px+) | Full layout, sidebar visible |
| Tablet (768-1199px) | Collapsible sidebar, adjusted spacing |
| Mobile (<768px) | Bottom nav or hamburger, stacked layout |

---

## Verification Process

### For Each Page

1. **Screenshot comparison**: Current vs target reference
2. **Checklist review**: Every item in spec checked
3. **Animation audit**: All transitions present and smooth
4. **State coverage**: Empty, loading, error, success all handled
5. **Responsive check**: All breakpoints look intentional
6. **Dark/light mode**: Both themes polished

### Definition of Done

A page is DONE when:

- [ ] No card-for-no-reason patterns
- [ ] No verbose helper text
- [ ] No emoji icons
- [ ] No "Back to X" patronizing links
- [ ] Animations feel natural, not gimmicky
- [ ] Empty states have personality
- [ ] Loading states use skeletons
- [ ] Error states provide recovery
- [ ] Spacing follows 8px grid
- [ ] Typography uses correct variants
- [ ] Colors use semantic tokens only
- [ ] Works on all breakpoints
- [ ] Works in both themes
- [ ] Passes accessibility basics (contrast, focus)
- [ ] Would not embarrass us in front of Linear's design team

---

## Execution Order

### Phase 1: Auth Flow (Highest Impact)
1. `/signin`
2. `/signup`
3. `/forgot-password`

### Phase 2: First Impression
4. `/` (landing)
5. Onboarding flow

### Phase 3: Core App
6. `/:slug/dashboard`
7. `/:slug/projects/:key/board`
8. `/:slug/issues/:key`

### Phase 4: Everything Else
- Remaining pages in order of user frequency

---

## Appendix: Slop Detector Checklist

Use this when reviewing ANY page:

```
[ ] Is there a card that doesn't need to be a card?
[ ] Is there text explaining something obvious?
[ ] Are there emoji being used as icons?
[ ] Is there a "Back to X" link?
[ ] Is the legal/disclaimer text more than one line?
[ ] Is there excessive whitespace/padding?
[ ] Are there multiple nested containers?
[ ] Does the heading sound like a template? ("Welcome!", "Get Started", etc.)
[ ] Are animations staggered in a way that feels slow?
[ ] Is the empty state just "No items found"?
[ ] Are loading states using spinners instead of skeletons?
[ ] Does anything feel like Bootstrap/Tailwind UI default?
```

If ANY box is checked → it's slop. Fix it.

---

## Links

- **Component Patterns**: `docs/design/PATTERNS.md`
- **Design Tokens**: `docs/design/REFERENCE.md`
- **Design Principles**: `docs/design/STANDARDS.md`
- **Mintlify Reference**: `docs/research/library/mintlify/`
- **Current Screenshots**: `e2e/screenshots/`
- **Page Specs**: `docs/design/specs/pages/`
