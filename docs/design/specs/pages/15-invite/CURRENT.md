# Invite Page - Current State

> **Route**: `/invite/:token`
> **Status**: IMPLEMENTED and functional, with modest shell cleanup still possible
> **Last Updated**: 2026-03-21

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Screenshot Matrix

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

---

## Current Read

- The invite route handles:
  - loading
  - invalid token
  - expired invite
  - revoked invite
  - already accepted invite
  - valid pending invite for authenticated and unauthenticated users
- Authenticated users can accept directly.
- Unauthenticated users are dropped into the shared sign-in flow in-place.
- The route no longer needs to be described as a hypothetical or partial implementation.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Standalone public route                                                      │
│                                                                              │
│  header: compact Nixelo brand row                                            │
│                                                                              │
│  main invite card                                                            │
│  - inviter identity                                                          │
│  - project / org invite details                                              │
│  - authenticated accept path OR embedded sign-in path                        │
│                                                                              │
│  alternate state screens                                                     │
│  - invalid / expired / revoked / accepted                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| The route works, but some states still carry more generic public-page shell than necessary | route shell | LOW |
| The canonical screenshot set does not yet separate the major invalid/expired/revoked branches into reviewed artifacts | screenshot depth | LOW |

---

## Source Files

- `src/routes/invite.$token.tsx`
- `src/components/Auth/SignInForm.tsx`
- `convex/invites.ts`

---

## Summary

Invite is implemented and operational. Remaining work is review depth and light shell discipline,
not missing functionality.
