# Environment Variables Guide

This guide explains all environment variables used in Nixelo, where they're set, and how they're used.

---

## Overview: 3 Separate Environments

Nixelo uses **3 separate sets** of environment variables for different parts of the system:

| Set | File | Where It Runs | How to Set |
|-----|------|---------------|------------|
| **Convex Backend** | `.env.local` | Convex cloud | `npx convex env set VAR value` or Convex Dashboard |
| **Vite Frontend** | `.env.local` | Browser (bundled) | Only `VITE_*` vars are exposed |
| **Bot Service** | `bot-service/.env` | Your server | Standard `.env` file |

### Why Separate?

- **Convex + Vite** share `.env.local` but Convex vars must be pushed to the cloud
- **Bot Service** is a standalone Node.js server (runs on different infrastructure)
- **Security**: Each system only has access to the keys it needs

---

## Quick Setup

```bash
# 1. Copy example files
cp .env.example .env.local
cp bot-service/.env.example bot-service/.env

# 2. Fill in values in both files

# 3. Push Convex vars to cloud (required!)
npx convex env set SITE_URL "http://localhost:5555"
npx convex env set RESEND_API_KEY "re_xxx"
# ... etc
```

---

## SITE_URL vs CONVEX_SITE_URL

This is the most important distinction:

| Variable | Value | Used For |
|----------|-------|----------|
| `SITE_URL` | Your frontend URL (e.g., `http://localhost:5555`) | Email links, invite links - URLs users click |
| `CONVEX_SITE_URL` | Convex backend URL (auto-set by Convex) | OAuth callbacks, bot webhooks, JWT validation |

**Rule of thumb:**
- User clicks a link → `SITE_URL`
- Backend-to-backend callback → `CONVEX_SITE_URL`

**Never set `CONVEX_SITE_URL` manually** - Convex provides it automatically.

---

## Convex Backend Variables

These run on Convex's servers. Set via `npx convex env set` or the Convex Dashboard.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `SITE_URL` | Frontend URL for email/invite links | `http://localhost:5555` |

### Authentication (Auto-Generated)

| Variable | Description | How to Set |
|----------|-------------|------------|
| `JWT_PRIVATE_KEY` | RSA private key for signing JWTs | `cat key.pem \| npx convex env set JWT_PRIVATE_KEY` |
| `JWKS` | JSON Web Key Set with public key | `cat jwks.json \| npx convex env set JWKS` |

**Note:** These are created by `npx @convex-dev/auth`. Generate fresh keys for each environment.

### Google OAuth (Optional)

| Variable | Description |
|----------|-------------|
| `AUTH_GOOGLE_ID` | Google OAuth client ID (for "Sign in with Google") |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `GOOGLE_CLIENT_ID` | Same as AUTH_GOOGLE_ID (for Calendar sync) |
| `GOOGLE_CLIENT_SECRET` | Same as AUTH_GOOGLE_SECRET |

### AI Features (Optional)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key for AI chat/suggestions |
| `VOYAGE_API_KEY` | Voyage AI key for semantic search embeddings |

### Email (Optional - need at least one for notifications)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender address (e.g., `Nixelo <notifications@yourdomain.com>`) |
| `SENDGRID_API_KEY` | SendGrid API key (alternative) |
| `SENDGRID_FROM_EMAIL` | SendGrid sender address |
| `MAILGUN_API_KEY` | Mailgun API key (alternative) |
| `MAILGUN_DOMAIN` | Mailgun domain (e.g., `mg.yourdomain.com`) |
| `MAILGUN_FROM_EMAIL` | Mailgun sender address |
| `MAILGUN_REGION` | Mailgun region (`us` or `eu`) |
| `SENDPULSE_ID` | SendPulse client ID (alternative) |
| `SENDPULSE_SECRET` | SendPulse client secret |
| `SENDPULSE_FROM_EMAIL` | SendPulse sender address |

### Bot Service Connection (Optional)

| Variable | Description |
|----------|-------------|
| `BOT_SERVICE_URL` | URL of your bot service (e.g., `http://localhost:4444`) |
| `BOT_SERVICE_API_KEY` | Shared secret for authenticating with bot service |

---

## Vite Frontend Variables

These are bundled into the browser JavaScript. **Only `VITE_*` variables are exposed.**

| Variable | Description |
|----------|-------------|
| `VITE_CONVEX_URL` | Convex deployment URL (auto-set by `npx convex dev`) |
| `VITE_PUBLIC_POSTHOG_KEY` | PostHog analytics key |
| `VITE_PUBLIC_POSTHOG_HOST` | PostHog host URL |

**Security:** Never put secrets in `VITE_*` variables - they're visible to users!

---

## Auto-Set Variables (Don't Touch)

These are set automatically by Convex or during setup:

| Variable | Description | Set By |
|----------|-------------|--------|
| `CONVEX_DEPLOYMENT` | Which Convex project to use | `npx convex dev` |
| `CONVEX_DEPLOY_KEY` | CI/CD deployment authentication | Convex Dashboard |
| `CONVEX_SITE_URL` | Convex backend URL (e.g., `https://xxx.convex.site`) | Convex (auto) |

**Note:** `CONVEX_SITE_URL` is a built-in Convex variable - never set it manually.

---

## Bot Service Variables

These run on your own server (where the meeting bot runs). Set in `bot-service/.env`.

### Required

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `4444`) |
| `BOT_SERVICE_API_KEY` | Must match the key in Convex env |
| `CONVEX_URL` | Convex deployment URL for callbacks |

### AI Summary

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key for meeting summaries |

### Transcription Providers (need at least one)

| Variable | Description |
|----------|-------------|
| `SPEECHMATICS_API_KEY` | Speechmatics transcription |
| `GLADIA_API_KEY` | Gladia transcription |
| `AZURE_SPEECH_KEY` | Azure Speech-to-Text |
| `AZURE_SPEECH_REGION` | Azure region (e.g., `eastus`) |
| `GOOGLE_CLOUD_API_KEY` | Google Cloud Speech-to-Text (Option 1: API key) |
| `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud project ID (Option 2: with ADC) |

---

## Setting Multiline Values

For multiline values like `JWT_PRIVATE_KEY`, use stdin:

```bash
# From file
cat jwt_private_key.pem | npx convex env set JWT_PRIVATE_KEY

# From heredoc
npx convex env set JWT_PRIVATE_KEY << 'EOF'
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEF...
-----END PRIVATE KEY-----
EOF
```

**Do not** use quotes around multiline values - they get truncated.

---

## Production Checklist

Before deploying to production:

- [ ] Update `SITE_URL` to your production domain
- [ ] Generate fresh `JWT_PRIVATE_KEY` and `JWKS` for production
- [ ] Set all Convex env vars via dashboard or CLI
- [ ] Configure email provider with verified domain
- [ ] Update Google OAuth redirect URIs for production domain
- [ ] Set bot service env vars on your bot server

---

## Troubleshooting

### "ASN.1 DER message is incomplete"
JWT_PRIVATE_KEY is malformed. Regenerate keys:
```bash
# Generate new RSA key pair
node -e "const crypto = require('crypto'); const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } }); console.log(privateKey);" > jwt_private_key.pem

# Set via stdin
cat jwt_private_key.pem | npx convex env set JWT_PRIVATE_KEY
```

### OAuth callback fails / "Sent back to /"
Check that `auth.config.ts` uses `CONVEX_SITE_URL` (not `SITE_URL`) for the domain.

### Email links go to wrong URL
Check that `SITE_URL` is set correctly in Convex env vars.

### Bot service can't reach Convex
Check that `CONVEX_URL` in bot service matches your Convex deployment URL.

---

*Last Updated: 2025-11-28*
