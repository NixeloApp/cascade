import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
import { Flex, FlexItem } from "../ui/Flex";
import { Textarea } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

// Enriched user rate from listUserRates query
type EnrichedUserRate = Doc<"userRates"> & {
  user: { _id: Id<"users">; name: string; email?: string } | null;
};

export function UserRatesManagement() {
  const currentUser = useQuery(api.auth.loggedInUser);
  const projects = useQuery(api.projects.getCurrentUserProjects, {});
  const userRates = useQuery(api.timeTracking.listUserRates, {});

  const setUserRate = useMutation(api.timeTracking.setUserRate);

  const [showAddRate, setShowAddRate] = useState(false);
  const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | "default">("default");
  const [hourlyRate, setHourlyRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [rateType, setRateType] = useState<"internal" | "billable">("internal");
  const [notes, setNotes] = useState("");

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

  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr || "USD",
    }).format(amount);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Flex direction="column" gap="xl">
      {/* Header */}
      <Flex justify="between" align="center">
        <Stack gap="xs">
          <Typography variant="h2">Hourly Rates</Typography>
          <Typography variant="small" color="secondary">
            Manage hourly rates for cost tracking and burn rate calculations
          </Typography>
        </Stack>
        <Button onClick={() => setShowAddRate(true)} variant="primary">
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
                  <Flex align="center" gap="md">
                    <Typography variant="label">{rate.user?.name || "Unknown User"}</Typography>
                    <Badge size="sm" variant={rate.rateType === "billable" ? "success" : "neutral"}>
                      {rate.rateType}
                    </Badge>
                  </Flex>
                  <Typography variant="caption" color="secondary" className="mt-2">
                    {rate.projectId ? (
                      <span>Project-specific rate</span>
                    ) : (
                      <span>Default rate (applies to all projects)</span>
                    )}
                  </Typography>
                  {rate.notes && (
                    <Typography variant="caption" color="tertiary" className="mt-2">
                      {rate.notes}
                    </Typography>
                  )}
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
        <Card variant="soft" className="text-center border-2 border-dashed border-ui-border">
          <svg
            className="mx-auto h-12 w-12 text-ui-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            role="img"
            aria-label="Dollar sign icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <Typography variant="label" className="mt-2">
            No hourly rates set
          </Typography>
          <Typography variant="small" color="tertiary" className="mt-1">
            Set your hourly rate to enable cost tracking and burn rate calculations
          </Typography>
          <Button onClick={() => setShowAddRate(true)} variant="primary" className="mt-4">
            Set My Rate
          </Button>
        </Card>
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
          <div>
            <label htmlFor="rate-apply-to" className="block text-sm font-medium text-ui-text mb-1">
              Apply To
            </label>
            <Select
              value={selectedProject}
              onValueChange={(value) =>
                setSelectedProject(value === "default" ? "default" : (value as Id<"projects">))
              }
            >
              <SelectTrigger id="rate-apply-to" className="w-full">
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">All Projects (Default)</SelectItem>
                {projects?.page?.map((project: Doc<"projects">) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name} (Override)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Typography variant="caption" color="tertiary" className="mt-1">
              Project-specific rates override the default rate
            </Typography>
          </div>

          {/* Rate Type */}
          <div>
            <Typography variant="label" className="block mb-1">
              Rate Type
            </Typography>
            <Flex gap="md">
              <label
                className={cn(
                  "cursor-pointer flex-1 p-3 border-2 rounded-lg transition-colors",
                  rateType === "internal"
                    ? "border-brand-indigo-border bg-brand-indigo-track"
                    : "border-ui-border",
                )}
              >
                <Flex align="center" gap="sm">
                  <input
                    type="radio"
                    name="rateType"
                    checked={rateType === "internal"}
                    onChange={() => setRateType("internal")}
                    className="w-4 h-4 text-brand"
                  />
                  <FlexItem flex="1">
                    <Typography variant="label">Internal Cost</Typography>
                    <Typography variant="caption" color="tertiary">
                      What you pay
                    </Typography>
                  </FlexItem>
                </Flex>
              </label>
              <label
                className={cn(
                  "cursor-pointer flex-1 p-3 border-2 rounded-lg transition-colors",
                  rateType === "billable"
                    ? "border-brand-indigo-border bg-brand-indigo-track"
                    : "border-ui-border",
                )}
              >
                <Flex align="center" gap="sm">
                  <input
                    type="radio"
                    name="rateType"
                    checked={rateType === "billable"}
                    onChange={() => setRateType("billable")}
                    className="w-4 h-4 text-brand"
                  />
                  <FlexItem flex="1">
                    <Typography variant="label">Billable Rate</Typography>
                    <Typography variant="caption" color="tertiary">
                      Charge clients
                    </Typography>
                  </FlexItem>
                </Flex>
              </label>
            </Flex>
          </div>

          {/* Hourly Rate */}
          <div>
            <label
              htmlFor="rate-hourly-rate"
              className="block text-sm font-medium text-ui-text mb-1"
            >
              Hourly Rate
            </label>
            <Flex gap="sm">
              <FlexItem flex="1" className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-text-tertiary">
                  $
                </span>
                <input
                  id="rate-hourly-rate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-3 py-2 border border-ui-border rounded-lg focus-visible:ring-2 focus-visible:ring-brand-ring"
                />
              </FlexItem>
              <Select value={currency} onValueChange={(value) => setCurrency(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </Flex>
          </div>

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
