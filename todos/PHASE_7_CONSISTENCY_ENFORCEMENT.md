# Phase 7: Zero Raw Tailwind

> **Status:** 🚧 In Progress
> **Goal:** All styling lives in CVA components. No raw Tailwind in app code.
> **Last Updated:** 2026-02-17

---

## The Vision

**Current state:** Tailwind classes scattered everywhere, inconsistent patterns, AI slop.

**Target state:**
- App components use ONLY semantic component props
- ALL Tailwind lives inside `src/components/ui/` CVA definitions
- Validators flag any raw Tailwind outside UI components

```tsx
// ❌ BEFORE: Raw Tailwind chaos
<div className="flex items-center gap-2 p-4 rounded-lg bg-ui-bg border border-ui-border hover:bg-ui-bg-hover">
  <span className="text-sm font-medium text-ui-text">Title</span>
  <span className="text-xs text-ui-text-tertiary">Subtitle</span>
</div>

// ✅ AFTER: CVA components only
<Card padding="md" interactive>
  <Flex align="center" gap="sm">
    <Typography variant="label">Title</Typography>
    <Typography variant="meta">Subtitle</Typography>
  </Flex>
</Card>
```

---

## Exceptions

| Location | Raw Tailwind Allowed | Reason |
|----------|---------------------|--------|
| `src/components/ui/*.tsx` | ✅ Yes | CVA definitions live here |
| `src/components/Landing/` | ✅ Yes | One-off marketing designs |
| `src/components/Kanban/` | ✅ Yes | Complex DnD requires custom layouts |
| `*.stories.tsx` | ✅ Yes | Storybook demos |
| `*.test.tsx` | ✅ Yes | Test utilities |
| Everything else | ❌ No | Must use CVA components |

---

## Phase 7 Sections

### 7.1 Expand Existing CVA Components

**Components that need more variants:**

| Component | Current Variants | Needed Variants |
|-----------|-----------------|-----------------|
| `Card` | default | `elevated`, `soft`, `interactive`, `outline` + `padding` prop |
| `Flex` | direction, gap, align, justify | ✅ Complete |
| `Grid` | cols, gap | Add `padding` prop |
| `Typography` | 12 variants | ✅ Complete |
| `Badge` | 10 variants | ✅ Complete |
| `Button` | 7 variants | ✅ Complete |

**Tasks:**
- [ ] Add Card variants: `elevated`, `soft`, `interactive`, `outline`
- [ ] Add Card `padding` prop: `none`, `sm`, `md`, `lg`, `xl`
- [ ] Add Card `radius` prop: `none`, `sm`, `md`, `lg`
- [ ] Add Grid `padding` prop
- [ ] Add Flex `padding` prop (for container use cases)

---

### 7.2 New Layout Components

**Missing components that would eliminate raw Tailwind:**

| Component | Replaces | Props |
|-----------|----------|-------|
| `Section` | `<div className="space-y-4">` | `gap`, `padding` |
| `PageHeader` | Header + title + actions pattern | `title`, `description`, `actions`, `breadcrumbs` |
| `Divider` | `<div className="h-px bg-ui-border">` | `spacing`, `orientation` |
| `Stack` | `<div className="space-y-*">` | `gap` (vertical-only Flex) |
| `Container` | `<div className="max-w-* mx-auto p-*">` | `size`, `padding` |

**Tasks:**
- [ ] Create `Section` component with gap/padding CVA
- [ ] Create `PageHeader` component
- [ ] Extend `Separator` with spacing prop (already exists, just needs enhancement)
- [ ] Create `Stack` component (alias for `<Flex direction="column">`)
- [ ] Create `Container` component for page-level max-width

---

### 7.3 Form Layout Components

**Current form patterns that need components:**

```tsx
// ❌ Current
<div className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
    <Input label="First Name" />
    <Input label="Last Name" />
  </div>
  <Input label="Email" />
  <div className="flex justify-end gap-2">
    <Button variant="secondary">Cancel</Button>
    <Button>Save</Button>
  </div>
</div>

// ✅ Target
<FormLayout>
  <FormRow cols={2}>
    <Input label="First Name" />
    <Input label="Last Name" />
  </FormRow>
  <Input label="Email" />
  <FormActions>
    <Button variant="secondary">Cancel</Button>
    <Button>Save</Button>
  </FormActions>
</FormLayout>
```

**Tasks:**
- [ ] Create `FormLayout` component (vertical stack with standard gap)
- [ ] Create `FormRow` component (horizontal grid with gap)
- [ ] Create `FormActions` component (right-aligned button row)
- [ ] Create `FormSection` component (grouped fields with title)

---

### 7.4 Interactive State Standardization

**Problem:** Hover/focus/active states applied inconsistently.

**Solution:** Add `interactive` boolean prop to Card, ListItem, etc.

```tsx
// Card with interactive prop
<Card interactive>  // adds hover:bg-ui-bg-hover, cursor-pointer, transition
  ...
</Card>

// Or explicit variant
<Card variant="interactive">
  ...
</Card>
```

**Tasks:**
- [ ] Add `interactive` prop to Card
- [ ] Standardize ListItem hover states via CVA
- [ ] Create `Pressable` base component for interactive elements
- [ ] Document interactive patterns in PATTERNS.md

---

### 7.5 Validator: No Raw Tailwind

**New validator: `check-raw-tailwind.js`**

Flags ANY of these patterns outside allowed directories:

| Pattern | Example | Should Use |
|---------|---------|------------|
| `flex` | `className="flex"` | `<Flex>` |
| `grid` | `className="grid"` | `<Grid>` |
| `gap-*` | `className="gap-2"` | `<Flex gap="sm">` |
| `p-*`, `px-*`, `py-*` | `className="p-4"` | `<Card padding="md">` |
| `m-*`, `mx-*`, `my-*` | `className="mt-4"` | Parent `<Flex gap>` or `<Stack>` |
| `space-y-*`, `space-x-*` | `className="space-y-4"` | `<Stack gap="md">` |
| `rounded-*` | `className="rounded-lg"` | `<Card>` (has built-in radius) |
| `text-*` (sizing) | `className="text-sm"` | `<Typography variant>` |
| `font-*` | `className="font-medium"` | `<Typography variant>` |

**Allowlist:**
- `src/components/ui/` - CVA definitions
- `src/components/Landing/` - Marketing pages
- `src/components/Kanban/` - Complex DnD
- `*.stories.tsx` - Storybook
- `*.test.tsx` - Tests

**Tasks:**
- [ ] Create `check-raw-tailwind.js` validator
- [ ] Add to `scripts/validate.js` runner
- [ ] Run audit to see current violation count
- [ ] Set target: 0 violations (after migration)

---

### 7.6 Migration Plan

**Phase 1: Foundation (do first)**
1. Extend Card.tsx with variants + padding
2. Create Stack, Section, Container components
3. Create FormLayout, FormRow, FormActions
4. Create check-raw-tailwind.js validator

**Phase 2: High-Traffic Components**
| Component | Est. Violations | Priority |
|-----------|----------------|----------|
| Dashboard.tsx | ~20 | High |
| AppSidebar.tsx | ~30 | High |
| IssueDetailModal.tsx | ~25 | High |
| CreateIssueModal.tsx | ~20 | High |
| NotificationCenter.tsx | ~15 | Medium |
| AnalyticsDashboard.tsx | ~20 | Medium |
| Settings pages | ~40 | Medium |

**Phase 3: Long Tail**
- Run validator, fix remaining violations
- Target: 0 raw Tailwind outside exceptions

---

## Progress Tracking

| Section | Status | Items |
|---------|--------|-------|
| 7.1 Expand CVA Components | ⬜ | 0/5 |
| 7.2 New Layout Components | ⬜ | 0/5 |
| 7.3 Form Layout Components | ⬜ | 0/4 |
| 7.4 Interactive States | ⬜ | 0/4 |
| 7.5 Validator | ⬜ | 0/4 |
| 7.6 Migration | ⬜ | 0/10 |
| **Total** | **0%** | **0/32** |

---

## Quick Wins (Start Here)

1. **Extend Card.tsx** - Add `padding` and `variant` props (1 hour)
2. **Create Stack component** - Just `<Flex direction="column">` alias (15 min)
3. **Create check-raw-tailwind.js** - Get violation count (1 hour)
4. **Migrate Dashboard.tsx** - High visibility, proves the pattern (2 hours)

---

## Commands

```bash
# Current raw Tailwind usage (will be violations)
grep -rE "className=.*\"[^\"]*\b(flex|grid|gap-|p-|m-|rounded-|text-sm|text-xs|font-)\b" src/components/*.tsx | wc -l

# Excluding UI components
grep -rE "className=.*\"[^\"]*\b(flex|grid|gap-|p-|m-|rounded-)\b" src/components/*.tsx | grep -v "/ui/" | wc -l

# Run validators
node scripts/validate.js
```

---

*Zero raw Tailwind = zero AI slop.*
