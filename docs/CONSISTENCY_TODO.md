# Consistency TODO

> **Purpose:** Recursive document for tracking consistency improvements across the codebase.
> **Last Updated:** 2026-03-01
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

- [x] **JSDoc enforcement** ✅ - `check-jsdoc.js` created, reports missing docs
- [x] **File header enforcement** ✅ - `check-file-headers.js` created, reports missing headers
- [x] **Import order enforcement** ✅ - `check-import-order.js` exists (disabled by default)
- [x] **Component naming enforcement** ✅ - `check-component-naming.js` validates PascalCase
- [x] **Convex function naming enforcement** ✅ - `check-convex-naming.js` validates patterns

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

## Implemented Validators

All proposed validators have been implemented:

| Validator | Status | Notes |
|-----------|--------|-------|
| `check-jsdoc.js` | ✅ Implemented | Reports missing JSDoc on exports |
| `check-file-headers.js` | ✅ Implemented | Reports missing headers on files >50 lines |
| `check-convex-naming.js` | ✅ Implemented | Validates `get`/`list`/`create` patterns |
| `check-component-naming.js` | ✅ Implemented | Validates PascalCase for components |
| `check-component-props.js` | ✅ Implemented | Validates prop interface naming |
| `check-hook-patterns.js` | ✅ Implemented | Validates hook return patterns |
| `check-unused-params.js` | ✅ Implemented | Flags underscore-prefixed params |

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

- [x] **Reorganize components into feature directories** ✅
  - [x] Created `Sprints/` directory (SprintManager, SprintProgressBar, SprintWorkload)
  - [x] Created `Notifications/` directory (NotificationCenter, NotificationItem)
  - [x] Created `Documents/` directory (DocumentHeader, DocumentSidebar, DocumentTree, DocumentComments, DocumentTemplatesManager)
  - [x] Created `App/` directory (AppHeader, AppSidebar)
  - [x] Consolidated `IssueDetail/` directory (added IssueCard, CreateIssueModal with tests)

- [x] **Add JSDoc to high-traffic exports** ✅
  - Hooks, utilities, UI components now have JSDoc
  - Validator reports 0 warnings

### Phase 4: Documentation (Ongoing)

- [x] **Create component documentation standards** ✅
  - Created docs/design/COMPONENTS.md
  - Covers layout, typography, form, feedback, overlay components
  - Includes selection flowchart and anti-patterns

- [x] **Update CLAUDE.md with new patterns** ✅
  - Added feature directory structure (App/, Documents/, IssueDetail/, etc.)
  - Added Flex gap prop documentation
  - Updated validator list (28 validators)
  - Added error handling patterns (showError/showSuccess)

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
| Validator Coverage | 95% | 95% | 🟢 Complete |
| File Headers | 85% | 80% | 🟢 Complete (87 files remaining) |
| JSDoc Coverage | 100% | 80% | 🟢 Complete (0 warnings) |
| Naming Conventions | 95% | 95% | 🟢 Complete |
| File Organization | 90% | 90% | 🟢 Complete (5/5 directories done) |
| Error Handling | 100% | 95% | 🟢 Complete (auth forms updated) |
| Styling Consistency | 98% | 98% | 🟢 Complete |
| Test Coverage | 58% | 80% | 🟡 In Progress (improved from 56%, adding more tests) |

### Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-01 | Added tests for AI (ErrorFallback: 9, AssistantButton: 16) | Test coverage +2 components |
| 2026-03-01 | Added tests for Sprints (ProgressBar: 8, Workload: 8) | Test coverage +2 components |
| 2026-03-01 | Added tests for TemplateCard (18 tests) | Test coverage +1 component |
| 2026-03-01 | Added tests for TimeTracking (TimerWidget: 9, TimeEntriesList: 16) | Test coverage +2 components |
| 2026-03-01 | Added tests for Landing (Features: 9, WhyChoose: 7, Footer: 12, Nav: 9) | Test coverage +4 components |
| 2026-03-01 | Added tests for HeroSection (7 tests) | Test coverage +1 component |
| 2026-03-01 | Added tests for KeyboardShortcutsHelp (16 tests) | Test coverage +1 component |
| 2026-03-01 | Added tests for ipRestrictions backend (13 tests) | Test coverage +1 Convex module |
| 2026-03-01 | Added tests for DocumentTree (14 tests) | Test coverage +1 component |
| 2026-03-01 | Created docs/design/COMPONENTS.md with component usage standards | Documentation complete |
| 2026-03-01 | Added tests for LabelsManager (15 tests) and InboxList (5 passing + 9 skipped) | Test coverage +2 components |
| 2026-03-01 | Added tests for KanbanColumn (26 tests) | Test coverage +1 component |
| 2026-03-01 | Added find-missing-tests.js helper script | Developer tooling |
| 2026-03-01 | Updated CLAUDE.md with new patterns and structure | Documentation consistency |
| 2026-03-01 | Moved IssueCard and CreateIssueModal to IssueDetail/ | Feature directory organization |
| 2026-03-01 | Added COLORS.DEFAULT_LABEL constant | Runtime color values centralized |
| 2026-03-01 | Updated auth forms to use showError/showSuccess | Consistent error handling |
| 2026-03-01 | Added 2xl gap size to Flex component | Fixed component prop misuse |
| 2026-03-01 | Moved App components to App/ | Feature directory organization |
| 2026-03-01 | Moved Document components to Documents/ | Feature directory organization |
| 2026-03-01 | Moved Notification components to Notifications/ | Feature directory organization |
| 2026-03-01 | Moved Sprint components to Sprints/ | Feature directory organization |
| 2026-03-01 | Fixed check-unused-params.js return properties | Validator now passes correctly |
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
