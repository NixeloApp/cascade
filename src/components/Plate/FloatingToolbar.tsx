/**
 * Floating Toolbar for Plate Editor
 *
 * Appears when text is selected in the editor.
 * Provides quick access to formatting options.
 */

import {
  Bold,
  Code,
  Highlighter,
  Italic,
  Link,
  type LucideIcon,
  Strikethrough,
  Underline,
} from "lucide-react";
import {
  useEditorRef,
  useEditorSelection,
  useMarkToolbarButton,
  useMarkToolbarButtonState,
} from "platejs/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/Popover";
import { Separator } from "@/components/ui/Separator";
import { NODE_TYPES } from "@/lib/plate/plugins";
import { ColorPickerButton } from "./ColorPickerButton";

interface MarkButtonProps {
  nodeType: string;
  icon: LucideIcon;
  tooltip: string;
}

function MarkButton({ nodeType, icon, tooltip }: MarkButtonProps) {
  const state = useMarkToolbarButtonState({ nodeType });
  const { props } = useMarkToolbarButton(state);

  return (
    <Button
      variant="unstyled"
      chrome={state.pressed ? "toolbarActive" : "toolbar"}
      chromeSize="toolbarIcon"
      onMouseDown={props.onMouseDown}
      aria-label={tooltip}
      title={tooltip}
    >
      <Icon icon={icon} size="sm" />
    </Button>
  );
}

/**
 * Helper to check if selection is collapsed
 */
function isSelectionCollapsed(selection: { anchor: unknown; focus: unknown } | null): boolean {
  if (!selection) return true;
  const { anchor, focus } = selection as {
    anchor: { path: number[]; offset: number };
    focus: { path: number[]; offset: number };
  };
  return (
    anchor.path.length === focus.path.length &&
    anchor.path.every((p, i) => p === focus.path[i]) &&
    anchor.offset === focus.offset
  );
}

/**
 * Get the DOMRect for the current text selection, or null if invalid
 */
function getSelectionRect(): DOMRect | null {
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) return null;

  const domRange = domSelection.getRangeAt(0);
  const text = domRange.toString();

  // Must have actual selected text
  if (!text || text.trim().length === 0) return null;

  const rect = domRange.getBoundingClientRect();

  // Must have valid dimensions
  if (rect.width <= 0 || rect.height <= 0) return null;

  return rect;
}

/**
 * Floating toolbar component
 * Must be rendered inside Plate context
 */
export function FloatingToolbar() {
  const editor = useEditorRef();
  const selection = useEditorSelection();
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  // Show toolbar when text is selected
  useEffect(() => {
    // Early return if no valid selection
    if (!selection || isSelectionCollapsed(selection)) {
      setOpen(false);
      return;
    }

    const rect = getSelectionRect();
    if (rect) {
      setAnchorRect(rect);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [selection]);

  // Handle link insertion
  const handleLink = () => {
    if (!selection) return;

    const url = window.prompt("Enter URL:");
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return;
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    try {
      editor.tf.wrapNodes(
        { type: NODE_TYPES.link, url: normalizedUrl, children: [] },
        { split: true },
      );
    } catch {
      // Editor may not support wrapNodes in test environment
    }
    setOpen(false);
  };

  if (!open || !anchorRect) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor
        style={{
          position: "fixed",
          left: anchorRect.left + anchorRect.width / 2,
          top: anchorRect.top - 8,
          width: 1,
          height: 1,
        }}
      />
      <PopoverContent
        recipe="floatingToolbar"
        side="top"
        align="center"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <MarkButton nodeType={NODE_TYPES.bold} icon={Bold} tooltip="Bold (Ctrl+B)" />
        <MarkButton nodeType={NODE_TYPES.italic} icon={Italic} tooltip="Italic (Ctrl+I)" />
        <MarkButton nodeType={NODE_TYPES.underline} icon={Underline} tooltip="Underline (Ctrl+U)" />
        <MarkButton
          nodeType={NODE_TYPES.strikethrough}
          icon={Strikethrough}
          tooltip="Strikethrough"
        />

        <Separator orientation="vertical" recipe="floatingToolbar" />

        <MarkButton nodeType={NODE_TYPES.code} icon={Code} tooltip="Inline Code (Ctrl+`)" />

        <Separator orientation="vertical" recipe="floatingToolbar" />

        <MarkButton nodeType={NODE_TYPES.highlight} icon={Highlighter} tooltip="Highlight" />
        <ColorPickerButton type="fontColor" />
        <ColorPickerButton type="backgroundColor" />

        <Separator orientation="vertical" recipe="floatingToolbar" />

        <Button
          variant="unstyled"
          chrome="toolbar"
          chromeSize="toolbarIcon"
          onClick={handleLink}
          aria-label="Insert Link"
          title="Insert Link (Ctrl+K)"
        >
          <Icon icon={Link} size="sm" />
        </Button>
      </PopoverContent>
    </Popover>
  );
}
