/**
 * Export Button
 *
 * Trigger button for opening the import/export modal.
 * Shows bidirectional arrow icon indicating data transfer capability.
 * Supports project-level and sprint-level export scope.
 */

import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { ArrowLeftRight } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
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
          data-testid={TEST_IDS.PROJECT.IMPORT_EXPORT_TRIGGER}
        >
          <ArrowLeftRight className="size-3.5" />
        </IconButton>
      </div>
      <div className="hidden sm:block">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          aria-label="Import / Export"
          data-testid={TEST_IDS.PROJECT.IMPORT_EXPORT_TRIGGER}
          leftIcon={<ArrowLeftRight className="size-4" />}
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
