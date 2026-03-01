# Single Sign-On (SSO)

## Overview

Single Sign-On enables enterprise authentication through identity providers like Okta, Azure AD, or custom SAML/OIDC providers. SSO simplifies user management and enforces organizational security policies.

---

## plane

### SSO Support Status

**SAML**: NOT IMPLEMENTED
**OIDC**: NOT IMPLEMENTED
**LDAP**: NOT IMPLEMENTED

### Available OAuth Providers

Plane uses OAuth providers as a simpler alternative to enterprise SSO:

| Provider | Status | Notes |
|----------|--------|-------|
| Google OAuth | Available | Standard OAuth 2.0 |
| GitHub OAuth | Available | Supports org filtering |
| GitLab OAuth | Available | OAuth 2.0 |
| Gitea OAuth | Available | Self-hosted Git |

### GitHub Organization Filtering

**Feature**: Restrict GitHub OAuth to specific organization members

**Configuration**:
- Set `GITHUB_ORGANIZATION_ID` environment variable
- Only users who are members of that GitHub org can sign in
- Non-members receive `GITHUB_USER_NOT_IN_ORG` error

**Flow**:
1. User attempts GitHub OAuth sign-in
2. Backend requests `read:org` scope
3. Fetches user's organization memberships
4. Validates against configured org ID
5. Rejects if user not in organization

### OAuth Provider Configuration

**Google**:
```typescript
{
  auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
  token_url: "https://oauth2.googleapis.com/token",
  userinfo_url: "https://www.googleapis.com/oauth2/v2/userinfo",
  scope: "userinfo.email userinfo.profile"
}
```

**GitHub**:
```typescript
{
  auth_url: "https://github.com/login/oauth/authorize",
  token_url: "https://github.com/login/oauth/access_token",
  userinfo_url: "https://api.github.com/user",
  scope: "read:user user:email read:org"
}
```

### Instance Configuration

**Environment Variables**:
- `IS_GOOGLE_ENABLED`: Enable Google OAuth
- `IS_GITHUB_ENABLED`: Enable GitHub OAuth
- `IS_GITLAB_ENABLED`: Enable GitLab OAuth
- `IS_GITEA_ENABLED`: Enable Gitea OAuth
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Similar for GitLab and Gitea

### Limitations

- No enterprise SSO (SAML/OIDC)
- Configuration at instance level (not per-workspace)
- No domain-based SSO routing
- No Just-in-Time provisioning beyond OAuth

---

## Cascade

### SSO Support Status

**SAML 2.0**: IMPLEMENTED (admin UI)
**OIDC**: IMPLEMENTED (admin UI)
**LDAP**: NOT IMPLEMENTED

### SSO Configuration Location

- **UI**: `/:orgSlug/settings` → Admin tab
- **Component**: `SSOSettings.tsx`
- **Backend**: `convex/sso.ts`

### SAML Configuration

**Supported Fields**:

| Field | Required | Description |
|-------|----------|-------------|
| `idpMetadataUrl` | Optional | Metadata file URL |
| `idpMetadataXml` | Optional | Metadata XML content |
| `idpEntityId` | Required | Identity Provider Entity ID |
| `idpSsoUrl` | Required* | Single Sign-On URL |
| `idpCertificate` | Optional | IdP certificate (PEM) |
| `spEntityId` | Optional | Service Provider Entity ID |
| `spAcsUrl` | Optional | Assertion Consumer Service URL |
| `nameIdFormat` | Optional | NameID format |
| `signRequest` | Optional | Sign SAML requests |

*Required if no metadata URL provided

**Enable Validation**:
- Must have `idpEntityId`
- Must have either `idpMetadataUrl` or `idpSsoUrl`

### OIDC Configuration

**Supported Fields**:

| Field | Required | Description |
|-------|----------|-------------|
| `issuer` | Required | OIDC Provider issuer URL |
| `clientId` | Required | Client ID from IdP |
| `clientSecret` | Required | Client secret (secure storage) |
| `scopes` | Optional | Requested scopes array |
| `authorizationUrl` | Optional | Authorization endpoint |
| `tokenUrl` | Optional | Token endpoint |
| `userInfoUrl` | Optional | User info endpoint |

**Enable Validation**:
- Must have `clientId`
- Must have `issuer`

### Database Schema

```typescript
// ssoConnections table
{
  organizationId: Id<"organizations">
  type: "saml" | "oidc"
  name: string
  isEnabled: boolean
  samlConfig?: {
    idpMetadataUrl?: string
    idpMetadataXml?: string
    idpEntityId?: string
    idpSsoUrl?: string
    idpCertificate?: string
    spEntityId?: string
    spAcsUrl?: string
    nameIdFormat?: string
    signRequest?: boolean
  }
  oidcConfig?: {
    issuer?: string
    clientId?: string
    clientSecret?: string  // Encrypted
    scopes?: string[]
    authorizationUrl?: string
    tokenUrl?: string
    userInfoUrl?: string
  }
  verifiedDomains?: string[]
  createdBy: Id<"users">
  createdAt: number
  updatedAt: number
}

// ssoDomains table
{
  domain: string  // lowercase, normalized
  ssoConnectionId: Id<"ssoConnections">
  organizationId: Id<"organizations">
  createdAt: number
}
```

### Verified Domains

**Purpose**: Enable automatic SSO routing based on email domain

**Configuration**:
- Comma-separated list in UI
- Normalized to lowercase
- Stored in both connection and separate table

**Sign-In Flow** (conceptual):
1. User enters email
2. Extract domain from email
3. Query `ssoDomains` for matching domain
4. If found → redirect to SSO provider
5. If not found → standard authentication

### Admin Interface

**Features**:
- List all SSO connections
- Create SAML or OIDC connection
- View/edit configuration
- Add verified email domains
- Enable/disable connections
- Delete connections

**Access Control**:
- Admin or owner role required
- Per-operation authorization checks
- Throws `forbidden()` on unauthorized access

### Security Features

1. **Secret Protection**: OIDC client secrets never returned in API
2. **Admin-Only Access**: All SSO operations require admin role
3. **Domain Uniqueness**: Prevents conflicts across organizations
4. **Connection Validation**: Can't enable without complete config

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| SAML 2.0 | No | Yes (admin UI) | Cascade |
| OIDC | No | Yes (admin UI) | Cascade |
| LDAP | No | No | tie |
| Google OAuth | Yes | Yes | tie |
| GitHub OAuth | Yes | No | plane |
| GitLab OAuth | Yes | No | plane |
| Per-org configuration | No | Yes | Cascade |
| Domain-based routing | No | Yes | Cascade |
| Multiple connections | N/A | Yes | Cascade |
| Enable/disable toggle | N/A | Yes | Cascade |
| GitHub org filtering | Yes | No | plane |
| Secret encryption | Unknown | Yes | Cascade |
| Configuration level | Instance | Organization | Cascade |

---

## Recommendations

1. **Priority 1**: Implement SAML sign-in flow
   - Parse SAML assertions
   - Validate signatures
   - Create user from attributes
   - Currently only config UI exists

2. **Priority 2**: Implement OIDC sign-in flow
   - Authorization code flow
   - Token validation
   - User info retrieval
   - Auto-create users

3. **Priority 3**: Add domain verification
   - Prove domain ownership
   - DNS TXT record or email verification
   - Required for production SSO

4. **Priority 4**: Add Just-in-Time provisioning
   - Auto-create users on first SSO login
   - Map IdP attributes to user fields
   - Auto-assign to organization

5. **Priority 5**: Add SCIM support
   - User provisioning/deprovisioning
   - Group sync
   - Enterprise directory integration

---

## Cascade Strengths

1. **Per-Organization SSO**: Each org configures own IdP
2. **Multiple Connections**: Support multiple IdPs per org
3. **Domain Routing**: Automatic SSO based on email domain
4. **Enable/Disable Toggle**: Control without deletion
5. **Secret Encryption**: OIDC secrets encrypted at rest
6. **Admin Controls**: Proper authorization checks

---

## Implementation: SAML Sign-In Flow

```typescript
// convex/sso.ts - Add sign-in handler

export const initiateSamlLogin = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const domain = args.email.split("@")[1];

    // Find SSO connection for domain
    const ssoDomain = await ctx.runQuery(internal.sso.getForDomain, {
      domain,
    });

    if (!ssoDomain || !ssoDomain.connection.isEnabled) {
      return { sso: false };
    }

    const connection = ssoDomain.connection;
    if (connection.type !== "saml") {
      return { sso: false, type: "oidc" };
    }

    // Generate SAML AuthnRequest
    const samlRequest = generateSamlAuthnRequest({
      issuer: connection.samlConfig.spEntityId,
      destination: connection.samlConfig.idpSsoUrl,
      acsUrl: connection.samlConfig.spAcsUrl,
      nameIdFormat: connection.samlConfig.nameIdFormat,
      signRequest: connection.samlConfig.signRequest,
    });

    // Store request for validation
    const requestId = await ctx.runMutation(internal.sso.storeSamlRequest, {
      requestId: samlRequest.id,
      connectionId: connection._id,
      email: args.email,
    });

    return {
      sso: true,
      type: "saml",
      redirectUrl: buildSamlRedirectUrl(
        connection.samlConfig.idpSsoUrl,
        samlRequest
      ),
    };
  },
});

// SAML callback handler
export const handleSamlCallback = httpAction(async (ctx, request) => {
  const formData = await request.formData();
  const samlResponse = formData.get("SAMLResponse") as string;

  // Decode and validate SAML response
  const decoded = Buffer.from(samlResponse, "base64").toString();
  const assertion = parseSamlAssertion(decoded);

  // Validate signature
  const connection = await ctx.runQuery(internal.sso.getById, {
    connectionId: assertion.inResponseTo.connectionId,
  });

  const isValid = validateSamlSignature(
    decoded,
    connection.samlConfig.idpCertificate
  );

  if (!isValid) {
    return new Response("Invalid SAML signature", { status: 401 });
  }

  // Create or update user
  const email = assertion.nameId;
  const attributes = assertion.attributes;

  const userId = await ctx.runMutation(internal.users.findOrCreateByEmail, {
    email,
    firstName: attributes.firstName,
    lastName: attributes.lastName,
    organizationId: connection.organizationId,
  });

  // Create session
  const sessionToken = await ctx.runMutation(internal.auth.createSession, {
    userId,
  });

  // Redirect to app with session
  return Response.redirect(
    `${process.env.SITE_URL}/app?token=${sessionToken}`
  );
});
```

---

## Implementation: OIDC Sign-In Flow

```typescript
// convex/sso.ts - OIDC handlers

export const initiateOidcLogin = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const domain = args.email.split("@")[1];

    const ssoDomain = await ctx.runQuery(internal.sso.getForDomain, {
      domain,
    });

    if (!ssoDomain || ssoDomain.connection.type !== "oidc") {
      return { sso: false };
    }

    const connection = ssoDomain.connection;
    const config = connection.oidcConfig;

    // Generate state and nonce
    const state = generateSecureToken(32);
    const nonce = generateSecureToken(32);

    // Store state for validation
    await ctx.runMutation(internal.sso.storeOidcState, {
      state,
      nonce,
      connectionId: connection._id,
      email: args.email,
    });

    // Build authorization URL
    const authUrl = new URL(
      config.authorizationUrl || `${config.issuer}/authorize`
    );
    authUrl.searchParams.set("client_id", config.clientId);
    authUrl.searchParams.set("redirect_uri", `${process.env.SITE_URL}/api/auth/oidc/callback`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", (config.scopes || ["openid", "email", "profile"]).join(" "));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", nonce);

    return {
      sso: true,
      type: "oidc",
      redirectUrl: authUrl.toString(),
    };
  },
});

// OIDC callback handler
export const handleOidcCallback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Validate state
  const storedState = await ctx.runQuery(internal.sso.getOidcState, { state });
  if (!storedState) {
    return new Response("Invalid state", { status: 401 });
  }

  const connection = await ctx.runQuery(internal.sso.getById, {
    connectionId: storedState.connectionId,
  });

  const config = connection.oidcConfig;

  // Exchange code for tokens
  const tokenResponse = await fetch(
    config.tokenUrl || `${config.issuer}/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.SITE_URL}/api/auth/oidc/callback`,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    }
  );

  const tokens = await tokenResponse.json();

  // Get user info
  const userInfoResponse = await fetch(
    config.userInfoUrl || `${config.issuer}/userinfo`,
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  const userInfo = await userInfoResponse.json();

  // Create or update user
  const userId = await ctx.runMutation(internal.users.findOrCreateByEmail, {
    email: userInfo.email,
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
    organizationId: connection.organizationId,
  });

  // Create session
  const sessionToken = await ctx.runMutation(internal.auth.createSession, {
    userId,
  });

  return Response.redirect(
    `${process.env.SITE_URL}/app?token=${sessionToken}`
  );
});
```

---

## Screenshots/References

### plane
- OAuth providers: `~/Desktop/plane/apps/api/plane/authentication/provider/oauth/`
- Instance config: `~/Desktop/plane/apps/api/plane/license/api/views/instance.py`
- OAuth adapter: `~/Desktop/plane/apps/api/plane/authentication/adapter/oauth.py`

### Cascade
- SSO settings: `~/Desktop/cascade/src/components/Settings/SSOSettings.tsx`
- Backend: `~/Desktop/cascade/convex/sso.ts`
- Schema: `~/Desktop/cascade/convex/schema.ts` (ssoConnections, ssoDomains)
