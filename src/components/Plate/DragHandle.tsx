/**
 * Drag Handle for Plate Editor
 *
 * Appears on hover over blocks for drag-and-drop reordering.
 * Uses @platejs/dnd for drag-drop functionality.
 */

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEditorRef, useElement, useNodePath } from "platejs/react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { NODE_TYPES } from "@/lib/plate/plugins";
import { cn } from "@/lib/utils";

interface DragHandleProps {
  className?: string;
}

/**
 * Drag handle component for block elements
 * Must be rendered inside an element context within Plate
 */
export function DragHandle({ className }: DragHandleProps) {
  const editor = useEditorRef();
  const element = useElement();
  const path = useNodePath(element);
  const [isDragging, setIsDragging] = useState(false);

  // Handle delete block
  const handleDelete = () => {
    if (path) {
      editor.tf.removeNodes({ at: path });
    }
  };

  // Handle add block above
  const handleAddAbove = () => {
    if (path) {
      const newNode = {
        type: NODE_TYPES.paragraph,
        children: [{ text: "" }],
      };
      editor.tf.insertNodes(newNode, { at: path });
      // Focus the new node
      editor.tf.select({ path: [...path, 0], offset: 0 });
    }
  };

  // Handle add block below
  const handleAddBelow = () => {
    if (path) {
      const newNode = {
        type: NODE_TYPES.paragraph,
        children: [{ text: "" }],
      };
      // Get next path by incrementing last index
      const nextPath = [...path.slice(0, -1), path[path.length - 1] + 1];
      editor.tf.insertNodes(newNode, { at: nextPath });
      // Focus the new node
      editor.tf.select({ path: [...nextPath, 0], offset: 0 });
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    if (!path) return;

    setIsDragging(true);

    // Set drag data with path info
    e.dataTransfer.setData("application/x-plate-drag", JSON.stringify({ path }));
    e.dataTransfer.effectAllowed = "move";

    // Create a drag preview
    const dragImage = document.createElement("div");
    dragImage.className = "bg-brand-subtle border border-brand rounded p-2 text-sm";
    dragImage.textContent = "Moving block...";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // Remove the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  if (!element || !path) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute -left-10 top-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
        isDragging && "opacity-50",
        className,
      )}
      contentEditable={false}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <GripVertical className="h-4 w-4 text-ui-text-tertiary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="left">
          <DropdownMenuItem onSelect={handleAddAbove}>
            <Plus className="mr-2 h-4 w-4" />
            Add block above
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleAddBelow}>
            <Plus className="mr-2 h-4 w-4" />
            Add block below
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleDelete}
            className="text-status-error focus:text-status-error"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Block wrapper that shows drag handle on hover
 * Use this to wrap block elements
 */
export function DragHandleWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative group", className)}>
      <DragHandle />
      {children}
    </div>
  );
}
