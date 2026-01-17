import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { useOrganization } from "@/hooks/useOrgContext";
import { Check, Copy } from "@/lib/icons";
import { getPriorityColor, getTypeIcon } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { CustomFieldValues } from "./CustomFieldValues";
import { FileAttachments } from "./FileAttachments";
import { IssueComments } from "./IssueComments";
import { IssueDependencies } from "./IssueDependencies";
import { IssueMetadataSection } from "./IssueDetail/IssueMetadataSection";
import { SubtasksList } from "./IssueDetail/SubtasksList";
import { IssueWatchers } from "./IssueWatchers";
import { TimeTracker } from "./TimeTracker";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Input } from "./ui/form/Input";
import { Textarea } from "./ui/form/Textarea";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

interface IssueDetailModalProps {
  issueId: Id<"issues">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
}

export function IssueDetailModal({
  issueId,
  open,
  onOpenChange,
  canEdit = true,
}: IssueDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  // Get billing setting from organization context
  const { billingEnabled } = useOrganization();

  const issue = useQuery(api.issues.get, { id: issueId });
  const subtasks = useQuery(api.issues.listSubtasks, { parentId: issueId });
  const updateIssue = useMutation(api.issues.update);

  if (!issue) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading issue details</DialogTitle>
            <Flex align="center" className="space-x-3">
              <div className="animate-pulse bg-ui-bg-tertiary h-8 w-8 rounded" />
              <div className="space-y-2">
                <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-24" />
                <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-16" />
              </div>
            </Flex>
          </DialogHeader>
          <DialogDescription className="sr-only">Loading content...</DialogDescription>
          <output aria-live="polite" aria-busy="true" className="space-y-6 block">
            <span className="sr-only">Loading...</span>
            <div className="animate-pulse bg-ui-bg-tertiary rounded h-8 w-3/4" />
            <div className="space-y-2">
              <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-full" />
              <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-full" />
              <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-2/3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-ui-bg-secondary rounded-lg">
              <div className="animate-pulse bg-ui-bg-tertiary rounded h-12 w-full" />
              <div className="animate-pulse bg-ui-bg-tertiary rounded h-12 w-full" />
              <div className="animate-pulse bg-ui-bg-tertiary rounded h-12 w-full" />
              <div className="animate-pulse bg-ui-bg-tertiary rounded h-12 w-full" />
            </div>
          </output>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSave = async () => {
    try {
      await updateIssue({
        id: issueId,
        title: title || undefined,
        description: description || undefined,
      });
      showSuccess("Issue updated");
      setIsEditing(false);
    } catch (error) {
      showError(error, "Failed to update issue");
    }
  };

  const handleEdit = () => {
    setTitle(issue.title);
    setDescription(issue.description || "");
    setIsEditing(true);
  };

  const handleCopyKey = () => {
    navigator.clipboard
      .writeText(issue.key)
      .then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
      })
      .catch((err) => {
        showError(err, "Failed to copy issue key");
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl" data-testid="issue-detail-modal">
        <DialogHeader>
          <Flex align="center" justify="between">
            <Flex align="center" className="space-x-3">
              <span className="text-2xl">{getTypeIcon(issue.type)}</span>
              <div>
                <DialogTitle className="flex items-center space-x-2">
                  <Flex align="center" className="gap-1.5">
                    <span className="text-sm text-ui-text-secondary font-mono">{issue.key}</span>
                    <Tooltip content={hasCopied ? "Copied!" : "Copy issue key"}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyKey}
                        aria-label="Copy issue key"
                      >
                        {hasCopied ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </Tooltip>
                  </Flex>
                  <Badge size="md" className={getPriorityColor(issue.priority, "badge")}>
                    {issue.priority}
                  </Badge>
                </DialogTitle>
              </div>
            </Flex>
          </Flex>
        </DialogHeader>
        <DialogDescription className="sr-only">View and edit issue details</DialogDescription>
        {/* Content */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            {isEditing ? (
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold"
                placeholder="Issue title"
              />
            ) : (
              <Flex align="start" justify="between">
                <Typography variant="h2" className="border-none">
                  {issue.title}
                </Typography>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={handleEdit}>
                    Edit
                  </Button>
                )}
              </Flex>
            )}
          </div>

          {/* Description */}
          <div>
            {isEditing ? (
              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Add a description..."
              />
            ) : (
              <div>
                <Typography variant="h3" className="text-sm font-medium mb-2 border-none">
                  Description
                </Typography>
                <Typography variant="p" color="secondary" className="whitespace-pre-wrap">
                  {issue.description || "No description provided"}
                </Typography>
              </div>
            )}
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <Flex className="space-x-2">
              <Button onClick={handleSave} variant="primary">
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="secondary">
                Cancel
              </Button>
            </Flex>
          )}

          {/* Metadata */}
          <IssueMetadataSection
            status={issue.status}
            type={issue.type}
            assignee={issue.assignee}
            reporter={issue.reporter}
            storyPoints={issue.storyPoints}
            labels={issue.labels}
          />

          {/* Time Tracking */}
          <div>
            <Typography variant="h3" className="text-sm font-medium mb-3 border-none">
              Time Tracking
            </Typography>
            <TimeTracker
              issueId={issue._id}
              projectId={issue.projectId}
              estimatedHours={issue.estimatedHours}
              billingEnabled={billingEnabled}
            />
          </div>

          {/* File Attachments */}
          <div>
            <Typography variant="h3" className="text-sm font-medium mb-3 border-none">
              Attachments
            </Typography>
            <FileAttachments issueId={issue._id} />
          </div>

          {/* Issue Watchers */}
          <div>
            <Typography variant="h3" className="text-sm font-medium mb-3 border-none">
              Watchers
            </Typography>
            <IssueWatchers issueId={issue._id} />
          </div>

          {/* Issue Dependencies */}
          <div>
            <Typography variant="h3" className="text-sm font-medium mb-3 border-none">
              Dependencies
            </Typography>
            <IssueDependencies issueId={issue._id} projectId={issue.projectId} />
          </div>

          {/* Sub-tasks (only show for non-subtasks) */}
          {issue.type !== "subtask" && (
            <SubtasksList issueId={issue._id} projectId={issue.projectId} subtasks={subtasks} />
          )}

          {/* Custom Fields */}
          <div>
            <CustomFieldValues issueId={issue._id} projectId={issue.projectId} />
          </div>

          {/* Comments */}
          <div>
            <Typography variant="h3" className="text-sm font-medium mb-3 border-none">
              Comments
            </Typography>
            <IssueComments issueId={issue._id} projectId={issue.projectId} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
