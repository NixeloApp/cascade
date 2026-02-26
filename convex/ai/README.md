# AI Module Documentation

This module powers the AI features in Nixelo, including Chat, Smart Suggestions, and Semantic Search.

## Overview

The AI module is built on top of [Convex Actions](https://docs.convex.dev/functions/actions) and the [Vercel AI SDK](https://sdk.vercel.ai/docs). It uses Anthropic's Claude models for text generation and Voyage AI for embeddings.

### Key Capabilities

1.  **AI Chat** (`chat.ts`): Conversational assistant for project management.
2.  **Smart Suggestions** (`suggestions.ts`): Auto-generates descriptions, priorities, and labels.
3.  **Semantic Search** (`semanticSearch.ts`): Finds similar issues and duplicates using vector embeddings.

## Architecture

The module is split into:

-   **Public API** (`convex/ai/*.ts`): Exposed actions and mutations for the frontend.
-   **Internal Implementation** (`convex/internal/ai.ts`): Backend logic, database access, and direct API calls.
-   **Configuration** (`convex/ai/config.ts`): Environment variables and model settings.

### Data Flow

1.  Frontend calls a public action (e.g., `api.ai.chat.chat`).
2.  Public action validates input and checks permissions.
3.  Public action calls internal functions (`internal.ai.*`) for database operations or heavy lifting.
4.  Internal functions interact with external AI providers (Anthropic, Voyage).
5.  Results are stored in the database (e.g., `aiMessages`, `aiSuggestions`) and returned to the frontend.

## Configuration

The following environment variables are required:

-   `ANTHROPIC_API_KEY`: API key for Anthropic (Claude).
-   `VOYAGE_API_KEY`: API key for Voyage AI (Embeddings).

To configure these locally:

```bash
npx convex env set ANTHROPIC_API_KEY <your-key>
npx convex env set VOYAGE_API_KEY <your-key>
```

## Models

We use specific models optimized for different tasks:

| Feature | Model | Why? |
| :--- | :--- | :--- |
| **Chat** | `claude-opus-4-5` | High reasoning capability for complex project queries. |
| **Suggestions** | `claude-haiku-4-5` | Fast and cost-effective for simple generation tasks. |
| **Embeddings** | `voyage-3-lite` | Efficient 512-dimension embeddings for semantic search. |

## Key Files

### `convex/ai/chat.ts`

Handles the chat interface.
-   `chat`: Main action for sending messages.
-   `generateEmbedding`: Wrapper for internal embedding generation.
-   Uses `internal.internal.ai` for backend operations.

### `convex/ai/suggestions.ts`

Provides intelligent suggestions for issue creation.
-   `suggestIssueDescription`: Generates a description based on title.
-   `suggestPriority`: Suggests priority based on content.
-   `suggestLabels`: Recommends labels based on context.
-   Uses `ActionCache` to cache expensive AI calls.

### `convex/ai/semanticSearch.ts`

Implements vector search for issues.
-   `searchSimilarIssues`: Finds issues with similar meaning.
-   `findPotentialDuplicates`: Identifies duplicate issues during creation.
-   Uses `voyage-3-lite` embeddings stored in the `issues` table.

## Internal Implementation (`convex/internal/ai.ts`)

Contains the core logic for:
-   Direct API calls to Voyage AI.
-   Database operations for AI data (`aiChats`, `aiMessages`, `aiUsage`).
-   Context retrieval (fetching project data for the AI).

## Usage Examples

### Chat

```typescript
const { chatId, message } = await convex.action(api.ai.chat.chat, {
  message: "What is the status of the current sprint?",
  projectId: "...",
});
```

### Suggestions

```typescript
const description = await convex.action(api.ai.suggestions.suggestIssueDescription, {
  title: "Fix login bug",
  type: "bug",
  projectId: "...",
});
```

### Semantic Search

```typescript
const similarIssues = await convex.action(api.ai.semanticSearch.searchSimilarIssues, {
  query: "users cannot log in",
  projectId: "...",
});
```
