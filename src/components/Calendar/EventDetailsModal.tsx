/**
 * Event Details Modal
 *
 * Dialog for viewing and managing calendar event details.
 * Shows date/time, organizer, location, description, and meeting links.
 * Supports attendance tracking for required events and event deletion.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDate, formatTime } from "@/lib/formatting";
import { Calendar, Check, Clock, LinkIcon, MapPin, Trash2, X } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { MeetingRecordingSection } from "../MeetingRecordingSection";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Dialog } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { MetadataItem } from "../ui/Metadata";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Typography } from "../ui/Typography";
import { getEventBadgeClass } from "./calendar-colors";

interface AttendanceParticipant {
  userId: string;
  userName?: string;
  status?: "present" | "tardy" | "absent";
}

interface EventDetailsModalProps {
  eventId: Id<"calendarEvents">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal for viewing event details with attendance tracking and delete options.
 */
export function EventDetailsModal({ eventId, open, onOpenChange }: EventDetailsModalProps) {
  const event = useAuthenticatedQuery(api.calendarEvents.get, { id: eventId });
  const attendance = useAuthenticatedQuery(api.calendarEventsAttendance.getAttendance, { eventId });
  const { mutate: deleteEvent } = useAuthenticatedMutation(api.calendarEvents.remove);
  const { mutate: markAttendance } = useAuthenticatedMutation(
    api.calendarEventsAttendance.markAttendance,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!event) {
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="Event Details"
        size="lg"
        data-testid={TEST_IDS.CALENDAR.EVENT_DETAILS_MODAL}
      >
        <Card variant="ghost" padding="xl">
          <Flex justify="center">
            <LoadingSpinner size="lg" />
          </Flex>
        </Card>
      </Dialog>
    );
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteEvent({ id: eventId });
      showSuccess("Event deleted");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAttendance = async (
    userId: Id<"users">,
    status: "present" | "tardy" | "absent",
  ) => {
    setIsSavingAttendance(true);
    try {
      await markAttendance({ eventId, userId, status });
      showSuccess("Attendance marked");
    } catch (error) {
      showError(error, "Failed to mark attendance");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const getEventTypeColor = (eventType: string): string => {
    return getEventBadgeClass(eventType, event.color);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-status-success-bg text-status-success";
      case "tentative":
        return "bg-status-warning-bg text-status-warning";
      case "cancelled":
        return "bg-status-error-bg text-status-error";
      default:
        return "bg-ui-bg-tertiary text-ui-text-secondary";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={event.title}
      size="lg"
      data-testid={TEST_IDS.CALENDAR.EVENT_DETAILS_MODAL}
      footer={
        <>
          <Button
            onClick={() => setDeleteConfirmOpen(true)}
            variant="danger"
            isLoading={isDeleting}
            leftIcon={<Icon icon={Trash2} size="sm" />}
          >
            {isDeleting ? "Deleting..." : "Delete Event"}
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Close
          </Button>
        </>
      }
    >
      <Stack gap="lg">
        <Flex gap="sm" align="center">
          <Badge size="md" className={cn("capitalize", getEventTypeColor(event.eventType))}>
            {event.eventType}
          </Badge>
          <Badge size="md" className={cn("capitalize", getStatusColor(event.status))}>
            {event.status}
          </Badge>
        </Flex>

        <Stack gap="lg">
          <Flex gap="md" align="start">
            <Icon icon={Calendar} size="md" className="mt-0.5 text-ui-text-tertiary" />
            <Stack gap="xs">
              <Typography variant="label">
                {formatDate(event.startTime, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Typography>
              <Typography variant="caption">
                {event.allDay ? (
                  "All day"
                ) : (
                  <>
                    {formatTime(event.startTime, { hour: "numeric", minute: "2-digit" })} -{" "}
                    {formatTime(event.endTime, { hour: "numeric", minute: "2-digit" })}
                  </>
                )}
              </Typography>
            </Stack>
          </Flex>

          <Flex gap="md" align="start">
            <Avatar
              name={event.organizerName}
              email={event.organizerEmail}
              size="xs"
              variant="brand"
              className="mt-0.5"
            />
            <Stack gap="xs">
              <Typography variant="caption">Organizer</Typography>
              <Typography variant="label">{event.organizerName}</Typography>
              {event.organizerEmail && (
                <Typography variant="caption">{event.organizerEmail}</Typography>
              )}
            </Stack>
          </Flex>

          {event.description && (
            <Card recipe="eventDetailSection">
              <Stack gap="xs">
                <Typography variant="label">Description</Typography>
                <Typography variant="muted" className="whitespace-pre-wrap">
                  {event.description}
                </Typography>
              </Stack>
            </Card>
          )}

          {event.location && (
            <Card recipe="eventDetailSection">
              <Flex gap="md" align="start">
                <Icon icon={MapPin} size="md" className="mt-0.5 text-ui-text-tertiary" />
                <Stack gap="xs">
                  <Typography variant="caption">Location</Typography>
                  <Typography variant="label">{event.location}</Typography>
                </Stack>
              </Flex>
            </Card>
          )}

          {event.meetingUrl && (
            <Card recipe="eventDetailSection">
              <Flex gap="md" align="start">
                <Icon icon={LinkIcon} size="md" className="mt-0.5 text-ui-text-tertiary" />
                <Stack gap="xs" align="start">
                  <Typography variant="caption">Meeting Link</Typography>
                  <Button asChild variant="link" size="none">
                    <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                      Join Meeting
                    </a>
                  </Button>
                </Stack>
              </Flex>
            </Card>
          )}

          {event.notes && (
            <Card recipe="eventDetailSection">
              <Stack gap="xs">
                <Typography variant="label">Notes</Typography>
                <Typography variant="muted" className="whitespace-pre-wrap">
                  {event.notes}
                </Typography>
              </Stack>
            </Card>
          )}

          {event.isRecurring && (
            <Card recipe="eventDetailSection">
              <MetadataItem icon={<Icon icon={Clock} size="sm" />}>Recurring event</MetadataItem>
            </Card>
          )}

          {event.eventType === "meeting" && event.meetingUrl && (
            <MeetingRecordingSection
              calendarEventId={eventId}
              meetingUrl={event.meetingUrl}
              meetingTitle={event.title}
              scheduledStartTime={event.startTime}
            />
          )}

          {event.isRequired && attendance && (
            <Card recipe="eventDetailSection">
              <Stack gap="sm">
                <Flex justify="between" align="center">
                  <Typography variant="label">
                    Attendance ({attendance.markedCount}/{attendance.totalAttendees} marked)
                  </Typography>
                </Flex>

                <Stack gap="sm">
                  {attendance.attendees.map((attendee: AttendanceParticipant) => (
                    <div
                      key={attendee.userId}
                      className={getCardRecipeClassName("eventAttendanceRow")}
                    >
                      <Flex justify="between" align="center" gap="sm">
                        <Flex gap="sm" align="center" flex="1">
                          {attendee.status === "present" && (
                            <Icon icon={Check} size="sm" className="text-status-success" />
                          )}
                          {attendee.status === "tardy" && (
                            <Icon icon={Clock} size="sm" className="text-status-warning" />
                          )}
                          {attendee.status === "absent" && (
                            <Icon icon={X} size="sm" className="text-status-error" />
                          )}
                          {!attendee.status && (
                            <Icon icon={Clock} size="sm" className="opacity-0" aria-hidden="true" />
                          )}

                          <Typography as="span" variant="label">
                            {attendee.userName}
                          </Typography>
                        </Flex>

                        <Select
                          value={attendee.status || "none"}
                          onValueChange={(value) => {
                            if (value === "none") return;
                            handleMarkAttendance(
                              attendee.userId as Id<"users">,
                              value as "present" | "tardy" | "absent",
                            );
                          }}
                          disabled={isSavingAttendance}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Not marked" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not marked</SelectItem>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="tardy">Tardy</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                          </SelectContent>
                        </Select>
                      </Flex>
                    </div>
                  ))}
                </Stack>

                {attendance.totalAttendees === 0 && (
                  <Typography variant="muted" className="text-center">
                    No attendees added to this meeting
                  </Typography>
                )}
              </Stack>
            </Card>
          )}
        </Stack>
      </Stack>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Event"
        message="Are you sure you want to delete this event?"
        variant="danger"
        confirmLabel="Delete"
      />
    </Dialog>
  );
}
