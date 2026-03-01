/**
 * Color Picker Component
 *
 * Color selection with preset swatches.
 * Includes native input for custom colors.
 * Theme-aligned preset colors by default.
 */

import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  presetColors?: string[];
}

// Preset colors that align with our theme tokens (status, brand, accent)
const DEFAULT_PRESET_COLORS = [
  "#EF4444", // matches --color-status-error
  "#F59E0B", // matches --color-status-warning
  "#10B981", // matches --color-status-success
  "#3B82F6", // matches --color-status-info
  "#8B5CF6", // matches --color-issue-type-story
  "#EC4899", // matches --color-accent-muted
  "#6B7280", // matches --color-ui-text-secondary
  "#14B8A6", // matches --color-landing-accent-teal
];

export function ColorPicker({
  value,
  onChange,
  label = "Color",
  presetColors = DEFAULT_PRESET_COLORS,
}: ColorPickerProps) {
  return (
    <div>
      <Typography as="div" variant="small" className="block font-medium text-ui-text mb-2">
        {label}
      </Typography>
      <Flex gap="sm" wrap align="center">
        {presetColors.map((presetColor) => (
          <button
            key={presetColor}
            type="button"
            onClick={() => onChange(presetColor)}
            className={cn(
              "w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ui-border",
              value === presetColor && "ring-2 ring-offset-2 ring-ui-border scale-110",
            )}
            style={{ backgroundColor: presetColor }}
            title={presetColor}
            aria-label={`Select color ${presetColor}`}
          />
        ))}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-ui-border"
            title="Custom color"
            aria-label="Custom color picker"
          />
          <span className="absolute -bottom-5 left-0 text-xs text-ui-text-tertiary whitespace-nowrap">
            Custom
          </span>
        </div>
      </Flex>
    </div>
  );
}
