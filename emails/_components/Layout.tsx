/**
 * Base Email Layout
 *
 * Provides consistent branding and structure for all email templates
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import React from "react";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  unsubscribeUrl?: string;
}

export function EmailLayout({ preview, children, unsubscribeUrl }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Nixelo</Heading>
            <Text style={tagline}>Collaborative Project Management</Text>
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you're part of a Nixelo project.
              {unsubscribeUrl && (
                <>
                  <br />
                  <Link href={unsubscribeUrl} style={link}>
                    Manage notification preferences
                  </Link>
                </>
              )}
            </Text>
            <Text style={footerText}>© 2026 Nixelo. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 24px",
  backgroundColor: "#4f46e5", // Primary color
  textAlign: "center" as const,
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0",
  padding: "0",
  lineHeight: "1.2",
};

const tagline = {
  color: "#e0e7ff",
  fontSize: "14px",
  margin: "8px 0 0 0",
  padding: "0",
};

const content = {
  padding: "24px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  padding: "0 24px",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  marginBottom: "12px",
};

const link = {
  color: "#4f46e5",
  textDecoration: "underline",
};
