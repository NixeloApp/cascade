/**
 * User Menu
 *
 * User profile dropdown with settings and sign out options.
 * Shows user avatar, name, and email in the trigger button.
 * Links to profile settings and handles sign out action.
 */

import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { Stack } from "@/components/ui/Stack";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
import { LogOut, Settings } from "@/lib/icons";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { Icon } from "./ui/Icon";
import { Typography } from "./ui/Typography";
/** User dropdown menu with settings and sign out options. */
export function UserMenu() {
  const user = useAuthenticatedQuery(api.users.getCurrent, {});
  const { signOut } = useAuthActions();
  const org = useOrganizationOptional();
  const orgSlug = org?.orgSlug;

  // Don't render menu if user data isn't ready
  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button chrome="quiet" chromeSize="icon" aria-label="User menu">
          <Avatar name={user.name} email={user.email} src={user.image} size="md" variant="brand" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent width="lg" align="end">
        <DropdownMenuLabel weight="normal">
          <Stack gap="xs">
            <Typography variant="label">{user.name || "User"}</Typography>
            <Typography variant="meta" color="secondary" className="truncate">
              {user.email}
            </Typography>
          </Stack>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgSlug && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild icon={<Icon icon={Settings} size="sm" />}>
              <Link to={ROUTES.settings.profile.path} params={{ orgSlug }} className="w-full">
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void signOut()}
          variant="danger"
          icon={<Icon icon={LogOut} size="sm" />}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
