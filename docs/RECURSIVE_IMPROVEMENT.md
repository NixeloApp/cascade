# Recursive Improvement Protocol

> **Purpose:** Living document for continuous quality improvement. When told "work on this doc", systematically improve Nixelo by benchmarking against Plane, Cal.com, and Mintlify.
>
> **Last Run:** Never
> **Overall Progress:** 0/100

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
| Add attachments to issues | ✅ | ❓ | Verify | Medium |
| Link related issues | ✅ | ❓ | Verify | Medium |
| Add reactions to issues | ✅ | ✅ | - | - |
| Watch/subscribe to issues | ✅ | ✅ | - | - |
| Bulk edit issues | ✅ | ❓ | Verify | High |
| Bulk delete issues | ✅ | ❓ | Verify | High |
| Archive issues | ✅ | ❓ | Verify | Medium |
| Issue templates | ✅ | ❓ | Verify | Low |
| Custom fields | ✅ | ✅ | - | - |
| Time tracking on issues | ❌ | ✅ | Nixelo advantage | - |
| Story points | ✅ | ✅ | - | - |
| Due dates | ✅ | ✅ | - | - |
| Start dates | ✅ | ❓ | Verify | Low |

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
| Reorder issues within column | ✅ | ❓ | Verify | High |
| Drag-drop library (Pragmatic DnD) | ✅ | ✅ | Just implemented! | - |
| Auto-scroll while dragging | ✅ | ✅ | - | - |
| Group by status | ✅ | ✅ | - | - |
| Group by priority | ✅ | ❓ | Verify | Medium |
| Group by assignee | ✅ | ❓ | Verify | Medium |
| Sub-grouping (swimlanes) | ✅ | ❌ | Missing | Low |
| Column WIP limits | ✅ | ❌ | Missing | Low |
| Quick add issue in column | ✅ | ✅ | - | - |
| Collapse/expand columns | ✅ | ❓ | Verify | Low |
| Column virtualization | ✅ | ❓ | Verify perf | Medium |
| Keyboard navigation (vim-style) | ✅ | ❓ | Verify | Medium |
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
| Velocity chart | ✅ | ❓ | Verify | Medium |
| Sprint retrospective | ✅ | ❓ | Verify | Low |
| Carry over incomplete issues | ✅ | ❓ | Verify | Medium |
| Sprint templates | ✅ | ❌ | Missing | Low |

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
| Nested pages (hierarchy) | ✅ | ❌ | Missing | High |
| Document search | ✅ | ❓ | Verify | Medium |
| Embed issues in docs | ✅ | ❓ | Verify | Medium |
| AI writing assistant | ✅ | ✅ | - | - |
| Document comments | ✅ | ❓ | Verify | Medium |
| Document reactions | ✅ | ❓ | Verify | Low |

**Research Tasks:**
- [ ] Study Plane's page hierarchy: `/home/mikhail/Desktop/plane/apps/web/core/components/pages/`
- [ ] Study Plane's document embedding

---

### 1.5 Inbox/Triage (Plane Feature)

| User Story | Plane | Nixelo | Gap | Priority |
|------------|-------|--------|-----|----------|
| Issues land in inbox first | ✅ | ❌ | Missing | High |
| Accept issue (move to backlog) | ✅ | ❌ | Missing | High |
| Decline issue | ✅ | ❌ | Missing | High |
| Snooze issue until date | ✅ | ❌ | Missing | Medium |
| Mark as duplicate | ✅ | ❌ | Missing | Medium |
| Inbox filters | ✅ | ❌ | Missing | Medium |
| Bulk triage actions | ✅ | ❌ | Missing | Medium |

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
| Session management | ✅ | ❓ | Verify | Medium |
| Password reset | ✅ | ✅ | - | - |
| Email verification | ✅ | ❓ | Verify | Medium |
| Audit logs | ✅ | ✅ | - | - |
| IP restrictions | ✅ | ❌ | Missing | Low |
| API key management | ✅ | ✅ | - | - |
| OAuth app creation | ✅ | ❌ | Missing | Low |

**Research Tasks:**
- [ ] Study Cal.com session management: `/home/mikhail/Desktop/cal.com/packages/features/auth/`
- [ ] Study Cal.com IP restrictions

---

### 1.7 Scheduling/Calendar (Cal.com Parity)

| User Story | Cal.com | Nixelo | Gap | Priority |
|------------|---------|--------|-----|----------|
| Calendar view (month/week/day) | ✅ | ✅ | - | - |
| Create calendar events | ✅ | ✅ | - | - |
| Google Calendar sync | ✅ | ✅ | - | - |
| Recurring events | ✅ | ❓ | Verify | Medium |
| Event reminders | ✅ | ❓ | Verify | Medium |
| Attendee RSVP | ✅ | ✅ | - | - |
| Public booking pages | ✅ | ❌ | Not planned | - |
| Meeting polls | ✅ | ❌ | Not planned | - |
| Video conferencing links | ✅ | ❓ | Verify | Medium |
| Buffer time between events | ✅ | ❌ | Missing | Low |

**Research Tasks:**
- [ ] Study Cal.com recurring events: `/home/mikhail/Desktop/cal.com/packages/features/bookings/`
- [ ] Study Cal.com video integration

---

### 1.8 Notifications (Cross-Platform)

| User Story | Plane | Cal.com | Nixelo | Gap | Priority |
|------------|-------|---------|--------|-----|----------|
| In-app notifications | ✅ | ✅ | ❓ | Verify | High |
| Email notifications | ✅ | ✅ | ✅ | - | - |
| Notification preferences | ✅ | ✅ | ❓ | Verify | Medium |
| @mentions | ✅ | ❌ | ❓ | Verify | Medium |
| Slack integration | ✅ | ✅ | ✅ | - | - |
| Push notifications (PWA) | ❌ | ✅ | ❌ | Missing | Low |
| Digest emails | ✅ | ✅ | ❓ | Verify | Low |

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
| Page transitions | Fade + slide | ❓ | Verify | Medium |
| Modal enter/exit | Scale + tilt | ❓ | Verify | High |
| Button hover | Lift + glow | ❓ | Verify | Medium |
| Card hover | Lift + border | ❓ | Verify | Medium |
| Loading spinners | Smooth spin | ❓ | Verify | Low |
| Skeleton loaders | Shimmer | ❓ | Verify | Medium |
| Toast enter/exit | Slide + fade | ❓ | Verify | Low |
| Dropdown open | Scale + fade | ❓ | Verify | Low |

**Audit Tasks:**
- [ ] Catalog all animations in codebase
- [ ] Compare to Mintlify reference
- [ ] Standardize timing (150ms hover, 200ms enter, 150ms exit)
- [ ] Document animation tokens

---

### 2.4 Empty States Consistency

| View | Has Empty State? | Quality | Notes |
|------|------------------|---------|-------|
| Dashboard (no projects) | ❓ | - | - |
| Project board (no issues) | ❓ | - | - |
| Sprint (no issues) | ❓ | - | - |
| Documents (none) | ❓ | - | - |
| Calendar (no events) | ❓ | - | - |
| Team members (solo) | ❓ | - | - |
| Activity feed (empty) | ❓ | - | - |
| Search (no results) | ❓ | - | - |
| Notifications (empty) | ❓ | - | - |

**Audit Tasks:**
- [ ] Screenshot all empty states
- [ ] Compare to Plane/Mintlify
- [ ] Standardize empty state component
- [ ] Add illustrations where missing

---

### 2.5 Loading States Consistency

| View | Has Loading? | Skeleton? | Spinner? | Notes |
|------|--------------|-----------|----------|-------|
| Dashboard | ❓ | ❓ | ❓ | - |
| Kanban board | ❓ | ❓ | ❓ | - |
| Issue detail | ❓ | ❓ | ❓ | - |
| Document editor | ❓ | ❓ | ❓ | - |
| Calendar | ❓ | ❓ | ❓ | - |
| Settings | ❓ | ❓ | ❓ | - |
| Search results | ❓ | ❓ | ❓ | - |

**Audit Tasks:**
- [ ] Audit all loading states
- [ ] Standardize: skeleton for content, spinner for actions
- [ ] Document loading patterns

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
- [ ] Document existing shortcuts
- [ ] Compare to Plane
- [ ] Add missing shortcuts
- [ ] Create shortcuts help modal

---

## Section 5: Run Log

Track each improvement session here.

| Date | Section | Work Done | Items Completed | Next Priority |
|------|---------|-----------|-----------------|---------------|
| - | - | - | - | - |

---

## Priority Matrix

### P0 (Critical - This Week)
1. [ ] Verify bulk edit/delete issues
2. [ ] Verify in-app notifications
3. [ ] Audit empty states
4. [ ] Audit loading states

### P1 (High - This Month)
1. [ ] Implement nested pages (documents)
2. [ ] Implement inbox/triage workflow
3. [ ] Audit animation consistency
4. [ ] Add keyboard shortcuts help

### P2 (Medium - This Quarter)
1. [ ] Swimlanes in Kanban
2. [ ] Issue templates
3. [ ] Sprint templates
4. [ ] Document comments

### P3 (Low - Backlog)
1. [ ] Column WIP limits
2. [ ] IP restrictions
3. [ ] OAuth app creation
4. [ ] Push notifications

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
