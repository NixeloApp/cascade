# Rich Text Description - Follow-up Improvements

> **Status:** Complete

Issue descriptions now support rich text editing via Plate.js. Some external integrations still expect plain text.

## Scope

Add backend helper to extract plain text from rich text JSON descriptions for integrations that display raw text.

## Files to Update

- `convex/pumble.ts:337` — Sends description to Pumble chat (currently sends JSON)
- `convex/ai/chat.ts:55` — Uses description for AI embeddings (JSON still works but not ideal)
- `convex/export.ts:113` — CSV export includes description (would export JSON string)

## Approach

1. Create `convex/lib/richText.ts` with:
   ```typescript
   export function getPlainTextFromDescription(description: string | undefined): string {
     if (!description) return "";
     try {
       const parsed = JSON.parse(description);
       // Extract text from Slate/Plate nodes recursively
       return extractText(parsed);
     } catch {
       // Already plain text (legacy data)
       return description;
     }
   }
   ```

2. Update integrations to use the helper:
   - `pumble.ts` — Use helper for chat messages
   - `ai/chat.ts` — Use helper for embedding generation
   - `export.ts` — Use helper for CSV export

3. Consider updating `getSearchContent()` in `convex/issues/helpers.ts` to use the helper for cleaner search indexing

## Notes

- Frontend already has `valueToPlainText()` in `src/lib/plate/editor.ts`
- Backend needs equivalent since Convex functions can't import frontend code
- Legacy plain text descriptions are handled gracefully (try/catch)

---

## Execution Plan (Updated 2026-03-02)

**Owner:** `@unassigned`  
**Target Window:** Sprint `S1`  
**Effort:** Small-Medium

### Milestones

- [x] `S1` Add backend plain-text extraction helper for description JSON
- [x] `S1` Integrate helper into Pumble, AI chat embeddings, and CSV export/JSON export output
- [x] `S1` Add helper-level tests for JSON and legacy plain text inputs

### Dependencies

- Stable Plate/Slate node structure assumptions for extraction logic

### Definition of Done

- External integrations no longer receive raw rich-text JSON blobs where plain text is expected.

---

## Progress Updates

### 2026-03-02 (Priority 12, batch A)

**Completed**
- Added backend helper `convex/lib/richText.ts` with `getPlainTextFromDescription(...)`:
  - Parses Plate/Slate JSON and recursively extracts text content.
  - Preserves legacy plain text values.
  - Handles invalid JSON via safe fallback.
- Integrated helper into:
  - `convex/pumble.ts` (`sendIssueNotification`) so webhook messages send plain text.
  - `convex/ai/chat.ts` (`generateIssueEmbedding`) so embedding input uses plain text description.
  - `convex/export.ts`:
    - `exportIssuesCSV` now includes a `Description` column with plain text output.
    - `exportIssuesJSON` now emits plain-text `issue.description` values instead of raw JSON blobs.
  - `convex/issues/helpers.ts` (`getSearchContent`) to normalize rich-text descriptions into plain-text search content.
- Added/updated tests:
  - New helper tests: `convex/lib/richText.test.ts`.
  - Rich-text conversion assertions in `convex/pumble.test.ts`, `convex/export.test.ts`, and `convex/issues/helpers.test.ts`.

**Validation**
- `pnpm exec biome check --write convex/issues/helpers.ts convex/lib/richText.ts convex/lib/richText.test.ts convex/pumble.ts convex/pumble.test.ts convex/export.ts convex/export.test.ts convex/issues/helpers.test.ts convex/ai/chat.ts`
- `pnpm test convex/lib/richText.test.ts convex/issues/helpers.test.ts convex/export.test.ts convex/pumble.test.ts` (`86 passed`)
- `pnpm run typecheck` (pass)

**Decisions**
- Kept extraction fallback behavior conservative: invalid JSON returns original description to avoid data loss.
- Included JSON export cleanup in scope so both machine-readable exports and chat integrations avoid raw rich-text blobs.

**Blockers**
- None.

**Next step (strict order)**
- Move to Priority `13`: `todos/sidebar-display-limits.md`.

### 2026-03-02 (Priority 12, batch B)

**Completed**
- Reconfirmed Priority `12` as complete with no remaining unchecked milestones, blockers, or deferred items in scope.

**Validation**
- Prior batch validation set remains the source of truth for this completed scope:
  - helper + integration tests (`86 passed`)
  - `pnpm run typecheck` (pass)

**Decisions**
- No additional changes needed; this todo is closed and kept for historical traceability.

**Blockers**
- None.

**Next step (strict order)**
- Continue to Priority `13`: `todos/sidebar-display-limits.md`.
