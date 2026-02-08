# Settings Pages

> **Scope**: User Settings, Project Settings, Workspace Settings, Team Settings
> **Reference**: `docs/research/library/mintlify/dashboard/settings-domain-setup.png`
> **Current**: `e2e/screenshots/08-filled-settings.png`, `09-filled-settings-profile.png`, `11-empty-settings.png`

---

## 1. Current State Analysis

### 1.1 User Settings (Global)

**Location**: Accessed via sidebar "Settings" link

**Current Layout**:
- Page title: "Settings" with subtitle "Manage your account, integrations, and preferences"
- Horizontal tab navigation: Profile | Notifications | Integrations | API Keys | Offline Mode | Preferences | Admin | Dev Tools
- Profile tab displays:
  - Large avatar (indigo background, white initial)
  - User name ("Emily Chen" or "Anonymous User")
  - Email address
  - "Edit Profile" button (outlined)
  - Activity stats row: Workspaces | Created | Assigned | Completed | Comments (5 cards)
  - "Account Information" section with User ID and Email Verified status

**Issues Identified**:
1. Tab bar lacks active indicator animation
2. Stats cards have no hover interaction
3. Profile section feels disconnected from account info
4. No visible save state or unsaved changes indicator
5. Empty state for profile shows "Anonymous User" instead of prompting profile completion
6. Missing visual hierarchy between sections

### 1.2 Project Settings

**Location**: Project view -> Settings tab

**Current Layout**:
- Project navigation tabs: Board | Backlog | Roadmap | Calendar | Activity | Analytics | Billing | Timesheet | Settings
- Page title: "Project Settings" with subtitle
- "General" section card with Edit button:
  - Project Name field
  - Project Key field
  - Description field
- "Members" section card with "Add Member" button:
  - Member count (e.g., "20 members")
  - Member list with avatar, name, email, role dropdown, Remove action

**Issues Identified**:
1. Section cards lack subtle borders (appear floating)
2. Member list could use better visual grouping by role
3. Edit button placement inconsistent (top-right vs inline)
4. No danger zone for destructive actions
5. Role dropdown lacks visual distinction for different permission levels

### 1.3 Workspace Settings

**Location**: Workspace view -> Settings tab

**Current Layout**:
- Breadcrumb: Workspaces / [Workspace Name]
- Two tabs: Teams | Settings
- Page title: "Workspace Settings"
- Empty state: "Coming soon: Configure workspace settings, permissions, and preferences"

**Issues Identified**:
1. Placeholder content - no actual settings implemented
2. Missing workspace configuration options

### 1.4 Team Settings

**Location**: Team view -> Settings tab

**Current Layout**:
- Breadcrumb: Workspaces / [Workspace] / [Team]
- Three tabs: Projects | Calendar | Settings
- Page title: "Team Settings"
- Empty state: "Coming soon: Manage team members, permissions, and preferences"

**Issues Identified**:
1. Placeholder content - no actual settings implemented
2. Missing team management features

---

## 2. Target State (Mintlify-Inspired)

### 2.1 Key Design Principles from Mintlify

**Navigation Pattern** (from `settings-domain-setup.png`):
- Left sidebar with grouped navigation:
  - Project Settings group: Domain setup, General
  - Deployment group: Git settings, GitHub app
  - Security & Access group: Authentication, API keys
  - Workspace group: Members, Billing, My profile
  - Advanced group: Exports, Danger zone
- Back link at top ("< Main Menu")
- Subtle selection indicator (light green background)
- Icon + label for each nav item

**Content Area**:
- Clean page title with section heading
- Subtle description text below title
- Form sections with clear labels
- Inline actions (e.g., "+ Add domain" button)
- Toggle switches for options
- Input fields with protocol prefix display ("https://")

### 2.2 Target Improvements

1. **Sidebar Navigation**: Replace horizontal tabs with vertical grouped sidebar
2. **Section Cards**: Add subtle backgrounds with clear visual hierarchy
3. **Form Design**: Improved labels, descriptions, and input styling
4. **Toggle Switches**: Smooth animated toggles for boolean options
5. **Save States**: Clear unsaved changes indicator with save/discard actions
6. **Danger Zone**: Dedicated section for destructive actions
7. **Activity Stats**: Redesign as subtle metric cards with hover states

---

## 3. ASCII Wireframes

### 3.1 User Settings - Profile Tab (Target State)

```
+------------------+---------------------------------------------------------------+
| Settings         |                                                               |
|                  |  Profile                                                      |
| Account          |  Manage your personal information and preferences             |
|  > Profile       |                                                               |
|  Preferences     |  +----------------------------------------------------------+ |
|  Notifications   |  |                                                          | |
|                  |  |  +--------+  Emily Chen                                  | |
| Security         |  |  |   EC   |  e2e-teamlead-s0-screenshots@inbox.mailtrap  | |
|  Password        |  |  |        |                                              | |
|  Sessions        |  |  +--------+  [Change Avatar]                             | |
|  API Keys        |  |                                                          | |
|                  |  +----------------------------------------------------------+ |
| Integrations     |                                                               |
|  Connected Apps  |  Full Name                                                    |
|  Webhooks        |  +----------------------------------------------------------+ |
|                  |  | Emily Chen                                               | |
|                  |  +----------------------------------------------------------+ |
| Advanced         |                                                               |
|  Data Export     |  Email Address                                                |
|  Delete Account  |  +----------------------------------------------------------+ |
|                  |  | e2e-teamlead-s0-screenshots@inbox.mailtrap.io            | |
|                  |  +----------------------------------------------------------+ |
|                  |  (verified)                                                   |
|                  |                                                               |
|                  |  Display Name                                                 |
|                  |  +----------------------------------------------------------+ |
|                  |  | Emily                                                    | |
|                  |  +----------------------------------------------------------+ |
|                  |  This is how your name appears to others                      |
|                  |                                                               |
|                  |  +---------------+                                            |
|                  |  | Save Changes  |  [Discard]                                 |
|                  |  +---------------+                                            |
+------------------+---------------------------------------------------------------+
```

### 3.2 User Settings - Notifications Tab

```
+------------------+---------------------------------------------------------------+
| Settings         |                                                               |
|                  |  Notifications                                                |
| Account          |  Choose how you want to be notified                           |
|  Profile         |                                                               |
|  Preferences     |  Email Notifications                                          |
|  > Notifications |  +----------------------------------------------------------+ |
|                  |  |                                                          | |
| Security         |  |  Issue assigned to me              +------+              | |
|  ...             |  |  Get notified when an issue        | [==] | ON          | |
|                  |  |  is assigned to you                +------+              | |
|                  |  |                                                          | |
|                  |  |  ------------------------------------------------------ | |
|                  |  |                                                          | |
|                  |  |  Issue status changes               +------+              | |
|                  |  |  Get notified when an issue         | [  ] | OFF         | |
|                  |  |  you're watching changes status     +------+              | |
|                  |  |                                                          | |
|                  |  |  ------------------------------------------------------ | |
|                  |  |                                                          | |
|                  |  |  Comments and mentions              +------+              | |
|                  |  |  Get notified when someone          | [==] | ON          | |
|                  |  |  mentions you in a comment          +------+              | |
|                  |  |                                                          | |
|                  |  +----------------------------------------------------------+ |
|                  |                                                               |
|                  |  Push Notifications                                           |
|                  |  +----------------------------------------------------------+ |
|                  |  |  Enable browser notifications       +------+              | |
|                  |  |                                      | [  ] | OFF         | |
|                  |  +----------------------------------------------------------+ |
+------------------+---------------------------------------------------------------+
```

### 3.3 Project Settings (Target State)

```
+------------------+---------------------------------------------------------------+
| < Back to DEMO   |                                                               |
|                  |  Project Settings                                             |
| Project          |  Configure your project settings and team                     |
|  > General       |                                                               |
|  Workflow        |  +----------------------------------------------------------+ |
|  Labels          |  | General                                    [Edit]        | |
|                  |  |                                                          | |
| Team             |  | Project Name                                             | |
|  Members         |  | Demo Project                                             | |
|  Permissions     |  |                                                          | |
|                  |  | Project Key                                              | |
| Integrations     |  | DEMO                                                     | |
|  Git             |  |                                                          | |
|  Automation      |  | Description                                              | |
|                  |  | Demo project for screenshot visual review                | |
| Advanced         |  +----------------------------------------------------------+ |
|  Archive         |                                                               |
|  Delete          |  +----------------------------------------------------------+ |
|                  |  | Members                              [+ Add Member]      | |
|                  |  | 20 members                                               | |
|                  |  |                                                          | |
|                  |  | +------+ Unknown (Owner)                      admin      | |
|                  |  | | ?    | No email                                        | |
|                  |  | +------+                                                 | |
|                  |  |                                                          | |
|                  |  | +------+ Alex Rivera                  Editor  v  Remove  | |
|                  |  | | ?    | alex-rivera-screenshots@...                     | |
|                  |  | +------+                                                 | |
|                  |  |                                                          | |
|                  |  | +------+ Sarah Kim                    Editor  v  Remove  | |
|                  |  | | ?    | sarah-kim-screenshots@...                       | |
|                  |  | +------+                                                 | |
|                  |  +----------------------------------------------------------+ |
|                  |                                                               |
|                  |  +----------------------------------------------------------+ |
|                  |  | Danger Zone                                              | |
|                  |  |                                                          | |
|                  |  | Archive Project                                          | |
|                  |  | Archive this project and all associated issues           | |
|                  |  |                                    [Archive Project]      | |
|                  |  |                                                          | |
|                  |  | Delete Project                                           | |
|                  |  | Permanently delete this project. This cannot be undone.  | |
|                  |  |                                    [Delete Project]       | |
|                  |  +----------------------------------------------------------+ |
+------------------+---------------------------------------------------------------+
```

### 3.4 Settings Navigation Sidebar Component

```
+----------------------+
| < Back to Dashboard  |
|                      |
| ACCOUNT              |
| +------------------+ |
| | (o) Profile      | |  <- Active state: bg-ui-bg-soft, text-brand
| +------------------+ |
|   Preferences        |
|   Notifications      |
|                      |
| SECURITY             |
|   Password           |
|   Sessions           |
|   API Keys           |
|                      |
| INTEGRATIONS         |
|   Connected Apps     |
|   Webhooks           |
|                      |
| ADVANCED             |
|   Data Export        |
|   * Delete Account   |  <- Red text for danger
|                      |
+----------------------+
```

---

## 4. Functionality Breakdown

### 4.1 Profile Settings

- [ ] Avatar upload/change with preview
- [ ] Name editing with validation (min 2 chars)
- [ ] Email display (read-only, verified badge)
- [ ] Display name for public-facing contexts
- [ ] Bio/description field (optional)
- [ ] Save/discard changes with unsaved indicator

### 4.2 Notification Settings

- [ ] Email notification toggles:
  - Issue assigned
  - Issue status change
  - Comments and mentions
  - Document updates
  - Sprint start/end
  - Due date reminders
- [ ] Push notification toggle (with permission request)
- [ ] Notification digest options (immediate, daily, weekly)

### 4.3 API Keys Management

- [ ] Generate new API key with name
- [ ] List existing keys (masked, show last 4 chars)
- [ ] Copy key to clipboard (one-time reveal)
- [ ] Revoke/delete key with confirmation
- [ ] Key creation date and last used timestamp

### 4.4 Project Settings

- [ ] Edit project name with validation
- [ ] Edit project key (with migration warning)
- [ ] Edit description
- [ ] Configure workflow states
- [ ] Manage custom labels
- [ ] Member management with role changes
- [ ] Archive project with confirmation
- [ ] Delete project with type-to-confirm

### 4.5 Form Validation

- [ ] Real-time validation on blur
- [ ] Inline error messages below fields
- [ ] Disabled submit until valid
- [ ] Error shake animation on submit failure
- [ ] Success toast on save

### 4.6 Save State Management

- [ ] Track dirty form state
- [ ] Show "Unsaved changes" indicator
- [ ] Prompt before navigation if unsaved
- [ ] Optimistic UI with rollback on error

---

## 5. Component Inventory

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| SettingsNav | Horizontal tabs | Vertical grouped sidebar | New component needed |
| SettingsSection | Basic card | Card with subtle bg, clear header | Enhance existing |
| FormField | Basic input | Input with label, description, error | Enhance existing |
| Toggle | Checkbox | Animated switch | Use shadcn Switch |
| Avatar | Basic circle | Circle with upload overlay on hover | Enhance existing |
| MemberRow | Basic flex | Card-style with clear role indicator | Enhance existing |
| DangerZone | None | Red-bordered section with warnings | New component |
| SaveBar | None | Sticky bottom bar when dirty | New component |
| NotificationRow | None | Toggle with label and description | New component |
| APIKeyRow | None | Masked key with copy/revoke actions | New component |

### 5.1 Component Details

**SettingsNav** (New):
```
Props:
- items: { group: string, items: { label, href, icon, danger? }[] }[]
- backLink: { label, href }
- currentPath: string
```

**SettingsSection** (Enhanced):
```
Props:
- title: string
- description?: string
- action?: { label, onClick } | ReactNode
- children: ReactNode
- danger?: boolean (for danger zone styling)
```

**SaveBar** (New):
```
Props:
- isDirty: boolean
- isSaving: boolean
- onSave: () => void
- onDiscard: () => void
```

---

## 6. Design Tokens Used

### 6.1 Colors

| Usage | Token | Notes |
|-------|-------|-------|
| Settings sidebar bg | `bg-ui-bg` | Matches main sidebar |
| Active nav item | `bg-brand/10` + `text-brand` | Subtle brand highlight |
| Section card bg | `bg-ui-bg-soft` | Slightly elevated |
| Section card border | `border-ui-border-subtle` | Near-invisible default |
| Danger zone border | `border-status-error` | Red border |
| Danger text | `text-status-error` | Red for destructive |
| Form label | `text-ui-text-secondary` | Muted label |
| Form input bg | `bg-ui-bg` | Clean input background |
| Form input border | `border-ui-border` | Standard border |
| Form input focus | `ring-brand` | Brand focus ring |
| Error text | `text-status-error` | Validation errors |
| Success toast | `bg-status-success` | Save confirmation |

### 6.2 Typography

| Element | Token/Class | Specs |
|---------|-------------|-------|
| Page title | `text-xl font-semibold` | 20px, 600 weight |
| Page subtitle | `text-sm text-ui-text-muted` | 14px, muted |
| Section title | `text-base font-medium` | 16px, 500 weight |
| Form label | `text-sm font-medium` | 14px, 500 weight |
| Form description | `text-xs text-ui-text-muted` | 12px, muted |
| Nav group label | `text-xs font-semibold uppercase tracking-wide` | Category headers |
| Nav item | `text-sm` | 14px, normal |

### 6.3 Spacing

| Element | Token | Value |
|---------|-------|-------|
| Settings sidebar width | `w-56` | 224px |
| Nav item padding | `px-3 py-2` | 12px / 8px |
| Section padding | `p-6` | 24px |
| Section gap | `gap-6` | 24px between sections |
| Form field gap | `gap-4` | 16px between fields |
| Label to input gap | `gap-1.5` | 6px |

### 6.4 Shadows & Effects

| Element | Token | Notes |
|---------|-------|-------|
| Section card | No shadow | Flat design |
| Input focus | `ring-2 ring-brand/20` | Subtle brand ring |
| Toggle track | `shadow-inner` | Inset effect |
| Save bar | `shadow-lg` | Elevated sticky bar |

---

## 7. Animations

### 7.1 Navigation Transitions

```css
/* Nav item hover */
.settings-nav-item {
  transition: background-color 150ms ease, color 150ms ease;
}

/* Active indicator slide */
.settings-nav-indicator {
  transition: transform 200ms ease-out, opacity 150ms ease;
}
```

### 7.2 Toggle Switch Animation

```css
/* Toggle track */
.toggle-track {
  transition: background-color 200ms ease;
}

/* Toggle thumb */
.toggle-thumb {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ON state */
.toggle-thumb[data-state="checked"] {
  transform: translateX(18px);
}
```

### 7.3 Save Bar Animation

```css
/* Slide up when dirty */
@keyframes saveBarEnter {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.save-bar {
  animation: saveBarEnter 200ms ease-out;
}
```

### 7.4 Form Validation Animations

```css
/* Error shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.input-error {
  animation: shake 400ms ease;
}

/* Error message fade in */
@keyframes errorFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-message {
  animation: errorFadeIn 150ms ease-out;
}
```

### 7.5 Success Feedback

```css
/* Checkmark scale in */
@keyframes checkmarkIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-checkmark {
  animation: checkmarkIn 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 7.6 Section Card Hover (Optional)

```css
.settings-section {
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.settings-section:hover {
  border-color: var(--color-ui-border);
}
```

---

## 8. Implementation Checklist

### Phase 1: Navigation Refactor

- [ ] Create `SettingsNav` component with grouped items
- [ ] Add back link with icon
- [ ] Implement active state indicator
- [ ] Add nav item icons
- [ ] Create danger item variant (red text)
- [ ] Update settings routes to use sidebar layout

### Phase 2: Section Cards

- [ ] Create `SettingsSection` component
- [ ] Add title and optional description
- [ ] Add optional action slot (button or custom)
- [ ] Create danger zone variant
- [ ] Apply subtle background and border

### Phase 3: Form Improvements

- [ ] Enhance `FormField` with description text
- [ ] Add inline error display
- [ ] Implement error shake animation
- [ ] Add focus ring styling
- [ ] Create loading state for inputs

### Phase 4: Toggle Switches

- [ ] Replace checkboxes with shadcn Switch
- [ ] Add custom styling to match design
- [ ] Implement smooth thumb animation
- [ ] Add disabled state styling

### Phase 5: Save State Management

- [ ] Create `SaveBar` component
- [ ] Implement dirty state tracking hook
- [ ] Add slide-up animation
- [ ] Add save/discard functionality
- [ ] Add navigation prompt for unsaved changes

### Phase 6: Profile Settings Polish

- [ ] Add avatar hover overlay for change action
- [ ] Implement avatar upload flow
- [ ] Add verified badge to email
- [ ] Display activity stats with hover states
- [ ] Connect to real data

### Phase 7: Notification Settings

- [ ] Create `NotificationRow` component
- [ ] Implement all notification toggles
- [ ] Add notification category grouping
- [ ] Connect to backend preferences

### Phase 8: API Keys Management

- [ ] Create `APIKeyRow` component
- [ ] Add generate key dialog
- [ ] Implement copy-to-clipboard
- [ ] Add revoke confirmation
- [ ] Show last used timestamp

### Phase 9: Project Settings Polish

- [ ] Add workflow state editor
- [ ] Add label management
- [ ] Improve member list design
- [ ] Add danger zone section
- [ ] Implement archive/delete flows

### Phase 10: Workspace & Team Settings

- [ ] Design workspace settings form
- [ ] Add workspace member management
- [ ] Design team settings form
- [ ] Add team member management
- [ ] Implement coming soon placeholders with ETA

---

## 9. Responsive Behavior

### Desktop (1200px+)
- Sidebar visible at 224px width
- Content area fills remaining space
- Form fields at comfortable width (max 600px)

### Tablet (768px - 1199px)
- Sidebar collapses to icons only
- Hover/click expands to show labels
- Content area expands

### Mobile (< 768px)
- Sidebar becomes horizontal tab bar or bottom sheet
- Full-width form fields
- Save bar becomes full-width bottom sticky

---

## 10. Accessibility Considerations

- [ ] All form fields have associated labels
- [ ] Error messages linked with `aria-describedby`
- [ ] Toggle switches have proper ARIA attributes
- [ ] Navigation uses `role="navigation"` with `aria-label`
- [ ] Active nav item has `aria-current="page"`
- [ ] Danger actions have `aria-label` describing consequences
- [ ] Save bar announced when appearing (live region)
- [ ] Focus management when switching tabs
- [ ] Keyboard navigation through all interactive elements

---

*Last Updated: 2026-02-05*
*Source Analysis: Mintlify settings-domain-setup.png, Nixelo e2e screenshots*
