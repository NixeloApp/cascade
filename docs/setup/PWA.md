# PWA (Progressive Web App) Setup

Nixelo has partial PWA infrastructure, but this document is currently under audit.

## Current Status

As of 2026-03-20, the repo does not have a single clean PWA ownership path yet.

What is true right now:

- Service worker registration is triggered from `src/routes/__root.tsx`.
- The app manually registers `/service-worker.js` via `src/lib/serviceWorker.ts`.
- `public/service-worker.js` is still shipped in production as `/service-worker.js`.
- `vite-plugin-pwa` is also enabled in `vite.config.ts`.
- The current verified emitted build still produces a separate `/sw.js`, but built HTML no longer auto-registers it.
- `vite.config.ts` sets `injectRegister: false` to keep registration owned by `src/lib/serviceWorker.ts`.
- Built HTML now links only `/manifest.webmanifest`, and the manual service worker caches that same manifest path.
- The dead `src/service-worker.ts` worker candidate has been removed from source because it was not part of the shipped build pipeline.
- `promptInstall()` exists in `src/lib/serviceWorker.ts`, but is not currently wired to an active call site.
- `processOfflineQueue()` in `src/lib/offline.ts` now rejects unsupported replay types explicitly instead of marking them synced without contacting a backend.

Implication:

- this document should be treated as implementation guidance in progress, not as a verified description of shipped behavior

Nixelo is intended to support installability, caching, and offline behavior, but the exact worker/manifest ownership is still being cleaned up.

## Features Included

✅ **Offline Support** - Service worker caches assets for offline use
✅ **Installable** - Users can install Nixelo as a native app
✅ **Auto-Updates** - Automatic detection and notification of new versions
✅ **App Shortcuts** - Quick access to common actions from the home screen
✅ **Responsive** - Optimized for mobile, tablet, and desktop

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
- `/public/service-worker.js` - Worker currently shipped at `/service-worker.js`
- `/public/offline.html` - Offline fallback page
- `/public/manifest.json` - PWA manifest configuration
- `/vite.config.ts` - `vite-plugin-pwa` configuration that also emits `/sw.js` and `/manifest.webmanifest`

### 3. Testing Locally

To test PWA features locally:

```bash
# Build the production version
npm run build

# Preview the build (service workers only work in production)
npm run preview
```

Then open Chrome DevTools:
1. Go to **Application** tab
2. Check **Service Workers** section to verify registration
3. Check **Manifest** section to verify manifest is loaded
4. Use **Lighthouse** to audit PWA compliance

### 4. Testing Offline Mode

1. Open the app in production mode
2. Open Chrome DevTools → Network tab
3. Check "Offline" checkbox
4. Reload the page - should show offline page for uncached routes
5. Navigate to previously visited pages - should work offline

## Manifest Configuration

The PWA manifest is located at `/public/manifest.json` and includes:

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

## Service Worker Caching Strategy

The service worker uses a **Network First** strategy:

1. **Try network first** - Fetch fresh data when online
2. **Cache successful responses** - Store for offline use
3. **Fallback to cache** - Serve cached version if offline
4. **Show offline page** - For uncached navigation requests

### Cached Resources

On install, the service worker caches:
- Main app shell (`/`)
- Offline fallback page (`/offline.html`)
- Manifest file (`/manifest.webmanifest`)

During runtime, it automatically caches:
- All successfully fetched resources (status 200)
- Navigation requests
- API responses (for offline viewing)

### Updating the Service Worker

When you deploy a new version:

1. Users will see an "Update Available" banner
2. Clicking "Update" will:
   - Skip waiting and activate the new service worker
   - Reload the page with the new version
3. The old cache will be automatically cleared

## Install Prompts

### Desktop (Chrome, Edge)

The app will show an install prompt banner automatically when:
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

## Production Deployment

The service worker only registers in production builds to avoid caching issues during development.

**Vite Configuration:**
The repo currently ships:

- `/service-worker.js` from `public/service-worker.js`
- `/sw.js` from `vite-plugin-pwa`
- `/manifest.webmanifest` as the linked app manifest

The app currently registers only `/service-worker.js` from app code, and built HTML links only `/manifest.webmanifest`. The remaining cleanup target is the unused emitted `/sw.js` and any leftover legacy manifest artifact, not a competing registration path in HTML.

**Deployment Checklist:**
- ✅ Icons created and placed in `/public/`
- ✅ Manifest customized with your branding
- ✅ Test PWA audit with Lighthouse (score > 90)
- ✅ Test offline functionality
- ✅ Test install flow on mobile and desktop
- ✅ Configure HTTPS (required for service workers)

## Browser Support

- ✅ Chrome/Edge 67+ (full support)
- ✅ Firefox 44+ (service workers only)
- ✅ Safari 11.1+ (limited PWA support)
- ✅ Samsung Internet 4+ (full support)
- ⚠️ iOS Safari requires manual install

## Troubleshooting

### Service Worker Not Registering

- Check browser console for errors
- Ensure running in production mode (`npm run build && npm run preview`)
- Verify HTTPS is enabled (required except for localhost)
- Clear browser cache and hard reload

### Updates Not Showing

- Service worker caches aggressively
- Use "Clear cache" button in DevTools → Application → Service Workers
- Or use the `clearCache()` utility function:
  ```js
  import { clearCache } from './lib/serviceWorker';
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
- Verify routes are being cached correctly

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

*Last Updated: 2026-03-20*
