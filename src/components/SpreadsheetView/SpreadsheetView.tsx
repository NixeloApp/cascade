/**
 * SpreadsheetView - Excel-like grid for bulk issue editing
 *
 * Inspired by Plane's spreadsheet implementation but adapted for Nixelo patterns.
 * Uses native HTML table with inline editing capabilities.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useRef, useState } from "react";
import { BulkOperationsBar } from "@/components/BulkOperationsBar";
import { CreateIssueModal } from "@/components/CreateIssueModal";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { Flex } from "@/components/ui/Flex";
import { useSmartBoardData } from "@/hooks/useSmartBoardData";
import type { EnrichedIssue } from "../../../convex/lib/issueHelpers";
import { SpreadsheetHeader } from "./SpreadsheetHeader";
import { SpreadsheetRow } from "./SpreadsheetRow";
import { SpreadsheetSkeleton } from "./SpreadsheetSkeleton";

/** Display properties that can be shown/hidden */
export interface DisplayProperties {
  key: boolean;
  priority: boolean;
  status: boolean;
  assignee: boolean;
  dueDate: boolean;
  startDate: boolean;
  labels: boolean;
  storyPoints: boolean;
  type: boolean;
  createdAt: boolean;
  updatedAt: boolean;
}

/** Default display properties */
export const DEFAULT_DISPLAY_PROPERTIES: DisplayProperties = {
  key: true,
  priority: true,
  status: true,
  assignee: true,
  dueDate: true,
  startDate: false,
  labels: true,
  storyPoints: true,
  type: true,
  createdAt: false,
  updatedAt: false,
};

/** Column definition for spreadsheet */
export interface ColumnDefinition {
  id: keyof DisplayProperties;
  label: string;
  width: string;
  sortable: boolean;
}

/** Available columns */
export const SPREADSHEET_COLUMNS: ColumnDefinition[] = [
  { id: "key", label: "Key", width: "w-24", sortable: true },
  { id: "type", label: "Type", width: "w-20", sortable: true },
  { id: "priority", label: "Priority", width: "w-28", sortable: true },
  { id: "status", label: "Status", width: "w-32", sortable: true },
  { id: "assignee", label: "Assignee", width: "w-36", sortable: true },
  { id: "labels", label: "Labels", width: "w-40", sortable: false },
  { id: "storyPoints", label: "Points", width: "w-20", sortable: true },
  { id: "dueDate", label: "Due Date", width: "w-32", sortable: true },
  { id: "startDate", label: "Start Date", width: "w-32", sortable: true },
  { id: "createdAt", label: "Created", width: "w-32", sortable: true },
  { id: "updatedAt", label: "Updated", width: "w-32", sortable: true },
];

interface SpreadsheetViewProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  canEdit?: boolean;
}

export function SpreadsheetView({ projectId, sprintId, canEdit = true }: SpreadsheetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<Id<"issues">>>(new Set());
  const [displayProperties, setDisplayProperties] = useState<DisplayProperties>(
    DEFAULT_DISPLAY_PROPERTIES,
  );

  // Data fetching
  const { issuesByStatus, isLoading, workflowStates } = useSmartBoardData({
    projectId,
    sprintId,
  });

  // Mutations
  const updateIssue = useMutation(api.issues.update);

  // Flatten issues from all statuses into a single list
  const allIssues = workflowStates
    ? workflowStates.flatMap((state) => issuesByStatus[state.id] || [])
    : Object.values(issuesByStatus).flat();

  // Selection handlers
  const handleToggleSelect = useCallback((issueId: Id<"issues">) => {
    setSelectedIssueIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIssueIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (!prev) setSelectedIssueIds(new Set());
      return !prev;
    });
  }, []);

  // Issue update handler - extract only primitive fields the mutation accepts
  const handleUpdateIssue = useCallback(
    async (issueId: Id<"issues">, data: Partial<EnrichedIssue>) => {
      // Extract only the fields that the update mutation accepts
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
      if (data.storyPoints !== undefined) updateData.storyPoints = data.storyPoints;
      if (data.startDate !== undefined) updateData.startDate = data.startDate;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.labels !== undefined) {
        // Convert LabelInfo[] to string[] if needed
        updateData.labels = data.labels.map((l) => (typeof l === "string" ? l : l.name));
      }

      await updateIssue({ issueId, ...updateData });
    },
    [updateIssue],
  );

  // Toggle display property
  const handleToggleProperty = useCallback((property: keyof DisplayProperties) => {
    setDisplayProperties((prev) => ({
      ...prev,
      [property]: !prev[property],
    }));
  }, []);

  // Get visible columns
  const visibleColumns = SPREADSHEET_COLUMNS.filter((col) => displayProperties[col.id]);

  if (isLoading) {
    return <SpreadsheetSkeleton columns={visibleColumns.length + 1} rows={10} />;
  }

  return (
    <Flex direction="column" className="h-full">
      {/* Table Container */}
      <div ref={containerRef} className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <SpreadsheetHeader
            columns={visibleColumns}
            displayProperties={displayProperties}
            onToggleProperty={handleToggleProperty}
            selectionMode={selectionMode}
            onToggleSelectionMode={handleToggleSelectionMode}
            allSelected={allIssues.length > 0 && selectedIssueIds.size === allIssues.length}
            onSelectAll={() => {
              if (selectedIssueIds.size === allIssues.length) {
                setSelectedIssueIds(new Set());
              } else {
                setSelectedIssueIds(new Set(allIssues.map((i) => i._id)));
              }
            }}
          />
          <tbody>
            {allIssues.map((issue) => (
              <SpreadsheetRow
                key={issue._id}
                issue={issue}
                columns={visibleColumns}
                workflowStates={workflowStates || []}
                selectionMode={selectionMode}
                isSelected={selectedIssueIds.has(issue._id)}
                onToggleSelect={handleToggleSelect}
                onIssueClick={setSelectedIssue}
                onUpdateIssue={handleUpdateIssue}
                canEdit={canEdit}
              />
            ))}
          </tbody>
        </table>

        {allIssues.length === 0 && (
          <Flex align="center" justify="center" className="h-64 text-ui-text-secondary">
            No issues found. Create one to get started.
          </Flex>
        )}
      </div>

      {/* Modals */}
      <CreateIssueModal
        projectId={projectId}
        sprintId={sprintId}
        open={showCreateIssue}
        onOpenChange={setShowCreateIssue}
      />

      {selectedIssue && (
        <IssueDetailModal
          issueId={selectedIssue}
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedIssue(null);
          }}
          canEdit={canEdit}
        />
      )}

      {/* Bulk Operations */}
      {selectionMode && (
        <BulkOperationsBar
          projectId={projectId}
          selectedIssueIds={selectedIssueIds}
          onClearSelection={handleClearSelection}
          workflowStates={workflowStates ?? []}
        />
      )}
    </Flex>
  );
}
