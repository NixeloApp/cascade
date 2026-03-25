/**
 * Create Event Modal
 *
 * Dialog form for creating calendar events with full configuration.
 * Supports event types, attendees, recurrence, and custom colors.
 * Integrates with Google Calendar for external event sync.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { FormInput, FormTextarea } from "@/lib/form";
import { doesOutOfOfficeOverlapTimeRange, formatOutOfOfficeDateRange } from "@/lib/outOfOffice";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Checkbox } from "../ui/Checkbox";
import { Dialog } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form/Input";
import { Grid } from "../ui/Grid";
import { Label } from "../ui/Label";
import { SegmentedControl, SegmentedControlItem } from "../ui/SegmentedControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
import {
  COLOR_PICKER_CLASSES,
  EVENT_TYPE_DEFAULT_COLOR,
  type EventColor,
  PALETTE_COLORS,
} from "./calendar-colors";

// =============================================================================
// Schema
// =============================================================================

const eventTypes = ["meeting", "deadline", "timeblock", "personal"] as const;

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  startDate: z.string().min(1, "Date is required"),
  startTime: z.string(),
  endTime: z.string(),
  allDay: z.boolean(),
  eventType: z.enum(eventTypes),
  location: z.string(),
  meetingUrl: z.union([z.string().url(), z.literal("")]),
  isRequired: z.boolean(),
});

// =============================================================================
// Component
// =============================================================================

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  projectId?: Id<"projects">;
  issueId?: Id<"issues">;
}

/**
 * Modal for creating calendar events with date/time pickers and project linking.
 */
export function CreateEventModal({
  open,
  onOpenChange,
  defaultDate = new Date(),
  projectId,
  issueId,
}: CreateEventModalProps) {
  const { mutate: createEvent } = useAuthenticatedMutation(api.calendarEvents.create);
  const projects = useAuthenticatedQuery(api.projects.getCurrentUserProjects, {});
  const outOfOffice = useAuthenticatedQuery(api.outOfOffice.getCurrent, {});

  // Project selection (uses Radix Select, kept outside form)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<Id<"projects"> | undefined>(
    projectId,
  );
  const [selectedColor, setSelectedColor] = useState<EventColor | undefined>(undefined);

  type CreateEventForm = z.infer<typeof createEventSchema>;

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      startDate: `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, "0")}-${String(defaultDate.getDate()).padStart(2, "0")}`,
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      eventType: "meeting" as CreateEventForm["eventType"],
      location: "",
      meetingUrl: "",
      isRequired: false,
    },
    validators: { onChange: createEventSchema },
    onSubmit: async ({ value }: { value: CreateEventForm }) => {
      try {
        // Parse start and end times
        const [startHour, startMinute] = value.startTime.split(":").map(Number);
        const [endHour, endMinute] = value.endTime.split(":").map(Number);

        const startDateTime = new Date(`${value.startDate}T00:00:00`);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        const endDateTime = new Date(`${value.startDate}T00:00:00`);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        await createEvent({
          title: value.title,
          description: value.description || undefined,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          allDay: value.allDay,
          location: value.location || undefined,
          eventType: value.eventType,
          meetingUrl: value.meetingUrl || undefined,
          projectId: selectedWorkspaceId,
          issueId,
          attendeeIds: [],
          isRequired: value.eventType === "meeting" ? value.isRequired : undefined,
          color: selectedColor,
        });

        showSuccess("Event created successfully");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to create event");
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Event"
      description="Add a new event to your calendar"
      size="lg"
      data-testid={TEST_IDS.CALENDAR.CREATE_EVENT_MODAL}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Subscribe selector={(state) => state.values}>
          {({ eventType, allDay, isRequired, startDate, startTime, endTime }) => {
            const draftStart = new Date(`${startDate}T00:00:00`);
            const draftEnd = new Date(`${startDate}T00:00:00`);

            if (allDay) {
              draftStart.setHours(0, 0, 0, 0);
              draftEnd.setHours(23, 59, 59, 999);
            } else {
              const [startHour, startMinute] = startTime.split(":").map(Number);
              const [endHour, endMinute] = endTime.split(":").map(Number);
              draftStart.setHours(startHour, startMinute, 0, 0);
              draftEnd.setHours(endHour, endMinute, 0, 0);
            }

            const overlapsOutOfOffice = doesOutOfOfficeOverlapTimeRange(
              outOfOffice,
              draftStart.getTime(),
              draftEnd.getTime(),
            );
            const overlappingOutOfOffice = overlapsOutOfOffice ? outOfOffice : null;

            return (
              <Card variant="ghost" padding="lg" radius="none">
                <Stack gap="lg">
                  {overlappingOutOfOffice ? (
                    <Alert variant="warning">
                      <AlertTitle>Out of office</AlertTitle>
                      <AlertDescription>
                        This event overlaps your OOO window (
                        {formatOutOfOfficeDateRange(overlappingOutOfOffice)}
                        ). Pick a time outside that range.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {/* Title */}
                  <form.Field name="title">
                    {(field) => (
                      <FormInput
                        field={field}
                        label="Event Title *"
                        placeholder="Team standup, Client call, etc."
                        required
                      />
                    )}
                  </form.Field>

                  {/* Event Type */}
                  <Stack gap="xs">
                    <Label>Event Type</Label>
                    <SegmentedControl
                      value={eventType}
                      onValueChange={(value: string) => {
                        if (!eventTypes.includes(value as (typeof eventTypes)[number])) {
                          return;
                        }

                        const nextType = value as CreateEventForm["eventType"];
                        form.setFieldValue("eventType", nextType);
                        if (!selectedColor) {
                          setSelectedColor(EVENT_TYPE_DEFAULT_COLOR[nextType]);
                        }
                      }}
                      width="fill"
                      wrap
                    >
                      {eventTypes.map((type) => (
                        <SegmentedControlItem
                          key={type}
                          value={type}
                          width="fill"
                          className="capitalize"
                        >
                          {type}
                        </SegmentedControlItem>
                      ))}
                    </SegmentedControl>
                  </Stack>

                  {/* Color */}
                  <Stack gap="xs">
                    <Label>Color</Label>
                    <Flex gap="sm" wrap>
                      {PALETTE_COLORS.map((color) => {
                        const isActive =
                          (selectedColor ?? EVENT_TYPE_DEFAULT_COLOR[eventType as string]) ===
                          color;
                        return (
                          <Button
                            key={color}
                            chrome="colorSwatch"
                            chromeSize="colorSwatch"
                            onClick={() => setSelectedColor(color)}
                            className={cn(
                              COLOR_PICKER_CLASSES[color].bg,
                              isActive
                                ? cn("ring-2 ring-offset-2", COLOR_PICKER_CLASSES[color].ring)
                                : undefined,
                            )}
                            title={color}
                            aria-label={`Select ${color} color`}
                            aria-pressed={isActive}
                          />
                        );
                      })}
                    </Flex>
                  </Stack>

                  {/* Date and Time */}
                  <Grid cols={3} gap="lg">
                    <div className="col-span-3 sm:col-span-1">
                      <form.Field name="startDate">
                        {(field) => (
                          <Input
                            id="event-date"
                            label="Date"
                            type="date"
                            value={field.state.value as string}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            required
                          />
                        )}
                      </form.Field>
                    </div>
                    <div>
                      <form.Field name="startTime">
                        {(field) => (
                          <Input
                            id="event-start-time"
                            label="Start Time"
                            type="time"
                            value={field.state.value as string}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            disabled={allDay as boolean}
                          />
                        )}
                      </form.Field>
                    </div>
                    <div>
                      <form.Field name="endTime">
                        {(field) => (
                          <Input
                            id="event-end-time"
                            label="End Time"
                            type="time"
                            value={field.state.value as string}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            disabled={allDay as boolean}
                          />
                        )}
                      </form.Field>
                    </div>
                  </Grid>

                  {/* All Day Toggle */}
                  <form.Field name="allDay">
                    {(field) => (
                      <Checkbox
                        id="event-all-day"
                        label="All day event"
                        checked={field.state.value as boolean}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                      />
                    )}
                  </form.Field>

                  {/* Required Attendance (only for meetings) */}
                  {eventType === "meeting" && (
                    <form.Field name="isRequired">
                      {(field) => (
                        <Checkbox
                          id="event-is-required"
                          label="Required attendance"
                          description={
                            isRequired
                              ? "Admins can mark who attended, was tardy, or missed"
                              : undefined
                          }
                          checked={field.state.value as boolean}
                          onCheckedChange={(checked) => field.handleChange(checked === true)}
                        />
                      )}
                    </form.Field>
                  )}

                  {/* Description */}
                  <form.Field name="description">
                    {(field) => (
                      <FormTextarea
                        field={field}
                        label="Description"
                        rows={3}
                        placeholder="Add notes, agenda, or details..."
                      />
                    )}
                  </form.Field>

                  {/* Location */}
                  <form.Field name="location">
                    {(field) => (
                      <Input
                        id="event-location"
                        label="Location"
                        type="text"
                        value={(field.state.value as string) ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Office, Zoom, Google Meet, etc."
                      />
                    )}
                  </form.Field>

                  {/* Meeting URL */}
                  {eventType === "meeting" && (
                    <form.Field name="meetingUrl">
                      {(field) => (
                        <Input
                          id="event-meeting-url"
                          label="Meeting Link"
                          type="url"
                          value={(field.state.value as string) ?? ""}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="https://zoom.us/j/..."
                        />
                      )}
                    </form.Field>
                  )}

                  {/* Link to Project */}
                  <Stack gap="xs">
                    <Label htmlFor="event-project">Link to Project</Label>
                    <Select
                      value={selectedWorkspaceId || "none"}
                      onValueChange={(value) =>
                        setSelectedWorkspaceId(
                          value === "none" ? undefined : (value as Id<"projects">),
                        )
                      }
                    >
                      <SelectTrigger id="event-project">
                        <SelectValue placeholder="No project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects?.page?.map((project) => (
                          <SelectItem key={project._id} value={project._id}>
                            {project.name} ({project.key})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Stack>

                  {/* Actions - Keep inside form.Subscribe to access isSubmitting */}
                  <Flex justify="end" gap="sm" pt="md" className="border-t border-ui-border">
                    <form.Subscribe selector={(state) => state.isSubmitting}>
                      {(isSubmitting) => (
                        <>
                          <Button onClick={() => onOpenChange(false)} variant="secondary">
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting}
                            disabled={overlapsOutOfOffice}
                          >
                            {isSubmitting ? "Creating..." : "Create Event"}
                          </Button>
                        </>
                      )}
                    </form.Subscribe>
                  </Flex>
                </Stack>
              </Card>
            );
          }}
        </form.Subscribe>
      </form>
    </Dialog>
  );
}
