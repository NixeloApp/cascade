/**
 * Profile Content
 *
 * User profile editing and display component.
 * Shows avatar, cover image, bio, and activity statistics.
 * Supports profile editing with real-time updates.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Camera, ImageIcon } from "lucide-react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDate } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { UserActivityFeed } from "../UserActivityFeed";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/form";
import { Grid } from "../ui/Grid";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Typography } from "../ui/Typography";
import { AvatarUploadModal } from "./AvatarUploadModal";
import { CoverImageUploadModal } from "./CoverImageUploadModal";

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
  firstName?: string;
  lastName?: string;
  email?: string;
  image?: string;
  emailVerificationTime?: number;
};

/**
 * User stats cards component
 */
export function UserStatsCards({ stats }: { stats: UserStats }) {
  return (
    <Grid cols={2} colsMd={5} gap="md">
      <Card padding="md" variant="default" className="relative overflow-hidden text-center">
        <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand/70" />
        <Stack gap="xs" align="center" className="relative">
          <Typography variant="h2" color="brand">
            {stats.projects}
          </Typography>
          <Typography variant="caption" className="uppercase tracking-widest">
            Workspaces
          </Typography>
        </Stack>
      </Card>
      <Card padding="md" variant="default" className="relative overflow-hidden text-center">
        <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand/70" />
        <Stack gap="xs" align="center" className="relative">
          <Typography variant="h2" color="brand">
            {stats.issuesCreated}
          </Typography>
          <Typography variant="caption" className="uppercase tracking-widest">
            Created
          </Typography>
        </Stack>
      </Card>
      <Card padding="md" variant="default" className="relative overflow-hidden text-center">
        <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand/70" />
        <Stack gap="xs" align="center" className="relative">
          <Typography variant="h2" color="brand">
            {stats.issuesAssigned}
          </Typography>
          <Typography variant="caption" className="uppercase tracking-widest">
            Assigned
          </Typography>
        </Stack>
      </Card>
      <Card padding="md" variant="default" className="relative overflow-hidden text-center">
        <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand/70" />
        <Stack gap="xs" align="center" className="relative">
          <Typography variant="h2" color="brand">
            {stats.issuesCompleted}
          </Typography>
          <Typography variant="caption" className="uppercase tracking-widest">
            Completed
          </Typography>
        </Stack>
      </Card>
      <Card padding="md" variant="default" className="relative overflow-hidden text-center">
        <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand/70" />
        <Stack gap="xs" align="center" className="relative">
          <Typography variant="h2" color="brand">
            {stats.comments}
          </Typography>
          <Typography variant="caption" className="uppercase tracking-widest">
            Comments
          </Typography>
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
    <Stack
      gap="md"
      className="rounded-container border border-ui-border-secondary/70 bg-linear-to-b from-ui-bg-elevated to-ui-bg-soft/80 p-4 shadow-soft"
    >
      <Typography variant="h5">Account Information</Typography>
      <Stack gap="sm">
        <Flex justify="between" gap="sm">
          <Typography variant="caption">User ID:</Typography>
          <Typography variant="mono" className="max-w-40 break-all text-right">
            {user._id}
          </Typography>
        </Flex>
        <Flex justify="between" gap="sm">
          <Typography variant="caption">Member Since:</Typography>
          <Typography variant="small">{formatDate(user._creationTime)}</Typography>
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
  firstName,
  lastName,
  email,
  onEditClick,
  onNameChange,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onSave,
  onCancel,
  onAvatarClick,
}: {
  user: ProfileUser;
  isOwnProfile: boolean;
  isEditing: boolean;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  onEditClick: () => void;
  onNameChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onAvatarClick?: () => void;
}) {
  return (
    <Flex align="center" gap="xl" direction="column" className="sm:flex-row sm:items-center">
      {/* Avatar */}
      <div className="relative group">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="h-24 w-24 rounded-full border border-ui-border/70 object-cover shadow-soft"
          />
        ) : (
          <Flex
            align="center"
            justify="center"
            className="h-24 w-24 rounded-full bg-brand text-3xl font-bold text-brand-foreground shadow-card"
          >
            {(user.name || user.email || "?").charAt(0).toUpperCase()}
          </Flex>
        )}
        {isOwnProfile && onAvatarClick && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-ui-bg border border-ui-border shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:focus:opacity-100 transition-opacity"
            onClick={onAvatarClick}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* User Info */}
      <FlexItem flex="1" className="w-full">
        {isEditing ? (
          <Stack gap="sm">
            <Flex gap="sm">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                placeholder="First name"
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                placeholder="Last name"
              />
            </Flex>
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Display name (shown publicly)"
              helperText="This is the name displayed to other users"
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
            <Typography variant="h3" className="tracking-tight">
              {user.name || "Anonymous User"}
            </Typography>
            <Typography variant="caption" className="max-w-lg">
              {user.email}
            </Typography>
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

interface LoadedProfileContentProps {
  coverImageUrl: string | null | undefined;
  email: string;
  firstName: string;
  isEditing: boolean;
  isOwnProfile: boolean;
  lastName: string;
  name: string;
  onAvatarClick: () => void;
  onCancel: () => void;
  onCoverImageClick: () => void;
  onCoverImageOpenChange: (open: boolean) => void;
  onEditClick: () => void;
  onEmailChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSave: () => void;
  onShowAvatarModalChange: (open: boolean) => void;
  showAvatarModal: boolean;
  showCoverImageModal: boolean;
  userStats: UserStats | undefined;
  viewUser: ProfileUser;
}

function LoadedProfileContent({
  coverImageUrl,
  email,
  firstName,
  isEditing,
  isOwnProfile,
  lastName,
  name,
  onAvatarClick,
  onCancel,
  onCoverImageClick,
  onCoverImageOpenChange,
  onEditClick,
  onEmailChange,
  onFirstNameChange,
  onLastNameChange,
  onNameChange,
  onSave,
  onShowAvatarModalChange,
  showAvatarModal,
  showCoverImageModal,
  userStats,
  viewUser,
}: LoadedProfileContentProps) {
  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      {isOwnProfile && (
        <div className="relative group">
          <div
            className={cn(
              "h-32 w-full bg-linear-to-r from-brand/18 via-brand-subtle/85 to-accent/14 sm:h-36",
              coverImageUrl && "bg-none",
            )}
          >
            {coverImageUrl && (
              <img src={coverImageUrl} alt="Profile cover" className="w-full h-full object-cover" />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-2 right-2 h-8 px-3 rounded-full bg-ui-bg/80 border border-ui-border shadow-sm backdrop-blur-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:focus:opacity-100 transition-opacity"
            onClick={onCoverImageClick}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {coverImageUrl ? "Change" : "Add"} cover
          </Button>
        </div>
      )}

      <div className="px-4 pb-5 sm:px-5 sm:pb-6">
        <Stack gap="lg">
          <Card
            variant="default"
            padding="md"
            className={cn(
              "border-ui-border-secondary/70 bg-ui-bg-elevated/96 shadow-elevated",
              isOwnProfile && "-mt-10",
            )}
          >
            <ProfileHeader
              user={viewUser}
              isOwnProfile={isOwnProfile}
              isEditing={isEditing}
              name={name}
              firstName={firstName}
              lastName={lastName}
              email={email}
              onEditClick={onEditClick}
              onNameChange={onNameChange}
              onFirstNameChange={onFirstNameChange}
              onLastNameChange={onLastNameChange}
              onEmailChange={onEmailChange}
              onSave={onSave}
              onCancel={onCancel}
              onAvatarClick={onAvatarClick}
            />
          </Card>

          <AvatarUploadModal
            open={showAvatarModal}
            onOpenChange={onShowAvatarModalChange}
            currentImage={viewUser.image}
            userName={viewUser.name}
            userEmail={viewUser.email}
          />

          <CoverImageUploadModal
            open={showCoverImageModal}
            onOpenChange={onCoverImageOpenChange}
            currentImage={coverImageUrl}
          />

          {userStats && <UserStatsCards stats={userStats} />}

          <Grid cols={1} colsLg={3} gap="md">
            <Card padding="lg" variant="soft" className="lg:col-span-2">
              <Stack gap="md">
                <Typography variant="h5">Recent Activity</Typography>
                <UserActivityFeed userId={viewUser._id} limit={10} />
              </Stack>
            </Card>

            {isOwnProfile &&
              "_creationTime" in viewUser &&
              typeof viewUser._creationTime === "number" && (
                <div className="lg:col-span-1">
                  <AccountInfo user={viewUser as ProfileUser & { _creationTime: number }} />
                </div>
              )}
          </Grid>
        </Stack>
      </div>
    </Card>
  );
}

export function ProfileContent({ userId }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverImageModal, setShowCoverImageModal] = useState(false);
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const currentUser = useAuthenticatedQuery(api.users.getCurrent, {});
  const coverImageUrl = useAuthenticatedQuery(api.users.getCoverImageUrl, {});
  const fetchedViewUser = useAuthenticatedQuery(
    api.users.getUser,
    userId ? { id: userId } : "skip",
  );
  const userStatsForUserId = useAuthenticatedQuery(
    api.users.getUserStats,
    userId ? { userId } : "skip",
  );
  const userStatsForCurrent = useAuthenticatedQuery(
    api.users.getUserStats,
    !userId && currentUser ? { userId: currentUser._id } : "skip",
  );

  const viewUser = fetchedViewUser || currentUser;
  const userStats = userId ? userStatsForUserId : userStatsForCurrent;
  const { mutate: updateProfile } = useAuthenticatedMutation(api.users.updateProfile);

  const isOwnProfile = !userId || (currentUser && userId === currentUser._id);

  const handleEdit = () => {
    if (viewUser) {
      setName(viewUser.name || "");
      setFirstName(viewUser.firstName || "");
      setLastName(viewUser.lastName || "");
      setEmail(viewUser.email || "");
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        name: name || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
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
    <LoadedProfileContent
      coverImageUrl={coverImageUrl}
      email={email}
      firstName={firstName}
      isEditing={isEditing}
      isOwnProfile={!!isOwnProfile}
      lastName={lastName}
      name={name}
      onAvatarClick={() => setShowAvatarModal(true)}
      onCancel={handleCancel}
      onCoverImageClick={() => setShowCoverImageModal(true)}
      onCoverImageOpenChange={setShowCoverImageModal}
      onEditClick={handleEdit}
      onEmailChange={setEmail}
      onFirstNameChange={setFirstName}
      onLastNameChange={setLastName}
      onNameChange={setName}
      onSave={handleSave}
      onShowAvatarModalChange={setShowAvatarModal}
      showAvatarModal={showAvatarModal}
      showCoverImageModal={showCoverImageModal}
      userStats={userStats}
      viewUser={viewUser}
    />
  );
}
