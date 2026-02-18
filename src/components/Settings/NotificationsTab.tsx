import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import {
  AtSign,
  Bell,
  BellOff,
  Info,
  MessageSquare,
  RefreshCw,
  Smartphone,
  User,
} from "@/lib/icons";
import { getVapidPublicKey, useWebPush } from "@/lib/webPush";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Stack } from "../ui/Stack";
import { Switch } from "../ui/Switch";
import { Typography } from "../ui/Typography";

/** Reusable preference toggle row */
function PreferenceRow({
  icon,
  label,
  description,
  checked,
  disabled,
  onChange,
  isLast = false,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <Flex
      align="start"
      justify="between"
      className={isLast ? "py-3" : "py-3 border-b border-ui-border-secondary"}
    >
      <FlexItem flex="1">
        <Flex align="center" gap="sm">
          <Icon icon={icon} size="md" />
          <Typography variant="label">{label}</Typography>
        </Flex>
        <Typography variant="caption" className="mt-1">
          {description}
        </Typography>
      </FlexItem>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="ml-4" />
    </Flex>
  );
}

/** Push notification preference toggle (smaller) */
function PushPreferenceRow({
  icon,
  label,
  checked,
  disabled,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Flex align="center" justify="between" className="py-2">
      <Flex align="center" gap="sm">
        <Icon icon={icon} size="sm" />
        <Typography variant="small">{label}</Typography>
      </Flex>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </Flex>
  );
}

/** Digest option radio button */
function DigestOption({
  value,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  value: "none" | "daily" | "weekly";
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <label className="cursor-pointer">
      <Card padding="sm" className="hover:bg-ui-bg-secondary transition-colors">
        <Flex align="center" gap="md">
          <input
            type="radio"
            name="digest"
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="w-4 h-4 text-brand focus:ring-brand-ring focus:ring-2"
          />
          <Stack gap="none">
            <Typography variant="label">{label}</Typography>
            <Typography variant="caption">{description}</Typography>
          </Stack>
        </Flex>
      </Card>
    </label>
  );
}

/** Push notifications card with browser support detection */
function PushNotificationsCard({
  isSupported,
  vapidKey,
  isSubscribed,
  isPushLoading,
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
        <Card padding="md" variant="flat">
          <Flex align="center" gap="sm">
            <Icon icon={BellOff} size="md" className="text-ui-text-tertiary" />
            <Typography variant="caption">
              Push notifications are not supported in this browser. Try using Chrome, Edge, or
              Firefox.
            </Typography>
          </Flex>
        </Card>
      );
    }

    if (!vapidKey) {
      return (
        <Card padding="md" variant="flat">
          <Flex align="center" gap="sm">
            <Icon icon={Info} size="md" className="text-ui-text-tertiary" />
            <Typography variant="caption">
              Push notifications require server configuration. Contact your administrator.
            </Typography>
          </Flex>
        </Card>
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
          >
            {isSubscribed ? (
              <>
                <BellOff className="w-4 h-4 mr-1" />
                Disable
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-1" />
                Enable
              </>
            )}
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
              disabled={isSaving}
            />
            <PushPreferenceRow
              icon={User}
              label="Assignments"
              checked={pushPreferences.pushAssignments}
              onChange={(value) => onPushToggle("pushAssignments", value)}
              disabled={isSaving}
            />
            <PushPreferenceRow
              icon={MessageSquare}
              label="Comments"
              checked={pushPreferences.pushComments}
              onChange={(value) => onPushToggle("pushComments", value)}
              disabled={isSaving}
            />
            <PushPreferenceRow
              icon={RefreshCw}
              label="Status Changes"
              checked={pushPreferences.pushStatusChanges}
              onChange={(value) => onPushToggle("pushStatusChanges", value)}
              disabled={isSaving}
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
          <Icon icon={Smartphone} size="lg" className="text-brand" />
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

export function NotificationsTab() {
  const preferences = useQuery(api.notificationPreferences.get);
  const pushPreferences = useQuery(api.pushNotifications.getPreferences);
  const updatePreferences = useMutation(api.notificationPreferences.update);
  const updatePushPreferences = useMutation(api.pushNotifications.updatePreferences);
  const [isSaving, setIsSaving] = useState(false);

  // Web Push hook
  const vapidKey = getVapidPublicKey();
  const {
    isSupported,
    isSubscribed,
    isLoading: isPushLoading,
    subscribe,
    unsubscribe,
  } = useWebPush();

  if (!preferences) {
    return (
      <Card padding="lg">
        <Stack gap="md" className="animate-pulse">
          <div className="h-6 bg-ui-bg-tertiary rounded w-1/3" />
          <div className="h-4 bg-ui-bg-tertiary rounded w-2/3" />
          <Stack gap="sm">
            <div className="h-10 bg-ui-bg-tertiary rounded" />
            <div className="h-10 bg-ui-bg-tertiary rounded" />
            <div className="h-10 bg-ui-bg-tertiary rounded" />
          </Stack>
        </Stack>
      </Card>
    );
  }

  const handleToggle = async (field: string, value: boolean) => {
    setIsSaving(true);
    try {
      await updatePreferences({ [field]: value });
      toast.success("Preferences updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDigestChange = async (digest: "none" | "daily" | "weekly") => {
    setIsSaving(true);
    try {
      await updatePreferences({ emailDigest: digest });
      toast.success("Digest preference updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToggle = async (field: string, value: boolean) => {
    setIsSaving(true);
    try {
      await updatePushPreferences({ [field]: value });
      toast.success("Push preferences updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <PushNotificationsCard
        isSupported={isSupported}
        vapidKey={vapidKey}
        isSubscribed={isSubscribed}
        isPushLoading={isPushLoading}
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
              disabled={isSaving || !preferences.emailEnabled}
            />
            <PreferenceRow
              icon={User}
              label="Assignments"
              description="When you are assigned to an issue"
              checked={preferences.emailAssignments}
              onChange={(value) => handleToggle("emailAssignments", value)}
              disabled={isSaving || !preferences.emailEnabled}
            />
            <PreferenceRow
              icon={MessageSquare}
              label="Comments"
              description="When someone comments on your issues"
              checked={preferences.emailComments}
              onChange={(value) => handleToggle("emailComments", value)}
              disabled={isSaving || !preferences.emailEnabled}
            />
            <PreferenceRow
              icon={RefreshCw}
              label="Status Changes"
              description="When issue status changes on issues you're watching"
              checked={preferences.emailStatusChanges}
              onChange={(value) => handleToggle("emailStatusChanges", value)}
              disabled={isSaving || !preferences.emailEnabled}
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
            <DigestOption
              value="none"
              label="No digest"
              description="Receive emails as events happen"
              checked={preferences.emailDigest === "none"}
              onChange={() => handleDigestChange("none")}
              disabled={isSaving || !preferences.emailEnabled}
            />
            <DigestOption
              value="daily"
              label="Daily digest"
              description="One email per day with all activity (coming soon)"
              checked={preferences.emailDigest === "daily"}
              onChange={() => handleDigestChange("daily")}
              disabled={isSaving || !preferences.emailEnabled}
            />
            <DigestOption
              value="weekly"
              label="Weekly digest"
              description="One email per week with all activity (coming soon)"
              checked={preferences.emailDigest === "weekly"}
              onChange={() => handleDigestChange("weekly")}
              disabled={isSaving || !preferences.emailEnabled}
            />
          </Stack>
        </Stack>
      </Card>

      {/* Help Text */}
      <Card padding="md" className="bg-brand-subtle border-brand-border">
        <Flex gap="md">
          <Icon icon={Info} size="md" className="text-brand" />
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
