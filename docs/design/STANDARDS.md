# Design Standards

> Timeless principles. These don't change.

## Core Principles

### 1. Semantic Tokens Only

Never use raw Tailwind colors. All colors go through the token system.

```tsx
// NEVER
bg-gray-500, text-slate-700, border-zinc-300
#fff, #000, rgb(), hsl()

// ALWAYS
bg-ui-bg, text-ui-text, border-ui-border
bg-brand, text-status-error, border-accent
```

### 2. 8px Spacing Grid

All spacing is multiples of 4px, preferring 8px increments.

| Token | Pixels | Use |
|-------|--------|-----|
| `gap-1` | 4px | Icon-to-text |
| `gap-2` | 8px | Tight groups |
| `gap-3` | 12px | List items |
| `gap-4` | 16px | Card sections |
| `gap-6` | 24px | Page sections |
| `gap-8` | 32px | Major sections |

No arbitrary values (`gap-[14px]`). Pick the closest standard.

### 3. No Inline Style Soup

Components handle their own styling. Don't scatter classes across children.

```tsx
// NEVER
<span className="text-xs text-ui-text-secondary opacity-70">text</span>

// GOOD - semantic component
<MetadataItem>text</MetadataItem>

// GOOD - plain text inherits parent
{` (${count})`}
```

### 4. Extract Repeated Patterns

If 3+ elements appear twice, make a component.

### 5. Semantic HTML

```tsx
// GOOD
<time dateTime={date.toISOString()}>{formatted}</time>
<kbd>⌘K</kbd>
<article>...</article>

// BAD
<span>{formatted}</span>
<span className="font-mono">⌘K</span>
```

### 6. Dark Mode is Automatic

Tokens use `light-dark()`. Never add `dark:` prefixes to semantic classes.

---

## Component Checklist

### Structure
- [ ] Uses `<Flex>` not `<div className="flex">`
- [ ] Uses semantic components not raw spans
- [ ] Uses `cn()` for class merging
- [ ] No inline style soup

### Colors
- [ ] Backgrounds: `bg-ui-*`, `bg-brand`, `bg-status-*`
- [ ] Text: `text-ui-*`, `text-brand`, `text-status-*`
- [ ] Borders: `border-ui-*`, `border-brand`
- [ ] No raw colors, no hex values

### Interactivity
- [ ] Hover state visible
- [ ] Focus: `ring-2 ring-brand ring-offset-2`
- [ ] Disabled: `opacity-50 cursor-not-allowed`
- [ ] Transitions use `duration-default`

### Accessibility
- [ ] `aria-label` on icon buttons
- [ ] Focus visible on keyboard nav
- [ ] Color contrast WCAG AA

---

## Page Checklist

| Element | Standard |
|---------|----------|
| Page padding | `p-6` |
| Header-to-content gap | `gap-6` |
| Section gaps | `gap-8` |
| Card gaps | `gap-4` |

---

## Shadows

| Token | Use |
|-------|-----|
| `shadow-card` | Cards, panels |
| `shadow-elevated` | Dropdowns, modals |

Never use `shadow-sm`, `shadow-md`, `shadow-lg`.

---

## Border Radius

| Token | Use |
|-------|-----|
| `rounded` | Buttons, inputs |
| `rounded-lg` | Cards |
| `rounded-xl` | Modals |
| `rounded-full` | Avatars, pills |

---

## Validation

```bash
node scripts/validate.js
# Target: 0 errors, 0 warnings
```
