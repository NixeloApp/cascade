# Landing Page - Target State

> **Route**: `/`
> **Reference**: Mintlify landing page
> **Goal**: Premium, dark-first, product-focused

---

## Reference Screenshots (Mintlify)

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/reference-mintlify-desktop-dark.png) |
| Desktop | Light | ![](screenshots/reference-mintlify-desktop-light.png) |

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Background | Light/white | Near-black (#08090a) |
| Hero | Text only | Product screenshot |
| Social proof | None | Customer logos bar |
| Features | Generic cards | AI-focused demos |
| Enterprise | Missing | Dedicated section |
| Testimonials | Abstract stats | Customer stories |
| Footer | Basic | Rich with security badge |
| Announcement | None | Dismissible banner |

---

## Target Layout

```
+================================================================================+
|  [!] Self-updating docs with agent suggestions                            [X]  |
+================================================================================+
|                                                                                 |
|  [N] Nixelo      Features  Pricing  Resources  Customers      [Theme] [Sign in] [Get Started] |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                      .------------------------.                                 |
|                     | The Intelligent Project |                                |
|                     |    Management Platform   |                                |
|                      '------------------------'                                 |
|                         (pill badge, subtle)                                    |
|                                                                                 |
|               Revolutionize Your Workflow.                                      |
|               Harmonize Your Team.                                              |
|                   (large headline, gradient accent)                             |
|                                                                                 |
|               Experience the future of project management                       |
|               with integrated tracking, automation, and collaboration.          |
|                         (muted subheadline)                                     |
|                                                                                 |
|                  [  Get Started Free  ]    [  Watch Demo  >  ]                  |
|                    (gradient pill)          (ghost + icon)                      |
|                                                                                 |
|         +--------------------------------------------------------------+        |
|         |                                                              |        |
|         |                    [PRODUCT SCREENSHOT]                      |        |
|         |              Dashboard / Board / Editor Preview              |        |
|         |                                                              |        |
|         +--------------------------------------------------------------+        |
|                   (elevated card with shadow, slight tilt)                      |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|          STRIPE    VERCEL    NOTION    ANTHROPIC    COINBASE    PERPLEXITY     |
|                        (grayscale customer logos)                               |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                     Built for the intelligence age                              |
|          Integrate AI into every part of your workflow.                         |
|                                                                                 |
|     +----------------------------------+  +----------------------------------+  |
|     |  [icon]                          |  |  [icon]                          |  |
|     |  Built for both people and AI    |  |  Self-updating knowledge mgmt    |  |
|     +----------------------------------+  +----------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                   Intelligent assistance for your users                         |
|                                                                                 |
|     +----------------------------------------------------------------------+    |
|     |   How do I add a board to my project?                                |    |
|     |   ________________________________________________________________   |    |
|     |   To create a new board in Nixelo:                                   |    |
|     |   1. Navigate to your project                                        |    |
|     |   2. Click "New Board" in the sidebar                                |    |
|     +----------------------------------------------------------------------+    |
|                        (AI chat interface mockup)                               |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|    ENTERPRISE                                                                   |
|               Bring intelligence to                                             |
|               enterprise knowledge                        [ Explore Enterprise ]|
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|     +------------------------------------------------------+                    |
|     |  CUSTOMER STORY                                      |                    |
|     |  See how Acme Corp accelerates with Nixelo           |    [IMAGE]         |
|     |  Read story ->                                       |                    |
|     |  500+ Daily users    10+ Integrations                |                    |
|     +------------------------------------------------------+                    |
|                                                                                 |
|          [ACME]     [BETA]     [GAMMA]     [DELTA]     [EPSILON]               |
|                   (customer logo carousel)                                      |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                  Unlock knowledge for any industry                              |
|                                                                                 |
|     +----------------+ +----------------+ +----------------+ +----------------+  |
|     |  [Company 1]   | |  [Company 2]   | |  [Company 3]   | |  [Company 4]   |  |
|     | Read story ->  | | Read story ->  | | Read story ->  | | Read story ->  |  |
|     +----------------+ +----------------+ +----------------+ +----------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|               Make documentation                                                |
|               your winning advantage                                            |
|                                                                                 |
|              [ Get started for free ]      [ Get a demo ]                       |
|                                                                                 |
|        Pricing on your terms                    Start building                  |
|        Pricing details ->                       Quickstart ->                   |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  [N] Nixelo                                                       [X] [GH] [D] |
|                                                                                 |
|   EXPLORE        RESOURCES         DOCUMENTATION      COMPANY        LEGAL      |
|   Startups       Customers         Getting Started    Careers        Privacy    |
|   Enterprise     Blog              API Reference      Changelog      Terms      |
|                                                                                 |
|  +-------------------------------------------+                                  |
|  | Backed by Enterprise Grade Security  [SOC]|                                  |
|  +-------------------------------------------+                                  |
|                                                                                 |
|  [green dot] All systems normal                          (C) 2026 Nixelo, Inc.  |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

---

## Design Tokens

### Background Colors

| Element | Token | Notes |
|---------|-------|-------|
| Page bg | `bg-ui-bg` | #08090a (near-black) |
| Section bg alt | `bg-ui-bg-secondary` | Subtle elevation |
| Card bg | `bg-ui-bg-elevated` | Cards/modals |
| Soft overlay | `bg-ui-bg-soft` | rgba(255,255,255,0.03) |
| Announcement bg | `bg-brand-subtle` | Banner background |

### Border Colors

| Element | Token |
|---------|-------|
| Card border | `border-ui-border` |
| Section divider | `border-ui-border-subtle` |
| CTA border | `border-brand` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Announcement | `text-sm` | 500 | `text-ui-text` |
| Nav links | `text-sm` | 400 | `text-ui-text-secondary` |
| Nav active | `text-sm` | 500 | `text-ui-text` |
| Hero badge | `text-xs` | 500 | `text-ui-text-secondary` |
| Hero headline | `text-5xl md:text-7xl` | 700 | `text-ui-text` |
| Hero gradient | – | – | `bg-gradient-brand` |
| Hero subhead | `text-lg md:text-xl` | 400 | `text-ui-text-secondary` |
| Section title | `text-4xl md:text-5xl` | 700 | `text-ui-text` |
| Section subtitle | `text-lg` | 400 | `text-ui-text-secondary` |
| Card title | `text-lg` | 600 | `text-ui-text` |
| Card text | `text-sm` | 400 | `text-ui-text-secondary` |
| Footer link | `text-sm` | 400 | `text-ui-text-secondary` |
| Footer heading | `text-xs` | 600 | `text-ui-text-tertiary` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Page max-width | 1200px | `max-w-6xl` |
| Section padding Y | 96-120px | `py-24 md:py-32` |
| Section padding X | 24px | `px-6` |
| Card padding | 24-32px | `p-6 md:p-8` |
| Component gap | 64px | `gap-16` |
| Logo bar gap | 48px | `gap-12` |
| Header height | 72px | `h-18` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Buttons (pill) | 9999px | `rounded-full` |
| Cards | 16px | `rounded-2xl` |
| Product screenshot | 12px | `rounded-xl` |
| Badge | 9999px | `rounded-full` |

---

## Animations

### Hero Entry (Staggered)

```css
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-element {
  animation: fadeSlideUp 0.6s ease-out forwards;
  opacity: 0;
}

.hero-badge { animation-delay: 0ms; }
.hero-headline { animation-delay: 100ms; }
.hero-subheadline { animation-delay: 200ms; }
.hero-cta { animation-delay: 300ms; }
.hero-screenshot { animation-delay: 400ms; }
```

### Scroll-Triggered Section Reveal

```css
@keyframes sectionReveal {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-animate {
  animation: sectionReveal 0.8s ease-out forwards;
  animation-play-state: paused;
}

.section-animate.in-view {
  animation-play-state: running;
}
```

### Card Hover Lift

```css
.card-interactive {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

### Button Hover Glow

```css
.btn-primary {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(var(--color-brand-rgb), 0.3);
}
```

### Logo Hover

```css
.logo-item {
  transition: opacity 0.2s ease;
  opacity: 0.5;
  filter: grayscale(100%);
}

.logo-item:hover {
  opacity: 1;
}
```

### Announcement Banner Dismiss

```css
@keyframes slideUp {
  to {
    height: 0;
    padding-top: 0;
    padding-bottom: 0;
    opacity: 0;
  }
}

.banner-dismiss {
  animation: slideUp 0.3s ease-out forwards;
}
```

---

## Component Inventory

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `AnnouncementBanner.tsx` | Top banner with dismiss |
| `LogoBar.tsx` | Customer logos row |
| `ProductShowcase.tsx` | Hero screenshot |
| `AIFeatureDemo.tsx` | Interactive AI mockup |
| `EnterpriseSection.tsx` | Enterprise CTA section |
| `CustomerStoryCard.tsx` | Large story card |
| `IndustryCard.tsx` | Compact case study |
| `FinalCTASection.tsx` | Bottom CTA |
| `SecurityBadge.tsx` | SOC 2 badge |
| `StatusIndicator.tsx` | System status |

### Existing to Enhance

| Component | Changes |
|-----------|---------|
| `NavHeader.tsx` | Add scroll bg, dark theme |
| `HeroSection.tsx` | Add screenshot, refine copy |
| `FeaturesSection.tsx` | Dark theme, AI focus |
| `WhyChooseSection.tsx` | Replace with customer stories |
| `Footer.tsx` | Richer structure, badges |
| `CircuitFlowLines.tsx` | Better visibility on dark |

---

## Section Details

### Announcement Banner

```
+=========================================================================+
| [spark icon] Self-updating docs powered by AI          [Learn more] [X] |
+=========================================================================+

- Height: 40px
- Background: bg-brand-subtle with border-b
- Dismissible (stores in localStorage)
- Link to blog/feature page
```

### Logo Bar

```
Trusted by world-class teams

    [STRIPE]   [VERCEL]   [NOTION]   [ANTHROPIC]   [COINBASE]

- Grayscale filter by default
- Full color on hover
- Horizontal scroll on mobile
- Fade edges for scroll indication
```

### Enterprise Section

```
+-------------------------------------------------------------------+
| ENTERPRISE                                                         |
|                                                                    |
| Bring intelligence to          +--------------------------------+ |
| enterprise knowledge           |                                | |
|                                |        [illustration]          | |
| Security-first, scalable       |                                | |
| knowledge management           |                                | |
|                                +--------------------------------+ |
|                                                                    |
| [ Explore for Enterprise ]                                         |
+-------------------------------------------------------------------+

- Split layout (text left, image right)
- "ENTERPRISE" label badge
- Large headline
- Supporting copy
- Single CTA button
```

### Customer Story Card

```
+-------------------------------------------------------------------+
| CUSTOMER STORY                                                     |
|                                                                    |
| "Nixelo transformed how we                   +------------------+ |
| manage projects across our                   |                  | |
| distributed team."                           |    [customer     | |
|                                              |     photo]       | |
| Read the story ->                            |                  | |
|                                              +------------------+ |
| 500+ Daily users    10+ Integrations    50% Time saved           |
+-------------------------------------------------------------------+

- Quote or summary
- Customer image/logo
- Stats row
- Read more link
```

### Final CTA Section

```
+-------------------------------------------------------------------+
|                                                                    |
|     Make project management                                        |
|     your competitive advantage                                     |
|                                                                    |
|     [ Get started for free ]      [ Request a demo ]               |
|                                                                    |
| +-------------------------+    +-------------------------+         |
| | Pricing on your terms   |    | Start building          |         |
| | See pricing details ->  |    | Read the quickstart ->  |         |
| +-------------------------+    +-------------------------+         |
|                                                                    |
+-------------------------------------------------------------------+

- Large centered headline
- Two primary CTAs
- Two supporting info cards
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Dismiss announcement banner |
| `Tab` | Navigate interactive elements |
| `Enter` | Activate focused element |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Single column, hamburger menu, stacked CTAs |
| Tablet (640-1024px) | 2-column grids, condensed nav |
| Desktop (1024-1440px) | Full layout as wireframed |
| Ultrawide (>1440px) | Max-width container, more whitespace |

---

## Accessibility

- Skip-to-content link
- Proper heading hierarchy (h1 → h2 → h3)
- Focus visible on all interactive elements
- Color contrast passes WCAG AA
- Reduced motion support
- Screen reader labels on icons
- Announcement banner is live region
