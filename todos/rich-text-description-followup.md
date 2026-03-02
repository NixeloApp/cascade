# Rich Text Description - Follow-up Improvements

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

- [ ] `S1` Add backend plain-text extraction helper for description JSON
- [ ] `S1` Integrate helper into Pumble, AI chat embeddings, and CSV export
- [ ] `S1` Add helper-level tests for JSON and legacy plain text inputs

### Dependencies

- Stable Plate/Slate node structure assumptions for extraction logic

### Definition of Done

- External integrations no longer receive raw rich-text JSON blobs where plain text is expected.
