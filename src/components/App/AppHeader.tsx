/**
 * App Header
 *
 * Main application header with global navigation controls.
 * Contains search trigger, productivity controls (timer, shortcuts),
 * notification center, and user menu.
 *
 * Control groups are intentional:
 * - Left: branding/context chip (desktop only)
 * - Center: global search (grows to fill)
 * - Right: productivity | notifications | identity
 */

import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/components/Notifications";
import { TimerWidget as NavTimerWidget } from "@/components/TimeTracking/TimerWidget";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/Button";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Dot } from "@/components/ui/Dot";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { useSidebarState } from "@/hooks/useSidebarState";
import { CircleHelp, Menu } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
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
    <header className="sticky top-0 z-40">
      <Card recipe="appHeaderShell" padding="none" radius="none">
        <Flex align="center" gap="sm" className="relative mx-auto max-w-screen-2xl">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-brand/15 to-transparent" />

          {/* Left section: Mobile menu + branding chip */}
          <Flex align="center" gap="sm" className="shrink-0">
            <Button
              chrome="framed"
              chromeSize="icon"
              onClick={toggleMobile}
              className="lg:hidden"
              aria-label="Toggle sidebar menu"
              aria-expanded={isMobileOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div
              className={cn(
                getCardRecipeClassName("workspaceCockpitChip"),
                "hidden lg:flex lg:items-center lg:gap-3",
              )}
            >
              <Dot size="md" halo />
              <div className="min-w-0">
                <Typography variant="pageHeaderEyebrow" className="block">
                  Workspace cockpit
                </Typography>
                <Typography variant="label" className="block max-w-48 truncate">
                  Search, track, and act from one surface
                </Typography>
              </div>
            </div>
          </Flex>

          {/* Center section: Global search (grows to fill available space) */}
          <FlexItem grow className="min-w-0">
            <GlobalSearch commands={commands} />
          </FlexItem>

          {/* Right section: Intentional control groups */}
          <Flex align="center" gap="sm" className="shrink-0">
            {/* Group 1: Productivity controls (timer + shortcuts) */}
            <Flex align="center" gap="xs">
              <NavTimerWidget />

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
                    <CircleHelp className="h-5 w-5" />
                  </Button>
                </Tooltip>
              )}
            </Flex>

            {/* Visual separator between groups (desktop only) */}
            <div className="hidden h-5 w-px bg-ui-border/50 sm:block" aria-hidden="true" />

            {/* Group 2: Communication (notifications) */}
            <NotificationCenter />

            {/* Visual separator before identity (desktop only) */}
            <div className="hidden h-5 w-px bg-ui-border/50 sm:block" aria-hidden="true" />

            {/* Group 3: Identity (user menu) */}
            <UserMenu />
          </Flex>
        </Flex>
      </Card>
    </header>
  );
}
