# Phase 7: Design Consistency Enforcement

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
2. CHECK current stage (Foundation vs Audit vs Migration)
3. IF Foundation incomplete → work on foundation tasks
4. IF Audit incomplete → run audit tasks
5. IF Migration ready → pick next unmigrated file
6. MIGRATE 1-2 files max per run (stay focused)
7. UPDATE progress in this doc
8. COMMIT with message: "refactor(ui): migrate {filename} to CVA components"
9. STOP - let next cron run continue
```

### Rules (NO EXCEPTIONS)

1. **Never skip stages** - Foundation → Audit → Migration (in order)
2. **Never migrate multiple files** - 1-2 files per run max
3. **Never leave broken state** - If stuck, revert and document blocker
4. **Always update progress** - Mark items as ✅ when done
5. **Always commit** - Each run = 1 commit
6. **Flag duplicates, don't merge** - Report conflicts, let human decide

---

## Current Stage

**[x] Stage 1: Foundation** ✅ COMPLETE
**[x] Stage 2: Component Audit** ✅ COMPLETE
**[ ] Stage 3: Migration** ← START HERE

---

## Stage 1: Foundation (COMPLETE)

All foundation components created:

- [x] Card.tsx - Extended with variant/padding/radius CVA props
- [x] Stack.tsx - Vertical flex with gap (replaces `space-y-*`)
- [x] Section.tsx - Content section with title/description
- [x] FormLayout.tsx - FormLayout, FormRow, FormActions, FormSection
- [x] Separator.tsx - Extended with spacing prop
- [x] check-raw-tailwind.js - Validator (soft check during migration)

**Note:** PageHeader was NOT created in ui/ - existing `layout/PageHeader` is superior (has breadcrumb support, already in production use).

---

## Stage 2: Component Audit

Before migrating, audit the component library for issues.

### 2.1 Duplicate Component Check

| Component | Location | Status | Action |
|-----------|----------|--------|--------|
| PageHeader | `layout/PageHeader.tsx` | Production ✅ | Keep - has breadcrumbs |
| PageHeader | `ui/PageHeader.tsx` | ~~Created~~ | **DELETED** - was duplicate |
| Flex | `ui/Flex.tsx` | Production ✅ | Keep |
| Stack | `ui/Stack.tsx` | New ✅ | Keep - convenience for flex-col |
| Grid | `ui/Grid.tsx` | Production ✅ | Keep |
| Section | `ui/Section.tsx` | New ✅ | Keep - differs from FormSection |
| FormLayout | `ui/FormLayout.tsx` | New ✅ | Keep - container-level |
| FormPrimitives | `ui/FormPrimitives.tsx` | Production ✅ | Keep - field-level |

**Status:** [x] Audit complete - duplicates resolved

---

### 2.2 Gap Size Consistency Check

All layout components should use the same gap scale:

| Component | Gap Options | Status |
|-----------|-------------|--------|
| Flex | none, xs, sm, md, lg, xl | ✅ |
| Stack | none, xs, sm, md, lg, xl | ✅ |
| Section | none, xs, sm, md, lg, xl | ✅ |
| Grid | none, xs, sm, md, lg, xl | ✅ |

**Status:** [x] All components use consistent gap scale

---

### 2.3 Import Pattern Check

Ensure no conflicting imports:

```bash
# Check for any imports of ui/PageHeader (should be 0)
grep -r "from.*ui/PageHeader" src/
```

**Status:** [x] Verified - ui/PageHeader deleted, no imports exist

---

### 2.4 Additional Validators to Consider

| Validator | Purpose | Priority | Status |
|-----------|---------|----------|--------|
| check-duplicate-components.js | Flag components with same name in different dirs | Medium | [ ] |
| check-component-props.js | Ensure consistent prop naming (gap vs spacing) | Low | [ ] |
| check-import-paths.js | Flag imports from wrong locations | Medium | [ ] |

**Note:** These are optional. The raw-tailwind validator is the main enforcement.

---

## Stage 3: Migration (Cron Runs)

**✅ Audit complete - ready for migration**

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
| `Dashboard.tsx` | ~3 | ✅ |
| `AppSidebar.tsx` | ~11 | ⬜ |
| `AppHeader.tsx` | ~7 | ⬜ |
| `IssueDetailModal.tsx` | ~3 | ⬜ |
| `CreateIssueModal.tsx` | ~3 | ⬜ |
| `NotificationCenter.tsx` | ~6 | ⬜ |
| `GlobalSearch.tsx` | ~13 | ⬜ |
| `CommandPalette.tsx` | ~1 | ⬜ |

**Priority 2: Feature Components**

| File | Violations | Status |
|------|------------|--------|
| `AnalyticsDashboard.tsx` | ~10 | ⬜ |
| `SprintManager.tsx` | ~19 | ⬜ |
| `ActivityFeed.tsx` | ~4 | ⬜ |
| `FilterBar.tsx` | ~11 | ⬜ |
| `BulkOperationsBar.tsx` | ~11 | ⬜ |
| `DocumentHeader.tsx` | ~8 | ⬜ |
| `IssueCard.tsx` | ~9 | ⬜ |
| `ProjectsList.tsx` | ~2 | ⬜ |

**Priority 3: Settings & Forms**

| File | Violations | Status |
|------|------------|--------|
| `Settings/ProfileContent.tsx` | ~16 | ⬜ |
| `Settings/NotificationsTab.tsx` | ~25 | ⬜ |
| `Settings/PreferencesTab.tsx` | ~13 | ⬜ |
| `Settings/ApiKeysManager.tsx` | ~46 | ⬜ |
| `Settings/SSOSettings.tsx` | ~7 | ⬜ |
| `Settings/TwoFactorSettings.tsx` | ~11 | ⬜ |

**Priority 4: Admin Components**

| File | Violations | Status |
|------|------------|--------|
| `Admin/UserManagement.tsx` | ~31 | ⬜ |
| `Admin/UserTypeManager.tsx` | ~28 | ⬜ |
| `Admin/HourComplianceDashboard.tsx` | ~15 | ⬜ |
| `Admin/IpRestrictionsSettings.tsx` | ~14 | ⬜ |
| `Admin/OrganizationSettings.tsx` | ~14 | ⬜ |

**Priority 5: Onboarding (complex - do last)**

| File | Violations | Status |
|------|------------|--------|
| `Onboarding/LeadOnboarding.tsx` | ~33 | ⬜ |
| `Onboarding/MemberOnboarding.tsx` | ~32 | ⬜ |
| `Onboarding/ProjectWizard.tsx` | ~29 | ⬜ |

**Priority 6: Remaining (auto-populated by validator)**

Run `node scripts/validate.js` to see full list (~100+ files).

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
| Page title + actions row | `layout/PageHeader` (NOT ui/PageHeader) |
| Form with vertical fields | `<FormLayout>...<FormActions>` |
| Side-by-side form fields | `<FormRow cols={2}>` |

### "This pattern doesn't fit any component"

1. Check if it's a one-off → maybe it's fine as-is
2. Check if it's repeated → might need new CVA variant
3. Document in "Blockers" section below and SKIP the file

### "Found a duplicate component"

1. **Don't merge** - just flag it in the audit section
2. Document which version is production vs new
3. Let human decide which to keep

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

## Deferred / Future Work

Items intentionally not in scope for Phase 7:

| Item | Reason | Track In |
|------|--------|----------|
| CVA for all existing ui/ components | Too disruptive | Future phase |
| Standardize Flex vs Stack usage | Needs design decision | PATTERNS.md |
| check-duplicate-components.js | Nice-to-have | Backlog |
| check-import-paths.js | Nice-to-have | Backlog |

---

## Stats

**Last Run:** 2026-02-17
**Files Migrated:** 1 / ~100
**Violations Remaining:** ~1142 (run validator to update)

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

*Zero raw Tailwind = zero AI slop. One file at a time. Flag duplicates, don't merge.*
