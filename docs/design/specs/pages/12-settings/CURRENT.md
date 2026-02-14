# Settings Page - Current State

> **Route**: `/:slug/settings/profile`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: Run `pnpm screenshots` to regenerate

---

## Screenshots

| Viewport | Preview |
|----------|---------|
| Desktop | ![](screenshots/desktop-dark.png) |

---

## Structure

Settings page with tabbed navigation:

```
+-------------------------------------------------------------------------------------------+
| [=] Nixelo E2E                      [Commands Cmd+K] [?] [> Timer] [Search Cmd+K] [N] [AV]|
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  Settings                                                                                 |
|  Manage your account, integrations, and preferences                                       |
|                                                                                           |
|  +---------------------------------------------------------------------------------+      |
|  | [Profile] [Preferences] [Notifications] [Integrations] [Dev Tools] [Offline]    |      |
|  +---------------------------------------------------------------------------------+      |
|  |                                                                                 |      |
|  |  +-----------------------------------------------------------------------+      |      |
|  |  |                                                                       |      |      |
|  |  |  +--------+                                                           |      |      |
|  |  |  |  [AV]  |  John Smith                                               |      |      |
|  |  |  +--------+  john@example.com                                         |      |      |
|  |  |             [Edit Profile]                                            |      |      |
|  |  |                                                                       |      |      |
|  |  |  +-------+ +-------+ +-------+ +-------+ +-------+                    |      |      |
|  |  |  |  5    | |  12   | |  8    | |  6    | |  24   |                    |      |      |
|  |  |  |Wkspc  | |Created| |Assign | |Done   | |Comments|                   |      |      |
|  |  |  +-------+ +-------+ +-------+ +-------+ +-------+                    |      |      |
|  |  |                                                                       |      |      |
|  |  |  ──────────────────────────────────────────────────────               |      |      |
|  |  |  Account Information                                                  |      |      |
|  |  |  User ID: usr_123456...                                               |      |      |
|  |  |  Email Verified: Yes                                                  |      |      |
|  |  |                                                                       |      |      |
|  |  +-----------------------------------------------------------------------+      |      |
|  |                                                                                 |      |
|  +---------------------------------------------------------------------------------+      |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
```

---

## Current Elements

### Page Header
- **Title**: "Settings"
- **Description**: "Manage your account, integrations, and preferences"

### Tab Navigation
- **Profile**: User profile and stats
- **Preferences**: Theme, timezone, notifications
- **Notifications**: Email notification preferences
- **Integrations**: GitHub, Google Calendar, etc.
- **Dev Tools**: API keys, developer options
- **Offline**: Offline mode settings

### Profile Tab
- **Avatar**: User image or initial
- **Name/Email**: Display with edit button
- **Stats cards**: Workspaces, Created, Assigned, Done, Comments
- **Account info**: User ID, email verified status

### Preferences Tab
- **Appearance card**: Theme toggle (Light/Dark/System)
- **Regional card**: Timezone selector
- **Notifications card**: Desktop notifications toggle

### Notifications Tab
- **Master toggle**: Email notifications on/off
- **Notification types**: Mentions, Assignments, Comments, Status Changes
- **Email digest**: None, Daily, Weekly options

### Integrations Tab
- **GitHub**: Connect/disconnect, linked repositories
- **Google Calendar**: OAuth connection
- **Pumble**: Team communication integration

---

## Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/_auth/_app/$orgSlug/settings/profile.tsx` | Route definition | ~25 |
| `src/components/Settings/index.tsx` | Main settings component | ~60 |
| `src/components/Settings/ProfileTab.tsx` | Profile tab wrapper | ~30 |
| `src/components/Settings/ProfileContent.tsx` | Profile content | ~260 |
| `src/components/Settings/PreferencesTab.tsx` | Preferences content | ~180 |
| `src/components/Settings/NotificationsTab.tsx` | Notification prefs | ~265 |
| `src/components/Settings/GitHubIntegration.tsx` | GitHub settings | ~150 |
| `src/components/Settings/GoogleCalendarIntegration.tsx` | Calendar settings | ~100 |
| `src/components/Settings/ApiKeysManager.tsx` | API key management | ~200 |
| `src/components/Settings/DevToolsTab.tsx` | Developer tools | ~80 |
| `src/components/Settings/OfflineTab.tsx` | Offline settings | ~60 |

---

## Problems

| # | Problem | Location | Severity |
|---|---------|----------|----------|
| 1 | No sidebar navigation (tabs only) | Settings/index.tsx | MEDIUM |
| 2 | Form fields lack consistent styling | All tabs | MEDIUM |
| 3 | Section headers inconsistent | All tabs | MEDIUM |
| 4 | No save confirmation animation | ProfileContent.tsx | LOW |
| 5 | Stats cards need polish | ProfileContent.tsx | LOW |
| 6 | Missing danger zone styling | Not implemented | LOW |
| 7 | No password change section | ProfileContent.tsx | LOW |
| 8 | No account deletion option | ProfileContent.tsx | LOW |
| 9 | Integration cards need status indicators | Integrations tabs | LOW |
| 10 | Toggle group styling could improve | PreferencesTab.tsx | LOW |

---

## Current Tab Structure

| Tab | Sections |
|-----|----------|
| Profile | Header (avatar, name), Stats, Account Info |
| Preferences | Appearance, Regional, Desktop Notifications |
| Notifications | Master Toggle, Notification Types, Digest Options |
| Integrations | GitHub, Google Calendar, Pumble |
| Dev Tools | API Keys, Debug Options |
| Offline | Offline Mode Toggle, Cache Management |

---

## Summary

Settings page is functional with tabbed navigation:
- Profile editing works with inline form
- Theme switching persists to database
- Notification preferences save correctly
- GitHub OAuth integration functional
- Needs visual polish and consistent styling
- Missing sidebar navigation pattern (common in modern settings)
- Could add danger zone for account deletion
- Password change not implemented (OAuth-only currently)
