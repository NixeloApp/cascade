# Feature Comparison Index

A detailed UI/UX comparison between **cal.com**, **plane**, and **Cascade**.

## Purpose

This documentation analyzes how features are implemented across three codebases to identify:
- What each app does well
- Where Cascade can improve
- UI/UX patterns to adopt

## Repository Paths

| App | Path | Focus |
|-----|------|-------|
| cal.com | `~/Desktop/cal.com` | Scheduling/booking platform |
| plane | `~/Desktop/plane` | Project management (issues, cycles, modules) |
| Cascade | `~/Desktop/cascade` | Issues, projects, sprints, docs |

---

## Feature Categories

### ✅ Issues (Plane + Cascade focus)
| Feature | Status | Doc |
|---------|--------|-----|
| Create Issue | ✅ Done | [create-issue.md](./issues/create-issue.md) |
| Issue Detail View | ✅ Done | [issue-detail-view.md](./issues/issue-detail-view.md) |
| Bulk Actions | ✅ Done | [bulk-actions.md](./issues/bulk-actions.md) |
| Filters and Search | ✅ Done | [filters-and-search.md](./issues/filters-and-search.md) |
| Labels and Tags | ✅ Done | [labels-and-tags.md](./issues/labels-and-tags.md) |
| Issue Relations | ✅ Done | [issue-relations.md](./issues/issue-relations.md) |

### ✅ Projects
| Feature | Status | Doc |
|---------|--------|-----|
| Create Project | ✅ Done | [create-project.md](./projects/create-project.md) |
| Project Settings | ✅ Done | [project-settings.md](./projects/project-settings.md) |
| Project Members | ✅ Done | [project-members.md](./projects/project-members.md) |

### ✅ Sprints/Cycles
| Feature | Status | Doc |
|---------|--------|-----|
| Create Sprint | ✅ Done | [create-sprint.md](./sprints-cycles/create-sprint.md) |
| Sprint Board | ✅ Done | [sprint-board.md](./sprints-cycles/sprint-board.md) |
| Sprint Reports | ✅ Done | [sprint-reports.md](./sprints-cycles/sprint-reports.md) |

### ✅ Views
| Feature | Status | Doc |
|---------|--------|-----|
| Kanban Board | ✅ Done | [kanban-board.md](./views/kanban-board.md) |
| List View | ✅ Done | [list-view.md](./views/list-view.md) |
| Calendar View | ✅ Done | [calendar-view.md](./views/calendar-view.md) |
| Gantt Chart | ✅ Done | [gantt-chart.md](./views/gantt-chart.md) |

### ✅ Documents
| Feature | Status | Doc |
|---------|--------|-----|
| Create Document | ✅ Done | [create-document.md](./documents/create-document.md) |
| Document Editor | ✅ Done | [document-editor.md](./documents/document-editor.md) |
| Document Sharing | ✅ Done | [document-sharing.md](./documents/document-sharing.md) |

### ✅ Notifications
| Feature | Status | Doc |
|---------|--------|-----|
| In-App Notifications | ✅ Done | [in-app-notifications.md](./notifications/in-app-notifications.md) |
| Email Notifications | ✅ Done | [email-notifications.md](./notifications/email-notifications.md) |
| Notification Preferences | ✅ Done | [notification-preferences.md](./notifications/notification-preferences.md) |

### ✅ Settings
| Feature | Status | Doc |
|---------|--------|-----|
| User Profile | ✅ Done | [user-profile.md](./settings/user-profile.md) |
| Workspace Settings | ✅ Done | [workspace-settings.md](./settings/workspace-settings.md) |
| Integrations | ✅ Done | [integrations.md](./settings/integrations.md) |

### ✅ Auth
| Feature | Status | Doc |
|---------|--------|-----|
| Login/Signup | ✅ Done | [login-signup.md](./auth/login-signup.md) |
| SSO | ✅ Done | [sso.md](./auth/sso.md) |
| 2FA | ✅ Done | [2fa.md](./auth/2fa.md) |

### ⬜ Scheduling (cal.com focus)
| Feature | Status | Doc |
|---------|--------|-----|
| Create Booking | ⬜ Pending | [create-booking.md](./scheduling/create-booking.md) |
| Availability | ⬜ Pending | [availability.md](./scheduling/availability.md) |
| Recurring Events | ⬜ Pending | [recurring-events.md](./scheduling/recurring-events.md) |
| Calendar Integrations | ⬜ Pending | [calendar-integrations.md](./scheduling/calendar-integrations.md) |

---

## Key Findings Summary

### Top Recommendations for Cascade (Prioritized)

#### High Priority
1. **Keyboard shortcuts** - Add global `C` for create issue, `Escape` to close, arrow navigation
2. **Rich text description editor** - Replace plain textarea with TipTap or similar (markdown, images, @mentions)
3. **Inline editing** - Click any property to edit directly without opening modals
4. **Duplicate detection** - Show potential duplicates while creating issues

#### Medium Priority
5. **Peek/side panel mode** - View issue details without leaving list context
6. **Drag-drop reordering** - For labels, issue ordering
7. **Date range filters** - Filter by start/due date ranges
8. **URL filter persistence** - Shareable filtered views
9. **"Create more" toggle** - Rapid issue creation without closing modal

#### Nice to Have
10. **Draft auto-save** - Prevent data loss on modal close
11. **Parent/child issues** - Sub-issue relationships
12. **Inline label creation** - Create labels from issue form
13. **Multiple assignees** - Assign issues to multiple people
14. **Display/view options** - Group by, sort by, property toggles

### Sprint/Cycle Improvements (from sprints-cycles comparison)

#### High Priority
1. **Analytics sidebar in board view** - Inline burndown/progress, not separate page
2. **Multiple view layouts** - Add List, Calendar, Gantt views for sprints
3. **Real-time search in sprint board** - Filter issues within sprint

#### Medium Priority
4. **Assignee/label breakdown tabs** - Show workload distribution
5. **Burnup chart toggle** - Alternative to burndown
6. **Issue peek/quick view** - Click to expand without full navigation
7. **Transfer remaining issues modal** - When completing sprints

#### Nice to Have
8. **Keyboard shortcuts for sprint creation** - `S` or `Shift+S`
9. **Date overlap validation** - Prevent conflicting sprint dates
10. **Progress snapshots** - Historical tracking

### Views Improvements (from views/ comparison)

#### High Priority
1. **Spreadsheet/table view** - Add proper list view with columns, inline editing, sorting
2. **Calendar drag-and-drop** - Reschedule issues by dragging between days
3. **Gantt block resizing** - Adjust start/end dates by resizing timeline bars

#### Medium Priority
4. **Display properties toggle** - Show/hide card properties (assignee, labels, etc.)
5. **More grouping options** - Group Kanban by assignee, priority, type
6. **Week view for calendar** - Single week with more issues per day
7. **Dependency lines in Gantt** - Visualize issue relationships

#### Nice to Have
8. **Sub-grouping (swimlanes v2)** - Dual grouping like plane
9. **Quick add on calendar day** - Click empty day to create issue
10. **Configurable Gantt timeline** - 1/3/6/12 month spans

### Documents Improvements (from documents/ comparison)

#### High Priority
1. **Navigation pane sidebar** - Outline/TOC, assets list, document info tabs
2. **User @mentions in editor** - Tag users with `@` trigger
3. **Page lock/unlock** - Prevent concurrent editing conflicts

#### Medium Priority
4. **Favorites system** - Star documents for quick access
5. **Archive/restore** - Soft archive instead of delete
6. **Text colors** - Foreground and background color picker
7. **H4-H6 heading levels** - Full heading hierarchy

#### Nice to Have
8. **Offline support** - IndexedDB persistence for editor
9. **Work item embeds** - Embed issue cards in documents
10. **Move between projects** - Transfer documents across projects

### Notifications Improvements (from notifications/ comparison)

#### High Priority
1. **Snooze notifications** - Hide temporarily, reappear at scheduled time
2. **Notification filters** - Filter by type (mentions, assigned, etc.)
3. **Archive capability** - Archive instead of delete

#### Medium Priority
4. **Full notifications page** - Dedicated route for managing many notifications
5. **Notification grouping** - Group by date or entity
6. **Smart batching** - Consolidate similar notifications into single email

#### Nice to Have
7. **Quiet hours** - Do not disturb times
8. **Slack/Teams integration** - Additional notification channels
9. **Email preview** - Show sample of each notification type

### Cascade Strengths vs Plane (Notifications)
- **Push notifications** - Web Push API for browser notifications
- **Digest emails** - Daily and weekly summaries
- **More notification types** - 8 types vs 5
- **Digest frequency control** - None/Daily/Weekly options
- **Project subscriptions** - Watch entire projects
- **Document subscriptions** - Extends to docs, not just issues
- **Test push button** - Verify push notifications work

### Settings Improvements (from settings/ comparison)

#### High Priority
1. **Implement workspace settings** - Currently placeholder, add name/logo/timezone
2. **Add avatar upload modal** - Dedicated upload UI with crop/preview
3. **Add Slack integration** - OAuth-based popular chat integration

#### Medium Priority
4. **Add First/Last name fields** - Split name for formal contexts
5. **Add bulk member invite** - Modal for multiple emails + CSV import
6. **Add webhook secret keys** - HMAC signature validation

#### Nice to Have
7. **Add activity log** - User's recent activity with pagination
8. **Add cover image** - Profile header personalization
9. **Add integration marketplace** - Browse/install integrations UI

### Cascade Strengths vs Plane (Settings)
- **Two-Factor Authentication** - Full TOTP with backup codes
- **Google Calendar sync** - Bi-directional calendar integration
- **SSO per-organization** - Each org configures own SAML/OIDC
- **API key scopes** - Granular permission control
- **Key rotation** - Secure key management
- **Usage tracking** - Monitor API usage and activity
- **WIP limits** - Workflow states with work-in-progress limits
- **Hour compliance** - Time tracking limits and approvals

### Auth Improvements (from auth/ comparison)

#### High Priority
1. **Add more OAuth providers** - GitHub, Microsoft, generic OIDC
2. **Implement SAML/OIDC sign-in flows** - Currently only config UI exists
3. **Add password strength indicator** - zxcvbn visual feedback

#### Medium Priority
4. **Add magic link option** - Passwordless sign-in via email
5. **Add WebAuthn/FIDO2 support** - Hardware security keys
6. **Add domain verification** - Required for production SSO

#### Nice to Have
7. **Add device management** - List/revoke active sessions
8. **Add admin 2FA enforcement** - Require 2FA per organization
9. **Add SCIM support** - Enterprise user provisioning

### Cascade Strengths vs Plane (Auth)
- **Full 2FA implementation** - TOTP with backup codes (plane has none)
- **Per-organization SSO** - SAML/OIDC config per org
- **Email enumeration protection** - Password reset always returns success
- **Smart redirect logic** - Handles all auth states
- **Replay attack prevention** - TOTP time step tracking
- **Session verification** - Per-session 2FA with 24h window
- **Rate limiting** - 5 attempts, 15-minute lockout

### Cascade Strengths vs Plane
- **Saved filters with sharing** - Team-wide filter presets
- **Advanced search modal** - Dedicated complex search UI
- **Label groups with descriptions** - Better organization
- **Color picker with preview** - Full color selection
- **Confirmation dialogs** - Safer destructive actions
- **Bulk operations free** - Plane charges for bulk ops
- **Smart done loading** - Only loads recent done issues in Kanban
- **Undo/redo history** - Revert drag operations with Ctrl+Z
- **Virtual scrolling in Roadmap** - Handles large issue counts efficiently
- **Document hierarchy** - Nested parent/child documents
- **Document comments** - Threaded comments with emoji reactions
- **Instant document creation** - No modal, create and start typing
- **Document templates** - Built-in and custom templates with categories

---

## Progress

Last updated: 2026-02-28

- [x] README.md created
- [x] issues/ category complete (6 docs)
- [x] projects/ category complete (3 docs)
- [x] sprints-cycles/ category complete (3 docs)
- [x] views/ category complete (4 docs)
- [x] documents/ category complete (3 docs)
- [x] notifications/ category complete (3 docs)
- [x] settings/ category complete (3 docs)
- [x] auth/ category complete (3 docs)
- [ ] scheduling/ (cal.com focus - lower priority)
