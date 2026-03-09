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
    <header className="sticky top-0 z-40 border-b border-ui-border/50 bg-linear-to-b from-ui-bg/95 via-ui-bg/90 to-ui-bg/80 px-3 py-2 backdrop-blur-xl transition-all duration-default sm:px-6 sm:py-3">
      <Flex align="center" justify="between" gap="md" className="relative">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-brand/15 to-transparent" />

        <Flex align="center" gap="sm" className="sm:gap-3">
          {/* Mobile Hamburger Menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobile}
            className="h-10 w-10 rounded-full border border-ui-border/60 bg-ui-bg-elevated/90 text-ui-text-secondary shadow-soft backdrop-blur-sm hover:border-ui-border-secondary hover:bg-ui-bg-hover hover:text-ui-text lg:hidden"
            aria-label="Toggle sidebar menu"
            aria-expanded={isMobileOpen}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden rounded-full border border-ui-border/60 bg-linear-to-r from-ui-bg-elevated/95 to-ui-bg-soft/90 px-3 py-1.5 shadow-soft lg:flex lg:items-center lg:gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-brand)_12%,transparent)]" />
            <div className="min-w-0">
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ui-text-muted">
                Workspace cockpit
              </div>
              <div className="max-w-48 truncate text-sm font-medium text-ui-text">
                Search, track, and act from one surface
              </div>
            </div>
          </div>
        </Flex>

        <Flex
          align="center"
          gap="xs"
          className="min-w-0 shrink-0 rounded-full border border-ui-border/70 bg-linear-to-r from-ui-bg-elevated/95 via-ui-bg-elevated/92 to-ui-bg-soft/90 p-0.5 shadow-card backdrop-blur-xl sm:gap-2 sm:p-1"
        >
          {onShowShortcutsHelp && (
            <Tooltip content="Keyboard shortcuts">
              <Button
                variant="ghost"
                size="icon"
                onClick={onShowShortcutsHelp}
                className="hidden h-9 w-9 rounded-full border border-transparent bg-transparent text-ui-text-secondary shadow-none transition-all duration-default hover:border-ui-border/70 hover:bg-ui-bg-soft hover:text-ui-text sm:flex"
                aria-label="Keyboard shortcuts"
                data-testid={TEST_IDS.HEADER.SHORTCUTS_BUTTON}
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
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
      </Flex>
    </header>
  );
}
