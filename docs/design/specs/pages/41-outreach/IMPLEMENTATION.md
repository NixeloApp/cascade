# Outreach Page - Implementation

> **Route file**: `src/routes/_auth/_app/$orgSlug/outreach.tsx`
> **Last Updated**: 2026-03-25

---

## Data Flow

### Queries

| Query | Purpose |
|-------|---------|
| `api.outreach.contacts.list` | Organization contacts for the contacts tab and enrollment flows |
| `api.outreach.sequences.list` | Sequence list and selected-sequence detail |
| `api.outreach.mailboxes.list` | Connected mailbox cards and sender selection |
| `api.outreach.analytics.getMailboxHealth` | Daily and minute-window mailbox health |
| `api.outreach.analytics.getOrganizationOverview` | Overview metrics |
| `api.outreach.enrollments.listBySequence` | Selected sequence enrollment list |
| `api.outreach.analytics.getSequenceStats` | Sequence-level KPI card values |
| `api.outreach.analytics.getSequenceFunnel` | Per-step analytics table |
| `api.outreach.analytics.getContactTimeline` | Selected enrollment event timeline |

### Mutations

| Mutation | Purpose |
|----------|---------|
| `api.outreach.contacts.create` | Manual contact creation |
| `api.outreach.contacts.update` | Contact editing |
| `api.outreach.contacts.remove` | Contact deletion |
| `api.outreach.contacts.importBatch` | CSV import |
| `api.outreach.sequences.create` | New sequence creation |
| `api.outreach.sequences.update` | Sequence editing |
| `api.outreach.sequences.updateSequenceStatus` | Activation |
| `api.outreach.sequences.pause` | Pause |
| `api.outreach.sequences.remove` | Delete |
| `api.outreach.enrollments.createEnrollments` | Add recipients to a sequence |
| `api.outreach.enrollments.cancelEnrollment` | Stop an individual enrollment |
| `api.outreach.mailboxes.disconnect` | Disconnect sender mailbox |
| `api.outreach.mailboxes.updateLimit` | Update daily send cap |

---

## Client State

```text
Workspace state:
+-- activeTab
+-- selectedSequenceId
+-- selectedEnrollmentId
+-- selectedContactIds
+-- mailboxLimitInputs

Dialog state:
+-- isContactDialogOpen
+-- isImportDialogOpen
+-- isSequenceDialogOpen
+-- isEnrollDialogOpen
+-- pendingDeleteContact
+-- pendingDeleteSequence
+-- pendingDisconnectMailbox

Draft state:
+-- contactForm
+-- sequenceForm
+-- importText
```

The workspace is intentionally stateful on the client because tab selection, draft steps,
selection rails, and confirm dialogs do not belong in Convex.

---

## Screenshot Infrastructure Hooks

The route now exposes explicit screenshot/readiness hooks through `TEST_IDS.OUTREACH`:

- root shell
- launch checklist
- tab triggers
- overview section
- sequences rail
- selected sequence detail
- contacts section
- mailboxes section
- analytics section

These IDs support the screenshot harness and make state captures less dependent on incidental text.

---

## Seeded Screenshot Data

`convex/e2e.ts` now seeds outreach-specific screenshot data after the rest of the workspace seed:

- deletes prior screenshot-specific outreach fixtures by exact seeded names/emails
- inserts one mailbox with encrypted placeholder tokens
- inserts five contacts
- inserts two sequences with cached stats
- inserts enrollments spanning active, replied, paused, and bounced states
- inserts click/reply/bounce/open/send events plus a tracking link

This keeps the screenshot run deterministic without relying on the real send engine to build the
analytics state.

---

## Screenshot Capture Matrix

The screenshot harness now covers:

- `empty-outreach`
- `filled-outreach`
- `filled-outreach-sequences`
- `filled-outreach-contacts`
- `filled-outreach-mailboxes`
- `filled-outreach-analytics`

The canonical route stays on the overview tab. The additional captures switch tabs explicitly.

---

## Notes

- Mailbox OAuth itself is not screenshotted here; the page spec is for the route surface.
- The seeded mailbox uses encrypted placeholder tokens to stay aligned with the token-at-rest
  invariants already enforced in the backend.
- The analytics screenshots depend on the seeded sequence selection flow, not on background jobs.
