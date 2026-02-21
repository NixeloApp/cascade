/**
 * Daily/Weekly Digest Email
 *
 * Sent as a summary of activity instead of individual emails
 */

import { Button, Heading, Hr, Link, Section, Text } from "@react-email/components";
// biome-ignore lint/correctness/noUnusedImports: React is needed for runtime JSX in tests
import * as React from "react";
import { EmailLayout } from "./_components/Layout";

interface DigestItem {
  type: "mention" | "assignment" | "comment";
  issueKey: string;
  issueTitle: string;
  issueUrl: string;
  actorName: string;
  message: string;
  time: string;
}

interface DigestEmailProps {
  userName: string;
  frequency: "daily" | "weekly";
  items: DigestItem[];
  startDate: string;
  endDate: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function DigestEmail({
  userName,
  frequency,
  items,
  startDate,
  endDate,
  appUrl,
  unsubscribeUrl,
}: DigestEmailProps) {
  const preview = `Your ${frequency} digest: ${items.length} notification${items.length !== 1 ? "s" : ""}`;
  const title = frequency === "daily" ? "Daily Digest" : "Weekly Digest";

  const getItemIcon = (type: string) => {
    switch (type) {
      case "mention":
        return "@";
      case "assignment":
        return "👤";
      case "comment":
        return "💬";
      default:
        return "•";
    }
  };

  return (
    <EmailLayout preview={preview} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={h2}>
        {title} for {userName}
      </Heading>

      <Text style={dateRange}>
        {startDate} - {endDate}
      </Text>

      {items.length === 0 ? (
        <Section style={emptyState}>
          <Text style={emptyText}>🎉 No new notifications!</Text>
          <Text style={text}>You're all caught up. Enjoy your day!</Text>
        </Section>
      ) : (
        <>
          <Text style={summaryText}>
            You have <strong>{items.length}</strong> notification
            {items.length !== 1 ? "s" : ""} from the past{" "}
            {frequency === "daily" ? "24 hours" : "week"}:
          </Text>

          {/* Digest Items */}
          <Section style={digestContainer}>
            {items.map((item, index) => (
              <div key={`${item.issueKey}-${item.type}-${index}`}>
                <Section style={digestItem}>
                  <div style={itemHeader}>
                    <span style={itemIcon}>{getItemIcon(item.type)}</span>
                    <div style={itemContent}>
                      <Text style={itemTitle}>
                        <Link href={item.issueUrl} style={link}>
                          {item.issueKey}
                        </Link>
                        : {item.issueTitle}
                      </Text>
                      <Text style={itemMessage}>
                        <strong>{item.actorName}</strong> {item.message}
                      </Text>
                      <Text style={itemTime}>{item.time}</Text>
                    </div>
                  </div>
                </Section>
                {index < items.length - 1 && <Hr style={divider} />}
              </div>
            ))}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={text}>Ready to respond?</Text>
            <Button href={appUrl} style={button}>
              Open Nixelo
            </Button>
          </Section>
        </>
      )}
    </EmailLayout>
  );
}

// Styles
const h2 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 8px",
  padding: "0",
};

const dateRange = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 24px",
};

const summaryText = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
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

const digestContainer = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const digestItem = {
  margin: "0",
};

const itemHeader = {
  display: "flex",
  gap: "12px",
  alignItems: "flex-start",
};

const itemIcon = {
  fontSize: "20px",
  flexShrink: 0,
  marginTop: "2px",
};

const itemContent = {
  flex: 1,
};

const itemTitle = {
  color: "#111827",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0 0 4px",
  lineHeight: "20px",
};

const itemMessage = {
  color: "#4b5563",
  fontSize: "14px",
  margin: "0 0 4px",
  lineHeight: "20px",
};

const itemTime = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "12px 0",
};

const emptyState = {
  textAlign: "center" as const,
  padding: "32px 16px",
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  margin: "16px 0",
};

const emptyText = {
  fontSize: "24px",
  margin: "0 0 8px",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "24px 0",
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

export default DigestEmail;
