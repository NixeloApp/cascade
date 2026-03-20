# Meeting AI Research Notes

This folder uses a simple confidence system so competitor notes stay useful without
pretending every claim is verified.

## Current Refresh

For the latest repo-level view of where the market moved after the older competitor
notes, see:

- [market-refresh-2026-03.md](./market-refresh-2026-03.md)

That refresh covers:

- the shift from "meeting notes" to memory + agents
- updated build-vs-buy implications for capture infrastructure
- current Recall / Meeting BaaS relevance
- open-source components worth testing for ASR and diarization
- what this means for restarting Nixelo's Read AI style feature work

## Labels

- Unlabeled: supported by the local capture set in `docs/research/library/<competitor>/`
- `[inference]`: a deduction from local evidence, but not directly stated by the source
- `[speculation]`: plausible or retained context that is not verified by the current local
  capture set
- `[conflict]`: two local docs or captures disagree, or an older note conflicts with newer
  mirrored evidence

## Writing Rule

Prefer:

1. Claim
2. Evidence in repo
3. Confidence label when needed

Avoid:

- exact pricing if the repo does not contain a mirrored pricing page
- exact implementation/vendor/model claims unless directly supported
- stale scale or funding numbers presented as fact

## Canonical Sources

When competitor docs and comparison docs disagree:

- competitor-specific doc wins over comparison summaries
- mirrored pricing pages win over inherited narrative notes
- comparison docs should summarize, not invent or upgrade certainty
