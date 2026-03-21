/**
 * Export Panel
 *
 * Issue export UI for CSV and JSON formats.
 * Handles format selection and file download.
 * Supports filtered exports by sprint or status.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import {
  ImportExportFormatSelector,
  ImportExportInfoAlert,
  ImportExportPanelChrome,
} from "./ImportExportPanelChrome";
import { IMPORT_EXPORT_FORMATS, type ImportExportFormat } from "./importExportFormats";

interface ExportPanelProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
}

function downloadExportFile(format: ImportExportFormat, data: string) {
  const timestamp = new Date().toISOString().split("T")[0];
  const mimeType = format === "csv" ? "text/csv;charset=utf-8;" : "application/json;charset=utf-8;";
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `issues-export-${timestamp}.${IMPORT_EXPORT_FORMATS[format].extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Extracted export panel from ImportExportModal
 * Handles all export logic and UI
 */
export function ExportPanel({ projectId, sprintId, status }: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<ImportExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);

  const csvData = useAuthenticatedQuery(
    api.export.exportIssuesCSV,
    isExporting && exportFormat === "csv" ? { projectId, sprintId, status } : "skip",
  );

  const jsonData = useAuthenticatedQuery(
    api.export.exportIssuesJSON,
    isExporting && exportFormat === "json" ? { projectId, sprintId, status } : "skip",
  );

  const handleExport = () => {
    setIsExporting(true);
  };

  useEffect(() => {
    if (!isExporting) {
      return;
    }

    const exportData = exportFormat === "csv" ? csvData : jsonData;
    if (exportData === undefined) {
      return;
    }

    if (!exportData || exportData.trim().length === 0) {
      showError(new Error("No data to export"), "Export Failed");
      setIsExporting(false);
      return;
    }

    try {
      downloadExportFile(exportFormat, exportData);
      showSuccess("Issues exported successfully!");
    } catch (error) {
      showError(error, "Failed to export issues");
    } finally {
      setIsExporting(false);
    }
  }, [csvData, exportFormat, isExporting, jsonData]);

  const selectedFormat = IMPORT_EXPORT_FORMATS[exportFormat];

  return (
    <ImportExportPanelChrome>
      <ImportExportFormatSelector
        label="Select Export Format"
        value={exportFormat}
        onValueChange={setExportFormat}
      />

      <ImportExportInfoAlert
        title="Export Information"
        variant="info"
        items={[
          ...selectedFormat.exportNotes.map((note, index) => ({
            id: `${exportFormat}-note-${index + 1}`,
            content: note,
          })),
          {
            id: `${exportFormat}-scope`,
            content:
              sprintId || status
                ? "Only issues matching the active filters will be exported."
                : "All issues in this project will be exported.",
          },
        ]}
      />

      <Button onClick={handleExport} disabled={isExporting} className="w-full">
        {isExporting ? (
          <Flex align="center" justify="center" gap="sm">
            <LoadingSpinner size="sm" variant="inherit" />
            Exporting...
          </Flex>
        ) : (
          `Export as ${selectedFormat.label}`
        )}
      </Button>
    </ImportExportPanelChrome>
  );
}
