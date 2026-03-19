# Screenshot Validation & Visual Residue

> **Priority:** P1
> **Status:** Partial
> **Last Updated:** 2026-03-19

Core visual facelift work is done. Only the unfinished screenshot and validation residue stays here.

## Remaining Screenshot Coverage

### Canonical Spec Screenshot Variants Missing

- [ ] `14-verify-email` — missing `desktop-dark.png`, `desktop-light.png`, `tablet-light.png`, `mobile-light.png`
- [ ] `15-invite` — missing `desktop-dark.png`, `desktop-light.png`, `tablet-light.png`, `mobile-light.png`
- [ ] `16-unsubscribe` — missing `desktop-dark.png`, `desktop-light.png`, `tablet-light.png`, `mobile-light.png`
- [ ] `17-members` — missing `desktop-dark.png`, `desktop-light.png`, `tablet-light.png`, `mobile-light.png`
- [ ] `22-time-tracking` — missing `desktop-light.png`, `tablet-light.png`, `mobile-light.png`
- [ ] `28-workspace-detail` — missing `desktop-dark.png`, `desktop-light.png`, `tablet-light.png`, `mobile-light.png`

### Modals Still Not Captured

- [ ] Dashboard customize modal
- [ ] Move document dialog
- [ ] Avatar / cover upload modals
- [ ] Confirm dialog
- [ ] Alert dialog
- [ ] Markdown preview modal

### Interactive States Still Not Captured

- [ ] Board: column empty, WIP limit warning
- [ ] Issues: draft restoration, duplicate detection, inline editing, side panel
- [ ] Documents: locked, table/code blocks, color picker, favorites
- [ ] Calendar: drag-and-drop, quick-add
- [ ] Sprints: completion modal, date overlap warning
- [ ] Notifications: snooze popover
- [ ] Settings: profile with avatar/cover, 2FA setup, workspace/project settings
- [ ] Navigation: sidebar favorites, project tree, mobile hamburger
- [ ] Error: permission denied, loading skeletons, toasts, form validation

### CI Integration

- [ ] CI screenshot manifest check — still blocked until screenshots are committed to git or generated in CI.

## Already Done

- [x] Page layout wrapper consistency cleanup
- [x] Notification popover cleanup
- [x] Workspace card cleanup
- [x] Assistant page cleanup
- [x] Validator hardening for layout/raw-tailwind drift
- [x] Route screenshot coverage audit
- [x] Canonical spec screenshot audit in `pnpm run validate`
- [x] Canonical screenshots for spec'd modals in `docs/design/specs/modals/screenshots/`
- [x] Screenshot diff workflow via `pnpm screenshots:diff` and `pnpm screenshots:approve`

## Ongoing Maintenance

- [ ] Raw Tailwind baseline remains at 148 files and should continue shrinking as touched files are cleaned up
