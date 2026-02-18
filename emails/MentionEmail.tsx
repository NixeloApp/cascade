/**
 * Mention Notification Email
 *
 * Sent when a user is @mentioned in an issue, comment, or document
 */

import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/Layout";

interface MentionEmailProps {
  mentionedByName: string;
  issueKey: string;
  issueTitle: string;
  commentText?: string;
  issueUrl: string;
  projectName: string;
  unsubscribeUrl: string;
}

export function MentionEmail({
  mentionedByName,
  issueKey,
  issueTitle,
  commentText,
  issueUrl,
  projectName,
  unsubscribeUrl,
}: MentionEmailProps) {
  const preview = `${mentionedByName} mentioned you in ${issueKey}`;

  return (
    <EmailLayout preview={preview} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={h2}>{mentionedByName} mentioned you</Heading>

      <Text style={text}>
        <strong>{mentionedByName}</strong> mentioned you in{" "}
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

      {/* Comment (if applicable) */}
      {commentText && (
        <Section style={commentBox}>
          <Text style={commentLabel}>Comment:</Text>
          <Text style={commentTextStyle}>{commentText}</Text>
        </Section>
      )}

      {/* CTA Button */}
      <Section style={buttonContainer}>
        <Button href={issueUrl} style={button}>
          View Issue
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
  backgroundColor: "#eff6ff",
  borderLeft: "4px solid #4f46e5",
  padding: "12px 16px",
  margin: "16px 0",
};

const commentLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const commentTextStyle = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
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

// Default export for React Email CLI
export default MentionEmail;
