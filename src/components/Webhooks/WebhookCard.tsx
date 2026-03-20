import type { Id } from "@convex/_generated/dataModel";
import { Pencil, Trash } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface WebhookCardProps {
  webhook: {
    _id: Id<"webhooks">;
    name: string;
    url: string;
    isActive: boolean;
    events: string[];
    lastTriggered?: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Displays a single webhook configuration
 * Extracted from WebhooksManager for better reusability
 */
export function WebhookCard({ webhook, onEdit, onDelete }: WebhookCardProps) {
  return (
    <Card padding="md" variant="flat" hoverable>
      <Flex justify="between" align="start" gap="lg">
        <FlexItem flex="1">
          <Stack gap="sm">
            <Flex gap="sm" align="center">
              <Typography variant="h4">{webhook.name}</Typography>
              <Badge variant={webhook.isActive ? "success" : "neutral"} size="sm">
                {webhook.isActive ? "Active" : "Inactive"}
              </Badge>
            </Flex>
            <Typography variant="monoWrap">{webhook.url}</Typography>
            <Flex wrap gap="xs">
              {webhook.events.map((event) => (
                <Badge key={event} variant="brand" size="sm">
                  {event}
                </Badge>
              ))}
            </Flex>
            {webhook.lastTriggered && (
              <Typography variant="meta" color="tertiary">
                Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
              </Typography>
            )}
          </Stack>
        </FlexItem>

        <Flex gap="sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            leftIcon={<Icon icon={Pencil} size="sm" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            leftIcon={<Icon icon={Trash} size="sm" />}
          >
            Delete
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
