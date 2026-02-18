/**
 * Assignment Notification Email
 *
 * Sent when a user is assigned to an issue
 */

import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/Layout";

interface AssignmentEmailProps {
  assignedByName: string;
  issueKey: string;
  issueTitle: string;
  issueType: string;
  issuePriority: string;
  issueUrl: string;
  projectName: string;
  dueDate?: string;
  unsubscribeUrl: string;
}

export function AssignmentEmail({
  assignedByName,
  issueKey,
  issueTitle,
  issueType,
  issuePriority,
  issueUrl,
  projectName,
  dueDate,
  unsubscribeUrl,
}: AssignmentEmailProps) {
  const preview = `You were assigned to ${issueKey}: ${issueTitle}`;

  const priorityEmoji =
    {
      highest: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "🟢",
      lowest: "⚪",
    }[issuePriority] || "⚪";

  const typeEmoji =
    {
      task: "✓",
      bug: "🐛",
      story: "📖",
      epic: "🎯",
    }[issueType] || "✓";

  return (
    <EmailLayout preview={preview} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={h2}>You were assigned a new {issueType}</Heading>

      <Text style={text}>
        <strong>{assignedByName}</strong> assigned you to:
      </Text>

      {/* Issue Info */}
      <Section style={issueBox}>
        <Text style={issueKeyStyle}>{issueKey}</Text>
        <Heading style={issueTitleStyle}>{issueTitle}</Heading>

        <Section style={metadata}>
          <Text style={metadataItem}>
            {typeEmoji} <strong>Type:</strong> {issueType}
          </Text>
          <Text style={metadataItem}>
            {priorityEmoji} <strong>Priority:</strong> {issuePriority}
          </Text>
          <Text style={metadataItem}>
            📁 <strong>Project:</strong> {projectName}
          </Text>
          {dueDate && (
            <Text style={metadataItem}>
              📅 <strong>Due:</strong> {dueDate}
            </Text>
          )}
        </Section>
      </Section>

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
  margin: "0 0 16px",
};

const metadata = {
  margin: "0",
};

const metadataItem = {
  color: "#4b5563",
  fontSize: "14px",
  margin: "0 0 8px",
  lineHeight: "20px",
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

export default AssignmentEmail;
