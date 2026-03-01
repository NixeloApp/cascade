# Consistency TODO

> **Purpose:** Recursive document for tracking consistency improvements across the codebase.
> **Last Updated:** 2026-02-28
> **Owner:** Engineering Team

---

## Table of Contents

1. [Current Validator Inventory](#current-validator-inventory)
2. [Identified Inconsistencies](#identified-inconsistencies)
3. [Proposed New Validators](#proposed-new-validators)
4. [Action Items](#action-items)
5. [Standards & Templates](#standards--templates)
6. [Progress Tracking](#progress-tracking)

---

## Current Validator Inventory

| Script | Strictness | Purpose | Allowlist Size |
|--------|------------|---------|----------------|
| `check-standards.js` | STRICT | AST-based: raw HTML tags, className concat, raw spans | ~15 patterns |
| `check-colors.js` | STRICT | Hardcoded colors (hex/rgb), non-semantic tokens | 0 (no exceptions) |
| `check-api-calls.js` | STRICT | Validates `api.X.Y` calls match Convex exports | N/A |
| `check-emoji.js` | STRICT | Emoji usage outside allowed contexts | ~5 files |
| `check-arbitrary-tw.js` | STRICT | Bracket syntax `w-[Npx]`, `max-h-[Xvh]` | ~20 patterns |
| `check-raw-tailwind.js` | STRICT | Raw Tailwind outside ui/ components | ~40 files/dirs |
| `check-convex-patterns.js` | STRICT | Envelope pattern, RBAC checks, membership validation | N/A |
| `check-test-ids.js` | STRICT | `data-testid` must use `TEST_IDS` constants | N/A |
| `check-ui-patterns.js` | STRICT | Button aria-labels, Form labels, link accessibility | N/A |
| `check-type-safety.js` | STRICT | `as any`, `@ts-ignore`, `biome-ignore` usage | ~40 files |
| `check-queries.js` | MEDIUM | N+1 queries, unbounded `.collect()`, missing indexes | Reports only |
| `check-tailwind-consistency.js` | MEDIUM | Transition/duration consistency, focus-ring patterns | Warnings only |
| `check-interactive-tw.js` | MEDIUM | Interactive variants outside ui/ | ~230 allowlist |
| `check-undefined-tw.js` | MEDIUM | Classes referencing undefined theme colors | Reports only |
| `check-e2e-quality.js` | MEDIUM | Deprecated Playwright patterns, raw selectors | N/A |
| `check-types.js` | INFO | Type consistency patterns | Reports only |

### Validator Gaps

- [ ] **No JSDoc enforcement** - Many exported functions lack documentation
- [ ] **No file header enforcement** - Inconsistent module-level documentation
- [ ] **No import order enforcement** - Relies on Biome (not explicit validation)
- [ ] **No component naming enforcement** - PascalCase not validated
- [ ] **No Convex function naming enforcement** - `list`/`get`/`create` patterns not enforced

---

## Identified Inconsistencies

### 1. File Organization

#### Issue: Duplicate Directory Names
```
src/components/
├── IssueDetail/           # Contains IssueMetadataSection, InlinePropertyEdit
└── IssueDetailView/       # Contains IssueDetailContent, IssueDetailSidebar, useIssueDetail
```

**Problem:** Two directories for the same domain, unclear separation.

**Solution:** Consolidate into single `IssueDetail/` with subdirectories:
```
src/components/IssueDetail/
├── components/            # UI components
├── hooks/                 # useIssueDetail, etc.
└── index.ts              # Public exports
```

#### Issue: Root-Level Component Sprawl
```
src/components/
├── AppHeader.tsx
├── AppSidebar.tsx
├── BulkOperationsBar.tsx
├── CreateIssueModal.tsx
├── DocumentHeader.tsx
├── DocumentSidebar.tsx    # NEW
├── FilterBar.tsx
├── GlobalSearch.tsx
├── IssueCard.tsx
├── NotificationCenter.tsx
├── SprintManager.tsx
├── ... (~60 more files)
```

**Problem:** Flat structure makes it hard to find related components.

**Solution:** Organize by feature:
```
src/components/
├── App/                   # AppHeader, AppSidebar
├── Documents/             # DocumentHeader, DocumentSidebar, DocumentTree
├── Issues/                # IssueCard, CreateIssueModal, IssueDetail/
├── Notifications/         # NotificationCenter, NotificationItem
├── Sprints/              # SprintManager, SprintProgressBar, SprintWorkload
└── ui/                   # Primitives (unchanged)
```

---

### 2. Documentation Patterns

#### Issue: Inconsistent File Headers

**Files WITH headers (~10%):**
```typescript
// src/components/PlateEditor.tsx
/**
 * Plate Editor Component
 *
 * Rich text editor built on Plate.js (Slate-based).
 * Replaces the old BlockNote editor with:
 * - Better React 19 compatibility
 * - AI plugin support
 * - shadcn/ui native styling
 * - Y.js collaboration support
 */
```

**Files WITHOUT headers (~90%):**
```typescript
// src/components/FilterBar.tsx
import { api } from "@convex/_generated/api";
// ... straight into imports
```

**Solution:** Require file headers for all non-trivial files (>50 lines).

#### Issue: Inconsistent JSDoc on Exports

**Good example:**
```typescript
/**
 * Serialize editor value to JSON string for storage
 */
export function serializeValue(value: Value): string {
```

**Missing JSDoc (~60% of exports):**
```typescript
export function useIssueDetail(issueId: Id<"issues">) {
```

**Solution:** Require JSDoc for all exported functions/components.

---

### 3. Naming Conventions

#### Issue: Convex Function Names

**Current patterns (inconsistent):**
```typescript
// Pattern 1: Verb + noun
export const getProject = authenticatedQuery({ ... });
export const createProject = authenticatedMutation({ ... });

// Pattern 2: Just noun (implied get)
export const list = authenticatedQuery({ ... });

// Pattern 3: Verb only
export const update = authenticatedMutation({ ... });

// Pattern 4: Mixed
export const togglePublic = authenticatedMutation({ ... });  // verb+adjective
export const archiveDocument = authenticatedMutation({ ... }); // verb+noun
```

**Proposed standard:**
| Operation | Pattern | Example |
|-----------|---------|---------|
| Get single | `get{Entity}` | `getProject`, `getUser` |
| Get multiple | `list{Entities}` | `listProjects`, `listUsers` |
| Create | `create{Entity}` | `createProject` |
| Update | `update{Entity}` | `updateProject` |
| Delete | `delete{Entity}` or `archive{Entity}` | `deleteProject` |
| Toggle | `toggle{Property}` | `togglePublic`, `toggleArchive` |
| Action | `{verb}{Entity}` | `assignIssue`, `moveDocument` |

---

### 4. Component Patterns

#### Issue: Inconsistent Loading States

**Pattern A - Inline check:**
```typescript
if (data === undefined) {
  return <Skeleton />;
}
```

**Pattern B - Separate component:**
```typescript
if (loading) {
  return <ComponentNameSkeleton />;
}
```

**Pattern C - Suspense boundary:**
```typescript
<Suspense fallback={<Skeleton />}>
  <Component />
</Suspense>
```

**Solution:** Standardize on Pattern A for simple cases, Pattern C for complex async boundaries.

#### Issue: Error Handling Patterns

**Pattern A - showError helper:**
```typescript
} catch (error) {
  showError(error, "Failed to update");
}
```

**Pattern B - Manual toast:**
```typescript
} catch (error) {
  toast.error("Failed to update");
  console.error(error);
}
```

**Pattern C - ErrorBoundary:**
```typescript
<ErrorBoundary fallback={<ErrorUI />}>
  <Component />
</ErrorBoundary>
```

**Solution:**
- Use `showError()` for mutations (current standard)
- Use `ErrorBoundary` for component-level errors
- Never use manual toast.error

---

### 5. Styling Patterns

#### Issue: Inconsistent Spacing Props vs Classes

**Using prop:**
```typescript
<Stack gap="md">
<Flex gap="sm">
<Card padding="lg">
```

**Using className (sometimes):**
```typescript
<Flex className="gap-4">  // Should use gap="md"
<Card className="p-6">    // Should use padding="lg"
```

**Solution:** Always use component props when available; validator already catches most cases.

#### Issue: Transition Inconsistencies

**Current:**
```typescript
"transition-colors duration-default"
"transition-all duration-150"
"transition duration-200"
```

**Standard:**
```typescript
"transition-default"  // Single token for all standard transitions
```

---

### 6. Testing Patterns

#### Issue: Inconsistent Test Organization

**Pattern A - Flat:**
```
src/components/Button.test.tsx
src/components/Card.test.tsx
```

**Pattern B - Colocated:**
```
src/components/ui/Button/
├── Button.tsx
├── Button.test.tsx
└── index.ts
```

**Current state:** Mix of both. Tests are colocated with component file but not in subdirectories.

**Solution:** Keep current pattern (colocated, flat) - it works and is consistent.

#### Issue: Test File Naming

**Patterns found:**
```
*.test.tsx      # Standard
*.jules.test.ts # AI-generated tests
*.spec.tsx      # Rare
```

**Solution:** Standardize on `*.test.tsx`. The `.jules.test.ts` pattern is for AI-audited tests and is intentional.

---

## Proposed New Validators

### 1. `check-jsdoc.js` (NEW)

**Purpose:** Enforce JSDoc on exported functions and components.

```javascript
// Proposed rules:
const RULES = [
  // Exported functions must have JSDoc
  { pattern: /^export (async )?function \w+/, requireJSDoc: true },
  // Exported components must have JSDoc
  { pattern: /^export function [A-Z]\w+\(/, requireJSDoc: true },
  // Exported constants can skip JSDoc if name is self-documenting
  { pattern: /^export const [A-Z_]+/, requireJSDoc: false },
];

// Ignore patterns:
const IGNORE = [
  /\.test\.tsx?$/,
  /\.stories\.tsx?$/,
  /index\.ts$/,
  /routeTree\.gen\.ts$/,
];
```

### 2. `check-file-headers.js` (NEW)

**Purpose:** Require file headers for non-trivial files.

```javascript
// Proposed rules:
const MIN_LINES_FOR_HEADER = 50;  // Files > 50 lines need headers

const HEADER_PATTERN = /^\/\*\*[\s\S]*?\*\//;  // Must start with /** ... */

// Required sections:
const REQUIRED_SECTIONS = [
  // None required, just presence of header
];

// Ignore patterns:
const IGNORE = [
  /index\.ts$/,
  /\.test\.tsx?$/,
  /\.d\.ts$/,
  /routeTree\.gen\.ts$/,
];
```

### 3. `check-convex-naming.js` (NEW)

**Purpose:** Enforce consistent Convex function naming.

```javascript
// Proposed rules:
const PATTERNS = {
  query: {
    single: /^get[A-Z]/,      // getProject, getUser
    multiple: /^list[A-Z]/,   // listProjects, listUsers
    search: /^search[A-Z]/,   // searchUsers
  },
  mutation: {
    create: /^create[A-Z]/,   // createProject
    update: /^update[A-Z]/,   // updateProject
    delete: /^(delete|archive|remove)[A-Z]/,
    toggle: /^toggle[A-Z]/,   // togglePublic
  },
};

// Allowed exceptions:
const ALLOWED = [
  "list",  // Generic list (deprecated, but still used)
  "get",   // Generic get (deprecated)
];
```

### 4. `check-component-structure.js` (NEW)

**Purpose:** Enforce component file structure.

```javascript
// Proposed rules:
const RULES = [
  // Props interface must be named {ComponentName}Props
  { component: /function (\w+)/, propsInterface: /interface $1Props/ },

  // Components must use named exports (not default)
  { forbidden: /export default/ },

  // Hook files must start with "use"
  { hookFile: /use[A-Z]\w+\.tsx?$/, mustExport: /export function use/ },
];
```

---

## Action Items

### Phase 1: Quick Wins (This Week)

- [x] **Consolidate IssueDetail directories** ✅
  - Merged `IssueDetailView/` into `IssueDetail/`
  - Updated all imports (3 files)
  - Removed from validator allowlist

- [ ] **Add file headers to new files**
  - Start requiring headers for new files in PR reviews
  - Create header template (see Standards section)
  - ~10 minutes setup

- [x] **Document validator strictness levels** ✅
  - Added `@strictness` tag to all 16 validators
  - STRICT (11), MEDIUM (4), INFO (1)
  - Each tag explains CI blocking behavior

### Phase 2: Validator Updates (Next Week)

- [x] **Create `check-jsdoc.js`** ✅
  - Reports missing JSDoc on exported functions/components
  - Found 171 missing docs, warns but doesn't block CI
  - Added to validate.js as check #16

- [x] **Create `check-file-headers.js`** ✅
  - Reports missing headers on files >50 lines
  - Found 319 files missing headers, warns but doesn't block CI
  - Added to validate.js as check #17

- [x] **Update `check-raw-tailwind.js`** ✅
  - Added detection for spacing props vs classes on Flex/Stack components
  - Detects gap-N and space-x/y-N in className when gap prop should be used
  - Skips responsive variants (sm:gap-4) and decimal values (gap-0.5)
  - Fixed KanbanColumn to use gap="sm" prop

### Phase 3: File Reorganization (Next Sprint)

- [ ] **Reorganize components into feature directories**
  - Create migration plan
  - Update imports via codemod
  - Verify no broken imports
  - ~4 hours

- [ ] **Add JSDoc to high-traffic exports**
  - Focus on hooks, utilities, UI components
  - ~3 hours

### Phase 4: Documentation (Ongoing)

- [ ] **Create component documentation standards**
  - When to use each component
  - Common patterns
  - Anti-patterns

- [ ] **Update CLAUDE.md with new patterns**
  - Add validator descriptions
  - Add naming conventions
  - Add file structure guidelines

---

## Standards & Templates

### File Header Template

```typescript
/**
 * [Component/Module Name]
 *
 * [Brief description of what this file does - 1-2 sentences]
 *
 * Features:
 * - [Feature 1]
 * - [Feature 2]
 * - [Feature 3]
 *
 * @example
 * ```tsx
 * <ComponentName prop="value" />
 * ```
 */
```

### JSDoc Template for Functions

```typescript
/**
 * [Brief description - what does this function do?]
 *
 * @param paramName - [Description of parameter]
 * @returns [Description of return value]
 *
 * @example
 * ```ts
 * const result = functionName(arg);
 * ```
 */
export function functionName(paramName: Type): ReturnType {
```

### JSDoc Template for Components

```typescript
/**
 * [Brief description - what does this component render?]
 *
 * @example
 * ```tsx
 * <ComponentName
 *   requiredProp="value"
 *   optionalProp={true}
 * />
 * ```
 */
export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
```

### Convex Function Naming

| Operation | Pattern | Example |
|-----------|---------|---------|
| Get single item | `get{Entity}` | `getProject`, `getUser`, `getDocument` |
| List items | `list{Entities}` | `listProjects`, `listUsers` |
| Search items | `search{Entities}` | `searchUsers`, `searchIssues` |
| Create item | `create{Entity}` | `createProject`, `createIssue` |
| Update item | `update{Entity}` | `updateProject`, `updateIssue` |
| Delete item | `delete{Entity}` | `deleteProject` (hard delete) |
| Archive item | `archive{Entity}` | `archiveDocument` (soft delete) |
| Toggle property | `toggle{Property}` | `togglePublic`, `toggleFavorite` |
| Specific action | `{verb}{Entity}` | `assignIssue`, `moveDocument`, `lockDocument` |

---

## Progress Tracking

### Consistency Score

| Category | Current | Target | Status |
|----------|---------|--------|--------|
| Validator Coverage | 90% | 95% | 🟡 In Progress |
| File Headers | 10% | 80% | 🔴 Not Started |
| JSDoc Coverage | 40% | 80% | 🔴 Not Started |
| Naming Conventions | 80% | 95% | 🟡 In Progress |
| File Organization | 65% | 90% | 🟡 In Progress |
| Error Handling | 90% | 95% | 🟢 Good |
| Styling Consistency | 95% | 98% | 🟢 Good |

### Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-01 | Added Convex hook allowlist to check-hook-patterns.js | Reduced false positives |
| 2026-03-01 | Fixed useAIChat toast.error → showError | Better error handling |
| 2026-03-01 | Updated check-raw-tailwind.js with prop detection | Detects component prop misuse |
| 2026-03-01 | Fixed KanbanColumn space-x-2 → gap="sm" | Consistent component prop usage |
| 2026-02-28 | Created consistency TODO | Baseline established |
| 2026-02-28 | Added DocumentSidebar | Following patterns |
| 2026-02-28 | Fixed PR review comments | Improved type safety |
| 2026-02-28 | Consolidated IssueDetail directories | Reduced component sprawl |
| 2026-02-28 | Added @strictness tags to validators | Documented CI blocking behavior |
| 2026-02-28 | Created check-jsdoc.js validator | 171 exports need docs |
| 2026-02-28 | Created check-file-headers.js validator | 319 files need headers |

---

## How to Use This Document

1. **Before starting new work:** Check relevant sections for current standards
2. **During code review:** Reference this for consistency checks
3. **When adding validators:** Update inventory section
4. **Monthly:** Review progress tracking and update scores

---

## Related Documents

- [CLAUDE.md](../CLAUDE.md) - Main project guide
- [RULES.md](../RULES.md) - Development rules
- [docs/design/PATTERNS.md](./design/PATTERNS.md) - UI patterns
- [docs/CONVEX_BEST_PRACTICES.md](./CONVEX_BEST_PRACTICES.md) - Backend patterns
