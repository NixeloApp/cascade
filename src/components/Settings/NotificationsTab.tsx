/**
 * Notifications Settings Tab
 *
 * User notification preferences management interface.
 * Controls email, push, and in-app notification settings per event type.
 * Supports digest frequency, quiet hours, and channel-specific toggles.
 */

import { api } from "@convex/_generated/api";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import type { LucideIcon } from "@/lib/icons";
import {
  AtSign,
  Bell,
  BellOff,
  Info,
  MessageSquare,
  Moon,
  RefreshCw,
  Smartphone,
  User,
} from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { getVapidPublicKey, useWebPush } from "@/lib/webPush";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { CardSection } from "../ui/CardSection";
import { Input } from "../ui/form";
import { RadioGroup, RadioGroupItem } from "../ui/RadioGroup";
import { SkeletonText } from "../ui/Skeleton";
import { Stack } from "../ui/Stack";
import { Switch } from "../ui/Switch";
import { Typography } from "../ui/Typography";
import { SettingsSection, SettingsSectionRow } from "./SettingsSection";

type EmailPreferenceField =
  | "emailEnabled"
  | "emailMentions"
  | "emailAssignments"
  | "emailComments"
  | "emailStatusChanges"
  | "quietHoursEnabled";

type PushPreferenceField =
  | "pushMentions"
  | "pushAssignments"
  | "pushComments"
  | "pushStatusChanges";

type DigestValue = "none" | "daily" | "weekly";

function isDigestValue(value: string): value is DigestValue {
  return value === "none" || value === "daily" || value === "weekly";
}

interface NotificationToggleCardProps {
  checked: boolean;
  description: string;
  icon: LucideIcon;
  isDisabled: boolean;
  label: string;
  onChange: (value: boolean) => void;
}

function NotificationToggleCard({
  checked,
  description,
  icon,
  isDisabled,
  label,
  onChange,
}: NotificationToggleCardProps) {
  return (
    <CardSection>
      <SettingsSectionRow
        title={label}
        description={description}
        icon={icon}
        action={<Switch checked={checked} onCheckedChange={onChange} disabled={isDisabled} />}
      />
    </CardSection>
  );
}

interface DigestOptionCardProps {
  description: string;
  isDisabled: boolean;
  label: string;
  onChange: () => void;
  value: DigestValue;
}

function DigestOptionCard({
  description,
  isDisabled,
  label,
  onChange,
  value,
}: DigestOptionCardProps) {
  return (
    <CardSection>
      <RadioGroupItem
        value={value}
        label={label}
        description={description}
        disabled={isDisabled}
        onClick={onChange}
      />
    </CardSection>
  );
}

function PushNotificationsUnavailable({ icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <Alert variant="info">
      <AlertTitle>Push notifications unavailable</AlertTitle>
      <AlertDescription>
        <Flex align="start" gap="sm">
          <Icon icon={icon} size="sm" tone="info" className="mt-0.5 shrink-0" />
          <Typography variant="small">{message}</Typography>
        </Flex>
      </AlertDescription>
    </Alert>
  );
}

function PushNotificationsBlocked() {
  return (
    <Alert variant="warning">
      <AlertTitle>Browser notifications blocked</AlertTitle>
      <AlertDescription>
        <Stack gap="md">
          <Typography variant="small">
            Notification permission is denied for this site. Re-enable notifications in your browser
            settings to receive push alerts.
          </Typography>
          <div>
            <Button variant="secondary" size="sm" disabled>
              Blocked
            </Button>
          </div>
        </Stack>
      </AlertDescription>
    </Alert>
  );
}

function PushNotificationsPreferences({
  isSaving,
  isSubscribed,
  onPushToggle,
  pushPreferences,
}: {
  isSaving: boolean;
  isSubscribed: boolean;
  onPushToggle: (field: PushPreferenceField, value: boolean) => void;
  pushPreferences:
    | {
        pushMentions: boolean;
        pushAssignments: boolean;
        pushComments: boolean;
        pushStatusChanges: boolean;
      }
    | undefined;
}) {
  if (!isSubscribed) {
    return (
      <Typography variant="small" color="secondary">
        Enable browser notifications to manage device-specific alert types here.
      </Typography>
    );
  }

  if (!pushPreferences) {
    return (
      <CardSection>
        <SkeletonText lines={2} />
      </CardSection>
    );
  }

  return (
    <Stack gap="sm">
      <Typography variant="small" color="secondary">
        Choose which notification types should interrupt this browser.
      </Typography>
      <NotificationToggleCard
        icon={AtSign}
        label="Mentions"
        description="Receive push alerts when you are mentioned in issue or document activity."
        checked={pushPreferences.pushMentions}
        onChange={(value) => onPushToggle("pushMentions", value)}
        isDisabled={isSaving}
      />
      <NotificationToggleCard
        icon={User}
        label="Assignments"
        description="Receive push alerts when work is assigned directly to you."
        checked={pushPreferences.pushAssignments}
        onChange={(value) => onPushToggle("pushAssignments", value)}
        isDisabled={isSaving}
      />
      <NotificationToggleCard
        icon={MessageSquare}
        label="Comments"
        description="Receive push alerts when new comments land on work you are involved in."
        checked={pushPreferences.pushComments}
        onChange={(value) => onPushToggle("pushComments", value)}
        isDisabled={isSaving}
      />
      <NotificationToggleCard
        icon={RefreshCw}
        label="Status Changes"
        description="Receive push alerts when tracked issues move or change status."
        checked={pushPreferences.pushStatusChanges}
        onChange={(value) => onPushToggle("pushStatusChanges", value)}
        isDisabled={isSaving}
      />
    </Stack>
  );
}

function getPushNotificationsCardState({
  isSubscribed,
  isSupported,
  permission,
  pushPreferences,
  vapidKey,
}: {
  isSubscribed: boolean;
  isSupported: boolean;
  permission: NotificationPermission;
  pushPreferences:
    | {
        pushMentions: boolean;
        pushAssignments: boolean;
        pushComments: boolean;
        pushStatusChanges: boolean;
      }
    | undefined;
  vapidKey: string | undefined;
}): {
  content:
    | { icon: LucideIcon; kind: "unavailable"; message: string }
    | { kind: "blocked" }
    | {
        kind: "preferences";
        pushPreferences:
          | {
              pushMentions: boolean;
              pushAssignments: boolean;
              pushComments: boolean;
              pushStatusChanges: boolean;
            }
          | undefined;
      };
  showAction: boolean;
} {
  if (!isSupported) {
    return {
      content: {
        kind: "unavailable",
        icon: BellOff,
        message:
          "Push notifications are not supported in this browser. Try using Chrome, Edge, or Firefox.",
      },
      showAction: false,
    };
  }

  if (!vapidKey) {
    return {
      content: {
        kind: "unavailable",
        icon: Info,
        message: "Push notifications require server configuration. Contact your administrator.",
      },
      showAction: false,
    };
  }

  if (permission === "denied" && !isSubscribed) {
    return {
      content: { kind: "blocked" },
      showAction: false,
    };
  }

  return {
    content: {
      kind: "preferences",
      pushPreferences,
    },
    showAction: true,
  };
}

function PushNotificationsCardContent({
  cardState,
  isSaving,
  isSubscribed,
  onPushToggle,
}: {
  cardState: ReturnType<typeof getPushNotificationsCardState>;
  isSaving: boolean;
  isSubscribed: boolean;
  onPushToggle: (field: PushPreferenceField, value: boolean) => void;
}) {
  if (cardState.content.kind === "unavailable") {
    return (
      <PushNotificationsUnavailable
        icon={cardState.content.icon}
        message={cardState.content.message}
      />
    );
  }

  if (cardState.content.kind === "blocked") {
    return <PushNotificationsBlocked />;
  }

  return (
    <PushNotificationsPreferences
      isSaving={isSaving}
      isSubscribed={isSubscribed}
      onPushToggle={onPushToggle}
      pushPreferences={cardState.content.pushPreferences}
    />
  );
}

function PushNotificationsActionButton({
  cardState,
  isActionLoading,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
}: {
  cardState: ReturnType<typeof getPushNotificationsCardState>;
  isActionLoading: boolean;
  isSubscribed: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
}) {
  if (!cardState.showAction) {
    return undefined;
  }

  return (
    <Button
      variant={isSubscribed ? "secondary" : "primary"}
      size="sm"
      onClick={isSubscribed ? onUnsubscribe : onSubscribe}
      isLoading={isActionLoading}
      leftIcon={
        !isActionLoading ? <Icon icon={isSubscribed ? BellOff : Bell} size="sm" /> : undefined
      }
    >
      {isSubscribed ? "Disable" : "Enable"}
    </Button>
  );
}

function PushNotificationsCard({
  isPushLoading,
  isSaving,
  isSubscribed,
  isSupported,
  onPushToggle,
  onSubscribe,
  onUnsubscribe,
  permission,
  pushPreferences,
  vapidKey,
}: {
  isPushLoading: boolean;
  isSaving: boolean;
  isSubscribed: boolean;
  isSupported: boolean;
  onPushToggle: (field: PushPreferenceField, value: boolean) => void;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  permission: NotificationPermission;
  pushPreferences:
    | {
        pushMentions: boolean;
        pushAssignments: boolean;
        pushComments: boolean;
        pushStatusChanges: boolean;
      }
    | undefined;
  vapidKey: string | undefined;
}) {
  const cardState = getPushNotificationsCardState({
    isSubscribed,
    isSupported,
    permission,
    pushPreferences,
    vapidKey,
  });
  const isActionLoading = isSaving || isPushLoading;

  return (
    <SettingsSection
      title="Push Notifications"
      description="Receive real-time browser alerts even when Nixelo is not focused."
      icon={Smartphone}
      titleAdornment={
        <Badge variant="info" size="sm">
          PWA
        </Badge>
      }
      action={
        <PushNotificationsActionButton
          cardState={cardState}
          isActionLoading={isActionLoading}
          isSubscribed={isSubscribed}
          onSubscribe={onSubscribe}
          onUnsubscribe={onUnsubscribe}
        />
      }
    >
      <PushNotificationsCardContent
        cardState={cardState}
        isSaving={isSaving}
        isSubscribed={isSubscribed}
        onPushToggle={onPushToggle}
      />
    </SettingsSection>
  );
}

function QuietHoursRange({
  isSaving,
  onTimeChange,
  quietHoursEnd,
  quietHoursStart,
}: {
  isSaving: boolean;
  onTimeChange: (field: "quietHoursStart" | "quietHoursEnd", value: string) => void;
  quietHoursEnd: string;
  quietHoursStart: string;
}) {
  return (
    <CardSection size="md">
      <Stack gap="sm">
        <Typography variant="label">Delivery window</Typography>
        <Flex direction="column" gap="sm" directionSm="row" alignSm="end">
          <FlexItem flex="1">
            <Input
              label="Start time"
              type="time"
              value={quietHoursStart}
              onChange={(event) => onTimeChange("quietHoursStart", event.target.value)}
              disabled={isSaving}
            />
          </FlexItem>
          <Typography variant="small" color="secondary" className="pb-0 sm:pb-2">
            to
          </Typography>
          <FlexItem flex="1">
            <Input
              label="End time"
              type="time"
              value={quietHoursEnd}
              onChange={(event) => onTimeChange("quietHoursEnd", event.target.value)}
              disabled={isSaving}
            />
          </FlexItem>
        </Flex>
        <Typography variant="caption" color="secondary">
          Default: 10:00 PM to 8:00 AM in your local timezone
        </Typography>
      </Stack>
    </CardSection>
  );
}

function NotificationsLoadingState() {
  return (
    <Stack gap="lg">
      <Card padding="lg">
        <Stack gap="md">
          <SkeletonText lines={2} />
          <CardSection>
            <SkeletonText lines={1} />
          </CardSection>
          <CardSection>
            <SkeletonText lines={1} />
          </CardSection>
        </Stack>
      </Card>
      <Card padding="lg">
        <Stack gap="md">
          <SkeletonText lines={2} />
          <CardSection>
            <SkeletonText lines={1} />
          </CardSection>
          <CardSection>
            <SkeletonText lines={1} />
          </CardSection>
          <CardSection>
            <SkeletonText lines={1} />
          </CardSection>
        </Stack>
      </Card>
    </Stack>
  );
}

function NotificationDeliveryNote() {
  return (
    <SettingsSection
      title="Delivery Requirements"
      description="Email delivery depends on server-side provider configuration."
      icon={Info}
      iconTone="info"
      variant="soft"
      padding="md"
    >
      <Typography variant="small" color="secondary">
        Email notifications require Resend API configuration. If messages are not arriving, ask your
        administrator to finish the email delivery setup for this workspace.
      </Typography>
    </SettingsSection>
  );
}

/** Settings tab for notification preferences (email, push, digest). */
export function NotificationsTab() {
  const preferences = useAuthenticatedQuery(api.notificationPreferences.get, {});
  const pushPreferences = useAuthenticatedQuery(api.pushNotifications.getPreferences, {});
  const { mutate: updatePreferences } = useAuthenticatedMutation(
    api.notificationPreferences.update,
  );
  const { mutate: updatePushPreferences } = useAuthenticatedMutation(
    api.pushNotifications.updatePreferences,
  );
  const [isSaving, setIsSaving] = useState(false);

  const vapidKey = getVapidPublicKey();
  const {
    isSupported,
    isSubscribed,
    isLoading: isPushLoading,
    permission,
    subscribe,
    unsubscribe,
  } = useWebPush();

  if (!preferences) {
    return <NotificationsLoadingState />;
  }

  const handleToggle = async (field: EmailPreferenceField, value: boolean) => {
    setIsSaving(true);
    try {
      await updatePreferences({ [field]: value });
      showSuccess("Preferences updated");
    } catch (error) {
      showError(error, "Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDigestChange = async (digest: DigestValue) => {
    setIsSaving(true);
    try {
      await updatePreferences({ emailDigest: digest });
      showSuccess("Digest preference updated");
    } catch (error) {
      showError(error, "Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuietHoursTimeChange = async (
    field: "quietHoursStart" | "quietHoursEnd",
    value: string,
  ) => {
    setIsSaving(true);
    try {
      await updatePreferences({ [field]: value });
      showSuccess("Quiet hours updated");
    } catch (error) {
      showError(error, "Failed to update quiet hours");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToggle = async (field: PushPreferenceField, value: boolean) => {
    setIsSaving(true);
    try {
      await updatePushPreferences({ [field]: value });
      showSuccess("Push preferences updated");
    } catch (error) {
      showError(error, "Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="lg" data-testid={TEST_IDS.SETTINGS.NOTIFICATION_PREFERENCES_SECTION}>
      <PushNotificationsCard
        isPushLoading={isPushLoading}
        isSaving={isSaving}
        isSubscribed={isSubscribed}
        isSupported={isSupported}
        onPushToggle={handlePushToggle}
        onSubscribe={() => void subscribe()}
        onUnsubscribe={() => void unsubscribe()}
        permission={permission}
        pushPreferences={pushPreferences}
        vapidKey={vapidKey}
      />

      <SettingsSection
        title="Email Notifications"
        description="Control whether email delivery is active before tuning event types below."
        icon={Bell}
        action={
          <Switch
            checked={preferences.emailEnabled}
            onCheckedChange={(value) => void handleToggle("emailEnabled", value)}
            disabled={isSaving}
          />
        }
      >
        <Typography variant="small" color="secondary">
          Turn this off to stop all individual email notifications and digests for this account.
        </Typography>
      </SettingsSection>

      <SettingsSection
        title="Notification Types"
        description="Choose which events should send email when delivery is enabled."
      >
        <Stack gap="sm">
          <NotificationToggleCard
            icon={AtSign}
            label="Mentions"
            description="When someone @mentions you in a comment or description."
            checked={preferences.emailMentions}
            onChange={(value) => void handleToggle("emailMentions", value)}
            isDisabled={isSaving || !preferences.emailEnabled}
          />
          <NotificationToggleCard
            icon={User}
            label="Assignments"
            description="When work is assigned directly to you."
            checked={preferences.emailAssignments}
            onChange={(value) => void handleToggle("emailAssignments", value)}
            isDisabled={isSaving || !preferences.emailEnabled}
          />
          <NotificationToggleCard
            icon={MessageSquare}
            label="Comments"
            description="When someone comments on issues you are participating in."
            checked={preferences.emailComments}
            onChange={(value) => void handleToggle("emailComments", value)}
            isDisabled={isSaving || !preferences.emailEnabled}
          />
          <NotificationToggleCard
            icon={RefreshCw}
            label="Status Changes"
            description="When watched issues move or change workflow state."
            checked={preferences.emailStatusChanges}
            onChange={(value) => void handleToggle("emailStatusChanges", value)}
            isDisabled={isSaving || !preferences.emailEnabled}
          />
        </Stack>
      </SettingsSection>

      <SettingsSection
        title="Email Digests"
        description="Bundle updates into a recap instead of sending each event separately."
      >
        <RadioGroup
          value={preferences.emailDigest}
          onValueChange={(value) => {
            if (isDigestValue(value)) {
              void handleDigestChange(value);
            }
          }}
          disabled={isSaving || !preferences.emailEnabled}
        >
          <DigestOptionCard
            value="none"
            label="No digest"
            description="Receive emails as events happen."
            onChange={() => void handleDigestChange("none")}
            isDisabled={isSaving || !preferences.emailEnabled}
          />
          <DigestOptionCard
            value="daily"
            label="Daily digest"
            description="One recap per day with recent activity."
            onChange={() => void handleDigestChange("daily")}
            isDisabled={isSaving || !preferences.emailEnabled}
          />
          <DigestOptionCard
            value="weekly"
            label="Weekly digest"
            description="One recap per week with recent activity."
            onChange={() => void handleDigestChange("weekly")}
            isDisabled={isSaving || !preferences.emailEnabled}
          />
        </RadioGroup>
      </SettingsSection>

      <SettingsSection
        title="Quiet Hours"
        description="Pause email delivery during a predictable time window."
        icon={Moon}
        action={
          <Switch
            checked={preferences.quietHoursEnabled ?? false}
            onCheckedChange={(value) => void handleToggle("quietHoursEnabled", value)}
            disabled={isSaving}
          />
        }
      >
        <Typography variant="small" color="secondary">
          Notifications that arrive during quiet hours are delivered once the window ends.
        </Typography>
        {preferences.quietHoursEnabled ? (
          <QuietHoursRange
            isSaving={isSaving}
            onTimeChange={(field, value) => void handleQuietHoursTimeChange(field, value)}
            quietHoursEnd={preferences.quietHoursEnd ?? "08:00"}
            quietHoursStart={preferences.quietHoursStart ?? "22:00"}
          />
        ) : null}
      </SettingsSection>

      <NotificationDeliveryNote />
    </Stack>
  );
}
