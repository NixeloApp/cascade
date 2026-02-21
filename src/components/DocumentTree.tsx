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
import { Card } from "./ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { Skeleton } from "./ui/Skeleton";
import { Stack } from "./ui/Stack";
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
  hasChildren: boolean;
}

export function DocumentTree({
  organizationId,
  orgSlug,
  selectedId,
  onCreateDocument,
}: DocumentTreeProps) {
  const rootDocs = useQuery(api.documents.listChildren, {
    organizationId,
    parentId: undefined,
  });

  if (rootDocs === undefined) {
    return (
      <Card variant="flat" padding="sm">
        <Stack gap="sm">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </Stack>
      </Card>
    );
  }

  if (rootDocs.length === 0) {
    return (
      <Card variant="flat" padding="md">
        <Stack gap="sm" align="center" className="text-center">
          <Icon icon={FileText} size="xl" color="tertiary" />
          <Typography variant="small" color="secondary">
            No documents yet
          </Typography>
          {onCreateDocument && (
            <Button variant="ghost" size="sm" onClick={() => onCreateDocument()}>
              <Plus className="w-4 h-4 mr-1" />
              New Document
            </Button>
          )}
        </Stack>
      </Card>
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
      {rootDocs.map((node) => (
        <TreeNodeItem
          key={node._id}
          node={node as TreeNode}
          organizationId={organizationId}
          orgSlug={orgSlug}
          selectedId={selectedId}
          onCreateDocument={onCreateDocument}
          depth={0}
        />
      ))}
    </Flex>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  organizationId: Id<"organizations">;
  orgSlug: string;
  selectedId?: Id<"documents">;
  onCreateDocument?: (parentId?: Id<"documents">) => void;
  depth: number;
}

function TreeNodeItem({
  node,
  organizationId,
  orgSlug,
  selectedId,
  onCreateDocument,
  depth,
}: TreeNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedId === node._id;

  const children = useQuery(
    api.documents.listChildren,
    isExpanded ? { organizationId, parentId: node._id } : "skip",
  );

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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className={cn("h-5 w-5 p-0.5", !node.hasChildren && "invisible")}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </Button>

          {/* Document icon */}
          {node.hasChildren && isExpanded ? (
            <FolderOpen className="w-4 h-4 shrink-0 text-ui-text-tertiary" />
          ) : (
            <File className="w-4 h-4 shrink-0 text-ui-text-tertiary" />
          )}

          {/* Title */}
          <FlexItem flex="1" className="min-w-0">
            <Typography variant={isSelected ? "label" : "small"} className="truncate">
              {node.title || "Untitled"}
            </Typography>
          </FlexItem>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.preventDefault()}
                className="opacity-0 group-hover:opacity-100"
              >
                <Icon icon={MoreHorizontal} size="sm" />
              </Button>
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
      {isExpanded && (
        <div>
          {children === undefined ? (
            <div className="pl-6 py-2">
              <Skeleton className="h-6 w-3/4" />
            </div>
          ) : (
            children.map((child) => (
              <TreeNodeItem
                key={child._id}
                node={child as TreeNode}
                organizationId={organizationId}
                orgSlug={orgSlug}
                selectedId={selectedId}
                onCreateDocument={onCreateDocument}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
