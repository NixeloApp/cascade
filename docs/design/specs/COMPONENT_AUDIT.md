# Component Audit - Slop Pattern Analysis

> **Date**: 2026-02-14
> **Status**: Analysis complete

---

## Executive Summary

The codebase is **generally clean**. The validation system (`node scripts/validate.js`) catches most issues. The patterns below are minor polish items, not blockers.

---

## Pattern Analysis

### 1. Card/Shadow Usage

**Files with `card-subtle` or `shadow-lg`:**

| File | Usage | Verdict |
|------|-------|---------|
| `SprintManager.tsx:43,204` | Sprint cards | 🟡 See spec 18-sprints |
| `UnsubscribePage.tsx:54` | Page container | 🔴 Should use AuthPageLayout |
| `ProjectsList.tsx:71` | Project cards | ✅ OK - cards make sense |
| `IssueDetailLayout.tsx:29` | Issue panel | ✅ OK - detail view needs containment |
| `MentionInput.tsx:186` | Dropdown | ✅ OK - dropdowns need shadow |
| `NavHeader.tsx:83,91` | CTA buttons | ✅ OK - intentional button glow |
| `EmailVerificationRequired.tsx:62` | Page container | 🔴 Should use AuthPageLayout |

**Action Items:**
- [ ] Refactor `UnsubscribePage.tsx` to use `AuthPageLayout` (spec exists)
- [ ] Refactor `EmailVerificationRequired.tsx` to use `AuthPageLayout`

---

### 2. Template-Speak Headings

**Found patterns:**

| File | Text | Verdict |
|------|------|---------|
| `MemberOnboarding.tsx:160` | "You're All Set!" | 🟡 Minor - acceptable in onboarding context |
| `WelcomeTour.tsx:127,129` | "Ready to Get Started?" | 🟡 Minor - onboarding context |
| `EmptyState.stories.tsx` | Various "get started" | ✅ OK - storybook examples |
| `LeadOnboarding.tsx:247` | "How would you like to get started?" | ✅ OK - question form is fine |

**Action Items:**
- Consider changing "You're All Set!" to something more confident like "You're ready" or just skip the celebratory text

---

### 3. "Back to X" Links

**Found patterns:**

| File | Text | Verdict |
|------|------|---------|
| `issues/$key.tsx:39` | "Back to dashboard" | 🟡 Contextual - could use breadcrumbs instead |
| `CreateProjectFromTemplate.tsx:315` | "Back to Templates" | ✅ OK - wizard navigation |
| `ForgotPasswordForm.tsx:57` | "Back to sign in" | ✅ OK - form navigation |

**Verdict:** These are acceptable navigation patterns, not patronizing "escape" links.

---

### 4. Verbose Helper Text

Searched for excessive explanatory text - **none found**. The validation system catches this.

---

### 5. Emoji Icons

Searched for emoji usage in UI - **none found in production code**. The `check-emoji-usage.js` validator handles this.

---

### 6. Raw HTML Elements

The validator catches raw `<input>`, `<label>`, etc. Currently passing.

**Known exceptions (need cleanup):**
- `CreateEventModal.tsx` - Uses raw inputs instead of Input component (see modal spec)

---

## Components Needing Updates

### Priority 1 (Auth Flow)

| Component | Issue | Fix |
|-----------|-------|-----|
| `UnsubscribePage.tsx` | Card wrapper, not using AuthPageLayout | Refactor per spec |
| `EmailVerificationRequired.tsx` | Card wrapper | Refactor to use AuthPageLayout |

### Priority 2 (Modals)

| Component | Issue | Fix |
|-----------|-------|-----|
| `CreateEventModal.tsx` | Raw inputs, missing DialogDescription | Use Input component |

### Priority 3 (Minor Polish)

| Component | Issue | Fix |
|-----------|-------|-----|
| `MemberOnboarding.tsx` | "You're All Set!" heading | Consider rewording |
| `SprintManager.tsx` | Time-based progress | Change to issue-based (see spec) |

---

## Components That Are Good ✅

These components follow best practices:

- `CreateIssueModal.tsx` - Proper Dialog usage, form validation, AI integration
- `CommandPalette.tsx` - Clean cmdk implementation, grouped commands
- `LeadOnboarding.tsx` / `MemberOnboarding.tsx` - Good flow, escape hatches
- `ProjectSettings/*.tsx` - Proper form patterns
- `Calendar/*.tsx` (except CreateEventModal) - Clean implementations
- `Dashboard/*.tsx` - Proper card usage with hover states
- `ui/*.tsx` - Component library is solid

---

## Validation Status

All automated checks pass:

```
[1/10] Standards (AST)............... PASS
[2/10] Color audit................... PASS
[3/10] API calls..................... PASS
[4/10] Query issues.................. PASS
[5/10] Arbitrary Tailwind............ PASS
[6/10] Type consistency.............. PASS
[7/10] Type safety................... PASS
[8/10] Emoji usage................... PASS
[9/10] Test ID constants............. PASS
[10/10] E2E quality................... PASS

RESULT: PASS (0 errors)
```

---

## Recommendations

### Immediate Actions
1. Refactor `UnsubscribePage.tsx` - spec already exists
2. Refactor `EmailVerificationRequired.tsx` - similar pattern

### Near-Term
1. Fix `CreateEventModal.tsx` raw inputs
2. Update sprint progress to issue-based

### Nice-to-Have
1. Consider breadcrumbs instead of "Back to X" links
2. Review template-speak in onboarding (minor)

---

## Conclusion

The codebase is **clean**. The validation system does its job. The main issues are:
- 2 auth-related pages not using `AuthPageLayout`
- 1 modal with raw inputs
- Sprint progress calculation (functional but misleading)

These are all documented in their respective specs with implementation plans.
