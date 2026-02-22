# Competitive Parity - Plane & Cal.com Features

> **Priority:** P1 (Core)
> **Status:** Not Started
> **Last Updated:** 2026-02-21
> **Source Repos:** `/home/mikhail/Desktop/plane`, `/home/mikhail/Desktop/cal.com`

---

## Overview

Feature gaps identified from competitive analysis. We have full source access to both repos - copy patterns directly.

---

## Phase 1: Views & Layouts (Plane Parity)

### 1.1 Gantt View
**What:** Timeline visualization for issues with dependencies
**Why:** #1 requested view in project management tools
**Effort:** Large (3-5 days)

**User Stories:**
- "As a PM, I want to see issue timelines on a Gantt chart so I can visualize project schedule"
- "As a PM, I want to drag issue bars to adjust dates"
- "As a PM, I want to see dependency lines between issues"

**Copy From Plane:**
```
/home/mikhail/Desktop/plane/apps/web/core/components/gantt-chart/
├── blocks/                    # Issue bars rendering
├── chart/                     # Main chart component
├── contexts/                  # Gantt state management
├── helpers/                   # Date calculations
├── hooks/                     # useGanttChart, etc.
├── root.tsx                   # Entry point
├── sidebar/                   # Left panel with issue list
└── views/                     # Different gantt layouts
```

**Nixelo Implementation:**
- [ ] Create `src/components/GanttView/` directory
- [ ] Port `gantt-chart/chart/` for core rendering
- [ ] Port `gantt-chart/blocks/` for issue bars
- [ ] Add route `/$orgSlug/projects/$key/gantt`
- [ ] Connect to existing `issues` queries
- [ ] Add drag-to-resize for date changes
- [ ] Render dependency lines from `issueLinks`

---

### 1.2 Spreadsheet View
**What:** Excel-like grid for bulk issue editing
**Why:** Power users need fast bulk edits
**Effort:** Medium (2-3 days)

**User Stories:**
- "As a user, I want to edit multiple issues in a spreadsheet view"
- "As a user, I want to copy/paste values across cells"
- "As a user, I want to sort and filter columns"

**Copy From Plane:**
```
/home/mikhail/Desktop/plane/apps/web/core/components/issues/issue-layouts/spreadsheet/
├── columns/                   # Column definitions (assignee, priority, etc.)
├── issue-row.tsx              # Row component
├── roots/                     # Layout roots
├── spreadsheet-header.tsx     # Column headers
├── spreadsheet-table.tsx      # Main table
└── spreadsheet-view.tsx       # Entry point
```

**Nixelo Implementation:**
- [ ] Create `src/components/SpreadsheetView/` directory
- [ ] Port column definitions from `columns/`
- [ ] Use existing `@tanstack/react-table` or add it
- [ ] Inline editing with mutation calls
- [ ] Add route `/$orgSlug/projects/$key/spreadsheet`
- [ ] Bulk selection + bulk operations bar integration

---

### 1.3 Modules (Feature-Based Work Units)
**What:** Group issues by feature/component (parallel to sprints)
**Why:** Teams organize by feature, not just time
**Effort:** Medium (2-3 days)

**User Stories:**
- "As a PM, I want to group issues by feature module"
- "As a PM, I want to track module progress independently of sprints"
- "As a PM, I want modules with status: backlog → planned → in-progress → completed"

**Copy From Plane:**
```
/home/mikhail/Desktop/plane/apps/api/plane/db/models/module.py  # Schema
/home/mikhail/Desktop/plane/apps/web/core/components/modules/   # UI
├── module-card-item.tsx
├── module-list-item.tsx
├── module-peek-overview.tsx
├── dropdowns/
└── sidebar/
```

**Nixelo Implementation:**
- [ ] Add `modules` table to `convex/schema.ts`:
  ```typescript
  modules: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"),
      v.literal("planned"),
      v.literal("in_progress"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    leadId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    // ...
  })
  ```
- [ ] Add `moduleId` to issues table
- [ ] Create `convex/modules.ts` CRUD
- [ ] Create `src/components/Modules/` UI
- [ ] Add route `/$orgSlug/projects/$key/modules`

---

### 1.4 Intake/Triage System
**What:** Queue for new issues before they enter workflow
**Why:** Teams need to review/approve incoming requests
**Effort:** Small (1-2 days)

**User Stories:**
- "As a lead, I want incoming issues to go to triage first"
- "As a lead, I want to accept/reject/snooze triaged issues"
- "As a lead, I want to mark duplicates"

**Copy From Plane:**
```
/home/mikhail/Desktop/plane/apps/api/plane/db/models/intake.py
/home/mikhail/Desktop/plane/apps/web/core/components/inbox/     # They call it inbox too!
```

**Nixelo Implementation:**
- [ ] We already have `inboxIssues` table - extend it:
  ```typescript
  // Add fields:
  triageStatus: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("rejected"),
    v.literal("snoozed"),
    v.literal("duplicate")
  ),
  duplicateOfId: v.optional(v.id("issues")),
  snoozedUntil: v.optional(v.number()),
  ```
- [ ] Update inbox UI with triage actions
- [ ] Add bulk triage operations

---

### 1.5 Additional Issue Relations
**What:** More relation types beyond blocks/relates/duplicates
**Why:** Better dependency modeling
**Effort:** Small (1 day)

**Current Nixelo:** `blocks`, `relates_to`, `duplicates`
**Plane Has:** + `start_before`, `finish_before`, `implemented_by`

**Nixelo Implementation:**
- [ ] Add to `issueLinks` linkType validator:
  ```typescript
  v.literal("start_before"),
  v.literal("finish_before"),
  v.literal("implemented_by"),
  ```
- [ ] Update `IssueLinks` UI to support new types
- [ ] Add to Gantt view dependency rendering

---

## Phase 2: Calendar & Scheduling (Cal.com Parity)

### 2.1 Round-Robin Scheduling
**What:** Rotate meeting host among team members
**Why:** Sales/support teams need load balancing
**Effort:** Medium (2-3 days)

**User Stories:**
- "As a team lead, I want meetings auto-assigned to available team members"
- "As a team lead, I want to set rotation rules (daily, weekly)"
- "As a team lead, I want to weight team members differently"

**Copy From Cal.com:**
```
/home/mikhail/Desktop/cal.com/packages/trpc/server/routers/viewer/eventTypes/
├── getByViewer.handler.ts     # Round-robin config
├── types.ts                   # RRResetInterval, schedulingType

/home/mikhail/Desktop/cal.com/packages/lib/server/
├── getAggregatedAvailability/ # Multi-user availability calc
```

**Nixelo Implementation:**
- [ ] Add to `bookingPages` schema:
  ```typescript
  schedulingType: v.union(
    v.literal("individual"),
    v.literal("round_robin"),
    v.literal("collective")  // All must be available
  ),
  roundRobinInterval: v.optional(v.union(
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("monthly")
  )),
  hostWeights: v.optional(v.array(v.object({
    userId: v.id("users"),
    weight: v.number()
  }))),
  ```
- [ ] Create `convex/scheduling.ts` with round-robin logic
- [ ] Update booking flow to assign host
- [ ] Track last assigned per rotation period

---

### 2.2 Video Conferencing Integrations
**What:** Auto-generate Zoom/Meet/Teams links
**Why:** Every booking needs a meeting link
**Effort:** Medium (2-3 days per provider)

**User Stories:**
- "As a user, I want Zoom links auto-created when someone books"
- "As a user, I want to choose my video provider per event type"

**Copy From Cal.com:**
```
/home/mikhail/Desktop/cal.com/packages/app-store/
├── zoomvideo/
│   ├── api/                   # OAuth handlers
│   ├── lib/                   # Meeting creation
│   └── zod.ts                 # Validation
├── googlevideo/               # Google Meet
├── office365video/            # MS Teams
└── dailyvideo/                # Daily.co
```

**Nixelo Implementation:**
- [ ] Add `videoProvider` to `calendarEvents`/`bookingPages`:
  ```typescript
  videoProvider: v.optional(v.union(
    v.literal("zoom"),
    v.literal("google_meet"),
    v.literal("ms_teams"),
    v.literal("daily")
  )),
  videoMeetingUrl: v.optional(v.string()),
  videoMeetingId: v.optional(v.string()),
  ```
- [ ] Create `convex/integrations/zoom.ts`:
  - OAuth flow (similar to Google Calendar)
  - `createMeeting` action
  - Store credentials in `calendarConnections`
- [ ] Create `convex/integrations/googleMeet.ts`
- [ ] Create `convex/integrations/msTeams.ts`
- [ ] Auto-create meeting on booking confirmation

---

### 2.3 Workflow Automation (Reminders)
**What:** Email/SMS reminders before/after events
**Why:** Reduce no-shows, improve engagement
**Effort:** Medium (2-3 days)

**User Stories:**
- "As a host, I want attendees reminded 24h before meeting"
- "As a host, I want follow-up email sent after meeting"
- "As a host, I want custom reminder templates"

**Copy From Cal.com:**
```
/home/mikhail/Desktop/cal.com/packages/features/ee/workflows/
├── components/                # Workflow builder UI
├── lib/                       # Workflow execution
│   ├── reminders/
│   │   ├── emailReminderManager.ts
│   │   └── smsReminderManager.ts
│   └── variableTranslations/  # Template variables
```

**Nixelo Implementation:**
- [ ] Add `workflows` table:
  ```typescript
  workflows: defineTable({
    name: v.string(),
    projectId: v.optional(v.id("projects")),
    trigger: v.union(
      v.literal("booking_created"),
      v.literal("booking_cancelled"),
      v.literal("event_reminder"),
      v.literal("event_completed")
    ),
    triggerOffset: v.optional(v.number()), // minutes before/after
    actions: v.array(v.object({
      type: v.union(
        v.literal("email_host"),
        v.literal("email_attendee"),
        v.literal("sms_attendee"),
        v.literal("webhook")
      ),
      template: v.optional(v.string()),
      webhookUrl: v.optional(v.string()),
    })),
    isActive: v.boolean(),
  })
  ```
- [ ] Add `workflowReminders` table for scheduled execution
- [ ] Create cron job to process reminders
- [ ] Integrate with existing email system (Resend)
- [ ] Build workflow builder UI

---

### 2.4 Routing Forms
**What:** Qualify bookers before showing availability
**Why:** Route to right team member based on answers
**Effort:** Medium (2-3 days)

**User Stories:**
- "As a sales team, I want to ask qualification questions before booking"
- "As a sales team, I want different questions to route to different reps"

**Copy From Cal.com:**
```
/home/mikhail/Desktop/cal.com/packages/app-store/routing-forms/
├── components/
│   ├── FormBuilder.tsx
│   ├── RoutingForm.tsx
│   └── SingleForm.tsx
├── lib/
│   ├── getSerializableForm.ts
│   └── processRoute.ts
```

**Nixelo Implementation:**
- [ ] Add `routingForms` table:
  ```typescript
  routingForms: defineTable({
    bookingPageId: v.id("bookingPages"),
    name: v.string(),
    fields: v.array(v.object({
      id: v.string(),
      type: v.union(v.literal("text"), v.literal("select"), v.literal("email")),
      label: v.string(),
      options: v.optional(v.array(v.string())),
      required: v.boolean(),
    })),
    routes: v.array(v.object({
      conditions: v.array(v.object({
        fieldId: v.string(),
        operator: v.union(v.literal("equals"), v.literal("contains")),
        value: v.string(),
      })),
      action: v.union(
        v.object({ type: v.literal("assign_user"), userId: v.id("users") }),
        v.object({ type: v.literal("redirect"), url: v.string() }),
        v.object({ type: v.literal("show_message"), message: v.string() }),
      ),
    })),
  })
  ```
- [ ] Create form builder UI
- [ ] Process routes on form submit
- [ ] Show qualified slots based on routing

---

### 2.5 Payment Processing (Stripe)
**What:** Charge for bookings
**Why:** Consultants, coaches need paid bookings
**Effort:** Medium (2-3 days)

**User Stories:**
- "As a consultant, I want to charge $100 for a 1-hour session"
- "As a consultant, I want payment collected at booking time"

**Copy From Cal.com:**
```
/home/mikhail/Desktop/cal.com/packages/app-store/stripepayment/
├── api/
│   ├── webhook.ts             # Stripe webhooks
│   └── callback.ts            # OAuth callback
├── lib/
│   ├── PaymentService.ts
│   └── server.ts
```

**Nixelo Implementation:**
- [ ] Add to `bookingPages`:
  ```typescript
  price: v.optional(v.number()),        // cents
  currency: v.optional(v.string()),     // "USD"
  paymentRequired: v.optional(v.boolean()),
  stripeAccountId: v.optional(v.string()),
  ```
- [ ] Add `payments` table:
  ```typescript
  payments: defineTable({
    bookingId: v.id("bookings"),
    amount: v.number(),
    currency: v.string(),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("refunded")),
    stripePaymentIntentId: v.string(),
    // ...
  })
  ```
- [ ] Create Stripe Connect OAuth flow
- [ ] Create payment intent on booking
- [ ] Handle Stripe webhooks
- [ ] Show payment UI in booking flow

---

## Phase 3: Integrations

### 3.1 Slack Integration (Full)
**What:** Beyond Pumble - actual Slack integration
**Why:** Most teams use Slack
**Effort:** Medium (2-3 days)

**Copy From Plane:**
```
/home/mikhail/Desktop/plane/apps/api/plane/app/views/external/v1/slack.py
/home/mikhail/Desktop/plane/apps/api/plane/db/models/integration/slack.py
```

**Nixelo Implementation:**
- [ ] Create Slack app in api.slack.com
- [ ] OAuth flow for workspace connection
- [ ] Issue notifications to channels
- [ ] Slash commands (`/nixelo create`, `/nixelo search`)
- [ ] Link unfurling (show issue preview)

---

### 3.2 Outlook Calendar Sync
**What:** Microsoft 365 calendar integration
**Why:** Enterprise uses Outlook
**Effort:** Medium (2-3 days)

**Copy From Cal.com:**
```
/home/mikhail/Desktop/cal.com/packages/app-store/office365calendar/
├── api/
│   ├── callback.ts
│   └── add.ts
├── lib/
│   ├── CalendarService.ts
│   └── OAuthManager.ts
```

**Nixelo Implementation:**
- [ ] Register app in Azure AD
- [ ] OAuth flow for Microsoft Graph API
- [ ] Sync events bidirectionally
- [ ] Check busy times for availability

---

### 3.3 Zapier/n8n Integration
**What:** Connect to 5000+ apps via Zapier
**Why:** Users want custom automations
**Effort:** Small (1-2 days)

**Copy From Cal.com:**
```
/home/mikhail/Desktop/cal.com/packages/app-store/zapier/
```

**Nixelo Implementation:**
- [ ] Create Zapier app (zapier.com/developer)
- [ ] Define triggers: issue_created, booking_created, etc.
- [ ] Define actions: create_issue, create_booking
- [ ] Use existing webhook infrastructure

---

## Phase 4: AI Enhancements

### 4.1 AI Voice Agents (Cal.com Style)
**What:** AI answers booking inquiries via phone
**Why:** 24/7 availability for scheduling
**Effort:** Large (3-5 days)

**Copy From Cal.com:**
```
/home/mikhail/Desktop/cal.com/packages/features/ee/cal-ai-phone/
/home/mikhail/Desktop/cal.com/packages/app-store/retellai/
```

**Nixelo Implementation:**
- [ ] Integrate Retell AI or similar
- [ ] Create phone number provisioning
- [ ] AI script for booking flow
- [ ] Connect to availability API

---

## Priority Matrix

| Feature | Effort | Impact | Priority | Dependencies |
|---------|--------|--------|----------|--------------|
| Spreadsheet View | Medium | High | P1 | None |
| Gantt View | Large | High | P1 | Issue dates |
| Video Integrations | Medium | High | P1 | OAuth |
| Workflow Reminders | Medium | High | P1 | Email system |
| Modules | Medium | Medium | P2 | None |
| Round-Robin | Medium | Medium | P2 | Booking pages |
| Stripe Payments | Medium | Medium | P2 | Stripe account |
| Routing Forms | Medium | Medium | P2 | Booking pages |
| Intake/Triage | Small | Medium | P2 | Inbox exists |
| Slack Integration | Medium | Medium | P2 | Slack app |
| Outlook Sync | Medium | Medium | P2 | Azure AD |
| Issue Relations | Small | Low | P3 | None |
| Zapier | Small | Medium | P3 | Webhooks |
| AI Voice | Large | Low | P4 | Retell AI |

---

## Quick Wins (< 1 day each)

1. **Additional issue relations** - Just add to validator
2. **Intake triage status** - Extend existing inbox
3. **View switcher** - Add tabs for different views
4. **Bulk operations** - Extend existing bulk bar

---

## Implementation Order

**Week 1-2: Views**
1. Spreadsheet view (copy Plane)
2. Gantt view (copy Plane)

**Week 3-4: Calendar**
3. Video integrations (Zoom first)
4. Workflow reminders

**Week 5-6: Scheduling**
5. Round-robin scheduling
6. Routing forms

**Week 7-8: Integrations**
7. Slack full integration
8. Stripe payments
9. Outlook calendar

---

## File References

### Plane Codebase
```
/home/mikhail/Desktop/plane/
├── apps/web/core/components/
│   ├── gantt-chart/           # Gantt implementation
│   ├── issues/issue-layouts/
│   │   └── spreadsheet/       # Spreadsheet view
│   ├── modules/               # Modules feature
│   └── inbox/                 # Triage system
├── apps/api/plane/db/models/
│   ├── module.py              # Module schema
│   └── intake.py              # Intake schema
```

### Cal.com Codebase
```
/home/mikhail/Desktop/cal.com/
├── packages/app-store/
│   ├── zoomvideo/             # Zoom integration
│   ├── googlevideo/           # Google Meet
│   ├── stripepayment/         # Stripe
│   └── routing-forms/         # Routing forms
├── packages/features/ee/workflows/  # Workflow automation
├── packages/trpc/server/routers/
│   └── viewer/eventTypes/     # Round-robin logic
```

---

*Copy code, adapt patterns, ship fast.*
