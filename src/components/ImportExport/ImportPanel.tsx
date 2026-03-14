/**
 * Import Panel
 *
 * Issue import UI for CSV and JSON files.
 * Handles file selection and validation.
 * Reports import success and failure counts.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { FileCode, FileSpreadsheet } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface ImportPanelProps {
  projectId: Id<"projects">;
  onImportComplete?: () => void;
}

type ImportFormat = "csv" | "json";

/**
 * Extracted import panel from ImportExportModal
 * Handles all import logic and UI
 */
export function ImportPanel({ projectId, onImportComplete }: ImportPanelProps) {
  const [importFormat, setImportFormat] = useState<ImportFormat>("csv");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  const { mutate: importCSV } = useAuthenticatedMutation(api.export.importIssuesCSV);
  const { mutate: importJSON } = useAuthenticatedMutation(api.export.importIssuesJSON);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportData(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!importData) {
      showError(new Error("Please select a file to import"), "Validation Error");
      return;
    }

    setIsImporting(true);

    try {
      let result: {
        imported: number;
        failed: number;
        errors?: { row?: number; title?: string; error: string }[];
      };

      if (importFormat === "csv") {
        result = await importCSV({ projectId, csvData: importData });
      } else {
        result = await importJSON({ projectId, jsonData: importData });
      }

      if (result.imported > 0) {
        showSuccess(
          `Successfully imported ${result.imported} issue${result.imported > 1 ? "s" : ""}${
            result.failed > 0 ? ` (${result.failed} failed)` : ""
          }`,
        );

        setImportFile(null);
        setImportData("");
        onImportComplete?.();
      } else {
        showError(new Error("No issues were imported"), "Import Failed");
      }
    } catch (error) {
      showError(error, "Failed to import issues");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Flex direction="column" gap="lg">
      <div>
        <Typography variant="label" className="text-ui-text mb-3">
          Select Import Format
        </Typography>
        <Grid cols={2} gap="md">
          <Card
            recipe={importFormat === "csv" ? "optionTileSelected" : "optionTile"}
            padding="md"
            onClick={() => setImportFormat("csv")}
            className="cursor-pointer"
            aria-pressed={importFormat === "csv"}
          >
            <Flex gap="md" align="center">
              <Icon icon={FileSpreadsheet} size="lg" />
              <div>
                <Typography variant="label" className="text-ui-text">
                  CSV
                </Typography>
                <Typography variant="caption" color="secondary">
                  Spreadsheet format
                </Typography>
              </div>
            </Flex>
          </Card>

          <Card
            recipe={importFormat === "json" ? "optionTileSelected" : "optionTile"}
            padding="md"
            onClick={() => setImportFormat("json")}
            className="cursor-pointer"
            aria-pressed={importFormat === "json"}
          >
            <Flex gap="md" align="center">
              <Icon icon={FileCode} size="lg" />
              <div>
                <Typography variant="label" className="text-ui-text">
                  JSON
                </Typography>
                <Typography variant="caption" color="secondary">
                  Data interchange format
                </Typography>
              </div>
            </Flex>
          </Card>
        </Grid>
      </div>

      <div>
        <Input
          label="Select File"
          type="file"
          accept={importFormat === "csv" ? ".csv" : ".json"}
          onChange={handleFileChange}
          className="cursor-pointer bg-ui-bg-secondary"
        />
        {importFile && (
          <Typography variant="muted" className="mt-2">
            Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
          </Typography>
        )}
      </div>

      <Alert variant="warning">
        <AlertTitle>Import Requirements</AlertTitle>
        <AlertDescription>
          <Stack gap="sm">
            <Typography variant="small">CSV must have a header row with column names.</Typography>
            <Typography variant="small">
              Required column:{" "}
              <Typography as="code" variant="inlineCode">
                title
              </Typography>
            </Typography>
            <Typography variant="small">
              Optional fields include type, priority, description, labels, estimated hours, and due
              date.
            </Typography>
            <Typography variant="small">
              All imported issues will be created in the first workflow state.
            </Typography>
          </Stack>
        </AlertDescription>
      </Alert>

      <Button onClick={handleImport} disabled={!importData || isImporting} className="w-full">
        {isImporting ? (
          <Flex align="center" justify="center" gap="sm">
            <LoadingSpinner size="sm" variant="inherit" />
            Importing...
          </Flex>
        ) : (
          `Import from ${importFormat.toUpperCase()}`
        )}
      </Button>
    </Flex>
  );
}
