/**
 * Time Entry Modal
 *
 * Dialog for viewing and editing existing time entries.
 * Displays entry details with duration, activity type, and notes.
 * Supports editing and continuation of previous time entries.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDateForInput, formatDurationHuman } from "@/lib/formatting";
import { Clock, Hourglass, Play, X } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
import { Flex, FlexItem } from "../ui/Flex";
import { Checkbox, Input, Textarea } from "../ui/form";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Label } from "../ui/Label";
import { SegmentedControl, SegmentedControlItem } from "../ui/SegmentedControl";
import { Select } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import {
  calculateEntryTimes,
  validateContext,
  validateLogTimeSubmission,
} from "./timeEntryValidation";
import { useTimeEntryForm } from "./useTimeEntryForm";

type ProjectItem = FunctionReturnType<typeof api.projects.getCurrentUserProjects>["page"][number];
type IssueItem = FunctionReturnType<typeof api.issues.listSelectableIssues>[number];
type TimeEntryMode = "timer" | "duration" | "timeRange";
type TimeEntryFormState = ReturnType<typeof useTimeEntryForm>["state"];
type TimeEntryFormComputed = ReturnType<typeof useTimeEntryForm>["computed"];
type CreateTimeEntryMutation = ReactMutation<typeof api.timeTracking.createTimeEntry>;
type StartTimerMutation = ReactMutation<typeof api.timeTracking.startTimer>;

const ACTIVITY_OPTIONS = [
  { value: "none", label: "Select activity..." },
  ...ACTIVITY_TYPES.map((activityType) => ({
    value: activityType,
    label: activityType,
  })),
];

function isTimeEntryMode(value: string): value is TimeEntryMode {
  return value === "timer" || value === "duration" || value === "timeRange";
}

function toOptionalValue(value: string) {
  return value || undefined;
}

function getProjectSelectOptions(projects: ProjectItem[] | undefined) {
  return [
    { value: "none", label: "No project" },
    ...(projects?.map((project) => ({
      value: project._id,
      label: project.name,
    })) ?? []),
  ];
}

function getIssueSelectOptions(projectIssues: IssueItem[] | undefined) {
  return [
    { value: "none", label: "No issue" },
    ...(projectIssues
      ?.slice()
      .sort((a, b) => {
        const aLabel = a.title ?? a.key ?? "";
        const bLabel = b.title ?? b.key ?? "";
        return aLabel.localeCompare(bLabel);
      })
      .map((issue) => ({
        value: issue._id,
        label: issue.title ? `${issue.key} - ${issue.title}` : issue.key,
      })) ?? []),
  ];
}

function getProjectIdFromSelectValue(value: string): Id<"projects"> | undefined {
  return value === "none" ? undefined : (value as Id<"projects">);
}

function getIssueIdFromSelectValue(value: string): Id<"issues"> | undefined {
  return value === "none" ? undefined : (value as Id<"issues">);
}

async function submitStartTimer({
  state,
  hasValidContext,
  startTimerMutation,
  onSuccess,
}: {
  state: TimeEntryFormState;
  hasValidContext: boolean;
  startTimerMutation: StartTimerMutation;
  onSuccess: () => void;
}) {
  const contextResult = validateContext(hasValidContext);
  if (!contextResult.isValid) {
    showError(contextResult.errorMessage);
    return;
  }

  try {
    await startTimerMutation({
      projectId: state.projectId,
      issueId: state.issueId,
      description: toOptionalValue(state.description),
      activity: toOptionalValue(state.activity),
      billable: state.billable,
      tags: state.tags.length > 0 ? state.tags : undefined,
    });
    showSuccess("Timer started");
    onSuccess();
  } catch (error) {
    showError(error, "Failed to start timer");
  }
}

async function submitLogTime({
  state,
  computed,
  createTimeEntry,
  onSuccess,
}: {
  state: TimeEntryFormState;
  computed: TimeEntryFormComputed;
  createTimeEntry: CreateTimeEntryMutation;
  onSuccess: () => void;
}) {
  const validationResult = validateLogTimeSubmission(
    state,
    computed.hasValidContext,
    computed.effectiveDuration,
  );

  if (!validationResult.isValid) {
    showError(validationResult.errorMessage);
    return;
  }

  const { startTime, endTime } = calculateEntryTimes(state, computed.effectiveDuration);

  try {
    await createTimeEntry({
      projectId: state.projectId,
      issueId: state.issueId,
      startTime,
      endTime,
      description: toOptionalValue(state.description),
      activity: toOptionalValue(state.activity),
      tags: state.tags,
      billable: state.billable,
    });
    showSuccess("Time entry created");
    onSuccess();
  } catch (error) {
    showError(error, "Failed to create time entry");
  }
}

interface TimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
  defaultMode?: "timer" | "log";
  billingEnabled?: boolean;
}

function DurationSummary({ durationSeconds }: { durationSeconds: number }) {
  return (
    <Card recipe="timeSummary" padding="sm">
      <Typography variant="mono" color="brandActive">
        Duration: {formatDurationHuman(durationSeconds)}
      </Typography>
    </Card>
  );
}

// Tags input component
function TagsInput({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
}: {
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}) {
  return (
    <Stack gap="sm">
      <Label htmlFor="time-entry-tags">Tags</Label>
      <Flex gap="sm">
        <FlexItem flex="1">
          <Input
            id="time-entry-tags"
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddTag();
              }
            }}
            placeholder="Add tag..."
          />
        </FlexItem>
        <Button type="button" onClick={onAddTag} variant="secondary" size="sm">
          Add
        </Button>
      </Flex>
      {tags.length > 0 && (
        <Flex gap="sm" wrap>
          {tags.map((tag) => (
            <Badge key={tag} variant="brand" shape="pill">
              <Flex as="span" inline align="center" gap="xs">
                {tag}
                <IconButton
                  variant="brand"
                  size="xs"
                  onClick={() => onRemoveTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  <Icon icon={X} size="xs" />
                </IconButton>
              </Flex>
            </Badge>
          ))}
        </Flex>
      )}
    </Stack>
  );
}

// Duration mode fields component
function DurationModeFields({
  date,
  durationInput,
  durationSeconds,
  isDurationInputValid,
  onDateChange,
  onDurationChange,
  onQuickIncrement,
  onClearDuration,
}: {
  date: string;
  durationInput: string;
  durationSeconds: number;
  isDurationInputValid: boolean;
  onDateChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onQuickIncrement: (minutes: number) => void;
  onClearDuration: () => void;
}) {
  return (
    <Stack gap="md">
      <Input
        id="time-entry-date"
        type="date"
        label="Date *"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        max={formatDateForInput(Date.now())}
        required
      />
      <Stack gap="sm">
        <Input
          id="time-entry-duration"
          type="text"
          label="Duration *"
          value={durationInput}
          onChange={(e) => onDurationChange(e.target.value)}
          placeholder="e.g., 1:30, 1.5, 1h 30m, 90m"
          helperText="Accepts: 1:30, 1.5, 1h 30m, 90m"
          error={isDurationInputValid ? undefined : "Enter a valid duration"}
        />
        <Flex gap="sm">
          <Button type="button" variant="secondary" size="sm" onClick={() => onQuickIncrement(15)}>
            +15m
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onQuickIncrement(30)}>
            +30m
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onQuickIncrement(60)}>
            +1h
          </Button>
          {durationSeconds > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={onClearDuration}>
              Clear
            </Button>
          )}
        </Flex>
        {durationSeconds > 0 && <DurationSummary durationSeconds={durationSeconds} />}
      </Stack>
    </Stack>
  );
}

// Time range mode fields component
function TimeRangeModeFields({
  date,
  startTime,
  endTime,
  timeRangeDuration,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: {
  date: string;
  startTime: string;
  endTime: string;
  timeRangeDuration: number;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}) {
  return (
    <Stack gap="md">
      <Input
        id="time-entry-date-range"
        type="date"
        label="Date *"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        max={formatDateForInput(Date.now())}
        required
      />
      <Grid cols={2} gap="lg">
        <Input
          id="time-entry-start"
          type="time"
          label="Start Time *"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
          required
        />
        <Input
          id="time-entry-end"
          type="time"
          label="End Time *"
          value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
          required
        />
      </Grid>
      {timeRangeDuration > 0 && <DurationSummary durationSeconds={timeRangeDuration} />}
    </Stack>
  );
}

function TimeEntryModalFooter({
  closeModal,
  isSubmitDisabled,
  isTimerMode,
}: {
  closeModal: () => void;
  isSubmitDisabled: boolean;
  isTimerMode: boolean;
}) {
  return (
    <>
      <Button type="button" onClick={closeModal} variant="secondary">
        Cancel
      </Button>
      <Button
        type="submit"
        form="time-entry-form"
        variant="primary"
        disabled={isSubmitDisabled}
        leftIcon={isTimerMode ? <Icon icon={Play} size="sm" /> : undefined}
      >
        {isTimerMode ? "Start Timer" : "Log Time"}
      </Button>
    </>
  );
}

/**
 * Unified Time Entry Modal
 *
 * Combines timer start and manual time logging into one reusable component.
 * Supports pre-filling project/issue via props for context-aware usage.
 */
export function TimeEntryModal({
  open,
  onOpenChange,
  projectId: initialProjectId,
  issueId: initialIssueId,
  defaultMode = "log",
  billingEnabled,
}: TimeEntryModalProps) {
  // Only load data when modal is open (auth is handled by useAuthenticatedQuery)
  const shouldLoadData = open;
  const { mutate: createTimeEntry } = useAuthenticatedMutation(api.timeTracking.createTimeEntry);
  const { mutate: startTimerMutation } = useAuthenticatedMutation(api.timeTracking.startTimer);
  const projects = useAuthenticatedQuery(
    api.projects.getCurrentUserProjects,
    shouldLoadData ? {} : "skip",
  );

  const { state, actions, computed } = useTimeEntryForm({
    initialProjectId,
    initialIssueId,
    defaultMode,
    open,
  });

  const projectIssues = useAuthenticatedQuery(
    api.issues.listSelectableIssues,
    shouldLoadData && state.projectId ? { projectId: state.projectId } : "skip",
  );
  const closeModal = () => onOpenChange(false);
  const projectOptions = getProjectSelectOptions(projects?.page);
  const issueOptions = getIssueSelectOptions(projectIssues);
  const handleModeChange = (value: string) => {
    if (isTimeEntryMode(value)) {
      actions.setEntryMode(value);
    }
  };
  const handleProjectChange = (value: string) => {
    actions.setProjectId(getProjectIdFromSelectValue(value));
    actions.setIssueId(undefined);
  };
  const handleIssueChange = (value: string) => {
    actions.setIssueId(getIssueIdFromSelectValue(value));
  };
  const handleActivityChange = (value: string) => {
    actions.setActivity(value === "none" ? "" : value);
  };
  const isSubmitDisabled =
    !shouldLoadData || (!computed.isTimerMode && computed.effectiveDuration <= 0);
  const handleSubmit = computed.isTimerMode
    ? async () =>
        submitStartTimer({
          state,
          hasValidContext: computed.hasValidContext,
          startTimerMutation,
          onSuccess: closeModal,
        })
    : async () =>
        submitLogTime({
          state,
          computed,
          createTimeEntry,
          onSuccess: closeModal,
        });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={computed.isTimerMode ? "Start Timer" : "Log Time"}
      size="md"
      data-testid={TEST_IDS.TIME_TRACKING.ENTRY_MODAL}
      footer={
        <TimeEntryModalFooter
          closeModal={closeModal}
          isSubmitDisabled={isSubmitDisabled}
          isTimerMode={computed.isTimerMode}
        />
      }
    >
      <Stack
        as="form"
        data-testid={TEST_IDS.TIME_TRACKING.ENTRY_FORM}
        id="time-entry-form"
        gap="md"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        {/* Mode Toggle */}
        <SegmentedControl
          value={state.entryMode}
          iconSpacing
          layout="stackOnMobile"
          variant="default"
          width="fill"
          onValueChange={handleModeChange}
        >
          <SegmentedControlItem value="timer" variant="default" width="fill">
            <Icon icon={Play} size="sm" />
            Start Timer
          </SegmentedControlItem>
          <SegmentedControlItem value="duration" variant="default" width="fill">
            <Icon icon={Hourglass} size="sm" />
            Duration
          </SegmentedControlItem>
          <SegmentedControlItem value="timeRange" variant="default" width="fill">
            <Icon icon={Clock} size="sm" />
            Time Range
          </SegmentedControlItem>
        </SegmentedControl>

        {/* Project Selection */}
        <Stack gap="xs">
          <Label htmlFor="time-entry-project">Project</Label>
          <Select
            id="time-entry-project"
            onChange={handleProjectChange}
            options={projectOptions}
            placeholder="Select project..."
            value={state.projectId || "none"}
          />
        </Stack>

        {/* Issue Selection */}
        {state.projectId && projectIssues && projectIssues.length > 0 && (
          <Stack gap="xs">
            <Label htmlFor="time-entry-issue">Issue</Label>
            <Select
              id="time-entry-issue"
              onChange={handleIssueChange}
              options={issueOptions}
              placeholder="Select issue..."
              value={state.issueId || "none"}
            />
          </Stack>
        )}

        {/* Description */}
        <Textarea
          label="Description"
          value={state.description}
          onChange={(e) => actions.setDescription(e.target.value)}
          placeholder="What are you working on?"
          rows={2}
        />

        {/* Activity */}
        <Stack gap="xs">
          <Label htmlFor="time-entry-activity">Activity</Label>
          <Select
            id="time-entry-activity"
            onChange={handleActivityChange}
            options={ACTIVITY_OPTIONS}
            placeholder="Select activity..."
            value={state.activity || "none"}
          />
        </Stack>

        {/* Billable */}
        {billingEnabled && (
          <Checkbox
            checked={state.billable}
            onChange={(e) => actions.setBillable(e.target.checked)}
            label="Billable time"
          />
        )}

        {/* Tags */}
        <TagsInput
          tags={state.tags}
          tagInput={state.tagInput}
          onTagInputChange={actions.setTagInput}
          onAddTag={actions.handleAddTag}
          onRemoveTag={actions.handleRemoveTag}
        />

        {/* Duration Mode Fields */}
        {state.entryMode === "duration" && (
          <DurationModeFields
            date={state.date}
            durationInput={state.durationInput}
            durationSeconds={state.durationSeconds}
            isDurationInputValid={computed.isDurationInputValid}
            onDateChange={actions.setDate}
            onDurationChange={actions.setDurationInput}
            onQuickIncrement={actions.handleQuickIncrement}
            onClearDuration={actions.clearDuration}
          />
        )}

        {/* Time Range Mode Fields */}
        {state.entryMode === "timeRange" && (
          <TimeRangeModeFields
            date={state.date}
            startTime={state.startTime}
            endTime={state.endTime}
            timeRangeDuration={state.timeRangeDuration}
            onDateChange={actions.setDate}
            onStartTimeChange={actions.setStartTime}
            onEndTimeChange={actions.setEndTime}
          />
        )}
      </Stack>
    </Dialog>
  );
}
