/**
 * IP Restrictions Settings Component
 *
 * Allows organization admins to manage IP allowlist for secure access.
 * Nixelo advantage - Cal.com and Plane don't have org-level IP restrictions!
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Globe, Plus, Shield, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";
import {
  SettingsSection,
  SettingsSectionInset,
  SettingsSectionRow,
} from "../Settings/SettingsSection";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Input, Textarea } from "../ui/form";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Label } from "../ui/Label";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Stack } from "../ui/Stack";
import { Switch } from "../ui/Switch";
import { Tooltip } from "../ui/Tooltip";
import { Typography } from "../ui/Typography";

interface IpAllowlistEntry {
  _id: Id<"organizationIpAllowlist">;
  ipRange: string;
  description?: string;
  createdBy: Id<"users">;
  createdByName: string;
  createdAt: number;
}

export function IpRestrictionsSettings() {
  const { organizationId } = useOrganization();

  const status = useAuthenticatedQuery(api.ipRestrictions.getIpRestrictionsStatus, {
    organizationId,
  });
  const allowlist = useAuthenticatedQuery(api.ipRestrictions.listIpAllowlist, { organizationId });

  const { mutate: setEnabled } = useAuthenticatedMutation(
    api.ipRestrictions.setIpRestrictionsEnabled,
  );
  const { mutate: addIp } = useAuthenticatedMutation(api.ipRestrictions.addIpToAllowlist);
  const { mutate: removeIp } = useAuthenticatedMutation(api.ipRestrictions.removeIpFromAllowlist);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newIpRange, setNewIpRange] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);

  const handleToggleEnabled = async (enabled: boolean) => {
    setIsTogglingEnabled(true);
    try {
      await setEnabled({ organizationId, enabled });
      showSuccess(enabled ? "IP restrictions enabled" : "IP restrictions disabled");
    } catch (error) {
      showError(error, "Failed to update IP restrictions");
    } finally {
      setIsTogglingEnabled(false);
    }
  };

  const handleAddIp = async () => {
    if (!newIpRange.trim()) return;

    setIsSubmitting(true);
    try {
      await addIp({
        organizationId,
        ipRange: newIpRange.trim(),
        description: newDescription.trim() || undefined,
      });
      showSuccess("IP added to allowlist");
      setNewIpRange("");
      setNewDescription("");
      setIsAddDialogOpen(false);
    } catch (error) {
      showError(error, "Failed to add IP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIp = async (id: Id<"organizationIpAllowlist">) => {
    try {
      await removeIp({ id });
      showSuccess("IP removed from allowlist");
    } catch (error) {
      showError(error, "Failed to remove IP");
    }
  };

  if (!status || !allowlist) {
    return (
      <SettingsSection
        title="IP Restrictions"
        description="Restrict organization access to specific IP addresses or ranges."
        icon={Shield}
        titleAdornment={
          <Badge variant="info" size="sm">
            Enterprise
          </Badge>
        }
      >
        <Flex justify="center" align="center" className="min-h-32">
          <LoadingSpinner />
        </Flex>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="IP Restrictions"
      description="Restrict organization access to specific IP addresses or ranges. Users connecting from non-allowed IPs will be denied access."
      icon={Shield}
      titleAdornment={
        <Badge variant="info" size="sm">
          Enterprise
        </Badge>
      }
      action={
        <Button variant="secondary" size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Icon icon={Plus} size="sm" className="mr-1" />
          Add IP
        </Button>
      }
    >
      <Stack gap="md">
        <SettingsSectionInset title="Access Policy">
          <SettingsSectionRow
            title={status.enabled ? "IP Restrictions Active" : "IP Restrictions Disabled"}
            description={
              status.enabled
                ? `${status.allowlistCount} IP${status.allowlistCount !== 1 ? "s" : ""} in allowlist`
                : "Anyone can access from any IP address."
            }
            icon={status.enabled ? ShieldCheck : ShieldAlert}
            iconTone={status.enabled ? "success" : "tertiary"}
            action={
              <Switch
                checked={status.enabled}
                onCheckedChange={handleToggleEnabled}
                disabled={isTogglingEnabled}
                aria-label="Enable IP restrictions"
              />
            }
          />
        </SettingsSectionInset>

        <SettingsSectionInset
          title="IP Allowlist"
          description="Add IP addresses or CIDR ranges to restrict access to approved networks."
        >
          {allowlist.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No IPs in allowlist"
              description="Add IP addresses or CIDR ranges to restrict access. When enabled, only users from these IPs can access the organization."
            />
          ) : (
            <Stack gap="sm">
              {allowlist.map((entry: IpAllowlistEntry) => (
                <SettingsSectionInset key={entry._id} padding="sm">
                  <Flex align="center" justify="between" gap="md">
                    <Stack gap="xs">
                      <Flex align="center" gap="sm" wrap>
                        <Typography variant="mono">{entry.ipRange}</Typography>
                        {entry.description ? (
                          <Typography variant="small" color="secondary">
                            {entry.description}
                          </Typography>
                        ) : null}
                      </Flex>
                      <Typography variant="caption" color="secondary">
                        Added by {entry.createdByName} on{" "}
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                    <Tooltip content="Remove from allowlist">
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveIp(entry._id)}
                        aria-label="Remove from allowlist"
                      >
                        <Icon icon={Trash2} size="sm" />
                      </IconButton>
                    </Tooltip>
                  </Flex>
                </SettingsSectionInset>
              ))}
            </Stack>
          )}
        </SettingsSectionInset>

        <SettingsSectionInset title="How IP Restrictions Work">
          <Stack gap="xs">
            <Typography variant="small" color="secondary">
              When enabled, only users from allowed IPs can access your organization.
            </Typography>
            <Typography variant="small" color="secondary">
              Use CIDR notation for ranges such as `10.0.0.0/8` when multiple users share the same
              office or VPN boundary.
            </Typography>
            <Typography variant="small" color="secondary">
              Single IPs work too, for example `203.0.113.50`.
            </Typography>
            <Typography variant="small" color="secondary">
              Make sure to add your current office or VPN IP before enabling restrictions to avoid
              locking out administrators.
            </Typography>
            <Typography variant="small" color="secondary">
              Admins are also subject to IP restrictions.
            </Typography>
          </Stack>
        </SettingsSectionInset>

        <Dialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          title="Add IP to Allowlist"
          description="Add an IP address or CIDR range to allow access from."
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddIp} isLoading={isSubmitting} disabled={!newIpRange.trim()}>
                Add to Allowlist
              </Button>
            </>
          }
        >
          <Stack gap="md">
            <Stack gap="xs">
              <Label htmlFor="ipRange">IP Address or CIDR Range</Label>
              <Input
                id="ipRange"
                value={newIpRange}
                onChange={(e) => setNewIpRange(e.target.value)}
                placeholder="192.168.1.0/24 or 203.0.113.50"
              />
              <Typography variant="caption" color="secondary">
                Examples: 192.168.1.100 (single IP), 10.0.0.0/8 (CIDR range).
              </Typography>
            </Stack>
            <Stack gap="xs">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Office network, VPN exit node, etc."
                rows={2}
              />
            </Stack>
          </Stack>
        </Dialog>
      </Stack>
    </SettingsSection>
  );
}
