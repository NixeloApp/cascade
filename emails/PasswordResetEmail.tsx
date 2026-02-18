/**
 * Password Reset Email Template
 *
 * Sent when users request a password reset
 */

import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/Layout";

interface PasswordResetEmailProps {
  firstName?: string;
  code: string;
  expiryMinutes?: number;
}

export function PasswordResetEmail({
  firstName = "there",
  code = "123456",
  expiryMinutes = 15,
}: PasswordResetEmailProps) {
  const preview = "Reset your password";

  return (
    <EmailLayout preview={preview}>
      <Heading style={h2}>Reset your password</Heading>

      <Text style={text}>Hi {firstName},</Text>

      <Text style={text}>
        We received a request to reset your password. Use the code below to proceed:
      </Text>

      <Section style={codeBox}>
        <Text style={codeText}>{code}</Text>
      </Section>

      <Text style={expiryText}>This code expires in {expiryMinutes} minutes.</Text>

      <Text style={mutedText}>
        If you didn't request a password reset, you can safely ignore this email. Your password will
        remain unchanged.
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
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeText = {
  color: "#92400e",
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

export default PasswordResetEmail;
