/**
 * Rich-text helpers for backend integrations.
 *
 * Issue descriptions may be stored as Plate/Slate JSON. Integrations that expect
 * plain text should use this helper to avoid leaking raw JSON blobs.
 */

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
 * Converts a stored description value into plain text.
 *
 * - Legacy plain text values are returned as-is.
 * - Rich text JSON values are parsed and recursively reduced to text.
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
