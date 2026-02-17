## 2024-05-24 - [Optimize Enrichment with Selective Fetching]
**Learning:** `enrichIssues` helper fetches multiple related entities (users, epics, labels) by default, causing unnecessary DB reads for views that only need partial data.
**Action:** Implement an `options` parameter in enrichment helpers to conditionally skip fetching heavy relations (like epics or labels) when they are not consumed by the frontend, significantly reducing N+1 queries in list views.
