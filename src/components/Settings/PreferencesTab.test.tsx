import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { PreferencesTab } from "./PreferencesTab";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

describe("PreferencesTab", () => {
  it("renders theme selection", () => {
    render(
      <ThemeProvider>
        <PreferencesTab />
      </ThemeProvider>,
    );

    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByLabelText("Light theme")).toBeInTheDocument();
    expect(screen.getByLabelText("Dark theme")).toBeInTheDocument();
    expect(screen.getByLabelText("System theme")).toBeInTheDocument();
  });

  it("changes theme when clicked", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <PreferencesTab />
      </ThemeProvider>,
    );

    const darkButton = screen.getByLabelText("Dark theme");
    await user.click(darkButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith("nixelo-theme", "dark");
  });
});
