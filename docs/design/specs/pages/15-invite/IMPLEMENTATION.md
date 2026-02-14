# Invite Page - Implementation

> **Priority**: P2 - Enhancement
> **Scope**: Simplify existing page, remove card wrapper

---

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `src/routes/invite.$token.tsx` | REWRITE | Remove card, simplify layout, use AuthPageLayout |

---

## Strategy

The current implementation has good logic (state handling, auth branching) but bad styling (cards, verbose text). We should:

1. Import and use `AuthPageLayout` for consistency
2. Remove all card wrappers and shadow
3. Simplify error state UI (no icon circles)
4. Simplify heading/subtitle text

---

## invite.$token.tsx - Target Structure

```tsx
import { AuthPageLayout, AuthRedirect, SignInForm } from "@/components/auth";
// ... other imports

function InviteRoute() {
  const { token } = Route.useParams();
  // ... existing state and mutations

  // Loading
  if (invite === undefined) {
    return (
      <AuthPageLayout title="Loading...">
        <Flex justify="center">
          <LoadingSpinner size="lg" />
        </Flex>
      </AuthPageLayout>
    );
  }

  // Invalid
  if (invite === null) {
    return (
      <AuthPageLayout
        title="Invalid invitation"
        subtitle="This link is invalid or has been removed."
      >
        <Button variant="secondary" onClick={goToHome} className="w-full">
          Go to Home
        </Button>
      </AuthPageLayout>
    );
  }

  // Expired
  if (invite.isExpired) {
    return (
      <AuthPageLayout
        title="Invitation expired"
        subtitle={
          <>
            This invitation has expired. Ask{" "}
            <strong className="font-semibold text-ui-text">{invite.inviterName}</strong>{" "}
            to send a new one.
          </>
        }
      >
        <Button variant="secondary" onClick={goToHome} className="w-full">
          Go to Home
        </Button>
      </AuthPageLayout>
    );
  }

  // Already accepted
  if (invite.status === "accepted") {
    return (
      <AuthPageLayout
        title="Already joined"
        subtitle="You've already accepted this invitation."
      >
        <Button variant="primary" onClick={goToHome} className="w-full">
          Go to Dashboard
        </Button>
      </AuthPageLayout>
    );
  }

  // Revoked
  if (invite.status === "revoked") {
    return (
      <AuthPageLayout
        title="Invitation cancelled"
        subtitle="This invitation was cancelled by the team administrator."
      >
        <Button variant="secondary" onClick={goToHome} className="w-full">
          Go to Home
        </Button>
      </AuthPageLayout>
    );
  }

  // Pending - valid invite
  const projectName = invite.projectName || "Nixelo";
  const roleText = invite.projectRole || invite.role || "member";

  return (
    <AuthPageLayout
      title={`Join ${projectName}`}
      subtitle={
        <>
          <strong className="font-semibold text-ui-text">{invite.inviterName}</strong>{" "}
          invited you as {roleText}
        </>
      }
    >
      <Authenticated>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleAcceptInvite}
          disabled={isAccepting}
        >
          {isAccepting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Accepting...
            </>
          ) : (
            "Accept Invitation"
          )}
        </Button>
        {acceptError && (
          <Typography variant="small" className="mt-4 text-status-error text-center">
            {acceptError}
          </Typography>
        )}
      </Authenticated>

      <Unauthenticated>
        <Typography variant="muted" className="text-center mb-6">
          Sign in to{" "}
          <strong className="font-semibold text-ui-text">{invite.email}</strong>{" "}
          to continue
        </Typography>
        <SignInForm />
      </Unauthenticated>
    </AuthPageLayout>
  );
}
```

---

## Removed Elements

| Element | Reason |
|---------|--------|
| `bg-ui-bg-secondary` page background | Use `bg-ui-bg` via AuthPageLayout |
| Header with logo | AuthPageLayout handles this |
| Card wrapper (`rounded-2xl shadow-lg p-8`) | No card needed |
| Details box (`bg-ui-bg-secondary rounded-lg p-4`) | Inline text instead |
| Icon circles in error states | Text-only is cleaner |
| "You're Invited!" heading | Template-speak |
| "By accepting..." disclaimer | Unnecessary |

---

## Verification Checklist

### Structure
- [ ] Uses AuthPageLayout (not custom layout)
- [ ] No card wrapper
- [ ] No header element (logo is in AuthPageLayout)
- [ ] No details box
- [ ] Background is `bg-ui-bg`

### Typography
- [ ] Heading is "Join {projectName}"
- [ ] Subtitle uses inline text with bold names
- [ ] No "You're Invited!" or similar

### States
- [ ] Loading: spinner only
- [ ] Invalid: clear message, home button
- [ ] Expired: mentions inviter name
- [ ] Revoked: clear message
- [ ] Accepted: go to dashboard
- [ ] Pending (auth): accept button
- [ ] Pending (unauth): signin form

### Animation
- [ ] Uses AuthPageLayout animation (single fade-in)
- [ ] No separate animations

### Responsive
- [ ] Mobile: full width - 32px padding
- [ ] Tablet/Desktop: 360px centered

---

## After Implementation

1. Run `pnpm screenshots` for new captures
2. Compare with auth pages for consistency
3. Test all invite states (need test tokens)
4. Update DIRECTOR.md status
