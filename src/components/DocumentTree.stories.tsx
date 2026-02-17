import type { Meta, StoryObj } from "@storybook/react";
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
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { Flex, FlexItem } from "./ui/Flex";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface TreeNode {
  _id: string;
  title: string;
  isPublic: boolean;
  parentId?: string;
  isOwner: boolean;
  children: TreeNode[];
  depth: number;
}

interface DocumentTreePresentationalProps {
  tree?: TreeNode[];
  selectedId?: string;
  isLoading?: boolean;
  onCreateDocument?: (parentId?: string) => void;
  onSelectDocument?: (id: string) => void;
}

// =============================================================================
// Presentational Components
// =============================================================================

function TreeNodeItem({
  node,
  selectedId,
  onCreateDocument,
  onSelectDocument,
}: {
  node: TreeNode;
  selectedId?: string;
  onCreateDocument?: (parentId?: string) => void;
  onSelectDocument?: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(node.depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node._id;
  const depth = node.depth ?? 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelectDocument?.(node._id)}
        className="block w-full text-left"
      >
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
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-ui-bg-tertiary transition-all"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onCreateDocument && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateDocument(node._id);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add subpage
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </Flex>
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <TreeNodeItem
              key={child._id}
              node={child}
              selectedId={selectedId}
              onCreateDocument={onCreateDocument}
              onSelectDocument={onSelectDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentTreePresentational({
  tree = [],
  selectedId,
  isLoading = false,
  onCreateDocument,
  onSelectDocument,
}: DocumentTreePresentationalProps) {
  if (isLoading) {
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
          node={node}
          selectedId={selectedId}
          onCreateDocument={onCreateDocument}
          onSelectDocument={onSelectDocument}
        />
      ))}
    </Flex>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockTree: TreeNode[] = [
  {
    _id: "doc-1",
    title: "Getting Started",
    isPublic: true,
    isOwner: true,
    depth: 0,
    children: [
      {
        _id: "doc-1-1",
        title: "Installation Guide",
        isPublic: true,
        parentId: "doc-1",
        isOwner: true,
        depth: 1,
        children: [],
      },
      {
        _id: "doc-1-2",
        title: "Configuration",
        isPublic: true,
        parentId: "doc-1",
        isOwner: true,
        depth: 1,
        children: [
          {
            _id: "doc-1-2-1",
            title: "Environment Variables",
            isPublic: true,
            parentId: "doc-1-2",
            isOwner: true,
            depth: 2,
            children: [],
          },
        ],
      },
    ],
  },
  {
    _id: "doc-2",
    title: "API Reference",
    isPublic: true,
    isOwner: true,
    depth: 0,
    children: [
      {
        _id: "doc-2-1",
        title: "Authentication",
        isPublic: true,
        parentId: "doc-2",
        isOwner: true,
        depth: 1,
        children: [],
      },
      {
        _id: "doc-2-2",
        title: "Endpoints",
        isPublic: true,
        parentId: "doc-2",
        isOwner: true,
        depth: 1,
        children: [],
      },
    ],
  },
  {
    _id: "doc-3",
    title: "Changelog",
    isPublic: true,
    isOwner: true,
    depth: 0,
    children: [],
  },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof DocumentTreePresentational> = {
  title: "Components/DocumentTree",
  component: DocumentTreePresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A hierarchical tree view for documents. Supports nested documents, expand/collapse, selection, and creating new documents.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-64 p-2 bg-ui-bg border border-ui-border rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    tree: mockTree,
    onCreateDocument: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Document tree with nested documents and a create button.",
      },
    },
  },
};

export const WithSelection: Story = {
  args: {
    tree: mockTree,
    selectedId: "doc-1-2",
    onCreateDocument: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Document tree with a selected document highlighted.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Loading state with skeleton placeholders.",
      },
    },
  },
};

export const Empty: Story = {
  args: {
    tree: [],
    onCreateDocument: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when no documents exist.",
      },
    },
  },
};

export const EmptyReadOnly: Story = {
  args: {
    tree: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state without create button (read-only mode).",
      },
    },
  },
};

export const FlatList: Story = {
  args: {
    tree: [
      { _id: "doc-1", title: "Document 1", isPublic: true, isOwner: true, depth: 0, children: [] },
      { _id: "doc-2", title: "Document 2", isPublic: true, isOwner: true, depth: 0, children: [] },
      { _id: "doc-3", title: "Document 3", isPublic: true, isOwner: true, depth: 0, children: [] },
      { _id: "doc-4", title: "Document 4", isPublic: true, isOwner: true, depth: 0, children: [] },
    ],
    onCreateDocument: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Flat list of documents without nesting.",
      },
    },
  },
};

export const DeeplyNested: Story = {
  args: {
    tree: [
      {
        _id: "doc-1",
        title: "Root Document",
        isPublic: true,
        isOwner: true,
        depth: 0,
        children: [
          {
            _id: "doc-1-1",
            title: "Level 1",
            isPublic: true,
            parentId: "doc-1",
            isOwner: true,
            depth: 1,
            children: [
              {
                _id: "doc-1-1-1",
                title: "Level 2",
                isPublic: true,
                parentId: "doc-1-1",
                isOwner: true,
                depth: 2,
                children: [
                  {
                    _id: "doc-1-1-1-1",
                    title: "Level 3",
                    isPublic: true,
                    parentId: "doc-1-1-1",
                    isOwner: true,
                    depth: 3,
                    children: [
                      {
                        _id: "doc-1-1-1-1-1",
                        title: "Level 4",
                        isPublic: true,
                        parentId: "doc-1-1-1-1",
                        isOwner: true,
                        depth: 4,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    onCreateDocument: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Deeply nested document hierarchy showing indentation levels.",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | undefined>("doc-1");

    return (
      <div>
        <Typography variant="small" color="secondary" className="mb-2 px-2">
          Selected: {selectedId || "None"}
        </Typography>
        <DocumentTreePresentational
          tree={mockTree}
          selectedId={selectedId}
          onSelectDocument={setSelectedId}
          onCreateDocument={(parentId) => {
            alert(`Create document${parentId ? ` under ${parentId}` : " at root"}`);
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo where you can select documents and trigger actions.",
      },
    },
  },
};

export const InSidebar: Story = {
  render: () => (
    <Flex direction="column" className="w-64 bg-ui-bg-secondary border-r border-ui-border h-96">
      <div className="p-3 border-b border-ui-border">
        <Typography variant="label">Documents</Typography>
      </div>
      <FlexItem flex="1" className="overflow-y-auto py-2">
        <DocumentTreePresentational
          tree={mockTree}
          selectedId="doc-2-1"
          onCreateDocument={() => {}}
        />
      </FlexItem>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Document tree shown in a sidebar context.",
      },
    },
  },
};
