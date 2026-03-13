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
import { FileCode, FileSpreadsheet } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
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
            recipe={exportFormat === "csv" ? "optionTileSelected" : "optionTile"}
            padding="md"
            onClick={() => setExportFormat("csv")}
            className="cursor-pointer"
            aria-pressed={exportFormat === "csv"}
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
            recipe={exportFormat === "json" ? "optionTileSelected" : "optionTile"}
            padding="md"
            onClick={() => setExportFormat("json")}
            className="cursor-pointer"
            aria-pressed={exportFormat === "json"}
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

      <Alert variant="info">
        <AlertTitle>Export Information</AlertTitle>
        <AlertDescription>
          <Stack as="ul" gap="xs" className="list-disc list-inside">
            <Typography as="li" variant="small">
              CSV format is compatible with Excel and Google Sheets.
            </Typography>
            <Typography as="li" variant="small">
              JSON format includes full issue data and metadata.
            </Typography>
            <Typography as="li" variant="small">
              {sprintId || status
                ? "Filtered issues will be exported."
                : "All issues in this project will be exported."}
            </Typography>
          </Stack>
        </AlertDescription>
      </Alert>

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
