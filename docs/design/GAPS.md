# Design Gaps

> Actionable improvements identified from competitive analysis (Mintlify, etc.)

---

## Priority Matrix

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| **P0** | Auth pages - remove card, simplify | 30 min | High |
| **P0** | CTA arrows ("Get Started →") | 15 min | Medium |
| **P1** | Customer logos on landing | 1-2 hr | High |
| **P1** | Product preview in hero | 2-4 hr | High |
| **P2** | Custom illustrations (replace emoji) | 4-8 hr | Medium |
| **P2** | Hero gradient background | 2-4 hr | Medium |
| **P2** | Customer stories carousel | 4-8 hr | Medium |
| **P3** | Announcement bar | 1-2 hr | Low |
| **P3** | Footer status indicator | 30 min | Low |

---

## P0 - Quick Wins

### Auth Pages

**Current:**
- Card wrapper with padding
- "Back to Home" link
- Verbose legal text
- Full logo

**Target (Mintlify-style):**
- No card - content floats on pure `#08090a` background
- No back link
- One-line legal text at bottom
- Icon-only logo on auth

**Files:** `src/components/auth/AuthPageLayout.tsx`

**Changes:**
```tsx
// Remove: card-subtle p-8 wrapper
// Remove: Back to Home link
// Simplify: Legal text to one line
// Consider: Logo icon-only variant
```

### CTA Arrows

**Current:** "Get Started"
**Target:** "Get Started →"

Add arrows to primary CTAs for forward momentum.

**Files:** Landing page CTAs, auth page links

---

## P1 - High Impact

### Customer Logos

Add grayscale customer logo strip below hero.

**Requirements:**
- 6-8 logos
- Grayscale filter
- Responsive (fewer on mobile)
- "Trusted by" or no label

**Reference:** Mintlify shows ANTHROPIC, Coinbase, Microsoft, Perplexity, HubSpot, X, PayPal, Lovable

### Product Preview

Add screenshot/mockup in landing hero showing the actual product.

**Options:**
1. Static screenshot with subtle shadow
2. Animated mockup (typing, interactions)
3. Live embedded demo (complex)

**Reference:** Mintlify shows their docs dashboard with sidebar, content, panels

---

## P2 - Medium Effort

### Custom Illustrations

Replace emoji icons in feature cards with custom SVG illustrations.

**Current:** 📋 🎫 📄 📊
**Target:** Isometric/line art illustrations (like Mintlify's green-tinted 3D shapes)

**Scope:**
- Landing page feature cards
- Empty states
- Onboarding screens

### Hero Gradient

Replace circuit lines with aurora/gradient background.

**Current:** Circuit flow lines + ambient glows
**Target:** Subtle gradient that feels premium, not "techy"

**Options:**
1. CSS gradient animation
2. Canvas/WebGL aurora effect
3. Static gradient image

### Customer Stories

Build testimonial carousel component.

**Requirements:**
- 4 customer cards
- Logo + quote + name/title
- Carousel with dots
- "Read story →" links

---

## P3 - Nice to Have

### Announcement Bar

Dismissible banner at top of landing page.

**Example:** "⚡ New: AI-powered sprint planning → Learn more"

### Footer Status

"All systems operational" indicator with green dot.

**Implementation:** Link to status page or show real-time status from monitoring.

---

## Completed

| Item | Date | Notes |
|------|------|-------|
| Dark mode background (#08090a) | - | Already implemented |
| Text opacity hierarchy | - | Already implemented |
| Ultra-subtle borders | - | Already implemented |
| Transition timing (0.2s) | - | Already implemented |

---

## Research Reference

See `docs/research/library/mintlify/` for:
- Screenshots (all viewports, dark/light)
- CSS variables (`*_deep.json`)
- Animations/keyframes
- Design analysis (`DESIGN_ANALYSIS.md`)
