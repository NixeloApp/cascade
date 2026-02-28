# Create Project

## Overview
Project creation allows users to set up new workspaces for organizing issues. This includes naming, configuring workflow, setting access levels, and customizing project features.

---

## cal.com
> **N/A** - cal.com is a scheduling platform and doesn't have project management features.

---

## plane

### Trigger
- **Button**: "Create project" in workspace sidebar
- **Keyboard**: Unknown
- **Empty state**: CTA when no projects exist

### UI Elements

**Create Project Modal (create-project-modal.tsx)**
- Simple wrapper modal
- Contains project form component

**Project Form (form.tsx) - Used for Create & Edit**
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Cover Image | Image picker | Optional | With gradient overlay |
| Logo/Icon | Emoji picker | Optional | Material icons or emoji |
| Name | Text input | Required, max 255 chars | |
| Description | Textarea | Optional | Min height 102px |
| Identifier | Text input | Required, 1-10 chars, uppercase | Auto-generated from name |
| Network | Select | Required | Private, Public, or Secret |
| Timezone | Timezone select | Required | For date calculations |

**Additional Setup (from create directory)**
- Feature toggles (cycles, modules, etc.)
- Lead assignment
- Default assignee rules

### Flow

**Quick Create**
1. Click "Create project" button
2. Modal opens with form
3. Enter project name (identifier auto-generates)
4. Select visibility/network
5. Click Create
6. Project created, redirects to project

**Full Setup**
1. Modal opens
2. Fill basic info
3. Configure features (cycles, modules enabled)
4. Set up member defaults
5. Create project

### Feedback
- **Validation**: Inline errors for name, identifier
- **Duplicate check**: API validates identifier uniqueness
- **Success**: Redirect to new project
- **Error**: Toast with error details

### Notable Features
- **Identifier check**: Validates uniqueness before save
- **Network options**: Private (team only), Public (anyone can view), Secret
- **Cover image**: Visual branding for project
- **Emoji/Icon picker**: Custom project logos
- **Timezone aware**: Per-project timezone settings

---

## Cascade

### Trigger
- **Onboarding wizard**: First-run project setup
- **Button**: "Create Project" in sidebar/dashboard
- **Template**: Create from template option

### UI Elements

**ProjectWizard Component (4-step wizard)**

**Step 1: Basic Info**
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Project Name | Text input | Required | Auto-generates key |
| Project Key | Text input | Required, 2-10 chars, uppercase | For issue prefixes |
| Description | Textarea | Optional | |

**Step 2: Board Type**
- **Kanban**: Continuous flow
  - No time constraints
  - Visualize workflow
  - Limit work in progress
- **Scrum**: Sprint-based
  - Sprint planning
  - Velocity tracking
  - Burndown charts

**Step 3: Workflow States**
- Default: To Do, In Progress, Done
- Editable state names
- Add custom states
- Category badges (todo/inprogress/done)

**Step 4: Summary**
- Review all settings
- Create button

**Progress Indicator**
- 4-step progress bar
- Percentage complete (25%, 50%, 75%, 100%)
- Checkmarks for completed steps

### Flow

**Wizard Flow**
1. Open create project dialog
2. Step 1: Enter name, key auto-generates
3. Click Next (validates inputs)
4. Step 2: Select Kanban or Scrum
5. Click Next
6. Step 3: Customize workflow states
7. Click Next
8. Step 4: Review and click "Create Project"
9. Success toast, callback with projectId

### Feedback
- **Step validation**: Prevents advancing with invalid data
- **Error toasts**: Inline validation messages
- **Progress**: Visual step indicator
- **Success**: Toast + callback for navigation

### Code Structure
```typescript
interface ProjectCreate {
  name: string;
  key: string;
  description?: string;
  isPublic: boolean;
  boardType: "kanban" | "scrum";
  workflowStates: WorkflowState[];
  organizationId: Id<"organizations">;
  workspaceId: Id<"workspaces">;
}
```

### Notable Features
- **Step-by-step wizard**: Guided onboarding experience
- **Board type choice**: Kanban vs Scrum methodology
- **Workflow customization**: Define states during creation
- **Key generation**: Auto-generates from project name
- **Template support**: Create from templates (separate component)

---

## Comparison Table

| Aspect | cal.com | plane | Cascade | Best |
|--------|---------|-------|---------|------|
| Create modal | N/A | ✅ Simple form | ✅ Multi-step wizard | Cascade (guided) |
| Project name | N/A | ✅ Yes | ✅ Yes | tie |
| Identifier/Key | N/A | ✅ Auto-generate | ✅ Auto-generate | tie |
| Identifier validation | N/A | ✅ API uniqueness check | ⚠️ Format only | plane |
| Description | N/A | ✅ Yes | ✅ Yes | tie |
| Cover image | N/A | ✅ Yes | ❌ No | plane |
| Logo/Icon picker | N/A | ✅ Emoji + icons | ❌ No | plane |
| Visibility settings | N/A | ✅ 3 options | ⚠️ isPublic only | plane |
| Timezone | N/A | ✅ Per-project | ❌ No | plane |
| Board type selection | N/A | ⚠️ Feature toggles | ✅ Kanban/Scrum | Cascade |
| Workflow setup | N/A | ⚠️ After creation | ✅ During creation | Cascade |
| Progress indicator | N/A | ❌ No | ✅ Yes | Cascade |
| Template support | N/A | ⚠️ Unknown | ✅ Yes | Cascade |
| Lead assignment | N/A | ✅ Yes | ❌ No | plane |
| Default assignee | N/A | ✅ Rules | ❌ No | plane |

---

## Recommendations

### Priority 1: Add Cover Image Support
Allow projects to have a cover image for visual branding.

**Implementation:**
- Add cover_image field to projects table
- Image picker component (similar to Plane)
- Display in project header/cards

### Priority 2: Add Emoji/Icon Picker for Logo
Let users choose an emoji or icon as project logo.

### Priority 3: Add Project Identifier Uniqueness Check
Validate identifier doesn't conflict before creation.

```typescript
// Before create
const existing = await ctx.db.query("projects")
  .withIndex("by_org_key", q => 
    q.eq("organizationId", orgId).eq("key", key))
  .first();
if (existing) throw new Error("Project key already exists");
```

### Priority 4: Add Timezone Setting
Per-project timezone for date displays and calculations.

### Priority 5: Add Visibility Options
- Private: Organization members only
- Public: Anyone with link can view
- Secret: Invite-only

### Priority 6: Add Lead/Owner Assignment
Assign project lead during creation.

---

## Screenshots/References

### Plane Code Paths
- Create Modal: `~/Desktop/plane/apps/web/core/components/project/create-project-modal.tsx`
- Project Form: `~/Desktop/plane/apps/web/core/components/project/form.tsx`
- Create Components: `~/Desktop/plane/apps/web/core/components/project/create/`

### Cascade Code Paths
- Project Wizard: `~/Desktop/cascade/src/components/Onboarding/ProjectWizard.tsx`
- Create from Template: `~/Desktop/cascade/src/components/CreateProjectFromTemplate.tsx`
- Projects API: `~/Desktop/cascade/convex/projects.ts`
