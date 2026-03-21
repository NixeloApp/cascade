# Landing Page - Current State

> **Route**: `/`
> **Status**: REVIEWED, with only routine follow-up polish left
> **Last Updated**: 2026-03-21

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Purpose

The landing page is supposed to prove three things quickly:

1. Nixelo is a unified operating workspace, not a loose tool bundle.
2. The product surface looks like a real application, not a brochure mock.
3. The page can hold up across desktop, tablet, and mobile without turning into generic SaaS
   filler.

This branch already corrected the biggest earlier failures:

- fake logo-strip proof
- generic pricing and CTA sections
- unconvincing product showcase
- weak mobile/tablet hierarchy

---

## Screenshot Matrix

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

The landing spec is now based on the canonical viewport matrix, not desktop-only review.

---

## Page Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ NavHeader                                                                                   │
│ brand | section links | auth/actions | responsive compact nav                              │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Hero                                                                                        │
│ product-first copy + CTA + proof pills + integrated ProductShowcase                         │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Workflow proof strip                                                                        │
│ real product/workflow evidence instead of fake logos                                        │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Features                                                                                    │
│ grounded feature cards                                                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ AI demo                                                                                     │
│ product-like assistant/workflow surface                                                     │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Why choose / proof                                                                          │
│ operating evidence and audience-specific outcomes                                           │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Pricing                                                                                     │
│ rollout-grounded plan framing                                                               │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Final CTA                                                                                   │
│ product handoff, not generic marketing CTA cards                                            │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Footer                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Composition

### 1. Navigation and above-the-fold control

- Desktop keeps the broader nav treatment.
- Tablet/mobile now collapse earlier so the header no longer burns too much vertical space before
  the product surface begins.

### 2. Hero + product showcase

- The hero is now product-first instead of copy-only.
- `ProductShowcase` was rebuilt into a more believable workspace shell, not a generic browser
  mock.
- Supporting proof pills stay compact on smaller screens so the showcase remains visible earlier.

### 3. Proof surfaces

- The old fake logo strip was replaced with workflow proof.
- `WhyChooseSection` now speaks in workflow evidence rather than generic marketing claims.

### 4. Lower-page commerce / conversion surfaces

- Pricing now maps to real rollout stages rather than generic pricing-card language.
- Final CTA is framed as product handoff / next-step continuity, not abstract conversion copy.

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Product credibility | Much stronger than the earlier branch state. The page now points back to real workflow surfaces instead of decorative placeholders. |
| Responsive hierarchy | Better. Tablet/mobile no longer carry desktop nav/hero density too far down the page. |
| Section order | Coherent. Proof now supports pricing and CTA rather than arriving after them. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | A few landing surfaces still carry more bespoke visual treatment than the underlying product claim needs | shared landing sections | LOW |
| 2 | The page is now product-grounded, but some screenshot states still read like polished composites rather than direct product captures | overall landing strategy | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/index.tsx` | Landing composition |
| `src/components/Landing/NavHeader.tsx` | Navigation |
| `src/components/Landing/HeroSection.tsx` | Hero layout |
| `src/components/Landing/ProductShowcase.tsx` | Main product evidence surface |
| `src/components/Landing/LogoBar.tsx` | Workflow proof strip |
| `src/components/Landing/FeaturesSection.tsx` | Feature cards |
| `src/components/Landing/AIFeatureDemo.tsx` | AI workflow section |
| `src/components/Landing/WhyChooseSection.tsx` | Evidence/proof section |
| `src/components/Landing/PricingSection.tsx` | Rollout-grounded pricing |
| `src/components/Landing/FinalCTASection.tsx` | Closing handoff CTA |
| `src/components/Landing/Footer.tsx` | Footer |

---

## Summary

The landing page is current and substantially better than the earlier branch state. The main
structural problems were already fixed. Remaining work is minor visual discipline, not missing
sections or broken product proof.
