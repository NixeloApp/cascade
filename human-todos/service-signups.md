# Service Signups & Environment Variables

> **Owner:** Mikhail
> **Last Updated:** 2026-03-27

Every external service the app needs, whether it's set up, and what to do.

---

## Already Working

| Service | Env Vars | Where Set |
|---------|----------|-----------|
| Google OAuth (auth + calendar) | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Convex + .env.local |
| Mailtrap (email sending + E2E inbox) | `MAILTRAP_API_TOKEN`, `MAILTRAP_INBOX_ID`, `MAILTRAP_FROM_EMAIL`, `MAILTRAP_MODE`, `MAILTRAP_ACCOUNT_ID` | Convex + .env.local |
| Resend (email sending) | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Convex + .env.local |
| PostHog (analytics) | `VITE_PUBLIC_POSTHOG_KEY`, `VITE_PUBLIC_POSTHOG_HOST` | Convex + .env.local |
| Convex Auth (JWT) | `JWT_PRIVATE_KEY`, `JWKS` | Convex |
| E2E Testing | `E2E_API_KEY`, `E2E_TEST_MODE` | Convex + .env.local |
| OAuth Monitor | `OAUTH_MONITOR_GOOGLE_CLIENT_ID`, `OAUTH_MONITOR_GOOGLE_CLIENT_SECRET`, `OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN` | Convex + .env.local |
| Bot Service Auth | `BOT_SERVICE_API_KEY` | Convex + bot-service/.env |
| Convex Connection (bot) | `CONVEX_URL` | bot-service/.env |

---

## Need Signup (Free)

### Email

- [ ] **SendPulse** — sendpulse.com → Settings → API
  - 12,000 emails/month, 400/day
  - Get: Client ID + Client Secret
  - Set in Convex: `SENDPULSE_ID`, `SENDPULSE_SECRET`, `SENDPULSE_FROM_EMAIL`
  - Set in .env.local: same vars

### Semantic Search

- [ ] **Voyage AI** — voyageai.com
  - Free tier for embeddings
  - Get: API key
  - Set in Convex: `VOYAGE_API_KEY`
  - Set in .env.local: `VOYAGE_API_KEY`

### Transcription — Tier 1 (Recurring Monthly Free)

- [ ] **Speechmatics** — speechmatics.com
  - 8 hrs/month free
  - Get: API key
  - Set in bot-service/.env: `SPEECHMATICS_API_KEY`

- [ ] **Gladia** — gladia.io
  - 10 hrs/month free
  - Get: API key
  - Set in bot-service/.env: `GLADIA_API_KEY`

- [ ] **Azure Speech** — portal.azure.com → Create resource → Cognitive Services → Speech
  - 5 hrs/month free
  - Get: Speech resource key + region (e.g. `eastus`)
  - Set in bot-service/.env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`

- [ ] **Google Cloud STT** — console.cloud.google.com → Enable Speech-to-Text API → Credentials → API Key
  - 1 hr/month free
  - Get: API key + project ID
  - Set in bot-service/.env: `GOOGLE_CLOUD_API_KEY`, `GOOGLE_CLOUD_PROJECT_ID`
  - NOTE: This is different from Google OAuth. This is a GCP Cloud API key for transcription, not the OAuth client for sign-in.

### Transcription — Tier 2 (One-Time Credits)

- [ ] **Deepgram** — deepgram.com
  - $200 free credit (~700 hrs) one-time
  - Get: API key
  - Set in bot-service/.env: `DEEPGRAM_API_KEY`

- [ ] **AssemblyAI** — assemblyai.com
  - 185 hrs free one-time
  - Get: API key
  - Set in bot-service/.env: `ASSEMBLYAI_API_KEY`

### AI Providers (Skip for now — revisit when AI features needed)

- [ ] **Anthropic** — console.anthropic.com/settings/keys
  - Pay per token (or use Codex subscription via proxy when allowed)
  - Get: API key
  - Set in Convex: `ANTHROPIC_API_KEY`
  - Optional: `ANTHROPIC_BASE_URL` (for proxy routing)

- [ ] **OpenAI** — platform.openai.com/api-keys
  - Pay per token (or use Codex subscription via proxy — officially allowed)
  - Get: API key
  - Set in Convex: `OPENAI_API_KEY`
  - Optional: `OPENAI_BASE_URL` (for proxy routing via ccproxy)

### Optional Integrations (Skip unless needed)

- [ ] **Slack** — api.slack.com/apps → Create New App
  - Create OAuth App, set redirect URI to Convex site URL
  - Get: Client ID, Client Secret, Signing Secret
  - Set in Convex: `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET`
  - Enables: Slack notifications, link unfurling, slash commands

- [ ] **GitHub OAuth** — github.com/settings/developers → New OAuth App
  - Set callback URL to `https://<convex-deployment>.convex.site/github/callback`
  - Get: Client ID, Client Secret
  - Set in Convex: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - Enables: Linking GitHub repos to projects

---

## After Signup — What to Run

After setting transcription keys in bot-service/.env:
```bash
npx convex run serviceRotation:seedProviders
```
Then flip `isEnabled: true` for each provider in the Convex dashboard.

After setting Convex env vars:
```bash
npx convex env set VAR_NAME "value"
```

---

## Code Changes Needed

- [ ] Make Slack `requireEnv` calls optional — the app crashes if someone hits a Slack endpoint without keys. Add guards like the existing `isSlackOAuthConfigured()` to all Slack code paths.
- [ ] Make GitHub OAuth `requireEnv` calls optional — same crash risk.
- [ ] Make AI `requireEnv` calls optional — `getAnthropicApiKey()` and `getOpenAIApiKey()` throw if not set. Guard with `isAnthropicConfigured()` / `isOpenAIConfigured()` at all call sites.
- [ ] Make `BOT_SERVICE_URL` optional — meeting features should degrade gracefully, not crash.
- [ ] Make `VOYAGE_API_KEY` optional — semantic search should show "not configured" instead of crashing.
- [ ] Make `SENDPULSE_*` optional — email rotation should skip unconfigured providers instead of crashing.
