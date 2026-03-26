import { execFileSync, execSync } from "node:child_process";

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

run("npx", ["convex", "codegen"]);

const generatedStatus = execSync("git status --porcelain convex/_generated/", {
  encoding: "utf8",
}).trim();

if (generatedStatus.length > 0) {
  console.error("❌ Convex generated files are out of date!");
  console.error("Run 'npx convex codegen' locally and commit the changes.");
  execSync("git diff -- convex/_generated/", { stdio: "inherit" });
  process.exit(1);
}

console.log("✅ Convex generated files are up to date");
