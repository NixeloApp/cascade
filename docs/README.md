# Nixelo Documentation

> Complete documentation index for AI assistants and developers.

**Stack:** React 19 + Vite 7 + Convex + TanStack Router + Tailwind CSS 4 + Plate.js

**AI:** Anthropic Claude (Opus 4.6 for chat, Haiku 4.5 for suggestions) + Voyage AI (embeddings)

---

## Directory Structure

```
docs/
├── ai/                  # AI features (text chat + voice meeting bot)
├── architecture/        # System design, data model, editor
├── convex/              # Backend patterns, pagination, errors
├── design/              # Design system, patterns, 40 page specs
├── feature-comparison/  # Feature-by-feature competitor analysis
├── guides/              # How-to guides (setup, testing, email, PWA)
├── launch/              # Launch prep (channel posts, demo script)
└── research/            # Competitors, strategy, protocols
```

---

## AI Features (`ai/`)

| File | Description |
|------|-------------|
| `ai/text/SETUP.md` | Text AI setup: API keys, Voyage AI, environment variables |
| `ai/voice/SETUP.md` | Voice AI setup: bot service deployment, transcription providers |
| `ai/voice/ARCHITECTURE.md` | Meeting bot architecture: Playwright, audio capture, job flow |

---

## Architecture (`architecture/`)

| File | Description |
|------|-------------|
| `architecture/data-model.md` | Complete database schema (9 domains) |
| `architecture/grand-unified-model.md` | Full system diagram |
| `architecture/workflows.md` | Sequence diagrams: sprint planning, presence, GitHub sync |
| `architecture/seo-strategy.md` | SPA SEO strategy |
| `architecture/editor.md` | Plate.js editor architecture |
| `architecture/ARCHITECTURE_DECISION.md` | Linear-style hierarchy decision |

---

## Convex Backend (`convex/`)

| File | Description |
|------|-------------|
| `convex/BEST_PRACTICES.md` | Query optimization, error handling, patterns |
| `convex/COMPONENTS.md` | Rate limiter, cache, aggregates |
| `convex/ERRORS.md` | Error handling patterns, ConvexError usage |
| `convex/PERFORMANCE.md` | Query limits, indexing, optimization |
| `convex/PAGINATION.md` | Cursor-based pagination patterns |
| `convex/STANDARDS.md` | Backend coding standards |

---

## Design System (`design/`)

| File | Description |
|------|-------------|
| `design/PATTERNS.md` | Component usage patterns (do/don't) |
| `design/STANDARDS.md` | Core principles, tokens, semantic HTML |
| `design/REFERENCE.md` | Token values and component inventory |
| `design/GAPS.md` | Actionable improvements (prioritized) |
| `design/specs/pages/` | 40 page-by-page design specs with screenshots |
| `design/specs/components/` | Component deep-dives |
| `design/specs/modals/` | Modal dialog specs |
| `design/specs/onboarding/` | Onboarding flow specs |

---

## Feature Comparison (`feature-comparison/`)

Feature-by-feature analysis across competitor products, organized by domain:
`auth/`, `documents/`, `issues/`, `notifications/`, `projects/`, `scheduling/`, `settings/`, `sprints-cycles/`, `views/`

---

## Guides (`guides/`)

| File | Description |
|------|-------------|
| `guides/env.md` | Environment variables |
| `guides/pwa.md` | Progressive Web App configuration |
| `guides/offline-architecture.md` | Offline queue, replay, failure classification |
| `guides/email-setup.md` | Email provider setup |
| `guides/google-calendar.md` | Google Calendar OAuth and sync |
| `guides/bundle-optimization.md` | Bundle size optimization |
| `guides/path-aliases.md` | Import path configuration |
| `guides/testing-e2e.md` | Playwright E2E testing |
| `guides/testing-unit.md` | Vitest unit testing |
| `guides/testing-backend.md` | Convex function testing |

---

## Launch (`launch/`)

| File | Description |
|------|-------------|
| `launch/COMMUNITY_LAUNCH_RUNBOOK.md` | Launch checklist |
| `launch/CHANNEL_POST_DRAFTS.md` | Marketing channel drafts |
| `launch/DEMO_VIDEO_SCRIPT.md` | Demo video script |

---

## Research (`research/`)

| Directory | Contents |
|-----------|----------|
| `research/competitors/pm-suites/` | Jira, Linear, Asana, ClickUp, Monday, Notion, Height, Shortcut |
| `research/competitors/meeting-ai/` | Fireflies, Gong, Otter, Read AI, tl;dv |
| `research/competitors/time-tracking/` | Clockify, Jibble, TimeCamp, TMetric, Toggl |
| `research/competitors/infrastructure/` | Meeting BaaS, Nylas, Recall.ai, Skribby |
| `research/competitors/open-source/` | AppFlowy, Cal.com, Canvas LMS, Kimai |
| `research/comparisons/` | Feature matrix, architecture patterns, market landscape |
| `research/strategy/` | Feature gap analysis, niche strategy, competitive gaps |
| `research/protocols/` | Research methodology |

---

## Key Links

- **Project Guide:** [CLAUDE.md](../CLAUDE.md)
- **TODOs:** [todos/README.md](../todos/README.md)
- **Convex Dashboard:** https://dashboard.convex.dev/d/peaceful-salmon-964
