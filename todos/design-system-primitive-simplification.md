# Design System Primitive Simplification

> **Priority:** P1
> **Status:** Open
> **Last Updated:** 2026-03-28

## Principles

1. **Components own their rendering.** Text props are `string`, not `ReactNode`. The component decides how to render them via `<Typography>`.
2. **One public API per component.** No subcomponent exports. If the wrapper can't handle a use case, extend the wrapper — don't re-expose primitives.
3. **No raw HTML elements.** No `<span>`, `<strong>`, `<em>`, `<p>`, `<h1>`–`<h6>` in production code. Use `Typography`, `Flex`, etc.
4. **Variants are tight.** If a variant axis has 60+ options, it's a smell. Shared primitives are building blocks, not escape hatches.

---

## 1. Encapsulate shadcn Components

Every shadcn compound component gets one wrapper. Subcomponent exports are deleted. Feature code imports only the wrapper.

### SelectField (replaces 7 Select subcomponent exports)
- **Status:** Done (2026-03-28)
- **Files to update:** 36
- **API:**
  ```tsx
  <SelectField
    value={status}
    onChange={setStatus}
    placeholder="Status"
    options={[
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
    ]}
  />
  ```
- **Supports:** `disabled`, `size`, grouped options via `groups` prop, `data-testid`
- **Delete:** `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`, `SelectGroup`, `SelectLabel`, `SelectSeparator` exports from `ui/Select.tsx`
- **End state:** 0 feature files importing Select subcomponents
- **Landed:** Wrapper-only `Select` API, grouped/custom-render support, empty-string option handling, migrated feature call sites, updated Storybook, and test-harness consolidation onto one shared mock.

### PopoverField (replaces 8 Popover subcomponent exports)
- **Status:** Done (2026-03-28)
- **Files to update:** 14
- **API:**
  ```tsx
  <PopoverField trigger={<Button>Pick</Button>}>
    {(close) => <PickerContent onDone={close} />}
  </PopoverField>
  ```
- **Supports:** `align`, `side`, `sideOffset`, controlled `open`/`onOpenChange`, `data-testid`
- **Delete:** `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`, `PopoverBody`, `PopoverHeader`, `PopoverFooter`, `PopoverTitle`, `PopoverDescription` exports
- **End state:** 0 feature files importing Popover subcomponents
- **Landed:** Wrapper-only `Popover` API with trigger tooltip support, anchored overlays, wrapper-owned header/body/footer chrome slots, migrated production call sites, refreshed Storybook, and shared test mocking for the new contract.

### CommandMenu (replaces 7 Command subcomponent exports)
- **Status:** Done (2026-03-28)
- **Files to update:** 8
- **API:**
  ```tsx
  <CommandMenu
    items={items}
    onSelect={handleSelect}
    emptyMessage="No results"
    searchPlaceholder="Search..."
  />
  ```
- **Supports:** grouped items, custom item rendering via `renderItem`, loading state, keyboard navigation
- **Delete:** `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandSeparator`, `CommandShortcut` exports (keep `CommandDialog` as it's already a good wrapper)
- **End state:** 0 feature files importing Command subcomponents
- **Landed:** Wrapper-only `Command` API with built-in search/header/footer slots, structured group/content sections, wrapper-owned empty/loading states, migrated production consumers, direct wrapper tests, and shared test mocking for the new contract.

### Already done (reference pattern)
- **Dialog** — single `Dialog` component, 0 leakage, enforces `title`/`description`
- **Sheet** — single `Sheet` component, 0 leakage
- **AlertDialog** — single `AlertDialog` + `ConfirmDialog`, 0 leakage

---

## 2. String Props, Not ReactNode

Components own text rendering. Callers pass strings.

### OverviewBand
- **Status:** Done (2026-03-28)
- **Change:** `metrics.value: ReactNode` → `string | number`, `metrics.detail: ReactNode` → `string`
- **Impact:** Eliminates `<span data-testid>` wrappers in TimeTrackingPage
- **Landed:** Wrapper-owned metric text rendering plus `testId` support on metric config, with time-tracking callers migrated off inline span wrappers

### PageHeader
- **Status:** Done (2026-03-28)
- **Change:** `description: ReactNode` → `string`, `eyebrow: ReactNode` → `string`
- **Impact:** Eliminates `<span data-testid>` in AnalyticsDashboard
- **Landed:** Wrapper-owned description rendering plus `descriptionTestId`, with analytics callers migrated off inline span wrappers

### CardHeader
- **Status:** Done (2026-03-28)
- **Change:** `title: ReactNode` → `string`, `description: ReactNode` → `string`
- **Add:** `badge?: ReactNode` slot prop so EntityCard stops wrapping title in `<Flex>`
- **Landed:** Structured header copy is string-only and `badge` is wrapper-owned, so EntityCard no longer passes layout JSX through `title`

### SectionIntro
- **Status:** Done (2026-03-28)
- **Change:** `eyebrow: ReactNode` → `string`, `title: ReactNode` → `string`, `description: ReactNode` → `string`
- **Landed:** Public API is string-only and matches existing production usage

---

## 3. Ban Raw HTML Elements

No `<span>`, `<strong>`, `<em>`, `<p>`, `<h1>`–`<h6>` in `src/` production files.

- **Status:** Done (2026-03-28)
- **Landed:** The standards validator now bans raw `<span>` in production code outside `ui/`, tests, and the markdown renderer exception; repeated responsive and screen-reader patterns were migrated onto `ResponsiveText` and a new neutral `Inline` primitive in `src/components/ui/Inline.tsx`; the remaining production violations were removed across shared shells, navigation, meeting surfaces, and editor controls.

---

## 4. Shrink Oversized Variant Surfaces

### Card.tsx
- **Status:** Done (2026-03-28)
- **Current:** `recipe` axis was at 199 options
- **Landed:** The oversized `cardRecipeVariants` CVA axis was removed from `Card.tsx` and extracted into the typed helper map in `src/components/ui/cardSurfaceClassNames.ts`. The shared primitive now owns only the semantic base surface while feature surfaces resolve through helper lookups, direct helper consumers/tests were updated, and the validator baseline no longer treats `Card` as an oversized primitive axis.
- **End state:** Keep future card chrome additions in helper ownership rather than reintroducing a large primitive-owned variant axis.

### Button.tsx
- **Status:** Done (2026-03-28)
- **Current:** `chrome` (39), `chromeSize` (37), `variant` (18), `size` (14)
- **Landed:** `Button` is now a shared semantic core with 9 variants and 5 sizes, `chrome` / `chromeSize` are deleted, production feature-owned button surfaces now carry their own styling, and the validator baselines no longer treat `Button` as an oversized primitive.
- **End state:** `variant` < 10, `size` < 6. Collapse `chrome`/`chromeSize` into the variant system or move to feature-owned wrappers.

### Typography.tsx
- **Current:** `variant` (18), `color` (11)
- **Status:** Done. Shared wrappers now own the remaining responsive title scales (`PageTitleText`, `SectionTitleText`, `DocumentTitleText`) instead of pushing feature-specific text sizing back into the base variant axis.
- **End state:** Hold `variant` under 20 and keep new text treatments in wrapper components rather than widening the shared enum.

### Badge.tsx
- **Status:** Done (2026-03-28)
- **Current:** `variant` at 24
- **Landed:** `Badge` is now a semantic core with 10 public variants and 3 public sizes, while feature-specific badge surfaces like mention chips, alert counts, calendar day pills, roadmap markers, and project/header labels moved into UI-owned helper class builders instead of widening the primitive axis.
- **End state:** `variant` < 12. Split status/priority/type badges into feature-owned components if they carry domain semantics.

---

## 5. Raw Tailwind Ratchet

- **Current:** 66 violations across 56 files
- **Landed (2026-03-28):** `Admin/OrganizationSettings` no longer owns its form-field width classes directly. The name and numeric input widths now resolve through `src/components/ui/organizationSettingsSurfaceClassNames.ts`, with direct helper coverage locking the contract down. Earlier on the same day, `ActivityFeed` no longer owns its timeline rail, entry shell, icon sizing, issue-key link styling, or message/timestamp chrome directly. Those classes now resolve through `src/components/ui/activityFeedSurfaceClassNames.ts`, and the feed test no longer couples itself to raw Tailwind selectors thanks to a stable rail test id. Earlier on the same day, `Analytics/BarChart` no longer exposes raw background utility strings as a public API and no longer owns its bar-track / bar-fill chrome directly. It now takes a semantic `tone` prop, while the remaining fill/track surface classes resolve through `src/components/ui/barChartSurfaceClassNames.ts`. Earlier on the same day, `Documents/DocumentHeader` no longer owned its responsive action/title width shell or outer max-width wrapper directly. The repeated responsive width token now resolves through `src/components/ui/documentHeaderSurfaceClassNames.ts`, and the content shell now uses the shared `Container` width token instead of a feature-owned max-width class. Earlier on the same day, `Analytics/RecentActivity` moved its local timeline shell, rail, item padding, avatar layering, and metadata offset into `src/components/ui/analyticsRecentActivitySurfaceClassNames.ts`; `NotificationCenter` moved its popover panel body, header/footer chrome, footer action row, filter chip wrapper, trigger positioning, unread badge offset, empty-state inset, and grouped section shell into `src/components/ui/notificationCenterSurfaceClassNames.ts`; dashboard `RecentActivity` moved its timeline scroll shell, rail, item padding, avatar ring, min-width clamp, and issue-key badge fit class into `src/components/ui/dashboardRecentActivitySurfaceClassNames.ts`; `ProductShowcase` moved its remaining landing shell and showcase chrome utility strings into `src/components/ui/productShowcaseSurfaceClassNames.ts`; `calendar-body-month` moved its month-event list visibility and overflow spacing into `src/components/ui/calendarMonthSurfaceClassNames.ts`; `IssueCard` moved its remaining spacing/sizing chrome into `src/components/ui/issueCardSurfaceClassNames.ts`; and `GlobalSearch` moved its intro, empty-state, and icon-shell chrome into `src/components/ui/globalSearchSurfaceClassNames.ts`. The baseline was also ratcheted down to match other already-cleaned files (`SignInForm`, `SignUpForm`, `Dashboard`, `DocumentTree`, `MentionInput`, `ProjectSettings/GeneralSettings`, and `RoadmapView`).
- **End state:** 0 violations
- **Start with:** Auth/AppSplashScreen (2), Documents/DocumentSidebar (2), IssueDetailSheet (2)

---

## Exit Criteria

- [x] Every shadcn compound component has one wrapper. `Select`, `Popover`, and `Command` are done.
- [x] Text props are `string` across OverviewBand, PageHeader, CardHeader, SectionIntro.
- [x] 0 raw `<span>`/`<strong>`/`<em>`/`<p>`/`<h1>`–`<h6>` in production code outside ui/ and documented exceptions.
- [x] No variant axis above 20 options in shared primitives. `Badge` and `Card` are done.
- [ ] Raw Tailwind violations at 0.
