/**
 * Manual Time Entry Modal
 *
 * Dialog for manually logging time entries against issues or projects.
 * Supports duration input (e.g., "2h 30m") and time range selection.
 * Includes activity type selection and notes for billing purposes.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useForm, useStore } from "@tanstack/react-form";
import type { FunctionReturnType } from "convex/server";
import { Clock, Hourglass, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { FormTextarea } from "@/lib/form";
import { formatDateForInput, formatDurationHuman, parseDuration } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
import { Flex, FlexItem } from "../ui/Flex";
import { Checkbox, Input } from "../ui/form";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Label } from "../ui/Label";
import { SegmentedControl, SegmentedControlItem } from "../ui/SegmentedControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { calculateManualEntryTimes, validateManualTimeEntry } from "./manualTimeEntryValidation";

// =============================================================================
// Types & Schema
// =============================================================================

type ProjectItem = FunctionReturnType<typeof api.projects.getCurrentUserProjects>["page"][number];
type IssueItem = FunctionReturnType<typeof api.issues.listSelectableIssues>[number];

type EntryMode = "duration" | "timeRange";

const timeEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string(),
  endTime: z.string(),
  durationInput: z.string(),
  description: z.string(),
  activity: z.string(),
  billable: z.boolean(),
});

// =============================================================================
// Helper Functions
// =============================================================================

function parseDurationToSeconds(input: string): number {
  const parsed = parseDuration(input);
  return parsed ?? 0;
}

function calculateTimeRangeDuration(date: string, startTime: string, endTime: string): number {
  if (!(date && startTime && endTime)) return 0;
  try {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (end <= start) return 0;
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  } catch {
    return 0;
  }
}

function addTagToList(tags: string[], newTag: string): string[] {
  const tag = newTag.trim();
  if (tag && !tags.includes(tag)) {
    return [...tags, tag];
  }
  return tags;
}

function DurationSummary({ durationSeconds }: { durationSeconds: number }) {
  return (
    <Card recipe="timeSummary" padding="sm">
      <Typography variant="mono" className="text-brand-active">
        Duration: {formatDurationHuman(durationSeconds)}
      </Typography>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface ManualTimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
}

/** Modal for manually logging time with duration or time range entry modes. */
export function ManualTimeEntryModal({
  open,
  onOpenChange,
  projectId: initialProjectId,
  issueId: initialIssueId,
}: ManualTimeEntryModalProps) {
  const { mutate: createTimeEntry } = useAuthenticatedMutation(api.timeTracking.createTimeEntry);
  const projects = useAuthenticatedQuery(api.projects.getCurrentUserProjects, {});

  // Mode and derived state (kept outside form due to complexity)
  const [entryMode, setEntryMode] = useState<EntryMode>("duration");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [timeRangeDuration, setTimeRangeDuration] = useState(0);

  // Project/Issue selection (Radix Select)
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(initialProjectId);
  const [issueId, setIssueId] = useState<Id<"issues"> | undefined>(initialIssueId);

  // Tags (array state)
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Fetch issues for selected project
  const projectIssues = useAuthenticatedQuery(
    api.issues.listSelectableIssues,
    projectId ? { projectId } : "skip",
  );

  type TimeEntryForm = z.infer<typeof timeEntrySchema>;

  const form = useForm({
    defaultValues: {
      date: formatDateForInput(Date.now()),
      startTime: "09:00",
      endTime: "17:00",
      durationInput: "",
      description: "",
      activity: "",
      billable: false,
    },
    validators: { onChange: timeEntrySchema },
    onSubmit: async ({ value }: { value: TimeEntryForm }) => {
      const effectiveDuration = entryMode === "duration" ? durationSeconds : timeRangeDuration;

      // Validate using extracted helper
      const validation = validateManualTimeEntry(
        { date: value.date, startTime: value.startTime, endTime: value.endTime },
        entryMode,
        durationSeconds,
        timeRangeDuration,
      );

      if (!validation.isValid) {
        showError(validation.errorMessage);
        return;
      }

      // Calculate times using extracted helper
      const { startTimeMs, endTimeMs } = calculateManualEntryTimes(
        { date: value.date, startTime: value.startTime, endTime: value.endTime },
        entryMode,
        effectiveDuration,
      );

      try {
        await createTimeEntry({
          projectId,
          issueId,
          startTime: startTimeMs,
          endTime: endTimeMs,
          description: value.description || undefined,
          activity: value.activity || undefined,
          tags,
          billable: value.billable,
        });
        showSuccess("Time entry created");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to create time entry");
      }
    },
  });

  // Subscribe to form values for derived calculations
  const date = useStore(form.store, (state) => state.values.date);
  const startTime = useStore(form.store, (state) => state.values.startTime);
  const endTime = useStore(form.store, (state) => state.values.endTime);
  const durationInput = useStore(form.store, (state) => state.values.durationInput);

  // Parse duration input when it changes
  useEffect(() => {
    if (entryMode === "duration") {
      setDurationSeconds(parseDurationToSeconds(durationInput));
    }
  }, [durationInput, entryMode]);

  // Calculate duration from time range
  useEffect(() => {
    if (entryMode === "timeRange") {
      setTimeRangeDuration(calculateTimeRangeDuration(date, startTime, endTime));
    }
  }, [date, startTime, endTime, entryMode]);

  const handleQuickIncrement = (minutes: number) => {
    const newSeconds = durationSeconds + minutes * 60;
    setDurationSeconds(newSeconds);
    form.setFieldValue("durationInput", formatDurationHuman(newSeconds));
  };

  const handleAddTag = () => {
    const newTags = addTagToList(tags, tagInput);
    if (newTags !== tags) {
      setTags(newTags);
      setTagInput("");
    }
  };

  const effectiveDuration = entryMode === "duration" ? durationSeconds : timeRangeDuration;
  const isDurationInputValid = durationInput.trim() === "" || durationSeconds > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Log Time Manually" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {/* Mode Toggle */}
        <SegmentedControl
          value={entryMode}
          variant="default"
          onValueChange={(value: string) => {
            if (value === "duration" || value === "timeRange") {
              setEntryMode(value);
            }
          }}
          className="flex w-full flex-col sm:flex-row"
        >
          <SegmentedControlItem
            value="duration"
            variant="default"
            className="w-full flex-1 justify-center gap-2"
          >
            <Icon icon={Hourglass} size="sm" />
            Duration
          </SegmentedControlItem>
          <SegmentedControlItem
            value="timeRange"
            variant="default"
            className="w-full flex-1 justify-center gap-2"
          >
            <Icon icon={Clock} size="sm" />
            Start/End Time
          </SegmentedControlItem>
        </SegmentedControl>

        {/* Date */}
        <form.Field name="date">
          {(field) => (
            <Input
              id="time-entry-date"
              type="date"
              label="Date *"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              max={formatDateForInput(Date.now())}
              required
            />
          )}
        </form.Field>

        {/* Duration Mode */}
        {entryMode === "duration" && (
          <form.Field name="durationInput">
            {(field) => (
              <Stack gap="sm">
                <Input
                  id="time-entry-duration"
                  type="text"
                  label="Duration *"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., 1:30, 1.5, 1h 30m, 90m"
                  helperText="Accepts: 1:30, 1.5, 1h 30m, 90m"
                  error={
                    isDurationInputValid
                      ? undefined
                      : "Invalid format. Try: 1:30, 1.5, 1h 30m, or 90m"
                  }
                />

                {/* Quick Increment Buttons */}
                <Flex gap="sm">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickIncrement(15)}
                  >
                    +15m
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickIncrement(30)}
                  >
                    +30m
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickIncrement(60)}
                  >
                    +1h
                  </Button>
                  {durationSeconds > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDurationSeconds(0);
                        field.handleChange("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </Flex>

                {/* Duration Display */}
                {durationSeconds > 0 && <DurationSummary durationSeconds={durationSeconds} />}
              </Stack>
            )}
          </form.Field>
        )}

        {/* Time Range Mode */}
        {entryMode === "timeRange" && (
          <Stack gap="md">
            <Grid cols={2} gap="lg">
              <form.Field name="startTime">
                {(field) => (
                  <Input
                    id="time-entry-start"
                    type="time"
                    label="Start Time *"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                )}
              </form.Field>
              <form.Field name="endTime">
                {(field) => (
                  <Input
                    id="time-entry-end"
                    type="time"
                    label="End Time *"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                )}
              </form.Field>
            </Grid>

            {/* Duration Display */}
            {timeRangeDuration > 0 && <DurationSummary durationSeconds={timeRangeDuration} />}
          </Stack>
        )}

        {/* Project Selection */}
        <Stack gap="xs">
          <Label htmlFor="time-entry-project">Project</Label>
          <Select
            value={projectId || "none"}
            onValueChange={(value) => {
              setProjectId(value === "none" ? undefined : (value as Id<"projects">));
              setIssueId(undefined);
            }}
          >
            <SelectTrigger id="time-entry-project" className="w-full">
              <SelectValue placeholder="Select project..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects?.page?.map((project: ProjectItem) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Stack>

        {/* Issue Selection */}
        {projectId && projectIssues && projectIssues.length > 0 && (
          <Stack gap="xs">
            <Label htmlFor="time-entry-issue">Issue (optional)</Label>
            <Select
              value={issueId || "none"}
              onValueChange={(value) =>
                setIssueId(value === "none" ? undefined : (value as Id<"issues">))
              }
            >
              <SelectTrigger id="time-entry-issue" className="w-full">
                <SelectValue placeholder="Select issue..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No issue</SelectItem>
                {projectIssues.map((issue: IssueItem) => (
                  <SelectItem key={issue._id} value={issue._id}>
                    {issue.key} - {issue.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Stack>
        )}

        {/* Description */}
        <form.Field name="description">
          {(field) => (
            <FormTextarea
              field={field}
              label="Description"
              placeholder="What did you work on?"
              rows={3}
            />
          )}
        </form.Field>

        {/* Activity */}
        <form.Field name="activity">
          {(field) => (
            <Stack gap="xs">
              <Label htmlFor="time-entry-activity">Activity</Label>
              <Select
                value={field.state.value || "none"}
                onValueChange={(value) => field.handleChange(value === "none" ? "" : value)}
              >
                <SelectTrigger id="time-entry-activity" className="w-full">
                  <SelectValue placeholder="Select activity..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select activity...</SelectItem>
                  {ACTIVITY_TYPES.map((activityType) => (
                    <SelectItem key={activityType} value={activityType}>
                      {activityType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Stack>
          )}
        </form.Field>

        {/* Tags */}
        <Stack gap="sm">
          <Label htmlFor="time-entry-tags">Tags</Label>
          <Flex gap="sm">
            <FlexItem flex="1">
              <Input
                id="time-entry-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag..."
              />
            </FlexItem>
            <Button onClick={handleAddTag} variant="secondary" size="sm" type="button">
              Add
            </Button>
          </Flex>
          {tags.length > 0 && (
            <Flex gap="sm" wrap>
              {tags.map((tag) => (
                <Badge key={tag} variant="brand" shape="pill">
                  <Flex as="span" inline align="center" gap="xs">
                    <span>{tag}</span>
                    <IconButton
                      variant="brand"
                      size="xs"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      type="button"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </IconButton>
                  </Flex>
                </Badge>
              ))}
            </Flex>
          )}
        </Stack>

        {/* Billable */}
        <form.Field name="billable">
          {(field) => (
            <Checkbox
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
              label="Billable time"
              helperText="Mark this time as billable to clients"
            />
          )}
        </form.Field>

        {/* Footer with form state - kept inside children */}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Flex justify="end" gap="sm">
              <Button onClick={() => onOpenChange(false)} variant="secondary" type="button">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={effectiveDuration <= 0}
                isLoading={isSubmitting}
              >
                Create Entry
              </Button>
            </Flex>
          )}
        </form.Subscribe>
      </form>
    </Dialog>
  );
}
