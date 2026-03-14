/**
 * Drag Handle for Plate Editor
 *
 * Appears on hover over blocks for drag-and-drop reordering.
 * Uses @platejs/dnd for drag-drop functionality.
 */

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEditorRef, useElement, useNodePath } from "platejs/react";
import { useState } from "react";
import { getCardRecipeClassName } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { NODE_TYPES } from "@/lib/plate/plugins";
import { cn } from "@/lib/utils";

interface DragHandleProps {
  className?: string;
  visible?: boolean;
}

const DRAG_HANDLE_OFFSET = "-2.5rem";

/**
 * Drag handle component for block elements
 * Must be rendered inside an element context within Plate
 */
export function DragHandle({ className, visible = false }: DragHandleProps) {
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
    dragImage.className = getCardRecipeClassName("dragPreview");
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
    <Flex
      className={cn(className)}
      gap="xs"
      align="center"
      contentEditable={false}
      style={{ left: DRAG_HANDLE_OFFSET, position: "absolute", top: 0 }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            variant="dragHandle"
            size="xs"
            aria-label="Block actions"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{ opacity: isDragging || visible ? 1 : 0 }}
          >
            <Icon icon={GripVertical} size="sm" className="text-ui-text-tertiary" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="left">
          <DropdownMenuItem onSelect={handleAddAbove} icon={<Icon icon={Plus} size="sm" />}>
            Add block above
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleAddBelow} icon={<Icon icon={Plus} size="sm" />}>
            Add block below
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleDelete}
            variant="danger"
            icon={<Icon icon={Trash2} size="sm" />}
          >
            Delete block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
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
  const [isHandleVisible, setIsHandleVisible] = useState(false);

  const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsHandleVisible(false);
  };

  return (
    <Flex
      direction="column"
      className={cn(className)}
      onMouseEnter={() => setIsHandleVisible(true)}
      onMouseLeave={() => setIsHandleVisible(false)}
      onFocusCapture={() => setIsHandleVisible(true)}
      onBlurCapture={handleBlurCapture}
      style={{ position: "relative" }}
    >
      <DragHandle visible={isHandleVisible} />
      {children}
    </Flex>
  );
}
