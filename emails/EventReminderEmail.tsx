/**
 * Event Reminder Email
 *
 * Sent to remind users of upcoming calendar events
 */

import { Button, Heading, Hr, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./_components/Layout";

interface EventReminderEmailProps {
  userName: string;
  eventTitle: string;
  eventTime: string;
  reminderText: string;
  location?: string;
  meetingUrl?: string;
  eventUrl: string;
  unsubscribeUrl: string;
}

export function EventReminderEmail({
  userName,
  eventTitle,
  eventTime,
  reminderText,
  location,
  meetingUrl,
  eventUrl,
  unsubscribeUrl,
}: EventReminderEmailProps) {
  const preview = `Reminder: ${eventTitle} starts in ${reminderText}`;

  return (
    <EmailLayout preview={preview}>
      <Heading style={h2}>Upcoming Event Reminder</Heading>

      <Text style={text}>
        Hi <strong>{userName}</strong>,
      </Text>

      <Text style={text}>
        This is a reminder that your event starts in <strong>{reminderText}</strong>.
      </Text>

      {/* Event Info */}
      <Section style={eventBox}>
        <Heading style={eventTitleStyle}>{eventTitle}</Heading>

        <Section style={metadata}>
          <Text style={metadataItem}>
            <span role="img" aria-label="calendar">
              📅
            </span>{" "}
            <strong>When:</strong> {eventTime}
          </Text>
          {location && (
            <Text style={metadataItem}>
              <span role="img" aria-label="location">
                📍
              </span>{" "}
              <strong>Where:</strong> {location}
            </Text>
          )}
          {meetingUrl && (
            <Text style={metadataItem}>
              <span role="img" aria-label="video">
                🔗
              </span>{" "}
              <strong>Meeting Link:</strong>{" "}
              <Link href={meetingUrl} style={link}>
                Join Meeting
              </Link>
            </Text>
          )}
        </Section>
      </Section>

      {/* CTA Buttons */}
      <Section style={buttonContainer}>
        {meetingUrl ? (
          <>
            <Button href={meetingUrl} style={primaryButton}>
              Join Meeting
            </Button>
            <Text style={buttonSpacer}>&nbsp;</Text>
            <Button href={eventUrl} style={secondaryButton}>
              View Event Details
            </Button>
          </>
        ) : (
          <Button href={eventUrl} style={primaryButton}>
            View Event Details
          </Button>
        )}
      </Section>

      <Text style={text}>
        Or visit:{" "}
        <Link href={eventUrl} style={link}>
          {eventUrl}
        </Link>
      </Text>

      {/* Unsubscribe */}
      <Hr style={divider} />
      <Section style={unsubscribeSection}>
        <Text style={unsubscribeText}>
          You received this email because you have reminders enabled for this event. You can{" "}
          <Link href={unsubscribeUrl} style={link}>
            change your notification preferences
          </Link>{" "}
          or{" "}
          <Link href={unsubscribeUrl} style={link}>
            unsubscribe
          </Link>{" "}
          anytime.
        </Text>
      </Section>
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

const eventBox = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #86efac",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const eventTitleStyle = {
  color: "#111827",
  fontSize: "20px",
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

const buttonSpacer = {
  display: "inline-block",
  width: "12px",
};

const primaryButton = {
  backgroundColor: "#16a34a",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const secondaryButton = {
  backgroundColor: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "10px 24px",
  marginLeft: "8px",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const unsubscribeSection = {
  margin: "16px 0 0",
};

const unsubscribeText = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "0",
};

export default EventReminderEmail;
