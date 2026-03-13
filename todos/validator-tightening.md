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
- Removed `Notifications/NotificationItem.tsx` from the raw-Tailwind and interactive-state debt lists by moving its row shell onto owned `Card` recipes, moving its snooze menu chrome onto an owned `Popover` recipe, and replacing feature-level reveal classes with primitive-owned responsive `IconButton` reveal behavior.
- Removed `InboxList.tsx` from the raw-Tailwind and interactive-state debt lists by moving inbox status shells onto owned `Card` recipes, replacing the leftover destructive menu class with the owned `DropdownMenuItem` danger variant, and tightening its action/button chrome onto shared primitives.
- Removed `ActivityFeed.tsx` from the raw-Tailwind and interactive-state debt lists by moving its repeated hover-entry and timeline-icon shells onto owned `Card` recipes instead of inline rounded/background/hover stacks.
- Removed `UserActivityFeed.tsx` from the raw-Tailwind and interactive-state debt lists by moving its repeated activity-row and icon shells onto owned `Card` recipes, replacing its custom empty state with the shared `EmptyState` primitive, and moving its issue-key styling behind owned `Typography`.
- Removed `ProjectsList.tsx` from the raw-Tailwind debt list by moving the single-project highlight strip and project-key tile onto owned `Card` recipes instead of inline shell styling.
- Removed `App/AppHeader.tsx` from the raw-Tailwind and interactive-state debt lists by moving the sticky header shell and workspace cockpit chip onto owned `Card` recipes instead of keeping the app-header chrome inline.
- Removed `App/AppSidebar.tsx` from the raw-Tailwind and interactive-state debt lists by moving the sidebar shell, header/footer rails, primary nav icon shells, section toggles, and collapsible section icon chrome onto owned `Card` recipes and shared `IconButton` sizing instead of inline navigation shell classes.
- Added `App/AppSidebar.tsx` to design-system ownership targeting so future shared-navigation shell drift is blocked directly.
- Removed `GlobalSearch.tsx` from the raw-Tailwind and interactive-state debt lists by moving its loading, empty, intro, pagination, and footer shells onto owned `Card`, `LoadingSpinner`, `KeyboardShortcut`, and `Button` composition instead of raw search-surface padding, flex, and hover classes.
- Removed `FilterBar.tsx` from the raw-Tailwind and interactive-state debt lists by moving its filter bar shell onto an owned `Card` recipe, collapsing the saved-filter row interaction onto owned `DropdownMenuItem` and `IconButton` primitives, and replacing the date-menu padding shell with owned `Card` composition.
- Added `FilterBar.tsx` to design-system ownership targeting so future search/filter shell drift is blocked directly.
- Removed the broad `src/components/AdvancedSearchModal/` raw-Tailwind escape hatch and removed `AdvancedSearchModal/` from the interactive-state allowlist.
- Removed `AdvancedSearchModal.tsx` from the raw-Tailwind debt list and added `AdvancedSearchModal.tsx`, `AdvancedSearchModal/FilterCheckboxGroup.tsx`, and `AdvancedSearchModal/SearchResultsList.tsx` to design-system ownership targeting so future advanced-search shell drift is blocked directly.
- Migrated the advanced-search filter groups and results list onto owned `Card`, `Checkbox`, and `EmptyState` primitives instead of local checkbox-row, result-row, and empty-state shell styling.
- Removed `IssueDetail/CreateIssueModal.tsx` from the raw-Tailwind and interactive-state debt lists by moving its AI CTA onto an owned button variant, replacing its interactive label-pill shell with an owned `IssueLabelChip` primitive, and collapsing the unassigned assignee token onto owned avatar composition.
- Added `IssueDetail/CreateIssueModal.tsx` to design-system ownership targeting so future issue-creation shell drift is blocked directly.
- Removed `CommentReactions.tsx` from the raw-Tailwind and interactive-state debt lists by moving the reaction pill chrome onto owned `Button` chrome variants and moving the emoji picker shell onto an owned `Popover` recipe.
- Added `CommentReactions.tsx` to design-system ownership targeting so future comment-reaction shell drift is blocked directly.
- Removed `IssueComments.tsx` from the raw-Tailwind and interactive-state debt lists by moving the comment card and pending attachment row chrome onto owned `Card` recipes, collapsing the empty state onto the shared `EmptyState` primitive, and replacing the attachment link hover styling with owned button composition.
- Added `IssueComments.tsx` to design-system ownership targeting so future comment-thread shell drift is blocked directly.
- Removed `AttachmentList.tsx` and `FileAttachments.tsx` from the interactive-state debt list by extracting shared `AttachmentRow` and `FileUploadDropzone` primitives and moving file-link, action-reveal, and dropzone interaction chrome into owned UI components.
- Added `AttachmentList.tsx` and `FileAttachments.tsx` to design-system ownership targeting so future attachment-shell drift is blocked directly.
- Removed `IssueDependencies.tsx` from the raw-Tailwind and interactive-state debt lists by moving dependency rows onto owned `Card` recipes and replacing its search-result button shell with owned `selectionRow` card recipes.
- Added `IssueDependencies.tsx` to design-system ownership targeting so future dependency-surface drift is blocked directly.
- Removed `LabelsManager.tsx` from the raw-Tailwind and interactive-state debt lists by moving group headers and label rows onto owned `Card` recipes and dropping the remaining feature-level link-shell override in the empty group state.
- Added `LabelsManager.tsx` to design-system ownership targeting so future label-management shell drift is blocked directly.

### Next batch

- Continue shrinking the explicit `AI` debt now that the broad directory escapes are gone.
- The explicit `AI` raw-Tailwind debt list is now empty.
- Removed `IssueDetail/IssueCard.tsx` from the raw-Tailwind and interactive-state debt lists by moving its shell/focus states onto owned `Card` and `Button` variants and replacing the inline selection/avatar styling with owned primitives.
- Removed `MentionInput.tsx` from the raw-Tailwind and interactive-state debt lists by moving its preview/editor/emoji surfaces onto owned `Card`, `Textarea`, and `Popover` primitives.
- Added `IssueDetail/IssueCard.tsx` and `MentionInput.tsx` to design-system ownership targeting so future shell drift is blocked directly.
- Removed `Documents/DocumentHeader.tsx` from the raw-Tailwind and interactive-state debt lists by moving its title, title-input, shell, and action-button contracts onto owned `Typography`, `Input`, `Card`, `Button`, and `Flex` APIs.
- Removed `IssueDescriptionEditor.tsx` from the raw-Tailwind and interactive-state debt lists by moving the editor/read-only prose contract into `ui/MarkdownContent` variants instead of keeping Plate content styling inline in feature code.
- Added `IssueDescriptionEditor.tsx` to design-system ownership targeting so future editor-surface drift is blocked directly.
- Removed `Documents/DocumentTemplatesManager.tsx` from the raw-Tailwind and interactive-state debt lists by moving template-card shells onto owned `Card` recipes, replacing inline edit/delete controls with owned `IconButton`, and replacing the raw public checkbox row with the shared `Checkbox` primitive.
- Removed `TimeTracker.tsx` from the raw-Tailwind debt list by moving its rails onto owned `Card` recipes and replacing the custom progress bar chrome with the shared `Progress` primitive.
- Added `Documents/DocumentTemplatesManager.tsx` and `TimeTracker.tsx` to design-system ownership targeting so future shell drift is blocked directly.
- Removed `IssueDetailSheet.tsx` from the raw-Tailwind debt list by moving its loading, header, and body shells onto owned `Card` recipes and `Sheet layout="panel"` composition instead of local padding and border classes.
- Removed `VersionHistory.tsx` from the raw-Tailwind and interactive-state debt lists by moving the compare panel, selected version rows, and diff panes onto owned `Card` recipes and replacing the restore-button chrome with owned `Button` variants.
- Added `IssueDetailSheet.tsx` and `VersionHistory.tsx` to design-system ownership targeting so future detail/history shell drift is blocked directly.
- Removed `CommandPalette.tsx` from the raw-Tailwind debt list by moving command item/group/empty/list viewport styling into owned `ui/Command` variants and replacing the footer shell with owned `Card` composition.
- Removed `KeyboardShortcutsHelp.tsx` from the raw-Tailwind debt list by replacing feature-local CVAs with owned `KeyBadge`, `SearchField`, `Card` recipes, and `Typography` variants for the shortcuts search and list shells.
- Added `CommandPalette.tsx` and kept `KeyboardShortcutsHelp.tsx` under design-system ownership targeting so future command/help surface drift is blocked directly.
- Removed `ImportExportModal.tsx` from the raw-Tailwind debt list by replacing its hand-built import/export mode rail with owned `SegmentedControl` fill-width variants instead of local card and flex shells.
- Added `ImportExportModal.tsx` to design-system ownership targeting so future import/export shell drift is blocked directly.
- Removed `RoadmapView.tsx` from the raw-Tailwind and interactive-state debt lists by moving its roadmap rows, timeline bars, resize handles, and month-header shells behind owned `Card` and `Button` recipe/chrome variants instead of local hover and shell classes.
- Removed `layout/PageHeader.tsx` from the raw-Tailwind debt list by moving its responsive layout, indicator chrome, and heading/description typography into owned `Flex`, `Card`, and `Typography` variants instead of local utility stacks.
- Added `layout/PageHeader.tsx` to design-system ownership targeting so future shared header drift is blocked directly.
- Removed `layout/PageLayout.tsx` from the raw-Tailwind debt list by moving its page shell spacing, width, and full-height behavior behind owned `cva` variants instead of inline utility stacks on the rendered layout container.
- Added `layout/PageLayout.tsx` to design-system ownership targeting so future top-level page shell drift is blocked directly.
- Removed `Documents/DocumentSidebar.tsx` from the raw-Tailwind debt list by moving its sidebar shell and metadata row chrome onto owned `Card` recipes, replacing the raw close button shell with `IconButton`, and dropping the remaining feature-level tracking/padding utility stacks from the document navigation surface.
- Added `Documents/DocumentSidebar.tsx` to design-system ownership targeting so future document-sidebar shell drift is blocked directly.
- Removed `Documents/DocumentComments.tsx` from the interactive-state debt list by moving its comment card and composer shells onto owned `Card` recipes and replacing the ad hoc author/timestamp row with shared `Metadata` primitives instead of feature-level layout/text treatment.
- Added `Documents/DocumentComments.tsx` to design-system ownership targeting so future document-comment shell drift is blocked directly.
- Removed `Documents/DocumentTree.tsx` from the raw-Tailwind and interactive-state debt lists by moving document row states onto owned `Card` recipes, dropping inline row hover/selection shell styling, and replacing the child-loading shell with owned `Card` composition instead of feature-level spacing and hover stacks.
- Added `Documents/DocumentTree.tsx` to design-system ownership targeting so future document-tree shell drift is blocked directly.
- Removed `ClientPortal/PortalProjectView.tsx` from the raw-Tailwind debt list by replacing its inline content spacing stack with owned `Stack` composition and moving the project link styling onto the shared `Button` link variant instead of feature-level text utilities.
- Added `ClientPortal/PortalProjectView.tsx` to design-system ownership targeting so future client-portal card drift is blocked directly.
- Removed `ClientPortal/PortalTimeline.tsx` from the raw-Tailwind debt list by replacing its inline content spacing stack with owned `Stack` composition and moving timeline entry shells onto an owned `Card` recipe instead of feature-level border/padding classes.
- Added `ClientPortal/PortalTimeline.tsx` to design-system ownership targeting so future client-portal timeline drift is blocked directly.
- Removed `CommentRenderer.tsx` from the raw-Tailwind and interactive-state debt lists by moving inline code, markdown link, and mention chrome onto owned `Typography`, `Button`, and `Badge` primitives instead of keeping those presentation contracts in feature code.
- Added `CommentRenderer.tsx` to design-system ownership targeting so future comment-renderer shell drift is blocked directly.
- Removed `Invoices/InvoiceEditor.tsx` from the raw-Tailwind debt list by moving its line-item row shell onto an owned `Card` recipe and replacing the feature-level spacing/border grid shell with `Stack`, responsive `Grid`, and `Flex` composition.
- Removed `Invoices/InvoicePdfTemplate.tsx` from the raw-Tailwind debt list by moving the preview and totals shells onto owned `Card` recipes and replacing its feature-level invoice line-item grid with the shared `Table` primitive.
- Added `Invoices/InvoiceEditor.tsx` and `Invoices/InvoicePdfTemplate.tsx` to design-system ownership targeting so future invoice-surface drift is blocked directly.
- Removed `IssuesCalendarView.tsx` from the raw-Tailwind and interactive-state debt lists by moving its calendar day shells onto owned `Card` recipes, replacing the quick-add reveal behavior with owned `IconButton` APIs, and pushing issue row chrome into owned `Button` chrome variants.
- Added `IssuesCalendarView.tsx` to design-system ownership targeting so future calendar-surface drift is blocked directly.
- Removed `KanbanBoard.tsx` from the raw-Tailwind debt list by moving its loading rail, loading column shells, and swimlane wrapper chrome onto owned `Card` recipes instead of feature-level border/padding/snap shells.
- Removed `Sprints/SprintManager.tsx` from live raw-Tailwind debt by replacing its hand-built progress bar with the shared `Progress` primitive, moving preset-tile button chrome onto owned `Button` variants, and replacing responsive flex utility fallbacks with `Flex` props.
- Removed the stale `SprintManager.tsx` raw-Tailwind allowlist entry; the old root-level path was no longer the real source of sprint-surface debt.
- Removed `Sprints/SprintProgressBar.tsx` from the raw-Tailwind debt list by replacing its hand-built completion bar with the shared `Progress` primitive.
- Removed `Sprints/SprintWorkload.tsx` from the raw-Tailwind and interactive-state debt lists by moving its popover shell and workload rows behind owned `Popover`, `Card`, `Progress`, and `Avatar` primitives instead of local padding, hover, and progress-bar classes.
- Added `KanbanBoard.tsx` to design-system ownership targeting so future board-surface drift is blocked directly.
- Added `Sprints/SprintManager.tsx` to design-system ownership targeting so future sprint-manager shell drift is blocked directly.
- Added `Sprints/SprintProgressBar.tsx` and `Sprints/SprintWorkload.tsx` to design-system ownership targeting so future sprint-support shell drift is blocked directly.
- Removed the broad `Sprint` interactive allowlist entry from `check-interactive-tw.js`; sprint interactive debt is now explicit instead of directory-wide.
- Tightened `check-raw-tailwind.js` so it only scans real JSX `className=` attributes, avoiding false positives on `className?:` prop declarations while keeping the rule fully blocking.
- Removed the broad `IssueDetail/` interactive allowlist entry from `check-interactive-tw.js` by moving inline property editing onto owned `SelectTrigger` and `Input` variants instead of feature-level hover/focus shell classes.
- Added `IssueDetail/InlinePropertyEdit.tsx` and `IssueDetail/IssueMetadataSection.tsx` to design-system ownership targeting so future issue-detail property drift is blocked directly.
- Removed the broad `Plate/` interactive allowlist entry from `check-interactive-tw.js` and replaced it with explicit debt for `Plate/DragHandle.tsx`, which is now the only remaining unresolved Plate interactive surface.
- Removed `Plate/FloatingToolbar.tsx`, `Plate/ColorPickerButton.tsx`, `Plate/MentionInputElement.tsx`, and `Plate/MentionElement.tsx` from live interactive debt by moving toolbar, mention-row, and color-swatch hover/focus behavior onto owned `Button` chrome variants instead of feature-level classes.
- Added `Plate/ColorPickerButton.tsx`, `Plate/MentionElement.tsx`, `Plate/MentionInputElement.tsx`, and `Plate/FloatingToolbar.tsx` to design-system ownership targeting so future editor-surface drift is blocked directly.
- Tightened `check-interactive-tw.js` so it scans real JSX `className=` spans instead of arbitrary lines, avoiding false positives from editor type annotations like `focus` fields while keeping the rule blocking on actual Tailwind variants.
- Removed the broad `ImportExport/` interactive allowlist entry from `check-interactive-tw.js` by moving `ExportPanel.tsx` format selection onto owned `Card` option-tile recipes instead of feature-level hover and selected-state classes.
- Added `ImportExport/ExportPanel.tsx` to design-system ownership targeting so future export-surface drift is blocked directly.
- Removed the last explicit `Plate/DragHandle.tsx` interactive debt entry from `check-interactive-tw.js` by moving the drag trigger onto an owned `IconButton` variant and using `DropdownMenuItem variant="danger"` instead of feature-level active/focus classes.
- Added `Plate/DragHandle.tsx` to design-system ownership targeting so future editor drag-handle drift is blocked directly.
- Removed the broad `src/components/ImportExport/` raw-Tailwind escape hatch by replacing the remaining inline-styled requirement token in `ImportPanel.tsx` with owned `Typography inlineCode` and moving `ExportPanel.tsx` export guidance onto the shared `Alert` primitive instead of a local branded shell.
- Removed the broad `src/components/Templates/` raw-Tailwind escape hatch by moving `TemplateForm.tsx` template-editing chrome onto an owned textarea `variant="code"` and replacing its raw `pt-4` footer spacing with non-blocked layout spacing.
- Added `Templates/TemplateCard.tsx` and `Templates/TemplateForm.tsx` to design-system ownership targeting so future template-surface drift is blocked directly.
- Removed the broad `src/components/Fields/` raw-Tailwind escape hatch by moving the custom-field key token in `CustomFieldCard.tsx` onto owned `Typography inlineCode`, switching the destructive action onto owned `Button` danger chrome, and moving the field-key input onto an owned input `variant="code"`.
- Added `Fields/CustomFieldCard.tsx` and `Fields/CustomFieldForm.tsx` to design-system ownership targeting so future custom-field surface drift is blocked directly.
- Removed the broad `src/components/Automation/` raw-Tailwind escape hatch by moving `AutomationRuleCard.tsx` action controls onto owned `IconButton` sizing/chrome instead of raw size classes and validating the remaining automation form/card surface code directly.
- Added `Automation/AutomationRuleCard.tsx` and `Automation/AutomationRuleForm.tsx` to design-system ownership targeting so future automation-surface drift is blocked directly.
- Removed the broad `src/components/IssueDetail/` raw-Tailwind escape hatch by moving the issue-detail layout shell onto an owned `Card` recipe, moving the editable title onto an owned `Input` variant, replacing the inline metadata row padding with an owned `Card` recipe, and moving the last responsive footer layout drift onto owned `Flex` breakpoint props.
- Added `IssueDetail/IssueDetailContent.tsx`, `IssueDetail/IssueDetailHeader.tsx`, `IssueDetail/IssueDetailLayout.tsx`, and `IssueDetail/IssueDetailSidebar.tsx` to design-system ownership targeting so future issue-detail surface drift is blocked directly.
- Removed the broad `src/components/Calendar/` raw-Tailwind escape hatch by moving `CreateEventModal.tsx` form layout drift onto owned `Card`, `Stack`, `SegmentedControl`, and `Button` APIs, moving `UnifiedCalendarView.tsx` onto an owned calendar switcher bar recipe, and narrowing the remaining raw exemption to the embedded `Calendar/shadcn-calendar/` implementation plus explicit debt in `EventDetailsModal.tsx` and `RoadmapView.tsx`.
- Removed the broad `Calendar/` interactive-state allowlist entry from `check-interactive-tw.js`, narrowing it to `Calendar/shadcn-calendar/` plus the remaining explicit `EventDetailsModal.tsx` debt.
- Added `Calendar/CreateEventModal.tsx` and `Calendar/UnifiedCalendarView.tsx` to design-system ownership targeting so future top-level calendar surface drift is blocked directly.
- Removed the broad `src/components/Kanban/` raw-Tailwind escape hatch by moving `BoardToolbar.tsx` spacing and responsive layout drift onto owned `Card`, `Flex`, and `Button` APIs and narrowing the remaining raw debt to explicit files in `KanbanColumn.tsx` and `SwimlanRow.tsx`.
- Removed the broad `src/components/Sidebar/` raw and interactive escape hatches. `SidebarTeamItem.tsx` now uses owned `Card`, `FlexItem`, `IconButton`, and `Icon` composition, and the remaining sidebar navigation surface is under direct ownership targeting instead of folder-wide validator exemptions.
- Removed `Dashboard.tsx` from the explicit raw-Tailwind debt list by moving responsive column spans onto an owned `GridItem` primitive and replacing the remaining dashboard overview label/layout drift with owned `Grid`, `Stack`, `Flex`, and `Typography` APIs.
- Removed `PlateEditor.tsx` from the explicit raw-Tailwind debt list by moving the editor canvas shell onto owned `PlateRichTextContent` variants and replacing the remaining raw `flex-1` layout drift with an owned `Flex flex="1"` API.
- Removed `CreateProjectFromTemplate.tsx` from the explicit raw-Tailwind debt list by moving its responsive footer layout onto owned `Flex`, `FlexItem`, and `Button` APIs instead of inline `sm:flex-*` utility drift.
- Removed `UserProfile.tsx` from the explicit raw-Tailwind debt list by dropping the unnecessary dialog-level utility stack and relying on the existing `Dialog` and `Card` composition directly.
- Removed `Kanban/KanbanColumn.tsx` from the explicit raw-Tailwind debt list by moving the column shell, header, and body onto owned `Card` recipes and replacing the custom empty-column shell with the shared `EmptyState` primitive.
- Removed `Kanban/SwimlanRow.tsx` from the explicit raw-Tailwind debt list by moving the swimlane header onto owned `Button` chrome and the lane-content wrapper onto an owned `Card` recipe instead of inline spacing/layout drift.
- Removed `Calendar/EventDetailsModal.tsx` from the explicit raw-Tailwind debt list by moving section wrappers and attendance rows onto owned `Card` recipes, replacing the organizer shell with `Avatar`, dropping the custom select-trigger override, and relying on owned `Dialog`, `Button`, and `Icon` composition instead of modal-local chrome.
- Removed `Calendar/RoadmapView.tsx` from the explicit raw-Tailwind debt list by moving the roadmap header, grid header cells, row shells, and timeline bars onto owned `Card`, `SegmentedControl`, `IconButton`, and `EmptyState` primitives instead of feature-level border, padding, and control chrome.
- Explicit raw-debt in product surfaces is now cleared. The remaining intentional raw-Tailwind island is `Calendar/shadcn-calendar/`, which stays isolated unless we choose to absorb that embedded implementation into owned primitives.
- Removed the dead `src/components/Editor/` raw-Tailwind allowlist entry.
- Removed the broad `src/components/Onboarding/` raw-Tailwind escape hatch and the broad `Onboarding/` interactive-state allowlist entry.
- Replaced those onboarding-wide escapes with explicit file-level migration debt for:
  - `Onboarding/FeatureHighlights.tsx`
  - `Onboarding/InvitedWelcome.tsx`
  - `Onboarding/LeadOnboarding.tsx`
  - `Onboarding/MemberOnboarding.tsx`
  - `Onboarding/OnboardingChecklist.tsx`
  - `Onboarding/ProjectWizard.tsx`
  - `Onboarding/RoleSelector.tsx`
  - `Onboarding/SampleProjectModal.tsx`
- Removed `Onboarding/FeatureHighlights.tsx`, `Onboarding/InvitedWelcome.tsx`, and `Onboarding/RoleSelector.tsx` from the raw-Tailwind and interactive-state migration debt lists by moving their feature cards, invite hero/panel shells, and role-selection surfaces onto owned `Card`, `Button`, `Stack`, and `Typography` primitives instead of local shell and hover stacks.
- Added `Onboarding/FeatureHighlights.tsx`, `Onboarding/InvitedWelcome.tsx`, and `Onboarding/RoleSelector.tsx` to design-system ownership targeting so future onboarding surface drift in those entry points is blocked directly.
- Removed `Onboarding/LeadOnboarding.tsx`, `Onboarding/ProjectWizard.tsx`, and `Onboarding/MemberOnboarding.tsx` from the raw-Tailwind and interactive-state migration debt lists by moving their hero shells, action tiles, step progress, board selection, and onboarding feature cards onto owned `Card`, `Progress`, `Button`, `Badge`, and `Typography` primitives instead of local shell and state stacks.
- Added `Onboarding/LeadOnboarding.tsx`, `Onboarding/ProjectWizard.tsx`, and `Onboarding/MemberOnboarding.tsx` to design-system ownership targeting so future onboarding flow drift in those main entry flows is blocked directly.
- Removed `Onboarding/OnboardingChecklist.tsx` and `Onboarding/SampleProjectModal.tsx` from the raw-Tailwind and interactive-state migration debt lists by moving the checklist header, item, and completion shells onto owned `Card` recipes plus `IconButton` and `Progress`, and by replacing the sample-project modal’s last raw spacing/flex drift with owned `Stack` and `FlexItem` composition.
- Added `Onboarding/SampleProjectModal.tsx` to design-system ownership targeting so the remaining onboarding modal surface is validated directly alongside the rest of the flow.
- Explicit onboarding validator debt is now cleared. Tighten the next intentional raw/interactivity island instead of leaving any new onboarding exceptions.
- Removed the broad `src/components/Auth/` raw-Tailwind escape hatch and the broad `Auth/` interactive-state allowlist entry.
- Migrated the surfaced auth debt onto owned primitives: `AuthLink.tsx` now uses owned `Button` variants, `GoogleAuthButton.tsx` dropped local size/spacing chrome, `PasswordStrengthIndicator.tsx` now uses owned `Card` segment recipes, verification/reset forms now use owned `Flex`, `Stack`, and `Input` `otpCode` variants, and `AuthPageLayout.tsx` now owns its major hero/form surfaces through shared `Card` recipes instead of feature-local shell stacks.
- Removed `Auth/AuthPageLayout.tsx` from the last explicit raw-Tailwind debt entry by moving its outer spacing onto owned `Card` padding and replacing its last responsive gap drift with owned `Grid` gap props.
- Explicit auth raw-debt is now cleared. The next intentional validator island is the embedded `Calendar/shadcn-calendar/` implementation.
- Removed the broad `src/components/Calendar/shadcn-calendar/` raw-Tailwind escape hatch and replaced it with explicit file-level migration debt for the currently embedded calendar `.tsx` surfaces, so new files in that implementation no longer inherit a free raw-Tailwind bypass.
- Removed the broad `Calendar/shadcn-calendar/` interactive-state allowlist entry and replaced it with the five current interactive-debt files: `calendar-body-day-content.tsx`, `calendar-body-day-events.tsx`, `calendar-body-month.tsx`, `calendar-header-actions-mode.tsx`, and `calendar-header-date-chevrons.tsx`.
- Removed `calendar-header-actions-mode.tsx` from embedded calendar raw/interactivity debt by moving the view-mode rail onto owned `SegmentedControl` variants instead of inline toggle-group chrome.
- Removed `calendar-header-date-chevrons.tsx` from embedded calendar raw/interactivity debt by moving the Today/prev/next controls and date label onto owned `Button` chrome and `Typography` variants.
- Added both embedded calendar header entry points to design-system ownership targeting so future header-control drift is blocked directly.
- Removed `calendar-body-month.tsx` from embedded calendar raw/interactivity debt by moving weekday cells, day cells, day badges, and overflow actions onto owned `Card`, `Badge`, `Button`, `Grid`, and `Flex` primitives instead of inline month-grid chrome.
- Removed `calendar-body-day-events.tsx` from embedded calendar raw/interactivity debt by moving the empty state and event rows onto owned `EmptyState`, `Card`, `Button`, and layout primitives.
- Removed `calendar-body-day-content.tsx` from embedded calendar raw/interactivity debt by moving hour-row chrome onto an owned `Card` recipe instead of local hover/border shell classes.
- Added those three embedded calendar body entry points to design-system ownership targeting so future body-surface drift is blocked directly.
- Removed `calendar-body-header.tsx` from embedded calendar raw debt by moving the sticky day header onto owned `Card`, `Badge`, `Typography`, and `Flex` primitives instead of inline date-chip chrome.
- Removed `calendar-body-day.tsx` from embedded calendar raw debt by moving the day-view shell, content rail, and sidebar shell onto owned `Card` recipes and layout primitives instead of inline split-pane chrome.
- Removed `calendar-body-week.tsx` from embedded calendar raw debt by moving the week-view shell and day-column wrappers onto owned `Card` recipes and `FlexItem` responsive flex props instead of inline width/flex/border shells.
- Added those three embedded calendar layout entry points to design-system ownership targeting so future day/week shell drift is blocked directly.
- Removed `calendar-event.tsx` from embedded calendar raw debt by moving the shared day/month event shells and content layout onto owned `Card` recipe variants instead of inline event-block chrome.
- Removed `calendar-header-actions.tsx` from embedded calendar raw debt by moving the action-row layout onto owned `Flex` props instead of inline flex/gap/justify classes.
- Removed `calendar-header-date.tsx` from embedded calendar raw debt by moving the heading typography and responsive gap behavior onto owned `Typography` and `Flex` APIs instead of inline text and gap drift.
- Added those three shared embedded calendar primitives to design-system ownership targeting so future event/header drift is blocked directly.
- Removed `calendar-header.tsx` from embedded calendar raw debt by moving the outer header shell onto an owned `Card` recipe and responsive `Flex` props instead of inline border, padding, and breakpoint layout classes.
- Removed the stale `calendar.tsx` raw-debt entry now that it carries no feature-level Tailwind and can sit under direct ownership targeting without an escape hatch.
- Added `calendar-header.tsx` and `calendar.tsx` to design-system ownership targeting so future embedded-calendar container drift is blocked directly.
- Removed `calendar-header-actions-add.tsx` from embedded calendar raw debt by moving the add-event control onto owned `Button` chrome and size variants instead of feature-level brand, radius, and responsive size classes.
- Removed `calendar-header-date-badge.tsx` from embedded calendar raw debt by moving the month-event count shell onto an owned `Badge` variant instead of inline border, padding, and typography classes.
- Removed `calendar-header-date-icon.tsx` from embedded calendar raw debt by moving the calendar date widget onto owned `Card` recipes and `Typography` variants instead of feature-level border, brand band, and date text chrome.
- Added those three embedded calendar header subcomponents to design-system ownership targeting so future micro-shell drift is blocked directly.
- Removed the stale `calendar-body.tsx` and `calendar-body-day-calendar.tsx` raw-debt entries now that both files carry no feature-level Tailwind and can sit under direct ownership targeting without an escape hatch.
- Removed `calendar-body-margin-day-margin.tsx` from embedded calendar raw debt by moving the sticky hour rail and spacer onto owned `Card` recipes and the time labels onto an owned `Typography` variant instead of inline background, border, and text chrome.
- Added those three embedded calendar day-body files to design-system ownership targeting so future day-view wrapper drift is blocked directly.
- Removed the stale `calendar-provider.tsx`, `calendar-context.tsx`, and `calendar-mode-icon-map.tsx` raw-debt entries now that they contain no feature-level Tailwind and never needed an embedded-calendar escape hatch.
- Removed the stale `calendar-provider.tsx` test-coverage baseline entry after clearing the last false-positive debt marker around that implementation file.
- Embedded calendar raw-debt is now zero. Any future drift in that implementation will have to justify itself directly instead of inheriting a blanket exception.
- Removed the broad `src/components/Plate/` raw-Tailwind escape hatch and replaced it with explicit file-level debt for the remaining editor surfaces that still carry real raw classes: `Collaborators.tsx`, `ColorPickerButton.tsx`, `DragHandle.tsx`, `FloatingToolbar.tsx`, `MentionElement.tsx`, `MentionInputElement.tsx`, and `SlashMenu.tsx`.
- New Plate files no longer inherit a blanket raw-Tailwind pass; only the current known editor debt remains exempt while it is burned down intentionally.
- Removed `Plate/SlashMenu.tsx` from explicit raw debt by moving its list viewport, group heading, item-row, and icon/label layout chrome onto owned `ui/Command`, `Icon`, `Flex`, and `Typography` variants instead of feature-level command-menu classes.
- Added `Plate/SlashMenu.tsx` to design-system ownership targeting so future slash-menu chrome drift is blocked directly.
- Removed `Plate/Collaborators.tsx` from explicit raw debt by moving collaborator stack overlap, overflow count chrome, avatar presence treatment, and online indicators onto owned `Avatar` and `AvatarGroup` APIs instead of feature-level overlap, border, and badge classes.
- Added `Plate/Collaborators.tsx` to design-system ownership targeting so future collaborator-stack chrome drift is blocked directly.
- Removed `Plate/FloatingToolbar.tsx` from explicit raw debt by moving its toolbar rail layout, separator sizing, and icon sizing onto owned `Popover`, `Separator`, and `Icon` APIs instead of feature-level flex, spacing, and SVG classes.
- Added `Plate/FloatingToolbar.tsx` to design-system ownership targeting so future floating-toolbar chrome drift is blocked directly.
- Removed `Plate/MentionInputElement.tsx` from explicit raw debt by moving the inline mention-input token chrome and dropdown positioning contract onto owned `Badge` and `Card` recipes instead of feature-level inline background, offset, and width classes.
- Added `Plate/MentionInputElement.tsx` to design-system ownership targeting so future mention-input chrome drift is blocked directly.
- Removed `Plate/ColorPickerButton.tsx` from explicit raw debt by moving the color-picker popover shell behind an owned `Popover` recipe and extracting swatch selection/empty-state chrome into an owned `ColorSwatchButton` primitive instead of feature-level spacing, ring, dashed-border, and icon-size classes.
- Added `Plate/ColorPickerButton.tsx` to design-system ownership targeting so future color-picker chrome drift is blocked directly.
- Removed `Plate/MentionElement.tsx` from explicit raw debt by moving its mention-chip layout contract onto the owned `Badge` mention variant instead of keeping gap, baseline, and cursor chrome in feature code.
- Added `Plate/MentionElement.tsx` to design-system ownership targeting so future mention-chip chrome drift is blocked directly.
- Removed `Plate/DragHandle.tsx` from explicit raw debt by moving its menu-item icon spacing onto owned `DropdownMenuItem` APIs and replacing the remaining handle-rail positioning and visibility classes with owned `Flex`, `Icon`, and state-driven composition instead of feature-level Tailwind.
- Plate explicit raw-debt is now zero. Any further editor surface drift has to justify itself directly instead of inheriting a leftover Plate exemption.
- Removed `BulkOperationsBar.tsx` from the last explicit raw-Tailwind allowlist entry by moving the bulk-action content shell and divider/padding rail onto owned `Card` recipes, replacing date field fill behavior with `FlexItem`, and dropping redundant select-width and text-action overrides in favor of owned `Select` and `Button` APIs.
- Explicit product-surface raw debt is now zero. The only remaining raw-Tailwind directory allowance is `src/components/ui/`, which is intentional.
- Removed stale interactive-state allowlist entries for `PlateEditor.tsx`, `CreateProjectFromTemplate.tsx`, `BulkOperationsBar.tsx`, and `Calendar/EventDetailsModal.tsx`; those files no longer carry feature-level hover/focus Tailwind.
- Removed `CustomFieldValues.tsx` and `ErrorBoundary.tsx` from the interactive-state allowlist by moving their remaining link/detail affordances onto owned `Button`/`Typography` composition instead of raw `hover:` classes.
- Replaced the broad `Landing/` interactive escape hatch with explicit file-level debt for the actual remaining landing surfaces: `FeaturesSection.tsx`, `FinalCTASection.tsx`, `Footer.tsx`, `HeroSection.tsx`, `LogoBar.tsx`, `NavHeader.tsx`, `PricingSection.tsx`, and `WhyChooseSection.tsx`.
- Removed `Landing/NavHeader.tsx`, `Landing/FeaturesSection.tsx`, and `Landing/PricingSection.tsx` from the interactive-state allowlist by moving their nav pills, CTA buttons, feature cards, and pricing cards onto owned `Button` and `Card` variants instead of keeping hover and selection chrome in landing page code.
- Removed `Landing/HeroSection.tsx`, `Landing/WhyChooseSection.tsx`, and `Landing/FinalCTASection.tsx` from the interactive-state allowlist by moving the hero badge, proof cards, and CTA links onto owned `Badge`, `Card`, and `Button` variants instead of leaving hover/link state in landing feature files.
- Removed `Landing/Footer.tsx` and `Landing/LogoBar.tsx` from the interactive-state allowlist by moving footer text/social links onto owned `Button` chrome and replacing the decorative logo-chip hover stack with an owned `Card` recipe.
- Removed `FuzzySearch/AssigneeSearchDropdown.example.tsx` from the interactive-state allowlist by moving its remaining clear action onto owned `IconButton` danger chrome instead of leaving a raw `hover:text-*` example behind.
- Hardened `check-interactive-tw.js` after the allowlist hit zero: removed the dead migration list and zero-allowed reporting so interactive Tailwind now behaves as direct enforcement instead of a migration-mode validator.
- Hardened the raw-Tailwind policy after explicit raw debt hit zero: replaced the old `RAW_TAILWIND_ALLOWED_*` migration framing with an explicit owned-boundary policy (`src/components/ui/`) plus non-product extensions, and wired both `check-raw-tailwind.js` and `check-surface-shells.js` to that direct boundary check.
- Tightened `check-colors.js` after the raw/interactivity burn-down: removed the stale broad `Landing/` raw-color escape hatch and the stale `AIChat.tsx` / `PumbleIntegration.tsx` raw-color exemptions, moved `AppSplashScreen.tsx` off `bg-white/5` onto a semantic token, and narrowed landing hardcoded-color debt down to the single remaining logo file that still owns a branded drop-shadow treatment.
- Tightened `check-colors.js` again by removing stale hardcoded-color exemptions for `Landing/Icons.tsx`, `LabelsManager.tsx`, `Settings/DevToolsTab.tsx`, and `AI/config.ts`, and moved `LabelsManager.tsx` onto the shared `COLORS.DEFAULT_LABEL` runtime constant so that product-surface color debt keeps shrinking instead of hiding in per-file exceptions.
- Removed `Auth/GoogleAuthButton.tsx` from the hardcoded-color allowlist by moving the Google mark off inline hex fills and onto explicit provider color tokens in `src/index.css`, so product-surface color debt is no longer hiding in auth components either.
- Cleared the last two standing Biome complexity warnings that were still polluting the validator/check path by extracting the records/filter rendering out of `Admin/HourComplianceDashboard.tsx` and splitting `Onboarding/LeadOnboarding.tsx` into step components instead of keeping all onboarding branches in one function.
- The embedded calendar island is now narrowed from directory-wide escape hatches to explicit file debt. Burn that list down surface by surface instead of allowing new embedded drift by default.

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
