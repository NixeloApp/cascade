# Settings Page - Target State

> **Route**: `/:slug/settings/*`
> **Reference**: Linear settings, Mintlify settings, GitHub settings
> **Goal**: Clean settings layout, sidebar navigation, consistent styling

---

## Reference Screenshots

| Source | Preview |
|--------|---------|
| Linear Settings | ![](screenshots/reference-linear-settings.png) |
| GitHub Settings | ![](screenshots/reference-github-settings.png) |

---

## Key Differences from Current

| Aspect | Current | Target |
|--------|---------|--------|
| Navigation | Horizontal tabs | Vertical sidebar |
| Layout | Single column | Two-column (nav + content) |
| Section cards | Inconsistent | Unified card styling |
| Form fields | Basic inputs | Polished with descriptions |
| Save feedback | Toast only | Inline success indicator |
| Danger zone | Missing | Red-bordered section |
| Integration status | Basic | Status badges |

---

## Target Layout

```
+-------------------------------------------------------------------------------------------+
| [=] Nixelo                          [Commands Cmd+K] [?] [> Timer] [Search Cmd+K] [N] [AV]|
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  +------------------+  +------------------------------------------------------------------+
|  |                  |  |                                                                  |
|  |  ACCOUNT         |  |  Profile                                                         |
|  |  ────────        |  |  ─────────────────────────────────────────────────────────────   |
|  |  > Profile       |  |                                                                  |
|  |    Password      |  |  +--------------------------------------------------------------+|
|  |    Sessions      |  |  |                                                              ||
|  |                  |  |  |  +--------+  John Smith                                      ||
|  |  PREFERENCES     |  |  |  |  [AV]  |  john@example.com                                ||
|  |  ────────────    |  |  |  |        |  Joined January 2025                             ||
|  |  > Appearance    |  |  |  +--------+                                [Change Avatar]   ||
|  |    Notifications |  |  |                                                              ||
|  |    Accessibility |  |  +--------------------------------------------------------------+|
|  |                  |  |                                                                  |
|  |  INTEGRATIONS    |  |  +--------------------------------------------------------------+|
|  |  ────────────    |  |  |  Display Name                                                ||
|  |    GitHub        |  |  |  ────────────────────────────────────────────────────────    ||
|  |    Calendar      |  |  |  The name that appears on your profile and in mentions       ||
|  |    Slack         |  |  |                                                              ||
|  |                  |  |  |  [John Smith                                        ]  [Save]||
|  |  DEVELOPER       |  |  |                                                              ||
|  |  ─────────       |  |  +--------------------------------------------------------------+|
|  |    API Keys      |  |                                                                  |
|  |    Webhooks      |  |  +--------------------------------------------------------------+|
|  |                  |  |  |  Email Address                                               ||
|  |  ────────────    |  |  |  ────────────────────────────────────────────────────────    ||
|  |  [?] Help        |  |  |  Your primary email for notifications                        ||
|  |                  |  |  |                                                              ||
|  +------------------+  |  |  [john@example.com                              ]  [Verified]||
|                        |  |                                                              ||
|                        |  +--------------------------------------------------------------+|
|                        |                                                                  |
|                        |  DANGER ZONE                                                     |
|                        |  +--------------------------------------------------------------+|
|                        |  |  🔴 Delete Account                                           ||
|                        |  |  Permanently remove your account and all associated data     ||
|                        |  |                                           [Delete Account]   ||
|                        |  +--------------------------------------------------------------+|
|                        |                                                                  |
+-------------------------------------------------------------------------------------------+
```

---

## Design Tokens

### Background Colors

| Element | Token | Notes |
|---------|-------|-------|
| Page bg | `bg-ui-bg` | Main background |
| Sidebar bg | `bg-ui-bg` | Same as page |
| Content card bg | `bg-ui-bg-secondary` | Subtle lift |
| Danger zone bg | `bg-status-error-bg` | Error background |
| Success badge bg | `bg-status-success-bg` | Verified badge |

### Border Colors

| Element | Token |
|---------|-------|
| Sidebar border | `border-ui-border` |
| Card border | `border-ui-border` |
| Danger zone border | `border-status-error` |
| Input border | `border-ui-border` |
| Input focus | `border-brand` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | `text-2xl` | 600 | `text-ui-text` |
| Section title | `text-lg` | 600 | `text-ui-text` |
| Field label | `text-sm` | 500 | `text-ui-text` |
| Field description | `text-sm` | 400 | `text-ui-text-secondary` |
| Sidebar group | `text-xs` | 600 | `text-ui-text-tertiary` |
| Sidebar link | `text-sm` | 400 | `text-ui-text-secondary` |
| Sidebar active | `text-sm` | 500 | `text-ui-text` |

### Spacing

| Element | Value | Token |
|---------|-------|-------|
| Sidebar width | 240px | `w-60` |
| Content max-width | 640px | `max-w-2xl` |
| Card padding | 24px | `p-6` |
| Section gap | 24px | `gap-6` |
| Field gap | 16px | `gap-4` |
| Sidebar item height | 36px | `h-9` |

---

## Animations

### Save Button Success

```css
@keyframes save-success {
  0% {
    background-color: var(--color-brand);
  }
  50% {
    background-color: var(--color-status-success);
    transform: scale(1.02);
  }
  100% {
    background-color: var(--color-brand);
    transform: scale(1);
  }
}

.save-button[data-success="true"] {
  animation: save-success 0.5s ease-out;
}
```

### Sidebar Item Hover

```css
.sidebar-item {
  transition: background-color 0.15s ease, color 0.15s ease;
}

.sidebar-item:hover {
  background-color: var(--color-ui-bg-secondary);
}

.sidebar-item[data-active="true"] {
  background-color: var(--color-brand-subtle);
  color: var(--color-ui-text);
}
```

### Field Focus

```css
.settings-input {
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.settings-input:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px var(--color-brand-subtle);
}
```

### Danger Zone Hover

```css
.danger-button {
  transition: background-color 0.15s ease;
}

.danger-button:hover {
  background-color: var(--color-status-error);
  color: white;
}
```

---

## Sidebar Structure

### Groups

| Group | Items |
|-------|-------|
| Account | Profile, Password, Sessions |
| Preferences | Appearance, Notifications, Accessibility |
| Integrations | GitHub, Calendar, Slack |
| Developer | API Keys, Webhooks |
| (Footer) | Help, Sign Out |

### Sidebar Item States

```
Default:     text-ui-text-secondary, no bg
Hover:       text-ui-text-secondary, bg-ui-bg-secondary
Active:      text-ui-text, bg-brand-subtle, font-medium
```

---

## Field Patterns

### Standard Field

```
+------------------------------------------------------------------+
|  Field Label                                                      |
|  ────────────────────────────────────────────────────────────     |
|  Description text explaining the field purpose                    |
|                                                                   |
|  [Input value                                             ] [Save]|
+------------------------------------------------------------------+
```

### Toggle Field

```
+------------------------------------------------------------------+
|  Setting Name                                                     |
|  Description of what this toggle controls                         |
|                                                [====O] or [O====] |
+------------------------------------------------------------------+
```

### Selection Field

```
+------------------------------------------------------------------+
|  Option Group Label                                               |
|  Description text                                                 |
|                                                                   |
|  ( ) Option A                                                     |
|      Sub-description for option A                                 |
|                                                                   |
|  (●) Option B (selected)                                          |
|      Sub-description for option B                                 |
+------------------------------------------------------------------+
```

---

## Integration Card Pattern

```
+------------------------------------------------------------------+
|  [Icon]  GitHub                                      [Connected]  |
|  ────────────────────────────────────────────────────────────     |
|  Link your GitHub account to sync repositories                    |
|                                                                   |
|  Connected as: @johnsmith                                         |
|  Last synced: 2 hours ago                                         |
|                                                                   |
|                                              [Sync Now] [Disconnect]|
+------------------------------------------------------------------+

Status badges:
- [Connected] = green, bg-status-success-bg, border-status-success
- [Not Connected] = gray, bg-ui-bg-tertiary, border-ui-border
- [Error] = red, bg-status-error-bg, border-status-error
```

---

## Component Inventory

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `SettingsSidebar.tsx` | Vertical navigation |
| `SidebarGroup.tsx` | Section with label |
| `SidebarItem.tsx` | Navigation link |
| `SettingsField.tsx` | Field wrapper with label/description |
| `SaveButton.tsx` | Button with success animation |
| `StatusBadge.tsx` | Connected/Disconnected badge |
| `DangerZone.tsx` | Red-bordered section |
| `IntegrationCard.tsx` | OAuth connection card |

### Existing to Enhance

| Component | Changes |
|-----------|---------|
| `Settings/index.tsx` | Convert to sidebar layout |
| `ProfileContent.tsx` | Use SettingsField pattern |
| `PreferencesTab.tsx` | Consistent field styling |
| `NotificationsTab.tsx` | Cleaner toggle list |
| `GitHubIntegration.tsx` | Use IntegrationCard |

---

## Danger Zone Section

```
DANGER ZONE
+------------------------------------------------------------------+
| 🔴                                                                |
|  Delete Account                                                   |
|  ────────────────────────────────────────────────────────────     |
|  Once you delete your account, there is no going back.            |
|  This will permanently delete all your data including:            |
|  • All issues you created                                         |
|  • All comments and activity                                      |
|  • All project memberships                                        |
|                                                                   |
|                                             [Delete Account]      |
+------------------------------------------------------------------+

Border: 2px solid var(--color-status-error)
Background: var(--color-status-error-bg)
Button: variant="destructive"
```

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate sidebar items |
| `Enter` | Select sidebar item |
| `Tab` | Navigate form fields |
| `Escape` | Cancel editing |
| `Cmd+S` | Save current field |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Sidebar becomes hamburger menu |
| Tablet (768-1024px) | Narrow sidebar |
| Desktop (>1024px) | Full two-column layout |

---

## Accessibility

- Sidebar items are keyboard navigable
- Focus visible on all interactive elements
- Labels properly associated with inputs
- Error states announced to screen readers
- Confirmation dialogs are modal with focus trap
- Danger actions require confirmation
