# Workspace Settings

## Overview

Workspace settings allow administrators to configure organization-wide preferences, manage members, handle billing, and control exports. This includes project-level settings for individual project configuration.

---

## plane

### Trigger

- **Icon**: Gear icon in workspace sidebar
- **Location**: Workspace → Settings
- **URL**: `/:workspaceSlug/settings/`

### UI Elements

**Layout**: Settings sidebar with categories

**Workspace Settings Categories** (2 categories, 5 tabs):

**Administration Category:**
1. General
2. Members
3. Billing & Plans
4. Exports

**Developer Category:**
5. Webhooks

### General Settings

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Workspace Name | Text | Yes | Max 80 chars |
| Logo | Image upload | No | Modal with upload/delete |
| Organization Size | Dropdown | No | 2-10, 10-50, 50-100, etc. |
| Timezone | Dropdown | No | TimezoneSelect |
| URL | Text (readonly) | - | Copy to clipboard |

**Additional Actions**:
- Delete workspace (admin only)
- Copy workspace URL

**Access Control**:
- ADMIN: Full edit access
- MEMBER: Read-only

### Members Settings

**Features**:
- List all workspace members
- Search by name/email
- Filter by role (Admin, Member, Guest)
- Invite new members (bulk modal)
- Pending invitations section (collapsible)
- Manage member roles
- Remove members

**Role System** (`EUserWorkspaceRoles`):
| Role | Value | Permissions |
|------|-------|-------------|
| ADMIN | 20 | Full workspace control |
| MEMBER | 15 | Standard access |
| GUEST | 5 | Limited access |

**Access Control**:
- ADMIN: Invite, manage roles, remove
- MEMBER: View, search only

### Billing & Plans

- Subscription management
- Plan selection
- Payment information
- Admin only access

### Exports

- Data export options
- Export guides
- Available to ADMIN and MEMBER

### Webhooks (Developer)

**Location**: `/settings/webhooks/`

**Create Webhook Form**:
| Field | Type | Description |
|-------|------|-------------|
| URL | Text | Webhook endpoint |
| is_active | Toggle | Enable/disable |
| Event Mode | Radio | "all" or "individual" |

**Available Events** (individual mode):
- project
- cycle
- module
- issue
- issue_comment

**Features**:
- Create webhook (modal)
- List all webhooks
- Edit settings
- Delete webhook
- View secret key (one-time display)

**Secret Key**:
- Generated on creation
- Used for HMAC validation
- Displayed once, then hidden

### Data Model

```typescript
// IWorkspace
{
  id: string
  name: string
  slug: string (readonly)
  logo_url: string | null
  organization_size: string
  timezone: string
  owner: IUser
  total_members: number
  role: number
}

// IWorkspaceMember
{
  id: string
  member: IUserLite
  role: TUserPermissions
  is_active: boolean
  email, first_name, last_name
  joining_date, last_login_medium
}
```

---

## Cascade

### Workspace/Organization Structure

Cascade has a three-tier hierarchy:
1. **Organization**: Top-level container
2. **Workspace**: Division within organization
3. **Project**: Work container within workspace

### Organization Settings

**Trigger**: Admin tab in settings (organization admins only)

**Location**: `/:orgSlug/settings` → Admin tab

**Configuration Fields**:
| Field | Type | Description |
|-------|------|-------------|
| Name | Text | Organization name |
| Default Max Hours/Week | Number | Compliance limit |
| Default Max Hours/Day | Number | Daily limit |
| Requires Time Approval | Toggle | Time entry approvals |
| Billing Enabled | Toggle | Enable billing features |

### Admin-Only Features

**User Management**:
- Manage organization members
- Assign roles and permissions
- IP restrictions
- Hour compliance dashboard
- User type configuration
- SSO settings (SAML/OIDC)

### Workspace Settings

**Status**: Currently "Coming Soon" placeholder

**Planned Features**:
- Permissions
- Integrations
- Preferences

### Team Settings

**Status**: Currently "Coming Soon" placeholder

**Planned Features**:
- Member management
- Roles
- Permissions

### Project Settings

**Trigger**: Settings icon in project header

**Location**: `/:orgSlug/projects/:key/settings`

**Access Control**:
- Admin/Owner: Full access
- Non-admins: Redirected to board

**Sections**:

#### 1. General Settings

| Field | Type | Editable |
|-------|------|----------|
| Name | Text | Yes |
| Project Key | Text | No (immutable) |
| Description | Textarea | Yes |

**UI Pattern**: Toggle between view and edit modes

#### 2. Member Management

**Display**:
- Avatar
- Name
- Email
- Role (Admin/Editor/Viewer)
- Owner badge

**Actions**:
- Add member (email + role)
- Change role (dropdown)
- Remove member (confirmation)

**Roles**:
| Role | Color | Permissions |
|------|-------|-------------|
| Admin | Primary | Full project control |
| Editor | Secondary | Edit issues/docs |
| Viewer | Neutral | Read-only |

#### 3. Workflow Settings

**Workflow States**:
| Property | Type | Description |
|----------|------|-------------|
| name | String | Display name |
| category | Enum | todo/inprogress/done |
| order | Number | Position |
| wipLimit | Number | WIP limit (optional) |

**Validation**:
- All states must have names
- At least one state per category
- Category-based color coding

#### 4. Danger Zone

- Delete project (soft delete)
- Type project key to confirm
- Owner only
- Cascades to issues, sprints

### API Keys (Settings Tab)

**Features**:
- Generate keys (`sk_casc_*` format)
- Scoped permissions
- Rate limiting config
- Usage statistics
- Key rotation
- Expiration dates
- Project-specific or global

**Available Scopes**:
- `issues:read`, `issues:write`, `issues:delete`
- `projects:read`, `projects:write`
- `comments:read`, `comments:write`
- `documents:read`, `documents:write`
- `search:read`

**Role-Based Restrictions**:
| Role | Available Scopes |
|------|------------------|
| Admin | All scopes |
| Editor | All except delete |
| Viewer | Read-only |
| Global | Read-only |

### Data Model

```typescript
// projects
{
  name: string
  key: string
  description: optional<string>
  boardType: "kanban" | "scrum"
  members: array<{
    userId: id<"users">
    role: "admin" | "editor" | "viewer"
    addedAt: number
  }>
  workflowStates: array<{
    id: string
    name: string
    category: "todo" | "inprogress" | "done"
    order: number
    wipLimit: optional<number>
  }>
  createdBy: id<"users">
  ownerId: id<"users">
  organizationId: id<"organizations">
  workspaceId: id<"workspaces">
}
```

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Workspace settings | Full feature | Coming soon | plane |
| Organization settings | Via workspace | Dedicated admin | Cascade |
| Project settings | Yes | Yes | tie |
| Logo upload | Yes (modal) | Coming soon | plane |
| Organization size | Yes | No | plane |
| Timezone (workspace) | Yes | Coming soon | plane |
| Member management | Yes | Yes (project-level) | plane |
| Bulk invite | Yes (modal) | No | plane |
| Role system | 3 roles | 3 roles | tie |
| Pending invitations | Yes | No | plane |
| Billing settings | Yes | Yes | tie |
| Data exports | Yes | No | plane |
| Webhooks | Yes | Yes (Pumble) | tie |
| Custom workflows | Yes (project) | Yes (project) | tie |
| WIP limits | No | Yes | Cascade |
| API keys | User-level | User + project scope | Cascade |
| Key rotation | No | Yes | Cascade |
| Usage stats (keys) | No | Yes | Cascade |
| Hour compliance | No | Yes (admin) | Cascade |
| SSO settings | Via instance | Per-org config | Cascade |
| IP restrictions | No | Yes (admin) | Cascade |

---

## Recommendations

1. **Priority 1**: Implement workspace settings
   - Currently placeholder
   - Add name, logo, timezone config
   - Member management at workspace level

2. **Priority 2**: Add bulk member invite
   - Modal for multiple emails
   - Role assignment per invite
   - CSV import option

3. **Priority 3**: Add pending invitations view
   - List sent invitations
   - Resend/cancel options
   - Expiration tracking

4. **Priority 4**: Add data export
   - Export issues, projects, docs
   - Multiple formats (CSV, JSON)
   - Scheduled exports

5. **Priority 5**: Add organization size field
   - Useful for analytics
   - Plan recommendations
   - Feature suggestions

---

## Cascade Strengths

1. **API Key Scoping**: Project-specific keys with granular permissions
2. **Key Rotation**: Secure key management with rotation support
3. **Usage Statistics**: Track API key usage and activity
4. **WIP Limits**: Workflow states with work-in-progress limits
5. **Hour Compliance**: Time tracking limits and approvals
6. **IP Restrictions**: Security controls at org level
7. **SSO Configuration**: Per-organization SAML/OIDC

---

## Implementation: Workspace Settings

```tsx
// Route: /:orgSlug/workspaces/:workspaceSlug/settings
function WorkspaceSettings() {
  const { workspace } = useWorkspace();
  const updateWorkspace = useMutation(api.workspaces.update);

  const [name, setName] = useState(workspace?.name ?? "");
  const [timezone, setTimezone] = useState(workspace?.timezone ?? "UTC");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    await updateWorkspace({
      workspaceId: workspace._id,
      name: name.trim(),
      timezone,
    });
    setIsEditing(false);
    showSuccess("Workspace updated");
  };

  return (
    <Card>
      <CardHeader>
        <Flex justify="between" align="center">
          <Typography variant="h3">Workspace Settings</Typography>
          {!isEditing && (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </Flex>
      </CardHeader>

      <CardContent>
        <Stack gap="4">
          <Flex direction="column" gap="1">
            <Typography variant="label">Workspace Name</Typography>
            {isEditing ? (
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Workspace name"
              />
            ) : (
              <Typography>{workspace?.name}</Typography>
            )}
          </Flex>

          <Flex direction="column" gap="1">
            <Typography variant="label">Timezone</Typography>
            {isEditing ? (
              <TimezoneSelect
                value={timezone}
                onChange={setTimezone}
              />
            ) : (
              <Typography>{workspace?.timezone ?? "UTC"}</Typography>
            )}
          </Flex>

          <Flex direction="column" gap="1">
            <Typography variant="label">URL</Typography>
            <Flex gap="2" align="center">
              <Typography variant="mono">
                {window.location.origin}/{orgSlug}/workspaces/{workspace?.slug}
              </Typography>
              <Button variant="ghost" size="sm" onClick={copyUrl}>
                <Copy className="size-4" />
              </Button>
            </Flex>
          </Flex>
        </Stack>

        {isEditing && (
          <Flex gap="2" className="mt-4">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </Flex>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Implementation: Bulk Member Invite

```typescript
// Convex mutation
export const bulkInviteMembers = mutation({
  args: {
    projectId: v.id("projects"),
    invites: v.array(v.object({
      email: v.string(),
      role: v.union(
        v.literal("admin"),
        v.literal("editor"),
        v.literal("viewer")
      ),
    })),
  },
  returns: v.object({
    success: v.number(),
    failed: v.array(v.object({
      email: v.string(),
      reason: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check admin permission
    const isAdmin = project.members.some(
      m => m.userId === userId && m.role === "admin"
    );
    if (!isAdmin) throw new Error("Admin access required");

    const results = { success: 0, failed: [] };

    for (const invite of args.invites) {
      try {
        // Find or create user by email
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", q => q.eq("email", invite.email))
          .first();

        if (!user) {
          // Send invitation email
          await sendInviteEmail(ctx, invite.email, project);
          results.success++;
          continue;
        }

        // Check org membership
        const isMember = await isOrganizationMember(
          ctx,
          project.organizationId,
          user._id
        );
        if (!isMember) {
          results.failed.push({
            email: invite.email,
            reason: "Not an organization member",
          });
          continue;
        }

        // Add to project
        await ctx.db.patch(args.projectId, {
          members: [
            ...project.members,
            {
              userId: user._id,
              role: invite.role,
              addedAt: Date.now(),
            },
          ],
        });

        results.success++;
      } catch (error) {
        results.failed.push({
          email: invite.email,
          reason: error.message,
        });
      }
    }

    return results;
  },
});
```

---

## Screenshots/References

### plane
- Workspace details: `~/Desktop/plane/apps/web/core/components/workspace/settings/workspace-details.tsx`
- Members: `~/Desktop/plane/apps/web/app/[workspaceSlug]/(settings)/settings/(workspace)/members/page.tsx`
- Webhooks: `~/Desktop/plane/apps/web/app/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/`
- Billing: `~/Desktop/plane/apps/web/app/[workspaceSlug]/(settings)/settings/(workspace)/billing/`

### Cascade
- Project settings: `~/Desktop/cascade/src/components/ProjectSettings/index.tsx`
- General settings: `~/Desktop/cascade/src/components/ProjectSettings/GeneralSettings.tsx`
- Member management: `~/Desktop/cascade/src/components/ProjectSettings/MemberManagement.tsx`
- Workflow settings: `~/Desktop/cascade/src/components/ProjectSettings/WorkflowSettings.tsx`
- API keys: `~/Desktop/cascade/src/components/Settings/ApiKeysManager.tsx`
- Admin settings: `~/Desktop/cascade/src/components/Admin/OrganizationSettings.tsx`
