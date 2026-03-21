# Offline / PWA Remaining Todo

This file intentionally lives at the repo root instead of `todos/`.

Purpose:

- keep the offline/PWA lane separate from the active `/todos` pipeline
- show only remaining work
- make handoff easy when multiple agents or devices are involved

## Current Verified State

What is already true in the repo:

- the app registers `/service-worker.js` from `src/lib/serviceWorker.ts`
- built HTML no longer auto-registers the generated `vite-plugin-pwa` worker
- `vite-plugin-pwa` still emits `/sw.js`
- built HTML links `/manifest.webmanifest`
- production-preview browser automation now confirms `/service-worker.js` controls runtime and `/sw.js` does not take control unexpectedly
- production-preview browser automation now confirms the runtime links `/manifest.webmanifest` and caches `/`, `/offline.html`, and `/manifest.webmanifest`
- production-preview browser automation now confirms uncached offline navigation falls back to `offline.html`
- local IndexedDB is the only offline mutation queue source of truth
- `userSettings.update` is the first real replayable offline mutation family
- replay runs on authenticated startup, reconnect, and manual `Process Queue`
- Settings shows truthful local queue diagnostics, last successful local replay time, and capability-limit warnings
- browser automation now covers queued timezone replay for `userSettings.update` in `e2e/settings/offline-replay.spec.ts`
- browser automation now covers preview-runtime worker ownership and uncached offline fallback in `e2e/preview/pwa-runtime.spec.ts`
- browser automation now covers authenticated preview replay, manual `Process Queue`, and `Last Successful Replay` updates in `e2e/preview/offline-replay-preview.spec.ts`
- offline architecture and verification docs now exist:
  - `docs/setup/PWA.md`
  - `docs/setup/OFFLINE_ARCHITECTURE.md`

## Recommended Next Step

Highest-value next move:

- fix authenticated offline route restore behavior, then verify installability and push behavior after worker updates

Why:

- the remaining uncertainty is no longer basic implementation truthfulness
- the main open risk is runtime behavior that is now partly confirmed broken: authenticated offline route reload/navigation, plus installability and push after worker changes

## Remaining Work

## 1. Runtime Verification

- [ ] Verify install prompt behavior in Chromium when browser installability criteria are actually met.
- [ ] Fix authenticated offline route reload/navigation in preview; current probes stall on the splash/loading surface instead of restoring the route.

## 2. Push And Worker Update Safety

- [ ] Verify push subscription survives service worker replacement.
- [ ] Verify push still works after cache clear plus worker re-registration.
- [ ] Verify unsubscribe cleanup is correct when subscriptions rotate.
- [ ] Confirm whether push depends only on service worker support or also on install state in practice.

## 3. Worker / Manifest Ownership Cleanup

- [ ] Decide whether the app should keep manual worker ownership or fully move to the generated PWA worker.
- [ ] Remove the unused path after that decision so there is one obvious worker owner.
- [ ] Remove or intentionally keep `public/manifest.json`; do not leave it as an unexplained legacy artifact.
- [ ] Re-check build output after cleanup and confirm only the intended worker/manifest artifacts remain meaningful.

## 4. Replay Coverage Expansion

- [ ] Choose the next replayable mutation family after `userSettings.update`.
- [ ] Add an explicit replay handler for that mutation family.
- [ ] Define idempotency expectations for each replayable mutation family before expanding coverage.
- [ ] Define how deleted or archived target entities should fail.
- [ ] Define how conflict resolution should work when server state moved while the client was offline.

## 5. Retry Policy

- [ ] Decide whether the current retry model remains best-effort only or needs real backoff.
- [ ] If real backoff is required, define where that timing policy lives.
- [ ] Decide which failures should be treated as retryable versus effectively permanent.

## 6. Tests Still Missing

- [ ] Cover installability in browser automation if the environment can satisfy install criteria.
- [ ] Re-introduce authenticated offline reload/navigation coverage after the splash-screen stall bug is fixed.
- [ ] Cover push after worker update only if the test harness can do it reliably.

## 7. Docs To Revisit After Runtime Proof

- [ ] Update `docs/setup/PWA.md` again after real browser verification so it reflects proven runtime behavior, not just source-level ownership.
- [ ] Update `docs/setup/OFFLINE_ARCHITECTURE.md` if replay expands beyond `userSettings.update`.
- [ ] Add a short note with final browser-verification findings once install/offline/push behavior is confirmed.

## Open Questions

- [ ] Should Background Sync remain best-effort only forever, or eventually become part of the supported path?
- [ ] Should replay stay opt-in per mutation type, or should there ever be a more generic replay layer?
- [ ] Do failed offline actions need durable server-side audit logging for support/debugging?
- [ ] Is it worth keeping `vite-plugin-pwa` generation if manual worker ownership remains the intended model?

## Done When

- [ ] One worker path clearly owns runtime behavior.
- [ ] One manifest path clearly owns install metadata.
- [ ] Real browser verification confirms install, offline fallback, and replay behavior.
- [ ] Push behavior is verified after worker changes.
- [ ] At least one additional mutation family is replayable, or the team explicitly decides to stop at `userSettings.update`.
- [ ] Docs match the verified runtime.
