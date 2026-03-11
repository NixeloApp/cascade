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
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
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
      <Flex align="center" gap="sm" className="relative mx-auto max-w-screen-2xl sm:gap-3">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-brand/15 to-transparent" />

        <Flex align="center" gap="sm" className="sm:gap-3">
          <Button
            chrome="framed"
            chromeSize="icon"
            onClick={toggleMobile}
            className="lg:hidden"
            aria-label="Toggle sidebar menu"
            aria-expanded={isMobileOpen}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <Card
            recipe="controlStrip"
            padding="none"
            className="hidden px-3 py-1.5 lg:flex lg:items-center lg:gap-3"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-brand shadow-brand-halo" />
            <div className="min-w-0">
              <Typography
                variant="caption"
                className="block uppercase tracking-widest text-ui-text-muted"
              >
                Workspace cockpit
              </Typography>
              <Typography variant="small" className="block max-w-48 truncate font-medium">
                Search, track, and act from one surface
              </Typography>
            </div>
          </Card>
        </Flex>

        <FlexItem grow className="min-w-0">
          <GlobalSearch commands={commands} />
        </FlexItem>

        <Card recipe="controlRail" padding="none" className="shrink-0 p-1">
          <Flex align="center" gap="xs" className="sm:gap-1.5">
            {onShowShortcutsHelp && (
              <Tooltip content="Keyboard shortcuts">
                <Button
                  chrome="quiet"
                  chromeSize="icon"
                  onClick={onShowShortcutsHelp}
                  className="hidden sm:inline-flex"
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
            <NotificationCenter />
            <UserMenu />
          </Flex>
        </Card>
      </Flex>
    </header>
  );
}
