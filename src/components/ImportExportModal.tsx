import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Download, Upload } from "@/lib/icons";
import { ExportPanel } from "./ImportExport/ExportPanel";
import { ImportPanel } from "./ImportExport/ImportPanel";
import { Dialog } from "./ui/Dialog";

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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import / Export Issues"
      description="Manage issue import and export"
      className="sm:max-w-4xl"
    >
      <Stack gap="lg">
        {/* Mode Selection */}
        <Card padding="xs" variant="ghost" className="bg-ui-bg-tertiary">
          <Flex gap="sm">
            <Button
              variant={mode === "export" ? "secondary" : "ghost"}
              onClick={() => setMode("export")}
              leftIcon={<Icon icon={Download} size="sm" />}
              className="flex-1"
            >
              Export
            </Button>
            <Button
              variant={mode === "import" ? "secondary" : "ghost"}
              onClick={() => setMode("import")}
              leftIcon={<Icon icon={Upload} size="sm" />}
              className="flex-1"
            >
              Import
            </Button>
          </Flex>
        </Card>

        {/* Panel Content */}
        {mode === "export" ? (
          <ExportPanel projectId={projectId} sprintId={sprintId} status={status} />
        ) : (
          <ImportPanel projectId={projectId} onImportComplete={handleImportComplete} />
        )}
      </Stack>
    </Dialog>
  );
}
