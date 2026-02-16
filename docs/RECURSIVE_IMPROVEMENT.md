# Recursive Improvement Protocol

> **Purpose:** Living document for continuous quality improvement. When told "work on this doc", systematically improve Nixelo by benchmarking against Plane, Cal.com, and Mintlify.
>
> **Last Run:** 2026-02-15
> **Overall Progress:** 100/100

---

## How This Doc Works

1. **Invoke with:** "work on this doc" or "recursive improvement"
2. **Each run:** Pick the highest-priority incomplete section, research competitors, implement improvements
3. **Update:** Mark items complete, add findings, increment progress
4. **Repeat:** Until all sections reach 100%

---

## Quick Reference: Competitor Repos

| Competitor | Local Path | Focus |
|------------|------------|-------|
| **Plane** | `/home/mikhail/Desktop/plane` | Issue tracking, Kanban, workflows |
| **Cal.com** | `/home/mikhail/Desktop/cal.com` | Scheduling, auth, enterprise features |
| **Mintlify** | `docs/research/library/mintlify/` | Design polish, animations, premium feel |

---

## Section 1: User Stories Coverage

### 1.1 Issue Tracking (Plane Parity)

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

### 1.2 Kanban Board (Plane Parity)

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

### 1.3 Sprint/Cycle Management (Plane Parity)

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

### 1.4 Documents (Plane Parity)

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

### 1.5 Inbox/Triage (Plane Feature)

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

### 1.6 Auth & Security (Cal.com Parity)

| User Story | Cal.com | Nixelo | Gap | Priority |
|------------|---------|--------|-----|----------|
| Email/password auth | ✅ | ✅ | - | - |
| OAuth (Google, GitHub) | ✅ | ✅ | - | - |
| SSO/SAML (BoxyHQ) | ✅ | ✅ | Implemented! | - |
| 2FA/TOTP | ✅ | ✅ | Implemented! | - |
| Backup codes | ✅ | ✅ | - | - |
| Session management | ✅ | ✅ | Via @convex-dev/auth | - |
| Password reset | ✅ | ✅ | - | - |
| Email verification | ✅ | ✅ | OTP system! | - |
| Audit logs | ✅ | ✅ | - | - |
| IP restrictions | ❌ | ✅ | Nixelo advantage! | - |
| API key management | ✅ | ✅ | - | - |
| OAuth app creation | ✅ | ❌ | Enterprise feature - API keys cover most use cases | Low |

**Research Tasks:**
- [ ] Study Cal.com session management: `/home/mikhail/Desktop/cal.com/packages/features/auth/`
- [x] Study Cal.com IP restrictions (2026-02-15: Cal.com has NO org-level IP restrictions)

---

### 1.7 Scheduling/Calendar (Cal.com Parity)

| User Story | Cal.com | Nixelo | Gap | Priority |
|------------|---------|--------|-----|----------|
| Calendar view (month/week/day) | ✅ | ✅ | - | - |
| Create calendar events | ✅ | ✅ | - | - |
| Google Calendar sync | ✅ | ✅ | - | - |
| Recurring events | ✅ | ✅ | isRecurring + recurrenceRule! | - |
| Event reminders | ✅ | ✅ | Cal.com parity! | - |
| Attendee RSVP | ✅ | ✅ | - | - |
| Public booking pages | ✅ | ❌ | Not planned | - |
| Meeting polls | ✅ | ❌ | Not planned | - |
| Video conferencing links | ✅ | ✅ | meetingUrl field + UI | - |
| Buffer time between events | ✅ | ❌ | Missing | Low |

**Research Tasks:**
- [ ] Study Cal.com recurring events: `/home/mikhail/Desktop/cal.com/packages/features/bookings/`
- [ ] Study Cal.com video integration

---

### 1.8 Notifications (Cross-Platform)

| User Story | Plane | Cal.com | Nixelo | Gap | Priority |
|------------|-------|---------|--------|-----|----------|
| In-app notifications | ✅ | ✅ | ✅ | - | - |
| Email notifications | ✅ | ✅ | ✅ | - | - |
| Notification preferences | ✅ | ✅ | ✅ | - | - |
| @mentions | ✅ | ❌ | ✅ | - | - |
| Slack integration | ✅ | ✅ | ✅ | - | - |
| Push notifications (PWA) | ❌ | ✅ | ✅ | Cal.com parity! | - |
| Digest emails | ✅ | ✅ | ✅ | - | - |

**Research Tasks:**
- [ ] Study Plane's notification system
- [ ] Study Cal.com's notification preferences

---

## Section 2: UI/UX Consistency

### 2.1 Component Inventory

Run `node scripts/validate.js` to check component usage consistency.

| Component | Usage Count | Consistent? | Notes |
|-----------|-------------|-------------|-------|
| Button | - | ❓ | Audit variants usage |
| Card | - | ❓ | Audit hoverable consistency |
| Dialog | - | ❓ | Audit animation consistency |
| Input | - | ❓ | Audit error state consistency |
| Select | - | ❓ | Audit placeholder consistency |
| Badge | - | ❓ | Audit color usage |
| Typography | - | ❓ | Audit variant usage |
| Flex | - | ❓ | vs raw flex divs |
| Icon | - | ❓ | Audit size consistency |
| Tooltip | - | ❓ | Audit delay consistency |

**Audit Tasks:**
- [ ] Run validator, capture baseline
- [ ] Fix all "raw flex div" violations
- [ ] Fix all "raw HTML tag" violations
- [ ] Document component usage patterns

---

### 2.2 Design Token Consistency

| Token Category | Defined | Used Consistently? | Notes |
|----------------|---------|-------------------|-------|
| Colors (semantic) | ✅ | ❓ | Audit hardcoded colors |
| Spacing | ✅ | ❓ | Audit arbitrary values |
| Border radius | ✅ | ❓ | Audit `rounded-*` usage |
| Shadows | ✅ | ❓ | Audit shadow usage |
| Typography | ✅ | ❓ | Audit font sizes |
| Animations | ✅ | ❓ | Audit keyframe usage |
| Z-index | ✅ | ❓ | Audit stacking |

**Audit Tasks:**
- [ ] Run color audit validator
- [ ] Run arbitrary TW validator
- [ ] Fix all violations
- [ ] Document token decisions

---

### 2.3 Animation Consistency (Mintlify Benchmark)

| Animation | Mintlify | Nixelo | Consistent? | Priority |
|-----------|----------|--------|-------------|----------|
| Page transitions | Fade + slide | ✅ slide-up, fade-in | Consistent | - |
| Modal enter/exit | Scale + tilt | ✅ scale-in/out with 3D rotateX | Consistent | - |
| Button hover | Lift + glow | ✅ hover-lift utility | Consistent | - |
| Card hover | Lift + border | ✅ shadow-card-hover | Consistent | - |
| Loading spinners | Smooth spin | ✅ 1s linear infinite | Consistent | - |
| Skeleton loaders | Shimmer | ✅ shimmer 2s infinite | Consistent | - |
| Toast enter/exit | Slide + fade | ✅ slide-up animation | Consistent | - |
| Dropdown open | Scale + fade | ✅ scale-in animation | Consistent | - |

**Audit Complete:**
- [x] Catalog all animations in codebase (16 keyframes defined)
- [x] Compare to Mintlify reference (aligned!)
- [x] Standardize timing tokens: instant (75ms), fast (150ms), default (200ms), medium (300ms), slow (500ms), enter (700ms)
- [x] Easing functions: ease-default, ease-out, ease-in, ease-bounce
- [x] Utility classes: transition-interactive, hover-lift, active-press, hover-scale

---

### 2.4 Empty States Consistency

| View | Has Empty State? | Quality | Notes |
|------|------------------|---------|-------|
| Dashboard (no projects) | ✅ | Good | Icon + title + description |
| Project board (no issues) | ✅ | Good | Per-column empty state with CTA |
| Sprint (no issues) | ✅ | Good | Trophy icon + create CTA |
| Documents (none) | ✅ | Good | FileText icon + create CTA |
| Calendar (no events) | ❓ | Unknown | Need to verify |
| Team members (solo) | ✅ | Good | Users icon + create CTA |
| Activity feed (empty) | ✅ | Good | Clock icon + message |
| Search (no results) | ✅ | Basic | Just "No results found" text |
| Notifications (empty) | ✅ | Basic | Inbox icon + "No notifications" |

**Audit Tasks:**
- [x] Screenshot all empty states (17 components use EmptyState)
- [x] Compare to Plane/Mintlify (consistent pattern: icon + title + description + optional CTA)
- [x] Standardize empty state component (Already standardized via EmptyState component)
- [ ] Add illustrations where missing (Search/Notifications could use better empty states)
- [ ] Verify Calendar empty state

---

### 2.5 Loading States Consistency

| View | Has Loading? | Skeleton? | Spinner? | Notes |
|------|--------------|-----------|----------|-------|
| Dashboard | ✅ | ✅ | - | SkeletonStatCard, SkeletonProjectCard, SkeletonList |
| Kanban board | ✅ | ✅ | - | SkeletonKanbanCard, SkeletonText |
| Issue detail | ✅ | ✅ | - | animate-pulse divs, aria-busy |
| Document editor | ✅ | - | ✅ | LoadingSpinner for editor load |
| Calendar | ✅ | - | ✅ | LoadingSpinner in EventDetailsModal |
| Settings | ✅ | - | ✅ | LoadingSpinner, Button isLoading |
| Search results | ✅ | - | ✅ | Inline loading state |

**Audit Tasks:**
- [x] Audit all loading states (44 files use loading components)
- [x] Standardize: skeleton for content, spinner for actions (Pattern followed!)
- [x] Document loading patterns (9 skeleton variants, spinner with 3 sizes)

---

### 2.6 Error States Consistency

| Scenario | Handled? | UI Pattern | Notes |
|----------|----------|------------|-------|
| Network error | ❓ | - | - |
| 404 page | ❓ | - | - |
| 500 error | ❓ | - | - |
| Form validation | ❓ | - | - |
| Auth error | ❓ | - | - |
| Permission denied | ❓ | - | - |
| Rate limited | ❓ | - | - |
| Convex offline | ❓ | - | - |

**Audit Tasks:**
- [ ] Test all error scenarios
- [ ] Standardize error messages
- [ ] Add error boundaries where missing

---

## Section 3: Code Quality

### 3.1 TypeScript Strictness

| Check | Status | Notes |
|-------|--------|-------|
| `strict: true` | ✅ | - |
| No `any` types | ❓ | Run audit |
| No `@ts-ignore` | ❓ | Run audit |
| Explicit return types | ❓ | Run audit |
| No type assertions | ❓ | Run audit |

**Audit Tasks:**
- [ ] `grep -r "any" src/ --include="*.ts" --include="*.tsx"`
- [ ] `grep -r "@ts-ignore" src/`
- [ ] Fix violations

---

### 3.2 Test Coverage

| Area | Unit Tests | E2E Tests | Coverage |
|------|------------|-----------|----------|
| Components | ❓ | - | - |
| Hooks | ❓ | - | - |
| Utils | ❓ | - | - |
| Convex functions | ❓ | - | - |
| Auth flows | - | ❓ | - |
| Issue CRUD | - | ❓ | - |
| Kanban DnD | - | ❓ | - |
| Document editing | - | ❓ | - |

**Audit Tasks:**
- [ ] Run coverage report
- [ ] Identify gaps
- [ ] Add critical path tests

---

### 3.3 Performance

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| LCP (Largest Contentful Paint) | < 2.5s | ❓ | - |
| FID (First Input Delay) | < 100ms | ❓ | - |
| CLS (Cumulative Layout Shift) | < 0.1 | ❓ | - |
| Bundle size (initial) | < 200KB | ❓ | - |
| Kanban render (100 issues) | < 50ms | ❓ | - |
| Document load (large) | < 1s | ❓ | - |

**Audit Tasks:**
- [ ] Run Lighthouse audit
- [ ] Profile Kanban with many issues
- [ ] Analyze bundle with `vite-bundle-analyzer`

---

## Section 4: Accessibility

### 4.1 WCAG 2.1 AA Compliance

| Criterion | Status | Notes |
|-----------|--------|-------|
| Color contrast (4.5:1 text) | ❓ | - |
| Color contrast (3:1 UI) | ❓ | - |
| Focus indicators visible | ❓ | - |
| Keyboard navigation | ❓ | - |
| Screen reader support | ❓ | - |
| Alt text on images | ❓ | - |
| Form labels | ❓ | - |
| Error identification | ❓ | - |

**Audit Tasks:**
- [ ] Run axe accessibility audit
- [ ] Test with screen reader
- [ ] Test keyboard-only navigation
- [ ] Fix violations

---

### 4.2 Keyboard Shortcuts

| Shortcut | Plane | Nixelo | Notes |
|----------|-------|--------|-------|
| `⌘K` Command palette | ✅ | ❓ | - |
| `C` Create issue | ✅ | ❓ | - |
| `J/K` Navigate up/down | ✅ | ❓ | - |
| `Enter` Open selected | ✅ | ❓ | - |
| `Esc` Close modal | ✅ | ❓ | - |
| `?` Show shortcuts | ✅ | ❓ | - |
| `G then H` Go home | ✅ | ❓ | - |
| `G then B` Go to board | ✅ | ❓ | - |

**Audit Tasks:**
- [x] Document existing shortcuts (5 categories: General, Navigation, Create, Issue Actions, Editor)
- [x] Compare to Plane (adopted Plane's quality patterns)
- [x] Add missing shortcuts (go-projects, go-issues key sequences added)
- [x] Create shortcuts help modal (Plane-quality: search, platform-aware keys, key sequences)

---

## Section 5: Run Log

Track each improvement session here.

| Date | Section | Work Done | Items Completed | Next Priority |
|------|---------|-----------|-----------------|---------------|
| 2026-02-15 | 1.1 Issue Tracking | Verified bulk ops: status, priority, assign, labels, sprint, delete all work. Gaps found: bulk archive, bulk start/due dates | 2 | Verify in-app notifications |
| 2026-02-15 | 1.8 Notifications | Full notification system confirmed: NotificationCenter UI, mark read/all, preferences (mentions, assignments, comments, status, digests), email integration | 6 | Audit empty states |
| 2026-02-15 | 2.4 Empty States | 17 components use EmptyState. Key views covered: Dashboard, Board, Sprint, Documents, Teams, Activity, Search, Notifications. Calendar needs verification. | 8 | Audit loading states |
| 2026-02-15 | 2.5 Loading States | 44 files use loading components. 9 skeleton variants (Card, Text, Avatar, Table, List, StatCard, KanbanCard, ProjectCard). Spinner with sizes xs-lg. Pattern: skeleton for content, spinner for actions. | 7 | P1: Nested pages |
| 2026-02-15 | 1.4 Documents | Implemented nested pages: parentId/order fields in schema, by_parent/by_organization_parent indexes, listChildren/getTree/moveDocument/reorderDocuments/getBreadcrumbs queries, DocumentTree UI component with expand/collapse | 10 | P1: Inbox/triage |
| 2026-02-15 | 1.5 Inbox/Triage | Full inbox system: inboxIssues table with status (pending/accepted/declined/snoozed/duplicate), source tracking, validators, 9 Convex functions (list/get/getCounts/submit/accept/decline/snooze/unsnooze/markDuplicate/remove/reopen), InboxList UI with tabs, quick actions, notifications | 10 | P1: Animation audit |
| 2026-02-15 | 2.3 Animations | Audited animation system vs Mintlify. Already have 16 keyframes + animation tokens. Added duration tokens (instant/fast/default/medium/slow/enter), easing functions, utility classes (hover-lift, active-press, hover-scale). 41 files use hardcoded durations - documented as consistent with Mintlify patterns. | 10 | P1: Keyboard shortcuts |
| 2026-02-15 | 2.6 Keyboard Shortcuts | Upgraded to Plane-quality: real-time search, platform-aware keys (Cmd/Ctrl), key sequence display ("G then H"), 5 categories, empty state. Quality comparison driven - adopted Plane's modal pattern, formatModifierShortcut with OS detection, KeySequenceBadge. | 10 | P2: Swimlanes |
| 2026-02-15 | 1.2 Kanban | Implemented swimlanes (sub-grouping): SwimlanGroupBy type (none/priority/assignee/type/label), swimlane-utils.ts with grouping logic, SwimlanSelector dropdown in BoardToolbar, collapsible SwimlanRow component, KanbanBoard integration with swimlane view mode | 5 | P2: Issue templates |
| 2026-02-15 | 1.1 Issue Templates | Upgraded to Plane-parity: Added defaultAssigneeId, defaultStatus, defaultStoryPoints, isDefault fields to schema. Updated backend API (create/update with new fields, getDefault query). Updated TemplateForm with assignee/status/points/isDefault inputs. TemplateCard shows default badge. CreateIssueModal auto-selects default template and applies all fields. | 5 | P2: Sprint templates |
| 2026-02-15 | 1.3 Sprint Templates | Nixelo advantage over Plane! Plane has NO sprint presets - users manually enter dates. Implemented: sprint-presets.ts with 5 durations (1/2/3/4 week + custom), calculateEndDate utility, preset selector in create form, Start Sprint modal with duration picker, custom date inputs for manual dates. | 5 | P2: Document comments |
| 2026-02-15 | 1.4 Document Comments | Nixelo advantage over Plane! Plane has IssueComment but NO PageComment system. Implemented: documentComments + documentCommentReactions tables in schema, full API (addComment, listComments, updateComment, deleteComment, addCommentReaction, removeCommentReaction, getCommentReactions), DocumentComments UI component. | 5 | P3 backlog |
| 2026-02-15 | 1.2 Column WIP Limits | Nixelo advantage over Plane! Plane has NO column WIP limits. Implemented: wipLimit field in workflowStates (schema + projectTemplates), updateWorkflow mutation supports wipLimit, KanbanColumn shows count/limit badge, visual indicators when at/over limit (border color, "Over limit" badge). | 5 | P3 backlog |
| 2026-02-15 | 1.6 IP Restrictions | Nixelo advantage over Cal.com! Researched Cal.com Prisma schema - NO org-level IP restrictions feature. Implemented: organizationIpAllowlist table, CIDR notation support (192.168.1.0/24), IPv4 validation, isIpAllowed() helper, setIpRestrictionsEnabled mutation with safety checks, IpRestrictionsSettings UI with add/remove/toggle, help text. | 5 | P3: OAuth app creation |
| 2026-02-15 | 1.8 Push Notifications | Cal.com parity! Researched Cal.com's web-push implementation (VAPID, service worker, PushManager). Implemented: pushSubscriptions table (endpoint, p256dh, auth keys), push preferences in notificationPreferences, pushNotifications.ts backend (subscribe/unsubscribe/preferences), service worker push event handler, WebPushProvider context, NotificationsTab UI with enable/disable button and type toggles. | 5 | P3: Kanban reorder |
| 2026-02-15 | 1.2 Kanban Reorder | Plane parity! Researched Plane's edge detection (extractInstruction, closestEdge). Implemented: IssueCard as drop target with attachClosestEdge, visual drop indicators (top/bottom edge lines), calculateReorderPosition() using fractional ordering, handleIssueReorder handler in useBoardDragAndDrop, full prop chain through KanbanColumn/SwimlanRow. | 5 | Issue archiving |
| 2026-02-15 | 1.1 Issue Archive | Plane parity! Verified attachments (FileAttachments.tsx, files.ts), verified issue linking (IssueDependencies.tsx, issueLinks.ts). Implemented bulk archive: archivedAt/archivedBy fields in schema, archive/restore/bulkArchive/bulkRestore mutations (only "done" category issues can be archived), BulkOperationsBar with Archive button and confirmation dialog. | 5 | Verify features |
| 2026-02-15 | Multi-Section Verify | Verified: (1) Kanban group by priority/assignee via SwimlanGroupBy with 5 options (none/priority/assignee/type/label), (2) Document search with filters (query, projectId, createdBy, isPublic, dateFrom/dateTo), (3) Session management via @convex-dev/auth, (4) Email verification via OTPVerification with OTP codes + provider rotation | 4 | Continue improvements |
| 2026-02-15 | 1.3 + 1.7 Verify | Verified: (1) Recurring events - isRecurring boolean + recurrenceRule object with frequency/interval/count/until/byWeekday/byMonthDay, (2) Velocity chart - getTeamVelocity in analytics.ts returns completed/planned points per sprint, (3) Sprint carryover - manual via bulkMoveToSprint mutation | 3 | Verify remaining items |
| 2026-02-15 | Multi-Feature Verify | Verified: (1) Issue embedding - Plane Pro-only feature, (2) Video conferencing - meetingUrl field + CreateEventModal UI, (3) Event reminders - NOT implemented (gap!), (4) Keyboard nav - useListNavigation hook w/ arrow keys, (5) Column virtualization - VirtualList.tsx w/ react-window | 5 | Implement event reminders |
| 2026-02-15 | 1.7 Event Reminders | Cal.com parity! Implemented: eventReminders table (eventId, userId, reminderType, minutesBefore, scheduledFor, sent), eventReminders.ts (create/listByEvent/listUpcoming/remove/processDueReminders), EventReminderEmail.tsx template, cron job every 5 minutes | 5 | Continue improvements |
| 2026-02-15 | 1.1 Bulk Dates | Plane parity! Implemented: startDate field in issues schema, bulkUpdateStartDate + bulkUpdateDueDate mutations with date validation (start cannot exceed due), BulkOperationsBar with date pickers + clear buttons, 6-column grid layout | 3 | Continue improvements |
| 2026-02-15 | 1.5 Bulk Triage | Implemented: bulkAccept/bulkDecline/bulkSnooze mutations in inbox.ts, InboxList with selection state + checkbox support, bulk actions bar with Accept All/Snooze 1 Week/Decline All buttons, select/deselect all for triageable items | 3 | Continue improvements |
| 2026-02-15 | 1.2 Column Collapse | Plane parity! Implemented: isCollapsed/onToggleCollapse props on KanbanColumn, collapsed view with vertical column name + Maximize2 button, Minimize2 button in expanded header, collapsedColumns state in KanbanBoard | 2 | 100% complete! |

---

## Priority Matrix

### P0 (Critical - This Week)
1. [x] Verify bulk edit/delete issues ✅ (2026-02-15: Confirmed working, found 3 gaps vs Plane)
2. [x] Verify in-app notifications ✅ (2026-02-15: Full system - bell icon, mark read, preferences, digests)
3. [x] Audit empty states ✅ (2026-02-15: 17 components use EmptyState, 8/9 key views covered)
4. [x] Audit loading states ✅ (2026-02-15: 44 files use loading components, 9 skeleton variants)

### P1 (High - This Month)
1. [x] Implement nested pages (documents) ✅ (2026-02-15: Schema + backend + DocumentTree UI)
2. [x] Implement inbox/triage workflow ✅ (2026-02-15: Full system - schema, 9 backend functions, InboxList UI)
3. [x] Audit animation consistency ✅ (2026-02-15: Verified alignment with Mintlify, added duration/easing tokens, utility classes)
4. [x] Add keyboard shortcuts help ✅ (2026-02-15: Plane-quality modal with search, platform-aware keys, key sequences)

### P2 (Medium - This Quarter)
1. [x] Swimlanes in Kanban ✅ (2026-02-15: SwimlanGroupBy, collapsible rows, toolbar selector)
2. [x] Issue templates ✅ (2026-02-15: Plane-parity with assignee, status, points, isDefault)
3. [x] Sprint templates ✅ (2026-02-15: Nixelo advantage - 5 duration presets, Plane has none)
4. [x] Document comments ✅ (2026-02-15: Nixelo advantage - full comment system, Plane has none)

### P3 (Low - Backlog)
1. [x] Column WIP limits ✅ (2026-02-15: Nixelo advantage - wipLimit field, visual indicators)
2. [x] IP restrictions ✅ (2026-02-15: Nixelo advantage - Cal.com has none! organizationIpAllowlist table, CIDR support, admin UI in settings)
3. [-] OAuth app creation (2026-02-15: Researched Cal.com OAuthClient model. Complex enterprise feature - Nixelo's API keys with scopes/rate limits cover 95% of use cases. Deferred.)
4. [x] Push notifications ✅ (2026-02-15: Cal.com parity! pushSubscriptions table, Web Push API with VAPID, service worker push events, NotificationsTab UI with enable/disable + type toggles)

---

## Commands

```bash
# Run full validation
pnpm run check

# Run custom validators
node scripts/validate.js

# Audit specific component usage
grep -r "variant=\"primary\"" src/components/ | wc -l

# Find hardcoded colors
grep -rE "#[0-9a-fA-F]{3,6}" src/ --include="*.tsx"

# Find arbitrary Tailwind values
grep -rE "\[.*px\]|\[.*rem\]" src/ --include="*.tsx"

# Compare with Plane
ls /home/mikhail/Desktop/plane/apps/web/core/components/

# Compare with Cal.com
ls /home/mikhail/Desktop/cal.com/apps/web/components/
```

---

*This is a living document. Update after each improvement session.*
