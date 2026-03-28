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
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getDocumentTreeDisclosureButtonClassName,
  getDocumentTreeRowButtonClassName,
} from "@/components/ui/buttonSurfaceClassNames";
import { Card } from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
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
} from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
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

function getDocumentTitle(title: string | undefined) {
  return title || "Untitled";
}

function TreeChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return <Icon icon={isExpanded ? ChevronDown : ChevronRight} size="xsPlus" />;
}

function DocumentTreeRow({
  action,
  className,
  icon,
  isSelected,
  orgSlug,
  documentId,
  paddingLeft,
  title,
}: {
  action?: React.ReactNode;
  className?: string;
  icon: React.ReactNode;
  isSelected: boolean;
  orgSlug: string;
  documentId: Id<"documents">;
  paddingLeft?: number;
  title: string;
}) {
  return (
    <Link to={ROUTES.documents.detail.path} params={{ orgSlug, id: documentId }} className="block">
      <Card
        recipe={isSelected ? "documentTreeRowSelected" : "documentTreeRow"}
        padding="xs"
        hoverable={!isSelected}
        className={cn(className, !isSelected && "text-ui-text-secondary")}
        style={paddingLeft === undefined ? undefined : { paddingLeft: `${paddingLeft}px` }}
      >
        <Flex align="center" gap="xs">
          {icon}
          <FlexItem flex="1" className="min-w-0">
            <Typography variant={isSelected ? "label" : "small"} className="truncate" title={title}>
              {title}
            </Typography>
          </FlexItem>
          {action}
        </Flex>
      </Card>
    </Link>
  );
}

function DocumentTreeLinkRow({
  docId,
  icon,
  orgSlug,
  selectedId,
  title,
  tone = "secondary",
}: {
  docId: Id<"documents">;
  icon: React.ReactNode;
  orgSlug: string;
  selectedId?: Id<"documents">;
  title: string;
  tone?: "secondary" | "tertiary";
}) {
  return (
    <DocumentTreeRow
      title={title}
      orgSlug={orgSlug}
      documentId={docId}
      isSelected={selectedId === docId}
      icon={icon}
      className={cn("ml-6", tone === "tertiary" && selectedId !== docId && "text-ui-text-tertiary")}
    />
  );
}

function DocumentTreeSection({
  ariaLabel,
  children,
  expanded,
  icon,
  id,
  label,
  muted = false,
  trailing,
  onToggle,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  expanded: boolean;
  icon: React.ReactNode;
  id: string;
  label: string;
  muted?: boolean;
  trailing?: React.ReactNode;
  onToggle: () => void;
}) {
  return (
    <div>
      <Button
        variant="unstyled"
        size="content"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={id}
        className={getDocumentTreeRowButtonClassName(muted)}
      >
        <TreeChevronIcon isExpanded={expanded} />
        {icon}
        <Typography variant="small">{label}</Typography>
        {trailing}
      </Button>

      {expanded && (
        <Stack id={id} role="region" aria-label={ariaLabel} gap="none">
          {children}
        </Stack>
      )}
    </div>
  );
}

function DocumentTreeChildren({
  nodes,
  organizationId,
  orgSlug,
  selectedId,
  onCreateDocument,
  depth,
}: {
  nodes: TreeNode[] | undefined;
  organizationId: Id<"organizations">;
  orgSlug: string;
  selectedId?: Id<"documents">;
  onCreateDocument?: (parentId?: Id<"documents">) => void;
  depth: number;
}) {
  if (nodes === undefined) {
    return (
      <Card variant="ghost" padding="sm" className="ml-6">
        <Skeleton className="h-6 w-3/4" />
      </Card>
    );
  }

  return nodes.map((child) => (
    <TreeNodeItem
      key={child._id}
      node={child}
      organizationId={organizationId}
      orgSlug={orgSlug}
      selectedId={selectedId}
      onCreateDocument={onCreateDocument}
      depth={depth + 1}
    />
  ));
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
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Create your first document to get started."
        size="compact"
        action={
          onCreateDocument
            ? { label: "New Document", onClick: () => onCreateDocument() }
            : undefined
        }
      />
    );
  }

  return (
    <Stack gap="sm" className="overflow-y-auto">
      {onCreateDocument && (
        <Button
          variant="ghost"
          size="sm"
          className="mx-2 justify-start"
          onClick={() => onCreateDocument()}
          leftIcon={<Icon icon={Plus} size="sm" />}
          data-testid={TEST_IDS.DOCUMENT.NEW_BUTTON}
        >
          New Document
        </Button>
      )}

      {/* Favorites Section */}
      {favorites && favorites.length > 0 && (
        <DocumentTreeSection
          id="favorites-documents-list"
          ariaLabel="Favorites documents"
          expanded={favoritesExpanded}
          icon={<Icon icon={Star} size="sm" tone="warning" fill="currentColor" />}
          label="Favorites"
          onToggle={() => setFavoritesExpanded((prev) => !prev)}
        >
          {favorites.map((doc) => (
            <DocumentTreeLinkRow
              key={doc._id}
              docId={doc._id}
              icon={<Icon icon={File} size="sm" tone="tertiary" className="shrink-0" />}
              orgSlug={orgSlug}
              selectedId={selectedId}
              title={getDocumentTitle(doc.title)}
            />
          ))}
        </DocumentTreeSection>
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
        <div className="border-t border-ui-border">
          <DocumentTreeSection
            id="archived-documents-list"
            ariaLabel="Archived documents"
            expanded={archivedExpanded}
            icon={<Icon icon={Archive} size="sm" />}
            label="Archived"
            muted
            trailing={
              <Typography variant="small" className="ml-auto text-ui-text-tertiary">
                {archived.length}
              </Typography>
            }
            onToggle={() => setArchivedExpanded((prev) => !prev)}
          >
            {archived.map((doc) => (
              <DocumentTreeLinkRow
                key={doc._id}
                docId={doc._id}
                icon={<Icon icon={File} size="sm" tone="tertiary" className="shrink-0" />}
                orgSlug={orgSlug}
                selectedId={selectedId}
                title={getDocumentTitle(doc.title)}
                tone="tertiary"
              />
            ))}
          </DocumentTreeSection>
        </div>
      )}
    </Stack>
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
    return <FlexItem as="span" aria-hidden shrink={false} className="size-5" />;
  }
  return (
    <Button
      variant="unstyled"
      size="content"
      onClick={onToggle}
      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title}`}
      aria-expanded={isExpanded}
      className={getDocumentTreeDisclosureButtonClassName()}
    >
      <TreeChevronIcon isExpanded={isExpanded} />
    </Button>
  );
}

function DocumentIcon({ hasChildren, isExpanded }: { hasChildren: boolean; isExpanded: boolean }) {
  const IconComponent = hasChildren && isExpanded ? FolderOpen : File;
  return <Icon icon={IconComponent} size="sm" tone="tertiary" className="shrink-0" />;
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
      <DocumentTreeRow
        title={getDocumentTitle(node.title)}
        orgSlug={orgSlug}
        documentId={node._id}
        isSelected={isSelected}
        className={cn("group", !isSelected && "text-ui-text-secondary")}
        paddingLeft={depth * 16 + 8}
        icon={
          <>
            <ExpandToggle
              hasChildren={node.hasChildren}
              isExpanded={isExpanded}
              title={getDocumentTitle(node.title)}
              onToggle={handleToggle}
            />
            <DocumentIcon hasChildren={node.hasChildren} isExpanded={isExpanded} />
          </>
        }
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                reveal
                onClick={(e) => e.preventDefault()}
                aria-label={`Open actions for ${getDocumentTitle(node.title)}`}
              >
                <Icon icon={MoreHorizontal} size="sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" width="md">
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
        }
      />

      {/* Children */}
      {isExpanded && (
        <DocumentTreeChildren
          nodes={children as TreeNode[] | undefined}
          organizationId={organizationId}
          orgSlug={orgSlug}
          selectedId={selectedId}
          onCreateDocument={onCreateDocument}
          depth={depth}
        />
      )}
    </div>
  );
}
