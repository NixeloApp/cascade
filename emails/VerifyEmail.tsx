/**
 * Email Verification Template
 *
 * Sent when users need to verify their email address (signup, email change)
 */

import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/Layout";

interface VerifyEmailProps {
  firstName?: string;
  code: string;
  expiryMinutes?: number;
}

export function VerifyEmail({
  firstName = "there",
  code = "123456",
  expiryMinutes = 15,
}: VerifyEmailProps) {
  const preview = "Verify your email address";

  return (
    <EmailLayout preview={preview}>
      <Heading style={h2}>Verify your email</Heading>

      <Text style={text}>Hi {firstName},</Text>

      <Text style={text}>Please use the verification code below to verify your email address:</Text>

      <Section style={codeBox}>
        <Text style={codeText}>{code}</Text>
      </Section>

      <Text style={expiryText}>This code expires in {expiryMinutes} minutes.</Text>

      <Text style={mutedText}>
        If you didn't create an account with Nixelo, you can safely ignore this email.
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

const codeBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeText = {
  color: "#111827",
  fontSize: "32px",
  fontWeight: "bold",
  letterSpacing: "8px",
  fontFamily: "monospace",
  margin: "0",
};

const expiryText = {
  color: "#6b7280",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const mutedText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  marginTop: "24px",
};

export default VerifyEmail;
