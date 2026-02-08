# Navigation Component

> **Status**: SPECIFICATION COMPLETE
> **Priority**: HIGH (Phase 2 - Core Components)
> **Last Updated**: 2026-02-05

---

## Visual References

| Source | Screenshot | Notes |
|--------|------------|-------|
| Mintlify (Target) | `docs/research/library/mintlify/landing_desktop_dark.png` | Dark theme, sticky nav with blur |
| Current Nixelo | `e2e/screenshots/01-empty-landing.png` | Light theme, basic implementation |

---

## Current State Analysis

### Current Nixelo Navigation

From `e2e/screenshots/01-empty-landing.png`:

**Structure**:
- Logo (Nixelo "N" icon + wordmark) on left
- Primary nav links centered: Features, Pricing, Resources
- Theme toggle (sun/moon icon) on right
- Auth buttons: "Sign in" (text link) + "Get Started" (pill button, cyan gradient)

**Styling**:
- Semi-transparent background with blur: `bg-ui-bg/10 backdrop-blur-md`
- Subtle bottom border: `border-b border-ui-border/20`
- Sticky positioning: `sticky top-0 z-50`
- Max width container: `max-w-6xl mx-auto`

**Issues Identified**:

| Issue | Severity | Notes |
|-------|----------|-------|
| No scroll-based background transition | MEDIUM | Background should solidify on scroll |
| Mobile menu not visible | HIGH | No hamburger icon shown |
| Nav links use anchor hrefs | LOW | Should use proper routing or scroll-to |
| Theme toggle lacks animation | LOW | Mintlify has smooth icon rotation |

### Mintlify Reference Navigation

From `docs/research/library/mintlify/landing_desktop_dark.png`:

**Structure**:
- Logo (Mintlify leaf icon) on left, brand green (#18e299)
- Primary nav links: Resources, Documentation, Customers, Blog, Pricing
- Secondary actions: "Contact sales" (text link)
- CTA: "Start for free" (solid green button, rounded)

**Styling**:
- Dark background that blends with hero: near-black
- Nav links in muted white, hover to bright white
- Minimal visual weight - navigation doesn't compete with content
- Generous horizontal padding
- Clean typography hierarchy

---

## Component Anatomy

### ASCII Layout (Desktop)

```
+--------------------------------------------------------------------------------+
|  px-6 py-5                                                           sticky    |
|  +---------------------------------------------------------------------------+ |
|  |                                                                           | |
|  |  [Logo]     Features  Pricing  Resources     [Sun]  Sign in  [Get Started]| |
|  |                                                                           | |
|  +---------------------------------------------------------------------------+ |
|     ^            ^                                 ^       ^          ^        |
|     |            |                                 |       |          |        |
|  Brand        Primary                           Theme   Text       Pill CTA    |
|  Zone         Nav Links                         Toggle  Link       (gradient)  |
|               (centered)                                                       |
+--------------------------------------------------------------------------------+
```

### ASCII Layout (Mobile - Target)

```
+----------------------------------------+
|  px-4 py-4                    sticky   |
|  +------------------------------------+|
|  |                                    ||
|  |  [Logo]               [Menu Icon] ||
|  |                                    ||
|  +------------------------------------+|
+----------------------------------------+

Mobile Menu (Open):
+----------------------------------------+
|  [Logo]                       [X]      |
+----------------------------------------+
|                                        |
|  Features                              |
|  ----------------------------------------
|  Pricing                               |
|  ----------------------------------------
|  Resources                             |
|  ----------------------------------------
|                                        |
|  [Theme Toggle]                        |
|                                        |
|  Sign in                               |
|  +------------------------------------+|
|  |         Get Started                ||
|  +------------------------------------+|
|                                        |
+----------------------------------------+
```

### Component Slots

| Slot | Element | Description |
|------|---------|-------------|
| **Logo** | `<Link>` with icon + text | Brand identity, links to home |
| **Primary Nav** | `<nav>` with links | Main navigation items |
| **Theme Toggle** | `<DropdownMenu>` | Light/Dark/System options |
| **Auth Actions** | Conditional render | Sign in/Get Started OR Go to App |
| **Mobile Toggle** | `<Button>` (hamburger) | Opens mobile menu sheet |

---

## States

### Default (Top of Page)

```
Background: bg-ui-bg/10 (10% opacity)
Blur: backdrop-blur-md
Border: border-ui-border/20 (20% opacity)
```

### Scrolled (Sticky Active)

```
Background: bg-ui-bg/95 (95% opacity)
Blur: backdrop-blur-lg
Border: border-ui-border/50 (50% opacity)
Shadow: shadow-sm (optional, adds depth)
```

### Link States

| State | Text Color | Transition |
|-------|------------|------------|
| Default | `text-ui-text-secondary` | - |
| Hover | `text-ui-text` | 0.15s ease-out |
| Active (current page) | `text-ui-text` + underline OR `text-brand` | - |
| Focus | Focus ring via `focus-visible:` | - |

### CTA Button States

| State | Style | Notes |
|-------|-------|-------|
| Default | `bg-linear-to-r from-cyan-500 to-teal-400` | Gradient fill |
| Hover | `hover:shadow-lg hover:shadow-cyan-500/25` | Glow effect |
| Active | Slightly darker gradient | Press feedback |
| Focus | Focus ring + glow | Accessibility |

---

## Design Tokens

### Colors

| Element | Token | Light Value | Dark Value |
|---------|-------|-------------|------------|
| Nav background (default) | `bg-ui-bg/10` | `rgba(255,255,255,0.1)` | `rgba(17,24,39,0.1)` |
| Nav background (scrolled) | `bg-ui-bg/95` | `rgba(255,255,255,0.95)` | `rgba(17,24,39,0.95)` |
| Border | `border-ui-border/20` | `rgba(229,231,235,0.2)` | `rgba(55,65,81,0.2)` |
| Border (scrolled) | `border-ui-border/50` | `rgba(229,231,235,0.5)` | `rgba(55,65,81,0.5)` |
| Logo text | `text-ui-text` | Gray 900 | Gray 50 |
| Nav link default | `text-ui-text-secondary` | Gray 500 | Gray 300 |
| Nav link hover | `text-ui-text` | Gray 900 | Gray 50 |
| CTA gradient start | `--color-landing-accent-teal` | Teal 500 | Teal 400 |
| CTA gradient end | `--color-landing-accent` | Cyan 500 | Cyan 400 |
| CTA text | `text-white` | White | White |
| CTA glow | `shadow-cyan-500/25` | Cyan with 25% alpha | Cyan with 25% alpha |

### Typography

| Element | Classes | Notes |
|---------|---------|-------|
| Logo text | `text-xl font-semibold` | 20px, semibold |
| Nav links | `text-sm` | 14px, regular |
| Sign in link | `text-sm font-medium` | 14px, medium weight |
| CTA button | `text-sm font-medium` | 14px, medium weight |

### Spacing

| Element | Value | Token/Class |
|---------|-------|-------------|
| Header padding X | 24px | `px-6` |
| Header padding Y | 20px | `py-5` |
| Nav container max-width | 1152px | `max-w-6xl` |
| Gap between nav links | 32px | `gap-8` |
| Gap between right actions | 16px | `gap-md` (via Flex) |
| CTA padding X | 20px | `px-5` |
| CTA padding Y | 10px | `py-2.5` |

### Border Radius

| Element | Value | Token |
|---------|-------|-------|
| CTA button | Full pill | `rounded-full` |
| Theme toggle | 8px | `rounded-lg` (via Button) |
| Mobile menu sheet | 12px | `rounded-container` |

---

## Animations

### Scroll Transition

Background should smoothly transition as user scrolls:

```css
/* Applied to header element */
.nav-header {
  transition: background-color 0.3s ease-out,
              border-color 0.3s ease-out,
              box-shadow 0.3s ease-out;
}
```

**ASCII Storyboard**:

```
At top (scrollY = 0)           Scrolling down            Scrolled (scrollY > 50)
+------------------+          +------------------+       +------------------+
|  bg: 10% opacity |   -->    |  bg: 50% opacity |  -->  |  bg: 95% opacity |
|  blur: md        |          |  blur: lg        |       |  blur: lg        |
|  border: 20%     |          |  border: 35%     |       |  border: 50%     |
|  shadow: none    |          |  shadow: xs      |       |  shadow: sm      |
+------------------+          +------------------+       +------------------+
     (transparent)               (transitioning)            (solid)
```

### Theme Toggle Animation

Icon rotation on theme change:

```css
/* Sun icon (light mode active) */
.theme-sun {
  transform: rotate(0deg) scale(1);
  transition: transform 0.3s ease-out;
}

/* Sun icon hidden (dark mode active) */
.theme-sun.hidden {
  transform: rotate(-90deg) scale(0);
}

/* Moon icon (dark mode active) */
.theme-moon {
  transform: rotate(0deg) scale(1);
  transition: transform 0.3s ease-out;
}

/* Moon icon hidden (light mode active) */
.theme-moon.hidden {
  transform: rotate(90deg) scale(0);
}
```

### Mobile Menu Animation

Open/close slide from right:

```css
/* Menu panel entry */
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Menu panel exit */
@keyframes slideOutToRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.mobile-menu-enter {
  animation: slideInFromRight 0.25s ease-out forwards;
}

.mobile-menu-exit {
  animation: slideOutToRight 0.2s ease-in forwards;
}
```

**ASCII Storyboard (Mobile Menu)**:

```
Closed                    Opening                     Open
+----------+             +----------+               +----------+
|          |             |      +---|               |   Menu   |
|  Page    |     -->     | Page | M |    -->        |   Panel  |
|          |             |      | e |               |          |
|          |             |      | n |               |  Links   |
|          |             |      | u |               |  Actions |
+----------+             +----------+               +----------+
                           (sliding)                 (full)
```

### Link Hover Transition

```css
.nav-link {
  transition: color 0.15s ease-out;
}
```

### CTA Button Hover

```css
.cta-button {
  transition: box-shadow 0.2s ease-out, transform 0.2s ease-out;
}

.cta-button:hover {
  box-shadow: 0 10px 25px -5px rgba(6, 182, 212, 0.25);
  transform: translateY(-1px);
}

.cta-button:active {
  transform: translateY(0);
}
```

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< md` (< 768px) | Mobile layout: Logo + hamburger only, nav in sheet |
| `>= md` (768px+) | Desktop layout: Full horizontal nav |

### Desktop (md+)

- Full horizontal navigation
- Nav links centered absolutely (`absolute left-1/2 -translate-x-1/2`)
- All actions visible inline

### Mobile (< md)

- Logo left, hamburger right
- Nav links hidden (in Sheet component)
- Theme toggle moves to mobile menu
- Full-width CTA button in menu

---

## Code Examples

### Current Implementation

```tsx
// src/components/landing/NavHeader.tsx (current)

export function NavHeader() {
  const { setTheme } = useTheme();

  return (
    <header className="px-6 py-5 sticky top-0 z-50 transition-all duration-300 backdrop-blur-md bg-ui-bg/10 border-b border-ui-border/20">
      <nav className="max-w-6xl mx-auto flex items-center justify-between relative">
        {/* Logo */}
        <Link to={ROUTES.home.path} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <NixeloLogo />
          <span className="text-xl font-semibold text-ui-text">Nixelo</span>
        </Link>

        {/* Centered nav links (desktop only) */}
        <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2">
          {["Features", "Pricing", "Resources"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-ui-text-secondary hover:text-ui-text transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <Flex align="center" gap="md">
          {/* Theme toggle dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-ui-text-secondary">
                <Sun className="h-icon-theme-toggle w-icon-theme-toggle rotate-0 scale-100 transition-all" />
                <Moon className="absolute h-icon-theme-toggle w-icon-theme-toggle rotate-90 scale-0 transition-all" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Laptop className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth actions */}
          <Unauthenticated>
            <Link to={ROUTES.signin.path} className="text-sm font-medium text-ui-text-secondary hover:text-ui-text transition-colors">
              Sign in
            </Link>
            <Link to={ROUTES.signup.path} className="px-5 py-2.5 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-sm font-medium text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all shadow-sm">
              Get Started
            </Link>
          </Unauthenticated>
          <Authenticated>
            <Link to={ROUTES.app.path} className="px-5 py-2.5 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-sm font-medium text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all shadow-sm">
              Go to App
            </Link>
          </Authenticated>
        </Flex>
      </nav>
    </header>
  );
}
```

### Target Implementation (Enhanced)

```tsx
// src/components/landing/NavHeader.tsx (target)

import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { Laptop, Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Flex } from "@/components/ui/Flex";
import { ROUTES } from "@/config/routes";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { NixeloLogo } from "./icons";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#resources" },
];

export function NavHeader() {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track scroll position for background transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "px-6 py-5 sticky top-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-ui-bg/95 backdrop-blur-lg border-ui-border/50 shadow-sm"
          : "bg-ui-bg/10 backdrop-blur-md border-ui-border/20"
      )}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between relative">
        {/* Logo */}
        <Link
          to={ROUTES.home.path}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <NixeloLogo />
          <span className="text-xl font-semibold text-ui-text">Nixelo</span>
        </Link>

        {/* Desktop nav links (centered) */}
        <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-ui-text-secondary hover:text-ui-text transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop right actions */}
        <Flex align="center" gap="md" className="hidden md:flex">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <AuthActions />
        </Flex>

        {/* Mobile menu trigger */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-ui-text-secondary">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm bg-ui-bg border-l border-ui-border">
            <div className="flex flex-col h-full">
              {/* Mobile nav links */}
              <nav className="flex flex-col gap-1 py-6">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-secondary rounded-lg transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Divider */}
              <div className="border-t border-ui-border my-2" />

              {/* Theme toggle */}
              <div className="px-4 py-3">
                <ThemeToggle theme={theme} setTheme={setTheme} variant="expanded" />
              </div>

              {/* Auth actions */}
              <div className="mt-auto px-4 pb-6 space-y-3">
                <Unauthenticated>
                  <Link
                    to={ROUTES.signin.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-3 text-ui-text-secondary hover:text-ui-text transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to={ROUTES.signup.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-3 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                  >
                    Get Started
                  </Link>
                </Unauthenticated>
                <Authenticated>
                  <Link
                    to={ROUTES.app.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-3 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                  >
                    Go to App
                  </Link>
                </Authenticated>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}

// Theme toggle component (reusable for desktop/mobile)
function ThemeToggle({
  theme,
  setTheme,
  variant = "compact",
}: {
  theme: string;
  setTheme: (theme: string) => void;
  variant?: "compact" | "expanded";
}) {
  if (variant === "expanded") {
    return (
      <Flex align="center" gap="sm">
        <span className="text-sm text-ui-text-secondary">Theme:</span>
        <Flex gap="xs">
          <Button
            variant={theme === "light" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTheme("light")}
          >
            <Sun className="h-4 w-4 mr-1" />
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-4 w-4 mr-1" />
            Dark
          </Button>
          <Button
            variant={theme === "system" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTheme("system")}
          >
            <Laptop className="h-4 w-4 mr-1" />
            Auto
          </Button>
        </Flex>
      </Flex>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-ui-text-secondary">
          <Sun className="h-icon-theme-toggle w-icon-theme-toggle rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-icon-theme-toggle w-icon-theme-toggle rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Auth actions component
function AuthActions() {
  return (
    <>
      <Unauthenticated>
        <Link
          to={ROUTES.signin.path}
          className="text-sm font-medium text-ui-text-secondary hover:text-ui-text transition-colors"
        >
          Sign in
        </Link>
        <Link
          to={ROUTES.signup.path}
          className="px-5 py-2.5 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-sm font-medium text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all shadow-sm"
        >
          Get Started
        </Link>
      </Unauthenticated>
      <Authenticated>
        <Link
          to={ROUTES.app.path}
          className="px-5 py-2.5 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-sm font-medium text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all shadow-sm"
        >
          Go to App
        </Link>
      </Authenticated>
    </>
  );
}
```

---

## Implementation Checklist

### Phase 1: Scroll-Based Background Transition

- [ ] Add `useState` for `isScrolled` boolean
- [ ] Add `useEffect` with scroll listener
- [ ] Conditionally apply background classes based on scroll state
- [ ] Test transition smoothness (0.3s duration)

### Phase 2: Mobile Menu

- [ ] Add Sheet component for mobile menu
- [ ] Add hamburger icon trigger (Menu from lucide-react)
- [ ] Implement nav links in sheet content
- [ ] Move theme toggle to mobile menu
- [ ] Add full-width CTA button
- [ ] Add close button / backdrop click to close
- [ ] Test slide animation

### Phase 3: Theme Toggle Enhancement

- [ ] Add dark mode class-based icon swap (`dark:rotate-0 dark:scale-100`)
- [ ] Verify smooth rotation transition
- [ ] Optional: Add expanded variant for mobile menu

### Phase 4: Accessibility

- [ ] Ensure all interactive elements have focus states
- [ ] Add proper ARIA labels to buttons
- [ ] Test keyboard navigation (Tab through all items)
- [ ] Test with screen reader
- [ ] Ensure mobile menu traps focus when open

### Phase 5: Polish

- [ ] Test on all breakpoints (sm, md, lg, xl)
- [ ] Verify z-index stacking (z-50 for nav, ensure dropdowns work)
- [ ] Test with various page content lengths
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All links/buttons focusable via Tab |
| Focus indicators | `focus-visible:outline` on all interactive elements |
| Screen reader labels | `sr-only` text for icon buttons |
| Mobile menu focus trap | Focus should not escape open sheet |
| Skip link (optional) | "Skip to main content" hidden link |
| Reduced motion | Respect `prefers-reduced-motion` for animations |

---

## Related Files

### Source References
- Mintlify dark: `docs/research/library/mintlify/landing_desktop_dark.png`
- Current Nixelo: `e2e/screenshots/01-empty-landing.png`

### Implementation Files
- Component: `src/components/landing/NavHeader.tsx`
- Icons: `src/components/landing/icons.tsx`
- Theme context: `src/contexts/ThemeContext.tsx`
- Routes: `src/config/routes.ts`
- UI primitives: `src/components/ui/` (Button, DropdownMenu, Sheet)

### Related Documentation
- Colors: `docs/design-system/tokens/colors.md`
- Animations: `docs/design-system/tokens/animations.md`
- Master Plan: `docs/design-system/MASTER_PLAN.md`

---

*This document is part of the Nixelo Design System. See [MASTER_PLAN.md](../MASTER_PLAN.md) for the full design system overview.*
