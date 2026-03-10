/**
 * Export Button
 *
 * Trigger button for opening the import/export modal.
 * Shows bidirectional arrow icon indicating data transfer capability.
 * Supports project-level and sprint-level export scope.
 */

import type { Id } from "@convex/_generated/dataModel";
import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import { ImportExportModal } from "./ImportExportModal";
import { Button } from "./ui/Button";

interface ExportButtonProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
}

/** Button that opens the import/export modal for issues. */
export function ExportButton({ projectId, sprintId, status }: ExportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        aria-label="Import and export issues"
        className="h-8 rounded-lg px-2 sm:text-xs sm:h-9 sm:rounded-xl sm:px-3 sm:text-sm"
        leftIcon={<ArrowLeftRight className="w-4 h-4" />}
      >
        <span className="sr-only sm:not-sr-only sm:inline">Import / Export</span>
      </Button>

      <ImportExportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        projectId={projectId}
        sprintId={sprintId}
        status={status}
      />
    </>
  );
}
