import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { formatDate } from "@/lib/dates";
import { Trophy } from "@/lib/icons";
import { getStatusColor } from "@/lib/issue-utils";
import {
  calculateEndDate,
  DEFAULT_SPRINT_PRESET,
  SPRINT_DURATION_PRESETS,
} from "@/lib/sprint-presets";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { Input } from "./ui/form/Input";
import { Textarea } from "./ui/form/Textarea";
import { Grid } from "./ui/Grid";
import { SkeletonProjectCard } from "./ui/Skeleton";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

interface SprintManagerProps {
  projectId: Id<"projects">;
  canEdit?: boolean;
}

interface SprintCardProps {
  sprint: Doc<"sprints"> & { issueCount: number; completedCount: number };
  canEdit: boolean;
  onStartSprint: (sprintId: Id<"sprints">) => void;
  onCompleteSprint: (sprintId: Id<"sprints">) => Promise<void>;
}

function SprintCard({ sprint, canEdit, onStartSprint, onCompleteSprint }: SprintCardProps) {
  // Calculate progress percentage based on completed issues
  const getProgressPercentage = () => {
    if (sprint.issueCount === 0) return 0;
    return (sprint.completedCount / sprint.issueCount) * 100;
  };

  const progress = sprint.status === "active" ? getProgressPercentage() : 0;

  return (
    <Card padding="md" className="animate-fade-in">
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="lg"
        className="sm:flex-row sm:items-center"
      >
        <Flex direction="column" className="flex-1 w-full sm:w-auto">
          <Flex wrap align="center" gap="sm" className="mb-2">
            <Typography variant="h5">{sprint.name}</Typography>
            <Badge size="md" className={getStatusColor(sprint.status)}>
              {sprint.status}
            </Badge>
            <Badge variant="neutral" size="sm">
              {sprint.issueCount} issues
            </Badge>
          </Flex>
          {sprint.goal && (
            <Typography variant="small" color="secondary" className="mb-2">
              {sprint.goal}
            </Typography>
          )}

          {/* Progress bar for active sprints - issue-based */}
          {sprint.status === "active" && (
            <Stack gap="xs" className="mt-3 mb-2">
              <Flex justify="between">
                <Typography variant="caption">
                  {sprint.completedCount} of {sprint.issueCount} completed
                </Typography>
                <Typography variant="caption" className="text-brand">
                  {Math.round(progress)}%
                </Typography>
              </Flex>
              <div className="h-1.5 bg-ui-bg-tertiary rounded-pill overflow-hidden">
                <div
                  className="size-full bg-brand rounded-pill transition-default"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Stack>
          )}

          {sprint.startDate && sprint.endDate && (
            <Typography variant="caption">
              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
            </Typography>
          )}
        </Flex>
        {canEdit && (
          <Flex direction="column" gap="sm" className="sm:flex-row w-full sm:w-auto">
            {sprint.status === "future" && (
              <Button onClick={() => void onStartSprint(sprint._id)} variant="success" size="sm">
                Start Sprint
              </Button>
            )}
            {sprint.status === "active" && (
              <Button
                onClick={() => void onCompleteSprint(sprint._id)}
                variant="secondary"
                size="sm"
              >
                Complete Sprint
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

export function SprintManager({ projectId, canEdit = true }: SprintManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(DEFAULT_SPRINT_PRESET);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Sprint start modal state
  const [startingSprintId, setStartingSprintId] = useState<Id<"sprints"> | null>(null);
  const [startPreset, setStartPreset] = useState(DEFAULT_SPRINT_PRESET);
  const [startCustomStart, setStartCustomStart] = useState("");
  const [startCustomEnd, setStartCustomEnd] = useState("");

  const sprints = useQuery(api.sprints.listByProject, { projectId });
  const createSprint = useMutation(api.sprints.create);
  const startSprint = useMutation(api.sprints.startSprint);
  const completeSprint = useMutation(api.sprints.completeSprint);

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    // Calculate dates based on preset selection
    let startDate: number | undefined;
    let endDate: number | undefined;

    if (selectedPreset === "custom") {
      if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate).getTime();
        endDate = new Date(customEndDate).getTime();
      }
    } else {
      // For preset durations, we'll set dates when starting the sprint
      // but store the intended duration preference
    }

    try {
      await createSprint({
        projectId,
        name: newSprintName.trim(),
        goal: newSprintGoal.trim() || undefined,
        startDate,
        endDate,
      });

      setNewSprintName("");
      setNewSprintGoal("");
      setSelectedPreset(DEFAULT_SPRINT_PRESET);
      setCustomStartDate("");
      setCustomEndDate("");
      setShowCreateForm(false);
      showSuccess("Sprint created successfully");
    } catch (error) {
      showError(error, "Failed to create sprint");
    }
  };

  const openStartSprintModal = (sprintId: Id<"sprints">) => {
    setStartingSprintId(sprintId);
    setStartPreset(DEFAULT_SPRINT_PRESET);
    setStartCustomStart("");
    setStartCustomEnd("");
  };

  const closeStartSprintModal = () => {
    setStartingSprintId(null);
    setStartPreset(DEFAULT_SPRINT_PRESET);
    setStartCustomStart("");
    setStartCustomEnd("");
  };

  const handleStartSprint = async () => {
    if (!startingSprintId) return;

    let startDate: number;
    let endDate: number;

    if (startPreset === "custom") {
      if (!startCustomStart || !startCustomEnd) {
        showError(new Error("Please select start and end dates"), "Invalid dates");
        return;
      }
      startDate = new Date(startCustomStart).getTime();
      endDate = new Date(startCustomEnd).getTime();
    } else {
      startDate = Date.now();
      endDate = calculateEndDate(startDate, startPreset).getTime();
    }

    try {
      await startSprint({
        sprintId: startingSprintId,
        startDate,
        endDate,
      });
      showSuccess("Sprint started successfully");
      closeStartSprintModal();
    } catch (error) {
      showError(error, "Failed to start sprint");
    }
  };

  const handleCompleteSprint = async (sprintId: Id<"sprints">) => {
    try {
      await completeSprint({ sprintId });
      showSuccess("Sprint completed successfully");
    } catch (error) {
      showError(error, "Failed to complete sprint");
    }
  };

  if (!sprints) {
    return (
      <Stack gap="lg">
        <Flex align="center" justify="between">
          <Typography variant="h4">Sprint Management</Typography>
        </Flex>
        <Stack gap="md">
          <SkeletonProjectCard />
          <SkeletonProjectCard />
          <SkeletonProjectCard />
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="md"
        className="sm:flex-row sm:items-center"
      >
        <Typography variant="h4">Sprint Management</Typography>
        {canEdit && (
          <Button onClick={() => setShowCreateForm(true)} variant="primary">
            <span className="hidden sm:inline">Create Sprint</span>
            <span className="sm:hidden">+ Sprint</span>
          </Button>
        )}
      </Flex>

      {/* Create Sprint Form */}
      {showCreateForm && (
        <Card padding="md" className="animate-scale-in">
          <Stack as="form" gap="md" onSubmit={(e: React.FormEvent) => void handleCreateSprint(e)}>
            <Input
              label="Sprint Name"
              type="text"
              value={newSprintName}
              onChange={(e) => setNewSprintName(e.target.value)}
              placeholder="e.g., Sprint 1"
            />
            <Textarea
              label="Sprint Goal (Optional)"
              value={newSprintGoal}
              onChange={(e) => setNewSprintGoal(e.target.value)}
              placeholder="What do you want to achieve in this sprint?"
              rows={2}
            />

            {/* Duration Presets */}
            <Stack gap="sm">
              <Typography variant="label">Sprint Duration</Typography>
              <Grid cols={2} colsSm={5} gap="sm">
                {SPRINT_DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-default focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring",
                      selectedPreset === preset.id
                        ? "border-brand bg-ui-bg-secondary"
                        : "border-ui-border-secondary bg-ui-bg hover:border-ui-border-hover",
                    )}
                  >
                    <Typography variant="label" className="block">
                      {preset.label}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      {preset.description}
                    </Typography>
                  </button>
                ))}
              </Grid>
            </Stack>

            {/* Custom date inputs (shown when "Custom" is selected) */}
            {selectedPreset === "custom" && (
              <Flex direction="column" gap="md" className="sm:flex-row">
                <FlexItem flex="1">
                  <Input
                    label="Start Date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    required={selectedPreset === "custom"}
                  />
                </FlexItem>
                <FlexItem flex="1">
                  <Input
                    label="End Date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    required={selectedPreset === "custom"}
                  />
                </FlexItem>
              </Flex>
            )}

            <Flex direction="column" gap="sm" className="sm:flex-row">
              <Button type="submit" variant="primary">
                Create Sprint
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSprintName("");
                  setNewSprintGoal("");
                  setSelectedPreset(DEFAULT_SPRINT_PRESET);
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
              >
                Cancel
              </Button>
            </Flex>
          </Stack>
        </Card>
      )}

      {/* Sprints List */}
      <Stack gap="md">
        {sprints.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No sprints yet"
            description="Create a sprint to start planning work"
            action={
              canEdit
                ? { label: "Create Sprint", onClick: () => setShowCreateForm(true) }
                : undefined
            }
          />
        ) : (
          sprints.map((sprint: Doc<"sprints"> & { issueCount: number; completedCount: number }) => (
            <SprintCard
              key={sprint._id}
              sprint={sprint}
              canEdit={canEdit}
              onStartSprint={openStartSprintModal}
              onCompleteSprint={handleCompleteSprint}
            />
          ))
        )}
      </Stack>

      {/* Start Sprint Modal */}
      {startingSprintId && (
        <Flex align="center" justify="center" className="fixed inset-0 z-modal bg-overlay">
          <Card padding="lg" className="max-w-lg w-full m-4 animate-scale-in">
            <Stack gap="lg">
              <Stack gap="sm">
                <Typography variant="h4">Start Sprint</Typography>
                <Typography variant="small" color="secondary">
                  Choose how long this sprint should run.
                </Typography>
              </Stack>

              {/* Duration Presets */}
              <Stack gap="sm">
                <Typography variant="label">Sprint Duration</Typography>
                <Grid cols={2} colsSm={3} gap="sm">
                  {SPRINT_DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setStartPreset(preset.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-default focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring",
                        startPreset === preset.id
                          ? "border-brand bg-ui-bg-secondary"
                          : "border-ui-border-secondary bg-ui-bg hover:border-ui-border-hover",
                      )}
                    >
                      <Typography variant="label" className="block">
                        {preset.label}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {preset.description}
                      </Typography>
                    </button>
                  ))}
                </Grid>
              </Stack>

              {/* Custom date inputs */}
              {startPreset === "custom" && (
                <Flex direction="column" gap="md" className="sm:flex-row">
                  <FlexItem flex="1">
                    <Input
                      label="Start Date"
                      type="date"
                      value={startCustomStart}
                      onChange={(e) => setStartCustomStart(e.target.value)}
                    />
                  </FlexItem>
                  <FlexItem flex="1">
                    <Input
                      label="End Date"
                      type="date"
                      value={startCustomEnd}
                      onChange={(e) => setStartCustomEnd(e.target.value)}
                    />
                  </FlexItem>
                </Flex>
              )}

              <Flex gap="sm" justify="end">
                <Button variant="secondary" onClick={closeStartSprintModal}>
                  Cancel
                </Button>
                <Button variant="success" onClick={() => void handleStartSprint()}>
                  Start Sprint
                </Button>
              </Flex>
            </Stack>
          </Card>
        </Flex>
      )}
    </Stack>
  );
}
