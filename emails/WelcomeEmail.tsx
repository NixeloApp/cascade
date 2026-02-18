/**
 * Welcome Email Template
 *
 * Sent to new users after successful account creation
 */

import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/Layout";

interface WelcomeEmailProps {
  firstName?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
}

export function WelcomeEmail({
  firstName = "there",
  ctaUrl = "https://nixelo.app/dashboard",
  unsubscribeUrl,
}: WelcomeEmailProps) {
  const preview = "Welcome to Nixelo - Your project management journey starts here";

  return (
    <EmailLayout preview={preview} unsubscribeUrl={unsubscribeUrl}>
      <Heading style={h2}>Welcome to Nixelo!</Heading>

      <Text style={text}>Hi {firstName},</Text>

      <Text style={text}>
        We're excited to have you on board! Nixelo brings together everything you need for
        collaborative project management - documents, issues, sprints, and real-time collaboration.
      </Text>

      <Section style={featuresBox}>
        <Text style={featureItem}>
          <strong>Real-time Documents</strong> - Collaborate on documents with your team
        </Text>
        <Text style={featureItem}>
          <strong>Issue Tracking</strong> - Manage tasks with Kanban boards and sprints
        </Text>
        <Text style={featureItem}>
          <strong>Team Collaboration</strong> - See who's online and working on what
        </Text>
        <Text style={featureItem}>
          <strong>Calendar & Events</strong> - Schedule meetings and sync with Google Calendar
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={ctaUrl} style={button}>
          Get Started
        </Button>
      </Section>

      <Text style={text}>
        Or visit:{" "}
        <Link href={ctaUrl} style={link}>
          {ctaUrl}
        </Link>
      </Text>

      <Text style={mutedText}>
        If you have any questions, feel free to reach out to our support team.
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

const featuresBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const featureItem = {
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

const mutedText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  marginTop: "24px",
};

export default WelcomeEmail;
