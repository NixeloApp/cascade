/**
 * Document Navigation Sidebar
 *
 * Provides document metadata and table of contents for navigation.
 * Features:
 * - Document info (author, dates, visibility)
 * - Table of contents generated from headings
 * - Collapsible sections
 */

import { DAY } from "@convex/lib/timeUtils";
import type { Value } from "platejs";
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getSectionToggleButtonClassName } from "@/components/ui/buttonSurfaceClassNames";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import {
  getDocumentSidebarClosedToggleClassName,
  getDocumentSidebarEmptyContentsClassName,
  getDocumentSidebarHeaderClassName,
  getDocumentSidebarInfoRowClassName,
  getDocumentSidebarSectionBodyClassName,
  getDocumentSidebarSectionChevronClassName,
  getDocumentSidebarSectionClassName,
  getDocumentSidebarSectionTitleClassName,
  getDocumentSidebarShellClassName,
  getDocumentSidebarTocButtonClassName,
  getDocumentSidebarTocIconClassName,
  getDocumentSidebarTocTextClassName,
} from "@/components/ui/documentSidebarSurfaceClassNames";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Inline } from "@/components/ui/Inline";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { getDocumentHeadingAnchorElement } from "@/lib/documents/headingAnchors";
import {
  ChevronDown,
  FileText,
  Hash,
  Info,
  ListIcon as List,
  type LucideIcon,
  User,
} from "@/lib/icons";
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

const MIN_HEADING_LEVEL = 1;
const MAX_HEADING_LEVEL = 6;
const BASE_HEADING_INDENT_PX = 8;
const HEADING_LEVEL_INDENT_STEP_PX = 12;

function getHeadingIndentStyle(level: number): CSSProperties {
  const normalizedLevel = Math.min(MAX_HEADING_LEVEL, Math.max(MIN_HEADING_LEVEL, level));
  return {
    paddingLeft: `${(normalizedLevel - MIN_HEADING_LEVEL) * HEADING_LEVEL_INDENT_STEP_PX + BASE_HEADING_INDENT_PX}px`,
  };
}

/**
 * Section wrapper with collapsible header
 */
function SidebarSection({
  title,
  icon: SectionIcon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={getDocumentSidebarSectionClassName()}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={getSectionToggleButtonClassName()}
      >
        <Flex align="center" gap="sm">
          <Icon icon={SectionIcon} size="sm" />
          <Typography
            variant="eyebrow"
            as="span"
            className={getDocumentSidebarSectionTitleClassName()}
          >
            {title}
          </Typography>
        </Flex>
        <Icon
          icon={ChevronDown}
          size="xs"
          className={getDocumentSidebarSectionChevronClassName(isOpen)}
        />
      </Button>
      {isOpen && <div className={getDocumentSidebarSectionBodyClassName()}>{children}</div>}
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
  const diffDays = Math.floor(diffMs / DAY);

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
      <div className={getDocumentSidebarEmptyContentsClassName()}>
        <Flex align="center" gap="sm">
          <Icon icon={FileText} size="sm" />
          <Typography variant="small">No headings found</Typography>
        </Flex>
      </div>
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
          className={getDocumentSidebarTocButtonClassName()}
          style={getHeadingIndentStyle(heading.level)}
          title={heading.text}
        >
          <Icon
            icon={Hash}
            size="xs"
            tone="tertiary"
            className={getDocumentSidebarTocIconClassName()}
          />
          <Inline className={getDocumentSidebarTocTextClassName()}>{heading.text}</Inline>
        </Button>
      ))}
    </Stack>
  );
}

/**
 * Document info row
 */
function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  const isPlainValue = typeof value === "string" || typeof value === "number";

  return (
    <div
      className={cn(
        getCardRecipeClassName("documentSidebarInfoRow"),
        getDocumentSidebarInfoRowClassName(),
      )}
    >
      <Flex align="center" justify="between">
        <Typography variant="small" color="secondary">
          {label}
        </Typography>
        {isPlainValue ? (
          <Typography variant="small" as="span">
            {value}
          </Typography>
        ) : (
          <Flex align="center" justify="end">
            {value}
          </Flex>
        )}
      </Flex>
    </div>
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
  const handleHeadingClick = (headingId: string) => {
    onHeadingClick?.(headingId);
    const element = getDocumentHeadingAnchorElement(headingId);
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={getDocumentSidebarClosedToggleClassName()}
        aria-label="Open document sidebar"
        title="Open sidebar"
      >
        <Icon icon={List} size="sm" />
      </Button>
    );
  }

  return (
    <Card
      recipe="documentSidebarShell"
      padding="none"
      className={getDocumentSidebarShellClassName()}
    >
      {/* Close button */}
      <div
        className={cn(
          getCardRecipeClassName("documentSidebarHeader"),
          getDocumentSidebarHeaderClassName(),
        )}
      >
        <Flex align="center" justify="between">
          <Typography variant="label">Document</Typography>
          <IconButton
            variant="ghost"
            size="xs"
            tooltip="Close sidebar"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            ×
          </IconButton>
        </Flex>
      </div>

      {/* Document Info */}
      <SidebarSection title="Info" icon={Info}>
        <Stack gap="xs">
          <InfoRow
            label="Author"
            value={
              <Flex align="center" gap="xs">
                <Icon icon={User} size="xs" />
                <Typography variant="small" as="span">
                  {documentInfo.creatorName}
                </Typography>
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
