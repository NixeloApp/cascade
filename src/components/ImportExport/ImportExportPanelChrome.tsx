import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { IMPORT_EXPORT_FORMATS, type ImportExportFormat } from "./importExportFormats";

interface ImportExportFormatSelectorProps {
  label: string;
  onValueChange: (value: ImportExportFormat) => void;
  value: ImportExportFormat;
}

const FORMAT_ORDER: ImportExportFormat[] = ["csv", "json"];

interface ImportExportPanelChromeProps {
  children: ReactNode;
}

/**
 * Shared vertical shell for import and export modal content.
 */
export function ImportExportPanelChrome({ children }: ImportExportPanelChromeProps) {
  return <Stack gap="lg">{children}</Stack>;
}

/**
 * Shared format picker for import/export panels so both branches keep the same
 * icon, label, and tile treatment.
 */
export function ImportExportFormatSelector({
  label,
  onValueChange,
  value,
}: ImportExportFormatSelectorProps) {
  return (
    <div>
      <Typography variant="label" className="mb-3 text-ui-text">
        {label}
      </Typography>
      <Grid cols={2} gap="md">
        {FORMAT_ORDER.map((format) => {
          const meta = IMPORT_EXPORT_FORMATS[format];
          const isSelected = value === format;

          return (
            <Card
              key={format}
              recipe={isSelected ? "optionTileSelected" : "optionTile"}
              padding="md"
              onClick={() => onValueChange(format)}
              className="cursor-pointer"
              aria-pressed={isSelected}
            >
              <Flex gap="md" align="center">
                <Icon icon={meta.icon} size="lg" />
                <div>
                  <Typography variant="label" className="text-ui-text">
                    {meta.label}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {meta.description}
                  </Typography>
                </div>
              </Flex>
            </Card>
          );
        })}
      </Grid>
    </div>
  );
}

interface ImportExportInfoAlertProps {
  items: Array<{
    content: ReactNode;
    id: string;
  }>;
  title: string;
  variant: "info" | "warning";
}

/**
 * Shared list callout for the import and export panels so modal guidance reads
 * like one system instead of two unrelated card stacks.
 */
export function ImportExportInfoAlert({ items, title, variant }: ImportExportInfoAlertProps) {
  return (
    <Alert variant={variant}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <Stack as="ul" gap="xs" className="list-disc list-inside">
          {items.map((item) => (
            <Typography key={item.id} as="li" variant="small">
              {item.content}
            </Typography>
          ))}
        </Stack>
      </AlertDescription>
    </Alert>
  );
}
