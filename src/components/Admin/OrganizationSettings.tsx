import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form";
import { Label } from "../ui/Label";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Stack } from "../ui/Stack";
import { Switch } from "../ui/Switch";
import { Typography } from "../ui/Typography";

interface OrganizationSettingsFormData {
  name: string;
  defaultMaxHoursPerWeek: number;
  defaultMaxHoursPerDay: number;
  requiresTimeApproval: boolean;
  billingEnabled: boolean;
}

export function OrganizationSettings() {
  const { organizationId, organizationName } = useOrganization();
  const organization = useQuery(api.organizations.getOrganization, { organizationId });
  const updateOrganization = useMutation(api.organizations.updateOrganization);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OrganizationSettingsFormData | null>(null);

  const settings = organization?.settings;

  // Initialize form data when organization loads
  useEffect(() => {
    if (organization && settings && !formData) {
      setFormData({
        name: organization.name,
        ...settings,
      });
    }
  }, [organization, settings, formData]);

  const handleSave = async () => {
    if (!formData) return;

    setIsSubmitting(true);
    try {
      await updateOrganization({
        organizationId,
        name: formData.name,
        settings: {
          defaultMaxHoursPerWeek: formData.defaultMaxHoursPerWeek,
          defaultMaxHoursPerDay: formData.defaultMaxHoursPerDay,
          requiresTimeApproval: formData.requiresTimeApproval,
          billingEnabled: formData.billingEnabled,
        },
      });
      showSuccess("Organization settings updated");
    } catch (error) {
      showError(error, "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (organization && settings) {
      setFormData({
        name: organization.name,
        ...settings,
      });
    }
  };

  const hasChanges =
    organization &&
    settings &&
    formData &&
    (formData.name !== organization.name ||
      formData.defaultMaxHoursPerWeek !== settings.defaultMaxHoursPerWeek ||
      formData.defaultMaxHoursPerDay !== settings.defaultMaxHoursPerDay ||
      formData.requiresTimeApproval !== settings.requiresTimeApproval ||
      formData.billingEnabled !== settings.billingEnabled);

  if (!formData) {
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
    <Flex direction="column" gap="xl">
      {/* Header */}
      <Stack gap="xs">
        <Typography variant="h2">Organization Settings</Typography>
        <Typography variant="small" color="secondary">
          Configure settings for {organizationName}
        </Typography>
      </Stack>

      {/* General Settings */}
      <Card>
        <CardHeader title="General" description="Basic information about your organization" />
        <CardBody>
          <Stack gap="lg">
            <Stack gap="xs">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Corp"
                className="max-w-md"
              />
              <Typography variant="caption" color="secondary">
                Changing your organization name will also update your URL slug
              </Typography>
            </Stack>
          </Stack>
        </CardBody>
      </Card>

      {/* Time Tracking Settings */}
      <Card>
        <CardHeader
          title="Time Tracking"
          description="Configure default time tracking settings for your organization"
        />
        <CardBody>
          <Stack gap="lg">
            {/* Default Max Hours Per Week */}
            <Stack gap="xs">
              <Label htmlFor="maxHoursPerWeek">Default Max Hours Per Week</Label>
              <Input
                id="maxHoursPerWeek"
                type="number"
                min={1}
                max={168}
                value={formData.defaultMaxHoursPerWeek}
                onChange={(e) =>
                  setFormData({ ...formData, defaultMaxHoursPerWeek: Number(e.target.value) })
                }
                className="max-w-30"
              />
              <Typography variant="caption" color="secondary">
                Maximum hours a team member can log per week
              </Typography>
            </Stack>

            {/* Default Max Hours Per Day */}
            <Stack gap="xs">
              <Label htmlFor="maxHoursPerDay">Default Max Hours Per Day</Label>
              <Input
                id="maxHoursPerDay"
                type="number"
                min={1}
                max={24}
                value={formData.defaultMaxHoursPerDay}
                onChange={(e) =>
                  setFormData({ ...formData, defaultMaxHoursPerDay: Number(e.target.value) })
                }
                className="max-w-30"
              />
              <Typography variant="caption" color="secondary">
                Maximum hours a team member can log per day
              </Typography>
            </Stack>

            {/* Requires Time Approval */}
            <Flex align="center" justify="between">
              <Stack gap="none">
                <Typography variant="label">Require Time Approval</Typography>
                <Typography variant="small" color="secondary">
                  Time entries must be approved by a manager before being finalized
                </Typography>
              </Stack>
              <Switch
                checked={formData.requiresTimeApproval}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresTimeApproval: checked })
                }
                aria-label="Require time approval"
                data-testid={TEST_IDS.SETTINGS.TIME_APPROVAL_SWITCH}
              />
            </Flex>
          </Stack>
        </CardBody>
      </Card>

      {/* Billing Settings */}
      <Card>
        <CardHeader
          title="Billing & Invoicing"
          description="Configure billing features for your organization"
        />
        <CardBody>
          <Stack gap="lg">
            {/* Billing Enabled */}
            <Flex align="center" justify="between">
              <Stack gap="none">
                <Typography variant="label">Enable Billing Features</Typography>
                <Typography variant="small" color="secondary">
                  Allow team members to mark time entries as billable. When disabled, the billable
                  checkbox will be hidden from time entry forms.
                </Typography>
              </Stack>
              <Switch
                checked={formData.billingEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, billingEnabled: checked })}
                aria-label="Enable billing features"
              />
            </Flex>
          </Stack>
        </CardBody>
      </Card>

      {/* Save Button */}
      <Flex gap="md">
        <Button
          onClick={handleSave}
          isLoading={isSubmitting}
          disabled={!hasChanges}
          data-testid={TEST_IDS.SETTINGS.SAVE_BUTTON}
        >
          Save Changes
        </Button>
        {hasChanges && (
          <Button variant="secondary" onClick={handleReset} disabled={isSubmitting}>
            Reset
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
