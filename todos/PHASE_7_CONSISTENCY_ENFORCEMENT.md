# Phase 7: Zero Raw Tailwind

> **Status:** 🚧 In Progress
> **Goal:** All styling lives in CVA components. No raw Tailwind in app code.
> **Last Updated:** 2026-02-17
> **Progress:** 0/1145 classNames migrated (0%)

---

## How This Works (Cron-Friendly)

This doc is designed for automated recursive runs via cron.

### Per-Run Protocol

```
1. READ this doc first
2. CHECK current stage (Foundation vs Migration)
3. IF Foundation incomplete → work on foundation tasks
4. IF Foundation complete → pick next unmigrated file from 7.6
5. MIGRATE 1-2 files max per run (stay focused)
6. UPDATE progress in this doc
7. COMMIT with message: "refactor(ui): migrate {filename} to CVA components"
8. STOP - let next cron run continue
```

### Rules (NO EXCEPTIONS)

1. **Never skip Foundation** - Components must exist before migration
2. **Never migrate multiple files** - 1-2 files per run max
3. **Never leave broken state** - If stuck, revert and document blocker
4. **Always update progress** - Mark files as ✅ when done
5. **Always commit** - Each run = 1 commit

---

## Current Stage

**[x] Stage 1: Foundation** ✅ COMPLETE
**[ ] Stage 2: Migration** ← START HERE

---

## Stage 1: Foundation (Do First, No Cron)

Complete ALL of these before ANY migration. Check off as done.

### 1.1 Extend Card.tsx

**File:** `src/components/ui/Card.tsx`

**Current:** Basic Card with no variants

**Target:**
```tsx
const cardVariants = cva(
  "rounded-container border transition-default",
  {
    variants: {
      variant: {
        default: "bg-ui-bg border-ui-border",
        elevated: "bg-ui-bg border-transparent shadow-card",
        soft: "bg-ui-bg-soft border-transparent",
        interactive: "bg-ui-bg border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary cursor-pointer",
        outline: "bg-transparent border-ui-border",
        ghost: "bg-transparent border-transparent",
      },
      padding: {
        none: "",
        xs: "p-2",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded",
        md: "rounded-lg",
        lg: "rounded-container",
        full: "rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      radius: "lg",
    },
  }
);
```

**Status:** [ ] Not started

---

### 1.2 Create Stack Component

**File:** `src/components/ui/Stack.tsx`

**Purpose:** Vertical flex with gap. Replaces `<div className="space-y-*">` and `<Flex direction="column">`.

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

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

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap, align, ...props }, ref) => (
    <div ref={ref} className={cn(stackVariants({ gap, align }), className)} {...props} />
  )
);
Stack.displayName = "Stack";
```

**Status:** [ ] Not started

---

### 1.3 Create Section Component

**File:** `src/components/ui/Section.tsx`

**Purpose:** Content section with optional title. Replaces `<div className="space-y-4">` with heading.

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "./Typography";

const sectionVariants = cva("", {
  variants: {
    gap: {
      sm: "space-y-2",
      md: "space-y-4",
      lg: "space-y-6",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
  },
  defaultVariants: {
    gap: "md",
    padding: "none",
  },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  title?: string;
  description?: string;
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, gap, padding, title, description, children, ...props }, ref) => (
    <section ref={ref} className={cn(sectionVariants({ gap, padding }), className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <Typography variant="h4">{title}</Typography>}
          {description && <Typography variant="muted">{description}</Typography>}
        </div>
      )}
      {children}
    </section>
  )
);
Section.displayName = "Section";
```

**Status:** [ ] Not started

---

### 1.4 Create FormLayout Components

**File:** `src/components/ui/FormLayout.tsx`

**Purpose:** Form structure components. Replaces raw divs in forms.

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

// Vertical form container with consistent gap
export const FormLayout = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
));
FormLayout.displayName = "FormLayout";

// Horizontal row for side-by-side fields
export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 2 | 3 | 4;
}

export const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, cols = 2, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid gap-4",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
      {...props}
    />
  )
);
FormRow.displayName = "FormRow";

// Right-aligned action buttons
export const FormActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex justify-end gap-2 pt-4", className)} {...props} />
));
FormActions.displayName = "FormActions";

// Grouped section within a form
export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <p className="text-sm font-medium text-ui-text">{title}</p>}
          {description && <p className="text-sm text-ui-text-tertiary">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
);
FormSection.displayName = "FormSection";
```

**Status:** [ ] Not started

---

### 1.5 Create PageHeader Component

**File:** `src/components/ui/PageHeader.tsx`

**Purpose:** Consistent page headers with title, description, actions.

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "./Typography";
import { Flex } from "./Flex";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, ...props }, ref) => (
    <Flex
      ref={ref}
      justify="between"
      align="start"
      gap="md"
      className={cn("mb-6", className)}
      {...props}
    >
      <div className="space-y-1">
        <Typography variant="h2">{title}</Typography>
        {description && <Typography variant="muted">{description}</Typography>}
      </div>
      {actions && <Flex gap="sm" align="center" className="shrink-0">{actions}</Flex>}
    </Flex>
  )
);
PageHeader.displayName = "PageHeader";
```

**Status:** [ ] Not started

---

### 1.6 Extend Separator with Spacing

**File:** `src/components/ui/Separator.tsx`

**Add spacing prop:**
```tsx
// Add to existing Separator
spacing: {
  none: "",
  sm: "my-2",
  md: "my-4",
  lg: "my-6",
}
```

**Status:** [ ] Not started

---

### 1.7 Create Validator

**File:** `scripts/validate/check-raw-tailwind.js`

```js
/**
 * CHECK: Raw Tailwind
 * Flags raw Tailwind classes outside allowed directories
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC = path.join(ROOT, "src/components");

  // Directories where raw Tailwind is allowed
  const ALLOWED = [
    "src/components/ui/",
    "src/components/Landing/",
    "src/components/Kanban/",
    "src/components/Calendar/",
    "src/components/Auth/",
    ".stories.tsx",
    ".test.tsx",
  ];

  // Patterns that should use CVA components instead
  const RAW_PATTERNS = [
    { pattern: /\bflex\b/, replacement: "<Flex>" },
    { pattern: /\binline-flex\b/, replacement: "<Flex inline>" },
    { pattern: /\bgrid\b/, replacement: "<Grid>" },
    { pattern: /\bgap-\d+/, replacement: "<Flex gap='...'>" },
    { pattern: /\bp-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bpx-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bpy-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bspace-y-\d+/, replacement: "<Stack gap='...'>" },
    { pattern: /\bspace-x-\d+/, replacement: "<Flex gap='...'>" },
    { pattern: /\brounded-(?!none|full)/, replacement: "<Card>" },
    { pattern: /\btext-(?:xs|sm|base|lg|xl|\d)/, replacement: "<Typography>" },
    { pattern: /\bfont-(?:thin|light|normal|medium|semibold|bold)/, replacement: "<Typography>" },
  ];

  let violations = [];

  function isAllowed(filePath) {
    const rel = relPath(filePath);
    return ALLOWED.some(pattern => rel.includes(pattern));
  }

  function checkFile(filePath) {
    if (isAllowed(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const rel = relPath(filePath);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("className")) continue;

      for (const { pattern, replacement } of RAW_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: rel,
            line: i + 1,
            pattern: pattern.toString(),
            replacement,
            snippet: line.trim().slice(0, 80),
          });
          break; // One violation per line is enough
        }
      }
    }
  }

  const files = walkDir(SRC, { extensions: new Set([".tsx"]) });
  for (const f of files) checkFile(f);

  const messages = [];
  if (violations.length > 0) {
    // Group by file
    const byFile = {};
    for (const v of violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})`);
      for (const item of items.slice(0, 3)) { // Show max 3 per file
        messages.push(`    ${c.dim}L${item.line}${c.reset} → use ${item.replacement}`);
      }
      if (items.length > 3) {
        messages.push(`    ${c.dim}... and ${items.length - 3} more${c.reset}`);
      }
    }
  }

  return {
    passed: violations.length === 0,
    errors: violations.length,
    detail: violations.length > 0
      ? `${violations.length} raw Tailwind violation(s)`
      : null,
    messages,
  };
}
```

**Status:** [ ] Not started

---

### 1.8 Register Validator

**File:** `scripts/validate.js`

Add to imports and checks array:
```js
import { run as checkRawTailwind } from "./validate/check-raw-tailwind.js";

// In checks array:
{ name: "Raw Tailwind", run: checkRawTailwind },
```

**Status:** [ ] Not started

---

### 1.9 Export New Components

**File:** `src/components/ui/index.ts` (if exists) or individual exports

Ensure all new components are exported.

**Status:** [ ] Not started

---

### Foundation Checklist

- [x] 1.1 Card.tsx extended with variants/padding/radius
- [x] 1.2 Stack.tsx created
- [x] 1.3 Section.tsx created
- [x] 1.4 FormLayout.tsx created (FormLayout, FormRow, FormActions, FormSection)
- [x] 1.5 PageHeader.tsx created
- [x] 1.6 Separator.tsx extended with spacing
- [x] 1.7 check-raw-tailwind.js created
- [x] 1.8 Validator registered in validate.js
- [x] 1.9 Components exported (direct imports, no index needed)

**Foundation Status:** [x] COMPLETE - Ready for Stage 2

---

## Stage 2: Migration (Cron Runs)

**✅ Foundation complete - ready to start migration**

### Migration Protocol (Each Cron Run)

```
1. Run validator: node scripts/validate.js
2. Pick FIRST file with violations from list below
3. Open file, identify all raw Tailwind
4. Replace with CVA components:
   - flex/inline-flex → <Flex>
   - grid → <Grid>
   - gap-* → <Flex gap="..."> or <Stack gap="...">
   - p-*/px-*/py-* → <Card padding="...">
   - space-y-* → <Stack gap="...">
   - rounded-* → <Card> (implicit)
   - text-sm/font-medium → <Typography variant="...">
5. Test: pnpm typecheck
6. Mark file as ✅ below
7. Commit: git commit -m "refactor(ui): migrate {filename} to CVA components"
8. STOP
```

### File Migration Tracker

**Priority 1: High-Traffic (do first)**

| File | Violations | Status |
|------|------------|--------|
| `Dashboard.tsx` | ~20 | ⬜ |
| `AppSidebar.tsx` | ~30 | ⬜ |
| `AppHeader.tsx` | ~15 | ⬜ |
| `IssueDetailModal.tsx` | ~25 | ⬜ |
| `CreateIssueModal.tsx` | ~20 | ⬜ |
| `NotificationCenter.tsx` | ~15 | ⬜ |
| `GlobalSearch.tsx` | ~10 | ⬜ |
| `CommandPalette.tsx` | ~10 | ⬜ |

**Priority 2: Feature Components**

| File | Violations | Status |
|------|------------|--------|
| `AnalyticsDashboard.tsx` | ~20 | ⬜ |
| `SprintManager.tsx` | ~15 | ⬜ |
| `ActivityFeed.tsx` | ~10 | ⬜ |
| `FilterBar.tsx` | ~10 | ⬜ |
| `BulkOperationsBar.tsx` | ~8 | ⬜ |
| `DocumentHeader.tsx` | ~8 | ⬜ |
| `IssueCard.tsx` | ~10 | ⬜ |
| `ProjectsList.tsx` | ~8 | ⬜ |

**Priority 3: Settings & Forms**

| File | Violations | Status |
|------|------------|--------|
| `Settings/ProfileContent.tsx` | ~15 | ⬜ |
| `Settings/NotificationsTab.tsx` | ~12 | ⬜ |
| `Settings/SecurityTab.tsx` | ~12 | ⬜ |
| `Settings/PreferencesTab.tsx` | ~10 | ⬜ |
| `Settings/ApiKeysManager.tsx` | ~10 | ⬜ |
| `Settings/WebhooksManager.tsx` | ~10 | ⬜ |
| `Settings/SSOSettings.tsx` | ~15 | ⬜ |
| `Settings/TwoFactorSettings.tsx` | ~12 | ⬜ |

**Priority 4: Remaining (auto-populated by validator)**

Run `node scripts/validate.js` to see remaining files.

---

## Troubleshooting

### "Component doesn't exist yet"

→ Go back to Foundation, component isn't built yet.

### "Can't figure out which component to use"

| Raw Pattern | Use This |
|-------------|----------|
| `<div className="flex ...">` | `<Flex>` |
| `<div className="flex flex-col ...">` | `<Stack>` or `<Flex direction="column">` |
| `<div className="grid ...">` | `<Grid>` |
| `<div className="space-y-4">` | `<Stack gap="md">` |
| `<div className="p-4 rounded-lg bg-ui-bg border">` | `<Card padding="md">` |
| `<div className="p-6 rounded-lg shadow">` | `<Card variant="elevated" padding="lg">` |
| `<span className="text-sm text-ui-text-secondary">` | `<Typography variant="small" color="secondary">` |
| `<p className="text-xs text-ui-text-tertiary">` | `<Typography variant="meta">` |
| Page title + actions row | `<PageHeader title="..." actions={...}>` |
| Form with vertical fields | `<FormLayout>...<FormActions>` |
| Side-by-side form fields | `<FormRow cols={2}>` |

### "This pattern doesn't fit any component"

1. Check if it's a one-off → maybe it's fine as-is
2. Check if it's repeated → might need new CVA variant
3. Document in "Blockers" section below and SKIP the file

### "Tests are failing"

1. `pnpm typecheck` - fix type errors first
2. `pnpm test:run` - run tests
3. If component tests fail, update test to use new component API

---

## Blockers

Document any files that can't be migrated and why:

| File | Blocker | Resolution |
|------|---------|------------|
| (none yet) | | |

---

## Stats

**Last Run:** 2026-02-17
**Files Migrated:** 0 / ~40
**Violations Remaining:** 1145 (run validator to update)

---

## Commands

```bash
# Check current violations
node scripts/validate.js

# Typecheck after changes
pnpm typecheck

# Full check before commit
pnpm run check

# Commit migration
git add . && git commit -m "refactor(ui): migrate {filename} to CVA components"
```

---

*Zero raw Tailwind = zero AI slop. One file at a time.*
