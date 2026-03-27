/**
 * Import Export Modal
 *
 * Dialog for importing and exporting issues in various formats.
 * Supports CSV, JSON, and Jira-compatible formats.
 * Handles field mapping and validation during import.
 */

import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/SegmentedControl";
import { Stack } from "@/components/ui/Stack";
import { Download, Upload } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
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

  useEffect(() => {
    if (!open) {
      setMode("export");
    }
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const handleImportComplete = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Import / Export Issues"
      description="Manage issue import and export"
      size="xl"
      data-testid={TEST_IDS.PROJECT.IMPORT_EXPORT_MODAL}
    >
      <Stack gap="lg">
        {/* Mode Selection */}
        <SegmentedControl
          value={mode}
          onValueChange={(value) => value && setMode(value as Mode)}
          width="fill"
          aria-label="Import export mode"
        >
          <SegmentedControlItem value="export" aria-label="Export issues">
            <Icon icon={Download} size="sm" />
            Export
          </SegmentedControlItem>
          <SegmentedControlItem
            value="import"
            aria-label="Import issues"
            data-testid={TEST_IDS.PROJECT.IMPORT_EXPORT_MODE_IMPORT}
          >
            <Icon icon={Upload} size="sm" />
            Import
          </SegmentedControlItem>
        </SegmentedControl>

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
