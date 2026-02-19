/**
 * IP Restrictions Settings Component
 *
 * Allows organization admins to manage IP allowlist for secure access.
 * Nixelo advantage - Cal.com and Plane don't have org-level IP restrictions!
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Globe, Plus, Shield, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Input, Textarea } from "../ui/form";
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

  const status = useQuery(api.ipRestrictions.getIpRestrictionsStatus, { organizationId });
  const allowlist = useQuery(api.ipRestrictions.listIpAllowlist, { organizationId });

  const setEnabled = useMutation(api.ipRestrictions.setIpRestrictionsEnabled);
  const addIp = useMutation(api.ipRestrictions.addIpToAllowlist);
  const removeIp = useMutation(api.ipRestrictions.removeIpFromAllowlist);

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
      <Card>
        <CardBody>
          <Flex justify="center" align="center" className="min-h-32">
            <LoadingSpinner />
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Flex align="center" gap="sm">
            <Shield className="h-5 w-5 text-ui-text-secondary" />
            IP Restrictions
            <Badge variant="info" size="sm">
              Enterprise
            </Badge>
          </Flex>
        }
        description="Restrict organization access to specific IP addresses or ranges. Users connecting from non-allowed IPs will be denied access."
      />
      <CardBody>
        <Flex direction="column" gap="xl">
          {/* Enable/Disable Toggle */}
          <Flex align="center" justify="between" className="border-b border-ui-border pb-4">
            <Flex align="center" gap="md">
              {status.enabled ? (
                <ShieldCheck className="h-5 w-5 text-status-success" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-ui-text-tertiary" />
              )}
              <Stack gap="none">
                <Typography variant="label">
                  {status.enabled ? "IP Restrictions Active" : "IP Restrictions Disabled"}
                </Typography>
                <Typography variant="small" color="secondary">
                  {status.enabled
                    ? `${status.allowlistCount} IP${status.allowlistCount !== 1 ? "s" : ""} in allowlist`
                    : "Anyone can access from any IP address"}
                </Typography>
              </Stack>
            </Flex>
            <Switch
              checked={status.enabled}
              onCheckedChange={handleToggleEnabled}
              disabled={isTogglingEnabled}
              aria-label="Enable IP restrictions"
            />
          </Flex>

          {/* Allowlist Section */}
          <Stack gap="md">
            <Flex align="center" justify="between">
              <Typography variant="h3">IP Allowlist</Typography>
              <Button variant="secondary" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add IP
              </Button>
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
                    <Button
                      onClick={handleAddIp}
                      isLoading={isSubmitting}
                      disabled={!newIpRange.trim()}
                    >
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
                      Examples: 192.168.1.100 (single IP), 10.0.0.0/8 (CIDR range)
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
            </Flex>

            {/* Allowlist Entries */}
            {allowlist.length === 0 ? (
              <EmptyState
                icon={Globe}
                title="No IPs in allowlist"
                description="Add IP addresses or CIDR ranges to restrict access. When enabled, only users from these IPs can access the organization."
              />
            ) : (
              <Stack gap="sm">
                {allowlist.map((entry: IpAllowlistEntry) => (
                  <Card key={entry._id} padding="sm" className="bg-ui-bg-soft">
                    <Flex align="center" justify="between">
                      <Stack gap="xs">
                        <Flex align="center" gap="sm">
                          <Typography variant="mono">{entry.ipRange}</Typography>
                          {entry.description && (
                            <Typography variant="small" color="secondary">
                              — {entry.description}
                            </Typography>
                          )}
                        </Flex>
                        <Typography variant="caption" color="secondary">
                          Added by {entry.createdByName} on{" "}
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      <Tooltip content="Remove from allowlist">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIp(entry._id)}
                          className="text-status-error hover:bg-status-error/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>

          {/* Help Text */}
          <Card padding="md" className="bg-ui-bg-soft">
            <Stack gap="sm">
              <Typography variant="label">How IP Restrictions Work</Typography>
              <Stack gap="xs">
                <Typography variant="small" color="secondary">
                  • When enabled, only users from allowed IPs can access your organization
                </Typography>
                <Typography variant="small" color="secondary">
                  • Use CIDR notation for ranges (e.g., 10.0.0.0/8 allows 10.0.0.0 - 10.255.255.255)
                </Typography>
                <Typography variant="small" color="secondary">
                  • Single IPs work too (e.g., 203.0.113.50)
                </Typography>
                <Typography variant="small" color="secondary">
                  • Make sure to add your current IP before enabling restrictions
                </Typography>
                <Typography variant="small" color="secondary">
                  • Admins are also subject to IP restrictions
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Flex>
      </CardBody>
    </Card>
  );
}
