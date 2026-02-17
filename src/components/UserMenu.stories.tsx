import type { Meta, StoryObj } from "@storybook/react";
import { LogOut, Settings } from "lucide-react";
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
import { Flex } from "./ui/Flex";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface User {
  name: string;
  email: string;
  image?: string;
}

interface UserMenuPresentationalProps {
  user: User;
  showSettings?: boolean;
  onSettings?: () => void;
  onSignOut?: () => void;
}

// =============================================================================
// Presentational Component
// =============================================================================

function UserMenuPresentational({
  user,
  showSettings = true,
  onSettings = () => {},
  onSignOut = () => {},
}: UserMenuPresentationalProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full p-0.5 hover:ring-2 hover:ring-ui-border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 transition-all duration-default"
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
        {showSettings && (
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onSettings} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
        {showSettings && <DropdownMenuSeparator />}
        <DropdownMenuItem
          onClick={onSignOut}
          className="cursor-pointer text-status-error focus:text-status-error"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockUser: User = {
  name: "Alice Chen",
  email: "alice.chen@example.com",
};

const mockUserWithImage: User = {
  name: "Bob Smith",
  email: "bob.smith@example.com",
};

const mockUserLongEmail: User = {
  name: "Carol Davis",
  email: "carol.davis.operations.manager@longcompanyname.example.com",
};

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof UserMenuPresentational> = {
  title: "Components/UserMenu",
  component: UserMenuPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "User menu dropdown showing user info, settings link, and sign out option. Appears in the app header.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Flex justify="end" className="p-8 min-w-80">
        <Story />
      </Flex>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    user: mockUser,
    showSettings: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Default user menu with settings and sign out options.",
      },
    },
  },
};

export const WithoutSettings: Story = {
  args: {
    user: mockUser,
    showSettings: false,
  },
  parameters: {
    docs: {
      description: {
        story: "User menu without the settings option (e.g., when no workspace is selected).",
      },
    },
  },
};

export const WithAvatarImage: Story = {
  args: {
    user: mockUserWithImage,
    showSettings: true,
  },
  parameters: {
    docs: {
      description: {
        story: "User menu with an avatar image.",
      },
    },
  },
};

export const LongEmail: Story = {
  args: {
    user: mockUserLongEmail,
    showSettings: true,
  },
  parameters: {
    docs: {
      description: {
        story: "User menu handling long email addresses with truncation.",
      },
    },
  },
};

export const InHeader: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <Flex
        align="center"
        justify="between"
        className="px-4 py-2 border-b border-ui-border bg-ui-bg"
      >
        <Typography variant="h4">Nixelo</Typography>
        <Flex align="center" gap="md">
          <Typography variant="small" color="secondary">
            Workspace Name
          </Typography>
          <UserMenuPresentational user={mockUser} />
        </Flex>
      </Flex>
      <div className="p-8 bg-ui-bg-secondary">
        <Typography variant="p" color="secondary">
          Main content area
        </Typography>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "User menu shown in the context of an app header.",
      },
    },
  },
};

export const AvatarVariants: Story = {
  render: () => (
    <Flex gap="xl" className="p-8">
      <div className="text-center">
        <UserMenuPresentational user={{ name: "Alice Chen", email: "alice@example.com" }} />
        <Typography variant="caption" className="mt-2 block">
          Initials
        </Typography>
      </div>
      <div className="text-center">
        <UserMenuPresentational user={{ name: "Bob Smith", email: "bob@example.com" }} />
        <Typography variant="caption" className="mt-2 block">
          Different User
        </Typography>
      </div>
      <div className="text-center">
        <UserMenuPresentational user={{ name: "?", email: "unknown@example.com" }} />
        <Typography variant="caption" className="mt-2 block">
          Fallback
        </Typography>
      </div>
    </Flex>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Different avatar appearances based on user data.",
      },
    },
  },
};
