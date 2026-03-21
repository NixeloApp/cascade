# PWA (Progressive Web App) Setup

Nixelo has partial PWA infrastructure. This guide reflects the current shipped code paths as of 2026-03-20, and the runtime findings currently proven in local production-preview browser automation.

Related doc:

- `docs/setup/OFFLINE_ARCHITECTURE.md` for queue ownership and replay flow

## Current Status

As of 2026-03-20, the repo still has split worker generation, but only one app-owned registration path.

What is true right now:

- Service worker registration is triggered from `src/routes/__root.tsx`.
- The app manually registers `/service-worker.js` via `src/lib/serviceWorker.ts`.
- `public/service-worker.js` is still shipped in production as `/service-worker.js`.
- `vite-plugin-pwa` is also enabled in `vite.config.ts`.
- The current verified emitted build still produces a separate `/sw.js`, but built HTML no longer auto-registers it.
- `vite.config.ts` sets `injectRegister: false` to keep registration owned by `src/lib/serviceWorker.ts`.
- Built HTML now links only `/manifest.webmanifest`, and the manual service worker caches that same manifest path.
- `window.__convex_test_client` is now exposed only in `--mode e2e`, so normal production builds no longer suppress service-worker registration by mistake.
- `src/lib/serviceWorker.ts` now registers immediately if the document is already loaded, so app-shell startup no longer depends on catching a late `window.load` event.
- The dead `src/service-worker.ts` worker candidate has been removed from source because it was not part of the shipped build pipeline.
- `promptInstall()` is now wired from the root app shell for production, non-E2E builds.
- `processOfflineQueue()` in `src/lib/offline.ts` now rejects unsupported replay types explicitly instead of marking them synced without contacting a backend.
- The first live replay path now exists for `userSettings.update`; queued preference changes flush from the authenticated app shell on startup and reconnect.

Operational implication:

- the effective runtime worker path is `/service-worker.js`
- the generated `/sw.js` still exists, but is not auto-registered by built HTML
- build-pipeline cleanup is still incomplete even though runtime registration ownership is mostly stable

## What Is Actually Live

Verified now:

- service worker registration from the app shell in production
- production-preview browser automation confirms `/service-worker.js` is the controlling runtime worker
- production-preview browser automation confirms the generated `/sw.js` is not taking control unexpectedly
- production-preview browser automation confirms the runtime links `/manifest.webmanifest` and caches `/`, `/offline.html`, and `/manifest.webmanifest`
- the shipped app now includes `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`, and `public/badge-72.png`
- offline fallback page shipping with the worker
- production-preview browser automation confirms uncached offline navigation falls back to `offline.html`
- local IndexedDB mutation queue
- truthful queue diagnostics in Settings
- manual queue processing from Settings
- one real replayable mutation family: `userSettings.update`
- install/update helper wiring in the app shell
- production-preview browser automation confirms an authenticated Settings session stays usable offline once loaded
- production-preview browser automation confirms previously visited authenticated Settings and dashboard routes restore offline in preview
- production-preview browser automation confirms Chromium installability checks are clean for the built app
- production-preview browser automation confirms queued `userSettings.update` changes replay in preview and update `Last Successful Replay`

Not yet verified end to end:

- push behavior across worker replacement

## Setup Requirements

### 1. App Icons

You need to create two icon files and place them in the `public/` directory:

- `public/icon-192.png` - 192x192px PNG icon
- `public/icon-512.png` - 512x512px PNG icon

**Icon Requirements:**
- Format: PNG with transparency
- Background: Should work on both light and dark backgrounds
- Style: Simple, recognizable, branded
- Safe zone: Keep important content within center 80% to avoid mask cropping

**Recommended Tools:**
- [Real Favicon Generator](https://realfavicongenerator.net/) - Generate all icon sizes
- [Figma](https://figma.com) or [Canva](https://canva.com) - Design icons
- [Squoosh](https://squoosh.app/) - Optimize PNG files

**Quick Icon Creation:**
```bash
# Using ImageMagick to create placeholder icons (replace with your logo)
convert -size 192x192 xc:#3b82f6 -font Arial -pointsize 72 \
  -fill white -gravity center -annotate +0+0 "C" \
  public/icon-192.png

convert -size 512x512 xc:#3b82f6 -font Arial -pointsize 192 \
  -fill white -gravity center -annotate +0+0 "C" \
  public/icon-512.png
```

### 2. Service Worker Configuration

The current service worker setup is split. Relevant files:

- `/src/routes/__root.tsx` - Current registration entry point
- `/src/lib/serviceWorker.ts` - Manual registration and install/update helpers
- `/src/lib/offline.ts` - Local queue state and replay processor
- `/src/lib/offlineUserSettings.ts` - First real replayable mutation mapping
- `/public/service-worker.js` - Worker currently shipped at `/service-worker.js`
- `/public/offline.html` - Offline fallback page
- `/public/icon-192.png`, `/public/icon-512.png`, `/public/apple-touch-icon.png`, `/public/badge-72.png` - current install/push assets
- `/public/manifest.json` - legacy manifest artifact still emitted during build
- `/vite.config.ts` - `vite-plugin-pwa` configuration that also emits `/sw.js` and `/manifest.webmanifest`

### 3. Local Verification

To test PWA features locally:

```bash
pnpm build
pnpm preview
```

Then open Chrome DevTools:

1. Go to **Application**.
2. Check **Service Workers** and confirm `/service-worker.js` owns the scope.
3. Check **Manifest** and confirm `/manifest.webmanifest` is loaded.
4. Check **Cache Storage** for offline shell artifacts.
5. Use **Lighthouse** only after the runtime path above is confirmed.

### 4. Testing Offline Mode

1. Open the app in production mode
2. Open Chrome DevTools → Network tab
3. Check "Offline" checkbox
4. Reload the page and confirm whether uncached routes fall back to `offline.html`
5. Navigate to previously visited pages and note which routes actually work offline

## Testing Matrix

### Automated checks

Useful current commands:

```bash
pnpm test --run src/lib/offline.test.ts src/hooks/useOffline.test.ts src/hooks/useOfflineUserSettingsUpdate.test.ts src/components/Settings/OfflineTab.test.tsx src/lib/serviceWorker.test.ts
pnpm exec playwright test -c playwright.preview.config.ts e2e/preview/pwa-runtime.spec.ts --workers=1
pnpm exec playwright test -c playwright.preview.config.ts e2e/preview/offline-replay-preview.spec.ts --workers=1
pnpm build
```

Those checks currently cover:

- queue failure classification
- replay handler registration behavior
- manual queue processing from Settings
- last successful replay metadata
- install/update helper behavior
- preview-runtime worker ownership (`/service-worker.js` yes, `/sw.js` no)
- preview-runtime manifest ownership and core shell cache contents
- preview-runtime Chromium installability checks with zero reported installability errors
- uncached offline navigation fallback in a real production preview
- authenticated Settings-session offline queueing and replay in a real production preview
- previously visited authenticated Settings and dashboard route recovery in a real production preview
- `Last Successful Replay` updates after real preview replay

### Manual browser checks still required

These are still runtime-verification tasks, not solved by unit tests:

1. Confirm push subscriptions still work after worker updates or cache clears.
2. If desired, do one manual Chromium spot-check of the custom install banner; installability criteria are already clean in preview, but `beforeinstallprompt` display remains engagement- and browser-heuristic-dependent.

## Build Pipeline

Current build behavior:

- Vite emits `/manifest.webmanifest`
- `vite-plugin-pwa` emits `/sw.js`
- the app still ships `/service-worker.js` from `public/service-worker.js`
- built HTML links only `/manifest.webmanifest`
- built HTML no longer injects plugin auto-registration

Current runtime behavior:

- app code registers `/service-worker.js`
- `navigator.serviceWorker.ready` therefore resolves against the manually registered worker path
- push and install/update helpers currently assume that registered path is the effective owner

This means the runtime is coherent enough to work on, but the build pipeline is not yet reduced to one obvious worker artifact.

## Manifest Configuration

The current linked manifest path is `/manifest.webmanifest`.

The repo also still contains `/public/manifest.json`, but that file is no longer the linked manifest in built HTML and should be treated as a legacy artifact until cleanup is finished.

Manifest values include:

- App name and description
- Theme colors
- Display mode (standalone)
- Icon references
- App shortcuts for quick actions
- Categories for app stores

You can customize these values to match your branding:

```json
{
  "name": "Your App Name",
  "short_name": "ShortName",
  "theme_color": "#your-color",
  "background_color": "#your-bg-color",
  ...
}
```

## Caching And Offline Behavior

The shipped worker currently follows a network-first style for navigations and maintains an offline fallback page.

1. **Try network first** - Fetch fresh data when online
2. **Cache successful responses** - Store for offline use
3. **Fallback to cache** - Serve cached version if offline
4. **Show offline page** - For uncached navigation requests

### Cached Resources

On install, the service worker caches:
- Main app shell (`/`)
- Offline fallback page (`/offline.html`)
- Manifest file (`/manifest.webmanifest`)
- PWA icon assets (`/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`, `/badge-72.png`)

Important limitation:

- the exact boundary between manual worker behavior and generated Workbox behavior still needs runtime verification
- Convex request caching should not be assumed to be product-correct yet

### Updating the Service Worker

When you deploy a new version:

1. Users will see an "Update Available" banner
2. Clicking "Update" will:
   - Skip waiting and activate the new service worker
   - Reload the page with the new version
3. The old cache will be automatically cleared

## Replay Behavior

Replay is client-driven and best-effort.

Current replay triggers:

- authenticated app startup
- reconnect after the browser returns online
- manual `Process Queue` action in Settings

Current live replay coverage:

- `userSettings.update`

Current retry behavior:

- attempts are counted locally
- unsupported mutation types fail explicitly
- corrupt payloads fail explicitly
- there is no documented exponential backoff today

For the full replay model, see `docs/setup/OFFLINE_ARCHITECTURE.md`.

## Install Prompts

### Desktop (Chrome, Edge)

The app now binds `beforeinstallprompt` from the root app shell in production, and will show a custom install banner when:
- User hasn't previously dismissed it
- App is not already installed
- `beforeinstallprompt` event fires

### Mobile

**iOS Safari:**
- Users must manually add to home screen via Share menu
- Add "Add to Home Screen" instructions in your app

**Android Chrome:**
- Automatic install prompt after engagement criteria met
- Custom install button can trigger prompt programmatically

## Background Sync Reality

Background Sync is not guaranteed across browsers.

- If the browser exposes `SyncManager`, the app can try to schedule replay work through the registered service worker.
- If Background Sync is unavailable, queued changes are still replayable, but only while the app is open: on authenticated startup, when connectivity returns, or when the user presses `Process Queue` in Settings.
- If service workers are unavailable entirely, offline fallback, install prompting, and push features should be treated as unsupported in that session.

## Manual Verification Steps

For a realistic local browser check:

1. Run `pnpm build`.
2. Run `pnpm exec playwright test -c playwright.preview.config.ts e2e/preview/pwa-runtime.spec.ts --workers=1` to prove runtime worker ownership, cache contents, and Chromium installability checks.
3. Run `pnpm exec playwright test -c playwright.preview.config.ts e2e/preview/offline-replay-preview.spec.ts --workers=1` to prove authenticated preview replay, manual processing, and `Last Successful Replay`.
4. Run `pnpm preview` if you want to inspect the same behavior manually in Chromium.
5. In DevTools → Application → Service Workers, confirm `/service-worker.js` is registered.
6. In DevTools → Application → Manifest, confirm `/manifest.webmanifest` is loaded.
7. Go offline in DevTools and verify the settings screen still shows local queue state.
8. Change a replayable preference while offline.
9. Reconnect, or use `Process Queue`, and confirm the queue drains.
10. Confirm `Last Successful Replay` updates.
11. If testing push, subscribe again after any worker clear or replacement and verify delivery.

## Browser Support And Known Limits

- Chromium browsers give the most complete support path.
- Safari should be treated as partial support.
- iOS install remains manual.
- Background Sync is optional and cannot be relied on for correctness.
- If service workers are unavailable, offline fallback, install prompts, and push should be considered unsupported for that session.

## Production Deployment

The service worker only registers in production builds to avoid caching issues during development.

**Current build output:**

- `/service-worker.js` from `public/service-worker.js`
- `/sw.js` from `vite-plugin-pwa`
- `/manifest.webmanifest` as the linked app manifest

The app currently registers only `/service-worker.js` from app code. The remaining cleanup target is reducing worker/manifest ambiguity, not solving a double-registration bug in built HTML.

**Deployment Checklist:**
- ✅ Icons created and placed in `/public/`
- ✅ Manifest customized with your branding
- ✅ Test PWA audit with Lighthouse (score > 90)
- ✅ Test offline functionality
- ✅ Test install flow on mobile and desktop
- ✅ Configure HTTPS (required for service workers)

## Troubleshooting

### Service Worker Not Registering

- Check browser console for errors
- Ensure running in production mode (`pnpm build && pnpm preview`)
- Verify HTTPS is enabled (required except for localhost)
- Clear browser cache and hard reload

### Stale Worker Or Cache State

- Use DevTools → Application → Service Workers and unregister old workers
- Use DevTools → Application → Clear storage when the app is stuck on stale assets
- Confirm only `/service-worker.js` is currently registered for the app scope
- Rebuild and preview again before assuming runtime bugs are code regressions

### Updates Not Showing

- Service worker caches aggressively
- Use "Clear cache" button in DevTools → Application → Service Workers
- Or use the `clearCache()` utility function:
  ```js
  import { clearCache } from "./lib/serviceWorker";
  clearCache();
  ```

### Install Prompt Not Showing

- Check if already dismissed (stored in localStorage: `pwa-install-dismissed`)
- Verify manifest is valid (check DevTools → Application → Manifest)
- Ensure icons are accessible
- Try on a fresh incognito window

### Offline Mode Issues

- Check Network tab in DevTools
- Verify service worker is activated
- Check cached resources in DevTools → Application → Cache Storage
- Verify which routes actually work offline instead of assuming app-wide support
- Check the Offline settings screen for queue counts, failure state, and last successful replay time
- If Background Sync is unavailable, keep the app open and use `Process Queue` manually after reconnect

## Disabling PWA

To disable PWA features:

1. Remove service worker registration from `/src/routes/__root.tsx`:
   ```ts
   // Comment out or remove these lines:
   // registerServiceWorker();
   ```

2. Unregister existing service workers:
   ```js
   import { unregister } from './lib/serviceWorker';
   unregister();
   ```

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
- [Workbox (Advanced SW)](https://developers.google.com/web/tools/workbox)
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)

## Support

For issues or questions about the PWA implementation, check:
- Browser DevTools → Application tab
- Console for service worker logs (prefixed with `[SW]`)
- Lighthouse PWA audit for compliance issues

---

*Last Updated: 2026-03-21*
