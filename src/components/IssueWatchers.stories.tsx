import type { Meta, StoryObj } from "@storybook/react";
import { Eye } from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Flex, FlexItem } from "./ui/Flex";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface Watcher {
  _id: string;
  userName: string;
  userEmail?: string;
}

interface IssueWatchersPresentationalProps {
  watchers?: Watcher[];
  isWatching?: boolean;
  onToggleWatch?: () => void;
}

// =============================================================================
// Presentational Component
// =============================================================================

function IssueWatchersPresentational({
  watchers = [],
  isWatching = false,
  onToggleWatch = () => {},
}: IssueWatchersPresentationalProps) {
  return (
    <div className="space-y-4">
      {/* Watch/Unwatch Button */}
      <div>
        <Button
          onClick={onToggleWatch}
          variant={isWatching ? "secondary" : "primary"}
          size="sm"
          className="w-full sm:w-auto"
        >
          {isWatching ? (
            <>
              <Eye className="w-4 h-4 mr-2 fill-current" />
              Watching
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Watch
            </>
          )}
        </Button>
      </div>

      {/* Watchers List */}
      {watchers.length > 0 && (
        <div>
          <Typography variant="h4" className="text-sm font-medium text-ui-text mb-2">
            Watchers ({watchers.length})
          </Typography>
          <div className="space-y-2">
            {watchers.map((watcher) => (
              <Flex
                align="center"
                gap="md"
                className="p-2 bg-ui-bg-secondary rounded-lg"
                key={watcher._id}
              >
                {/* Avatar */}
                <Avatar name={watcher.userName} size="md" />

                {/* User Info */}
                <FlexItem flex="1" className="min-w-0">
                  <Typography variant="p" className="font-medium truncate">
                    {watcher.userName}
                  </Typography>
                  {watcher.userEmail && (
                    <Typography variant="caption" className="truncate">
                      {watcher.userEmail}
                    </Typography>
                  )}
                </FlexItem>
              </Flex>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {watchers.length === 0 && (
        <Typography variant="small" color="secondary" className="text-center py-4">
          No watchers yet. Be the first to watch this issue!
        </Typography>
      )}
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockWatchers: Watcher[] = [
  {
    _id: "watcher-1",
    userName: "Alice Chen",
    userEmail: "alice.chen@example.com",
  },
  {
    _id: "watcher-2",
    userName: "Bob Smith",
    userEmail: "bob.smith@example.com",
  },
  {
    _id: "watcher-3",
    userName: "Carol Davis",
    userEmail: "carol.davis@example.com",
  },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof IssueWatchersPresentational> = {
  title: "Components/IssueWatchers",
  component: IssueWatchersPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Displays the list of users watching an issue and provides a button to watch/unwatch. Users receive notifications for issues they watch.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80 p-4 bg-ui-bg border border-ui-border rounded-lg">
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

export const Default: Story = {
  args: {
    watchers: mockWatchers,
    isWatching: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue watchers panel with multiple watchers and the user not watching.",
      },
    },
  },
};

export const Watching: Story = {
  args: {
    watchers: mockWatchers,
    isWatching: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue watchers panel when the current user is watching the issue.",
      },
    },
  },
};

export const NoWatchers: Story = {
  args: {
    watchers: [],
    isWatching: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when no one is watching the issue.",
      },
    },
  },
};

export const SingleWatcher: Story = {
  args: {
    watchers: [mockWatchers[0]],
    isWatching: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Single watcher (the current user) watching the issue.",
      },
    },
  },
};

export const ManyWatchers: Story = {
  args: {
    watchers: [
      ...mockWatchers,
      { _id: "watcher-4", userName: "David Wilson", userEmail: "david.wilson@example.com" },
      { _id: "watcher-5", userName: "Eve Martinez", userEmail: "eve.martinez@example.com" },
      { _id: "watcher-6", userName: "Frank Johnson" },
    ],
    isWatching: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Many watchers on a popular issue.",
      },
    },
  },
};

export const WithoutEmails: Story = {
  args: {
    watchers: [
      { _id: "watcher-1", userName: "Alice Chen" },
      { _id: "watcher-2", userName: "Bob Smith" },
    ],
    isWatching: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Watchers without email addresses displayed.",
      },
    },
  },
};

export const InSidebar: Story = {
  render: () => (
    <div className="w-72 space-y-6">
      <div>
        <Typography variant="label" className="mb-2 block">
          Assignee
        </Typography>
        <Flex align="center" gap="sm" className="p-2 bg-ui-bg-secondary rounded-lg">
          <Avatar name="Alice Chen" size="sm" />
          <Typography variant="small">Alice Chen</Typography>
        </Flex>
      </div>
      <div>
        <Typography variant="label" className="mb-2 block">
          Watchers
        </Typography>
        <IssueWatchersPresentational watchers={mockWatchers.slice(0, 2)} isWatching />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Watchers component shown in the context of an issue detail sidebar.",
      },
    },
  },
};

export const ButtonStates: Story = {
  render: () => (
    <Flex direction="column" gap="lg" className="w-80">
      <div>
        <Typography variant="label" className="mb-2 block">
          Not Watching
        </Typography>
        <Button variant="primary" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          Watch
        </Button>
      </div>
      <div>
        <Typography variant="label" className="mb-2 block">
          Watching
        </Typography>
        <Button variant="secondary" size="sm">
          <Eye className="w-4 h-4 mr-2 fill-current" />
          Watching
        </Button>
      </div>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparison of the watch button in both states.",
      },
    },
  },
};
