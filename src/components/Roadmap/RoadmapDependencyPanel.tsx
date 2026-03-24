/**
 * Dependency visualization and management components for the Roadmap view.
 * Includes SVG dependency line rendering, dependency section lists,
 * and the dependency panel with add/remove controls.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { LinkIcon, Plus, X } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import type { DependencyLine, RoadmapDependencyItem, RoadmapIssue } from "./types";
import { ROADMAP_DEPENDENCY_TARGET_NONE } from "./types";
import {
  getDependencyLineOpacity,
  getDependencyLineStrokeWidth,
  getDependencyPath,
  isDependencyLineFocused,
} from "./utils";

export function renderDependencyLine(line: DependencyLine, activeIssueId: string | null) {
  const dependencyFocused = isDependencyLineFocused(line, activeIssueId);
  const hasActiveIssue = activeIssueId !== null;

  return (
    <path
      key={`${line.fromIssueId}-${line.toIssueId}`}
      d={getDependencyPath(line)}
      fill="none"
      stroke="var(--color-status-warning)"
      strokeWidth={getDependencyLineStrokeWidth(hasActiveIssue, dependencyFocused)}
      strokeDasharray="4 2"
      markerEnd="url(#arrowhead)"
      opacity={getDependencyLineOpacity(hasActiveIssue, dependencyFocused)}
    />
  );
}

export function RoadmapDependencySection({
  canEdit,
  emptyLabel,
  items,
  onFocusIssue,
  onRemove,
  removeLabelPrefix,
  title,
}: {
  canEdit: boolean;
  emptyLabel: string;
  items: RoadmapDependencyItem[];
  onFocusIssue: (issueId: Id<"issues">) => void;
  onRemove: (linkId: Id<"issueLinks">) => void;
  removeLabelPrefix: string;
  title: string;
}) {
  return (
    <Stack gap="sm" className="min-w-0 flex-1">
      <Flex align="center" justify="between" gap="sm">
        <Typography variant="label">{title}</Typography>
        <Badge variant="secondary" shape="pill">
          {items.length}
        </Badge>
      </Flex>

      {items.length === 0 ? (
        <Card padding="sm" variant="ghost">
          <Typography variant="caption" color="secondary">
            {emptyLabel}
          </Typography>
        </Card>
      ) : (
        <Stack gap="sm">
          {items.map((item) => (
            <Card recipe="dependencyRow" padding="sm" key={item.linkId}>
              <Flex align="center" justify="between" gap="sm">
                <Button
                  variant="unstyled"
                  className="min-w-0 flex-1 truncate p-0 text-left"
                  onClick={() => onFocusIssue(item.issue._id)}
                >
                  <Flex direction="column" align="start" gap="xs" className="min-w-0">
                    <Typography variant="label" className="truncate">
                      {item.issue.key}
                    </Typography>
                    <Typography variant="caption" color="secondary" className="truncate">
                      {item.issue.title}
                    </Typography>
                  </Flex>
                </Button>
                {canEdit ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(item.linkId)}
                    aria-label={`${removeLabelPrefix} ${item.issue.key}`}
                    title={`${removeLabelPrefix} ${item.issue.key}`}
                  >
                    <Icon icon={X} size="sm" />
                  </Button>
                ) : null}
              </Flex>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function RoadmapDependencyPanel({
  activeIssue,
  availableTargetIssues,
  blockedBy,
  blocks,
  canEdit,
  onFocusIssue,
}: {
  activeIssue: RoadmapIssue;
  availableTargetIssues: RoadmapIssue[];
  blockedBy: RoadmapDependencyItem[];
  blocks: RoadmapDependencyItem[];
  canEdit: boolean;
  onFocusIssue: (issueId: Id<"issues">) => void;
}) {
  const [dependencyTargetIssueId, setDependencyTargetIssueId] = useState<
    Id<"issues"> | typeof ROADMAP_DEPENDENCY_TARGET_NONE
  >(ROADMAP_DEPENDENCY_TARGET_NONE);
  const { mutate: createIssueLink } = useAuthenticatedMutation(api.issueLinks.create);
  const { mutate: removeIssueLink } = useAuthenticatedMutation(api.issueLinks.remove);

  const handleAddDependency = async () => {
    if (dependencyTargetIssueId === ROADMAP_DEPENDENCY_TARGET_NONE) {
      return;
    }

    try {
      await createIssueLink({
        fromIssueId: activeIssue._id,
        toIssueId: dependencyTargetIssueId,
        linkType: "blocks",
      });
      showSuccess("Blocking dependency added");
      setDependencyTargetIssueId(ROADMAP_DEPENDENCY_TARGET_NONE);
    } catch (error) {
      showError(error, "Failed to add blocking dependency");
    }
  };

  const handleRemoveDependency = async (linkId: Id<"issueLinks">) => {
    try {
      await removeIssueLink({ linkId });
      showSuccess("Blocking dependency removed");
    } catch (error) {
      showError(error, "Failed to remove blocking dependency");
    }
  };

  return (
    <Card
      variant="default"
      padding="md"
      className="mb-4 shrink-0"
      data-testid={TEST_IDS.ROADMAP.DEPENDENCY_PANEL}
    >
      <Stack gap="md">
        <Flex align="center" justify="between" gap="md" wrap>
          <Stack gap="xs">
            <Flex align="center" gap="sm">
              <Icon icon={LinkIcon} size="sm" />
              <Typography variant="label">Dependencies for {activeIssue.key}</Typography>
            </Flex>
            <Typography variant="caption" color="secondary">
              Manage visible roadmap blockers without leaving the timeline.
            </Typography>
          </Stack>

          {canEdit ? (
            <Flex align="center" gap="sm" wrap>
              <Select
                value={dependencyTargetIssueId}
                onValueChange={(value) =>
                  setDependencyTargetIssueId(
                    value === ROADMAP_DEPENDENCY_TARGET_NONE
                      ? ROADMAP_DEPENDENCY_TARGET_NONE
                      : (value as Id<"issues">),
                  )
                }
              >
                <SelectTrigger width="64">
                  <SelectValue placeholder="Issue this blocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROADMAP_DEPENDENCY_TARGET_NONE}>Select issue</SelectItem>
                  {availableTargetIssues.map((issue) => (
                    <SelectItem key={issue._id} value={issue._id}>
                      {issue.key} · {issue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void handleAddDependency();
                }}
                disabled={
                  dependencyTargetIssueId === ROADMAP_DEPENDENCY_TARGET_NONE ||
                  availableTargetIssues.length === 0
                }
                aria-label="Add blocked issue"
              >
                <Icon icon={Plus} size="sm" />
                Add blocked issue
              </Button>
            </Flex>
          ) : null}
        </Flex>

        <Flex gap="md" wrap>
          <RoadmapDependencySection
            canEdit={canEdit}
            title="Blocks"
            items={blocks}
            emptyLabel="This issue does not block any visible roadmap items yet."
            onFocusIssue={onFocusIssue}
            onRemove={handleRemoveDependency}
            removeLabelPrefix="Remove blocked issue"
          />
          <RoadmapDependencySection
            canEdit={canEdit}
            title="Blocked by"
            items={blockedBy}
            emptyLabel="No visible roadmap blockers yet."
            onFocusIssue={onFocusIssue}
            onRemove={handleRemoveDependency}
            removeLabelPrefix="Remove blocker"
          />
        </Flex>
      </Stack>
    </Card>
  );
}
