import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";
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

export function OutOfOfficeSettings() {
  const status = useAuthenticatedQuery(api.outOfOffice.getCurrent, {});
  const { mutate: saveOutOfOffice } = useAuthenticatedMutation(api.outOfOffice.upsert);
  const { mutate: clearOutOfOffice } = useAuthenticatedMutation(api.outOfOffice.clear);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState<keyof typeof OUT_OF_OFFICE_REASON_LABELS>("vacation");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!status) {
      setStartDate("");
      setEndDate("");
      setReason("vacation");
      setNote("");
      return;
    }

    setStartDate(new Date(status.startsAt).toISOString().split("T")[0] ?? "");
    setEndDate(new Date(status.endsAt).toISOString().split("T")[0] ?? "");
    setReason(status.reason);
    setNote(status.note ?? "");
  }, [status]);

  const handleSave = async () => {
    if (!startDate || !endDate) {
      showError("Start and end dates are required");
      return;
    }

    try {
      await saveOutOfOffice({
        startsAt: parseStartDate(startDate),
        endsAt: parseEndDate(endDate),
        reason,
        note: note.trim() || undefined,
      });
      showSuccess("Out-of-office status saved");
    } catch (error) {
      showError(error, "Failed to save out-of-office status");
    }
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

        <Flex align="center" gap="sm" justify="between">
          <Typography variant="small" color="secondary">
            Redirects and calendar-level availability can build on top of this status later.
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
