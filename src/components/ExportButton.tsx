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
import { IconButton } from "./ui/IconButton";

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
      <div className="sm:hidden">
        <IconButton
          variant="solid"
          size="xs"
          onClick={() => setIsModalOpen(true)}
          aria-label="Import / Export"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </IconButton>
      </div>
      <div className="hidden sm:block">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          aria-label="Import / Export"
          leftIcon={<ArrowLeftRight className="h-4 w-4" />}
        >
          <span>Import / Export</span>
        </Button>
      </div>

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
