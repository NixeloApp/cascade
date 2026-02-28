import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { SprintBurnChart } from "@/components/Analytics/SprintBurnChart";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
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
import { Alert } from "./ui/Alert";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { Input } from "./ui/form/Input";
import { Textarea } from "./ui/form/Textarea";
import { Grid } from "./ui/Grid";
import { RadioGroup, RadioGroupItem } from "./ui/RadioGroup";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { SkeletonProjectCard } from "./ui/Skeleton";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

type SprintWithCounts = Doc<"sprints"> & { issueCount: number; completedCount: number };

/**
 * Check if two date ranges overlap
 */
function dateRangesOverlap(
  start1: number,
  end1: number,
  start2: number | undefined,
  end2: number | undefined,
): boolean {
  if (!start2 || !end2) return false;
  return start1 <= end2 && end1 >= start2;
}

/**
 * Find sprints that overlap with the given date range
 */
function findOverlappingSprints(
  sprints: SprintWithCounts[],
  startDate: number,
  endDate: number,
  excludeSprintId?: Id<"sprints">,
): SprintWithCounts[] {
  return sprints.filter((sprint) => {
    // Skip the sprint being edited/started
    if (excludeSprintId && sprint._id === excludeSprintId) return false;
    // Only check active or future sprints (completed sprints don't matter)
    if (sprint.status === "completed") return false;
    return dateRangesOverlap(startDate, endDate, sprint.startDate, sprint.endDate);
  });
}

interface SprintManagerProps {
  projectId: Id<"projects">;
  canEdit?: boolean;
}

interface SprintCardProps {
  sprint: SprintWithCounts;
  canEdit: boolean;
  onStartSprint: (sprintId: Id<"sprints">) => void;
  onCompleteSprint: (sprintId: Id<"sprints">) => void;
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

  // Complete sprint modal state
  const [completingSprintId, setCompletingSprintId] = useState<Id<"sprints"> | null>(null);
  const [transferOption, setTransferOption] = useState<"backlog" | "sprint" | "keep">("backlog");
  const [targetSprintId, setTargetSprintId] = useState<Id<"sprints"> | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const sprints = useQuery(api.sprints.listByProject, { projectId });
  const incompleteIssueIds = useQuery(
    api.sprints.getIncompleteIssueIds,
    completingSprintId ? { sprintId: completingSprintId } : "skip",
  );
  const createSprint = useMutation(api.sprints.create);
  const startSprint = useMutation(api.sprints.startSprint);
  const completeSprint = useMutation(api.sprints.completeSprint);
  const bulkMoveToSprint = useMutation(api.issues.bulkMoveToSprint);

  // Keyboard shortcut: Shift+S to create sprint
  useKeyboardShortcuts(
    [
      {
        key: "s",
        shift: true,
        description: "Create new sprint",
        handler: () => {
          if (canEdit && !showCreateForm && !startingSprintId && !completingSprintId) {
            setShowCreateForm(true);
          }
        },
      },
    ],
    canEdit,
  );

  // Check for overlapping sprints when creating with custom dates
  const createOverlappingSprints = useMemo(() => {
    if (!sprints || selectedPreset !== "custom" || !customStartDate || !customEndDate) {
      return [];
    }
    const startDate = new Date(customStartDate).getTime();
    const endDate = new Date(customEndDate).getTime();
    return findOverlappingSprints(sprints, startDate, endDate);
  }, [sprints, selectedPreset, customStartDate, customEndDate]);

  // Check for overlapping sprints when starting a sprint
  const startOverlappingSprints = useMemo(() => {
    if (!sprints || !startingSprintId) return [];

    let startDate: number;
    let endDate: number;

    if (startPreset === "custom") {
      if (!startCustomStart || !startCustomEnd) return [];
      startDate = new Date(startCustomStart).getTime();
      endDate = new Date(startCustomEnd).getTime();
    } else {
      startDate = Date.now();
      endDate = calculateEndDate(startDate, startPreset).getTime();
    }

    return findOverlappingSprints(sprints, startDate, endDate, startingSprintId);
  }, [sprints, startingSprintId, startPreset, startCustomStart, startCustomEnd]);

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

  // Open complete sprint modal
  const openCompleteSprintModal = (sprintId: Id<"sprints">) => {
    setCompletingSprintId(sprintId);
    setTransferOption("backlog");
    setTargetSprintId(null);
  };

  const closeCompleteSprintModal = () => {
    setCompletingSprintId(null);
    setTransferOption("backlog");
    setTargetSprintId(null);
    setIsCompleting(false);
  };

  const handleCompleteSprint = async () => {
    if (!completingSprintId) return;

    setIsCompleting(true);

    try {
      // Transfer incomplete issues if needed
      if (incompleteIssueIds && incompleteIssueIds.length > 0 && transferOption !== "keep") {
        const destinationSprintId = transferOption === "sprint" ? targetSprintId : null;
        await bulkMoveToSprint({
          issueIds: incompleteIssueIds,
          sprintId: destinationSprintId,
        });
      }

      // Complete the sprint
      await completeSprint({ sprintId: completingSprintId });
      showSuccess("Sprint completed successfully");
      closeCompleteSprintModal();
    } catch (error) {
      showError(error, "Failed to complete sprint");
      setIsCompleting(false);
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
                  <Button
                    key={preset.id}
                    variant="ghost"
                    onClick={() => setSelectedPreset(preset.id)}
                    className={cn(
                      "h-auto p-3 rounded-lg border text-left justify-start items-start flex-col",
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
                  </Button>
                ))}
              </Grid>
            </Stack>

            {/* Custom date inputs (shown when "Custom" is selected) */}
            {selectedPreset === "custom" && (
              <Stack gap="md">
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
                {createOverlappingSprints.length > 0 && (
                  <Alert variant="warning">
                    <Typography variant="small">
                      These dates overlap with:{" "}
                      {createOverlappingSprints.map((s) => s.name).join(", ")}
                    </Typography>
                  </Alert>
                )}
              </Stack>
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
          sprints.map((sprint: SprintWithCounts) => (
            <Stack key={sprint._id} gap="md">
              <SprintCard
                sprint={sprint}
                canEdit={canEdit}
                onStartSprint={openStartSprintModal}
                onCompleteSprint={openCompleteSprintModal}
              />
              {/* Show burn chart for active sprints */}
              {sprint.status === "active" && <SprintBurnChart sprintId={sprint._id} />}
            </Stack>
          ))
        )}
      </Stack>

      {/* Complete Sprint Modal */}
      {completingSprintId &&
        (() => {
          const completingSprint = sprints.find((s) => s._id === completingSprintId);
          const incompleteCount = incompleteIssueIds?.length ?? 0;
          const availableTargetSprints = sprints.filter(
            (s) => s._id !== completingSprintId && s.status !== "completed",
          );

          return (
            <Flex
              align="center"
              justify="center"
              className="fixed inset-0 z-modal bg-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeCompleteSprintModal();
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeCompleteSprintModal();
              }}
            >
              <Card
                padding="lg"
                className="max-w-md w-full m-4 animate-scale-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="complete-sprint-title"
              >
                <Stack gap="lg">
                  <Stack gap="sm">
                    <Typography variant="h4" id="complete-sprint-title">
                      Complete Sprint
                    </Typography>
                    <Typography variant="small" color="secondary">
                      {completingSprint?.name}
                    </Typography>
                  </Stack>

                  {incompleteCount > 0 ? (
                    <Stack gap="md">
                      <Alert variant="info">
                        <Typography variant="small">
                          {incompleteCount} issue{incompleteCount !== 1 ? "s" : ""} not completed.
                          Choose what to do with them.
                        </Typography>
                      </Alert>

                      <Stack gap="sm">
                        <Typography variant="label">Transfer incomplete issues to:</Typography>
                        <RadioGroup
                          value={transferOption}
                          onValueChange={(value) => {
                            setTransferOption(value as "backlog" | "sprint" | "keep");
                            if (value !== "sprint") {
                              setTargetSprintId(null);
                            }
                          }}
                        >
                          <RadioGroupItem
                            value="backlog"
                            label="Move to Backlog"
                            description="Remove from sprint, keep in project backlog"
                          />
                          <RadioGroupItem
                            value="sprint"
                            label="Move to Another Sprint"
                            description="Transfer to a different sprint"
                            disabled={availableTargetSprints.length === 0}
                          />
                          <RadioGroupItem
                            value="keep"
                            label="Keep in Completed Sprint"
                            description="Leave issues in this sprint"
                          />
                        </RadioGroup>
                      </Stack>

                      {transferOption === "sprint" && availableTargetSprints.length > 0 && (
                        <Stack gap="sm">
                          <Typography variant="label">Select target sprint:</Typography>
                          <Select
                            value={targetSprintId ?? ""}
                            onValueChange={(value) => setTargetSprintId(value as Id<"sprints">)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a sprint" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTargetSprints.map((sprint) => (
                                <SelectItem key={sprint._id} value={sprint._id}>
                                  <Flex align="center" gap="sm">
                                    <Typography variant="small">{sprint.name}</Typography>
                                    <Badge size="sm" className={getStatusColor(sprint.status)}>
                                      {sprint.status}
                                    </Badge>
                                  </Flex>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Stack>
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="small" color="secondary">
                      All issues in this sprint are completed. Ready to mark the sprint as done.
                    </Typography>
                  )}

                  <Flex gap="sm" justify="end">
                    <Button
                      variant="secondary"
                      onClick={closeCompleteSprintModal}
                      disabled={isCompleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => void handleCompleteSprint()}
                      disabled={
                        isCompleting ||
                        (transferOption === "sprint" && !targetSprintId && incompleteCount > 0)
                      }
                    >
                      {isCompleting ? "Completing..." : "Complete Sprint"}
                    </Button>
                  </Flex>
                </Stack>
              </Card>
            </Flex>
          );
        })()}

      {/* Start Sprint Modal */}
      {startingSprintId && (
        <Flex
          align="center"
          justify="center"
          className="fixed inset-0 z-modal bg-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeStartSprintModal();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeStartSprintModal();
          }}
        >
          <Card
            padding="lg"
            className="max-w-lg w-full m-4 animate-scale-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-sprint-title"
          >
            <Stack gap="lg">
              <Stack gap="sm">
                <Typography variant="h4" id="start-sprint-title">
                  Start Sprint
                </Typography>
                <Typography variant="small" color="secondary">
                  Choose how long this sprint should run.
                </Typography>
              </Stack>

              {/* Duration Presets */}
              <Stack gap="sm">
                <Typography variant="label">Sprint Duration</Typography>
                <Grid cols={2} colsSm={3} gap="sm">
                  {SPRINT_DURATION_PRESETS.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="ghost"
                      onClick={() => setStartPreset(preset.id)}
                      className={cn(
                        "h-auto p-3 rounded-lg border text-left justify-start items-start flex-col",
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
                    </Button>
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

              {/* Overlap warning */}
              {startOverlappingSprints.length > 0 && (
                <Alert variant="warning">
                  <Typography variant="small">
                    These dates overlap with:{" "}
                    {startOverlappingSprints.map((s) => s.name).join(", ")}
                  </Typography>
                </Alert>
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
