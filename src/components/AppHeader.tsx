import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { useSidebarState } from "@/hooks/useSidebarState";
import { Menu } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationCenter } from "./NotificationCenter";
import { TimerWidget as NavTimerWidget } from "./TimeTracking/TimerWidget";
import { UserMenu } from "./UserMenu";

interface AppHeaderProps {
  onShowCommandPalette?: () => void;
  onShowShortcutsHelp?: () => void;
}

export function AppHeader({ onShowCommandPalette, onShowShortcutsHelp }: AppHeaderProps) {
  const { isMobileOpen, toggleMobile } = useSidebarState();

  return (
    <header className="sticky top-0 z-40 bg-ui-bg/80 backdrop-blur-md border-b border-ui-border/50 px-4 sm:px-6 py-3 flex justify-between items-center gap-2 transition-all duration-default">
      <Flex align="center" gap="sm" className="sm:gap-4">
        {/* Mobile Hamburger Menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobile}
          className="lg:hidden"
          aria-label="Toggle sidebar menu"
          aria-expanded={isMobileOpen}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </Flex>

      <Flex align="center" gap="sm" className="sm:gap-3 shrink-0">
        {onShowCommandPalette && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onShowCommandPalette}
            className="gap-2 px-2 sm:px-3 text-xs sm:text-sm"
            aria-label="Open command palette"
            data-tour="command-palette"
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
              ⌘K
            </Typography>
          </Button>
        )}

        {onShowShortcutsHelp && (
          <Tooltip content="Keyboard shortcuts">
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowShortcutsHelp}
              className="hidden sm:flex"
              aria-label="Keyboard shortcuts"
              data-testid={TEST_IDS.HEADER.SHORTCUTS_BUTTON}
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
            </Button>
          </Tooltip>
        )}

        <NavTimerWidget />
        <GlobalSearch />
        <NotificationCenter />
        <UserMenu />
      </Flex>
    </header>
  );
}
