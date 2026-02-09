import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
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

/**
 * User account information section
 */
export function AccountInfo({ user }: { user: ProfileUser & { _creationTime: number } }) {
  return (
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
          <Typography variant="small">{user.emailVerificationTime ? "Yes" : "No"}</Typography>
        </Flex>
      </div>
    </div>
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
          <div className="space-y-3">
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
            <Flex gap="sm" className="mt-2">
              <Button onClick={onSave} size="sm">
                Save
              </Button>
              <Button onClick={onCancel} variant="secondary" size="sm">
                Cancel
              </Button>
            </Flex>
          </div>
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
      <Flex align="center" justify="center" className="py-8">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  return (
    <Card>
      <div className="p-6 space-y-6">
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
      </div>
    </Card>
  );
}
