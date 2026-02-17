import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { getVapidPublicKey, useWebPush } from "@/contexts/WebPushContext";
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
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Switch } from "../ui/Switch";
import { Typography } from "../ui/Typography";

// ============================================================================
// Types
// ============================================================================

interface NotificationToggleProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

interface DigestOptionProps {
  value: "none" | "daily" | "weekly";
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

// ============================================================================
// Subcomponents
// ============================================================================

function NotificationToggle({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled,
  size = "md",
}: NotificationToggleProps) {
  return (
    <Flex
      align={description ? "start" : "center"}
      justify="between"
      className={cn(
        description ? "py-3 border-b border-ui-border-secondary last:border-0" : "py-2",
      )}
    >
      <FlexItem flex="1">
        <Flex align="center" gap="sm">
          <Icon icon={icon} size={size} />
          <Typography variant={size === "sm" ? "small" : "label"}>{label}</Typography>
        </Flex>
        {description && (
          <Typography variant="caption" className="mt-1">
            {description}
          </Typography>
        )}
      </FlexItem>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={cn(description && "ml-4")}
      />
    </Flex>
  );
}

function DigestOption({
  value,
  label,
  description,
  checked,
  onChange,
  disabled,
}: DigestOptionProps) {
  return (
    <Flex
      as="label"
      align="center"
      gap="md"
      className="p-3 rounded-lg border border-ui-border cursor-pointer hover:bg-ui-bg-secondary transition-colors"
    >
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
    </Flex>
  );
}

function LoadingSkeleton() {
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

function PushNotSupportedMessage() {
  return (
    <div className="p-4 bg-ui-bg-tertiary rounded-lg">
      <Flex align="center" gap="sm">
        <Icon icon={BellOff} size="md" className="text-ui-text-tertiary" />
        <Typography variant="caption">
          Push notifications are not supported in this browser. Try using Chrome, Edge, or Firefox.
        </Typography>
      </Flex>
    </div>
  );
}

function PushNotConfiguredMessage() {
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

// ============================================================================
// Main Component
// ============================================================================

export function NotificationsTab() {
  const preferences = useQuery(api.notificationPreferences.get);
  const pushPreferences = useQuery(api.pushNotifications.getPreferences);
  const updatePreferences = useMutation(api.notificationPreferences.update);
  const updatePushPreferences = useMutation(api.pushNotifications.updatePreferences);
  const [isSaving, setIsSaving] = useState(false);

  const vapidKey = getVapidPublicKey();
  const {
    isSupported,
    isSubscribed,
    isLoading: isPushLoading,
    subscribe,
    unsubscribe,
  } = useWebPush();

  if (!preferences) {
    return <LoadingSkeleton />;
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

  const emailDisabled = isSaving || !preferences.emailEnabled;

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <Card>
        <div className="p-6">
          <Flex align="center" gap="sm" className="mb-4">
            <Icon icon={Smartphone} size="lg" className="text-brand" />
            <Typography variant="h5">Push Notifications</Typography>
            <Badge variant="info" size="sm">
              PWA
            </Badge>
          </Flex>

          {!isSupported ? (
            <PushNotSupportedMessage />
          ) : !vapidKey ? (
            <PushNotConfiguredMessage />
          ) : (
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
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  isLoading={isPushLoading}
                  className="ml-4"
                >
                  {isSubscribed ? (
                    <>
                      <Icon icon={BellOff} size="sm" className="mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Icon icon={Bell} size="sm" className="mr-1" />
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
                  <NotificationToggle
                    icon={AtSign}
                    label="Mentions"
                    checked={pushPreferences.pushMentions}
                    onChange={(v) => handlePushToggle("pushMentions", v)}
                    disabled={isSaving}
                    size="sm"
                  />
                  <NotificationToggle
                    icon={User}
                    label="Assignments"
                    checked={pushPreferences.pushAssignments}
                    onChange={(v) => handlePushToggle("pushAssignments", v)}
                    disabled={isSaving}
                    size="sm"
                  />
                  <NotificationToggle
                    icon={MessageSquare}
                    label="Comments"
                    checked={pushPreferences.pushComments}
                    onChange={(v) => handlePushToggle("pushComments", v)}
                    disabled={isSaving}
                    size="sm"
                  />
                  <NotificationToggle
                    icon={RefreshCw}
                    label="Status Changes"
                    checked={pushPreferences.pushStatusChanges}
                    onChange={(v) => handlePushToggle("pushStatusChanges", v)}
                    disabled={isSaving}
                    size="sm"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

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
            <NotificationToggle
              icon={AtSign}
              label="Mentions"
              description="When someone @mentions you in a comment or description"
              checked={preferences.emailMentions}
              onChange={(v) => handleToggle("emailMentions", v)}
              disabled={emailDisabled}
            />
            <NotificationToggle
              icon={User}
              label="Assignments"
              description="When you are assigned to an issue"
              checked={preferences.emailAssignments}
              onChange={(v) => handleToggle("emailAssignments", v)}
              disabled={emailDisabled}
            />
            <NotificationToggle
              icon={MessageSquare}
              label="Comments"
              description="When someone comments on your issues"
              checked={preferences.emailComments}
              onChange={(v) => handleToggle("emailComments", v)}
              disabled={emailDisabled}
            />
            <NotificationToggle
              icon={RefreshCw}
              label="Status Changes"
              description="When issue status changes on issues you're watching"
              checked={preferences.emailStatusChanges}
              onChange={(v) => handleToggle("emailStatusChanges", v)}
              disabled={emailDisabled}
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
              disabled={emailDisabled}
            />
            <DigestOption
              value="daily"
              label="Daily digest"
              description="One email per day with all activity (coming soon)"
              checked={preferences.emailDigest === "daily"}
              onChange={() => handleDigestChange("daily")}
              disabled={emailDisabled}
            />
            <DigestOption
              value="weekly"
              label="Weekly digest"
              description="One email per week with all activity (coming soon)"
              checked={preferences.emailDigest === "weekly"}
              onChange={() => handleDigestChange("weekly")}
              disabled={emailDisabled}
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
