import fs from "node:fs";
import path from "node:path";

function findFiles(dir, pattern) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      results.push(...findFiles(fullPath, pattern));
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const srcComponents = findFiles("src/components", /\.tsx$/);
const noTests = srcComponents
  .filter((f) => !f.includes(".test.") && !f.includes(".jules.test.") && !f.includes(".stories."))
  .filter((f) => {
    const base = f.replace(".tsx", "");
    const hasTest = fs.existsSync(`${base}.test.tsx`) || fs.existsSync(`${base}.jules.test.tsx`);
    return !hasTest;
  })
  .map((f) => {
    const lines = fs.readFileSync(f, "utf8").split("\n").length;
    return { file: f.replace(/^src\//, ""), lines };
  })
  .filter((f) => f.lines > 30) // Only files with significant logic
  .sort((a, b) => b.lines - a.lines)
  .slice(0, 20);

console.log("Top 20 components missing tests (by lines):\n");
for (const f of noTests) {
  console.log(`${f.lines.toString().padStart(4)}  ${f.file}`);
}
console.log("\nTotal:", noTests.length, "high-priority files need tests");
