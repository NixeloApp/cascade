import type { Id } from "@convex/_generated/dataModel";
import { Badge } from "./ui/Badge";

interface CommentRendererProps {
  content: string;
  mentions?: Id<"users">[];
}

/**
 * Renders comment content with mentions and basic inline markdown support.
 * Supports: **bold**, *italic*, `code`, ~~strikethrough~~, [links](url)
 */
export function CommentRenderer({ content, mentions: _mentions = [] }: CommentRendererProps) {
  // Parse the content to find mentions and apply inline markdown
  const renderContent = () => {
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    match = mentionPattern.exec(content);
    while (match !== null) {
      // Add text before mention (with markdown rendering)
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        parts.push(<span key={`text-${key++}`}>{renderInlineMarkdown(textBefore, key)}</span>);
      }

      // Add highlighted mention
      const userName = match[1];
      const userId = match[2] as Id<"users">;

      parts.push(<MentionBadge key={`mention-${key++}`} userName={userName} userId={userId} />);

      lastIndex = match.index + match[0].length;
      match = mentionPattern.exec(content);
    }

    // Add remaining text (with markdown rendering)
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      parts.push(<span key={`text-${key++}`}>{renderInlineMarkdown(remainingText, key)}</span>);
    }

    return parts.length > 0 ? parts : renderInlineMarkdown(content, 0);
  };

  return (
    <div className="text-ui-text-secondary whitespace-pre-wrap break-words leading-relaxed">
      {renderContent()}
    </div>
  );
}

// Patterns definition extracted to module scope
const MARKDOWN_PATTERNS: Array<{
  regex: RegExp;
  hasSecondCapture?: boolean;
  render: (match: string, extra?: string) => React.ReactNode;
}> = [
  { regex: /\*\*(.+?)\*\*/g, render: (match) => <strong>{match}</strong> },
  { regex: /\*(.+?)\*/g, render: (match) => <em>{match}</em> },
  {
    regex: /`([^`]+)`/g,
    render: (match) => (
      <code className="bg-ui-bg-tertiary px-1 py-0.5 rounded text-brand text-sm">{match}</code>
    ),
  },
  { regex: /~~(.+?)~~/g, render: (match) => <s>{match}</s> },
  {
    regex: /\[([^\]]+)\]\(([^)]+)\)/g,
    hasSecondCapture: true,
    render: (text, url) => (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand hover:text-brand-hover underline"
      >
        {text}
      </a>
    ),
  },
];

/**
 * Render inline markdown: **bold**, *italic*, `code`, ~~strike~~, [link](url)
 */
function renderInlineMarkdown(text: string, baseKey: number): React.ReactNode {
  let result: React.ReactNode[] = [text];
  let keyCounter = baseKey;

  for (const { regex, hasSecondCapture, render } of MARKDOWN_PATTERNS) {
    const newResult: React.ReactNode[] = [];

    for (const part of result) {
      if (typeof part !== "string") {
        newResult.push(part);
        continue;
      }

      processMarkdownMatches(part, regex, hasSecondCapture ?? false, render, newResult, keyCounter);
      // Rough increment to avoid key collisions
      keyCounter += 100;
    }

    result = newResult;
  }

  return <>{result}</>;
}

// Extracted helper function to reduce complexity
function processMarkdownMatches(
  text: string,
  regex: RegExp,
  hasSecondCapture: boolean,
  render: (match: string, extra?: string) => React.ReactNode,
  accumulator: React.ReactNode[],
  baseKey: number,
) {
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  regex.lastIndex = 0; // Reset regex state
  let localKey = baseKey;

  match = regex.exec(text);
  while (match !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      accumulator.push(text.substring(lastIndex, match.index));
    }

    // Add rendered element
    if (hasSecondCapture) {
      // Link pattern: [text](url)
      accumulator.push(<span key={`md-${localKey++}`}>{render(match[1], match[2])}</span>);
    } else {
      // Other patterns: just the captured group
      accumulator.push(<span key={`md-${localKey++}`}>{render(match[1])}</span>);
    }

    lastIndex = match.index + match[0].length;
    match = regex.exec(text);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    accumulator.push(text.substring(lastIndex));
  } else if (lastIndex === 0) {
    // No matches found, keep original
    accumulator.push(text);
  }
}

interface MentionBadgeProps {
  userName: string;
  userId: Id<"users">;
}

function MentionBadge({ userName }: MentionBadgeProps) {
  return (
    <Badge
      variant="brand"
      size="sm"
      className="transition-colors duration-default hover:bg-brand-border cursor-default"
      title={`@${userName}`}
    >
      @{userName}
    </Badge>
  );
}
