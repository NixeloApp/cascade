# Google Calendar Integration Setup

Complete guide to setting up Google Calendar integration with Nixelo for bi-directional calendar syncing.

## Overview

The Google Calendar integration allows you to:
- ✅ **Import** events from Google Calendar to Nixelo
- ✅ **Export** events from Nixelo to Google Calendar
- ✅ **Bidirectional Sync** (recommended) - Keep both calendars in sync
- ✅ **OAuth 2.0** authentication for secure access
- ✅ **Automatic sync** in background (or manual trigger)
- ✅ **Per-user configuration** - Each user connects their own Google account

---

## Prerequisites

- Google Cloud Console access
- Google account for calendar access
- Nixelo instance running (development or production)

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `Nixelo Calendar Integration`
4. Click "Create"

---

## Step 2: Enable Google Calendar API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click **"Enable"**

---

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen first:
   - User Type: **External** (unless you have Google Project)
   - App name: `Nixelo`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `../auth/calendar` and `../auth/calendar.events`
   - Save and continue

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Nixelo Web Client`

5. **Authorized redirect URIs** - Add these:
   ```
   Development:
   http://localhost:5555/google/callback

   Production:
   https://yourdomain.com/google/callback
   ```

6. Click **"Create"**
7. Copy the **Client ID** and **Client Secret** (you'll need these next)

---

## Step 4: Configure Nixelo Environment Variables

### Development Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Copy `.env.example` to `.env.local` and fill in the Google OAuth section:
   - `GOOGLE_CLIENT_ID` - your client ID
   - `GOOGLE_CLIENT_SECRET` - your client secret
   - `SITE_URL` - already set to `http://localhost:5555`

3. Restart your Convex dev server:
   ```bash
   pnpm convex dev
   ```

### Production Setup

1. Set environment variables in your Convex deployment:
   ```bash
   npx convex env set GOOGLE_CLIENT_ID your_client_id
   npx convex env set GOOGLE_CLIENT_SECRET your_client_secret
   npx convex env set SITE_URL https://yourdomain.com
   ```

2. Deploy:
   ```bash
   npx convex deploy
   ```

---

## Step 5: Connect Google Calendar in Nixelo

### For End Users

1. Log in to Nixelo
2. Go to **Settings** → **Integrations**
3. Find the **Google Calendar** card
4. Click **"Connect Google"**
5. A popup window will open
6. Sign in to your Google account
7. Grant Nixelo permission to access your calendar
8. Popup will close automatically
9. You're now connected! ✅

---

## Step 6: Configure Sync Settings

After connecting, configure how syncing works:

### Sync Toggle
- **Enable Sync**: Turn on/off automatic syncing
- When enabled, events sync automatically in the background

### Sync Direction

Choose how calendar events should sync:

#### 1. **Bidirectional** (Recommended)
- Syncs events both ways: Google ↔ Nixelo
- Best for: Users who manage calendars in both places
- Changes in either calendar update the other

#### 2. **Import Only**
- Only imports events from Google Calendar → Nixelo
- Best for: Viewing Google events in Nixelo (read-only)
- Nixelo events won't appear in Google Calendar

#### 3. **Export Only**
- Only exports events from Nixelo → Google Calendar
- Best for: Using Google Calendar as the primary calendar
- Google events won't appear in Nixelo

---

## Usage

### Automatic Sync

Once connected and enabled:
- Syncs run automatically in the background
- Default: Every 15 minutes (configurable)
- Check "Last synced" timestamp in Settings

### Manual Sync

Trigger a manual sync:

1. Via UI (Coming soon):
   - Settings → Google Calendar → "Sync Now" button

2. Via API:
   ```bash
   curl -X POST https://yourdomain.com/google/sync \
     -H "Authorization: Bearer your_session_token"
   ```

---

## What Gets Synced?

### From Google Calendar to Nixelo
- ✅ Event title
- ✅ Description
- ✅ Start/end time
- ✅ All-day events
- ✅ Location
- ✅ Attendees (as external emails)

### From Nixelo to Google Calendar
- ✅ Calendar events created in Nixelo
- ✅ Project meetings
- ✅ Sprint planning sessions
- ✅ Team standups
- ✅ Deadlines

### Not Synced (By Design)
- ❌ Private events (if marked private in Google)
- ❌ Recurring events (coming soon)
- ❌ Reminders
- ❌ Event colors (uses default)

---

## Troubleshooting

### "Google OAuth not configured" Error

**Problem**: Environment variables not set correctly

**Solution**:
1. Verify `.env.local` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Restart dev server: `pnpm convex dev`
3. Check for typos in credentials

---

### "Failed to exchange authorization code" Error

**Problem**: Redirect URI mismatch or invalid credentials

**Solution**:
1. Check authorized redirect URIs in Google Cloud Console
2. Must exactly match: `http://localhost:5555/google/callback` (dev) or `https://yourdomain.com/google/callback` (prod)
3. No trailing slashes
4. Verify Client ID/Secret are correct

---

### "Connection Failed" After OAuth

**Problem**: Token exchange failed

**Solution**:
1. Check browser console for detailed errors
2. Verify Google Calendar API is enabled
3. Check OAuth consent screen is configured
4. Try disconnecting and reconnecting

---

### No Events Syncing

**Problem**: Events aren't appearing after connecting

**Checklist**:
- ✅ Sync is enabled (check toggle in Settings)
- ✅ Sync direction is correct (not "Export Only" if importing)
- ✅ Events exist in Google Calendar
- ✅ Events are within sync time range (last 30 days by default)
- ✅ Check "Last synced" timestamp

**Solution**:
1. Try manual sync (if implemented)
2. Disconnect and reconnect
3. Check browser console and server logs for errors

---

### "Access Token Expired" Error

**Problem**: OAuth token needs refresh

**Solution**:
- Automatic: Nixelo will auto-refresh the token using the refresh token
- Manual: Disconnect and reconnect Google Calendar
- This should rarely happen (tokens refresh automatically)

---

## Security & Privacy

### Data Storage
- **OAuth tokens** stored securely in Convex database
- **Access tokens** encrypted at rest (recommended for production)
- **Refresh tokens** allow long-term access without re-authentication

### Permissions Requested
- `https://www.googleapis.com/auth/calendar` - Read/write calendar access
- `https://www.googleapis.com/auth/calendar.events` - Manage events
- `https://www.googleapis.com/auth/userinfo.email` - Identify user account

### User Control
- Users can disconnect at any time (revokes access)
- Disconnecting removes all stored tokens
- Users can also revoke access in Google Account settings

### Best Practices
1. **Production**: Encrypt OAuth tokens at rest
2. **HTTPS**: Always use HTTPS in production (required by Google)
3. **Scopes**: Only request minimum required scopes
4. **Token Rotation**: Implement automatic token refresh (already built-in)

---

## API Reference

### Connect Google Calendar

**Backend Function**: `api.googleCalendar.connectGoogle`

```typescript
await connectGoogle({
  providerAccountId: "user@gmail.com",
  accessToken: "ya29.xxx...",
  refreshToken: "1//xxx...",
  expiresAt: 1699564800000,
  syncDirection: "bidirectional"
});
```

### Disconnect

**Backend Function**: `api.googleCalendar.disconnectGoogle`

```typescript
await disconnectGoogle();
```

### Update Sync Settings

**Backend Function**: `api.googleCalendar.updateSyncSettings`

```typescript
await updateSyncSettings({
  syncEnabled: true,
  syncDirection: "import"
});
```

### Get Connection Status

**Backend Query**: `api.googleCalendar.getConnection`

```typescript
const connection = await api.googleCalendar.getConnection();
// Returns: { provider, providerAccountId, syncEnabled, syncDirection, lastSyncAt, ... }
```

---

## Advanced Configuration

### Custom Sync Interval

To change sync frequency, update the scheduled action in `convex/crons.ts` (create if needed):

```typescript
import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Sync every 15 minutes
crons.interval(
  "sync-google-calendars",
  { minutes: 15 },
  api.googleCalendar.syncAll
);

export default crons;
```

### Sync Time Range

Modify sync window in `convex/http/googleOAuth.ts`:

```typescript
// Default: Events from today onwards
const timeMin = new Date().toISOString();

// Alternative: Last 7 days
const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
```

### Filter Synced Events

Add custom filtering logic in `convex/googleCalendar.ts`:

```typescript
// Example: Only sync work-related events
const filteredEvents = events.filter(event =>
  !event.title.toLowerCase().includes("personal")
);
```

---

## Testing

### Test OAuth Flow

1. Start dev server: `pnpm dev`
2. Navigate to Settings → Google Calendar
3. Click "Connect Google"
4. Complete OAuth flow
5. Verify connection appears in Settings

### Test Event Sync

1. Create event in Google Calendar
2. Trigger sync (wait for auto-sync or use manual sync endpoint)
3. Check Nixelo calendar view for imported event
4. Create event in Nixelo
5. Check Google Calendar for exported event

### Test Disconnect

1. Click "Disconnect" in Settings
2. Verify connection removed from Settings
3. Verify tokens removed from database
4. Reconnect and verify still works

---

## Production Checklist

Before deploying Google Calendar integration to production:

- [ ] Set `GOOGLE_CLIENT_ID` in Convex environment
- [ ] Set `GOOGLE_CLIENT_SECRET` in Convex environment
- [ ] Set `SITE_URL` to production URL (https://yourdomain.com)
- [ ] Add production redirect URI to Google Cloud Console
- [ ] Enable Google Calendar API in Google Cloud project
- [ ] Configure OAuth consent screen
- [ ] Test OAuth flow end-to-end
- [ ] Test event sync (both directions)
- [ ] Implement token encryption (recommended)
- [ ] Set up monitoring for sync failures
- [ ] Configure automatic token refresh
- [ ] Test disconnect/reconnect flow
- [ ] Document for end users

---

## Support & Resources

- **Google Calendar API Docs**: https://developers.google.com/calendar
- **OAuth 2.0 Guide**: https://developers.google.com/identity/protocols/oauth2
- **Convex Docs**: https://docs.convex.dev/
- **Issues**: File bug reports in your project repository

---

## Changelog

### v1.0.0 (2025-11-18)
- ✅ Initial OAuth 2.0 implementation
- ✅ Bidirectional calendar sync
- ✅ UI for connection management
- ✅ Sync direction configuration
- ✅ Auto-refresh token support
- ✅ Manual sync trigger via API

### Future Enhancements
- [ ] Recurring event support
- [ ] Event reminders sync
- [ ] Multiple calendar support
- [ ] Conflict resolution UI
- [ ] Calendar color mapping
- [ ] Attendee mapping to Nixelo users

---

*Last Updated: 2025-11-27*
