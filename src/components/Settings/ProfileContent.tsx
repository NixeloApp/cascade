import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Camera, ImageIcon } from "lucide-react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
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
    <Flex align="center" gap="xl">
      {/* Avatar */}
      <div className="relative group">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <Flex
            align="center"
            justify="center"
            className="w-24 h-24 rounded-full bg-brand text-brand-foreground text-3xl font-bold"
          >
            {(user.name || user.email || "?").charAt(0).toUpperCase()}
          </Flex>
        )}
        {isOwnProfile && onAvatarClick && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-ui-bg border border-ui-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onAvatarClick}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* User Info */}
      <FlexItem flex="1">
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
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverImageModal, setShowCoverImageModal] = useState(false);
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const currentUser = useQuery(api.users.getCurrent);
  const coverImageUrl = useQuery(api.users.getCoverImageUrl);
  const fetchedViewUser = useQuery(api.users.getUser, userId ? { id: userId } : "skip");
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
    <Card padding="none" className="overflow-hidden">
      {/* Cover Image Banner */}
      {isOwnProfile && (
        <div className="relative group">
          <div
            className={cn(
              "w-full h-32 bg-gradient-to-r from-brand/20 to-brand-muted/20",
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
            className="absolute bottom-2 right-2 h-8 px-3 rounded-full bg-ui-bg/80 border border-ui-border shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setShowCoverImageModal(true)}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            {coverImageUrl ? "Change" : "Add"} cover
          </Button>
        </div>
      )}

      <div className="p-6">
        <Stack gap="lg">
          {/* Profile Header */}
          <ProfileHeader
            user={viewUser}
            isOwnProfile={!!isOwnProfile}
            isEditing={isEditing}
            name={name}
            firstName={firstName}
            lastName={lastName}
            email={email}
            onEditClick={handleEdit}
            onNameChange={setName}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onEmailChange={setEmail}
            onSave={handleSave}
            onCancel={handleCancel}
            onAvatarClick={() => setShowAvatarModal(true)}
          />

          {/* Avatar Upload Modal */}
          <AvatarUploadModal
            open={showAvatarModal}
            onOpenChange={setShowAvatarModal}
            currentImage={viewUser.image}
            userName={viewUser.name}
            userEmail={viewUser.email}
          />

          {/* Cover Image Upload Modal */}
          <CoverImageUploadModal
            open={showCoverImageModal}
            onOpenChange={setShowCoverImageModal}
            currentImage={coverImageUrl}
          />

          {/* Stats Cards */}
          {userStats && <UserStatsCards stats={userStats} />}

          {/* Recent Activity */}
          <Stack gap="md" className="border-t border-ui-border pt-6">
            <Typography variant="h5">Recent Activity</Typography>
            <UserActivityFeed userId={viewUser._id} limit={10} />
          </Stack>

          {/* Account Info */}
          {viewUser && "_creationTime" in viewUser && (
            <AccountInfo user={viewUser as ProfileUser & { _creationTime: number }} />
          )}
        </Stack>
      </div>
    </Card>
  );
}
