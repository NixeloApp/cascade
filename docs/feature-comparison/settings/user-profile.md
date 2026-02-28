# User Profile

## Overview

User profile settings allow users to manage their personal information, appearance preferences, security settings, and account details. A well-designed profile page provides control over identity and experience.

---

## plane

### Trigger

- **Icon**: User avatar in sidebar
- **Location**: Settings → Profile
- **URL**: `/settings/profile/[profileTabId]`

### UI Elements

**Layout**: Settings sidebar with content area

**Profile Tabs** (6 sections in 2 categories):

**Your Profile Category:**
1. General
2. Preferences
3. Notifications
4. Security
5. Activity

**Developer Category:**
6. API Tokens

### Profile Fields (General Tab)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| First Name | Text | Yes | Max 24 chars |
| Last Name | Text | No | Max 24 chars |
| Display Name | Text | Yes | 1-20 non-whitespace chars |
| Email | Text (readonly) | Yes | Change via modal |
| Avatar | Image upload | No | Modal with upload |
| Cover Image | Image selector | No | Preset picker |
| Role/Title | Text | No | Free text |

### Avatar Upload

**Modal**: `UserImageUploadModal`
- File upload with drag-drop
- Preview before save
- Delete option
- Asset type tracking

### Preferences Tab

| Setting | Type | Description |
|---------|------|-------------|
| Language | Dropdown | SUPPORTED_LANGUAGES list |
| Timezone | Dropdown | TimezoneSelect component |
| First Day of Week | Dropdown | StartOfWeekPreference |

### Security Tab

- **Change Password**: Old password + new password + confirm
- **Password Strength**: Visual indicator
- **Show/Hide Toggle**: For each password field
- **CSRF Protection**: Token validation

### Activity Tab

- Activity log/history
- Pagination (100 items per page)
- Load more button

### API Tokens Tab

- Create new tokens (modal)
- List existing tokens
- Delete tokens
- Token visibility controls

### Flow

1. User clicks avatar → Settings
2. Navigate to desired tab
3. Edit fields inline
4. Changes auto-save or Save button
5. Toast notifications for success/error

### Feedback

- **Success**: Toast notification
- **Error**: Inline validation messages
- **Loading**: Button loading states
- **Validation**: Red borders, error text

---

## Cascade

### Trigger

- **Icon**: User avatar in header
- **Location**: Settings → Profile tab
- **URL**: `/:orgSlug/settings/profile`

### UI Elements

**Layout**: Tab-based settings (Profile, Security, Preferences, Notifications, Integrations, API Keys)

**Profile Content**:
- Profile header with avatar, name, email
- Two-column stat cards grid
- Edit mode toggle

### Profile Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | Text | Yes | Not empty |
| Email | Text | Yes | Verification flow |
| Avatar/Image | Image | No | User image field |
| Bio | Textarea | No | Optional |
| Timezone | Dropdown | No | IANA format |

### Avatar Handling

- Default: Initial circle with first letter
- Upload: Via image field update
- Display: Avatar component with fallback

### Stats Cards

Displayed in two-column grid:
- Workspaces count
- Issues Created
- Issues Assigned
- Issues Completed
- Comments count

### Security Tab (2FA)

**Two-Factor Authentication**:
- Setup wizard with QR code
- Manual secret code entry
- 6-digit TOTP verification
- 8 backup codes (2-column grid)
- Regenerate backup codes
- Disable with TOTP or backup code

**Implementation**:
- RFC 6238 TOTP standard
- 30-second periods
- Max 5 failed attempts → 15-min lockout
- Encrypted secret storage

### Preferences Tab

| Setting | Type | Description |
|---------|------|-------------|
| Theme | Toggle group | Light/Dark/System |
| Timezone | Dropdown | IANA timezone |
| Desktop Notifications | Switch | Browser permission |

### Flow

1. User clicks avatar → Settings
2. Navigate via tabs
3. Edit fields in forms
4. Save button triggers mutation
5. Toast notification feedback

### Feedback

- **Success**: `showSuccess()` toast
- **Error**: `showError()` toast
- **Loading**: Spinner states
- **Validation**: Field-level errors

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Profile fields | 7 fields | 5 fields | plane |
| First/Last name | Yes | Single name | plane |
| Display name | Yes | No | plane |
| Avatar upload | Modal | Field update | plane |
| Cover image | Yes | No | plane |
| Email change | Modal flow | Verification flow | tie |
| Language setting | Yes | No | plane |
| Timezone | Yes | Yes | tie |
| First day of week | Yes | No | plane |
| Theme settings | No (in profile) | Yes | Cascade |
| 2FA | No | Yes (full TOTP) | Cascade |
| Backup codes | No | Yes (8 codes) | Cascade |
| Password change | Yes | OAuth-based | plane |
| Activity log | Yes | No | plane |
| API tokens | Yes | Yes | tie |
| User stats | No | Yes (5 stats) | Cascade |
| Bio field | No | Yes | Cascade |
| Settings layout | Sidebar tabs | Top tabs | preference |

---

## Recommendations

1. **Priority 1**: Add First/Last name fields
   - Split name into first + last
   - Display name option
   - Better for formal contexts

2. **Priority 2**: Add avatar upload modal
   - Dedicated upload UI
   - Crop/resize options
   - Preview before save

3. **Priority 3**: Add cover image
   - Profile header background
   - Preset images or upload
   - Visual personalization

4. **Priority 4**: Add language selection
   - Multi-language support
   - User locale preference
   - Affects date/number formats

5. **Priority 5**: Add activity log
   - User's recent activity
   - Pagination for history
   - Filter by activity type

---

## Cascade Strengths

1. **Two-Factor Authentication**: Full TOTP implementation with backup codes
2. **User Stats Dashboard**: Quick view of activity metrics
3. **Theme Control**: Light/Dark/System toggle
4. **Bio Field**: Personal description for team context
5. **Modern Tab Layout**: Clean horizontal navigation

---

## Implementation: Avatar Upload Modal

```tsx
function AvatarUploadModal({ open, onClose, onSave }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!file) return;
    const storageId = await uploadFile(file);
    await onSave(storageId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Avatar</DialogTitle>
        </DialogHeader>

        <Flex direction="column" align="center" gap="4">
          {preview ? (
            <Avatar size="xl" src={preview} />
          ) : (
            <Flex
              className="size-32 rounded-full border-2 border-dashed"
              align="center"
              justify="center"
            >
              <Typography variant="small">Drop image here</Typography>
            </Flex>
          )}

          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </Flex>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!file}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Implementation: Activity Log

```typescript
// Convex query
export const getUserActivity = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId ?? await getAuthUserId(ctx);
    if (!userId) return { activities: [], nextCursor: null };

    const limit = args.limit ?? 50;

    let query = ctx.db
      .query("activityLog")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc");

    if (args.cursor) {
      query = query.filter(q =>
        q.lt(q.field("createdAt"), args.cursor)
      );
    }

    const activities = await query.take(limit + 1);
    const hasMore = activities.length > limit;

    return {
      activities: activities.slice(0, limit),
      nextCursor: hasMore
        ? activities[limit - 1].createdAt
        : null,
    };
  },
});

// Component
function ActivityLog({ userId }) {
  const { activities, nextCursor, loadMore } = usePaginatedQuery(
    api.users.getUserActivity,
    { userId }
  );

  return (
    <Stack gap="2">
      {activities.map(activity => (
        <ActivityItem key={activity._id} activity={activity} />
      ))}
      {nextCursor && (
        <Button variant="secondary" onClick={loadMore}>
          Load More
        </Button>
      )}
    </Stack>
  );
}
```

---

## Screenshots/References

### plane
- Profile layout: `~/Desktop/plane/apps/web/app/(all)/settings/profile/layout.tsx`
- General form: `~/Desktop/plane/apps/web/core/components/settings/profile/content/pages/general/form.tsx`
- Security: `~/Desktop/plane/apps/web/core/components/settings/profile/content/pages/security/index.tsx`
- Preferences: `~/Desktop/plane/apps/web/core/components/settings/profile/content/pages/preferences/`
- API tokens: `~/Desktop/plane/apps/web/core/components/settings/profile/content/pages/api-tokens.tsx`

### Cascade
- Settings: `~/Desktop/cascade/src/components/Settings.tsx`
- Profile content: `~/Desktop/cascade/src/components/Settings/ProfileContent.tsx`
- 2FA settings: `~/Desktop/cascade/src/components/Settings/TwoFactorSettings.tsx`
- Preferences: `~/Desktop/cascade/src/components/Settings/PreferencesTab.tsx`
- Backend: `~/Desktop/cascade/convex/users.ts`
