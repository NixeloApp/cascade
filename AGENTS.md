# Nixelo - Agent Instructions

## Project Context

Nixelo is a modern web application built with the following technologies:

- **Frontend**: React 19, Vite, TanStack Router (File-based routing).
- **Backend**: Convex (Real-time database and backend functions).
- **Styling**: Tailwind CSS v4, utilizing semantic color tokens (e.g., `bg-ui-bg-primary`, `text-ui-text-secondary`) and Lucide React for icons.
- **Language**: Strict TypeScript.
- **Tooling**: Biome (Linting/Formatting), Vitest (Unit Tests), Playwright (E2E Tests), pnpm (Package Manager).

## Architectural Principles

1. **Strict TypeScript**: Avoid `any`. Use strict type definitions for all props, state, and return values.
2. **Functional Components**: Use React functional components with hooks. Avoid class components.
3. **Styling**:
   - Use Tailwind CSS utility classes.
   - **Do not** use arbitrary values (e.g., `h-[50px]`). Use standard spacing tokens.
   - Use semantic color tokens defined in `index.css`/`tailwind.config.js` for dark mode compatibility.
   - Use `class-variance-authority` (cva) for component variants.
4. **Backend/Frontend Separation**:
   - Convex functions (`query`, `mutation`, `action`) reside in the `convex/` directory.
   - Frontend components reside in `src/`.
   - Respect the boundary: Frontend components import backend functions to fetch data/trigger mutations.
5. **Routing**: Follow TanStack Router patterns in `src/routes`.

## Behavior

- **Do not hallucinate imports.** Always check if a library is installed (`package.json`) before importing it.
- **Verify File Paths**: Ensure imports point to existing files. Use `@/` alias for `src/` where configured.
- **Context Awareness**: Read `README.md` and existing code to understand conventions before changing them.

## Code Quality Rules

### Forbidden Patterns (Never Introduce)

**Type Safety Bypasses:**
- `// @ts-ignore` — Never suppress TypeScript errors
- `// @ts-expect-error` — Never expect TypeScript errors
- `// biome-ignore` — Never disable Biome rules
- `// eslint-disable` — Never disable linting

**Unsafe Type Coercions:**
- `as any` — Never cast to any
- `as never` — Never cast to never
- `as unknown` — Never cast to unknown (unless immediately followed by a proper type guard)

If you encounter a type error, **fix the underlying issue** rather than suppressing it. If the types are genuinely wrong in a dependency, document it and raise the issue.

### File Hygiene (Never Commit)

**Scratch Files:**
- Test scripts at repo root (e.g., `test_*.ts`, `verify_*.py`)
- Screenshot artifacts (e.g., `*.png`, `*.jpg` outside designated asset folders)
- Debug/exploration files

**Before committing, always:**
1. Run `git status` and review the file list
2. Remove any files that aren't part of the intended change
3. Ensure no root-level scratch files are staged

### Constants & Configuration

- **No magic numbers** in test files — import shared constants or define them in a constants file
- **No pnpm overrides** for security fixes unless explicitly approved — prefer upgrading the parent package or documenting accepted risk

## Git Safety Protocol

**CRITICAL**: Agents must prevent data loss during version control operations.

1.  **Never** use `git reset --hard` or `git clean -fd` unless you have explicitly verified via `git status` that there are no uncommitted changes you intend to keep.
2.  **Verify Commits**: Before resetting, ensure your previous `git commit` actually succeeded (check for linting failures or empty commits).
3.  **Preserve Index**: Prefer `git reset --soft` or `git reset` (mixed) when correcting commit history.

## Testing

### Local Quality Checks

Before submitting PRs, run the following commands. These are also enforced by CI and pre-commit hooks:

- `pnpm run check`: TypeScript type checking + linting.
- `pnpm run typecheck`: TypeScript type checking only.
- `pnpm run biome`: Biome linting with auto-fix.
- `pnpm run format`: Biome formatting with auto-fix.
- `pnpm test`: Run unit tests.

### New Logic Requires New Tests

- Unit tests for utilities/hooks (Vitest).
- Component tests (React Testing Library).
- E2E tests for critical flows (Playwright).

### Run Tests

Verify changes with `pnpm test` or specific test files.

## Agent Capabilities: Browser Automation

> **⚠️ Capability Critical:** This section applies to **Antigravity** agents with access to the `browser_subagent` tool. If you are running via a standard CLI or an agent without this specific toolset, you likely **cannot** perform these actions autonomously.

Agents with Antigravity capabilities have access to a powerful **Browser Subagent** capable of advanced research:

### 1. Supported Capabilities

- **Authenticated Sessions**: Can log in to external services (Linear, Google, etc.) using user-provided credentials.
- **Visual Inspection**: Can take screenshots, record session videos (WebP), and analyze UI density/layout.
- **Deep Technical Extraction**:
  - **CSS**: Extract all CSS variables (`--bg-color`), font stacks, and animation curves.
  - **Network**: Traffic analysis (GraphQL vs REST), capturing WebSocket events.
  - **Framework Detection**: Identify React, Next.js, MobX, etc. via global hooks.

### 2. Workflow for Authenticated Tasks

1.  **Plan**: Agent proposes the task (e.g., "Analyze Linear's Dashboard").
2.  **Auth**: User provides credentials in chat. Agent automates the login flow.
3.  **Execute**: Agent navigates deep into the app to extract "secret sauce" data.
4.  **Artifacts**: Agent generates reports (`tech-stack.md`) and visual proofs (recordings).

**Note:** This bypasses standard "bot" limitations by using a full headless browser environment.

### 3. Credential Management

**Before asking the user for credentials**, always check `secrets.json` in the root directory.

- **File Path:** `./secrets.json` (Gitignored)
- **Structure:**
  ```json
  {
    "google": { "email": "...", "password": "..." },
    "linear": { ... }
  }
  ```
- **Policy:** If `secrets.json` exists, load it and use the credentials automatically. If valid credentials fail, `notify_user` immediately.

### 4. Total Mirror Capture System

For comprehensive competitor research, use the **Total Mirror** scripts:

```bash
# Single page capture
pnpm run mirror <url> <competitor> <page>
# Example: pnpm run mirror https://linear.app/features linear features

# Batch capture (all defined pages)
pnpm run mirror:batch
```

**Scripts:**

- `scripts/scrape_full_mirror.js` — Single page capture (HTML, JS, CSS, fonts, images, CSS vars)
- `scripts/mirror_batch.js` — Runs all defined targets (Linear, ClickUp, Notion)

**Output:** `docs/research/library/<competitor>/`

**Gitignored (regenerable):** `assets/`, `*.html`, `*_manifest.json`, `*_network.json`
**Tracked (intelligence):** `*_deep.json` (CSS vars, keyframes, fonts)
