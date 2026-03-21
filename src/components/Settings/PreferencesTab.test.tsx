import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOfflineUserSettingsUpdate } from "@/hooks/useOfflineUserSettingsUpdate";
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

vi.mock("@/hooks/useOfflineUserSettingsUpdate", () => ({
  useOfflineUserSettingsUpdate: vi.fn(),
}));

const mockUseOfflineUserSettingsUpdate = vi.mocked(useOfflineUserSettingsUpdate);
const mockUpdateSettings = vi.fn();

describe("PreferencesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockUseOfflineUserSettingsUpdate.mockReturnValue({
      update: mockUpdateSettings,
      isOnline: true,
      canAct: true,
      isAuthLoading: false,
    });
  });

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
    mockUpdateSettings.mockResolvedValue({ queued: false });

    render(
      <ThemeProvider>
        <PreferencesTab />
      </ThemeProvider>,
    );

    const darkButton = screen.getByLabelText("Dark theme");
    await user.click(darkButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith("nixelo-theme", "dark");
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      { theme: "dark" },
      { queuedMessage: "Theme preference saved for sync when you are back online" },
    );
  });
});
