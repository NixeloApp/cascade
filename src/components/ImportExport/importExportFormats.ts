import type { LucideIcon } from "lucide-react";
import { FileCode, FileSpreadsheet } from "@/lib/icons";

export type ImportExportFormat = "csv" | "json";

interface ImportExportFormatMeta {
  accept: string;
  description: string;
  extension: string;
  exportNotes: string[];
  icon: LucideIcon;
  importRequirements: string[];
  label: string;
}

export const IMPORT_EXPORT_FORMATS: Record<ImportExportFormat, ImportExportFormatMeta> = {
  csv: {
    accept: ".csv",
    description: "Spreadsheet format",
    extension: "csv",
    exportNotes: [
      "CSV exports open cleanly in Excel, Google Sheets, and other spreadsheet tools.",
      "Exports include the issue fields needed for bulk editing and review.",
    ],
    icon: FileSpreadsheet,
    importRequirements: [
      "CSV files must include a header row with column names.",
      "The title column is required.",
      "Optional columns: type, priority, description, labels, estimated hours, and due date.",
      "Imported CSV issues are created in the first workflow state.",
    ],
    label: "CSV",
  },
  json: {
    accept: ".json",
    description: "Structured issue export",
    extension: "json",
    exportNotes: [
      "JSON exports preserve the full issue structure for migrations and tooling.",
      "Exports include metadata that spreadsheet formats do not keep intact.",
    ],
    icon: FileCode,
    importRequirements: [
      "JSON files must contain an issues array at the top level.",
      "Each imported issue requires a title field.",
      "Optional fields include description, type, priority, status, assigneeId, labels, estimatedHours, and dueDate.",
      "JSON imports keep a provided status when present; otherwise issues start in the first workflow state.",
    ],
    label: "JSON",
  },
};

/**
 * Returns whether a selected file name matches the currently selected import
 * or export format by extension.
 */
export function fileMatchesImportExportFormat(
  fileName: string,
  format: ImportExportFormat,
): boolean {
  return fileName.toLowerCase().endsWith(`.${IMPORT_EXPORT_FORMATS[format].extension}`);
}
