# Authentication & User Management

This document describes the authentication and user management features in Nixelo.

## Authentication Methods

Nixelo supports multiple authentication methods:

### 1. Email & Password

Users can sign up and sign in using their email and password.

**Sign Up Flow:**

1. User enters email and password on sign-in page
2. Clicks "Sign up" button
3. Account is created automatically
4. User is logged in

**Sign In Flow:**

1. User enters email and password
2. Clicks "Sign in" button
3. User is logged in

**Password Reset Flow:**

1. User clicks "Forgot password?" on sign-in page
2. User enters their email address
3. System sends an 8-digit OTP code via email
4. User enters the code and their new password
5. Password is updated and user can sign in

**Configuration Required for Password Reset:**

- `RESEND_API_KEY` - Resend API key for sending emails
- `RESEND_FROM_EMAIL` - Verified sender email (e.g., `Nixelo <notifications@nixelo.com>`)

### 2. Google OAuth

Users can sign in using their Google account.

**Configuration Required:**
To enable Google OAuth, you need to:

1. Create a Google Cloud Project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add these environment variables to your Convex deployment:
   - `AUTH_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
   - `AUTH_GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret

**Sign In Flow:**

1. User clicks "Sign in with Google" button
2. Redirected to Google for authentication
3. User grants permissions
4. Redirected back to Nixelo and logged in

### 3. SSO (SAML/OIDC)

Organizations can configure Single Sign-On using SAML 2.0 or OpenID Connect.

**Configuration (Organization Admin):**

1. Navigate to **Settings → Organization → SSO**
2. Click **"Add SSO Connection"**
3. Choose type: **SAML** or **OIDC**
4. Configure identity provider settings:
   - **SAML**: IdP Entity ID, SSO URL, Certificate, Metadata URL
   - **OIDC**: Issuer URL, Client ID, Client Secret, Scopes
5. Add verified domains for automatic SSO routing
6. Enable the connection

**Sign In Flow:**

1. User enters email on sign-in page
2. System detects SSO-enabled domain
3. User is redirected to identity provider
4. After IdP authentication, user is redirected back and logged in

**Domain Routing:**

SSO connections can be associated with email domains. When a user enters an email with a verified domain, they are automatically routed to the correct SSO provider.

## Two-Factor Authentication (2FA)

Users can enable TOTP-based two-factor authentication for additional security.

### Enabling 2FA

1. Navigate to **Settings → Security**
2. Click **"Enable 2FA"**
3. Scan QR code with authenticator app (Google Authenticator, Authy, 1Password)
4. Enter 6-digit verification code
5. Save backup codes in a secure location

### Sign In with 2FA

1. User signs in with email/password or OAuth
2. If 2FA is enabled, prompted for verification code
3. User enters code from authenticator app
4. User is logged in

### Backup Codes

- 8 backup codes are generated when 2FA is enabled
- Each code can only be used once
- Use backup codes if authenticator is unavailable
- Regenerate backup codes anytime from Settings (requires current TOTP code)

### Disabling 2FA

1. Navigate to **Settings → Security**
2. Click **"Disable 2FA"**
3. Enter current TOTP code or backup code
4. 2FA is disabled

### API Reference (2FA)

```typescript
// Check 2FA status
await useQuery(api.twoFactor.getStatus);
// Returns: { enabled: boolean, hasBackupCodes: boolean }

// Begin 2FA setup
await useMutation(api.twoFactor.beginSetup);
// Returns: { secret: string, otpauthUrl: string }

// Complete setup with verification
await useMutation(api.twoFactor.completeSetup, { code: "123456" });
// Returns: { success: boolean, backupCodes?: string[], error?: string }

// Verify code (sign-in)
await useMutation(api.twoFactor.verifyCode, { code: "123456" });

// Verify backup code (consumes it)
await useMutation(api.twoFactor.verifyBackupCode, { code: "XXXX-XXXX" });

// Regenerate backup codes
await useMutation(api.twoFactor.regenerateBackupCodes, { totpCode: "123456" });

// Disable 2FA
await useMutation(api.twoFactor.disable, { code: "123456", isBackupCode: false });
```

## User Invitation System

Admins can invite new users to the platform via email.

### Who Can Send Invites?

Only platform admins can send invitations. A user is considered an admin if they:

- Have created at least one project, OR
- Have an "admin" role in any project

### Sending Invitations

1. Navigate to **Settings → Admin → User Management**
2. Click **"Invite User"** button
3. Enter the email address
4. Select a role (User or Admin)
5. Click **"Send Invitation"**

The invitation will be valid for 7 days.

### Invitation Roles

- **User**: Standard user access. Can create projects and collaborate.
- **Admin**: Can send invitations and manage other users.

### Managing Invitations

In the **User Management** interface, you can:

- **View all invitations** with their status (Pending, Accepted, Revoked, Expired)
- **Resend** pending invitations (extends expiration by 7 days)
- **Revoke** pending invitations (prevents them from being accepted)

### Accepting Invitations

**Invite Acceptance Flow:**

1. User clicks invite link → navigates to `/invite/:token`
2. Page displays invite details (inviter, role, organization)
3. User signs up or signs in (if already has account)
4. After authentication, invite is automatically accepted
5. User is redirected to the organization dashboard via `PostAuthRedirect`

**Route:** `src/routes/invite.$token.tsx`

**Components used:**

- `PostAuthRedirect` - handles post-auth navigation to organization dashboard
- Invite page shows accept button for authenticated users

### Invitation States

| Status       | Description                                  |
| ------------ | -------------------------------------------- |
| **Pending**  | Invitation sent, waiting for acceptance      |
| **Accepted** | User created account and accepted invitation |
| **Revoked**  | Admin revoked the invitation                 |
| **Expired**  | Invitation expired after 7 days              |

## User Management

Admins can view all platform users in **Settings → Admin → User Management → Users** tab.

### User Information Displayed

- Name and email
- Profile picture
- Account type (Verified, Unverified)
- Projects created
- Project memberships

### User Types

- **Unverified**: Email not verified
- **Verified**: Email verified (via Google OAuth or email verification)

## Security Best Practices

1. **Enable 2FA**: Require two-factor authentication for admin accounts
2. **Use SSO**: Configure SSO for enterprise organizations
3. **Regular Audit**: Periodically review active invitations and revoke unused ones
4. **Role Assignment**: Only grant admin role to trusted users
5. **Email Verification**: Encourage users to verify their email addresses
6. **Invite Expiration**: Invitations expire after 7 days for security

## API Reference

### Queries

```typescript
// Get invitation by token (public - no auth required)
await useQuery(api.invites.getInviteByToken, { token: "invite_xxx" });

// List all invitations (admin only)
await useQuery(api.invites.listInvites, { status: "pending" }); // optional filter

// List all users (admin only)
await useQuery(api.invites.listUsers, {});
```

### Mutations

```typescript
// Send an invitation (admin only)
await useMutation(api.invites.sendInvite, {
  email: "user@example.com",
  role: "user", // or "admin"
});

// Revoke an invitation (admin only)
await useMutation(api.invites.revokeInvite, {
  inviteId: "xxx",
});

// Resend an invitation (admin only)
await useMutation(api.invites.resendInvite, {
  inviteId: "xxx",
});

// Accept an invitation (authenticated user)
await useMutation(api.invites.acceptInvite, {
  token: "invite_xxx",
});
```

## Email Integration (TODO)

The `/invite/:token` page is implemented. To enable automatic invitation emails:

1. Configure Resend (already in dependencies):

   ```typescript
   // Add to environment variables
   RESEND_API_KEY = re_xxx;
   ```

2. Create email template in `convex/email/templates/invite.ts`

3. Update `sendInvite` mutation in `convex/invites.ts` to send email:
   ```typescript
   const inviteLink = `${process.env.SITE_URL}/invite/${token}`;
   await sendInviteEmail(args.email, inviteLink, invite.role);
   ```

## Troubleshooting

**Q: I can't send invitations**

- Verify you have admin privileges (created a project or have admin role)
- Check browser console for errors

**Q: Google sign-in doesn't work**

- Ensure `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET` are set
- Verify redirect URI in Google Console matches your app URL
- Check that Google+ API is enabled

**Q: Invitation shows as expired**

- Invitations are valid for 7 days
- Admin can resend the invitation to extend expiration

**Q: Can I change a user's role after they join?**

- Currently not implemented in UI
- Can be added as a future feature in UserManagement component

---

_Last Updated: 2026-02-14_
