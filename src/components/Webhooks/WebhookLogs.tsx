import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { useState } from "react";
import { BarChart3, Check, RefreshCw, X } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { Metadata, MetadataItem } from "../ui/Metadata";
import { Typography } from "../ui/Typography";

type WebhookExecution = Doc<"webhookExecutions">;
type PaginatedQuery = FunctionReference<"query", "public">;

interface WebhookLogsProps {
  webhookId: Id<"webhooks">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookLogs({ webhookId, open, onOpenChange }: WebhookLogsProps) {
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  const { results: executions } = usePaginatedQuery(
    api.webhooks.listExecutions as PaginatedQuery,
    { webhookId },
    { initialNumItems: 50 },
  ) as { results: WebhookExecution[] };
  const retryExecution = useMutation(api.webhooks.retryExecution);

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
            <Icon icon={Check} size="xs" className="inline mr-1" /> Success
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="error" shape="pill">
            <Icon icon={X} size="xs" className="inline mr-1" /> Failed
          </Badge>
        );
      case "retrying":
        return (
          <Badge variant="warning" shape="pill">
            <Icon icon={RefreshCw} size="xs" className="inline mr-1" /> Retrying
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

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Webhook Delivery Logs"
      description="View recent webhook delivery attempts and their status"
      className="sm:max-w-5xl"
    >
      {!executions || executions.length === 0 ? (
        <div className="text-center py-12">
          <Icon icon={BarChart3} size="xl" className="mx-auto mb-3 text-ui-text-tertiary" />
          <Typography variant="h5" className="mb-1">
            No delivery logs yet
          </Typography>
          <Typography variant="caption">
            Webhook deliveries will appear here once triggered
          </Typography>
        </div>
      ) : (
        <div className="space-y-4">
          <Typography variant="caption" className="mb-4">
            Showing {executions.length} most recent deliveries
          </Typography>

          <div className="space-y-3">
            {executions.map((execution) => (
              <div
                key={execution._id}
                className="border border-ui-border rounded-lg p-4 hover:border-ui-border-secondary transition-colors"
              >
                {/* Header */}
                <Flex justify="between" align="center" className="mb-3">
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
                      <Button variant="ghost" size="sm" onClick={() => handleRetry(execution._id)}>
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
                <Grid cols={3} gap="lg" className="mb-2">
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
                  <div className="bg-status-error-bg border border-status-error/30 rounded p-3 mt-3">
                    <Typography variant="caption" className="text-status-error-text mb-1">
                      Error:
                    </Typography>
                    <Typography variant="mono" className="text-status-error-text/90">
                      {String(execution.error)}
                    </Typography>
                  </div>
                )}

                {/* Expandable Details */}
                {selectedExecution === execution._id && (
                  <div className="mt-3 pt-3 border-t border-ui-border space-y-3">
                    {/* Request Payload */}
                    <div>
                      <Typography variant="label" className="mb-1">
                        Request Payload:
                      </Typography>
                      <pre className="bg-ui-bg-secondary border border-ui-border rounded p-3 text-xs overflow-x-auto">
                        {JSON.stringify(JSON.parse(execution.requestPayload), null, 2)}
                      </pre>
                    </div>

                    {/* Response Body */}
                    {execution.responseBody && (
                      <div>
                        <Typography variant="label" className="mb-1">
                          Response Body:
                        </Typography>
                        <pre className="bg-ui-bg-secondary border border-ui-border rounded p-3 text-xs overflow-x-auto max-h-48">
                          {execution.responseBody}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Dialog>
  );
}
