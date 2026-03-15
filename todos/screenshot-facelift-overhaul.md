# Screenshot Tool — Complete Overhaul

> **Priority:** P0
> **Status:** Active
> **Last Updated:** 2026-03-16
> **Objective:** Transform the screenshot tool from a basic page capturer into a comprehensive visual QA system that covers every route, modal, interactive state, and user journey in the product.

---

## Part 1: Infrastructure Cleanup

### Dead code removal

- [x] Delete `scripts/capture-screenshots.mjs` — legacy script using banned anti-patterns (`waitForTimeout`, `networkidle`, hardcoded port 5173). Fully superseded by `e2e/screenshot-pages.ts`.

### Validator coverage

- [x] Document the `check-e2e-quality.js` skip for `screenshot-pages.ts` with an explicit comment explaining why it's exempt (utility, not a spec test).
- [ ] Consider adding a dedicated screenshot-specific validator that catches issues relevant to the screenshot tool (e.g. missing `waitForScreenshotReady` calls, uncovered routes).

### Resilience

- [x] Replace all `.animate-shimmer` CSS class selectors in `screenshot-pages.ts` with a `data-loading-skeleton` attribute on skeleton components. If the CSS class name changes, screenshots silently capture loading states.
- [x] Deduplicate auth token injection — `autoLogin()` and inline auth in `captureForConfig()` now use shared `injectAuthTokens(page, token, refreshToken)` helper.

### Staging & output

- [ ] Add a `--dry-run` flag that lists what would be captured without launching a browser — useful for verifying filter logic.
- [ ] Add timing per screenshot to the console output (helps identify slow pages).

---

## Part 2: Route Coverage — Every Page

The app has ~65 routes. The screenshot tool currently covers ~20. Every route needs at least an empty state and a filled state screenshot.

### Public pages (5 routes — currently covered)

- [x] Landing (`/`)
- [x] Sign in (`/signin`)
- [x] Sign up (`/signup`)
- [x] Forgot password (`/forgot-password`)
- [x] Invite invalid (`/invite/$token`)

### Public pages (partially covered)

- [ ] Verify email — route does not exist yet
- [ ] Portal page (`/portal/$token`) — unauthenticated document/project sharing view
- ~~Terms (`/terms`)~~ — route does not exist
- ~~Privacy (`/privacy`)~~ — route does not exist
- [x] Verify 2FA (`/verify-2fa`)

### Dashboard (currently covered: base + 4 modals)

- [x] Dashboard empty
- [x] Dashboard filled
- [x] Omnibox open
- [x] Advanced search modal
- [x] Shortcuts modal
- [x] Time entry modal

### Projects (currently covered: list + create modal)

- [x] Projects list empty
- [x] Projects list filled
- [x] Create project modal

### Project sub-pages (partially covered)

- [x] Board
- [x] Backlog
- [x] Sprints
- [x] Calendar (day/week/month modes + event modal)
- [x] Analytics
- [x] Settings
- ~~Project home/index~~ — redirects to board, no screenshot needed
- [x] **Project inbox** — (`/projects/$key/inbox`)
- [x] **Project roadmap** — (`/projects/$key/roadmap`) — has Gantt with dependency lines, timeline span selector
- [x] **Project activity** — (`/projects/$key/activity`) — activity feed with date grouping
- [x] **Project billing** — (`/projects/$key/billing`) — billing report with CSV export
- [x] **Project timesheet** — (`/projects/$key/timesheet`) — time entries tab

### Issues (partially covered)

- [x] Issue detail page
- [x] Issue detail modal (from board)
- [x] Create issue modal (from board)
- [x] **Global issues list** (`/$orgSlug/issues`) — with filter bar, status/priority/assignee filters, search
- [x] **My Issues page** (`/$orgSlug/my-issues`) — user's assigned issues

### Documents (partially covered)

- [x] Documents list empty
- [x] Documents list filled
- [x] Document editor
- [x] **Document templates** (`/$orgSlug/documents/templates`) — built-in + custom templates

### Workspaces (covered)

- [x] **Workspaces list** (`/$orgSlug/workspaces`) — empty + filled
- [x] **Workspace home** (`/$orgSlug/workspaces/$slug`) — teams list, navigation
- ~~Workspace board~~ — route does not exist (workspace uses backlog instead)
- [x] **Workspace backlog** (`/$orgSlug/workspaces/$slug/backlog`)
- [x] **Workspace calendar** (`/$orgSlug/workspaces/$slug/calendar`)
- [x] **Workspace sprints** (`/$orgSlug/workspaces/$slug/sprints`)
- [x] **Workspace dependencies** (`/$orgSlug/workspaces/$slug/dependencies`)
- [x] **Workspace wiki** (`/$orgSlug/workspaces/$slug/wiki`)
- [x] **Workspace settings** (`/$orgSlug/workspaces/$slug/settings`)

### Teams (covered)

- [x] **Team home** (`/.../teams/$teamSlug`)
- [x] **Team board** (`/.../teams/$teamSlug/board`)
- ~~Team backlog~~ — route does not exist
- [x] **Team calendar** (`/.../teams/$teamSlug/calendar`)
- [x] **Team wiki** (`/.../teams/$teamSlug/wiki`)
- [x] **Team settings** (`/.../teams/$teamSlug/settings`)

### Invoices & Clients (list coverage added)

- [x] **Invoices list** (`/$orgSlug/invoices`) — empty + filled
- [ ] **Invoice detail** (`/$orgSlug/invoices/$invoiceId`)
- [x] **Clients list** (`/$orgSlug/clients`) — empty + filled

### Global pages (partially covered)

- [x] **Notifications page** (`/$orgSlug/notifications`) — inbox + archived tabs
- [x] **Time tracking** (`/$orgSlug/time-tracking`) — time entries tab, burn rate
- [x] **Organization calendar** (`/$orgSlug/calendar`)
- [x] **Organization analytics** (`/$orgSlug/analytics`)

### Settings & Admin (covered)

- [x] Settings page (redirects to profile)
- [x] **Settings / profile** (`/$orgSlug/settings/profile`) — name, avatar, cover image
- [x] **Authentication settings** (`/$orgSlug/authentication`) — SSO config
- [x] **Add-ons page** (`/$orgSlug/add-ons`)
- [x] **AI Assistant page** (`/$orgSlug/assistant`)
- [x] **MCP Server page** (`/$orgSlug/mcp-server`)

### Onboarding (0 coverage)

- [ ] **Onboarding flow** (`/onboarding`) — post-signup org creation
- [ ] **Sample project modal** — shown during onboarding

---

## Part 3: Modal & Dialog Coverage

22 modals/dialogs exist. Screenshot tool currently captures 7. Every modal needs a screenshot in its open state.

### Currently captured

- [x] Omnibox / command palette
- [x] Advanced search modal
- [x] Keyboard shortcuts modal
- [x] Time entry modal
- [x] Create project modal
- [x] Create issue modal
- [x] Calendar event details modal

### Missing modals

- [ ] **Issue detail modal** — full view with description, properties sidebar, activity feed
- [ ] **Create event modal** — calendar event creation form
- [ ] **Create team modal** — team creation within workspace
- [ ] **Create workspace modal** — workspace creation form
- [ ] **Dashboard customize modal** — widget/layout customization
- [ ] **Import/export modal** — data import/export options
- [ ] **Move document dialog** — project picker for moving docs
- [ ] **Avatar upload modal** — drag-drop, preview, crop
- [ ] **Cover image upload modal** — header image picker
- [ ] **Manual time entry modal** — time entry form with project/issue pickers
- [ ] **Markdown preview modal** — rendered markdown preview
- [ ] **Sample project modal** — onboarding project wizard
- [ ] **Confirm dialog** — at least one example of a destructive action confirmation
- [ ] **Alert dialog** — at least one example of an alert/warning

---

## Part 4: Interactive State Captures

Beyond page loads — capture the states users actually see during interaction.

### Board / Kanban states

- [ ] **Swimlane modes** — Priority, Assignee, Type, Label grouping (4 screenshots)
- [ ] **Column collapsed** — at least one column collapsed
- [ ] **Column empty** — a column with no issues showing empty state
- [ ] **WIP limit warning** — column at/over WIP limit with visual indicator
- [ ] **Filter bar active** — board with active type/priority/assignee filters
- [ ] **Display properties toggle open** — toolbar dropdown showing property checkboxes
- [ ] **Sprint selector dropdown** — sprint picker open on board

### Issue states

- [ ] **Issue form with draft restoration banner** — auto-saved draft being offered
- [ ] **Issue form with duplicate detection** — similar issues panel visible
- [ ] **Issue form "create more" toggle active** — rapid creation mode
- [ ] **Issue inline editing** — clicking a property field to edit in-place
- [ ] **Issue peek/side panel mode** — side panel instead of modal view
- [ ] **Label creation popover** — inline label creation within issue form
- [ ] **Issue with all property types visible** — priority, assignee, labels, sprint, dates, story points, type

### Document editor states

- [ ] **Document locked** — locked banner visible, editor read-only
- [ ] **Document @mention popover** — `@` trigger showing user list
- [ ] **Document slash menu** — `/` trigger showing block type options
- [ ] **Document floating toolbar** — text selected, toolbar visible with formatting options
- [ ] **Document text color picker** — foreground/background color selection
- [ ] **Document with table** — table block inserted and visible
- [ ] **Document with code block** — code block with syntax highlighting
- [ ] **Document favorites star** — starred document in sidebar

### Calendar states

- [ ] **Calendar drag-and-drop preview** — event being dragged between days
- [ ] **Calendar quick-add on day click** — create issue form with pre-filled date
- [ ] **Create event modal** — full event creation form

### Sprint states

- [ ] **Sprint burndown chart** — burndown view active
- [ ] **Sprint burnup chart** — burnup toggle active
- [ ] **Sprint workload popover** — assignee progress breakdown visible
- [ ] **Sprint completion modal** — transfer remaining issues dialog
- [ ] **Sprint date overlap warning** — validation warning visible

### Gantt / Roadmap states

- [ ] **Roadmap with dependency lines** — SVG arrows between related issues
- [ ] **Roadmap timeline span selector** — 1/3/6/12 month options visible
- [ ] **Roadmap block resize** — drag handle visible on timeline bar edges

### Notification states

- [ ] **Notification bell with unread badge** — header bell icon with count
- [ ] **Notification popover open** — grouped by date (Today, Yesterday, This Week, Older)
- [ ] **Notification snooze popover** — duration options visible (1h, 3h, tomorrow, next week)
- [ ] **Notification filters active** — type filter (All, Mentions, Assigned, Comments, Updates)
- [ ] **Notifications page — inbox tab** — full-page notification list
- [ ] **Notifications page — archived tab** — archived notifications

### Settings states

- [ ] **Profile with avatar** — uploaded avatar visible
- [ ] **Profile with cover image** — header cover image visible
- [ ] **2FA setup flow** — QR code or setup step visible
- [ ] **Workspace settings** — name, icon, description fields
- [ ] **Project settings** — workflow states, WIP limits, danger zone

### Navigation / Shell states

- [ ] **Sidebar collapsed** — narrow sidebar with icons only
- [ ] **Sidebar expanded** — full sidebar with labels
- [ ] **Sidebar favorites section** — starred items
- [ ] **Sidebar with project tree** — nested project structure
- [ ] **Mobile hamburger menu open** — responsive navigation

### Error / Edge states

- [ ] **404 page** — invalid route
- [ ] **Permission denied** — unauthorized access attempt
- [ ] **Empty states** for every major section (most need seeding control)
- [ ] **Loading skeletons** — capture a page mid-load with skeleton UI visible (requires timing control)
- [ ] **Toast notification** — success and error toast examples
- [ ] **Form validation errors** — at least one form with field-level errors visible

---

## Part 5: User Journey Captures

Organized by user story — sequential screenshots showing a complete workflow.

### Journey 1: New user onboarding

1. Sign up page (filled form)
2. Email verification page
3. Onboarding — org creation
4. Onboarding — sample project modal
5. Dashboard (first visit)

### Journey 2: Issue lifecycle

1. Board view (starting state)
2. Create issue modal (filled)
3. Board with new issue in "To Do" column
4. Issue detail (properties filled)
5. Board with issue dragged to "In Progress"
6. Issue closed — board with issue in "Done"

### Journey 3: Sprint planning

1. Sprints page (no active sprint)
2. Create sprint form
3. Backlog with issues ready to assign
4. Sprint board with assigned issues
5. Sprint burndown chart mid-sprint
6. Sprint completion modal (transfer issues)

### Journey 4: Document collaboration

1. Documents list
2. New document (empty editor)
3. Editor with content, slash menu open
4. Editor with @mention popover
5. Document locked by another user
6. Document with comments thread

### Journey 5: Search and navigation

1. Dashboard
2. Omnibox open (empty)
3. Omnibox with search results
4. Advanced search modal with filters
5. Filtered issues list (URL-persisted filters)

### Journey 6: Time tracking

1. Time tracking page (empty)
2. Start timer modal
3. Manual time entry modal
4. Time entries list (filled)
5. Project billing report

### Journey 7: Workspace management

1. Workspaces list
2. Create workspace modal
3. Workspace home with teams
4. Create team modal
5. Team board view
6. Workspace settings

### Journey 8: Calendar and events

1. Calendar month view
2. Calendar week view
3. Calendar day view with events
4. Create event modal
5. Event details modal
6. Calendar drag-to-reschedule

### Journey 9: Notifications workflow

1. Dashboard with notification bell (unread badge)
2. Notification popover open
3. Notification snooze popover
4. Notifications full page — inbox
5. Notifications full page — archived

### Journey 10: Settings and profile

1. Settings page — profile tab
2. Avatar upload modal
3. Cover image upload modal
4. Authentication — 2FA setup
5. Workspace settings

---

## Part 6: Visual Regression Tooling

### Hash-based diff script

- [ ] Build `scripts/screenshot-diff.js` that:
  - Hashes all current screenshots (SHA-256 of file content)
  - Compares against a stored `.screenshot-hashes.json` manifest
  - Reports: new screenshots, removed screenshots, changed screenshots
  - Exit code 0 if no changes, 1 if changes detected
  - Outputs a summary table to stdout

### Approval workflow

- [ ] `pnpm screenshots:diff` — compare current vs last approved
- [ ] `pnpm screenshots:approve` — update the hash manifest to accept current state
- [ ] Add `.screenshot-hashes.json` to git — serves as the visual baseline

### CI integration

- [ ] Run screenshot diff in CI after visual changes
- [ ] Flag PRs that change screenshots without updating the hash manifest

---

## Part 7: Visual Facelift

Once infrastructure is solid and coverage is complete, use the full screenshot set to drive visual improvements.

### Facelift pass

- [ ] Review the complete screenshot set and rank pages by visual quality (1-5 scale).
- [ ] Pick the bottom 5 pages for the first facelift batch.
- [ ] For each page: identify spacing issues, hierarchy problems, inconsistent patterns, visual clutter.
- [ ] Redesign in larger passes — not isolated component tweaks, page-level improvements.
- [ ] Re-run screenshots after each pass. Only keep changes that materially improve the product.

### Quality bar

- [ ] Visual cohesion across all captured screens.
- [ ] Consistent spacing rhythm, typography hierarchy, and color usage.
- [ ] No obvious AI-generated slop (nested cards, mismatched patterns, cramped layouts).
- [ ] The product should feel intentionally designed, not incrementally patched.

### Before/after documentation

- [ ] For each facelift pass, keep `reference-*.png` screenshots as the "before" baseline.
- [ ] Use the diff tool to generate a change report with the PR.

---

## Spec Folder Mapping (for new pages)

New pages need spec folder assignments. Proposed additions:

| Page | Spec Folder |
|------|------------|
| Global issues | `19-issues` |
| My issues | `20-my-issues` |
| Notifications | `21-notifications` |
| Time tracking | `22-time-tracking` |
| Org calendar | `23-org-calendar` |
| Org analytics | `24-org-analytics` |
| Invoices | `25-invoices` |
| Clients | `26-clients` |
| Workspaces | `27-workspaces` |
| Workspace detail | `28-workspace-detail` |
| Team detail | `29-team-detail` |
| Onboarding | `30-onboarding` |
| Authentication | `31-authentication` |
| Add-ons | `32-add-ons` |
| AI Assistant | `33-assistant` |
| Portal | `34-portal` |
| Roadmap | `35-roadmap` |
| Activity | `36-activity` |
| Billing | `37-billing` |
| Timesheet | `38-timesheet` |
| Project inbox | `39-project-inbox` |

---

## Execution Order

1. **Infra cleanup** — delete legacy script, fix shimmer selectors, dedup auth helper.
2. **Route coverage** — add every missing route to the capture set with proper spec folders.
3. **Modal coverage** — add every dialog/modal to the capture set.
4. **Interactive states** — add state-specific captures (filters, dropdowns, inline editing, etc.).
5. **User journeys** — implement sequential capture mode for multi-step workflows.
6. **Visual regression** — build the hash-based diff script and approval workflow.
7. **Visual facelift** — use the complete screenshot set to identify and fix the worst pages.

## Acceptance Criteria

- [x] `scripts/capture-screenshots.mjs` deleted.
- [x] No `.animate-shimmer` CSS selectors in `screenshot-pages.ts`.
- [x] Auth token injection deduplicated into a shared helper.
- [ ] Every route in `convex/shared/routes.ts` has at least one screenshot (empty + filled where applicable).
- [ ] Every modal/dialog component has at least one open-state screenshot.
- [ ] Interactive states cover board swimlanes, document editor toolbars, notification states, sprint charts.
- [ ] At least 5 user journeys captured as sequential screenshot series.
- [ ] Hash-based screenshot diff tool exists and runs in CI.
- [ ] The first visual facelift batch covers at least 5 pages with before/after comparison.
- [ ] Total screenshot count covers all 4 viewport/theme combos across all pages.
