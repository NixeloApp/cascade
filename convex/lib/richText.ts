/**
 * Rich-text helpers for backend integrations.
 *
 * Issue descriptions may be stored as Plate/Slate JSON. Integrations that expect
 * plain text should use this helper to avoid leaking raw JSON blobs.
 */

type RichTextNode = {
  children: unknown[];
};

function isRichTextNode(candidate: unknown): candidate is RichTextNode {
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    "children" in candidate &&
    Array.isArray(candidate.children)
  );
}

function isRichTextValue(candidate: unknown): candidate is RichTextNode[] {
  return Array.isArray(candidate) && candidate.every(isRichTextNode);
}

function serializeParagraph(text: string): string {
  return JSON.stringify([
    {
      type: "p",
      children: [{ text }],
    },
  ]);
}

function extractNodeText(node: unknown): string {
  if (typeof node === "string") {
    return node;
  }

  if (!node || typeof node !== "object") {
    return "";
  }

  if ("text" in node && typeof node.text === "string") {
    return node.text;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map(extractNodeText).join("");
  }

  return "";
}

/**
 * Normalizes an issue description for storage.
 *
 * Non-empty descriptions are stored as Plate JSON arrays so the editor only
 * needs to handle one persisted shape.
 */
export function normalizeIssueDescriptionForStorage(
  description: string | undefined | null,
): string | undefined {
  if (description === undefined) {
    return undefined;
  }

  if (description === null || description.trim() === "") {
    return "";
  }

  try {
    const parsed: unknown = JSON.parse(description);

    if (typeof parsed === "string") {
      return parsed.trim() === "" ? "" : serializeParagraph(parsed);
    }

    if (isRichTextValue(parsed)) {
      return description;
    }

    if (isRichTextNode(parsed)) {
      return JSON.stringify([parsed]);
    }
  } catch {
    return serializeParagraph(description);
  }

  return serializeParagraph(description);
}

/**
 * Converts a stored description value into plain text.
 */
export function getPlainTextFromDescription(description: string | undefined): string {
  if (!description) {
    return "";
  }

  try {
    const parsed: unknown = JSON.parse(description);

    if (typeof parsed === "string") {
      return parsed;
    }

    if (Array.isArray(parsed)) {
      return parsed.map(extractNodeText).join("\n").trim();
    }

    return extractNodeText(parsed).trim();
  } catch {
    return description;
  }
}
