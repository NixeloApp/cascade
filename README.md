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

- **Real-time collaboration** - See changes instantly, no refresh needed
- **Documents + Issues + Boards** - All in one place, linked together
- **Self-hosted** - Your data, your servers, no vendor lock-in
- **Modern stack** - React 19, TypeScript, Convex - easy to customize

## Features

### 📝 Documents (Confluence-like)

- Real-time collaborative editing with live cursors
- Rich text editor with formatting, tables, code blocks
- Document templates and organization
- Full-text search
- Document favorites (star for quick access)

### 📊 Project Management (Jira-like)

- Kanban and Scrum boards with drag-and-drop
- Issues: tasks, bugs, stories, epics, and **Linear-style Sub-tasks**
- Sprint planning with burndown charts and velocity tracking
- Custom workflows, labels, and **Emoji Reactions**
- Built-in time tracking with active timer widgets

### 🔗 Integrations

- **REST API** with API key management
- **Google Calendar** sync (OAuth)
- **Pumble/Slack** notifications
- **GitHub** PR and commit linking
- **Email** notifications and digests

### 🔐 Enterprise Ready

- Role-based access control (RBAC)
- User invitation system
- Google OAuth + Email/Password auth
- Audit logging

### 📱 Works Everywhere

- Responsive design (mobile, tablet, desktop)
- Progressive Web App (installable)
- Offline support with auto-sync
- Dark mode

## Quick Start

```bash
# Clone
git clone https://github.com/yourusername/nixelo.git
cd nixelo

# Install
pnpm install

# Run
pnpm run dev
```

Open http://localhost:5555 - that's it!

### First Steps

1. Sign up with email or Google
2. Create a project (e.g., key: "PROJ")
3. Start creating documents and issues
4. Invite your team via Settings → User Management

## Tech Stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS            |
| Backend  | [Convex](https://convex.dev) (real-time serverless) |
| Editor   | BlockNote (ProseMirror)                             |
| Auth     | Convex Auth (Email, Google, Anonymous)              |
| Testing  | Vitest, React Testing Library                       |

## Project Structure

```
nixelo/
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── hooks/           # Custom hooks
│   └── lib/             # Utilities
├── convex/              # Backend (Convex)
│   ├── schema.ts        # Database schema
│   ├── documents.ts     # Document operations
│   ├── issues.ts        # Issue tracking
│   └── ...
└── docs/                # Documentation
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables:
   - `CONVEX_DEPLOY_KEY` (from Convex dashboard)
4. Build command: `npx convex deploy --cmd 'pnpm run build'`
5. Output directory: `dist`

### Self-hosted

```bash
# Build
pnpm run build

# Deploy Convex backend
npx convex deploy

# Serve dist/ with any static host
```

See [SETUP.md](./SETUP.md) for detailed configuration (email, OAuth, etc.)

## Configuration

| Feature             | Required | Setup                    |
| ------------------- | -------- | ------------------------ |
| Email notifications | Optional | Resend API key           |
| Google OAuth        | Optional | Google Cloud credentials |
| GitHub integration  | Optional | GitHub OAuth app         |
| Analytics           | Optional | PostHog key              |

## Commands

```bash
pnpm run dev          # Start development
pnpm run build        # Build for production
pnpm run typecheck    # Type checking
pnpm run biome        # Linting
pnpm test             # Run tests
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development

```bash
pnpm run dev:frontend  # Frontend only
pnpm run dev:backend   # Backend only (Convex)
```

### Testing

```bash
pnpm test              # Frontend tests
pnpm test:backend      # Backend tests
```

## Comparison

| Feature          | Nixelo | Jira     | Confluence | Linear   |
| ---------------- | ------ | -------- | ---------- | -------- |
| Real-time collab | ✅     | ❌       | ❌         | ✅       |
| Self-hosted      | ✅     | 💰       | 💰         | ❌       |
| Open source      | ✅     | ❌       | ❌         | ❌       |
| Docs + Issues    | ✅     | ❌       | ❌         | ❌       |
| Time Tracking    | ✅     | 💰       | ❌         | ❌       |
| Price            | Free   | $8+/user | $6+/user   | $8+/user |

## License

MIT License - see [LICENSE](./LICENSE)

## Links

- [Documentation](./docs/)
- [Setup Guide](./SETUP.md)
- [Research Inventory](./docs/research/INVENTORY.md)
- [Contributing](./CONTRIBUTING.md)
- [Convex Dashboard](https://dashboard.convex.dev)

---

<p align="center">
  Built with ❤️ using <a href="https://convex.dev">Convex</a>, <a href="https://react.dev">React</a>, and <a href="https://tailwindcss.com">Tailwind CSS</a>
</p>
