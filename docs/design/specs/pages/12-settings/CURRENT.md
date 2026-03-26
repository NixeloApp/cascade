# Settings Page - Current State

> **Route**: `/:slug/settings/profile` plus search-param tab state across the settings suite
> **Status**: REVIEWED across the major settings tabs and modal states
> **Last Updated**: 2026-03-21

> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

---

## Purpose

Settings is no longer just the profile tab. The current route and screenshot suite now review the
full settings workspace:

- profile
- preferences
- notifications
- offline
- security / 2FA
- API keys
- integrations
- admin
- project settings and destructive project-delete dialog
- avatar / cover upload modals

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Additional reviewed settings states

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|------|---------------|---------------|--------------|--------------|
| Profile avatar upload | `desktop-dark-profile-avatar-upload-modal.png` | `desktop-light-profile-avatar-upload-modal.png` | `tablet-light-profile-avatar-upload-modal.png` | `mobile-light-profile-avatar-upload-modal.png` |
| Profile cover upload | `desktop-dark-profile-cover-upload-modal.png` | `desktop-light-profile-cover-upload-modal.png` | `tablet-light-profile-cover-upload-modal.png` | `mobile-light-profile-cover-upload-modal.png` |
| Preferences | `desktop-dark-preferences.png` | `desktop-light-preferences.png` | `tablet-light-preferences.png` | `mobile-light-preferences.png` |
| Notifications | `desktop-dark-notifications.png` | `desktop-light-notifications.png` | `tablet-light-notifications.png` | `mobile-light-notifications.png` |
| Notifications permission denied | `desktop-dark-notifications-permission-denied.png` | `desktop-light-notifications-permission-denied.png` | `tablet-light-notifications-permission-denied.png` | `mobile-light-notifications-permission-denied.png` |
| Offline | `desktop-dark-offline.png` | `desktop-light-offline.png` | `tablet-light-offline.png` | `mobile-light-offline.png` |
| Security | `desktop-dark-security.png` | `desktop-light-security.png` | `tablet-light-security.png` | `mobile-light-security.png` |
| API keys | `desktop-dark-api-keys.png` | `desktop-light-api-keys.png` | `tablet-light-api-keys.png` | `mobile-light-api-keys.png` |
| Integrations | `desktop-dark-integrations.png` | `desktop-light-integrations.png` | `tablet-light-integrations.png` | `mobile-light-integrations.png` |
| Admin | `desktop-dark-admin.png` | `desktop-light-admin.png` | `tablet-light-admin.png` | `mobile-light-admin.png` |
| Project settings | `desktop-dark-project.png` | `desktop-light-project.png` | `tablet-light-project.png` | `mobile-light-project.png` |
| Project delete dialog | `desktop-dark-project-delete-alert-dialog.png` | `desktop-light-project-delete-alert-dialog.png` | `tablet-light-project-delete-alert-dialog.png` | `mobile-light-project-delete-alert-dialog.png` |

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ PageHeader                                                                                  │
│ Settings                                                                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Shared settings tab band / controls shell                                                   │
│ profile | preferences | notifications | offline | security | api keys | integrations | ... │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Active tab content                                                                          │
│                                                                                             │
│  profile / preferences / notifications / offline / security / api keys / integrations      │
│  admin / project                                                                            │
│                                                                                             │
│  each tab now uses shared settings anatomy instead of bespoke card stacks                   │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Read

- Tab state is route-owned through validated search params rather than copied into local state.
- `SETTINGS_TABS` is the canonical visibility/rendering model.
- The shared settings tab band now wraps into multiple rows on phone-width screens instead of compressing all tabs into one cramped strip.
- Lighter tabs now use shared `SettingsSection`.
- Integrations now use shared `SettingsIntegrationSection`.
- Admin uses a dedicated shared shell rather than a stack of unrelated panels.
- Security, API keys, and devtools no longer drift away from the shared settings anatomy.

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | The main settings suite is now coherent, but some of the heaviest internal states still deserve deeper per-state screenshots if those flows keep growing | screenshot depth | LOW |
| 2 | A few admin and integration branches are functionally correct but still denser than the calmer profile/preferences tabs | internal tab hierarchy | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/settings/profile.tsx` | Route entry / tab search state |
| `src/components/Settings.tsx` | Main settings shell |
| `src/components/Settings/settingsTabs.ts` | Canonical tab model |
| `src/components/Settings/SettingsSection.tsx` | Shared settings section anatomy |
| `src/components/Settings/SettingsIntegrationSection.tsx` | Shared integrations anatomy |
| `src/components/Settings/AdminTab.tsx` | Admin tab shell |
| `e2e/screenshot-pages.ts` | Settings screenshot routing and tab-state capture |

---

## Summary

Settings is no longer an under-specified profile page. The suite is current, broad, and already
reviewed across the major tabs and modal states. Remaining work is finer-grained screenshot depth,
not route identity or shell consistency.
