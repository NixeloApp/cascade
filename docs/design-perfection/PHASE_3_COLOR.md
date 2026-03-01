# Phase 3: Color & Visual Polish

> **Goal**: 100% semantic token usage, zero visual anomalies
> **Acceptance**: 75% from screenshot review subagent

---

## Overview

With structure solid (Phase 2), we now ensure:

1. **Token Compliance** - Every color uses semantic tokens
2. **Dark/Light Parity** - Both modes look intentional
3. **Visual Consistency** - Shadows, borders, text contrast uniform
4. **Anomaly Elimination** - Nothing looks "off" or broken

---

## Task 1: Codebase Color Audit

### Run Validators

```bash
# Full validation
node scripts/validate.js

# Specific color audit
node scripts/validate/check-colors.js

# Check arbitrary Tailwind
node scripts/validate/check-arbitrary-tw.js
```

### Target: Zero Violations

| Check | Target | Current |
|-------|--------|---------|
| Hardcoded hex/rgb | 0 | |
| Arbitrary color brackets | 0 | |
| Non-semantic Tailwind colors | 0 | |
| Dark mode violations | 0 | |

---

## Task 2: Find & Replace Violations

### Hardcoded Colors

Search for patterns:
```bash
# Hex colors in className
grep -r "#[0-9a-fA-F]{3,6}" --include="*.tsx" src/

# RGB/RGBA in className
grep -r "rgb\|rgba" --include="*.tsx" src/

# Inline styles with colors
grep -r "style={{.*color" --include="*.tsx" src/
```

Replace with semantic tokens:

| Find | Replace With |
|------|--------------|
| `bg-gray-900` | `bg-ui-bg` |
| `bg-gray-800` | `bg-ui-bg-secondary` |
| `bg-gray-700` | `bg-ui-bg-tertiary` |
| `text-gray-900` | `text-ui-text` |
| `text-gray-500` | `text-ui-text-secondary` |
| `text-gray-400` | `text-ui-text-tertiary` |
| `border-gray-200` | `border-ui-border` |
| `border-gray-300` | `border-ui-border-secondary` |
| `bg-blue-500` | `bg-brand` |
| `bg-green-500` | `bg-status-success` |
| `bg-red-500` | `bg-status-error` |
| `bg-yellow-500` | `bg-status-warning` |

### Arbitrary Tailwind Brackets

Find:
```bash
grep -r "\[#" --include="*.tsx" src/
grep -r "bg-\[" --include="*.tsx" src/
grep -r "text-\[" --include="*.tsx" src/
```

If needed, define new token in `src/index.css` `@theme` block.

---

## Task 3: Shadow Consistency

### Audit Shadow Usage

| Component/Area | Current | Should Be |
|----------------|---------|-----------|
| Cards | | `shadow-card` |
| Cards (hover) | | `shadow-card-hover` |
| Dialogs | | `shadow-lg` |
| Dropdowns | | `shadow-lg` |
| Tooltips | | `shadow-md` |
| Inputs (focus) | | Focus ring only |

### Shadow Tokens

From `src/index.css`:
```css
--shadow-card: ...;
--shadow-card-hover: ...;
```

Replace inconsistent shadows:
```diff
- className="shadow-sm hover:shadow-md"
+ className="shadow-card hover:shadow-card-hover"
```

---

## Task 4: Border Consistency

### Audit Border Usage

| Element | Token |
|---------|-------|
| Card borders | `border-ui-border` |
| Input borders | `border-ui-border` |
| Input focus | `border-brand` or `ring-brand-ring` |
| Dividers | `border-ui-border` |
| Table borders | `border-ui-border` |

### Check Border Visibility

In dark mode, borders should be:
- Subtle but visible
- Using opacity-based tokens (`rgba(255,255,255,0.07)`)
- Not jarring or too prominent

---

## Task 5: Text Contrast Check

### WCAG AA Requirements

| Text Type | Min Contrast |
|-----------|--------------|
| Body text | 4.5:1 |
| Large text (18px+) | 3:1 |
| UI components | 3:1 |

### Check Each Text Token

| Token | Dark Mode | Light Mode | Passes? |
|-------|-----------|------------|---------|
| `text-ui-text` | #fff on #0a0a0b | #111 on #fff | |
| `text-ui-text-secondary` | rgba(255,255,255,0.7) | | |
| `text-ui-text-tertiary` | rgba(255,255,255,0.5) | | |

---

## Task 6: Dark/Light Mode Parity

### Check Both Modes Feel Intentional

| Aspect | Dark Mode | Light Mode | Issue? |
|--------|-----------|------------|--------|
| Background depth | Near-black | Clean white | |
| Card differentiation | Subtle lift | Subtle shadow | |
| Border visibility | 7% opacity | Visible gray | |
| Text hierarchy | Clear 3 levels | Clear 3 levels | |
| Brand colors | Vibrant | Slightly muted | |
| Status colors | Accessible | Accessible | |

### Common Light Mode Issues

- Shadows too subtle (add `shadow-card` default)
- Borders invisible (check opacity)
- Text too light (ensure proper contrast)
- Cards blend into background (need border or shadow)

### Common Dark Mode Issues

- Borders too harsh (reduce opacity)
- White elements too bright (use off-white)
- Shadows invisible (expected, use border instead)
- Status colors not accessible

---

## Task 7: Visual Anomaly Hunt

### Screenshot-by-Screenshot Review

For each screenshot in `e2e/screenshots/desktop-dark/`:

| Issue Type | What to Look For |
|------------|------------------|
| Color bleed | Elements with wrong background color |
| Border inconsistency | Some cards with borders, some without |
| Shadow inconsistency | Mix of shadow styles |
| Text contrast | Text hard to read |
| Hover state missing | Interactive elements without hover |
| Focus ring missing | Focusable elements without ring |
| Loading state | Skeleton colors off |
| Empty state | Background or icon colors off |
| Badge colors | Not using status tokens |
| Chart colors | Not using palette tokens |

### Anomaly Tracking

| Screenshot | Element | Issue | Fix |
|------------|---------|-------|-----|
| | | | |

---

## Subagent Review Protocol

### Desktop Screenshot Review

```
Review EVERY screenshot in e2e/screenshots/desktop-dark/

For each screenshot, flag:

1. COLOR ISSUES
   - Hardcoded colors visible (non-brand colors standing out)
   - Inconsistent backgrounds
   - Wrong status colors

2. SHADOW ISSUES
   - Cards without shadows that should have them
   - Inconsistent shadow depths
   - Shadows in wrong places

3. BORDER ISSUES
   - Missing borders on containers
   - Inconsistent border colors
   - Borders too harsh or invisible

4. TEXT ISSUES
   - Low contrast text
   - Inconsistent text colors for same purpose
   - Wrong heading colors

5. VISUAL ANOMALIES
   - Anything that looks "off"
   - Inconsistent styling patterns
   - Broken dark mode elements

Score each screenshot PASS/FAIL.
For FAIL, list specific issues with element descriptions.
Calculate: (PASS count / total) * 100 = acceptance %
```

### Acceptance Criteria

| Review | Required Score |
|--------|---------------|
| Desktop Dark | 75%+ |

---

## Task 8: Fix Issues

### Priority Order

1. **Critical**: Text contrast failures (accessibility)
2. **High**: Inconsistent shadows/borders across similar elements
3. **Medium**: Visual anomalies in specific screens
4. **Low**: Minor polish items

### Fix Workflow

```bash
# 1. Make fixes
# 2. Run validators
node scripts/validate.js

# 3. Re-capture screenshots
pnpm screenshots

# 4. Re-run subagent review
```

---

## Completion Gate

Before advancing to Phase 4:

- [ ] Validator shows 0 color violations
- [ ] 0 hardcoded hex/rgb in codebase
- [ ] 0 arbitrary Tailwind color brackets
- [ ] All shadows use `shadow-card` tokens
- [ ] All borders use semantic tokens
- [ ] Text contrast meets WCAG AA
- [ ] Subagent approval: 75%+

---

## Related Files

### Color Tokens
- `src/index.css` - `@theme` block, `:root` primitives
- `docs/COLORS.md`

### Validators
- `scripts/validate.js`
- `scripts/validate/check-colors.js`
- `scripts/validate/check-arbitrary-tw.js`

### Screenshots
- `e2e/screenshots/desktop-dark/`
- `e2e/screenshots/tablet-light/`
- `e2e/screenshots/mobile-light/`

---

*Phase 3 must achieve 75%+ and 0 validator violations before proceeding to Phase 4.*
