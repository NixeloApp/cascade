# Phase 4: Docs Sync

> **Goal**: Design docs accurate, TODOs extracted and executed
> **Acceptance**: All high-priority TODOs completed

---

## Overview

With visual polish complete (Phases 1-3), we ensure:

1. **Docs Accuracy** - Specs match actual implementation
2. **TODO Extraction** - Find all unchecked items
3. **TODO Execution** - Complete or delegate each item
4. **Pattern Documentation** - New discoveries captured

---

## Task 1: Audit Design Standards

### File: `docs/design/STANDARDS.md`

Review each section and update status:

#### Section 1: Design Tokens
| Item | Implemented? | Notes |
|------|--------------|-------|
| Update dark mode background | | |
| Add opacity-based borders | | |
| Add animation keyframes | | |
| Update font config | | |

#### Section 8: Implementation Phases
| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | | |
| Phase 2: Core Components | | |
| Phase 3: Auth Flow | | |
| Phase 4: Dashboard & App | | |
| Phase 5: Micro-interactions | | |

### Update Actions
- [ ] Mark completed items with `[x]`
- [ ] Add completion dates
- [ ] Note any deviations from plan
- [ ] Remove obsolete items

---

## Task 2: Audit Design README

### File: `docs/design/README.md`

#### Update Status Tables

Core Docs:
| File | Status in Doc | Actual Status |
|------|---------------|---------------|
| `STANDARDS.md` | | |
| `PATTERNS.md` | | |
| `REFERENCE.md` | | |
| `GAPS.md` | | |

Page Specs (in `specs/pages/`):
| File | Status in Doc | Actual Status |
|------|---------------|---------------|
| `01-landing/` | | |
| `02-signin/` | | |
| ... | | |

Component Specs (in `specs/components/`):
| File | Status in Doc | Actual Status |
|------|---------------|---------------|

### Update Actions
- [ ] Verify all status badges accurate
- [ ] Update "Last Updated" dates
- [ ] Add any missing entries
- [ ] Remove obsolete references

---

## Task 3: Audit Page Specs

### Files: `docs/design/specs/pages/*/`

For each page spec:

#### Check Current State Section
- [ ] Screenshot paths correct?
- [ ] Issues list still accurate?
- [ ] Component inventory current?

#### Check Implementation Checklist
- [ ] Which items completed?
- [ ] Which items still TODO?
- [ ] Any new items needed?

### Page Audit Table

| Page | Spec Accurate? | TODOs Remaining | Priority |
|------|----------------|-----------------|----------|
| 01-landing.md | | | |
| 02-signin.md | | | |
| 03-signup.md | | | |
| 04-dashboard.md | | | |
| 05-projects.md | | | |
| 06-board.md | | | |
| 07-backlog.md | | | |
| 08-issue.md | | | |
| 09-documents.md | | | |
| 10-editor.md | | | |
| 11-calendar.md | | | |
| 12-settings.md | | | |
| 13-analytics.md | | | |

---

## Task 4: Audit Component Specs

### Files: `docs/design/specs/components/*.md`

For each component spec:

#### Check Props/API Section
- [ ] Matches actual component props?
- [ ] All variants documented?
- [ ] Default values correct?

#### Check Code Examples
- [ ] Import paths correct?
- [ ] API usage current?
- [ ] Deprecated patterns removed?

### Component Audit Table

| Component | Spec Accurate? | Code Examples Work? | Issues |
|-----------|----------------|---------------------|--------|
| button.md | | | |
| card.md | | | |
| input.md | | | |
| dialog.md | | | |
| dropdown.md | | | |
| tooltip.md | | | |
| badge.md | | | |
| avatar.md | | | |
| navigation.md | | | |
| sidebar.md | | | |
| table.md | | | |
| empty-state.md | | | |
| loading.md | | | |

---

## Task 5: Extract All TODOs

### Collection Method

Search all design docs for unchecked items:

```bash
# Find all unchecked checkboxes
grep -r "\[ \]" docs/design/ --include="*.md"

# Find TODO comments
grep -r "TODO" docs/design/ --include="*.md"

# Find TBD markers
grep -r "TBD" docs/design/ --include="*.md"
```

### TODO Master List

Collect all TODOs into prioritized list:

#### P0 - Critical (Do Now)
| Source File | TODO | Effort |
|-------------|------|--------|
| | | |

#### P1 - High (This Sprint)
| Source File | TODO | Effort |
|-------------|------|--------|
| | | |

#### P2 - Medium (Backlog)
| Source File | TODO | Effort |
|-------------|------|--------|
| | | |

#### P3 - Low (Nice to Have)
| Source File | TODO | Effort |
|-------------|------|--------|
| | | |

---

## Task 6: Execute TODOs

### Execution Strategy

For each TODO:

1. **Assess**: Is it still relevant?
2. **Estimate**: Small/Medium/Large effort?
3. **Execute or Delegate**:
   - Small: Fix immediately
   - Medium: Create task, execute
   - Large: Spawn subagent

### Execution Log

| TODO | Decision | Outcome | Date |
|------|----------|---------|------|
| | | | |

---

## Task 7: Document New Patterns

### Patterns Discovered

During Phases 1-3, document any new patterns:

#### New Color Tokens Added
| Token | Value | Purpose |
|-------|-------|---------|
| | | |

#### New Components Created
| Component | Purpose | Notes |
|-----------|---------|-------|
| | | |

#### New Animation Patterns
| Animation | Usage | Notes |
|-----------|-------|-------|
| | | |

### Update Relevant Docs
- [ ] Add new tokens to `tokens/*.md`
- [ ] Add new components to `components/*.md`
- [ ] Update `MASTER_PLAN.md` with new patterns

---

## Subagent Review Protocol

### Docs Accuracy Review

```
Review all files in docs/design/

For each file:
1. Compare documented state vs actual implementation
2. Check if code examples still work
3. Identify outdated sections
4. Find unchecked TODOs

Return:
- Accuracy score per file
- List of outdated sections
- Collected TODOs with priorities
```

### Acceptance Criteria

| Check | Required |
|-------|----------|
| All completed items marked | Yes |
| All code examples verified | Yes |
| All TODOs extracted | Yes |
| P0 TODOs executed | Yes |
| P1 TODOs logged | Yes |

---

## Completion Gate

Before marking protocol complete:

- [ ] STANDARDS.md reflects actual progress
- [ ] README.md status table accurate
- [ ] All page specs have current screenshot refs
- [ ] All component specs match implementation
- [ ] All P0 TODOs executed
- [ ] All P1 TODOs logged in TODO.md
- [ ] New patterns documented

---

## Related Files

### Design Docs
- `docs/design/STANDARDS.md`
- `docs/design/README.md`
- `docs/design/PATTERNS.md`
- `docs/design/specs/pages/`
- `docs/design/specs/components/`

### Project TODOs
- `TODO.md` - Active feature TODOs (points to `/todos/`)
- `todos/README.md` - Roadmap and recursive improvement phases

### Implementation
- `src/components/ui/` - Component source
- `src/index.css` - Design tokens
- `src/routes/` - Page implementations

---

*Phase 4 completes the Design Perfection Protocol. Iterate if any phase dropped below threshold.*
