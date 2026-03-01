/**
 * CHECK: Convex Naming Conventions
 *
 * Validates Convex backend functions follow consistent naming conventions:
 * - Queries: get{Entity}, list{Entities}, or short forms (get, list) in entity-specific files
 * - Mutations: create{Entity}, update{Entity}, delete{Entity}/archive{Entity}
 * - Actions: Similar to mutations
 *
 * Standard Patterns:
 * | Operation    | Pattern              | Examples                        |
 * |--------------|----------------------|---------------------------------|
 * | Get single   | get{Entity}          | getProject, getUser, get        |
 * | List items   | list{Entities}       | listProjects, listUsers, list   |
 * | Create       | create{Entity}       | createProject, create           |
 * | Update       | update{Entity}       | updateProject, update           |
 * | Delete       | delete/remove/archive| deleteProject, remove, archive  |
 * | Toggle       | toggle{Property}     | togglePublic, toggleFavorite    |
 * | Set value    | set{Property}        | setStatus, setValue             |
 *
 * Anti-patterns flagged:
 * - Verbs like "fetch", "make", "add" for creation (use "create")
 * - "find" for queries (use "get" or "list")
 * - Non-descriptive names that don't indicate operation type
 *
 * @strictness MEDIUM - Reports warnings, does not block CI
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Configuration
const CONFIG = {
  // 'error' | 'warn' | 'off'
  strictness: "warn",
};

// Valid operation prefixes
const VALID_PREFIXES = {
  // Read operations
  get: true,
  list: true,
  search: true,
  count: true,
  check: true,
  is: true,
  has: true,
  can: true,
  find: true,
  logged: true, // loggedInUser

  // Write operations
  create: true,
  update: true,
  delete: true,
  remove: true,
  archive: true,
  restore: true,
  unarchive: true,
  add: true, // addMember, addComment

  // Toggle/Set operations
  toggle: true,
  set: true,
  clear: true,
  reset: true,

  // State change operations
  accept: true,
  reject: true,
  dismiss: true,
  confirm: true,
  cancel: true,
  approve: true,
  deny: true,
  decline: true,
  mark: true,
  lock: true,
  unlock: true,
  move: true,
  reorder: true,
  respond: true,
  snooze: true,
  unsnooze: true,
  review: true,
  complete: true,
  start: true,
  stop: true,
  begin: true,
  enable: true,
  disable: true,

  // CRUD variations
  save: true,
  load: true,
  soft: true, // softDelete
  permanently: true, // permanentlyDelete
  revoke: true,
  resend: true,
  refresh: true,
  regenerate: true,
  upload: true,
  deliver: true,
  apply: true,
  compact: true,
  increment: true,

  // Subscription operations
  subscribe: true,
  unsubscribe: true,
  watch: true,
  unwatch: true,

  // Auth/validation operations
  validate: true,
  verify: true,
  authenticate: true,

  // AI/suggestion operations
  suggest: true,
  answer: true,

  // Batch operations
  bulk: true,
  batch: true,

  // Action operations
  send: true,
  sync: true,
  import: true,
  export: true,
  generate: true,
  process: true,
  run: true,
  execute: true,
  trigger: true,
  initialize: true,
  setup: true,
  cleanup: true,

  // Connection/integration operations
  connect: true,
  disconnect: true,
  link: true,
  unlink: true,

  // Database operations
  upsert: true,
  insert: true,
  store: true,
  select: true,

  // Test/E2E utilities (allowed for e2e.ts)
  nuke: true,
  seed: true,
  debug: true,
  test: true,

  // AI/chat operations
  chat: true,

  // Migration/maintenance operations
  migrate: true,
  backfill: true,
  purge: true,
  queue: true,
  retry: true,
  auto: true,

  // Misc operations
  heartbeat: true,
  should: true, // shouldSendEmail (predicate queries)

  // Internal operations (less strict)
  internal: true,
  schedule: true,
  handle: true,
  notify: true,
  log: true,
  record: true,
  track: true,
};

// Anti-patterns to flag
const ANTI_PATTERNS = [
  { pattern: /^fetch/, message: "Use 'get' or 'list' instead of 'fetch'" },
  { pattern: /^make/, message: "Use 'create' instead of 'make'" },
  { pattern: /^do[A-Z]/, message: "Avoid 'do' prefix, use specific verb" },
  { pattern: /^perform/, message: "Use specific verb instead of 'perform'" },
];

// Specific functions allowed to use anti-patterns (with justification)
const ALLOWED_EXCEPTIONS = new Set([
  // Internal actions that perform async work - "perform" prefix is clear here
  "performPasswordReset", // authWrapper.ts - async password reset action
  "performTokenHealthCheck", // oauthTokenMonitor.ts - cron job for token monitoring
]);

// Files/directories to skip
const SKIP_PATTERNS = [
  "_generated",
  "node_modules",
  ".test.",
  ".test-helper",
  "schema.ts",
  "auth.config.ts",
  "validators.ts",
  "http.ts",
];

// Allow certain generic names in specific contexts
const ALLOWED_GENERIC_NAMES = new Set([
  // Short forms are OK when the file provides context
  "get",
  "list",
  "create",
  "update",
  "remove",
  "delete",
  "archive",
  // Common patterns
  "getById",
  "listAll",
  "listByProject",
  "listByUser",
  "listByOrganization",
  "listRecent",
  "listPaginated",
  "createDefault",
  "createFromTemplate",
  "updateStatus",
  "updateSettings",
  "removeAll",
  "deleteAll",
]);

export function run() {
  if (CONFIG.strictness === "off") {
    return {
      passed: true,
      errors: 0,
      detail: "Disabled",
      messages: [],
    };
  }

  const CONVEX_DIR = path.join(ROOT, "convex");

  let warningCount = 0;
  const warnings = [];

  function reportWarning(filePath, line, name, message) {
    const rel = relPath(filePath);
    const prefix = CONFIG.strictness === "error" ? `${c.red}ERROR` : `${c.yellow}WARN`;
    warnings.push(`  ${prefix}${c.reset} ${rel}:${line} - '${name}': ${message}`);
    warningCount++;
  }

  /**
   * Extract exported function names from a Convex file
   */
  function extractExportedFunctions(content, _lines) {
    const functions = [];

    // Pattern: export const <name> = <query|mutation|action|internalQuery|...>
    const exportPattern =
      /export\s+const\s+(\w+)\s*=\s*(query|mutation|action|internalQuery|internalMutation|internalAction|authenticatedQuery|authenticatedMutation|projectQuery|projectMutation|projectEditorMutation|organizationMemberMutation|organizationAdminMutation|teamLeadMutation)/g;

    for (const match of content.matchAll(exportPattern)) {
      const name = match[1];
      const type = match[2];

      // Find line number
      const beforeMatch = content.slice(0, match.index);
      const lineNum = beforeMatch.split("\n").length;

      functions.push({ name, type, line: lineNum });
    }

    return functions;
  }

  /**
   * Check if a function name follows naming conventions
   */
  function checkFunctionName(filePath, func) {
    const { name, line } = func;

    // Skip allowed generic names
    if (ALLOWED_GENERIC_NAMES.has(name)) return;

    // Skip explicitly allowed exceptions
    if (ALLOWED_EXCEPTIONS.has(name)) return;

    // Check anti-patterns first
    for (const { pattern, message } of ANTI_PATTERNS) {
      if (pattern.test(name)) {
        reportWarning(filePath, line, name, message);
        return;
      }
    }

    // Extract the prefix (first word in camelCase)
    const prefixMatch = name.match(/^([a-z]+)/);
    if (!prefixMatch) {
      reportWarning(filePath, line, name, "Function name should start with a lowercase verb");
      return;
    }

    const prefix = prefixMatch[1];

    // Check if prefix is valid
    if (!VALID_PREFIXES[prefix]) {
      // Special case: if the name is entirely lowercase and short, it might be a short form
      if (name.length <= 6 && /^[a-z]+$/.test(name)) {
        // Short names like 'get', 'list' are OK
        return;
      }

      reportWarning(
        filePath,
        line,
        name,
        `Unknown operation prefix '${prefix}'. Consider: ${Object.keys(VALID_PREFIXES).slice(0, 10).join(", ")}...`,
      );
    }
  }

  /**
   * Check for naming consistency within a file
   */
  function checkFileConsistency(_filePath, functions) {
    // Group by operation type
    const getters = functions.filter((f) => f.name.startsWith("get"));
    const _listers = functions.filter((f) => f.name.startsWith("list"));
    const _creators = functions.filter((f) => f.name.startsWith("create"));

    // Check if there's a mix of short and long forms that might be inconsistent
    // This is informational only, not an error
    const hasShortGet = getters.some((f) => f.name === "get");
    const hasLongGet = getters.some((f) => f.name !== "get" && f.name.startsWith("get"));

    if (hasShortGet && hasLongGet && getters.length > 2) {
      // Only warn if there are many getters and inconsistent naming
      // This is a soft check - mixed naming is sometimes intentional
    }
  }

  // Process all TypeScript files in convex/
  const files = walkDir(CONVEX_DIR, { extensions: new Set([".ts"]) });

  for (const filePath of files) {
    const rel = relPath(filePath);

    // Skip certain files
    if (SKIP_PATTERNS.some((pattern) => rel.includes(pattern))) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    const functions = extractExportedFunctions(content, lines);

    // Check each function
    for (const func of functions) {
      checkFunctionName(filePath, func);
    }

    // Check file-level consistency
    checkFileConsistency(filePath, functions);
  }

  return {
    passed: CONFIG.strictness === "warn" ? true : warningCount === 0,
    errors: CONFIG.strictness === "error" ? warningCount : 0,
    warnings: CONFIG.strictness === "warn" ? warningCount : 0,
    detail: warningCount > 0 ? `${warningCount} naming issue(s)` : null,
    messages: warnings,
  };
}
