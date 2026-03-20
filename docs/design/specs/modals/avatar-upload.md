# Avatar Upload Modal

> **Component**: `Settings/AvatarUploadModal.tsx`
> **Status**: 🟢 GOOD
> **Lines**: 224

---

## Current State

The avatar upload modal is the compact profile-photo update flow for the current user.

### Structure
```
┌──────────────────────────────────────────────────────────────┐
│  Upload Avatar                                         [×]  │
│  Choose a profile picture to display                       │
│                                                            │
│                    [ avatar preview ]                      │
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
| Focus | Single-purpose modal with no unrelated profile controls |
| Feedback | Immediate preview and selected-file summary make the upload state legible |
| Recovery | Existing avatar can be replaced or removed without leaving settings |
| Consistency | Uses owned `Dialog`, `Avatar`, `ImageUploadDropzone`, and button primitives |

---

## Minor Issues

| # | Problem | Severity |
|---|---------|----------|
| 1 | Large images rely on file-size validation rather than explicit crop controls | LOW |
| 2 | Preview is circular only, so users do not see how the image may crop in smaller contexts | LOW |

---

## Verdict

**KEEP AS-IS**. The modal is compact, understandable, and consistent with the rest of the owned upload/dialog system.

---

## Checklist

- [x] Uses owned dialog and upload primitives
- [x] Supports replace and remove flows
- [x] Shows preview before upload
- [x] Keeps actions visible on mobile
- [x] Fits cleanly in desktop, tablet, and mobile screenshot configs
