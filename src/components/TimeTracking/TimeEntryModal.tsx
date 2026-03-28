/**
 * Time Entry Modal
 *
 * Dialog for viewing and editing existing time entries.
 * Displays entry details with duration, activity type, and notes.
 * Supports editing and continuation of previous time entries.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
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

function isTimeEntryMode(value: string): value is TimeEntryMode {
  return value === "timer" || value === "duration" || value === "timeRange";
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

  const handleStartTimer = async () => {
    const contextResult = validateContext(computed.hasValidContext);
    if (!contextResult.isValid) {
      showError(contextResult.errorMessage);
      return;
    }

    try {
      await startTimerMutation({
        projectId: state.projectId,
        issueId: state.issueId,
        description: state.description || undefined,
        activity: state.activity || undefined,
        billable: state.billable,
        tags: state.tags.length > 0 ? state.tags : undefined,
      });
      showSuccess("Timer started");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to start timer");
    }
  };

  const handleLogTime = async () => {
    const validationResult = validateLogTimeSubmission(
      state,
      computed.hasValidContext,
      computed.effectiveDuration,
    );

    if (!validationResult.isValid) {
      showError(validationResult.errorMessage);
      return;
    }

    const { startTime: entryStartTime, endTime: entryEndTime } = calculateEntryTimes(
      state,
      computed.effectiveDuration,
    );

    try {
      await createTimeEntry({
        projectId: state.projectId,
        issueId: state.issueId,
        startTime: entryStartTime,
        endTime: entryEndTime,
        description: state.description || undefined,
        activity: state.activity || undefined,
        tags: state.tags,
        billable: state.billable,
      });
      showSuccess("Time entry created");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to create time entry");
    }
  };

  const handleSubmit = computed.isTimerMode ? handleStartTimer : handleLogTime;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={computed.isTimerMode ? "Start Timer" : "Log Time"}
      size="md"
      data-testid={TEST_IDS.TIME_TRACKING.ENTRY_MODAL}
      footer={
        <>
          <Button type="button" onClick={() => onOpenChange(false)} variant="secondary">
            Cancel
          </Button>
          <Button
            type="submit"
            form="time-entry-form"
            variant="primary"
            disabled={!shouldLoadData || (!computed.isTimerMode && computed.effectiveDuration <= 0)}
            leftIcon={computed.isTimerMode ? <Icon icon={Play} size="sm" /> : undefined}
          >
            {computed.isTimerMode ? "Start Timer" : "Log Time"}
          </Button>
        </>
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
          onValueChange={(value: string) => {
            if (isTimeEntryMode(value)) {
              actions.setEntryMode(value);
            }
          }}
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
            onChange={(value) => {
              actions.setProjectId(value === "none" ? undefined : (value as Id<"projects">));
              actions.setIssueId(undefined);
            }}
            options={[
              { value: "none", label: "No project" },
              ...((projects?.page?.map((project: ProjectItem) => ({
                value: project._id,
                label: project.name,
              })) ?? []) as Array<{ value: Id<"projects">; label: string }>),
            ]}
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
              onChange={(value) =>
                actions.setIssueId(value === "none" ? undefined : (value as Id<"issues">))
              }
              options={[
                { value: "none", label: "No issue" },
                ...projectIssues
                  .sort((a: IssueItem, b: IssueItem) => (a.title > b.title ? 1 : -1))
                  .map((issue: IssueItem) => ({
                    value: issue._id,
                    label: `${issue.key} - ${issue.title}`,
                  })),
              ]}
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
            onChange={(value) => actions.setActivity(value === "none" ? "" : value)}
            options={[
              { value: "none", label: "Select activity..." },
              ...ACTIVITY_TYPES.map((activityType) => ({
                value: activityType,
                label: activityType,
              })),
            ]}
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
