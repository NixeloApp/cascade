/**
 * CHECK 6: Undefined Tailwind color classes
 *
 * Detects Tailwind utility classes that reference color names NOT defined
 * in tailwind.config.js. These silently fail — no CSS is generated, but
 * no error is thrown either. Common cause: vendored shadcn/ui components
 * using shadcn naming conventions (bg-background, text-muted-foreground)
 * that don't exist in our semantic color system.
 *
 * @strictness MEDIUM - Reports only. Identifies undefined theme references.
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { c, ROOT, relPath, walkDir } from "./utils.js";

/**
 * Recursively flatten a Tailwind colors object into a Set of valid names.
 * e.g. { palette: { blue: { DEFAULT: "...", bg: "..." } } }
 * → Set(["palette-blue", "palette-blue-bg"])
 */
function extractColorNames(obj, prefix = "") {
  const names = new Set();
  for (const [key, value] of Object.entries(obj)) {
    const name = prefix ? `${prefix}-${key}` : key;
    if (key === "DEFAULT") {
      names.add(prefix);
    } else if (typeof value === "string") {
      names.add(name);
    } else if (typeof value === "object" && value !== null) {
      for (const n of extractColorNames(value, name)) {
        names.add(n);
      }
    }
  }
  return names;
}

/**
 * Non-color utilities that share prefixes with color utilities.
 * These should NOT be flagged as undefined colors.
 */
const NON_COLOR = new Set([
  // text-* (built-in sizes)
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  // text-* (custom font-size tokens from @theme)
  "caption",
  "calendar-weekday",
  "left",
  "center",
  "right",
  "justify",
  "start",
  "end",
  "wrap",
  "nowrap",
  "truncate",
  "ellipsis",
  "clip",
  "balance",
  "pretty",
  // border-*
  "solid",
  "dashed",
  "dotted",
  "double",
  "hidden",
  "none",
  "collapse",
  "separate",
  // bg-*
  "fixed",
  "local",
  "scroll",
  "auto",
  "contain",
  "cover",
  "center",
  "bottom",
  "top",
  "clip",
  "origin",
  "repeat",
  "gradient",
  // ring/outline-*
  "inset",
  // generic
  "transparent",
  "current",
  "inherit",
]);

/** Prefixes for non-color compound utilities (gradients, clips, animation, etc.) */
const NON_COLOR_PREFIXES = [
  "linear-to-", // bg-linear-to-r, bg-linear-to-br (Tailwind v4 gradients)
  "gradient-to-", // bg-gradient-to-r (Tailwind v3 gradients)
  "clip-", // bg-clip-text, bg-clip-border
  "mode-", // fill-mode-both (animation)
  "blend-", // bg-blend-multiply
  "size-", // bg-size-*
  "position-", // bg-position-*
  "repeat-", // bg-repeat-*
  "origin-", // bg-origin-*
  "attachment-", // bg-attachment-*
];

/** Built-in Tailwind color names always valid */
const BUILTIN_COLORS = new Set(["transparent", "current", "inherit", "white", "black"]);

export function run() {
  // Step 1 — Load tailwind config, extract valid color names
  // Config is CJS but project is ESM, so evaluate in a vm sandbox
  const configSource = fs.readFileSync(path.join(ROOT, "tailwind.config.js"), "utf-8");
  const sandbox = {
    require: (mod) => {
      if (mod === "tailwindcss/defaultTheme") {
        return { fontFamily: { sans: ["ui-sans-serif", "system-ui", "sans-serif"] } };
      }
      return {};
    },
    module: { exports: {} },
  };
  vm.createContext(sandbox);
  vm.runInContext(configSource, sandbox);
  const twConfig = sandbox.module.exports;
  const themeColors = twConfig.theme?.extend?.colors ?? {};
  const validColors = extractColorNames(themeColors);
  for (const b of BUILTIN_COLORS) validColors.add(b);

  // Step 2 — Regex to match Tailwind color utility classes
  // Captures: [variants:]<utilityPrefix>-<colorName>[/opacity]
  // colorName must start with a letter, contain only lowercase letters and hyphens,
  // and end with a letter (filters out numeric utilities like border-2, text-2xl).
  const UTILITY_PREFIXES =
    "bg|text|border(?:-[trblxy])?|divide|ring(?:-offset)?|outline|fill|stroke|from|to|via|decoration|placeholder|caret";

  const COLOR_CLASS_RE = new RegExp(
    "(?:^|\\s|[\"'`])" +
      "(?:(?:[a-z][a-z0-9-]*):)*" + // variants (hover:, dark:, etc.)
      "(" +
      UTILITY_PREFIXES +
      ")" +
      "-" +
      "([a-z][a-z-]*[a-z])" + // color name (2+ chars, letter-bounded)
      "(?:\\/\\d+)?" + // optional opacity modifier
      "(?=[\\s\"'`$;,)]|$)",
    "g",
  );

  // Step 3 — Scan source files
  const SRC = path.join(ROOT, "src");
  const EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
  const files = walkDir(SRC, { extensions: EXTS });

  const violations = [];

  for (const filePath of files) {
    const rel = relPath(filePath);
    // Skip config/validation files
    if (rel.includes("tailwind.config") || rel.includes("validate")) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

      for (const match of line.matchAll(COLOR_CLASS_RE)) {
        const colorName = match[2];

        // Skip known non-color utilities
        if (NON_COLOR.has(colorName)) continue;
        if (NON_COLOR_PREFIXES.some((p) => colorName.startsWith(p))) continue;

        // Skip if it's a valid defined color
        if (validColors.has(colorName)) continue;

        // Skip opacity-only variants of valid colors (e.g., "ui-bg-tertiary" from "bg-ui-bg-tertiary/30")
        // The regex might grab a subset — check if any valid color starts with this name
        let isPrefix = false;
        for (const vc of validColors) {
          if (vc.startsWith(`${colorName}-`) || colorName.startsWith(vc)) {
            isPrefix = true;
            break;
          }
        }
        if (isPrefix) continue;

        violations.push({
          file: rel,
          line: i + 1,
          className: match[0].trim(),
          colorName,
        });
      }
    }
  }

  // Step 4 — Format output
  const messages = [];
  if (violations.length > 0) {
    const byFile = {};
    for (const v of violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }
    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset}`);
      const seen = new Set();
      for (const item of items) {
        const key = `${item.line}:${item.className}`;
        if (seen.has(key)) continue;
        seen.add(key);
        messages.push(
          `    ${c.dim}L${String(item.line).padStart(4)}${c.reset}  ${c.red}${item.className}${c.reset}  ${c.dim}(undefined: ${item.colorName})${c.reset}`,
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
        ? `${violations.length} undefined color class(es)`
        : "0 undefined color classes",
    messages,
  };
}
