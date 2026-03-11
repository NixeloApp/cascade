# Landing Page - Current State

> **Route**: `/`
> **Status**: 🟡 Structure is much closer to target, but public theme parity is still off
> **Last Updated**: 2026-03-10

---

## Screenshots

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |

---

## Current Composition

The landing page now renders:

1. Sticky nav header
2. Hero with stronger product copy and integrated product showcase
3. Logo/proof strip
4. Feature grid focused on reducing duplicated work/context
5. AI assistance demo section
6. Outcome-oriented proof/story section
7. Pricing
8. Closing CTA
9. Richer trust-oriented footer

---

## Current Elements

### Navigation Header
- Logo + nav links
- Theme toggle
- Sign in / Get Started or Go to App

### Hero
- Badge with integrated workspace positioning
- Stronger headline and supporting copy
- Real CTA pair
- Embedded `ProductShowcase` mockup
- Supporting proof row below CTAs

### Product Showcase
- Board/control-tower preview
- AI assistant summary panel
- Quick metrics cards
- Connected-surfaces panel

### Proof + Narrative
- Text-logo strip below hero
- Feature cards focused on context reduction
- AI workflow demo mockup
- Story cards replacing abstract percentage stats

### Conversion
- Pricing section
- Dedicated final CTA section
- Footer with trust/status treatment

---

## Files

| File | Purpose |
|------|---------|
| `src/routes/index.tsx` | Landing page composition |
| `src/components/Landing/NavHeader.tsx` | Navigation header |
| `src/components/Landing/HeroSection.tsx` | Hero and CTA copy |
| `src/components/Landing/ProductShowcase.tsx` | Product preview mockup |
| `src/components/Landing/LogoBar.tsx` | Social-proof strip |
| `src/components/Landing/FeaturesSection.tsx` | Feature grid |
| `src/components/Landing/AIFeatureDemo.tsx` | AI assistance mockup |
| `src/components/Landing/WhyChooseSection.tsx` | Outcome/story cards |
| `src/components/Landing/PricingSection.tsx` | Pricing tiers |
| `src/components/Landing/FinalCTASection.tsx` | Closing CTA |
| `src/components/Landing/Footer.tsx` | Footer and trust treatment |

---

## What Improved

| # | Improvement | Status |
|---|-------------|--------|
| 1 | Hero is no longer text-only | Fixed |
| 2 | Product showcase exists in the hero | Fixed |
| 3 | Social proof strip exists below the hero | Fixed |
| 4 | AI workflow/demo content exists | Fixed |
| 5 | Abstract stats were replaced with more concrete story cards | Fixed |
| 6 | Final CTA section exists | Fixed |
| 7 | Footer has more trust/depth than the previous minimal version | Improved |
| 8 | Fake demo CTA was removed | Fixed |

---

## Remaining Gaps

| # | Problem | Severity |
|---|---------|----------|
| 1 | Light mode palette is awkward: dark purple / dark blue accents and atmospherics read pasted in from dark mode instead of designed for a light canvas | HIGH |
| 2 | Screenshot references need a fresh targeted rerun against the current landing implementation | HIGH |
| 3 | Logo strip uses text placeholders rather than real customer/brand assets | MEDIUM |
| 4 | Hero/product preview is a crafted mockup, not a captured real app screenshot | MEDIUM |
| 5 | No announcement banner yet | LOW |
| 6 | No dedicated enterprise section yet | LOW |
| 7 | Footer/legal/resources links are still placeholders | LOW |

---

## Summary

The landing page is no longer the earlier generic hero + feature grid. It now has the core structure the target doc expected: product-led hero, proof strip, AI narrative, stronger conversion flow, and a richer close.

The current blocker is theme design, not page structure. Dark mode is directionally coherent; light mode still feels like the same dark gradients and accents were dropped onto a white page without being rebalanced.

The next step is visual verification, not another blind rewrite:

1. Run `pnpm screenshots -- --spec 01-landing --config desktop-dark,desktop-light`
2. Replace the stale screenshot refs in this folder
3. Redesign the public light-mode palette so it is intentionally lighter and cleaner than dark mode instead of simply reusing dark chroma
3. Re-score remaining gaps after looking at actual captures
