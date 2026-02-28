# Notification Preferences - Deep UX Comparison

## Overview
Notification preferences allow users to control what notifications they receive and how they receive them (in-app, email, push). Good preferences reduce notification fatigue while ensuring important updates aren't missed. This analysis compares Plane vs Cascade across preference options, UI patterns, and subscription models.

---

## Entry Points Comparison

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Profile settings** | Profile → Notifications | Settings → Notifications | Tie |
| **Email footer link** | Manage preferences | Manage preferences | Tie |
| **Notification popup** | N/A | N/A | Tie |
| **Issue subscribe** | Bell icon on issue | Watch button on issue | Tie |
| **Quick settings** | N/A | Master toggle | Cascade |

---

## Layout Comparison

### Plane Notification Preferences
```
Profile → Notifications:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Profile Settings                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [General] [Notifications] [Appearance]                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Email Notifications                                                          │
│ ────────────────────────────────────────────────────────────────           │
│                                                                             │
│ Property changes                                                 [  ON  ]   │
│ Notify when issue properties change                                         │
│                                                                             │
│ State changes                                                    [  ON  ]   │
│ Notify when issue status changes                                            │
│                                                                             │
│ Comments                                                         [  ON  ]   │
│ Notify when someone comments on subscribed issues                           │
│                                                                             │
│ Mentions                                                         [  ON  ]   │
│ Notify when you're @mentioned                                               │
│                                                                             │
│ Issue assignments                                                [  ON  ]   │
│ Notify when assigned to an issue                                            │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────          │
│                                                                             │
│ Marketing                                                                   │
│ ────────────────────────────────────────────────────────────────           │
│                                                                             │
│ Weekly product updates                                           [ OFF  ]   │
│ Receive news about new features                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Settings behavior:
- Toggle auto-saves (no Save button)
- Per-workspace overrides available
- 5 notification types
```

### Cascade Notification Preferences
```
Settings → Notifications:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Notification Preferences                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─ In-App Notifications ───────────────────────────────────────────────────┐│
│ │                                                                           ││
│ │ All notifications                                              [  ON  ]  ││
│ │ ↑ Master toggle - turn off to mute all                                   ││
│ │                                                                           ││
│ │ ────────────────────────────────────────────────────────────────         ││
│ │                                                                           ││
│ │ Issue assigned              When assigned to an issue         [  ON  ]  ││
│ │ Issue commented             Comment on your issue             [  ON  ]  ││
│ │ Issue mentioned             When @mentioned                   [  ON  ]  ││
│ │ Status changed              Issue status changes              [  ON  ]  ││
│ │ Sprint started              Sprint you're in starts           [  ON  ]  ││
│ │ Sprint ended                Sprint completes                  [  ON  ]  ││
│ │ Document shared             Document shared with you          [  ON  ]  ││
│ │ Project invited             Invited to project                [  ON  ]  ││
│ │                                                                           ││
│ └───────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─ Email Notifications ────────────────────────────────────────────────────┐│
│ │                                                                           ││
│ │ Transactional emails                                          [  ON  ]  ││
│ │ Receive immediate email alerts                                           ││
│ │                                                                           ││
│ │ Email digest                                                              ││
│ │ ┌───────────────────────────────────────────────────────────────────┐   ││
│ │ │ (○) None      (○) Daily      (●) Weekly                           │   ││
│ │ └───────────────────────────────────────────────────────────────────┘   ││
│ │                                                                           ││
│ │ Marketing emails                                              [ OFF  ]  ││
│ │ Product updates and announcements                                        ││
│ │                                                                           ││
│ └───────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─ Push Notifications ─────────────────────────────────────────────────────┐│
│ │                                                                           ││
│ │ Enable push notifications                                     [ OFF  ]  ││
│ │ Receive browser push notifications                                       ││
│ │                                                                           ││
│ │ [Test push notification]                                                  ││
│ │                                                                           ││
│ │ ────────────────────────────────────────────────────────────────         ││
│ │                                                                           ││
│ │ Push for mentions only                                        [  ON  ]  ││
│ │ Only push when @mentioned (reduces noise)                                ││
│ │                                                                           ││
│ └───────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Settings behavior:
- Toggle auto-saves
- Per-organization settings
- 8 in-app types + email + push
- Master toggle available
- Test button for push
```

---

## Preference Categories

### In-App Notification Types

| Type | Plane | Cascade | Description |
|------|-------|---------|-------------|
| **Issue assigned** | Yes | Yes | Assigned to you |
| **Issue commented** | Yes | Yes | Comment on your issue |
| **Issue mentioned** | Yes | Yes | @mentioned |
| **Status changed** | Yes | Yes | Status changes on watched |
| **Property changed** | Yes | N/A | Other field changes |
| **Sprint started** | N/A | Yes | Sprint begins |
| **Sprint ended** | N/A | Yes | Sprint completes |
| **Document shared** | N/A | Yes | Document shared |
| **Project invited** | Yes | Yes | Project invitation |

### Email Controls

| Control | Plane | Cascade |
|---------|-------|---------|
| **Per-type toggles** | Yes (5) | Yes (via in-app) |
| **Digest frequency** | N/A | None/Daily/Weekly |
| **Transactional toggle** | Implicit | Explicit |
| **Marketing toggle** | Yes | Yes |

### Push Controls

| Control | Plane | Cascade |
|---------|-------|---------|
| **Enable push** | N/A | Yes |
| **Per-type toggles** | N/A | Yes |
| **Mentions only** | N/A | Yes |
| **Test button** | N/A | Yes |

---

## Subscription Model Comparison

### Issue Subscriptions

```
Plane:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Auto-subscribe triggers:                                                     │
│ ├─ Assigned to issue                                                        │
│ ├─ Mentioned in issue                                                       │
│ └─ Creator of issue (implicit)                                              │
│                                                                             │
│ Manual subscription:                                                         │
│ └─ Bell icon on issue → Subscribe/Unsubscribe                               │
│                                                                             │
│ UI on issue:                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ PROJ-123  Fix auth bug                              [🔔 Subscribed] [⋯]││
│ │                                                          ↑              ││
│ │                                                     Click to toggle     ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘

Cascade:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Auto-subscribe triggers:                                                     │
│ ├─ Assigned to issue                                                        │
│ ├─ Mentioned in issue                                                       │
│ ├─ Commented on issue                                                       │
│ └─ Creator of issue                                                         │
│                                                                             │
│ Manual subscription:                                                         │
│ └─ Watch button on issue → Watch/Unwatch                                    │
│                                                                             │
│ UI on issue:                                                                │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ PROJ-123  Fix auth bug                             [👁️ Watching] [⋯]   ││
│ │                                                          ↑              ││
│ │                                                     Click to toggle     ││
│ └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Project Subscriptions

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Watch project** | N/A | Yes |
| **All project notifications** | N/A | Yes |
| **Per-issue override** | N/A | Yes |

### Document Subscriptions (Cascade Only)

```
Auto-subscribe triggers:
├─ Creator of document
├─ Document shared with you
└─ Mentioned in document

Manual subscription:
└─ Watch button on document
```

---

## Click Analysis

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Access preferences** | 3 clicks (profile → settings → notifs) | 2 clicks (settings → notifs) | Cascade faster |
| **Toggle notification type** | 1 click | 1 click | Tie |
| **Change digest frequency** | N/A | 1 click | Cascade only |
| **Enable push** | N/A | 1 click | Cascade only |
| **Test push** | N/A | 1 click | Cascade only |
| **Mute all** | N/A (toggle each) | 1 click (master) | **Cascade** |
| **Subscribe to issue** | 1 click (bell) | 1 click (watch) | Tie |
| **Subscribe to project** | N/A | 1 click | Cascade only |

---

## Master Toggle (Cascade Only)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ All notifications                                                [  ON  ]  │
│ ↑ Master toggle                                                             │
│                                                                             │
│ When OFF:                                                                   │
│ - All in-app notifications disabled                                        │
│ - Individual toggles greyed out                                             │
│ - Email/push still configurable separately                                  │
│                                                                             │
│ Use case:                                                                   │
│ - Quick "do not disturb" mode                                               │
│ - Vacation mode                                                             │
│ - Focus time                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Push Notification Flow (Cascade Only)

```
Enable Push Flow:
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. User enables "Enable push notifications"                                 │
│                                                                             │
│ 2. Browser permission prompt:                                               │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ cascade.app wants to:                                               │ │
│    │ Show notifications                                                   │ │
│    │                                         [Block]  [Allow]            │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ 3. If allowed:                                                              │
│    - Service worker registers                                               │
│    - Push subscription created                                              │
│    - Subscription stored in Convex                                          │
│    - Test button becomes available                                          │
│                                                                             │
│ 4. Test notification:                                                       │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ 🔔 Cascade                                                          │ │
│    │ Test notification - Push notifications are working!                 │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Keyboard Support

| Shortcut | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| **Navigate settings** | Tab | Tab | Both |
| **Toggle setting** | Space/Enter | Space/Enter | Both |
| **Quick access** | N/A | N/A | Neither |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| In-app toggles | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade 8 vs 5 types |
| Email controls | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade has digest freq |
| Push notifications | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Master toggle | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Test notification | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Issue subscriptions | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both have |
| Project subscriptions | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Document subscriptions | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Per-workspace | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Plane per-workspace |
| UI organization | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade grouped sections |
| Accessibility | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Both good |

---

## Priority Recommendations for Cascade

### P0 - Critical
(Cascade already leads in this area)

### P1 - High
1. **Add quiet hours** - No notifications during specified times
   ```tsx
   quietHours: {
     enabled: boolean,
     startTime: "22:00",  // 10pm
     endTime: "08:00",    // 8am
     timezone: "America/New_York",
     allowUrgent: boolean
   }
   ```

2. **Add per-workspace overrides** - Different settings per org

### P2 - Medium
3. **Add notification channels** - Slack, Teams, Discord webhooks
4. **Add smart defaults** - Learn from user behavior
5. **Add notification preview** - Show sample of each type

### P3 - Nice to Have
6. **Add notification schedule** - Only during work hours
7. **Add emergency override** - Always notify for specific events
8. **Add notification mute duration** - Mute for 1h, 4h, 1d

---

## Cascade Strengths

1. **Push Notifications** - Browser push keeps users informed even when not in app
2. **Digest Control** - Users choose their summary frequency
3. **Project-Level Subscriptions** - Watch entire projects, not just issues
4. **Document Subscriptions** - Extends to docs, not just issues
5. **Master Toggle** - Quick way to mute all notifications
6. **Test Button** - Verify push notifications work
7. **More Notification Types** - Sprint and document events

---

## Future Enhancement: Quiet Hours

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Quiet Hours                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Enable quiet hours                                              [  ON  ]   │
│ Pause notifications during specified times                                  │
│                                                                             │
│ Schedule                                                                    │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ From: [10:00 PM ▼]  To: [8:00 AM ▼]                                   │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ Timezone: [America/New_York ▼]                                              │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────          │
│                                                                             │
│ ☑ Allow urgent notifications through                                       │
│   @mentions and high-priority issues still notify                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Future Enhancement: Notification Channels

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Notification Channels                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Slack                                                                       │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ ☑ Connected to #engineering                              [Disconnect]│  │
│ │                                                                       │  │
│ │ Notify for:                                                           │  │
│ │ ☑ Issue assigned   ☑ Mentions   ☐ Comments   ☐ Status changes       │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ Microsoft Teams                                                             │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ ☐ Not connected                                    [Connect to Teams] │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ Discord (via Webhook)                                                       │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ ☐ Not configured                                      [Add Webhook]  │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Code References

### Plane
- Notification settings: `apps/web/app/profile/notifications/`
- Store: `apps/web/core/store/profile/profile-notification.store.ts`
- Service: `apps/web/core/services/notification.service.ts`

### Cascade
- Settings page: `src/routes/_auth/_app/$orgSlug/settings/notifications.tsx`
- NotificationsTab: `src/components/Settings/NotificationsTab.tsx`
- Backend: `convex/notificationPreferences.ts`
- Push subscriptions: `convex/pushSubscriptions.ts`
- Subscription logic: `convex/subscriptions.ts`
- Schema: `convex/schema.ts` (notificationPreferences table)

### Cascade Data Structures
```typescript
// Notification preferences
notificationPreferences: defineTable({
  userId: v.id("users"),
  organizationId: v.id("organizations"),

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

  email: v.object({
    enabled: v.boolean(),
    digestFrequency: v.union(
      v.literal("none"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    marketing: v.boolean(),
  }),

  push: v.object({
    enabled: v.boolean(),
    mentionsOnly: v.boolean(),
  }),
})

// Subscriptions
subscriptions: defineTable({
  userId: v.id("users"),
  entityType: v.union(v.literal("issue"), v.literal("document"), v.literal("project")),
  entityId: v.string(),
  subscribed: v.boolean(),
})
```
