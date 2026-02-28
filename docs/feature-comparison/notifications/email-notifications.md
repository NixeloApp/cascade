# Email Notifications

## Overview

Email notifications keep users informed about important activity when they're not actively using the application. They include transactional emails (immediate alerts) and digest emails (periodic summaries).

---

## plane

### Email Types

| Type | Trigger | Immediate |
|------|---------|-----------|
| Issue assigned | Issue assigned to user | Yes |
| Issue commented | Comment on subscribed issue | Yes |
| Issue state changed | Status change on subscribed issue | Yes |
| Mention | @mentioned in issue/comment | Yes |
| Workspace invite | Invited to workspace | Yes |
| Project invite | Invited to project | Yes |

### Email Settings

**Location**: User Profile → Email Notifications

**Toggles** (per notification type):
- Assigned to an issue
- State changed on subscribed issue
- Comment on subscribed issue
- Mentioned in issue or comment
- Weekly product updates (marketing)

### Email Templates

- HTML templates with branding
- Action buttons (View Issue, Open Project)
- Unsubscribe link in footer
- Reply-to disabled (no-reply)

### Delivery Architecture

```
Event → Notification Service → Email Queue → Email Provider (AWS SES/SendGrid)
```

- Async job queue for delivery
- Retry logic for failures
- Rate limiting per user

### User Controls

- Per-type enable/disable
- No frequency controls (immediate only)
- Unsubscribe from all via link

---

## Cascade

### Email Types

**Transactional Emails** (immediate):

| Type | Trigger | Template |
|------|---------|----------|
| `issue_assigned` | Issue assigned to user | `IssueAssignedEmail` |
| `issue_commented` | Comment on your issue | `IssueCommentEmail` |
| `issue_mentioned` | @mentioned in issue | `IssueMentionEmail` |
| `sprint_started` | Sprint starts | `SprintStartEmail` |
| `sprint_ended` | Sprint completes | `SprintEndEmail` |
| `project_invited` | Invited to project | `ProjectInviteEmail` |
| `workspace_invited` | Invited to workspace | `WorkspaceInviteEmail` |
| `document_shared` | Document shared | `DocumentSharedEmail` |

**Digest Emails** (periodic):

| Type | Frequency | Content |
|------|-----------|---------|
| Daily Digest | Every morning | Yesterday's activity summary |
| Weekly Digest | Monday morning | Week's activity summary |

### Email Templates

**Stack**: React Email + Resend

```tsx
// Example template structure
export function IssueAssignedEmail({
  userName,
  issueKey,
  issueTitle,
  assignedBy,
  projectName,
  issueUrl,
}: IssueAssignedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been assigned to {issueKey}</Preview>
      <Body>
        <Container>
          <Heading>Issue Assigned</Heading>
          <Text>
            Hi {userName}, {assignedBy} assigned you to:
          </Text>
          <Section>
            <Text style={styles.issueKey}>{issueKey}</Text>
            <Text style={styles.issueTitle}>{issueTitle}</Text>
          </Section>
          <Button href={issueUrl}>View Issue</Button>
        </Container>
        <Footer>
          <Link href={unsubscribeUrl}>Manage notifications</Link>
        </Footer>
      </Body>
    </Html>
  );
}
```

### Digest System

**Daily Digest Contents**:
- Issues assigned to you (new)
- Issues you created (status updates)
- Comments on your issues
- Mentions
- Sprint progress (if in active sprint)

**Weekly Digest Contents**:
- All daily digest items aggregated
- Completed issues count
- Upcoming due dates
- Sprint burndown summary

**Digest Generation**:
```typescript
// Scheduled function (cron)
export const sendDailyDigests = cronJobs.daily(
  { hourUTC: 8 },
  async (ctx) => {
    const users = await getUsersWithDigestEnabled(ctx, "daily");
    for (const user of users) {
      const activity = await getActivitySince(ctx, user._id, 24 * 60 * 60 * 1000);
      if (activity.length > 0) {
        await sendDigestEmail(user, activity, "daily");
      }
    }
  }
);
```

### Delivery Architecture

```
Event → Convex Mutation → Convex Action → Resend API
         (create notification)  (send email)

Digest → Convex Cron → Aggregate Activity → Resend API
```

**Resend Integration**:
- Direct API calls from Convex actions
- Automatic retry with exponential backoff
- Delivery status tracking (sent, delivered, bounced)

### Rate Limiting

- Max 10 transactional emails per hour per user
- Digest emails exempt from rate limit
- Batch similar notifications (comments on same issue)

### User Controls

- Enable/disable per notification type
- Choose digest frequency (none, daily, weekly)
- Unsubscribe link in every email
- Manage preferences from email footer

---

## Comparison Table

| Aspect | plane | Cascade | Best |
|--------|-------|---------|------|
| Transactional emails | Yes | Yes | tie |
| Digest emails | No | Yes (daily/weekly) | Cascade |
| Email types | 5 | 8 | Cascade |
| Per-type toggles | Yes | Yes | tie |
| Frequency control | No | Yes (digest) | Cascade |
| HTML templates | Yes | Yes (React Email) | tie |
| Action buttons | Yes | Yes | tie |
| Unsubscribe link | Yes | Yes | tie |
| Rate limiting | Unknown | Yes | Cascade |
| Delivery tracking | Unknown | Yes (Resend) | Cascade |
| Batch similar | Unknown | Yes | Cascade |

---

## Recommendations

1. **Priority 1**: Cascade already exceeds plane
   - Digest emails are a major advantage
   - React Email provides better templates
   - Keep and enhance current system

2. **Priority 2**: Add email preview
   - Let users preview what emails look like
   - Show sample of each notification type

3. **Priority 3**: Add smart batching
   - Batch multiple comments into single email
   - "5 new comments on PROJ-123" instead of 5 emails

4. **Priority 4**: Add email scheduling
   - Let users choose delivery time for digests
   - Timezone-aware scheduling

5. **Priority 5**: Add email analytics
   - Track open rates (Resend provides this)
   - Surface in admin dashboard
   - Identify unengaged users

---

## Cascade Strengths

1. **Digest System**: Daily and weekly summaries reduce notification fatigue
2. **React Email**: Modern, maintainable templates with TypeScript
3. **Rate Limiting**: Prevents email overload
4. **Delivery Tracking**: Know when emails are delivered/bounced
5. **Batching**: Similar notifications consolidated

---

## Implementation: Smart Batching

```typescript
// Batch notifications before sending email
async function batchNotifications(
  notifications: Notification[]
): Promise<BatchedEmail[]> {
  const batches = new Map<string, Notification[]>();

  for (const notif of notifications) {
    // Group by entity (e.g., same issue)
    const key = `${notif.entityType}-${notif.entityId}`;
    if (!batches.has(key)) {
      batches.set(key, []);
    }
    batches.get(key)!.push(notif);
  }

  return Array.from(batches.entries()).map(([key, notifs]) => ({
    entityKey: key,
    count: notifs.length,
    notifications: notifs,
    subject: notifs.length > 1
      ? `${notifs.length} updates on ${notifs[0].entityTitle}`
      : notifs[0].title,
  }));
}

// Scheduled job to process notification queue
export const processEmailQueue = cronJobs.interval(
  { minutes: 5 },
  async (ctx) => {
    const pending = await ctx.db
      .query("emailQueue")
      .withIndex("by_status", q => q.eq("status", "pending"))
      .take(100);

    const batched = await batchNotifications(pending);
    for (const batch of batched) {
      await sendBatchedEmail(batch);
    }
  }
);
```

---

## Screenshots/References

### plane
- Email settings: `~/Desktop/plane/apps/web/app/profile/emails/`
- Email service: `~/Desktop/plane/apiserver/plane/app/views/notification/`

### Cascade
- Email templates: `~/Desktop/cascade/emails/`
- Backend: `~/Desktop/cascade/convex/email/`
- Digest cron: `~/Desktop/cascade/convex/crons.ts`
- Resend integration: `~/Desktop/cascade/convex/email/send.ts`
