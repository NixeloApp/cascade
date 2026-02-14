import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { X } from "lucide-react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { ISSUE_TYPE_ICONS, type IssueType } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Input, Select } from "./ui/form";
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
  return (
    <Flex as="span" align="center" gap="sm" className="min-w-0">
      <Icon icon={ISSUE_TYPE_ICONS[type]} size="sm" className="shrink-0" />
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
  const [selectedIssueKey, setSelectedIssueKey] = useState("");
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
    if (!selectedIssueKey) {
      showError("Please select an issue");
      return;
    }

    try {
      await createLink({
        fromIssueId: issueId,
        toIssueId: selectedIssueKey as Id<"issues">,
        linkType,
      });
      showSuccess("Dependency added");
      setShowAddDialog(false);
      setSelectedIssueKey("");
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
    <div className="space-y-4">
      {/* Add Dependency Button */}
      <div>
        <Button onClick={() => setShowAddDialog(true)} size="sm" variant="secondary">
          + Add Dependency
        </Button>
      </div>

      {/* Outgoing Links */}
      {links && links.outgoing.length > 0 && (
        <div>
          <Typography variant="label" className="mb-2">
            Dependencies
          </Typography>
          <div className="space-y-2">
            {links.outgoing.map((link: IssueLinkWithDetails) => (
              <Flex
                align="center"
                justify="between"
                className="p-3 bg-ui-bg-secondary rounded-lg"
                key={link._id}
              >
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-ui-text-tertiary hover:text-status-error"
                    onClick={() => setDeleteConfirm(link._id)}
                    aria-label="Remove dependency"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              </Flex>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Links */}
      {links && links.incoming.length > 0 && (
        <div>
          <Typography variant="label" className="mb-2">
            Referenced By
          </Typography>
          <div className="space-y-2">
            {links.incoming.map((link: IssueLinkWithDetails) => (
              <Flex
                align="center"
                justify="between"
                className="p-3 bg-ui-bg-secondary rounded-lg"
                key={link._id}
              >
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-ui-text-tertiary hover:text-status-error"
                    onClick={() => setDeleteConfirm(link._id)}
                    aria-label="Remove dependency"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              </Flex>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {links && links.outgoing.length === 0 && links.incoming.length === 0 && (
        <div className="text-center py-6">
          <Typography variant="caption">No dependencies yet</Typography>
        </div>
      )}

      {/* Add Dependency Sheet (side panel to avoid nested dialog issue) */}
      <Sheet
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setSelectedIssueKey("");
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
                setSelectedIssueKey("");
                setSearchQuery("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddLink} disabled={!selectedIssueKey}>
              Add Dependency
            </Button>
          </>
        }
      >
        <div className="p-6 space-y-4">
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
            <div className="max-h-48 overflow-y-auto border border-ui-border rounded-lg">
              {searchResults.page.map((issue: Issue) => (
                <button
                  type="button"
                  key={issue._id}
                  onClick={() => {
                    setSelectedIssueKey(issue._id);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "w-full p-3 text-left hover:bg-ui-bg-tertiary border-b border-ui-border-secondary last:border-0",
                    selectedIssueKey === issue._id && "bg-brand-subtle",
                  )}
                >
                  <IssueDisplay type={issue.type} issueKey={issue.key} title={issue.title} />
                </button>
              ))}
            </div>
          )}

          {/* Selected Issue */}
          {selectedIssueKey && (
            <Typography variant="caption">
              Selected:{" "}
              <Typography variant="label" as="span">
                {selectedIssueKey}
              </Typography>
            </Typography>
          )}
        </div>
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
    </div>
  );
}
