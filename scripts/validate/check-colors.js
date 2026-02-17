/**
 * CHECK 2: Color audit
 * Raw TW colors, hardcoded hex, rgb/hsl, style props + allowlists
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC = path.join(ROOT, "src");
  const CONVEX = path.join(ROOT, "convex");

  // Allowlists
  const ALLOWLIST_RAW_TAILWIND = [
    "src/components/Landing/",
    "src/components/Auth/AppSplashScreen.tsx",
    "src/components/AI/AIChat.tsx",
    "src/components/Settings/PumbleIntegration.tsx",
    "*.test.ts",
    "*.test.tsx",
    "src/index.css",
  ];

  const ALLOWLIST_HARDCODED_HEX = [
    "src/components/Auth/GoogleAuthButton.tsx",
    "src/components/ui/ColorPicker.tsx",
    "src/components/ui/ColorPicker.test.tsx",
    "src/index.css",
    "src/components/Landing/",
    "convex/http/",
    "convex/pumble.ts",
    "convex/invites.ts",
    "convex/bookingPages.ts",
    "convex/projectTemplates.ts",
    "convex/onboarding.ts",
    "convex/schema.ts",
    "convex/lib/issueHelpers.ts",
    "src/components/LabelsManager.tsx",
    "src/components/Settings/DevToolsTab.tsx",
    "src/components/AI/config.ts",
    "src/lib/yjs/", // Y.js collaboration cursor colors (dynamic per-user)
    "*.test.ts",
    "*.test.tsx",
    "convex/labels.test.ts",
  ];

  const SEMANTIC_PREFIXES = [
    "palette-",
    "brand-",
    "accent-",
    "ui-bg-",
    "ui-text-",
    "ui-border-",
    "status-success",
    "status-warning",
    "status-error",
    "status-info",
    "priority-",
    "issue-type-",
    "landing-",
    "primary",
    "secondary",
  ];

  const RAW_COLORS = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
    "black",
    "white",
  ];

  const TW_PREFIXES = [
    "bg-",
    "text-",
    "border-",
    "ring-",
    "shadow-",
    "divide-",
    "outline-",
    "fill-",
    "stroke-",
    "from-",
    "to-",
    "via-",
    "decoration-",
    "placeholder-",
    "caret-",
  ];

  const TW_COLOR_RE = new RegExp(
    "(?:(?:hover|focus|active|disabled|group-hover|focus-within|focus-visible|dark|sm|md|lg|xl|2xl|first|last|odd|even|placeholder):)*" +
      "(?:" +
      TW_PREFIXES.map((p) => p.replace("-", "\\-")).join("|") +
      ")" +
      "([a-z]+-\\d{2,3}(?:\\/\\d{1,3})?)",
    "g",
  );

  const HEX_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
  const FUNC_COLOR_RE = /(?:rgba?|hsla?)\s*\([^)]+\)/g;
  const STYLE_PROP_RE =
    /(?:color|backgroundColor|borderColor|background|fill|stroke)\s*:\s*["'][^"']+["']/g;

  const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".scss"]);

  function isAllowed(filePath, allowlist) {
    const normalized = filePath.replace(/\\/g, "/");
    return allowlist.some((pattern) => {
      if (pattern.startsWith("*")) return normalized.endsWith(pattern.slice(1));
      return normalized.includes(pattern);
    });
  }

  // Deprecated patterns that must NOT pass as SEMANTIC
  const DEPRECATED_RE = /^(?:brand|accent)-\d{1,3}(?:\/|$)/; // brand-600, accent-50
  const DEPRECATED_DARK_RE = /-dark(?:\/|$)/; // ui-bg-secondary-dark
  const DEPRECATED_PRIMARY_RE = /^ui-(?:bg|text|border)-primary(?:\/|$)/; // ui-bg-primary

  function classifyTwColor(colorPart) {
    // Check deprecated patterns BEFORE semantic prefix check
    if (DEPRECATED_RE.test(colorPart)) return "DEPRECATED";
    if (DEPRECATED_DARK_RE.test(colorPart)) return "DEPRECATED";
    if (DEPRECATED_PRIMARY_RE.test(colorPart)) return "DEPRECATED";

    for (const prefix of SEMANTIC_PREFIXES) {
      if (colorPart.startsWith(prefix)) return "SEMANTIC";
    }
    for (const raw of RAW_COLORS) {
      if (colorPart.startsWith(`${raw}-`) || colorPart === raw) return "RAW";
    }
    if (
      /^(muted|foreground|background|border|input|ring|card|popover|destructive|accent|primary|secondary)/.test(
        colorPart,
      )
    ) {
      return "SHADCN";
    }
    return "UNKNOWN";
  }

  const findings = [];
  let semanticCount = 0;

  function scan(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const rel = relPath(filePath);

    if (rel.includes("tailwind.config") || rel.includes("calendar-tailwind-classes")) return;
    if (rel.includes("audit-colors") || rel.includes("validate")) return;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmed = line.trim();

      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

      // Tier 1 primitive usage (var(--p-*) in component files — index.css defines them, so skip it)
      if (!rel.endsWith("index.css")) {
        const TIER1_RE = /var\(--p-[a-z]+-\d+\)/g;
        for (const t1Match of line.matchAll(TIER1_RE)) {
          findings.push({
            file: rel,
            line: lineNum,
            category: "TIER1",
            type: "css-var",
            value: t1Match[0],
          });
        }
      }

      // Tailwind color classes
      for (const twMatch of line.matchAll(TW_COLOR_RE)) {
        const category = classifyTwColor(twMatch[1]);
        if (category === "SEMANTIC" || category === "SHADCN" || category === "UNKNOWN") {
          if (category === "SEMANTIC") semanticCount++;
          continue;
        }
        if (category === "RAW" && isAllowed(rel, ALLOWLIST_RAW_TAILWIND)) continue;
        findings.push({ file: rel, line: lineNum, category, type: "tw-class", value: twMatch[0] });
      }

      // Hex colors
      for (const hexMatch of line.matchAll(HEX_RE)) {
        if (trimmed.startsWith("import ")) continue;
        const hex = hexMatch[0].toLowerCase();
        if (hex.length < 4) continue;
        if (isAllowed(rel, ALLOWLIST_HARDCODED_HEX)) continue;
        findings.push({ file: rel, line: lineNum, category: "HARDCODED", type: "hex", value: hex });
      }

      // rgb/rgba/hsl/hsla
      for (const funcMatch of line.matchAll(FUNC_COLOR_RE)) {
        if (isAllowed(rel, ALLOWLIST_HARDCODED_HEX)) continue;
        findings.push({
          file: rel,
          line: lineNum,
          category: "HARDCODED",
          type: "func",
          value: funcMatch[0],
        });
      }

      // Style object color properties
      for (const styleMatch of line.matchAll(STYLE_PROP_RE)) {
        if (isAllowed(rel, ALLOWLIST_HARDCODED_HEX)) continue;
        const styleValue = styleMatch[0].replace(/.*:\s*["']/, "").replace(/["']$/, "");
        if (!/^(#|rgb|hsl|transparent|currentColor|inherit|white|black)/.test(styleValue)) continue;
        findings.push({
          file: rel,
          line: lineNum,
          category: "HARDCODED",
          type: "style-prop",
          value: styleMatch[0],
        });
      }
    }
  }

  const dirs = [SRC];
  if (fs.existsSync(CONVEX)) dirs.push(CONVEX);
  const files = dirs.flatMap((d) => walkDir(d, { extensions: EXTS }));
  for (const f of files) scan(f);

  const violations = findings.filter(
    (f) =>
      f.category === "RAW" ||
      f.category === "HARDCODED" ||
      f.category === "DEPRECATED" ||
      f.category === "TIER1",
  );

  const messages = [];
  if (violations.length > 0) {
    const byFile = {};
    for (const f of violations) {
      if (!byFile[f.file]) byFile[f.file] = [];
      byFile[f.file].push(f);
    }
    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset}`);
      const seen = new Set();
      for (const item of items) {
        const key = `${item.line}:${item.value}`;
        if (seen.has(key)) continue;
        seen.add(key);
        messages.push(
          `    ${c.dim}L${String(item.line).padStart(4)}${c.reset}  ${c.red}${item.value}${c.reset}`,
        );
      }
    }
  }

  return {
    passed: violations.length === 0,
    errors: violations.length,
    warnings: 0,
    detail:
      violations.length > 0
        ? `${violations.length} violation(s)`
        : `${semanticCount} semantic, 0 violations`,
    messages,
  };
}
