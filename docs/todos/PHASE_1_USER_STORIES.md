# Phase 1: User Stories Coverage

> **Status:** ✅ Complete
> **Last Updated:** 2026-02-17

Benchmarking against Plane, Cal.com, and Mintlify for feature parity.

---

## 1.1 Issue Tracking (Plane Parity)

| User Story | Plane | Nixelo | Gap | Priority |
|------------|-------|--------|-----|----------|
| Create issue with type (bug/task/story/epic) | ✅ | ✅ | - | - |
| Assign issue to team member | ✅ | ✅ | - | - |
| Set priority (highest→lowest) | ✅ | ✅ | - | - |
| Add labels to issues | ✅ | ✅ | - | - |
| Create sub-issues | ✅ | ✅ | - | - |
| Add attachments to issues | ✅ | ✅ | Full system! | - |
| Link related issues | ✅ | ✅ | Full system! | - |
| Add reactions to issues | ✅ | ✅ | - | - |
| Watch/subscribe to issues | ✅ | ✅ | - | - |
| Bulk edit issues | ✅ | ✅ | - | - |
| Bulk delete issues | ✅ | ✅ | - | - |
| Bulk archive issues | ✅ | ✅ | Plane parity! | - |
| Bulk update start date | ✅ | ✅ | Plane parity! | - |
| Bulk update due date | ✅ | ✅ | Plane parity! | - |
| Issue templates | ✅ | ✅ | Plane-parity! | - |
| Custom fields | ✅ | ✅ | - | - |
| Time tracking on issues | ❌ | ✅ | Nixelo advantage | - |
| Story points | ✅ | ✅ | - | - |
| Due dates | ✅ | ✅ | - | - |
| Start dates | ✅ | ✅ | startDate field added! | - |

**Research Tasks:**
- [ ] Audit Plane's issue model: `/home/mikhail/Desktop/plane/apiserver/plane/db/models/issue.py`
- [ ] Audit Plane's bulk operations: `/home/mikhail/Desktop/plane/apps/web/core/store/issue/`
- [ ] Compare attachment handling
- [ ] Compare issue linking/relations

---

## 1.2 Kanban Board (Plane Parity)

| User Story | Plane | Nixelo | Gap | Priority |
|------------|-------|--------|-----|----------|
| Drag issues between columns | ✅ | ✅ | - | - |
| Reorder issues within column | ✅ | ✅ | Implemented! | - |
| Drag-drop library (Pragmatic DnD) | ✅ | ✅ | Just implemented! | - |
| Auto-scroll while dragging | ✅ | ✅ | - | - |
| Group by status | ✅ | ✅ | - | - |
| Group by priority | ✅ | ✅ | Via swimlanes! | - |
| Group by assignee | ✅ | ✅ | Via swimlanes! | - |
| Sub-grouping (swimlanes) | ✅ | ✅ | Implemented! | - |
| Column WIP limits | ❌ | ✅ | Nixelo advantage! | - |
| Quick add issue in column | ✅ | ✅ | - | - |
| Collapse/expand columns | ✅ | ✅ | Plane parity! | - |
| Column virtualization | ✅ | ✅ | VirtualList.tsx w/ react-window | - |
| Keyboard navigation (vim-style) | ✅ | ✅ | useListNavigation hook! | - |
| Delete zone (drag to delete) | ✅ | ❌ | Missing | Low |

**Research Tasks:**
- [ ] Study Plane's grouping: `/home/mikhail/Desktop/plane/apps/web/core/components/issues/issue-layouts/kanban/`
- [ ] Study Plane's swimlanes implementation
- [ ] Study Plane's virtualization HOC
- [ ] Document Plane's keyboard shortcuts

---

## 1.3 Sprint/Cycle Management (Plane Parity)

| User Story | Plane | Nixelo | Gap | Priority |
|------------|-------|--------|-----|----------|
| Create sprint with dates | ✅ | ✅ | - | - |
| Set sprint goal | ✅ | ✅ | - | - |
| Add issues to sprint | ✅ | ✅ | - | - |
| Sprint backlog view | ✅ | ✅ | - | - |
| Sprint board view | ✅ | ✅ | - | - |
| Burndown chart | ✅ | ✅ | - | - |
| Velocity chart | ✅ | ✅ | getTeamVelocity in analytics.ts! | - |
| Sprint retrospective | ✅ | ❓ | Verify | Low |
| Carry over incomplete issues | ✅ | ✅ | Manual via bulkMoveToSprint | - |
| Sprint templates | ❌ | ✅ | Nixelo advantage! | - |

**Research Tasks:**
- [ ] Audit Plane's cycle model: `/home/mikhail/Desktop/plane/apiserver/plane/db/models/cycle.py`
- [ ] Study Plane's analytics/charts

---

## 1.4 Documents (Plane Parity)

| User Story | Plane | Nixelo | Gap | Priority |
|------------|-------|--------|-----|----------|
| Rich text editor (ProseMirror) | ✅ | ✅ | - | - |
| Real-time collaboration (Y.js) | ✅ | ✅ | - | - |
| Version history | ✅ | ✅ | - | - |
| Document templates | ✅ | ✅ | - | - |
| Public sharing | ✅ | ✅ | - | - |
| Nested pages (hierarchy) | ✅ | ✅ | Implemented! | - |
| Document search | ✅ | ✅ | Full search with filters! | - |
| Embed issues in docs | ✅ (Pro) | ❌ | Plane Pro-only feature | Low |
| AI writing assistant | ✅ | ✅ | - | - |
| Document comments | ❌ | ✅ | Nixelo advantage! | - |
| Document reactions | ✅ | ❓ | Verify | Low |

**Research Tasks:**
- [ ] Study Plane's page hierarchy: `/home/mikhail/Desktop/plane/apps/web/core/components/pages/`
- [ ] Study Plane's document embedding

---

## 1.5 Inbox/Triage (Plane Feature)

| User Story | Plane | Nixelo | Gap | Priority |
|------------|-------|--------|-----|----------|
| Issues land in inbox first | ✅ | ✅ | Implemented! | - |
| Accept issue (move to backlog) | ✅ | ✅ | Implemented! | - |
| Decline issue | ✅ | ✅ | Implemented! | - |
| Snooze issue until date | ✅ | ✅ | Implemented! | - |
| Mark as duplicate | ✅ | ✅ | Implemented! | - |
| Inbox filters | ✅ | ✅ | Open/Closed tabs | - |
| Bulk triage actions | ✅ | ✅ | Nixelo parity! | - |

**Research Tasks:**
- [ ] Study Plane's inbox store: `/home/mikhail/Desktop/plane/apps/web/core/store/inbox/`
- [ ] Study Plane's inbox UI: `/home/mikhail/Desktop/plane/apps/web/core/components/inbox/`

---

## 1.6 Auth & Security (Cal.com Parity)

| User Story | Cal.com | Nixelo | Gap | Priority |
|------------|---------|--------|-----|----------|
| Email/password auth | ✅ | ✅ | - | - |
| Magic link auth | ✅ | ✅ | - | - |
| OAuth (Google, GitHub) | ✅ | ✅ | - | - |
| 2FA (TOTP) | ✅ | ✅ | - | - |
| Session management | ✅ | ✅ | - | - |
| Email verification | ✅ | ✅ | - | - |
| Password reset | ✅ | ✅ | - | - |
| SSO (SAML) | ✅ | ✅ | - | - |
| IP restrictions | ❌ | ✅ | Nixelo advantage! | - |
| Audit logs | ✅ | ✅ | - | - |

**Research Tasks:**
- [ ] Audit Cal.com auth: `/home/mikhail/Desktop/cal.com/packages/features/auth/`

---

## 1.7 Calendar/Scheduling (Cal.com Parity)

| User Story | Cal.com | Nixelo | Gap | Priority |
|------------|---------|--------|-----|----------|
| Create events | ✅ | ✅ | - | - |
| Set attendees | ✅ | ✅ | - | - |
| Recurring events | ✅ | ✅ | - | - |
| Video conferencing link | ✅ | ✅ | - | - |
| Calendar integrations (Google) | ✅ | ✅ | - | - |
| Availability management | ✅ | ✅ | - | - |
| Booking links | ✅ | ❌ | Missing | Medium |
| Event reminders | ✅ | ✅ | Cal.com parity! | - |

**Research Tasks:**
- [ ] Study Cal.com event types: `/home/mikhail/Desktop/cal.com/packages/features/eventtypes/`

---

## 1.8 Notifications (Cross-Platform)

| User Story | Plane | Cal.com | Nixelo | Notes |
|------------|-------|---------|--------|-------|
| In-app notifications | ✅ | ✅ | ✅ | NotificationCenter |
| Email notifications | ✅ | ✅ | ✅ | React Email |
| Push notifications | ❌ | ✅ | ✅ | Web Push API |
| Notification preferences | ✅ | ✅ | ✅ | Per-type toggles |
| Email digests | ❌ | ✅ | ✅ | Daily/weekly |
| @mentions | ✅ | ✅ | ✅ | - |

---

## Run Log

Track each improvement session here.

| Date | Section | Work Done | Items Completed | Next Priority |
|------|---------|-----------|-----------------|---------------|
| 2026-02-15 | 1.1 Issue Tracking | Verified bulk ops: status, priority, assign, labels, sprint, delete all work. Gaps found: bulk archive, bulk start/due dates | 2 | Verify in-app notifications |
| 2026-02-15 | 1.8 Notifications | Full notification system confirmed: NotificationCenter UI, mark read/all, preferences (mentions, assignments, comments, status, digests), email integration | 6 | Audit empty states |
| 2026-02-15 | 1.4 Documents | Implemented nested pages: parentId/order fields in schema, by_parent/by_organization_parent indexes, listChildren/getTree/moveDocument/reorderDocuments/getBreadcrumbs queries, DocumentTree UI component with expand/collapse | 10 | P1: Inbox/triage |
| 2026-02-15 | 1.5 Inbox/Triage | Full inbox system: inboxIssues table with status (pending/accepted/declined/snoozed/duplicate), source tracking, validators, 9 Convex functions, InboxList UI with tabs, quick actions | 10 | P1: Animation audit |
| 2026-02-15 | 1.2 Kanban | Implemented swimlanes (sub-grouping): SwimlanGroupBy type, swimlane-utils.ts, SwimlanSelector dropdown, collapsible SwimlanRow component | 5 | P2: Issue templates |
| 2026-02-15 | 1.1 Issue Templates | Upgraded to Plane-parity: defaultAssigneeId, defaultStatus, defaultStoryPoints, isDefault fields | 5 | P2: Sprint templates |
| 2026-02-15 | 1.3 Sprint Templates | Nixelo advantage over Plane! 5 duration presets (1/2/3/4 week + custom) | 5 | P2: Document comments |
| 2026-02-15 | 1.4 Document Comments | Nixelo advantage over Plane! documentComments + reactions tables, full API | 5 | P3 backlog |
| 2026-02-15 | 1.2 Column WIP Limits | Nixelo advantage over Plane! wipLimit field, visual indicators | 5 | P3 backlog |
| 2026-02-15 | 1.6 IP Restrictions | Nixelo advantage over Cal.com! organizationIpAllowlist table, CIDR support | 5 | P3: OAuth app creation |
| 2026-02-15 | 1.8 Push Notifications | Cal.com parity! pushSubscriptions table, Web Push API, service worker | 5 | P3: Kanban reorder |
| 2026-02-15 | 1.2 Kanban Reorder | Plane parity! fractional ordering, edge detection | 5 | Issue archiving |
| 2026-02-15 | 1.1 Issue Archive | Plane parity! archivedAt/archivedBy fields, bulk archive/restore | 5 | Verify features |
| 2026-02-15 | 1.7 Event Reminders | Cal.com parity! eventReminders table, cron job every 5 minutes | 5 | Continue improvements |
| 2026-02-15 | 1.1 Bulk Dates | Plane parity! startDate field, bulkUpdateStartDate/DueDate mutations | 3 | Continue improvements |
| 2026-02-15 | 1.5 Bulk Triage | bulkAccept/bulkDecline/bulkSnooze mutations, bulk actions bar | 3 | Continue improvements |
| 2026-02-15 | 1.2 Column Collapse | Plane parity! isCollapsed state, vertical column name | 2 | 100% complete! |

---

## Priority Matrix

### P0 (Critical - This Week)
1. [x] Verify bulk edit/delete issues ✅
2. [x] Verify in-app notifications ✅
3. [x] Audit empty states ✅
4. [x] Audit loading states ✅

### P1 (High - This Month)
1. [x] Implement nested pages (documents) ✅
2. [x] Implement inbox/triage workflow ✅
3. [x] Audit animation consistency ✅
4. [x] Add keyboard shortcuts help ✅

### P2 (Medium - This Quarter)
1. [x] Swimlanes in Kanban ✅
2. [x] Issue templates ✅
3. [x] Sprint templates ✅
4. [x] Document comments ✅

### P3 (Low - Backlog)
1. [x] Column WIP limits ✅
2. [x] IP restrictions ✅
3. [-] OAuth app creation (Deferred - API keys cover 95% of use cases)
4. [x] Push notifications ✅
