# Landing Page - Current State

> **Route**: `/`
> **Status**: 🔴 SLOP
> **Last Updated**: Run `pnpm screenshots` to regenerate

---

## Screenshots

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |

---

## Structure

The current landing page layout:

```
+-------------------------------------------------------------------------------------------+
|  [N] Nixelo     Features  Pricing  Resources         [☀] [Sign in] [Get Started]          |
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|                          ~~~~~~~~~ AMBIENT GLOW ORBS ~~~~~~~~~                            |
|                          ~~~~~~~~~ CIRCUIT FLOW LINES ~~~~~~~~                            |
|                                                                                           |
|                     .-----------------------------------.                                  |
|                    | Project Management · Time Tracking |                                 |
|                     '-----------------------------------'                                  |
|                           (pill badge, subtle border)                                     |
|                                                                                           |
|                      Revolutionize Your Workflow.                                         |
|                       Harmonize Your Team.                                                |
|                          (two-line headline)                                              |
|                                                                                           |
|                  Experience the future of project management                              |
|                  with integrated tracking, automation...                                  |
|                            (muted subheadline)                                            |
|                                                                                           |
|                   [Get Started Free]    [▶ Watch Demo]                                    |
|                    (gradient pill)       (outlined)                                       |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|                       Stop juggling tools. Start shipping.                                |
|                  Project management shouldn't feel like a second job.                     |
|                                                                                           |
|     +------------------------+ +------------------------+ +------------------------+      |
|     | [⚡] icon container    | | [📊] icon container    | | [🎯] icon container    |      |
|     |                        | |                        | |                        |      |
|     | Real-time              | | Visual                 | | Smart                  |      |
|     | Collaboration          | | Analytics              | | Automation             |      |
|     |                        | |                        | |                        |      |
|     | Description text that  | | Description text that  | | Description text that  |      |
|     | explains the feature.  | | explains the feature.  | | explains the feature.  |      |
|     |                        | |                        | |                        |      |
|     | [Learn more →]         | | [Learn more →]         | | [Learn more →]         |      |
|     +------------------------+ +------------------------+ +------------------------+      |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|    +--------------------------------------------------------------------------------+     |
|    |                                                                                |     |
|    |                    Teams actually like using it.                               |     |
|    |           No training required. No steep learning curve.                       |     |
|    |                                                                                |     |
|    |   30% faster    10% efficient    95% rate    95% reduction                     |     |
|    |   ████████████  ████████████    ████████████  ████████████                     |     |
|    |   Task compl.   Team product.   Satisfaction  Context switch                   |     |
|    |                                                                                |     |
|    +--------------------------------------------------------------------------------+     |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  [N] Nixelo                                                                               |
|  The intelligent project management platform.                                             |
|                                                                                           |
|   PRODUCT          ORGANIZATION       RESOURCES                                           |
|   Features         About              Blog                                                |
|   Pricing          Careers            Documentation                                       |
|   Changelog        Contact            Community                                           |
|                                                                                           |
|  ────────────────────────────────────────────────────────────────────                     |
|  © 2026 Nixelo, Inc.  [FB] [TT] [PA]            Privacy · Terms · Cookies                 |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
```

---

## Current Elements

### Navigation Header
- **Logo**: Gradient "N" icon + "Nixelo" text
- **Nav links**: Features, Pricing, Resources
- **Theme toggle**: Sun/moon icon
- **Sign in**: Ghost text link
- **Get Started**: Gradient pill button

### Background Effects
- **Ambient orbs**: Fixed position blurred circles (brand/info/success)
- **Circuit lines**: SVG pattern with faint curved lines

### Hero Section
- **Badge**: "Project Management · Time Tracking" pill
- **Headline**: Two-line, second line gradient accent
- **Subheadline**: Muted description
- **CTAs**: Two buttons (gradient + outlined)

### Features Section
- **Heading**: "Stop juggling tools. Start shipping."
- **Subheading**: Secondary description
- **Cards**: 3-column grid with icons, titles, descriptions, links

### Stats Section
- **Card**: Large rounded secondary background
- **Heading**: "Teams actually like using it."
- **Stats**: 4 animated progress bars with percentages

### Footer
- **Logo + tagline**
- **Link columns**: Product, Organization, Resources
- **Bottom bar**: Copyright, social icons, legal links

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/index.tsx` | Route definition | ~25 |
| `src/components/landing/NavHeader.tsx` | Navigation header | ~120 |
| `src/components/landing/HeroSection.tsx` | Hero content | ~80 |
| `src/components/landing/FeaturesSection.tsx` | Feature cards | ~100 |
| `src/components/landing/WhyChooseSection.tsx` | Stats section | ~120 |
| `src/components/landing/Footer.tsx` | Page footer | ~150 |
| `src/components/landing/CircuitFlowLines.tsx` | Background pattern | ~60 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | Light background lacks premium depth | index.tsx | HIGH |
| 2 | Hero missing product showcase | HeroSection.tsx | HIGH |
| 3 | No customer logos/social proof | N/A | HIGH |
| 4 | Feature cards feel generic | FeaturesSection.tsx | MEDIUM |
| 5 | Circuit lines too subtle | CircuitFlowLines.tsx | MEDIUM |
| 6 | Missing "enterprise" section | N/A | MEDIUM |
| 7 | No case studies/testimonials | N/A | MEDIUM |
| 8 | Stats are abstract, not customer-tied | WhyChooseSection.tsx | MEDIUM |
| 9 | Footer lacks depth | Footer.tsx | LOW |
| 10 | Missing announcement banner | N/A | LOW |
| 11 | No "Get a demo" booking | N/A | LOW |
| 12 | Missing AI feature showcase | N/A | LOW |

---

## Current Colors (Light Theme)

| Element | Current Value |
|---------|---------------|
| Page background | Light gray/white |
| Card background | Gradient (light gray) |
| Primary text | Dark gray |
| Secondary text | Medium gray |
| Card borders | Subtle gray |
| CTA gradient | Cyan-to-teal |

---

## Summary

The current landing page has:
- Light-themed design instead of premium dark
- No product screenshot/showcase in hero
- No customer logos (social proof)
- Abstract stats not tied to real customers
- Missing enterprise-focused sections
- Circuit line background too subtle
- Generic feature cards
- No AI feature demonstration

Target state should match Mintlify's approach:
- Near-black background (#08090a)
- Product screenshot prominently displayed
- Customer logos immediately below hero
- Customer stories and case studies
- Enterprise section with CTA
- Final CTA section
