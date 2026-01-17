# Nixelo - Product Roadmap

> **Last Updated:** 2026-01-01
> **Current Architecture:** Organization → Workspaces → Teams → Projects → Issues

---

## 🔥 NEXT: Multi-Level Views

**Goal:** Support boards, documents, and wikis at multiple levels (inspired by ClickUp, Linear, Jira)

### Board Views (All Levels)

- [ ] **Cross-Team Dependencies** - Visual view of dependencies across teams
- [ ] **Workspace Backlog** (unassigned issues)
- [ ] **Workspace Sprint View** (all active sprints)
- [ ] **Saved Filters UI** - Backend exists, needs full UI integration
- [ ] **Personal boards (@me)**

### Documents/Wikis (All Levels)

- [ ] **Organization Wiki** - Organization-wide knowledge
- [ ] **Workspace Wiki** - Department documentation
- [ ] **Team Wiki** - Team knowledge base

### Calendar/Events (All Levels)

- [ ] **Organization Calendar** - All-hands, holidays
- [ ] **Workspace Calendar** - Department events
- [ ] **Team Calendar** - Team meetings, standups

### Document Templates Integration

- [ ] Add route to expose DocumentTemplatesManager
- [ ] Add sidebar link for templates

---

## 🔥 NEXT: Public Launch

### Day 1-2: Polish

- [ ] Create demo video (2-3 min walkthrough)
- [ ] Add issue/PR templates
- [ ] Add "good first issue" labels

### Day 4-5: Launch

- [ ] Hacker News (Show HN)
- [ ] Reddit: r/selfhosted, r/opensource, r/programming
- [ ] Product Hunt
- [ ] awesome-selfhosted list
- [ ] Write launch blog post

### Day 6-7: Community

- [ ] Set up Discord server
- [ ] Enable GitHub Discussions

**Success:** 100 stars, 10 users, 5 Discord members

---

## 🎯 Feature Gaps (from Competitor Analysis)

> Source: [FEATURE_DEEP_DIVE.md](./research/FEATURE_DEEP_DIVE.md)

### P1 - Quick Wins (Low Effort, High Impact)

- [ ] **Comment reactions** - 👍 👎 ❤️ 🎉 (simple `commentReactions` table)
- [ ] **Verify rich text comments** - Improve Markdown support in comments

### P2 - Medium Priority (Worth Doing)

- [ ] **Label groups** - Like Linear: organize labels into groups (Priority, Component, Area)
- [ ] **User picker custom field** - For "Reviewer", "QA", "Designer" fields
- [ ] **Velocity charts** - Track story points per sprint, show average velocity
- [ ] **Slack integration** - Extend existing `pumbleWebhooks` to Slack

### P3 - Nice to Have (Later)

- [ ] **Label descriptions** - Show on hover
- [ ] **Query language** - Simple `status:done priority:high` syntax
- [ ] **Swimlanes** - Group board rows by assignee/epic
- [ ] **WIP limits** - Warn when column exceeds limit
- [ ] **Auto-cycles** - Like Linear: auto-create next sprint

---

## 🏢 Agency MVP (Phase 1)

**Pivot Goal:** Target agencies & consultants ("Replace 4 tools" value prop)
**See:** [NICHE_STRATEGY.md](./research/NICHE_STRATEGY.md)

- [ ] **Invoicing System** - Turn tracked hours into professional invoices (Backend partial)
- [ ] **Client Portal** - Secure view for clients to track project progress/spend

---

## Phase 2: Growth (Post-Launch)

### Calendar & Slack Sync

- [ ] Outlook Calendar integration
- [ ] Post issue updates to Slack channels
- [ ] Create issues from Slack (`/nixelo create`)
- [ ] Unfurl issue links

### Enhanced Search

- [ ] Fuzzy matching
- [ ] Search shortcuts (`type:bug`, `@me`)
- [ ] Advanced search modal

### Document Version History

- [ ] Restore previous version (UI)
- [ ] Diff view

---

## Phase 3: Enterprise

### Nixelo Cloud (Hosted SaaS)

- [ ] Stripe payment integration
- [ ] Subscription management
- [ ] Pricing page

### SSO/SAML

- [ ] Google Workspace SSO
- [ ] Microsoft Entra ID
- [ ] Okta

### AI Assistant

- [ ] Natural language queries
- [ ] Project insights
- [ ] Auto-summarize

---

## Technical Debt

### Backend

- [ ] SendPulse email provider (optional, Resend works)

### Medium Priority

- [ ] Caching strategy
- [ ] Monitoring/alerting
- [ ] Activity log archiving

---

## Related Docs

- [CLAUDE.md](./CLAUDE.md) - Development guide
