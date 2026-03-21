# Settings Page - Current State

> **Route**: `/:slug/settings/profile`
> **Status**: 🟢 Profile surface now scales cleanly across viewports
> **Last Updated**: 2026-03-21

---

## Screenshots

| Viewport | State | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |
| Desktop | Project Settings | ![](screenshots/desktop-light-project.png) |

---

## Current UI

- The route now owns settings tab state through the `tab` search param instead of copying it into local component state.
- Visible tabs come from the canonical `SETTINGS_TABS` model in `settingsTabs.ts`, which removes the old duplicated tab definitions.
- The top-level page remains a header plus horizontal tabs, with the profile tab showing the heaviest composition.
- The profile tab now behaves like one responsive workspace surface instead of a desktop-first card stack squeezed into smaller screens.
- Project settings screenshots in the same spec folder now reflect the slimmer shared project shell.

---

## Recent Improvements

- `src/components/Settings.tsx` was refactored to use one typed tab model for visibility, routing, and rendering.
- `src/routes/_auth/_app/$orgSlug/settings/profile.tsx` now validates and canonicalizes the route search state.
- `src/components/Settings/ProfileContent.tsx` was simplified so the profile tab is less ad hoc than before.
- Shared tab primitives now support the denser settings layout.
- Desktop light mode is less over-shelled now that the profile surface uses lighter shared card depth and a smaller outer shell.
- Tablet and mobile now keep the settings tabs readable by using shorter labels until larger viewports.
- The profile header is now mobile-first: the avatar actions stay attached to the avatar, the name/actions collapse cleanly, and the account metadata no longer feels like a second competing card stack.
- Account metadata now uses compact inset rows, so the profile surface reads as one system from mobile through desktop.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| The profile surface is now stable; remaining settings review is broader interaction-state consistency across the other tabs, not a layout rescue for the profile tab | multi-tab state review | LOW |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/settings/profile.tsx`
- `src/components/Settings.tsx`
- `src/components/Settings/settingsTabs.ts`
- `src/components/Settings/ProfileContent.tsx`
- `src/components/ui/Tabs.tsx`
