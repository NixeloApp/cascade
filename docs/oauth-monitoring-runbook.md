# OAuth Monitoring Runbook

## Overview

Nixelo uses synthetic OAuth monitoring that runs every 15 minutes to verify Google OAuth is working correctly.

## How It Works

```text
┌─────────────────────────────────────────────────────────────────┐
│  Every 15 minutes (Convex cron):                                │
│                                                                 │
│  1. Exchange refresh token → access token                       │
│  2. Use access token to fetch user profile                      │
│  3. If both succeed → OAuth is healthy                          │
│  4. If either fails → Alert to Slack                            │
└─────────────────────────────────────────────────────────────────┘
```

## Required Environment Variables

Set these in Convex Dashboard → Settings → Environment Variables:

```bash
# OAuth credentials (same as your app uses for login)
OAUTH_MONITOR_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
OAUTH_MONITOR_GOOGLE_CLIENT_SECRET=<your-client-secret>

# Refresh token from OAuth Playground (see setup below)
OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN=1//0exxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Slack webhook for alerts
SLACK_OAUTH_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
```

---

## Initial Setup

### Step 1: Create a Test Google Account

Create or designate a Google account for synthetic monitoring:
- `nixelo-oauth-monitor@gmail.com` (or use a Workspace account)
- Store credentials securely

### Step 2: Get Refresh Token from OAuth Playground

1. Go to **https://developers.google.com/oauthplayground**

2. Click the **gear icon (⚙️)** in the top right

3. Check **"Use your own OAuth credentials"**

4. Enter your credentials:
   - OAuth Client ID: `<your-client-id>.apps.googleusercontent.com`
   - OAuth Client Secret: `<your-client-secret>`

5. In the left panel, select scopes:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

6. Click **"Authorize APIs"**

7. Login with your test Google account

8. Click **"Exchange authorization code for tokens"**

9. Copy the **Refresh token** value

### Step 3: Configure in Convex

1. Go to https://dashboard.convex.dev/
2. Select your project (peaceful-salmon-964)
3. Settings → Environment Variables
4. Add `OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN`

### Step 4: Verify It Works

Check the Convex logs:
1. Dashboard → Logs
2. Filter by "OAuth Health"
3. Should see: `[OAuth Health] ✓ Passed (XXXms)`

---

## Alert Types

### 🟡 WARNING: Single Failure

**Meaning:** One check failed, may be transient.

**Where to see:** Convex logs

**Actions:**
1. Check Google Cloud Status: https://status.cloud.google.com/
2. Wait for next check (15 min)
3. If persists, becomes CRITICAL

### 🔴 CRITICAL: 2+ Consecutive Failures

**Meaning:** Persistent failure, Slack alert sent.

**Actions:**
1. Check Slack for alert details
2. Identify error type (see below)
3. Follow recovery procedure

---

## Error Types & Recovery

### `invalid_grant: Token has been expired or revoked`

**Cause:** Refresh token is dead.

**Recovery:**
1. Go to https://developers.google.com/oauthplayground
2. Re-authorize with the test account
3. Get new refresh token
4. Update `OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN` in Convex Dashboard
5. Changes apply immediately (no redeploy needed)

**Why it happens:**
- Test account password changed
- User revoked access in Google Account settings
- Token unused for 6+ months
- OAuth client was deleted/recreated

### `invalid_client: The OAuth client was not found`

**Cause:** OAuth credentials are wrong or deleted.

**Recovery:**
1. Verify `OAUTH_MONITOR_GOOGLE_CLIENT_ID` in Convex env vars
2. Verify `OAUTH_MONITOR_GOOGLE_CLIENT_SECRET` in Convex env vars
3. Check Google Cloud Console → APIs & Services → Credentials
4. If client was deleted, create new and update secrets

### `TIMEOUT` or Network Error

**Cause:** Network issue or Google API slow/down.

**Recovery:**
1. Check Google Cloud Status
2. Usually resolves automatically
3. If persistent, check Convex status

---

## Emergency Google Auth Kill Switch

Use this when Google OAuth login is actively failing for users and you need a fast fallback to email/password auth.

### Disable Google Auth (Emergency)

1. Sign in as an organization `owner` or `admin`.
2. Open `Settings` -> `Admin`.
3. In `Google Auth Emergency Toggle`, click `Disable Google Auth`.
4. Enter a reason (recommended): incident ID, timestamp, and owner.
5. Confirm the status badge changes to `Disabled`.

### Verification After Disable

1. Open sign-in page in an incognito session.
2. Confirm Google auth button is disabled and shows fallback guidance text.
3. Confirm email/password sign-in still works.
4. Confirm OAuth health panel still updates (do not disable monitoring unless necessary).
5. Post incident update in Slack with disable time + owner.

### Re-enable Google Auth

1. Validate provider recovery:
   - latest OAuth health checks are passing,
   - consecutive failures are `0`,
   - no fresh user reports of Google auth errors.
2. Open `Settings` -> `Admin`.
3. In `Google Auth Emergency Toggle`, click `Re-enable Google Auth`.
4. Add reason with recovery evidence and timestamp.
5. Verify status badge changes to `Enabled`.

### Verification After Re-enable

1. In incognito, verify Google auth button is active.
2. Complete one end-to-end Google sign-in.
3. Confirm no new OAuth health failures for at least one check interval (15 minutes).
4. Post recovery update in Slack with verification evidence.

---

## Refresh Token Lifecycle

| Event | Token Status |
|-------|--------------|
| Initial authorization | ✅ Valid |
| 6 months unused | ⚠️ May expire |
| User changes password | ❌ Revoked |
| User revokes in Google settings | ❌ Revoked |
| OAuth client deleted | ❌ Invalid |
| Normal use (refreshed regularly) | ✅ Valid indefinitely |

**Note:** The 15-minute cron keeps the token active, preventing "unused" expiration.

---

## Checking Logs

### Convex Dashboard
1. Go to https://dashboard.convex.dev/
2. Select project → Logs
3. Search for `OAuth Health`

### Expected Log Output

**Success:**
```text
[OAuth Health] ✓ Passed (245ms)
```

**Failure:**
```text
[OAuth Health] ✗ Failed (1023ms): Token has been expired or revoked
```

---

## Disabling the Monitor

If you need to temporarily disable:

1. Remove env vars from Convex Dashboard
2. Or comment out the cron in `convex/crons.ts`:

```typescript
// crons.interval(
//   "oauth health check",
//   { minutes: 15 },
//   internal.oauthHealthCheck.checkGoogleOAuthHealth,
// );
```

3. Run `pnpm convex deploy`

---

## Manual Health Check

```bash
# Quick check using curl

# 1. Get access token
curl -X POST https://oauth2.googleapis.com/token \
  -d "grant_type=refresh_token" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "refresh_token=YOUR_REFRESH_TOKEN"

# 2. Use access token to get user info
curl https://www.googleapis.com/oauth2/v2/userinfo \
  -H "Authorization: Bearer ACCESS_TOKEN_FROM_STEP_1"
```

If both return 200 OK, OAuth is working.
