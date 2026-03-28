# Settings Page - Current State

> **Route**: `/:slug/settings/profile` plus search-param tab state across the settings suite
> **Status**: REVIEWED across the major settings tabs and modal states
> **Last Updated**: 2026-03-26

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

## Permissions & Access

- Profile, preferences, notifications, offline, security, api keys, and integrations are standard
  authenticated settings tabs.
- Admin and project-settings branches depend on admin role and route context.
- Developer tooling stays behind test-email gating and does not appear for normal accounts.

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
- The embedded project-settings surface now uses a direct section intro plus the same lighter section stack, instead of wrapping the whole project settings area in an extra outer card.

---

## Primary Flow

1. The settings route resolves the requested tab from validated search params.
2. `SETTINGS_TABS` decides visibility based on role and developer-email gates.
3. The shared settings shell renders one responsive tab band and a single active tab panel.
4. Users move between profile/preferences/notifications/offline/security/api/integration/admin
   branches without losing route-owned tab state.

---

## Alternate / Failure Flows

### Integrations setup and connected branches

- **GitHub**: disconnected state offers popup-based connect; connected state shows the GitHub
  username, linked repositories inset, and a destructive disconnect confirm.
- **Slack**: disconnected state offers popup-based connect; connected state shows workspace name
  plus incoming-webhook availability.
- **Google Calendar**: disconnected state offers popup connect and blocked-popup error handling;
  connected state exposes sync enable/disable and sync-direction radio controls.
- **Pumble**: empty state is an owned `EmptyState` with `Add Your First Webhook`; connected state
  shows webhook cards with test, enable/disable, edit, and delete flows.

### Exceptional states already covered by tests

- Notifications permission denied banner.
- Google popup blocked.
- GitHub and Slack postMessage origin validation.
- Pumble empty-state, active webhook actions, and destructive confirm.
- Project delete confirm dialog inside the project settings branch.

---

## Empty / Loading / Error States

- Hidden tabs are removed from the tab band entirely rather than rendering disabled placeholders.
- Notifications and offline tabs render explicit warning or empty queue states instead of blank
  shells.
- Integration cards use setup/disconnected summaries until a connection record exists.
- Project and destructive admin states render inside the same settings shell instead of routing to
  ad hoc full-page branches.

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
| `src/components/Settings/GitHubIntegration.tsx` | GitHub setup / connected / disconnect flow |
| `src/components/Settings/SlackIntegration.tsx` | Slack workspace setup and connected summary |
| `src/components/Settings/GoogleCalendarIntegration.tsx` | Google Calendar setup, sync toggles, and disconnect flow |
| `src/components/Settings/PumbleIntegration.tsx` | Pumble empty state, webhook list, add/edit/delete actions |
| `src/components/Settings/*.test.tsx` | Integration exceptional-state and destructive-flow coverage |
| `e2e/screenshot-pages.ts` | Settings screenshot routing and tab-state capture |

---

## Acceptance Criteria

- The doc explains how route-owned tab state, role gating, and developer-only tabs work.
- The reviewed screenshot matrix and the test-backed exceptional integration flows are both called
  out explicitly.
- A contributor can tell where setup, connected, disconnect, and permission-denied states live
  without reading the integration components first.

---

## Summary

Settings is no longer an under-specified profile page. The suite is current, broad, and already
reviewed across the major tabs and modal states. Remaining work is finer-grained screenshot depth,
not route identity or shell consistency.
