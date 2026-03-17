# Screenshot & Visual Facelift — Remaining Work

> **Priority:** P0
> **Status:** Active
> **Last Updated:** 2026-03-16
> **Objective:** Fix visual slop across the app and expand screenshot coverage to catch regressions.

---

## Part 1: Visual Fixes (Audit Findings)

Concrete UI issues found by component audit. These are real bugs, not style preferences.

### Sidebar — Horizontal scroll on desktop

- [x] **Sidebar scrolls horizontally** — added `overflow-x-hidden` to nav container, added `min-w-0` to section header Link for proper truncation. (`AppSidebar.tsx`)

### Notification popover

- [x] **Arbitrary values replaced** — `max-w-[calc(100vw-2rem)]` → `max-w-dialog-mobile` token; `max-h-[80vh]` → `max-h-popover-panel` token.
- [x] **Scroll indicator** — added `scrollbar-subtle` to notification list scroll area.
- [x] **Filter tabs no longer scroll horizontally** — replaced `overflow-x-auto` with `flex-wrap`.
- [x] **Action buttons already animated** — `transition-fast` (150ms) on IconButton base class handles opacity reveal. No fix needed.
- [x] **Entrance animation added** — `animate-fade-in` (200ms ease-out) on notification items and date group containers. Exit animations skipped — Convex reactivity removes items from the list instantly; holding DOM nodes for exit transitions would require significant state management for marginal gain.

### Start Timer modal — too wide

- [x] **Timer modals downsized** — `TimeEntryModal.tsx` and `ManualTimeEntryModal.tsx` changed from `size="lg"` to `size="md"` (512px fits the single-column form).

### Global Search / Command palette

- [x] **Result spacing** — title `mt-1` → `mt-1.5` for more breathing room between key/badge and title.
- [x] **Tabs hard to read** — dropped `uppercase tracking-widest`, replaced with `font-medium`. Much more readable.
- [x] **Double footer consolidated** — merged search hints card + action buttons card into a single footer with Stack layout.
- [x] **Empty state tightened** — `p-6` → `p-4`, `mb-4` → `mb-3` on icon. Less vertical waste.
- [x] **Welcome section padding fixed** — `p-1`/`p-4` → `px-2 pt-2`/`p-3`. Cleaner spacing.

### Oversized modals (content doesn't fill the space)

- [x] **`UserProfile.tsx`** — `size="xl"` → `size="lg"` (672px fits profile form).
- [x] **`DashboardCustomizeModal.tsx`** — added explicit `size="sm"` (448px for 3 toggle switches).

### Fixed heights forcing unnecessary scroll

- [x] **`RecentActivity.tsx`** — `h-96` → `max-h-96` so the container shrinks to fit when few activities. Also replaced dead `custom-scrollbar` class with `scrollbar-subtle`.
- [x] **`MyIssuesList.tsx`** — already flex-based (correct), but replaced dead `custom-scrollbar` class with `scrollbar-subtle`.
- [x] **`ApiKeysManager.tsx`** — already uses `max-h-64` (correct pattern for modal lists). No fix needed.

### Missing text truncation

- [x] **`ProjectsList.tsx`** — project name `h3` had no truncation; added `truncate` + `min-w-0` on parent flex. Description already uses `line-clamp-2` (correct).
- [x] **`MentionInput.tsx`** — already has `truncate` on username + `min-w-0` on parent. No fix needed (audit was wrong).

### Timer widget CSS variable bug

- [x] **Timer widget CSS var** — `max-w-(--max-width-timer-description)` replaced with canonical `max-w-timer-description` token form. Both work in TW4 but the token form is cleaner.

### Horizontal scroll in filter tabs

- [x] **`GlobalSearch.tsx:555`** — removed `overflow-x-auto` from Tabs container (3 tabs always fit).
- [x] **`NotificationCenter.tsx:220`** — already fixed (replaced `overflow-x-auto` with `<Flex wrap>`).

---

## Part 2: Animation Polish

The app is missing entrance/exit animations in many places. Feels jarring.

### Dialogs & popovers — currently OK
- Dialog has `animate-scale-in` / `animate-scale-out`
- Popover has `animate-scale-in`
- Accordion has `animate-accordion-down`

### Missing animations

- [x] **Notification items** — added `animate-fade-in` entrance on items and date group wrappers.
- [x] **Notification date group headers** — animate in with their group container.
- [x] **Dashboard customize toggles** — Switch component already has `transition-default` (200ms) on root and thumb. Transitions work correctly.
- [x] **MoveDocumentDialog** — Dialog already has scale-in/scale-out. Select value swap is standard behavior.
- [x] **Label creation popover** — Popover already has `animate-scale-in`. No fix needed.
- [x] **Notification unread badge** — added `animate-scale-in` so the badge scales in when it first appears.

---

## Part 3: Remaining Screenshot Coverage

### Routes not yet captured

- [ ] Verify email (route doesn't exist yet)
- [ ] Portal page (`/portal/$token`)
- [ ] Onboarding flow (`/onboarding`)
- [ ] Sample project modal (onboarding)
- [ ] Invoice detail (`/$orgSlug/invoices/$invoiceId`)

### Modals not yet captured

- [ ] Dashboard customize modal (button not rendered for screenshot user)
- [ ] Move document dialog
- [ ] Avatar upload modal
- [ ] Cover image upload modal
- [ ] Markdown preview modal
- [ ] Sample project modal (needs fresh user)
- [ ] Confirm dialog (destructive action trigger)
- [ ] Alert dialog (error/warning condition)

### Interactive states not yet captured

**Board/Kanban:**
- [ ] Column empty (workflow state with no issues)
- [ ] WIP limit warning (configured + exceeded)

**Issues:**
- [ ] Draft restoration banner (localStorage draft + re-open)
- [ ] Duplicate detection (similar issue titles in seed)
- [ ] Inline editing (issue detail interaction)
- [ ] Side panel / peek mode (Sheet doesn't appear — needs investigation)
- [ ] Label creation popover
- [ ] Issue with all property types visible (fully populated seed)

**Documents:**
- [ ] Document locked (backend mutation needed)
- [ ] Text color picker (toolbar + color picker click)
- [ ] Document with table (seed content)
- [ ] Document with code block (seed content)
- [ ] Document favorites star (starred items in seed)

**Calendar:**
- [ ] Drag-and-drop preview
- [ ] Quick-add on day click

**Sprints:**
- [ ] Completion modal (active sprint with issues)
- [ ] Date overlap warning (overlapping dates in seed)

**Gantt/Roadmap:**
- [ ] Dependency lines (issue relations in seed)
- [ ] Block resize (drag handle state)

**Notifications:**
- [ ] Snooze popover

**Settings:**
- [ ] Profile with avatar
- [ ] Profile with cover image
- [ ] 2FA setup flow
- [ ] Workspace settings
- [ ] Project settings (workflow states, WIP limits, danger zone)

**Navigation:**
- [ ] Sidebar favorites section
- [ ] Sidebar with project tree
- [ ] Mobile hamburger menu

**Error/Edge:**
- [ ] Permission denied
- [ ] Loading skeletons
- [ ] Toast notification (success + error)
- [ ] Form validation errors

### Screenshot-specific validator

- [x] **Screenshot route coverage validator** — `check-screenshot-coverage.js` compares routes in `convex/shared/routes.ts` against refs in `screenshot-pages.ts`. Reports 55/59 covered, 4 legitimate gaps (invite, onboarding, inbox, invoices.detail). Informational, never blocks CI.

### CI integration

- [ ] **CI screenshot manifest check** — screenshots are gitignored, so CI can't run the diff. Would require generating screenshots in CI (needs browser + dev server) or committing PNGs to git.
- [ ] **Flag PRs with stale manifest** — blocked by above.

---

## Part 4: User Journeys

Sequential screenshot series showing complete workflows. None implemented yet.

1. **New user onboarding** — signup → verify → org creation → sample project → dashboard
2. **Issue lifecycle** — board → create → detail → move column → close
3. **Sprint planning** — sprints page → create → backlog assign → board → burndown → complete
4. **Document collaboration** — list → new doc → slash menu → @mention → lock → comments
5. **Search and navigation** — dashboard → omnibox → results → advanced search → filtered list
6. **Time tracking** — empty page → start timer → manual entry → entries list → billing
7. **Workspace management** — list → create → teams → create team → board → settings
8. **Calendar and events** — month → week → day → create event → details → drag reschedule
9. **Notifications workflow** — bell badge → popover → snooze → full page inbox → archived
10. **Settings and profile** — profile → avatar → cover image → 2FA → workspace settings

---

## Part 5: Visual Facelift (after fixes)

Once Part 1-2 fixes land, use the screenshot set to drive page-level improvements.

- [ ] Review screenshot set and rank pages by visual quality (1-5).
- [ ] Pick bottom 5 pages for first facelift batch.
- [ ] For each: fix spacing, hierarchy, patterns, clutter.
- [ ] Re-run screenshots after each pass. Only keep material improvements.
- [ ] Visual cohesion across all screens — consistent spacing, typography, color.
- [ ] No nested cards, mismatched patterns, cramped layouts.
- [ ] Before/after comparison using screenshot diff tool.

---

## Execution Order

1. **Visual fixes (Part 1)** — fix the concrete bugs found in audit.
2. **Animation polish (Part 2)** — add missing transitions.
3. **Screenshot coverage (Part 3)** — capture remaining routes, modals, states.
4. **User journeys (Part 4)** — implement sequential capture mode.
5. **Visual facelift (Part 5)** — use screenshots to identify and fix worst pages.
