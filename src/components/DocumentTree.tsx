import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  FolderOpen,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { Flex } from "./ui/Flex";
import { Typography } from "./ui/Typography";

interface DocumentTreeProps {
  organizationId: Id<"organizations">;
  orgSlug: string;
  selectedId?: Id<"documents">;
  onCreateDocument?: (parentId?: Id<"documents">) => void;
}

interface TreeNode {
  _id: Id<"documents">;
  title: string;
  isPublic: boolean;
  parentId?: Id<"documents">;
  order?: number;
  isOwner: boolean;
  children: TreeNode[];
  depth: number;
}

export function DocumentTree({
  organizationId,
  orgSlug,
  selectedId,
  onCreateDocument,
}: DocumentTreeProps) {
  const tree = useQuery(api.documents.getTree, { organizationId });

  if (tree === undefined) {
    return (
      <Flex direction="column" gap="sm" className="p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-ui-bg-soft rounded animate-pulse" />
        ))}
      </Flex>
    );
  }

  if (tree.length === 0) {
    return (
      <Flex direction="column" align="center" className="p-4 text-center">
        <FileText className="w-8 h-8 text-ui-text-tertiary mb-2" />
        <Typography variant="small" color="secondary">
          No documents yet
        </Typography>
        {onCreateDocument && (
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => onCreateDocument()}>
            <Plus className="w-4 h-4 mr-1" />
            New Document
          </Button>
        )}
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="overflow-y-auto">
      {onCreateDocument && (
        <Button
          variant="ghost"
          size="sm"
          className="mx-2 mb-2 justify-start"
          onClick={() => onCreateDocument()}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      )}
      {tree.map((node) => (
        <TreeNodeItem
          key={node._id}
          node={node as TreeNode}
          orgSlug={orgSlug}
          selectedId={selectedId}
          onCreateDocument={onCreateDocument}
        />
      ))}
    </Flex>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  orgSlug: string;
  selectedId?: Id<"documents">;
  onCreateDocument?: (parentId?: Id<"documents">) => void;
}

function TreeNodeItem({ node, orgSlug, selectedId, onCreateDocument }: TreeNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node._id;
  const depth = node.depth ?? 0;

  const moveDocument = useMutation(api.documents.moveDocument);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const handleMoveToRoot = async () => {
    try {
      await moveDocument({ id: node._id, newParentId: undefined });
    } catch (error) {
      showError(error, "Failed to move document");
    }
  };

  return (
    <div>
      <Link to={ROUTES.documents.detail.path} params={{ orgSlug, id: node._id }} className="block">
        <Flex
          align="center"
          gap="xs"
          className={cn(
            "group px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            isSelected
              ? "bg-brand/10 text-brand"
              : "hover:bg-ui-bg-hover text-ui-text-secondary hover:text-ui-text",
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Expand/collapse toggle */}
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              "p-0.5 rounded hover:bg-ui-bg-tertiary transition-colors",
              !hasChildren && "invisible",
            )}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Document icon */}
          {hasChildren && isExpanded ? (
            <FolderOpen className="w-4 h-4 shrink-0 text-ui-text-tertiary" />
          ) : (
            <File className="w-4 h-4 shrink-0 text-ui-text-tertiary" />
          )}

          {/* Title */}
          <Typography
            variant="small"
            className={cn("flex-1 truncate", isSelected && "font-medium")}
          >
            {node.title || "Untitled"}
          </Typography>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ui-bg-tertiary transition-all"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onCreateDocument && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onCreateDocument(node._id);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add subpage
                </DropdownMenuItem>
              )}
              {node.parentId && node.isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleMoveToRoot}>Move to root</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </Link>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <TreeNodeItem
              key={child._id}
              node={child}
              orgSlug={orgSlug}
              selectedId={selectedId}
              onCreateDocument={onCreateDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}
