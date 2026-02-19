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
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Stack } from "../ui/Stack";
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
        <Typography variant="label" className="text-ui-text mb-3">
          Select Export Format
        </Typography>
        <Grid cols={2} gap="md">
          <Card
            padding="md"
            onClick={() => setExportFormat("csv")}
            className={cn(
              "cursor-pointer transition-all",
              exportFormat === "csv" ? "ring-2 ring-brand bg-brand/5" : "hover:bg-ui-bg-secondary",
            )}
          >
            <Flex gap="md" align="center">
              <Icon icon={FileSpreadsheet} size="lg" />
              <div>
                <Typography variant="label" className="text-ui-text">
                  CSV
                </Typography>
                <Typography variant="caption" color="tertiary">
                  Spreadsheet format
                </Typography>
              </div>
            </Flex>
          </Card>

          <Card
            padding="md"
            onClick={() => setExportFormat("json")}
            className={cn(
              "cursor-pointer transition-all",
              exportFormat === "json" ? "ring-2 ring-brand bg-brand/5" : "hover:bg-ui-bg-secondary",
            )}
          >
            <Flex gap="md" align="center">
              <Icon icon={FileCode} size="lg" />
              <div>
                <Typography variant="label" className="text-ui-text">
                  JSON
                </Typography>
                <Typography variant="caption" color="tertiary">
                  Data interchange format
                </Typography>
              </div>
            </Flex>
          </Card>
        </Grid>
      </div>

      <Card padding="md" className="bg-brand-subtle border border-brand-border">
        <Flex gap="md" align="start">
          <Icon icon={Info} size="lg" className="text-brand" />
          <Stack gap="xs" className="text-brand-active">
            <Typography variant="label">Export Information</Typography>
            <ul className="list-disc list-inside text-brand-hover">
              <li>CSV format is compatible with Excel, Google Sheets</li>
              <li>JSON format includes full issue data and metadata</li>
              <li>
                {sprintId || status
                  ? "Filtered issues will be exported"
                  : "All issues in this project will be exported"}
              </li>
            </ul>
          </Stack>
        </Flex>
      </Card>

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
