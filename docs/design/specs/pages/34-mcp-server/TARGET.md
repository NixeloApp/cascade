# MCP Server Page - Target State

> **Route**: `/:slug/mcp-server`
> **Goal**: Configure an MCP server so external AI clients can access workspace data

---

## Planned Improvements

| # | Improvement | Notes |
|---|-------------|-------|
| 1 | Server endpoint display | Show the MCP server URL and connection status |
| 2 | API key / token management | Generate, rotate, and revoke access tokens for MCP clients |
| 3 | Scope configuration | Select which data (documents, issues, projects) the MCP server exposes |
| 4 | Activity log | Show recent MCP client connections and queries |
| 5 | Admin-only access | Only workspace admins should be able to configure the MCP server |

---

## Not Planned

- Hosting a full MCP server from the frontend -- the server itself runs as a separate service;
  this page only manages its configuration.
- Per-user MCP tokens -- tokens are workspace-scoped.

---

## Acceptance Criteria

- [ ] Page displays the MCP server endpoint URL and connection status (connected/disconnected).
- [ ] Admins can generate and revoke API tokens.
- [ ] Data scope selector lets admins choose which entity types are exposed.
- [ ] Activity log shows the last N MCP client requests with timestamps.
- [ ] Non-admin users see a read-only view or an appropriate access-denied state.
- [ ] Page loads without layout shift (skeleton states while data fetches).
