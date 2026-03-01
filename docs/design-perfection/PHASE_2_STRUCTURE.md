# Phase 2: Structural Polish

> **Goal**: Clean, consistent layout across desktop, tablet, and mobile
> **Acceptance**: 75% per viewport from review subagents

---

## Overview

With bulletproof components (Phase 1), we now polish screen structure:

1. **Layout** - Grid alignment, proper spacing
2. **Typography** - Clear hierarchy on every screen
3. **Responsive** - Proper behavior across viewports
4. **Consistency** - Same patterns everywhere

---

## Viewports

| Viewport | Size | Theme | Screenshots |
|----------|------|-------|-------------|
| Desktop | 1920x1080 | Dark | `e2e/screenshots/desktop-dark/` |
| Tablet | 768x1024 | Light | `e2e/screenshots/tablet-light/` |
| Mobile | 390x844 | Light | `e2e/screenshots/mobile-light/` |

---

## Task 1: Desktop Audit

### Review Every Screenshot

Location: `e2e/screenshots/desktop-dark/`

For each screenshot, check:

#### Layout
- [ ] Content properly contained (max-width, centered)
- [ ] Sidebar width consistent
- [ ] Grid alignment (8px grid)
- [ ] Proper whitespace between sections

#### Typography
- [ ] Clear hierarchy (title > subtitle > body > caption)
- [ ] Headings use `<Typography variant="h1|h2|h3|h4">`
- [ ] Body text readable size (14-16px)
- [ ] Proper line height (1.5-1.6)

#### Spacing
- [ ] Consistent padding (p-4, p-6, p-8)
- [ ] Consistent gaps (gap-2, gap-4, gap-6)
- [ ] No cramped elements
- [ ] Breathing room around sections

#### Components
- [ ] Cards have proper structure (header, body)
- [ ] Tables properly aligned
- [ ] Forms properly spaced
- [ ] Empty states centered and styled

### Desktop Issue Tracking

| Screen | Issue | Severity | Fix Required |
|--------|-------|----------|--------------|
| | | | |

---

## Task 2: Tablet Audit

### Review Every Screenshot

Location: `e2e/screenshots/tablet-light/`

For each screenshot, check:

#### Responsive Layout
- [ ] Sidebar collapses or becomes hamburger menu
- [ ] Grid shifts from 3-col to 2-col appropriately
- [ ] Cards stack properly
- [ ] No horizontal overflow

#### Touch Targets
- [ ] Buttons at least 44x44px tap area
- [ ] Adequate spacing between interactive elements
- [ ] No hover-only interactions without fallback

#### Typography
- [ ] Text still readable (not too small)
- [ ] Headings scale appropriately
- [ ] No text overflow or truncation issues

### Tablet Issue Tracking

| Screen | Issue | Severity | Fix Required |
|--------|-------|----------|--------------|
| | | | |

---

## Task 3: Mobile Audit

### Review Every Screenshot

Location: `e2e/screenshots/mobile-light/`

For each screenshot, check:

#### Single Column
- [ ] Content stacks to single column
- [ ] Full-width cards
- [ ] No side-by-side cramping

#### Navigation
- [ ] Hamburger menu works
- [ ] Bottom navigation if applicable
- [ ] Back buttons accessible

#### Spacing
- [ ] Adequate padding (not edge-to-edge)
- [ ] Touch-friendly spacing
- [ ] Scrollable areas obvious

#### Typography
- [ ] Headlines readable
- [ ] Body text 16px+ (no zoom needed)
- [ ] Labels and captions still visible

### Mobile Issue Tracking

| Screen | Issue | Severity | Fix Required |
|--------|-------|----------|--------------|
| | | | |

---

## Task 4: Cross-Viewport Consistency

### Check Across All Viewports

| Pattern | Desktop | Tablet | Mobile | Consistent? |
|---------|---------|--------|--------|-------------|
| Header height | | | | |
| Sidebar width | | | | |
| Card padding | | | | |
| Section spacing | | | | |
| Typography scale | | | | |
| Button sizes | | | | |

### Common Patterns to Enforce

#### Header
```
Desktop: Full nav, all links visible, user menu
Tablet:  Logo + hamburger + user menu
Mobile:  Logo + hamburger
```

#### Sidebar
```
Desktop: Always visible, 240px width
Tablet:  Slide-out drawer
Mobile:  Slide-out drawer
```

#### Grids
```
Desktop: 3-4 columns
Tablet:  2 columns
Mobile:  1 column
```

#### Cards
```
Desktop: p-6 padding, gap-6 between
Tablet:  p-5 padding, gap-4 between
Mobile:  p-4 padding, gap-4 between
```

---

## Task 5: Fix Structural Issues

### Common Fixes

#### Replace Raw Flex Divs
```diff
- <div className="flex items-center gap-4">
+ <Flex align="center" gap="md">
```

#### Replace Raw Typography
```diff
- <h1 className="text-2xl font-bold">Title</h1>
+ <Typography variant="h1">Title</Typography>
```

#### Fix Inconsistent Spacing
```diff
- <div className="p-3 md:p-5 lg:p-8">
+ <div className="p-4 md:p-6">  {/* Consistent scale */}
```

#### Add Missing Max Width
```diff
- <div className="px-6">
+ <div className="px-6 max-w-7xl mx-auto">
```

#### Fix Card Structure
```diff
- <div className="bg-white rounded-lg shadow p-4">
+ <Card>
+   <CardHeader title="Title" />
+   <CardBody>Content</CardBody>
+ </Card>
```

---

## Subagent Review Protocol

### Spawn Three Subagents

#### Desktop Subagent
```
Review all screenshots in e2e/screenshots/desktop-dark/

For each screenshot:
1. Layout: Content contained? Grid aligned?
2. Typography: Clear hierarchy? Readable?
3. Spacing: Consistent? No cramping?
4. Components: Properly structured?

Score each screen PASS/FAIL.
List specific structural issues.
Calculate: (PASS count / total) * 100 = acceptance %
```

#### Tablet Subagent
```
Review all screenshots in e2e/screenshots/tablet-light/

For each screenshot:
1. Responsive: Grid adapted? Sidebar collapsed?
2. Touch: Targets 44px+? Adequate spacing?
3. Typography: Still readable? No overflow?
4. Layout: No horizontal scroll? Proper stacking?

Score each screen PASS/FAIL.
List specific structural issues.
Calculate: (PASS count / total) * 100 = acceptance %
```

#### Mobile Subagent
```
Review all screenshots in e2e/screenshots/mobile-light/

For each screenshot:
1. Single column: Properly stacked?
2. Navigation: Hamburger accessible? Back buttons?
3. Spacing: Touch-friendly? Not edge-to-edge?
4. Typography: 16px+ body? Headlines readable?

Score each screen PASS/FAIL.
List specific structural issues.
Calculate: (PASS count / total) * 100 = acceptance %
```

### Acceptance Criteria

| Viewport | Required Score |
|----------|---------------|
| Desktop | 75%+ |
| Tablet | 75%+ |
| Mobile | 75%+ |

---

## Completion Gate

Before advancing to Phase 3:

- [ ] Desktop subagent: 75%+ approval
- [ ] Tablet subagent: 75%+ approval
- [ ] Mobile subagent: 75%+ approval
- [ ] All identified issues logged
- [ ] High-severity issues fixed
- [ ] Screenshots re-captured after fixes

---

## Related Files

### Screenshot Capture
```bash
pnpm screenshots
```

### Page Routes
- `src/routes/` - All page routes

### Layout Components
- `src/components/Layout.tsx`
- `src/components/Sidebar.tsx`
- `src/components/Header.tsx`

### Page Specs
- `docs/design/specs/pages/`

---

*Phase 2 must achieve 75%+ on all viewports before proceeding to Phase 3.*
