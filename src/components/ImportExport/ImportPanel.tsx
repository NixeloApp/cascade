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
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Typography } from "../ui/Typography";
import {
  ImportExportFormatSelector,
  ImportExportInfoAlert,
  ImportExportPanelChrome,
} from "./ImportExportPanelChrome";
import {
  fileMatchesImportExportFormat,
  IMPORT_EXPORT_FORMATS,
  type ImportExportFormat,
} from "./importExportFormats";

interface ImportPanelProps {
  projectId: Id<"projects">;
  onImportComplete?: () => void;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("The selected file could not be read as text."));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("The selected file could not be read."));
    };

    reader.readAsText(file);
  });
}

/**
 * Extracted import panel from ImportExportModal
 * Handles all import logic and UI
 */
export function ImportPanel({ projectId, onImportComplete }: ImportPanelProps) {
  const [importFormat, setImportFormat] = useState<ImportExportFormat>("csv");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<string>("");
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [inputResetKey, setInputResetKey] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const { mutate: importCSV } = useAuthenticatedMutation(api.export.importIssuesCSV);
  const { mutate: importJSON } = useAuthenticatedMutation(api.export.importIssuesJSON);

  const selectedFormat = IMPORT_EXPORT_FORMATS[importFormat];

  const resetImportSelection = () => {
    setImportFile(null);
    setImportData("");
    setImportFileError(null);
    setInputResetKey((currentKey) => currentKey + 1);
  };

  const handleFormatChange = (nextFormat: ImportExportFormat) => {
    if (nextFormat === importFormat) {
      return;
    }

    resetImportSelection();
    setImportFormat(nextFormat);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetImportSelection();
      return;
    }

    if (!fileMatchesImportExportFormat(file.name, importFormat)) {
      resetImportSelection();
      setImportFileError(
        `Choose a .${selectedFormat.extension} file when importing ${selectedFormat.label}.`,
      );
      return;
    }

    setImportFile(file);
    setImportData("");
    setImportFileError(null);

    try {
      const fileContents = await readFileAsText(file);
      setImportData(fileContents);
    } catch (error) {
      resetImportSelection();
      setImportFileError("The selected file could not be read. Try another file.");
      showError(error, "Failed to read import file");
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

        resetImportSelection();
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
    <ImportExportPanelChrome>
      <ImportExportFormatSelector
        label="Select Import Format"
        value={importFormat}
        onValueChange={handleFormatChange}
      />

      <div>
        <Input
          key={inputResetKey}
          label="Select File"
          type="file"
          variant="filePicker"
          accept={selectedFormat.accept}
          error={importFileError ?? undefined}
          helperText={`Accepted file type: ${selectedFormat.accept}`}
          onChange={handleFileChange}
        />
        {importFile && (
          <Typography variant="muted" className="mt-2">
            Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
          </Typography>
        )}
      </div>

      <ImportExportInfoAlert
        title="Import Requirements"
        variant="warning"
        items={selectedFormat.importRequirements.map((requirement, index) => {
          if (importFormat === "csv" && index === 1) {
            return {
              id: `${importFormat}-required-title`,
              content: (
                <>
                  Required column:{" "}
                  <Typography as="code" variant="inlineCode">
                    title
                  </Typography>
                </>
              ),
            };
          }

          return {
            id: `${importFormat}-requirement-${index + 1}`,
            content: requirement,
          };
        })}
      />

      <Button
        onClick={handleImport}
        disabled={!importData || Boolean(importFileError) || isImporting}
        className="w-full"
      >
        {isImporting ? (
          <Flex align="center" justify="center" gap="sm">
            <LoadingSpinner size="sm" variant="inherit" />
            Importing...
          </Flex>
        ) : (
          `Import from ${selectedFormat.label}`
        )}
      </Button>
    </ImportExportPanelChrome>
  );
}
