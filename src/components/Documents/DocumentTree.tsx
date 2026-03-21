/**
 * Document Tree
 *
 * Hierarchical navigation tree for project documents.
 * Supports nested folders, drag-and-drop reordering, and favorites.
 * Displays document icons based on type with expand/collapse state.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

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

function TreeChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return <Icon icon={isExpanded ? ChevronDown : ChevronRight} size="xsPlus" />;
}

/** Hierarchical tree view of documents with favorites, archived, and folder sections. */
export function DocumentTree({
  organizationId,
  orgSlug,
  selectedId,
  onCreateDocument,
}: DocumentTreeProps) {
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const rootDocs = useAuthenticatedQuery(api.documents.listChildren, {
    organizationId,
    parentId: undefined,
  });

  const favorites = useAuthenticatedQuery(api.documents.listFavorites, {
    organizationId,
    limit: 10,
  });

  const archived = useAuthenticatedQuery(api.documents.listArchived, {
    organizationId,
    limit: 10,
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateDocument()}
              leftIcon={<Icon icon={Plus} size="sm" />}
            >
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
          leftIcon={<Icon icon={Plus} size="sm" />}
        >
          New Document
        </Button>
      )}

      {/* Favorites Section */}
      {favorites && favorites.length > 0 && (
        <div className="mb-2">
          <Button
            chrome="documentTreeSection"
            chromeSize="documentTreeSection"
            onClick={() => setFavoritesExpanded((prev) => !prev)}
            aria-expanded={favoritesExpanded}
            aria-controls="favorites-documents-list"
          >
            <TreeChevronIcon isExpanded={favoritesExpanded} />
            <Icon icon={Star} size="sm" tone="warning" fill="currentColor" />
            <Typography variant="small">Favorites</Typography>
          </Button>

          {favoritesExpanded && (
            <Stack
              id="favorites-documents-list"
              role="region"
              aria-label="Favorites documents"
              gap="none"
            >
              {favorites.map((doc) => (
                <Link
                  key={doc._id}
                  to={ROUTES.documents.detail.path}
                  params={{ orgSlug, id: doc._id }}
                  className="block"
                >
                  <Card
                    recipe={selectedId === doc._id ? "documentTreeRowSelected" : "documentTreeRow"}
                    padding="xs"
                    hoverable={selectedId !== doc._id}
                    className={cn("ml-6", selectedId !== doc._id && "text-ui-text-secondary")}
                  >
                    <Flex align="center" gap="xs">
                      <Icon icon={File} size="sm" tone="tertiary" className="shrink-0" />
                      <Typography
                        variant={selectedId === doc._id ? "label" : "small"}
                        className="truncate"
                        title={doc.title || "Untitled"}
                      >
                        {doc.title || "Untitled"}
                      </Typography>
                    </Flex>
                  </Card>
                </Link>
              ))}
            </Stack>
          )}
        </div>
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

      {/* Archived Section */}
      {archived && archived.length > 0 && (
        <div className="mt-4 border-t border-ui-border">
          <Button
            chrome="documentTreeSectionMuted"
            chromeSize="documentTreeSection"
            onClick={() => setArchivedExpanded((prev) => !prev)}
            aria-expanded={archivedExpanded}
            aria-controls="archived-documents-list"
          >
            <TreeChevronIcon isExpanded={archivedExpanded} />
            <Icon icon={Archive} size="sm" />
            <Typography variant="small">Archived</Typography>
            <Typography variant="small" className="ml-auto text-ui-text-tertiary">
              {archived.length}
            </Typography>
          </Button>

          {archivedExpanded && (
            <Stack
              id="archived-documents-list"
              role="region"
              aria-label="Archived documents"
              gap="none"
            >
              {archived.map((doc) => (
                <Link
                  key={doc._id}
                  to={ROUTES.documents.detail.path}
                  params={{ orgSlug, id: doc._id }}
                  className="block"
                >
                  <Card
                    recipe={selectedId === doc._id ? "documentTreeRowSelected" : "documentTreeRow"}
                    padding="xs"
                    hoverable={selectedId !== doc._id}
                    className={cn("ml-6", selectedId !== doc._id && "text-ui-text-tertiary")}
                  >
                    <Flex align="center" gap="xs">
                      <Icon icon={File} size="sm" tone="tertiary" className="shrink-0" />
                      <Typography
                        variant={selectedId === doc._id ? "label" : "small"}
                        className="truncate"
                        title={doc.title || "Untitled"}
                      >
                        {doc.title || "Untitled"}
                      </Typography>
                    </Flex>
                  </Card>
                </Link>
              ))}
            </Stack>
          )}
        </div>
      )}
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

function ExpandToggle({
  hasChildren,
  isExpanded,
  title,
  onToggle,
}: {
  hasChildren: boolean;
  isExpanded: boolean;
  title: string;
  onToggle: (e: React.MouseEvent) => void;
}) {
  if (!hasChildren) {
    return <FlexItem as="span" aria-hidden shrink={false} className="h-5 w-5" />;
  }
  return (
    <Button
      chrome="documentTreeToggle"
      chromeSize="documentTreeToggle"
      onClick={onToggle}
      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title}`}
      aria-expanded={isExpanded}
    >
      <TreeChevronIcon isExpanded={isExpanded} />
    </Button>
  );
}

function DocumentIcon({ hasChildren, isExpanded }: { hasChildren: boolean; isExpanded: boolean }) {
  const IconComponent = hasChildren && isExpanded ? FolderOpen : File;
  return <IconComponent className="w-4 h-4 shrink-0 text-ui-text-tertiary" />;
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

  const children = useAuthenticatedQuery(
    api.documents.listChildren,
    isExpanded ? { organizationId, parentId: node._id } : "skip",
  );

  const { mutate: moveDocument } = useAuthenticatedMutation(api.documents.moveDocument);

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
        <Card
          recipe={isSelected ? "documentTreeRowSelected" : "documentTreeRow"}
          padding="xs"
          hoverable={!isSelected}
          className={cn("group", !isSelected && "text-ui-text-secondary")}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <Flex align="center" gap="xs">
            <ExpandToggle
              hasChildren={node.hasChildren}
              isExpanded={isExpanded}
              title={node.title || "Untitled"}
              onToggle={handleToggle}
            />
            <DocumentIcon hasChildren={node.hasChildren} isExpanded={isExpanded} />

            {/* Title */}
            <FlexItem flex="1" className="min-w-0">
              <Typography
                variant={isSelected ? "label" : "small"}
                className="truncate"
                title={node.title || "Untitled"}
              >
                {node.title || "Untitled"}
              </Typography>
            </FlexItem>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  reveal
                  onClick={(e) => e.preventDefault()}
                  aria-label={`Open actions for ${node.title || "Untitled"}`}
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
                    icon={<Icon icon={Plus} size="sm" />}
                  >
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
        </Card>
      </Link>

      {/* Children */}
      {isExpanded && (
        <div>
          {children === undefined ? (
            <Card variant="ghost" padding="sm" className="ml-6">
              <Skeleton className="h-6 w-3/4" />
            </Card>
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
