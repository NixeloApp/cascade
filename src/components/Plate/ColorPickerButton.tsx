/**
 * Color Picker Button for Plate Editor
 *
 * Provides a dropdown color picker for font color and background color.
 */

import { ChevronDown, Highlighter, type LucideIcon, Type } from "lucide-react";
import { useEditorRef } from "platejs/react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ColorSwatchButton } from "@/components/ui/ColorSwatchButton";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";

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
  const TriggerIcon: LucideIcon = type === "fontColor" ? Type : Highlighter;
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
          variant="unstyled"
          chrome={currentColor ? "toolbarActive" : "toolbar"}
          chromeSize="toolbarControl"
          aria-label={tooltip}
          title={tooltip}
        >
          <span style={{ position: "relative", display: "inline-flex" }}>
            <Icon icon={TriggerIcon} size="sm" />
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -2,
                height: 2,
                borderRadius: 9999,
                backgroundColor:
                  currentColor || (type === "fontColor" ? "currentColor" : "transparent"),
              }}
            />
          </span>
          <Icon icon={ChevronDown} size="xs" opacity={0.5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        recipe="colorPicker"
        side="top"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Grid cols={6} gap="xs">
          {colors.map((color) => (
            <ColorSwatchButton
              key={color.name}
              color={color.value}
              selected={color.value === currentColor}
              empty={!color.value}
              checkColor={type === "fontColor" && color.value ? "white" : "var(--color-ui-text)"}
              onClick={() => applyColor(color.value)}
              title={color.name}
            />
          ))}
        </Grid>
      </PopoverContent>
    </Popover>
  );
}
