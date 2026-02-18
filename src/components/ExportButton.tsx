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

export function ExportButton({ projectId, sprintId, status }: ExportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        leftIcon={<ArrowLeftRight className="w-4 h-4" />}
      >
        Import / Export
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
