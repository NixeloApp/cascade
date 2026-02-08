import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { FileCode, FileSpreadsheet, Info } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Typography } from "../ui/Typography";

interface ExportPanelProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  status?: string;
}

type ExportFormat = "csv" | "json";

/**
 * Extracted export panel from ImportExportModal
 * Handles all export logic and UI
 */
export function ExportPanel({ projectId, sprintId, status }: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);

  const csvData = useQuery(
    api.export.exportIssuesCSV,
    isExporting && exportFormat === "csv" ? { projectId, sprintId, status } : "skip",
  );

  const jsonData = useQuery(
    api.export.exportIssuesJSON,
    isExporting && exportFormat === "json" ? { projectId, sprintId, status } : "skip",
  );

  const handleExport = () => {
    setIsExporting(true);
  };

  // Handle CSV export
  useEffect(() => {
    if (csvData !== undefined && isExporting && exportFormat === "csv") {
      if (!csvData || csvData.trim().length === 0) {
        showError(new Error("No data to export"), "Export Failed");
        setIsExporting(false);
      } else {
        try {
          const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          const timestamp = new Date().toISOString().split("T")[0];
          link.download = `issues-export-${timestamp}.csv`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          showSuccess("Issues exported successfully!");
        } catch (error) {
          showError(error, "Failed to export issues");
        } finally {
          setIsExporting(false);
        }
      }
    }
  }, [csvData, isExporting, exportFormat]);

  // Handle JSON export
  useEffect(() => {
    if (jsonData !== undefined && isExporting && exportFormat === "json") {
      if (!jsonData || jsonData.trim().length === 0) {
        showError(new Error("No data to export"), "Export Failed");
        setIsExporting(false);
      } else {
        try {
          const blob = new Blob([jsonData], { type: "application/json;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;

          const timestamp = new Date().toISOString().split("T")[0];
          link.download = `issues-export-${timestamp}.json`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          showSuccess("Issues exported successfully!");
        } catch (error) {
          showError(error, "Failed to export issues");
        } finally {
          setIsExporting(false);
        }
      }
    }
  }, [jsonData, isExporting, exportFormat]);

  return (
    <Flex direction="column" gap="lg">
      <div>
        <Typography variant="h3" className="text-sm font-semibold text-ui-text mb-3">
          Select Export Format
        </Typography>
        <div className="grid grid-cols-2 gap-3">
          <Card
            onClick={() => setExportFormat("csv")}
            className={cn(
              "p-4 cursor-pointer transition-all",
              exportFormat === "csv" ? "ring-2 ring-brand bg-brand/5" : "hover:bg-ui-bg-secondary",
            )}
          >
            <Flex gap="md" align="center">
              <Icon icon={FileSpreadsheet} size="lg" />
              <div>
                <div className="font-semibold text-ui-text">CSV</div>
                <div className="text-xs text-ui-text-tertiary">Spreadsheet format</div>
              </div>
            </Flex>
          </Card>

          <Card
            onClick={() => setExportFormat("json")}
            className={cn(
              "p-4 cursor-pointer transition-all",
              exportFormat === "json" ? "ring-2 ring-brand bg-brand/5" : "hover:bg-ui-bg-secondary",
            )}
          >
            <Flex gap="md" align="center">
              <Icon icon={FileCode} size="lg" />
              <div>
                <div className="font-semibold text-ui-text">JSON</div>
                <div className="text-xs text-ui-text-tertiary">Data interchange format</div>
              </div>
            </Flex>
          </Card>
        </div>
      </div>

      <div className="bg-brand-subtle border border-brand-border rounded-lg p-4">
        <Flex gap="md" align="start">
          <Icon icon={Info} size="lg" className="text-brand" />
          <div className="text-sm text-brand-active">
            <Typography variant="p" className="font-semibold mb-1">
              Export Information
            </Typography>
            <ul className="list-disc list-inside space-y-1 text-brand-hover">
              <li>CSV format is compatible with Excel, Google Sheets</li>
              <li>JSON format includes full issue data and metadata</li>
              <li>
                {sprintId || status
                  ? "Filtered issues will be exported"
                  : "All issues in this project will be exported"}
              </li>
            </ul>
          </div>
        </Flex>
      </div>

      <Button onClick={handleExport} disabled={isExporting} className="w-full">
        {isExporting ? (
          <Flex align="center" justify="center" gap="sm">
            <LoadingSpinner size="sm" variant="inherit" />
            Exporting...
          </Flex>
        ) : (
          `Export as ${exportFormat.toUpperCase()}`
        )}
      </Button>
    </Flex>
  );
}
