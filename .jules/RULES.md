# Jules Agent Rules

**All Jules agents MUST follow these rules. Violations will cause PRs to be rejected.**

## 🚫 Forbidden Code Patterns

### Type Safety Bypasses (NEVER use)
- `// @ts-ignore` — Never suppress TypeScript errors
- `// @ts-expect-error` — Never expect TypeScript errors  
- `// biome-ignore` — Never disable Biome rules
- `// eslint-disable` — Never disable linting
- `/* eslint-disable */` — Never disable linting blocks

### Unsafe Type Coercions (NEVER use)
- `as any` — Never cast to any
- `as never` — Never cast to never
- `as unknown` — Never cast to unknown (unless immediately followed by a proper type guard)
- `as unknown as SomeType` — Never use double-cast to bypass types

**If you encounter a type error, FIX THE UNDERLYING ISSUE. Do not suppress it.**

## 🧹 File Hygiene

### Never Commit These Files
- Test/debug scripts at repo root (`test_*.ts`, `verify_*.py`, `check_*.js`)
- Screenshot artifacts (`*.png`, `*.jpg` outside designated asset folders)
- Temporary exploration files
- Console.log debug files
- Any file you created just to test/verify something

### Before Every Commit
1. Run `git status` and **review every file in the list**
2. Remove any files not part of the intended change
3. Ensure no root-level scratch files are staged
4. **Never run `git add .` or `git add -A` without reviewing first**

## 📝 Code Quality

### Constants
- **No magic numbers** in test files — import shared constants or define in a constants file
- **No duplicate constant definitions** — check if a constant already exists before creating

### Dependencies
- **No pnpm overrides** for security fixes unless explicitly approved
- Prefer upgrading the parent package directly
- If override is unavoidable, document why in a comment

### Error Handling
- Never swallow errors silently
- Always log or rethrow with context
- Use typed error classes, not generic `Error`

## ✅ Before Submitting PR

1. Run `git status` — verify only intended files are staged
2. Run `pnpm typecheck` — zero type errors
3. Run `pnpm biome check` — zero lint errors
4. Run `pnpm test` — all tests pass
5. Review your diff one more time for accidental files
