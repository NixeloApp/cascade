import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
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
  icon: React.ComponentType<{ className?: string }>;
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
  icon: React.ComponentType<{ className?: string }>;
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
    <label className="flex items-center gap-3 p-3 rounded-lg border border-ui-border cursor-pointer hover:bg-ui-bg-secondary transition-colors">
      <input
        type="radio"
        name="digest"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 text-brand focus:ring-brand-ring focus:ring-2"
      />
      <div>
        <Typography variant="label">{label}</Typography>
        <Typography variant="caption">{description}</Typography>
      </div>
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
  vapidKey: string | null;
  isSubscribed: boolean;
  isPushLoading: boolean;
  pushPreferences: { pushMentions: boolean; pushAssignments: boolean; pushComments: boolean; pushStatusChanges: boolean } | undefined;
  isSaving: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onPushToggle: (field: string, value: boolean) => void;
}) {
  const renderContent = () => {
    if (!isSupported) {
      return (
        <div className="p-4 bg-ui-bg-tertiary rounded-lg">
          <Flex align="center" gap="sm">
            <Icon icon={BellOff} size="md" className="text-ui-text-tertiary" />
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
        <div className="p-4 bg-ui-bg-tertiary rounded-lg">
          <Flex align="center" gap="sm">
            <Icon icon={Info} size="md" className="text-ui-text-tertiary" />
            <Typography variant="caption">
              Push notifications require server configuration. Contact your administrator.
            </Typography>
          </Flex>
        </div>
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
          <div className="space-y-3 pt-4 border-t border-ui-border-secondary">
            <Typography variant="small" className="text-ui-text-secondary mb-2">
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
          </div>
        )}
      </>
    );
  };

  return (
    <Card>
      <div className="p-6">
        <Flex align="center" gap="sm" className="mb-4">
          <Icon icon={Smartphone} size="lg" className="text-brand" />
          <Typography variant="h5">Push Notifications</Typography>
          <Badge variant="info" size="sm">
            PWA
          </Badge>
        </Flex>
        {renderContent()}
      </div>
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
      <Card>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-ui-bg-tertiary rounded w-1/3" />
            <div className="h-4 bg-ui-bg-tertiary rounded w-2/3" />
            <div className="space-y-3">
              <div className="h-10 bg-ui-bg-tertiary rounded" />
              <div className="h-10 bg-ui-bg-tertiary rounded" />
              <div className="h-10 bg-ui-bg-tertiary rounded" />
            </div>
          </div>
        </div>
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
    <div className="space-y-6">
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
      <Card>
        <div className="p-6">
          <Flex align="start" justify="between">
            <FlexItem flex="1">
              <Typography variant="h5">Email Notifications</Typography>
              <Typography variant="caption" className="mt-1">
                Master switch for all email notifications. Turn this off to stop receiving all
                emails.
              </Typography>
            </FlexItem>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(value) => handleToggle("emailEnabled", value)}
              disabled={isSaving}
              className="ml-4"
            />
          </Flex>
        </div>
      </Card>

      {/* Individual Notification Types */}
      <Card>
        <div className="p-6">
          <Typography variant="h5" className="mb-4">
            Notification Types
          </Typography>

          <div className="space-y-4">
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
          </div>
        </div>
      </Card>

      {/* Digest Emails */}
      <Card>
        <div className="p-6">
          <Typography variant="h5" className="mb-2">
            Email Digests
          </Typography>
          <Typography variant="caption" className="mb-4">
            Receive a summary of activity instead of individual emails
          </Typography>

          <div className="space-y-2">
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
          </div>
        </div>
      </Card>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-brand-subtle rounded-lg border border-brand-border">
        <Flex gap="md">
          <Icon icon={Info} size="md" className="text-brand" />
          <FlexItem flex="1">
            <Typography variant="label" className="text-brand-active mb-1">
              Email Configuration
            </Typography>
            <Typography variant="caption" className="text-brand-active">
              Email notifications require Resend API configuration. If you're not receiving emails,
              contact your administrator to set up email notifications.
            </Typography>
          </FlexItem>
        </Flex>
      </div>
    </div>
  );
}
