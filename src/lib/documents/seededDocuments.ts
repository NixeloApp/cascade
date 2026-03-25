import type { Value } from "platejs";
import { getInitialValue, plateValueToProseMirrorSnapshot } from "@/lib/plate/editor";

type PlateTextLeaf = {
  backgroundColor?: string;
  bold?: boolean;
  code?: boolean;
  fontColor?: string;
  highlight?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  text: string;
  underline?: boolean;
};

type PlateChild = PlateTextLeaf | PlateElement;

type PlateElement = {
  checked?: boolean;
  children: PlateChild[];
  type: string;
};

type BlockNoteTextStyles = {
  backgroundColor?: string;
  bold?: boolean;
  code?: boolean;
  highlight?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  textColor?: string;
  underline?: boolean;
};

type BlockNoteInlineText = {
  styles?: BlockNoteTextStyles;
  text?: string;
  type?: string;
};

type BlockNoteBlock = {
  children?: unknown;
  content?: unknown;
  props?: Record<string, unknown>;
  type?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isBlockNoteBlock(value: unknown): value is BlockNoteBlock {
  return isRecord(value);
}

function toPlateTextLeaf(value: unknown): PlateTextLeaf | null {
  if (typeof value === "string") {
    return { text: value };
  }

  if (!isRecord(value)) {
    return null;
  }

  const inline = value as BlockNoteInlineText;
  const text = typeof inline.text === "string" ? inline.text : "";
  const styles = isRecord(inline.styles) ? inline.styles : undefined;

  return {
    text,
    bold: styles?.bold === true ? true : undefined,
    italic: styles?.italic === true ? true : undefined,
    underline: styles?.underline === true ? true : undefined,
    strikethrough: styles?.strikethrough === true ? true : undefined,
    code: styles?.code === true ? true : undefined,
    highlight: styles?.highlight === true ? true : undefined,
    backgroundColor:
      typeof styles?.backgroundColor === "string" ? styles.backgroundColor : undefined,
    fontColor: typeof styles?.textColor === "string" ? styles.textColor : undefined,
  };
}

function blockNoteInlineContentToLeaves(content: unknown): PlateTextLeaf[] {
  if (!Array.isArray(content) || content.length === 0) {
    return [{ text: "" }];
  }

  const leaves = content
    .map(toPlateTextLeaf)
    .filter((leaf): leaf is PlateTextLeaf => leaf !== null);

  return leaves.length > 0 ? leaves : [{ text: "" }];
}

function blockNoteChildrenToPlateBlocks(children: unknown): PlateElement[] {
  if (!Array.isArray(children)) {
    return [];
  }

  return blocksToPlateValue(children);
}

function createParagraphBlock(block: BlockNoteBlock): PlateElement {
  return {
    type: "p",
    children: blockNoteInlineContentToLeaves(block.content),
  };
}

function createHeadingBlock(block: BlockNoteBlock): PlateElement {
  const rawLevel = block.props?.level;
  const level = typeof rawLevel === "number" && rawLevel >= 1 && rawLevel <= 6 ? rawLevel : 2;

  return {
    type: `h${level}`,
    children: blockNoteInlineContentToLeaves(block.content),
  };
}

function createListItemChildren(block: BlockNoteBlock): PlateChild[] {
  const inlineChildren = blockNoteInlineContentToLeaves(block.content);
  const nestedBlocks = blockNoteChildrenToPlateBlocks(block.children);

  if (nestedBlocks.length === 0) {
    return inlineChildren;
  }

  return [...inlineChildren, ...nestedBlocks];
}

function createTodoItem(block: BlockNoteBlock): PlateElement {
  const checked = block.props?.checked;

  return {
    type: "todo_li",
    checked: checked === true ? true : undefined,
    children: createListItemChildren(block),
  };
}

function createBlockWithNestedChildren(type: string, block: BlockNoteBlock): PlateElement[] {
  const primaryBlock: PlateElement =
    type === "paragraph" ? createParagraphBlock(block) : createHeadingBlock(block);
  const nestedBlocks = blockNoteChildrenToPlateBlocks(block.children);
  return [primaryBlock, ...nestedBlocks];
}

function createListRun(
  blocks: BlockNoteBlock[],
  startIndex: number,
  listType: "bulletListItem" | "numberedListItem",
): { nextIndex: number; node: PlateElement } {
  const items: PlateElement[] = [];
  let index = startIndex;

  while (index < blocks.length && blocks[index]?.type === listType) {
    items.push({
      type: "li",
      children: createListItemChildren(blocks[index]),
    });
    index += 1;
  }

  return {
    nextIndex: index,
    node: {
      type: listType === "bulletListItem" ? "ul" : "ol",
      children: items.length > 0 ? items : [{ type: "li", children: [{ text: "" }] }],
    },
  };
}

function createBlocksFromBlock(block: BlockNoteBlock): PlateElement[] {
  switch (block.type) {
    case "heading":
      return createBlockWithNestedChildren("heading", block);
    case "paragraph":
      return createBlockWithNestedChildren("paragraph", block);
    case "checkListItem":
      return [createTodoItem(block)];
    default:
      return [createParagraphBlock(block)];
  }
}

function blocksToPlateValue(blocks: unknown[]): PlateElement[] {
  const normalizedBlocks = blocks.filter(isBlockNoteBlock);
  const value: PlateElement[] = [];
  let index = 0;

  while (index < normalizedBlocks.length) {
    const block = normalizedBlocks[index];

    if (block.type === "bulletListItem" || block.type === "numberedListItem") {
      const listRun = createListRun(normalizedBlocks, index, block.type);
      value.push(listRun.node);
      index = listRun.nextIndex;
      continue;
    }

    value.push(...createBlocksFromBlock(block));
    index += 1;
  }

  return value;
}

/**
 * Converts stored BlockNote template blocks into the Plate value expected by the editor.
 * Consecutive list items are grouped into list containers and unsupported blocks fall back
 * to paragraphs so template content stays editable instead of being dropped.
 */
export function blockNoteContentToPlateValue(content: unknown): Value {
  if (!Array.isArray(content) || content.length === 0) {
    return getInitialValue();
  }

  const value = blocksToPlateValue(content);
  return value.length > 0 ? (value as Value) : getInitialValue();
}

/** Serializes a Plate seed value into the stored ProseMirror snapshot JSON format. */
export function serializePlateSeedValue(value: Value) {
  return JSON.stringify(plateValueToProseMirrorSnapshot(value));
}
