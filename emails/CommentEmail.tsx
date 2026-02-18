/**
 * Comment Notification Email
 *
 * Sent when someone comments on an issue the user created or is watching
 */

import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/Layout";

interface CommentEmailProps {
  commenterName: string;
  issueKey: string;
  issueTitle: string;
  commentText: string;
  issueUrl: string;
  projectName: string;
  unsubscribeUrl: string;
}

export function CommentEmail({
  commenterName,
  issueKey,
  issueTitle,
  commentText,
  issueUrl,
  projectName,
  unsubscribeUrl,
}: CommentEmailProps) {
  const preview = `${commenterName} commented on ${issueKey}`;

  return (
    <EmailLayout preview={preview} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={h2}>{commenterName} added a comment</Heading>

      <Text style={text}>
        <strong>{commenterName}</strong> commented on{" "}
        <Link href={issueUrl} style={link}>
          {issueKey}
        </Link>
        :
      </Text>

      {/* Issue Info */}
      <Section style={issueBox}>
        <Text style={issueKeyStyle}>{issueKey}</Text>
        <Heading style={issueTitleStyle}>{issueTitle}</Heading>
        <Text style={projectBadge}>{projectName}</Text>
      </Section>

      {/* Comment */}
      <Section style={commentBox}>
        <Text style={commentLabel}>New Comment:</Text>
        <Text style={commentTextStyle}>{commentText}</Text>
        <Text style={commentAuthor}>— {commenterName}</Text>
      </Section>

      {/* CTA Button */}
      <Section style={buttonContainer}>
        <Button href={issueUrl} style={button}>
          View Comment
        </Button>
      </Section>

      <Text style={text}>
        Click the button above or visit:{" "}
        <Link href={issueUrl} style={link}>
          {issueUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

// Styles
const h2 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 16px",
  padding: "0",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const link = {
  color: "#4f46e5",
  textDecoration: "underline",
};

const issueBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const issueKeyStyle = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const issueTitleStyle = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const projectBadge = {
  color: "#4f46e5",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const commentBox = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fbbf24",
  borderLeft: "4px solid #f59e0b",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
};

const commentLabel = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
};

const commentTextStyle = {
  color: "#1f2937",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0 0 12px",
  whiteSpace: "pre-wrap" as const,
};

const commentAuthor = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
  fontStyle: "italic",
};

const buttonContainer = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

export default CommentEmail;
