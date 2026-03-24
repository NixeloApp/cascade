/**
 * Webhook Logs
 *
 * Dialog showing webhook execution history.
 * Displays success/failure status and response details.
 * Supports retrying failed webhook deliveries.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { usePaginatedQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { BarChart3, Check, RefreshCw, X } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { CardSection } from "../ui/CardSection";
import { Dialog } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { Metadata, MetadataItem } from "../ui/Metadata";
import { ScrollArea } from "../ui/ScrollArea";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type WebhookExecution = Doc<"webhookExecutions">;
type PaginatedQuery = FunctionReference<"query", "public">;

interface WebhookLogsProps {
  webhookId: Id<"webhooks">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Dialog showing webhook execution history with retry option. */
export function WebhookLogs({ webhookId, open, onOpenChange }: WebhookLogsProps) {
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  const { results: executions } = usePaginatedQuery(
    api.webhooks.listExecutions as PaginatedQuery,
    { webhookId },
    { initialNumItems: 50 },
  ) as { results: WebhookExecution[] };
  const { mutate: retryExecution } = useAuthenticatedMutation(api.webhooks.retryExecution);

  const handleRetry = async (executionId: Id<"webhookExecutions">) => {
    try {
      await retryExecution({ id: executionId });
      showSuccess("Webhook delivery queued for retry");
    } catch (error) {
      showError(error, "Failed to retry webhook");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="success" shape="pill">
            <Icon icon={Check} size="xs" inline /> Success
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="error" shape="pill">
            <Icon icon={X} size="xs" inline /> Failed
          </Badge>
        );
      case "retrying":
        return (
          <Badge variant="warning" shape="pill">
            <Icon icon={RefreshCw} size="xs" inline /> Retrying
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (createdAt: number, completedAt?: number) => {
    if (!completedAt) return "-";
    const duration = completedAt - createdAt;
    return `${duration}ms`;
  };

  const formatJson = (payload: string) => {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Webhook Delivery Logs"
      description="View recent webhook delivery attempts and their status"
      size="2xl"
    >
      {!executions || executions.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No delivery logs yet"
          description="Webhook deliveries will appear here once triggered"
          surface="bare"
        />
      ) : (
        <Stack gap="md">
          <Typography variant="caption">
            Showing {executions.length} most recent deliveries
          </Typography>

          <Stack gap="sm">
            {executions.map((execution) => (
              <Card key={execution._id} padding="md" hoverable>
                <Stack gap="md">
                  {/* Header */}
                  <Flex justify="between" align="center">
                    <Metadata gap="md">
                      {getStatusBadge(execution.status)}
                      <MetadataItem className="text-ui-text">{execution.event}</MetadataItem>
                      {execution.responseStatus && (
                        <MetadataItem>HTTP {String(execution.responseStatus)}</MetadataItem>
                      )}
                    </Metadata>
                    <Metadata gap="md">
                      <MetadataItem>{formatDate(execution._creationTime)}</MetadataItem>
                      {execution.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(execution._id)}
                        >
                          Retry
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedExecution(
                            selectedExecution === execution._id ? null : execution._id,
                          )
                        }
                      >
                        {selectedExecution === execution._id ? "Hide Details" : "Show Details"}
                      </Button>
                    </Metadata>
                  </Flex>

                  {/* Metadata */}
                  <Grid cols={3} gap="lg">
                    <Typography variant="meta">
                      <Typography variant="label" as="span" className="text-ui-text">
                        Attempts:
                      </Typography>{" "}
                      {execution.attempts}
                    </Typography>
                    <Typography variant="meta">
                      <Typography variant="label" as="span" className="text-ui-text">
                        Duration:
                      </Typography>{" "}
                      {formatDuration(execution._creationTime, execution.completedAt)}
                    </Typography>
                    <Typography variant="meta">
                      <Typography variant="label" as="span" className="text-ui-text">
                        Status:
                      </Typography>{" "}
                      {String(execution.status)}
                    </Typography>
                  </Grid>

                  {/* Error message */}
                  {execution.error && (
                    <CardSection
                      size="compact"
                      className="border border-status-error/30 bg-status-error-bg"
                    >
                      <Stack gap="xs">
                        <Typography variant="caption" className="text-status-error-text">
                          Error:
                        </Typography>
                        <Typography variant="mono" className="text-status-error-text/90">
                          {String(execution.error)}
                        </Typography>
                      </Stack>
                    </CardSection>
                  )}

                  {/* Expandable Details */}
                  {selectedExecution === execution._id && (
                    <Stack gap="sm" className="border-t border-ui-border pt-ui-card-padding">
                      {/* Request Payload */}
                      <Stack gap="xs">
                        <Typography variant="label">Request Payload:</Typography>
                        <CardSection size="compact" className="overflow-x-auto">
                          <Typography as="pre" variant="mono">
                            {formatJson(execution.requestPayload)}
                          </Typography>
                        </CardSection>
                      </Stack>

                      {/* Response Body */}
                      {execution.responseBody && (
                        <Stack gap="xs">
                          <Typography variant="label">Response Body:</Typography>
                          <CardSection size="compact" className="overflow-x-auto">
                            <ScrollArea size="contentSm">
                              <Typography as="pre" variant="mono">
                                {execution.responseBody}
                              </Typography>
                            </ScrollArea>
                          </CardSection>
                        </Stack>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        </Stack>
      )}
    </Dialog>
  );
}
