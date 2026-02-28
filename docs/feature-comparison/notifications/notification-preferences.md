# Notification Preferences

## Overview

Notification preferences allow users to control what notifications they receive and how they receive them (in-app, email, push). Good preferences reduce notification fatigue while ensuring important updates aren't missed.

---

## plane

### Settings Location

- **Path**: User Profile → Notifications
- **URL**: `/profile/notifications`

### Preference Categories

**Email Notifications**:

| Setting | Default | Description |
|---------|---------|-------------|
| Property changes | On | Issue field updates |
| State changes | On | Status transitions |
| Comments | On | New comments |
| Mentions | On | @mentioned |
| Issue assignments | On | Assigned to you |

**Per-Workspace Settings**:
- Notifications can be configured per workspace
- Default settings apply to all workspaces
- Override available per workspace

### UI Elements

**Settings Form**:
```
Profile Notifications Page
├── Email Notifications Section
│   ├── Toggle: Property changes
│   ├── Toggle: State changes
│   ├── Toggle: Comments
│   ├── Toggle: Mentions
│   └── Toggle: Issue assignments
└── Save button (auto-save on toggle)
```

### Subscription Model

**Issue Subscriptions**:
- Auto-subscribe when assigned
- Auto-subscribe when mentioned
- Manual subscribe/unsubscribe
- Subscription bell icon on issue

**Project Subscriptions**:
- Not available (issue-level only)

### Store Pattern

```typescript
// MobX store
class ProfileNotificationStore {
  notificationSettings: INotificationSettings = {
    property_change: true,
    state_change: true,
    comment: true,
    mention: true,
    issue_assignment: true,
  };

  async updateSettings(key: string, value: boolean): Promise<void>;
}
```

---

## Cascade

### Settings Location

- **Path**: User Settings → Notifications
- **URL**: `/{orgSlug}/settings/notifications`

### Preference Categories

**In-App Notifications**:

| Setting | Default | Description |
|---------|---------|-------------|
| Issue assigned | On | Assigned to you |
| Issue commented | On | Comment on your issue |
| Issue mentioned | On | @mentioned |
| Issue status changed | On | Status change on watched |
| Sprint started | On | Sprint you're in starts |
| Sprint ended | On | Sprint completes |
| Document shared | On | Document shared with you |
| Project invited | On | Invited to project |

**Email Notifications**:

| Setting | Default | Description |
|---------|---------|-------------|
| Transactional emails | On | Immediate email alerts |
| Email digest | Weekly | Summary frequency |

**Push Notifications**:

| Setting | Default | Description |
|---------|---------|-------------|
| Enable push | Off | Browser push notifications |
| Push for mentions | On | Push only for @mentions |

### UI Elements

**Settings Form**:
```
Notification Settings Page
├── In-App Notifications Section
│   ├── Master toggle: All notifications
│   └── Per-type toggles (8 types)
├── Email Notifications Section
│   ├── Toggle: Transactional emails
│   ├── Select: Digest frequency (None/Daily/Weekly)
│   └── Toggle: Marketing emails
├── Push Notifications Section
│   ├── Toggle: Enable push notifications
│   ├── Button: Test push notification
│   └── Per-type toggles for push
└── Save button (or auto-save)
```

### Subscription Model

**Issue Subscriptions**:
- Auto-subscribe when assigned
- Auto-subscribe when mentioned
- Auto-subscribe when commented
- Manual subscribe via watch button
- Unsubscribe button

**Project Subscriptions**:
- Watch entire project
- Get all issue notifications in project
- Override with issue-level unsubscribe

**Document Subscriptions**:
- Auto-subscribe as creator
- Auto-subscribe when shared
- Manual subscribe/unsubscribe

### Schema

```typescript
// User notification preferences
notificationPreferences: defineTable({
  userId: v.id("users"),
  organizationId: v.id("organizations"),

  // In-app toggles
  inApp: v.object({
    issueAssigned: v.boolean(),
    issueCommented: v.boolean(),
    issueMentioned: v.boolean(),
    issueStatusChanged: v.boolean(),
    sprintStarted: v.boolean(),
    sprintEnded: v.boolean(),
    documentShared: v.boolean(),
    projectInvited: v.boolean(),
  }),

  // Email settings
  email: v.object({
    enabled: v.boolean(),
    digestFrequency: v.union(
      v.literal("none"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    marketing: v.boolean(),
  }),

  // Push settings
  push: v.object({
    enabled: v.boolean(),
    mentionsOnly: v.boolean(),
  }),
})
  .index("by_user_org", ["userId", "organizationId"]),

// Issue/document subscriptions
subscriptions: defineTable({
  userId: v.id("users"),
  entityType: v.union(v.literal("issue"), v.literal("document"), v.literal("project")),
  entityId: v.string(),
  subscribed: v.boolean(),
  createdAt: v.number(),
})
  .index("by_user_entity", ["userId", "entityType", "entityId"]),
```

### Push Notification Implementation

**Web Push API**:
```typescript
// Subscribe to push notifications
export const subscribeToPush = mutation({
  args: {
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    await ctx.db.insert("pushSubscriptions", {
      userId,
      subscription: args.subscription,
      createdAt: Date.now(),
    });
  },
});

// Send push notification (action)
export const sendPushNotification = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.runQuery(
      internal.push.getSubscriptions,
      { userId: args.userId }
    );

    for (const sub of subscriptions) {
      await webpush.sendNotification(sub.subscription, JSON.stringify({
        title: args.title,
        body: args.body,
        url: args.url,
      }));
    }
  },
});
```

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| In-app toggles | 5 types | 8 types | Cascade |
| Email toggles | 5 types | Yes + digest | Cascade |
| Push notifications | No | Yes (Web Push) | Cascade |
| Digest frequency | No | None/Daily/Weekly | Cascade |
| Per-workspace | Yes | Per-organization | tie |
| Issue subscriptions | Yes | Yes | tie |
| Project subscriptions | No | Yes | Cascade |
| Document subscriptions | N/A | Yes | Cascade |
| Master on/off | No | Yes | Cascade |
| Test notification | No | Yes | Cascade |
| Settings UI | Simple | Comprehensive | Cascade |
| Auto-subscribe rules | Basic | Advanced | Cascade |

---

## Recommendations

1. **Priority 1**: Cascade already leads
   - Push notifications are a major advantage
   - Digest frequency control is valuable
   - Per-entity subscriptions work well

2. **Priority 2**: Add quiet hours
   - Let users set "do not disturb" times
   - No notifications between 10pm-8am (configurable)
   - Emergency override option

3. **Priority 3**: Add notification channels
   - Slack integration
   - Microsoft Teams integration
   - Discord webhook

4. **Priority 4**: Add smart defaults
   - Learn from user behavior
   - Auto-disable types user never clicks
   - Suggest reducing notification load

5. **Priority 5**: Add notification preview
   - Show sample notification for each type
   - Help users understand what they'll receive

---

## Cascade Strengths

1. **Push Notifications**: Browser push keeps users informed even when not in app
2. **Digest Control**: Users choose their summary frequency
3. **Project-Level Subscriptions**: Watch entire projects, not just issues
4. **Document Subscriptions**: Extends to docs, not just issues
5. **Master Toggle**: Quick way to mute all notifications
6. **Test Button**: Verify push notifications work

---

## Implementation: Quiet Hours

```typescript
// Add to preferences schema
notificationPreferences: defineTable({
  // ... existing fields
  quietHours: v.optional(v.object({
    enabled: v.boolean(),
    startTime: v.string(), // "22:00"
    endTime: v.string(),   // "08:00"
    timezone: v.string(),  // "America/New_York"
    allowUrgent: v.boolean(), // Let urgent through
  })),
})

// Check quiet hours before sending
async function shouldSendNotification(
  ctx: MutationCtx,
  userId: Id<"users">,
  isUrgent: boolean
): Promise<boolean> {
  const prefs = await getPreferences(ctx, userId);

  if (!prefs?.quietHours?.enabled) {
    return true;
  }

  if (isUrgent && prefs.quietHours.allowUrgent) {
    return true;
  }

  const now = new Date();
  const userTime = formatInTimeZone(now, prefs.quietHours.timezone, "HH:mm");
  const start = prefs.quietHours.startTime;
  const end = prefs.quietHours.endTime;

  // Check if current time is within quiet hours
  if (start > end) {
    // Overnight range (22:00 - 08:00)
    return userTime < start && userTime >= end;
  } else {
    // Same-day range
    return userTime < start || userTime >= end;
  }
}
```

---

## Implementation: Notification Channels (Slack)

```typescript
// Add Slack integration to preferences
integrations: v.optional(v.object({
  slack: v.optional(v.object({
    enabled: v.boolean(),
    webhookUrl: v.string(),
    notifyFor: v.array(notificationTypeValidator),
  })),
})),

// Send to Slack action
export const sendSlackNotification = internalAction({
  args: {
    webhookUrl: v.string(),
    notification: v.object({
      type: notificationTypeValidator,
      title: v.string(),
      message: v.string(),
      url: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await fetch(args.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: args.notification.title,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${args.notification.title}*\n${args.notification.message}`,
            },
          },
          args.notification.url && {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "View" },
                url: args.notification.url,
              },
            ],
          },
        ].filter(Boolean),
      }),
    });
  },
});
```

---

## Screenshots/References

### plane
- Notification settings: `~/Desktop/plane/apps/web/app/profile/notifications/`
- Store: `~/Desktop/plane/apps/web/core/store/profile/profile-notification.store.ts`

### Cascade
- Settings page: `~/Desktop/cascade/src/routes/_auth/_app/$orgSlug/settings/notifications.tsx`
- Backend: `~/Desktop/cascade/convex/notificationPreferences.ts`
- Push subscriptions: `~/Desktop/cascade/convex/pushSubscriptions.ts`
- Subscription logic: `~/Desktop/cascade/convex/subscriptions.ts`
