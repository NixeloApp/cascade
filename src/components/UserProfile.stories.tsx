import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Card, CardBody } from "./ui/Card";
import { Dialog } from "./ui/Dialog";
import { Flex, FlexItem } from "./ui/Flex";
import { Input } from "./ui/form";
import { Grid } from "./ui/Grid";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface UserStats {
  projects: number;
  issuesCreated: number;
  issuesAssigned: number;
  issuesCompleted: number;
  comments: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  emailVerificationTime?: number;
  _creationTime: number;
}

interface UserProfilePresentationalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  user?: User;
  stats?: UserStats;
  isOwnProfile?: boolean;
  isLoading?: boolean;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: (name: string) => void;
  onCancel?: () => void;
}

// =============================================================================
// Sub-components
// =============================================================================

function UserStatsCards({ stats }: { stats: UserStats }) {
  return (
    <Grid cols={2} colsMd={5} gap="lg">
      <div className="bg-ui-bg-secondary rounded-lg p-4 text-center">
        <Typography variant="h3" color="brand" className="text-2xl">
          {stats.projects}
        </Typography>
        <Typography variant="caption">Workspaces</Typography>
      </div>
      <div className="bg-ui-bg-secondary rounded-lg p-4 text-center">
        <Typography variant="h3" color="brand" className="text-2xl">
          {stats.issuesCreated}
        </Typography>
        <Typography variant="caption">Created</Typography>
      </div>
      <div className="bg-ui-bg-secondary rounded-lg p-4 text-center">
        <Typography variant="h3" color="brand" className="text-2xl">
          {stats.issuesAssigned}
        </Typography>
        <Typography variant="caption">Assigned</Typography>
      </div>
      <div className="bg-ui-bg-secondary rounded-lg p-4 text-center">
        <Typography variant="h3" color="brand" className="text-2xl">
          {stats.issuesCompleted}
        </Typography>
        <Typography variant="caption">Completed</Typography>
      </div>
      <div className="bg-ui-bg-secondary rounded-lg p-4 text-center">
        <Typography variant="h3" color="brand" className="text-2xl">
          {stats.comments}
        </Typography>
        <Typography variant="caption">Comments</Typography>
      </div>
    </Grid>
  );
}

function ProfileHeader({
  user,
  isOwnProfile,
  isEditing,
  editedName,
  onNameChange,
  onEdit,
  onSave,
  onCancel,
}: {
  user: User;
  isOwnProfile: boolean;
  isEditing: boolean;
  editedName: string;
  onNameChange: (name: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <Flex align="start" gap="lg" className="mb-6">
      <Avatar name={user.name} src={user.image} size="xl" />
      <FlexItem flex="1">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              label="Display Name"
              value={editedName}
              onChange={(e) => onNameChange(e.target.value)}
            />
            <Flex gap="sm">
              <Button size="sm" onClick={onSave}>
                Save
              </Button>
              <Button size="sm" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            </Flex>
          </div>
        ) : (
          <>
            <Flex align="center" gap="sm" className="mb-1">
              <Typography variant="h2">{user.name}</Typography>
              {isOwnProfile && (
                <Button size="sm" variant="ghost" onClick={onEdit}>
                  Edit
                </Button>
              )}
            </Flex>
            <Typography color="secondary">{user.email}</Typography>
          </>
        )}
      </FlexItem>
    </Flex>
  );
}

// =============================================================================
// Presentational Component
// =============================================================================

function UserProfilePresentational({
  open = true,
  onOpenChange = () => {},
  user,
  stats,
  isOwnProfile = true,
  isLoading = false,
  isEditing = false,
  onEdit = () => {},
  onSave = () => {},
  onCancel = () => {},
}: UserProfilePresentationalProps) {
  const [editedName, setEditedName] = useState(user?.name || "");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="User Profile"
      className="sm:max-w-4xl p-0 gap-0 overflow-hidden"
    >
      <div className="max-h-panel overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <Flex align="center" justify="center" className="py-12">
            <div className="animate-pulse space-y-4 w-full">
              <Flex gap="lg">
                <div className="h-12 w-12 bg-ui-bg-tertiary rounded-full" />
                <FlexItem flex="1" className="space-y-2">
                  <div className="h-6 w-48 bg-ui-bg-tertiary rounded" />
                  <div className="h-4 w-32 bg-ui-bg-tertiary rounded" />
                </FlexItem>
              </Flex>
              <div className="h-24 bg-ui-bg-tertiary rounded" />
            </div>
          </Flex>
        ) : user ? (
          <Card>
            <CardBody className="space-y-6">
              <ProfileHeader
                user={user}
                isOwnProfile={isOwnProfile}
                isEditing={isEditing}
                editedName={editedName}
                onNameChange={setEditedName}
                onEdit={onEdit}
                onSave={() => onSave(editedName)}
                onCancel={onCancel}
              />

              {stats && <UserStatsCards stats={stats} />}

              <div className="border-t border-ui-border pt-6">
                <Typography variant="h5" className="mb-4">
                  Account Information
                </Typography>
                <div className="space-y-3">
                  <Flex justify="between">
                    <Typography variant="caption">User ID:</Typography>
                    <code className="font-mono text-sm">{user._id}</code>
                  </Flex>
                  <Flex justify="between">
                    <Typography variant="caption">Email Verified:</Typography>
                    <Typography variant="small">
                      {user.emailVerificationTime ? "Yes" : "No"}
                    </Typography>
                  </Flex>
                  <Flex justify="between">
                    <Typography variant="caption">Member Since:</Typography>
                    <Typography variant="small">
                      {new Date(user._creationTime).toLocaleDateString()}
                    </Typography>
                  </Flex>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Flex align="center" justify="center" className="py-12">
            <Typography color="secondary">User not found</Typography>
          </Flex>
        )}
      </div>
    </Dialog>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockUser: User = {
  _id: "user-123456",
  name: "Alice Chen",
  email: "alice@example.com",
  emailVerificationTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
  _creationTime: Date.now() - 90 * 24 * 60 * 60 * 1000,
};

const mockStats: UserStats = {
  projects: 5,
  issuesCreated: 47,
  issuesAssigned: 23,
  issuesCompleted: 35,
  comments: 128,
};

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof UserProfilePresentational> = {
  title: "Components/UserProfile",
  component: UserProfilePresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A dialog showing user profile information including avatar, stats, and account details. Supports editing for own profile.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    user: mockUser,
    stats: mockStats,
    isOwnProfile: true,
  },
  parameters: {
    docs: {
      description: {
        story: "User viewing their own profile.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Loading state while fetching profile data.",
      },
    },
  },
};

export const OtherUser: Story = {
  args: {
    user: {
      ...mockUser,
      _id: "user-other",
      name: "Bob Wilson",
      email: "bob@example.com",
    },
    stats: {
      projects: 3,
      issuesCreated: 25,
      issuesAssigned: 12,
      issuesCompleted: 18,
      comments: 56,
    },
    isOwnProfile: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Viewing another user's profile (no edit button).",
      },
    },
  },
};

export const Editing: Story = {
  args: {
    user: mockUser,
    stats: mockStats,
    isOwnProfile: true,
    isEditing: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Profile in edit mode.",
      },
    },
  },
};

export const UserNotFound: Story = {
  args: {
    user: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: "User not found state.",
      },
    },
  },
};

export const NewUser: Story = {
  args: {
    user: {
      _id: "user-new",
      name: "New User",
      email: "new@example.com",
      _creationTime: Date.now(),
    },
    stats: {
      projects: 0,
      issuesCreated: 0,
      issuesAssigned: 0,
      issuesCompleted: 0,
      comments: 0,
    },
    isOwnProfile: true,
  },
  parameters: {
    docs: {
      description: {
        story: "New user with no activity.",
      },
    },
  },
};

export const HighActivity: Story = {
  args: {
    user: {
      ...mockUser,
      name: "Power User",
    },
    stats: {
      projects: 15,
      issuesCreated: 523,
      issuesAssigned: 312,
      issuesCompleted: 489,
      comments: 1247,
    },
    isOwnProfile: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Very active user with high stats.",
      },
    },
  },
};

export const UnverifiedEmail: Story = {
  args: {
    user: {
      ...mockUser,
      emailVerificationTime: undefined,
    },
    stats: mockStats,
    isOwnProfile: true,
  },
  parameters: {
    docs: {
      description: {
        story: "User with unverified email.",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState(mockUser);

    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open Profile</Button>
        <UserProfilePresentational
          open={open}
          onOpenChange={setOpen}
          user={user}
          stats={mockStats}
          isOwnProfile={true}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={(name) => {
            setUser((u) => ({ ...u, name }));
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo - click Edit to modify the profile.",
      },
    },
  },
};
