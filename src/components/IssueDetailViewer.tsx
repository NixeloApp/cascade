/**
 * IssueDetailViewer - Unified component for viewing issue details
 *
 * Renders either a modal or a side panel based on user preference.
 * Handles the view mode toggle and provides consistent API for all usages.
 */

import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { useIssueViewMode } from "@/contexts/IssueViewModeContext";
import { IssueDetailModal } from "./IssueDetailModal";
import { IssueDetailSheet } from "./IssueDetailSheet";

interface IssueDetailViewerProps {
  issueId: Id<"issues">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
}

/**
 * Renders issue details in either a modal or side panel based on user preference.
 * Use this instead of IssueDetailModal directly for consistent behavior.
 */
export function IssueDetailViewer({
  issueId,
  open,
  onOpenChange,
  canEdit = true,
}: IssueDetailViewerProps): ReactNode {
  const { viewMode } = useIssueViewMode();

  if (viewMode === "peek") {
    return (
      <IssueDetailSheet
        issueId={issueId}
        open={open}
        onOpenChange={onOpenChange}
        canEdit={canEdit}
      />
    );
  }

  return (
    <IssueDetailModal issueId={issueId} open={open} onOpenChange={onOpenChange} canEdit={canEdit} />
  );
}
