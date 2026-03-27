/**
 * Color Picker Button for Plate Editor
 *
 * Provides a dropdown color picker for font color and background color.
 */

import { EDITOR_HIGHLIGHT_COLOR_OPTIONS, EDITOR_TEXT_COLOR_OPTIONS } from "@convex/shared/colors";
import { useEditorRef } from "platejs/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorSwatchButton } from "@/components/ui/ColorSwatchButton";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { ChevronDown, Highlighter, type LucideIcon, Type } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";

interface ColorPickerButtonProps {
  type: "fontColor" | "backgroundColor";
}

export function ColorPickerButton({ type }: ColorPickerButtonProps) {
  const editor = useEditorRef();
  const [open, setOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState("");

  const colors = type === "fontColor" ? EDITOR_TEXT_COLOR_OPTIONS : EDITOR_HIGHLIGHT_COLOR_OPTIONS;
  const TriggerIcon: LucideIcon = type === "fontColor" ? Type : Highlighter;
  const tooltip = type === "fontColor" ? "Text Color" : "Highlight";

  const applyColor = (color: string) => {
    if (!editor) return;

    // Remove the mark if no color selected
    if (!color) {
      editor.tf.removeMark(type);
    } else {
      editor.tf.addMark(type, color);
    }

    setCurrentColor(color);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="unstyled"
          chrome={currentColor ? "toolbarActive" : "toolbar"}
          chromeSize="toolbarControl"
          aria-label={tooltip}
          title={tooltip}
          data-testid={type === "fontColor" ? TEST_IDS.EDITOR.FONT_COLOR_TRIGGER : undefined}
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
              data-testid={
                type === "fontColor" ? TEST_IDS.EDITOR.FONT_COLOR_SWATCH(color.name) : undefined
              }
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
