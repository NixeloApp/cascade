# Integrations

## Overview

Integrations connect the project management platform with external services like GitHub, Slack, calendar apps, and custom webhooks. Good integrations streamline workflows and keep data synchronized across tools.

---

## plane

### Available Integrations

| Integration | Type | Level |
|-------------|------|-------|
| GitHub | OAuth | Workspace + Project |
| Slack | OAuth | Workspace + Project |

### Integration Location

- **Workspace Level**: `/:workspaceSlug/settings/integrations`
- **Project Level**: `/:workspaceSlug/projects/:projectId/settings/features`

### GitHub Integration

**OAuth Flow**:
1. User clicks "Install" on GitHub integration card
2. OAuth popup opens (`useIntegrationPopup` hook)
3. User authorizes in GitHub
4. Callback handles token exchange
5. Integration appears in installed list

**Features**:
- Link repositories to projects
- Track PRs and commits
- Sync issue status with PRs
- Auto-close issues on merge

**Configuration**:
```typescript
// IAppIntegration
{
  id: string
  provider: "github"
  title: string
  author: string
  description: any
  avatar_url: string | null
  webhook_url: string
  webhook_secret: string
  verified: boolean
}

// IWorkspaceIntegration
{
  id: string
  integration: string
  integration_detail: IAppIntegration
  api_token: string
  config: any
  workspace: string
}
```

### Slack Integration

**OAuth Flow**: Similar to GitHub

**Features**:
- Post notifications to channels
- Create issues from Slack
- Update issue status from Slack

### Integration Card UI

**Component**: `SingleIntegrationCard`

**Display**:
- Logo/icon
- Title
- Description
- Installation status (green checkmark if installed)

**Actions**:
- "Install" button (blue) → Opens OAuth popup
- "Uninstall" button (red) → Removes integration
- Permission tooltip for non-admins

**States**:
- Loading during install/uninstall
- Different descriptions based on status

### Webhooks

**Location**: `/:workspaceSlug/settings/webhooks`

**Configuration**:
| Field | Type | Description |
|-------|------|-------------|
| URL | String | Webhook endpoint |
| is_active | Boolean | Enable/disable |
| Event Mode | Enum | "all" or "individual" |

**Available Events**:
- project
- cycle
- module
- issue
- issue_comment

**Secret Key**:
- Generated on creation
- Used for HMAC signature validation
- Displayed once after creation

---

## Cascade

### Available Integrations

| Integration | Type | Level |
|-------------|------|-------|
| GitHub | OAuth | User |
| Google Calendar | OAuth | User |
| Pumble | Webhook | User/Project |
| SSO (SAML/OIDC) | Admin | Organization |

### Integration Location

- **User Level**: `/:orgSlug/settings` → Integrations tab
- **Admin Level**: `/:orgSlug/settings` → Admin tab (SSO)

### GitHub Integration

**Component**: `GitHubIntegration.tsx`

**OAuth Flow**:
1. User clicks "Connect GitHub"
2. OAuth popup window opens
3. User authorizes in GitHub
4. Callback via `window.postMessage()`
5. Token stored (encrypted)

**Connection Data**:
```typescript
// githubConnections
{
  userId: id<"users">
  githubUserId: string
  githubUsername: string
  accessToken: string  // Encrypted
  refreshToken: optional<string>  // Encrypted
  expiresAt: optional<number>
  updatedAt: number
}
```

**Features**:
- Link repositories to projects
- Track PRs and commits
- Display linked repos (`LinkedRepositories.tsx`)
- Secure token encryption

### Google Calendar Integration

**Component**: `GoogleCalendarIntegration.tsx`

**OAuth Flow**: Similar popup-based OAuth

**Connection Data**:
```typescript
// googleCalendarConnections
{
  userId: id<"users">
  providerAccountId: string
  accessToken: string  // Encrypted
  refreshToken: string  // Encrypted
  expiresAt: number
  syncDirection: "both" | "to_cascade" | "from_cascade"
}
```

**Sync Options**:
| Direction | Description |
|-----------|-------------|
| both | Two-way sync |
| to_cascade | Calendar → Cascade only |
| from_cascade | Cascade → Calendar only |

**Features**:
- Sync calendar events
- Create events from issues
- Due date sync
- Bi-directional updates

### Pumble Integration

**Component**: `PumbleIntegration.tsx`

**Type**: Webhook-based (not OAuth)

**Configuration**:
| Field | Type | Validation |
|-------|------|------------|
| Webhook URL | String | Must be pumble.com |
| Name | String | Display name |
| Project | Select | Optional project scope |

**Available Events**:
- `issue.created`
- `issue.updated`
- `issue.assigned`
- `issue.completed`
- `issue.deleted`
- `comment.created`

**UI Pattern**:
- List of configured webhooks
- Toggle enable/disable
- Delete button
- Add webhook modal

### SSO Settings (Admin)

**Component**: `SSOSettings.tsx`

**Connection Types**:
| Type | Description |
|------|-------------|
| SAML | Security Assertion Markup Language |
| OIDC | OpenID Connect |

**Features**:
- Multiple connections per org
- Enable/disable toggle
- Configuration dialogs
- Organization-scoped

**Backend API**:
```typescript
api.sso.list({ organizationId })
api.sso.create({ organizationId, type, name })
api.sso.setEnabled({ connectionId, isEnabled })
api.sso.remove({ connectionId })
```

### API Keys

**Component**: `ApiKeysManager.tsx`

**Key Format**: `sk_casc_*`

**Features**:
- Cryptographically secure generation
- Scoped permissions (role-based)
- Rate limiting configuration
- Usage statistics
- Key rotation
- Expiration dates
- Project-specific or global scope

**Available Scopes**:
```typescript
const SCOPES = [
  "issues:read", "issues:write", "issues:delete",
  "projects:read", "projects:write",
  "comments:read", "comments:write",
  "documents:read", "documents:write",
  "search:read"
];
```

**Data Model**:
```typescript
// apiKeys
{
  userId: id<"users">
  name: string
  keyHash: string  // Only hash stored
  keyPrefix: string  // For display
  scopes: array<string>
  projectId: optional<id<"projects">>
  rateLimit: number
  isActive: boolean
  lastUsedAt: optional<number>
  usageCount: number
  expiresAt: optional<number>
  rotatedFromId: optional<id<"apiKeys">>
  rotatedAt: optional<number>
  revokedAt: optional<number>
}

// apiUsageLogs
{
  apiKeyId: id<"apiKeys">
  userId: id<"users">
  method: string
  endpoint: string
  statusCode: number
  responseTime: number
  userAgent: optional<string>
  ipAddress: optional<string>
  error: optional<string>
}
```

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| GitHub | Yes (OAuth) | Yes (OAuth) | tie |
| Slack | Yes (OAuth) | No | plane |
| Google Calendar | No | Yes | Cascade |
| Pumble/Chat | No | Yes (webhook) | Cascade |
| SSO (SAML) | Instance-level | Per-org | Cascade |
| SSO (OIDC) | Instance-level | Per-org | Cascade |
| Webhooks | Yes (5 events) | Yes (6 events) | tie |
| Webhook secret | Yes | No | plane |
| API keys | User-level | User + project | Cascade |
| Key scopes | No | Yes (granular) | Cascade |
| Key rotation | No | Yes | Cascade |
| Usage tracking | No | Yes | Cascade |
| Rate limiting | No | Yes (configurable) | Cascade |
| OAuth popup | Yes | Yes | tie |
| Token encryption | Unknown | Yes | Cascade |
| Integration level | Workspace | User | preference |
| Project linking | Yes | Yes | tie |
| Sync direction | One-way | Configurable | Cascade |

---

## Recommendations

1. **Priority 1**: Add Slack integration
   - OAuth-based connection
   - Channel notifications
   - Create issues from Slack
   - Popular team chat platform

2. **Priority 2**: Add webhook secret keys
   - Generate secret on webhook creation
   - HMAC signature validation
   - Secure webhook delivery

3. **Priority 3**: Add more webhook events
   - document.created
   - document.updated
   - sprint.started
   - sprint.completed
   - project.created

4. **Priority 4**: Add integration marketplace
   - Browse available integrations
   - Install/uninstall UI
   - Integration categories
   - Featured integrations

5. **Priority 5**: Add Jira import
   - Import issues from Jira
   - Map statuses and fields
   - Historical data migration

---

## Cascade Strengths

1. **Google Calendar Sync**: Bi-directional calendar integration
2. **SSO Per-Organization**: Each org configures own SAML/OIDC
3. **API Key Scopes**: Granular permission control
4. **Key Rotation**: Secure key management
5. **Usage Tracking**: Monitor API usage and activity
6. **Rate Limiting**: Configurable per-key limits
7. **Token Encryption**: OAuth tokens encrypted at rest
8. **Sync Direction Control**: Choose sync behavior

---

## Implementation: Slack Integration

```typescript
// OAuth initiation
export function initiateSlackOAuth() {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/integrations/slack/callback`;
  const scopes = [
    "channels:read",
    "chat:write",
    "commands",
    "incoming-webhook",
  ].join(",");

  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("redirect_uri", redirectUri);

  // Open popup
  const popup = window.open(url.toString(), "slack_oauth", "width=600,height=700");

  // Listen for callback
  window.addEventListener("message", (event) => {
    if (event.data.type === "SLACK_OAUTH_SUCCESS") {
      saveSlackConnection(event.data.code);
      popup?.close();
    }
  });
}

// Backend connection storage
export const connectSlack = mutation({
  args: {
    code: v.string(),
    teamId: v.string(),
    teamName: v.string(),
    incomingWebhookUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Exchange code for token (in action)
    const tokens = await ctx.runAction(
      internal.slack.exchangeCode,
      { code: args.code }
    );

    // Store connection
    await ctx.db.insert("slackConnections", {
      userId,
      teamId: args.teamId,
      teamName: args.teamName,
      accessToken: encrypt(tokens.access_token),
      incomingWebhookUrl: args.incomingWebhookUrl,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Send notification to Slack
export const sendSlackNotification = internalAction({
  args: {
    userId: v.id("users"),
    message: v.string(),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.slack.getConnection,
      { userId: args.userId }
    );

    if (!connection) return;

    const webhookUrl = connection.incomingWebhookUrl;

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: args.message,
        channel: args.channel,
      }),
    });
  },
});
```

---

## Implementation: Webhook Secrets

```typescript
// Generate webhook with secret
export const createWebhook = mutation({
  args: {
    url: v.string(),
    name: v.string(),
    events: v.array(v.string()),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.object({
    webhookId: v.id("webhooks"),
    secret: v.string(), // Only returned once
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate cryptographically secure secret
    const secret = generateSecureToken(32); // 32 bytes = 64 hex chars
    const secretHash = await hashSecret(secret);

    const webhookId = await ctx.db.insert("webhooks", {
      userId,
      url: args.url,
      name: args.name,
      events: args.events,
      projectId: args.projectId,
      secretHash, // Store hash only
      isActive: true,
      createdAt: Date.now(),
    });

    // Return secret once (never stored in plain text)
    return { webhookId, secret };
  },
});

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest("hex")}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Send webhook with signature
export const sendWebhook = internalAction({
  args: {
    webhookId: v.id("webhooks"),
    event: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.runQuery(
      internal.webhooks.get,
      { webhookId: args.webhookId }
    );

    if (!webhook || !webhook.isActive) return;

    const body = JSON.stringify({
      event: args.event,
      payload: args.payload,
      timestamp: Date.now(),
    });

    // Create signature
    const hmac = crypto.createHmac("sha256", webhook.secretHash);
    hmac.update(body);
    const signature = `sha256=${hmac.digest("hex")}`;

    await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": args.event,
      },
      body,
    });
  },
});
```

---

## Screenshots/References

### plane
- Integrations page: `~/Desktop/plane/apps/web/app/[workspaceSlug]/(settings)/settings/(workspace)/integrations/page.tsx`
- Integration card: `~/Desktop/plane/apps/web/core/components/integration/single-integration-card.tsx`
- Integration popup hook: `~/Desktop/plane/packages/hooks/src/use-integration-popup.tsx`
- Webhooks: `~/Desktop/plane/apps/web/app/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/`

### Cascade
- GitHub: `~/Desktop/cascade/src/components/Settings/GitHubIntegration.tsx`
- Google Calendar: `~/Desktop/cascade/src/components/Settings/GoogleCalendarIntegration.tsx`
- Pumble: `~/Desktop/cascade/src/components/Settings/PumbleIntegration.tsx`
- SSO: `~/Desktop/cascade/src/components/Settings/SSOSettings.tsx`
- API keys: `~/Desktop/cascade/src/components/Settings/ApiKeysManager.tsx`
- Backend: `~/Desktop/cascade/convex/github.ts`, `~/Desktop/cascade/convex/googleCalendar.ts`
