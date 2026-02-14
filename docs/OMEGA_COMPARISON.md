# Omega Comparison: Nixelo vs Plane vs Cal.com

> Last updated: 2026-02-14

## Executive Summary

| Aspect | Nixelo | Plane | Cal.com |
|--------|--------|-------|---------|
| **Domain** | Jira + Confluence hybrid | Jira alternative | Scheduling platform |
| **Maturity** | Early stage | Production (OSS) | Production (OSS) |
| **Team Size** | Solo/small | ~50+ contributors | ~100+ contributors |
| **Stars** | - | 40k+ | 35k+ |

---

## Tech Stack Comparison

| Layer | Nixelo | Plane | Cal.com |
|-------|--------|-------|---------|
| **Frontend** | React 19, Vite 7 | React 18, Vite 6 | Next.js 16 (App Router) |
| **Routing** | TanStack Router | React Router 7 | Next.js file-based |
| **Styling** | Tailwind v4 + @theme | Tailwind v4 + @theme | Tailwind v4 |
| **State** | Convex (reactive) | MobX | Jotai + React Query |
| **Backend** | Convex (serverless) | Django REST | Next.js API + tRPC |
| **Database** | Convex (document DB) | PostgreSQL | PostgreSQL + Prisma |
| **Real-time** | Convex subscriptions | WebSocket service | Pusher/WebSocket |
| **Auth** | @convex-dev/auth | Django auth | NextAuth + BoxyHQ |
| **UI Library** | shadcn/Radix wrappers | Custom @plane/ui | Custom + Radix |
| **Rich Text** | BlockNote + Plate | Custom ProseMirror | Lexical |
| **DnD** | dnd-kit | Atlassian PDND | - |
| **Forms** | TanStack Form | React Hook Form | React Hook Form |
| **Testing** | Vitest + Playwright | Vitest + ? | Vitest + Playwright |
| **Linting** | Biome | ESLint + Prettier | Biome |
| **Package Mgr** | pnpm | pnpm | Yarn 4 |
| **Monorepo** | No (single app) | Yes (Turbo) | Yes (Turbo) |

---

## Architecture Comparison

### Monorepo Structure

**Plane** (complex monorepo):
```
plane/
├── apps/
│   ├── web/           # Main React SPA
│   ├── api/           # Django backend
│   ├── admin/         # Admin dashboard
│   ├── space/         # Public pages
│   └── live/          # WebSocket service
├── packages/
│   ├── ui/            # Component library
│   ├── hooks/         # React hooks
│   ├── shared-state/  # MobX stores
│   ├── services/      # API clients
│   ├── types/         # TypeScript types
│   ├── editor/        # Rich text
│   └── ...            # 15+ packages
```

**Cal.com** (massive monorepo):
```
cal.com/
├── apps/
│   ├── web/           # Next.js app
│   └── api/           # API service
├── packages/
│   ├── ui/            # 50+ components
│   ├── features/      # 72+ feature modules
│   ├── lib/           # 32+ utility libs
│   ├── trpc/          # tRPC routers
│   ├── prisma/        # DB schema
│   └── ...            # 100+ packages
```

**Nixelo** (single app):
```
nixelo/
├── src/
│   ├── routes/        # TanStack Router
│   ├── components/    # All components
│   ├── hooks/         # React hooks
│   └── lib/           # Utilities
├── convex/            # Backend (serverless)
├── emails/            # Email templates
└── e2e/               # E2E tests
```

### Verdict: Nixelo's Simpler Structure

**Advantages:**
- Faster iteration (no package boundaries)
- Simpler builds (no Turbo orchestration)
- Easier onboarding
- Convex eliminates need for separate API service

**Disadvantages:**
- No code sharing across apps (if you add admin/mobile later)
- Harder to extract reusable packages
- All code in one bundle (though Vite handles code-splitting)

**Recommendation:** Keep single-app for now. Extract packages only when needed (e.g., if you build a mobile app or separate admin dashboard).

---

## UI Component Comparison

### Component Library Size

| Category | Nixelo | Plane | Cal.com |
|----------|--------|-------|---------|
| **Base components** | ~40 | ~50 | ~50 |
| **Form components** | ~10 | ~15 | ~15 |
| **Layout components** | ~5 | ~8 | ~10 |
| **Data display** | ~8 | ~12 | ~15 |
| **Feedback** | ~5 | ~8 | ~10 |
| **Total** | ~68 | ~93 | ~100 |

### Component Patterns

**Plane's approach:**
```tsx
// Helper-based variants
// packages/ui/src/button/helper.tsx
export const getButtonStyles = (variant: TButtonVariant, size: TButtonSize) => {
  const baseClasses = "...";
  const variantClasses = { primary: "...", danger: "..." };
  return cn(baseClasses, variantClasses[variant], sizeClasses[size]);
};

// Usage
<Button variant="primary" size="md">Click</Button>
```

**Cal.com's approach:**
```tsx
// CVA (Class Variance Authority)
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { primary: "...", danger: "..." },
    size: { sm: "...", md: "..." },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

// Usage
<Button variant="primary" size="md">Click</Button>
```

**Nixelo's current approach:**
```tsx
// Direct cn() composition
const Button = ({ variant = "primary", size = "md", ...props }) => (
  <button
    className={cn(
      "base-classes",
      variant === "primary" && "primary-classes",
      variant === "danger" && "danger-classes",
      size === "md" && "md-classes",
    )}
    {...props}
  />
);
```

### Verdict: Adopt CVA

**Recommendation:** Adopt Cal.com's CVA pattern for variant components. It's:
- More declarative
- Better TypeScript inference
- Easier to maintain
- Industry standard (shadcn uses it too)

---

## Feature Comparison

### Issue Tracking

| Feature | Nixelo | Plane | Notes |
|---------|--------|-------|-------|
| Issue types | ✅ Epic/Story/Task/Bug | ✅ Same | Parity |
| Custom fields | ✅ | ✅ | Parity |
| Kanban board | ✅ | ✅ | Parity |
| Sprint planning | ✅ | ✅ Cycles | Plane calls them "Cycles" |
| Burndown charts | ✅ | ✅ | Parity |
| Sub-issues | ✅ | ✅ | Parity |
| Labels | ✅ | ✅ | Parity |
| Time tracking | ✅ | ❌ | **Nixelo advantage** |
| Reactions | ✅ | ✅ | Parity |
| Watchers | ✅ | ✅ | Parity |
| Saved views | ✅ | ✅ | Parity |
| Modules | ❌ | ✅ | Plane has sub-project grouping |
| Inbox | ❌ | ✅ | Plane has issue triage inbox |
| Stickies | ❌ | ✅ | Plane has sticky notes |

### Documents

| Feature | Nixelo | Plane | Notes |
|---------|--------|-------|-------|
| Rich text editor | ✅ BlockNote | ✅ Custom | Both ProseMirror-based |
| Real-time collab | ✅ Y.js | ✅ Y.js | Parity |
| Version history | ✅ | ✅ | Parity |
| Templates | ✅ | ✅ | Parity |
| Public sharing | ✅ | ✅ | Parity |
| AI writing | ✅ | ✅ | Parity |
| Nested pages | ❌ | ✅ | Plane has page hierarchy |

### Integrations

| Feature | Nixelo | Plane | Cal.com |
|---------|--------|-------|---------|
| Google Calendar | ✅ | ❌ | ✅ |
| GitHub | ✅ | ✅ | ✅ |
| Slack | ✅ Pumble | ✅ | ✅ |
| REST API | ✅ | ✅ | ✅ |
| Webhooks | ✅ | ✅ | ✅ |
| Zapier | ❌ | ❌ | ✅ |
| OAuth apps | ❌ | ❌ | ✅ |

### Admin & Security

| Feature | Nixelo | Plane | Cal.com |
|---------|--------|-------|---------|
| RBAC | ✅ | ✅ | ✅ |
| SSO/SAML | ❌ | ✅ | ✅ |
| Audit logs | ✅ | ✅ | ✅ |
| 2FA | ❌ | ✅ | ✅ |
| IP restrictions | ❌ | ✅ | ❌ |

---

## What to Steal

### From Plane

1. **Inbox/Triage view** - Issues land in inbox before being prioritized
2. **Modules** - Group related issues across sprints
3. **Stickies** - Quick notes on projects
4. **Page hierarchy** - Nested document structure
5. **Drag-drop library** - Atlassian PDND is excellent

### From Cal.com

1. **CVA for variants** - Cleaner component styling
2. **Feature modules** - Each feature as isolated package
3. **tRPC patterns** - Type-safe API (though Convex already has this)
4. **Booking pages** - Public scheduling links (if adding scheduling)
5. **Embed SDK** - Embeddable widgets for external sites

### Design Patterns to Adopt

1. **Command palette** - Both have excellent ⌘K implementations
2. **Keyboard navigation** - Plane's vim-style shortcuts
3. **Empty states** - Both have polished empty state illustrations
4. **Loading skeletons** - Plane's skeleton patterns
5. **Error boundaries** - Cal.com's error handling patterns

---

## Gap Analysis: What Nixelo is Missing

### Critical Gaps (should fix)

| Gap | Priority | Effort | Notes |
|-----|----------|--------|-------|
| SSO/SAML | High | Medium | Enterprise requirement |
| 2FA/MFA | High | Low | Security table stakes |
| Inbox/triage | Medium | Medium | Better issue workflow |
| Nested pages | Medium | Medium | Document organization |

### Nice-to-Have

| Gap | Priority | Effort | Notes |
|-----|----------|--------|-------|
| Modules | Low | Medium | Plane-specific feature |
| Stickies | Low | Low | Quick notes |
| IP restrictions | Low | Low | Enterprise security |
| Embed SDK | Low | High | External embedding |

### Nixelo Advantages (keep these)

| Advantage | Notes |
|-----------|-------|
| **Time tracking** | Neither Plane nor Cal.com has built-in time tracking |
| **Convex real-time** | Simpler than Plane's Django + WebSocket setup |
| **Single codebase** | Faster iteration than monorepo |
| **Calendar integration** | Google Calendar sync built-in |
| **Voice AI** | Meeting bot is unique |

---

## Recommendations

### Immediate (This Week)

1. **Adopt CVA** for Button, Badge, and other variant components
2. **Study Plane's Kanban** implementation for performance improvements
3. **Add keyboard shortcuts** following Plane's patterns

### Short-term (This Month)

1. **Add SSO/SAML** - Use BoxyHQ like Cal.com
2. **Add 2FA** - TOTP with authenticator apps
3. **Build Inbox view** - Issue triage workflow

### Medium-term (This Quarter)

1. **Nested pages** - Document hierarchy
2. **Modules** - Cross-sprint issue grouping
3. **Embed SDK** - External widget embedding

---

## Code Quality Comparison

| Metric | Nixelo | Plane | Cal.com |
|--------|--------|-------|---------|
| TypeScript strict | ✅ | ✅ | ✅ |
| Custom validators | ✅ 11 checks | ❌ | ❌ |
| E2E tests | ✅ Playwright | ? | ✅ Playwright |
| Unit tests | ✅ Vitest | ✅ Vitest | ✅ Vitest |
| Storybook | ✅ | ✅ | ❌ |
| CI/CD | ✅ | ✅ GitHub Actions | ✅ GitHub Actions |

**Verdict:** Nixelo has strong code quality foundations with custom validators that neither competitor has.

---

## Final Thoughts

**Nixelo's positioning:**
- More integrated than Plane (docs + issues + time tracking + calendar)
- Simpler architecture (Convex vs Django + WebSocket)
- Faster to iterate (single codebase vs monorepo)

**Key differentiators to double down on:**
1. Time tracking integration
2. Calendar/scheduling built-in
3. Voice AI meeting bot
4. Real-time everything (Convex advantage)

**Key gaps to close:**
1. SSO/SAML (enterprise blocker)
2. 2FA (security table stakes)
3. Inbox/triage (workflow improvement)

---

---

# Deep Dives

## A. Plane Kanban Board Implementation

### File Structure
```
/apps/web/core/components/issues/issue-layouts/kanban/
├── default.tsx          # Main component (group/subgroup rendering)
├── base-kanban-root.tsx # Root wrapper with drag targets + delete zone
├── kanban-group.tsx     # Individual column with drop target
├── block.tsx            # Issue card (draggable + droppable)
├── swimlanes.tsx        # Two-level grouping layout
└── utils.tsx            # Drag-drop utilities
```

### Drag-Drop: Atlassian Pragmatic DnD

**Why not dnd-kit?** Pragmatic DnD is headless, adapter-based, and handles complex multi-level grouping better.

```typescript
// Drop target setup in column
dropTargetForElements({
  element: columnRef.current,
  getData: () => ({ groupId, subGroupId, columnId, type: "COLUMN" }),
  onDrop: (payload) => {
    const source = getSourceFromDropPayload(payload);
    const destination = getDestinationFromDropPayload(payload);
    handleOnDrop(source, destination);
  }
})

// Draggable issue block
draggable({
  element: cardRef.current,
  canDrag: () => isDragAllowed,
  getInitialData: () => ({ id: issue?.id, type: "ISSUE" }),
  onDragStart: () => setIsKanbanDragging(true),
})
```

### Optimistic Updates Pattern

```typescript
// /apps/web/core/store/issue/helpers/base-issues.store.ts
const issueBeforeUpdate = clone(getIssueById(issueId));
updateIssue(issueId, data);  // Instant UI via MobX
await patchIssue(workspaceSlug, projectId, issueId, data);  // API call
// On error: updateIssue(issueId, issueBeforeUpdate) — rollback
```

### Performance: Custom Virtualization

```typescript
// /apps/web/core/components/core/render-if-visible-HOC.tsx
// NOT react-window — custom IntersectionObserver HOC
// - First 5 columns render by default
// - Others render when scrolled into view
// - Uses requestIdleCallback for cheap renders
// - Calculates approximate heights for smooth placeholders
```

### Keyboard Navigation
**Finding:** Plane does NOT have arrow-key reordering. Focus is on mouse drag-drop.

---

## B. Plane UI Component Patterns

### Two-Layer Architecture

| Package | Purpose | Style Approach |
|---------|---------|----------------|
| `@plane/ui` | Headless UI-based | String enum variants |
| `@plane/propel` | Modern abstractions | CVA (class-variance-authority) |

### Button: String Enum Approach (Legacy)

```typescript
// /packages/ui/src/button/helper.tsx
export type TButtonVariant = "primary" | "accent-primary" | "outline-primary" | "danger" | ...;

enum buttonSizeStyling {
  sm = `px-3 py-1.5 font-medium text-11 rounded-sm flex items-center gap-1.5`,
  md = `px-4 py-1.5 font-medium text-13 rounded-sm flex items-center gap-1.5`,
}

export const buttonStyling: IButtonStyling = {
  primary: {
    default: `text-on-color bg-accent-primary`,
    hover: `hover:bg-accent-primary/80`,
    pressed: `focus:text-custom-brand-40 focus:bg-accent-primary/80`,
    disabled: `cursor-not-allowed !bg-layer-1 !text-on-color-disabled`,
  },
  // ... more variants
};

export const getButtonStyling = (variant, size, disabled) => {
  const currentVariant = buttonStyling[variant];
  return `${currentVariant.default} ${disabled ? currentVariant.disabled : currentVariant.hover}`;
};
```

### Button: CVA Approach (Modern)

```typescript
// /packages/propel/src/button/helper.tsx
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-accent-primary hover:bg-accent-primary-hover text-on-color",
        secondary: "bg-layer-2 hover:bg-layer-2-hover text-secondary border border-strong",
        ghost: "bg-layer-transparent hover:bg-layer-transparent-hover text-secondary",
        link: "px-0 underline text-link-primary hover:text-link-primary-hover",
      },
      size: {
        sm: "h-5 px-1.5 text-caption-md-medium rounded-sm",
        base: "h-6 px-2 text-body-xs-medium rounded-md",
        lg: "h-7 px-2 text-body-xs-medium rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "base" },
  }
);
```

### Modal: Headless UI + Transition

```typescript
// /packages/ui/src/modals/modal-core.tsx
import { Dialog, Transition } from "@headlessui/react";

export function ModalCore({ isOpen, handleClose, position, width, children }) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={handleClose}>
        <Transition.Child /* backdrop fade */ />
        <div className="fixed inset-0 z-30 overflow-y-auto">
          <div className={position}>
            <Transition.Child /* scale + slide animation */ >
              <Dialog.Panel className={cn("bg-surface-1 rounded-lg shadow-raised-200", width)}>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
```

### Form Components: Wrapper Pattern

```typescript
// Composition helpers for labels + validation
<FormField label="Email" htmlFor="email" optional={true}>
  <Input id="email" type="email" hasError={!!errors.email} />
  <ValidationMessage type="error" message={errors.email} />
</FormField>
```

### Dropdown: Portal-based (avoids z-index issues)

```typescript
// Render to document.body to escape stacking context
{isOpen && createPortal(
  <Combobox.Options>
    <div ref={setPopperElement} style={styles.popper}>
      {children}
    </div>
  </Combobox.Options>,
  document.body
)}
```

### Key Patterns

1. **Forward Ref everywhere** — all interactive components support ref
2. **Icon injection** — `prependIcon`, `appendIcon` props with `cloneElement`
3. **Semantic color tokens** — `bg-accent-primary`, `text-on-color`, `border-subtle`
4. **Portal dropdowns** — escape stacking context issues

---

## C. Cal.com Auth Implementation

### SSO/SAML: BoxyHQ saml-jackson

```typescript
// /packages/features/ee/sso/lib/jackson.ts
const opts: JacksonOption = {
  externalUrl: WEBAPP_URL,
  samlPath: "/api/auth/saml/callback",
  samlAudience: "https://saml.cal.com",
  db: {
    engine: "sql",
    type: "postgres",
    url: samlDatabaseUrl,
    encryptionKey: process.env.CALENDSO_ENCRYPTION_KEY,
  },
};

// Global singleton
const ret = await controllers(opts);
globalThis.connectionController = ret.connectionAPIController;
globalThis.oauthController = ret.oauthController;
```

### SAML as OAuth Provider in NextAuth

```typescript
// /packages/features/auth/lib/next-auth-options.ts
providers.push({
  id: "saml",
  name: "BoxyHQ",
  type: "oauth",
  checks: ["pkce", "state"],
  authorization: { url: `${WEBAPP_URL}/api/auth/saml/authorize` },
  token: { url: `${WEBAPP_URL}/api/auth/saml/token` },
  userinfo: `${WEBAPP_URL}/api/auth/saml/userinfo`,
  profile: async (profile) => ({
    id: profile.id,
    email: profile.email,
    name: `${profile.firstName} ${profile.lastName}`,
    email_verified: true,
    samlTenant: profile.requested?.tenant,  // For domain authority
  }),
});
```

### SAML Security: Domain Authority Check

```typescript
// Prevent rogue IdPs from claiming arbitrary domains
async isSamlIdpAuthoritativeForEmail(samlOrgTeamId, email) {
  const emailDomain = email.split("@")[1];

  // Check 1: Verified organization domain
  const verifiedDomains = await this.getVerifiedDomains(samlOrgTeamId);
  if (verifiedDomains.some(d => emailDomain === d)) {
    return { authoritative: true, reason: "domain_verified" };
  }

  // Check 2: Existing team member
  const hasMembership = await this.hasAcceptedMembership({ email, teamId: samlOrgTeamId });
  if (hasMembership) {
    return { authoritative: true, reason: "existing_member" };
  }

  return { authoritative: false, reason: "domain_mismatch" };
}
```

### 2FA/TOTP Implementation

```typescript
// /packages/lib/totp.ts
import { Authenticator } from "@otplib/core";

export const totpAuthenticatorCheck = (token, secret, opts = {}) => {
  const { window = [1, 0] } = opts;  // 1 past, 0 future codes allowed
  const authenticator = new Authenticator({ window, ...crypto_opts });
  return authenticator.check(token, secret);
};

// In login flow:
if (user.twoFactorEnabled) {
  const secret = symmetricDecrypt(user.twoFactorSecret, ENCRYPTION_KEY);
  const isValid = totpAuthenticatorCheck(credentials.totpCode, secret);
  if (!isValid) throw new Error("IncorrectTwoFactorCode");
}
```

### Backup Codes

```typescript
// Stored encrypted, consumed after use
if (credentials.backupCode) {
  const backupCodes = JSON.parse(
    symmetricDecrypt(user.backupCodes, ENCRYPTION_KEY)
  );
  const index = backupCodes.indexOf(credentials.backupCode.replaceAll("-", ""));
  if (index === -1) throw new Error("IncorrectBackupCode");

  // Delete used code
  backupCodes[index] = null;
  await prisma.user.update({
    where: { id: user.id },
    data: { backupCodes: symmetricEncrypt(JSON.stringify(backupCodes), ENCRYPTION_KEY) },
  });
}
```

### Auth Middleware: tRPC Chain

```typescript
// /packages/trpc/server/middlewares/sessionMiddleware.ts
export const isAuthed = middleware(async ({ ctx, next }) => {
  const { user, session } = await getUserSession(ctx);
  if (!user || !session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user, session } });
});

export const isAdminMiddleware = isAuthed.unstable_pipe(({ ctx, next }) => {
  if (ctx.user?.role !== "ADMIN") throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx });
});

// Usage:
export const authedProcedure = procedure.use(isAuthed);
export const authedAdminProcedure = procedure.use(isAdminMiddleware);
```

---

## D. Plane Inbox/Triage Workflow

### Inbox Issue Statuses

```typescript
enum EInboxIssueStatus {
  PENDING = -2,    // Default when created
  DECLINED = -1,   // Rejected
  SNOOZED = 0,     // Hidden until date
  ACCEPTED = 1,    // Approved into project
  DUPLICATE = 2,   // Linked to existing
}
```

### Two-Tab Structure

| Tab | Statuses | Purpose |
|-----|----------|---------|
| **Open** | PENDING, SNOOZED | Issues awaiting triage |
| **Closed** | ACCEPTED, DECLINED, DUPLICATE | Processed issues |

### Triage Actions

```typescript
// Accept → moves to project issues
await updateInboxIssueStatus(ACCEPTED);
this.store.issue.issues.addIssue([updatedIssue]);

// Decline → removes from open view
await updateInboxIssueStatus(DECLINED);

// Snooze → hide until date, auto-reverts
await updateInboxIssueSnoozeTill(date);

// Duplicate → link to existing issue
await updateInboxIssueDuplicateTo(issueId);
```

### MobX Store Architecture

```typescript
// Layer 1: Collection (ProjectInboxStore)
interface IProjectInboxStore {
  currentTab: "open" | "closed";
  filtersMap: Record<projectId, TInboxIssueFilter>;
  inboxIssueIds: string[];
  inboxIssues: Record<issueId, IInboxIssueStore>;
}

// Layer 2: Individual Issue (InboxIssueStore)
class InboxIssueStore {
  id: string;
  status: TInboxIssueStatus;
  issue: Partial<TIssue>;
  snoozed_till: Date | undefined;
  duplicate_to: string | undefined;
}
```

### Bulk Operations

```typescript
// Bulk update properties
bulkUpdateProperties = async (data: TBulkOperationsPayload) => {
  await this.issueService.bulkOperations(workspaceSlug, projectId, data);

  runInAction(() => {
    data.issue_ids.forEach((issueId) => {
      Object.keys(data.properties).forEach((key) => {
        const value = data.properties[key];
        if (Array.isArray(value)) {
          // Append to existing array (labels, assignees)
          const existing = issue[key] || [];
          this.updateIssue(issueId, { [key]: uniq([...existing, ...value]) });
        } else {
          // Replace scalar (priority, state)
          this.updateIssue(issueId, { [key]: value });
        }
      });
    });
  });
};

// Bulk delete
await this.issueService.bulkDeleteIssues(workspaceSlug, projectId, { issue_ids });

// Bulk archive
await this.issueService.bulkArchiveIssues(workspaceSlug, projectId, { issue_ids });
```

### Filter + Pagination Pattern

```typescript
handleInboxIssueFilters = (key, value) => {
  runInAction(() => {
    set(this.filtersMap, [projectId, key], value);
    set(this, ["inboxIssuePaginationInfo"], undefined);  // Reset pagination!
  });
  this.fetchInboxIssues(workspaceSlug, projectId, "filter-loading");
};

// Cursor pagination: "10:0:0" (per_page:page:offset)
// Intersection observer triggers fetchNextPages
```

---

## Reference Links

- Plane: https://github.com/makeplane/plane
- Cal.com: https://github.com/calcom/cal.com
- Plane UI: `/home/mikhail/Desktop/plane/packages/ui`
- Cal.com UI: `/home/mikhail/Desktop/cal.com/packages/ui`

### Key File Paths

**Plane Kanban:**
- `/home/mikhail/Desktop/plane/apps/web/core/components/issues/issue-layouts/kanban/`
- `/home/mikhail/Desktop/plane/apps/web/core/store/issue/helpers/base-issues.store.ts`

**Plane UI:**
- `/home/mikhail/Desktop/plane/packages/ui/src/button/`
- `/home/mikhail/Desktop/plane/packages/propel/src/button/`
- `/home/mikhail/Desktop/plane/packages/ui/src/modals/`

**Cal.com Auth:**
- `/home/mikhail/Desktop/cal.com/packages/features/ee/sso/lib/jackson.ts`
- `/home/mikhail/Desktop/cal.com/packages/features/auth/lib/next-auth-options.ts`
- `/home/mikhail/Desktop/cal.com/packages/lib/totp.ts`

**Plane Inbox:**
- `/home/mikhail/Desktop/plane/apps/web/core/store/inbox/project-inbox.store.ts`
- `/home/mikhail/Desktop/plane/apps/web/core/store/inbox/inbox-issue.store.ts`
- `/home/mikhail/Desktop/plane/apps/web/core/components/inbox/root.tsx`
