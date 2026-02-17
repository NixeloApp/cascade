import type { Meta, StoryObj } from "@storybook/react";
import { Bell, Menu, Search } from "lucide-react";
import { Flex, FlexItem } from "./ui/Flex";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface AppHeaderPresentationalProps {
  showCommandPalette?: boolean;
  showShortcutsHelp?: boolean;
  showTimer?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onShowCommandPalette?: () => void;
  onShowShortcutsHelp?: () => void;
}

// =============================================================================
// Presentational Component
// =============================================================================

function AppHeaderPresentational({
  showCommandPalette = true,
  showShortcutsHelp = true,
  showTimer = true,
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
  isMobileMenuOpen = false,
  onToggleMobileMenu = () => {},
  onShowCommandPalette = () => {},
  onShowShortcutsHelp = () => {},
}: AppHeaderPresentationalProps) {
  return (
    <header className="sticky top-0 z-40 bg-ui-bg/80 backdrop-blur-md border-b border-ui-border/50 px-4 sm:px-6 py-3 flex justify-between items-center gap-2 transition-all duration-default">
      <Flex align="center" gap="sm" className="sm:gap-4">
        {/* Mobile Hamburger Menu */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover rounded-lg transition-all duration-default"
          aria-label="Toggle sidebar menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Menu className="w-5 h-5" />
        </button>
      </Flex>

      <Flex align="center" gap="sm" className="sm:gap-3 shrink-0">
        {showCommandPalette && (
          <button
            type="button"
            onClick={onShowCommandPalette}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-ui-text-secondary bg-ui-bg-soft border border-ui-border/50 rounded-lg hover:bg-ui-bg-hover hover:border-ui-border hover:text-ui-text transition-all duration-default"
            aria-label="Open command palette"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="hidden sm:inline text-current">Commands</span>
            <Typography
              as="kbd"
              className="hidden lg:inline px-1.5 py-0.5 text-xs text-ui-text-tertiary bg-ui-bg border border-ui-border/50 rounded font-mono"
            >
              Cmd+K
            </Typography>
          </button>
        )}

        {showShortcutsHelp && (
          <Tooltip content="Keyboard shortcuts">
            <button
              type="button"
              onClick={onShowShortcutsHelp}
              className="hidden sm:flex items-center justify-center p-2 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover rounded-lg transition-all duration-default"
              aria-label="Keyboard shortcuts"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </Tooltip>
        )}

        {showTimer && (
          <Flex
            align="center"
            gap="sm"
            className="hidden sm:inline-flex px-3 py-1.5 text-ui-text-secondary bg-ui-bg-soft border border-ui-border/50 rounded-lg"
          >
            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <Typography variant="small" className="font-mono">
              00:32:15
            </Typography>
          </Flex>
        )}

        {showSearch && (
          <Tooltip content="Search">
            <button
              type="button"
              className="p-2 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover rounded-lg transition-all duration-default"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </Tooltip>
        )}

        {showNotifications && (
          <Tooltip content="Notifications">
            <button
              type="button"
              className="relative p-2 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover rounded-lg transition-all duration-default"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full" />
            </button>
          </Tooltip>
        )}

        {showUserMenu && (
          <button
            type="button"
            className="rounded-full p-0.5 hover:ring-2 hover:ring-ui-border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 transition-all duration-default"
            aria-label="User menu"
          >
            <Flex
              align="center"
              justify="center"
              className="w-8 h-8 rounded-full bg-brand text-brand-foreground"
            >
              <Typography variant="small" className="font-medium">
                AC
              </Typography>
            </Flex>
          </button>
        )}
      </Flex>
    </header>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AppHeaderPresentational> = {
  title: "Components/AppHeader",
  component: AppHeaderPresentational,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The main application header with command palette, shortcuts help, timer widget, search, notifications, and user menu.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    showCommandPalette: true,
    showShortcutsHelp: true,
    showTimer: true,
    showSearch: true,
    showNotifications: true,
    showUserMenu: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Full app header with all elements visible.",
      },
    },
  },
};

export const Minimal: Story = {
  args: {
    showCommandPalette: false,
    showShortcutsHelp: false,
    showTimer: false,
    showSearch: true,
    showNotifications: true,
    showUserMenu: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Minimal header with only essential elements.",
      },
    },
  },
};

export const NoTimer: Story = {
  args: {
    showCommandPalette: true,
    showShortcutsHelp: true,
    showTimer: false,
    showSearch: true,
    showNotifications: true,
    showUserMenu: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Header without the timer widget.",
      },
    },
  },
};

export const WithAppLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-ui-bg">
      <AppHeaderPresentational />
      <div className="p-8">
        <Typography variant="h1" className="mb-4">
          Dashboard
        </Typography>
        <Typography variant="p" color="secondary">
          The header stays sticky at the top of the page.
        </Typography>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Header in the context of a full app layout.",
      },
    },
  },
};

export const MobileView: Story = {
  render: () => (
    <div className="max-w-sm mx-auto border border-ui-border rounded-lg overflow-hidden">
      <AppHeaderPresentational />
      <div className="p-4 bg-ui-bg">
        <Typography variant="p" color="secondary" className="text-center">
          Mobile viewport - hamburger menu visible
        </Typography>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Header on mobile showing the hamburger menu button.",
      },
    },
  },
};

export const WithSidebar: Story = {
  render: () => (
    <Flex className="min-h-screen bg-ui-bg">
      <aside className="hidden lg:block w-64 border-r border-ui-border bg-ui-bg-secondary p-4">
        <Typography variant="label" className="mb-4">
          Sidebar
        </Typography>
        <nav className="space-y-2">
          <Typography variant="small" className="p-2 rounded bg-brand/10 text-brand block">
            Dashboard
          </Typography>
          <Typography
            variant="small"
            color="secondary"
            className="p-2 rounded hover:bg-ui-bg-hover block"
          >
            Projects
          </Typography>
          <Typography
            variant="small"
            color="secondary"
            className="p-2 rounded hover:bg-ui-bg-hover block"
          >
            Issues
          </Typography>
        </nav>
      </aside>
      <FlexItem flex="1">
        <AppHeaderPresentational />
        <main className="p-8">
          <Typography variant="h1" className="mb-4">
            Dashboard
          </Typography>
          <Typography variant="p" color="secondary">
            Main content area
          </Typography>
        </main>
      </FlexItem>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Header shown alongside a sidebar in a typical app layout.",
      },
    },
  },
};

export const HeaderElements: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div>
        <Typography variant="label" className="mb-3 block">
          Command Palette Button
        </Typography>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-ui-text-secondary bg-ui-bg-soft border border-ui-border/50 rounded-lg hover:bg-ui-bg-hover hover:border-ui-border hover:text-ui-text transition-all duration-default"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Commands</span>
          <kbd className="px-1.5 py-0.5 text-xs text-ui-text-tertiary bg-ui-bg border border-ui-border/50 rounded font-mono">
            Cmd+K
          </kbd>
        </button>
      </div>

      <div>
        <Typography variant="label" className="mb-3 block">
          Timer Widget
        </Typography>
        <Flex
          align="center"
          gap="sm"
          className="inline-flex px-3 py-1.5 text-ui-text-secondary bg-ui-bg-soft border border-ui-border/50 rounded-lg"
        >
          <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <Typography variant="small" className="font-mono">
            00:32:15
          </Typography>
        </Flex>
      </div>

      <div>
        <Typography variant="label" className="mb-3 block">
          Icon Buttons
        </Typography>
        <Flex gap="sm">
          <button
            type="button"
            className="p-2 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover rounded-lg transition-all"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="relative p-2 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover rounded-lg transition-all"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full" />
          </button>
        </Flex>
      </div>

      <div>
        <Typography variant="label" className="mb-3 block">
          User Avatar
        </Typography>
        <button
          type="button"
          className="rounded-full p-0.5 hover:ring-2 hover:ring-ui-border transition-all"
        >
          <Flex
            align="center"
            justify="center"
            className="w-8 h-8 rounded-full bg-brand text-brand-foreground"
          >
            <Typography variant="small" className="font-medium">
              AC
            </Typography>
          </Flex>
        </button>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Individual header elements showcased separately.",
      },
    },
  },
};
