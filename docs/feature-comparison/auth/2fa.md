# Two-Factor Authentication (2FA)

## Overview

Two-factor authentication adds an additional layer of security beyond passwords. Users must provide something they know (password) and something they have (authenticator app or backup code) to access their account.

---

## plane

### 2FA Support Status

**Status**: NOT IMPLEMENTED

- No TOTP implementation found
- No SMS 2FA
- No backup codes
- No recovery options
- No 2FA setup/management endpoints

The plane codebase contains no evidence of two-factor authentication support.

---

## Cascade

### 2FA Support Status

**Status**: FULLY IMPLEMENTED

| Method | Supported | Description |
|--------|-----------|-------------|
| TOTP | Yes | RFC 6238 compliant |
| Backup Codes | Yes | 8 one-time codes |
| SMS | No | Not implemented |
| WebAuthn/FIDO2 | No | Not implemented |
| Push Notification | No | Not implemented |

### Location

- **Setup/Manage**: Settings → Security tab
- **Verification Route**: `/verify-2fa`
- **Backend**: `convex/twoFactor.ts`
- **Settings Component**: `TwoFactorSettings.tsx`

### TOTP Implementation

**Algorithm**: HMAC-SHA1 (RFC 6238)
**Digits**: 6
**Period**: 30 seconds
**Window**: ±1 time step (clock drift tolerance)

**Secret Generation**:
- 20 random bytes
- Base32 encoded
- Stored in `users.twoFactorSecret`

**QR Code Format**:
```
otpauth://totp/Nixelo:user@example.com?secret=BASE32SECRET&issuer=Nixelo
```

### Backup Codes

**Count**: 8 codes
**Format**: XXXX-XXXX (8 characters)
**Charset**: A-Z (no I, L, O) + 2-7 (no 0, 1, 8, 9)
**Storage**: SHA-256 hashed
**Usage**: One-time only (removed after use)

### 2FA Setup Flow

**Steps**:
1. User navigates to Settings → Security
2. Clicks "Enable Two-Factor Authentication"
3. `twoFactor.beginSetup()` called
   - Generates 20-byte Base32 secret
   - Stores in `twoFactorSecret` (not enabled yet)
   - Returns secret + otpauth URL
4. Frontend displays:
   - QR code (from otpauth URL)
   - Secret text (manual entry)
5. User scans QR code with authenticator app
6. User enters 6-digit code from app
7. `twoFactor.completeSetup({ code })` validates
8. If valid:
   - Generates 8 backup codes
   - Hashes codes with SHA-256
   - Sets `twoFactorEnabled = true`
   - Creates session verification record
9. Returns plain backup codes for user to save
10. 2FA enabled

### 2FA Sign-In Flow

**Trigger Conditions**:
- User has `twoFactorEnabled = true`
- Session not verified in last 24 hours

**Flow**:
1. User completes email/password sign-in
2. `getRedirectDestination` checks 2FA status
3. If 2FA enabled + not recently verified → `/verify-2fa`
4. At `/verify-2fa`:
   - Choose TOTP code or backup code
   - Enter code
5. TOTP validation:
   - Check account lockout
   - Verify code against secret
   - Check for replay attacks
   - Reset failed attempts on success
   - Create session verification record
6. Backup code validation:
   - Hash provided code
   - Search in stored hashes
   - Remove used code
   - Create session verification
7. Redirect to dashboard

### Security Features

**Rate Limiting**:
- Max 5 failed verification attempts
- 15-minute lockout after exceeding
- Per-user tracking

**Replay Attack Prevention**:
- Stores `twoFactorLastUsedTime` (last valid time step)
- New code must have newer time step
- Prevents reuse of old codes

**Backup Code Security**:
- SHA-256 hashed (plaintext never stored)
- One-time use (removed after validation)
- Case-insensitive comparison

**Session Verification**:
- Each session verified separately
- 24-hour re-verification window
- Prevents session hijacking

### Database Schema

```typescript
// Users table 2FA fields
{
  twoFactorEnabled?: boolean
  twoFactorSecret?: string  // Base32 encoded
  twoFactorBackupCodes?: string[]  // SHA-256 hashed
  twoFactorVerifiedAt?: number
  twoFactorLastUsedTime?: number  // Replay prevention
  twoFactorFailedAttempts?: number
  twoFactorLockedUntil?: number
}

// twoFactorSessions table
{
  userId: Id<"users">
  sessionId: string
  verifiedAt: number
  expiresAt?: number
}
```

### Backend API

```typescript
// Setup
twoFactor.beginSetup(): { secret, otpauthUrl }
twoFactor.completeSetup({ code }): { backupCodes }

// Status
twoFactor.getStatus(): { enabled, hasBackupCodes }

// Verification
twoFactor.verifyCode({ code }): { success }
twoFactor.verifyBackupCode({ code }): { success }

// Management
twoFactor.regenerateBackupCodes({ totpCode }): { backupCodes }
twoFactor.disable({ code, isBackupCode? }): { success }
```

### UI Components

**Verify 2FA Page**:
- Shield icon in branded circle
- Title: "Two-Factor Authentication"
- Input: 6-digit (TOTP) or 8-char (backup)
- Submit: "Verify" button
- Toggle: Switch between TOTP and backup code
- Info alert about backup code usage

**Settings Page**:
- Enable/disable toggle
- QR code display (during setup)
- Backup codes display (one-time)
- Regenerate backup codes button

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| 2FA Available | No | Yes | Cascade |
| TOTP | No | Yes (RFC 6238) | Cascade |
| Backup Codes | No | Yes (8 codes) | Cascade |
| SMS 2FA | No | No | tie |
| WebAuthn/FIDO2 | No | No | tie |
| Push Notification 2FA | No | No | tie |
| QR Code Setup | N/A | Yes | Cascade |
| Manual Secret Entry | N/A | Yes | Cascade |
| Replay Attack Prevention | N/A | Yes | Cascade |
| Rate Limiting | N/A | Yes (5 attempts) | Cascade |
| Account Lockout | N/A | Yes (15 min) | Cascade |
| Session Verification | N/A | Yes (24h window) | Cascade |
| Backup Code Hashing | N/A | Yes (SHA-256) | Cascade |

---

## Recommendations

1. **Priority 1**: Cascade already has comprehensive 2FA
   - TOTP implementation is RFC compliant
   - Backup codes provide recovery option
   - Security features are production-ready

2. **Priority 2**: Add WebAuthn/FIDO2 support
   - Hardware security keys (YubiKey)
   - Passkeys for passwordless
   - Strongest security option

3. **Priority 3**: Add recovery email option
   - Send recovery code to alternate email
   - Additional recovery method
   - Enterprise requirement

4. **Priority 4**: Add trusted devices
   - Remember device option
   - Skip 2FA on trusted devices
   - Device management UI

5. **Priority 5**: Add admin 2FA enforcement
   - Require 2FA for organization
   - Grace period for setup
   - Admin dashboard for compliance

---

## Cascade Strengths

1. **RFC 6238 Compliant TOTP**: Standard authenticator app support
2. **Secure Backup Codes**: SHA-256 hashed, one-time use
3. **Replay Attack Prevention**: Time step tracking
4. **Rate Limiting**: 5 attempts, 15-minute lockout
5. **Session Verification**: Per-session, 24-hour window
6. **Clean UI**: Dedicated verification page

---

## Implementation: WebAuthn Support

```typescript
// Add WebAuthn provider
import WebAuthn from "@auth/core/providers/webauthn";

// convex/webauthn.ts
export const beginRegistration = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName: "Nixelo",
      rpID: process.env.SITE_DOMAIN,
      userID: userId,
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Store challenge for verification
    await ctx.db.insert("webauthnChallenges", {
      userId,
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    return options;
  },
});

export const completeRegistration = mutation({
  args: {
    credential: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get stored challenge
    const challengeRecord = await ctx.db
      .query("webauthnChallenges")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first();

    if (!challengeRecord || challengeRecord.expiresAt < Date.now()) {
      throw new Error("Challenge expired");
    }

    // Verify registration response
    const verification = await verifyRegistrationResponse({
      response: args.credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: process.env.SITE_URL,
      expectedRPID: process.env.SITE_DOMAIN,
    });

    if (!verification.verified) {
      throw new Error("Verification failed");
    }

    // Store credential
    await ctx.db.insert("webauthnCredentials", {
      userId,
      credentialId: verification.registrationInfo.credentialID,
      publicKey: verification.registrationInfo.credentialPublicKey,
      counter: verification.registrationInfo.counter,
      transports: args.credential.response.transports,
      createdAt: Date.now(),
    });

    // Delete challenge
    await ctx.db.delete(challengeRecord._id);

    return { success: true };
  },
});

// Frontend component
function WebAuthnSetup() {
  const beginRegistration = useMutation(api.webauthn.beginRegistration);
  const completeRegistration = useMutation(api.webauthn.completeRegistration);

  const handleSetup = async () => {
    const options = await beginRegistration();

    // Start WebAuthn registration ceremony
    const credential = await startRegistration(options);

    // Complete registration
    await completeRegistration({ credential });

    showSuccess("Security key registered");
  };

  return (
    <Button onClick={handleSetup}>
      <Key className="mr-2 size-4" />
      Add Security Key
    </Button>
  );
}
```

---

## Implementation: Admin 2FA Enforcement

```typescript
// Organization settings
export const updateSecuritySettings = mutation({
  args: {
    organizationId: v.id("organizations"),
    require2FA: v.boolean(),
    gracePeriodDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const isAdmin = await checkOrgAdmin(ctx, args.organizationId, userId);
    if (!isAdmin) throw forbidden();

    await ctx.db.patch(args.organizationId, {
      require2FA: args.require2FA,
      twoFAGracePeriodDays: args.gracePeriodDays ?? 7,
      twoFAEnforcedAt: args.require2FA ? Date.now() : undefined,
    });

    return { success: true };
  },
});

// Check 2FA compliance on sign-in
export const check2FACompliance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Check all user's organizations
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();

    for (const membership of memberships) {
      const org = await ctx.db.get(membership.organizationId);
      if (!org?.require2FA) continue;

      // Check if 2FA enabled
      if (user.twoFactorEnabled) continue;

      // Check grace period
      const gracePeriodEnd = org.twoFAEnforcedAt +
        (org.twoFAGracePeriodDays || 7) * 24 * 60 * 60 * 1000;

      if (Date.now() > gracePeriodEnd) {
        return {
          required: true,
          organizationName: org.name,
          message: "Your organization requires 2FA. Please enable it to continue.",
        };
      }

      return {
        required: false,
        warning: true,
        organizationName: org.name,
        daysRemaining: Math.ceil((gracePeriodEnd - Date.now()) / (24 * 60 * 60 * 1000)),
        message: `2FA will be required in ${daysRemaining} days.`,
      };
    }

    return { required: false };
  },
});
```

---

## Screenshots/References

### plane
- No 2FA implementation found

### Cascade
- 2FA module: `~/Desktop/cascade/convex/twoFactor.ts`
- Verify route: `~/Desktop/cascade/src/routes/verify-2fa.tsx`
- Settings: `~/Desktop/cascade/src/components/Settings/TwoFactorSettings.tsx`
- Schema: `~/Desktop/cascade/convex/schema.ts` (users 2FA fields, twoFactorSessions)
