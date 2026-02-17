import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./ui/Avatar";
import { Flex } from "./ui/Flex";
import { MetadataItem } from "./ui/Metadata";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface PresenceUser {
  id: string;
  name: string;
  avatarUrl?: string;
  online: boolean;
}

// =============================================================================
// Presentational Components
// =============================================================================

interface FacePilePresentationalProps {
  users: PresenceUser[];
  maxVisible?: number;
}

function FacePilePresentational({ users, maxVisible = 4 }: FacePilePresentationalProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <Flex align="center" className="-space-x-2">
      {visibleUsers.map((user) => (
        <Tooltip key={user.id} content={user.name}>
          <div className="relative">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" className="ring-2 ring-ui-bg" />
            {user.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-status-success rounded-full ring-2 ring-ui-bg" />
            )}
          </div>
        </Tooltip>
      ))}
      {remainingCount > 0 && (
        <Tooltip content={`${remainingCount} more`}>
          <Flex
            align="center"
            justify="center"
            className="w-8 h-8 rounded-full bg-ui-bg-tertiary ring-2 ring-ui-bg"
          >
            <Typography variant="caption" className="font-medium">
              +{remainingCount}
            </Typography>
          </Flex>
        </Tooltip>
      )}
    </Flex>
  );
}

interface PresenceIndicatorPresentationalProps {
  users: PresenceUser[];
  maxVisible?: number;
}

function PresenceIndicatorPresentational({
  users,
  maxVisible = 4,
}: PresenceIndicatorPresentationalProps) {
  const onlineCount = users.filter((u) => u.online).length;

  if (users.length === 0) {
    return null;
  }

  return (
    <Flex align="center" className="space-x-2">
      <MetadataItem>
        {onlineCount} {onlineCount === 1 ? "person" : "people"} editing
      </MetadataItem>
      <FacePilePresentational users={users} maxVisible={maxVisible} />
    </Flex>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockUsers: PresenceUser[] = [
  {
    id: "user-1",
    name: "Alice Chen",
    online: true,
  },
  {
    id: "user-2",
    name: "Bob Smith",
    online: true,
  },
  {
    id: "user-3",
    name: "Carol Davis",
    online: true,
  },
  {
    id: "user-4",
    name: "David Wilson",
    online: true,
  },
  {
    id: "user-5",
    name: "Eve Martinez",
    online: true,
  },
  {
    id: "user-6",
    name: "Frank Johnson",
    online: true,
  },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof PresenceIndicatorPresentational> = {
  title: "Components/PresenceIndicator",
  component: PresenceIndicatorPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Shows who is currently viewing or editing a document. Displays a count and avatar facepile.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-4 bg-ui-bg-elevated rounded-lg border border-ui-border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const SingleUser: Story = {
  args: {
    users: [mockUsers[0]],
  },
  parameters: {
    docs: {
      description: {
        story: "Single person editing with singular text.",
      },
    },
  },
};

export const TwoUsers: Story = {
  args: {
    users: mockUsers.slice(0, 2),
  },
  parameters: {
    docs: {
      description: {
        story: "Two people editing simultaneously.",
      },
    },
  },
};

export const MultipleUsers: Story = {
  args: {
    users: mockUsers.slice(0, 4),
  },
  parameters: {
    docs: {
      description: {
        story: "Multiple users within the visible limit.",
      },
    },
  },
};

export const OverflowUsers: Story = {
  args: {
    users: mockUsers,
    maxVisible: 4,
  },
  parameters: {
    docs: {
      description: {
        story: "More users than can be displayed, showing +N overflow indicator.",
      },
    },
  },
};

export const WithoutAvatars: Story = {
  args: {
    users: [
      { id: "1", name: "User One", online: true },
      { id: "2", name: "User Two", online: true },
      { id: "3", name: "User Three", online: true },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Users without avatar URLs show initials fallback.",
      },
    },
  },
};

export const Empty: Story = {
  args: {
    users: [],
  },
  parameters: {
    docs: {
      description: {
        story: "No users present - renders nothing.",
      },
    },
  },
};

export const FacePileOnly: Story = {
  render: () => <FacePilePresentational users={mockUsers.slice(0, 5)} maxVisible={4} />,
  parameters: {
    docs: {
      description: {
        story: "Just the avatar facepile without the count text.",
      },
    },
  },
};

export const InDocumentHeader: Story = {
  render: () => (
    <Flex align="center" justify="between" className="w-96 p-4 bg-ui-bg border-b border-ui-border">
      <Typography variant="h4">Document Title</Typography>
      <PresenceIndicatorPresentational users={mockUsers.slice(0, 3)} />
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Presence indicator shown in a document header context.",
      },
    },
  },
};
