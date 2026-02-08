import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Download, Upload } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ExportPanel } from "./import-export/ExportPanel";
import { ImportPanel } from "./import-export/ImportPanel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog";

interface ImportExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
}

type Mode = "export" | "import";

/**
 * Refactored ImportExportModal - Now focused on orchestration
 * Import and Export logic extracted to separate panels
 *
 * Benefits:
 * - Reduced from 368 lines to ~70 lines
 * - Import/Export can be used independently
 * - Each panel testable in isolation
 * - Clearer separation of concerns
 */
export function ImportExportModal({
  open,
  onOpenChange,
  projectId,
  sprintId,
  status,
}: ImportExportModalProps) {
  const [mode, setMode] = useState<Mode>("export");

  const handleImportComplete = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="tracking-tight">Import / Export Issues</DialogTitle>
          <DialogDescription className="sr-only">Manage issue import and export</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Mode Selection */}
          <Flex gap="sm" className="p-1 bg-ui-bg-tertiary rounded-lg">
            <button
              type="button"
              onClick={() => setMode("export")}
              className={cn(
                "flex-1 px-4 py-2 rounded-md font-medium transition-colors",
                mode === "export"
                  ? "bg-ui-bg text-brand-indigo-text shadow-sm"
                  : "text-ui-text-secondary hover:text-ui-text",
              )}
            >
              <Flex align="center" justify="center" gap="xs">
                <Icon icon={Download} size="sm" />
                Export
              </Flex>
            </button>
            <button
              type="button"
              onClick={() => setMode("import")}
              className={cn(
                "flex-1 px-4 py-2 rounded-md font-medium transition-colors",
                mode === "import"
                  ? "bg-ui-bg text-brand-indigo-text shadow-sm"
                  : "text-ui-text-secondary hover:text-ui-text",
              )}
            >
              <Flex align="center" justify="center" gap="xs">
                <Icon icon={Upload} size="sm" />
                Import
              </Flex>
            </button>
          </Flex>

          {/* Panel Content */}
          {mode === "export" ? (
            <ExportPanel projectId={projectId} sprintId={sprintId} status={status} />
          ) : (
            <ImportPanel projectId={projectId} onImportComplete={handleImportComplete} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
