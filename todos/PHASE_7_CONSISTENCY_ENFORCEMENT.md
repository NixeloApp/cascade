# Phase 7: Design Consistency Enforcement

> **Status:** 🚧 In Progress
> **Goal:** Eliminate AI slop by expanding CVA patterns, adding validator checks, and creating component recipes
> **Last Updated:** 2026-02-17

---

## The Problem

Current setup allows inconsistent code to slip through:

1. **CVA only covers 18 components** — Button, Badge, Typography use CVA, but most components don't
2. **Spacing is ad-hoc** — `p-4`, `px-3`, `py-2.5`, `gap-2`, `gap-4` scattered everywhere with no semantic meaning
3. **Radius inconsistency** — `rounded-lg`, `rounded-xl`, `rounded-t-lg`, `rounded-md` mixed randomly
4. **Shadow inconsistency** — `shadow`, `shadow-card`, `shadow-soft` without clear rules
5. **Validators miss compound patterns** — We catch `bg-red-500` but not `p-4 sm:p-6 rounded-lg shadow`

**Example of AI slop that passes validation:**
```tsx
// Passes all validators but is inconsistent garbage
<div className="p-4 sm:p-6 rounded-lg shadow bg-ui-bg">
  <div className="flex items-center gap-3 mb-4">
    <span className="text-sm font-medium">Title</span>
  </div>
</div>
```

**Should be:**
```tsx
<Card variant="elevated" padding="lg">
  <Flex align="center" gap="sm">
    <Typography variant="label">Title</Typography>
  </Flex>
</Card>
```

---

## Phase 7 Sections

### 7.1 Spacing Token System 🎯

**Problem:** 20+ different padding/margin values used inconsistently.

**Current usage audit:**
```
p-2   → 138 usages
p-3   → 89 usages
p-4   → 201 usages
p-6   → 45 usages
px-3  → 112 usages
py-2  → 156 usages
gap-2 → 234 usages
gap-3 → 89 usages
gap-4 → 178 usages
```

**Solution:** Create semantic spacing tokens in index.css:

| Token | Value | Use Case |
|-------|-------|----------|
| `--spacing-xs` | 4px | Icon padding, tight gaps |
| `--spacing-sm` | 8px | Card internal gaps, button padding |
| `--spacing-md` | 12px | Section gaps, form spacing |
| `--spacing-lg` | 16px | Card padding, major gaps |
| `--spacing-xl` | 24px | Page sections, modal padding |
| `--spacing-2xl` | 32px | Hero sections, major dividers |

**Tasks:**
- [ ] Audit all spacing usage (`grep -rE "p-[0-9]|gap-[0-9]|m-[0-9]"`)
- [ ] Define semantic spacing tokens in `@theme`
- [ ] Create Tailwind utilities (`p-spacing-lg`, `gap-spacing-md`)
- [ ] Add `check-spacing.js` validator
- [ ] Migrate high-traffic components first (Card, Flex, Dialog)
- [ ] Document spacing rules in PATTERNS.md

---

### 7.2 Card Component Variants 🎯

**Problem:** Cards are just `<div className="bg-ui-bg rounded-lg p-4 border">` everywhere.

**Current patterns found:**
```tsx
// Pattern 1: Basic card
<div className="bg-ui-bg rounded-lg border border-ui-border p-4">

// Pattern 2: Elevated card
<div className="bg-ui-bg rounded-lg shadow-card p-6">

// Pattern 3: Interactive card
<div className="bg-ui-bg rounded-lg border hover:border-ui-border-secondary p-4 cursor-pointer">

// Pattern 4: Soft card
<div className="bg-ui-bg-soft rounded-lg p-4">
```

**Solution:** Extend Card.tsx with CVA variants:

```tsx
const cardVariants = cva(
  "rounded-container border transition-default",
  {
    variants: {
      variant: {
        default: "bg-ui-bg border-ui-border",
        elevated: "bg-ui-bg border-transparent shadow-card",
        soft: "bg-ui-bg-soft border-transparent",
        interactive: "bg-ui-bg border-ui-border hover:border-ui-border-secondary cursor-pointer",
        outline: "bg-transparent border-ui-border",
      },
      padding: {
        none: "",
        sm: "p-spacing-sm",
        md: "p-spacing-md",
        lg: "p-spacing-lg",
        xl: "p-spacing-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "lg",
    },
  }
);
```

**Tasks:**
- [ ] Audit Card patterns (`grep -rE "bg-ui-bg.*rounded"`)
- [ ] Add CVA variants to Card.tsx
- [ ] Create CardHeader, CardContent, CardFooter subcomponents
- [ ] Add `check-card-patterns.js` validator (flag raw card divs)
- [ ] Migrate Dashboard, Settings, Modal cards
- [ ] Add Storybook stories for all variants

---

### 7.3 Layout Component Recipes 🎯

**Problem:** Common layouts are recreated with raw classes every time.

**Common patterns to componentize:**

| Pattern | Current | Target |
|---------|---------|--------|
| Page header | `<div className="flex justify-between items-center mb-6">` | `<PageHeader title="..." actions={...} />` |
| Section | `<div className="space-y-4">` | `<Section title="..." gap="md">` |
| Form row | `<div className="grid grid-cols-2 gap-4">` | `<FormRow cols={2}>` |
| Action bar | `<div className="flex gap-2 justify-end">` | `<ActionBar>` |
| Divider | `<div className="h-px bg-ui-border my-4" />` | `<Divider spacing="md" />` |

**Tasks:**
- [ ] Create `PageHeader` component (title, description, actions, breadcrumbs)
- [ ] Create `Section` component (title, gap, collapsible)
- [ ] Create `FormRow` component (cols, gap, responsive)
- [ ] Create `ActionBar` component (justify, gap, sticky)
- [ ] Extend `Separator` with spacing props
- [ ] Add validator for raw layout patterns
- [ ] Migrate 10 highest-traffic pages

---

### 7.4 Interactive State Recipes 🎯

**Problem:** Hover/focus/active states inconsistently applied.

**Current inconsistencies:**
```tsx
// Different hover patterns
hover:bg-ui-bg-hover
hover:bg-ui-bg-secondary
hover:border-ui-border-secondary
hover:bg-ui-bg-hover hover:border-ui-border-secondary

// Different transition patterns
transition-colors
transition-all
transition-default
duration-200
```

**Solution:** Create interaction presets:

```css
/* In index.css */
.interactive-subtle {
  @apply transition-default hover:bg-ui-bg-hover;
}

.interactive-border {
  @apply transition-default hover:bg-ui-bg-hover hover:border-ui-border-secondary;
}

.interactive-lift {
  @apply transition-default hover:bg-ui-bg-hover hover:-translate-y-0.5 hover:shadow-card-hover;
}

.interactive-press {
  @apply transition-default active:scale-[0.98];
}
```

**Tasks:**
- [ ] Audit hover/focus patterns (`grep -rE "hover:bg|hover:border"`)
- [ ] Define interaction presets in index.css
- [ ] Create CVA `interaction` variant for common components
- [ ] Add validator for inconsistent transition usage
- [ ] Migrate ListItem, Card, Button interactions

---

### 7.5 Form Component Standardization 🎯

**Problem:** Form layouts and field spacing vary wildly.

**Current issues:**
- Different gap values between form fields
- Inconsistent label positioning (above vs inline)
- Different error message styling
- Inconsistent helper text patterns

**Solution:** Create form layout components:

```tsx
<FormLayout>
  <FormSection title="Profile">
    <FormField label="Name" error={errors.name}>
      <Input {...register("name")} />
    </FormField>
    <FormField label="Email" helperText="We'll never share your email">
      <Input {...register("email")} />
    </FormField>
  </FormSection>
  <FormSection title="Preferences">
    <FormRow cols={2}>
      <FormField label="Theme">
        <Select {...register("theme")} />
      </FormField>
      <FormField label="Language">
        <Select {...register("language")} />
      </FormField>
    </FormRow>
  </FormSection>
  <FormActions>
    <Button variant="secondary">Cancel</Button>
    <Button type="submit">Save</Button>
  </FormActions>
</FormLayout>
```

**Tasks:**
- [ ] Create `FormLayout` component (spacing, max-width)
- [ ] Create `FormSection` component (title, description, gap)
- [ ] Enhance `FormField` with consistent label/error/helper styling
- [ ] Create `FormRow` for horizontal field groups
- [ ] Create `FormActions` for submit/cancel buttons
- [ ] Add validator for raw form layouts
- [ ] Migrate Settings forms, CreateIssueModal, auth forms

---

### 7.6 Validator Enhancements 🎯

**Problem:** Current validators miss compound patterns.

**New validators to add:**

| Validator | Catches | Example |
|-----------|---------|---------|
| `check-card-patterns.js` | Raw card divs | `<div className="bg-ui-bg rounded-lg p-4">` |
| `check-spacing.js` | Non-semantic spacing | `p-4 sm:p-6` (should use token) |
| `check-interactive.js` | Inconsistent hover states | `hover:bg-gray-100` |
| `check-form-layouts.js` | Raw form structures | `<div className="space-y-4">` in forms |
| `check-radius.js` | Non-token radius | `rounded-xl` outside Card |

**Tasks:**
- [ ] Create `check-card-patterns.js` — flag raw card divs
- [ ] Create `check-spacing.js` — flag non-semantic spacing
- [ ] Create `check-interactive.js` — flag inconsistent hover patterns
- [ ] Create `check-form-layouts.js` — flag raw form structures
- [ ] Enhance `check-standards.js` — add radius pattern checks
- [ ] Add allowlists for legitimate raw usage
- [ ] Target: 0 errors on all new validators

---

### 7.7 Component Migration Tracker 🎯

**Priority components to migrate:**

| Component | Lines | Card? | Spacing? | Interactive? | Form? | Status |
|-----------|-------|-------|----------|--------------|-------|--------|
| Dashboard.tsx | 400 | ✅ | ✅ | - | - | ⬜ |
| AppSidebar.tsx | 690 | ⬜ | ✅ | ✅ | - | ⬜ |
| IssueDetailModal.tsx | 500 | ✅ | ✅ | - | ✅ | ⬜ |
| CreateIssueModal.tsx | 450 | - | ✅ | - | ✅ | ⬜ |
| AnalyticsDashboard.tsx | 350 | ✅ | ✅ | - | - | ⬜ |
| NotificationCenter.tsx | 300 | ✅ | ✅ | ✅ | - | ⬜ |
| SprintManager.tsx | 350 | ✅ | ✅ | - | ✅ | ⬜ |
| KanbanBoard.tsx | 400 | - | ✅ | ✅ | - | ⬜ |
| CalendarView.tsx | 350 | ✅ | ✅ | - | - | ⬜ |
| TeamSettings.tsx | 300 | - | ✅ | - | ✅ | ⬜ |

**Migration order:**
1. Add spacing tokens to index.css
2. Extend Card.tsx with CVA variants
3. Create layout components (PageHeader, Section)
4. Create form components (FormLayout, FormSection)
5. Add validators
6. Migrate components (top-down by usage)

---

## Progress Tracking

| Section | Status | Items | Validators |
|---------|--------|-------|------------|
| 7.1 Spacing Tokens | ⬜ | 0/6 | check-spacing.js |
| 7.2 Card Variants | ⬜ | 0/6 | check-card-patterns.js |
| 7.3 Layout Recipes | ⬜ | 0/7 | check-standards.js |
| 7.4 Interactive States | ⬜ | 0/5 | check-interactive.js |
| 7.5 Form Components | ⬜ | 0/7 | check-form-layouts.js |
| 7.6 Validators | ⬜ | 0/6 | - |
| 7.7 Migration | ⬜ | 0/10 | - |
| **Total** | **0%** | **0/47** | **4 new** |

---

## Quick Wins (Start Here)

1. **Add spacing tokens** — 30 min, immediate validation benefit
2. **Extend Card.tsx** — 1 hour, fixes most card inconsistencies
3. **Create check-card-patterns.js** — 30 min, catches future slop
4. **Migrate Dashboard.tsx** — 1 hour, high-visibility improvement

---

## Commands

```bash
# Audit current spacing usage
grep -rE "p-[0-9]|px-[0-9]|py-[0-9]|gap-[0-9]|m-[0-9]" src/components/ | wc -l

# Audit card patterns
grep -rE "bg-ui-bg.*rounded" src/components/*.tsx | wc -l

# Audit hover patterns
grep -rE "hover:bg-|hover:border-" src/components/ | wc -l

# Run all validators
node scripts/validate.js
```

---

*This document drives Phase 7 of the recursive improvement protocol.*
