# Emoji Overhaul

> **Priority:** P2
> **Effort:** Medium
> **Status:** Blocked (manual accessibility QA pending)

---

## Phase 2: Icon Picker Component

Replace raw emoji text input with a proper picker UI.

### Problem

`DocumentTemplatesManager.tsx` uses raw text input for emoji:
```tsx
<FormInput
  label="Icon (Emoji)"
  placeholder="📄"
  maxLength={2}
/>
```

Users must manually type emoji without visual feedback.

### Tasks

- [x] Create `src/components/ui/IconPicker.tsx`
  - Grid layout with 30-40 curated Lucide icons
  - Hover preview
  - Keyboard navigation
  - Search/filter

- [x] Update `DocumentTemplatesManager.tsx` to use IconPicker

- [ ] Schema migration for icon field
- [x] Schema migration for icon field
  ```typescript
  // Current
  icon: v.string(), // "📄"

  // New
  icon: v.union(
    v.object({ type: v.literal("lucide"), name: v.string() }),
    v.object({ type: v.literal("emoji"), value: v.string() }),
  )
  ```

- [x] Migration script for existing templates

---

## Phase 3: Emoji Usage Audit

- [x] Audit project/team/workspace icons for emoji usage
- [x] Audit custom field options
- [x] Audit user status fields

---

## Phase 4: Accessibility

- [ ] All icon-only buttons have `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] WCAG contrast verification
- [ ] Screen reader testing

---

## Related Files

- `src/components/ui/Icon.tsx` - Existing icon component
- `src/lib/icons.ts` - Lucide icon exports (80+)
- `src/components/DocumentTemplatesManager.tsx` - Template manager
- `convex/documentTemplates.ts` - Template backend

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S4-S5`  
**Effort:** Medium

### Milestones

- [x] `S2` Build reusable `IconPicker` with keyboard navigation + search
- [x] `S2` Replace template icon input usage and keep emoji backward compatibility
- [x] `S3` Execute schema migration for structured icon type
- [ ] `S3` Complete accessibility audit for icon-only controls

### Dependencies

- Final schema decision for icon field representation
- Migration script for existing template rows

### Definition of Done

- Template icon UX is visual-first, keyboard accessible, and migration-safe.

---

## Progress Updates

### 2026-03-02 (Priority 14, batch A)

**Completed**
- Added reusable `IconPicker` at `src/components/ui/IconPicker.tsx`:
  - 35 curated Lucide options with search/filter.
  - Keyboard navigation across icon grid (arrow keys).
  - Hover-based selected preview.
  - Emoji fallback row to preserve compatibility with existing emoji values.
- Added `TemplateIcon` renderer (same file) that supports both:
  - `lucide:<IconName>` values.
  - legacy/raw emoji values.
- Replaced raw emoji text input in `src/components/Documents/DocumentTemplatesManager.tsx` with `IconPicker`.
  - Removed restrictive `maxLength(2)` icon validation.
  - Updated default icon value to `lucide:FileText`.
  - Updated template card rendering to use `TemplateIcon` for both built-in and custom templates.
- Added tests in `src/components/ui/IconPicker.test.tsx`:
  - search/filter behavior
  - lucide selection value emission
  - emoji fallback selection
  - keyboard navigation
  - template icon fallback rendering

**Validation**
- `pnpm exec biome check --write src/components/ui/IconPicker.tsx src/components/ui/IconPicker.test.tsx src/components/Documents/DocumentTemplatesManager.tsx`
- `pnpm test src/components/ui/IconPicker.test.tsx src/components/App/AppSidebar.test.tsx` (`15 passed`)
- `pnpm run typecheck` (pass)

**Decisions**
- Deferred schema migration to `S3`; `S2` stores lucide picks as `lucide:<IconName>` while continuing to support existing emoji strings.
- Kept emoji fallback UI in picker to avoid breaking historical template records and user habits during transition.

**Blockers**
- None for `S2`.

**Next step (strict order)**
- Continue Priority `14` with `S3`: schema migration to structured icon type + migration script + accessibility audit pass.

### 2026-03-02 (Priority 14, batch B)

**Completed**
- Implemented structured template icon model in backend:
  - `convex/schema.ts` `documentTemplates.icon` now supports structured icon objects via union:
    - `{ type: "lucide", name: string }`
    - `{ type: "emoji", value: string }`
  - Transitional compatibility retained with legacy string icon values during migration window.
- Added backend normalization/serialization in `convex/documentTemplates.ts`:
  - `create`/`update` now accept string or structured icon input and normalize to structured storage.
  - `get`/`list` serialize icon values for existing frontend compatibility.
  - Built-in template seeding now normalizes icon values at insert time.
- Added migration mutation:
  - `internal.documentTemplates.migrateLegacyIconStrings`
  - Scans in batches and converts remaining string icons to structured objects.
- Added migration + structured-storage test coverage in `convex/documentTemplates.test.ts`.

**Validation**
- `pnpm exec biome check --write convex/documentTemplates.ts convex/documentTemplates.test.ts convex/schema.ts src/components/ui/IconPicker.tsx src/components/Documents/DocumentTemplatesManager.tsx`
- `pnpm test convex/documentTemplates.test.ts src/components/ui/IconPicker.test.tsx` (`29 passed`)
- `pnpm run typecheck` (pass)

**Decisions**
- Kept transitional schema compatibility (`string` + structured union) while migration rolls out to avoid hard failure on pre-existing template rows.
- Kept API response icon serialization stable for current frontend routes while backend storage migrates.

**Blockers**
- None for migration rollout.

**Next step (strict order)**
- Continue Priority `14` with remaining scope:
  - Phase 3 emoji usage audits (project/team/workspace/custom-fields/user-status).
  - Phase 4 accessibility audit (icon-only labels, decorative aria-hidden, contrast + screen reader checks).

### 2026-03-02 (Priority 14, batch C)

**Completed**
- Executed Phase 3 emoji usage audit across current code paths:
  - Project/team/workspace icons:
    - `workspaces.icon` and `teams.icon` remain optional emoji/string fields in `convex/schema.ts`.
    - Workspace settings UI uses curated emoji selector (`src/routes/_auth/_app/$orgSlug/workspaces/$workspaceSlug/settings.tsx`).
    - Project templates continue to use string/emoji icons (`projectTemplates.icon`).
  - Custom fields:
    - No emoji-icon storage field requiring migration was found in custom-field option schema/components.
  - User status fields:
    - No dedicated emoji status-icon data model requiring migration was found in current settings/user-management surfaces.
- Accessibility hardening for current icon-overhaul surface:
  - Added explicit `aria-label` values for icon-only edit/delete template controls in `src/components/Documents/DocumentTemplatesManager.tsx`.

**Validation**
- `pnpm test convex/documentTemplates.test.ts src/components/ui/IconPicker.test.tsx` (`29 passed`)
- `pnpm run typecheck` (pass)

**Decisions**
- Scoped structured icon migration to `documentTemplates` first to reduce rollout risk.
- Deferred workspace/team/project-template icon schema migrations to a separate follow-up once product-level icon language is finalized.

**Blockers**
- Full WCAG contrast and screen-reader verification requires manual browser/assistive-tech QA passes.

**Next step (strict order)**
- Finish remaining Phase 4 checklist with manual accessibility verification and close Priority `14`.

### 2026-03-02 (Priority 14, batch D)

**Completed**
- Reconciled this priority to blocked state: all code-deliverable migration/audit work is complete; only manual accessibility QA checklist items remain.

**Validation**
- Prior implementation validations remain green:
  - `pnpm test convex/documentTemplates.test.ts src/components/ui/IconPicker.test.tsx` (`29 passed`)
  - `pnpm run typecheck` (pass)

**Decisions**
- Did not mark Phase 4 checklist done without actual manual verification evidence from assistive-tech/browser passes.

**Blockers**
- Remaining scope requires manual execution outside CLI-only automation:
  - WCAG contrast verification.
  - Screen-reader testing.
  - End-to-end decorative/icon-only semantics review in rendered UI.

**Next step (strict order)**
- Continue to Priority `15` while waiting for manual accessibility QA results to close this todo.

### 2026-03-02 (Priority 14, batch E)

**Completed**
- Revalidated this blocked todo status in strict-order flow; no additional code changes were required.

**Validation**
- `pnpm test src/components/ui/IconPicker.test.tsx src/components/CommentReactions.test.tsx` (`7 passed`)
- Note: non-blocking React test warning (`act(...)`) was emitted from `IconPicker` tooltip updates; test run remained green.

**Decisions**
- Keep Priority `14` blocked until manual accessibility QA evidence is provided.

**Blockers**
- Unchanged manual QA requirements:
  - WCAG contrast verification
  - screen-reader testing
  - rendered icon semantics review

**Next step (strict order)**
- Continue to Priority `15`.
