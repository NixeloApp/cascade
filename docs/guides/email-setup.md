# Email Setup Guide

## Quick Start

All 3 email providers are required. The system rotates between them to maximize free tier usage:

| Provider  | Free Tier              | Priority    |
|-----------|------------------------|-------------|
| SendPulse | 12,000/month (400/day) | 1 (highest) |
| Mailtrap  | 4,000/month (150/day)  | 2           |
| Resend    | 3,000/month (100/day)  | 3           |

**Total free capacity: 19,000 emails/month**

For E2E testing, use Mailtrap in sandbox mode (emails go to inbox, readable via API).

## Development Setup (Resend)

### 1. Sign Up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Sign up (free, no credit card required)
3. Verify your email

### 2. Get Your API Key

1. Dashboard → API Keys → Create API Key
2. Copy the key (starts with `re_`)

### 3. Set Environment Variables

In `.env.local` (see `.env.example` for all options):
- `RESEND_API_KEY` - your API key
- `RESEND_FROM_EMAIL` - use `dev@resend.dev` for testing

### 4. Test It

```bash
pnpm convex dev
# Trigger a mention or assignment to send a test email
```

## Production Setup (SendPulse)

### 1. Sign Up for SendPulse

1. Go to [https://sendpulse.com](https://sendpulse.com)
2. Sign up for a free account

### 2. Get API Credentials

1. Go to Settings → API
2. Copy your ID and Secret

### 3. Set Production Environment Variables

In Convex Dashboard → Settings → Environment Variables:
- `EMAIL_PROVIDER=sendpulse`
- `SENDPULSE_ID` / `SENDPULSE_SECRET` - your credentials
- `SENDPULSE_FROM_EMAIL` - your verified sender
- `SITE_URL` - your production domain

### 4. Deploy

```bash
pnpm convex deploy
```

## Provider Selection Logic

The system automatically rotates between providers based on free tier usage:

| Provider  | Free Tier              | Priority    |
|-----------|------------------------|-------------|
| SendPulse | 12,000/month (400/day) | 1 (highest) |
| Mailtrap  | 4,000/month (150/day)  | 2           |
| Resend    | 3,000/month (100/day)  | 3           |

**Total free capacity: 19,000 emails/month**

The system:
1. Selects provider with free capacity remaining (both daily AND monthly)
2. Tracks usage per provider per day and per month
3. Falls back to next provider when limits reached
4. Uses first provider (paid) when all free tiers exhausted

## E2E Testing Setup (Mailtrap)

Mailtrap supports two modes:
- **sandbox**: Emails go to Mailtrap inbox (for dev/E2E testing) - readable via API
- **production**: Emails delivered to real recipients

For E2E tests, use sandbox mode. Playwright can read emails via API to extract OTP codes.

### Why Mailtrap for E2E?

| Provider | Send Email | Read Email (API) | Real Delivery |
|----------|------------|------------------|---------------|
| Resend | ✅ | ❌ | ✅ |
| SendPulse | ✅ | ❌ | ✅ |
| Mailtrap | ✅ | ✅ (sandbox) | ✅ (production) |

For E2E tests, Playwright needs to:
1. Trigger signup → OTP email sent
2. **Read the email** → Extract OTP code
3. Enter OTP → Complete verification

Only Mailtrap provides the API to read emails.

### Setup

1. **Sign up:** [https://mailtrap.io](https://mailtrap.io) (free tier: 4,000/month, 150/day)
2. **Get credentials:**
   - API Token: Settings → API Tokens
   - Inbox ID: From inbox URL
   - Account ID: From account URL

3. **Set environment variables:**
```bash
MAILTRAP_MODE=sandbox
MAILTRAP_API_TOKEN=your_api_token
MAILTRAP_INBOX_ID=your_inbox_id
MAILTRAP_ACCOUNT_ID=your_account_id  # For E2E inbox reading
MAILTRAP_FROM_EMAIL="Nixelo <test@nixelo.com>"
```

### How It Works

When Mailtrap is configured and selected by the rotation system:
1. **`sendEmail()`** routes to Mailtrap provider
2. Email lands in Mailtrap sandbox inbox
3. E2E tests use `e2e/utils/mailtrap.ts` to read inbox via API
4. OTP code extracted and entered in test

See [E2E Testing Docs](../testing/e2e.md#mailtrap-otp-verification) for Playwright usage.

## Provider Rotation

The email system integrates with `serviceProviders` and `serviceUsage` tables to automatically rotate between providers based on free tier usage.

### How It Works

1. System queries available providers
2. Checks free tier remaining for each
3. Selects provider with most free capacity
4. Falls back to paid tier when free exhausted

### Enable Provider Rotation

Set up multiple providers in environment variables:

```bash
# Primary (checked first)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Nixelo <notifications@yourdomain.com>

# Secondary (fallback)
SENDPULSE_ID=your_id
SENDPULSE_SECRET=your_secret
SENDPULSE_FROM_EMAIL=Nixelo <notifications@yourdomain.com>

# Tertiary
MAILGUN_API_KEY=key-xxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
```

## Testing

### Preview Emails Locally

```bash
# Start React Email development server
npx react-email dev
```

Visit http://localhost:3000 to preview all email templates.

### Send Test Email

Create a test action in Convex:

```typescript
export const testEmail = action({
  args: { to: v.string() },
  handler: async (ctx, args) => {
    return await sendEmail({
      to: args.to,
      subject: "Test Email from Nixelo",
      html: "<p>This is a test email!</p>",
    });
  },
});
```

### Test Different Providers

```bash
# Test Resend (development)
export EMAIL_PROVIDER=""
pnpm convex dev

# Test SendPulse (simulate production)
export EMAIL_PROVIDER=sendpulse
pnpm convex dev
```

## Domain Verification

For production emails to be delivered reliably:

### Resend
1. Dashboard → Domains → Add Domain
2. Add DNS records (SPF, DKIM, DMARC)
3. Wait for verification

### SendPulse
1. Settings → Sender Addresses
2. Verify your sender email
3. Or verify entire domain via DNS

### Mailgun
1. Sending → Domains → Add New Domain
2. Add DNS records
3. Verify domain

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SITE_URL` | Yes | Application URL for email links |
| `SENDPULSE_ID` | Yes | SendPulse client ID |
| `SENDPULSE_SECRET` | Yes | SendPulse client secret |
| `SENDPULSE_FROM_EMAIL` | Yes | From address |
| `MAILTRAP_MODE` | Yes | 'sandbox' or 'production' |
| `MAILTRAP_API_TOKEN` | Yes | Mailtrap API token |
| `MAILTRAP_INBOX_ID` | Sandbox only | Mailtrap inbox ID |
| `MAILTRAP_FROM_EMAIL` | Yes | From address |
| `MAILTRAP_ACCOUNT_ID` | E2E only | For reading inbox via API |
| `RESEND_API_KEY` | Yes | Resend API key |
| `RESEND_FROM_EMAIL` | Yes | From address |

## Troubleshooting

### Emails not sending in development

- Check `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Verify domain (or use `resend.dev` for testing)

### Emails not sending in production

- Check `EMAIL_PROVIDER` matches your setup
- Check provider-specific credentials are set
- Check provider dashboard for API errors
- Verify sender email/domain with provider

### Wrong provider being used

- Check `EMAIL_PROVIDER` environment variable
- Restart Convex after changing env vars
- Check Convex logs for which provider initialized

## FAQ

**Q: Do I need all 3 providers configured?**
A: Yes, all 3 providers are required. The system will fail at runtime if any provider credentials are missing.

**Q: How does provider rotation work?**
A: The system tracks daily and monthly usage per provider. It selects the highest-priority provider with free capacity remaining.

**Q: What happens when all free tiers are exhausted?**
A: The system falls back to the first provider (SendPulse) which will result in paid usage.

---

**Related Documentation:**
- [Docs Index](../README.md)
- [Convex Email Module](../../convex/email/)

---

*Last Updated: 2025-12-01*
