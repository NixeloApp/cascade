# Landing Page - Current State

> **Route**: `/`
> **Status**: 🟡 Hero, proof strip, and evidence section read like the product; closing sections still need polish
> **Last Updated**: 2026-03-21

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
│   │ app/workspace header                                                                    │ │
│   │                                                                                         │ │
│   │  Delivery board                                  [client-ready] [docs stay linked]     │ │
│   │                                                                                         │ │
│   │  [In review] [Shipping next] [Done]             workspace pulse + AI assistant rail     │ │
│   │                                                                                         │ │
│   │  ^ board density and side-rail density now read like one product surface               │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Workflow proof strip                                                                         │
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
3. Workflow proof strip
4. Feature grid
5. AI assistance demo section
6. Outcome/story section
7. Pricing
8. Final CTA
9. Footer

The structure is no longer generic, the hero showcase reads like a workspace shell, the proof strip
reinforces that same product language, and the story/proof section now shows concrete operating
evidence instead of generic outcome cards. The remaining problem is no longer the middle of the
page. It is that the closing landing surfaces still need stronger product realism and consistency.

---

## Files

| File | Purpose |
|------|---------|
| `src/routes/index.tsx` | Landing page composition |
| `src/components/Landing/NavHeader.tsx` | Navigation header |
| `src/components/Landing/HeroSection.tsx` | Hero copy and CTA layout |
| `src/components/Landing/ProductShowcase.tsx` | Product preview mockup |
| `src/components/Landing/LogoBar.tsx` | Workflow-proof strip |
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
| 10 | Proof strip now shows product-grounded workflow evidence instead of placeholder logo chips | Fixed |
| 11 | Story/proof section now anchors its claims in concrete workflow evidence instead of generic outcome cards | Fixed |

---

## Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | Pricing and closing CTA still lean more on generic marketing structure than product-grounded evidence | lower landing closing surfaces | MEDIUM |
| 2 | Tablet/mobile rhythm still needs explicit review so the product preview stays authoritative above the fold | hero / landing responsive rhythm | MEDIUM |

---

## Review Notes

- The screenshot run may be valid technically while the composition is still wrong visually.
- The hero, proof strip, and evidence section are no longer the first places to spend effort.
- The next pass should focus on the closing landing surfaces:
  - keep pricing and final CTA grounded in app-like surfaces instead of decorative marketing grammar
  - turn remaining copy-only credibility claims into clearer product evidence wherever possible
  - review mobile/tablet rhythm so the product preview keeps authority above the fold

---

## Summary

The landing page now has the right sections, a convincing product showcase, a product-grounded
proof strip, and a stronger evidence section. The remaining work is broader consistency: make the
closing surfaces feel less like polished marketing filler and more like extensions of the product
we actually ship.
