# Landing Page - Current State

> **Route**: `/`
> **Status**: 🟡 Stronger structure, but still needs showcase discipline
> **Last Updated**: 2026-03-12


> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Screenshots

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |

---

## Structure

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ NavHeader                                                                                    │
│ [Nixelo] [Features] [Pricing] [Docs]                                  [Theme] [Sign in] [CTA]│
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Hero                                                                                         │
│                                                                                              │
│   [Docs, delivery, and time tracking in one operating system]                                │
│                                                                                              │
│   Replace scattered project tools                                                            │
│   with one sharper workspace.                                                                │
│                                                                                              │
│   Supporting copy                                                                            │
│   [Get Started Free] [See workflow tour]                                                     │
│   product / ops / client delivery     AI-native search     fewer tools                       │
│                                                                                              │
│   ┌──────────────────────────────── ProductShowcase ───────────────────────────────────────┐ │
│   │ macOS chrome                                                                            │ │
│   │                                                                                         │ │
│   │  Product control tower                                     [Open board]               │ │
│   │  ^ squeezed heading block: the title, copy, CTA, and 3-column board fight for width   │ │
│   │                                                                                         │ │
│   │  [In review] [Shipping next] [Done]                                                     │ │
│   │                                                                                         │ │
│   │  metrics cards                 AI assistant card                 connected surfaces      │ │
│   │  ^ mixed density: some panels feel dense/product-like, others feel brochure-like       │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Logo/proof strip                                                                             │
│ Features                                                                                     │
│ AI demo                                                                                      │
│ Story/proof section                                                                          │
│ Pricing                                                                                      │
│ Final CTA                                                                                    │
│ Footer                                                                                       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Composition

1. Sticky nav header
2. Hero with stronger product copy and integrated product showcase
3. Logo/proof strip
4. Feature grid
5. AI assistance demo section
6. Outcome/story section
7. Pricing
8. Final CTA
9. Footer

The structure is no longer generic. The remaining problem is that the hero and showcase still do
not feel compositionally disciplined enough to carry the page.

---

## Files

| File | Purpose |
|------|---------|
| `src/routes/index.tsx` | Landing page composition |
| `src/components/Landing/NavHeader.tsx` | Navigation header |
| `src/components/Landing/HeroSection.tsx` | Hero copy and CTA layout |
| `src/components/Landing/ProductShowcase.tsx` | Product preview mockup |
| `src/components/Landing/LogoBar.tsx` | Social-proof strip |
| `src/components/Landing/FeaturesSection.tsx` | Feature grid |
| `src/components/Landing/AIFeatureDemo.tsx` | AI workflow demo |
| `src/components/Landing/WhyChooseSection.tsx` | Proof/story cards |
| `src/components/Landing/PricingSection.tsx` | Pricing |
| `src/components/Landing/FinalCTASection.tsx` | Closing CTA |
| `src/components/Landing/Footer.tsx` | Footer |

---

## What Improved

| # | Improvement | Status |
|---|-------------|--------|
| 1 | Hero is no longer text-only | Fixed |
| 2 | Product showcase exists in the hero | Fixed |
| 3 | Social proof strip exists below the hero | Fixed |
| 4 | AI workflow/demo content exists | Fixed |
| 5 | Story/proof sections are more concrete than before | Improved |
| 6 | Final CTA section exists | Fixed |
| 7 | Footer has more trust/depth than the earlier minimal version | Improved |
| 8 | Light mode now uses a deliberate airy palette instead of washed-out dark-mode atmospherics | Fixed |
| 9 | Landing capture now waits for the hero/showcase entrance state instead of grabbing a half-faded frame | Fixed |

---

## Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | `Product control tower` is visibly squeezed because the showcase tries to be a board preview, a metrics deck, and a marketing card stack at the same time | `ProductShowcase.tsx` | HIGH |
| 2 | The showcase uses mixed visual grammar: some cards feel app-real, others feel decorative brochure filler | `ProductShowcase.tsx` | HIGH |
| 3 | The hero is closer to target, but the page still relies on a crafted mockup instead of a truly convincing product artifact | showcase strategy | MEDIUM |
| 4 | Logo strip still uses placeholder brand text instead of real proof | `LogoBar.tsx` | LOW |

---

## Review Notes

- The screenshot run may be valid technically while the composition is still wrong visually.
- The next pass should not be another copy tweak.
- Fix the showcase layout first:
  - give the title/copy block real breathing room
  - stop mixing three different card densities in the same frame
  - decide whether this surface is a product screenshot surrogate or a marketing explainer panel

---

## Summary

The landing page now has the right sections, but the hero still lacks visual authority. The main
failure is not missing structure. It is that the hero/showcase composition has too many competing
ideas and not enough hierarchy.
