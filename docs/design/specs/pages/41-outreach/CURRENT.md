# Outreach Page - Current State

> **Route**: `/:slug/outreach`
> **Status**: REVIEWED for canonical route plus operational tab states
> **Last Updated**: 2026-03-25

> **Spec Contract**: This file is intentionally detailed. The purpose is to answer what is actually shipped on this branch without re-reading route code.

---

## Purpose

The outreach route is the organization-level outbound workspace. It lets a team:

- connect a sending mailbox
- create and pause multi-step sequences
- manage outreach contacts and CSV imports
- enroll recipients into campaigns
- inspect mailbox capacity and sequence analytics

This is not a placeholder admin page. It is the shipped control surface for the Gmail-first
outreach backend.

---

## Screenshot Matrix

### Canonical route captures

| Viewport | Theme | Preview |
|----------|-------|---------|
| Desktop | Dark | ![](screenshots/desktop-dark.png) |
| Desktop | Light | ![](screenshots/desktop-light.png) |
| Tablet | Light | ![](screenshots/tablet-light.png) |
| Mobile | Light | ![](screenshots/mobile-light.png) |

### Additional state captures

| State | Desktop Dark | Desktop Light | Tablet Light | Mobile Light |
|------|---------------|---------------|--------------|--------------|
| Sequences tab | `desktop-dark-sequences.png` | `desktop-light-sequences.png` | `tablet-light-sequences.png` | `mobile-light-sequences.png` |
| Contacts tab | `desktop-dark-contacts.png` | `desktop-light-contacts.png` | `tablet-light-contacts.png` | `mobile-light-contacts.png` |
| Mailboxes tab | `desktop-dark-mailboxes.png` | `desktop-light-mailboxes.png` | `tablet-light-mailboxes.png` | `mobile-light-mailboxes.png` |
| Analytics tab | `desktop-dark-analytics.png` | `desktop-light-analytics.png` | `tablet-light-analytics.png` | `mobile-light-analytics.png` |

The harness now includes outreach in empty-route coverage, while the reviewed matrix above focuses
on the deterministic seeded workspace and its major tab states.

---

## Route Anatomy

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Page header                                                                                 │
│ Outreach                                        [Import CSV] [New Sequence] / tab actions   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Optional launch checklist                                                                   │
│ mailbox missing / sequence missing / no active sequence                                     │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Tabs                                                                                         │
│ Overview | Sequences | Contacts | Mailboxes | Analytics                                     │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Overview                                                                                    │
│ - org metrics                                                                               │
│ - sequence health table                                                                     │
│ - mailbox capacity panel                                                                    │
│                                                                                             │
│ Sequences                                                                                   │
│ - left: sequence list                                                                       │
│ - right: selected sequence detail, steps, enrollments                                       │
│                                                                                             │
│ Contacts                                                                                    │
│ - recipient table with tags and actions                                                     │
│                                                                                             │
│ Mailboxes                                                                                   │
│ - mailbox cards with rate limits and disconnect actions                                     │
│                                                                                             │
│ Analytics                                                                                   │
│ - sequence funnel                                                                           │
│ - selected enrollment timeline                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Composition

### 1. Header and launch gating

- The route uses a normal page header with context-aware actions.
- A launch checklist alert appears only when the user is blocked by missing mailbox, missing
  sequence, or no active sequence.

### 2. Overview tab

- Top-line organization metrics: sequences, recipients, messages sent, replies.
- Sequence health table for the most relevant campaigns.
- Mailbox capacity card showing daily and minute-window headroom.

### 3. Sequences tab

- Left rail lists all sequences with status badges and enrollment counts.
- Right panel shows the selected sequence:
  - settings
  - step cadence
  - enrollment table
  - activate, pause, edit, delete, and enroll actions

### 4. Contacts tab

- Contact list with company, tags, and row-level edit/delete controls.
- Supports both manual creation and CSV import.

### 5. Mailboxes tab

- Gmail-first explainer alert.
- Mailbox cards expose current capacity plus editable daily send limits.
- Disconnect is a destructive action but still part of the main workspace.

### 6. Analytics tab

- Sequence analytics shows rates and per-step funnel counts.
- Recipient timeline shows event history for a selected enrollment.

---

## Seeded Review State

The screenshot harness seeds a deterministic outreach workspace for this route:

- 1 active Gmail mailbox with realistic daily and minute-window counts
- 5 contacts across different companies and tags
- 2 sequences:
  - `Launch Expansion Sequence` (active)
  - `Founder Follow-up Pilot` (paused)
- 5 enrollments with active, replied, paused, and bounced outcomes
- click, open, reply, and bounce events that feed both the funnel and the recipient timeline

This matters because the analytics and selected-detail panels are meaningless without real seeded
sequence and event data.

---

## Current Strengths

| Area | Current Read |
|------|--------------|
| Product completeness | Strong for a Gmail-first MVP. The route is operational, not decorative. |
| Screenshot coverage | Good. The route now has canonical plus tab-specific captures. |
| Cross-surface cohesion | Better than before because mailbox health, sequence runtime state, and analytics live in one place. |

---

## Current Problems

| # | Problem | Area | Severity |
|---|---------|------|----------|
| 1 | CSV import and validation still read as an operator tool, not a polished high-volume workflow | UX | MEDIUM |
| 2 | Analytics are operationally useful but still shallow compared to dedicated campaign tools | product depth | MEDIUM |
| 3 | Mailbox connection is intentionally Gmail-first, so multi-provider expectations need to stay clearly out of the primary story | scope clarity | LOW |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/routes/_auth/_app/$orgSlug/outreach.tsx` | Route wrapper |
| `src/components/Outreach/OutreachWorkspace.tsx` | Main outreach workspace UI |
| `convex/e2e.ts` | Seeded outreach screenshot data |
| `e2e/screenshot-lib/public-pages.ts` | Empty-state outreach capture |
| `e2e/screenshot-lib/filled-states.ts` | Canonical and tab-state outreach captures |
| `todos/email-outreach.md` | Remaining product backlog beyond the shipped route |

---

## Review Guidance

- Treat this as an operational workspace, not marketing CRM chrome.
- Keep the selected-sequence and timeline panels visibly grounded in real data.
- If the route grows new dialogs or destructive states, they should become explicit screenshot
  variants rather than staying implicit.

---

## Summary

Outreach is now part of the formal screenshot/spec review loop. The route ships as a real
Gmail-first workspace with deterministic empty and filled-state coverage, including the major tab
variants that matter for product QA.
