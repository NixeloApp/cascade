import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { AlertTriangle } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { LoadingSpinner } from "../ui/LoadingSpinner";
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

  const importCSV = useMutation(api.export.importIssuesCSV);
  const importJSON = useMutation(api.export.importIssuesJSON);

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
        <Typography variant="h3" className="text-sm font-semibold text-ui-text mb-3">
          Select Import Format
        </Typography>
        <div className="grid grid-cols-2 gap-3">
          <Card
            onClick={() => setImportFormat("csv")}
            className={cn(
              "p-4 cursor-pointer transition-all",
              importFormat === "csv" ? "ring-2 ring-brand bg-brand/5" : "hover:bg-ui-bg-secondary",
            )}
          >
            <Flex gap="md" align="center">
              <div className="text-3xl">📊</div>
              <div>
                <div className="font-semibold text-ui-text">CSV</div>
                <div className="text-xs text-ui-text-secondary">Spreadsheet format</div>
              </div>
            </Flex>
          </Card>

          <Card
            onClick={() => setImportFormat("json")}
            className={cn(
              "p-4 cursor-pointer transition-all",
              importFormat === "json" ? "ring-2 ring-brand bg-brand/5" : "hover:bg-ui-bg-secondary",
            )}
          >
            <Flex gap="md" align="center">
              <div className="text-3xl">📄</div>
              <div>
                <div className="font-semibold text-ui-text">JSON</div>
                <div className="text-xs text-ui-text-secondary">Data interchange format</div>
              </div>
            </Flex>
          </Card>
        </div>
      </div>

      <div>
        <div className="block text-sm font-medium text-ui-text mb-2">Select File</div>
        <input
          type="file"
          accept={importFormat === "csv" ? ".csv" : ".json"}
          onChange={handleFileChange}
          className="block w-full text-sm text-ui-text border border-ui-border rounded-lg cursor-pointer bg-ui-bg-secondary focus:outline-none"
        />
        {importFile && (
          <Typography variant="muted" className="mt-2">
            Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
          </Typography>
        )}
      </div>

      <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-4">
        <Flex gap="md" align="start">
          <Icon icon={AlertTriangle} size="lg" className="text-status-warning" />
          <div className="text-sm text-status-warning">
            <Typography variant="p" className="font-semibold mb-1">
              Import Requirements
            </Typography>
            <ul className="list-disc list-inside space-y-1 text-status-warning/90">
              <li>CSV must have a header row with column names</li>
              <li>
                Required column: <code className="bg-status-warning/20 px-1 rounded">title</code>
              </li>
              <li>Optional: type, priority, description, labels, estimated hours, due date</li>
              <li>All imported issues will be created in the first workflow state</li>
            </ul>
          </div>
        </Flex>
      </div>

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
