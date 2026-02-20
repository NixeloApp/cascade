import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/lib/toast";

export function useIssueDetail(issueId: Id<"issues">) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  const issue = useQuery(api.issues.getIssue, { id: issueId });
  const subtasks = useQuery(api.issues.listSubtasks, { parentId: issueId });
  const updateIssue = useMutation(api.issues.update);

  useEffect(() => {
    if (issue && !isEditing) {
      setTitle(issue.title);
      setDescription(issue.description || "");
    }
  }, [issue, isEditing]);

  const handleSave = async (): Promise<void> => {
    try {
      await updateIssue({
        issueId,
        title: title || undefined,
        description,
      });
      showSuccess("Issue updated");
      setIsEditing(false);
    } catch (error) {
      showError(error, "Failed to update issue");
    }
  };

  const handleEdit = (): void => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || "");
    }
    setIsEditing(true);
  };

  const handleCancelEdit = (): void => {
    setIsEditing(false);
  };

  const handleCopyKey = (): void => {
    if (!issue) return;
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

  return {
    issue,
    subtasks,
    isEditing,
    title,
    setTitle,
    description,
    setDescription,
    hasCopied,
    handleSave,
    handleEdit,
    handleCancelEdit,
    handleCopyKey,
  };
}
