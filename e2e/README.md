# E2E Testing with Playwright

End-to-end testing setup for Nixelo using [Playwright](https://playwright.dev/).

## Quick Start

```bash
# Run all E2E tests (headless)
pnpm e2e

# Run with Playwright UI (interactive, recommended for development)
pnpm e2e:ui

# Run with visible browser
pnpm e2e:headed

# Debug mode with inspector
pnpm e2e:debug
```

## Architecture

```
e2e/
├── fixtures/           # Test fixtures and setup
│   ├── test.fixture.ts      # Base fixtures with page objects
│   ├── auth.fixture.ts      # Authenticated user fixtures
│   └── index.ts
├── pages/              # Page Object Models
│   ├── auth.page.ts         # Auth forms (sign in, sign up, reset)
│   ├── dashboard.page.ts    # Main app dashboard
│   └── index.ts
├── utils/              # Test utilities
├── auth.spec.ts        # Authentication tests
└── README.md
```

## Page Object Models

We use the [Page Object Model pattern](https://playwright.dev/docs/pom) for maintainable tests:

```typescript
import { test, expect } from "./fixtures";

test("can sign in", async ({ authPage }) => {
  await authPage.goto();
  await authPage.signIn("user@example.com", "password");
  // ...
});
```

## Authentication State

Authenticated E2E tests do not require a separate manual setup script.
Auth state is handled by fixtures and runtime helpers (for example `ensureAuthenticated` in authenticated tests).

### Usage in tests

```typescript
import { authenticatedTest, expect } from "./fixtures";

authenticatedTest("shows dashboard", async ({ dashboardPage }) => {
  await dashboardPage.goto();
  await expect(dashboardPage.dashboardTab).toBeVisible();
});
```

## Test Categories

### UI Tests (no backend)
- Form rendering
- Navigation flows
- Validation states
- Component interactions

### Integration Tests (requires backend)
- Sign up → verify email flow
- Password reset flow
- Data persistence

### Smoke Tests
- Critical paths work end-to-end
- Run on every deploy

## Playwright MCP Server

We have the [Playwright MCP Server](https://github.com/microsoft/playwright-mcp) configured for AI-assisted testing.

### Setup in Claude Code

The MCP config is at `.claude/mcp.json`. Claude Code can use it to:
- Navigate and interact with the app
- Generate test assertions
- Debug failing tests visually

### Manual Usage

```bash
npx @playwright/mcp@latest
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Install Playwright
  run: npx playwright install chromium

- name: Run E2E tests
  run: pnpm e2e
  env:
    CI: true
```

## Best Practices

1. **Use page objects** - Keep selectors in one place
2. **Test user flows** - Not implementation details
3. **Use role-based selectors** - `getByRole`, `getByLabel`, `getByText`
4. **Keep tests independent** - No shared state between tests
5. **Use fixtures** - For common setup/teardown

## Debugging

### Visual Debugging
```bash
pnpm e2e:debug
```

### Trace Viewer
Failed tests in CI generate traces. Download and view:
```bash
npx playwright show-trace trace.zip
```

### Screenshots
Failed tests automatically capture screenshots in `test-results/`.

## Resources

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Authentication](https://playwright.dev/docs/auth)
