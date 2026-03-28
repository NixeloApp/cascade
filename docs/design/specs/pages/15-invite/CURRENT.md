# Invite Page - Current State

> **Route**: `/join/:token`
> **Status**: IMPLEMENTED and reviewed across pending plus terminal invite states
> **Last Updated**: 2026-03-26
> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Screenshot Matrix

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|-------|--------------|---------------|--------------|--------------|
| Pending invite | ![Pending invite desktop dark](screenshots/desktop-dark.png) | ![Pending invite desktop light](screenshots/desktop-light.png) | ![Pending invite tablet light](screenshots/tablet-light.png) | ![Pending invite mobile light](screenshots/mobile-light.png) |
| Invalid invite | ![Invalid invite desktop dark](screenshots/desktop-dark-invalid.png) | ![Invalid invite desktop light](screenshots/desktop-light-invalid.png) | ![Invalid invite tablet light](screenshots/tablet-light-invalid.png) | ![Invalid invite mobile light](screenshots/mobile-light-invalid.png) |
| Expired invite | ![Expired invite desktop dark](screenshots/desktop-dark-expired.png) | ![Expired invite desktop light](screenshots/desktop-light-expired.png) | ![Expired invite tablet light](screenshots/tablet-light-expired.png) | ![Expired invite mobile light](screenshots/mobile-light-expired.png) |
| Revoked invite | ![Revoked invite desktop dark](screenshots/desktop-dark-revoked.png) | ![Revoked invite desktop light](screenshots/desktop-light-revoked.png) | ![Revoked invite tablet light](screenshots/tablet-light-revoked.png) | ![Revoked invite mobile light](screenshots/mobile-light-revoked.png) |
| Accepted invite | ![Accepted invite desktop dark](screenshots/desktop-dark-accepted.png) | ![Accepted invite desktop light](screenshots/desktop-light-accepted.png) | ![Accepted invite tablet light](screenshots/tablet-light-accepted.png) | ![Accepted invite mobile light](screenshots/mobile-light-accepted.png) |

---

## Current Read

- The join route handles:
  - loading
  - invalid token
  - expired invite
  - revoked invite
  - already accepted invite
  - valid pending invite for authenticated and unauthenticated users
- Authenticated users can accept directly.
- Unauthenticated users are dropped into the shared sign-in flow in-place.
- All primary terminal branches now render inside the same branded invite shell as the pending path.
- The reviewed screenshot matrix now covers the important terminal states instead of only the happy-path invite.

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

No significant route-specific visual gaps remain on the current branch. Future work belongs to the broader public-route consistency pass rather than an invite-only defect.

---

## Source Files

- `src/routes/join.$token.tsx`
- `src/components/Auth/SignInForm.tsx`
- `convex/invites.ts`

---

## Summary

Invite is implemented, visually coherent, and now reviewable across the main pending and terminal
states. Remaining work is broader public-route consistency, not missing invite behavior or screenshot
coverage.
