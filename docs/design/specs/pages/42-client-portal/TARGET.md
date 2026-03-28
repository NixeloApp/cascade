# Client Portal - Target Notes

## Current Improvement Targets

| # | Improvement | Why it matters |
|---|-------------|----------------|
| 1 | Add explicit revoked / expired / invalid token public states | The current empty-project fallback is functional but underspecified for external recipients |
| 2 | Resolve project metadata in the project-detail header instead of echoing raw `projectId` | The current subtitle is technically correct but not polished |
| 3 | Align the UI with the stored portal permission bundle or shrink the bundle | `viewDocuments`, `viewTimeline`, and `addComments` exist in storage but are not yet represented clearly in the public UI |
| 4 | Add dedicated screenshot states for invalid and empty project-detail branches | Those branches are currently test-backed but not visually reviewed in the same way as the happy path |
