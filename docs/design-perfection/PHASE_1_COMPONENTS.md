# Phase 1: Component Foundation

> **Goal**: 100% component quality - Storybook documentation, all variants, all states
> **Acceptance**: 100% (components are the foundation, no compromises)

---

## Overview

Before polishing screens, we need bulletproof components. Every UI primitive in `src/components/ui/` must be:

1. **Documented** in Storybook with all variants
2. **Tested** for all interactive states
3. **Consistent** with design tokens
4. **Accessible** with proper focus states and ARIA

---

## Task 1: Storybook Setup

### 1.1 Install Storybook

```bash
pnpm dlx storybook@latest init --type react
```

### 1.2 Configure for Vite + Tailwind v4

Update `.storybook/main.ts`:
```typescript
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
```

### 1.3 Configure Theme Support

Create `.storybook/preview.tsx`:
```typescript
import "../src/index.css";
import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0a0a0b" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
  decorators: [
    (Story, context) => (
      <div className={context.globals.theme || "dark"}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

### Completion Checklist
- [ ] Storybook installed
- [ ] Vite integration working
- [ ] Tailwind CSS loading correctly
- [ ] Dark/light theme toggle available
- [ ] `pnpm storybook` runs successfully

---

## Task 2: Component Stories

### Priority Order

Create stories in this order (highest impact first):

#### Tier 1 - Critical (Do First)
| Component | File | Variants | States |
|-----------|------|----------|--------|
| Button | `button.stories.tsx` | primary, secondary, success, danger, ghost, link, outline | default, hover, focus, disabled, loading |
| Card | `card.stories.tsx` | default, soft, flat, hoverable | default, hover |
| Input | `input.stories.tsx` | default, error, disabled | default, focus, error, disabled |
| Dialog | `dialog.stories.tsx` | default, with form | open, closed, loading |

#### Tier 2 - High Priority
| Component | File | Variants | States |
|-----------|------|----------|--------|
| Badge | `badge.stories.tsx` | default, primary, success, warning, error, neutral | - |
| Avatar | `avatar.stories.tsx` | image, fallback, sizes | - |
| Tooltip | `tooltip.stories.tsx` | default, positions | visible, hidden |
| DropdownMenu | `dropdown-menu.stories.tsx` | default, with icons | open, closed |

#### Tier 3 - Medium Priority
| Component | File | Variants | States |
|-----------|------|----------|--------|
| Typography | `typography.stories.tsx` | h1-h4, p, muted, code | - |
| Flex | `flex.stories.tsx` | row, column, gaps, alignment | - |
| Skeleton | `skeleton.stories.tsx` | default, circular, text | - |
| LoadingSpinner | `loading-spinner.stories.tsx` | sizes | - |

#### Tier 4 - Lower Priority
| Component | File | Variants | States |
|-----------|------|----------|--------|
| EmptyState | `empty-state.stories.tsx` | with icon, with action | - |
| Progress | `progress.stories.tsx` | values, sizes | - |
| ToggleGroup | `toggle-group.stories.tsx` | single, multiple | - |
| Tabs | `tabs.stories.tsx` | default, with icons | - |

### Story Template

```typescript
// src/components/ui/button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "success", "danger", "ghost", "link", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Variants
export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
  },
};

// States
export const Loading: Story = {
  args: {
    children: "Loading",
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
};

// With Icons
export const WithLeftIcon: Story = {
  args: {
    children: "Add Item",
    leftIcon: <span>+</span>,
  },
};

// All Variants Grid
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="success">Success</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="outline">Outline</Button>
      </div>
    </div>
  ),
};

// All Sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">+</Button>
    </div>
  ),
};

// All States
export const AllStates: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button isLoading>Loading</Button>
    </div>
  ),
};
```

### Completion Checklist
- [ ] All Tier 1 components have stories
- [ ] All Tier 2 components have stories
- [ ] All Tier 3 components have stories
- [ ] All Tier 4 components have stories
- [ ] Each story covers all variants
- [ ] Each story covers all states

---

## Task 3: Visual Audit

### Audit Checklist (Per Component)

Run through each component in Storybook and verify:

#### Token Consistency
- [ ] Uses semantic color tokens (`bg-brand`, not `bg-indigo-600`)
- [ ] Uses semantic text tokens (`text-ui-text`, not `text-gray-900`)
- [ ] Uses semantic border tokens (`border-ui-border`, not `border-gray-200`)
- [ ] Uses shadow tokens (`shadow-card`, not `shadow-sm`)

#### State Consistency
- [ ] Hover state visible and consistent
- [ ] Focus ring visible (2px, proper color)
- [ ] Disabled state at 50% opacity
- [ ] Loading state with spinner

#### Spacing Consistency
- [ ] Uses spacing scale (gap-2, gap-4, not arbitrary)
- [ ] Padding consistent with size variant
- [ ] Border radius consistent (`rounded-lg` for most)

#### Dark/Light Parity
- [ ] Works in dark mode
- [ ] Works in light mode
- [ ] Contrast meets WCAG AA

#### Accessibility
- [ ] Focus states keyboard-accessible
- [ ] Icon-only buttons have aria-label
- [ ] Loading states have aria-busy
- [ ] Disabled buttons properly announced

### Issue Tracking

| Component | Issue | Severity | Fix |
|-----------|-------|----------|-----|
| | | | |

---

## Task 4: Fix Issues

For each issue identified:

1. **Locate** the component file in `src/components/ui/`
2. **Read** the current implementation
3. **Fix** using semantic tokens and consistent patterns
4. **Test** in Storybook (both themes)
5. **Run** `pnpm fixme` to validate

### Common Fixes

#### Replace Hardcoded Colors
```diff
- className="bg-gray-100 text-gray-900"
+ className="bg-ui-bg-secondary text-ui-text"
```

#### Add Missing Focus States
```diff
- className="rounded-lg px-4 py-2"
+ className="rounded-lg px-4 py-2 focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2"
```

#### Fix Shadow Inconsistency
```diff
- className="shadow-sm hover:shadow-md"
+ className="shadow-card hover:shadow-card-hover"
```

#### Add Loading State
```tsx
{isLoading ? (
  <>
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Loading...</span>
  </>
) : (
  children
)}
```

---

## Subagent Review Protocol

### Review Categories

Spawn subagents to review component categories:

1. **Buttons & Actions** - Button, IconButton, DropdownMenu triggers
2. **Cards & Containers** - Card, Dialog, Tooltip, Popover
3. **Form Elements** - Input, Select, Checkbox, Radio, Switch
4. **Feedback** - Badge, Progress, Skeleton, LoadingSpinner, Toast
5. **Layout** - Flex, Typography, Avatar, EmptyState

### Review Prompt Template

```
Review all [CATEGORY] components in Storybook.

For each component:
1. Check all variants render correctly
2. Check all states work (hover, focus, disabled, loading)
3. Verify dark/light theme consistency
4. Check token usage (no hardcoded colors)
5. Verify accessibility (focus rings, aria labels)

Score each component 0-100%.
List specific issues for any score below 100%.
Calculate overall category score.
```

### Acceptance Criteria

| Category | Required Score |
|----------|---------------|
| Buttons & Actions | 100% |
| Cards & Containers | 100% |
| Form Elements | 100% |
| Feedback | 100% |
| Layout | 100% |

**Note**: Components are foundation. No compromises on quality.

---

## Completion Gate

Before advancing to Phase 2:

- [ ] Storybook running with all components
- [ ] All stories cover all variants and states
- [ ] All subagent reviews at 100%
- [ ] 0 hardcoded colors in UI components
- [ ] All components work in dark and light mode
- [ ] `pnpm fixme` passes

---

## Related Files

### Component Source
- `src/components/ui/*.tsx` - All UI primitives

### Component Specs
- `docs/design/specs/components/button.md`
- `docs/design/specs/components/card.md`
- `docs/design/specs/components/input.md`
- `docs/design/specs/components/dialog.md`
- (etc.)

### Token Reference
- `src/index.css` - `@theme` block
- `docs/COLORS.md`

---

*Phase 1 must achieve 100% before proceeding to Phase 2.*
