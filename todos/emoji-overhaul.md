# Emoji Overhaul

> **Priority:** P2
> **Effort:** Medium
> **Status:** Phase 2 Complete, Phase 3 Pending

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
  ```typescript
  // Current
  icon: v.string(), // "📄"

  // New
  icon: v.union(
    v.object({ type: v.literal("lucide"), name: v.string() }),
    v.object({ type: v.literal("emoji"), value: v.string() }),
  )
  ```

- [ ] Migration script for existing templates

---

## Phase 3: Emoji Usage Audit

- [ ] Audit project/team/workspace icons for emoji usage
- [ ] Audit custom field options
- [ ] Audit user status fields

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
- [ ] `S3` Execute schema migration for structured icon type
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
