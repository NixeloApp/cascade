import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Input, Select, Textarea } from "@/components/ui/form";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import {
  formatOutOfOfficeDateRange,
  getOutOfOfficeReasonLabel,
  OUT_OF_OFFICE_REASON_LABELS,
} from "@/lib/outOfOffice";
import { showError, showSuccess } from "@/lib/toast";

function parseStartDate(value: string): number {
  return new Date(`${value}T00:00:00`).getTime();
}

function parseEndDate(value: string): number {
  return new Date(`${value}T23:59:59.999`).getTime();
}

/** Format timestamp as YYYY-MM-DD in local timezone (matches parseStartDate/parseEndDate) */
function formatLocalDateForInput(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resetOutOfOfficeForm(setters: {
  setDelegateUserId: (value: Id<"users"> | "") => void;
  setEndDate: (value: string) => void;
  setNote: (value: string) => void;
  setReason: (value: keyof typeof OUT_OF_OFFICE_REASON_LABELS) => void;
  setStartDate: (value: string) => void;
}) {
  setters.setStartDate("");
  setters.setEndDate("");
  setters.setReason("vacation");
  setters.setNote("");
  setters.setDelegateUserId("");
}

function syncOutOfOfficeForm(
  status: ReturnType<typeof useAuthenticatedQuery<typeof api.outOfOffice.getCurrent>>,
  setters: {
    setDelegateUserId: (value: Id<"users"> | "") => void;
    setEndDate: (value: string) => void;
    setNote: (value: string) => void;
    setReason: (value: keyof typeof OUT_OF_OFFICE_REASON_LABELS) => void;
    setStartDate: (value: string) => void;
  },
) {
  if (!status) {
    resetOutOfOfficeForm(setters);
    return;
  }

  setters.setStartDate(formatLocalDateForInput(status.startsAt));
  setters.setEndDate(formatLocalDateForInput(status.endsAt));
  setters.setReason(status.reason);
  setters.setNote(status.note ?? "");
  setters.setDelegateUserId(status.delegate?._id ?? status.delegateUserId ?? "");
}

function buildDelegateOptions({
  currentUserId,
  searchableUsers,
  status,
}: {
  currentUserId: Id<"users"> | undefined;
  searchableUsers:
    | Array<{
        _id: Id<"users">;
        name?: string | undefined;
        email?: string | undefined;
        image?: string | undefined;
      }>
    | undefined;
  status: ReturnType<typeof useAuthenticatedQuery<typeof api.outOfOffice.getCurrent>>;
}) {
  const delegateOptions =
    searchableUsers
      ?.filter((user) => user._id !== currentUserId)
      .map((user) => ({
        _id: user._id,
        name: user.name ?? user.email ?? "Unknown",
        image: user.image,
      })) ?? [];

  const delegateId = status?.delegate?._id ?? status?.delegateUserId;
  const shouldIncludeDelegate = delegateId && delegateId !== currentUserId;
  if (!shouldIncludeDelegate || delegateOptions.some((user) => user._id === delegateId)) {
    return delegateOptions;
  }

  if (status?.delegate && status.delegate._id === delegateId) {
    delegateOptions.unshift(status.delegate);
    return delegateOptions;
  }

  const matchingUser = searchableUsers?.find((user) => user._id === delegateId);
  if (matchingUser) {
    delegateOptions.unshift({
      _id: matchingUser._id,
      name: matchingUser.name ?? matchingUser.email ?? "Unknown",
      image: matchingUser.image,
    });
  }

  return delegateOptions;
}

async function saveOutOfOfficeStatus({
  delegateUserId,
  endDate,
  note,
  reason,
  saveOutOfOffice,
  startDate,
}: {
  delegateUserId: Id<"users"> | "";
  endDate: string;
  note: string;
  reason: keyof typeof OUT_OF_OFFICE_REASON_LABELS;
  saveOutOfOffice: ReturnType<
    typeof useAuthenticatedMutation<typeof api.outOfOffice.upsert>
  >["mutate"];
  startDate: string;
}) {
  if (!startDate || !endDate) {
    showError("Start and end dates are required");
    return;
  }

  const startsAt = parseStartDate(startDate);
  const endsAt = parseEndDate(endDate);

  if (endsAt < startsAt) {
    showError("End date must be on or after start date");
    return;
  }

  try {
    await saveOutOfOffice({
      startsAt,
      endsAt,
      reason,
      note: note.trim() || undefined,
      delegateUserId: delegateUserId || undefined,
    });
    showSuccess("Out-of-office status saved");
  } catch (error) {
    showError(error, "Failed to save out-of-office status");
  }
}

/** Settings card for creating, updating, and clearing the current user's out-of-office window. */
export function OutOfOfficeSettings() {
  const status = useAuthenticatedQuery(api.outOfOffice.getCurrent, {});
  const currentUser = useAuthenticatedQuery(api.users.getCurrent, {});
  const searchableUsers = useAuthenticatedQuery(api.users.searchUsers, { query: "", limit: 50 });
  const { mutate: saveOutOfOffice } = useAuthenticatedMutation(api.outOfOffice.upsert);
  const { mutate: clearOutOfOffice } = useAuthenticatedMutation(api.outOfOffice.clear);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState<keyof typeof OUT_OF_OFFICE_REASON_LABELS>("vacation");
  const [note, setNote] = useState("");
  const [delegateUserId, setDelegateUserId] = useState<Id<"users"> | "">("");

  useEffect(() => {
    syncOutOfOfficeForm(status, {
      setStartDate,
      setEndDate,
      setReason,
      setNote,
      setDelegateUserId,
    });
  }, [status]);

  const delegateOptions = buildDelegateOptions({
    currentUserId: currentUser?._id,
    searchableUsers,
    status,
  });

  const handleSave = async () => {
    await saveOutOfOfficeStatus({
      delegateUserId,
      endDate,
      note,
      reason,
      saveOutOfOffice,
      startDate,
    });
  };

  const handleClear = async () => {
    try {
      await clearOutOfOffice({});
      showSuccess("Out-of-office status cleared");
    } catch (error) {
      showError(error, "Failed to clear out-of-office status");
    }
  };

  return (
    <Card padding="lg">
      <Stack gap="md">
        <Stack gap="xs">
          <Typography variant="h5">Out of Office</Typography>
          <Typography variant="small" color="secondary">
            Mark planned time away so assignee pickers and issue details flag availability risk.
          </Typography>
        </Stack>

        {status ? (
          <Card padding="md" variant="section">
            <Stack gap="xs">
              <Flex align="center" gap="sm">
                <Badge variant={status.isActive ? "warning" : "info"}>
                  {status.isActive ? "Active now" : "Scheduled"}
                </Badge>
                <Typography variant="label">{getOutOfOfficeReasonLabel(status.reason)}</Typography>
              </Flex>
              <Typography variant="small">{formatOutOfOfficeDateRange(status)}</Typography>
              {status.note ? (
                <Typography variant="small" color="secondary">
                  {status.note}
                </Typography>
              ) : null}
              {status.delegate ? (
                <Flex align="center" gap="sm">
                  <Avatar
                    name={status.delegate.name}
                    src={status.delegate.image}
                    size="xs"
                    variant="neutral"
                  />
                  <Typography variant="small" color="secondary">
                    Assignment delegate: {status.delegate.name}
                  </Typography>
                </Flex>
              ) : null}
            </Stack>
          </Card>
        ) : null}

        <Flex direction="column" directionSm="row" gap="md">
          <Input
            label="Start date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <Input
            label="End date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </Flex>

        <Select
          label="Reason"
          value={reason}
          onChange={(event) =>
            setReason(event.target.value as keyof typeof OUT_OF_OFFICE_REASON_LABELS)
          }
        >
          {Object.entries(OUT_OF_OFFICE_REASON_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Textarea
          label="Note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional context for teammates"
          helperText="Shown in assignment surfaces when your OOO window is active."
        />

        <Select
          label="Delegate assignments to"
          value={delegateUserId}
          onChange={(event) => setDelegateUserId(event.target.value as Id<"users"> | "")}
          helperText="When active, new issue assignments redirect to this teammate if they can access the project."
        >
          <option value="">No delegate</option>
          {delegateOptions.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </Select>

        <Flex align="center" gap="sm" justify="between">
          <Typography variant="small" color="secondary">
            Calendar availability can build on top of this status next.
          </Typography>
          <Flex gap="sm">
            {status ? (
              <Button type="button" variant="secondary" onClick={handleClear}>
                Clear
              </Button>
            ) : null}
            <Button type="button" onClick={handleSave}>
              Save OOO
            </Button>
          </Flex>
        </Flex>
      </Stack>
    </Card>
  );
}
