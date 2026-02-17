# Class Compression Protocol

> **Purpose:** Eliminate "AI slop" — verbose, inconsistent, hand-rolled Tailwind class combinations — by compressing common patterns into reusable CVA variants and enforcing strict class usage rules.
>
> **Last Updated:** 2026-02-17
> **Status:** Phase 1 — Discovery

---

## 🎯 Goals

1. **Consistency** — Same visual intent = same classes, everywhere
2. **Maintainability** — Change spacing/colors in one place
3. **Readability** — Short, semantic class names over class soup
4. **Bundle Size** — Fewer unique class combinations = smaller CSS

---

## 🚫 Banned Patterns (The Slop)

### 1. Raw Spacing Classes in Components

**❌ DON'T:** Hand-roll spacing everywhere
```tsx
<div className="p-4 md:p-6 lg:p-8">
<div className="px-3 py-2 md:px-4 md:py-3">
<div className="mt-2 mb-4 space-y-3">
```

**✅ DO:** Use spacing tokens via CVA or design tokens
```tsx
<Card padding="md">       // CVA variant: p-4 md:p-6
<Button size="sm">        // CVA variant: px-3 py-2
<Stack spacing="md">      // Uses --spacing-md token
```

### 2. Raw Flexbox/Grid in Components

**❌ DON'T:** Repeat flex patterns
```tsx
<div className="flex items-center justify-between gap-2">
<div className="flex flex-col items-start gap-4">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**✅ DO:** Use layout components or CVA variants
```tsx
<Row justify="between" gap="sm">
<Stack align="start" gap="md">
<Grid cols={{ base: 1, md: 2, lg: 3 }} gap="lg">
```

### 3. Typography Soup

**❌ DON'T:** Hand-roll text styles
```tsx
<p className="text-sm text-muted-foreground font-medium leading-tight">
<h2 className="text-lg md:text-xl font-semibold tracking-tight">
<span className="text-xs text-gray-500 dark:text-gray-400">
```

**✅ DO:** Use typography variants
```tsx
<Text variant="body-sm" color="muted">
<Heading level={2} size="lg">
<Text variant="caption" color="subtle">
```

### 4. Interactive State Duplication

**❌ DON'T:** Repeat hover/focus/active patterns
```tsx
<button className="hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-95 transition-colors">
```

**✅ DO:** Bundle in component variants
```tsx
<Button variant="primary">  // All states bundled in CVA
```

### 5. Shadow/Border/Rounded Inconsistency

**❌ DON'T:** Mix arbitrary values
```tsx
<div className="rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
<div className="rounded-xl shadow-lg border border-border">
<div className="rounded-md shadow border">
```

**✅ DO:** Use semantic surface variants
```tsx
<Card variant="elevated">   // rounded-lg shadow-md border-border
<Card variant="outlined">   // rounded-lg border border-border
<Card variant="flat">       // rounded-lg bg-muted
```

---

## 📦 Compression Targets

### Spacing Scale (Locked)

| Token | Value | Use Case |
|-------|-------|----------|
| `xs` | 0.25rem (4px) | Icon gaps, tight inline |
| `sm` | 0.5rem (8px) | Compact UI, badges |
| `md` | 1rem (16px) | Default spacing |
| `lg` | 1.5rem (24px) | Section separation |
| `xl` | 2rem (32px) | Major sections |
| `2xl` | 3rem (48px) | Page-level spacing |

### Typography Scale (Locked)

| Variant | Classes | Use Case |
|---------|---------|----------|
| `display` | text-4xl font-bold tracking-tight | Hero headings |
| `heading-lg` | text-2xl font-semibold | Page titles |
| `heading-md` | text-xl font-semibold | Section titles |
| `heading-sm` | text-lg font-medium | Card titles |
| `body` | text-base | Default text |
| `body-sm` | text-sm | Secondary text |
| `caption` | text-xs text-muted-foreground | Labels, timestamps |

### Surface Variants (Locked)

| Variant | Classes |
|---------|---------|
| `elevated` | bg-card rounded-lg shadow-md border border-border |
| `outlined` | bg-card rounded-lg border border-border |
| `flat` | bg-muted rounded-lg |
| `ghost` | rounded-lg hover:bg-muted/50 |

---

## 🛠️ Implementation Plan

### Phase 1: Discovery (Current)
- [ ] Audit codebase for top 20 repeated class patterns
- [ ] Document current inconsistencies
- [ ] Identify candidate components for CVA refactor

### Phase 2: CVA Components
- [ ] Create `<Stack>` — vertical flexbox with gap variants
- [ ] Create `<Row>` — horizontal flexbox with gap/justify variants
- [ ] Create `<Grid>` — responsive grid with cols/gap variants
- [ ] Extend `<Card>` — add surface variants (elevated/outlined/flat)
- [ ] Create `<Text>` — typography variants wrapper

### Phase 3: Validation Rules
- [ ] Add ESLint rule: ban raw spacing in components (use tokens)
- [ ] Add ESLint rule: ban typography soup (use Text/Heading)
- [ ] Add validation script check for class compression violations

### Phase 4: Migration
- [ ] Run codemod to replace patterns
- [ ] Manual review of edge cases
- [ ] Update component library docs

---

## 🔧 CVA Pattern Examples

### Stack Component

```tsx
// src/components/ui/Stack.tsx
import { cva, type VariantProps } from "class-variance-authority";

const stackVariants = cva("flex flex-col", {
  variants: {
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
  },
  defaultVariants: {
    gap: "md",
    align: "stretch",
  },
});

interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

export function Stack({ gap, align, className, ...props }: StackProps) {
  return <div className={cn(stackVariants({ gap, align }), className)} {...props} />;
}
```

### Text Component

```tsx
// src/components/ui/Text.tsx
import { cva, type VariantProps } from "class-variance-authority";

const textVariants = cva("", {
  variants: {
    variant: {
      body: "text-base",
      "body-sm": "text-sm",
      caption: "text-xs",
      label: "text-sm font-medium",
    },
    color: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      subtle: "text-muted-foreground/70",
      brand: "text-brand-600",
      error: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "body",
    color: "default",
  },
});

interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div";
}

export function Text({ variant, color, as = "p", className, ...props }: TextProps) {
  const Comp = as;
  return <Comp className={cn(textVariants({ variant, color }), className)} {...props} />;
}
```

---

## 📏 Enforcement Rules

### Validation Script Additions

Add to `scripts/validate.js`:

```javascript
// CLASS_COMPRESSION: Check for banned raw class patterns
const BANNED_PATTERNS = [
  // Raw responsive spacing
  /className="[^"]*p-\d.*md:p-\d/,
  /className="[^"]*gap-\d.*md:gap-\d/,
  
  // Typography soup
  /className="[^"]*text-(sm|base|lg).*font-(medium|semibold|bold).*text-muted/,
  
  // Flexbox soup (more than 3 flex-related classes inline)
  /className="[^"]*flex[^"]*items-[^"]*justify-[^"]*gap-/,
];
```

### ESLint Custom Rules (Future)

```javascript
// eslint-plugin-nixelo
module.exports = {
  rules: {
    'no-raw-spacing': { /* ... */ },
    'no-typography-soup': { /* ... */ },
    'prefer-layout-components': { /* ... */ },
  },
};
```

---

## 🎯 Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Unique class combinations | ~500+ | <200 |
| Files with >100 char className | ~80 | <20 |
| CVA component coverage | ~10% | >80% |
| Manual flex/grid usage | ~200 files | <30 files |

---

## 📚 Related Docs

- [COLORS.md](../COLORS.md) — Semantic color tokens
- [STANDARDS.md](./STANDARDS.md) — General design standards
- [PATTERNS.md](./PATTERNS.md) — UI patterns
- [Button component](../../src/components/ui/Button.tsx) — CVA example

---

## 🗒️ Notes

- This is not about removing Tailwind — it's about constraining its usage
- CVA variants should be exhaustive — no `className` prop for core styles
- Edge cases use `className` override, but should be rare (<5% of usages)
- Run `pnpm validate-changes` to check for violations
