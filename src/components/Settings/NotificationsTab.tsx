/**
 * Notifications Settings Tab
 *
 * User notification preferences management interface.
 * Controls email, push, and in-app notification settings per event type.
 * Supports digest frequency, quiet hours, and channel-specific toggles.
 */

import { api } from "@convex/_generated/api";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
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
import { cn } from "@/lib/utils";
import { getVapidPublicKey, useWebPush } from "@/lib/webPush";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/form";
import { RadioGroup, RadioGroupItem } from "../ui/RadioGroup";
import { SkeletonText } from "../ui/Skeleton";
import { Stack } from "../ui/Stack";
import { Switch } from "../ui/Switch";
import { Typography } from "../ui/Typography";

/** Reusable preference toggle row */
interface PreferenceRowProps {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  isDisabled: boolean;
  onChange: (value: boolean) => void;
  isLast?: boolean;
}

function PreferenceRow({
  icon,
  label,
  description,
  checked,
  isDisabled,
  onChange,
  isLast = false,
}: PreferenceRowProps) {
  return (
    <div className={cn("p-3", !isLast && "border-b border-ui-border-secondary")}>
      <Flex align="start" justify="between">
        <FlexItem flex="1">
          <Flex align="center" gap="sm">
            <Icon icon={icon} size="md" />
            <Typography variant="label">{label}</Typography>
          </Flex>
          <Typography variant="caption" className="mt-1">
            {description}
          </Typography>
        </FlexItem>
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={isDisabled}
          className="ml-4"
        />
      </Flex>
    </div>
  );
}

/** Push notification preference toggle (smaller) */
interface PushPreferenceRowProps {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  isDisabled: boolean;
  onChange: (value: boolean) => void;
}

function PushPreferenceRow({ icon, label, checked, isDisabled, onChange }: PushPreferenceRowProps) {
  return (
    <div className="p-2">
      <Flex align="center" justify="between">
        <Flex align="center" gap="sm">
          <Icon icon={icon} size="sm" />
          <Typography variant="small">{label}</Typography>
        </Flex>
        <Switch checked={checked} onCheckedChange={onChange} disabled={isDisabled} />
      </Flex>
    </div>
  );
}

/** Digest option card */
interface DigestOptionCardProps {
  value: "none" | "daily" | "weekly";
  label: string;
  description: string;
  checked: boolean;
  isDisabled: boolean;
  onChange: () => void;
}

function DigestOptionCard({
  value,
  label,
  description,
  checked,
  isDisabled,
  onChange,
}: DigestOptionCardProps) {
  return (
    <Card padding="sm" hoverable variant={checked ? "outline" : "ghost"}>
      <RadioGroupItem
        value={value}
        label={label}
        description={description}
        disabled={isDisabled}
        onClick={onChange}
      />
    </Card>
  );
}

/** Push notifications card with browser support detection */
function PushNotificationsCard({
  isSupported,
  vapidKey,
  isSubscribed,
  isPushLoading,
  permission,
  pushPreferences,
  isSaving,
  onSubscribe,
  onUnsubscribe,
  onPushToggle,
}: {
  isSupported: boolean;
  vapidKey: string | undefined;
  isSubscribed: boolean;
  isPushLoading: boolean;
  permission: NotificationPermission;
  pushPreferences:
    | {
        pushMentions: boolean;
        pushAssignments: boolean;
        pushComments: boolean;
        pushStatusChanges: boolean;
      }
    | undefined;
  isSaving: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onPushToggle: (field: string, value: boolean) => void;
}) {
  const renderContent = () => {
    if (!isSupported) {
      return (
        <div className="border border-ui-border-secondary/80 bg-ui-bg-soft/90 p-4">
          <Flex align="center" gap="sm">
            <Icon icon={BellOff} size="md" tone="tertiary" />
            <Typography variant="caption">
              Push notifications are not supported in this browser. Try using Chrome, Edge, or
              Firefox.
            </Typography>
          </Flex>
        </div>
      );
    }

    if (!vapidKey) {
      return (
        <div className="border border-ui-border-secondary/80 bg-ui-bg-soft/90 p-4">
          <Flex align="center" gap="sm">
            <Icon icon={Info} size="md" tone="tertiary" />
            <Typography variant="caption">
              Push notifications require server configuration. Contact your administrator.
            </Typography>
          </Flex>
        </div>
      );
    }

    if (permission === "denied" && !isSubscribed) {
      return (
        <Alert variant="warning">
          <AlertTitle>Browser notifications blocked</AlertTitle>
          <AlertDescription>
            <Typography variant="small">
              Notification permission is denied for this site. Re-enable notifications in your
              browser settings to receive push alerts.
            </Typography>
            <div className="mt-3">
              <Button variant="secondary" size="sm" disabled>
                Blocked
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <Flex align="start" justify="between" className="mb-4">
          <FlexItem flex="1">
            <Typography variant="label">Browser Notifications</Typography>
            <Typography variant="caption" className="mt-1">
              Receive real-time notifications in your browser, even when Nixelo isn't open.
            </Typography>
          </FlexItem>
          <Button
            variant={isSubscribed ? "secondary" : "primary"}
            size="sm"
            onClick={isSubscribed ? onUnsubscribe : onSubscribe}
            isLoading={isPushLoading}
            className="ml-4"
            leftIcon={
              !isPushLoading ? <Icon icon={isSubscribed ? BellOff : Bell} size="sm" /> : undefined
            }
          >
            {isSubscribed ? "Disable" : "Enable"}
          </Button>
        </Flex>

        {isSubscribed && pushPreferences && (
          <Stack gap="sm" className="pt-4 border-t border-ui-border-secondary">
            <Typography variant="small" color="secondary">
              Choose which notifications you want to receive:
            </Typography>
            <PushPreferenceRow
              icon={AtSign}
              label="Mentions"
              checked={pushPreferences.pushMentions}
              onChange={(value) => onPushToggle("pushMentions", value)}
              isDisabled={isSaving}
            />
            <PushPreferenceRow
              icon={User}
              label="Assignments"
              checked={pushPreferences.pushAssignments}
              onChange={(value) => onPushToggle("pushAssignments", value)}
              isDisabled={isSaving}
            />
            <PushPreferenceRow
              icon={MessageSquare}
              label="Comments"
              checked={pushPreferences.pushComments}
              onChange={(value) => onPushToggle("pushComments", value)}
              isDisabled={isSaving}
            />
            <PushPreferenceRow
              icon={RefreshCw}
              label="Status Changes"
              checked={pushPreferences.pushStatusChanges}
              onChange={(value) => onPushToggle("pushStatusChanges", value)}
              isDisabled={isSaving}
            />
          </Stack>
        )}
      </>
    );
  };

  return (
    <Card padding="lg">
      <Stack gap="md">
        <Flex align="center" gap="sm">
          <Icon icon={Smartphone} size="lg" tone="brand" />
          <Typography variant="h5">Push Notifications</Typography>
          <Badge variant="info" size="sm">
            PWA
          </Badge>
        </Flex>
        {renderContent()}
      </Stack>
    </Card>
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

  // Web Push hook
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
    return (
      <Card padding="lg">
        <Stack gap="md">
          <SkeletonText lines={2} />
          <Stack gap="sm">
            <div className="border border-ui-border-secondary/80 bg-ui-bg-soft/90 p-3">
              <SkeletonText lines={1} />
            </div>
            <div className="border border-ui-border-secondary/80 bg-ui-bg-soft/90 p-3">
              <SkeletonText lines={1} />
            </div>
            <div className="border border-ui-border-secondary/80 bg-ui-bg-soft/90 p-3">
              <SkeletonText lines={1} />
            </div>
          </Stack>
        </Stack>
      </Card>
    );
  }

  const handleToggle = async (field: string, value: boolean) => {
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

  const handleDigestChange = async (digest: "none" | "daily" | "weekly") => {
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

  const handlePushToggle = async (field: string, value: boolean) => {
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
        isSupported={isSupported}
        vapidKey={vapidKey}
        isSubscribed={isSubscribed}
        isPushLoading={isPushLoading}
        permission={permission}
        pushPreferences={pushPreferences}
        isSaving={isSaving}
        onSubscribe={subscribe}
        onUnsubscribe={unsubscribe}
        onPushToggle={handlePushToggle}
      />

      {/* Master Toggle */}
      <Card padding="lg">
        <Flex align="start" justify="between">
          <FlexItem flex="1">
            <Typography variant="h5">Email Notifications</Typography>
            <Typography variant="caption" className="mt-1">
              Master switch for all email notifications. Turn this off to stop receiving all emails.
            </Typography>
          </FlexItem>
          <Switch
            checked={preferences.emailEnabled}
            onCheckedChange={(value) => handleToggle("emailEnabled", value)}
            disabled={isSaving}
            className="ml-4"
          />
        </Flex>
      </Card>

      {/* Individual Notification Types */}
      <Card padding="lg">
        <Stack gap="md">
          <Typography variant="h5">Notification Types</Typography>

          <Stack gap="md">
            <PreferenceRow
              icon={AtSign}
              label="Mentions"
              description="When someone @mentions you in a comment or description"
              checked={preferences.emailMentions}
              onChange={(value) => handleToggle("emailMentions", value)}
              isDisabled={isSaving || !preferences.emailEnabled}
            />
            <PreferenceRow
              icon={User}
              label="Assignments"
              description="When you are assigned to an issue"
              checked={preferences.emailAssignments}
              onChange={(value) => handleToggle("emailAssignments", value)}
              isDisabled={isSaving || !preferences.emailEnabled}
            />
            <PreferenceRow
              icon={MessageSquare}
              label="Comments"
              description="When someone comments on your issues"
              checked={preferences.emailComments}
              onChange={(value) => handleToggle("emailComments", value)}
              isDisabled={isSaving || !preferences.emailEnabled}
            />
            <PreferenceRow
              icon={RefreshCw}
              label="Status Changes"
              description="When issue status changes on issues you're watching"
              checked={preferences.emailStatusChanges}
              onChange={(value) => handleToggle("emailStatusChanges", value)}
              isDisabled={isSaving || !preferences.emailEnabled}
              isLast
            />
          </Stack>
        </Stack>
      </Card>

      {/* Digest Emails */}
      <Card padding="lg">
        <Stack gap="md">
          <Stack gap="xs">
            <Typography variant="h5">Email Digests</Typography>
            <Typography variant="caption">
              Receive a summary of activity instead of individual emails
            </Typography>
          </Stack>

          <Stack gap="sm">
            <RadioGroup
              value={preferences.emailDigest}
              onValueChange={(value) => handleDigestChange(value as "none" | "daily" | "weekly")}
              disabled={isSaving || !preferences.emailEnabled}
            >
              <DigestOptionCard
                value="none"
                label="No digest"
                description="Receive emails as events happen"
                checked={preferences.emailDigest === "none"}
                onChange={() => handleDigestChange("none")}
                isDisabled={isSaving || !preferences.emailEnabled}
              />
              <DigestOptionCard
                value="daily"
                label="Daily digest"
                description="One email per day with all activity (coming soon)"
                checked={preferences.emailDigest === "daily"}
                onChange={() => handleDigestChange("daily")}
                isDisabled={isSaving || !preferences.emailEnabled}
              />
              <DigestOptionCard
                value="weekly"
                label="Weekly digest"
                description="One email per week with all activity (coming soon)"
                checked={preferences.emailDigest === "weekly"}
                onChange={() => handleDigestChange("weekly")}
                isDisabled={isSaving || !preferences.emailEnabled}
              />
            </RadioGroup>
          </Stack>
        </Stack>
      </Card>

      {/* Quiet Hours */}
      <Card padding="lg">
        <Stack gap="md">
          <Flex align="start" justify="between">
            <FlexItem flex="1">
              <Flex align="center" gap="sm">
                <Icon icon={Moon} size="lg" tone="brand" />
                <Typography variant="h5">Quiet Hours</Typography>
              </Flex>
              <Typography variant="caption" className="mt-1">
                Pause notifications during specific hours. Notifications will be delivered when
                quiet hours end.
              </Typography>
            </FlexItem>
            <Switch
              checked={preferences.quietHoursEnabled ?? false}
              onCheckedChange={(value) => handleToggle("quietHoursEnabled", value)}
              disabled={isSaving}
              className="ml-4"
            />
          </Flex>

          {preferences.quietHoursEnabled && (
            <Stack gap="sm" className="pt-4 border-t border-ui-border-secondary">
              <Flex gap="md" align="end">
                <FlexItem flex="1">
                  <Input
                    label="Start time"
                    type="time"
                    value={preferences.quietHoursStart ?? "22:00"}
                    onChange={(e) => handleQuietHoursTimeChange("quietHoursStart", e.target.value)}
                    disabled={isSaving}
                  />
                </FlexItem>
                <Typography variant="small" color="secondary" className="pb-2">
                  to
                </Typography>
                <FlexItem flex="1">
                  <Input
                    label="End time"
                    type="time"
                    value={preferences.quietHoursEnd ?? "08:00"}
                    onChange={(e) => handleQuietHoursTimeChange("quietHoursEnd", e.target.value)}
                    disabled={isSaving}
                  />
                </FlexItem>
              </Flex>
              <Typography variant="caption" color="secondary">
                Default: 10:00 PM to 8:00 AM in your local timezone
              </Typography>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Help Text */}
      <Card padding="md" className="bg-brand-subtle border-brand-border">
        <Flex gap="md">
          <Icon icon={Info} size="md" tone="brand" />
          <FlexItem flex="1">
            <Stack gap="xs">
              <Typography variant="label" className="text-brand-active">
                Email Configuration
              </Typography>
              <Typography variant="caption" className="text-brand-active">
                Email notifications require Resend API configuration. If you're not receiving
                emails, contact your administrator to set up email notifications.
              </Typography>
            </Stack>
          </FlexItem>
        </Flex>
      </Card>
    </Stack>
  );
}
