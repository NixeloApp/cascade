/**
 * Sprint Manager
 *
 * Comprehensive sprint planning and tracking interface.
 * Supports sprint creation, issue assignment, status transitions, and burn charts.
 * Provides drag-and-drop backlog management and sprint goal tracking.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { SprintBurnChart } from "@/components/Analytics/SprintBurnChart";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Checkbox } from "@/components/ui/form/Checkbox";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/Textarea";
import { Grid } from "@/components/ui/Grid";
import { Progress } from "@/components/ui/Progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { ResponsiveText } from "@/components/ui/ResponsiveText";
import { Select } from "@/components/ui/Select";
import { SkeletonProjectCard } from "@/components/ui/Skeleton";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { formatDate } from "@/lib/formatting";
import { Trophy } from "@/lib/icons";
import { getStatusBadgeTone } from "@/lib/issue-utils";
import {
  calculateEndDate,
  DEFAULT_SPRINT_PRESET,
  SPRINT_DURATION_PRESETS,
} from "@/lib/sprint-presets";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";

type SprintWithCounts = FunctionReturnType<typeof api.sprints.listByProject>[number];

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

type SprintPreset = (typeof SPRINT_DURATION_PRESETS)[number]["id"];

/** Get overlapping sprints for sprint creation form */
function getCreateOverlappingSprints(
  sprints: SprintWithCounts[] | undefined,
  selectedPreset: SprintPreset,
  customStartDate: string,
  customEndDate: string,
): SprintWithCounts[] {
  if (!sprints || selectedPreset !== "custom" || !customStartDate || !customEndDate) {
    return [];
  }
  const startDate = new Date(customStartDate).getTime();
  const endDate = new Date(customEndDate).getTime();
  return findOverlappingSprints(sprints, startDate, endDate);
}

/** Get overlapping sprints when starting a sprint */
function getStartOverlappingSprints(
  sprints: SprintWithCounts[] | undefined,
  startingSprintId: Id<"sprints"> | null,
  startPreset: SprintPreset,
  startCustomStart: string,
  startCustomEnd: string,
): SprintWithCounts[] {
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
  const issueProgress =
    sprint.issueCount > 0 ? (sprint.completedCount / sprint.issueCount) * 100 : 0;
  const hasPoints = sprint.totalPoints > 0;
  const pointProgress = hasPoints ? (sprint.completedPoints / sprint.totalPoints) * 100 : 0;

  return (
    <Card padding="md" className="animate-fade-in" data-testid={TEST_IDS.SPRINT.CARD}>
      <Flex
        direction="column"
        align="start"
        directionSm="row"
        alignSm="center"
        justify="between"
        gap="lg"
      >
        <FlexItem flex="1" className="w-full sm:w-auto">
          <Stack gap="sm">
            <Flex wrap align="center" gap="sm">
              <Typography variant="h5" data-testid={TEST_IDS.SPRINT.NAME}>
                {sprint.name}
              </Typography>
              <Badge size="md" statusTone={getStatusBadgeTone(sprint.status)}>
                {sprint.status}
              </Badge>
              <Badge variant="neutral" size="sm">
                {sprint.issueCount} issues
              </Badge>
              {hasPoints && (
                <Badge variant="neutral" size="sm">
                  {sprint.totalPoints} pts
                </Badge>
              )}
            </Flex>
            {sprint.goal && (
              <Typography variant="small" color="secondary">
                {sprint.goal}
              </Typography>
            )}

            {/* Progress bars for active/completed sprints */}
            {(sprint.status === "active" || sprint.status === "completed") && (
              <Stack gap="sm">
                {/* Issue progress */}
                <Stack gap="xs">
                  <Flex justify="between">
                    <Typography variant="caption">
                      {sprint.completedCount} of {sprint.issueCount} issues
                    </Typography>
                    <Typography variant="caption" color="brand">
                      {Math.round(issueProgress)}%
                    </Typography>
                  </Flex>
                  <Progress value={issueProgress} size="sm" />
                </Stack>

                {/* Story point progress (only shown when issues have points) */}
                {hasPoints && (
                  <Stack gap="xs">
                    <Flex justify="between">
                      <Typography variant="caption">
                        {sprint.completedPoints} of {sprint.totalPoints} story points
                      </Typography>
                      <Typography variant="caption" color="brand">
                        {Math.round(pointProgress)}%
                      </Typography>
                    </Flex>
                    <Progress value={pointProgress} size="sm" />
                  </Stack>
                )}
              </Stack>
            )}

            {sprint.startDate && sprint.endDate && (
              <Typography variant="caption">
                {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
              </Typography>
            )}
          </Stack>
        </FlexItem>
        {canEdit && (
          <Flex direction="column" directionSm="row" gap="sm" className="w-full sm:w-auto">
            {sprint.status === "future" && (
              <Button
                onClick={() => void onStartSprint(sprint._id)}
                variant="success"
                size="sm"
                data-testid={TEST_IDS.SPRINT.START_TRIGGER}
              >
                Start Sprint
              </Button>
            )}
            {sprint.status === "active" && (
              <Button
                onClick={() => void onCompleteSprint(sprint._id)}
                variant="secondary"
                size="sm"
                data-testid={TEST_IDS.SPRINT.COMPLETE_TRIGGER}
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

/** Sprint planning and tracking interface with drag-and-drop backlog management. */
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
  const [autoCreateNextSprint, setAutoCreateNextSprint] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const sprints = useAuthenticatedQuery(api.sprints.listByProject, { projectId });
  const incompleteIssueIds = useAuthenticatedQuery(
    api.sprints.getIncompleteIssueIds,
    completingSprintId ? { sprintId: completingSprintId } : "skip",
  );
  const { mutate: createSprint } = useAuthenticatedMutation(api.sprints.create);
  const { mutate: startSprint } = useAuthenticatedMutation(api.sprints.startSprint);
  const { mutate: completeSprint } = useAuthenticatedMutation(api.sprints.completeSprint);
  const { mutate: bulkMoveToSprint } = useAuthenticatedMutation(api.issues.bulkMoveToSprint);

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
  const createOverlappingSprints = getCreateOverlappingSprints(
    sprints,
    selectedPreset,
    customStartDate,
    customEndDate,
  );

  // Check for overlapping sprints when starting a sprint
  const startOverlappingSprints = getStartOverlappingSprints(
    sprints,
    startingSprintId,
    startPreset,
    startCustomStart,
    startCustomEnd,
  );

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
    setAutoCreateNextSprint(false);
  };

  const closeCompleteSprintModal = () => {
    setCompletingSprintId(null);
    setTransferOption("backlog");
    setTargetSprintId(null);
    setAutoCreateNextSprint(false);
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
      await completeSprint({ sprintId: completingSprintId, autoCreateNext: autoCreateNextSprint });
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
        directionSm="row"
        alignSm="center"
        justify="between"
        gap="md"
      >
        <Typography variant="h4" data-testid={TEST_IDS.SPRINT.PAGE_HEADER}>
          Sprint Management
        </Typography>
        {canEdit && (
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="primary"
            data-testid={TEST_IDS.SPRINT.CREATE_BUTTON}
          >
            <ResponsiveText short="+ Sprint" long="Create Sprint" />
          </Button>
        )}
      </Flex>

      {/* Create Sprint Form */}
      {showCreateForm && (
        <Card padding="md" className="animate-scale-in">
          <Stack
            as="form"
            gap="md"
            data-testid={TEST_IDS.SPRINT.CREATE_FORM}
            onSubmit={(e: React.FormEvent) => void handleCreateSprint(e)}
          >
            <Input
              label="Sprint Name"
              type="text"
              data-testid={TEST_IDS.SPRINT.CREATE_NAME_INPUT}
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
                    variant="unstyled"
                    chrome={selectedPreset === preset.id ? "sprintPresetSelected" : "sprintPreset"}
                    chromeSize="sprintPreset"
                    onClick={() => setSelectedPreset(preset.id)}
                    className="items-start justify-start text-left flex-col"
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
                <Flex direction="column" directionSm="row" gap="md">
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

            <Flex direction="column" directionSm="row" gap="sm">
              <Button
                type="submit"
                variant="primary"
                data-testid={TEST_IDS.SPRINT.CREATE_SUBMIT_BUTTON}
              >
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
            data-testid={TEST_IDS.SPRINT.EMPTY_STATE}
            action={
              canEdit
                ? { label: "Create Sprint", onClick: () => setShowCreateForm(true) }
                : undefined
            }
          />
        ) : (
          sprints.map((sprint) => (
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
                data-testid={TEST_IDS.SPRINT.COMPLETE_DIALOG}
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
                            onChange={(value) => setTargetSprintId(value as Id<"sprints">)}
                            options={availableTargetSprints.map((sprint) => ({
                              label: sprint.name,
                              sprintStatus: sprint.status,
                              value: sprint._id,
                            }))}
                            placeholder="Select a sprint"
                            renderOption={(option) => (
                              <Flex align="center" gap="sm">
                                <Typography variant="small">{option.label}</Typography>
                                <Badge
                                  size="sm"
                                  statusTone={getStatusBadgeTone(option.sprintStatus)}
                                >
                                  {option.sprintStatus}
                                </Badge>
                              </Flex>
                            )}
                            value={targetSprintId ?? undefined}
                          />
                        </Stack>
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="small" color="secondary">
                      All issues in this sprint are completed. Ready to mark the sprint as done.
                    </Typography>
                  )}

                  <Checkbox
                    checked={autoCreateNextSprint}
                    onChange={(e) => setAutoCreateNextSprint(e.target.checked)}
                    label="Auto-create next sprint"
                    helperText="Creates a new future sprint with the same duration and incremented name."
                  />

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
                      data-testid={TEST_IDS.SPRINT.COMPLETE_CONFIRM_BUTTON}
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
            data-testid={TEST_IDS.SPRINT.START_DIALOG}
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
                      variant="unstyled"
                      chrome={startPreset === preset.id ? "sprintPresetSelected" : "sprintPreset"}
                      chromeSize="sprintPreset"
                      onClick={() => setStartPreset(preset.id)}
                      data-testid={TEST_IDS.SPRINT.START_PRESET(preset.id)}
                      className="items-start justify-start text-left flex-col"
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
                <Flex direction="column" directionSm="row" gap="md">
                  <FlexItem flex="1">
                    <Input
                      label="Start Date"
                      type="date"
                      data-testid={TEST_IDS.SPRINT.START_DATE_INPUT}
                      value={startCustomStart}
                      onChange={(e) => setStartCustomStart(e.target.value)}
                    />
                  </FlexItem>
                  <FlexItem flex="1">
                    <Input
                      label="End Date"
                      type="date"
                      data-testid={TEST_IDS.SPRINT.START_END_DATE_INPUT}
                      value={startCustomEnd}
                      onChange={(e) => setStartCustomEnd(e.target.value)}
                    />
                  </FlexItem>
                </Flex>
              )}

              {/* Overlap warning */}
              {startOverlappingSprints.length > 0 && (
                <Alert variant="warning" data-testid={TEST_IDS.SPRINT.START_OVERLAP_WARNING}>
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
                <Button
                  variant="success"
                  onClick={() => void handleStartSprint()}
                  data-testid={TEST_IDS.SPRINT.START_CONFIRM_BUTTON}
                >
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
