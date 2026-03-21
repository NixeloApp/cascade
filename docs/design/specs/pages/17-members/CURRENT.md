# Members Management - Current State

> **Route**: embedded inside `/:slug/projects/:key/settings`
> **Status**: IMPLEMENTED as a project-settings sub-surface
> **Last Updated**: 2026-03-21

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Screenshot Matrix

| Viewport | Base State | Confirm Dialog |
|----------|------------|----------------|
| Desktop Dark | ![](screenshots/desktop-dark.png) | ![](screenshots/desktop-dark-confirm-dialog.png) |
| Desktop Light | ![](screenshots/desktop-light.png) | ![](screenshots/desktop-light-confirm-dialog.png) |
| Tablet Light | ![](screenshots/tablet-light.png) | ![](screenshots/tablet-light-confirm-dialog.png) |
| Mobile Light | n/a | ![](screenshots/mobile-light-confirm-dialog.png) |

---

## Current Read

- Members management is intentionally embedded in project settings, not a standalone route.
- The surface supports:
  - member list
  - add member by email
  - role changes
  - owner protection
  - removal with confirm dialog
- The confirm dialog is now part of the reviewed screenshot set.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Project settings route                                                       │
│                                                                              │
│  ProjectSettings                                                             │
│   └─ MemberManagement                                                        │
│      - header + member count                                                 │
│      - add-member form                                                       │
│      - member rows                                                           │
│      - role controls / remove action                                         │
│      - confirm dialog                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| The surface works, but its shell still reads more like a local settings card than a first-class section anatomy | embedded surface chrome | LOW |
| Mobile base-state coverage is still weaker than dialog coverage in the screenshot set | screenshot depth | LOW |

---

## Source Files

- `src/components/ProjectSettings/MemberManagement.tsx`
- `src/routes/_auth/_app/$orgSlug/projects/$key/settings.tsx`
- `convex/projects.ts`

---

## Summary

Members management is current as an embedded settings surface. The open question is not whether it
exists, but whether it should someday graduate into a broader team-management route.
