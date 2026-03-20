/**
 * CHECK: Shared shape drift audit
 *
 * Blocking audit for repeated inline object shapes that should probably be
 * promoted into shared aliases. Focuses on common user/entity summary props.
 */

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const SRC_DIR = path.join(ROOT, "src");
const TARGET_PROPERTY_NAMES = new Set([
  "assignee",
  "assignees",
  "reporter",
  "reporters",
  "owner",
  "owners",
  "user",
  "users",
  "member",
  "members",
  "creator",
  "creators",
  "actor",
  "actors",
  "delegate",
  "delegates",
  "author",
  "authors",
]);

function isIgnoredFile(rel) {
  return (
    rel.startsWith("src/components/ui/") ||
    rel.startsWith("src/lib/") ||
    rel.includes(".test.") ||
    rel.includes(".spec.") ||
    rel.includes(".stories.")
  );
}

function getPropertyName(node) {
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) {
    return node.name.text;
  }
  return null;
}

function getTypeLiteralFromTypeNode(typeNode) {
  if (!typeNode) return null;
  if (ts.isTypeLiteralNode(typeNode)) return typeNode;

  if (ts.isUnionTypeNode(typeNode)) {
    return typeNode.types.find((member) => ts.isTypeLiteralNode(member)) ?? null;
  }

  return null;
}

function normalizeTypeNode(typeNode) {
  return typeNode.getText().replace(/\s+/g, " ").trim();
}

function normalizeTypeLiteral(typeLiteral) {
  const props = [];

  for (const member of typeLiteral.members) {
    if (!ts.isPropertySignature(member) || !member.type || !member.name) continue;
    const name =
      ts.isIdentifier(member.name) || ts.isStringLiteral(member.name) ? member.name.text : null;
    if (!name) continue;
    props.push(`${name}${member.questionToken ? "?" : ""}:${normalizeTypeNode(member.type)}`);
  }

  return props.sort().join(" | ");
}

export function run() {
  const repeatedShapes = new Map();
  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx"]) });

  for (const filePath of files) {
    const rel = relPath(filePath);
    if (isIgnoredFile(rel)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node) {
      if (ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) {
        const propertyName = getPropertyName(node);
        if (propertyName && TARGET_PROPERTY_NAMES.has(propertyName)) {
          const typeLiteral = getTypeLiteralFromTypeNode(node.type);
          if (typeLiteral) {
            const propertyNames = typeLiteral.members
              .filter((member) => ts.isPropertySignature(member) && member.name)
              .map((member) =>
                ts.isIdentifier(member.name) || ts.isStringLiteral(member.name)
                  ? member.name.text
                  : "",
              )
              .filter(Boolean);

            if (propertyNames.includes("_id") && propertyNames.includes("name")) {
              const key = `${propertyName}=>${normalizeTypeLiteral(typeLiteral)}`;
              const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              const instances = repeatedShapes.get(key) ?? [];
              instances.push({
                context: propertyName,
                file: rel,
                line: pos.line + 1,
              });
              repeatedShapes.set(key, instances);
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  const repeated = [...repeatedShapes.entries()]
    .filter(([, instances]) => instances.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  const messages = [];
  if (repeated.length > 0) {
    const totalInstances = repeated.reduce((sum, [, instances]) => sum + instances.length, 0);
    messages.push(
      `${c.yellow}Repeated inline entity summary shapes (${totalInstances} instances across ${repeated.length} repeated shapes):${c.reset}`,
    );
    for (const [key, instances] of repeated.slice(0, 12)) {
      messages.push(`  ${c.dim}${key}${c.reset}`);
      for (const instance of instances.slice(0, 4)) {
        messages.push(`    ${instance.file}:${instance.line}`);
      }
      if (instances.length > 4) {
        messages.push(`    ${c.dim}... ${instances.length - 4} more${c.reset}`);
      }
    }
    if (repeated.length > 12) {
      messages.push(`  ${c.dim}... ${repeated.length - 12} more repeated shape groups${c.reset}`);
    }
  }

  return {
    passed: repeated.length === 0,
    errors: repeated.length,
    detail:
      repeated.length > 0
        ? `${repeated.length} repeated inline shape group(s)`
        : "no repeated inline summary shapes found",
    messages,
  };
}
