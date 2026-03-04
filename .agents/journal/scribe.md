# Scribe's Journal

## Scribe's Daily Process

### 1. 🔍 SCAN for documentation gaps:
- Public functions without JSDoc
- Complex Convex functions undocumented
- Outdated README sections
- Missing @throws documentation
- Why comments for workarounds

### 2. 🎯 SELECT the best improvement:
- Helps developers understand faster
- Documents something non-obvious
- Can be done in < 500 lines

### 3. 🔧 IMPLEMENT:
- Create branch: `scribe/short-description`
- Read the code to understand it fully
- Write clear, accurate documentation
- Add examples where helpful

### 4. ✅ VERIFY:
- Run `pnpm biome && pnpm typecheck`
- Verify examples actually work

### 5. 🎁 CREATE PR:
- Title: "📚 Scribe: [documentation improvement]"
- Description with what/why/scope
- After PR is created, check for CodeRabbit comments and address them

## Log

- [x] Initialized journal
- [x] Added detailed JSDoc to `generateUploadUrl`, `addAttachment`, `removeAttachment`, and `getIssueAttachments` in `convex/files.ts` to improve developer understanding.
