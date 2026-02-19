/**
 * Floating Toolbar for Plate Editor
 *
 * Appears when text is selected in the editor.
 * Provides quick access to formatting options.
 */

import { Bold, Code, Italic, Link, Strikethrough, Underline } from "lucide-react";
import {
  useEditorRef,
  useEditorSelection,
  useMarkToolbarButton,
  useMarkToolbarButtonState,
} from "platejs/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/Popover";
import { Separator } from "@/components/ui/Separator";
import { NODE_TYPES } from "@/lib/plate/plugins";
import { cn } from "@/lib/utils";

interface MarkButtonProps {
  nodeType: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}

function MarkButton({ nodeType, icon: Icon, tooltip }: MarkButtonProps) {
  const state = useMarkToolbarButtonState({ nodeType });
  const { props } = useMarkToolbarButton(state);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 w-7 p-0 text-ui-text-secondary transition-default",
        "hover:text-ui-text hover:bg-ui-bg-hover",
        state.pressed && "bg-brand-subtle text-brand",
      )}
      onMouseDown={props.onMouseDown}
      aria-label={tooltip}
      title={tooltip}
    >
      <Icon className="h-4 w-4" />
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
  const _editor = useEditorRef();
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
    const url = window.prompt("Enter URL:");
    if (url && selection) {
      // TODO: Implement proper link insertion with LinkPlugin
      // For now, just wrap the selection in a link
      console.debug("Link URL:", url);
    }
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
        className={cn(
          "w-auto p-1.5 flex items-center gap-0.5",
          "bg-ui-bg-elevated border border-ui-border shadow-elevated rounded-container",
          "animate-scale-in",
        )}
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

        <Separator orientation="vertical" className="h-5 mx-1.5 bg-ui-border" />

        <MarkButton nodeType={NODE_TYPES.code} icon={Code} tooltip="Inline Code (Ctrl+`)" />

        <Separator orientation="vertical" className="h-5 mx-1.5 bg-ui-border" />

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-ui-text-secondary transition-default hover:text-ui-text hover:bg-ui-bg-hover"
          onClick={handleLink}
          aria-label="Insert Link"
          title="Insert Link (Ctrl+K)"
        >
          <Link className="h-4 w-4" />
        </Button>
      </PopoverContent>
    </Popover>
  );
}
