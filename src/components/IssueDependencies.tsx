import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { X } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Tooltip } from "@/components/ui/Tooltip";
import { getTypeLabel, ISSUE_TYPE_ICONS, type IssueType } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Input, Select } from "./ui/form";
import { IconButton } from "./ui/IconButton";
import { Sheet } from "./ui/Sheet";
import { Typography } from "./ui/Typography";

type IssueLinkWithDetails = FunctionReturnType<
  typeof api.issueLinks.getForIssue
>["outgoing"][number];
type Issue = FunctionReturnType<typeof api.issues.search>["page"][number];

/** Reusable issue display: icon + key + title */
function IssueDisplay({
  type,
  issueKey,
  title,
}: {
  type: IssueType;
  issueKey: string;
  title: string;
}) {
  const typeLabel = getTypeLabel(type);
  return (
    <Flex as="span" align="center" gap="sm" className="min-w-0">
      <FlexItem as="span" shrink={false} title={typeLabel}>
        <Icon icon={ISSUE_TYPE_ICONS[type]} size="sm" aria-label={typeLabel} />
      </FlexItem>
      <Typography variant="mono" as="code" className="shrink-0 text-ui-text-secondary">
        {issueKey}
      </Typography>
      <Typography variant="small" as="span" className="truncate text-ui-text">
        {title}
      </Typography>
    </Flex>
  );
}

interface IssueDependenciesProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
}

export function IssueDependencies({ issueId, projectId: _workspaceId }: IssueDependenciesProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<{ id: Id<"issues">; key: string } | null>(
    null,
  );
  const [linkType, setLinkType] = useState<"blocks" | "relates" | "duplicates">("blocks");
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"issueLinks"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const links = useQuery(api.issueLinks.getForIssue, { issueId });
  // Backend excludes current issue - no client-side filtering needed
  const searchResults = useQuery(
    api.issues.search,
    searchQuery.length >= 2 ? { query: searchQuery, limit: 20, excludeIssueId: issueId } : "skip",
  );
  const createLink = useMutation(api.issueLinks.create);
  const removeLink = useMutation(api.issueLinks.remove);

  const handleAddLink = async () => {
    if (!selectedIssue) {
      showError("Please select an issue");
      return;
    }

    try {
      await createLink({
        fromIssueId: issueId,
        toIssueId: selectedIssue.id,
        linkType,
      });
      showSuccess("Dependency added");
      setShowAddDialog(false);
      setSelectedIssue(null);
      setSearchQuery("");
    } catch (error) {
      showError(error, "Failed to add dependency");
    }
  };

  const handleRemoveLink = async () => {
    if (!deleteConfirm) return;

    try {
      await removeLink({ linkId: deleteConfirm });
      showSuccess("Dependency removed");
    } catch (error) {
      showError(error, "Failed to remove dependency");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getLinkTypeLabel = (type: string, direction: "outgoing" | "incoming") => {
    if (direction === "outgoing") {
      switch (type) {
        case "blocks":
          return "Blocks";
        case "relates":
          return "Relates to";
        case "duplicates":
          return "Duplicates";
        default:
          return type;
      }
    } else {
      switch (type) {
        case "blocks":
          return "Blocked by";
        case "relates":
          return "Related by";
        case "duplicates":
          return "Duplicated by";
        default:
          return type;
      }
    }
  };

  return (
    <Stack gap="md">
      {/* Add Dependency Button */}
      <div>
        <Button onClick={() => setShowAddDialog(true)} size="sm" variant="secondary">
          + Add Dependency
        </Button>
      </div>

      {/* Outgoing Links */}
      {links && links.outgoing.length > 0 && (
        <Stack gap="sm">
          <Typography variant="label">Dependencies</Typography>
          <Stack gap="sm">
            {links.outgoing.map((link: IssueLinkWithDetails) => (
              <Card padding="sm" key={link._id} className="bg-ui-bg-secondary">
                <Flex align="center" justify="between">
                  <Flex align="center" gap="md" className="flex-1 min-w-0">
                    <Badge variant="brand" size="md">
                      {getLinkTypeLabel(link.linkType, "outgoing")}
                    </Badge>
                    {link.issue && (
                      <IssueDisplay
                        type={link.issue.type}
                        issueKey={link.issue.key}
                        title={link.issue.title}
                      />
                    )}
                  </Flex>
                  <Tooltip content="Remove dependency">
                    <IconButton
                      variant="danger"
                      size="xs"
                      onClick={() => setDeleteConfirm(link._id)}
                      aria-label="Remove dependency"
                    >
                      <X className="h-3.5 w-3.5" />
                    </IconButton>
                  </Tooltip>
                </Flex>
              </Card>
            ))}
          </Stack>
        </Stack>
      )}

      {/* Incoming Links */}
      {links && links.incoming.length > 0 && (
        <Stack gap="sm">
          <Typography variant="label">Referenced By</Typography>
          <Stack gap="sm">
            {links.incoming.map((link: IssueLinkWithDetails) => (
              <Card padding="sm" key={link._id} className="bg-ui-bg-secondary">
                <Flex align="center" justify="between">
                  <Flex align="center" gap="md" className="flex-1 min-w-0">
                    <Badge variant="accent" size="md">
                      {getLinkTypeLabel(link.linkType, "incoming")}
                    </Badge>
                    {link.issue && (
                      <IssueDisplay
                        type={link.issue.type}
                        issueKey={link.issue.key}
                        title={link.issue.title}
                      />
                    )}
                  </Flex>
                  <Tooltip content="Remove dependency">
                    <IconButton
                      variant="danger"
                      size="xs"
                      onClick={() => setDeleteConfirm(link._id)}
                      aria-label="Remove dependency"
                    >
                      <X className="h-3.5 w-3.5" />
                    </IconButton>
                  </Tooltip>
                </Flex>
              </Card>
            ))}
          </Stack>
        </Stack>
      )}

      {/* Empty State */}
      {links && links.outgoing.length === 0 && links.incoming.length === 0 && (
        <Card padding="lg" variant="ghost">
          <Flex justify="center">
            <Typography variant="caption">No dependencies yet</Typography>
          </Flex>
        </Card>
      )}

      {/* Add Dependency Sheet (side panel to avoid nested dialog issue) */}
      <Sheet
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setSelectedIssue(null);
            setSearchQuery("");
          }
        }}
        title="Add Dependency"
        description="Link this issue to another issue in the project"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddDialog(false);
                setSelectedIssue(null);
                setSearchQuery("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddLink} disabled={!selectedIssue}>
              Add Dependency
            </Button>
          </>
        }
      >
        <Card padding="lg" variant="ghost">
          <Stack gap="md">
            {/* Link Type */}
            <Select
              label="Relationship Type"
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as "blocks" | "relates" | "duplicates")}
            >
              <option value="blocks">Blocks</option>
              <option value="relates">Relates to</option>
              <option value="duplicates">Duplicates</option>
            </Select>

            {/* Search Issues */}
            <Input
              label="Search Issue"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search..."
            />

            {/* Search Results - already filtered by backend (excludeIssueId) */}
            {searchResults?.page && searchResults.page.length > 0 && (
              <Card padding="none" className="max-h-48 overflow-y-auto">
                {searchResults.page.map((issue: Issue) => (
                  <Button
                    key={issue._id}
                    variant="ghost"
                    onClick={() => {
                      setSelectedIssue({ id: issue._id, key: issue.key });
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full p-3 justify-start text-left rounded-none hover:bg-ui-bg-tertiary border-b border-ui-border-secondary last:border-0",
                      selectedIssue?.id === issue._id && "bg-brand-subtle",
                    )}
                  >
                    <IssueDisplay type={issue.type} issueKey={issue.key} title={issue.title} />
                  </Button>
                ))}
              </Card>
            )}

            {/* Selected Issue */}
            {selectedIssue && (
              <Typography variant="caption">
                Selected:{" "}
                <Typography variant="label" as="span">
                  {selectedIssue.key}
                </Typography>
              </Typography>
            )}
          </Stack>
        </Card>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleRemoveLink}
        title="Remove Dependency"
        message="Are you sure you want to remove this dependency?"
        variant="danger"
        confirmLabel="Remove"
      />
    </Stack>
  );
}
