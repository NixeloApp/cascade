import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/form";
import { Grid } from "../ui/Grid";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Typography } from "../ui/Typography";

interface UserStats {
  projects: number;
  issuesCreated: number;
  issuesAssigned: number;
  issuesCompleted: number;
  comments: number;
}

// User type that matches what the queries return
type ProfileUser = {
  _id: Id<"users">;
  _creationTime?: number;
  name?: string;
  email?: string;
  image?: string;
  emailVerificationTime?: number;
};

/**
 * User stats cards component
 */
export function UserStatsCards({ stats }: { stats: UserStats }) {
  return (
    <Grid cols={2} colsMd={5} gap="lg">
      <Card padding="md" variant="flat" className="text-center">
        <Stack gap="xs" align="center">
          <Typography variant="h2" color="brand">
            {stats.projects}
          </Typography>
          <Typography variant="caption">Workspaces</Typography>
        </Stack>
      </Card>
      <Card padding="md" variant="flat" className="text-center">
        <Stack gap="xs" align="center">
          <Typography variant="h2" color="brand">
            {stats.issuesCreated}
          </Typography>
          <Typography variant="caption">Created</Typography>
        </Stack>
      </Card>
      <Card padding="md" variant="flat" className="text-center">
        <Stack gap="xs" align="center">
          <Typography variant="h2" color="brand">
            {stats.issuesAssigned}
          </Typography>
          <Typography variant="caption">Assigned</Typography>
        </Stack>
      </Card>
      <Card padding="md" variant="flat" className="text-center">
        <Stack gap="xs" align="center">
          <Typography variant="h2" color="brand">
            {stats.issuesCompleted}
          </Typography>
          <Typography variant="caption">Completed</Typography>
        </Stack>
      </Card>
      <Card padding="md" variant="flat" className="text-center">
        <Stack gap="xs" align="center">
          <Typography variant="h2" color="brand">
            {stats.comments}
          </Typography>
          <Typography variant="caption">Comments</Typography>
        </Stack>
      </Card>
    </Grid>
  );
}

/**
 * User account information section
 */
export function AccountInfo({ user }: { user: ProfileUser & { _creationTime: number } }) {
  return (
    <Stack gap="md" className="border-t border-ui-border pt-6">
      <Typography variant="h5">Account Information</Typography>
      <Stack gap="sm">
        <Flex justify="between">
          <Typography variant="caption">User ID:</Typography>
          <Typography variant="mono">{user._id}</Typography>
        </Flex>
        <Flex justify="between">
          <Typography variant="caption">Email Verified:</Typography>
          <Typography variant="small">{user.emailVerificationTime ? "Yes" : "No"}</Typography>
        </Flex>
      </Stack>
    </Stack>
  );
}

/**
 * Profile header with avatar and user info
 */
export function ProfileHeader({
  user,
  isOwnProfile,
  isEditing,
  name,
  email,
  onEditClick,
  onNameChange,
  onEmailChange,
  onSave,
  onCancel,
}: {
  user: ProfileUser;
  isOwnProfile: boolean;
  isEditing: boolean;
  name: string;
  email: string;
  onEditClick: () => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <Flex align="center" gap="xl">
      {/* Avatar */}
      <div className="relative">
        {user.image ? (
          <img src={user.image} alt={user.name || "User"} className="w-24 h-24 rounded-full" />
        ) : (
          <Flex
            align="center"
            justify="center"
            className="w-24 h-24 rounded-full bg-brand text-brand-foreground text-3xl font-bold"
          >
            {(user.name || user.email || "?").charAt(0).toUpperCase()}
          </Flex>
        )}
      </div>

      {/* User Info */}
      <FlexItem flex="1">
        {isEditing ? (
          <Stack gap="sm">
            <Input
              label="Name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="your.email@example.com"
              type="email"
            />
            <Flex gap="sm">
              <Button onClick={onSave} size="sm">
                Save
              </Button>
              <Button onClick={onCancel} variant="secondary" size="sm">
                Cancel
              </Button>
            </Flex>
          </Stack>
        ) : (
          <>
            <Typography variant="h3">{user.name || "Anonymous User"}</Typography>
            <Typography variant="caption">{user.email}</Typography>
            {isOwnProfile && (
              <Button onClick={onEditClick} variant="secondary" size="sm" className="mt-3">
                Edit Profile
              </Button>
            )}
          </>
        )}
      </FlexItem>
    </Flex>
  );
}

interface ProfileContentProps {
  userId?: Id<"users">;
}

export function ProfileContent({ userId }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const currentUser = useQuery(api.users.getCurrent);
  const fetchedViewUser = useQuery(api.users.get, userId ? { id: userId } : "skip");
  const userStatsForUserId = useQuery(api.users.getUserStats, userId ? { userId } : "skip");
  const userStatsForCurrent = useQuery(
    api.users.getUserStats,
    !userId && currentUser ? { userId: currentUser._id } : "skip",
  );

  const viewUser = fetchedViewUser || currentUser;
  const userStats = userId ? userStatsForUserId : userStatsForCurrent;
  const updateProfile = useMutation(api.users.updateProfile);

  const isOwnProfile = !userId || (currentUser && userId === currentUser._id);

  const handleEdit = () => {
    if (viewUser) {
      setName(viewUser.name || "");
      setEmail(viewUser.email || "");
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        name: name || undefined,
        email: email || undefined,
      });
      showSuccess("Profile updated");
      setIsEditing(false);
    } catch (error) {
      showError(error, "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (!viewUser) {
    return (
      <Card padding="lg">
        <Flex align="center" justify="center">
          <LoadingSpinner size="lg" />
        </Flex>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <Stack gap="lg">
        {/* Profile Header */}
        <ProfileHeader
          user={viewUser}
          isOwnProfile={!!isOwnProfile}
          isEditing={isEditing}
          name={name}
          email={email}
          onEditClick={handleEdit}
          onNameChange={setName}
          onEmailChange={setEmail}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        {/* Stats Cards */}
        {userStats && <UserStatsCards stats={userStats} />}

        {/* Account Info */}
        {viewUser && "_creationTime" in viewUser && (
          <AccountInfo user={viewUser as ProfileUser & { _creationTime: number }} />
        )}
      </Stack>
    </Card>
  );
}
