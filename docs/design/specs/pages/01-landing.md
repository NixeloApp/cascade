# Landing Page

> **Status**: TODO - Awaiting Implementation
> **Priority**: HIGH (Phase 3 - Auth Flow)

---

## Current State Analysis

**Screenshot**: `e2e/screenshots/01-empty-landing.png`

### Visual Description (Current Nixelo)

The current landing page is a light-themed, content-focused layout with the following structure:

1. **Navigation Header**:
   - Nixelo logo (gradient "N" icon) + "Nixelo" text on left
   - Centered nav links: Features, Pricing, Resources
   - Right side: Theme toggle (sun icon), "Sign in" text link, "Get Started" pill button (cyan-teal gradient)
   - Semi-transparent backdrop blur with subtle border

2. **Background Effects**:
   - Ambient glow orbs (fixed position, blurred circles in brand/info/success colors)
   - `CircuitFlowLines` SVG pattern spanning full page (faint curved lines in pastel colors)

3. **Hero Section**:
   - Small pill badge: "Project Management · Time Tracking" (bordered, muted text)
   - Two-line headline: "Revolutionize Your Workflow." (dark text) + "Harmonize Your Team." (cyan-teal gradient)
   - Subheadline: "Experience the future of project management..." (muted gray)
   - Two CTA buttons: "Get Started Free" (gradient pill), "Watch Demo" (outlined pill with play icon)

4. **Features Section**:
   - Heading: "Stop juggling tools. Start shipping."
   - Subheading: "Project management shouldn't feel like a second job."
   - Three feature cards in a grid:
     - Each has: gradient-bordered icon container, title, description, "Learn more" link
     - Card backgrounds: light gray gradient with subtle border
     - Hover: shadow lift, border color change

5. **Stats/Social Proof Section** ("Why Choose"):
   - Large rounded card with secondary background
   - Heading: "Teams actually like using it."
   - Subheading: "No training required..."
   - Four stat items with animated progress bars: 30%, 10%, 95%, 95%
   - Color-coded by category (cyan, indigo, teal, emerald)

6. **Footer**:
   - Logo + tagline
   - Four link columns: Product, Organization, Resources
   - Bottom bar: Copyright, social icons (Facebook, TikTok, Patreon), legal links

### Issues Identified

| Issue | Severity | Notes |
|-------|----------|-------|
| Light background lacks premium depth | HIGH | Mintlify uses near-black (#08090a) for dramatic contrast |
| Hero missing product showcase | HIGH | No screenshot/visual of the actual product |
| No customer logos/social proof | HIGH | Mintlify prominently displays Anthropic, Coinbase, Microsoft, etc. |
| Feature cards feel generic | MEDIUM | Need more visual distinction, possibly illustrations |
| Circuit lines too subtle | MEDIUM | Background pattern barely visible |
| Missing "enterprise" section | MEDIUM | No dedicated B2B/enterprise messaging |
| No case studies/testimonials | MEDIUM | Stats are abstract, not tied to real customers |
| Footer lacks depth | LOW | Single-level footer, Mintlify has richer structure |
| Missing announcement banner | LOW | Mintlify has top banner for news/launches |
| No "Get a demo" booking | LOW | Enterprise customers expect demo scheduling |

---

## Target State

**References**:
- `docs/research/library/mintlify/landing_desktop_dark.png` (Primary - dark mode)
- `docs/research/library/mintlify/landing_desktop_light.png` (Light mode variant)
- `docs/research/library/mintlify/landing_deep.json` (CSS tokens & animations)

### Key Improvements

1. **Dark mode primary** - Near-black background (#08090a) creates premium, modern feel
2. **Product showcase** - Hero includes screenshot/mockup of actual dashboard
3. **Social proof bar** - Logos of notable customers immediately below hero
4. **Richer sections** - "Built for the intelligence age", "Bring intelligence to enterprise", case studies
5. **Announcement banner** - Top-of-page banner for news (dismissible)
6. **Enterprise CTA** - "Explore for enterprise" button and dedicated section
7. **Customer stories** - Carousel of case study cards with customer logos
8. **Final CTA section** - "Make documentation your winning advantage" with dual buttons
9. **Enhanced footer** - Richer link structure, "Backed by Enterprise Grade Security" badge

### Mintlify Landing Anatomy (Dark Mode)

From `landing_desktop_dark.png` and `landing_deep.json`:

**Header**:
- Logo (green leaf icon) + "mintlify" text
- Nav: Resources, Documentation, Customers, Blog, Pricing, Contact sales
- CTA: "Start for free" (green bg, white text)
- Background: transparent with no border, glass effect on scroll

**Announcement Banner**:
- Above header: "Self-updating docs with agent suggestions" with sparkle emoji
- Subtle background, dismissible

**Hero**:
- Small badge: "The Intelligent Knowledge Platform"
- Headline: "The Intelligent Knowledge Platform" (white, large)
- Subheadline: "Helping teams create and maintain world-class documentation built for both humans and AI."
- Two CTAs: "Read address" (ghost), "Start now" (green pill)
- Below: Large product screenshot (dashboard preview)

**Social Proof**:
- "ANTHROPIC | coinbase | Microsoft | perplexity | HubSpot | X | PayPal | Lovable" logos in grayscale

**Feature Sections** (multiple):
1. "Built for the intelligence age" - Two columns with AI features
2. "Intelligent assistance for your users" - AI assistant demo
3. "Bring intelligence to enterprise knowledge" - Enterprise features with CTA

**Customer Story**:
- Large card: "See how Anthropic accelerates AI development with Mintlify"
- Stats: "2M+ Monthly active developers", "3+ Documentation Sources"
- Customer logo carousel: Anthropic, Coinbase, HubSpot, Zapier, AT&T

**Industry Section**:
- "Unlock knowledge for any industry"
- Four cards: Perplexity, X, Kalshi, Cognition (each with customer logo + brief text)

**Final CTA**:
- Headline: "Make documentation your winning advantage"
- Two buttons: "Get started for free", "Get a demo"
- Two info blocks: "Pricing on your terms", "Start building"

**Footer**:
- Multi-column: Links, Documentation, Company, Legal
- "Backed by Enterprise Grade Security" badge with SOC 2 icon
- "All systems normal" status indicator
- Copyright + social icons

---

## ASCII Wireframe

### Target Layout (Dark Theme)

```
+================================================================================+
|  [!] Self-updating docs with agent suggestions                            [X]  |
+================================================================================+
|                                                                                 |
|  [N] Nixelo      Features  Pricing  Resources  Customers      [Theme] [Sign in] [Get Started] |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                                                                                 |
|                      .------------------------.                                 |
|                     | The Intelligent Project |                                |
|                     |    Management Platform   |                                |
|                      '------------------------'                                 |
|                         (pill badge, subtle)                                    |
|                                                                                 |
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
|                                                                                 |
|         +--------------------------------------------------------------+        |
|         |                                                              |        |
|         |                    [PRODUCT SCREENSHOT]                      |        |
|         |                                                              |        |
|         |              Dashboard / Board / Editor Preview              |        |
|         |                                                              |        |
|         |                                                              |        |
|         +--------------------------------------------------------------+        |
|                   (elevated card with shadow, slight tilt)                      |
|                                                                                 |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|          STRIPE    VERCEL    NOTION    ANTHROPIC    COINBASE    PERPLEXITY     |
|                        (grayscale customer logos)                               |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                     Built for the intelligence age                              |
|          Integrate AI into every part of your workflow. Nixelo lets your        |
|          knowledge be written, organized, and understood by both users and LLMs.|
|                                                                                 |
|     +----------------------------------+  +----------------------------------+  |
|     |  [icon]                          |  |  [icon]                          |  |
|     |  Built for both people and AI    |  |  Self-updating knowledge mgmt    |  |
|     |                                  |  |                                  |  |
|     |  Ensure your product shows up    |  |  Draft, edit, and maintain       |  |
|     |  in AI search results, in AI     |  |  content with a modular          |  |
|     |  assistants, in MCP...           |  |  system, stays fresh without     |  |
|     |                                  |  |  the documentation debt.         |  |
|     |  +----------------------------+  |  |                                  |  |
|     |  |   Search "how to..."       |  |  |   [v] [v] [v] [v]               |  |
|     |  +----------------------------+  |  |   (checkmarks animation)        |  |
|     |  |   [Robot] Adding MCP       |  |  |                                  |  |
|     |  +----------------------------+  |  |                                  |  |
|     +----------------------------------+  +----------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                   Intelligent assistance for your users                         |
|          Turn every customer interaction into a tailored conversation.          |
|                                                                                 |
|     +----------------------------------------------------------------------+    |
|     |   How do I add a board to my project?                                |    |
|     |   ________________________________________________________________   |    |
|     |                                                                      |    |
|     |   To create a new board in Nixelo:                                   |    |
|     |   1. Navigate to your project                                        |    |
|     |   2. Click "New Board" in the sidebar                                |    |
|     |   3. Choose a template or start blank                                |    |
|     |                                                                      |    |
|     |   Sources: [Doc 1] [Doc 2]                          [Submit Feedback]|    |
|     +----------------------------------------------------------------------+    |
|                        (AI chat interface mockup)                               |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|    ENTERPRISE DOCUMENTATION                                                     |
|                                                                                 |
|               Bring intelligence to                                             |
|               enterprise knowledge                        [ Explore Enterprise ]|
|                                                                                 |
|    Modernize without the rebuild, with enterprise-grade                         |
|    professional services & security.                                            |
|                                                                                 |
|     [Star] Built with partnership         [Shield] Compliance and access ctrl   |
|     Details, white glove access to...     Compliant with SOC 2, and in the...   |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|     +------------------------------------------------------+                    |
|     |  CUSTOMER STORY                                      |                    |
|     |                                                      |                    |
|     |  See how Acme Corp accelerates                       |    [IMAGE]         |
|     |  AI development with Nixelo                          |    (3D arch)       |
|     |                                                      |                    |
|     |  Read story ->                                       |                    |
|     |                                                      |                    |
|     |  500+          10+                                   |                    |
|     |  Daily active  Integrated                            |                    |
|     |  users         platforms                             |                    |
|     +------------------------------------------------------+                    |
|                                                                                 |
|          [ACME]     [BETA]     [GAMMA]     [DELTA]     [EPSILON]               |
|                   (customer logo carousel with dots)                            |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                                   INDUSTRIES                                    |
|                                                                                 |
|                  Unlock knowledge for any industry                              |
|         From frontier AI to consumer fintech, leaders across industries scale.  |
|                                                                                 |
|     +----------------+ +----------------+ +----------------+ +----------------+  |
|     |  [perplexity]  | |     [X]        | |    Kalshi      | |  [Cognition]   |  |
|     |                | |                | |                | |                |  |
|     | How Perplexity | | How X is using | | How Kalshi...  | | How Cognition  |  |
|     | transformed... | | Nixelo to...   | |                | | scaled their...| |
|     |                | |                | |                | |                |  |
|     | Read story ->  | | Read story ->  | | Read story ->  | | Read story ->  |  |
|     +----------------+ +----------------+ +----------------+ +----------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|                                                                                 |
|               Make documentation                                                |
|               your winning advantage                                            |
|                                                                                 |
|     Join the leaders of tomorrow to future-proof your documentation today.      |
|                                                                                 |
|              [ Get started for free ]      [ Get a demo ]                       |
|                  (green pill)               (ghost)                             |
|                                                                                 |
|                                                                                 |
|        Pricing on your terms                    Start building                  |
|        Pick the plan that works best for you.   Deploy your documentation in min|
|        Pricing details ->                       Quickstart ->                   |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  [N] mintlify                                                      [X] [GH] [D] |
|                                                                                 |
|   EXPLORE        RESOURCES         DOCUMENTATION      COMPANY        LEGAL      |
|   Startups       Customers         Getting Started    Careers        Privacy    |
|   Enterprise     Blog              API Reference      Wall of Love   Terms      |
|   Switch         Pricing           Guides             Changelog      Security   |
|   OSS Program    ...               ...                               DMCA       |
|                                                                                 |
|  +-------------------------------------------+                                  |
|  | Backed by Enterprise Grade Security  [SOC]|                                  |
|  +-------------------------------------------+                                  |
|                                                                                 |
|  [green dot] All systems normal                          (C) 2026 Nixelo, Inc.  |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

### Vertical Spacing Guide

```
Top of viewport
    |
[Announcement Banner] - 40px height (optional, dismissible)
    |
    | 0px gap (header sticks below banner)
    |
[Header/Nav] - 64px height
    |
    | 80px gap
    |
[Hero Badge] - 32px height
    |
    | 24px gap
    |
[Headline] - ~120px height (2 lines at 48-64px)
    |
    | 16px gap
    |
[Subheadline] - 48px height
    |
    | 32px gap
    |
[CTA Buttons] - 48px height
    |
    | 64px gap
    |
[Product Screenshot] - 400-500px height
    |
    | 80px gap
    |
[Logo Bar] - 80px height
    |
    | 120px gap (section break)
    |
[Features Section] - variable
    |
    | 120px gap
    |
[AI Demo Section] - variable
    |
    | 120px gap
    |
[Enterprise Section] - variable
    |
    | 120px gap
    |
[Customer Story] - variable
    |
    | 120px gap
    |
[Industry Cards] - variable
    |
    | 120px gap
    |
[Final CTA] - variable
    |
    | 80px gap
    |
[Footer] - ~300px height
    |
Bottom of viewport
```

---

## Functionality Breakdown

### Interactive Elements

#### Header
- [ ] Logo: Link to home (reload page)
- [ ] Nav links: Smooth scroll to sections (Features, Pricing, Resources, Customers)
- [ ] Theme toggle: Cycle light/dark/system
- [ ] Sign in: Navigate to `/signin`
- [ ] Get Started: Navigate to `/signup`

#### Announcement Banner
- [ ] Dismissible via X button
- [ ] Stores dismissal in localStorage (don't show again for session)
- [ ] Links to relevant page/blog post

#### Hero Section
- [ ] Get Started Free: Navigate to `/signup`
- [ ] Watch Demo: Open modal with video or link to YouTube
- [ ] Product screenshot: Could be interactive carousel or static

#### Social Proof Bar
- [ ] Logos are static, no interaction
- [ ] Optional: Link to customer page or case study

#### Feature Cards
- [ ] Hover: Subtle lift effect, border glow
- [ ] "Learn more" links: Navigate to feature-specific pages or expand details

#### AI Demo Section
- [ ] Interactive mockup showing AI chat
- [ ] Could be a static image or animated demo

#### Enterprise Section
- [ ] "Explore for Enterprise" button: Navigate to `/enterprise` or open contact form

#### Customer Story Card
- [ ] "Read story" link: Navigate to `/customers/[customer]`
- [ ] Carousel dots: Navigate between stories

#### Industry Cards
- [ ] "Read story" links: Navigate to case study pages
- [ ] Hover: Card lift effect

#### Final CTA Section
- [ ] "Get started for free": Navigate to `/signup`
- [ ] "Get a demo": Open Cal.com or similar booking embed
- [ ] Pricing details link: Navigate to `/pricing`
- [ ] Quickstart link: Navigate to `/docs/quickstart`

#### Footer
- [ ] All links: Navigate to respective pages
- [ ] Social icons: Open in new tab
- [ ] Status indicator: Link to status page

### Scroll Behaviors

- [ ] Header: Add subtle background/border on scroll (>50px)
- [ ] Sections: Fade-in as they enter viewport (Intersection Observer)
- [ ] Logo bar: Could have subtle parallax
- [ ] Stats: Animate counters when entering viewport

### Responsive Breakpoints

- [ ] **Mobile** (<640px): Single column, stacked elements, hamburger menu
- [ ] **Tablet** (640-1024px): 2-column grids, condensed nav
- [ ] **Desktop** (1024-1440px): Full layout as wireframed
- [ ] **Ultrawide** (>1440px): Max-width container, more whitespace

---

## Component Inventory

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **AnnouncementBanner** | N/A | New | Dismissible top banner |
| **NavHeader** | Exists | Enhance | Add scroll effect, refine styling |
| **HeroSection** | Exists | Major update | Add product screenshot, refine copy |
| **LogoBar** | N/A | New | Customer logos in grayscale |
| **FeatureSection** | Exists | Enhance | Add illustrations, richer layout |
| **AIDemo** | N/A | New | Interactive or animated AI chat demo |
| **EnterpriseSection** | N/A | New | Enterprise-specific messaging |
| **CustomerStory** | N/A | New | Large card with stats + carousel |
| **IndustryCards** | N/A | New | 4-card grid of case studies |
| **FinalCTA** | N/A | New | Dual CTA with info blocks |
| **Footer** | Exists | Enhance | Richer structure, security badge |
| **WhyChooseSection** | Exists | Merge/Remove | Consider merging into customer story |

### New Components Needed

1. **AnnouncementBanner**: Full-width, dismissible, themed
2. **LogoBar**: Horizontal scroll on mobile, grid on desktop
3. **ProductShowcase**: Screenshot/mockup with shadow and optional tilt
4. **AIDemo**: Chat interface mockup (could be animated)
5. **EnterpriseSection**: Split layout with CTA
6. **CustomerStoryCard**: Large card with image, stats, carousel
7. **IndustryCard**: Compact case study card
8. **FinalCTASection**: Centered CTA with supporting info blocks
9. **SecurityBadge**: SOC 2 compliance indicator

---

## Design Tokens Used

### Colors (Dark Mode - Primary)

| Element | Token | Mintlify Value | Nixelo Mapping |
|---------|-------|----------------|----------------|
| Page background | `--color-bg-primary` | `#08090a` | `--color-ui-bg-hero` (p-gray-950) |
| Soft background | `--color-bg-soft` | `rgba(255,255,255,.05)` | `--color-ui-bg-secondary` |
| Card background | `--color-bg-card` | `rgba(255,255,255,.03)` | New token needed |
| Text primary | `--color-text-main` | `#fff` | `--color-ui-text` |
| Text soft | `--color-text-soft` | `rgba(255,255,255,.7)` | `--color-ui-text-secondary` |
| Text muted | `--color-muted` | `rgba(255,255,255,.5)` | `--color-ui-text-tertiary` |
| Border subtle | `--color-border-sub` | `rgba(255,255,255,.07)` | `--color-ui-border` |
| Border soft | `--color-border-soft` | `rgba(255,255,255,.15)` | `--color-ui-border-secondary` |
| Brand primary | `--color-brand` | `#18e299` (green) | Keep Nixelo teal/cyan gradient |
| Brand light | `--color-brand-light` | `#0c8c5e` | `--color-landing-accent` |

### Typography

| Element | Size | Weight | Line Height | Token |
|---------|------|--------|-------------|-------|
| Announcement text | 14px | 500 | 1.4 | `text-sm font-medium` |
| Nav links | 14px | 400 | 1.4 | `text-sm` |
| Hero badge | 12px | 500 | 1.4 | `text-xs font-medium` |
| Hero headline | 48-64px | 700 | 1.1 | `text-5xl md:text-6xl lg:text-7xl font-bold` |
| Hero subheadline | 18-20px | 400 | 1.6 | `text-lg md:text-xl` |
| Section title | 36-48px | 700 | 1.2 | `text-4xl md:text-5xl font-bold` |
| Section subtitle | 16-18px | 400 | 1.6 | `text-base md:text-lg` |
| Card title | 18-20px | 600 | 1.4 | `text-lg font-semibold` |
| Card description | 14-16px | 400 | 1.6 | `text-sm md:text-base` |
| Footer heading | 14px | 600 | 1.4 | `text-sm font-semibold` |
| Footer link | 14px | 400 | 1.5 | `text-sm` |
| Legal text | 12px | 400 | 1.4 | `text-xs` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Page max-width | 1200px | `max-w-6xl` |
| Section padding Y | 96-120px | `py-24 md:py-32` |
| Section padding X | 24px | `px-6` |
| Card padding | 24-32px | `p-6 md:p-8` |
| Component gap | 64px | `gap-16` |
| Card gap | 24px | `gap-6` |
| Text gap (tight) | 8px | `gap-2` |
| Text gap (medium) | 16px | `gap-4` |
| CTA button gap | 16px | `gap-4` |
| Logo bar gap | 48px | `gap-12` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Buttons (pill) | 9999px | `rounded-full` |
| Cards | 16px | `rounded-2xl` |
| Product screenshot | 12px | `rounded-xl` |
| Input fields | 8px | `rounded-lg` |
| Badges | 9999px | `rounded-full` |
| Icons containers | 12px | `rounded-xl` |

### Shadows

| Element | Value | Usage |
|---------|-------|-------|
| Card shadow | `0 4px 16px rgba(0,0,0,0.12)` | Feature cards, customer story |
| Elevated shadow | `0 8px 32px rgba(0,0,0,0.2)` | Product screenshot |
| Glow shadow | `0 0 40px rgba(brand, 0.15)` | CTA hover, highlight elements |
| Button shadow | `0 2px 8px rgba(0,0,0,0.1)` | Primary buttons |

---

## Animations

### Entry Animations (Page Load)

From Mintlify `landing_deep.json`:

```css
/* Staggered reveal for hero elements */
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

/* Stagger delays */
.hero-badge { animation-delay: 0ms; }
.hero-headline { animation-delay: 100ms; }
.hero-subheadline { animation-delay: 200ms; }
.hero-cta { animation-delay: 300ms; }
.hero-screenshot { animation-delay: 400ms; }
```

### Scroll-Triggered Animations

```css
/* Section reveal on scroll */
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

### Hover States

```css
/* Card hover lift */
.card-interactive {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

/* Button hover glow */
.btn-primary {
  transition: all 0.2s ease;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(var(--color-brand-rgb), 0.3);
}

/* Link hover */
.link-hover {
  transition: color 0.15s ease;
}
.link-hover:hover {
  color: var(--color-ui-text);
}

/* Logo bar hover (optional) */
.logo-item {
  transition: opacity 0.2s ease;
  opacity: 0.6;
}
.logo-item:hover {
  opacity: 1;
}
```

### Navigation Animations

From Mintlify keyframes:

```css
/* Menu panel enter/exit */
@keyframes enterFromRight {
  from { opacity: 0; transform: translateX(200px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes exitToRight {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(200px); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: rotateX(-10deg) scale(0.96); }
  to { opacity: 1; transform: rotateX(0deg) scale(1); }
}

@keyframes scaleOut {
  from { opacity: 1; transform: rotateX(0deg) scale(1); }
  to { opacity: 0; transform: rotateX(-10deg) scale(0.96); }
}
```

### Loading/Progress Animations

```css
/* Stats counter animation */
@keyframes countUp {
  from { --num: 0; }
  to { --num: var(--target); }
}

/* Progress bar fill */
.progress-bar {
  transition: width 1s ease-out;
}

/* Spinner for buttons */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  animation: spin 0.8s linear infinite;
}
```

### Parallax Effects (Optional)

```css
/* Subtle parallax on scroll */
.parallax-slow {
  transform: translateY(calc(var(--scroll-y) * 0.1));
}
.parallax-fast {
  transform: translateY(calc(var(--scroll-y) * 0.3));
}
```

---

## Implementation Checklist

### Phase 1: Foundation (Dark Mode + Layout)

- [ ] Update `src/routes/index.tsx` to use dark background
- [ ] Set page background to `bg-ui-bg-hero` (#030712)
- [ ] Update `CircuitFlowLines` for better visibility on dark
- [ ] Remove/update ambient glow orbs for dark theme
- [ ] Add announcement banner component slot
- [ ] Update header for dark theme (transparent -> slight bg on scroll)

### Phase 2: Hero Section Overhaul

- [ ] Update hero headline typography (larger, tighter tracking)
- [ ] Add product screenshot/mockup below CTAs
- [ ] Update CTA button styling (keep gradient but refine)
- [ ] Add entry animations (staggered fade-up)
- [ ] Ensure responsive stacking on mobile

### Phase 3: Social Proof Bar

- [ ] Create `LogoBar` component
- [ ] Add 6-8 placeholder logos (grayscale filter)
- [ ] Horizontal scroll on mobile, grid on desktop
- [ ] Subtle fade on edges for scroll indication

### Phase 4: Feature Sections

- [ ] Redesign feature cards for dark theme
- [ ] Add "Built for the intelligence age" section (two-column)
- [ ] Add AI demo mockup section
- [ ] Implement hover states with glow effects
- [ ] Add scroll-triggered reveal animations

### Phase 5: Enterprise & Social Proof

- [ ] Create `EnterpriseSection` component
- [ ] Create `CustomerStoryCard` component
- [ ] Add carousel for customer stories (optional)
- [ ] Create `IndustryCard` component
- [ ] Implement 4-card grid for industry cases

### Phase 6: Final CTA & Footer

- [ ] Create `FinalCTASection` with dual buttons
- [ ] Add info blocks (Pricing, Quickstart links)
- [ ] Enhance footer with richer link structure
- [ ] Add security badge (SOC 2 style)
- [ ] Add status indicator in footer

### Phase 7: Animations & Polish

- [ ] Implement all entry animations
- [ ] Add scroll-triggered reveals (Intersection Observer)
- [ ] Implement header scroll effect
- [ ] Add button hover glows
- [ ] Add card hover lifts
- [ ] Test all animations on low-power mode

### Phase 8: Responsive & Accessibility

- [ ] Test mobile layout (single column, hamburger menu)
- [ ] Test tablet layout (2-column grids)
- [ ] Test ultrawide (max-width container)
- [ ] Add proper focus states for keyboard navigation
- [ ] Add skip-to-content link
- [ ] Test with screen reader
- [ ] Verify color contrast ratios
- [ ] Add reduced-motion media query support

### Phase 9: Content & Polish

- [ ] Replace placeholder customer logos
- [ ] Finalize copy for all sections
- [ ] Add real product screenshots
- [ ] Link all CTAs to correct destinations
- [ ] Add analytics events to CTAs
- [ ] Performance audit (Lighthouse)

---

## Related Files

### Source References
- Mintlify dark: `docs/research/library/mintlify/landing_desktop_dark.png`
- Mintlify light: `docs/research/library/mintlify/landing_desktop_light.png`
- Mintlify CSS: `docs/research/library/mintlify/landing_deep.json`
- Current Nixelo: `e2e/screenshots/01-empty-landing.png`

### Implementation Files
- Route: `src/routes/index.tsx`
- Components: `src/components/landing/*.tsx`
  - `NavHeader.tsx`
  - `HeroSection.tsx`
  - `FeaturesSection.tsx`
  - `WhyChooseSection.tsx`
  - `Footer.tsx`
  - `CircuitFlowLines.tsx`
  - `icons.tsx`
- Theme tokens: `src/index.css`
- Routes config: `src/config/routes.ts`

### Related Pages
- Sign In: `pages/02-signin.md`
- Sign Up: `pages/03-signup.md`
- Dashboard: `pages/04-dashboard.md`
- Pricing: (future) `pages/XX-pricing.md`

---

*Last Updated: 2026-02-05*
*Status: Specification Complete - Awaiting Implementation*
