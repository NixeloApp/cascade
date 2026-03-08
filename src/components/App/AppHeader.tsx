/**
 * App Header
 *
 * Main application header with global navigation controls.
 * Contains search trigger, notification center, timer widget, and user menu.
 * Responsive with mobile hamburger menu for sidebar toggle.
 */

import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/components/Notifications";
import { TimerWidget as NavTimerWidget } from "@/components/TimeTracking/TimerWidget";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSidebarState } from "@/hooks/useSidebarState";
import { Menu } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import type { CommandAction } from "../CommandPalette";

interface AppHeaderProps {
  commands?: CommandAction[];
  onShowShortcutsHelp?: () => void;
}

/**
 * Main application header with search, notifications, and user menu.
 */
export function AppHeader({ commands, onShowShortcutsHelp }: AppHeaderProps) {
  const { isMobileOpen, toggleMobile } = useSidebarState();

  return (
    <header className="sticky top-0 z-40 bg-ui-bg/85 backdrop-blur-md border-b border-ui-border/70 px-3 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center gap-2 transition-all duration-default">
      <Flex align="center" gap="sm" className="sm:gap-3">
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

      <Flex align="center" gap="xs" className="min-w-0 shrink-0 sm:gap-2">
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
        <GlobalSearch commands={commands} />
        <NotificationCenter />
        <UserMenu />
      </Flex>
    </header>
  );
}
