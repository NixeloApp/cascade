/**
 * Plate Editor Instance Factory
 *
 * Creates and configures Plate editor instances with all plugins.
 * Used by the PlateEditor component.
 */

import type { Value } from "platejs";
import { initialValue, issueDescriptionPlugins, platePlugins } from "./plugins";

/**
 * Options for creating a Plate editor
 */
export interface CreatePlateEditorOptions {
  /** Initial document value (Slate nodes) */
  value?: Value;
  /** Unique ID for the editor instance */
  id?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
}

/**
 * Get the plugins array for usePlateEditor hook
 */
export function getEditorPlugins() {
  return platePlugins;
}

/**
 * Get lightweight plugins for issue descriptions
 * Excludes tables, images, DnD - focused on text formatting
 */
export function getIssueDescriptionPlugins() {
  return issueDescriptionPlugins;
}

/**
 * Get initial value for a new document
 */
export function getInitialValue(): Value {
  return initialValue as Value;
}

/**
 * Serialize editor value to JSON string for storage
 */
export function serializeValue(value: Value): string {
  return JSON.stringify(value);
}

/**
 * Deserialize JSON string to editor value
 * Returns initial value if parsing fails
 */
export function deserializeValue(json: string | null | undefined): Value {
  if (!json) {
    return getInitialValue();
  }

  try {
    const parsed = JSON.parse(json) as Value;
    // Basic validation - must be an array with at least one element
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getInitialValue();
  } catch {
    return getInitialValue();
  }
}

interface ProseMirrorMark {
  type?: string;
  attrs?: Record<string, unknown>;
  /** @deprecated Legacy field — prefer attrs.value. Kept for snapshot compat. */
  value?: string;
}

interface ProseMirrorNodeLike {
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNodeLike[];
  marks?: ProseMirrorMark[];
  text?: string;
  type?: string;
  [key: string]: unknown;
}

interface ProseMirrorSnapshotLike {
  content?: ProseMirrorNodeLike[];
  type?: string;
}

interface PlateTextLeaf {
  backgroundColor?: string;
  bold?: boolean;
  code?: boolean;
  fontColor?: string;
  highlight?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  text?: string;
  underline?: boolean;
}

interface PlateElementLike {
  children?: Array<PlateChildLike>;
  type?: string;
  [key: string]: unknown;
}

type PlateChildLike = PlateTextLeaf | PlateElementLike;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function applyTextMarks(leaf: Record<string, unknown>, marks: ProseMirrorMark[] | undefined) {
  for (const mark of marks ?? []) {
    if (mark.type === "bold") leaf.bold = true;
    if (mark.type === "italic") leaf.italic = true;
    if (mark.type === "underline") leaf.underline = true;
    if (mark.type === "strike") leaf.strikethrough = true;
    if (mark.type === "code") leaf.code = true;
    if (mark.type === "highlight") leaf.highlight = true;
    if (mark.type === "fontColor") {
      const v = (mark.attrs?.value as string) ?? mark.value;
      if (v) leaf.fontColor = v;
    }
    if (mark.type === "backgroundColor") {
      const v = (mark.attrs?.value as string) ?? mark.value;
      if (v) leaf.backgroundColor = v;
    }
  }
}

function toTextLeaf(node: ProseMirrorNodeLike): Array<Record<string, unknown>> {
  if (node.type === "text") {
    const leaf: Record<string, unknown> = { text: node.text ?? "" };
    applyTextMarks(leaf, node.marks);
    return [leaf];
  }

  if (node.type === "hardBreak") {
    return [{ text: "\n" }];
  }

  // Preserve inline element nodes (links, mentions, etc.) as Plate elements
  // instead of flattening them to plain text.
  if (node.type && node.type !== "doc" && node.type !== "paragraph") {
    return pmPassthroughToPlate(node);
  }

  return toTextLeaves(node.content);
}

function toTextLeaves(nodes: ProseMirrorNodeLike[] | undefined): Array<Record<string, unknown>> {
  if (!nodes || nodes.length === 0) {
    return [{ text: "" }];
  }

  const leaves = nodes.flatMap(toTextLeaf);

  return leaves.length > 0 ? leaves : [{ text: "" }];
}

function pmHeadingToPlate(node: ProseMirrorNodeLike): Array<Record<string, unknown>> {
  const rawLevel = node.attrs?.level;
  const level = typeof rawLevel === "number" ? rawLevel : undefined;
  const headingType = level && level >= 1 && level <= 6 ? (`h${level}` as const) : ("h2" as const);

  return [{ type: headingType, children: toTextLeaves(node.content) }];
}

function pmListToPlate(
  plateType: "ul" | "ol",
  node: ProseMirrorNodeLike,
): Array<Record<string, unknown>> {
  return [
    {
      type: plateType,
      children: node.content?.flatMap(toBlockFromNode) ?? [
        { type: "li", children: [{ text: "" }] },
      ],
    },
  ];
}

function pmListItemToPlate(node: ProseMirrorNodeLike): Array<Record<string, unknown>> {
  const innerContent: Array<Record<string, unknown>> = node.content?.flatMap(
    (child): Array<Record<string, unknown>> => {
      if (child.type === "paragraph") {
        return toTextLeaves(child.content);
      }
      return toBlockFromNode(child);
    },
  ) ?? [{ text: "" }];

  return [{ type: "li", children: innerContent }];
}

function pmTableToPlate(node: ProseMirrorNodeLike): Array<Record<string, unknown>> {
  const rows = (node.content ?? []).map((row) => {
    const cells = (row.content ?? []).map((cell) => ({
      type: cell.type === "tableHeader" ? "th" : "td",
      children: cell.content ? cell.content.flatMap(toBlockFromNode) : [{ text: "" }],
    }));

    return { type: "tr", children: cells.length > 0 ? cells : [{ text: "" }] };
  });

  return [{ type: "table", children: rows.length > 0 ? rows : [{ text: "" }] }];
}

function pmImageToPlate(node: ProseMirrorNodeLike): Array<Record<string, unknown>> {
  return [
    {
      type: "img",
      url: (node.attrs?.src as string) ?? "",
      alt: (node.attrs?.alt as string) ?? "",
      children: [{ text: "" }],
    },
  ];
}

function isInlineProseMirrorNode(node: ProseMirrorNodeLike): boolean {
  return node.type === "text" || node.type === "hardBreak";
}

function pmPassthroughToPlate(node: ProseMirrorNodeLike): Array<Record<string, unknown>> {
  const { type: pmType, content, attrs, ...rest } = node;
  const result: Record<string, unknown> = { type: pmType, ...rest };

  if (attrs && typeof attrs === "object") {
    Object.assign(result, attrs);
  }

  if (!content || content.length === 0) {
    result.children = [{ text: "" }];
  } else if (content.every(isInlineProseMirrorNode)) {
    result.children = toTextLeaves(content);
  } else {
    result.children = content.flatMap(toBlockFromNode);
  }

  return [result];
}

const PM_TO_PLATE_HANDLERS: Record<
  string,
  (node: ProseMirrorNodeLike) => Array<Record<string, unknown>>
> = {
  heading: pmHeadingToPlate,
  blockquote: (n) => [{ type: "blockquote", children: toTextLeaves(n.content) }],
  codeBlock: (n) => [
    { type: "code_block", children: [{ type: "code_line", children: toTextLeaves(n.content) }] },
  ],
  paragraph: (n) => [{ type: "p", children: toTextLeaves(n.content) }],
  bulletList: (n) => pmListToPlate("ul", n),
  orderedList: (n) => pmListToPlate("ol", n),
  listItem: pmListItemToPlate,
  table: pmTableToPlate,
  image: pmImageToPlate,
};

function toBlockFromNode(node: ProseMirrorNodeLike): Array<Record<string, unknown>> {
  const handler = node.type ? PM_TO_PLATE_HANDLERS[node.type] : undefined;
  if (handler) {
    return handler(node);
  }

  // Restore passthrough nodes: reconstruct the original Plate element from
  // the opaque ProseMirror representation without data loss.
  if (node.type && node.type !== "doc") {
    return pmPassthroughToPlate(node);
  }

  return node.content ? toPlateBlocks(node.content) : [];
}

function toPlateBlocks(nodes: ProseMirrorNodeLike[] | undefined): Value {
  if (!nodes || nodes.length === 0) {
    return getInitialValue();
  }

  const blocks = nodes.flatMap(toBlockFromNode);

  return blocks.length > 0 ? (blocks as Value) : getInitialValue();
}

/**
 * Convert a stored ProseMirror snapshot into Plate/Slate value for initial hydration.
 * Supports the common block types used in seeded documents and version history.
 */
export function proseMirrorSnapshotToValue(snapshot: unknown): Value {
  if (!isRecord(snapshot)) {
    return getInitialValue();
  }

  const parsedSnapshot = snapshot as ProseMirrorSnapshotLike;
  if (parsedSnapshot.type !== "doc") {
    return getInitialValue();
  }

  return toPlateBlocks(parsedSnapshot.content);
}

function textToProseMirrorNodes(text: string, marks: ProseMirrorMark[] | undefined) {
  if (text.length === 0) {
    return [] as ProseMirrorNodeLike[];
  }

  const segments = text.split("\n");
  const nodes: ProseMirrorNodeLike[] = [];

  for (const [index, segment] of segments.entries()) {
    if (segment.length > 0) {
      nodes.push({
        type: "text",
        text: segment,
        marks,
      });
    }

    if (index < segments.length - 1) {
      nodes.push({ type: "hardBreak" });
    }
  }

  return nodes;
}

function leafToMarks(leaf: PlateTextLeaf) {
  const marks: ProseMirrorMark[] = [];

  if (leaf.bold) marks.push({ type: "bold" });
  if (leaf.italic) marks.push({ type: "italic" });
  if (leaf.underline) marks.push({ type: "underline" });
  if (leaf.strikethrough) marks.push({ type: "strike" });
  if (leaf.code) marks.push({ type: "code" });
  if (leaf.highlight) marks.push({ type: "highlight" });
  if (leaf.fontColor) marks.push({ type: "fontColor", attrs: { value: leaf.fontColor } });
  if (leaf.backgroundColor)
    marks.push({ type: "backgroundColor", attrs: { value: leaf.backgroundColor } });

  return marks.length > 0 ? marks : undefined;
}

function plateNodeToPlainText(node: PlateChildLike): string {
  if ("text" in node && typeof node.text === "string") {
    return node.text;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map(plateNodeToPlainText).join("");
  }

  return "";
}

function toInlineProseMirrorNodes(children: PlateChildLike[] | undefined): ProseMirrorNodeLike[] {
  if (!children || children.length === 0) {
    return [];
  }

  return children.flatMap((child) => {
    if ("text" in child && typeof (child as PlateTextLeaf).text === "string") {
      const leaf = child as PlateTextLeaf;
      return textToProseMirrorNodes(leaf.text ?? "", leafToMarks(leaf));
    }

    // Preserve inline elements (links, mentions, etc.) as passthrough nodes
    // instead of flattening them to plain text.
    if ("type" in child && typeof child.type === "string") {
      return [createPassthroughNode(child as PlateElementLike)];
    }

    return textToProseMirrorNodes(plateNodeToPlainText(child), undefined);
  });
}

function createParagraphNode(children: PlateChildLike[] | undefined): ProseMirrorNodeLike {
  const content = toInlineProseMirrorNodes(children);
  return content.length > 0 ? { type: "paragraph", content } : { type: "paragraph" };
}

function wrapListItemChildren(children: PlateChildLike[] | undefined): ProseMirrorNodeLike[] {
  if (!children || children.length === 0) {
    return [{ type: "paragraph" }];
  }

  const blockChildren = children.filter(
    (child): child is PlateElementLike => "type" in child && typeof child.type === "string",
  );

  const nestedListNodes = blockChildren.flatMap((child) => {
    if (child.type === "ul" || child.type === "ol") {
      return plateElementToProseMirrorNodes(child);
    }

    return [];
  });

  const inlineChildren = children.filter(
    (child) => !("type" in child) || (child.type !== "ul" && child.type !== "ol"),
  );
  const paragraph = createParagraphNode(inlineChildren);

  return paragraph.content && paragraph.content.length > 0
    ? [paragraph, ...nestedListNodes]
    : nestedListNodes.length > 0
      ? nestedListNodes
      : [{ type: "paragraph" }];
}

function createHeadingNode(
  level: number,
  children: PlateChildLike[] | undefined,
): ProseMirrorNodeLike {
  const content = toInlineProseMirrorNodes(children);
  return content.length > 0
    ? { type: "heading", attrs: { level }, content }
    : { type: "heading", attrs: { level } };
}

function createBlockquoteNode(children: PlateChildLike[] | undefined): ProseMirrorNodeLike {
  const content = toInlineProseMirrorNodes(children);
  return content.length > 0 ? { type: "blockquote", content } : { type: "blockquote" };
}

function createCodeBlockNode(children: PlateChildLike[] | undefined): ProseMirrorNodeLike {
  const text = (children ?? [])
    .map((child) => {
      if ("children" in child && Array.isArray(child.children)) {
        return child.children.map(plateNodeToPlainText).join("");
      }

      return plateNodeToPlainText(child);
    })
    .join("\n");
  const content = textToProseMirrorNodes(text, undefined);
  return content.length > 0 ? { type: "codeBlock", content } : { type: "codeBlock" };
}

function createListNode(
  type: "ul" | "ol",
  children: PlateChildLike[] | undefined,
): ProseMirrorNodeLike {
  const listType = type === "ul" ? "bulletList" : "orderedList";
  const items = (children ?? []).flatMap((child) => {
    if ("type" in child && child.type === "li") {
      return plateElementToProseMirrorNodes(child);
    }

    return [{ type: "listItem", content: wrapListItemChildren([child]) }];
  });

  return items.length > 0 ? { type: listType, content: items } : { type: listType };
}

function createTableNode(children: PlateChildLike[] | undefined): ProseMirrorNodeLike {
  const rows = (children ?? [])
    .filter((child): child is PlateElementLike => "type" in child && child.type === "tr")
    .map((row) => {
      const cells = (row.children ?? [])
        .filter(
          (cell): cell is PlateElementLike =>
            "type" in cell && (cell.type === "td" || cell.type === "th"),
        )
        .map((cell) => ({
          type: cell.type === "th" ? "tableHeader" : "tableCell",
          content: (cell.children ?? []).flatMap((child) => {
            if ("type" in child && typeof child.type === "string") {
              return plateElementToProseMirrorNodes(child as PlateElementLike);
            }
            return [createParagraphNode([child])];
          }),
        }));

      return { type: "tableRow", content: cells.length > 0 ? cells : undefined };
    });

  return { type: "table", content: rows.length > 0 ? rows : undefined };
}

function createImageNode(element: PlateElementLike): ProseMirrorNodeLike {
  const url = typeof element.url === "string" ? element.url : undefined;
  const alt = typeof element.alt === "string" ? element.alt : undefined;

  return {
    type: "image",
    attrs: { src: url, alt },
  };
}

function createPassthroughNode(element: PlateElementLike): ProseMirrorNodeLike {
  const { type, children, ...rest } = element;
  const node: ProseMirrorNodeLike = { type: type ?? "unknown" };

  if (Object.keys(rest).length > 0) {
    node.attrs = rest as Record<string, unknown>;
  }

  if (children && children.length > 0) {
    node.content = children.flatMap((child) => {
      if ("type" in child && typeof child.type === "string") {
        return plateElementToProseMirrorNodes(child as PlateElementLike);
      }
      return toInlineProseMirrorNodes([child]);
    });
  }

  return node;
}

function plateElementToProseMirrorNodes(element: PlateElementLike): ProseMirrorNodeLike[] {
  const type = element.type;

  if (!type || type === "p" || type === "paragraph") {
    return [createParagraphNode(element.children)];
  }

  if (/^h[1-6]$/.test(type)) {
    return [createHeadingNode(Number(type.slice(1)), element.children)];
  }

  if (type === "blockquote") {
    return [createBlockquoteNode(element.children)];
  }

  if (type === "code_block") {
    return [createCodeBlockNode(element.children)];
  }

  if (type === "ul" || type === "ol") {
    return [createListNode(type, element.children)];
  }

  if (type === "li") {
    return [{ type: "listItem", content: wrapListItemChildren(element.children) }];
  }

  if (type === "table") {
    return [createTableNode(element.children)];
  }

  if (type === "img") {
    return [createImageNode(element)];
  }

  // Preserve unrecognized element types as opaque ProseMirror nodes so that
  // round-tripping through snapshot serialization does not silently discard
  // structure (e.g. mentions, links, todo items, or future block types).
  return [createPassthroughNode(element)];
}

/**
 * Convert Plate/Slate value back into the ProseMirror snapshot shape stored by Convex.
 * This powers explicit document save/restore flows for the editor route.
 */
export function plateValueToProseMirrorSnapshot(value: Value): ProseMirrorSnapshotLike {
  if (!Array.isArray(value) || value.length === 0) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  const content = value.flatMap((node) => {
    if (node && typeof node === "object" && "type" in node) {
      return plateElementToProseMirrorNodes(node as PlateElementLike);
    }

    return [];
  });

  return content.length > 0
    ? { type: "doc", content }
    : { type: "doc", content: [{ type: "paragraph" }] };
}

/** Check if a node is an empty text node */
function isEmptyTextNode(node: unknown): boolean {
  return (
    node !== null &&
    typeof node === "object" &&
    "text" in node &&
    (node as { text: string }).text === ""
  );
}

/** Check if children array represents empty content */
function hasEmptyChildren(children: unknown[]): boolean {
  if (children.length === 0) return true;
  if (children.length === 1 && isEmptyTextNode(children[0])) return true;
  return false;
}

/** Check if a node is an empty paragraph */
function isEmptyParagraph(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  if (!("type" in node) || node.type !== "p") return false;
  if (!("children" in node) || !Array.isArray(node.children)) return false;
  return hasEmptyChildren(node.children);
}

/**
 * Check if a value is empty (only contains empty paragraph)
 */
export function isEmptyValue(value: Value): boolean {
  if (!Array.isArray(value) || value.length === 0) return true;
  if (value.length > 1) return false;
  return isEmptyParagraph(value[0]);
}

/**
 * Convert plain text to editor Value format
 * Splits by newlines and creates paragraphs
 */
export function plainTextToValue(text: string | null | undefined): Value {
  if (!text || text.trim() === "") {
    return getInitialValue();
  }

  // Split by newlines and create paragraphs
  const lines = text.split("\n");
  return lines.map((line) => ({
    type: "p",
    children: [{ text: line }],
  })) as Value;
}

/**
 * Convert editor Value to plain text
 * Extracts text content from all nodes
 */
export function valueToPlainText(value: Value): string {
  if (!Array.isArray(value)) return "";

  const extractText = (node: unknown): string => {
    if (!node || typeof node !== "object") return "";

    // Text node
    if ("text" in node && typeof (node as { text: string }).text === "string") {
      return (node as { text: string }).text;
    }

    // Element with children
    if ("children" in node && Array.isArray((node as { children: unknown[] }).children)) {
      return (node as { children: unknown[] }).children.map(extractText).join("");
    }

    return "";
  };

  return value.map(extractText).join("\n");
}
