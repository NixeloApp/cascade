# Tailwind-to-CVA Consolidation

> **Priority:** P2
> **Status:** New
> **Last Updated:** 2026-03-19
> **Depends on:** validator-strengthening.md (validators must block first so this work doesn't regress)

## Problem

The codebase has 148 files with raw Tailwind violations and 48 files with CVA definitions. CVA is the right tool but it's being spammed -- too many one-off CVA recipes that should either be:
- Merged into an existing primitive's variant system
- Consolidated with a nearby CVA that does the same thing
- Not a CVA at all (just a simple component with props)

The pipeline is: **less raw Tailwind -> convert to CVA -> merge CVAs together if they overlap**.

## Current State

| Metric | Count |
|--------|-------|
| Files with raw TW violations | 148 |
| Files with CVA definitions | 48 |
| CVA definitions in `src/components/ui/` | 38+ (correct location) |
| CVA definitions in feature components | 10 (Landing page, PageLayout -- should be consolidated or moved) |
| Typography variants | 30+ (some are one-off, could be merged) |
| Badge variants | 10+ |
| Card variants | 8+ |
| Button variants | 6+ |

## Phase 1: Reduce Raw Tailwind

Target the 148 files with raw TW violations. For each repeated pattern:

- [x] Audit the 30 raw TW violations in `MeetingsWorkspace.tsx` and convert to design system components
- [x] Absorb the repeated meetings list-shell cluster (`list-none`, branded bullet lists) into an owned `List` primitive and swap `MeetingsWorkspace.tsx` to it
- [x] Absorb the meetings status-chip color map into owned `Badge` variants instead of local raw Tailwind state classes
- [x] Absorb the meetings transcript scroll/pre-wrap cluster into owned `ScrollArea` sizing and `Typography` mono-block styling
- [x] Absorb the remaining meetings status-icon tone pair into owned `Icon` semantic tones
- [x] Absorb the mirrored `MeetingRecordingSection.tsx` status-badge cluster into owned `Badge` variants and `Icon` tones
- [x] Absorb the mirrored `MeetingRecordingSection.tsx` results/transcript cluster into owned `List`, `Icon`, `ScrollArea`, and `Typography` contracts
- [x] Absorb the mirrored `MeetingRecordingSection.tsx` state-shell cluster into shared `Card` status recipes and owned `Icon`/layout contracts
- [x] Absorb the mirrored `MeetingRecordingSection.tsx` status-indicator/divider cluster into owned `Icon`, `InlineSpinner`, and `Separator` contracts so the file drops out of the raw-Tailwind baseline
- [x] Absorb the Kanban toolbar selector/toggle icon-size cluster into owned `Icon` and button icon-slot contracts
- [x] Absorb the time-tracking action-icon cluster into owned `Icon` and button icon-slot contracts across billing export, entry-mode toggles, and entry actions
- [x] Absorb the `BillingReport.tsx` summary metric card cluster into an owned helper on top of `Icon`, `Stack`, and metric card recipes
- [x] Absorb the remaining `BillingReport.tsx` team-breakdown and quick-stats shell cluster into owned `Card`, `Stack`, and `Flex` contracts so the file no longer carries inline raw class shells
- [x] Absorb the `WebhookCard.tsx` URL/action-control cluster into owned `Typography`, `Icon`, and layout contracts and ratchet the clean raw-tailwind baseline entries
- [x] Absorb the shared time-entry modal control cluster into owned `SegmentedControl`, `Typography`, `Icon`, and `Select` contracts so `ManualTimeEntryModal.tsx` and `TimeEntryModal.tsx` drop out of the raw-tailwind baseline
- [x] Absorb the settings image-upload preview/action cluster into owned `MediaPreview`, `Avatar`, `Icon`, and button contracts so `AvatarUploadModal.tsx` and `CoverImageUploadModal.tsx` drop out of the raw-tailwind baseline
- [x] Absorb the settings profile shell cluster into owned `Card`, `Grid`, `Avatar`, `MediaPreview`, `Typography`, and `Icon` contracts so `ProfileContent.tsx` drops out of the raw-tailwind baseline
- [x] Absorb the repeated landing max-width wrapper cluster into the owned `ui/Container` primitive across `NavHeader`, `LogoBar`, `AIFeatureDemo`, `FinalCTASection`, `Footer`, and `WhyChooseSection`
- [x] Absorb the repeated left-icon action-control cluster into owned `Button` left-icon and `DropdownMenuItem` icon contracts across filters, notifications, issue actions, document actions, and the issue breadcrumb
- [x] Absorb the repeated `DocumentTree.tsx` chevron-size cluster into owned `Icon` sizing so section toggles and tree expand controls stop carrying local `w-3.5 h-3.5` classes
- [ ] Audit raw TW in route files -- repeated spacing/shell/state patterns should become components or CVA variants
- [ ] Run `node scripts/validate/check-raw-tailwind.js --audit` and group violations by pattern (same class cluster = same missing abstraction)
- [ ] For each cluster of 3+ identical class sets, extract a component or add a CVA variant
- [x] Absorb the repeated route inset panel cluster (`border border-ui-border-secondary/70 bg-ui-bg-soft/90 ...`) into owned `Card` recipes and ratchet the route-cluster baseline
- [x] Absorb the repeated invite fullscreen state shell cluster into a local `InviteStateScreen` abstraction and ratchet the route-cluster baseline
- [x] Absorb the repeated team-detail tab-link cluster into owned `RouteNav` / `RouteNavItem` usage and ratchet the route-cluster baseline to zero

## Phase 2: Consolidate CVA Sprawl

- [ ] Audit 10 feature-component CVA definitions (Landing pages, PageLayout) -- merge into `ui/` primitives or keep if truly feature-specific
- [ ] Typography: audit 30+ variants for overlap -- merge variants that differ only by one property (e.g., `metricLabel` vs `caption` with `uppercase tracking-wider`)
- [ ] Badge: audit 10+ variants for overlap -- some may be duplicating each other with minor differences
- [ ] Card: audit 8+ variants -- ensure no feature-local Card recipes exist that should be a variant
- [ ] Look for CVA definitions in the same file that could be a single CVA with compound variants

## Phase 3: Make It Impossible to Slop

- [ ] Add a validator that flags new CVA definitions outside `src/components/ui/` (feature CVAs should be rare and justified)
- [ ] Add a validator that flags CVA files with >10 variants (sign of sprawl -- should split or rethink)
- [ ] Add a validator that flags raw Tailwind class clusters appearing 3+ times across files (should be a component)
- [ ] Tighten the raw TW validator from advisory to blocking with a ratchet (current baseline: 148 files, fail on increase)

## Anti-patterns to Watch

| Anti-pattern | What to do instead |
|-------------|-------------------|
| Raw `className="flex items-center gap-2 px-3 py-1.5 ..."` repeated 3+ times | Extract a component or add a CVA variant |
| One-off CVA with 2 variants used in 1 file | Just use a component with props, CVA overhead isn't worth it |
| CVA in a feature component that duplicates a `ui/` primitive's variant | Add the variant to the primitive, delete the feature CVA |
| Typography variant for a single use case | Use `className` override on an existing variant, or merge with a similar variant |
| `cva()` with no variants (just a base) | Use `cn()` directly or a simple component |

## Done When

- [ ] Raw TW violation count reduced from 148 to <50 files
- [ ] Feature-component CVAs either justified or merged into `ui/`
- [ ] No CVA definition with 0 variants (just base styles)
- [ ] Validator blocks new raw TW cluster repetition and unjustified feature CVAs
- [ ] Typography/Badge/Card variant counts reviewed and consolidated where overlapping
