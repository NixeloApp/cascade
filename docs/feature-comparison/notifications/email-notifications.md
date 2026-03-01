# Email Notifications - Deep UX Comparison

## Overview
Email notifications keep users informed about important activity when they're not actively using the application. They include transactional emails (immediate alerts) and digest emails (periodic summaries). This analysis compares Plane vs Cascade across email types, templates, and delivery.

---

## Entry Points Comparison

| Entry Point | Plane | Cascade | Winner |
|-------------|-------|---------|--------|
| **Settings location** | Profile → Email | Settings → Notifications | Tie |
| **Unsubscribe link** | In email footer | In email footer | Tie |
| **Manage from email** | Link to settings | Link to settings | Tie |
| **Preview emails** | N/A | N/A | Tie |

---

## Email Types Comparison

### Transactional Emails (Immediate)

| Email Type | Plane | Cascade | Trigger |
|------------|-------|---------|---------|
| **Issue assigned** | Yes | Yes | When assigned to issue |
| **Issue commented** | Yes | Yes | Comment on subscribed issue |
| **Issue mentioned** | Yes | Yes | @mentioned in issue/comment |
| **Status changed** | Yes | Yes | Issue status changes |
| **Sprint started** | N/A | Yes | Sprint you're in starts |
| **Sprint ended** | N/A | Yes | Sprint completes |
| **Document shared** | N/A | Yes | Document shared with you |
| **Project invite** | Yes | Yes | Invited to project |
| **Workspace invite** | Yes | Yes | Invited to workspace |

### Digest Emails (Periodic)

| Digest Type | Plane | Cascade | Content |
|-------------|-------|---------|---------|
| **Daily digest** | No | Yes | Yesterday's activity summary |
| **Weekly digest** | No | Yes | Week's activity summary |
| **Marketing** | Weekly | Optional | Product updates |

---

## Layout Comparison

### Plane Email Template
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [plane logo]                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Issue Assigned                                                              │
│ ────────────────────────────────────────────────────────────────           │
│                                                                             │
│ Hi {userName},                                                              │
│                                                                             │
│ {assignedBy} assigned you to:                                               │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ PROJ-123                                                                ││
│ │ Fix authentication bug                                                  ││
│ │                                                                          ││
│ │ Priority: High  •  Status: To Do                                        ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│                         [View Issue]                                        │
│                                                                             │
│ ────────────────────────────────────────────────────────────────           │
│ You received this email because you're subscribed to issue notifications.  │
│ Manage your preferences | Unsubscribe                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Template Stack: HTML templates, unknown framework
Delivery: AWS SES or SendGrid
```

### Cascade Email Template
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            [Cascade logo]                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ You've been assigned to an issue                                            │
│                                                                             │
│ Hi {userName},                                                              │
│                                                                             │
│ {assignedBy} just assigned you to:                                          │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ 🐛 PROJ-123                                                             ││
│ │ Fix authentication bug                                                  ││
│ │                                                                          ││
│ │ Project: Payment System                                                  ││
│ │ Priority: ● High                                                         ││
│ │ Due: January 20, 2026                                                    ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│                    [ View Issue in Cascade ]                                │
│                                                                             │
│ ────────────────────────────────────────────────────────────────           │
│ {Organization Name} • {Project Name}                                        │
│                                                                             │
│ Manage notification preferences                                             │
│ Unsubscribe from these emails                                               │
│                                                                             │
│ © 2026 Cascade                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Template Stack: React Email
Delivery: Resend
```

---

## Digest Email Layout (Cascade Only)

### Daily Digest
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            [Cascade logo]                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Your Daily Summary - January 15, 2026                                       │
│                                                                             │
│ Hi {userName}, here's what happened yesterday:                              │
│                                                                             │
│ ┌─ Issues Assigned (3) ────────────────────────────────────────────────────┐│
│ │ 🐛 PROJ-123  Fix authentication bug         ● High                       ││
│ │ 🔧 PROJ-124  Update API endpoints           ● Medium                      ││
│ │ 📖 PROJ-125  Write documentation            ● Low                         ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─ Comments on Your Issues (5) ────────────────────────────────────────────┐│
│ │ PROJ-123: "Looks good, just one fix..."     - Alice                      ││
│ │ PROJ-123: "I agree with Alice"               - Bob                        ││
│ │ PROJ-456: "Can we discuss this?"             - Carol                      ││
│ │ +2 more comments                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─ Sprint Progress ────────────────────────────────────────────────────────┐│
│ │ Sprint 5: 67% complete                                                   ││
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░                         ││
│ │ 8 of 12 issues completed • 4 days remaining                               ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│                      [ View Dashboard ]                                     │
│                                                                             │
│ ────────────────────────────────────────────────────────────────           │
│ You're receiving daily digests. Change to weekly or unsubscribe.            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Weekly Digest
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            [Cascade logo]                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Your Weekly Summary - Week of January 13, 2026                              │
│                                                                             │
│ ┌─ This Week's Highlights ─────────────────────────────────────────────────┐│
│ │                                                                          ││
│ │  📊 12 issues completed    📝 8 issues assigned    💬 24 comments        ││
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─ Completed Issues ───────────────────────────────────────────────────────┐│
│ │ ✅ PROJ-100  Implement payment flow                                      ││
│ │ ✅ PROJ-101  Add user settings page                                      ││
│ │ ✅ PROJ-102  Fix dashboard charts                                        ││
│ │ +9 more completed                                                         ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─ Upcoming Due Dates ─────────────────────────────────────────────────────┐│
│ │ 📅 Jan 20: PROJ-123 Fix authentication bug                               ││
│ │ 📅 Jan 22: PROJ-124 Update API endpoints                                 ││
│ │ 📅 Jan 25: PROJ-125 Write documentation                                  ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ ┌─ Sprint Summary ─────────────────────────────────────────────────────────┐│
│ │ Sprint 5: 67% complete (4 days remaining)                                ││
│ │ Sprint 4: ✅ Completed (8 of 10 issues delivered)                        ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│                      [ View Full Report ]                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Delivery Architecture

### Plane Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Event Flow:                                                                  │
│                                                                             │
│ App Event → Notification Service → Email Queue → Email Provider            │
│     │              │                    │              │                    │
│  Issue           Create             Job queued      AWS SES/               │
│ assigned       notification          (async)      SendGrid                 │
│                                                                             │
│ Features:                                                                   │
│ - Async job queue for delivery                                              │
│ - Retry logic for failures                                                  │
│ - Rate limiting per user                                                    │
│ - Template rendering                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cascade Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Transactional Flow:                                                          │
│                                                                             │
│ App Event → Convex Mutation → Convex Action → Resend API                    │
│     │            │                 │              │                         │
│  Issue       Create            Send email      Delivery                     │
│ assigned   notification        (action)       + tracking                    │
│                                                                             │
│ Digest Flow:                                                                 │
│                                                                             │
│ Cron Job → Aggregate Activity → Render Template → Resend API               │
│ (8am UTC)       (24h/7d)        (React Email)                              │
│                                                                             │
│ Features:                                                                   │
│ - Direct Resend API integration                                             │
│ - Automatic retry with exponential backoff                                  │
│ - Delivery status tracking (sent, delivered, bounced)                       │
│ - React Email for type-safe templates                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Rate Limiting & Batching

| Feature | Plane | Cascade |
|---------|-------|---------|
| **Rate limit** | Unknown | 10/hour/user |
| **Batch similar** | Unknown | Yes |
| **Digest exemption** | N/A | Yes |
| **Throttling** | Unknown | Yes |

### Cascade Smart Batching
```
Before batching:
├─ Email: Comment on PROJ-123 by Alice
├─ Email: Comment on PROJ-123 by Bob
├─ Email: Comment on PROJ-123 by Carol
├─ Email: Comment on PROJ-123 by Dave
└─ Email: Comment on PROJ-123 by Eve

After batching (5 min window):
└─ Email: 5 new comments on PROJ-123
    └─ Alice: "First comment..."
    └─ Bob: "Second comment..."
    └─ Carol: "Third comment..."
    └─ +2 more
```

---

## User Controls Comparison

| Control | Plane | Cascade |
|---------|-------|---------|
| **Per-type toggle** | Yes (5 types) | Yes (8 types) |
| **Digest frequency** | N/A | None/Daily/Weekly |
| **Marketing opt-out** | Yes | Yes |
| **Unsubscribe all** | Via link | Via link |
| **Timezone setting** | Unknown | Yes (for digest) |
| **Quiet hours** | N/A | N/A (future) |

---

## Email Settings UI

### Plane Settings
```
Profile → Email Notifications:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Email Notifications                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ☑ Property changes                                                          │
│   Notify when issue properties change                                       │
│                                                                             │
│ ☑ State changes                                                             │
│   Notify when issue status changes                                          │
│                                                                             │
│ ☑ Comments                                                                   │
│   Notify when someone comments                                              │
│                                                                             │
│ ☑ Mentions                                                                   │
│   Notify when you're @mentioned                                             │
│                                                                             │
│ ☑ Issue assignments                                                          │
│   Notify when assigned to an issue                                          │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────          │
│                                                                             │
│ ☐ Weekly product updates                                                    │
│   Receive news about new features                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cascade Settings
```
Settings → Notifications → Email:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Email Notifications                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Transactional Emails                                                        │
│ ────────────────────────────────────────────────────────────────           │
│ ☑ Issue assigned          Get notified when assigned to an issue           │
│ ☑ Issue commented         Get notified about comments on your issues       │
│ ☑ Issue mentioned         Get notified when @mentioned                     │
│ ☑ Status changed          Get notified when issue status changes           │
│ ☑ Sprint started          Get notified when your sprint starts             │
│ ☑ Sprint ended            Get notified when your sprint completes          │
│ ☑ Document shared         Get notified when documents are shared           │
│ ☑ Project invite          Get notified about project invitations           │
│                                                                             │
│ Email Digest                                                                │
│ ────────────────────────────────────────────────────────────────           │
│ Frequency: [Weekly ▼]                                                       │
│            ○ None - No digest emails                                        │
│            ○ Daily - Every morning                                          │
│            ● Weekly - Every Monday                                          │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────          │
│                                                                             │
│ ☐ Marketing emails                                                          │
│   Product updates and announcements                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary Scorecard

| Category | Plane | Cascade | Notes |
|----------|-------|---------|-------|
| Email types | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade more types |
| Digest emails | ⭐ | ⭐⭐⭐⭐⭐ | Cascade only |
| Template quality | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade React Email |
| Smart batching | ⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade consolidates |
| Rate limiting | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade documented |
| Delivery tracking | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Resend provides |
| User controls | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cascade more options |
| Frequency control | ⭐ | ⭐⭐⭐⭐⭐ | Cascade digest freq |
| Unsubscribe | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both have link |
| Marketing opt-out | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Both have toggle |

---

## Priority Recommendations for Cascade

### P0 - Critical
(Cascade already exceeds Plane in this area)

### P1 - High
1. **Add email preview in settings** - Show sample of each email type
2. **Add smart batching refinement** - Configurable batch window (5/15/30 min)
3. **Add bounce handling** - Auto-disable on repeated bounces

### P2 - Medium
4. **Add quiet hours** - No emails during specified times
5. **Add timezone selection** - User-selectable digest delivery time
6. **Add email analytics dashboard** - Open rates, click rates (admin)

### P3 - Nice to Have
7. **Add plain text fallback** - For email clients without HTML support
8. **Add email forwarding rules** - Forward specific types to other addresses
9. **Add weekly summary chart** - Visual velocity chart in weekly digest

---

## Cascade Strengths

1. **Digest System** - Daily and weekly summaries reduce notification fatigue
2. **React Email** - Modern, maintainable, type-safe templates
3. **Rate Limiting** - Prevents email overload with documented limits
4. **Delivery Tracking** - Know when emails are delivered/bounced via Resend
5. **Smart Batching** - Similar notifications consolidated into single email
6. **More Email Types** - Sprint and document notifications included

---

## Code References

### Plane
- Email settings: `apps/web/app/profile/emails/`
- Email service: `apiserver/plane/app/views/notification/`
- Templates: `apiserver/templates/`

### Cascade
- Email templates: `emails/` directory
  - `IssueAssignedEmail.tsx`
  - `IssueCommentEmail.tsx`
  - `IssueMentionEmail.tsx`
  - `SprintStartEmail.tsx`
  - `SprintEndEmail.tsx`
  - `DailyDigestEmail.tsx`
  - `WeeklyDigestEmail.tsx`
- Backend: `convex/email/`
- Digest cron: `convex/crons.ts`
- Resend integration: `convex/email/send.ts`
- Settings: `convex/notificationPreferences.ts`
