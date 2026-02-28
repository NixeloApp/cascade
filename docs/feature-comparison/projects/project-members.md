# Project Members

## Overview
Project member management allows adding, removing, and configuring access for team members. This includes role assignment, invitations, and permission control.

---

## cal.com
> **N/A** - cal.com handles team members at the organization level, not project level.

---

## plane

### Trigger
- **Settings**: Project > Settings > Members
- **Header**: Member avatars with manage option
- **Invite modal**: Direct invite button

### UI Elements

**Member List (member-list.tsx)**
- Table layout with columns
- Sortable headers

| Column | Content |
|--------|---------|
| User | Avatar + name + email |
| Role | Dropdown selector |
| Joined | Formatted date |
| Actions | Remove button |

**Member List Item (member-list-item.tsx)**
- Avatar with hover card
- Role dropdown (inline change)
- Remove button (with confirmation)

**Member Header Column (member-header-column.tsx)**
- Column headers for sorting
- Sort direction indicators

**Send Invitation Modal (send-project-invitation-modal.tsx)**
- Email input field
- Role selector
- Message field (optional)
- Bulk invite support

**Role Options**
| Role | Permissions |
|------|-------------|
| Admin | Full access + settings |
| Member | Create, edit, delete issues |
| Guest | View only, limited actions |

### Flow

**Inviting Members**
1. Click "Invite" button
2. Modal opens
3. Enter email address(es)
4. Select role
5. Optional: Add message
6. Click Send Invitation
7. Email sent to invitee
8. Pending invites shown

**Changing Role**
1. Find member in list
2. Click role dropdown
3. Select new role
4. Changes immediately
5. Toast confirms

**Removing Member**
1. Click remove/trash on member row
2. Confirmation modal appears
3. Confirm removal
4. Member loses access
5. Toast confirms

### Feedback
- **Invite pending**: Shows pending state
- **Role change**: Immediate update
- **Remove**: Confirmation required
- **Success**: Toast notifications

### Notable Features
- **Bulk invite**: Multiple emails at once
- **Role dropdown**: Inline role changes
- **Pending invites**: Track unaccepted invitations
- **Leave project**: Self-removal option
- **Join requests**: For public projects

---

## Cascade

### Trigger
- **Settings**: Project Settings > Members tab
- **Direct navigation**: Member management section

### UI Elements

**MemberManagement Component**

**Header Section**
- Title: "Members"
- Count: "{N} member(s) with access"
- "Add Member" button

**Add Member Form (inline expandable)**
| Field | Type | Notes |
|-------|------|-------|
| Email Address | Email input | Required |
| Role | Select dropdown | Admin/Editor/Viewer |

**Member List**
- Card layout per member
- Avatar + name + email
- Owner badge for project creator
- Role selector (for non-owners)
- Remove button (for non-owners)

**Role Options**
| Role | Description |
|------|-------------|
| Admin | Full project access |
| Editor | Create and edit issues |
| Viewer | Read-only access |

**Member Card Display**
```
[Avatar] [Name]      [Owner badge]
         [Email]     [Role select] [Remove]
```

### Flow

**Adding Member**
1. Click "Add Member" button
2. Inline form expands
3. Enter email address
4. Select role
5. Click "Add Member"
6. Success toast
7. Form collapses, member appears

**Changing Role**
1. Find member in list
2. Select new role from dropdown
3. Changes save immediately
4. Toast confirms

**Removing Member**
1. Click "Remove" button
2. Confirmation dialog appears
3. Shows member name and impact message
4. Click "Remove"
5. Member removed
6. Toast confirms

### Feedback
- **Loading states**: Button spinners
- **Success**: Toast messages
- **Errors**: Error toasts with details
- **Confirmation**: Required for removal

### Code Structure
```typescript
// Add member
addMember({
  projectId: Id<"projects">,
  userEmail: string,
  role: "admin" | "editor" | "viewer",
})

// Update role
updateMemberRole({
  projectId: Id<"projects">,
  memberId: Id<"users">,
  newRole: "admin" | "editor" | "viewer",
})

// Remove member
removeMember({
  projectId: Id<"projects">,
  memberId: Id<"users">,
})
```

### Notable Features
- **Inline add form**: Expandable without modal
- **Owner protection**: Can't remove/change owner
- **Clear role badges**: Visual role indication
- **Confirmation dialogs**: Safe removal

---

## Comparison Table

| Aspect | cal.com | plane | Cascade | Best |
|--------|---------|-------|---------|------|
| Member list | N/A | ✅ Table view | ✅ Card view | tie |
| Add by email | N/A | ✅ Yes | ✅ Yes | tie |
| Bulk invite | N/A | ✅ Multiple emails | ❌ Single | plane |
| Invite message | N/A | ✅ Custom message | ❌ No | plane |
| Pending invites | N/A | ✅ Shown | ❌ No | plane |
| Inline role change | N/A | ✅ Yes | ✅ Yes | tie |
| Role options | N/A | ✅ Admin/Member/Guest | ✅ Admin/Editor/Viewer | tie |
| Owner indicator | N/A | ⚠️ Via role | ✅ Badge | Cascade |
| Owner protection | N/A | ✅ Yes | ✅ Yes | tie |
| Remove member | N/A | ✅ With confirm | ✅ With confirm | tie |
| Leave project | N/A | ✅ Separate modal | ❌ No | plane |
| Join requests | N/A | ✅ For public | ❌ No | plane |
| Inline add form | N/A | ❌ Modal | ✅ Expandable | Cascade |
| Avatar display | N/A | ✅ Yes | ✅ Yes | tie |
| Sortable columns | N/A | ✅ Yes | ❌ No | plane |
| Joined date | N/A | ✅ Shown | ❌ Not shown | plane |

---

## Recommendations

### Priority 1: Add Bulk Invite
Allow inviting multiple members at once.

**Implementation:**
```typescript
// Parse comma-separated emails
const emails = input.split(',').map(e => e.trim());
await Promise.all(emails.map(email => 
  addMember({ projectId, userEmail: email, role })
));
```

### Priority 2: Add Pending Invitations View
Show invitations that haven't been accepted yet.

**Implementation:**
- Add `invitations` table
- Track: email, role, invited_at, status
- Show pending list with cancel option

### Priority 3: Add "Leave Project" Option
Allow members to remove themselves.

### Priority 4: Add Joined Date Display
Show when each member was added.

**Implementation:**
```typescript
// Already have addedAt in data
// Just display it
formatRelativeDate(member.addedAt) // "3 days ago"
```

### Priority 5: Add Sortable Columns
Allow sorting by name, role, or date added.

### Priority 6: Add Team/Group Assignment
Assign multiple members at once via team groups.

---

## Screenshots/References

### Plane Code Paths
- Member List: `~/Desktop/plane/apps/web/core/components/project/member-list.tsx`
- Member Item: `~/Desktop/plane/apps/web/core/components/project/member-list-item.tsx`
- Invitation Modal: `~/Desktop/plane/apps/web/core/components/project/send-project-invitation-modal.tsx`
- Leave Modal: `~/Desktop/plane/apps/web/core/components/project/leave-project-modal.tsx`
- Join Modal: `~/Desktop/plane/apps/web/core/components/project/join-project-modal.tsx`
- Confirm Remove: `~/Desktop/plane/apps/web/core/components/project/confirm-project-member-remove.tsx`

### Cascade Code Paths
- Member Management: `~/Desktop/cascade/src/components/ProjectSettings/MemberManagement.tsx`
- Projects API: `~/Desktop/cascade/convex/projects.ts` (addProjectMember, updateProjectMemberRole, removeProjectMember)
