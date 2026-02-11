# Emoji Overhaul

> **Priority:** P2
> **Effort:** Medium
> **Status:** Phase 2 Pending

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

- [ ] Create `src/components/ui/IconPicker.tsx`
  - Grid layout with 30-40 curated Lucide icons
  - Hover preview
  - Keyboard navigation
  - Search/filter

- [ ] Update `DocumentTemplatesManager.tsx` to use IconPicker

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
