# Landing Page - Implementation

> **Priority**: HIGH (Phase 2 - First Impression)
> **Scope**: Major overhaul - dark theme, product showcase, social proof
> **Estimated Complexity**: High

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/routes/index.tsx` | MODIFY | Dark background, new sections |
| `src/components/landing/NavHeader.tsx` | ENHANCE | Scroll effect, dark theme |
| `src/components/landing/HeroSection.tsx` | MAJOR | Product screenshot, animations |
| `src/components/landing/FeaturesSection.tsx` | ENHANCE | Dark cards, AI focus |
| `src/components/landing/WhyChooseSection.tsx` | REPLACE | Convert to customer stories |
| `src/components/landing/Footer.tsx` | ENHANCE | Richer structure, badges |
| `src/components/landing/CircuitFlowLines.tsx` | UPDATE | Better dark visibility |

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/landing/AnnouncementBanner.tsx` | Dismissible top banner |
| `src/components/landing/LogoBar.tsx` | Customer logos row |
| `src/components/landing/ProductShowcase.tsx` | Hero screenshot |
| `src/components/landing/AIFeatureDemo.tsx` | AI mockup section |
| `src/components/landing/EnterpriseSection.tsx` | Enterprise CTA |
| `src/components/landing/CustomerStoryCard.tsx` | Story card |
| `src/components/landing/IndustryCard.tsx` | Case study card |
| `src/components/landing/FinalCTASection.tsx` | Bottom CTA |
| `src/components/landing/SecurityBadge.tsx` | SOC 2 badge |
| `src/components/landing/StatusIndicator.tsx` | System status |

---

## Functionality Breakdown

### Navigation
- [x] Logo + nav links
- [x] Theme toggle
- [x] Sign in / Get started buttons
- [ ] **Enhancement**: Scroll-triggered background
- [ ] **Enhancement**: Mobile hamburger menu
- [ ] **Enhancement**: Active nav state

### Hero Section
- [x] Badge + headline + subheadline
- [x] CTA buttons
- [ ] **Enhancement**: Product screenshot
- [ ] **Enhancement**: Entry animations
- [ ] **Enhancement**: Gradient text accent

### Social Proof
- [ ] Logo bar component
- [ ] Grayscale logos with hover
- [ ] Mobile horizontal scroll
- [ ] "Trusted by" label

### Features
- [x] Feature cards grid
- [ ] **Enhancement**: Dark theme cards
- [ ] **Enhancement**: AI feature demo
- [ ] **Enhancement**: Built for AI section

### Customer Stories
- [ ] Customer story card
- [ ] Industry cards grid
- [ ] Logo carousel
- [ ] Stats display

### Enterprise
- [ ] Split layout section
- [ ] Enterprise CTA
- [ ] Illustration/image

### Footer
- [x] Basic footer
- [ ] **Enhancement**: Richer link columns
- [ ] **Enhancement**: Security badge
- [ ] **Enhancement**: Status indicator

---

## Verification Checklist

### Phase 1: Foundation (Dark Mode)

- [ ] Update index.tsx background to `bg-ui-bg`
- [ ] Update CircuitFlowLines for dark visibility
- [ ] Remove/adjust ambient glow orbs
- [ ] Update all text colors to use semantic tokens
- [ ] Test dark mode consistency
- [ ] Add announcement banner slot

### Phase 2: Header Enhancement

- [ ] Add scroll effect (transparent → bg on scroll)
- [ ] Implement mobile hamburger menu
- [ ] Add active state for current section
- [ ] Style for dark theme
- [ ] Add proper focus states

### Phase 3: Hero Section Overhaul

- [ ] Update headline typography (larger)
- [ ] Add gradient text for second line
- [ ] Create ProductShowcase component
- [ ] Add product screenshot/mockup
- [ ] Implement staggered entry animations
- [ ] Ensure responsive stacking

### Phase 4: Logo Bar

- [ ] Create LogoBar component
- [ ] Add 6-8 customer logos (placeholder)
- [ ] Apply grayscale filter
- [ ] Add hover effect (full color)
- [ ] Implement mobile horizontal scroll
- [ ] Add "Trusted by" label

### Phase 5: Feature Sections

- [ ] Redesign feature cards for dark theme
- [ ] Create "Built for the intelligence age" section
- [ ] Create AIFeatureDemo component (chat mockup)
- [ ] Add card hover lift effect
- [ ] Implement scroll-triggered reveals

### Phase 6: Enterprise Section

- [ ] Create EnterpriseSection component
- [ ] Implement split layout (text + image)
- [ ] Add "ENTERPRISE" label badge
- [ ] Style CTA button
- [ ] Add illustration/graphic

### Phase 7: Customer Stories

- [ ] Create CustomerStoryCard component
- [ ] Create IndustryCard component
- [ ] Implement 4-card grid
- [ ] Add stats row
- [ ] Optional: Logo carousel

### Phase 8: Final CTA Section

- [ ] Create FinalCTASection component
- [ ] Add dual CTA buttons
- [ ] Add info cards (Pricing, Quickstart)
- [ ] Center layout
- [ ] Add background treatment

### Phase 9: Footer Enhancement

- [ ] Expand link columns (5 columns)
- [ ] Create SecurityBadge component
- [ ] Create StatusIndicator component
- [ ] Add social icons
- [ ] Style for dark theme

### Phase 10: Animations

- [ ] Implement hero entry animations
- [ ] Add scroll-triggered section reveals (IntersectionObserver)
- [ ] Add header scroll effect
- [ ] Add button hover glows
- [ ] Add card hover lifts
- [ ] Test with prefers-reduced-motion

### Phase 11: Responsive & A11y

- [ ] Test mobile (single column, hamburger)
- [ ] Test tablet (2-column grids)
- [ ] Test ultrawide (max-width container)
- [ ] Add skip-to-content link
- [ ] Add proper focus states
- [ ] Test with screen reader
- [ ] Verify color contrast (WCAG AA)

---

## Component Implementation

### AnnouncementBanner

```tsx
const BANNER_STORAGE_KEY = 'announcement-dismissed';

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(BANNER_STORAGE_KEY) === 'true';
  });
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setDismissed(true);
      localStorage.setItem(BANNER_STORAGE_KEY, 'true');
    }, 300);
  };

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "bg-brand-subtle border-b border-ui-border",
        "px-4 py-2.5 text-center relative",
        isAnimatingOut && "animate-banner-dismiss"
      )}
      role="banner"
      aria-live="polite"
    >
      <Flex align="center" justify="center" gap="sm">
        <SparklesIcon className="w-4 h-4 text-brand" />
        <Typography variant="small" className="font-medium">
          Self-updating docs powered by AI agents
        </Typography>
        <Link to="/blog/ai-agents" className="text-brand hover:underline text-sm">
          Learn more →
        </Link>
      </Flex>
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-ui-bg-secondary rounded"
        aria-label="Dismiss announcement"
      >
        <XIcon className="w-4 h-4 text-ui-text-secondary" />
      </button>
    </div>
  );
}
```

### LogoBar

```tsx
interface LogoBarProps {
  logos: Array<{ name: string; src: string }>;
}

export function LogoBar({ logos }: LogoBarProps) {
  return (
    <section className="py-16 border-y border-ui-border-subtle">
      <div className="max-w-6xl mx-auto px-6">
        <Typography variant="small" className="text-center text-ui-text-tertiary mb-8">
          Trusted by world-class teams
        </Typography>
        <Flex
          justify="center"
          align="center"
          gap="xl"
          className="flex-wrap md:flex-nowrap overflow-x-auto"
        >
          {logos.map((logo) => (
            <img
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              className={cn(
                "h-8 opacity-50 grayscale",
                "hover:opacity-100 hover:grayscale-0",
                "transition-all duration-200"
              )}
            />
          ))}
        </Flex>
      </div>
    </section>
  );
}
```

### ProductShowcase

```tsx
interface ProductShowcaseProps {
  src: string;
  alt: string;
}

export function ProductShowcase({ src, alt }: ProductShowcaseProps) {
  return (
    <div
      className={cn(
        "relative max-w-5xl mx-auto mt-16",
        "hero-element hero-screenshot"
      )}
    >
      {/* Glow effect behind */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand/20 to-transparent blur-3xl -z-10" />

      {/* Screenshot container */}
      <div
        className={cn(
          "relative rounded-xl overflow-hidden",
          "border border-ui-border",
          "shadow-2xl shadow-black/50",
          "transform perspective-1000 rotateX-2"
        )}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-auto"
        />

        {/* Shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>

      {/* Reflection */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-brand/10 blur-2xl" />
    </div>
  );
}
```

### AIFeatureDemo

```tsx
export function AIFeatureDemo() {
  const [query, setQuery] = useState('How do I add a board to my project?');
  const [isTyping, setIsTyping] = useState(false);

  const mockResponse = `To create a new board in Nixelo:

1. Navigate to your project from the sidebar
2. Click the "+" button or "New Board"
3. Choose a template or start blank
4. Name your board and configure columns

Would you like me to show you how to set up custom columns?`;

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Typography variant="h2" className="text-4xl md:text-5xl font-bold mb-4">
            Intelligent assistance for your users
          </Typography>
          <Typography variant="p" className="text-ui-text-secondary text-lg max-w-2xl mx-auto">
            AI-powered answers that understand your documentation
          </Typography>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="p-6 bg-ui-bg-elevated border-ui-border">
            {/* Query input */}
            <div className="mb-6">
              <Flex align="center" gap="sm" className="p-3 bg-ui-bg rounded-lg border border-ui-border">
                <SearchIcon className="w-5 h-5 text-ui-text-tertiary" />
                <Typography className="text-ui-text">{query}</Typography>
              </Flex>
            </div>

            {/* Response */}
            <div className="p-4 bg-ui-bg rounded-lg">
              <Flex align="start" gap="md">
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <Typography variant="small" className="font-medium text-brand mb-2">
                    Nixelo AI
                  </Typography>
                  <Typography variant="small" className="text-ui-text-secondary whitespace-pre-line">
                    {mockResponse}
                  </Typography>
                </div>
              </Flex>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
```

### EnterpriseSection

```tsx
export function EnterpriseSection() {
  return (
    <section className="py-24 md:py-32 bg-ui-bg-secondary">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div>
            <Badge variant="secondary" className="mb-4">
              ENTERPRISE
            </Badge>
            <Typography variant="h2" className="text-4xl md:text-5xl font-bold mb-6">
              Bring intelligence to
              <br />
              enterprise knowledge
            </Typography>
            <Typography variant="p" className="text-ui-text-secondary text-lg mb-8">
              Security-first, scalable knowledge management for teams of any size.
              SSO, SCIM, advanced permissions, and dedicated support.
            </Typography>
            <Button size="lg">
              Explore for Enterprise
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Illustration */}
          <div className="relative">
            <div className="rounded-2xl border border-ui-border bg-ui-bg p-8">
              <div className="aspect-video bg-ui-bg-tertiary rounded-lg flex items-center justify-center">
                <BuildingIcon className="w-16 h-16 text-ui-text-tertiary" />
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-brand/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
```

### CustomerStoryCard

```tsx
interface CustomerStoryCardProps {
  quote: string;
  companyName: string;
  companyLogo: string;
  stats: Array<{ label: string; value: string }>;
  href: string;
}

export function CustomerStoryCard({
  quote,
  companyName,
  companyLogo,
  stats,
  href,
}: CustomerStoryCardProps) {
  return (
    <Card
      className={cn(
        "p-8 bg-ui-bg-elevated border-ui-border",
        "hover:border-brand/50 transition-colors"
      )}
    >
      <Badge variant="secondary" className="mb-4">
        CUSTOMER STORY
      </Badge>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Quote and link */}
        <div className="md:col-span-2">
          <blockquote className="text-xl text-ui-text mb-6">
            "{quote}"
          </blockquote>
          <Link to={href} className="text-brand hover:underline inline-flex items-center">
            Read the story
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* Company logo */}
        <div className="flex items-center justify-center">
          <img
            src={companyLogo}
            alt={companyName}
            className="max-h-16 opacity-80"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 pt-8 border-t border-ui-border">
        <Flex gap="xl" wrap="wrap">
          {stats.map((stat) => (
            <div key={stat.label}>
              <Typography variant="h3" className="text-brand">
                {stat.value}
              </Typography>
              <Typography variant="small" className="text-ui-text-secondary">
                {stat.label}
              </Typography>
            </div>
          ))}
        </Flex>
      </div>
    </Card>
  );
}
```

### FinalCTASection

```tsx
export function FinalCTASection() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <Typography variant="h2" className="text-4xl md:text-5xl font-bold mb-6">
          Make project management
          <br />
          your competitive advantage
        </Typography>

        <Flex justify="center" gap="md" className="mb-12">
          <Button size="lg">
            Get started for free
          </Button>
          <Button size="lg" variant="outline">
            Request a demo
          </Button>
        </Flex>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/pricing"
            className={cn(
              "p-6 rounded-xl border border-ui-border bg-ui-bg-secondary",
              "hover:border-brand/50 transition-colors text-left"
            )}
          >
            <Typography variant="label" className="mb-2">
              Pricing on your terms
            </Typography>
            <Typography variant="small" className="text-ui-text-secondary">
              See pricing details →
            </Typography>
          </Link>

          <Link
            to="/docs/quickstart"
            className={cn(
              "p-6 rounded-xl border border-ui-border bg-ui-bg-secondary",
              "hover:border-brand/50 transition-colors text-left"
            )}
          >
            <Typography variant="label" className="mb-2">
              Start building
            </Typography>
            <Typography variant="small" className="text-ui-text-secondary">
              Read the quickstart →
            </Typography>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

### SecurityBadge

```tsx
export function SecurityBadge() {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-ui-border bg-ui-bg-secondary">
      <ShieldCheckIcon className="w-5 h-5 text-status-success" />
      <Typography variant="small" className="text-ui-text-secondary">
        Backed by Enterprise Grade Security
      </Typography>
      <Badge variant="secondary" size="sm">
        SOC 2
      </Badge>
    </div>
  );
}
```

### StatusIndicator

```tsx
export function StatusIndicator() {
  return (
    <Flex align="center" gap="sm">
      <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
      <Typography variant="small" className="text-ui-text-secondary">
        All systems normal
      </Typography>
    </Flex>
  );
}
```

---

## CSS Additions

```css
/* Hero entry animations */
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

/* Section scroll reveal */
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

/* Banner dismiss */
@keyframes banner-dismiss {
  to {
    height: 0;
    padding-top: 0;
    padding-bottom: 0;
    opacity: 0;
    overflow: hidden;
  }
}

.animate-banner-dismiss {
  animation: banner-dismiss 0.3s ease-out forwards;
}

/* Card hover */
.card-interactive {
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Button glow */
.btn-glow:hover {
  box-shadow: 0 4px 20px rgba(var(--color-brand-rgb), 0.3);
}

/* Logo grayscale */
.logo-grayscale {
  filter: grayscale(100%);
  opacity: 0.5;
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.logo-grayscale:hover {
  filter: grayscale(0);
  opacity: 1;
}

/* Header scroll effect */
.header-scrolled {
  background-color: rgba(8, 9, 10, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-ui-border);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hero-element,
  .section-animate,
  .animate-banner-dismiss {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

---

## After Implementation

1. Run `pnpm screenshots` to regenerate
2. Compare with Mintlify reference screenshots
3. Test all responsive breakpoints
4. Test with screen reader
5. Run Lighthouse audit
6. Run `pnpm fixme` to verify no errors
7. Run `node scripts/validate.js` for design tokens
8. Update status in `DIRECTOR.md` from 🔴 to 🟢

---

## Visual Reference Files

| File | Description |
|------|-------------|
| `screenshots/desktop-dark.png` | Current state |
| `screenshots/desktop-light.png` | Current light theme |
| `screenshots/reference-mintlify-desktop-dark.png` | Mintlify reference |
| `screenshots/reference-mintlify-desktop-light.png` | Mintlify light reference |
