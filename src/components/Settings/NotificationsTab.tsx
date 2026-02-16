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
            <div className="p-4 bg-ui-bg-tertiary rounded-lg">
              <Flex align="center" gap="sm">
                <Icon icon={BellOff} size="md" className="text-ui-text-tertiary" />
                <Typography variant="caption">
                  Push notifications are not supported in this browser. Try using Chrome, Edge, or
                  Firefox.
                </Typography>
              </Flex>
            </div>
          ) : !vapidKey ? (
            <div className="p-4 bg-ui-bg-tertiary rounded-lg">
              <Flex align="center" gap="sm">
                <Icon icon={Info} size="md" className="text-ui-text-tertiary" />
                <Typography variant="caption">
                  Push notifications require server configuration. Contact your administrator.
                </Typography>
              </Flex>
            </div>
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

                  {/* Push Mentions */}
                  <Flex align="center" justify="between" className="py-2">
                    <Flex align="center" gap="sm">
                      <Icon icon={AtSign} size="sm" />
                      <Typography variant="small">Mentions</Typography>
                    </Flex>
                    <Switch
                      checked={pushPreferences.pushMentions}
                      onCheckedChange={(value) => handlePushToggle("pushMentions", value)}
                      disabled={isSaving}
                      size="sm"
                    />
                  </Flex>

                  {/* Push Assignments */}
                  <Flex align="center" justify="between" className="py-2">
                    <Flex align="center" gap="sm">
                      <Icon icon={User} size="sm" />
                      <Typography variant="small">Assignments</Typography>
                    </Flex>
                    <Switch
                      checked={pushPreferences.pushAssignments}
                      onCheckedChange={(value) => handlePushToggle("pushAssignments", value)}
                      disabled={isSaving}
                      size="sm"
                    />
                  </Flex>

                  {/* Push Comments */}
                  <Flex align="center" justify="between" className="py-2">
                    <Flex align="center" gap="sm">
                      <Icon icon={MessageSquare} size="sm" />
                      <Typography variant="small">Comments</Typography>
                    </Flex>
                    <Switch
                      checked={pushPreferences.pushComments}
                      onCheckedChange={(value) => handlePushToggle("pushComments", value)}
                      disabled={isSaving}
                      size="sm"
                    />
                  </Flex>

                  {/* Push Status Changes */}
                  <Flex align="center" justify="between" className="py-2">
                    <Flex align="center" gap="sm">
                      <Icon icon={RefreshCw} size="sm" />
                      <Typography variant="small">Status Changes</Typography>
                    </Flex>
                    <Switch
                      checked={pushPreferences.pushStatusChanges}
                      onCheckedChange={(value) => handlePushToggle("pushStatusChanges", value)}
                      disabled={isSaving}
                      size="sm"
                    />
                  </Flex>
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
            {/* Mentions */}
            <Flex
              align="start"
              justify="between"
              className="py-3 border-b border-ui-border-secondary last:border-0"
            >
              <FlexItem flex="1">
                <Flex align="center" gap="sm">
                  <Icon icon={AtSign} size="md" />
                  <Typography variant="label">Mentions</Typography>
                </Flex>
                <Typography variant="caption" className="mt-1">
                  When someone @mentions you in a comment or description
                </Typography>
              </FlexItem>
              <Switch
                checked={preferences.emailMentions}
                onCheckedChange={(value) => handleToggle("emailMentions", value)}
                disabled={isSaving || !preferences.emailEnabled}
                className="ml-4"
              />
            </Flex>

            {/* Assignments */}
            <Flex
              align="start"
              justify="between"
              className="py-3 border-b border-ui-border-secondary last:border-0"
            >
              <FlexItem flex="1">
                <Flex align="center" gap="sm">
                  <Icon icon={User} size="md" />
                  <Typography variant="label">Assignments</Typography>
                </Flex>
                <Typography variant="caption" className="mt-1">
                  When you are assigned to an issue
                </Typography>
              </FlexItem>
              <Switch
                checked={preferences.emailAssignments}
                onCheckedChange={(value) => handleToggle("emailAssignments", value)}
                disabled={isSaving || !preferences.emailEnabled}
                className="ml-4"
              />
            </Flex>

            {/* Comments */}
            <Flex
              align="start"
              justify="between"
              className="py-3 border-b border-ui-border-secondary last:border-0"
            >
              <FlexItem flex="1">
                <Flex align="center" gap="sm">
                  <Icon icon={MessageSquare} size="md" />
                  <Typography variant="label">Comments</Typography>
                </Flex>
                <Typography variant="caption" className="mt-1">
                  When someone comments on your issues
                </Typography>
              </FlexItem>
              <Switch
                checked={preferences.emailComments}
                onCheckedChange={(value) => handleToggle("emailComments", value)}
                disabled={isSaving || !preferences.emailEnabled}
                className="ml-4"
              />
            </Flex>

            {/* Status Changes */}
            <Flex align="start" justify="between" className="py-3">
              <FlexItem flex="1">
                <Flex align="center" gap="sm">
                  <Icon icon={RefreshCw} size="md" />
                  <Typography variant="label">Status Changes</Typography>
                </Flex>
                <Typography variant="caption" className="mt-1">
                  When issue status changes on issues you're watching
                </Typography>
              </FlexItem>
              <Switch
                checked={preferences.emailStatusChanges}
                onCheckedChange={(value) => handleToggle("emailStatusChanges", value)}
                disabled={isSaving || !preferences.emailEnabled}
                className="ml-4"
              />
            </Flex>
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
            <label className="flex items-center gap-3 p-3 rounded-lg border border-ui-border cursor-pointer hover:bg-ui-bg-secondary transition-colors">
              <input
                type="radio"
                name="digest"
                value="none"
                checked={preferences.emailDigest === "none"}
                onChange={() => handleDigestChange("none")}
                disabled={isSaving || !preferences.emailEnabled}
                className="w-4 h-4 text-brand focus:ring-brand-ring focus:ring-2"
              />
              <div>
                <Typography variant="label">No digest</Typography>
                <Typography variant="caption">Receive emails as events happen</Typography>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-ui-border cursor-pointer hover:bg-ui-bg-secondary transition-colors">
              <input
                type="radio"
                name="digest"
                value="daily"
                checked={preferences.emailDigest === "daily"}
                onChange={() => handleDigestChange("daily")}
                disabled={isSaving || !preferences.emailEnabled}
                className="w-4 h-4 text-brand focus:ring-brand-ring focus:ring-2"
              />
              <div>
                <Typography variant="label">Daily digest</Typography>
                <Typography variant="caption">
                  One email per day with all activity (coming soon)
                </Typography>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-ui-border cursor-pointer hover:bg-ui-bg-secondary transition-colors">
              <input
                type="radio"
                name="digest"
                value="weekly"
                checked={preferences.emailDigest === "weekly"}
                onChange={() => handleDigestChange("weekly")}
                disabled={isSaving || !preferences.emailEnabled}
                className="w-4 h-4 text-brand focus:ring-brand-ring focus:ring-2"
              />
              <div>
                <Typography variant="label">Weekly digest</Typography>
                <Typography variant="caption">
                  One email per week with all activity (coming soon)
                </Typography>
              </div>
            </label>
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
