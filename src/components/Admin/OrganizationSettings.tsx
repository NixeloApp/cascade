/**
 * Organization Settings
 *
 * Admin settings form for organization-level configuration.
 * Manages name, time tracking limits, approval requirements, and billing.
 * Requires admin role to access and modify settings.
 */

import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Building2 } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import {
  SettingsSection,
  SettingsSectionInset,
  SettingsSectionRow,
} from "../Settings/SettingsSection";
import { Button } from "../ui/Button";
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

/**
 * Admin settings form for organization configuration (name, hours limits, billing).
 */
export function OrganizationSettings() {
  const { organizationId, organizationName } = useOrganization();
  const organization = useAuthenticatedQuery(api.organizations.getOrganization, {
    id: organizationId,
  });
  const { mutate: updateOrganization } = useAuthenticatedMutation(
    api.organizations.updateOrganization,
  );

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
      <SettingsSection
        title="Organization Settings"
        description="Configure organization identity, default time policy, and billing behavior."
        icon={Building2}
      >
        <Flex justify="center" align="center" className="min-h-32">
          <LoadingSpinner />
        </Flex>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Organization Settings"
      description={`Configure settings for ${organizationName}.`}
      icon={Building2}
      action={
        <Flex gap="sm" wrap>
          {hasChanges ? (
            <Button variant="secondary" onClick={handleReset} disabled={isSubmitting}>
              Reset
            </Button>
          ) : null}
          <Button
            onClick={handleSave}
            isLoading={isSubmitting}
            disabled={!hasChanges}
            data-testid={TEST_IDS.SETTINGS.SAVE_BUTTON}
          >
            Save Changes
          </Button>
        </Flex>
      }
    >
      <Stack gap="md">
        <SettingsSectionInset
          title="General"
          description="Basic information about your organization."
        >
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
              Changing your organization name will also update your URL slug.
            </Typography>
          </Stack>
        </SettingsSectionInset>

        <SettingsSectionInset
          title="Time Tracking"
          description="Default time-tracking policy for new members and projects."
        >
          <Stack gap="lg">
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
                Maximum hours a team member can log per week.
              </Typography>
            </Stack>

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
                Maximum hours a team member can log per day.
              </Typography>
            </Stack>

            <SettingsSectionRow
              title="Require Time Approval"
              description="Time entries must be approved by a manager before being finalized."
              action={
                <Switch
                  checked={formData.requiresTimeApproval}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresTimeApproval: checked })
                  }
                  aria-label="Require time approval"
                  data-testid={TEST_IDS.SETTINGS.TIME_APPROVAL_SWITCH}
                />
              }
            />
          </Stack>
        </SettingsSectionInset>

        <SettingsSectionInset
          title="Billing & Invoicing"
          description="Organization-wide billing defaults."
        >
          <SettingsSectionRow
            title="Enable Billing Features"
            description="Allow team members to mark time entries as billable. When disabled, the billable checkbox will be hidden from time entry forms."
            action={
              <Switch
                checked={formData.billingEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, billingEnabled: checked })}
                aria-label="Enable billing features"
              />
            }
          />
        </SettingsSectionInset>
      </Stack>
    </SettingsSection>
  );
}
