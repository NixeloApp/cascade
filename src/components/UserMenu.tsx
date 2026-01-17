import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { LogOut, Settings } from "lucide-react";
import { Flex } from "@/components/ui/Flex";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { Avatar } from "./ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { Typography } from "./ui/Typography";

export function UserMenu() {
  const user = useQuery(api.users.getCurrent);
  const { signOut } = useAuthActions();
  const { orgSlug } = useOrganization();

  // Don't render menu if user data isn't ready
  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          aria-label="User menu"
        >
          <Avatar name={user.name} email={user.email} src={user.image} size="md" variant="brand" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <Flex direction="column" className="space-y-1">
            <Typography className="text-sm font-medium leading-none">
              {user.name || "User"}
            </Typography>
            <Typography className="text-xs leading-none text-ui-text-secondary truncate">
              {user.email}
            </Typography>
          </Flex>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              to={ROUTES.settings.profile.path}
              params={{ orgSlug }}
              className="cursor-pointer w-full"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void signOut()}
          className="cursor-pointer text-status-error focus:text-status-error"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
