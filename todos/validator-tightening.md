# Validator Tightening Proposal

> Goal: make design drift materially harder without turning the validator suite into noise.
>
> Constraint: keep validators errors-only. No warning mode.

## Status

### Completed on 2026-03-12

- Removed `src/components/Dashboard/` from `RAW_TAILWIND_ALLOWED_DIRS`.
- Removed `Dashboard/` from the `check-interactive-tw.js` migration allowlist.
- Expanded `DESIGN_SYSTEM_TARGET_FILES` to cover dashboard and navigation surfaces that were previously escaping ownership checks.
- Migrated the dashboard shells surfaced by the tighter rules to owned primitives:
  - `Greeting.tsx`
  - `MyIssuesList.tsx`
  - `QuickStats.tsx`
  - `FocusZone.tsx`
  - `RecentActivity.tsx`
  - `WorkspacesList.tsx`
- Removed the broad raw-Tailwind directory exemptions for:
  - `src/components/Settings/`
  - `src/components/Admin/`
  - `src/components/ProjectSettings/`
- Replaced those directory-wide raw-Tailwind escapes with explicit file-level migration debt entries.
- Removed the broad interactive-state allowlist exemptions for:
  - `Settings/`
  - `Admin/`
- Replaced those interactive directory escapes with explicit file-level migration debt entries.
- Removed the `ProjectSettings` file-level raw-Tailwind debt entries by migrating the project settings surfaces onto owned `Card` and layout primitives.
- Added the main project settings shell to `check-design-system-ownership.js` targeting so future shell drift there is validated directly.
- Removed `Settings/NotificationsTab.tsx`, `Settings/LinkedRepositories.tsx`, and `Settings/TwoFactorSettings.tsx` from the raw-Tailwind migration debt list by migrating them onto owned form and surface primitives.
- Removed `Settings/NotificationsTab.tsx` from the interactive-state migration debt list.
- Added `Settings/NotificationsTab.tsx` to design-system ownership targeting so future shell drift there is validated directly.
- Removed `Settings/ProfileContent.tsx` and `Settings/PumbleIntegration.tsx` from the raw-Tailwind migration debt list by migrating them onto owned card, avatar, empty-state, and form primitives.
- Removed `Settings/ProfileContent.tsx` and `Settings/PumbleIntegration.tsx` from the interactive-state migration debt list.
- Added `Settings/ProfileContent.tsx` and `Settings/PumbleIntegration.tsx` to design-system ownership targeting so shell drift there is blocked directly.
- Removed `Settings/ApiKeysManager.tsx` and `Settings/GoogleCalendarIntegration.tsx` from the interactive-state migration debt list by migrating their local cards, callouts, and option shells onto owned primitives.
- Added `Settings/ApiKeysManager.tsx` and `Settings/GoogleCalendarIntegration.tsx` to design-system ownership targeting so future settings-shell drift there is caught directly.
- Removed `Settings/AvatarUploadModal.tsx` and `Settings/CoverImageUploadModal.tsx` from the raw-Tailwind and interactive-state migration debt lists by extracting the shared upload dropzone into an owned UI primitive and moving modal shells onto `Card` and `IconButton`.
- Added `Settings/AvatarUploadModal.tsx` and `Settings/CoverImageUploadModal.tsx` to design-system ownership targeting so upload-surface drift is blocked directly.
- Removed `Admin/UserManagement.tsx` from the raw-Tailwind and interactive-state migration debt lists by migrating its tabs and admin tables onto owned `Tabs`, `Table`, `Badge`, and `Button` primitives.
- Removed `Admin/OAuthHealthDashboard.tsx` from the raw-Tailwind migration debt list by moving its failure-entry shell onto owned `Card` and `Icon` primitives.
- Added `Admin/UserManagement.tsx` and `Admin/OAuthHealthDashboard.tsx` to design-system ownership targeting so admin-shell drift is blocked directly.
- Removed `Admin/HourComplianceDashboard.tsx` and `Admin/UserTypeManager.tsx` from the interactive-state migration debt list by moving their hover shells onto owned `Card` interaction props and replacing raw checkbox controls with the shared `Checkbox` primitive.
- Added `Admin/HourComplianceDashboard.tsx` and `Admin/UserTypeManager.tsx` to design-system ownership targeting so future admin-shell drift is validated directly.
- Added a dedicated blocking validator in `scripts/validate/check-surface-shells.js` for raw reusable shell stacks (`rounded + bg + border + shadow + overflow/state`) outside temporary Tailwind escape hatches, and wired it into `scripts/validate.js`.
- Fixed the first surfaced violations in `Dashboard/WorkspacesList.tsx` and `IssueDetailModal.tsx` by moving their shell styling back behind owned `Card` and `Dialog` recipes instead of local class stacks.
- Removed `src/components/Analytics/` from `RAW_TAILWIND_ALLOWED_DIRS` and removed `Analytics/` from the interactive-state migration allowlist.
- Migrated `Analytics/RecentActivity.tsx` off its local hover/surface shell by moving the timeline row styling behind an owned `Card` recipe, and cleaned `Analytics/BarChart.tsx` so its fill track no longer depends on raw flex utility stacks.
- Added `Analytics/RecentActivity.tsx` to design-system ownership targeting so future analytics shell drift is blocked directly.
- Removed `src/components/TimeTracker/` from `RAW_TAILWIND_ALLOWED_DIRS`.
- Removed the last surfaced `TimeTracker` shell override in `TimeTracker/BillingReport.tsx` by dropping the locally-styled `SelectTrigger` chrome and relying on the owned select primitive.
- Added `TimeTracker/BillingReport.tsx` and `TimeTracker/Timesheet.tsx` to design-system ownership targeting so future time-tracker shell drift is validated directly.
- Removed `src/components/TimeTracking/` from `RAW_TAILWIND_ALLOWED_DIRS`.
- Replaced that broad `TimeTracking/` escape hatch with explicit file-level migration debt entries for the remaining high-drift files:
  - `TimeTracking/BurnRateDashboard.tsx`
  - `TimeTracking/ManualTimeEntryModal.tsx`
  - `TimeTracking/TimeEntriesList.tsx`
  - `TimeTracking/TimeEntryModal.tsx`
  - `TimeTracking/UserRatesManagement.tsx`
- Removed `TimeTracking/TimeTrackingPage.tsx` and `TimeTracking/TimerWidget.tsx` from raw-Tailwind debt immediately by switching `TimeTrackingPage` to owned `Flex` wrap/select trigger APIs and dropping redundant button chrome overrides from `TimerWidget`.
- Removed `TimeTracking/TimeEntryModal.tsx` from raw-Tailwind debt by migrating its raw date/time/tag/billable controls onto owned `Input`, `Checkbox`, `Badge`, `IconButton`, and `Card` recipe APIs.
- Removed `TimeTracking/UserRatesManagement.tsx` from raw-Tailwind debt by migrating the empty state, rate-type options, and hourly-rate form onto owned `EmptyState`, `RadioGroup`, `Input`, `Label`, and `Card` recipe APIs.
- Removed `TimeTracking/ManualTimeEntryModal.tsx` from the raw-Tailwind and interactive-state debt lists by replacing its custom mode toggle, raw form fields, tag pills, billable control, and duration shells with owned `SegmentedControl`, `Input`, `Checkbox`, `Badge`, `IconButton`, and `Card` recipe APIs.
- Removed `TimeTracking/TimeEntriesList.tsx` from the raw-Tailwind and interactive-state debt lists by moving its header shell and entry rows onto owned `Card`, `ListItem`, `Icon`, `Badge`, and `IconButton` primitives instead of local hover strips, separators, and spacing stacks.
- Removed `TimeTracking/BurnRateDashboard.tsx` from the raw-Tailwind debt list by moving its metric tiles, empty state, and member identity shell onto owned `Card` recipe, `Badge`, `EmptyState`, and `Avatar` APIs instead of local reporting-surface classes.
- Removed `TimeTracking/TimerWidget.tsx` from the interactive-state debt list by moving its running-timer strip and stop control onto owned `Card` and `Button` recipes instead of local hover and focus-visible class stacks.
- Removed `Dashboard.tsx` from the `check-recipe-drift.js` migration allowlist by moving its outer shell and main content panels onto owned `Card` recipes instead of local border/background/shadow stacks.
- Removed `IssueDetailModal.tsx` from the `check-recipe-drift.js` migration allowlist now that it no longer carries any repeated surface recipe drift.
- Removed `BulkOperationsBar.tsx` from the `check-recipe-drift.js` migration allowlist by moving its floating action-bar shell onto an owned `Card` recipe instead of leaving the border/background/shadow contract inline in feature code.
- Removed `RoadmapView.tsx` from the `check-recipe-drift.js` migration allowlist by moving its roadmap header controls and empty state back onto owned `Card`, `Select`, and `EmptyState` primitives instead of keeping surface recipes inline in feature code.
- Removed `CreateProjectFromTemplate.tsx` and `ImportExport/ImportPanel.tsx` from the `check-recipe-drift.js` migration allowlist by moving their option-selector tiles, callouts, and import input shell back onto owned `Card`, `Alert`, and form primitives instead of leaving those surfaces inline in feature code.
- Removed `Settings/AvatarUploadModal.tsx` and `Settings/ProfileContent.tsx` from the `check-recipe-drift.js` migration allowlist after confirming their remaining classes are layout/adornment-only and no longer define reusable surface recipes outside owned primitives.
- Removed `Dashboard/RecentActivity.tsx` and `Dashboard/WorkspacesList.tsx` from the `check-recipe-drift.js` migration allowlist after confirming their remaining classes are owned-card composition, spacing, and label adornment only rather than reusable inline surface recipes.
- Removed `Calendar/CreateEventModal.tsx` and `Settings/LinkedRepositories.tsx` from the `check-recipe-drift.js` migration allowlist by dropping the last local select-trigger surface override in `CreateEventModal` and confirming `LinkedRepositories` no longer defines reusable inline surface recipes outside owned primitives.
- Removed `Settings/PumbleIntegration.tsx` and `TimeTracker/BillingReport.tsx` from the `check-recipe-drift.js` migration allowlist after confirming their remaining classes are owned-primitives composition, spacing, and typography only rather than inline reusable surface recipes.
- Removed `ProjectSettings/GeneralSettings.tsx`, `ProjectSettings/MemberManagement.tsx`, and `ProjectSettings/WorkflowSettings.tsx` from the `check-recipe-drift.js` migration allowlist by replacing the last inline project-key surface in `GeneralSettings` with owned `Card` composition and confirming the other two files no longer define reusable inline surface recipes.
- Removed `Plate/SlashMenu.tsx` from the `check-recipe-drift.js` migration allowlist by moving its popover shell behind an owned `Popover` recipe, reducing the recipe-drift allowlist to zero.
- Removed the dead migration framing from `check-recipe-drift.js` now that the recipe-drift allowlist is at zero, so the validator reads and reports as direct ownership enforcement instead of temporary migration logic.
- Expanded `check-recipe-drift.js` to block positioned command/menu shell chrome on feature-level `Command`, `PopoverContent`, and `DropdownMenuContent` usage when border/background/shadow/rounded shell styling is still defined inline instead of behind owned overlay primitives.
- Added a `suggestionMenu` recipe to `ui/Command.tsx` and migrated `MentionInput.tsx` autocomplete to that owned recipe so command-surface chrome no longer lives inline in feature code.
- Added owned `Card` recipes for floating product shells and migrated the highest-drift remaining widget/toolbar surfaces onto them:
  - `Onboarding/OnboardingChecklist.tsx` now uses `Card` `floatingWidget` and `successCallout` recipes instead of defining its fixed widget shell and completion banner inline.
  - `Kanban/BoardToolbar.tsx` now uses a `Card` `floatingToolbar` recipe instead of defining its mobile floating toolbar shell inline.
- Added `Onboarding/OnboardingChecklist.tsx` and `Kanban/BoardToolbar.tsx` to design-system ownership targeting so future floating-shell drift in those surfaces is blocked directly.
- Added an owned `Card` `mentionMenu` recipe and migrated `Plate/MentionInputElement.tsx` to it so the Plate mention autocomplete no longer carries extra overflow/shadow shell styling inline on top of a `Card`.
- Added `Plate/MentionInputElement.tsx` to design-system ownership targeting so future mention-menu shell drift is blocked directly.
- Added `TimeTracking/TimeEntryModal.tsx` and `TimeTracking/UserRatesManagement.tsx` to design-system ownership targeting so future time-entry shell drift is validated directly.
- Added `TimeTracking/ManualTimeEntryModal.tsx` to design-system ownership targeting so future manual-entry shell drift is validated directly.
- Added `TimeTracking/TimeEntriesList.tsx` to design-system ownership targeting so future list-row shell drift is validated directly.
- Added `TimeTracking/BurnRateDashboard.tsx` to design-system ownership targeting so future reporting-shell drift is validated directly.
- Added `Dashboard.tsx` and `IssueDetailModal.tsx` to design-system ownership targeting so future dashboard and issue-modal shell drift is validated directly.
- Added `BulkOperationsBar.tsx` to design-system ownership targeting so future action-bar shell drift is blocked directly.
- Added `RoadmapView.tsx` to design-system ownership targeting so future roadmap shell drift is blocked directly.
- Added `CreateProjectFromTemplate.tsx` and `ImportExport/ImportPanel.tsx` to design-system ownership targeting so future import and template-creation shell drift is blocked directly.
- Burned down the final explicit `TimeTracking` interactive-state allowlist entry.

### Next batch

- Hardened `check-recipe-drift.js` so overlay/menu shell detection now reads full multiline `className` spans instead of only simple quoted one-line values. That closes the gap where `className={cn(...)}`
  overlay shells could avoid detection.
- Added an owned `floatingToolbar` recipe to `PopoverContent` and moved `Plate/FloatingToolbar.tsx` onto it so the selected-text toolbar no longer defines its shell chrome inline.
- Added `Plate/FloatingToolbar.tsx` to design-system ownership targeting so future shell drift there is blocked directly.

### Next batch

- Moved `FuzzySearch/FuzzySearchInput.tsx` off its inline absolute dropdown shell by introducing an owned `Card` `searchDropdown` recipe for the results surface.
- Removed the broad `src/components/FuzzySearch/` raw-Tailwind escape hatch. The only non-production file in that folder is the `.example.tsx`, which is already covered by the example-file extension escape hatch.
- Moved the landing navigation chrome behind owned recipes by adding `Card` `landingNavShell` and `landingNavRail` recipes and wiring `Landing/NavHeader.tsx` to them.
- Added `Landing/NavHeader.tsx` to design-system ownership targeting so future nav-shell drift is validated directly.
- Moved the assistant surfaces onto owned primitive chrome: `AIChat.tsx` now uses a floating `IconButton` variant for message-copy affordances, and `AIAssistantButton.tsx` now uses an owned `Button` variant plus `Badge` variant instead of feature-level launcher/badge shell recipes.
- Added `AI/AIAssistantButton.tsx` to design-system ownership targeting so future assistant-launcher shell drift is validated directly.

### Next batch

- Continue the floating-surface pass with remaining positioned overlays surfaced by the stronger scan, especially files that still define chrome on `fixed` or `absolute` panels instead of plain backdrops.
- Prioritize the next shared floating shells that still combine positioned chrome with border/background/shadow outside owned primitives, especially smaller overlay controls in `AI/` and remaining interactive helper badges rather than decorative backdrops.
- Removed the broad `src/components/AI/` raw-Tailwind escape hatch and replaced it with explicit file-level debt for the remaining AI-heavy surfaces: `AI/AIAssistantPanel.tsx`, `AI/AIChat.tsx`, and `AI/AIErrorFallback.tsx`.
- Replaced the broad `AI/` interactive-state allowlist entry with explicit debt for `AI/AIAssistantPanel.tsx` and `AI/AIChat.tsx`.
- Removed the broad `FuzzySearch/` interactive-state allowlist entry; only `FuzzySearch/AssigneeSearchDropdown.example.tsx` remains exempt there.
- Moved `FuzzySearch/FuzzySearchInput.tsx` off its inline clear-button and loading-spinner chrome by using owned `IconButton` and the shared `InlineSpinner` primitive.
- Migrated `AI/AISuggestionsPanel.tsx` off its inline CTA and suggestion-card shells by using an owned `Button` gradient variant, `Card` interactive surface, `EmptyState`, `InlineSpinner`, and `SegmentedControl` wrap props.
- Added `AI/AISuggestionsPanel.tsx` to design-system ownership targeting so future suggestion-shell drift is blocked directly.
- Removed `AI/AIAssistantPanel.tsx` from the raw-Tailwind debt list by moving its sheet body layout into an owned `Sheet` layout variant, its gradient header into an owned `Card` recipe, and its tab fill/stretch behavior into owned `Tabs` variants.
- Removed `AI/AIAssistantPanel.tsx` from the interactive-state debt list.
- Added `AI/AIAssistantPanel.tsx` to design-system ownership targeting so future assistant-panel shell drift is blocked directly.
- Removed `AI/AIChat.tsx` from the raw-Tailwind and interactive-state debt lists by moving its message bubbles and composer chrome behind owned `Card` and `Textarea` variants, replacing inline metadata/timing shells with `Metadata` and `InlineSpinner`, and moving markdown message styling into a shared `MarkdownContent` primitive.
- Removed `AI/AIErrorFallback.tsx` from the raw-Tailwind debt list by collapsing it onto the shared `SectionErrorFallback` and owned `Alert` primitives instead of keeping an AI-specific centered shell and debug-details surface inline.
- Added `AI/AIErrorFallback.tsx` to design-system ownership targeting so future assistant fallback shell drift is blocked directly.
- Removed `UserMenu.tsx` from the raw-Tailwind and interactive-state debt lists by moving destructive item styling into owned `DropdownMenuItem` variants and replacing the leftover feature-level menu-label weight override with an owned `DropdownMenuLabel` prop.
- Removed `Notifications/NotificationCenter.tsx` from the raw-Tailwind and interactive-state debt lists by moving its sticky header/group/footer shells onto owned `Card` recipes, switching the unread count to the shared `Badge` `alertCount` variant, and replacing feature-level hover text links with owned `Button` link composition.

### Next batch

- Continue shrinking the explicit `AI` debt now that the broad directory escapes are gone.
- The explicit `AI` raw-Tailwind debt list is now empty.
- Keep working through smaller helper controls and shared reveal surfaces rather than decorative backdrops, with the next pass focused on `Notifications/NotificationItem.tsx`, which still owns the unread-row shell, reveal actions, and snooze menu composition in feature code.

## Problem

The real migration risk is not one-off Tailwind usage. The risk is visual identity being defined ad hoc inside feature files.

Example drift shape:

```tsx
className="relative overflow-hidden rounded-3xl border-ui-border-secondary/75 bg-ui-bg-elevated/98 shadow-elevated"
```

That is a surface recipe living in page code. If we have 20 versions of that with slightly different radius, border opacity, shadow, padding, and hover states, a redesign becomes manual search-and-replace across feature files.

The validator system should therefore focus less on generic "Tailwind exists" policing and more on:

1. banning repeated visual shell stacks outside owned primitives
2. shrinking escape hatches aggressively
3. enforcing semantic ownership for layout, text, navigation, and stateful controls

## Current State

### What is already enforced well

- Raw flex containers on raw elements are blocked in `check-standards.js`.
- Raw grid containers on raw elements are blocked in `check-standards.js`.
- Raw font sizing, weight, tracking, and leading on raw elements are blocked in `check-standards.js`.
- Flex item classes on raw elements are blocked in `check-standards.js`.
- `ToggleGroup` ownership is already enforced in `check-control-ownership.js`.
- Importing CVA helpers outside owning primitives is already blocked in `check-cva-boundaries.js`.
- Layout prop usage on `Flex` and `Stack` is already enforced in `check-layout-prop-usage.js`.

### Where the current policy is too soft

- `RAW_TAILWIND_ALLOWED_DIRS` currently allows `23` directories in [tailwind-policy.js](/home/mikhail/Desktop/cascade/scripts/validate/tailwind-policy.js).
- `RAW_TAILWIND_ALLOWED_FILES` currently allows `48` specific files in [tailwind-policy.js](/home/mikhail/Desktop/cascade/scripts/validate/tailwind-policy.js).
- `check-interactive-tw.js` has `49` allowlist entries.
- `check-recipe-drift.js` has `18` allowlist entries.
- `check-design-system-ownership.js` only targets `11` files, which is too narrow relative to where shell drift actually happens.

Result: the validator suite passes, but a lot of visually important surfaces are effectively exempt.

## Principle

Do not optimize for banning all Tailwind.

Optimize for banning the kinds of Tailwind that create migration debt:

- repeated surface styling
- repeated spacing rhythm
- repeated interactive states
- repeated typography styling
- repeated navigation and segmented-control patterns

## Proposal

## 1. Shrink Raw Tailwind Escape Hatches Hard

### Current issue

The raw Tailwind policy is broad enough that many of the highest-drift feature areas are exempt by default.

### Proposal

Reduce the raw-Tailwind allow policy in phases:

#### Remove entire directories from `RAW_TAILWIND_ALLOWED_DIRS`

Start with these:

- `src/components/Dashboard/`
- `src/components/Analytics/`
- `src/components/Settings/`
- `src/components/Admin/`
- `src/components/ProjectSettings/`
- `src/components/TimeTracking/`
- `src/components/TimeTracker/`

These are exactly the kinds of application shells that should be most migration-safe.

#### Keep only genuinely complex or still-forming composition areas temporarily allowed

Examples of acceptable temporary exemptions:

- `src/components/Plate/`
- `src/components/Kanban/`
- `src/components/Calendar/`
- `src/components/AI/`

These areas have real interaction complexity and may need more gradual extraction.

### Expected effect

This tightens the validator where product drift matters most without blocking every advanced surface immediately.

## 2. Replace Generic Tailwind Policing With Surface Ownership Bans

### Current issue

The current raw Tailwind patterns flag things like `rounded-*`, `p-*`, `text-*`, and `flex`, but they do not clearly separate:

- acceptable one-off composition
- dangerous reusable shell definition

### Proposal

Add or tighten a blocking validator specifically for **surface recipe drift**:

Block raw class stacks outside `src/components/ui/` when a node combines 3 or more of:

- `rounded-*`
- `bg-ui-*`
- `border-ui-*`
- `shadow-*`
- `overflow-hidden`
- hover or selected shell states

This should be stricter than the current `check-recipe-drift.js`, and it should not rely on a large migration allowlist forever.

### Example of what should fail

```tsx
<div className="rounded-3xl border border-ui-border-secondary bg-ui-bg-elevated shadow-elevated" />
```

### Expected replacement

- `Card` variant
- `Panel` or `Surface` primitive
- `PageSection` or `SettingsSection` shell
- dedicated feature primitive with internal CVA

## 3. Ban Freeform Typography Styling In More Places

### Current issue

Raw font classes are already blocked on raw elements, which is good. But drift can still leak through component wrappers or local class stacks.

### Proposal

Extend typography enforcement to block repeated text-class stacks on non-typography components when they define semantic text roles such as:

- page title
- section title
- helper text
- metadata
- label

Examples to ban:

- `className="text-sm font-medium text-ui-text"`
- `className="text-xs text-ui-text-secondary tracking-wide"`

unless they live inside:

- `Typography`
- `Badge`
- `MetadataItem`
- a dedicated UI primitive

### Expected effect

This reduces the number of local text systems and makes redesigning hierarchy cheaper.

## 4. Enforce Owned Page Shells And Section Spacing

### Current issue

A lot of inconsistency comes from page-level spacing and section wrappers, not just buttons and cards.

### Proposal

Introduce a page-shell validator that blocks repeated freeform section shells in routes and high-level feature files.

Block patterns like:

- repeated `max-w-* mx-auto px-* py-*`
- repeated top-level `flex flex-col gap-*`
- repeated section wrappers with custom border, background, radius, and padding mixes

unless they use owned shells such as:

- `PageLayout`
- `PageHeader`
- future `PageSection`
- future `ContentCard` or `Surface`

### Expected effect

This is where spacing and positioning consistency will improve fastest.

## 5. Tighten Interactive-State Ownership By Surface Type

### Current issue

`check-interactive-tw.js` currently allows too many files. That means hover, active, selected, focus, and disabled states are often defined locally.

### Proposal

Reduce the interactive allowlist aggressively and split the remaining cases by type:

#### Hard-block immediately in

- settings
- dashboard
- analytics
- admin
- roadmap
- navigation surfaces

#### Temporary exemptions only in genuinely complex areas

- editor
- kanban
- plate
- calendar internals

### Additional rule

If a file contains both:

- a shell recipe
- and interaction variants

that should be an immediate extraction candidate into CVA.

## 6. Expand Design-System Ownership Beyond 11 Target Files

### Current issue

`check-design-system-ownership.js` only targets `11` files. That is too selective.

### Proposal

Expand the target set to include:

- `AppSidebar`
- `Dashboard/*`
- `Settings/*`
- `Admin/*`
- `Analytics/*`
- `ProjectSettings/*`
- `Notification*`
- `RoadmapView`
- `IssueDetail*`
- `DocumentHeader`
- `UserMenu`

Then move from a file allowlist model toward a directory strategy:

- enforce ownership in all high-level product shell directories
- keep only a short exception list for true edge cases

## 7. Convert Migration Allowlists Into Burn-Down Lists

### Current issue

Current allowlists read like permanent policy, not temporary debt.

### Proposal

For each validator with an allowlist:

- rename `ALLOWED_FILES` to something debt-shaped like `MIGRATION_ALLOWLIST`
- require each entry to have a comment explaining why it is exempt
- add a target size in the file header
- fail CI if the allowlist grows without an explicit validator update

Example:

```ts
// Target: drive to < 10 entries
const MIGRATION_ALLOWLIST = [
  // Complex editor surface pending owned primitive extraction
  "Plate/",
];
```

### Expected effect

This makes exceptions visible debt instead of invisible policy.

## 8. Recommended New Hard Bans

These are the bans most worth adding next:

1. Ban repeated surface stacks outside owned primitives.
2. Ban repeated top-level page shell spacing stacks outside `PageLayout` and future shell primitives.
3. Ban repeated text role stacks outside typography primitives.
4. Ban interactive shell states outside CVA-backed components in high-level product surfaces.
5. Ban growth of validator allowlists without explicit edits.

These are less urgent because they are already mostly covered:

1. Raw flex usage.
2. Raw font classes on raw elements.
3. ToggleGroup ownership.
4. CVA helper imports outside primitives.

## Rollout Plan

### Phase 1: Tighten Existing Validators

- Shrink `RAW_TAILWIND_ALLOWED_DIRS`
- Shrink `check-interactive-tw.js` allowlist
- Expand `check-design-system-ownership.js` target set
- Turn allowlists into documented migration lists

### Phase 2: Add High-Leverage New Checks

- Surface recipe ownership validator
- Page shell ownership validator
- Text role ownership validator

### Phase 3: Burn Down Exceptions

- Remove allowlist entries every time a surface is migrated
- Make allowlist growth a deliberate code review event

## Recommendation

Do not add broad new bans for their own sake.

The best tightening move is:

1. shrink the current allowlists
2. add a strict surface-shell ownership check
3. add a strict page-shell spacing check

That directly attacks the migration problem you called out: dozens of slightly different local recipes for radius, border, background, spacing, and shadow.
