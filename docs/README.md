# Nixelo Documentation

> Complete documentation index for AI assistants and developers.

## Quick Reference

```bash
pnpm dev              # Start frontend + backend
pnpm run check        # Typecheck + lint + tests
pnpm e2e:ui           # E2E tests (interactive)
pnpm convex deploy    # Deploy backend
```

**Stack:** React 19 + Vite 6 + Convex + TanStack Router + Tailwind CSS + BlockNote

**AI:** Anthropic Claude (Opus 4.5 for chat, Haiku 4.5 for suggestions) + Voyage AI (embeddings)

---

## Complete File Index

### AI Features (`ai/`)

| File                       | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `ai/text/SETUP.md`         | Text AI setup: API keys, Voyage AI, environment variables       |
| `ai/voice/SETUP.md`        | Voice AI setup: bot service deployment, transcription providers |
| `ai/voice/ARCHITECTURE.md` | Meeting bot architecture: Playwright, audio capture, job flow   |

**Text AI Features:**

- AI Chat (Claude Opus 4.5) - natural language queries about projects
- Semantic Search (Voyage AI) - find issues by meaning
- Duplicate Detection - prevent duplicate issues
- AI Suggestions (Claude Haiku 4.5) - generate descriptions, priority, labels

**Voice AI Features:**

- Automatic meeting joining (Google Meet, Zoom/Teams planned)
- Multi-provider transcription: Speechmatics (8hr), Gladia (8hr), Azure (5hr), Google (1hr) = 22hr/month free
- Claude summarization with action item extraction

**Key Files:**

- `convex/ai/` - Text AI backend (config, providers, actions, semanticSearch, suggestions)
- `bot-service/` - Voice AI service (Playwright bot, transcription, summary)
- `src/components/AI/` - Frontend components

**Environment Variables:**

```bash
ANTHROPIC_API_KEY=sk-ant-...     # Required for AI features
VOYAGE_API_KEY=pa-...            # For embeddings/semantic search
BOT_SERVICE_URL=...              # Voice AI bot service URL
BOT_SERVICE_API_KEY=...          # Voice AI authentication
```

---

### Architecture (`architecture/`)

| File                                    | Description                                               |
| --------------------------------------- | --------------------------------------------------------- |
| `architecture/data-model.md`            | Complete database schema visualization (9 domains)        |
| `architecture/grand-unified-model.md`   | Full system diagram combining all domains                 |
| `architecture/workflows.md`             | Sequence diagrams: sprint planning, presence, GitHub sync |
| `architecture/seo-strategy.md`          | SPA SEO strategy, public docs indexing                    |
| `architecture/ARCHITECTURE_DECISION.md` | Linear-style hierarchy decision                           |

---

### Bundle Optimization (`bundle/`)

| File                  | Description                                   |
| --------------------- | --------------------------------------------- |
| `bundle/GUIDE.md`     | Bundle optimization techniques and strategies |
| `bundle/RESULTS_*.md` | Historical bundle size measurements           |

---

### Convex Backend (`convex/`)

| File                       | Description                                  |
| -------------------------- | -------------------------------------------- |
| `convex/BEST_PRACTICES.md` | Query optimization, error handling, patterns |
| `convex/COMPONENTS.md`     | Rate limiter, cache, aggregates              |
| `convex/ERRORS.md`         | Error handling patterns, ConvexError usage   |
| `convex/PERFORMANCE.md`    | Query limits, indexing, optimization         |
| `convex/PAGINATION.md`     | Cursor-based pagination patterns             |

**Quick Patterns:**

```typescript
// Error handling
import { forbidden, notFound, validation } from "./lib/errors";
throw forbidden("Not authorized");

// Query limits
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./lib/queryLimits";
.take(DEFAULT_PAGE_SIZE); // 50

// Pagination
const { page, continueCursor } = await ctx.db
  .query("issues")
  .paginate(paginationOpts);
```

---

### Email System (`email/`)

| File             | Description                               |
| ---------------- | ----------------------------------------- |
| `email/SETUP.md` | Email provider setup, domain verification |

**Features:**

- Universal email wrapper - all emails use `sendEmail()`
- Provider rotation - Resend (3k), SendPulse (15k), Mailgun (1k), SendGrid (3k), Mailtrap (1k) = 23k/month free
- React Email templates in `emails/`
- User notification preferences

**Email Types:** OTP verification, password reset, @mentions, assignments, comments, digests

---

### Integrations (`integrations/`)

| File                                    | Description                          |
| --------------------------------------- | ------------------------------------ |
| `integrations/GOOGLE_CALENDAR_SETUP.md` | Google Calendar OAuth and sync setup |

**GitHub Integration:**

- OAuth authentication
- Link repositories to projects
- Auto PR/commit tracking (issue keys in messages)
- Webhook support for real-time updates
- Functions: `convex/github.ts`

**Google Calendar Integration:**

- Bi-directional sync (import/export/both)
- OAuth with Google Cloud
- Functions: `convex/googleCalendar.ts`

**Offline Mode (PWA):**

- Service worker caching
- IndexedDB for local storage
- Offline mutation queue with auto-sync
- Installable as native app
- Functions: `convex/offlineSync.ts`, `src/lib/offline.ts`

---

### Research & Strategy (`research/`)

Centralized competitor intelligence for Nixelo's product strategy.

```
research/
├── INVENTORY.md              ← Live inventory of all research artifacts
├── assets/                   ← Screenshots and visual evidence
│
├── competitors/              ← Individual competitor analyses
│   ├── pm-suites/            ← Jira, Linear, Asana, ClickUp, Monday, Notion, Height, Shortcut
│   ├── meeting-ai/           ← Fireflies, Gong, Otter, Read AI, tl;dv
│   ├── time-tracking/        ← Clockify, Jibble, TimeCamp, TMetric, Toggl + overview
│   ├── infrastructure/       ← Meeting BaaS, Nylas, Recall.ai, Skribby
│   └── open-source/          ← AppFlowy, Cal.com, Canvas LMS, Kimai
│
├── comparisons/              ← Cross-competitor analysis
│   ├── feature-matrix.md     ← Comprehensive feature comparison
│   ├── meeting-landscape.md  ← Meeting AI market landscape
│   ├── pm-architecture.md    ← PM tool architecture patterns
│   └── tech-stack-analysis.md ← Linear technical deep dive
│
├── strategy/                 ← Strategic planning
│   ├── FEATURE_DEEP_DIVE.md  ← Feature-by-feature gap analysis (18 features)
│   ├── SCRAP_STRATEGY.md     ← Master list of features to adopt
│   ├── NICHE_STRATEGY.md     ← How we win against giants
│   └── GAPS_vs_Competitors.md ← Critical missing features (Roadmap)
│
├── protocols/                ← Research methodology
│   └── omega-scraping.md     ← Multi-device scraping protocol
│
└── library/                  ← Raw research artifacts (screenshots, tech specs)
    ├── asana/, clickup/, fireflies/, gong/, linear/, notion/
    └── README.md             ← Library index
```

| Category | Purpose | Doc Count |
|----------|---------|-----------|
| **PM Suites** | Direct competitors in project management | 8 |
| **Meeting AI** | Meeting intelligence & transcription tools | 5 |
| **Time Tracking** | Time tracking & productivity tools | 6 |
| **Infrastructure** | Backend APIs for meeting bots & comms | 4 |
| **Open Source** | Open-source benchmark projects | 4 |
| **Comparisons** | Cross-cutting analysis & matrices | 4 |
| **Strategy** | Feature gap analysis & roadmap input | 4 |

**Quick Links:**

- [Full Inventory](research/INVENTORY.md) | [Feature Matrix](research/comparisons/feature-matrix.md) | [Feature Deep Dive](research/strategy/FEATURE_DEEP_DIVE.md)
- **Gold Standards:** [Jira](research/competitors/pm-suites/jira.md) and [Linear](research/competitors/pm-suites/linear.md)

**Strategic Goal:**
Combine **Real-time Issue Tracking** (Linear) + **Integrated Docs** (Notion) + **Meeting Intelligence** (Read AI) + **Open Source** (GitLab) to create a unique value proposition.

---

### Setup & Configuration (`setup/`)

| File                    | Description                                  |
| ----------------------- | -------------------------------------------- |
| `setup/ENV.md`          | Complete environment variables documentation |
| `setup/PWA.md`          | Progressive Web App configuration            |
| `setup/PATH_ALIASES.md` | Import path configuration                    |

**Quick Start:**

```bash
pnpm install
cp .env.example .env.local
pnpm run dev:backend   # Start Convex
pnpm run dev:frontend  # Start Vite
```

**Key Environment Variables:**

- `SITE_URL` - Frontend URL (required)
- `RESEND_API_KEY` - Email notifications
- `AUTH_GOOGLE_ID/SECRET` - Google sign-in
- `ANTHROPIC_API_KEY` - AI features

---

### Testing (`testing/`)

| File                                   | Description                                    |
| -------------------------------------- | ---------------------------------------------- |
| `testing/e2e.md`                       | Playwright E2E testing, page objects, fixtures |
| `testing/unit.md`                      | Vitest unit testing, component testing         |
| `testing/backend.md`                   | Convex function testing with convex-test       |
| `testing/E2E_SIGNIN_FLAKINESS.md`      | Auth flow debugging notes                      |
| `testing/E2E_INVESTIGATION_SUMMARY.md` | E2E test investigation                         |
| `testing/UNIT-TEST-INVESTIGATION.md`   | Unit test investigation                        |

**Test Commands:**

```bash
pnpm test              # Unit tests (watch)
pnpm test:convex       # Backend tests
pnpm e2e               # E2E tests (headless)
pnpm e2e:ui            # E2E tests (interactive)
pnpm run check         # All checks (CI)
```

**Selector Priority (Playwright):**

1. `getByRole` - buttons, headings, links
2. `getByLabel` - form inputs
3. `getByPlaceholder` - inputs without labels
4. `getByText` - visible text
5. `getByTestId` - last resort

---

### Root-Level Docs

| File                | Description                                  |
| ------------------- | -------------------------------------------- |
| `API.md`            | REST API endpoints, authentication, examples |
| `AUTHENTICATION.md` | Auth methods, user management, RBAC          |
| `COLORS.md`         | Semantic color tokens, theming system        |
| `FUZZY_SEARCH.md`   | Search implementation guide                  |

---

### Design System (`design/`)

| File                         | Description                             |
| ---------------------------- | --------------------------------------- |
| `design/README.md`           | Design system overview                  |
| `design/STANDARDS.md`        | Core principles, tokens, semantic HTML  |
| `design/PATTERNS.md`         | Component usage patterns (do/don't)     |
| `design/REFERENCE.md`        | Token values & component inventory      |
| `design/GAPS.md`             | Actionable improvements (prioritized)   |
| `design/specs/pages/`        | Page-by-page design specs               |
| `design/specs/components/`   | Component deep-dives                    |
| `design/specs/onboarding/`   | Onboarding flow specs                   |
| `design/specs/modals/`       | Modal dialog specs                      |

---

### Design Perfection Protocol (`design-perfection/`)

Systematic design audit phases for achieving polish.

| File                          | Description                             |
| ----------------------------- | --------------------------------------- |
| `PHASE_1_COMPONENTS.md`       | Storybook, variants, states audit       |
| `PHASE_2_STRUCTURE.md`        | Layout consistency across viewports     |
| `PHASE_3_COLOR.md`            | Semantic tokens, shadows, borders       |
| `PHASE_4_DOCS_SYNC.md`        | Docs accuracy, TODO extraction          |

---

### Archive (`archive/`)

Historical/deprecated documentation for reference.

| File                                     | Description              |
| ---------------------------------------- | ------------------------ |
| `archive/E2E-AUTH-FAILURE-ROOT-CAUSE.md` | Past auth debugging      |
| `archive/PHASE3-ROUTES-PROGRESS.md`      | Route migration progress |

---

## Directory Structure

```
docs/
├── ai/                  # AI features (text + voice)
│   ├── text/
│   └── voice/
├── architecture/        # System design, data model
├── archive/             # Deprecated docs
├── bundle/              # Bundle optimization
├── convex/              # Convex backend patterns
├── design/              # Design system (specs, patterns)
│   └── specs/           # Page & component specs
├── design-perfection/   # Design audit protocol phases
├── email/               # Email system
├── integrations/        # GitHub, Calendar, Offline
├── research/            # Competitor analysis
├── setup/               # Setup guides
└── testing/             # Test guides
```

---

## Key Links

- **Main Project Guide:** [CLAUDE.md](../CLAUDE.md)
- **Project TODOs & Roadmap:** [todos/README.md](../todos/README.md)
- **Backend README:** [convex/README.md](../convex/README.md)
- **E2E Tests:** [e2e/README.md](../e2e/README.md)
- **Convex Dashboard:** https://dashboard.convex.dev/d/peaceful-salmon-964

---

_Last Updated: 2026-02-27_
