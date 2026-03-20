# Cover Image Upload Modal

> **Component**: `Settings/CoverImageUploadModal.tsx`
> **Status**: 🟢 GOOD
> **Lines**: 228

---

## Current State

The cover image upload modal handles profile banner updates with a wider preview surface than the avatar flow.

### Structure
```
┌──────────────────────────────────────────────────────────────┐
│  Upload Cover Image                                   [×]  │
│  Choose a cover image for your profile                     │
│                                                            │
│  [ wide banner preview / empty state ]                    │
│                                                            │
│  [ dropzone / choose file ]                                │
│                                                            │
│                  [Cancel] [Upload]                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Strengths

| Aspect | Implementation |
|--------|----------------|
| Scope | Clean banner-specific upload flow without overloading the profile page |
| Preview | Wide inline preview matches the eventual cover-image shape better than the avatar flow |
| Guidance | Dropzone helper text provides image type, size, and recommendation hints |
| Consistency | Shares dialog/footer/upload behavior with the avatar modal while keeping the preview appropriate to the asset |

---

## Minor Issues

| # | Problem | Severity |
|---|---------|----------|
| 1 | No crop or focal-point control, so banner composition still depends on the source image | LOW |
| 2 | Empty preview state is visually quieter than the filled-image state, so first-use affordance could be stronger | LOW |

---

## Verdict

**KEEP AS-IS**. The modal is coherent, purpose-built, and gives the user enough context to make a safe cover-image change without adding unnecessary complexity.

---

## Checklist

- [x] Uses owned dialog and upload primitives
- [x] Supports replace and remove flows
- [x] Shows a cover-shaped preview surface
- [x] Keeps footer actions stable across viewport sizes
- [x] Fits cleanly in desktop, tablet, and mobile screenshot configs
