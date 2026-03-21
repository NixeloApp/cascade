# Settings Page - Current State

> **Route**: `/:slug/settings/profile`
> **Status**: 🟡 NEEDS POLISH
> **Last Updated**: 2026-03-12


> **Spec Contract**: This file is intentionally hyper-comprehensive. ASCII diagrams, explicit structure walkthroughs, and high-detail notes are deliberate and should not be reduced to a short summary.

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
- Project settings screenshots in the same spec folder now reflect the slimmer shared project shell.

---

## Recent Improvements

- `src/components/Settings.tsx` was refactored to use one typed tab model for visibility, routing, and rendering.
- `src/routes/_auth/_app/$orgSlug/settings/profile.tsx` now validates and canonicalizes the route search state.
- `src/components/Settings/ProfileContent.tsx` was simplified so the profile tab is less ad hoc than before.
- Shared tab primitives now support the denser settings layout.
- Desktop light mode is less over-shelled now that the profile surface uses lighter shared card depth and a smaller outer shell.
- Tablet and mobile now keep the settings tabs readable by using shorter labels until larger viewports.

---

## Remaining Gaps

| Problem | Area | Severity |
|---------|------|----------|
| Profile cards and stats are cleaner, but the settings surface still wants one more pass on smaller screens | `ProfileContent` | MEDIUM |

---

## Source Files

- `src/routes/_auth/_app/$orgSlug/settings/profile.tsx`
- `src/components/Settings.tsx`
- `src/components/Settings/settingsTabs.ts`
- `src/components/Settings/ProfileContent.tsx`
- `src/components/ui/Tabs.tsx`
