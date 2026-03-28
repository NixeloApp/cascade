/**
 * Profile Content
 *
 * User profile editing and display component.
 * Shows avatar, cover image, bio, and activity statistics.
 * Supports profile editing with real-time updates.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { getFramedCompactPillButtonClassName } from "@/components/ui/buttonSurfaceClassNames";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid, GridItem } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import {
  MediaPreviewAction,
  MediaPreviewFrame,
  MediaPreviewImage,
} from "@/components/ui/MediaPreview";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDate } from "@/lib/formatting";
import { Camera, ImageIcon } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { UserActivityFeed } from "../UserActivityFeed";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { CardSection } from "../ui/CardSection";
import { Input } from "../ui/form";
import { IconButton } from "../ui/IconButton";
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

const USER_STATS_ITEMS: ReadonlyArray<{
  key: keyof UserStats;
  label: string;
}> = [
  { key: "projects", label: "Workspaces" },
  { key: "issuesCreated", label: "Created" },
  { key: "issuesAssigned", label: "Assigned" },
  { key: "issuesCompleted", label: "Completed" },
  { key: "comments", label: "Comments" },
];

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
    <Grid cols={2} colsSm={3} colsLg={5} gap="sm">
      {USER_STATS_ITEMS.map((item) => (
        <Card key={item.key} recipe="profileMetricTile" padding="sm">
          <Stack gap="xs" align="center">
            <Typography variant="h2" color="brand">
              {stats[item.key]}
            </Typography>
            <Typography variant="eyebrowWide">{item.label}</Typography>
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}

/**
 * User account information section
 */
export function AccountInfo({ user }: { user: ProfileUser & { _creationTime: number } }) {
  const rows = [
    {
      label: "User ID",
      value: (
        <Typography variant="mono" className="block max-w-full break-all sm:max-w-40">
          {user._id}
        </Typography>
      ),
    },
    {
      label: "Member Since",
      value: <Typography variant="small">{formatDate(user._creationTime)}</Typography>,
    },
    {
      label: "Email Verified",
      value: <Typography variant="small">{user.emailVerificationTime ? "Yes" : "No"}</Typography>,
    },
  ];

  return (
    <Card variant="default" padding="md" style={{ height: "100%" }}>
      <Stack gap="sm">
        <Typography variant="h5">Account Information</Typography>
        <Typography variant="small" color="secondary">
          Core account metadata stays visible here without competing with the editing controls.
        </Typography>
      </Stack>
      <Stack gap="sm">
        {rows.map((row) => (
          <CardSection key={row.label}>
            <Grid cols={1} colsSm={2} gap="xs">
              <Typography variant="label" color="secondary">
                {row.label}
              </Typography>
              {row.value}
            </Grid>
          </CardSection>
        ))}
      </Stack>
    </Card>
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
    <Flex direction="column" gap="lg" directionSm="row" alignSm="center">
      <MediaPreviewFrame surface="avatar">
        <Avatar
          src={user.image}
          name={user.name}
          email={user.email}
          variant="brand"
          size="profile"
        />
        {isOwnProfile && onAvatarClick ? (
          <MediaPreviewAction placement="avatarUpload">
            <IconButton
              variant="solid"
              size="sm"
              onClick={onAvatarClick}
              tooltip="Change avatar"
              data-testid={TEST_IDS.SETTINGS.PROFILE_AVATAR_UPLOAD_TRIGGER}
            >
              <Icon icon={Camera} size="sm" />
            </IconButton>
          </MediaPreviewAction>
        ) : null}
      </MediaPreviewFrame>

      <FlexItem flex="1">
        {isEditing ? (
          <Stack gap="sm">
            <Grid cols={1} colsSm={2} gap="sm">
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
            </Grid>
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
            <Flex gap="sm" wrap>
              <Button onClick={onSave} size="sm">
                Save
              </Button>
              <Button onClick={onCancel} variant="secondary" size="sm">
                Cancel
              </Button>
            </Flex>
          </Stack>
        ) : (
          <Stack gap="md">
            <Stack gap="xs">
              <Typography variant="h3">{user.name || "Anonymous User"}</Typography>
              <Typography variant="caption" className="max-w-lg">
                {user.email}
              </Typography>
            </Stack>
            {isOwnProfile ? (
              <Flex gap="sm" wrap>
                <Button onClick={onEditClick} variant="secondary" size="sm">
                  Edit Profile
                </Button>
              </Flex>
            ) : null}
          </Stack>
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
  const showAccountInfo =
    isOwnProfile && "_creationTime" in viewUser && typeof viewUser._creationTime === "number";

  return (
    <Card recipe="profileShell" padding="none">
      {isOwnProfile && (
        <MediaPreviewFrame surface="profileCover" tone={coverImageUrl ? "default" : "profileEmpty"}>
          {coverImageUrl ? (
            <MediaPreviewImage alt="Profile cover" src={coverImageUrl} surface="profileCover" />
          ) : null}
          <MediaPreviewAction placement="coverCorner">
            <Button
              variant="unstyled"
              size="content"
              onClick={onCoverImageClick}
              data-testid={TEST_IDS.SETTINGS.PROFILE_COVER_UPLOAD_TRIGGER}
              leftIcon={<Icon icon={ImageIcon} size="sm" />}
              className={getFramedCompactPillButtonClassName()}
            >
              {coverImageUrl ? "Change" : "Add"} cover
            </Button>
          </MediaPreviewAction>
        </MediaPreviewFrame>
      )}

      <CardSection size="md">
        <Stack gap="md">
          <Grid
            cols={1}
            colsLg={showAccountInfo ? 5 : 1}
            gap="md"
            style={isOwnProfile ? { marginTop: "-0.375rem" } : undefined}
          >
            <GridItem colSpanLg={showAccountInfo ? 3 : undefined}>
              <CardSection size="lg">
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
              </CardSection>
            </GridItem>

            {showAccountInfo && (
              <GridItem colSpanLg={2}>
                <AccountInfo user={viewUser as ProfileUser & { _creationTime: number }} />
              </GridItem>
            )}
          </Grid>

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

          <CardSection size="md">
            <Stack gap="sm">
              <Typography variant="h5">Recent Activity</Typography>
              <UserActivityFeed userId={viewUser._id} limit={10} />
            </Stack>
          </CardSection>
        </Stack>
      </CardSection>
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
