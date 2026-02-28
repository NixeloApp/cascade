# In-App Notifications

## Overview

In-app notifications alert users to relevant activity in real-time. They appear as a notification bell/icon with unread count and provide quick access to recent updates without leaving the current context.

---

## plane

### Trigger

- **Icon**: Bell icon in header
- **Location**: Top navigation bar
- **Badge**: Unread count shown on icon

### UI Elements

**Notifications Page** (`/[workspace]/notifications`):
- Full-page dedicated view (not dropdown)
- Sidebar filters + main content area

**Navigation Tabs**:
| Tab | Description |
|-----|-------------|
| My Issues | Issues assigned to user |
| Created | Issues created by user |
| Subscribed | Issues user is watching |

**View Tabs**:
- All — All notifications
- Mentions — Only @mentions

**Sidebar Filters**:
- Type filters (assigned, created, subscribed)
- Read/unread toggle
- Snoozed section

### Notification Types

| Type | Icon | Description |
|------|------|-------------|
| Issue assigned | User icon | When issue assigned to you |
| Issue created | Plus icon | When you create an issue |
| Comment | Chat icon | When someone comments |
| Mention | At icon | When @mentioned |
| State change | Circle icon | When issue status changes |

### Actions

**Per Notification**:
- Mark as read/unread
- Snooze (1 hour, 4 hours, 1 day, 1 week, custom)
- Archive
- Open related item

**Bulk Actions**:
- Mark all as read
- Archive all read

### Snooze Feature

- Temporarily hide notifications
- Reappear at scheduled time
- Snoozed section in sidebar
- Custom snooze date/time picker

### Store Architecture

```typescript
// MobX store pattern
class NotificationStore {
  notifications: INotification[] = [];
  unreadCount: number = 0;
  currentTab: "all" | "mentions" = "all";

  markAsRead(id: string): void;
  markAllAsRead(): void;
  snooze(id: string, until: Date): void;
  archive(id: string): void;
}
```

### Real-Time Updates

- WebSocket connection for live updates
- Optimistic UI updates
- Polling fallback

---

## Cascade

### Trigger

- **Icon**: Bell icon (`Bell` from lucide-react)
- **Location**: Top navigation bar (header)
- **Badge**: Unread count displayed on icon

### UI Elements

**Notification Popover** (dropdown, not full page):
- Component: `NotificationBell.tsx`
- Position: Anchored to bell icon
- Max height with scroll

**Popover Structure**:
```
NotificationBell
├── Badge (unread count)
├── Popover
│   ├── Header ("Notifications" + Mark all read)
│   ├── NotificationList
│   │   └── NotificationItem[] (scrollable)
│   └── Footer (link to all notifications)
```

### Notification Types

| Type | Icon | Description |
|------|------|-------------|
| `issue_assigned` | UserPlus | Issue assigned to you |
| `issue_commented` | MessageSquare | Comment on your issue |
| `issue_mentioned` | AtSign | @mentioned in issue |
| `issue_status_changed` | RefreshCw | Status change on watched issue |
| `sprint_started` | Play | Sprint you're in starts |
| `sprint_ended` | CheckCircle | Sprint completes |
| `document_shared` | FileText | Document shared with you |
| `project_invited` | Users | Invited to project |

### Notification Item Display

```tsx
<NotificationItem>
  <Icon type={notification.type} />
  <Content>
    <Title>{notification.title}</Title>
    <Description>{notification.message}</Description>
    <Timestamp relative />
  </Content>
  <Actions>
    <MarkReadButton />
    <DeleteButton />
  </Actions>
</NotificationItem>
```

### Actions

**Per Notification**:
- Mark as read (click or explicit button)
- Delete (soft delete)
- Navigate to related item

**Bulk Actions**:
- Mark all as read (header button)

### Store Architecture

```typescript
// Convex real-time pattern
export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return ctx.db
      .query("notifications")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q => q.eq(q.field("isDeleted"), false))
      .order("desc")
      .take(50);
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});
```

### Real-Time Updates

- Convex reactive queries (automatic)
- Instant updates via WebSocket
- No polling needed
- Optimistic UI with rollback

### Notification Creation

```typescript
// Internal function to create notifications
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: notificationTypeValidator,
    title: v.string(),
    message: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      isDeleted: false,
      createdAt: Date.now(),
    });
  },
});
```

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Display style | Full page | Popover dropdown | preference |
| Unread badge | Yes | Yes | tie |
| Notification types | 5 | 8 | Cascade |
| Mark as read | Yes | Yes | tie |
| Mark all as read | Yes | Yes | tie |
| Snooze | Yes | No | plane |
| Archive | Yes | No (soft delete) | plane |
| Tabs (All/Mentions) | Yes | No | plane |
| Filter by type | Yes (sidebar) | No | plane |
| Real-time updates | WebSocket | Convex reactive | Cascade |
| Click to navigate | Yes | Yes | tie |
| Relative timestamps | Yes | Yes | tie |
| Type icons | Yes | Yes | tie |
| Bulk delete | No | No | tie |

---

## Recommendations

1. **Priority 1**: Add snooze functionality
   - Snooze for 1h, 4h, 1 day, 1 week
   - Custom date/time picker
   - Snoozed notifications reappear automatically

2. **Priority 2**: Add filter tabs
   - All / Mentions tabs
   - Filter by notification type
   - Filter by read/unread

3. **Priority 3**: Add archive capability
   - Archive instead of delete
   - View archived notifications
   - Restore from archive

4. **Priority 4**: Create full notifications page
   - Dedicated `/notifications` route
   - Better for managing many notifications
   - Keep popover for quick access

5. **Priority 5**: Add notification grouping
   - Group by date (Today, Yesterday, This Week)
   - Group by entity (all comments on same issue)
   - Collapse similar notifications

---

## Implementation: Snooze Feature

```typescript
// Schema addition
notifications: defineTable({
  // ... existing fields
  snoozedUntil: v.optional(v.number()),
})

// Snooze mutation
export const snoozeNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
    until: v.number(), // timestamp
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, {
      snoozedUntil: args.until,
      isRead: true, // Mark as read when snoozed
    });

    return { success: true };
  },
});

// Update list query to filter snoozed
export const listForUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();

    return ctx.db
      .query("notifications")
      .withIndex("by_user", q => q.eq("userId", userId))
      .filter(q =>
        q.and(
          q.eq(q.field("isDeleted"), false),
          q.or(
            q.eq(q.field("snoozedUntil"), undefined),
            q.lt(q.field("snoozedUntil"), now)
          )
        )
      )
      .order("desc")
      .take(50);
  },
});
```

---

## Screenshots/References

### plane
- Notifications page: `~/Desktop/plane/apps/web/app/[workspaceSlug]/(projects)/notifications/`
- Store: `~/Desktop/plane/apps/web/core/store/notifications/notification.store.ts`
- Components: `~/Desktop/plane/apps/web/core/components/notifications/`
- Service: `~/Desktop/plane/apps/web/core/services/notification.service.ts`

### Cascade
- NotificationBell: `~/Desktop/cascade/src/components/NotificationBell.tsx`
- Backend: `~/Desktop/cascade/convex/notifications.ts`
- Types: `~/Desktop/cascade/convex/schema.ts` (notifications table)
