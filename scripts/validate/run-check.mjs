const modulePath = process.argv[2];

if (!modulePath) {
  console.error("Missing module path");
  process.exit(1);
}

const module = await import(modulePath);
const result = module.run();

console.log(JSON.stringify(result));
process.exit((result.errors ?? 0) > 0 ? 1 : 0);
