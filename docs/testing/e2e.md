# E2E Testing with Playwright

End-to-end testing for Nixelo using [Playwright](https://playwright.dev/).

## Reliability Policy

- Local full-suite run output is the source of truth:
  - `pnpm exec playwright test --reporter=line`
- Acceptance is binary:
  - `100% pass` or `not 100% pass`
- Do not use summary/history-derived gates to decide E2E status.

## Quick Start

```bash
# Run all E2E tests (headless)
pnpm e2e

# Interactive UI mode (recommended for development)
pnpm e2e:ui

# Run with visible browser
pnpm e2e:headed

# Debug mode with inspector
pnpm e2e:debug
```

## PR Review Checklist (E2E Reliability)

Use this checklist for any PR that modifies `e2e/` specs, fixtures, page objects, or E2E utilities:

- No `waitForTimeout` introduced in active E2E test flows
- Wait strategy is state-based (`expect(...).toBeVisible`, `toHaveURL`, `toHaveCount`, `expect.poll`)
- Shared helper contracts are reused where applicable:
  - `waitForDashboardReady`
  - `waitForBoardLoaded`
  - `waitForIssueCreateSuccess`
  - `waitForOAuthRedirectComplete`
- Selectors prioritize semantic roles and test ids over brittle text/CSS-only locators
- PR includes exact E2E command(s) run and pass/fail/skip outcomes

Automated guard commands:

```bash
pnpm run e2e:hard-rules
pnpm run e2e:hard-rules:self-test
```

Current automated checks:
- hard fail on `waitForTimeout(` in `*.spec.ts(x)` files
- hard fail on `waitForLoadState("networkidle")` in `*.spec.ts(x)` files
- baseline-aware regression check for brittle selector anti-patterns:
  - `locator("text=...")` / `locator(\`text=...\`)`
  - `:nth-child(...)` / `:nth-of-type(...)`

Baseline file (temporary debt register): `scripts/ci/e2e-hard-rules-baseline.json`

## Configuration

**File:** `playwright.config.ts`

### Key Settings

| Setting  | Local                   | CI                      |
| -------- | ----------------------- | ----------------------- |
| Base URL | `http://localhost:5555` | `http://localhost:5555` |
| Browser  | Chromium                | Chromium                |
| Workers  | 4                       | 4                       |
| Retries  | 0                       | 2                       |
| Parallel | Yes (fullyParallel)     | Yes (fullyParallel)     |

### Timeouts

| Type               | Duration   |
| ------------------ | ---------- |
| Test timeout       | 60 seconds |
| Expect timeout     | 10 seconds |
| Action timeout     | 15 seconds |
| Navigation timeout | 15 seconds |

### Debug Artifacts

| Artifact   | When Captured   |
| ---------- | --------------- |
| Trace      | On first retry  |
| Screenshot | Only on failure |
| Video      | On first retry  |

## Architecture

```
e2e/
├── fixtures/                   # Test fixtures
│   ├── index.ts               # Exports all fixtures
│   ├── test.fixture.ts        # Base fixtures (page objects)
│   ├── auth.fixture.ts        # Authenticated user fixtures
│   └── rbac.fixture.ts        # RBAC-specific fixtures (admin/editor/viewer)
│
├── pages/                      # Page Object Models
│   ├── index.ts               # Exports all pages
│   ├── base.page.ts           # Base page with common methods
│   ├── auth.page.ts           # Auth forms (sign in/up, reset)
│   ├── calendar.page.ts       # Calendar views
│   ├── dashboard.page.ts      # Main app dashboard
│   ├── documents.page.ts      # Document management
│   ├── landing.page.ts        # Landing page
│   ├── onboarding.page.ts     # Onboarding flow
│   ├── projects.page.ts       # Projects, boards, issues
│   ├── settings.page.ts       # Settings pages
│   └── workspaces.page.ts     # Workspace management
│
├── utils/                      # Test utilities
│   ├── index.ts               # Exports all utilities
│   ├── auth-helpers.ts        # Authentication helpers
│   ├── helpers.ts             # General helpers
│   ├── otp-helpers.ts         # OTP verification via E2E API
│   ├── routes.ts              # Route utilities
│   ├── test-helpers.ts        # Test data helpers
│   ├── test-user-service.ts   # Test user CRUD service
│   └── wait-helpers.ts        # Async wait utilities
│
├── settings/                   # Nested spec directories
│   └── billing.spec.ts        # Billing settings tests
│
├── config.ts                   # Test configuration (users, endpoints)
├── global-setup.ts            # Pre-test setup (creates users, seeds data)
├── global-teardown.ts         # Post-test cleanup
│
│── # Test specs (20 files)
├── auth.spec.ts               # Authentication tests
├── auth-comprehensive.spec.ts # Extended auth flow tests
├── calendar.spec.ts           # Calendar tests
├── dashboard.spec.ts          # Dashboard tests
├── documents.spec.ts          # Document management tests
├── error-scenarios.spec.ts    # Error handling tests
├── integration-workflow.spec.ts # Cross-feature workflow tests
├── invites.spec.ts            # User invitation tests
├── issues.spec.ts             # Issue management tests
├── landing.spec.ts            # Landing page tests
├── onboarding.spec.ts         # Onboarding flow tests
├── rbac.spec.ts               # Role-based access control tests
├── signout.spec.ts            # Sign-out flow tests
├── sprints.spec.ts            # Sprint management tests
├── time-tracking.spec.ts      # Time tracking tests
└── workspaces-org.spec.ts     # Workspace/org management tests
```

## Page Object Model

We use the [Page Object Model](https://playwright.dev/docs/pom) pattern for maintainable tests.

### Base Page

All page objects extend `BasePage`, which requires an `orgSlug` for multi-tenant URL construction:

```typescript
// e2e/pages/base.page.ts
export abstract class BasePage {
  readonly page: Page;
  readonly orgSlug: string;

  constructor(page: Page, orgSlug: string) {
    if (!orgSlug) {
      throw new Error("orgSlug is required.");
    }
    this.page = page;
    this.orgSlug = orgSlug;
  }

  abstract goto(): Promise<void>;

  // Waits for DOM + React hydration (checks __reactFiber on elements)
  // Uses 'domcontentloaded' instead of 'networkidle' because Convex
  // keeps WebSocket connections active, preventing networkidle from resolving
  async waitForLoad() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("load");
    await this.page.waitForFunction(() => {
      const elements = document.querySelectorAll("a, button");
      if (elements.length === 0) return true;
      for (const element of elements) {
        const keys = Object.keys(element);
        if (keys.some((k) => k.startsWith("__reactFiber") || k.startsWith("__reactProps"))) {
          return true;
        }
      }
      return false;
    }, {});
  }

  // Toast helpers (Sonner)
  getToast(text?: string): Locator { /* ... */ }
  async expectToast(text: string) { /* ... */ }
  async dismissToasts() { /* ... */ }
}
```

### Example Page Object

```typescript
// e2e/pages/auth.page.ts
export class AuthPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByPlaceholder("Email");
    this.passwordInput = page.getByPlaceholder("Password");
    this.submitButton = page.getByRole("button", { name: /sign (in|up)/i });
  }

  async goto() {
    await this.page.goto("/");
    await this.waitForLoad();
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

## Fixtures

Fixtures provide page objects to tests automatically.

### Base Fixtures

```typescript
// e2e/fixtures/test.fixture.ts
import { test as base } from "@playwright/test";
import { AuthPage, DashboardPage, LandingPage } from "../pages";

export const test = base.extend<TestFixtures>({
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});
```

### Usage in Tests

```typescript
import { test, expect } from "./fixtures";

test("can sign in", async ({ authPage }) => {
  await authPage.goto();
  await authPage.signIn("user@example.com", "password");
  // Assertions...
});
```

## Authentication

### Test Users

Test users are configured in `e2e/config.ts`. All use `@inbox.mailtrap.io` for email verification. Emails include a shard suffix (`-s0` locally, configurable via `SHARD_INDEX` in CI).

| User Key     | Email Pattern                              | Platform Role | Description                         |
| ------------ | ------------------------------------------ | ------------- | ----------------------------------- |
| `admin`      | `e2e-admin-s{SHARD}@inbox.mailtrap.io`     | superAdmin    | Platform admin, full access         |
| `teamLead`   | `e2e-teamlead-s{SHARD}@inbox.mailtrap.io`  | user          | Default test user, creates projects |
| `teamMember` | `e2e-member-s{SHARD}@inbox.mailtrap.io`    | user          | Team member, standard access        |
| `viewer`     | `e2e-viewer-s{SHARD}@inbox.mailtrap.io`    | user          | Read-only project access            |
| `onboarding` | `e2e-onboarding-s{SHARD}@inbox.mailtrap.io`| user          | Dedicated for onboarding tests      |

**Password:** All test users use `E2ETestPassword123!`
**Default User:** `teamLead` is used for most authenticated tests.

### Test Organization

All test users share a single organization:

| Property          | Value        |
| ----------------- | ------------ |
| Organization Name | `Nixelo E2E` |
| Organization Slug | `nixelo-e2e` |

This ensures deterministic URLs: `http://localhost:5555/nixelo-e2e/dashboard`

### Automatic User Setup

Test users are created automatically by `global-setup.ts` on each run:

1. Deletes any existing user and their organization (ensures fresh state)
2. Creates user via E2E API endpoint (bypasses email verification)
3. Signs in via browser to get auth tokens
4. Saves auth state to `e2e/.auth/user-*.json`

**Important:** Auth state is NOT cached - fresh tokens are created each run to avoid Convex refresh token rotation issues.

### Auth State Files

Auth state files include a worker index suffix for parallel execution:

| File Pattern                              | User                |
| ----------------------------------------- | ------------------- |
| `e2e/.auth/user-admin-{workerIndex}.json` | Platform admin      |
| `e2e/.auth/user-teamlead-{workerIndex}.json` | Team lead (default) |
| `e2e/.auth/user-member-{workerIndex}.json`   | Team member         |
| `e2e/.auth/user-viewer-{workerIndex}.json`   | Viewer              |
| `e2e/.auth/user-onboarding-{workerIndex}.json` | Onboarding user   |

### IMPORTANT: Convex Auth Token Rotation

**Convex Auth uses refresh token rotation** - once a refresh token is used, it's invalidated and a new one is issued. This has critical implications for E2E testing:

**The Problem:**

1. Global setup signs in users and saves auth state (JWT + refresh token) to files
2. Test 1 loads auth from file, uses tokens → tokens get rotated in browser
3. Test 2 loads auth from SAME file → old tokens are now INVALID
4. Test 2 fails with authentication errors

**The Solution (implemented in `global-setup.ts`):**

```typescript
// Always delete stale auth files and create fresh tokens
if (fs.existsSync(authStatePath)) {
  fs.unlinkSync(authStatePath);
  console.log(`  🗑️ ${userKey}: Deleted stale auth state`);
}
```

**Key Rules for Convex Auth E2E Tests:**

1. **Never reuse auth state** - Always create fresh auth per test run
2. **Consolidate related tests** - Tests sharing the same user should be in one test file
3. **One user per test** - Don't use multiple auth contexts in a single test (tokens rotate independently)
4. **Worker isolation** - Use `--workers=1` for RBAC tests to ensure sequential execution

### Using Authenticated Tests

```typescript
import { authenticatedTest, expect } from "./fixtures";

authenticatedTest("shows dashboard", async ({ dashboardPage }) => {
  await dashboardPage.goto();
  await expect(dashboardPage.dashboardTab).toBeVisible();
});
```

### Re-Authentication After Sign Out

Tests that run after sign-out (which invalidates tokens) use `ensureAuthenticated`:

```typescript
test("test after signout", async ({ page, ensureAuthenticated }) => {
  await ensureAuthenticated(); // Re-logs in if needed
  // ... rest of test
});
```

### Skipping Auth State Save

Tests that modify auth state should use `skipAuthSave` to prevent corrupting the auth file:

```typescript
test.describe("Sign Out Tests", () => {
  test.use({ skipAuthSave: true });

  test("can sign out", async ({ page }) => {
    // This test invalidates tokens but won't corrupt auth file
  });
});
```

### Auth Fixture Implementation

```typescript
// e2e/fixtures/auth.fixture.ts
export const authenticatedTest = base.extend<AuthFixtures>({
  storageState: AUTH_PATHS.teamLead, // Uses saved cookies/localStorage
  skipAuthSave: [false, { option: true }], // Option to skip saving

  ensureAuthenticated: async ({ page }, use) => {
    // Re-authenticates if tokens are invalid
  },

  saveAuthState: async ({ context, skipAuthSave }, use) => {
    // Saves auth state after test (unless skipAuthSave is true)
  },
});
```

## OTP Verification via E2E API

For tests requiring email verification (signup, password reset), we use dedicated E2E API endpoints on the Convex backend that bypass actual email delivery and return OTP codes directly.

### How It Works

```
┌─────────────┐     ┌─────────────────────┐
│   E2E Test  │     │   Convex Backend    │
│             │     │   (E2E endpoints)   │
└──────┬──────┘     └──────────┬──────────┘
       │                       │
       │ 1. Create test user   │
       │  POST /e2e/create-test-user
       │──────────────────────>│
       │                       │
       │ 2. Request OTP        │
       │  GET /e2e/get-latest-otp?email=...
       │──────────────────────>│
       │                       │
       │ 3. Return OTP code    │
       │<──────────────────────│
       │                       │
       │ 4. Submit OTP in UI   │
       │──────────────────────>│
       │                       │
       │ 5. Verified!          │
       │<──────────────────────│
```

### E2E API Endpoints

Configured in `e2e/config.ts` (`E2E_ENDPOINTS`):

| Endpoint                | Method | Description                            |
| ----------------------- | ------ | -------------------------------------- |
| `/e2e/create-test-user` | POST   | Create user (bypasses email verify)    |
| `/e2e/delete-test-user` | POST   | Delete test user                       |
| `/e2e/get-latest-otp`   | GET    | Get latest OTP code for email          |
| `/e2e/login-test-user`  | POST   | Login via API                          |
| `/e2e/reset-onboarding` | POST   | Reset onboarding state                 |
| `/e2e/setup-rbac-project` | POST | Set up RBAC test project with roles   |
| `/e2e/seed-templates`   | POST   | Seed project templates                 |
| `/e2e/nuke-test-users`  | POST   | Force delete all test users            |

### OTP Utilities

**Files:** `e2e/utils/otp-helpers.ts`, `e2e/utils/helpers.ts`

```typescript
import { getLatestOTP } from "./utils/otp-helpers";

// Get OTP for a test email via E2E API endpoint
const otp = await getLatestOTP(testEmail);
```

### Generating Test Emails

```typescript
import { generateTestEmail } from "./config";

// Generates: prefix-{timestamp}@inbox.mailtrap.io
const email = generateTestEmail("signup-test");
```

### Troubleshooting

**OTP not returned:**

- Verify the Convex dev server is running
- Check that E2E API routes are registered (`convex/http.ts`)
- Verify `VITE_CONVEX_URL` is set in `.env.local`

**E2E API returning 401:**

- Check `E2E_API_KEY` is set if required
- Verify the endpoint exists in your Convex deployment

## Selector Strategy

### Preferred Selectors (Accessible)

```typescript
// Role-based (most resilient)
page.getByRole("button", { name: /submit/i });
page.getByRole("heading", { name: /welcome/i });
page.getByRole("link", { name: /home/i });

// Form inputs
page.getByLabel("Email");
page.getByPlaceholder("Enter your email");

// Visible text
page.getByText("Sign in");
page.getByText(/welcome back/i);
```

### Avoid

```typescript
// CSS selectors (brittle)
page.locator(".btn-primary");
page.locator("#submit-button");

// XPath (complex, hard to maintain)
page.locator("//button[@type='submit']");
```

### Test IDs (Last Resort)

Only use when accessible selectors aren't possible:

```typescript
// In component
<div data-testid="user-avatar" />

// In test
page.getByTestId("user-avatar")
```

## Writing Tests

### Test Structure

```typescript
import { test, expect } from "./fixtures";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto();
  });

  test("does something expected", async ({ authPage }) => {
    // Arrange - setup is in beforeEach

    // Act
    await authPage.signIn("user@example.com", "password");

    // Assert
    await expect(authPage.page).toHaveURL(/dashboard/);
  });
});
```

### Test Categories

**UI Tests** (no backend required):

```typescript
test("displays sign in form", async ({ authPage }) => {
  await authPage.goto();
  await expect(authPage.emailInput).toBeVisible();
  await expect(authPage.passwordInput).toBeVisible();
});
```

**Integration Tests** (requires backend):

```typescript
test("sign up sends verification email", async ({ authPage }) => {
  await authPage.goto();
  await authPage.signUp("new@example.com", "Password123!");
  await authPage.expectVerificationForm();
});
```

### Skipping Tests

```typescript
// Skip individual test
test.skip("feature not implemented", async () => {});

// Skip conditionally
test("only on CI", async () => {
  test.skip(!process.env.CI, "CI only");
});

// Skip entire describe block
test.describe.skip("WIP feature", () => {});
```

## Debugging

### Visual Debugging

```bash
pnpm e2e:debug
```

This opens Playwright Inspector where you can:

- Step through tests
- View page state
- Generate selectors
- See action logs

### Trace Viewer

Failed tests in CI generate traces:

```bash
# View trace file
npx playwright show-trace trace.zip
```

### Screenshots

Failed tests capture screenshots to `test-results/`:

```typescript
// Manual screenshot
await page.screenshot({ path: "debug.png" });

// Via page object
await authPage.screenshot("login-form");
```

### Console Logs

```typescript
test("debug example", async ({ page }) => {
  page.on("console", (msg) => console.log(msg.text()));
  // ... test code
});
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Install Playwright
  run: npx playwright install chromium

- name: Run E2E tests
  run: pnpm e2e
  env:
    CI: true
```

### Reporter Configuration

```typescript
// playwright.config.ts
reporter: process.env.CI
  ? [["html", { open: "never" }], ["github"]]
  : [["html", { open: "on-failure" }]],
```

## AI-Assisted Testing (MCP)

The Playwright MCP Server enables Claude Code to interact with your app visually.

### Configuration

`.claude/mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "true"
      }
    }
  }
}
```

### Manual Usage

```bash
npx @playwright/mcp@latest
```

### Capabilities

- Navigate the app
- Interact with elements
- Generate test assertions
- Debug failing tests visually

## Best Practices

1. **Use page objects** - Keep selectors in one place
2. **Test user flows** - Not implementation details
3. **Use role-based selectors** - More resilient to changes
4. **Keep tests independent** - No shared state
5. **Use fixtures** - For common setup/teardown
6. **Test error states** - Not just happy paths
7. **Run locally before CI** - Catch issues early

## Troubleshooting

### Tests timeout

- Increase timeout in config
- Check if server is running
- Verify selectors match current UI

### Element not found

- Use Playwright Inspector to find correct selector
- Check if element is in viewport
- Verify element is not in shadow DOM

### Flaky tests

- Add explicit waits for dynamic content
- Use `.toPass()` retry pattern for operations that may need retries due to React re-renders
- Avoid `waitForLoadState("networkidle")` - Convex WebSocket connections prevent it from resolving
- Use `waitForLoadState("domcontentloaded")` instead
- Check for race conditions with element detachment (especially with cmdk/dialog components)

## RBAC Testing

RBAC (Role-Based Access Control) tests verify permission boundaries for different user roles.

### Test Structure

RBAC tests are consolidated by role to avoid token rotation issues:

```
e2e/
├── fixtures/
│   └── rbac.fixture.ts    # RBAC-specific fixtures (admin/editor/viewer contexts)
└── rbac.spec.ts           # Consolidated RBAC tests (3 tests, one per role)
```

### Test Users & Roles

| Role   | User         | Permissions                                             |
| ------ | ------------ | ------------------------------------------------------- |
| Admin  | `teamLead`   | Full control - manage settings, members, delete project |
| Editor | `teamMember` | Create/edit issues, sprints, documents                  |
| Viewer | `viewer`     | Read-only access, can only view and comment             |

### Running RBAC Tests

```bash
# Run all RBAC tests (must use --workers=1)
pnpm e2e --grep "admin has full|editor has limited|viewer has read-only" --workers=1

# Run specific role test
pnpm e2e --grep "admin has full" --workers=1
```

### RBAC Fixtures

The `rbacTest` fixture provides authenticated contexts for each role:

```typescript
import { rbacTest, expect } from "./fixtures";

rbacTest(
  "admin has full project access",
  async ({
    adminPage, // Admin's page instance
    gotoRbacProject, // Helper to navigate to RBAC project
    rbacProjectKey, // Project key (e.g., "RBAC")
    rbacOrgSlug, // Organization slug from API
  }) => {
    await gotoRbacProject(adminPage);
    // ... test admin permissions
  },
);
```

### Why Tests Are Consolidated

Due to Convex auth token rotation, each role's tests must be in a SINGLE test:

**Before (17 tests - FAILED):**

```typescript
rbacTest("admin can view board", ...);     // Uses admin token → ROTATED
rbacTest("admin can create issue", ...);   // Same file → OLD TOKEN → FAIL
```

**After (3 tests - PASSES):**

```typescript
rbacTest("admin has full project access", async ({ adminPage }) => {
  // All admin assertions in ONE test
  // 1. View board ✓
  // 2. Create issue ✓
  // 3. Access settings ✓
  // ... etc
});
```

### RBAC Config

RBAC project configuration is saved by global-setup:

```
e2e/.auth/rbac-config.json
{
  "projectKey": "RBAC",
  "orgSlug": "nixelo-e2e",  // Deterministic slug for all test users
  "projectId": "...",
  "organizationId": "..."
}
```

This file is read by `rbac.fixture.ts` to get the correct organization slug for navigation URLs.

---

**Related Documentation:**

- [Docs Index](../README.md)
- [E2E Test Files](../../e2e/)
- [Playwright Docs](https://playwright.dev/docs/intro)

---

_Last Updated: 2026-01-28_
