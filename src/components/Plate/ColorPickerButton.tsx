/**
 * Color Picker Button for Plate Editor
 *
 * Provides a dropdown color picker for font color and background color.
 */

import { Check, ChevronDown, Highlighter, Type } from "lucide-react";
import { useEditorRef } from "platejs/react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Grid } from "@/components/ui/Grid";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

// Preset color palette - semantic colors matching the design system
const TEXT_COLORS = [
  { name: "Default", value: "" },
  { name: "Gray", value: "#6b7280" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Amber", value: "#d97706" },
  { name: "Green", value: "#16a34a" },
  { name: "Teal", value: "#0d9488" },
  { name: "Blue", value: "#2563eb" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Purple", value: "#9333ea" },
  { name: "Pink", value: "#db2777" },
];

const HIGHLIGHT_COLORS = [
  { name: "None", value: "" },
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Purple", value: "#e9d5ff" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Orange", value: "#fed7aa" },
  { name: "Red", value: "#fecaca" },
  { name: "Gray", value: "#e5e7eb" },
];

interface ColorPickerButtonProps {
  type: "fontColor" | "backgroundColor";
}

export function ColorPickerButton({ type }: ColorPickerButtonProps) {
  const editor = useEditorRef();
  const [open, setOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState("");

  const colors = type === "fontColor" ? TEXT_COLORS : HIGHLIGHT_COLORS;
  const Icon = type === "fontColor" ? Type : Highlighter;
  const tooltip = type === "fontColor" ? "Text Color" : "Highlight";

  const applyColor = useCallback(
    (color: string) => {
      if (!editor) return;

      // Remove the mark if no color selected
      if (!color) {
        editor.tf.removeMark(type);
      } else {
        editor.tf.addMark(type, color);
      }

      setCurrentColor(color);
      setOpen(false);
    },
    [editor, type],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-1.5 gap-0.5 text-ui-text-secondary transition-default",
            "hover:text-ui-text hover:bg-ui-bg-hover",
            currentColor && "text-ui-text",
          )}
          aria-label={tooltip}
          title={tooltip}
        >
          <div className="relative">
            <Icon className="h-4 w-4" />
            {/* Color indicator bar */}
            <div
              className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
              style={{
                backgroundColor:
                  currentColor || (type === "fontColor" ? "currentColor" : "transparent"),
              }}
            />
          </div>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        side="top"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Grid cols={6} gap="xs">
          {colors.map((color) => (
            <Button
              key={color.name}
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "w-6 h-6 min-w-0 p-0 rounded border transition-default",
                "hover:scale-110 hover:shadow-sm",
                color.value === currentColor && "ring-2 ring-brand ring-offset-1",
                !color.value && "border-dashed border-ui-border-secondary",
              )}
              style={{
                backgroundColor: color.value || "transparent",
                borderColor: color.value ? color.value : undefined,
              }}
              onClick={() => applyColor(color.value)}
              title={color.name}
            >
              {color.value === currentColor && (
                <Check
                  className="h-3 w-3"
                  style={{
                    color: type === "fontColor" && color.value ? "white" : "var(--color-ui-text)",
                  }}
                />
              )}
              {!color.value && (
                <Typography variant="caption" color="tertiary">
                  ×
                </Typography>
              )}
            </Button>
          ))}
        </Grid>
      </PopoverContent>
    </Popover>
  );
}
