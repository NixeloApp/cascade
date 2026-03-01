# Project Settings

## Overview
Project settings allow administrators to configure project properties, features, workflow states, and other options after project creation.

---

## cal.com
> **N/A** - cal.com is a scheduling platform and doesn't have project management features.

---

## plane

### Trigger
- **Sidebar**: Project > Settings
- **URL**: `/workspace/project/settings/general`

### UI Elements

**Settings Navigation**
- General
- Members
- Features
- States
- Labels
- Estimates
- Integrations
- Automations
- Exports
- Danger Zone

**General Settings (form.tsx)**
| Field | Type | Notes |
|-------|------|-------|
| Cover Image | Image picker | With live preview |
| Logo/Icon | Emoji picker | Material + emoji |
| Name | Text input | Required |
| Description | Textarea | Optional |
| Identifier | Text input | Uppercase, validated |
| Network | Dropdown | Private/Public/Secret |
| Timezone | Timezone select | Per-project |

**Features Toggle (project-feature-update.tsx)**
| Feature | Description |
|---------|-------------|
| Cycles | Enable/disable cycles |
| Modules | Enable/disable modules |
| Inbox | Enable issue inbox |
| Pages | Enable project pages |
| Is Deployed | Publish settings |

**States Settings**
- List of workflow states
- Create new state
- Edit state name/color
- Reorder states
- Delete states
- Default state selection

**Member Defaults (project-settings-member-defaults.tsx)**
- Default assignee rules
- Project lead selection

### Flow

**Editing Settings**
1. Navigate to Settings
2. Select settings category
3. Edit values
4. Click Update/Save
5. Changes apply immediately
6. Toast confirms save

### Feedback
- **Loading**: Form loader component
- **Save**: Button shows loading state
- **Success**: Toast notification
- **Error**: Toast with error message
- **Permission**: Disabled inputs for non-admins

### Notable Features
- **Tabbed organization**: Clear category separation
- **Feature toggles**: Enable/disable major features
- **State management**: Full workflow customization
- **Cover image editing**: Visual branding
- **Export options**: Download project data

---

## Cascade

### Trigger
- **Sidebar**: Project Settings button
- **URL**: `/project/:id/settings`

### UI Elements

**Settings Navigation (index.tsx)**
- Tab-based layout
- Tabs: General, Workflow, Labels, Members, Danger Zone

**General Settings (GeneralSettings.tsx)**

**View Mode**
| Field | Display |
|-------|---------|
| Project Name | Card with label |
| Project Key | Monospace display |
| Description | Text or "No description" |

**Edit Mode**
| Field | Type | Notes |
|-------|------|-------|
| Project Name | Text input | Required |
| Project Key | Display only | Cannot change after creation |
| Description | Textarea | Optional |

**Workflow Settings (WorkflowSettings.tsx)**
- List of workflow states
- Add state button
- Edit state names
- Category assignment (todo/inprogress/done)
- Reorder via drag? (implementation TBD)
- Delete states

**Danger Zone (DangerZone.tsx)**
- Archive Project
- Delete Project
- Both with confirmation dialogs

### Flow

**Editing General Settings**
1. Click "Edit" button
2. Form fields become editable
3. Make changes
4. Click "Save Changes"
5. Success toast
6. Returns to view mode

**Editing Workflow**
1. Navigate to Workflow tab
2. Add/edit/delete states
3. Changes save on action
4. Toast confirms

### Feedback
- **View/Edit toggle**: Clear mode distinction
- **Loading**: Button loading states
- **Success**: Toast notifications
- **Disabled fields**: Visual indication (greyed, helper text)

### Code Structure
```typescript
// General settings update
updateProject({
  projectId,
  name: string,
  description?: string,
})

// Note: Project key cannot be changed
```

### Notable Features
- **View/Edit toggle**: Prevents accidental edits
- **Read-only key**: Explicit that key cannot change
- **Tabbed layout**: Organized sections
- **Danger zone**: Separate destructive actions

---

## Comparison Table

| Aspect | cal.com | plane | Cascade | Best |
|--------|---------|-------|---------|------|
| Settings organization | N/A | ✅ Sidebar nav | ✅ Tabs | plane (more categories) |
| General settings | N/A | ✅ Yes | ✅ Yes | tie |
| Cover image | N/A | ✅ Editable | ❌ No | plane |
| Logo/Icon | N/A | ✅ Editable | ❌ No | plane |
| Identifier change | N/A | ✅ Yes | ❌ Read-only | Cascade (safer) |
| Network/Visibility | N/A | ✅ Yes | ❌ No | plane |
| Timezone | N/A | ✅ Yes | ❌ No | plane |
| Feature toggles | N/A | ✅ Yes | ❌ No | plane |
| Workflow states | N/A | ✅ Full UI | ✅ Yes | tie |
| Labels settings | N/A | ✅ Yes | ✅ Yes | tie |
| Estimates settings | N/A | ✅ Yes | ❌ No | plane |
| Member management | N/A | ✅ Yes | ✅ Yes | tie |
| Member roles | N/A | ✅ Roles | ✅ Admin/Editor/Viewer | tie |
| Default assignee | N/A | ✅ Rules | ❌ No | plane |
| Project lead | N/A | ✅ Yes | ❌ No | plane |
| Integrations | N/A | ✅ Yes | ❌ No | plane |
| Automations | N/A | ✅ Yes | ⚠️ Separate | plane |
| Export data | N/A | ✅ Yes | ❌ No | plane |
| Archive project | N/A | ✅ Yes | ✅ Yes | tie |
| Delete project | N/A | ✅ Yes | ✅ Yes | tie |
| View/Edit toggle | N/A | ❌ Always edit | ✅ Yes | Cascade |
| Permission checks | N/A | ✅ isAdmin | ⚠️ Unknown | plane |

---

## Recommendations

### Priority 1: Add Feature Toggles
Allow enabling/disabling major features per project.

**Features to toggle:**
- Sprints (Scrum vs Kanban mode)
- Documents/Pages
- Time tracking
- Calendar view

### Priority 2: Add Project Lead/Owner Assignment
Set a project lead with special permissions.

### Priority 3: Add Visibility/Network Settings
Allow changing project visibility after creation.

### Priority 4: Add Default Assignee Rules
Configure how issues are auto-assigned.

**Options:**
- Unassigned (default)
- Project lead
- Round-robin
- Based on issue type

### Priority 5: Add Data Export
Allow exporting project data (issues, comments, etc.).

**Formats:**
- CSV
- JSON
- PDF report

### Priority 6: Add Integrations Section
Placeholder for future integrations (GitHub, Slack, etc.).

---

## Screenshots/References

### Plane Code Paths
- Project Form: `~/Desktop/plane/apps/web/core/components/project/form.tsx`
- Feature Update: `~/Desktop/plane/apps/web/core/components/project/project-feature-update.tsx`
- Member Defaults: `~/Desktop/plane/apps/web/core/components/project/project-settings-member-defaults.tsx`
- Settings Directory: `~/Desktop/plane/apps/web/core/components/project/settings/`

### Cascade Code Paths
- Settings Index: `~/Desktop/cascade/src/components/ProjectSettings/index.tsx`
- General Settings: `~/Desktop/cascade/src/components/ProjectSettings/GeneralSettings.tsx`
- Workflow Settings: `~/Desktop/cascade/src/components/ProjectSettings/WorkflowSettings.tsx`
- Danger Zone: `~/Desktop/cascade/src/components/ProjectSettings/DangerZone.tsx`
- Member Management: `~/Desktop/cascade/src/components/ProjectSettings/MemberManagement.tsx`
