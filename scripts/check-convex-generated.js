import { execFileSync, execSync } from "node:child_process";

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

run("npx", ["convex", "codegen"]);

// Only check for unstaged changes (working tree dirty). Staged changes are
// expected during pre-commit — the files being committed may include generated output.
const generatedStatus = execSync("git diff --name-only convex/_generated/", {
  encoding: "utf8",
}).trim();

if (generatedStatus.length > 0) {
  console.error("❌ Convex generated files are out of date!");
  console.error("Run 'npx convex codegen' locally and commit the changes.");
  execSync("git diff -- convex/_generated/", { stdio: "inherit" });
  process.exit(1);
}

console.log("✅ Convex generated files are up to date");
