import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";

// Mock sidebar hook
vi.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: vi.fn(() => ({
    isCollapsed: false,
    isMobileOpen: false,
    toggleCollapse: vi.fn(),
    toggleMobile: vi.fn(),
    closeMobile: vi.fn(),
  })),
}));

// Mock heavy child components
vi.mock("@/components/GlobalSearch", () => ({
  GlobalSearch: () => <div data-testid="mock-global-search">GlobalSearch</div>,
}));

vi.mock("@/components/Notifications", () => ({
  NotificationCenter: () => <div data-testid="mock-notification-center">NotificationCenter</div>,
}));

vi.mock("@/components/TimeTracking/TimerWidget", () => ({
  TimerWidget: () => <div data-testid="mock-timer-widget">TimerWidget</div>,
}));

vi.mock("@/components/UserMenu", () => ({
  UserMenu: () => <div data-testid="mock-user-menu">UserMenu</div>,
}));

import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the header with mobile menu toggle", () => {
    render(<AppHeader />);

    const toggleButton = screen.getByRole("button", { name: /toggle sidebar menu/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it("renders global search, notification center, and user menu", () => {
    render(<AppHeader />);

    expect(screen.getByTestId("mock-global-search")).toBeInTheDocument();
    expect(screen.getByTestId("mock-notification-center")).toBeInTheDocument();
    expect(screen.getByTestId("mock-user-menu")).toBeInTheDocument();
    expect(screen.getByTestId("mock-timer-widget")).toBeInTheDocument();
  });

  it("renders keyboard shortcuts button when onShowShortcutsHelp is provided", () => {
    const onShowShortcutsHelp = vi.fn();
    render(<AppHeader onShowShortcutsHelp={onShowShortcutsHelp} />);

    const shortcutsButton = screen.getByTestId(TEST_IDS.HEADER.SHORTCUTS_BUTTON);
    expect(shortcutsButton).toBeInTheDocument();
    expect(shortcutsButton).toHaveAttribute("aria-label", "Keyboard shortcuts");
  });

  it("does not render keyboard shortcuts button when onShowShortcutsHelp is not provided", () => {
    render(<AppHeader />);

    expect(screen.queryByTestId(TEST_IDS.HEADER.SHORTCUTS_BUTTON)).not.toBeInTheDocument();
  });
});
