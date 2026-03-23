# Unit Testing with Vitest

Frontend unit testing for Nixelo using [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/react).

## Quick Start

```bash
# Run tests in watch mode
pnpm test

# Run with interactive UI
pnpm test:ui

# Run with coverage report
pnpm test:coverage

# Run once (CI mode)
pnpm test run
```

## Configuration

**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,              // No need to import describe, it, expect
    environment: "jsdom",       // Browser-like environment
    setupFiles: ["./src/test/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Setup File

**File:** `src/test/setup.ts`

```typescript
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Automatic cleanup after each test
afterEach(() => {
  cleanup();
});
```

## Test File Location

Place test files next to the code they test:

```
src/
├── components/
│   ├── MyComponent.tsx
│   └── MyComponent.test.tsx    # Co-located test
├── lib/
│   ├── utils.ts
│   └── utils.test.ts           # Co-located test
└── hooks/
    ├── useMyHook.ts
    └── useMyHook.test.ts       # Co-located test
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("should handle user interaction", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Clicked")).toBeInTheDocument();
  });
});
```

### Testing with Props

```typescript
it("should display the provided name", () => {
  render(<Greeting name="Alice" />);
  expect(screen.getByText("Hello, Alice!")).toBeInTheDocument();
});

it("should apply custom className", () => {
  render(<Button className="custom">Click</Button>);
  expect(screen.getByRole("button")).toHaveClass("custom");
});
```

### Testing User Events

```typescript
import userEvent from "@testing-library/user-event";

it("should call onClick when clicked", async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();

  render(<Button onClick={handleClick}>Click me</Button>);
  await user.click(screen.getByRole("button"));

  expect(handleClick).toHaveBeenCalledOnce();
});

it("should update input value", async () => {
  const user = userEvent.setup();
  render(<Input />);

  const input = screen.getByRole("textbox");
  await user.type(input, "Hello");

  expect(input).toHaveValue("Hello");
});
```

## Mocking

### Mocking Convex Hooks

```typescript
import { vi } from "vitest";

// Mock the entire module
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// In your test
import { useQuery, useMutation } from "convex/react";

it("should render data from query", () => {
  vi.mocked(useQuery).mockReturnValue([
    { id: "1", name: "Test" },
  ]);

  render(<MyComponent />);
  expect(screen.getByText("Test")).toBeInTheDocument();
});
```

### Mocking Components

```typescript
vi.mock("./ImportExportModal", () => ({
  ImportExportModal: vi.fn(({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="import-export-modal">
        <button onClick={onClose}>Close</button>
      </div>
    );
  }),
}));
```

### Mocking Modules

```typescript
// Mock a utility function
vi.mock("@/lib/utils", () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(" ")),
  formatDate: vi.fn(() => "Jan 1, 2025"),
}));
```

### Mocking Fetch/API Calls

```typescript
beforeEach(() => {
  global.fetch = vi.fn();
});

it("should fetch data", async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: "test" }),
  } as Response);

  render(<DataFetcher />);
  await waitFor(() => {
    expect(screen.getByText("test")).toBeInTheDocument();
  });
});
```

## Selector Strategy

### Preferred Selectors (Accessible)

```typescript
// Role-based (recommended)
screen.getByRole("button", { name: /submit/i })
screen.getByRole("heading", { name: /welcome/i })
screen.getByRole("textbox", { name: /email/i })

// Label-based (for form inputs)
screen.getByLabelText("Email")
screen.getByLabelText(/password/i)

// Text-based
screen.getByText("Sign in")
screen.getByText(/welcome back/i)

// Placeholder (when no label)
screen.getByPlaceholder("Enter email")
```

### Test IDs (For Mocks/Dynamic Content)

```typescript
// In mocked component
<div data-testid="modal-content">...</div>

// In test
screen.getByTestId("modal-content")
```

### Query Variants

| Query | Throws if not found | Returns |
|-------|---------------------|---------|
| `getBy*` | Yes | Element |
| `queryBy*` | No | Element or null |
| `findBy*` | Yes (async) | `Promise<Element>` |
| `getAllBy*` | Yes | Element[] |
| `queryAllBy*` | No | Element[] |
| `findAllBy*` | Yes (async) | `Promise<Element[]>` |

```typescript
// Use getBy for elements that should exist
expect(screen.getByRole("button")).toBeInTheDocument();

// Use queryBy for elements that might not exist
expect(screen.queryByText("Error")).not.toBeInTheDocument();

// Use findBy for async elements
await expect(screen.findByText("Loaded")).resolves.toBeInTheDocument();
```

## Async Testing

### Waiting for Elements

```typescript
import { waitFor, waitForElementToBeRemoved } from "@testing-library/react";

// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});

// Wait for element to disappear
await waitForElementToBeRemoved(() => screen.queryByText("Loading..."));

// Use findBy (built-in wait)
const element = await screen.findByText("Loaded");
```

### Testing Loading States

```typescript
it("should show loading then content", async () => {
  vi.mocked(useQuery).mockReturnValue(undefined); // Loading

  const { rerender } = render(<DataComponent />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();

  vi.mocked(useQuery).mockReturnValue({ data: "test" });
  rerender(<DataComponent />);

  expect(screen.getByText("test")).toBeInTheDocument();
});
```

## Testing Patterns

### Testing Forms

```typescript
it("should submit form with valid data", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<ContactForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText("Name"), "Alice");
  await user.type(screen.getByLabelText("Email"), "alice@example.com");
  await user.click(screen.getByRole("button", { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    name: "Alice",
    email: "alice@example.com",
  });
});
```

### Testing Conditional Rendering

```typescript
it("should show error message when invalid", async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.click(screen.getByRole("button", { name: /submit/i }));

  expect(screen.getByText("Email is required")).toBeInTheDocument();
});

it("should not show error when valid", () => {
  render(<Form defaultValues={{ email: "test@test.com" }} />);
  expect(screen.queryByText("Email is required")).not.toBeInTheDocument();
});
```

### Testing Modals/Dialogs

```typescript
it("should open and close modal", async () => {
  const user = userEvent.setup();
  render(<ModalTrigger />);

  // Modal should not be visible initially
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  // Open modal
  await user.click(screen.getByRole("button", { name: /open/i }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  // Close modal
  await user.click(screen.getByRole("button", { name: /close/i }));
  await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
});
```

## Custom Matchers

React Testing Library provides jest-dom matchers:

```typescript
// Visibility
expect(element).toBeVisible();
expect(element).toBeInTheDocument();

// Attributes
expect(element).toHaveAttribute("type", "submit");
expect(element).toHaveClass("btn-primary");
expect(input).toHaveValue("test");

// State
expect(input).toBeDisabled();
expect(checkbox).toBeChecked();
expect(input).toBeRequired();
expect(input).toBeValid();

// Text content
expect(element).toHaveTextContent("Hello");
expect(element).toHaveTextContent(/hello/i);
```

## Debugging

### Screen Debug

```typescript
it("debug example", () => {
  render(<MyComponent />);

  // Print entire DOM
  screen.debug();

  // Print specific element
  screen.debug(screen.getByRole("button"));
});
```

### Testing Playground

```typescript
it("find selectors", () => {
  render(<MyComponent />);

  // Opens testing playground in browser
  screen.logTestingPlaygroundURL();
});
```

## Coverage

Run coverage report:

```bash
pnpm test:coverage
```

Coverage output:
- `coverage/` - HTML report (open in browser)
- Console - Text summary

### Coverage Exclusions

Configured in `vitest.config.ts`:

```typescript
coverage: {
  exclude: [
    "node_modules/",
    "src/test/",
    "**/*.d.ts",
    "**/*.config.*",
    "**/mockData",
    "convex/_generated/",
  ],
}
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what users see
2. **Use accessible selectors** - `getByRole`, `getByLabelText`
3. **Avoid test IDs** - Except for mocks or complex dynamic content
4. **One assertion per test** - When practical
5. **Use descriptive names** - `it("should show error when email is invalid")`
6. **Setup user events once** - `const user = userEvent.setup()`
7. **Mock at boundaries** - Convex hooks, fetch, external modules
8. **Test error states** - Not just happy paths

## Troubleshooting

### Element not found

```typescript
// Use screen.debug() to see current DOM
screen.debug();

// Check if element is async
const element = await screen.findByText("Loaded");
```

### Act warnings

```typescript
// Wrap state updates in act (usually automatic)
import { act } from "@testing-library/react";

await act(async () => {
  await user.click(button);
});
```

### Timer issues

```typescript
// Use fake timers for setTimeout/setInterval
vi.useFakeTimers();

it("should timeout", () => {
  render(<TimerComponent />);
  vi.advanceTimersByTime(5000);
  expect(screen.getByText("Timeout")).toBeInTheDocument();
});

afterEach(() => {
  vi.useRealTimers();
});
```

---

**Related Documentation:**
- [Docs Index](../README.md)
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [jest-dom Matchers](https://github.com/testing-library/jest-dom)

---

*Last Updated: 2025-11-27*
