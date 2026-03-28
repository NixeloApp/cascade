/**
 * User Rates Management
 *
 * Admin panel for managing user hourly rates for billing calculations.
 * Supports internal cost vs billable rates with project-specific overrides.
 * Used for time tracking cost calculations and burn rate analysis.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatCurrency } from "@/lib/formatting";
import { DollarSign } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Input, Textarea } from "../ui/form";
import { Grid } from "../ui/Grid";
import { Label } from "../ui/Label";
import { RadioGroup, RadioGroupItem } from "../ui/RadioGroup";
import { Select } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

// Enriched user rate from listUserRates query
type EnrichedUserRate = Doc<"userRates"> & {
  user: { _id: Id<"users">; name: string; email?: string } | null;
};

/** Admin panel for managing user hourly rates for billing calculations. */
export function UserRatesManagement() {
  const currentUser = useAuthenticatedQuery(api.auth.loggedInUser, {});
  const projects = useAuthenticatedQuery(api.projects.getCurrentUserProjects, {});
  const userRates = useAuthenticatedQuery(api.timeTracking.listUserRates, {});

  const { mutate: setUserRate } = useAuthenticatedMutation(api.timeTracking.setUserRate);

  const [showAddRate, setShowAddRate] = useState(false);
  const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | "default">("default");
  const [hourlyRate, setHourlyRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [rateType, setRateType] = useState<"internal" | "billable">("internal");
  const [notes, setNotes] = useState("");
  const canEditOwnRate = currentUser !== undefined;

  const handleCloseModal = () => {
    setShowAddRate(false);
    setEditingUserId(null);
    setHourlyRate("");
    setNotes("");
  };

  const handleSaveRate = async () => {
    if (!currentUser) return;

    const userId = editingUserId || currentUser._id;
    const rate = parseFloat(hourlyRate);

    if (Number.isNaN(rate) || rate <= 0) {
      showError("Please enter a valid hourly rate");
      return;
    }

    try {
      await setUserRate({
        userId,
        projectId: selectedProject === "default" ? undefined : selectedProject,
        hourlyRate: rate,
        currency,
        rateType,
        notes: notes || undefined,
      });

      showSuccess("Hourly rate saved");
      handleCloseModal();
    } catch (error) {
      showError(error, "Failed to save rate");
    }
  };

  return (
    <Flex direction="column" gap="xl" data-testid={TEST_IDS.TIME_TRACKING.RATES_PANEL}>
      {/* Header */}
      <Flex justify="between" align="center">
        <Stack gap="xs">
          <Typography variant="h2">Hourly Rates</Typography>
          <Typography variant="small" color="secondary">
            Manage hourly rates for cost tracking and burn rate calculations
          </Typography>
        </Stack>
        <Button onClick={() => setShowAddRate(true)} variant="primary" disabled={!canEditOwnRate}>
          Set My Rate
        </Button>
      </Flex>

      {/* Current Rates List */}
      {userRates && userRates.length > 0 ? (
        <Flex direction="column" gap="md">
          {(userRates as EnrichedUserRate[]).map((rate) => (
            <Card key={rate._id} hoverable>
              <Flex justify="between" align="start">
                <FlexItem flex="1">
                  <Stack gap="sm">
                    <Flex align="center" gap="md">
                      <Typography variant="label">{rate.user?.name || "Unknown User"}</Typography>
                      <Badge
                        size="sm"
                        variant={rate.rateType === "billable" ? "success" : "neutral"}
                      >
                        {rate.rateType}
                      </Badge>
                    </Flex>
                    <Typography variant="caption" color="secondary">
                      {rate.projectId
                        ? "Project-specific rate"
                        : "Default rate (applies to all projects)"}
                    </Typography>
                    {rate.notes && (
                      <Typography variant="caption" color="tertiary">
                        {rate.notes}
                      </Typography>
                    )}
                  </Stack>
                </FlexItem>
                <Stack gap="xs" align="end">
                  <Typography variant="h3">
                    {formatCurrency(rate.hourlyRate, rate.currency)}
                  </Typography>
                  <Typography variant="caption" color="tertiary">
                    per hour
                  </Typography>
                </Stack>
              </Flex>
            </Card>
          ))}
        </Flex>
      ) : (
        <EmptyState
          icon={DollarSign}
          title="No hourly rates set"
          description="Set your hourly rate to enable cost tracking and burn rate calculations."
          action={
            canEditOwnRate
              ? { label: "Set My Rate", onClick: () => setShowAddRate(true) }
              : undefined
          }
        />
      )}

      {/* Add/Edit Rate Modal */}
      <Dialog
        open={showAddRate}
        onOpenChange={(open) => !open && handleCloseModal()}
        title="Set Hourly Rate"
        size="sm"
        footer={
          <>
            <Button onClick={handleCloseModal} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleSaveRate} variant="primary">
              Save Rate
            </Button>
          </>
        }
      >
        <Stack gap="md">
          {/* Project Selection */}
          <Stack gap="xs">
            <Label htmlFor="rate-apply-to">Apply To</Label>
            <Select
              className="w-full"
              id="rate-apply-to"
              onChange={(value) => setSelectedProject(value as "default" | Id<"projects">)}
              options={[
                { value: "default", label: "All Projects (Default)" },
                ...((projects?.page?.map((project) => ({
                  value: project._id,
                  label: `${project.name} (Override)`,
                })) ?? []) as Array<{ value: Id<"projects">; label: string }>),
              ]}
              placeholder="Select project..."
              value={selectedProject}
            />
            <Typography variant="caption" color="tertiary">
              Project-specific rates override the default rate
            </Typography>
          </Stack>

          {/* Rate Type */}
          <Stack gap="xs">
            <Label>Rate Type</Label>
            <RadioGroup
              value={rateType}
              onValueChange={(value) => setRateType(value as typeof rateType)}
            >
              <Grid cols={2} gap="md">
                <Card
                  recipe={rateType === "internal" ? "optionTileSelected" : "optionTile"}
                  padding="md"
                  onClick={() => setRateType("internal")}
                >
                  <Flex align="start" gap="sm">
                    <RadioGroupItem value="internal" aria-label="Internal Cost" />
                    <FlexItem flex="1">
                      <Typography variant="label">Internal Cost</Typography>
                      <Typography variant="caption" color="tertiary">
                        What you pay
                      </Typography>
                    </FlexItem>
                  </Flex>
                </Card>
                <Card
                  recipe={rateType === "billable" ? "optionTileSelected" : "optionTile"}
                  padding="md"
                  onClick={() => setRateType("billable")}
                >
                  <Flex align="start" gap="sm">
                    <RadioGroupItem value="billable" aria-label="Billable Rate" />
                    <FlexItem flex="1">
                      <Typography variant="label">Billable Rate</Typography>
                      <Typography variant="caption" color="tertiary">
                        Charge clients
                      </Typography>
                    </FlexItem>
                  </Flex>
                </Card>
              </Grid>
            </RadioGroup>
          </Stack>

          {/* Hourly Rate */}
          <Flex gap="sm" align="end">
            <FlexItem flex="1">
              <Input
                id="rate-hourly-rate"
                type="number"
                label="Hourly Rate"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </FlexItem>
            <Stack gap="xs">
              <Label htmlFor="rate-currency">Currency</Label>
              <Select
                id="rate-currency"
                onChange={setCurrency}
                options={[
                  { value: "USD", label: "USD" },
                  { value: "EUR", label: "EUR" },
                  { value: "GBP", label: "GBP" },
                  { value: "CAD", label: "CAD" },
                ]}
                placeholder="Currency"
                value={currency}
                width="xs"
              />
            </Stack>
          </Flex>

          {/* Notes */}
          <Textarea
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Senior developer rate, Contract rate for Q1 2024..."
            rows={2}
          />
        </Stack>
      </Dialog>
    </Flex>
  );
}
