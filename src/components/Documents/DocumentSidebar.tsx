/**
 * Document Navigation Sidebar
 *
 * Provides document metadata and table of contents for navigation.
 * Features:
 * - Document info (author, dates, visibility)
 * - Table of contents generated from headings
 * - Collapsible sections
 */

import { ChevronDown, FileText, Hash, Info, List, User } from "lucide-react";
import type { Value } from "platejs";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface HeadingItem {
  id: string;
  level: number;
  text: string;
}

interface DocumentInfo {
  creatorName: string;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  isArchived?: boolean;
  projectName?: string;
}

interface DocumentSidebarProps {
  /** Editor value to extract headings from */
  editorValue: Value;
  /** Document metadata */
  documentInfo: DocumentInfo;
  /** Whether the sidebar is visible */
  isOpen: boolean;
  /** Toggle sidebar visibility */
  onToggle: () => void;
  /** Callback when a TOC item is clicked */
  onHeadingClick?: (headingId: string) => void;
}

/**
 * Section wrapper with collapsible header
 */
function SidebarSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-ui-border/30 last:border-b-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start rounded-none"
      >
        <Icon className="h-4 w-4" />
        <Typography variant="caption" className="uppercase tracking-widest flex-1 text-left">
          {title}
        </Typography>
        <ChevronDown
          className={cn("h-3 w-3 transition-transform duration-default", !isOpen && "-rotate-90")}
        />
      </Button>
      {isOpen && (
        <Card padding="sm" variant="ghost" className="pt-0">
          {children}
        </Card>
      )}
    </section>
  );
}

/**
 * Format timestamp to relative or absolute date
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Extract headings from Plate editor value
 */
function extractHeadings(value: Value): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const headingTypes = ["h1", "h2", "h3", "h4", "h5", "h6"];

  for (const node of value) {
    if (
      node &&
      typeof node === "object" &&
      "type" in node &&
      headingTypes.includes(node.type as string)
    ) {
      const level = parseInt((node.type as string).charAt(1), 10);
      const text = extractTextFromNode(node);
      if (text.trim()) {
        headings.push({
          id: (node as { id?: string }).id || `heading-${headings.length}`,
          level,
          text: text.trim(),
        });
      }
    }
  }

  return headings;
}

/**
 * Extract plain text from a Plate node
 */
function extractTextFromNode(node: unknown): string {
  if (!node || typeof node !== "object") return "";

  if ("text" in node && typeof (node as { text: string }).text === "string") {
    return (node as { text: string }).text;
  }

  if ("children" in node && Array.isArray((node as { children: unknown[] }).children)) {
    return (node as { children: unknown[] }).children.map(extractTextFromNode).join("");
  }

  return "";
}

/**
 * Table of Contents component
 */
function TableOfContents({
  headings,
  onHeadingClick,
}: {
  headings: HeadingItem[];
  onHeadingClick?: (headingId: string) => void;
}) {
  if (headings.length === 0) {
    return (
      <Flex align="center" gap="sm" className="text-ui-text-tertiary py-2">
        <FileText className="h-4 w-4" />
        <Typography variant="small">No headings found</Typography>
      </Flex>
    );
  }

  return (
    <Stack gap="none">
      {headings.map((heading) => (
        <Button
          key={heading.id}
          variant="ghost"
          size="sm"
          onClick={() => onHeadingClick?.(heading.id)}
          className="justify-start w-full truncate text-ui-text-secondary"
          style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
          title={heading.text}
        >
          <Hash className="h-3 w-3 shrink-0 opacity-50" />
          <span className="truncate">{heading.text}</span>
        </Button>
      ))}
    </Stack>
  );
}

/**
 * Document info row
 */
function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Flex align="center" justify="between" className="py-1">
      <Typography variant="small" color="secondary">
        {label}
      </Typography>
      <Typography variant="small">{value}</Typography>
    </Flex>
  );
}

/**
 * Main Document Sidebar Component
 */
export function DocumentSidebar({
  editorValue,
  documentInfo,
  isOpen,
  onToggle,
  onHeadingClick,
}: DocumentSidebarProps) {
  // Extract headings from editor value
  const headings = extractHeadings(editorValue);

  // Handle heading click - scroll to element
  const handleHeadingClick = useCallback(
    (headingId: string) => {
      onHeadingClick?.(headingId);
      // Try to scroll to the heading element
      const element = document.querySelector(`[data-block-id="${headingId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    [onHeadingClick],
  );

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="fixed right-4 top-20 z-10"
        aria-label="Open document sidebar"
        title="Open sidebar"
      >
        <List className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card
      padding="none"
      className="w-64 shrink-0 border-l border-ui-border bg-ui-bg-soft h-full overflow-y-auto"
    >
      {/* Close button */}
      <Flex align="center" justify="between" className="px-3 py-2 border-b border-ui-border/30">
        <Typography variant="label">Document</Typography>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-label="Close sidebar"
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </Flex>

      {/* Document Info */}
      <SidebarSection title="Info" icon={Info}>
        <Stack gap="xs">
          <InfoRow
            label="Author"
            value={
              <Flex align="center" gap="xs">
                <User className="h-3 w-3" />
                {documentInfo.creatorName}
              </Flex>
            }
          />
          <InfoRow label="Created" value={formatDate(documentInfo.createdAt)} />
          <InfoRow label="Modified" value={formatDate(documentInfo.updatedAt)} />
          <InfoRow
            label="Visibility"
            value={
              <Badge size="sm" variant={documentInfo.isPublic ? "success" : "secondary"}>
                {documentInfo.isPublic ? "Public" : "Private"}
              </Badge>
            }
          />
          {documentInfo.isArchived && (
            <InfoRow
              label="Status"
              value={
                <Badge size="sm" variant="warning">
                  Archived
                </Badge>
              }
            />
          )}
          {documentInfo.projectName && <InfoRow label="Project" value={documentInfo.projectName} />}
        </Stack>
      </SidebarSection>

      {/* Table of Contents */}
      <SidebarSection title="Contents" icon={List}>
        <TableOfContents headings={headings} onHeadingClick={handleHeadingClick} />
      </SidebarSection>
    </Card>
  );
}
