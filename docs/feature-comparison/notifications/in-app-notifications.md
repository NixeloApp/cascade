# In-App Notifications - Deep UX Comparison

## Overview
In-app notifications alert users to relevant activity in real-time. They appear as a notification bell/icon with unread count and provide quick access to recent updates without leaving the current context. This analysis compares Plane vs Cascade across UI patterns, notification types, and UX efficiency.

---

## Entry Points Comparison

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Header icon** | Bell in top nav | Bell in top nav | Tie |
| **Unread badge** | Count on icon | Count on icon | Tie |
| **Keyboard shortcut** | N/A | N/A | Tie |
| **Sound alert** | N/A | N/A | Tie |
| **URL direct** | `/[workspace]/notifications` | `/:org/notifications` | Tie |
| **Browser notification** | N/A | Push notification | Cascade |

---

## Layout Comparison

### Plane Notifications
```
Notification Bell Location:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header                                                                       │
│ [Logo] [Search...] [Workspaces ▼]        [🔔 3]  [?]  [👤 Profile]         │
│                                            ↑                                 │
│                                         Click opens                          │
│                                         FULL PAGE                            │
└─────────────────────────────────────────────────────────────────────────────┘

Notification Page (Full Page):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Inbox                                                  [Mark all read] [⚙️] │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Sidebar ──────────┐ ┌─ Content ────────────────────────────────────────┐│
│ │                    │ │                                                   ││
│ │ 📋 My Issues (12)  │ │ [All] [Mentions]                                 ││
│ │ ✏️ Created (5)     │ │                                                   ││
│ │ 👁️ Subscribed (8)  │ │ ┌─────────────────────────────────────────────┐  ││
│ │                    │ │ │ 👤 Alice assigned you to PROJ-123            │  ││
│ │ ─────────────────  │ │ │ Fix authentication bug                       │  ││
│ │                    │ │ │ 2 minutes ago                    [⏰] [📁] [⋯]│  ││
│ │ ☐ Unread only     │ │ └─────────────────────────────────────────────┘  ││
│ │                    │ │ ┌─────────────────────────────────────────────┐  ││
│ │ 💤 Snoozed (2)     │ │ │ 💬 Bob commented on PROJ-456                 │  ││
│ │   └ Until 3pm      │ │ │ "Looks good, just one small change..."       │  ││
│ │   └ Until tomorrow │ │ │ 15 minutes ago                  [⏰] [📁] [⋯]│  ││
│ │                    │ │ └─────────────────────────────────────────────┘  ││
│ │                    │ │ ┌─────────────────────────────────────────────┐  ││
│ │                    │ │ │ @ Carol mentioned you in PROJ-789            │  ││
│ │                    │ │ │ "@user can you review this?"                 │  ││
│ │                    │ │ │ 1 hour ago                      [⏰] [📁] [⋯]│  ││
│ │                    │ │ └─────────────────────────────────────────────┘  ││
│ │                    │ │                                                   ││
│ │                    │ │ [Load more notifications...]                      ││
│ └────────────────────┘ └───────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘

Notification Item Actions:
┌─────────────────────────────────────────────────────────────────────────────┐
│ [⏰ Snooze ▼]                                                               │
│ ┌─────────────────────────┐                                                 │
│ │ Snooze for:             │                                                 │
│ │ ○ 1 hour                │                                                 │
│ │ ○ 4 hours               │                                                 │
│ │ ○ 1 day                 │                                                 │
│ │ ○ 1 week                │                                                 │
│ │ ○ Custom date/time      │                                                 │
│ └─────────────────────────┘                                                 │
│                                                                             │
│ [📁 Archive]  [⋯ More]                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cascade Notifications
```
Notification Bell Location:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header                                                                       │
│ [Logo] [Search...] [Org ▼]              [🔔 5]  [👤 Profile]               │
│                                            ↑                                 │
│                                         Click opens                          │
│                                         POPOVER                              │
└─────────────────────────────────────────────────────────────────────────────┘

Notification Popover (Dropdown):
┌───────────────────────────────────────────────┐
│ Notifications                  [Mark all read]│
├───────────────────────────────────────────────┤
│ Today                                         │
│ ┌───────────────────────────────────────────┐ │
│ │ 👤+ Alice assigned you to PROJ-123       │ │
│ │ Fix authentication bug                    │ │
│ │ 2 minutes ago                       [✓][×]│ │
│ │  ↑ type icon                  ↑ actions   │ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │ 💬 Bob commented on PROJ-456              │ │
│ │ "Looks good, just one small change..."    │ │
│ │ 15 minutes ago                      [✓][×]│ │
│ └───────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────┐ │
│ │ @ Carol mentioned you in PROJ-789         │ │
│ │ "@user can you review this?"              │ │
│ │ 1 hour ago                          [✓][×]│ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ Yesterday                                     │
│ ┌───────────────────────────────────────────┐ │
│ │ 🔄 Issue PROJ-234 status → In Progress    │ │
│ │ Update API endpoints                      │ │
│ │ Yesterday at 3:45 PM                [✓][×]│ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ ────────────────────────────────────────────  │
│ [View all notifications →]                    │
└───────────────────────────────────────────────┘
Position: Anchored to bell icon
Max height: Scrollable (300-400px)
Width: ~320px
```

---

## Notification Types

| Type | Plane | Cascade | Icon |
|------|-------|---------|------|
| **Issue assigned** | Yes | Yes | UserPlus |
| **Issue commented** | Yes | Yes | MessageSquare |
| **Issue mentioned** | Yes | Yes | AtSign |
| **State changed** | Yes | Yes | RefreshCw |
| **Sprint started** | N/A | Yes | Play |
| **Sprint ended** | N/A | Yes | CheckCircle |
| **Document shared** | N/A | Yes | FileText |
| **Project invited** | Yes | Yes | Users |
| **Issue created** | Yes | N/A | Plus |

---

## Click Analysis

| Action | Plane | Cascade | Notes |
|--------|-------|---------|-------|
| **Open notifications** | 1 click (full page) | 1 click (popover) | Different UX |
| **Mark one as read** | 1 click | 1 click | Tie |
| **Mark all as read** | 1 click | 1 click | Tie |
| **Navigate to issue** | 1 click | 1 click | Tie |
| **Snooze notification** | 2 clicks (snooze → duration) | N/A | Plane only |
| **Archive notification** | 1 click | N/A (delete) | Different |
| **Filter by type** | 1 click (sidebar tab) | N/A | Plane only |
| **Filter mentions only** | 1 click (Mentions tab) | N/A | Plane only |
| **View snoozed** | 1 click (Snoozed section) | N/A | Plane only |
| **Return to previous** | Browser back | Click outside | Cascade faster |

---

## Notification Item Display

### Plane Notification Item
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [👤 Icon]  Title: Alice assigned you to PROJ-123                            │
│            Subtitle: Fix authentication bug                                 │
│            Meta: 2 minutes ago  •  High Priority  •  In Progress           │
│                                                                             │
│            Actions: [⏰ Snooze ▼] [📁 Archive] [⋯ More]                     │
│                                                                             │
│ Click area: Entire row navigates to issue                                   │
│ Read state: Unread has blue dot indicator                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cascade Notification Item
```
┌───────────────────────────────────────────────────────────────────────┐
│ [👤+ Icon]  Alice assigned you to PROJ-123                           │
│             Fix authentication bug                                    │
│             2 minutes ago                                    [✓] [×] │
│              ↑                                                ↑    ↑  │
│           relative time                                  mark  delete │
│                                                          read        │
│ Click area: Row navigates, buttons have own actions                  │
│ Read state: Unread has darker background                             │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Filtering & Tabs

### Plane Filtering System
```
Sidebar Filters:
┌────────────────────────────┐
│ View                       │
│ ├─ 📋 My Issues (12)       │
│ ├─ ✏️ Created (5)          │
│ └─ 👁️ Subscribed (8)       │
│                            │
│ Filter                     │
│ ├─ ☐ Unread only          │
│                            │
│ Snoozed                    │
│ └─ 💤 (2 snoozed)          │
└────────────────────────────┘

Content Tabs:
[All] [Mentions]
  ↑       ↑
 All    Only @mentions
```

### Cascade Filtering
```
(No filtering in popover)

Full Page (/notifications):
┌────────────────────────────┐
│ Today                      │ ← Date grouping
│ ├─ Notification 1          │
│ ├─ Notification 2          │
│                            │
│ Yesterday                  │
│ ├─ Notification 3          │
│                            │
│ This Week                  │
│ └─ Notification 4          │
└────────────────────────────┘
```

---

## Snooze Feature (Plane Only)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Snooze Options:                                                              │
│                                                                             │
│ ○ 1 hour      - Reappears in 1 hour                                        │
│ ○ 4 hours     - Reappears in 4 hours                                       │
│ ○ 1 day       - Reappears tomorrow                                         │
│ ○ 1 week      - Reappears next week                                        │
│ ○ Custom      - Date/time picker                                           │
│                                                                             │
│ Snoozed Notifications:                                                       │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ 💤 Snoozed until today 3:00 PM                                        │   │
│ │ PROJ-123: Fix authentication bug                          [Unsnooze] │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ Behavior:                                                                   │
│ - Marked as read when snoozed                                               │
│ - Reappears at scheduled time                                               │
│ - Moves back to inbox                                                       │
│ - Badge count updated                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Keyboard Support

| Shortcut | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| **Open notifications** | N/A | N/A | Neither |
| **Navigate list** | Arrow keys | Arrow keys | Both |
| **Open notification** | Enter | Enter | Both |
| **Mark as read** | N/A | N/A | Neither |
| **Close popover** | Escape | Escape | Both |

---

## Real-Time Updates

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Technology** | WebSocket | Convex reactive |
| **Push latency** | ~100-500ms | ~50-200ms |
| **Optimistic UI** | Yes | Yes |
| **Reconnection** | Polling fallback | Automatic |
| **Badge update** | Immediate | Immediate |
| **Offline queue** | Unknown | N/A |

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Display pattern | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Plane full page, Cascade popover |
| Quick access | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade popover faster |
| Notification types | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade more types |
| Snooze feature | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Archive feature | ⭐⭐⭐⭐⭐ | ⭐ | Plane only |
| Filtering | ⭐⭐⭐⭐⭐ | ⭐⭐ | Plane tabs/sidebar |
| Date grouping | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade groups by date |
| Real-time speed | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Convex faster |
| Click efficiency | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade inline popover |
| Bulk actions | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Plane has archive all |

---

## Priority Recommendations for Cascade

### P0 - Critical
1. **Add snooze functionality** - Temporarily hide notifications
   ```tsx
   const snoozeOptions = [
     { label: "1 hour", value: 60 * 60 * 1000 },
     { label: "4 hours", value: 4 * 60 * 60 * 1000 },
     { label: "1 day", value: 24 * 60 * 60 * 1000 },
     { label: "1 week", value: 7 * 24 * 60 * 60 * 1000 },
   ];
   ```

### P1 - High
2. **Add filter tabs** - All / Mentions toggle in popover header
3. **Add archive capability** - Archive instead of delete, view archived
4. **Add notification grouping** - Group similar notifications (5 comments → 1 item)

### P2 - Medium
5. **Create full notifications page** - `/notifications` route for power users
6. **Add filter by type** - Dropdown to show only certain types
7. **Add read/unread filter** - Toggle to show only unread

### P3 - Nice to Have
8. **Add notification sounds** - Optional audio alerts
9. **Add desktop notifications** - System-level alerts
10. **Add notification search** - Search through notification history

---

## Code References

### Plane
- Notifications page: `apps/web/app/[workspaceSlug]/(projects)/notifications/`
- Store: `apps/web/core/store/notifications/notification.store.ts`
- Components: `apps/web/core/components/notifications/`
- Service: `apps/web/core/services/notification.service.ts`
- Snooze modal: `apps/web/core/components/notifications/snooze-modal.tsx`

### Cascade
- NotificationBell: `src/components/NotificationBell.tsx`
- NotificationItem: `src/components/NotificationItem.tsx`
- NotificationCenter: `src/components/NotificationCenter.tsx`
- Backend: `convex/notifications.ts`
- Types: `convex/schema.ts` (notifications table)
- Notifications page: `src/routes/_auth/_app/$orgSlug/notifications.tsx`
