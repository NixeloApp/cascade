# Palette's Journal

## 2024-05-22 - Improving Tooltip Flexibility
**Learning:** The Base UI `Tooltip.Trigger` renders a `button` by default, which can lead to invalid HTML when nested inside other interactive elements like `label` (used in file inputs).
**Action:** Modified `SDSTooltip` to accept a `renderTrigger` prop, allowing the use of `div` or other elements as triggers when necessary. This pattern should be used whenever a tooltip is needed on an element that cannot contain a button.

## 2024-05-23 - Keeping Completed Items Focusable
**Learning:** Disabling buttons for "completed" steps removes them from the tab order, making them invisible to keyboard and screen reader users. Users can't perceive that a task was already completed.
**Action:** Instead of using the native `disabled` attribute, use `aria-disabled="true"` and a descriptive `aria-label` (e.g., "Complete profile, Completed"). Ensure visual styling matches the disabled state (e.g., `cursor: default`) while keeping the element interactive or at least focusable.

## 2026-01-14 - SDSIcon Accessibility on Links
**Learning:** When `SDSIcon` is used as a link (with `href`), the underlying `SDSPrimitiveButton` fails to pass standard HTML attributes (like `aria-label`) to the anchor tag.
**Action:** Use the `ariaLabel` (camelCase) prop on `SDSIcon`. This prop is explicitly handled to apply `aria-label` and `role="img"` to the inner icon element, ensuring accessible names are preserved even when the outer link wrapper drops attributes.

## 2026-01-15 - SDSIcon Nesting & Semantics
**Learning:** `SDSIcon` renders a `<button>` by default. When used inside another interactive element (like `SDSMenu` trigger) or as a non-interactive indicator (like "5 likes"), this creates invalid HTML (nested buttons) or misleading semantics.
**Action:** Always use `isIconOnly` prop on `SDSIcon` when:
1. It is nested inside another button/trigger.
2. It is purely decorative or informational (not clickable).

## 2026-01-24 - Icon-only SDSButtons must have ariaLabel
**Learning:** Developers use `text=""` on `SDSButton` to create icon-only buttons but often forget `ariaLabel`, leaving the button inaccessible.
**Action:** When using `SDSButton` with empty text for icon-only usage, always enforce `ariaLabel`. Ideally, prefer `SDSIconButton` which enforces `ariaLabel` via types.

## 2026-02-18 - Replacing Native Title with Tooltips
**Learning:** Native `title` attributes are problematic for accessibility (inconsistent screen reader support, no mobile support) and UX (delayed appearance, default styling).
**Action:** Replace `title` attributes on interactive elements with the `Tooltip` component. When doing so on icon-only buttons, ensure an explicit `aria-label` is added if the button relies on the `title` for its accessible name. Update tests to query by accessible name (`getByRole('button', { name: '...' })`) instead of `getByTitle`.

## 2026-02-05 - Fixing Nested Interactive Controls
**Learning:** Found a pattern where interactive elements (e.g., delete buttons) were nested inside a clickable container implemented as a `<button>`. This is invalid HTML and breaks screen reader navigation.
**Action:** When creating complex list items with multiple actions, use a `div` or `li` container. Wrap the main content area in a `Link` or `button`, and keep secondary actions as siblings, using absolute positioning or flexbox to maintain the visual layout.

## 2026-03-03 - Linking Input Errors
**Learning:** `Input` and `Textarea` components often render error text visually but fail to link it programmatically, leaving screen reader users unaware of the invalid state context.
**Action:** Use `React.useId` to generate stable IDs for error messages and explicitly link them via `aria-describedby` on the input element. Ensure to preserve and merge any existing `aria-describedby` values from props.

## 2026-03-04 - Accessible Reaction Controls
**Learning:** Reaction interfaces often use icon-only buttons (emoji + count) that lack accessible names, making them confusing for screen reader users (e.g., just hearing "Thumbs Up 3").
**Action:** Always provide an explicit `aria-label` that describes the action (e.g., "Add Thumbs Up reaction") or the current state (e.g., "Thumbs Up reaction, 3 votes"). Use `aria-pressed` to indicate if the current user has reacted. Wrap these controls in `Tooltip` components to provide visual confirmation of the action.

## 2026-05-24 - Context-Sensitive Actions Visibility
**Learning:** Hiding contextual actions until hover (`opacity-0 group-hover:opacity-100`) makes them effectively invisible to keyboard users. Users must blindly tab into invisible elements to discover them, which is a poor experience.
**Action:** Add `group-focus-within:opacity-100` to the action container. This ensures that when the user focuses on the parent row (or the main interactive element within it), the secondary actions become visible immediately, providing the same context-awareness as the hover state.

## 2024-05-22 - Accessible Description Association in Switch
**Learning:** The `Switch` component supported a `description` prop visually but failed to programmatically associate it with the input, leaving screen reader users without context.
**Action:** Implemented automatic ID generation and `aria-describedby` linkage for the `description` prop. Also updated `label` and `description` to accept `ReactNode` to allow for rich content (links, bold text) while maintaining accessible relationships. This pattern should be applied to other form controls that have built-in description props.

## 2026-02-13 - Contextual Alert Roles
**Learning:** The `Alert` component defaulted to `role="alert"` for all variants, causing non-critical messages (success, info) to interrupt screen readers aggressively. Additionally, `lucide-react` icons in this codebase include `aria-hidden="true"` by default, simplifying decorative icon handling.
**Action:** Use `role="alert"` only for high-severity alerts (error, warning). Use `role="status"` for informational updates (success, info, default). Rely on default accessibility of library icons but verify with tests.

## 2026-06-16 - Explicit Typing in Tests
**Learning:** When using empty arrays in TypeScript tests (e.g., `const ids = []`), TS infers `any[]`. This causes build failures when `noImplicitAny` is enabled in strict mode or CI pipelines.
**Action:** Always explicitly type empty arrays that will be populated later (e.g., `const ids: Id<"issues">[] = []`) to prevent implicit `any` errors and ensure type safety in test files.

## 2024-05-24 - Overlay Button for Clickable Cards
**Learning:** To make a complex card (like `IssueCard`) fully clickable while containing other interactive elements (checkbox, tooltip triggers), wrapping the content in a button is invalid HTML.
**Action:** Use a container `div` with `role="article"`. Place a sibling `<button>` with `absolute inset-0` and `z-0` (Overlay Button) to handle the main click action. Ensure other interactive elements in the card have `relative z-10` to remain clickable above the overlay.

## 2026-02-21 - Robust ID Generation
**Learning:** Generating IDs from labels (e.g., `label.toLowerCase().replace(...)`) causes duplicate IDs when the same label is used multiple times on a page (e.g., in a modal and on the page), breaking accessibility.
**Action:** Use `React.useId()` to generate unique, stable IDs for form inputs, error messages, and helper text. Use the generated ID as a fallback if no `id` prop is provided.

## 2026-02-23 - Accessible Checkbox Labels
**Learning:** `Checkbox` inputs often lack accessible names when used without a visible label in list items (e.g., in a Subtasks list). This forces screen reader users to rely on context or generic announcements.
**Action:** Always provide an `aria-label` to `Checkbox` components when a visible `label` prop is not used. The `aria-label` should describe the action (e.g., "Mark [Task Name] as complete") to provide clear context.

## 2026-03-05 - Robust aria-describedby Merging
**Learning:** When using `...props` to spread attributes onto an input, explicit props like `aria-describedby` can inadvertently override internal accessibility logic (e.g., error messages).
**Action:** Destructure `aria-describedby` from props and merge it with internal IDs (e.g., `[errorId, helperId, externalId].filter(Boolean).join(" ")`) to ensure all descriptions are preserved.

## 2026-03-15 - Typography as Label
**Learning:** `Typography` component did not support `htmlFor`, preventing its use as a semantic `<label>` element despite having a `variant="label"`.
**Action:** Updated `TypographyProps` to include `htmlFor`. When using `Typography` as a label for a form control, use `as="label"`, provide `htmlFor={id}`, and ensure the target control has the matching `id`.

## 2026-02-25 - IconButton Reveal Visibility
**Learning:** The `reveal` variant on `IconButton` used `opacity-0 group-hover:opacity-100`, making actions invisible to keyboard users until they blindly tabbed onto the button itself.
**Action:** Aligned `IconButton` behavior with `Button` by adding `group-focus-within:opacity-100` and `focus:opacity-100`. This ensures contextual actions become visible as soon as any element within the parent group (e.g., a list row) receives focus.

## 2026-05-25 - Semantic Timer & Status
**Learning:** `div` elements with `role="status"` trigger linter warnings in favor of semantic `<output>` elements. However, `<output>` is phrasing content and cannot contain block-level elements like `div`s (used for visual indicators), leading to invalid HTML if not handled carefully.
**Action:** When converting a status indicator to `<output>`, ensure inner visual elements are `<span>` (phrasing content) with `display: block` or similar CSS to maintain visual layout while satisfying semantic requirements. Also, always wrap live timer values in a container with `role="timer"` and `aria-live="off"` to prevent disruptive screen reader announcements.
