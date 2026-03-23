<p align="center">
  <h1 align="center">Nixelo</h1>
  <p align="center">
    <strong>Open-source Jira + Confluence alternative with real-time collaboration</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#contributing">Contributing</a>
  </p>
</p>

---

## Why Nixelo?

Tired of paying $10+/user/month for Jira and Confluence? Nixelo gives you:

- **Real-time collaboration** — see changes instantly, no refresh needed
- **Documents + Issues + Boards** — all in one place, linked together
- **Self-hosted** — your data, your servers, no vendor lock-in
- **Modern stack** — React 19, TypeScript, Convex — easy to customize

## Features

### Documents (Confluence-like)

- Real-time collaborative editing with live cursors
- Rich text editor (Plate.js / Slate) with formatting, tables, code blocks, mentions
- Document templates, version history with restore
- Full-text search and document favorites

### Project Management (Jira-like)

- Kanban and Scrum boards with drag-and-drop
- Issues: tasks, bugs, stories, epics, and sub-tasks
- Sprint planning with burndown charts and velocity tracking
- Custom workflows, labels, emoji reactions
- Gantt chart / roadmap with drag-resize, dependency arrows, zoom
- Bulk operations (status, priority, assignee, labels, dates, archive, delete)
- Auto-archive done issues after configurable days
- Cycle time and lead time analytics

### Time Tracking

- Active timer widgets with start/stop
- Manual time entry and timesheet views
- Billing reports with CSV export
- Hour compliance monitoring

### Collaboration

- Stickies / quick notes on dashboard
- Comment threads with mentions and reactions
- Activity feeds (project-level and user-level)
- Notification center with read/snooze/archive

### AI

- AI assistant chat with project context
- Multi-provider support (Anthropic + OpenAI)
- Meeting bot with transcription and action items

### Integrations

- **REST API** with API key management
- **Google Calendar** sync (OAuth)
- **Pumble/Slack** notifications and slash commands
- **GitHub** PR and commit linking
- **Email** notifications and digests
- **External intake** — public API endpoint for issue submissions
- **Deploy boards** — shareable public project views

### Enterprise Ready

- Role-based access control (RBAC)
- Workspace and team hierarchy
- User invitation system with role assignment
- Google OAuth + Email/Password auth
- Audit logging

### Works Everywhere

- Responsive design (mobile, tablet, desktop)
- Progressive Web App (installable)
- Offline support — queued mutations replay on reconnect with exponential backoff
- Dark mode

## Quick Start

```bash
# Clone
git clone https://github.com/NixeloApp/cascade.git
cd cascade

# Install
pnpm install

# Run
pnpm dev
```

Open http://localhost:5555

### First Steps

1. Sign up with email or Google
2. Create a project (e.g., key: "PROJ")
3. Start creating documents and issues
4. Invite your team via Settings > User Management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TanStack Router, Tailwind CSS 4 |
| Backend | [Convex](https://convex.dev) (real-time serverless) |
| Editor | Plate.js (Slate-based) |
| Auth | Convex Auth (Email, Google) |
| Linter | Biome + 53 custom validators |
| Testing | Vitest (unit), Playwright (E2E) |

## Project Structure

```
nixelo/
├── src/
│   ├── routes/           # TanStack Router file-based routes
│   ├── components/       # React components (ui/, App/, IssueDetail/, ...)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities, constants, offline queue
│   └── config/routes.ts  # Route definitions
├── convex/               # Backend (schema, mutations, queries, crons)
├── e2e/                  # Playwright E2E tests + page objects
├── scripts/validate/     # 53 custom validators
├── docs/                 # ai/, architecture/, convex/, design/, guides/, research/
└── todos/                # Task tracking
```

## Commands

```bash
pnpm dev              # Start frontend + backend
pnpm run check        # Typecheck + lint + validate + tests (full CI)
pnpm run fixme        # Auto-fix lint/format + typecheck
pnpm run biome        # Lint with auto-fix
pnpm run typecheck    # TypeScript check
pnpm run validate     # 53 custom validators
pnpm test             # Unit tests (Vitest)
pnpm e2e:ui           # E2E tests (Playwright, interactive)
pnpm screenshots      # Capture visual baselines
pnpm screenshots:diff # Compare against approved baselines
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Set `CONVEX_DEPLOY_KEY` from Convex dashboard
4. Build command: `npx convex deploy --cmd 'pnpm run build'`
5. Output directory: `dist`

### Self-hosted

```bash
pnpm run build
npx convex deploy
# Serve dist/ with any static host
```

See [docs/guides/env.md](./docs/guides/env.md) for environment variables and [docs/guides/email-setup.md](./docs/guides/email-setup.md) for email configuration.

## Configuration

| Feature | Required | Setup |
|---------|----------|-------|
| Email notifications | Optional | Resend or Mailtrap API key |
| Google OAuth | Optional | Google Cloud credentials |
| GitHub integration | Optional | GitHub OAuth app |
| Google Calendar | Optional | Google Calendar API |
| Analytics | Optional | PostHog key |

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

- [Bug report template](./.github/ISSUE_TEMPLATE/bug-report.yml)
- [Feature request template](./.github/ISSUE_TEMPLATE/feature-request.yml)

## Comparison

| Feature | Nixelo | Jira | Confluence | Linear |
|---------|--------|------|------------|--------|
| Real-time collab | ✅ | ❌ | ❌ | ✅ |
| Self-hosted | ✅ | 💰 | 💰 | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| Docs + Issues | ✅ | ❌ | ❌ | ❌ |
| Time Tracking | ✅ | 💰 | ❌ | ❌ |
| Gantt / Roadmap | ✅ | 💰 | ❌ | ✅ |
| Offline support | ✅ | ❌ | ❌ | ✅ |
| Price | Free | $8+/user | $6+/user | $8+/user |

## License

MIT License — see [LICENSE](./LICENSE)

## Links

- [Documentation](./docs/)
- [Convex Best Practices](./docs/convex/BEST_PRACTICES.md)
- [Testing Guide](./docs/guides/testing-e2e.md)
- [Contributing](./CONTRIBUTING.md)
- [Convex Dashboard](https://dashboard.convex.dev)

---

<p align="center">
  Built with <a href="https://convex.dev">Convex</a>, <a href="https://react.dev">React</a>, and <a href="https://tailwindcss.com">Tailwind CSS</a>
</p>
